import type { WorkspacePort, WorkspaceSession } from '@ultra-ai/workspace';
import { WebSocket } from 'ws';

import type { JsonRpcRequest, JsonRpcResponse } from './protocol';
import { DesktopBridgeServer } from './server';

const fakeWorkspace: WorkspacePort = {
  sessions: [
    {
      id: 'ws-1',
      workspacePath: '/tmp/proj',
      title: 'proj',
      status: 'idle',
      agent: 'openhands',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } satisfies WorkspaceSession,
  ],
  async health() {
    return { reachable: true, baseUrl: 'fake://ws', sessionCount: 1 };
  },
  async listSessions() {
    return this.sessions;
  },
  async openSession(req) {
    const s: WorkspaceSession = {
      id: 'ws-2',
      workspacePath: req.workspacePath,
      title: req.title,
      status: 'idle',
      agent: req.agent ?? 'openhands',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.sessions.push(s);
    return { ok: true, session: s };
  },
  async getSession(id) {
    return this.sessions.find((s) => s.id === id) ?? null;
  },
  async closeSession(id) {
    const i = this.sessions.findIndex((s) => s.id === id);
    if (i < 0) return { ok: false, error: 'not_found' };
    this.sessions.splice(i, 1);
    return { ok: true };
  },
};

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
    server = new DesktopBridgeServer({
      port: PORT,
      host: '127.0.0.1',
      workspace: { port: fakeWorkspace },
    });
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

  it('runs a zeroai request and exposes its trail', async () => {
    const session = (await rpc(ws, 'sessions.create', { agentId: 'default' }))
      .result as { id: string };

    const res = (
      await rpc(ws, 'zeroai.run', {
        id: 'zai-test-1',
        sessionId: session.id,
        text: 'summarize this',
      })
    ).result as {
      status: string;
      locality?: string;
      route?: string;
    };
    expect(['completed', 'awaiting-confirmation']).toContain(res.status);

    const trail = (
      await rpc(ws, 'zeroai.trail.get', { requestId: 'zai-test-1' })
    ).result as {
      requestId: string;
      status: string;
      events: unknown[];
    };
    expect(trail.requestId).toBe('zai-test-1');
    expect(trail.events.length).toBeGreaterThan(0);

    const trails = (
      await rpc(ws, 'zeroai.trail.list', { sessionId: session.id })
    ).result as unknown[];
    expect(trails.length).toBeGreaterThan(0);

    const routes = (await rpc(ws, 'zeroai.routes')).result as string[];
    expect(routes).toContain('local-model');
  });

  it('exposes engine supervisor status over json-rpc', async () => {
    const list = (await rpc(ws, 'engines.list')).result as Array<{
      id: string;
      state: string;
    }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((e) => typeof e.id === 'string')).toBe(true);

    const one = (await rpc(ws, 'engines.status', { id: list[0].id }))
      .result as { id: string };
    expect(one.id).toBe(list[0].id);

    const bad = await rpc(ws, 'engines.status', { id: 'nope' });
    expect(bad.error?.code).toBe(-32601);
  });

  it('exposes embedded workspace sessions over json-rpc', async () => {
    const health = (await rpc(ws, 'workspace.health')).result as {
      reachable: boolean;
    };
    expect(health.reachable).toBe(true);

    const list = (await rpc(ws, 'workspace.list')).result as WorkspaceSession[];
    expect(list.map((s) => s.id)).toContain('ws-1');

    const opened = (
      await rpc(ws, 'workspace.open', {
        request: { workspacePath: '/tmp/new-proj', title: 'new' },
      })
    ).result as { ok: boolean; session?: WorkspaceSession };
    expect(opened.ok).toBe(true);
    expect(opened.session?.workspacePath).toBe('/tmp/new-proj');

    const closed = (await rpc(ws, 'workspace.close', { id: 'ws-2' }))
      .result as { ok: boolean };
    expect(closed.ok).toBe(true);
    const after = (await rpc(ws, 'workspace.list'))
      .result as WorkspaceSession[];
    expect(after.map((s) => s.id)).not.toContain('ws-2');
  });

  it('returns METHOD_NOT_FOUND for unknown methods', async () => {
    const res = await rpc(ws, 'bogus.method');
    expect(res.error?.code).toBe(-32601);
  });

  it('returns error for unknown session', async () => {
    const res = await rpc(ws, 'sessions.get', { id: 'sess-nope' });
    expect(res.error?.code).toBe(-32601);
  });

  it('exposes model catalog, breakers, and usage meter', async () => {
    const models = await rpc(ws, 'models.list', { dataClass: 'public' }, 30);
    expect(models.error).toBeUndefined();
    const list = models.result as Array<{ provider: string; model: string }>;
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((m) => typeof m.provider === 'string')).toBe(true);

    const sens = await rpc(ws, 'models.list', { dataClass: 'regulated' }, 31);
    const sensList = sens.result as Array<{ provider: string }>;
    expect(sensList.every((m) => m.provider !== 'manus')).toBe(true);

    const breakers = await rpc(ws, 'gateway.breakers', {}, 32);
    expect(breakers.error).toBeUndefined();
    expect(typeof breakers.result).toBe('object');

    const usage = await rpc(ws, 'gateway.usage', {}, 33);
    expect(usage.error).toBeUndefined();
  });
  it('dispatches work, gates sensitive tasks, and exposes trails', async () => {
    const pub = await rpc(
      ws,
      'dispatch.run',
      {
        request: {
          task: { kind: 'ops', payload: { note: 'hi' } },
          route: { target: 'local' },
        },
      },
      20
    );
    expect(pub.error).toBeUndefined();
    expect((pub.result as { status: string }).status).toBe('completed');

    const sens = await rpc(
      ws,
      'dispatch.run',
      {
        request: {
          task: {
            kind: 'ops',
            payload: { note: 'secret' },
            sensitivity: 'sensitive',
          },
          route: { target: 'local' },
        },
      },
      21
    );
    const sres = sens.result as {
      status: string;
      dispatch: { dispatchId: string };
    };
    expect(sres.status).toBe('awaiting-confirmation');

    const pending = await rpc(ws, 'dispatch.pending', {}, 24);
    expect(pending.result as string[]).toContain(sres.dispatch.dispatchId);

    const conf = await rpc(
      ws,
      'dispatch.confirm',
      {
        dispatchId: sres.dispatch.dispatchId,
        confirmation: { approved: true, confirmedBy: 'tester' },
      },
      22
    );
    expect((conf.result as { status: string }).status).toBe('completed');

    const trail = await rpc(
      ws,
      'dispatch.trail.get',
      { dispatchId: sres.dispatch.dispatchId },
      23
    );
    expect(
      (trail.result as Array<{ event: string }>).map((t) => t.event)
    ).toEqual(
      expect.arrayContaining([
        'received',
        'confirmation-required',
        'confirmed',
        'completed',
      ])
    );
  });

  it('agent registry, task bus, and delegation surface', async () => {
    const reg = await rpc(
      ws,
      'agents.register',
      {
        agent: {
          agentId: 'spec-1',
          target: 'specialist-agent',
          capabilities: ['code'],
          status: 'online',
        },
      },
      30
    );
    expect(reg.error).toBeUndefined();
    expect((reg.result as { agentId: string }).agentId).toBe('spec-1');

    const list = await rpc(ws, 'agents.list', {}, 31);
    expect(
      (list.result as Array<{ agentId: string }>).map((a) => a.agentId)
    ).toContain('spec-1');

    const off = await rpc(
      ws,
      'agents.status',
      { agentId: 'spec-1', status: 'offline' },
      32
    );
    expect((off.result as { status: string }).status).toBe('offline');
    await rpc(ws, 'agents.unregister', { agentId: 'spec-1' }, 33);

    const bus = await rpc(
      ws,
      'bus.publish',
      {
        dispatch: {
          task: { id: 't-bus', kind: 'ops', payload: {} },
          route: { target: 'local' },
        },
        capability: 'ops',
      },
      34
    );
    const busId = (bus.result as { busId: string }).busId;
    const pending = await rpc(ws, 'bus.pending', { capability: 'ops' }, 35);
    expect(pending.result as unknown[]).toHaveLength(1);
    const ack = await rpc(ws, 'bus.ack', { busId }, 36);
    expect(ack.result).toBe(true);

    const dec = await rpc(
      ws,
      'delegate.check',
      {
        dispatch: {
          task: {
            id: 't-dec',
            kind: 'ops',
            payload: {},
            sensitivity: 'sensitive',
          },
          route: { target: 'hermes' },
        },
      },
      37
    );
    const d = dec.result as { allowed: boolean; requiresConfirmation: boolean };
    expect(d.allowed).toBe(true);
    expect(d.requiresConfirmation).toBe(true);
  });
});
