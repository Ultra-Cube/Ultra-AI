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

import { useEffect, useState } from 'react';

interface Team {
  id: string;
  name: string;
  client: string;
  model: string;
  tasks: string[];
  schedule: string;
  notes: string;
}

interface Client {
  id: string;
  name: string;
  plan: string;
  teams: number;
}

const MODELS = ['hermes-agent', 'omniroute', 'ollama', 'openrouter', 'auto'];
const TASKS = ['chat', 'automation', 'research', 'code', 'vision', 'scheduled'];

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([
    { id: 'c1', name: 'Ultra Cube Internal', plan: 'enterprise', teams: 2 },
  ]);
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 't1',
      name: 'Platform Ops',
      client: 'c1',
      model: 'hermes-agent',
      tasks: ['automation', 'scheduled'],
      schedule: '0 9 * * *',
      notes: 'Daily health sweep + incident triage',
    },
    {
      id: 't2',
      name: 'R&D Agents',
      client: 'c1',
      model: 'omniroute',
      tasks: ['research', 'code'],
      schedule: 'manual',
      notes: 'Exploration + prototyping workloads',
    },
  ]);
  const [sel, setSel] = useState<string | null>(teams[0].id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Team | null>(null);
  const [clientDraft, setClientDraft] = useState<Client | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ultra-customers');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.clients) setClients(d.clients);
        if (d.teams) setTeams(d.teams);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ultra-customers', JSON.stringify({ clients, teams }));
  }, [clients, teams]);

  const current = teams.find((t) => t.id === sel) || null;

  const saveClient = () => {
    if (!clientDraft) return;
    setClients((prev) =>
      prev.some((c) => c.id === clientDraft.id)
        ? prev.map((c) => (c.id === clientDraft.id ? clientDraft : c))
        : [...prev, clientDraft]
    );
    setClientDraft(null);
  };

  const deleteClient = (id: string) => {
    if (!window.confirm('Delete this client? Its teams will be unassigned.')) return;
    setClients((prev) => prev.filter((c) => c.id !== id));
    setTeams((prev) => prev.map((t) => (t.client === id ? { ...t, client: '' } : t)));
  };

  const save = () => {
    if (!draft) return;
    setTeams((prev) => prev.map((t) => (t.id === draft.id ? draft : t)));
    setEditing(false);
    setDraft(null);
  };

  const toggleTask = (task: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      tasks: draft.tasks.includes(task)
        ? draft.tasks.filter((t) => t !== task)
        : [...draft.tasks, task],
    });
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Customers & Teams</h1>
          <p className="muted">
            {clients.length} clients · {teams.length} teams — per-team model,
            tasks & schedules
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => {
            const t: Team = {
              id: `t${Date.now()}`,
              name: 'New Team',
              client: clients[0]?.id || '',
              model: 'auto',
              tasks: [],
              schedule: 'manual',
              notes: '',
            };
            setTeams((p) => [...p, t]);
            setSel(t.id);
            setDraft(t);
            setEditing(true);
          }}
        >
          + New Team
        </button>
        <button
          className="btn"
          onClick={() =>
            setClientDraft({
              id: `c${Date.now()}`,
              name: 'New Client',
              plan: 'standard',
              teams: 0,
            })
          }
        >
          + New Client
        </button>
      </header>

      <div className="split">
        <aside className="panel list">
          <h3>Clients</h3>
          {clients.map((c) => (
            <div key={c.id} className="list-item">
              <strong>{c.name}</strong>
              <span className="muted small">
                {c.plan} · {c.teams} teams
              </span>{' '}
              <button
                className="btn-link muted small"
                onClick={() =>
                  setClientDraft({ ...c, teams: teams.filter((t) => t.client === c.id).length })
                }
              >
                edit
              </button>
            </div>
          ))}
          <h3>Teams</h3>
          {teams.map((t) => (
            <button
              key={t.id}
              className={`list-item btn-link ${sel === t.id ? 'on' : ''}`}
              onClick={() => {
                setSel(t.id);
                setEditing(false);
                setDraft(null);
              }}
            >
              <strong>{t.name}</strong>
              <span className="muted small">
                {t.model} · {t.tasks.length} tasks
              </span>
            </button>
          ))}
        </aside>

        <section className="panel detail">
          {!current && <p className="muted">Select a team.</p>}
          {current && !editing && (
            <>
              <div className="detail-head">
                <h2>{current.name}</h2>
                <button
                  className="btn"
                  onClick={() => {
                    setDraft({ ...current });
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
              </div>
              <dl className="kv">
                <dt>Client</dt>
                <dd>
                  {clients.find((c) => c.id === current.client)?.name ||
                    current.client}
                </dd>
                <dt>Model</dt>
                <dd>
                  <code>{current.model}</code>
                </dd>
                <dt>Tasks</dt>
                <dd>{current.tasks.join(', ') || '—'}</dd>
                <dt>Schedule</dt>
                <dd>
                  <code>{current.schedule}</code>
                </dd>
                <dt>Notes</dt>
                <dd>{current.notes || '—'}</dd>
              </dl>
            </>
          )}
          {current && editing && draft && (
            <>
              <h2>Edit Team</h2>
              <label>
                Name
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                Client
                <select
                  value={draft.client}
                  onChange={(e) =>
                    setDraft({ ...draft, client: e.target.value })
                  }
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Model
                <select
                  value={draft.model}
                  onChange={(e) =>
                    setDraft({ ...draft, model: e.target.value })
                  }
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>Tasks</label>
              <div className="chips">
                {TASKS.map((t) => (
                  <button
                    key={t}
                    className={`chip ${draft.tasks.includes(t) ? 'on' : ''}`}
                    onClick={() => toggleTask(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label>
                Schedule (cron or "manual")
                <input
                  value={draft.schedule}
                  onChange={(e) =>
                    setDraft({ ...draft, schedule: e.target.value })
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  rows={4}
                />
              </label>
              <div className="modal-actions">
                <button
                  className="btn"
                  onClick={() => {
                    setEditing(false);
                    setDraft(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn primary" onClick={save}>
                  Save
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {clientDraft && (
        <div className="uai-modal-backdrop" onClick={() => setClientDraft(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{clients.some((c) => c.id === clientDraft.id) ? 'Edit Client' : 'New Client'}</h3>
            <label>
              Name
              <input
                value={clientDraft.name}
                onChange={(e) =>
                  setClientDraft({ ...clientDraft, name: e.target.value })
                }
              />
            </label>
            <label>
              Plan
              <select
                value={clientDraft.plan}
                onChange={(e) =>
                  setClientDraft({ ...clientDraft, plan: e.target.value })
                }
              >
                {['standard', 'pro', 'enterprise'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              {clients.some((c) => c.id === clientDraft.id) && (
                <button
                  className="btn"
                  style={{ color: '#f87171' }}
                  onClick={() => deleteClient(clientDraft.id)}
                >
                  Delete
                </button>
              )}
              <button className="btn" onClick={() => setClientDraft(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveClient}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
