'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type MemoryEntry = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  channel: 'text' | 'voice' | 'workflow' | 'system';
  content: string;
  createdAt: string;
};

type WorkflowRecord = {
  id: string;
  name: string;
  description?: string;
  command: string;
  status: 'draft' | 'ready' | 'running' | 'complete' | 'failed';
  lastRunAt?: string;
  lastOutput?: string;
  updatedAt: string;
};

type ZeroAITraceEntry = {
  id: string;
  kind: 'interaction' | 'workflow' | 'system';
  title: string;
  summary: string;
  detail: string;
  route: string;
  timestamp: string;
};

type ZeroAIAgentStatus = {
  id: string;
  name: string;
  role: string;
  status: 'ready' | 'degraded' | 'offline' | 'standby';
  summary: string;
  updatedAt: string;
};

type ZeroAIHealth = {
  openclaw: 'ready' | 'degraded' | 'offline' | 'standby';
  n8n: 'ready' | 'degraded' | 'offline' | 'standby';
  localModel: 'ready' | 'degraded' | 'offline' | 'standby';
  network: 'ready' | 'degraded' | 'offline' | 'standby';
};

type ZeroAIState = {
  assistantName: string;
  mode: 'local';
  lastPrompt: string | null;
  lastResponse: string | null;
  lastRoute: string | null;
  updatedAt: string;
  memory: MemoryEntry[];
  workflows: WorkflowRecord[];
  trace: ZeroAITraceEntry[];
  agents: ZeroAIAgentStatus[];
  health: ZeroAIHealth;
};

