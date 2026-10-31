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
 * optional `./scripts/ultra-stack.sh up --with-hermes` layer), the route still
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

export async function GET() {
  const [promUp, grafanaUp, alertUp] = await Promise.all([
    reachable(PROMETHEUS_URL, '/-/healthy'),
    reachable(GRAFANA_URL, '/api/health'),
    reachable(ALERTMANAGER_URL, '/-/healthy'),
  ]);

  // Headline metrics — these mirror the "Ultra-AI Overview" Grafana dashboard.
  // Returns null per-metric when Prometheus is down or the series is absent.
  const [reqRate, errRate, p95, targetsUp] = promUp
    ? await Promise.all([
        promQuery('sum(rate(http_requests_total[5m]))'),
        promQuery('sum(rate(http_requests_total{status=~"5.."}[5m]))'),
        promQuery(
          'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
        ),
        promQuery('sum(up)'),
      ])
    : [null, null, null, null];

  const firstValue = (r: PromResult[] | null): number | null => {
    if (!r || r.length === 0) return null;
    const v = Number(r[0].value?.[1]);
    return Number.isFinite(v) ? v : null;
  };

  const alerts = await activeAlerts(alertUp);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    stack: {
      prometheus: { up: promUp, url: PROMETHEUS_URL },
      grafana: { up: grafanaUp, url: GRAFANA_URL },
      alertmanager: { up: alertUp, url: ALERTMANAGER_URL },
    },
    reachable: promUp || grafanaUp || alertUp,
    metrics: {
      requestRate: firstValue(reqRate),
      errorRate: firstValue(errRate),
      p95LatencySeconds: firstValue(p95),
      targetsUp: firstValue(targetsUp),
    },
    alerts,
  });
}
