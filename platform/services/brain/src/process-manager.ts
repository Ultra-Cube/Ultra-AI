import { spawn, type ChildProcess } from 'node:child_process';
import { request } from 'node:http';

import type { BrainConfig, BrainHealth, HermesEmbedMode } from './types';

export interface BrainManagerOptions {
  /** Command used to launch Hermes in the selected mode. */
  command?: string;
  /** Extra args appended after the mode flag. */
  args?: string[];
  /** Health probe URL for gateway/openai-compatible modes. */
  healthUrl?: string;
  /** Probe timeout ms. */
  probeTimeoutMs?: number;
}

const MODE_FLAGS: Record<HermesEmbedMode, string[]> = {
  gateway: ['gateway', 'serve'],
  'openai-compatible': ['serve', '--api', 'openai'],
  cli: ['run'],
};

export class BrainManager {
  private child: ChildProcess | null = null;
  private startedAt = 0;
  private lastError: string | undefined;
  private mode: HermesEmbedMode | undefined;

  constructor(
    private readonly config: BrainConfig,
    private readonly options: BrainManagerOptions = {}
  ) {}

  get state(): BrainHealth['state'] {
    if (!this.child) return this.lastError ? 'failed' : 'stopped';
    return this.child.exitCode === null && !this.child.killed
      ? 'running'
      : 'stopped';
  }

  /** Pick the first preferred mode whose prerequisites look satisfiable. */
  selectMode(): HermesEmbedMode {
    for (const mode of this.config.preferredModes) {
      if (mode === 'gateway' || mode === 'openai-compatible') return mode;
    }
    return 'cli';
  }

  start(mode?: HermesEmbedMode): BrainHealth {
    if (this.child && this.child.exitCode === null) {
      return this.health();
    }
    this.mode = mode ?? this.selectMode();
    const cmd = this.options.command ?? 'hermes';
    const args = [...(this.options.args ?? []), ...MODE_FLAGS[this.mode]];
    this.lastError = undefined;

    try {
      this.child = spawn(cmd, args, {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      this.startedAt = Date.now();
      this.child.on('error', (err) => {
        this.lastError = err.message;
      });
      this.child.on('exit', (code) => {
        if (code !== 0 && code !== null)
          this.lastError = `hermes exited with code ${code}`;
      });
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      return this.health();
    }
    return this.health();
  }

  stop(): void {
    if (this.child && this.child.exitCode === null) {
      this.child.kill('SIGTERM');
    }
    this.child = null;
  }

  /** Synchronous-ish health snapshot; use probe() for live gateway checks. */
  health(): BrainHealth {
    return {
      state: this.state,
      pid: this.child?.pid,
      mode: this.mode,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : undefined,
      lastError: this.lastError,
      checkedAt: new Date().toISOString(),
    };
  }

  /** HTTP probe for gateway/openai-compatible modes. */
  probe(): Promise<BrainHealth> {
    const base = this.health();
    if (base.state !== 'running' || !this.options.healthUrl)
      return Promise.resolve(base);
    const url = new URL(this.options.healthUrl);
    return new Promise((resolve) => {
      const req = request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'GET',
          timeout: this.options.probeTimeoutMs ?? 2000,
        },
        (res) => {
          resolve({
            ...base,
            state:
              res.statusCode && res.statusCode < 500 ? 'running' : 'degraded',
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({
          ...base,
          state: 'degraded',
          lastError: 'health probe timed out',
        });
      });
      req.on('error', (err) =>
        resolve({ ...base, state: 'degraded', lastError: err.message })
      );
      req.end();
    });
  }
}
