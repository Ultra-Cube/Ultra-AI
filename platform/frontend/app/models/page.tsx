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

import { useCallback, useEffect, useState } from 'react';

interface Model {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'up' | 'down' | 'unknown';
  state?: string;
  latency?: number;
}

const FALLBACK: Model[] = [
  {
    id: 'hermes-agent',
    name: 'Hermes Agent',
    provider: 'local',
    type: 'agent',
    status: 'unknown',
  },
  {
    id: 'omniroute',
    name: 'OmniRoute Router',
    provider: 'local',
    type: 'router',
    status: 'unknown',
  },
  {
    id: 'ollama',
    name: 'Ollama Local',
    provider: 'local',
    type: 'llm',
    status: 'unknown',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    provider: 'cloud',
    type: 'router',
    status: 'unknown',
  },
  {
    id: 'airllm',
    name: 'airLLM',
    provider: 'local',
    type: 'llm',
    status: 'unknown',
  },
];

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>(FALLBACK);
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState('all');
  const [pending, setPending] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    fetch('/api/control-center/engines?probe=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list = (
          d.statuses?.length ? d.statuses : d.engines || []
        ) as any[];
        if (Array.isArray(list) && list.length) {
          setModels(
            list.map((e: any, i: number) => ({
              id: e.id || `m${i}`,
              name: e.name || e.label || e.manifest?.label || e.id,
              provider: e.manifest?.category || e.category || 'local',
              type: e.manifest?.type || e.type || 'engine',
              status: e.state === 'running' || e.healthOk ? 'up' : 'down',
              state: e.state,
              latency: e.latencyMs ?? e.latency,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function control(id: string, action: 'start' | 'stop' | 'probe') {
    if (pending[id]) return;
    if (
      action !== 'probe' &&
      !window.confirm(
        `${action === 'start' ? 'Start' : 'Stop'} engine "${id}"?`
      )
    )
      return;
    setPending((p) => ({ ...p, [id]: action }));
    setActionError('');
    try {
      const res = await fetch(
        `/api/control-center/engines/${encodeURIComponent(id)}/${action}`,
        { method: 'POST' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        setActionError(data?.error ?? `${action} ${id} failed (${res.status})`);
    } catch {
      setActionError('core-api unreachable');
    } finally {
      setPending((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      setTimeout(load, 1200);
    }
  }

  const filtered = models.filter(
    (m) =>
      (provider === 'all' || m.provider === provider) &&
      m.name.toLowerCase().includes(q.toLowerCase())
  );
  const providers = ['all', ...new Set(models.map((m) => m.provider))];
  const upCount = models.filter((m) => m.status === 'up').length;
  const downCount = models.filter((m) => m.status === 'down').length;
  const latencies = models
    .map((m) => m.latency)
    .filter((l): l is number => typeof l === 'number');
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Model Management</h1>
          <p className="muted">
            {models.length} engines ·{' '}
            {models.filter((m) => m.status === 'up').length} live
          </p>
          {actionError && (
            <p className="muted small" style={{ color: 'var(--bad)' }}>
              {actionError}
            </p>
          )}
        </div>
        <div className="uai-status">
          <span
            className={`uai-dot2 ${upCount ? 'ok' : downCount ? 'err' : ''}`}
          />
          <span>
            {upCount}/{models.length} engines up
            {avgLatency != null ? ` · avg ${avgLatency}ms` : ''}
          </span>
        </div>
      </header>

      <div className="grid cards-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="muted small">Engines</div>
          <strong style={{ fontSize: '1.4rem' }}>{models.length}</strong>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="muted small">Live</div>
          <strong
            style={{
              fontSize: '1.4rem',
              color: upCount ? 'var(--ok)' : undefined,
            }}
          >
            {upCount}
          </strong>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="muted small">Down</div>
          <strong
            style={{
              fontSize: '1.4rem',
              color: downCount ? 'var(--bad)' : undefined,
            }}
          >
            {downCount}
          </strong>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="muted small">Avg latency</div>
          <strong style={{ fontSize: '1.4rem' }}>
            {avgLatency != null ? `${avgLatency}ms` : '—'}
          </strong>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="muted small">Providers</div>
          <strong style={{ fontSize: '1.4rem' }}>{providers.length - 1}</strong>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search models…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
          {providers.map((p) => (
            <button
              key={p}
              className={`chip ${provider === p ? 'on' : ''}`}
              onClick={() => setProvider(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid cards-3">
        {filtered.map((m) => (
          <div key={m.id} className="card model-card">
            <div className="model-top">
              <strong>{m.name}</strong>
              <span className={`dot ${m.status}`} />
            </div>
            <div className="muted small">
              {m.provider} · {m.type}
            </div>
            <div className="model-meta">
              <code>{m.id}</code>
              {m.state && <span className="badge off">{m.state}</span>}
              {m.latency != null && (
                <span className={`badge ${m.status === 'up' ? 'ok' : 'off'}`}>
                  {m.latency}ms
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                className="secondary"
                disabled={!!pending[m.id]}
                onClick={() =>
                  void control(m.id, m.state === 'running' ? 'stop' : 'start')
                }
              >
                {pending[m.id] === 'start'
                  ? 'Starting…'
                  : pending[m.id] === 'stop'
                    ? 'Stopping…'
                    : m.state === 'running'
                      ? 'Stop'
                      : 'Start'}
              </button>
              <button
                className="secondary"
                disabled={!!pending[m.id]}
                onClick={() => void control(m.id, 'probe')}
              >
                Probe
              </button>
            </div>
          </div>
        ))}
        {!filtered.length && <p className="muted">No models match.</p>}
      </div>
    </div>
  );
}
