'use client';

import { useCallback, useEffect, useState } from 'react';
import AgentOrbScene, { SceneAgent } from '../components/AgentOrbScene';

/**
 * Agent Staff Console.
 *
 * Manage AI agents like staff: see the team in a 3D org scene, inspect each
 * agent's position (title / department / rank) and workload, dispatch a task
 * to a specific agent, and move tasks through their lifecycle. Backed by the
 * /agents API (JSON store, no DB required).
 */

type Position = { title: string; department: string; rank: string };
type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedAgentId: string;
};
type RosterAgent = {
  id: string;
  name: string;
  avatar: string;
  position: Position;
  status: string;
  capabilities: string[];
  model?: string;
  tasks: Task[];
  openTasks: number;
};

const STATUS_BADGE: Record<string, string> = {
  active: 'ag-ok',
  busy: 'ag-warn',
  idle: 'ag-info',
  offline: 'ag-muted',
  suspended: 'ag-bad',
};

const TASK_BADGE: Record<string, string> = {
  queued: 'ag-info',
  in_progress: 'ag-warn',
  done: 'ag-ok',
  blocked: 'ag-bad',
};

export default function AgentsPage() {
  const [roster, setRoster] = useState<RosterAgent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/roster', { cache: 'no-store' });
      const data = await res.json();
      setRoster(data.roster ?? []);
      setSelectedId((cur) => cur ?? data.roster?.[0]?.id ?? null);
    } catch {
      /* keep last good */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const selected = roster.find((a) => a.id === selectedId) ?? null;

  const sceneAgents: SceneAgent[] = roster.map((a) => ({
    id: a.id,
    name: a.name,
    avatar: a.avatar,
    status: a.status,
    openTasks: a.openTasks,
    department: a.position.department,
  }));

  async function assignTask() {
    if (!selected || !taskTitle.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/agents/${selected.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle.trim(), priority: taskPriority }),
      });
      setTaskTitle('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setTaskStatus(taskId: string, status: string) {
    await fetch(`/api/agents/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function reassign(taskId: string, agentId: string) {
    await fetch(`/api/agents/tasks/${taskId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    });
    await load();
  }

  const totalOpen = roster.reduce((sum, a) => sum + a.openTasks, 0);

  return (
    <div className="agents-page">
      <div className="agents-header">
        <div>
          <p className="kicker">👥 Staff</p>
          <h1>Agent Staff Console</h1>
          <p className="muted">
            Manage your AI agents like a team — assign positions, dispatch tasks,
            and track workload in 3D.
          </p>
        </div>
        <div className="agents-kpis">
          <div className="kpi">
            <span>{roster.length}</span>agents
          </div>
          <div className="kpi">
            <span>{totalOpen}</span>open tasks
          </div>
        </div>
      </div>

      {/* 3D org scene */}
      <section className="card agents-scene-card">
        <AgentOrbScene agents={sceneAgents} selectedId={selectedId} onSelect={setSelectedId} />
      </section>

      <div className="agents-grid">
        {/* Roster list */}
        <section className="card">
          <h2>Roster</h2>
          <div className="roster-list">
            {roster.map((a) => (
              <button
                key={a.id}
                className={`roster-row${selectedId === a.id ? ' active' : ''}`}
                onClick={() => setSelectedId(a.id)}
              >
                <span className="roster-avatar">{a.avatar}</span>
                <span className="roster-main">
                  <strong>{a.name}</strong>
                  <span className="muted">
                    {a.position.title} · {a.position.department}
                  </span>
                </span>
                <span className={`ag-badge ${STATUS_BADGE[a.status] ?? 'ag-muted'}`}>
                  {a.status}
                </span>
                {a.openTasks > 0 && <span className="roster-open">{a.openTasks}</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Selected agent detail + dispatch */}
        <section className="card">
          {selected ? (
            <>
              <div className="agent-detail-head">
                <span className="agent-detail-avatar">{selected.avatar}</span>
                <div>
                  <h2>{selected.name}</h2>
                  <p className="muted">
                    {selected.position.title} · {selected.position.department} ·{' '}
                    <span className="rank-tag">{selected.position.rank}</span>
                  </p>
                </div>
              </div>

              <div className="agent-caps">
                {selected.capabilities.map((c) => (
                  <span key={c} className="cap-chip">
                    {c}
                  </span>
                ))}
                {selected.model && <span className="cap-chip model">{selected.model}</span>}
              </div>

              {/* Dispatch a task */}
              <div className="dispatch">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={`Give ${selected.name} a task…`}
                  onKeyDown={(e) => e.key === 'Enter' && assignTask()}
                />
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
                <button onClick={assignTask} disabled={busy || !taskTitle.trim()}>
                  Assign
                </button>
              </div>

              {/* Task list */}
              <div className="task-list">
                {selected.tasks.length === 0 ? (
                  <p className="muted">No tasks yet. Dispatch one above.</p>
                ) : (
                  selected.tasks.map((t) => (
                    <div key={t.id} className="task-row">
                      <div className="task-main">
                        <span className={`ag-badge ${TASK_BADGE[t.status] ?? 'ag-muted'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        <strong>{t.title}</strong>
                        <span className={`prio prio-${t.priority}`}>{t.priority}</span>
                      </div>
                      <div className="task-actions">
                        {t.status !== 'in_progress' && (
                          <button onClick={() => setTaskStatus(t.id, 'in_progress')}>Start</button>
                        )}
                        {t.status !== 'done' && (
                          <button onClick={() => setTaskStatus(t.id, 'done')}>Done</button>
                        )}
                        <select
                          value=""
                          onChange={(e) => e.target.value && reassign(t.id, e.target.value)}
                          title="Reassign to…"
                        >
                          <option value="">Reassign…</option>
                          {roster
                            .filter((a) => a.id !== selected.id)
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="muted">Select an agent to view details.</p>
          )}
        </section>
      </div>
    </div>
  );
}
