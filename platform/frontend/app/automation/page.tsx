'use client';

import { useEffect, useState } from 'react';

interface Workflow {
  id: string;
  name?: string;
  description?: string;
  status?: string;
}

interface RunResult {
  status?: string;
  route?: string;
  locality?: string;
  steps?: { name: string; ok: boolean; detail?: string }[];
  error?: string;
}

export default function AutomationHubPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [triggerInput, setTriggerInput] = useState('{}');
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/zeroai/workflows')
      .then((r) => (r.ok ? r.json() : { workflows: [] }))
      .then((d) => {
        const list = (d.workflows ?? d ?? []) as Workflow[];
        setWorkflows(Array.isArray(list) ? list : []);
      })
      .catch(() => setWorkflows([]));
  }, []);

  async function run() {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const input = JSON.parse(triggerInput || '{}') as Record<string, unknown>;
      const res = await fetch(
        `/api/zeroai/workflows/${encodeURIComponent(selected)}/run`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(data as RunResult);
    } catch (e) {
      setError(`Invalid JSON or request failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Automation Hub</h1>
            <p className="text-sm text-slate-400">
              Trigger and inspect ZeroAI workflows
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-400">Workflow</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Select a workflow…</option>
              {workflows.map((w) => (
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
              value={triggerInput}
              onChange={(e) => setTriggerInput(e.target.value)}
            />
          </label>

          <button
            onClick={() => void run()}
            disabled={!selected || busy}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'Running…' : 'Run workflow'}
          </button>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>

        {result ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`px-2 py-0.5 rounded border text-xs font-medium ${
                  result.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {result.status ?? 'unknown'}
              </span>
              {result.route ? (
                <span className="text-slate-400">
                  {result.route}
                  {result.locality ? ` · ${result.locality}` : ''}
                </span>
              ) : null}
            </div>
            {result.error ? (
              <p className="text-sm text-rose-400">{result.error}</p>
            ) : null}
            {Array.isArray(result.steps) && result.steps.length > 0 ? (
              <ol className="space-y-1 text-sm">
                {result.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className={s.ok ? 'text-emerald-400' : 'text-rose-400'}
                    >
                      {s.ok ? '✓' : '✗'}
                    </span>
                    <span>{s.name}</span>
                    {s.detail ? (
                      <span className="text-slate-500">— {s.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <pre className="text-xs text-slate-300 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
