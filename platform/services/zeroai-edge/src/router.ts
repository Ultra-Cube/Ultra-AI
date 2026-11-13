import type {
  GatewayPort,
  LocalModelPort,
  MemoryPort,
  PolicyPort,
  ToolPort,
  WorkflowPort,
  ZeroAIEvent,
  ZeroAIEventHandler,
  ZeroAIRequest,
  ZeroAIResponse,
} from './types';

/**
 * ZeroAIRouter — the local-first execution path.
 *
 *   input → memory.recall → policy.decide → [confirmation gate] → execute → response
 *
 * Locality is always visible in the response so the UI can show whether the
 * request stayed on-device or escalated to the Ultra gateway.
 */

export interface ZeroAIRouterDeps {
  memory: MemoryPort;
  policy: PolicyPort;
  localModel?: LocalModelPort;
  tools?: ToolPort[];
  workflows?: WorkflowPort[];
  gateway?: GatewayPort;
  onEvent?: ZeroAIEventHandler;
}

export class ZeroAIRouter {
  constructor(private readonly deps: ZeroAIRouterDeps) {}

  async handle(req: ZeroAIRequest): Promise<ZeroAIResponse> {
    const started = Date.now();
    const emit = (
      e: Omit<ZeroAIEvent, 'requestId' | 'sessionId' | 'timestamp'>
    ) =>
      this.deps.onEvent?.({
        ...e,
        requestId: req.id,
        sessionId: req.sessionId,
        timestamp: Date.now(),
      });

    emit({ type: 'request.received' });

    const memoryHits = await this.deps.memory.recall(
      req.text,
      req.sessionId,
      5
    );
    emit({ type: 'memory.recalled', payload: { hits: memoryHits.length } });

    const sensitiveFlags =
      'sensitiveFlagsFor' in this.deps.policy
        ? (
            this.deps.policy as { sensitiveFlagsFor(t: string): string[] }
          ).sensitiveFlagsFor(req.text)
        : [];

    const decision = await this.deps.policy.decide(req, {
      memoryHits,
      sensitiveFlags,
      gatewayAvailable: Boolean(this.deps.gateway),
    });
    emit({
      type: 'policy.decided',
      route: decision.route,
      payload: { rule: decision.rule, reason: decision.reason },
    });

    // Confirmation gate: sensitive local actions need explicit approval.
    if (decision.requiresConfirmation) {
      const approved = req.confirmation?.approved === true;
      if (!approved) {
        emit({ type: 'confirmation.requested', route: decision.route });
        return {
          requestId: req.id,
          sessionId: req.sessionId,
          status: 'awaiting-confirmation',
          route: decision.route,
          locality: 'local',
          memoryHits: memoryHits.length,
          decision,
          error: 'Sensitive action requires explicit confirmation',
          latencyMs: Date.now() - started,
        };
      }
    }

    try {
      const result = await this.execute(req, decision.route, memoryHits);
      emit({
        type: 'route.executed',
        route: decision.route,
        locality: result.locality,
      });

      // Learn from the exchange (best-effort).
      await this.deps.memory.remember?.({
        sessionId: req.sessionId,
        kind: 'interaction',
        content: `${req.text} → [${decision.route}] ${result.answer?.slice(0, 200) ?? ''}`,
      });

      emit({
        type: 'response.ready',
        route: decision.route,
        locality: result.locality,
      });
      return {
        requestId: req.id,
        sessionId: req.sessionId,
        status: 'completed',
        route: decision.route,
        locality: result.locality,
        answer: result.answer,
        executed: result.executed,
        memoryHits: memoryHits.length,
        decision,
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      emit({
        type: 'route.failed',
        route: decision.route,
        payload: { error: String(err) },
      });
      return {
        requestId: req.id,
        sessionId: req.sessionId,
        status: 'failed',
        route: decision.route,
        locality: decision.route === 'escalate' ? 'escalated' : 'local',
        memoryHits: memoryHits.length,
        decision,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - started,
      };
    }
  }

  private async execute(
    req: ZeroAIRequest,
    route: ZeroAIResponse['route'],
    memory: Awaited<ReturnType<MemoryPort['recall']>>
  ): Promise<{
    answer?: string;
    executed?: string[];
    locality: 'local' | 'escalated';
  }> {
    switch (route) {
      case 'escalate': {
        if (!this.deps.gateway) {
          // Gateway unavailable → fall back to local model rather than fail.
          const answer = await this.localModel(req, memory);
          return { answer, locality: 'local' };
        }
        return {
          answer: await this.deps.gateway.escalate(req, memory),
          locality: 'escalated',
        };
      }
      case 'local-tool': {
        const tool = this.findTool(req);
        if (!tool)
          throw new Error(
            `No local tool can handle request (target: ${req.metadata?.toolName ?? 'auto'})`
          );
        const r = await tool.invoke(req);
        if (!r.ok) throw new Error(`Tool ${tool.name} failed: ${r.content}`);
        return { answer: r.content, executed: [tool.name], locality: 'local' };
      }
      case 'workflow': {
        const wf = this.findWorkflow(req);
        if (!wf)
          throw new Error(
            `No workflow can handle request (target: ${req.metadata?.workflowId ?? 'auto'})`
          );
        const r = await wf.run(req);
        if (!r.ok) throw new Error(`Workflow ${wf.id} failed: ${r.content}`);
        return { answer: r.content, executed: [wf.id], locality: 'local' };
      }
      case 'local-model':
      default:
        return {
          answer: await this.localModel(req, memory),
          locality: 'local',
        };
    }
  }

  private async localModel(
    req: ZeroAIRequest,
    memory: Awaited<ReturnType<MemoryPort['recall']>>
  ): Promise<string> {
    if (!this.deps.localModel)
      throw new Error('No local model lane configured');
    const context = memory.length
      ? `Relevant memory:\n${memory.map((m) => `- ${m.content}`).join('\n')}\n\n`
      : '';
    return this.deps.localModel.run(`${context}${req.text}`, {
      sessionId: req.sessionId,
      memory,
    });
  }

  private findTool(req: ZeroAIRequest): ToolPort | undefined {
    const named = req.metadata?.toolName as string | undefined;
    const pool = this.deps.tools ?? [];
    if (named) return pool.find((t) => t.name === named);
    return pool.find((t) => t.canHandle(req));
  }

  private findWorkflow(req: ZeroAIRequest): WorkflowPort | undefined {
    const named = req.metadata?.workflowId as string | undefined;
    const pool = this.deps.workflows ?? [];
    if (named) return pool.find((w) => w.id === named);
    return pool.find((w) => w.canHandle(req));
  }
}
