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

import {
  OpenWorkspaceRequest,
  WorkspaceError,
  WorkspaceHealth,
  WorkspacePort,
  WorkspaceResult,
  WorkspaceSession,
  WorkspaceStatus,
} from './types';

export interface OpenHandsClientOptions {
  /** Base URL of the OpenHands sidecar (default http://127.0.0.1:3300). */
  baseUrl?: string;
  /** Per-request timeout in ms (default 10000). */
  timeoutMs?: number;
  /** Fetch implementation (injectable for tests). */
  fetchImpl?: typeof fetch;
}

interface RawConversation {
  conversation_id?: string;
  id?: string;
  title?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  workspace?: { working_dir?: string };
  error?: string | null;
}

function mapStatus(raw: string | undefined): WorkspaceStatus {
  switch ((raw ?? '').toLowerCase()) {
    case 'running':
    case 'active':
    case 'working':
      return 'running';
    case 'paused':
      return 'paused';
    case 'error':
    case 'failed':
      return 'error';
    case 'stopped':
    case 'closed':
    case 'completed':
      return 'stopped';
    case 'idle':
      return 'idle';
    default:
      return 'unknown';
  }
}

function toSession(raw: RawConversation): WorkspaceSession | null {
  const id = raw.conversation_id ?? raw.id;
  if (!id) return null;
  return {
    id,
    workspacePath: raw.workspace?.working_dir ?? '',
    title: raw.title,
    status: mapStatus(raw.status),
    agent: 'openhands',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    lastError: raw.error ?? undefined,
  };
}

/**
 * Default `WorkspacePort`: talks to the OpenHands sidecar REST API
 * (`openhands serve`, port 3300, override via OPENHANDS_PORT in the
 * engine-supervisor manifest).
 *
 * Endpoints used (OpenHands REST surface):
 *   GET  /api/health                 — sidecar liveness
 *   GET  /api/conversations          — list sessions
 *   POST /api/conversations          — create session {workspace, title, ...}
 *   GET  /api/conversations/{id}     — session detail
 *   DELETE /api/conversations/{id}   — close session
 */
export class OpenHandsWorkspaceClient implements WorkspacePort {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: OpenHandsClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? 'http://127.0.0.1:3300').replace(
      /\/+$/,
      ''
    );
    this.timeoutMs = opts.timeoutMs ?? 10000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ status: number; data: T }> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      let data: T | undefined;
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text) as T;
        } catch {
          data = undefined;
        }
      }
      return { status: res.status, data: data as T };
    } catch (err) {
      throw new WorkspaceError(
        err instanceof Error ? err.message : String(err),
        'unreachable'
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<WorkspaceHealth> {
    try {
      const { status, data } = await this.request<Record<string, unknown>>(
        'GET',
        '/api/health'
      );
      if (status >= 500) {
        return { reachable: false, baseUrl: this.baseUrl };
      }
      const health = data as Record<string, unknown> | undefined;
      return {
        reachable: true,
        baseUrl: this.baseUrl,
        version:
          typeof health?.version === 'string' ? health.version : undefined,
      };
    } catch {
      return { reachable: false, baseUrl: this.baseUrl };
    }
  }

  async listSessions(): Promise<WorkspaceSession[]> {
    const { status, data } = await this.request<
      RawConversation[] | { conversations?: RawConversation[] }
    >('GET', '/api/conversations');
    if (status === 404) return []; // older sidecar without the endpoint
    if (status >= 400) {
      throw new WorkspaceError(
        `list failed: HTTP ${status}`,
        'bad_request',
        status
      );
    }
    const list = Array.isArray(data) ? data : (data?.conversations ?? []);
    return list.map(toSession).filter((s): s is WorkspaceSession => s !== null);
  }

  async openSession(req: OpenWorkspaceRequest): Promise<WorkspaceResult> {
    if (!req.workspacePath) {
      return { ok: false, error: 'workspacePath is required' };
    }
    try {
      const { status, data } = await this.request<RawConversation>(
        'POST',
        '/api/conversations',
        {
          workspace: { working_dir: req.workspacePath },
          ...(req.title ? { title: req.title } : {}),
          ...(req.initialTask ? { initial_task: req.initialTask } : {}),
        }
      );
      if (status >= 400) {
        return { ok: false, error: `open failed: HTTP ${status}` };
      }
      const session = toSession(data ?? {});
      if (!session) {
        return { ok: false, error: 'sidecar returned no session id' };
      }
      return { ok: true, session };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof WorkspaceError ? err.message : String(err),
      };
    }
  }

  async getSession(id: string): Promise<WorkspaceSession | null> {
    try {
      const { status, data } = await this.request<RawConversation>(
        'GET',
        `/api/conversations/${encodeURIComponent(id)}`
      );
      if (status === 404) return null;
      if (status >= 400) {
        throw new WorkspaceError(
          `get failed: HTTP ${status}`,
          'bad_request',
          status
        );
      }
      return toSession(data ?? {});
    } catch (err) {
      if (err instanceof WorkspaceError && err.code === 'not_found') {
        return null;
      }
      throw err;
    }
  }

  async closeSession(id: string): Promise<WorkspaceResult> {
    try {
      const { status } = await this.request(
        'DELETE',
        `/api/conversations/${encodeURIComponent(id)}`
      );
      if (status === 404) {
        return { ok: false, error: `session ${id} not found` };
      }
      if (status >= 400) {
        return { ok: false, error: `close failed: HTTP ${status}` };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof WorkspaceError ? err.message : String(err),
      };
    }
  }
}
