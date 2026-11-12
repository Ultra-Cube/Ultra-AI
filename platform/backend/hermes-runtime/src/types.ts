/**
 * Core types for the Hermes runtime.
 *
 * Hermes is the agent runtime layer: persistent memory, skills, reasoning,
 * orchestration, and adapters for providers / engines / tools / MCP.
 * Distinct from the `infrastructure/monitoring/stack/hermes` Prometheus
 * monitoring stack — that name refers to the observability layer only.
 */

export type AgentId = string;
export type SessionId = string;

export interface HermesMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  timestamp: number;
}

export interface HermesSession {
  id: SessionId;
  agentId: AgentId;
  messages: HermesMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface HermesConfig {
  /** Path or identifier of the agent persona/definition (brain-stack/agents). */
  agentDefinition?: string;
  /** Skills to preload from brain-stack/skills. */
  skills?: string[];
  /** Provider adapter id to use by default. */
  provider?: string;
  /** Engine adapter id to use by default. */
  engine?: string;
  /** Memory namespace for isolation between agents/users. */
  memoryNamespace?: string;
  /** Max agent loop iterations per task. */
  maxIterations?: number;
}

export interface HermesTask {
  id: string;
  sessionId: SessionId;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  error?: string;
  iterations: number;
  createdAt: number;
  updatedAt: number;
}

export interface RuntimeEvent {
  type:
    | 'session.created'
    | 'task.started'
    | 'task.completed'
    | 'task.failed'
    | 'memory.written'
    | 'skill.loaded'
    | 'tool.called'
    | 'reasoning.step'
    | 'orchestration.delegated';
  sessionId?: SessionId;
  taskId?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export type EventHandler = (event: RuntimeEvent) => void;
