/**
 * OpenAI-compatible provider adapter.
 *
 * Covers any backend exposing the OpenAI Chat Completions API:
 *   - OpenAI      (https://api.openai.com/v1, Bearer auth)
 *   - Ollama      (http://localhost:11434/v1, no auth)
 *   - 9router / OmniRoute / LM Studio / vLLM / LiteLLM (custom baseURL)
 *
 * Zero dependencies — uses the global fetch (Node >= 18).
 */

import type { HermesMessage } from '../types';

import type {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  ToolDefinition,
  ToolCall,
} from './contracts';
import { ProviderHttpError } from './mock-provider';

export interface OpenAICompatibleOptions {
  /** Provider id label, e.g. 'openai', 'ollama', '9router'. */
  id: string;
  /** Base URL including /v1, e.g. 'https://api.openai.com/v1'. */
  baseURL: string;
  /** API key; omit for local providers (Ollama). */
  apiKey?: string;
  /** Default model when the request doesn't specify one meaningfully. */
  defaultModel?: string;
  /** Request timeout in ms (default 60_000). */
  timeoutMs?: number;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
  /** Capability overrides. */
  capabilities?: Partial<ProviderCapabilities>;
}

interface ChatMessage {
  role: string;
  content: string | null;
  name?: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

interface ChatChoice {
  message?: {
    content?: string | null;
    tool_calls?: Array<{
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
    }>;
  };
}

export class OpenAICompatibleProvider implements ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;

  private baseURL: string;
  private apiKey?: string;
  private defaultModel: string;
  private timeoutMs: number;
  private extraHeaders: Record<string, string>;

  constructor(opts: OpenAICompatibleOptions) {
    this.id = opts.id;
    this.baseURL = opts.baseURL.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.defaultModel = opts.defaultModel ?? 'default';
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.extraHeaders = opts.headers ?? {};
    this.capabilities = {
      streaming: true,
      toolCalling: true,
      embeddings: true,
      ...opts.capabilities,
    };
  }

  async generate(
    req: ProviderGenerateRequest
  ): Promise<ProviderGenerateResponse> {
    const start = Date.now();
    const model =
      req.model && req.model !== 'default' ? req.model : this.defaultModel;

    const body: Record<string, unknown> = {
      model,
      messages: req.messages.map(toOpenAIMessage),
      temperature: req.temperature ?? 0.7,
      stream: false,
    };
    if (req.maxTokens !== undefined) body.max_tokens = req.maxTokens;
    if (req.tools && req.tools.length > 0) {
      body.tools = req.tools.map(toOpenAITool);
    }

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: withTimeout(req.signal, this.timeoutMs),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ProviderHttpError(
        res.status,
        `${this.id} HTTP ${res.status}: ${text.slice(0, 300)}`
      );
    }

    const json = (await res.json()) as {
      choices?: ChatChoice[];
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const msg = json.choices?.[0]?.message;
    const toolCalls = (msg?.tool_calls ?? [])
      .map((tc) => {
        let args: Record<string, unknown> = {};
        try {
          args = tc.function?.arguments
            ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
            : {};
        } catch {
          args = {};
        }
        return {
          id: tc.id ?? `call-${Math.random().toString(36).slice(2, 10)}`,
          name: tc.function?.name ?? '',
          arguments: args,
        } satisfies ToolCall;
      })
      .filter((tc) => tc.name.length > 0);

    return {
      content: msg?.content ?? '',
      model: json.model ?? model,
      provider: this.id,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens ?? 0,
            completionTokens: json.usage.completion_tokens ?? 0,
          }
        : undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      latencyMs: Date.now() - start,
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.defaultModel;
    const res = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ProviderHttpError(
        res.status,
        `${this.id} embeddings HTTP ${res.status}: ${text.slice(0, 300)}`
      );
    }
    const json = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    return (json.data ?? []).map((d) => d.embedding ?? []);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'content-type': 'application/json',
      ...this.extraHeaders,
    };
    if (this.apiKey) h.authorization = `Bearer ${this.apiKey}`;
    return h;
  }
}

function toOpenAIMessage(m: HermesMessage): ChatMessage {
  const msg: ChatMessage = { role: m.role, content: m.content };
  if (m.name) msg.name = m.name;
  if (m.toolCallId) msg.tool_call_id = m.toolCallId;
  return msg;
}

function toOpenAITool(t: ToolDefinition): Record<string, unknown> {
  return {
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  };
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  if (!signal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  AbortSignal.timeout(ms).addEventListener('abort', onAbort, { once: true });
  return controller.signal;
}

/**
 * Factory helpers for well-known OpenAI-compatible providers.
 */
export const providers = {
  openai(apiKey: string, opts?: Partial<OpenAICompatibleOptions>) {
    return new OpenAICompatibleProvider({
      id: 'openai',
      baseURL: 'https://api.openai.com/v1',
      apiKey,
      defaultModel: 'gpt-4o-mini',
      ...opts,
    });
  },
  ollama(opts?: Partial<OpenAICompatibleOptions>) {
    return new OpenAICompatibleProvider({
      id: 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      defaultModel: 'llama3.2',
      ...opts,
    });
  },
  nineRouter(opts?: Partial<OpenAICompatibleOptions>) {
    return new OpenAICompatibleProvider({
      id: '9router',
      baseURL: process.env.NINEROUTER_BASE_URL ?? 'http://localhost:20128/v1',
      defaultModel: 'default',
      ...opts,
    });
  },
} as const;
