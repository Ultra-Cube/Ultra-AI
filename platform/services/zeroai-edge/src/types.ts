/**
 * ZeroAI edge — local-first execution contract.
 *
 * Flow: user input → local memory recall → policy decision →
 * local model / local tool / workflow / Ultra escalation → response.
 * Every request resolves through the policy layer; no route may bypass it.
 */

export type RouteKind = 'local-model' | 'local-tool' | 'workflow' | 'escalate';

export type Locality = 'local' | 'escalated';

export type ZeroAIStatus =
  | 'completed'
  | 'awaiting-confirmation'
  | 'denied'
  | 'failed';

export interface ZeroAIRequest {
  id: string;
  sessionId: string;
  text: string;
  actorId?: string;
  /** Explicit route hint from the UI; still passes through policy. */
  hint?: RouteKind;
  /** Pre-approved confirmation for sensitive actions (e.g. from UI). */
  confirmation?: { approved: boolean; scope?: string };
  metadata?: Record<string, unknown>;
}

export interface MemoryHit {
  id: string;
  content: string;
  score: number;
}

export interface PolicyDecision {
  route: RouteKind;
  /** Human-readable reason for the routing decision (UI-visible). */
  reason: string;
  /** Target id: model name, tool name, workflow id, or gateway id. */
  target: string;
  requiresConfirmation: boolean;
  /** Policy rule that produced the decision. */
  rule: string;
}

export interface ZeroAIResponse {
  requestId: string;
  sessionId: string;
  status: ZeroAIStatus;
  route: RouteKind;
  locality: Locality;
  answer?: string;
  /** Names of local tools/workflows invoked. */
  executed?: string[];
  memoryHits: number;
  decision: PolicyDecision;
  error?: string;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Ports (dependency-injected; implemented by hermes-runtime adapters etc.)
// ---------------------------------------------------------------------------

export interface MemoryPort {
  recall(
    query: string,
    sessionId: string,
    limit?: number
  ): Promise<MemoryHit[]>;
  remember?(entry: {
    sessionId: string;
    kind: string;
    content: string;
  }): Promise<void>;
}

export interface PolicyPort {
  decide(req: ZeroAIRequest, ctx: PolicyContext): Promise<PolicyDecision>;
}

export interface PolicyContext {
  memoryHits: MemoryHit[];
  /** Sensitive-action patterns matched in the request text. */
  sensitiveFlags: string[];
  /** Whether an Ultra gateway is configured/reachable. */
  gatewayAvailable: boolean;
}

export interface LocalModelPort {
  /** Runs a prompt through the local model lane (Ollama via OpenClaw/Hermes). */
  run(
    prompt: string,
    ctx: { sessionId: string; memory: MemoryHit[] }
  ): Promise<string>;
}

export interface ToolPort {
  readonly name: string;
  /** Returns true if this tool can handle the request. */
  canHandle(req: ZeroAIRequest): boolean;
  invoke(req: ZeroAIRequest): Promise<{ ok: boolean; content: string }>;
  /** Whether invoking requires explicit user confirmation. */
  sensitive?: boolean;
}

export interface WorkflowPort {
  readonly id: string;
  canHandle(req: ZeroAIRequest): boolean;
  run(req: ZeroAIRequest): Promise<{ ok: boolean; content: string }>;
}

export interface GatewayPort {
  /** Escalates to Ultra AI / Ultra gateway. Returns the answer text. */
  escalate(req: ZeroAIRequest, memory: MemoryHit[]): Promise<string>;
}

export interface ZeroAIEvent {
  type:
    | 'request.received'
    | 'memory.recalled'
    | 'policy.decided'
    | 'confirmation.requested'
    | 'route.executed'
    | 'route.failed'
    | 'response.ready';
  requestId: string;
  sessionId: string;
  route?: RouteKind;
  locality?: Locality;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export type ZeroAIEventHandler = (event: ZeroAIEvent) => void;
