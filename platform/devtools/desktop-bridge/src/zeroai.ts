import type { HermesRuntime } from '@ultra-ai/hermes-runtime';
import {
  PolicyEngine,
  ZeroAIRouter,
  localModelLaneFromEnv,
  localModelPortFromLane,
  type GatewayPort,
  type LocalModelPort,
  type MemoryHit,
  type MemoryPort,
  type ToolPort,
  type ZeroAIEvent,
  type ZeroAIEventHandler,
  type ZeroAIRequest,
  type ZeroAIResponse,
} from '@ultra-ai/zeroai-edge';

/**
 * Bridge-side ZeroAI wiring — adapts the desktop bridge's HermesRuntime
 * (memory, tool registry, provider-backed task runner) onto the
 * zeroai-edge local-first contract ports.
 */

const DEFAULT_NAMESPACE = 'default';

class RuntimeMemoryPort implements MemoryPort {
  constructor(private readonly rt: HermesRuntime) {}

  async recall(
    query: string,
    sessionId: string,
    limit = 5
  ): Promise<MemoryHit[]> {
    const entries = await this.rt.memory.query({
      namespace: sessionId || DEFAULT_NAMESPACE,
      text: query,
      limit,
    });
    return entries.map((e) => ({
      id: e.id,
      content: e.content,
      score: 1,
    }));
  }

  async remember(entry: {
    sessionId: string;
    kind: string;
    content: string;
  }): Promise<void> {
    await this.rt.memory.write({
      scope: 'short-term',
      namespace: entry.sessionId || DEFAULT_NAMESPACE,
      content: `[${entry.kind}] ${entry.content}`,
    });
  }
}

/**
 * Local model lane: runs the prompt through HermesRuntime's provider-backed
 * task engine on a per-session Hermes session (created lazily).
 */
class RuntimeLocalModelPort implements LocalModelPort {
  private readonly sessions = new Map<string, string>();

  constructor(private readonly rt: HermesRuntime) {}

  async run(prompt: string, ctx: { sessionId: string }): Promise<string> {
    let hermesSessionId = this.sessions.get(ctx.sessionId);
    if (!hermesSessionId || !this.rt.getSession(hermesSessionId)) {
      const s = this.rt.createSession('default');
      hermesSessionId = s.id;
      this.sessions.set(ctx.sessionId, s.id);
    }
    const task = await this.rt.runTask(hermesSessionId, prompt);
    if (task.status === 'failed' || task.error) {
      throw new Error(task.error ?? 'local model run failed');
    }
    return task.result ?? '';
  }
}

/**
 * Wraps a Hermes tool adapter as a zeroai-edge ToolPort. A tool "can handle"
 * a request when it is named explicitly via metadata.toolName or its name
 * appears in the request text.
 */
function runtimeToolPort(
  rt: HermesRuntime,
  name: string
): ToolPort | undefined {
  const adapter = rt.tools.get(name) as
    | {
        invoke(
          args: Record<string, unknown>,
          ctx: unknown
        ): Promise<{ ok: boolean; content: string }>;
      }
    | undefined;
  if (!adapter) return undefined;
  return {
    name,
    sensitive: false,
    canHandle(req: ZeroAIRequest): boolean {
      const named = req.metadata?.toolName;
      if (named) return named === name;
      return req.text.toLowerCase().includes(name.toLowerCase());
    },
    async invoke(req) {
      const r = await adapter.invoke(
        { prompt: req.text, input: req.text },
        {} as never
      );
      return { ok: r.ok !== false, content: r.content ?? '' };
    },
  };
}

/** Per-request execution trail for UI inspection. */
export interface ZeroAIExecutionTrail {
  requestId: string;
  sessionId: string;
  status: 'pending' | 'awaiting-confirmation' | 'completed' | 'failed';
  route?: string;
  locality?: string;
  events: ZeroAIEvent[];
  response?: ZeroAIResponse;
  updatedAt: number;
}

