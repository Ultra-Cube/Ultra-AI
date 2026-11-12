'use client';

import { useEffect, useState } from 'react';

/**
 * Hermes — in-app monitoring page.
 *
 * Gives operators a native view of the observability stack without leaving the
 * platform: stack reachability, headline metrics (request/error rate, p95
 * latency, targets up), and active alerts — with a one-click jump to the full
 * Grafana dashboards. Polls /api/hermes/overview every 10s and degrades
 * gracefully when the (optional) Hermes stack is offline.
 */

type Overview = {
  generatedAt: string;
  reachable: boolean;
  stack: {
    prometheus: { up: boolean; url: string };
    grafana: { up: boolean; url: string };
    alertmanager: { up: boolean; url: string };
  };
  source?: 'prometheus' | 'api-direct' | 'none';
  metrics: {
    requestRate: number | null;
    errorRate: number | null;
    p95LatencySeconds: number | null;
    targetsUp?: number | null;
    totalRequests?: number | null;
    memoryMB?: number | null;
    uptimeSeconds?: number | null;
  };
  alerts: Array<{
    name: string;
    severity: string;
    summary: string;
    startsAt: string | null;
  }>;
};

function fmtUptime(s: number | null | undefined): string {
  if (s == null) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const GRAFANA_URL = 'http://localhost:3001';

function fmt(n: number | null, digits = 2, suffix = ''): string {
  if (n === null || Number.isNaN(n)) return '—';
  return `${n.toFixed(digits)}${suffix}`;
}

export default function HermesPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/hermes/overview', { cache: 'no-store' });
        const json = (await res.json()) as Overview;
        if (active) setData(json);
      } catch {
        /* keep last good data */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const stackEntries = data
    ? [
        { key: 'prometheus', label: 'Prometheus', ...data.stack.prometheus },
        { key: 'grafana', label: 'Grafana', ...data.stack.grafana },
        { key: 'alertmanager', label: 'Alertmanager', ...data.stack.alertmanager },
      ]
    : [];

  return (
    <div className="hermes-page">
      <div className="hermes-header">
        <div>
          <p className="kicker">📡 Monitoring</p>
          <h1>Hermes Observability</h1>
          <p className="muted">
            Live view of the Prometheus · Grafana · Alertmanager stack that
            scrapes the Ultra-AI platform.
          </p>
        </div>
        <a
          className="hermes-grafana-btn"
          href={GRAFANA_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open Grafana Dashboards ↗
        </a>
      </div>

      {!loading && data && !data.reachable && (
        <div className="hermes-offline card">
          <strong>Monitoring stack is offline.</strong>
          <p className="muted">
            Hermes is an optional layer. Start it with{' '}
            <code>./infrastructure/automation/ultra-stack.sh up --with-hermes</code> (or{' '}
            <code>cd infrastructure/monitoring/stack/hermes &amp;&amp; ./start-hermes.sh up</code>).
            This page will populate automatically once Prometheus is reachable.
          </p>
        </div>
      )}

      {/* Stack reachability */}
      <section className="hermes-stack">
        {stackEntries.map((s) => (
          <div key={s.key} className={`hermes-stack-card ${s.up ? 'up' : 'down'}`}>
            <span className="dot" />
            <div>
              <strong>{s.label}</strong>
              <p className="muted">{s.up ? 'reachable' : 'unreachable'}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Data-source badge — honest about where the numbers come from */}
      {data?.source && data.source !== 'none' && (
        <p className="hermes-source">
          {data.source === 'prometheus'
            ? '● Live from Prometheus'
            : '● Live — parsed directly from the API /metrics endpoint'}
        </p>
      )}

      {/* Headline metrics (real, live) */}
      <section className="hermes-metrics">
        <div className="metric-card">
          <span className="metric-label">
            {data?.source === 'prometheus' ? 'Request Rate' : 'Total Requests'}
          </span>
          <strong>
            {data?.source === 'prometheus'
              ? fmt(data?.metrics.requestRate ?? null, 2, ' /s')
              : fmt(data?.metrics.totalRequests ?? null, 0)}
          </strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Error Rate</span>
          <strong className={(data?.metrics.errorRate ?? 0) > 0 ? 'metric-warn' : undefined}>
            {data?.metrics.errorRate != null
              ? fmt(data.metrics.errorRate * 100, 2, '%')
              : '—'}
          </strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Latency</span>
          <strong>
            {data?.metrics.p95LatencySeconds != null
              ? fmt(data.metrics.p95LatencySeconds * 1000, 0, ' ms')
              : '—'}
          </strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">
            {data?.metrics.uptimeSeconds != null ? 'API Uptime' : 'Scrape Targets'}
          </span>
          <strong>
            {data?.metrics.uptimeSeconds != null
              ? fmtUptime(data.metrics.uptimeSeconds)
              : fmt(data?.metrics.targetsUp ?? null, 0)}
          </strong>
        </div>
      </section>

      {/* Active alerts */}
      <section className="hermes-alerts card">
        <h2>Active Alerts</h2>
        {!data || data.alerts.length === 0 ? (
          <p className="muted">
            {data?.stack.alertmanager.up
              ? 'No active alerts. All clear.'
              : 'Alertmanager not reachable.'}
          </p>
        ) : (
          <ul className="alert-list">
            {data.alerts.map((a, i) => (
              <li key={`${a.name}-${i}`} className={`alert-row sev-${a.severity}`}>
                <span className="alert-sev">{a.severity}</span>
                <div>
                  <strong>{a.name}</strong>
                  {a.summary && <p className="muted">{a.summary}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data && (
        <p className="muted hermes-ts">
          Updated {new Date(data.generatedAt).toLocaleTimeString()} · auto-refresh 10s
        </p>
      )}
    </div>
  );
}
