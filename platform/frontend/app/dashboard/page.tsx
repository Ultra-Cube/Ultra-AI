'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  url?: string;
  port: number;
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
}

interface Engine {
  id: string;
  label: string;
  category: string;
  url: string;
  port: number;
  up: boolean;
  latencyMs: number | null;
}

interface HostStats {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  cpu: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9z',
  mem: 'M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zM9 3v4m6-4v4',
  svc: 'M4 6h16M4 12h16M4 18h10',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  brain: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  chart: 'M3 3v18h18M7 14l4-4 3 3 5-6',
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [host, setHost] = useState<HostStats>({ cpu: 0, memory: 0, disk: 0, uptime: 0 });
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [sysRes, engRes] = await Promise.all([
        fetch('/api/system/status', { cache: 'no-store' }),
        fetch('/api/engines', { cache: 'no-store' }),
      ]);
      const sys = await sysRes.json();
      const eng = await engRes.json();
      setServices(sys.services ?? []);
      setEngines(eng.engines ?? []);
      if (sys.host) setHost(sys.host);
      setLastCheck(new Date());
    } catch {
      // keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const upCount = services.filter((s) => s.up).length;
  const engineUp = engines.filter((e) => e.up).length;
  const offline = services.filter((s) => !s.up);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Live view of the Ultra AI platform — services, engines, host health.
            {lastCheck && (
              <>
                {' '}
                Last check: {lastCheck.toLocaleTimeString()}
              </>
            )}
          </p>
        </div>
        <div className="detail-actions">
          <Link className="btn-link" href="/services">
            All services
          </Link>
          <Link className="btn-link" href="/chat">
            Open chat
          </Link>
          <button className="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Host metrics strip */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        {[
          { label: 'CPU', value: `${host.cpu.toFixed(1)}%`, icon: ICONS.cpu, warn: host.cpu > 80 },
          { label: 'Memory', value: `${host.memory.toFixed(1)}%`, icon: ICONS.mem, warn: host.memory > 85 },
          { label: 'Disk', value: `${host.disk.toFixed(1)}%`, icon: ICONS.svc, warn: host.disk > 90 },
          { label: 'Uptime', value: formatUptime(host.uptime), icon: ICONS.clock, warn: false },
          { label: 'Core services', value: `${upCount}/${services.length}`, icon: ICONS.svc, warn: upCount < services.length },
          { label: 'Engines online', value: `${engineUp}/${engines.length}`, icon: ICONS.bolt, warn: engineUp < engines.length },
        ].map((m) => (
          <div key={m.label} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted, #8a8a8a)' }}>
              <Icon d={m.icon} size={15} />
              <span className="small">{m.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: m.warn ? '#e5534b' : 'inherit' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Attention strip */}
      {offline.length > 0 && (
        <div className="card" style={{ borderLeft: '3px solid #e5534b', marginBottom: 20 }}>
          <strong>Attention — {offline.length} service{offline.length > 1 ? 's' : ''} offline:</strong>{' '}
          <span className="muted">
            {offline.map((s) => s.name).join(', ')}. See{' '}
            <Link href="/services">Services</Link> for details.
          </span>
        </div>
      )}

      <div className="split" style={{ alignItems: 'flex-start' }}>
        {/* Core services */}
        <section style={{ flex: 1, minWidth: 0 }}>
          <h2 className="svc-group-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon d={ICONS.svc} size={16} /> Core Services
            <span className="svc-count">{upCount}/{services.length} up</span>
          </h2>
          <div className="stack-list">
            {services.map((s) => (
              <div key={s.id} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`svc-dot${s.up ? ' on' : ''}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div className="small muted mono">:{s.port}{s.latencyMs != null ? ` · ${s.latencyMs}ms` : ''}</div>
                </div>
                {s.up && s.url && (
                  <a className="ghost-link" href={s.url} target="_blank" rel="noreferrer">Open ↗</a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions + Hermes */}
        <aside style={{ width: 300, flexShrink: 0 }}>
          <div className="card">
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.bolt} size={16} /> Quick actions
            </h3>
            <div className="stack-list">
              <Link className="list-item" href="/chat"><Icon d={ICONS.chat} size={15} /> Chat with Ultra AI</Link>
              <Link className="list-item" href="/brain-stack"><Icon d={ICONS.brain} size={15} /> Brain Stack</Link>
              <Link className="list-item" href="/models"><Icon d={ICONS.cpu} size={15} /> Model gateway</Link>
              <Link className="list-item" href="/hermes/agent"><Icon d={ICONS.chart} size={15} /> Hermes agent</Link>
              <Link className="list-item" href="/services"><Icon d={ICONS.svc} size={15} /> Services & engines</Link>
              <Link className="list-item" href="/customers"><Icon d={ICONS.mem} size={15} /> Customers & teams</Link>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon d={ICONS.chart} size={16} /> Observability
            </h3>
            <div className="kv">
              <span>Prometheus</span><span className="mono">:9090</span>
              <span>Grafana</span><span className="mono">:3001</span>
              <span>n8n</span><span className="mono">:5678</span>
              <span>OmniRoute</span><span className="mono">:20128</span>
            </div>
            <div className="detail-actions" style={{ marginTop: 12 }}>
              <a className="btn-link" href="http://localhost:3001" target="_blank" rel="noreferrer">Grafana ↗</a>
              <a className="btn-link" href="http://localhost:5678" target="_blank" rel="noreferrer">n8n ↗</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
