'use client';

import { useCallback, useEffect, useState } from 'react';

interface Service {
  id: string;
  name: string;
  url?: string;
  port: number;
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
}

interface SupStatus {
  id: string;
  label: string;
  state: string;
  port: number;
  pid?: number;
  healthOk: boolean;
  latencyMs?: number;
  lastError?: string;
  url?: string;
}

interface Engine {
  id: string;
  label: string;
  category: string;
  url: string;
  port: number;
  healthPath: string;
  embed: boolean;
  description: string;
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  llm: {
    label: 'Models & LLM',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  agent: {
    label: 'Agents',
    icon: 'M12 8V4m0 0a2 2 0 11-4 0 2 2 0 014 0zm0 0a2 2 0 104 0 2 2 0 10-4 0zM5 20h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z',
  },
  automation: { label: 'Automation', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ide: {
    label: 'IDE & DevTools',
    icon: 'M8 9l-4 3 4 3m8-6l4 3-4 3M13 5l-2 14',
  },
  observability: {
    label: 'Observability',
    icon: 'M3 3v18h18M7 14l4-4 3 3 5-6',
  },
  memory: { label: 'Memory & Knowledge', icon: 'M4 6h16M4 12h16M4 18h10' },
  data: {
    label: 'Data',
    icon: 'M4 7v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H6a2 2 0 00-2 2z',
  },
};

function Icon({ d, size = 18 }: { d: string; size?: number }) {
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [sup, setSup] = useState<Record<number, SupStatus>>({});
  const [bridgeOnline, setBridgeOnline] = useState<boolean | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openLabel, setOpenLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, 'start' | 'stop'>>({});
  const [actionError, setActionError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [sysRes, engRes, supRes] = await Promise.all([
        fetch('/api/system/status', { cache: 'no-store' }),
        fetch('/api/engines', { cache: 'no-store' }),
        fetch('/api/control-center/engines?probe=1', { cache: 'no-store' }),
      ]);
      const sys = await sysRes.json();
      const eng = await engRes.json();
      const supData = await supRes.json().catch(() => null);
      setServices(sys.services ?? []);
      setEngines(eng.engines ?? []);
      setBridgeOnline(supData?.connected === true);
      const map: Record<number, SupStatus> = {};
      for (const s of (supData?.statuses ?? []) as SupStatus[]) {
        if (typeof s.port === 'number') map[s.port] = s;
      }
      setSup(map);
    } catch {
      // keep last known state
    } finally {
      setLoading(false);
    }
  }, []);

