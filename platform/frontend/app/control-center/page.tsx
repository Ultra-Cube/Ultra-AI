'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';

import type {
  MetricStats,
  NodeKind,
  SceneNode,
  ServiceNode,
} from '../../components/control-center/ControlCenterScene';

const ControlCenterScene = dynamic(
  () => import('../../components/control-center/ControlCenterScene'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-slate-400">
        Initializing 3D control center…
      </div>
    ),
  }
);

type EngineStatus = {
  id: string;
  label: string;
  state: string;
  port: number;
  healthOk: boolean;
  latencyMs?: number;
  lastError?: string;
};

type EnginesResponse = {
  connected: boolean;
  bridge: string;
  engines?: EngineStatus[];
  statuses?: EngineStatus[];
};

export default function ControlCenterPage() {
  const [stats, setStats] = useState<MetricStats | null>(null);
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [enginesConnected, setEnginesConnected] = useState<boolean | null>(
    null
  );
  const [selected, setSelected] = useState<SceneNode | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [engineBusy, setEngineBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [sRes, nRes, eRes] = await Promise.all([
        fetch('/api/control-center/system-stats', { cache: 'no-store' }),
        fetch('/api/control-center/nodes', { cache: 'no-store' }),
        fetch('/api/control-center/engines?probe=1', { cache: 'no-store' }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (nRes.ok) {
        const data = await nRes.json();
        setServices(data.nodes ?? []);
      }
      if (eRes.ok) {
        const data: EnginesResponse = await eRes.json();
        setEnginesConnected(data.connected);
        // probe-all returns `statuses`; plain list returns `engines`
        setEngines(data.statuses ?? data.engines ?? []);
      } else {
        setEnginesConnected(false);
      }
      setLastSync(new Date());
    } catch {
      // keep last known state on transient failures
    }
  }, []);

  // Sensitive engine lifecycle ops require explicit user confirmation.
  const runEngineAction = useCallback(
    async (id: string, action: 'start' | 'stop' | 'probe') => {
      const label = engines.find((e) => e.id === id)?.label ?? id;
      const verb = action === 'probe' ? 're-probe' : action;
      if (
        action !== 'probe' &&
        !window.confirm(`Confirm: ${verb} engine "${label}"?`)
      ) {
        return;
      }
      setEngineBusy(`${id}:${action}`);
      try {
        await fetch(
          `/api/control-center/engines/${encodeURIComponent(id)}/${action}`,
          { method: 'POST', cache: 'no-store' }
        );
      } finally {
        setEngineBusy(null);
        refresh();
      }
    },
    [engines, refresh]
  );

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  const upCount = services.filter((s) => s.status === 'up').length;
  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      <div className="absolute inset-0">
        <ControlCenterScene
          stats={stats}
          services={services}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      </div>

      {/* Header */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-5">
        <div>
          <h1 className="text-xl font-semibold tracking-wide text-slate-100">
            Ultra-AI Control Center
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {stats?.platform ?? '…'} · {stats?.cores ?? '–'} cores · uptime{' '}
            {stats ? fmtUptime(stats.uptime) : '–'}
            {lastSync && (
              <span className="ml-2 text-slate-500">
                synced {lastSync.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">
            {upCount}/{services.length || '–'} services up
          </span>
        </div>
      </header>

      {/* Metric cards */}
      <aside className="pointer-events-none absolute bottom-5 left-5 flex flex-col gap-2">
        {(['cpu', 'memory', 'disk'] as const).map((k) => {
          const v = stats?.[k] ?? 0;
          const color =
            v < 60
              ? 'text-emerald-300'
              : v < 85
                ? 'text-amber-300'
                : 'text-red-300';
          const label =
            k === 'cpu' ? 'CPU' : k === 'memory' ? 'Memory' : 'Disk';
          return (
            <button
              key={k}
              onClick={() => {
                const node: SceneNode = {
                  id: `metric-${k}`,
                  kind: k as NodeKind,
                  label,
                  value: v,
                  color: '#38bdf8',
                  detail: `${label} usage: ${v.toFixed(1)}%`,
                  position: [0, 1.6, -4.5],
                };
                setSelected(selected?.id === node.id ? null : node);
              }}
              className="pointer-events-auto w-44 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-left backdrop-blur transition hover:border-slate-500"
            >
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-slate-400">
                <span>{label}</span>
                <span className={color}>{v.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-700">
                <div
                  className={`h-full ${v < 60 ? 'bg-emerald-400' : v < 85 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, v)}%` }}
                />
              </div>
            </button>
          );
        })}
      </aside>

      {/* Service list */}
      <aside className="pointer-events-none absolute right-5 top-20 flex w-56 flex-col gap-1.5">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              const node: SceneNode = {
                id: `service-${s.id}`,
                kind: 'service',
                label: s.label,
                value: s.status === 'up' ? 100 : 0,
                color: s.status === 'up' ? '#60a5fa' : '#f87171',
                detail: `${s.label}: ${s.status.toUpperCase()} (${s.latencyMs}ms) — ${s.url}`,
                position: [0, -0.4, -2.6],
              };
              setSelected(selected?.id === node.id ? null : node);
            }}
            className="pointer-events-auto flex items-center justify-between rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-xs backdrop-blur hover:border-slate-500"
          >
            <span className="text-slate-300">{s.label}</span>
            <span
              className={
                s.status === 'up' ? 'text-emerald-400' : 'text-red-400'
              }
            >
              {s.status === 'up' ? `${s.latencyMs}ms` : 'DOWN'}
            </span>
          </button>
        ))}

        {enginesConnected === false && (
          <div className="mt-1 rounded-md border border-slate-700/40 bg-slate-900/50 px-3 py-1.5 text-[10px] text-slate-500">
            engine supervisor offline
          </div>
        )}
        {engines.map((e) => {
          const healthy = e.healthOk || e.state === 'running';
          return (
            <div
              key={e.id}
              className="pointer-events-auto flex items-center rounded-md border border-slate-700/60 bg-slate-900/80 text-xs backdrop-blur hover:border-slate-500"
            >
              <button
                onClick={() => {
                  const node: SceneNode = {
                    id: `engine-${e.id}`,
                    kind: 'service',
                    label: e.label,
                    value: healthy ? 100 : 0,
                    color: healthy ? '#34d399' : '#f87171',
                    detail: `${e.label}: ${e.state.toUpperCase()}${e.port ? ` :${e.port}` : ''}${e.lastError ? ` — ${e.lastError}` : ''}`,
                    position: [0, -0.4, -2.6],
                  };
                  setSelected(selected?.id === node.id ? null : node);
                }}
                className="flex flex-1 items-center justify-between px-3 py-1.5 text-left"
              >
                <span className="text-slate-300">{e.label}</span>
                <span
                  className={
                    healthy
                      ? e.state === 'running'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                      : e.state === 'degraded'
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }
                >
                  {e.state}
                </span>
              </button>
              <div className="flex gap-1 pr-2">
                <button
                  disabled={engineBusy === `${e.id}:start`}
                  onClick={() => runEngineAction(e.id, 'start')}
                  className="rounded border border-emerald-700/50 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-40"
                >
                  ▶
                </button>
                <button
                  disabled={engineBusy === `${e.id}:stop`}
                  onClick={() => runEngineAction(e.id, 'stop')}
                  className="rounded border border-red-700/50 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-900/30 disabled:opacity-40"
                >
                  ■
                </button>
                <button
                  disabled={engineBusy === `${e.id}:probe`}
                  onClick={() => runEngineAction(e.id, 'probe')}
                  className="rounded border border-slate-600/60 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700/40 disabled:opacity-40"
                >
                  ⟳
                </button>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Selected node detail */}
      {selected && (
        <div className="absolute bottom-5 right-5 w-80 rounded-lg border border-slate-600 bg-slate-900/90 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              {selected.label}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-slate-200"
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {selected.detail}
          </p>
          {selected.kind !== 'service' && (
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Load</span>
                <span>{selected.value.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-slate-700">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${Math.min(100, selected.value)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-slate-500">
        Drag to orbit · scroll to zoom · click a node for details
      </div>
    </div>
  );
}
