import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Hermes monitoring overview endpoint.
 *
 * Aggregates the data the in-app Hermes UI needs into one call:
 *  - whether Prometheus / Grafana / Alertmanager are reachable
 *  - active alerts (from Alertmanager if up)
 *  - a small set of headline metrics queried from Prometheus if up
 *
 * Everything degrades gracefully: if the Hermes stack isn't running (it is an
 * optional `./infrastructure/automation/ultra-stack.sh up --with-hermes` layer), the route still
 * returns a well-formed payload with reachable=false so the UI can render an
 * informative "monitoring stack is offline" state instead of erroring.
 */

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://127.0.0.1:3001';
const ALERTMANAGER_URL = process.env.ALERTMANAGER_URL || 'http://127.0.0.1:9093';

async function reachable(url: string, path: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}${path}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    return res.status === 200 || res.status === 302 || res.status === 401;
  } catch {
    return false;
  }
}

type PromResult = { metric: Record<string, string>; value: [number, string] };

async function promQuery(query: string): Promise<PromResult[] | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
      { signal: controller.signal, cache: 'no-store' }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.result ?? null;
  } catch {
    return null;
  }
}

async function activeAlerts(up: boolean) {
  if (!up) return [];
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${ALERTMANAGER_URL}/api/v2/alerts?active=true`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const alerts = await res.json();
    return (Array.isArray(alerts) ? alerts : []).map((a: Record<string, unknown>) => {
      const labels = (a.labels ?? {}) as Record<string, string>;
      const annotations = (a.annotations ?? {}) as Record<string, string>;
      return {
        name: labels.alertname ?? 'unknown',
        severity: labels.severity ?? 'none',
        summary: annotations.summary ?? annotations.description ?? '',
        startsAt: (a.startsAt as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}

const API_URL = process.env.API_URL || 'http://localhost:4000';

/**
 * Direct fallback: scrape and parse the API's own Prometheus exposition at
 * /metrics. This makes the Hermes page show LIVE data even when the optional
 * Prometheus/Grafana containers aren't running (e.g. no Docker on the host) —
 * the API emits the same metrics Prometheus would scrape, so we compute the
 * headline numbers client-side from the raw exposition.
 */
async function metricsFromApi(): Promise<{
  requestRate: number | null;
  errorRate: number | null;
  p95LatencySeconds: number | null;
  totalRequests: number | null;
  memoryMB: number | null;
  uptimeSeconds: number | null;
} | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_URL}/metrics`, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return null;
    const text = await res.text();

    const sumMatching = (metric: string, filter?: (line: string) => boolean): number => {
      let total = 0;
      for (const line of text.split('\n')) {
        if (line.startsWith('#') || !line.startsWith(metric)) continue;
        if (filter && !filter(line)) continue;
        const val = Number(line.trim().split(/\s+/).pop());
        if (Number.isFinite(val)) total += val;
      }
      return total;
    };
    const firstGauge = (metric: string): number | null => {
      for (const line of text.split('\n')) {
        if (line.startsWith('#') || !line.startsWith(metric)) continue;
        const val = Number(line.trim().split(/\s+/).pop());
        if (Number.isFinite(val)) return val;
      }
      return null;
    };

    // Prefer the dedicated counter; fall back to histogram counts.
    let totalRequests = sumMatching('http_requests_total');
    if (totalRequests === 0) totalRequests = sumMatching('http_request_duration_seconds_count');
    const errorRequests =
      sumMatching('http_requests_total', (l) => /status(_code)?="5\d\d"/.test(l)) ||
      sumMatching('http_request_duration_seconds_count', (l) => /status(_code)?="5\d\d"/.test(l));

    // Mean latency from histogram sum/count — a solid headline without
    // Prometheus' rate() windows. True p95 appears once Prometheus runs.
    const durSum = sumMatching('http_request_duration_seconds_sum');
    const durCount = sumMatching('http_request_duration_seconds_count');
    const meanLatency = durCount > 0 ? durSum / durCount : null;

    const memBytes = firstGauge('process_memory_usage_bytes');
    const uptime = firstGauge('process_uptime_seconds');

    return {
      requestRate: null, // needs a time window; total is shown instead
      errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
      p95LatencySeconds: meanLatency,
      totalRequests,
      memoryMB: memBytes != null && memBytes > 0 ? Math.round(memBytes / 1048576) : null,
      uptimeSeconds: uptime != null && uptime > 0 ? Math.floor(uptime) : null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const [promUp, grafanaUp, alertUp] = await Promise.all([
    reachable(PROMETHEUS_URL, '/-/healthy'),
    reachable(GRAFANA_URL, '/api/health'),
    reachable(ALERTMANAGER_URL, '/-/healthy'),
  ]);

  const firstValue = (r: PromResult[] | null): number | null => {
    if (!r || r.length === 0) return null;
    const v = Number(r[0].value?.[1]);
    return Number.isFinite(v) ? v : null;
  };

  let source: 'prometheus' | 'api-direct' | 'none' = 'none';
  let metrics: Record<string, number | null> = {
    requestRate: null,
    errorRate: null,
    p95LatencySeconds: null,
    totalRequests: null,
    memoryMB: null,
    uptimeSeconds: null,
  };

  if (promUp) {
    const [reqRate, errRate, p95, targetsUp] = await Promise.all([
      promQuery('sum(rate(http_requests_total[5m]))'),
      promQuery('sum(rate(http_requests_total{status=~"5.."}[5m]))'),
      promQuery('histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'),
      promQuery('sum(up)'),
    ]);
    source = 'prometheus';
    metrics = {
      requestRate: firstValue(reqRate),
      errorRate: firstValue(errRate),
      p95LatencySeconds: firstValue(p95),
      totalRequests: null,
      memoryMB: null,
      uptimeSeconds: null,
      targetsUp: firstValue(targetsUp),
    };
  } else {
    // No Prometheus — read live numbers straight from the API's /metrics.
    const direct = await metricsFromApi();
    if (direct) {
      source = 'api-direct';
      metrics = { ...direct };
    }
  }

  const alerts = await activeAlerts(alertUp);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source,
    stack: {
      prometheus: { up: promUp, url: PROMETHEUS_URL },
      grafana: { up: grafanaUp, url: GRAFANA_URL },
      alertmanager: { up: alertUp, url: ALERTMANAGER_URL },
    },
    // Live when either Prometheus is up OR we parsed the API directly.
    reachable: promUp || grafanaUp || alertUp || source === 'api-direct',
    metrics,
    alerts,
  });
}