  const control = useCallback(
    async (id: string, action: 'start' | 'stop') => {
      if (
        !window.confirm(`${action === 'start' ? 'Start' : 'Stop'} engine "${id}"?`)
      ) {
        return;
      }
      setPending((p) => ({ ...p, [id]: action }));
      setActionError('');
      try {
        const res = await fetch(`/api/control-center/engines/${id}/${action}`, {
          method: 'POST',
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.error) {
          setActionError(
            `${action} ${id} failed: ${data?.error ?? `HTTP ${res.status}`}`
          );
        }
      } catch {
        setActionError(`${action} ${id} failed: control API unreachable`);
      } finally {
        setPending((p) => {
          const next = { ...p };
          delete next[id];
          return next;
        });
        void refresh();
      }
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const grouped = engines.reduce<Record<string, Engine[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  const openService = (url: string, label: string) => {
    setOpenUrl(url);
    setOpenLabel(label);
  };

  return (
    <div className="page services-page">
      <header className="page-head">
        <div>
          <h1>Services & Engines</h1>
          <p className="muted">
            Every integrated tool, embedded in one place — no need to leave
            Ultra AI.
          </p>
        </div>
        <button
          className="secondary"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh status'}
        </button>
      </header>

      {actionError && (
        <p className="muted" role="alert">
          {actionError}
        </p>
      )}

      {openUrl && (
        <div className="embed-frame card">
          <div className="embed-bar">
            <span className="embed-dot on" />
            <span className="embed-title">{openLabel}</span>
            <span className="embed-url mono">{openUrl}</span>
            <span className="spacer" />
            <a
              className="ghost-link"
              href={openUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab ↗
            </a>
            <button className="secondary" onClick={() => setOpenUrl(null)}>
              Close
            </button>
          </div>
          <iframe
            src={openUrl}
            title={openLabel}
            className="embed-body"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {services.length > 0 && (
        <section className="svc-group">
          <h2 className="svc-group-title">
            <Icon
              d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
              size={16}
            />{' '}
            Core Services
            <span className="svc-count">
              {services.filter((i) => i.up).length}/{services.length} up
            </span>
          </h2>
          <div className="svc-grid">
            {services.map((s) => (
              <article key={s.id} className={`svc-card${s.up ? ' up' : ''}`}>
                <div className="svc-card-head">
                  <span className={`svc-dot${s.up ? ' on' : ''}`} />
                  <h3>{s.name}</h3>
                  <span className="svc-port mono">:{s.port}</span>
                </div>
                <div className="svc-card-foot">
                  <span className="svc-status mono">
                    {s.up
                      ? `up · ${s.latencyMs ?? '?'}ms`
                      : `offline${s.httpStatus ? ` · ${s.httpStatus}` : ''}`}
                  </span>
                  <span className="spacer" />
                  {s.up && s.url && (
                    <a
                      className="svc-btn ghost"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {Object.entries(grouped).map(([cat, items]) => {
        const meta = CATEGORY_META[cat] ?? {
          label: cat,
          icon: CATEGORY_META.data.icon,
        };
        return (
          <section key={cat} className="svc-group">
            <h2 className="svc-group-title">
              <Icon d={meta.icon} size={16} /> {meta.label}
              <span className="svc-count">
                {items.filter((i) => i.up).length}/{items.length} up
              </span>
            </h2>
            <div className="svc-grid">
              {items.map((e) => {
                const st = sup[e.port];
                const ctlId = st?.id ?? e.id;
                const running =
                  st !== undefined
                    ? st.state === 'running' ||
                      st.state === 'starting' ||
                      st.state === 'stopping'
                    : e.up;
                return (
                <article key={e.id} className={`svc-card${e.up ? ' up' : ''}`}>
                  <div className="svc-card-head">
                    <span className={`svc-dot${e.up ? ' on' : ''}`} />
                    <h3>{e.label}</h3>
                    <span className="svc-port mono">:{e.port}</span>
                  </div>
                  <p className="svc-desc">{e.description}</p>
                  <div className="svc-card-foot">
                    <span className="svc-status mono">
                      {st
                        ? `${st.state}${st.healthOk ? ' · healthy' : ''}${
                            st.pid ? ` · pid ${st.pid}` : ''
                          }`
                        : e.up
                          ? `up · ${e.latencyMs ?? '?'}ms`
                          : 'offline'}
                    </span>
                    <span className="spacer" />
                    {bridgeOnline === false ? (
                      <span className="svc-status mono">bridge offline</span>
                    ) : st === undefined ? (
                      <span
                        className="svc-status mono"
                        title="Not managed by EngineSupervisor"
                      >
                        unmanaged
                      </span>
                    ) : (
                      <button
                        className="svc-btn"
                        disabled={pending[ctlId] !== undefined}
                        onClick={() =>
                          void control(ctlId, running ? 'stop' : 'start')
                        }
                      >
                        {pending[ctlId] === 'start'
                          ? 'Starting…'
                          : pending[ctlId] === 'stop'
                            ? 'Stopping…'
                            : running
                              ? 'Stop'
                              : 'Start'}
                      </button>
                    )}
                    {e.up && e.embed && (
                      <button
                        className="svc-btn"
                        onClick={() => openService(e.url, e.label)}
                      >
                        <Icon
                          d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                          size={14}
                        />{' '}
                        Embed
                      </button>
                    )}
                    <a
                      className="svc-btn ghost"
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open ↗
                    </a>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
