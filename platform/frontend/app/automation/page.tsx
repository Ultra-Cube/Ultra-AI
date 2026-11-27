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

/* ------------------------------------------------------------------ types */

interface N8nWorkflow {
  id: string;
  tenantId?: string;
  userId?: string;
  name: string;
  description?: string;
  definition?: {
    type?: string;
    command?: string;
    trigger?: string;
    tags?: string[];
    n8n?: {
      steps?: BuilderStep[];
      nodes?: unknown[];
      [k: string]: unknown;
    };
  };
  status?: string;
  lastRunAt?: string;
  lastOutput?: string;
  updatedAt?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  input?: unknown;
  output?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface BuilderStep {
  id: string;
  type: string;
  name: string;
  params: string; // JSON object as text — validated before save
}

interface LocalWorkflow {
  id: string;
  name?: string;
  description?: string;
  status?: string;
}

const STEP_TYPES = [
  { value: 'http-request', label: 'HTTP Request', hint: 'Call any REST API' },
  { value: 'ai-agent', label: 'AI Agent', hint: 'LLM step via gateway' },
  { value: 'set', label: 'Set / Transform', hint: 'Map fields between steps' },
  { value: 'if', label: 'IF / Switch', hint: 'Branch on a condition' },
  { value: 'shell', label: 'Shell Command', hint: 'Run a local command' },
  { value: 'webhook-response', label: 'Webhook Response', hint: 'Reply to caller' },
  { value: 'n8n-node', label: 'n8n Node', hint: 'Raw n8n node passthrough' },
];

const TRIGGERS = [
  { value: 'manual', label: 'Manual' },
  { value: 'schedule', label: 'Schedule (cron)' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'event', label: 'Event / ZeroAI' },
];

const TENANT = 'default';
const USER = 'local-user';

let stepSeq = 0;
const newStep = (type = 'http-request'): BuilderStep => ({
  id: `step-${Date.now()}-${stepSeq++}`,
  type,
  name: '',
  params: '{}',
});

const statusBadge = (status?: string) => {
  const s = (status ?? 'unknown').toLowerCase();
  const cls =
    s === 'complete' || s === 'ready' || s === 'active'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : s === 'failed' || s === 'error'
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : s === 'running'
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {status ?? 'unknown'}
    </span>
  );
};

/* ------------------------------------------------------------------ page */

