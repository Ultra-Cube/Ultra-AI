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
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  definition: {
    type: 'shell' | 'n8n-flow';
    command: string;
    trigger?: string;
    tags?: string[];
  };
  status: 'draft' | 'ready' | 'running' | 'complete' | 'failed';
  lastRunAt?: string;
  lastOutput?: string;
  updatedAt: string;
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
};

type MessageResponse = {
  prompt: string;
  response: string;
  route: string;
  state: ZeroAIState;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function ZeroAIPage() {
  const [state, setState] = useState<ZeroAIState | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [prompt, setPrompt] = useState('ZeroAI, check the local stack and tell me what is ready.');
  const [source, setSource] = useState<'text' | 'voice'>('text');
  const [workflowName, setWorkflowName] = useState('OpenClaw status review');
  const [workflowDescription, setWorkflowDescription] = useState('Run the local assistant routing check and report the current posture.');
  const [workflowCommand, setWorkflowCommand] = useState('bash /home/pc/ucube/project/Ultra-AI/wsl-ai-stack/scripts/openclaw-bridge.sh "Summarize the current assistant routing and next actions."');
  const [result, setResult] = useState<MessageResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memoryCount = state?.memory.length ?? 0;
  const workflowCount = workflows.length;
  const lastRoute = state?.lastRoute ?? 'n/a';

  const recentMemory = useMemo(() => state?.memory.slice().reverse().slice(0, 8) ?? [], [state]);

  async function loadState() {
    const [stateResponse, workflowResponse] = await Promise.all([
      fetch(`${API_BASE}/zeroai/state`),
      fetch(`${API_BASE}/n8n/workflows`),
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
      setState(data.state);
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
      const response = await fetch(`${API_BASE}/n8n/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'local-zeroai',
          userId: 'system',
          name: workflowName,
          description: workflowDescription,
          definition: {
            type: 'n8n-flow',
            command: workflowCommand,
            trigger: 'manual',
            tags: ['zeroai', 'n8n'],
          },
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
      const response = await fetch(`${API_BASE}/n8n/workflows/${id}/execute`, { method: 'POST' });
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
            <p className="kicker">ZeroAI local control surface</p>
            <h1>One place to run the device assistant</h1>
            <p className="muted">
              ZeroAI owns the local conversation, workflow routing, memory, and OpenClaw handoff.
            </p>
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

      <section className="zeroai-grid">
        <form className="card zeroai-panel" onSubmit={sendPrompt}>
          <h2>Ask ZeroAI</h2>
          <label className="field">
            Entry mode
            <select value={source} onChange={(event) => setSource(event.target.value as 'text' | 'voice')}>
              <option value="text">Text</option>
              <option value="voice">Voice</option>
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
          <h2>Workflow Builder</h2>
          <form className="workflow-form" onSubmit={createWorkflow}>
            <label className="field">
              Name
              <input value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} />
            </label>
            <label className="field">
              Description
              <input
                value={workflowDescription}
                onChange={(event) => setWorkflowDescription(event.target.value)}
              />
            </label>
            <label className="field">
              Command
              <textarea
                value={workflowCommand}
                onChange={(event) => setWorkflowCommand(event.target.value)}
                rows={5}
              />
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
                <code>{workflow.definition.command}</code>
                <div className="workflow-actions">
                  <button type="button" onClick={() => runWorkflow(workflow.id)} disabled={busy}>
                    Run
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="zeroai-grid zeroai-bottom-grid">
        <article className="card zeroai-panel">
          <h2>Memory</h2>
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
        </article>

        <article className="card zeroai-panel">
          <h2>Runtime summary</h2>
          <ul className="summary-list">
            <li>Last prompt: {state?.lastPrompt ?? 'No prompt yet'}</li>
            <li>Last response: {state?.lastResponse ?? 'No response yet'}</li>
            <li>Updated: {state ? new Date(state.updatedAt).toLocaleString() : 'Loading...'}</li>
          </ul>
          <p className="muted">
            OpenClaw remains the router, n8n stays the workflow backbone, and the UI keeps the local
            path visible.
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
        </article>
      </section>
    </main>
  );
}
