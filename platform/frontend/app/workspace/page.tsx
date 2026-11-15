'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface EngineInfo {
  id: string;
  label: string;
  category: string;
  url?: string;
  port?: number;
  up: boolean;
  latencyMs?: number;
}

interface WorkspaceSession {
  id: string;
  workspacePath: string;
  title?: string;
  status: string;
  agent: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

interface WorkspaceState {
  connected: boolean;
  bridge: string;
  health: { reachable: boolean; baseUrl?: string; version?: string };
  sessions: WorkspaceSession[];
}

const STATUS_COLOR: Record<string, string> = {
  idle: 'text-emerald-400',
  running: 'text-sky-400',
  paused: 'text-amber-400',
  error: 'text-red-400',
  stopped: 'text-zinc-500',
  unknown: 'text-zinc-500',
};

export default function WorkspacePage() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [path, setPath] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engines, setEngines] = useState<EngineInfo[]>([]);

  useEffect(() => {
    fetch('/api/engines', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setEngines(Array.isArray(d?.engines) ? d.engines : []))
      .catch(() => setEngines([]));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace', { cache: 'no-store' });
      const data = (await res.json()) as WorkspaceState;
      setState(data);
      setError(null);
    } catch {
      setState({
        connected: false,
        bridge: 'offline',
        health: { reachable: false },
        sessions: [],
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const openSession = async () => {
    if (!path.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspacePath: path.trim(),
          title: title.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        result?: { ok: boolean; error?: string };
        error?: string;
      };
      const inner = data.result;
      if (!res.ok || inner?.ok === false) {
        setError(inner?.error ?? data.error ?? 'open failed');
      } else {
        setPath('');
        setTitle('');
      }
      await refresh();
    } catch {
      setError('request failed');
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async (id: string) => {
    if (!window.confirm(`Close workspace session ${id}?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/workspace/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const reachable = state?.health.reachable === true;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace</h1>
          <p className="text-sm text-zinc-400">
            Embedded OpenHands sessions — agentic coding workspaces
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              reachable ? 'bg-emerald-400' : 'bg-zinc-600'
            }`}
          />
          <span className="text-zinc-400">
            {reachable
              ? `sidecar ${state?.health.baseUrl ?? ''}`
              : 'sidecar offline'}
          </span>
        </div>
      </header>

      {!state ? (
        <p className="text-zinc-500">Loading…</p>
      ) : !state.connected ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Desktop bridge offline — workspace sessions unavailable. Start the
          desktop bridge and the OpenHands sidecar to manage workspaces.
        </div>
      ) : (
        <>
          <section className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">
              Open workspace
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/absolute/path/to/project"
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm sm:w-56"
              />
              <button
                onClick={() => void openSession()}
                disabled={busy || !path.trim()}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Open
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </section>

          <section className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200">Engines</h2>
              <Link
                href="/services"
                className="text-xs text-sky-400 hover:underline"
              >
                Services &amp; Engines →
              </Link>
            </div>
            {engines.length === 0 ? (
              <p className="text-xs text-zinc-500">No engines registered.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {engines.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-zinc-200">
                        {e.label}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {e.category}
                        {e.port ? ` · :${e.port}` : ''}
                      </div>
                    </div>
                    <span
                      className={
                        e.up
                          ? 'ml-2 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400'
                          : 'ml-2 shrink-0 rounded-full bg-zinc-700/40 px-2 py-0.5 text-[10px] text-zinc-400'
                      }
                      title={e.up ? 'up' : 'down'}
                    >
                      {e.up ? 'up' : 'down'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-zinc-300">
              Sessions ({state.sessions.length})
            </h2>
            {state.sessions.length === 0 ? (
              <p className="rounded-lg border border-zinc-800 p-6 text-center text-sm text-zinc-500">
                No workspace sessions. Open one above to start an agentic coding
                session.
              </p>
            ) : (
              <ul className="space-y-2">
                {state.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {s.title ?? s.workspacePath}
                        </span>
                        <span
                          className={`text-xs ${STATUS_COLOR[s.status] ?? 'text-zinc-400'}`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-zinc-500">
                        {s.workspacePath} · {s.agent} · {s.id}
                      </div>
                      {s.lastError && (
                        <div className="mt-1 text-xs text-red-400">
                          {s.lastError}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => void closeSession(s.id)}
                      disabled={busy}
                      className="ml-4 shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-red-500/50 hover:text-red-300 disabled:opacity-40"
                    >
                      Close
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
