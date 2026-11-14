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
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold">Ultra Studio</h1>
          <p className="text-xs text-zinc-500">
            Code-OSS / Open VS Code — Open VSX extensions only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <span className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
              supervisor offline
            </span>
          )}
          {engine && (
            <span
              className={`rounded px-2 py-1 text-xs ${
                healthy
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {engine.state}
            </span>
          )}
          {engine && !healthy && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction('start')}
              className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {busy ? 'Starting…' : 'Start'}
            </button>
          )}
          {healthy && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction('stop')}
              className="rounded bg-red-600/80 px-3 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {busy ? 'Stopping…' : 'Stop'}
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="border-b border-red-900/50 bg-red-950/40 px-6 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {engine?.lastError && !healthy && (
        <div className="border-b border-amber-900/50 bg-amber-950/30 px-6 py-2 text-sm text-amber-300">
          {engine.lastError}
        </div>
      )}

      <div className="relative flex-1">
        {healthy ? (
          <iframe
            src={`http://127.0.0.1:${port}/`}
            title="Ultra Studio"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <h2 className="text-base font-medium text-zinc-300">
                {connected
                  ? 'Ultra Studio is not running'
                  : 'Supervisor offline'}
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                {connected
                  ? 'Start the openvscode-server sidecar to open the embedded IDE. Extensions load from Open VSX only — no Microsoft Marketplace.'
                  : 'The desktop bridge is not reachable. Launch the desktop shell or check that core-api is running.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