type MessageResponse = {
  prompt: string;
  response: string;
  route: string;
  state: ZeroAIState;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';
const healthLabels: Record<keyof ZeroAIHealth, string> = {
  openclaw: 'OpenClaw',
  n8n: 'n8n',
  localModel: 'Local model',
  network: 'Network',
};

export default function ZeroAIPage() {
  const [state, setState] = useState<ZeroAIState | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [prompt, setPrompt] = useState('ZeroAI, check the local stack and tell me what is ready.');
  const [source, setSource] = useState<'text' | 'voice'>('text');
  const [workflowName, setWorkflowName] = useState('OpenClaw status review');
  const [workflowDescription, setWorkflowDescription] = useState('Run the local assistant routing check and report the current posture.');
  const [workflowCommand, setWorkflowCommand] = useState('bash /home/pc/ucube/project/Ultra-AI/wsl-ai-stack/scripts/openclaw-bridge.sh "Summarize the current assistant routing and next actions."');
  const [result, setResult] = useState<MessageResponse | null>(null);
  const [view, setView] = useState<'simple' | 'professional'>('simple');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memoryCount = state?.memory.length ?? 0;
  const workflowCount = workflows.length;
  const lastRoute = state?.lastRoute ?? 'n/a';
  const recentMemory = useMemo(() => state?.memory.slice().reverse().slice(0, 6) ?? [], [state]);
  const recentTrace = useMemo(() => state?.trace.slice().reverse().slice(0, 6) ?? [], [state]);
  const healthCards = useMemo(() => {
    if (!state) {
      return [] as Array<{ key: keyof ZeroAIHealth; label: string; value: string; summary: string }>;
    }

    return (Object.entries(state.health) as Array<[keyof ZeroAIHealth, ZeroAIHealth[keyof ZeroAIHealth]]>).map(([key, value]) => ({
      key,
      label: healthLabels[key],
      value,
      summary: value === 'ready' ? 'Healthy' : value === 'degraded' ? 'Needs attention' : value === 'offline' ? 'Offline' : 'Standby',
    }));
  }, [state]);

  async function loadState() {
    const [stateResponse, workflowResponse] = await Promise.all([
      fetch(`${API_BASE}/zeroai/state`),
      fetch(`${API_BASE}/zeroai/workflows`),
    ]);

    if (!stateResponse.ok) {
      throw new Error('Unable to load ZeroAI state');
    }

    if (!workflowResponse.ok) {
      throw new Error('Unable to load workflows');
    }

    const stateData = (await stateResponse.json()) as ZeroAIState;
    const workflowData = (await workflowResponse.json()) as { workflows: WorkflowRecord[] };
    setState(stateData);
    setWorkflows(workflowData.workflows);
  }

  useEffect(() => {
    void loadState().catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to load ZeroAI state');
    });
  }, []);

  async function sendPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/zeroai/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, source }),
      });

      const data = (await response.json()) as MessageResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'ZeroAI request failed');
      }

      setResult(data);
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZeroAI request failed');
    } finally {
      setBusy(false);
    }
  }

  async function createWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/zeroai/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          command: workflowCommand,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to save workflow');
      }

      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workflow');
    } finally {
      setBusy(false);
    }
  }

  async function runWorkflow(id: string) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/zeroai/workflows/${id}/run`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Workflow execution failed');
      }

      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow execution failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="zeroai-page">
      <section className="card zeroai-hero">
        <div className="zeroai-header-row">
          <div>
            <p className="kicker">AI OS control surface</p>
            <h1>ZeroAI as the single operator experience</h1>
            <p className="muted">
              Switch between a simple user view and a professional control panel that surfaces routing,
              workflows, agent health, and the latest reasoning trace.
            </p>
          </div>
          <div className="view-toggle" role="tablist" aria-label="ZeroAI view switcher">
            <button
              type="button"
              className={`view-pill ${view === 'simple' ? 'active' : ''}`}
              onClick={() => setView('simple')}
            >
              Simple
            </button>
            <button
              type="button"
              className={`view-pill ${view === 'professional' ? 'active' : ''}`}
              onClick={() => setView('professional')}
            >
              Professional
            </button>
          </div>
          <Link className="soft-button" href="/">
            Back to Ultra AI
          </Link>
        </div>

        <div className="zeroai-stats">
          <div className="stat-card">
            <span>Mode</span>
            <strong>{state?.mode ?? 'local'}</strong>
          </div>
          <div className="stat-card">
            <span>Memory</span>
            <strong>{memoryCount}</strong>
          </div>
          <div className="stat-card">
            <span>Workflows</span>
            <strong>{workflowCount}</strong>
          </div>
          <div className="stat-card">
            <span>Route</span>
            <strong>{lastRoute}</strong>
          </div>
        </div>
      </section>

      {view === 'simple' ? (
        <>
          <section className="zeroai-grid">
            <form className="card zeroai-panel" onSubmit={sendPrompt}>
              <h2>Ask ZeroAI</h2>
              <label className="field">
                Entry mode
                <select value={source} onChange={(event) => setSource(event.target.value as 'text' | 'voice')}>
                  <option value="text">Text</option>
                  <option value="voice">Local voice transcript</option>
                </select>
              </label>

              <label className="field">
                Prompt
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={6} />
              </label>

              <button type="submit" disabled={busy}>
                {busy ? 'Routing...' : 'Send to OpenClaw'}
              </button>

              {error ? <p className="error">{error}</p> : null}
              {result ? (
                <div className="result-box">
                  <p className="result-route">Route: {result.route}</p>
                  <p>{result.response}</p>
                </div>
              ) : null}
            </form>

            <div className="card zeroai-panel">
              <h2>What the system is watching</h2>
              <div className="mini-grid">
                {healthCards.map((entry) => (
                  <article key={entry.key} className="mini-card">
                    <span className="mini-label">{entry.label}</span>
                    <strong>{entry.value}</strong>
                    <p>{entry.summary}</p>
                  </article>
                ))}
              </div>
              <p className="muted">
                Use professional mode to inspect the live reasoning trace and the agent network health.
              </p>
            </div>
          </section>

          <section className="zeroai-grid zeroai-bottom-grid">
            <div className="card zeroai-panel">
              <h2>Workflow builder</h2>
              <form className="workflow-form" onSubmit={createWorkflow}>
                <label className="field">
                  Name
                  <input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
                </label>
                <label className="field">
                  Description
                  <input value={workflowDescription} onChange={(event) => setWorkflowDescription(event.target.value)} />
                </label>
                <label className="field">
                  Command
                  <textarea value={workflowCommand} onChange={(event) => setWorkflowCommand(event.target.value)} rows={5} />
                </label>
                <button type="submit" disabled={busy}>
                  Save workflow
                </button>
              </form>

              <div className="workflow-list">
                {workflows.map((workflow) => (
                  <article key={workflow.id} className="workflow-item">
                    <div className="workflow-topline">
                      <div>
                        <h3>{workflow.name}</h3>
                        <p>{workflow.description}</p>
                      </div>
                      <span className={`tag status-${workflow.status}`}>{workflow.status}</span>
                    </div>
                    <code>{workflow.command}</code>
                    <div className="workflow-actions">
                      <button type="button" onClick={() => void runWorkflow(workflow.id)} disabled={busy}>
                        Run
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="card zeroai-panel">
              <h2>Recent memory</h2>
              <div className="memory-list">
                {recentMemory.map((entry) => (
                  <article key={entry.id} className="memory-item">
                    <div className="memory-meta">
                      <span className={`tag role-${entry.role}`}>{entry.role}</span>
                      <span className={`tag channel-${entry.channel}`}>{entry.channel}</span>
                      <time>{new Date(entry.createdAt).toLocaleString()}</time>
                    </div>
                    <p>{entry.content}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="zeroai-grid">
            <div className="card zeroai-panel">
              <h2>Agent network</h2>
              <div className="mini-grid">
                {state?.agents.map((agent) => (
                  <article key={agent.id} className="mini-card">
                    <span className="mini-label">{agent.name}</span>
                    <strong>{agent.status}</strong>
                    <p>{agent.summary}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="card zeroai-panel">
              <h2>Routing trace</h2>
              <div className="trace-list">
                {recentTrace.map((trace) => (
                  <article key={trace.id} className="trace-item">
                    <div className="memory-meta">
                      <span className="tag">{trace.kind}</span>
                      <time>{new Date(trace.timestamp).toLocaleString()}</time>
                    </div>
                    <h3>{trace.title}</h3>
                    <p>{trace.summary}</p>
                    <code>{trace.detail}</code>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="zeroai-grid zeroai-bottom-grid">
            <div className="card zeroai-panel">
              <h2>Workflow builder</h2>
              <form className="workflow-form" onSubmit={createWorkflow}>
                <label className="field">
                  Name
                  <input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
                </label>
                <label className="field">
                  Description
                  <input value={workflowDescription} onChange={(event) => setWorkflowDescription(event.target.value)} />
                </label>
                <label className="field">
                  Command
                  <textarea value={workflowCommand} onChange={(event) => setWorkflowCommand(event.target.value)} rows={5} />
                </label>
                <button type="submit" disabled={busy}>
                  Save workflow
                </button>
              </form>
              <div className="workflow-list">
                {workflows.map((workflow) => (
                  <article key={workflow.id} className="workflow-item">
                    <div className="workflow-topline">
                      <div>
                        <h3>{workflow.name}</h3>
                        <p>{workflow.description}</p>
                      </div>
                      <span className={`tag status-${workflow.status}`}>{workflow.status}</span>
                    </div>
                    <code>{workflow.command}</code>
                    <div className="workflow-actions">
                      <button type="button" onClick={() => void runWorkflow(workflow.id)} disabled={busy}>
                        Run
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="card zeroai-panel">
              <h2>Runtime summary</h2>
              <ul className="summary-list">
                <li>Last prompt: {state?.lastPrompt ?? 'No prompt yet'}</li>
                <li>Last response: {state?.lastResponse ?? 'No response yet'}</li>
                <li>Updated: {state ? new Date(state.updatedAt).toLocaleString() : 'Loading...'}</li>
              </ul>
              <p className="muted">
                ZeroAI remains the local operator. OpenClaw handles routing policy, n8n manages workflows,
                and the distributed network remains available for escalation.
              </p>
              <button
                type="button"
                onClick={() => {
                  void loadState().catch((err) => {
                    setError(err instanceof Error ? err.message : 'Unable to reload ZeroAI state');
                  });
                }}
              >
                Refresh state
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