export interface ZeroAIBridge {
  router: ZeroAIRouter;
  handle(req: ZeroAIRequest): Promise<ZeroAIResponse>;
  /** Execution trail for one request, or undefined if unknown. */
  trail(requestId: string): ZeroAIExecutionTrail | undefined;
  /** Trails for a session, most recent last. */
  trails(sessionId: string): ZeroAIExecutionTrail[];
  /** Distinct route kinds currently registered. */
  routes(): string[];
}

export interface ZeroAIBridgeOptions {
  /** Tool names from the runtime registry to expose as local-tool routes. */
  toolNames?: string[];
  /** Optional Ultra gateway escalation port (e.g. ultra-core-bridge client). */
  gateway?: GatewayPort;
  /**
   * Override for the local model lane. When omitted, a lane configured via
   * ZEROAI_LOCAL_MODEL env vars (ollama / openai-compatible → 9router etc.)
   * is used; otherwise the HermesRuntime provider-backed lane is used.
   */
  localModel?: LocalModelPort;
  onEvent?: ZeroAIEventHandler;
  policy?: ConstructorParameters<typeof PolicyEngine>[0];
}

export function createZeroAIBridge(
  rt: HermesRuntime,
  opts: ZeroAIBridgeOptions = {}
): ZeroAIBridge {
  const memory = new RuntimeMemoryPort(rt);
  const envLane = localModelLaneFromEnv();
  const localModel =
    opts.localModel ??
    (envLane ? localModelPortFromLane(envLane) : new RuntimeLocalModelPort(rt));
  const tools = (opts.toolNames ?? [])
    .map((n) => runtimeToolPort(rt, n))
    .filter((t): t is ToolPort => Boolean(t));

  const trails = new Map<string, ZeroAIExecutionTrail>();
  const bySession = new Map<string, Set<string>>();

  const record = (req: ZeroAIRequest): ZeroAIExecutionTrail => {
    let t = trails.get(req.id);
    if (!t) {
      t = {
        requestId: req.id,
        sessionId: req.sessionId,
        status: 'pending',
        events: [],
        updatedAt: Date.now(),
      };
      trails.set(req.id, t);
      let set = bySession.get(req.sessionId);
      if (!set) {
        set = new Set();
        bySession.set(req.sessionId, set);
      }
      set.add(req.id);
    }
    return t;
  };

  const onEvent: ZeroAIEventHandler = (event) => {
    const t = record({
      id: event.requestId,
      sessionId: event.sessionId ?? '',
      text: '',
    } as ZeroAIRequest);
    t.events.push(event);
    t.updatedAt = Date.now();
    if (event.route) t.route = event.route;
    if (event.locality) t.locality = event.locality;
    if (event.type === 'confirmation.requested') {
      t.status = 'awaiting-confirmation';
    }
    opts.onEvent?.(event);
  };

  const router = new ZeroAIRouter({
    memory,
    policy: new PolicyEngine(opts.policy),
    localModel,
    tools,
    gateway: opts.gateway,
    onEvent,
  });

  return {
    router,
    async handle(req) {
      const t = record(req);
      try {
        const res = await router.handle(req);
        t.response = res;
        if (res.status === 'awaiting-confirmation') {
          t.status = 'awaiting-confirmation';
        } else if (res.status === 'completed') {
          t.status = 'completed';
        } else if (res.status === 'failed') {
          t.status = 'failed';
        }
        t.updatedAt = Date.now();
        return res;
      } catch (err) {
        t.status = 'failed';
        t.updatedAt = Date.now();
        throw err;
      }
    },
    trail: (requestId) => trails.get(requestId),
    trails: (sessionId) =>
      [...(bySession.get(sessionId) ?? [])]
        .map((id) => trails.get(id))
        .filter((t): t is ZeroAIExecutionTrail => Boolean(t)),
    routes: () => [
      ...new Set([...tools.map((t) => t.name), 'local-model', 'escalate']),
    ],
  };
}
