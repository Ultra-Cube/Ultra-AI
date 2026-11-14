import type { McpTransportConn, TransportFactory } from './transport';
import type {
  CallPolicy,
  HubCallResult,
  McpServerConfig,
  McpServerInfo,
  McpTool,
} from './types';

export interface HubOptions {
  transportFactory: TransportFactory;
  policies?: Record<string, CallPolicy>;
  /** global deny patterns applied to every server */
  globalDeny?: string[];
}

interface ServerEntry {
  config: McpServerConfig;
  conn?: McpTransportConn;
  tools: McpTool[];
  status: McpServerInfo['status'];
  lastError?: string;
}

function matchPattern(name: string, patterns?: string[]): boolean {
  if (!patterns?.length) return false;
  return patterns.some((p) =>
    p.endsWith('*') ? name.startsWith(p.slice(0, -1)) : name === p
  );
}

export class McpHub {
  private readonly servers = new Map<string, ServerEntry>();
  private readonly opts: HubOptions;

  constructor(opts: HubOptions) {
    this.opts = opts;
  }

  async register(
    name: string,
    config: McpServerConfig
  ): Promise<McpServerInfo> {
    const entry: ServerEntry = { config, tools: [], status: 'disconnected' };
    this.servers.set(name, entry);
    try {
      entry.conn = await this.opts.transportFactory.connect(config);
      entry.tools = await entry.conn.listTools();
      entry.status = 'connected';
    } catch (e) {
      entry.status = 'error';
      entry.lastError = e instanceof Error ? e.message : String(e);
    }
    return this.info(name);
  }

  unregister(name: string): boolean {
    const e = this.servers.get(name);
    if (!e) return false;
    void e.conn?.close();
    return this.servers.delete(name);
  }

  private info(name: string): McpServerInfo {
    const e = this.servers.get(name);
    if (!e) throw new Error(`unknown MCP server: ${name}`);
    const config = e.config;
    return {
      name,
      transport: config.transport,
      tools: e.tools,
      status: e.status,
      lastError: e.lastError,
    };
  }

  listServers(): McpServerInfo[] {
    return [...this.servers.keys()].map((n) => this.info(n));
  }

  listTools(server?: string): { server: string; tool: McpTool }[] {
    const out: { server: string; tool: McpTool }[] = [];
    for (const [name, e] of this.servers) {
      if (server && name !== server) continue;
      for (const tool of e.tools) out.push({ server: name, tool });
    }
    return out;
  }

  private allowed(
    server: string,
    tool: string
  ): { ok: boolean; needsConfirm: boolean } {
    const policy = this.opts.policies?.[server] ?? {};
    if (
      matchPattern(tool, this.opts.globalDeny) ||
      matchPattern(tool, policy.deny)
    ) {
      return { ok: false, needsConfirm: false };
    }
    if (policy.allow?.length && !matchPattern(tool, policy.allow)) {
      return { ok: false, needsConfirm: false };
    }
    return { ok: true, needsConfirm: policy.requireConfirm === true };
  }

  async callTool(
    server: string,
    tool: string,
    args: Record<string, unknown> = {},
    confirmed = false
  ): Promise<HubCallResult> {
    const e = this.servers.get(server);
    if (!e) return { server, tool, error: `unknown server: ${server}` };
    if (e.status !== 'connected' || !e.conn) {
      return {
        server,
        tool,
        error: `server ${server} is ${e.status}${e.lastError ? `: ${e.lastError}` : ''}`,
      };
    }
    const gate = this.allowed(server, tool);
    if (!gate.ok)
      return {
        server,
        tool,
        error: `tool ${tool} denied by policy on ${server}`,
      };
    if (gate.needsConfirm && !confirmed) {
      return { server, tool, error: 'confirmation required', confirmed: false };
    }
    try {
      const result = await e.conn.callTool(tool, args);
      return {
        server,
        tool,
        result,
        confirmed: gate.needsConfirm ? confirmed : undefined,
      };
    } catch (err) {
      return {
        server,
        tool,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Load a brain-stack/mcp/mcp.json-style definition. */
  async loadConfigFile(json: {
    mcpServers?: Record<string, McpServerConfig & { note?: string }>;
  }): Promise<McpServerInfo[]> {
    const out: McpServerInfo[] = [];
    for (const [name, cfg] of Object.entries(json.mcpServers ?? {})) {
      const { note: _note, ...config } = cfg;
      out.push(await this.register(name, config));
    }
    return out;
  }
}
