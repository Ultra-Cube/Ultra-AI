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
  DifyEngine,
  LangflowEngine,
  N8nEngine,
} from '@ultra-ai/hermes-runtime';

import { AdapterWorkflowEngine } from './engine';
import type { WorkflowEngine, WorkflowEngineKind } from './types';

/** Port defaults mirroring `ENGINE_PRESETS` in engine-supervisor. */
export const WORKFLOW_ENGINE_DEFAULTS: Record<
  WorkflowEngineKind,
  { port: number }
> = {
  langflow: { port: 7860 },
  dify: { port: 5001 },
  n8n: { port: 5678 },
};

export interface WorkflowEngineFactoryOptions {
  /** Engine base URL, e.g. 'http://localhost:7860'. Defaults per kind. */
  baseURL?: string;
  apiKey?: string;
  /** n8n webhook path segment (default 'ultra'). */
  webhookPath?: string;
  /** langflow flow id — required for kind='langflow'. */
  flowId?: string;
  /** dify app api_key — required for kind='dify'. */
  appApiKey?: string;
  /** dify mode (default 'chat'). */
  difyMode?: 'chat' | 'workflow';
  /** dify workflow id when mode='workflow'. */
  workflowId?: string;
  /** openhands conversation runtime id. */
  openhandsRuntimeId?: string;
  /** Whether the engine runs on-device ('local') or remotely. */
  locality?: 'local' | 'remote';
  timeoutMs?: number;
}

/**
 * Builds a `WorkflowEngine` for the given kind. Uses the engine-supervisor
 * default ports when `baseURL` is omitted.
 */
export function createWorkflowEngine(
  kind: WorkflowEngineKind,
  opts: WorkflowEngineFactoryOptions = {}
): WorkflowEngine {
  const baseURL =
    opts.baseURL ?? `http://localhost:${WORKFLOW_ENGINE_DEFAULTS[kind].port}`;
  const locality = opts.locality ?? 'local';

  switch (kind) {
    case 'n8n':
      return new AdapterWorkflowEngine(
        'n8n',
        new N8nEngine({
          id: 'n8n',
          baseURL,
          ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
          ...(opts.webhookPath ? { webhookPath: opts.webhookPath } : {}),
          ...(opts.timeoutMs ? { timeoutMs: opts.timeoutMs } : {}),
        }),
        locality
      );
    case 'langflow':
      if (!opts.flowId) {
        throw new Error("createWorkflowEngine('langflow') requires flowId");
      }
      return new AdapterWorkflowEngine(
        'langflow',
        new LangflowEngine({
          id: 'langflow',
          baseURL,
          flowId: opts.flowId,
          ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
          ...(opts.timeoutMs ? { timeoutMs: opts.timeoutMs } : {}),
        }),
        locality
      );
    case 'dify':
      if (!opts.appApiKey) {
        throw new Error("createWorkflowEngine('dify') requires appApiKey");
      }
      return new AdapterWorkflowEngine(
        'dify',
        new DifyEngine({
          id: 'dify',
          baseURL,
          appApiKey: opts.appApiKey,
          ...(opts.difyMode ? { mode: opts.difyMode } : {}),
          ...(opts.workflowId ? { workflowId: opts.workflowId } : {}),
          ...(opts.timeoutMs ? { timeoutMs: opts.timeoutMs } : {}),
        }),
        locality
      );
  }
}
