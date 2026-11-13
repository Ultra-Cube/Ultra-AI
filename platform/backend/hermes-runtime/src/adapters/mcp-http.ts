/**
 * MCP client over HTTP (streamable-HTTP / JSON-RPC 2.0 subset).
 *
 * Implements the runtime `MCPClient` contract against MCP servers that accept
 * `POST {url}` JSON-RPC requests with `initialize` / `tools/list` / `tools/call`.
 * `stdio` and `sse` transports are declared unsupported here — use the official
 * `@modelcontextprotocol/sdk` for those.
 */

import type { MCPClient, MCPServerConfig, MCPToolInfo } from './contracts';

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface HttpMCPClientOptions {
  /** Default request timeout in ms. */
  timeoutMs?: number;
  /** Extra headers (e.g. Authorization). */
  headers?: Record<string, string>;
  /** Custom fetch implementation (testing). */
  fetchImpl?: typeof fetch;
}

export class HttpMCPClient implements MCPClient {
  private config: MCPServerConfig | null = null;
  private sessionId: string | null = null;
  private nextId = 1;
  private readonly opts: Required<Pick<HttpMCPClientOptions, 'timeoutMs'>> &
    HttpMCPClientOptions;

  constructor(options: HttpMCPClientOptions = {}) {
    this.opts = { timeoutMs: 30_000, ...options };
  }

  async connect(config: MCPServerConfig): Promise<void> {
    if (config.transport !== 'http') {
      throw new Error(
        `HttpMCPClient supports only transport 'http', got '${config.transport}'`
      );
    }
    if (!config.url) throw new Error('MCP http transport requires config.url');
    this.config = config;

    const init = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'ultra-ai-hermes-runtime', version: '0.0.0' },
    });
    const result = init as { protocolVersion?: string } | undefined;
    this.sessionId =
      result && typeof result === 'object' && 'sessionId' in result
        ? String((result as { sessionId?: unknown }).sessionId)
        : null;

    // Notification (no id) — fire and forget.
    await this.notify('notifications/initialized', {});
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.sessionId = null;
  }

  async listTools(): Promise<MCPToolInfo[]> {
    const res = (await this.request('tools/list', {})) as
      | {
          tools?: Array<{
            name: string;
            description?: string;
            inputSchema?: Record<string, unknown>;
          }>;
        }
      | undefined;
    return (res?.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? { type: 'object' },
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const res = (await this.request('tools/call', {
      name,
      arguments: args,
    })) as { content?: unknown; isError?: boolean } | undefined;
    if (res?.isError) {
      const text = Array.isArray(res.content)
        ? res.content.map((c) => (c as { text?: string }).text ?? '').join('\n')
        : String(res.content ?? 'tool error');
      throw new Error(text || 'MCP tool call failed');
    }
    return res;
  }

  // -------------------------------------------------------------------------

  private endpoint(): string {
    if (!this.config?.url) throw new Error('MCP client not connected');
    return this.config.url;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(this.opts.headers ?? {}),
    };
    if (this.config?.env?.MCP_AUTH_TOKEN) {
      h.authorization = `Bearer ${this.config.env.MCP_AUTH_TOKEN}`;
    }
    return h;
  }

  private async request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    const res = await fetchImpl(this.endpoint(), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      signal: AbortSignal.timeout(this.opts.timeoutMs),
    });
    if (!res.ok) {
      throw new Error(
        `MCP HTTP ${res.status}: ${await res.text().catch(() => '')}`
      );
    }
    const body = (await res.json()) as JsonRpcResponse | JsonRpcResponse[];
    const msg = Array.isArray(body) ? body.find((m) => m.id === id) : body;
    if (!msg) throw new Error('MCP response missing matching id');
    if (msg.error) {
      throw new Error(`MCP error ${msg.error.code}: ${msg.error.message}`);
    }
    return msg.result;
  }

  private async notify(method: string, params: unknown): Promise<void> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;
    await fetchImpl(this.endpoint(), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ jsonrpc: '2.0', method, params }),
      signal: AbortSignal.timeout(this.opts.timeoutMs),
    }).catch(() => {
      // notifications are best-effort
    });
  }
}
