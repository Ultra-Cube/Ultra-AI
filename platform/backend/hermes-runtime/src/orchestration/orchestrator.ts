/**
 * Orchestration subsystem — multi-agent delegation.
 *
 * The Orchestrator routes tasks to registered agents (Hermes sessions) and
 * collects results. Pattern follows a supervisor model: the orchestrator
 * decides which agent handles a subtask; agents never call each other
 * directly in v1.
 */

import type { HermesTask, SessionId } from '../types';

export interface AgentHandle {
  agentId: string;
  sessionId: SessionId;
}

export interface DelegationRequest {
  task: string;
  /** Preferred agent id; orchestrator may re-route. */
  agentId?: string;
  /** Parent session for traceability. */
  parentSessionId?: SessionId;
}

export interface DelegationResult {
  task: HermesTask;
  agentId: string;
}

export interface OrchestratorDeps {
  /** Spawn or resume an agent session for a delegation. */
  dispatch(req: DelegationRequest): Promise<DelegationResult>;
}

/**
 * Sequential supervisor orchestrator.
 * Future work: parallel fan-out, consensus, capability-based routing.
 */
export class Orchestrator {
  private pending = new Map<string, DelegationRequest>();

  constructor(private deps: OrchestratorDeps) {}

  async delegate(req: DelegationRequest): Promise<DelegationResult> {
    const result = await this.deps.dispatch(req);
    this.pending.set(result.task.id, req);
    return result;
  }

  async collect(taskId: string): Promise<HermesTask | undefined> {
    // placeholder: callers track task state via HermesRuntime.getTask
    this.pending.delete(taskId);
    return undefined;
  }
}
