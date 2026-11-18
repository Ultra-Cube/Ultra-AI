'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Section {
  id: string;
  name: string;
  desc: string;
  icon: string;
  port?: number;
  status: 'up' | 'down' | 'unknown';
  detail: string;
}

const SECTIONS: Section[] = [
  {
    id: 'core',
    name: 'Core Engine',
    desc: 'Cognitive runtime — process manager, config merge, readiness',
    icon: '⚙️',
    status: 'unknown',
    detail: '@ultra-ai/brain',
  },
  {
    id: 'memory',
    name: 'Memory Bank',
    desc: 'Long-term memory, pointers, FTS5 search, hash-chained records',
    icon: '🧠',
    status: 'unknown',
    detail: '@ultra-ai/memory-bridge',
  },
  {
    id: 'skills',
    name: 'Skill Registry',
    desc: 'SKILL.md packs, scopes, signing, distribution',
    icon: '🧩',
    status: 'unknown',
    detail: '@ultra-ai/skill-registry',
  },
  {
    id: 'mcp',
    name: 'MCP Hub',
    desc: 'Tool transports, policies, mcp.json management',
    icon: '🔌',
    status: 'unknown',
    detail: '@ultra-ai/mcp-hub',
  },
  {
    id: 'gateway',
    name: 'Model Gateway',
    desc: 'Provider routing, fallbacks, OpenAI-compatible API',
    icon: '🌐',
    port: 20129,
    status: 'unknown',
    detail: 'platform gateway',
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    desc: 'Cognitive core runtime + api_server (:8642)',
    icon: '🤖',
    port: 8642,
    status: 'unknown',
    detail: 'hermes agent',
  },
  {
    id: 'zeroai',
    name: 'ZeroAI',
    desc: 'Local-first execution, local memory & policies',
    icon: '🛡️',
    status: 'unknown',
    detail: 'local engine',
  },
  {
    id: 'supervisor',
    name: 'Engine Supervisor',
    desc: 'Lifecycle management via manifests',
    icon: '📡',
    status: 'unknown',
    detail: 'engine-supervisor',
  },
  {
    id: 'bridge',
    name: 'Core Bridge',
    desc: 'Signed outbox, hash-chain, Ed25519 events',
    icon: '🔗',
    status: 'unknown',
    detail: 'ultra-core-bridge',
  },
  {
    id: 'edge',
    name: 'Edge Proxy',
    desc: 'Longest-prefix routing, JWT, CSP',
    icon: '⚡',
    status: 'unknown',
    detail: '@ultra-ai/edge-proxy',
  },
  {
    id: 'ports',
    name: 'Port Registry',
    desc: 'Port claims & conflict resolution',
    icon: '🔢',
    status: 'unknown',
    detail: '@ultra-ai/port-registry',
  },
  {
    id: 'secrets',
    name: 'Secrets Vault',
    desc: 'Pluggable providers, envFor injection',
    icon: '🔐',
    status: 'unknown',
    detail: '@ultra-ai/secrets-vault',
  },
];

export default function BrainStackPage() {
  const [sections, setSections] = useState(SECTIONS);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', desc: '', port: '' });

  useEffect(() => {
    const probes: Record<string, string> = {
      gateway: 'http://localhost:20129/health',
      hermes: 'http://localhost:8642/health',
    };
    SECTIONS.forEach((s) => {
      const url = probes[s.id];
      if (!url) return;
      fetch(url, { signal: AbortSignal.timeout(2500) })
        .then((r) => {
          setSections((prev) =>
            prev.map((x) =>
              x.id === s.id ? { ...x, status: r.ok ? 'up' : 'down' } : x
            )
          );
        })
        .catch(() =>
          setSections((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, status: 'down' } : x))
          )
        );
    });
  }, []);

  const up = sections.filter((s) => s.status === 'up').length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Brain Stack</h1>
          <p className="muted">
            Cognitive architecture — {up}/{sections.length} core services live
          </p>
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}>
          + Add Component
        </button>
      </header>

      <div className="brain-map">
        {sections.map((s, i) => (
          <button
            key={s.id}
            className={`brain-node ${s.status} ${selected === s.id ? 'sel' : ''}`}
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => setSelected(selected === s.id ? null : s.id)}
          >
            <span className="brain-icon">{s.icon}</span>
            <span className="brain-name">{s.name}</span>
            <span className={`dot ${s.status}`} />
          </button>
        ))}
      </div>

      {selected && (
        <div className="card detail-card">
          {(() => {
            const s = sections.find((x) => x.id === selected)!;
            return (
              <>
                <div className="detail-head">
                  <span className="brain-icon lg">{s.icon}</span>
                  <div>
                    <h2>{s.name}</h2>
                    <code className="muted">{s.detail}</code>
                  </div>
                  <span className={`badge ${s.status}`}>{s.status}</span>
                </div>
                <p>{s.desc}</p>
                <div className="detail-actions">
                  {s.port && (
                    <Link
                      className="btn"
                      href={`http://localhost:${s.port}`}
                      target="_blank"
                    >
                      Open :{s.port}
                    </Link>
                  )}
                  <Link className="btn" href="/services">
                    Manage in Services →
                  </Link>
                  <Link className="btn" href="/gateway">
                    Model Gateway →
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {adding && (
        <div className="modal-back" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Brain Component</h2>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vector Index"
              />
            </label>
            <label>
              Description
              <textarea
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                rows={3}
              />
            </label>
            <label>
              Port (optional)
              <input
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="20130"
              />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                disabled={!form.name.trim()}
                onClick={() => {
                  const name = form.name.trim();
                  const port = Number.parseInt(form.port.trim(), 10);
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  setSections((prev) => [
                    ...prev,
                    {
                      id: 'custom-' + prev.length + '-' + slug,
                      name,
                      desc: form.desc.trim() || 'Custom component',
                      icon: '◈',
                      port: Number.isFinite(port) ? port : undefined,
                      status: 'unknown',
                      detail: 'Registered locally - no health probe yet',
                    },
                  ]);
                  setSelected(null);
                  setAdding(false);
                  setForm({ name: '', desc: '', port: '' });
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
