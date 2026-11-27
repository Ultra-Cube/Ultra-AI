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

import { useState, useEffect, useCallback } from 'react';

interface Provider {
  id: string;
  name: string;
  type: 'oauth' | 'api-key' | 'compatible';
  endpoint: string;
  models: string[];
  status: 'active' | 'inactive' | 'error';
}

const statusBadge = (status: string) => {
  if (status === 'active')
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  if (status === 'error')
    return 'bg-red-500/15 text-red-300 border-red-500/40';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
};

export default function GatewayProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [routerStatus, setRouterStatus] = useState<
    'online' | 'offline' | 'loading'
  >('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    type: 'api-key',
    endpoint: '',
    models: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProviders = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/gateway/providers', {
        cache: 'no-store',
      });
      const data = await response.json();
      if (response.ok) {
        setProviders(data.providers || []);
      } else {
        setError(data.error || `Gateway error (${response.status})`);
        setProviders([]);
      }
    } catch {
      setError('Gateway unreachable');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRouterStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/gateway/health', {
        cache: 'no-store',
      });
      const data = await response.json();
      setRouterStatus(data.status === 'ok' ? 'online' : 'offline');
    } catch {
      setRouterStatus('offline');
    }
  }, []);

  useEffect(() => {
    fetchProviders();
    checkRouterStatus();
    const interval = setInterval(checkRouterStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchProviders, checkRouterStatus]);

  const submitProvider = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/gateway/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          type: addForm.type,
          endpoint: addForm.endpoint,
          models: addForm.models
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || `Failed to add provider (${response.status})`);
        return;
      }
      setShowAdd(false);
      setAddForm({ name: '', type: 'api-key', endpoint: '', models: '' });
      fetchProviders();
    } catch {
      setError('Gateway unreachable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              AI Gateway
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Provider routing status and configuration
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              routerStatus === 'online'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : routerStatus === 'loading'
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-red-500/40 bg-red-500/15 text-red-300'
            }`}
          >
            {routerStatus === 'online'
              ? '● Router online'
              : routerStatus === 'loading'
                ? '● Checking…'
                : '● Router offline — local routing'}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-100">
              Configured Providers
            </h2>
            <div className="flex gap-2">
              <button
                onClick={fetchProviders}
                className="rounded-lg border border-slate-600/60 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowAdd((v) => !v)}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
              >
                {showAdd ? 'Cancel' : 'Add Provider'}
              </button>
            </div>
          </div>

          {showAdd && (
            <div className="mb-5 grid gap-3 rounded-lg border border-slate-700/60 bg-slate-900/80 p-4 sm:grid-cols-2">
              <input
                placeholder="Provider name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500"
              />
              <select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, type: e.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500"
              >
                <option value="api-key">API Key</option>
                <option value="oauth">OAuth</option>
                <option value="compatible">Compatible</option>
              </select>
              <input
                placeholder="Endpoint URL"
                value={addForm.endpoint}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, endpoint: e.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500 sm:col-span-2"
              />
              <input
                placeholder="Models (comma-separated)"
                value={addForm.models}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, models: e.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500 sm:col-span-2"
              />
              <button
                onClick={submitProvider}
                disabled={saving || !addForm.name || !addForm.endpoint}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40 sm:col-span-2"
              >
                {saving ? 'Saving…' : 'Save Provider'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading providers…
            </div>
          ) : providers.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {error
                ? 'No providers could be loaded.'
                : 'No providers configured. Add one to get started.'}
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-start justify-between rounded-lg border border-slate-700/60 bg-slate-900/80 p-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-100">
                      {provider.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {provider.type} ·{' '}
                      <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px]">
                        {provider.endpoint}
                      </code>
                    </p>
                    {provider.models?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {provider.models.map((model) => (
                          <span
                            key={model}
                            className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`ml-4 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(provider.status)}`}
                  >
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
