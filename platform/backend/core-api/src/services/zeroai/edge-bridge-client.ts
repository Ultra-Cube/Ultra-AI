import { WebSocket } from 'ws';

/**
 * EdgeBridgeClient — minimal JSON-RPC client for the desktop bridge
 * (`@ultra-ai/desktop-bridge`, ws://127.0.0.1:19477 by default).
 *
 * Each call opens a short-lived socket: the bridge is a local, single-user
 * surface, so connection-per-call keeps the client stateless and avoids
 * stale-socket bookkeeping in the API process. Notifications (`event` method
 * messages) are ignored; only responses matching the request id resolve.
 */

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: string | number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: JsonRpcError;
}

export class EdgeBridgeOfflineError extends Error {
  constructor(message = 'desktop bridge is offline') {
    super(message);
    this.name = 'EdgeBridgeOfflineError';
  }
}

export class EdgeBridgeClient {
  private nextId = 1;

  constructor(
    private readonly url = process.env.DESKTOP_BRIDGE_URL ??
      'ws://127.0.0.1:19477',
    private readonly timeoutMs = 15000
  ) {}

  async call<T = unknown>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const id = this.nextId++;

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(this.url);

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          ws.close();
        } catch {
          /* already closed */
        }
        fn();
      };

      const timer = setTimeout(() => {
        try {
          ws.terminate();
        } catch {
          /* ignore */
        }
        finish(() =>
          reject(new EdgeBridgeOfflineError('desktop bridge timed out'))
        );
      }, this.timeoutMs);

      ws.on('open', () => {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        let msg: JsonRpcMessage;
        try {
          msg = JSON.parse(raw.toString()) as JsonRpcMessage;
        } catch {
          return;
        }
        // Skip server->client notifications (method === 'event').
        if (msg.method !== undefined || msg.id !== id) return;
        if (msg.error) {
          finish(() => reject(new Error(msg.error?.message ?? 'bridge error')));
        } else {
          finish(() => resolve(msg.result as T));
        }
      });

      ws.on('error', (err) => {
        finish(() => reject(new EdgeBridgeOfflineError(err.message)));
      });
    });
  }
}
