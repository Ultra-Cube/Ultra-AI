import { McpHub } from './hub';
import { InMemoryTransportFactory } from './transport';
import type { McpServerConfig } from './types';

const fsCfg: McpServerConfig = {
  transport: 'stdio',
  command: 'npx',
  args: ['-y', 'server-fs'],
};
describe('McpHub', () => {
  it('registers servers and aggregates tool listings', async () => {
    const f = new InMemoryTransportFactory();
    const hub = new McpHub({ transportFactory: f });
    // pre-seed the in-memory conn the factory will return
    const proto = await f.connect(fsCfg);
    const { InMemoryTransport } = await import('./transport');
    const t = proto as InstanceType<typeof InMemoryTransport>;
    t.addTool('read_file', 'Read a file', () => ({ content: 'data' }));
    t.addTool('write_file', 'Write a file', () => ({ content: 'ok' }));

    const info = await hub.register('filesystem', fsCfg);
    expect(info.status).toBe('connected');
    expect(info.tools.map((x) => x.name)).toEqual(['read_file', 'write_file']);

    const all = hub.listTools();
    expect(all).toHaveLength(2);
    expect(all.every((x) => x.server === 'filesystem')).toBe(true);
  });

  it('routes calls to the right server/tool', async () => {
    const f = new InMemoryTransportFactory();
    const hub = new McpHub({ transportFactory: f });
    const conn = (await f.connect(
      fsCfg
    )) as import('./transport').InMemoryTransport;
    conn.addTool('read_file', 'Read', (args) => ({
      content: `read:${args.path}`,
    }));
    await hub.register('filesystem', fsCfg);

    const res = await hub.callTool('filesystem', 'read_file', {
      path: '/a.txt',
    });
    expect(res.error).toBeUndefined();
    expect(res.result?.content).toBe('read:/a.txt');
  });

  it('enforces deny and allow policies', async () => {
    const f = new InMemoryTransportFactory();
    const hub = new McpHub({
      transportFactory: f,
      policies: { filesystem: { allow: ['read_*'], deny: ['read_secret*'] } },
      globalDeny: ['*admin*'],
    });
    const conn = (await f.connect(
      fsCfg
    )) as import('./transport').InMemoryTransport;
    conn.addTool('read_file', '', () => ({ content: 'ok' }));
    conn.addTool('read_secret', '', () => ({ content: 'secret' }));
    conn.addTool('admin_reset', '', () => ({ content: 'boom' }));
    conn.addTool('write_file', '', () => ({ content: 'w' }));
    await hub.register('filesystem', fsCfg);

    expect(
      (await hub.callTool('filesystem', 'read_file')).error
    ).toBeUndefined();
    expect((await hub.callTool('filesystem', 'read_secret')).error).toMatch(
      /denied/
    );
    expect((await hub.callTool('filesystem', 'admin_reset')).error).toMatch(
      /denied/
    );
    expect((await hub.callTool('filesystem', 'write_file')).error).toMatch(
      /denied/
    );
  });

  it('gates requireConfirm tools until confirmed', async () => {
    const f = new InMemoryTransportFactory();
    const hub = new McpHub({
      transportFactory: f,
      policies: { filesystem: { requireConfirm: true } },
    });
    const conn = (await f.connect(
      fsCfg
    )) as import('./transport').InMemoryTransport;
    conn.addTool('delete_all', '', () => ({ content: 'deleted' }));
    await hub.register('filesystem', fsCfg);

    const pending = await hub.callTool('filesystem', 'delete_all');
    expect(pending.error).toMatch(/confirmation/);
    const done = await hub.callTool('filesystem', 'delete_all', {}, true);
    expect(done.error).toBeUndefined();
    expect(done.result?.content).toBe('deleted');
  });

  it('reports disconnected/error server status', async () => {
    const f = {
      connect: () => Promise.reject(new Error('spawn failed')),
    };
    const hub = new McpHub({ transportFactory: f });
    const info = await hub.register('broken', fsCfg);
    expect(info.status).toBe('error');
    expect(info.lastError).toBe('spawn failed');
    const res = await hub.callTool('broken', 'x');
    expect(res.error).toMatch(/spawn failed/);
  });

  it('loads mcp.json-style config and unregisters cleanly', async () => {
    const f = new InMemoryTransportFactory();
    const hub = new McpHub({ transportFactory: f });
    const infos = await hub.loadConfigFile({
      mcpServers: {
        filesystem: {
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'srv'],
          note: 'optional',
        },
        remote: { transport: 'http', url: 'http://x/mcp' },
      },
    });
    expect(infos).toHaveLength(2);
    expect(
      hub
        .listServers()
        .map((s) => s.name)
        .sort()
    ).toEqual(['filesystem', 'remote']);
    expect(hub.unregister('remote')).toBe(true);
    expect(hub.unregister('remote')).toBe(false);
  });
});
