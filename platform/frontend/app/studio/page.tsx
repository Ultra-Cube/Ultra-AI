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

const ENGINE_ID = 'openvscode-server';
const DEFAULT_PORT = 8443;

interface EngineStatus {
  id: string;
  state: string;
  healthOk: boolean;
  lastError?: string;
  startedAt?: string;
  manifest?: { port?: number };
}

interface EnginesResponse {
  connected: boolean;
  engines: EngineStatus[];
  statuses?: EngineStatus[];
}

export default function StudioPage() {
  const [engines, setEngines] = useState<EngineStatus[] | null>(null);
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/control-center/engines', {
        cache: 'no-store',
      });
      const data = (await res.json()) as EnginesResponse;
      setEngines(data.statuses ?? data.engines ?? []);
      setConnected(data.connected !== false);
      setError(null);
    } catch {
      setConnected(false);
      setEngines([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const engine = engines?.find((e) => e.id === ENGINE_ID);
  const port = engine?.manifest?.port ?? DEFAULT_PORT;
  const healthy = engine?.healthOk === true && engine.state === 'running';

  const runAction = async (action: 'start' | 'stop') => {
    if (
      action === 'stop' &&
      !window.confirm('Stop Ultra Studio? Active editor sessions will close.')
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/control-center/engines/${ENGINE_ID}/${action}`,
        { method: 'POST' }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `${action} failed (${res.status})`);
      }
    } catch {
      setError('core-api unreachable');
    } finally {
      setBusy(false);
      setTimeout(() => void refresh(), 1500);
    }
  };

  return (
    <div className="page uai-fill">
      <header className="page-head">
        <div>
          <h1>Ultra Studio</h1>
          <p className="muted">
            Code-OSS / Open VS Code — Open VSX extensions only
          </p>
        </div>
        <div className="uai-toolbar">
          {!connected && <span className="badge warn">supervisor offline</span>}
          {engine && (
            <span className={`badge ${healthy ? 'ok' : 'off'}`}>
              {engine.state}
            </span>
          )}
          {engine && !healthy && (
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => void runAction('start')}
            >
              {busy ? 'Starting…' : 'Start'}
            </button>
          )}
          {healthy && (
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => void runAction('stop')}
            >
              {busy ? 'Stopping…' : 'Stop'}
            </button>
          )}
        </div>
      </header>

      {error && <div className="uai-note err">{error}</div>}
      {engine?.lastError && !healthy && (
        <div className="uai-note warn">{engine.lastError}</div>
      )}

      {engine && (
        <div className="uai-row" style={{ marginBottom: 12 }}>
          <span className={`dot ${healthy ? 'up' : 'down'}`} />
          <div style={{ flex: 1 }}>
            <div className="small" style={{ fontWeight: 600 }}>
              {ENGINE_ID}
            </div>
            <div className="muted small mono">
              :{port}
              {engine.startedAt
                ? ` · up since ${new Date(engine.startedAt).toLocaleTimeString()}`
                : ''}
              {' · Code-OSS · Open VSX'}
            </div>
          </div>
          <span className={`badge ${healthy ? 'ok' : 'off'}`}>
            {engine.state}
          </span>
        </div>
      )}

      <div className="uai-frame-wrap">
        {healthy ? (
          <iframe
            src={`http://127.0.0.1:${port}/`}
            title="Ultra Studio"
            className="uai-frame-fill"
          />
        ) : (
          <div className="uai-empty" style={{ height: '100%' }}>
            <h2 style={{ marginTop: 0 }}>
              {connected ? 'Ultra Studio is not running' : 'Supervisor offline'}
            </h2>
            <p className="muted">
              {connected
                ? 'Start the openvscode-server sidecar to open the embedded IDE. Extensions load from Open VSX only — no Microsoft Marketplace.'
                : 'The desktop bridge is not reachable. Launch the desktop shell or check that core-api is running.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
