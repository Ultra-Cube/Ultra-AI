// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

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

const STATUS_BADGE: Record<string, string> = {
  idle: 'ok',
  running: 'info',
  paused: 'warn',
  error: 'err',
  stopped: 'off',
  unknown: 'off',
};

const STATUS_DOT: Record<string, string> = {
  idle: 'ok',
  running: 'info',
  paused: 'warn',
  error: 'err',
  stopped: '',
  unknown: '',
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
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Workspace</h1>
          <p className="muted">
            Embedded OpenHands sessions — agentic coding workspaces
          </p>
        </div>
        <div className="uai-status">
          <span className={`uai-dot2 ${reachable ? 'ok' : 'err'}`} />
          <span>
            {reachable
              ? `sidecar ${state?.health.baseUrl ?? ''}`
              : 'sidecar offline'}
          </span>
        </div>
      </header>

      {!state ? (
        <p className="muted">Loading…</p>
      ) : !state.connected ? (
        <div className="uai-note warn">
          Desktop bridge offline — workspace sessions unavailable. Start the
          desktop bridge and the OpenHands sidecar to manage workspaces.
        </div>
      ) : (
        <>
          <section className="card" style={{ marginBottom: 20 }}>
            <h2 className="svc-group-title">Open workspace</h2>
            <div className="uai-toolbar" style={{ alignItems: 'stretch' }}>
              <input
                className="uai-input mono"
                style={{ flex: 1, minWidth: 220 }}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/absolute/path/to/project"
              />
              <input
                className="uai-input"
                style={{ width: 220 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <button
                className="btn primary"
                onClick={() => void openSession()}
                disabled={busy || !path.trim()}
              >
                Open
              </button>
            </div>
            {error && <p style={{ color: '#e5534b', marginTop: 10 }}>{error}</p>}
          </section>

          <section className="card" style={{ marginBottom: 20 }}>
            <div className="uai-toolbar" style={{ justifyContent: 'space-between' }}>
              <h2 className="svc-group-title" style={{ margin: 0 }}>
                Engines
              </h2>
              <Link className="ghost-link" href="/services">
                Services &amp; Engines →
              </Link>
            </div>
            {engines.length === 0 ? (
              <p className="muted small">No engines registered.</p>
            ) : (
              <div className="grid">
                {engines.map((e) => (
                  <div key={e.id} className="uai-row">
                    <div style={{ minWidth: 0 }}>
                      <div className="small" style={{ fontWeight: 600 }}>
                        {e.label}
                      </div>
                      <div className="muted small mono">
                        {e.category}
                        {e.port ? ` · :${e.port}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${e.up ? 'ok' : 'off'}`}>
                      {e.up ? 'up' : 'down'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="svc-group-title">
              Sessions ({state.sessions.length})
            </h2>
            {state.sessions.length === 0 ? (
              <div className="uai-empty">
                No workspace sessions. Open one above to start an agentic
                coding session.
              </div>
            ) : (
              <div>
                {state.sessions.map((s) => (
                  <div key={s.id} className="uai-row">
                    <div style={{ minWidth: 0 }}>
                      <div className="uai-toolbar" style={{ gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>
                          {s.title ?? s.workspacePath}
                        </span>
                        <span className={`badge ${STATUS_BADGE[s.status] ?? 'off'}`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="muted small mono" style={{ marginTop: 4 }}>
                        {s.workspacePath} · {s.agent} · {s.id}
                      </div>
                      {s.lastError && (
                        <div className="small" style={{ color: '#e5534b', marginTop: 4 }}>
                          {s.lastError}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn secondary"
                      onClick={() => void closeSession(s.id)}
                      disabled={busy}
                    >
                      Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
