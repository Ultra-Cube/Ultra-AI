// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { OpenHandsWorkspaceClient } from './client';
import { WorkspaceError } from './types';

const BASE = 'http://127.0.0.1:3300';

function mockFetch(routes: Record<string, { status: number; body?: unknown }>) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const impl = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });
    const path = url.replace(BASE, '');
    const route = routes[`${method} ${path}`];
    if (!route) {
      return new Response('not found', { status: 404 });
    }
    return new Response(
      route.body === undefined ? null : JSON.stringify(route.body),
      { status: route.status, headers: { 'content-type': 'application/json' } }
    );
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

describe('OpenHandsWorkspaceClient', () => {
  it('reports unreachable when sidecar is down', async () => {
    const client = new OpenHandsWorkspaceClient({
      fetchImpl: jest.fn(async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as typeof fetch,
    });
    const health = await client.health();
    expect(health.reachable).toBe(false);
    expect(health.baseUrl).toBe(BASE);
  });

  it('reports healthy with version when /api/health responds', async () => {
    const { impl } = mockFetch({
      'GET /api/health': { status: 200, body: { version: '1.2.3' } },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const health = await client.health();
    expect(health.reachable).toBe(true);
    expect(health.version).toBe('1.2.3');
  });

  it('lists sessions and maps statuses', async () => {
    const { impl } = mockFetch({
      'GET /api/conversations': {
        status: 200,
        body: [
          {
            conversation_id: 'c1',
            title: 'fix bug',
            status: 'running',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:01:00Z',
            workspace: { working_dir: '/repo' },
          },
          { id: 'c2', status: 'failed', error: 'boom' },
        ],
      },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const sessions = await client.listSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].status).toBe('running');
    expect(sessions[0].workspacePath).toBe('/repo');
    expect(sessions[1].status).toBe('error');
    expect(sessions[1].lastError).toBe('boom');
  });

  it('returns [] when list endpoint is missing (404)', async () => {
    const { impl } = mockFetch({});
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    expect(await client.listSessions()).toEqual([]);
  });

  it('creates a session with workspace payload', async () => {
    const { impl, calls } = mockFetch({
      'POST /api/conversations': {
        status: 201,
        body: { conversation_id: 'c9', status: 'idle' },
      },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const res = await client.openSession({
      workspacePath: '/home/u/proj',
      title: 'My workspace',
      initialTask: 'add tests',
    });
    expect(res.ok).toBe(true);
    expect(res.session?.id).toBe('c9');
    expect(res.session?.workspacePath).toBe('');
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toMatchObject({
      workspace: { working_dir: '/home/u/proj' },
      title: 'My workspace',
      initial_task: 'add tests',
    });
  });

  it('rejects openSession without workspacePath', async () => {
    const { impl } = mockFetch({});
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const res = await client.openSession({ workspacePath: '' });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('workspacePath');
  });

  it('returns null for missing session on get', async () => {
    const { impl } = mockFetch({});
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    expect(await client.getSession('nope')).toBeNull();
  });

  it('gets a session by id', async () => {
    const { impl } = mockFetch({
      'GET /api/conversations/c1': {
        status: 200,
        body: { conversation_id: 'c1', status: 'paused' },
      },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const s = await client.getSession('c1');
    expect(s?.id).toBe('c1');
    expect(s?.status).toBe('paused');
  });

  it('closes a session via DELETE', async () => {
    const { impl, calls } = mockFetch({
      'DELETE /api/conversations/c1': { status: 204 },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const res = await client.closeSession('c1');
    expect(res.ok).toBe(true);
    expect(calls[0].method).toBe('DELETE');
  });

  it('reports not_found on close for unknown session', async () => {
    const { impl } = mockFetch({
      'DELETE /api/conversations/x': { status: 404 },
    });
    const client = new OpenHandsWorkspaceClient({ fetchImpl: impl });
    const res = await client.closeSession('x');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('not found');
  });

  it('wraps transport failures in WorkspaceError for list', async () => {
    const client = new OpenHandsWorkspaceClient({
      fetchImpl: jest.fn(async () => {
        throw new Error('timeout');
      }) as unknown as typeof fetch,
    });
    await expect(client.listSessions()).rejects.toBeInstanceOf(WorkspaceError);
  });
});
