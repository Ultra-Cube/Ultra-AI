import WebSocket from 'ws';

import type { JsonRpcRequest, JsonRpcResponse } from './protocol';
import { DesktopBridgeServer } from './server';

const PORT = 19477;
const URL = `ws://127.0.0.1:${PORT}`;

function rpc(
  ws: WebSocket,
  method: string,
  params: Record<string, unknown> = {},
  id = 1
): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const onMessage = (data: WebSocket.RawData) => {
      const msg = JSON.parse(data.toString()) as JsonRpcResponse & {
        method?: string;
      };
      if (msg.method === 'event') return; // skip notifications
      if (msg.id === id) {
        ws.off('message', onMessage);
        resolve(msg);
      }
    };
    ws.on('message', onMessage);
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      } satisfies JsonRpcRequest)
    );
    setTimeout(() => reject(new Error('rpc timeout')), 8000);
  });
}

describe('DesktopBridgeServer', () => {
  let server: DesktopBridgeServer;
  let ws: WebSocket;

  beforeAll(async () => {
    server = new DesktopBridgeServer({ port: PORT, host: '127.0.0.1' });
    await server.start();
    ws = new WebSocket(URL);
    await new Promise((r) => ws.once('open', r));
  });

  afterAll(async () => {
    ws.close();
    await server.stop();
  });

  it('health returns ok', async () => {
    const res = await rpc(ws, 'health');
    expect(res.error).toBeUndefined();
    expect((res.result as { status: string }).status).toBe('ok');
  });

  it('creates a session and runs a task end-to-end', async () => {
    const session = (await rpc(ws, 'sessions.create', { agentId: 'default' }))
      .result as { id: string };
    expect(session.id).toMatch(/^sess-/);

    const task = (
      await rpc(ws, 'tasks.run', {
        sessionId: session.id,
        prompt: 'hello bridge',
      })
    ).result as {
      id: string;
      status: string;
    };
    expect(task.status).toBe('completed');
    expect(task.id).toMatch(/^task-/);
  });

  it('lists sessions and tasks', async () => {
    const sessions = (await rpc(ws, 'sessions.list')).result as unknown[];
    expect(sessions.length).toBeGreaterThan(0);
    const tasks = (await rpc(ws, 'tasks.list')).result as unknown[];
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('memory write/query roundtrip', async () => {
    await rpc(ws, 'memory.write', {
      scope: 'long-term',
      namespace: 'bridge-test',
      content: 'bridge fact',
    });
    const entries = (
      await rpc(ws, 'memory.query', {
        namespace: 'bridge-test',
        scope: 'long-term',
      })
    ).result as unknown[];
    expect(entries.length).toBeGreaterThan(0);
  });

  it('returns METHOD_NOT_FOUND for unknown methods', async () => {
    const res = await rpc(ws, 'bogus.method');
    expect(res.error?.code).toBe(-32601);
  });

  it('returns error for unknown session', async () => {
    const res = await rpc(ws, 'sessions.get', { id: 'sess-nope' });
    expect(res.error?.code).toBe(-32601);
  });
});
