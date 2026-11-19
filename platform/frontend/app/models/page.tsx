// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

'use client';

import { useEffect, useState } from 'react';

interface Model {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'up' | 'down' | 'unknown';
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

  useEffect(() => {
    fetch('/api/engines')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.engines || d || []) as any[];
        if (Array.isArray(list) && list.length) {
          setModels(
            list.map((e: any, i: number) => ({
              id: e.id || `m${i}`,
              name: e.name || e.label || e.id,
              provider: e.category || e.type || 'local',
              type: e.type || 'engine',
              status: e.up ? 'up' : 'down',
              latency: e.latency,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const filtered = models.filter(
    (m) =>
      (provider === 'all' || m.provider === provider) &&
      m.name.toLowerCase().includes(q.toLowerCase())
  );
  const providers = ['all', ...new Set(models.map((m) => m.provider))];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Model Management</h1>
          <p className="muted">
            {models.length} engines ·{' '}
            {models.filter((m) => m.status === 'up').length} live
          </p>
        </div>
      </header>

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
              {m.latency != null && (
                <span className="muted small">{m.latency}ms</span>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && <p className="muted">No models match.</p>}
      </div>
    </div>
  );
}
