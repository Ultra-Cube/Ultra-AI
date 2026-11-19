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
 * Agent network layer for work-dispatch (ultra.work-dispatch.v1).
 *
 * - AgentRegistry: catalog of local/remote agents and their capabilities.
 * - TaskBus: in-memory pub/sub envelope bus routing work by capability.
 * - DelegationPolicy: guards agent→agent delegation (depth, budgets,
 *   allowed targets, approval requirements for sensitive payloads).
 *
 * In-memory only — persistence lands with the database migration.
 */
import type { DispatchTarget, Sensitivity, WorkDispatch } from './types';

export type AgentStatus = 'online' | 'offline' | 'busy' | 'unknown';

export interface RegisteredAgent {
  agentId: string;
  /** DispatchTarget this agent serves, or 'specialist-agent' for custom ids. */
  target: DispatchTarget;
  capabilities: string[];
  endpoint?: string;
  status: AgentStatus;
  meta?: Record<string, unknown>;
}

export class AgentRegistry {
  private agents = new Map<string, RegisteredAgent>();

  register(agent: RegisteredAgent): RegisteredAgent {
    if (!agent.agentId) throw new Error('agentId required');
    if (agent.capabilities.length === 0)
      throw new Error('agent must declare at least one capability');
    this.agents.set(agent.agentId, { ...agent });
    return this.agents.get(agent.agentId)!;
  }

  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  get(agentId: string): RegisteredAgent | undefined {
    return this.agents.get(agentId);
  }

  list(filter?: {
    target?: DispatchTarget;
    capability?: string;
  }): RegisteredAgent[] {
    return [...this.agents.values()].filter(
      (a) =>
        (!filter?.target || a.target === filter.target) &&
        (!filter?.capability || a.capabilities.includes(filter.capability))
    );
  }

  setStatus(agentId: string, status: AgentStatus): void {
    const a = this.agents.get(agentId);
    if (a) a.status = status;
  }

  /** Agents able to serve a dispatch route. */
  candidatesFor(dispatch: WorkDispatch): RegisteredAgent[] {
    const { target, agentId } = dispatch.route;
    if (agentId) {
      const a = this.agents.get(agentId);
      return a ? [a] : [];
    }
    return this.list({ target }).filter((a) => a.status !== 'offline');
  }
}

export interface BusEnvelope {
  busId: string;
  dispatch: WorkDispatch;
  enqueuedAt: string;
}

export type BusHandler = (envelope: BusEnvelope) => Promise<void> | void;

/** Capability-keyed in-memory task bus. */
export class TaskBus {
  private handlers = new Map<string, Set<BusHandler>>();
  private queue: BusEnvelope[] = [];
  private seq = 0;

  subscribe(capability: string, handler: BusHandler): () => void {
    let set = this.handlers.get(capability);
    if (!set) {
      set = new Set();
      this.handlers.set(capability, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  async publish(
    dispatch: WorkDispatch,
    capability: string,
    idGen: () => string = () => `bus-${++this.seq}`
  ): Promise<BusEnvelope> {
    const envelope: BusEnvelope = {
      busId: idGen(),
      dispatch,
      enqueuedAt: new Date().toISOString(),
    };
    this.queue.push(envelope);
    const handlers = this.handlers.get(capability);
    if (handlers) {
      for (const h of handlers) await h(envelope);
    }
    return envelope;
  }

  pending(capability?: string): BusEnvelope[] {
    return this.queue.filter(
      (e) => !capability || e.dispatch.task.kind === capability
    );
  }

  ack(busId: string): boolean {
    const i = this.queue.findIndex((e) => e.busId === busId);
    if (i < 0) return false;
    this.queue.splice(i, 1);
    return true;
  }
}

export interface DelegationPolicyOptions {
  /** Max agent→agent hops; 0 disables delegation. */
  maxDepth?: number;
  /** Max concurrent delegated dispatches. */
  maxConcurrent?: number;
  /** Targets delegation may reach. Defaults to all non-local targets. */
  allowedTargets?: DispatchTarget[];
  /** Sensitivities that always require confirmation even if unflagged. */
  alwaysConfirm?: Sensitivity[];
}

export interface DelegationDecision {
  allowed: boolean;
  reason: string;
  requiresConfirmation: boolean;
}

/**
 * Decides whether a dispatch may be delegated onward and under which
 * guardrails. Pure policy — enforcement lives in the dispatcher.
 */
export class DelegationPolicy {
  private depth = new Map<string, number>();
  private running = 0;

  constructor(private readonly opts: DelegationPolicyOptions = {}) {}

  decide(input: {
    dispatch: WorkDispatch;
    fromAgentId?: string;
    sensitivity?: Sensitivity;
  }): DelegationDecision {
    const { dispatch, fromAgentId, sensitivity } = input;
    const target = dispatch.route.target;
    const depth = fromAgentId ? (this.depth.get(fromAgentId) ?? 0) : 0;
    const maxDepth = this.opts.maxDepth ?? 3;

    if (target === 'local')
      return {
        allowed: true,
        reason: 'local execution',
        requiresConfirmation: false,
      };
    if (depth >= maxDepth)
      return {
        allowed: false,
        reason: `delegation depth ${depth} >= ${maxDepth}`,
        requiresConfirmation: false,
      };
    if (this.opts.allowedTargets && !this.opts.allowedTargets.includes(target))
      return {
        allowed: false,
        reason: `target ${target} not delegable`,
        requiresConfirmation: false,
      };
    if (
      this.opts.maxConcurrent !== undefined &&
      this.running >= this.opts.maxConcurrent
    )
      return {
        allowed: false,
        reason: 'delegation concurrency budget exhausted',
        requiresConfirmation: false,
      };

    const requiresConfirmation =
      dispatch.task.requiresConfirmation === true ||
      dispatch.task.sensitivity === 'sensitive' ||
      (sensitivity !== undefined &&
        (this.opts.alwaysConfirm ?? ['sensitive']).includes(sensitivity));

    return {
      allowed: true,
      reason: `delegate to ${target}`,
      requiresConfirmation,
    };
  }

  /** Call when a delegated dispatch starts/completes to track budget. */
  acquire(agentId: string): void {
    this.depth.set(agentId, (this.depth.get(agentId) ?? 0) + 1);
    this.running += 1;
  }

  release(agentId: string): void {
    this.depth.set(agentId, Math.max(0, (this.depth.get(agentId) ?? 1) - 1));
    this.running = Math.max(0, this.running - 1);
  }
}
