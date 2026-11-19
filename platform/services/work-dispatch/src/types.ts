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
 * Work-dispatch contract — ultra.work-dispatch.v1
 * (platform/api/contracts/work-dispatch/work-dispatch.v1.json)
 *
 * Readiness contract for distributing work across customers and
 * specialized agents. Sensitive tasks MUST pass an explicit
 * confirmation gate; `execution.locality` is always reported.
 * `signature` is readiness-only — no chain/crypto features.
 */

export type DispatchTarget =
  | 'local'
  | 'hermes'
  | 'openhands'
  | 'ultra-studio'
  | 'customer'
  | 'specialist-agent';

export type TaskKind = 'code' | 'research' | 'ops' | 'media' | 'custom';
export type Sensitivity = 'public' | 'internal' | 'sensitive';
export type Locality = 'local' | 'escalated';

export type DispatchStatus =
  | 'dispatched'
  | 'awaiting-confirmation'
  | 'denied'
  | 'completed'
  | 'failed';

export interface DispatchTask {
  id: string;
  kind: TaskKind;
  payload: Record<string, unknown>;
  sensitivity?: Sensitivity;
  requiresConfirmation?: boolean;
}

export interface DispatchRoute {
  target: DispatchTarget;
  agentId?: string;
  customerId?: string;
  priority?: number;
}

export interface DispatchExecution {
  locality: Locality;
  trailRef?: string;
  confirmedAt?: string;
}

export interface DispatchSignature {
  alg: 'Ed25519';
  keyId: string;
  value: string;
}

export interface WorkDispatch {
  dispatchId: string;
  task: DispatchTask;
  route: DispatchRoute;
  execution?: DispatchExecution;
  signature?: DispatchSignature;
}

export interface Confirmation {
  approved: boolean;
  confirmedBy?: string;
  scope?: string;
}

export interface DispatchRequest {
  task: Omit<DispatchTask, 'id'> & { id?: string };
  route: DispatchRoute;
  /** Caller-supplied confirmation; required for sensitive tasks. */
  confirmation?: Confirmation;
  dispatchId?: string;
}

export interface DispatchResult {
  dispatch: WorkDispatch;
  status: DispatchStatus;
  /** Why the dispatch ended in this state (UI-visible). */
  reason: string;
}

/** Port executed by the target. Injected per target id. */
export interface DispatchExecutor {
  execute(
    dispatch: WorkDispatch,
    deps: { signal?: AbortSignal }
  ): Promise<{ output?: unknown; trailRef?: string }>;
}

export interface TrailEntry {
  dispatchId: string;
  at: string;
  event:
    | 'received'
    | 'confirmation-required'
    | 'confirmed'
    | 'denied'
    | 'dispatched'
    | 'completed'
    | 'failed';
  detail?: string;
}
