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

import type { EngineAdapter, EngineRunRequest } from '@ultra-ai/hermes-runtime';

import {
  WorkflowEngineError,
  type WorkflowEngine,
  type WorkflowEngineKind,
  type WorkflowRequest,
  type WorkflowResult,
} from './types';

/**
 * Wraps a hermes-runtime `EngineAdapter` (n8n webhook, Langflow run,
 * Dify chat-messages) behind the unified `WorkflowEngine` port.
 */
export class AdapterWorkflowEngine implements WorkflowEngine {
  readonly kind: WorkflowEngineKind;
  private readonly adapter: EngineAdapter;
  private readonly locality: 'local' | 'remote';

  constructor(
    kind: WorkflowEngineKind,
    adapter: EngineAdapter,
    locality: 'local' | 'remote' = 'local'
  ) {
    this.kind = kind;
    this.adapter = adapter;
    this.locality = locality;
  }

  async run(req: WorkflowRequest): Promise<WorkflowResult> {
    const started = Date.now();
    const runReq: EngineRunRequest = {
      goal: req.goal,
      context: [],
      tools: [],
      maxSteps: 1,
      ...(req.signal ? { signal: req.signal } : {}),
    };
    try {
      const result = await this.adapter.run(runReq, {
        provider: {
          id: 'workflow-engine',
          capabilities: {
            streaming: false,
            toolCalling: false,
            embeddings: false,
          },
          async generate() {
            throw new Error('provider unused for automation engines');
          },
        },
        async invokeTool() {
          return {
            callId: 'none',
            ok: false,
            content: 'tools unused for automation engines',
            isError: true,
          };
        },
      });
      return {
        engine: this.kind,
        answer: result.answer,
        steps: result.steps.map((s) => ({
          kind: s.kind,
          content: s.content,
          ...(s.metadata ? { metadata: s.metadata } : {}),
        })),
        locality: this.locality,
        raw: {
          toolCallsMade: result.toolCallsMade,
          iterationsUsed: result.iterationsUsed,
        },
        durationMs: Date.now() - started,
      };
    } catch (err) {
      throw new WorkflowEngineError(
        this.kind,
        err instanceof Error ? err.message : 'run failed',
        err
      );
    }
  }
}
