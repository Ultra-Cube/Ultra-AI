/** Lifecycle states for a supervised engine sidecar. */
export type EngineState =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'degraded'
  | 'failed'
  | 'stopping';

/** Static description of an engine the supervisor can manage. */
export interface EngineManifest {
  /** Stable id used by callers (e.g. 'openhands', 'ollama'). */
  id: string;
  /** Human label for UI surfaces. */
  label: string;
  /** Executable to spawn. */
  command: string;
  /** Arguments passed to the executable. */
  args?: string[];
  /** Working directory for the child process. */
  cwd?: string;
  /** Extra environment merged over process.env. */
  env?: Record<string, string>;
  /** TCP port the engine listens on (after any override). */
  port: number;
  /** Env var name that can override `port` at spawn time. */
  portEnvVar?: string;
  /** HTTP path probed for health, e.g. '/health' or '/api/health'. */
  healthPath?: string;
  /** Optional 'tcp' probe when there is no HTTP health endpoint. */
  probe?: 'http' | 'tcp';
  /** Max ms to wait for health after spawn before declaring failure. */
  startupTimeoutMs?: number;
  /** Max ms to wait for graceful exit before SIGKILL on stop. */
  shutdownTimeoutMs?: number;
  /** Required env vars; start() fails fast when any is missing. */
  requiredEnv?: string[];
  /** Optional upstream commit/license note surfaced in diagnostics. */
  licenseNote?: string;
  /** Whether the manifest may be started by the supervisor. */
  managed?: boolean;
}

/** Runtime view of a managed engine. */
export interface EngineStatus {
  id: string;
  label: string;
  state: EngineState;
  port: number;
  pid?: number;
  url?: string;
  healthOk: boolean;
  latencyMs?: number;
  lastError?: string;
  startedAt?: string;
  manifest: EngineManifest;
}

/** Injected process factory so tests can run without real spawns. */
export interface SpawnedProcess {
  pid?: number;
  kill(signal?: string): boolean;
  onExit(cb: (code: number | null, signal: string | null) => void): void;
  stdout?: { on(event: 'data', cb: (chunk: Buffer | string) => void): void };
  stderr?: { on(event: 'data', cb: (chunk: Buffer | string) => void): void };
}

export type ProcessRunner = (
  command: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> }
) => SpawnedProcess;

/** Injectable fetch for health probes (defaults to global fetch). */
export type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number }>;
