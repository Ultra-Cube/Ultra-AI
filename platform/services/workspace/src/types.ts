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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Embedded workspace contract (P2-06, G-2.2 Option 1).
 *
 * The desktop shell embeds OpenHands (agentic coding workspace, MIT core —
 * `enterprise/` excluded) as the Devin-like dev surface. This package is the
 * zero-dependency client contract the shell/bridge uses to manage workspace
 * sessions over OpenHands' REST API.
 */

/** Lifecycle of a workspace session as reported by the sidecar. */
export type WorkspaceStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'error'
  | 'stopped'
  | 'unknown';

/** A single agentic coding session bound to a project workspace directory. */
export interface WorkspaceSession {
  /** Sidecar-assigned conversation/session id. */
  id: string;
  /** Absolute path of the project workspace on disk. */
  workspacePath: string;
  /** Human label shown in the shell (defaults to the dir basename). */
  title?: string;
  status: WorkspaceStatus;
  /** Agent/backend driving the session (e.g. 'openhands', 'hermes'). */
  agent: string;
  createdAt: string;
  updatedAt: string;
  /** Last error message when status === 'error'. */
  lastError?: string;
}

/** Request to open (or resume) a workspace session. */
export interface OpenWorkspaceRequest {
  workspacePath: string;
  title?: string;
  /** Optional initial instruction/brief for the agent. */
  initialTask?: string;
  /** Agent backend to bind; defaults to 'openhands'. */
  agent?: string;
}

/** Result of a session operation. */
export interface WorkspaceResult {
  ok: boolean;
  session?: WorkspaceSession;
  error?: string;
}

/** Health of the embedded workspace sidecar. */
export interface WorkspaceHealth {
  reachable: boolean;
  /** Base URL the client talks to, e.g. http://127.0.0.1:3300 */
  baseUrl: string;
  version?: string;
  /** Sessions currently known to the sidecar. */
  sessionCount?: number;
}

/**
 * Port the shell implements to reach the OpenHands sidecar.
 * Default implementation: `OpenHandsWorkspaceClient` (fetch over REST).
 */
export interface WorkspacePort {
  health(): Promise<WorkspaceHealth>;
  listSessions(): Promise<WorkspaceSession[]>;
  openSession(req: OpenWorkspaceRequest): Promise<WorkspaceResult>;
  getSession(id: string): Promise<WorkspaceSession | null>;
  closeSession(id: string): Promise<WorkspaceResult>;
}

/** Raised when a workspace operation fails at the transport level. */
export class WorkspaceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'unreachable'
      | 'not_found'
      | 'bad_request'
      | 'unknown',
    public readonly status?: number
  ) {
    super(message);
    this.name = 'WorkspaceError';
  }
}
