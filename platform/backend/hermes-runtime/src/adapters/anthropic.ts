/**
 * Anthropic provider adapter.
 *
 * Wraps the Anthropic Messages API (https://api.anthropic.com/v1/messages)
 * behind the ProviderAdapter contract. Zero dependencies — global fetch.
 */

import type { HermesMessage } from '../types';

import type {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  ToolCall,
} from './contracts';
import { ProviderHttpError } from './mock-provider';

export interface AnthropicOptions {
  id?: string;
  apiKey: string;
  /** Messages API base; override for proxies. */
  baseURL?: string;
  defaultModel?: string;
  timeoutMs?: number;
  maxTokens?: number;
  capabilities?: Partial<ProviderCapabilities>;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export class AnthropicProvider implements ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;

  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;
  private timeoutMs: number;
  private maxTokens: number;

  constructor(opts: AnthropicOptions) {
    this.id = opts.id ?? 'anthropic';
    this.apiKey = opts.apiKey;
    this.baseURL = (opts.baseURL ?? 'https://api.anthropic.com').replace(
      /\/+$/,
      ''
    );
    this.defaultModel = opts.defaultModel ?? 'claude-sonnet-4-5';
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxTokens = opts.maxTokens ?? 4096;
    this.capabilities = {
      streaming: true,
      toolCalling: true,
      embeddings: false,
      maxContextTokens: 200_000,
      ...opts.capabilities,
    };
  }

  async generate(
    req: ProviderGenerateRequest
  ): Promise<ProviderGenerateResponse> {
    const start = Date.now();
    const model =
      req.model && req.model !== 'default' ? req.model : this.defaultModel;

    const { system, messages } = toAnthropicMessages(req.messages);
    const body: Record<string, unknown> = {
      model,
      max_tokens: req.maxTokens ?? this.maxTokens,
      messages,
      temperature: req.temperature ?? 0.7,
    };
    if (system) body.system = system;
    if (req.tools && req.tools.length > 0) {
      body.tools = req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const res = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
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
      content?: AnthropicContentBlock[];
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const blocks = json.content ?? [];
    const content = blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    const toolCalls: ToolCall[] = blocks
      .filter((b) => b.type === 'tool_use')
      .map((b) => ({
        id: b.id ?? `call-${Math.random().toString(36).slice(2, 10)}`,
        name: b.name ?? '',
        arguments: b.input ?? {},
      }))
      .filter((tc) => tc.name.length > 0);

    return {
      content,
      model: json.model ?? model,
      provider: this.id,
      usage: json.usage
        ? {
            promptTokens: json.usage.input_tokens ?? 0,
            completionTokens: json.usage.output_tokens ?? 0,
          }
        : undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      latencyMs: Date.now() - start,
    };
  }
}

/** Anthropic Messages API has no 'system' role — hoist it to a top-level field. */
function toAnthropicMessages(messages: HermesMessage[]): {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const systemParts: string[] = [];
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
      continue;
    }
    if (m.role === 'tool') {
      out.push({
        role: 'user',
        content: `[tool ${m.name ?? ''} ${m.toolCallId ?? ''}] ${m.content}`,
      });
      continue;
    }
    out.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    });
  }
  return { system: systemParts.join('\n') || undefined, messages: out };
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  if (!signal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  AbortSignal.timeout(ms).addEventListener('abort', onAbort, { once: true });
  return controller.signal;
}
