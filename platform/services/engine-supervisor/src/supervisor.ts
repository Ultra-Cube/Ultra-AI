import { spawn } from 'node:child_process';
import net from 'node:net';

import type {
  EngineManifest,
  EngineStatus,
  FetchLike,
  ProcessRunner,
  SpawnedProcess,
} from './types';

const defaultRunner: ProcessRunner = (command, args, options) =>
  spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }) as unknown as SpawnedProcess;

const defaultFetch: FetchLike = (url, init) =>
  fetch(url, init).then((r) => ({ ok: r.ok, status: r.status }));

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function probeTcp(port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.on('connect', () => done(true));
    socket.on('error', () => done(false));
  });
}

export interface SupervisorOptions {
  runner?: ProcessRunner;
  fetchImpl?: FetchLike;
  healthIntervalMs?: number;
  healthTimeoutMs?: number;
  /** Called on every status change (for bridge/UI fan-out). */
  onStatus?: (status: EngineStatus) => void;
}

/**
 * Runtime supervisor for embedded engine sidecars.
 * Manages lifecycle (start/stop/restart), health probing, and exposes
 * a read-only status surface for bridges and the control center.
 */
export class EngineSupervisor {
  private engines = new Map<string, EngineManifest>();
  private procs = new Map<string, SpawnedProcess>();
  private statuses = new Map<string, EngineStatus>();
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly runner: ProcessRunner;
  private readonly fetchImpl: FetchLike;
  private readonly healthIntervalMs: number;
  private readonly healthTimeoutMs: number;
  private readonly onStatus?: (s: EngineStatus) => void;

  constructor(manifests: EngineManifest[], opts: SupervisorOptions = {}) {
    for (const m of manifests) {
      this.engines.set(m.id, m);
      this.statuses.set(m.id, {
        id: m.id,
        label: m.label,
        state: 'stopped',
        port: m.port,
        healthOk: false,
        manifest: m,
      });
    }
    this.runner = opts.runner ?? defaultRunner;
    this.fetchImpl = opts.fetchImpl ?? defaultFetch;
    this.healthIntervalMs = opts.healthIntervalMs ?? 5000;
    this.healthTimeoutMs = opts.healthTimeoutMs ?? 3000;
    this.onStatus = opts.onStatus;
  }

  listManifests(): EngineManifest[] {
    return [...this.engines.values()];
  }

  status(id: string): EngineStatus | undefined {
    return this.statuses.get(id);
  }

  listStatus(): EngineStatus[] {
    return [...this.statuses.values()];
  }

  private setStatus(id: string, patch: Partial<EngineStatus>): EngineStatus {
    const prev = this.statuses.get(id)!;
    const next: EngineStatus = { ...prev, ...patch, manifest: prev.manifest };
    this.statuses.set(id, next);
    this.onStatus?.(next);
    return next;
  }

