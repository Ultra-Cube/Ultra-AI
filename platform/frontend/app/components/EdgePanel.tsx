'use client';

import { useCallback, useEffect, useState } from 'react';

interface EdgeRoute {
  name?: string;
  id?: string;
  locality?: string;
}

interface EdgeTrailEvent {
  type?: string;
  route?: string;
  locality?: string;
  at?: string;
  payload?: Record<string, unknown>;
}

interface EdgeRunResult {
  requestId?: string;
  locality?: string;
  route?: string;
  status?: string;
  response?: { answer?: string; status?: string };
  error?: string;
}

const localityBadge = (locality?: string) => {
  if (locality === 'local')
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (locality === 'network')
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
};

export default function EdgePanel() {
  const [status, setStatus] = useState<{ connected: boolean; routes?: EdgeRoute[] }>({
    connected: false,
  });
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EdgeRunResult | null>(null);
  const [trail, setTrail] = useState<EdgeTrailEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        fetch('/api/zeroai/edge/status').then((r) => r.json()),
        fetch('/api/zeroai/edge/trails').then((r) => r.json()),
      ]);
      setStatus({ connected: !!s.connected, routes: s.routes });
      setTrail(Array.isArray(t.trails) ? t.trails : []);
    } catch {
      setStatus({ connected: false });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const run = async () => {
    const text = prompt.trim();
    if (!text || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/zeroai/edge/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setResult(data as EdgeRunResult);
        setPrompt('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request failed');
    } finally {
      setRunning(false);
      refresh();
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          ZeroAI Edge — local-first execution
        </h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            status.connected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
          }`}
        >
          {status.connected ? 'bridge online' : 'bridge offline'}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(status.routes ?? []).map((r) => (
          <span
            key={r.name ?? r.id}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
          >
            {r.name ?? r.id}
            {r.locality ? ` · ${r.locality}` : ''}
          </span>
        ))}
        {!status.routes?.length && (
          <span className="text-[10px] text-slate-500">
            routes unavailable while bridge is offline
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="Ask ZeroAI — executes locally first, escalates only when needed"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/40 focus:outline-none"
          disabled={running}
        />
        <button
          onClick={run}
          disabled={running || !prompt.trim()}
          className="rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider">
            <span
              className={`rounded-full border px-2 py-0.5 font-medium ${localityBadge(result.locality)}`}
            >
              {result.locality ?? 'unknown'}
            </span>
            <span className="text-slate-400">{result.route ?? '—'}</span>
            <span className="text-slate-500">{result.requestId}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-200">
            {result.response?.answer ?? '(no answer)'}
          </p>
        </div>
      )}

      {trail.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Execution trail
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {[...trail].reverse().slice(0, 20).map((ev, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1 text-[11px] text-slate-400"
              >
                <span className="shrink-0 font-mono text-slate-500">
                  {ev.type ?? 'event'}
                </span>
                {ev.route && <span className="text-slate-500">→ {ev.route}</span>}
                {ev.locality && (
                  <span
                    className={`rounded border px-1 text-[9px] uppercase ${localityBadge(ev.locality)}`}
                  >
                    {ev.locality}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
