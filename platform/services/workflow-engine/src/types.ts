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
 * Unified workflow/automation contract (P1C-09).
 *
 * One `WorkflowEngine` port across Langflow, Dify and n8n so callers never
 * branch on the underlying automation engine. Each adapter normalizes its
 * native run API into `WorkflowResult`.
 */

export type WorkflowEngineKind = 'langflow' | 'dify' | 'n8n';

export interface WorkflowRequest {
  /** Natural-language goal / input value handed to the automation. */
  goal: string;
  /** Optional session/conversation correlation id. */
  sessionId?: string;
  /** Engine-specific hints (flow id, app key selection is adapter-level). */
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface WorkflowStep {
  kind: 'thought' | 'action' | 'observation' | 'answer';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowResult {
  engine: WorkflowEngineKind;
  answer: string;
  steps: WorkflowStep[];
  /** Where execution happened — 'local' when the sidecar runs on-device. */
  locality: 'local' | 'remote';
  /** Raw engine payload for callers that need engine-native detail. */
  raw?: unknown;
  durationMs: number;
}

export interface WorkflowEngine {
  readonly kind: WorkflowEngineKind;
  run(req: WorkflowRequest): Promise<WorkflowResult>;
}

/** Error raised when an automation engine rejects or is unreachable. */
export class WorkflowEngineError extends Error {
  readonly engine: WorkflowEngineKind;
  readonly cause?: unknown;

  constructor(engine: WorkflowEngineKind, message: string, cause?: unknown) {
    super(`[${engine}] ${message}`);
    this.name = 'WorkflowEngineError';
    this.engine = engine;
    this.cause = cause;
  }
}