  private effectivePort(m: EngineManifest): number {
    if (m.portEnvVar && process.env[m.portEnvVar]) {
      const n = Number(process.env[m.portEnvVar]);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return m.port;
  }

  async probe(id: string): Promise<EngineStatus> {
    const m = this.engines.get(id);
    if (!m) throw new Error(`unknown engine: ${id}`);
    const st = this.statuses.get(id)!;
    const port = this.effectivePort(m);
    const started = Date.now();
    let ok = false;
    try {
      if (m.probe === 'tcp' || !m.healthPath) {
        ok = await probeTcp(port, this.healthTimeoutMs);
      } else {
        const scheme = m.command === 'docker' ? 'http' : 'http';
        const url = `${scheme}://127.0.0.1:${port}${m.healthPath}`;
        const res = await this.fetchImpl(url, {
          signal: AbortSignal.timeout(this.healthTimeoutMs),
        });
        ok = res.ok || (res.status >= 400 && res.status < 500);
      }
    } catch {
      ok = false;
    }
    const latencyMs = Date.now() - started;
    let state = st.state;
    if (ok && st.state !== 'stopped' && st.state !== 'stopping')
      state = 'running';
    else if (!ok && st.state === 'running') state = 'degraded';
    return this.setStatus(id, {
      port,
      state,
      healthOk: ok,
      latencyMs,
      url: m.healthPath ? `http://127.0.0.1:${port}` : undefined,
      lastError: ok ? undefined : 'health probe failed',
    });
  }

  async start(id: string): Promise<EngineStatus> {
    const m = this.engines.get(id);
    if (!m) throw new Error(`unknown engine: ${id}`);
    const cur = this.statuses.get(id)!;
    if (cur.state === 'running' || cur.state === 'starting') return cur;
    if (m.managed === false) {
      return this.setStatus(id, {
        state: 'stopped',
        lastError: 'manifest is not supervisor-managed (external command)',
      });
    }
    const missing = (m.requiredEnv ?? []).filter((k) => !process.env[k]);
    if (missing.length) {
      return this.setStatus(id, {
        state: 'failed',
        lastError: `missing env: ${missing.join(', ')}`,
      });
    }
    this.setStatus(id, { state: 'starting', lastError: undefined });
    try {
      const proc = this.runner(m.command, m.args ?? [], {
        cwd: m.cwd,
        env: m.env,
      });
      this.procs.set(id, proc);
      proc.onExit((code, signal) => {
        this.procs.delete(id);
        this.clearTimer(id);
        this.setStatus(id, {
          state: code === 0 ? 'stopped' : 'failed',
          pid: undefined,
          lastError: signal
            ? `killed by ${signal}`
            : code !== 0
              ? `exit code ${code}`
              : undefined,
        });
      });
      const port = this.effectivePort(m);
      this.setStatus(id, { pid: proc.pid, port, state: 'starting' });
      await this.waitHealthy(id, m.startupTimeoutMs ?? 30000);
      return this.statuses.get(id)!;
    } catch (err) {
      return this.setStatus(id, {
        state: 'failed',
        lastError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async waitHealthy(id: string, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const st = await this.probe(id);
      if (st.healthOk) {
        this.setStatus(id, { state: 'running' });
        this.startTimer(id);
        return;
      }
      const proc = this.procs.get(id);
      if (!proc && this.statuses.get(id)!.state !== 'starting') return;
      await sleep(500);
    }
    const proc = this.procs.get(id);
    if (proc) {
      proc.kill('SIGKILL');
      this.procs.delete(id);
    }
    this.setStatus(id, {
      state: 'failed',
      lastError: 'startup health timeout',
    });
  }

  private startTimer(id: string): void {
    this.clearTimer(id);
    const t = setInterval(() => void this.probe(id), this.healthIntervalMs);
    t.unref?.();
    this.timers.set(id, t);
  }

  private clearTimer(id: string): void {
    const t = this.timers.get(id);
    if (t) clearInterval(t);
    this.timers.delete(id);
  }

  async stop(id: string): Promise<EngineStatus> {
    const m = this.engines.get(id);
    if (!m) throw new Error(`unknown engine: ${id}`);
    const cur = this.statuses.get(id)!;
    if (cur.state === 'stopped') return cur;
    this.setStatus(id, { state: 'stopping' });
    this.clearTimer(id);
    const proc = this.procs.get(id);
    if (!proc) {
      return this.setStatus(id, { state: 'stopped', pid: undefined });
    }
    proc.kill('SIGTERM');
    const deadline = Date.now() + (m.shutdownTimeoutMs ?? 10000);
    while (Date.now() < deadline) {
      if (!this.procs.has(id)) {
        return this.statuses.get(id)!;
      }
      await sleep(200);
    }
    if (this.procs.has(id)) {
      proc.kill('SIGKILL');
      this.procs.delete(id);
    }
    return this.setStatus(id, { state: 'stopped', pid: undefined });
  }

  async restart(id: string): Promise<EngineStatus> {
    await this.stop(id);
    return this.start(id);
  }

  /** Probe all engines once; returns current statuses. */
  async probeAll(): Promise<EngineStatus[]> {
    await Promise.all([...this.engines.keys()].map((id) => this.probe(id)));
    return this.listStatus();
  }

  async stopAll(): Promise<void> {
    await Promise.all([...this.procs.keys()].map((id) => this.stop(id)));
  }

  shutdown(): void {
    for (const id of this.timers.keys()) this.clearTimer(id);
  }
}
