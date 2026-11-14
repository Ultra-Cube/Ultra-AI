import {
  EngineSupervisor,
  ENGINE_PRESETS,
  type SupervisorOptions,
} from '@ultra-ai/engine-supervisor';
import {
  HermesRuntime,
  MockProvider,
  type HermesConfig,
} from '@ultra-ai/hermes-runtime';
import {
  ModelGateway,
  OpenAICompatibleProvider,
  ManusProvider,
  type GatewayOptions,
  type ChatRequest as GatewayChatRequest,
} from '@ultra-ai/model-gateway';
import {
  WorkDispatcher,
  AgentRegistry,
  TaskBus,
  DelegationPolicy,
  type Confirmation,
  type DispatchRequest,
  type WorkDispatchOptions,
  type DispatchTarget,
  RegisteredAgent,
  WorkDispatch,
} from '@ultra-ai/work-dispatch';
import {
  OpenHandsWorkspaceClient,
  type WorkspacePort,
} from '@ultra-ai/workspace';
import {
  uiCatalog,
  uiSchemaFor,
  type GatewayPort,
  type PolicyEngineOptions,
  type ZeroAIRequest,
} from '@ultra-ai/zeroai-edge';
import { WebSocketServer, WebSocket } from 'ws';

import {
  eventNotification,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  METHOD_NOT_FOUND,
  type JsonRpcNotification,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from './protocol';
import {
  createZeroAIBridge,
  type ZeroAIBridge,
  type ZeroAIBridgeOptions,
} from './zeroai';

export interface BridgeOptions {
  port: number;
  host: string;
  config?: HermesConfig;
  zeroai?: {
    policy?: PolicyEngineOptions;
    gateway?: GatewayPort;
    toolNames?: string[];
    onEvent?: ZeroAIBridgeOptions['onEvent'];
  };
  engines?: SupervisorOptions & { enabled?: boolean };
  dispatch?: WorkDispatchOptions & { enabled?: boolean };
  gateway?: Partial<GatewayOptions> & { enabled?: boolean };
  workspace?: {
    enabled?: boolean;
    baseUrl?: string;
    port?: WorkspacePort;
  };
}

const PROVIDER_MODELS = new Set([
  'mock',
  'openai',
  'anthropic',
  'ollama',
  'local',
]);

/**
 * JSON-RPC/WebSocket server bridging the desktop shell to HermesRuntime.
 * Exposes sessions, tasks, memory, skills, providers, tools, and engine
 * control over the wire.
 */
export class DesktopBridgeServer {
  readonly runtime: HermesRuntime;
  readonly zeroai: ZeroAIBridge;
  readonly engines: EngineSupervisor | null;
  readonly dispatcher: WorkDispatcher | null;
  readonly gateway: ModelGateway | null;
  readonly agents: AgentRegistry;
  readonly bus: TaskBus;
  readonly delegation: DelegationPolicy;
  readonly workspace: WorkspacePort | null;
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();

  constructor(private readonly options: BridgeOptions) {
    this.runtime = new HermesRuntime(options.config ?? {});
    // Default local mock provider — always registered so `provider:'mock'`
    // works out of the box; external adapters can be swapped via set_provider.
    this.runtime.registerProvider(new MockProvider({ id: 'mock' }));
    this.runtime.onEvent((event) => this.broadcast(eventNotification(event)));
    this.zeroai = createZeroAIBridge(this.runtime, {
      ...options.zeroai,
      onEvent: (event) => {
        this.broadcast(eventNotification(event));
        options.zeroai?.onEvent?.(event);
      },
    });
    this.agents = new AgentRegistry();
    this.bus = new TaskBus();
    this.delegation = new DelegationPolicy({ maxDepth: 3 });

    this.engines =
      options.engines?.enabled === false
        ? null
        : new EngineSupervisor(ENGINE_PRESETS, {
            ...options.engines,
            onStatus: (status) =>
              this.broadcast(
                eventNotification({
                  type: 'engine.status',
                  payload: status,
                } as never)
              ),
          });
    this.dispatcher =
      options.dispatch?.enabled === false
        ? null
        : new WorkDispatcher({
            ...options.dispatch,
            executors: {
              local: {
                execute: async (d) => ({
                  output: { echo: d.task.payload },
                  trailRef: `local://${d.dispatchId}`,
                }),
              },
              ...(options.dispatch?.executors ?? {}),
            },
          });
    this.gateway =
      options.gateway?.enabled === false
        ? null
        : new ModelGateway({
            maxFallbacks: 2,
            ...options.gateway,
            adapters: {
              deepseek: new OpenAICompatibleProvider('deepseek'),
              glm: new OpenAICompatibleProvider('glm'),
              kimi: new OpenAICompatibleProvider('kimi'),
              manus: new ManusProvider(),
              'openai-compatible': new OpenAICompatibleProvider(
                'openai-compatible'
              ),
              ollama: new OpenAICompatibleProvider('ollama'),
              ...(options.gateway?.adapters ?? {}),
            },
          });
    this.workspace =
      options.workspace?.enabled === false
        ? null
        : (options.workspace?.port ??
          new OpenHandsWorkspaceClient({
            baseUrl: options.workspace?.baseUrl ?? 'http://127.0.0.1:3300',
          }));
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({
        port: this.options.port,
        host: this.options.host,
      });
      this.wss.on('listening', () => resolve());
      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        ws.on('message', (data) => this.handleMessage(ws, data.toString()));
        ws.on('close', () => this.clients.delete(ws));
        ws.on('error', () => this.clients.delete(ws));
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const ws of this.clients) ws.terminate();
      this.clients.clear();
      if (!this.wss) return resolve();
      this.wss.close(() => resolve());
      this.wss = null;
    });
  }

  private broadcast(msg: JsonRpcNotification): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  }

  private handleMessage(ws: WebSocket, raw: string): void {
    let req: JsonRpcRequest;
    try {
      req = JSON.parse(raw) as JsonRpcRequest;
    } catch {
      this.sendError(ws, null, INVALID_PARAMS, 'Invalid JSON');
      return;
    }
    void this.dispatch(ws, req);
  }

  private async dispatch(ws: WebSocket, req: JsonRpcRequest): Promise<void> {
    const id = req.id ?? null;
    try {
      const result = await this.handle(req.method, req.params ?? {});
      const res: JsonRpcResponse = { jsonrpc: '2.0', id, result };
      ws.send(JSON.stringify(res));
    } catch (err) {
      const code = err instanceof BridgeError ? err.code : INTERNAL_ERROR;
      this.sendError(
        ws,
        id,
        code,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  private sendError(
    ws: WebSocket,
    id: string | number | null,
    code: number,
    message: string
  ): void {
    const res: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
    ws.send(JSON.stringify(res));
  }

  private async handle(
    method: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const rt = this.runtime;
    switch (method) {
      case 'sessions.create':
        return rt.createSession(
          (params.agentId as string | undefined) ?? 'default'
        );
      case 'sessions.get': {
        const s = rt.getSession(String(params.id));
        if (!s)
          throw new BridgeError(
            METHOD_NOT_FOUND,
            `Session not found: ${params.id}`
          );
        return s;
      }
      case 'sessions.list':
        return rt.listSessions();
      case 'tasks.run':
        return rt.runTask(String(params.sessionId), String(params.prompt));
      case 'tasks.get': {
        const t = rt.getTask(String(params.id));
        if (!t)
          throw new BridgeError(
            METHOD_NOT_FOUND,
            `Task not found: ${params.id}`
          );
        return t;
      }
      case 'tasks.list':
        return rt.listTasks();
      case 'memory.read':
        return rt.memory.read(String(params.id));
      case 'memory.query':
        return rt.memory.query({
          namespace: (params.namespace as string | undefined) ?? 'default',
          scope: params.scope as never,
          limit: params.limit as number | undefined,
        });
      case 'memory.write':
        return rt.memory.write({
          scope: (params.scope as never) ?? 'short-term',
          namespace: (params.namespace as string | undefined) ?? 'default',
          content: String(params.content ?? ''),
          metadata: params.metadata as Record<string, unknown> | undefined,
        });
      case 'memory.delete':
        return rt.memory.delete(String(params.id));
      case 'skills.list':
        return rt.skills.list();
      case 'skills.register':
        rt.skills.register(params.skill as never);
        return { ok: true };
      case 'skills.match':
        return rt.skills.match(String(params.prompt ?? ''));
      case 'providers.list':
        return [...rt.providers.keys()];
      case 'providers.set': {
        const name = String(params.name ?? '');
        if (!PROVIDER_MODELS.has(name)) {
          throw new BridgeError(INVALID_PARAMS, `Unknown provider: ${name}`);
        }
        // External adapters (OpenAI/Anthropic/Ollama) arrive with their
        // HTTP adapter packages; until then the mock provider is registered
        // under the requested alias so the name is usable over the wire.
        rt.registerProvider(new MockProvider({ id: name }));
        return { ok: true, provider: name };
      }
      case 'tools.list':
        return [...rt.tools.keys()];
      case 'engine.set':
        return { ok: true, engine: String(params.engine ?? 'default') };
      case 'config.get': {
        const cfg = rt.getConfig();
        return {
          agentId: cfg.agentDefinition ?? 'default',
          provider: cfg.provider ?? 'mock',
          memoryNamespace: cfg.memoryNamespace ?? 'default',
          maxIterations: cfg.maxIterations ?? 8,
        };
      }
      case 'zeroai.run': {
        const req: ZeroAIRequest = {
          id:
            typeof params.id === 'string' && params.id
              ? params.id
              : crypto.randomUUID(),
          sessionId: String(params.sessionId ?? 'default'),
          text: String(params.text ?? ''),
          actorId: params.actorId as string | undefined,
          hint: params.hint as ZeroAIRequest['hint'],
          confirmation: params.confirmation as ZeroAIRequest['confirmation'],
          metadata: params.metadata as Record<string, unknown> | undefined,
        };
        return this.zeroai.handle(req);
      }
      case 'zeroai.trail.get':
        return this.zeroai.trail(String(params.requestId)) ?? null;
      case 'zeroai.trail.list': {
        const sessionId = params.sessionId as string | undefined;
        return sessionId ? this.zeroai.trails(sessionId) : [];
      }
      case 'zeroai.routes':
        return this.zeroai.routes();
      case 'zeroai.ui.catalog':
        return uiCatalog();
      case 'zeroai.ui.schema': {
        const schema = uiSchemaFor(String(params.kind ?? ''));
        if (!schema)
          throw new BridgeError(METHOD_NOT_FOUND, 'Unknown UI schema');
        return schema;
      }
      case 'engines.list': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        return this.engines.listStatus();
      }
      case 'engines.status': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        const st = this.engines.status(String(params.id));
        if (!st)
          throw new BridgeError(
            METHOD_NOT_FOUND,
            'Unknown engine: ' + String(params.id)
          );
        return st;
      }
      case 'engines.probe': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        return this.engines.probe(String(params.id));
      }
      case 'engines.probeAll': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        const results = await Promise.all(
          this.engines
            .listManifests()
            .map((m) => this.engines!.probe(m.id).catch(() => null))
        );
        return results.filter((r) => r !== null);
      }
      case 'engines.start': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        return this.engines.start(String(params.id));
      }
      case 'engines.stop': {
        if (!this.engines)
          throw new BridgeError(INVALID_PARAMS, 'engine supervisor disabled');
        return this.engines.stop(String(params.id));
      }
      case 'agents.register': {
        return this.agents.register(params.agent as RegisteredAgent);
      }
      case 'agents.unregister': {
        return this.agents.unregister(String(params.agentId));
      }
      case 'agents.list': {
        return this.agents.list(
          params.filter as
            | { target?: DispatchTarget; capability?: string }
            | undefined
        );
      }
      case 'agents.get': {
        const a = this.agents.get(String(params.agentId));
        if (!a) throw new BridgeError(INVALID_PARAMS, 'unknown agent');
        return a;
      }
      case 'agents.status': {
        this.agents.setStatus(
          String(params.agentId),
          params.status as 'online' | 'offline' | 'busy' | 'unknown'
        );
        return this.agents.get(String(params.agentId));
      }
      case 'bus.publish': {
        if (!this.dispatcher)
          throw new BridgeError(INVALID_PARAMS, 'work dispatcher disabled');
        return this.bus.publish(
          (params.dispatch ?? params) as unknown as WorkDispatch,
          String(params.capability ?? 'custom')
        );
      }
      case 'bus.pending': {
        return this.bus.pending(
          params.capability ? String(params.capability) : undefined
        );
      }
      case 'bus.ack': {
        return this.bus.ack(String(params.busId));
      }
      case 'delegate.check': {
        const d = (params.dispatch ?? params) as unknown as WorkDispatch;
        return this.delegation.decide({
          dispatch: d,
          fromAgentId: params.fromAgentId
            ? String(params.fromAgentId)
            : undefined,
          sensitivity: params.sensitivity as
            | 'public'
            | 'internal'
            | 'sensitive'
            | undefined,
        });
      }
      case 'dispatch.run': {
        if (!this.dispatcher)
          throw new BridgeError(INVALID_PARAMS, 'work dispatcher disabled');
        return this.dispatcher.dispatch(params.request as DispatchRequest);
      }
      case 'dispatch.confirm': {
        if (!this.dispatcher)
          throw new BridgeError(INVALID_PARAMS, 'work dispatcher disabled');
        const res = await this.dispatcher.confirm(
          String(params.dispatchId),
          params.confirmation as Confirmation
        );
        if (!res)
          throw new BridgeError(
            METHOD_NOT_FOUND,
            `Unknown dispatch: ${params.dispatchId}`
          );
        return res;
      }
      case 'dispatch.pending':
        return this.dispatcher ? this.dispatcher.pendingIds() : [];
      case 'dispatch.trail.get':
        return this.dispatcher
          ? this.dispatcher.trailFor(String(params.dispatchId))
          : [];
      case 'dispatch.trail.list':
        return this.dispatcher ? this.dispatcher.trailAll() : [];
      case 'models.list': {
        return this.gateway
          ? this.gateway.availableModels(
              params.dataClass as
                | 'public'
                | 'internal'
                | 'sensitive'
                | 'regulated'
                | undefined
            )
          : [];
      }
      case 'gateway.chat': {
        if (!this.gateway)
          throw new BridgeError(INVALID_PARAMS, 'model gateway disabled');
        return this.gateway.chat(params.request as GatewayChatRequest);
      }
      case 'gateway.breakers':
        return this.gateway ? this.gateway.breakerStates() : {};
      case 'gateway.usage':
        return this.gateway ? this.gateway.meterSummary() : null;
      case 'workspace.health': {
        if (!this.workspace)
          throw new BridgeError(INVALID_PARAMS, 'workspace disabled');
        return this.workspace.health();
      }
      case 'workspace.list': {
        if (!this.workspace)
          throw new BridgeError(INVALID_PARAMS, 'workspace disabled');
        return this.workspace.listSessions();
      }
      case 'workspace.get': {
        if (!this.workspace)
          throw new BridgeError(INVALID_PARAMS, 'workspace disabled');
        return this.workspace.getSession(String(params.id));
      }
      case 'workspace.open': {
        if (!this.workspace)
          throw new BridgeError(INVALID_PARAMS, 'workspace disabled');
        return this.workspace.openSession(
          params.request as Parameters<WorkspacePort['openSession']>[0]
        );
      }
      case 'workspace.close': {
        if (!this.workspace)
          throw new BridgeError(INVALID_PARAMS, 'workspace disabled');
        return this.workspace.closeSession(String(params.id));
      }
      case 'health':
        return {
          status: 'ok',
          uptime: process.uptime(),
          clients: this.clients.size,
        };
      default:
        throw new BridgeError(METHOD_NOT_FOUND, `Unknown method: ${method}`);
    }
  }
}

class BridgeError extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
    this.name = 'BridgeError';
  }
}
