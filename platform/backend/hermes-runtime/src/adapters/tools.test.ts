import { describe, expect, it } from '@jest/globals';

import type { ToolCall, ToolContext } from './contracts';
import { HttpMCPClient } from './mcp-http';
import {
  ToolRegistry,
  builtinTools,
  calculatorTool,
  datetimeTool,
  echoTool,
  functionTool,
} from './tools';

const ctx: ToolContext = { sessionId: 's1', agentId: 'a1' };
const call = (name: string, args: Record<string, unknown> = {}): ToolCall => ({
  id: `c-${name}`,
  name,
  arguments: args,
});

describe('ToolRegistry', () => {
  it('registers and lists tool definitions', () => {
    const reg = new ToolRegistry();
    reg.register(echoTool);
    reg.register(datetimeTool);
    expect(reg.definitions.map((d) => d.name)).toEqual(['echo', 'datetime']);
    expect(reg.has('echo')).toBe(true);
  });

  it('rejects duplicate tool names', () => {
    const reg = new ToolRegistry();
    reg.register(echoTool);
    expect(() => reg.register(echoTool)).toThrow('already registered');
  });

  it('unregisters tools', () => {
    const reg = new ToolRegistry();
    reg.register(echoTool);
    expect(reg.unregister('echo')).toBe(true);
    expect(reg.has('echo')).toBe(false);
    expect(reg.unregister('echo')).toBe(false);
  });

  it('invokes a registered tool and stamps callId', async () => {
    const reg = new ToolRegistry();
    reg.register(echoTool);
    const res = await reg.invoke(call('echo', { text: 'hi' }), ctx);
    expect(res.ok).toBe(true);
    expect(res.content).toBe('hi');
    expect(res.callId).toBe('c-echo');
  });

  it('returns an error result for unknown tools', async () => {
    const reg = new ToolRegistry();
    const res = await reg.invoke(call('nope'), ctx);
    expect(res.ok).toBe(false);
    expect(res.isError).toBe(true);
    expect(res.content).toContain('unknown tool');
  });

  it('catches tool exceptions into error results', async () => {
    const reg = new ToolRegistry();
    reg.register(
      functionTool(
        { name: 'boom', description: '', parameters: { type: 'object' } },
        () => {
          throw new Error('kaput');
        }
      )
    );
    const res = await reg.invoke(call('boom'), ctx);
    expect(res.ok).toBe(false);
    expect(res.content).toBe('kaput');
  });
});

describe('builtin tools', () => {
  it('echo returns input text', async () => {
    const res = await echoTool.invoke({ text: 'hello' }, ctx);
    expect(res.content).toBe('hello');
  });

  it('datetime returns ISO 8601', async () => {
    const res = await datetimeTool.invoke({}, ctx);
    expect(res.content).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('calculator evaluates safe arithmetic', async () => {
    const res = await calculatorTool.invoke({ expression: '2 + 3 * 4' }, ctx);
    expect(res.content).toBe('14');
  });

  it('calculator rejects unsafe expressions', async () => {
    await expect(
      calculatorTool.invoke({ expression: 'process.exit()' }, ctx)
    ).rejects.toThrow('invalid expression');
  });

  it('builtinTools contains all three tools', () => {
    expect(builtinTools.map((t) => t.definition.name)).toEqual([
      'echo',
      'datetime',
      'calculator',
    ]);
  });
});

describe('HttpMCPClient', () => {
  const makeFetch =
    (handler: (method: string, params: unknown) => unknown) =>
    async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        id?: number;
        method: string;
        params: unknown;
      };
      const result = handler(body.method, body.params);
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: body.id ?? null, result }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

  it('rejects non-http transports', async () => {
    const client = new HttpMCPClient();
    await expect(
      client.connect({ id: 'x', transport: 'stdio', command: 'foo' })
    ).rejects.toThrow("only transport 'http'");
  });

  it('requires a url for http transport', async () => {
    const client = new HttpMCPClient();
    await expect(
      client.connect({ id: 'x', transport: 'http' })
    ).rejects.toThrow('requires config.url');
  });

  it('connects, lists tools, and calls a tool', async () => {
    const calls: string[] = [];
    const client = new HttpMCPClient({
      fetchImpl: makeFetch((method) => {
        calls.push(method);
        if (method === 'tools/list') {
          return {
            tools: [
              {
                name: 'search',
                description: 'Search',
                inputSchema: { type: 'object' },
              },
            ],
          };
        }
        if (method === 'tools/call') {
          return { content: [{ type: 'text', text: 'found' }] };
        }
        return { protocolVersion: '2024-11-05' };
      }) as typeof fetch,
    });
    await client.connect({
      id: 'srv',
      transport: 'http',
      url: 'http://mcp.local/rpc',
    });
    const tools = await client.listTools();
    expect(tools).toEqual([
      {
        name: 'search',
        description: 'Search',
        inputSchema: { type: 'object' },
      },
    ]);
    const out = (await client.callTool('search', { q: 'x' })) as {
      content: Array<{ text: string }>;
    };
    expect(out.content[0].text).toBe('found');
    expect(calls).toContain('initialize');
    expect(calls).toContain('tools/list');
    expect(calls).toContain('tools/call');
  });

  it('throws on MCP error responses', async () => {
    const client = new HttpMCPClient({
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32601, message: 'method not found' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )) as typeof fetch,
    });
    await expect(
      client.connect({ id: 'x', transport: 'http', url: 'http://mcp.local' })
    ).rejects.toThrow('MCP error -32601');
  });
});