export default function AutomationHubPage() {
  const [tab, setTab] = useState<'n8n' | 'local'>('n8n');
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [n8nOnline, setN8nOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // builder state
  const [editing, setEditing] = useState<N8nWorkflow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    tags: '',
  });
  const [steps, setSteps] = useState<BuilderStep[]>([newStep()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // run state
  const [runTarget, setRunTarget] = useState<N8nWorkflow | null>(null);
  const [runInput, setRunInput] = useState('{}');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<WorkflowExecution | null>(null);
  const [runError, setRunError] = useState('');

  // executions state
  const [execTarget, setExecTarget] = useState<string | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);

  // local (ZeroAI) state
  const [localWorkflows, setLocalWorkflows] = useState<LocalWorkflow[]>([]);
  const [localSelected, setLocalSelected] = useState('');
  const [localInput, setLocalInput] = useState('{}');
  const [localResult, setLocalResult] = useState<Record<string, unknown> | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/n8n/workflows?limit=100', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkflows(Array.isArray(data.workflows) ? data.workflows : []);
    } catch (e) {
      setError(`Could not load workflows: ${String(e)}`);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkflows();
    fetch('/api/apps', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const n8n = (d?.apps ?? d ?? []).find?.(
          (a: { id?: string }) => a.id === 'n8n'
        );
        setN8nOnline(n8n ? n8n.status === 'online' || n8n.online === true : null);
      })
      .catch(() => setN8nOnline(null));
    fetch('/api/zeroai/workflows', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { workflows: [] }))
      .then((d) => {
        const list = (d.workflows ?? d ?? []) as LocalWorkflow[];
        setLocalWorkflows(Array.isArray(list) ? list : []);
      })
      .catch(() => setLocalWorkflows([]));
  }, [loadWorkflows]);

  /* ------------------------------------------------------------ builder */

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', trigger: 'manual', tags: '' });
    setSteps([newStep()]);
    setFormError('');
    setShowBuilder(true);
  }

  function openEdit(w: N8nWorkflow) {
    setEditing(w);
    setForm({
      name: w.name ?? '',
      description: w.description ?? '',
      trigger: w.definition?.trigger ?? 'manual',
      tags: (w.definition?.tags ?? []).join(', '),
    });
    const saved = w.definition?.n8n?.steps;
    setSteps(
      Array.isArray(saved) && saved.length > 0
        ? (saved as BuilderStep[]).map((s) => ({ ...s }))
        : [newStep()]
    );
    setFormError('');
    setShowBuilder(true);
  }

  function updateStep(id: string, patch: Partial<BuilderStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function saveWorkflow() {
    setFormError('');
    if (!form.name.trim()) return setFormError('Name is required');
    // Validate each step's params JSON
    const cleanSteps: BuilderStep[] = [];
    for (const s of steps) {
      try {
        JSON.parse(s.params || '{}');
      } catch {
        return setFormError(`Step "${s.name || s.type}" has invalid JSON params`);
      }
      if (!s.name.trim()) return setFormError('Every step needs a name');
      cleanSteps.push({ ...s, params: s.params.trim() || '{}' });
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Build n8n-style node list for portability with real n8n
    const nodes = cleanSteps.map((s, i) => ({
      id: s.id,
      name: s.name,
      type: `n8n-nodes-base.${s.type === 'n8n-node' ? 'code' : s.type}`,
      typeVersion: 1,
      position: [i * 220, 300],
      parameters: JSON.parse(s.params || '{}'),
    }));
    const connections: Record<string, unknown> = {};
    for (let i = 0; i < cleanSteps.length - 1; i++) {
      connections[cleanSteps[i].name] = {
        main: [[{ node: cleanSteps[i + 1].name, type: 'main', index: 0 }]],
      };
    }

    const definition = {
      command: `automation:${form.name.trim()}`,
      trigger: form.trigger,
      tags: ['n8n', 'automation', ...tags],
      n8n: {
        format: 'ultra-automation/v1',
        steps: cleanSteps,
        nodes,
        connections,
      },
    };

    setSaving(true);
    try {
      const url = editing
        ? `/api/n8n/workflows/${encodeURIComponent(editing.id)}`
        : '/api/n8n/workflows';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editing
            ? { name: form.name.trim(), description: form.description.trim(), definition: { ...definition, type: 'n8n-flow' } }
            : {
                tenantId: TENANT,
                userId: USER,
                name: form.name.trim(),
                description: form.description.trim(),
                definition,
              }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setShowBuilder(false);
      await loadWorkflows();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkflow(w: N8nWorkflow) {
    if (!window.confirm(`Delete workflow "${w.name}"?`)) return;
    try {
      const res = await fetch(`/api/n8n/workflows/${encodeURIComponent(w.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadWorkflows();
    } catch (e) {
      setError(`Delete failed: ${String(e)}`);
    }
  }

  /* --------------------------------------------------------------- run */

  async function executeWorkflow() {
    if (!runTarget || running) return;
    setRunning(true);
    setRunError('');
    setRunResult(null);
    try {
      let input: unknown = {};
      try {
        input = JSON.parse(runInput || '{}');
      } catch {
        throw new Error('Trigger input is not valid JSON');
      }
      const res = await fetch(
        `/api/n8n/workflows/${encodeURIComponent(runTarget.id)}/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setRunResult(data.execution as WorkflowExecution);
      setRunTarget(null);
      await loadWorkflows();
    } catch (e) {
      setRunError(String(e));
    } finally {
      setRunning(false);
    }
  }

  async function toggleExecutions(w: N8nWorkflow) {
    if (execTarget === w.id) {
      setExecTarget(null);
      return;
    }
    setExecTarget(w.id);
    setExecutions([]);
    try {
      const res = await fetch(
        `/api/n8n/workflows/${encodeURIComponent(w.id)}/executions`
      );
      if (res.ok) {
        const data = await res.json();
        setExecutions(Array.isArray(data.executions) ? data.executions : []);
      }
    } catch {
      /* executions optional */
    }
  }

  /* ------------------------------------------------------------ local */

  async function runLocal() {
    if (!localSelected || localBusy) return;
    setLocalBusy(true);
    setLocalError('');
    setLocalResult(null);
    try {
      const input = JSON.parse(localInput || '{}') as Record<string, unknown>;
      const res = await fetch(
        `/api/zeroai/workflows/${encodeURIComponent(localSelected)}/run`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setLocalResult(data as Record<string, unknown>);
    } catch (e) {
      setLocalError(`Invalid JSON or request failed: ${String(e)}`);
    } finally {
      setLocalBusy(false);
    }
  }

  /* -------------------------------------------------------------- JSX */

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Automation Hub</h1>
            <p className="text-sm text-slate-400">
              Build and run automations — backed by n8n and local ZeroAI workflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                n8nOnline === true
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : n8nOnline === false
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
              }`}
            >
              n8n {n8nOnline === true ? 'online' : n8nOnline === false ? 'offline' : 'unknown'}
            </span>
            <div className="flex rounded-md border border-slate-700 overflow-hidden text-sm">
              <button
                onClick={() => setTab('n8n')}
                className={`px-3 py-1.5 ${tab === 'n8n' ? 'bg-indigo-600' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                n8n Workflows
              </button>
              <button
                onClick={() => setTab('local')}
                className={`px-3 py-1.5 ${tab === 'local' ? 'bg-indigo-600' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                Local ZeroAI
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {tab === 'n8n' ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Workflows {workflows.length > 0 ? `(${workflows.length})` : ''}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => void loadWorkflows()}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm hover:bg-slate-800"
                >
                  Refresh
                </button>
                <button
                  onClick={openNew}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
                >
                  + New automation
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading workflows…</p>
            ) : workflows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
                <p className="text-slate-300 font-medium">No workflows yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create your first automation — no code required. Add steps like
                  HTTP requests, AI agent calls, or shell commands and connect them
                  in order.
                </p>
                <button
                  onClick={openNew}
                  className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
                >
                  Build first automation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{w.name}</span>
                          {statusBadge(w.status)}
                          {w.definition?.trigger ? (
                            <span className="text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
                              {w.definition.trigger}
                            </span>
                          ) : null}
                        </div>
                        {w.description ? (
                          <p className="text-sm text-slate-400 mt-1">{w.description}</p>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-1">
                          {w.definition?.n8n?.steps
                            ? `${(w.definition.n8n.steps as unknown[]).length} step(s)`
                            : ''}
                          {w.updatedAt ? ` · updated ${new Date(w.updatedAt).toLocaleString()}` : ''}
                          {w.lastRunAt ? ` · last run ${new Date(w.lastRunAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setRunTarget(w);
                            setRunInput('{}');
                            setRunError('');
                            setRunResult(null);
                          }}
                          className="rounded-md bg-emerald-600/90 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
                        >
                          Run
                        </button>
                        <button
                          onClick={() => void toggleExecutions(w)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm hover:bg-slate-800"
                        >
                          {execTarget === w.id ? 'Hide runs' : 'Runs'}
                        </button>
                        <button
                          onClick={() => openEdit(w)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void deleteWorkflow(w)}
                          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {execTarget === w.id ? (
                      <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                          Recent executions
                        </p>
                        {executions.length === 0 ? (
                          <p className="text-xs text-slate-500">No executions recorded.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {executions.slice(0, 10).map((ex) => (
                              <li
                                key={ex.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                {statusBadge(ex.status)}
                                <span className="text-slate-500">
                                  {new Date(ex.startedAt).toLocaleString()}
                                </span>
                                {ex.error ? (
                                  <span className="text-rose-400 truncate">{ex.error}</span>
                                ) : ex.output ? (
                                  <span className="text-slate-400 truncate">{ex.output}</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ---------------------------------------------------- local tab */
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3 max-w-3xl">
            <h2 className="text-lg font-semibold">Local ZeroAI workflows</h2>
            <p className="text-sm text-slate-400">
              Lightweight workflows executed by the ZeroAI runtime on this machine.
            </p>
            <label className="block text-sm">
              <span className="text-slate-400">Workflow</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                value={localSelected}
                onChange={(e) => setLocalSelected(e.target.value)}
              >
                <option value="">Select a workflow…</option>
                {localWorkflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name ?? w.id}
                    {w.status ? ` (${w.status})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Trigger input (JSON)</span>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono"
                rows={4}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
              />
            </label>
            <button
              onClick={() => void runLocal()}
              disabled={!localSelected || localBusy}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {localBusy ? 'Running…' : 'Run workflow'}
            </button>
            {localError ? <p className="text-sm text-rose-400">{localError}</p> : null}
            {localResult ? (
              <pre className="text-xs text-slate-300 overflow-auto rounded-md border border-slate-800 bg-slate-950/60 p-3">
                {JSON.stringify(localResult, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- run modal */}
      {runTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-4">
            <h3 className="text-lg font-semibold">Run “{runTarget.name}”</h3>
            <label className="block text-sm">
              <span className="text-slate-400">Input (JSON)</span>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono"
                rows={5}
                value={runInput}
                onChange={(e) => setRunInput(e.target.value)}
              />
            </label>
            {runError ? <p className="text-sm text-rose-400">{runError}</p> : null}
            {runResult ? (
              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  {statusBadge(runResult.status)}
                  <span className="text-slate-500">{runResult.id}</span>
                </div>
                {runResult.error ? (
                  <p className="text-rose-400">{runResult.error}</p>
                ) : (
                  <p className="text-slate-400 whitespace-pre-wrap">{runResult.output}</p>
                )}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRunTarget(null)}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => void executeWorkflow()}
                disabled={running}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {running ? 'Running…' : 'Execute'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ builder modal */}
      {showBuilder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-5 space-y-4 my-8">
            <h3 className="text-lg font-semibold">
              {editing ? `Edit “${editing.name}”` : 'New automation'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-400">Name *</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Daily status digest"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-400">Description</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Trigger</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={form.trigger}
                  onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Tags (comma separated)</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="reports, daily"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-300">
                  Steps — executed top to bottom
                </h4>
                <div className="relative">
                  <select
                    className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setSteps((p) => [...p, newStep(e.target.value)]);
                    }}
                  >
                    <option value="">+ Add step…</option>
                    {STEP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {steps.map((s, i) => {
                  const meta = STEP_TYPES.find((t) => t.value === s.type);
                  return (
                    <div
                      key={s.id}
                      className="rounded-md border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-6">{i + 1}.</span>
                        <span className="text-xs font-medium text-indigo-300 w-32 truncate">
                          {meta?.label ?? s.type}
                        </span>
                        <input
                          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                          placeholder="Step name"
                          value={s.name}
                          onChange={(e) => updateStep(s.id, { name: e.target.value })}
                        />
                        <button
                          onClick={() => moveStep(s.id, -1)}
                          disabled={i === 0}
                          className="text-slate-500 hover:text-white disabled:opacity-30 text-sm px-1"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveStep(s.id, 1)}
                          disabled={i === steps.length - 1}
                          className="text-slate-500 hover:text-white disabled:opacity-30 text-sm px-1"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setSteps((p) => p.filter((x) => x.id !== s.id))}
                          disabled={steps.length === 1}
                          className="text-rose-400 hover:text-rose-300 disabled:opacity-30 text-sm px-1"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                      <textarea
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-mono"
                        rows={2}
                        placeholder={`Params JSON — e.g. {"url":"https://api.example.com","method":"GET"}`}
                        value={s.params}
                        onChange={(e) => updateStep(s.id, { params: e.target.value })}
                      />
                      {meta?.hint ? (
                        <p className="text-[11px] text-slate-500">{meta.hint}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {formError ? <p className="text-sm text-rose-400">{formError}</p> : null}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBuilder(false)}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveWorkflow()}
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create automation'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
