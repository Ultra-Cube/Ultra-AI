// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Hermes — Ultra-AI command dashboard.
 *
 * The primary operator surface of the platform: Hermes runtime status, the
 * Prometheus · Grafana · Alertmanager observability stack, headline metrics,
 * and active alerts — plus quick access to the agent chat, the external-apps
 * control layer, and the rest of the Ultra-AI portals. Polls
 * /api/hermes/overview every 10s and degrades gracefully when the (optional)
 * Hermes stack is offline.
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

type AppStatus = { id: string; name: string; online?: boolean };

type AgentTeam = {
  id: string;
  displayName: string;
  role: string;
  trigger: string;
  deliverable: string;
  engine: 'hermes' | 'openclaw' | 'n8n';
  n8nWorkflow: string;
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

const QUICK_LINKS: Array<{ href: string; label: string; hint: string }> = [
  { href: '/hermes/agent', label: 'Hermes Agent', hint: 'AI core chat' },
  { href: '/models', label: 'Models', hint: 'Engine control' },
  { href: '/brain-stack', label: 'Brain Stack', hint: 'AI brain map' },
  { href: '/customers', label: 'Customers', hint: 'Clients & teams' },
  { href: '/services', label: 'Services', hint: 'Service catalog' },
  { href: '/integrations', label: 'Integrations', hint: 'External apps' },
];

export default function HermesPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [apps, setApps] = useState<AppStatus[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
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
    const loadApps = async () => {
      try {
        const res = await fetch('/api/apps', { cache: 'no-store' });
        const json = await res.json();
        const list = (json?.apps ?? json ?? []) as AppStatus[];
        if (active) setApps(Array.isArray(list) ? list : []);
      } catch {
        /* catalog optional */
      }
    };
    const loadTeams = async () => {
      try {
        const res = await fetch('/api/hermes/teams', { cache: 'no-store' });
        const json = await res.json();
        const list = (json?.teams ?? []) as AgentTeam[];
        if (active) setTeams(Array.isArray(list) ? list : []);
      } catch {
        /* roster is static, non-blocking */
      }
    };
    load();
    loadApps();
    loadTeams();
    const interval = setInterval(load, 10000);
    const appsInterval = setInterval(loadApps, 30000);
    const teamsInterval = setInterval(loadTeams, 60000);
    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(appsInterval);
      clearInterval(teamsInterval);
    };
  }, []);

  const stackEntries = data
    ? [
        { key: 'prometheus', label: 'Prometheus', ...data.stack.prometheus },
        { key: 'grafana', label: 'Grafana', ...data.stack.grafana },
        {
          key: 'alertmanager',
          label: 'Alertmanager',
          ...data.stack.alertmanager,
        },
      ]
    : [];

  const onlineApps = apps.filter((a) => a.online).length;

  return (
    <div className="hermes-page">
      <div className="hermes-header">
        <div>
          <p className="kicker">◆ Ultra AI Command</p>
          <h1>Hermes Dashboard</h1>
          <p className="muted">
            Central control surface — Hermes runtime, observability stack, and
            every Ultra-AI portal in one view.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link className="hermes-grafana-btn" href="/hermes/agent">
            Talk to Hermes →
          </Link>
          <a
            className="hermes-grafana-btn"
            href={GRAFANA_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Grafana ↗
          </a>
        </div>
      </div>

      {/* Portal quick links */}
      <section className="hermes-stack" aria-label="Ultra-AI portals">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="hermes-stack-card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div>
              <strong>{l.label}</strong>
              <p className="muted">{l.hint}</p>
            </div>
          </Link>
        ))}
      </section>

      {!loading && data && !data.reachable && (
        <div className="hermes-offline card">
          <strong>Monitoring stack is offline.</strong>
          <p className="muted">
            Hermes is an optional layer. Start it with{' '}
            <code>
              ./infrastructure/automation/ultra-stack.sh up --with-hermes
            </code>{' '}
            (or{' '}
            <code>
              cd infrastructure/monitoring/stack/hermes &amp;&amp;
              ./start-hermes.sh up
            </code>
            ). This page will populate automatically once Prometheus is
            reachable.
          </p>
        </div>
      )}

      {/* Stack reachability */}
      <section className="hermes-stack">
        {stackEntries.map((s) => (
          <div
            key={s.key}
            className={`hermes-stack-card ${s.up ? 'up' : 'down'}`}
          >
            <span className="dot" />
            <div>
              <strong>{s.label}</strong>
              <p className="muted">{s.up ? 'reachable' : 'unreachable'}</p>
            </div>
          </div>
        ))}
        {apps.length > 0 && (
          <div className="hermes-stack-card up">
            <span className="dot" />
            <div>
              <strong>External Apps</strong>
              <p className="muted">
                {onlineApps}/{apps.length} online — via /apps control layer
              </p>
            </div>
          </div>
        )}
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
          <strong
            className={
              (data?.metrics.errorRate ?? 0) > 0 ? 'metric-warn' : undefined
            }
          >
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
            {data?.metrics.uptimeSeconds != null
              ? 'API Uptime'
              : 'Scrape Targets'}
          </span>
          <strong>
            {data?.metrics.uptimeSeconds != null
              ? fmtUptime(data.metrics.uptimeSeconds)
              : fmt(data?.metrics.targetsUp ?? null, 0)}
          </strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Memory</span>
          <strong>{fmt(data?.metrics.memoryMB ?? null, 0, ' MB')}</strong>
        </div>
      </section>

      {/* Agent teams (R9) */}
      {teams.length > 0 && (
        <section className="hermes-alerts card">
          <h2>Agent Teams</h2>
          <ul className="alert-list">
            {teams.map((t) => (
              <li key={t.id} className="alert-row sev-none">
                <span className="alert-sev">{t.engine}</span>
                <div>
                  <strong>{t.displayName}</strong>
                  <p className="muted">
                    {t.role} · {t.trigger} · {t.n8nWorkflow}
                  </p>
                  <p className="muted">{t.deliverable}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
              <li
                key={`${a.name}-${i}`}
                className={`alert-row sev-${a.severity}`}
              >
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
          Updated {new Date(data.generatedAt).toLocaleTimeString()} ·
          auto-refresh 10s
        </p>
      )}
    </div>
  );
}
