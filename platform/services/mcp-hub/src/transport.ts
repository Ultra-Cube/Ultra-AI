import type { McpServerConfig, McpTool, McpToolResult } from './types';

/**
 * Transport contract — a connected MCP server endpoint.
 * Implementations: StdioTransport (child process JSON-RPC),
 * HttpTransport/SseTransport (JSON-RPC over HTTP).
 * The hub stays transport-agnostic; real transports plug in here.
 */
export interface McpTransportConn {
  listTools(): Promise<McpTool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult>;
  close(): Promise<void>;
}

export interface TransportFactory {
  connect(config: McpServerConfig): Promise<McpTransportConn>;
}

/** In-memory transport for tests and offline operation. */
export class InMemoryTransport implements McpTransportConn {
  readonly tools = new Map<
    string,
    { tool: McpTool; handler: (args: Record<string, unknown>) => McpToolResult }
  >();
  closed = false;

  addTool(
    name: string,
    description: string,
    handler: (args: Record<string, unknown>) => McpToolResult
  ) {
    this.tools.set(name, { tool: { name, description }, handler });
  }

  async listTools(): Promise<McpTool[]> {
    return [...this.tools.values()].map((t) => t.tool);
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<McpToolResult> {
    const t = this.tools.get(name);
    if (!t) return { content: null, isError: true };
    return t.handler(args);
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

export class InMemoryTransportFactory implements TransportFactory {
  readonly conns = new Map<string, InMemoryTransport>();
  connect(config: McpServerConfig): Promise<McpTransportConn> {
    const key =
      'command' in config
        ? `${config.command} ${(config.args ?? []).join(' ')}`
        : config.url;
    let conn = this.conns.get(key);
    if (!conn) {
      conn = new InMemoryTransport();
      this.conns.set(key, conn);
    }
    return Promise.resolve(conn);
  }
}
