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

interface SkillEntry {
  id: string;
  name: string;
  description: string;
  managed: boolean;
}

interface PromptEntry {
  id: string;
  name: string;
  description: string;
  managed: boolean;
}

export default function BrainStackPage() {
  const [sections, setSections] = useState(SECTIONS);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<'component' | 'skill' | 'prompt' | null>(null);
  const [editing, setEditing] = useState<{ kind: string; id: string } | null>(null);
  const [form, setForm] = useState({ name: '', desc: '', port: '' });
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [tab, setTab] = useState<'components' | 'skills' | 'prompts'>('components');

  const loadSkills = () =>
    fetch('/api/brain-stack/skills')
      .then((r) => (r.ok ? r.json() : { skills: [] }))
      .then((d) => setSkills(d.skills || []))
      .catch(() => {});
  const loadPrompts = () =>
    fetch('/api/brain-stack/prompts')
      .then((r) => (r.ok ? r.json() : { prompts: [] }))
      .then((d) => setPrompts(d.prompts || []))
      .catch(() => {});
  const loadComponents = () =>
    fetch('/api/brain-stack/components')
      .then((r) => (r.ok ? r.json() : { components: [] }))
      .then((d) => {
        const custom = (d.components || []) as Array<{
          id: string;
          name: string;
          desc: string;
          icon?: string;
          port?: number;
          status?: string;
          detail?: string;
        }>;
        setSections((prev) => [
          ...SECTIONS,
          ...custom.map((c) => ({
            id: c.id,
            name: c.name,
            desc: c.desc,
            icon: c.icon || '◈',
            port: c.port,
            status: (c.status as Section['status']) || 'unknown',
            detail: c.detail || 'Custom component',
          })),
        ]);
      })
      .catch(() => {});

  useEffect(() => {
    loadComponents();
    loadSkills();
    loadPrompts();
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

  const apiCall = async (
    method: string,
    url: string,
    body?: unknown
  ): Promise<{ ok: boolean; error?: string }> => {
    setBusy(true);
    setFormErr('');
    try {
      const r = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setFormErr((d as { error?: string }).error || `HTTP ${r.status}`);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'network error');
      return { ok: false };
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setAdding(null);
    setEditing(null);
    setForm({ name: '', desc: '', port: '' });
    setFormErr('');
  };

  const submitForm = async () => {
    const name = form.name.trim();
    if (!name) return;
    const desc = form.desc.trim();
    const portNum = Number.parseInt(form.port.trim(), 10);
    const port = Number.isFinite(portNum) ? portNum : undefined;

    if (adding === 'component' || editing?.kind === 'component') {
      const id = editing?.id;
      const res = await apiCall(
        editing ? 'PUT' : 'POST',
        id ? `/api/brain-stack/components/${id}` : '/api/brain-stack/components',
        { name, desc, port }
      );
      if (res.ok) {
        setSections((prev) =>
          editing
            ? prev.map((x) => (x.id === id ? { ...x, name, desc: desc || x.desc, port } : x))
            : [
                ...prev,
                {
                  id: `custom-${Date.now().toString(36)}`,
                  name,
                  desc: desc || 'Custom component',
                  icon: '◈',
                  port,
                  status: 'unknown',
                  detail: 'Registered via Brain Stack API',
                },
              ]
        );
        resetForm();
      }
      return;
    }

    const kind = adding === 'skill' || editing?.kind === 'skill' ? 'skills' : 'prompts';
    const id = editing?.id;
    const res = await apiCall(
      editing ? 'PUT' : 'POST',
      id ? `/api/brain-stack/${kind}/${id}` : `/api/brain-stack/${kind}`,
      { name, description: desc }
    );
    if (res.ok) {
      if (kind === 'skills') await loadSkills();
      else await loadPrompts();
      resetForm();
    }
  };

  const removeItem = async (kind: 'components' | 'skills' | 'prompts', id: string) => {
    if (!window.confirm(`Delete "${id}"?`)) return;
    const res = await apiCall('DELETE', `/api/brain-stack/${kind}/${id}?force=1`);
    if (!res.ok) return;
    if (kind === 'components') {
      setSections((prev) => prev.filter((x) => x.id !== id));
      if (selected === id) setSelected(null);
    } else if (kind === 'skills') {
      await loadSkills();
    } else {
      await loadPrompts();
    }
  };

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
        <button
          className="btn primary"
          onClick={() => {
            setAdding('component');
            setForm({ name: '', desc: '', port: '' });
          }}
        >
          + Add Component
        </button>
      </header>

      <div className="tabs" style={{ margin: '12px 0' }}>
        {(['components', 'skills', 'prompts'] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? 'primary' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'components' ? 'Components' : t === 'skills' ? `Skills (${skills.length})` : `Prompts (${prompts.length})`}
          </button>
        ))}
      </div>

      {tab === 'components' && (
        <>
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
                const isCustom = s.id.startsWith('custom-');
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
                      {isCustom && (
                        <>
                          <button
                            className="btn"
                            onClick={() => {
                              setEditing({ kind: 'component', id: s.id });
                              setForm({ name: s.name, desc: s.desc, port: s.port ? String(s.port) : '' });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => removeItem('components', s.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {tab === 'skills' && (
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Brain Stack Skills</h2>
            <button
              className="btn primary"
              onClick={() => {
                setAdding('skill');
                setForm({ name: '', desc: '', port: '' });
              }}
            >
              + Add Skill
            </button>
          </div>
          {skills.length === 0 ? (
            <p className="muted">No skills yet — add one to persist under <code>brain-stack/skills/</code>.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Description</th><th>Source</th><th></th></tr>
              </thead>
              <tbody>
                {skills.map((sk) => (
                  <tr key={sk.id}>
                    <td><code>{sk.id}</code></td>
                    <td>{sk.description || sk.name}</td>
                    <td><span className={`badge ${sk.managed ? 'up' : 'unknown'}`}>{sk.managed ? 'managed' : 'file'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn"
                        onClick={() => {
                          setEditing({ kind: 'skill', id: sk.id });
                          setForm({ name: sk.name || sk.id, desc: sk.description, port: '' });
                        }}
                      >
                        Edit
                      </button>{' '}
                      <button className="btn danger" onClick={() => removeItem('skills', sk.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'prompts' && (
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Brain Stack Prompts</h2>
            <button
              className="btn primary"
              onClick={() => {
                setAdding('prompt');
                setForm({ name: '', desc: '', port: '' });
              }}
            >
              + Add Prompt
            </button>
          </div>
          {prompts.length === 0 ? (
            <p className="muted">No prompts yet — add one to persist under <code>brain-stack/prompts/</code>.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Description</th><th>Source</th><th></th></tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td>
                    <td>{p.description || p.name}</td>
                    <td><span className={`badge ${p.managed ? 'up' : 'unknown'}`}>{p.managed ? 'managed' : 'file'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn"
                        onClick={() => {
                          setEditing({ kind: 'prompt', id: p.id });
                          setForm({ name: p.name || p.id, desc: p.description, port: '' });
                        }}
                      >
                        Edit
                      </button>{' '}
                      <button className="btn danger" onClick={() => removeItem('prompts', p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {adding && (
        <div className="modal-back" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editing
                ? `Edit ${editing.kind === 'component' ? 'Component' : editing.kind === 'skill' ? 'Skill' : 'Prompt'}`
                : adding === 'component'
                  ? 'Add Brain Component'
                  : adding === 'skill'
                    ? 'Add Skill'
                    : 'Add Prompt'}
            </h2>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={adding === 'component' ? 'e.g. Vector Index' : 'e.g. code-review'}
              />
            </label>
            <label>
              {adding === 'component' ? 'Description' : 'Content / Description'}
              <textarea
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                rows={4}
                placeholder={adding === 'component' ? '' : 'Skill body (markdown) or prompt text'}
              />
            </label>
            {adding === 'component' && (
              <label>
                Port (optional)
                <input
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  placeholder="20130"
                />
              </label>
            )}
            {formErr && <p className="form-err">{formErr}</p>}
            <div className="modal-actions">
              <button className="btn" onClick={resetForm} disabled={busy}>
                Cancel
              </button>
              <button
                className="btn primary"
                disabled={!form.name.trim() || busy}
                onClick={submitForm}
              >
                {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
