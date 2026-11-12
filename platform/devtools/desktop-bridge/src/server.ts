import {
  HermesRuntime,
  MockProvider,
  type HermesConfig,
} from '@ultra-ai/hermes-runtime';
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

export interface BridgeOptions {
  port: number;
  host: string;
  config?: HermesConfig;
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
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();

  constructor(private readonly options: BridgeOptions) {
    this.runtime = new HermesRuntime(options.config ?? {});
    // Default local mock provider — always registered so `provider:'mock'`
    // works out of the box; external adapters can be swapped via set_provider.
    this.runtime.registerProvider(new MockProvider({ id: 'mock' }));
    this.runtime.onEvent((event) => this.broadcast(eventNotification(event)));
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
