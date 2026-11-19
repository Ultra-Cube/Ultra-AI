// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Sidecar readiness probes (P1C). Liveness/readiness checks for the
 * automation engines and model gateways the platform supervises.
 * Zero-dep, native fetch.
 */

export interface ProbeResult {
  id: string;
  ok: boolean;
  /** HTTP status observed, or 0 when the request never completed. */
  status: number;
  latencyMs: number;
  detail?: string;
}

export interface ProbeTarget {
  id: string;
  /** Full URL to probe, e.g. 'http://localhost:7860/health'. */
  url: string;
  /** Accept any non-5xx status as 'ok' (endpoints that 401 without auth). */
  acceptUnauthorized?: boolean;
  timeoutMs?: number;
}

export interface ProbeOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Probes a single target. `ok` is true for 2xx, or for 401/403 when
 * `acceptUnauthorized` is set (server is alive but needs credentials).
 */
export async function probeTarget(
  target: ProbeTarget,
  opts: ProbeOptions = {}
): Promise<ProbeResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => Date.now());
  const started = now();
  const timeoutMs = target.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  try {
    const res = await fetchImpl(target.url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: 'application/json, text/plain, */*' },
    });
    const latencyMs = now() - started;
    const ok =
      (res.status >= 200 && res.status < 300) ||
      (target.acceptUnauthorized === true &&
        (res.status === 401 || res.status === 403));
    return {
      id: target.id,
      ok,
      status: res.status,
      latencyMs,
      ...(ok ? {} : { detail: `HTTP ${res.status}` }),
    };
  } catch (err) {
    return {
      id: target.id,
      ok: false,
      status: 0,
      latencyMs: now() - started,
      detail: err instanceof Error ? err.message : 'probe failed',
    };
  }
}

export async function probeAll(
  targets: ProbeTarget[],
  opts: ProbeOptions = {}
): Promise<ProbeResult[]> {
  return Promise.all(targets.map((t) => probeTarget(t, opts)));
}

/**
 * Standard probe targets derived from engine-supervisor manifest defaults.
 * Kept here (not imported) so workflow-engine stays free of the supervisor
 * dependency; keep in sync with `ENGINE_PRESETS`.
 */
export function defaultWorkflowEngineProbes(
  overrides: Partial<Record<string, string>> = {}
): ProbeTarget[] {
  const base = (id: string, port: number, path: string) =>
    overrides[id] ?? `http://localhost:${port}${path}`;
  return [
    {
      id: 'langflow',
      url: base('langflow', 7860, '/health'),
      acceptUnauthorized: true,
    },
    {
      id: 'dify',
      url: base('dify', 5001, '/health'),
      acceptUnauthorized: true,
    },
    { id: 'n8n', url: base('n8n', 5678, '/healthz'), acceptUnauthorized: true },
    {
      id: 'openhands',
      url: base('openhands', 3300, '/health'),
      acceptUnauthorized: true,
    },
  ];
}
