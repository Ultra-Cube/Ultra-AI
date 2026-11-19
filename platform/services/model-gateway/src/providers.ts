// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { PROVIDER_BASE_URLS } from './catalog';
import type { ChatRequest, ProviderAdapter, ProviderId, Usage } from './types';

export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<Promise<string>>;
}>;

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * OpenAI-compatible chat-completions adapter.
 * Covers deepseek, glm, kimi, openai-compatible, ollama —
 * all expose POST {base}/chat/completions with Bearer auth
 * and a normalized usage block. Manus uses a task API and
 * gets its own adapter below.
 */
export class OpenAICompatibleProvider implements ProviderAdapter {
  readonly id: ProviderId;
  readonly baseURL: string;
  private readonly fetchImpl: FetchLike;

  constructor(id: ProviderId, baseURL?: string, fetchImpl?: FetchLike) {
    this.id = id;
    this.baseURL = (baseURL ?? PROVIDER_BASE_URLS[id]).replace(/\/$/, '');
    this.fetchImpl = fetchImpl ?? (fetch as unknown as FetchLike);
  }

  async chat(
    req: ChatRequest,
    apiKey?: string
  ): Promise<{ content: string; usage: Usage }> {
    const model = req.model ?? (await this.defaultModel(req));
    const body: Record<string, unknown> = {
      model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
    };
    if (req.maxTokens) body.max_tokens = req.maxTokens;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const timeout = req.timeoutMs ?? 60_000;
    const res = await this.fetchImpl(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `${this.id} chat failed: HTTP ${res.status} ${detail.slice(0, 200)}`
      );
    }
    const json = (await res.json()) as OpenAIChatResponse;
    const content = json.choices?.[0]?.message?.content ?? '';
    const u = json.usage ?? {};
    const usage: Usage = {
      promptTokens: u.prompt_tokens ?? 0,
      completionTokens: u.completion_tokens ?? 0,
      totalTokens: u.total_tokens ?? 0,
    };
    return { content, usage };
  }

  private async defaultModel(req: ChatRequest): Promise<string> {
    const { catalogFor } = await import('./catalog');
    const entries = catalogFor(this.id).filter(
      (m) =>
        !req.taskClass ||
        m.capabilities.includes(
          req.taskClass as 'chat' | 'reasoning' | 'code' | 'agent'
        ) ||
        req.taskClass === 'summarize'
    );
    const pick = entries[0] ?? catalogFor(this.id)[0];
    if (!pick) throw new Error(`no catalog model for provider ${this.id}`);
    return pick.model;
  }
}

/**
 * Manus adapter — agentic task API. Manus exposes a
 * task-creation endpoint rather than chat completions;
 * v0 maps a chat request onto a single-shot task prompt and
 * returns the task result text. Real Manus deployments may
 * need polling; the contract here is deliberately minimal.
 */
export class ManusProvider implements ProviderAdapter {
  readonly id: ProviderId = 'manus';
  readonly baseURL: string;
  private readonly fetchImpl: FetchLike;

  constructor(baseURL?: string, fetchImpl?: FetchLike) {
    this.baseURL = (baseURL ?? PROVIDER_BASE_URLS.manus).replace(/\/$/, '');
    this.fetchImpl = fetchImpl ?? (fetch as unknown as FetchLike);
  }

  async chat(
    req: ChatRequest,
    apiKey?: string
  ): Promise<{ content: string; usage: Usage }> {
    const prompt = req.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    const res = await this.fetchImpl(`${this.baseURL}/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        prompt,
        model: req.model ?? 'manus-1.0',
      }),
      signal: AbortSignal.timeout(req.timeoutMs ?? 120_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `manus task failed: HTTP ${res.status} ${detail.slice(0, 200)}`
      );
    }
    const json = (await res.json()) as {
      result?: string;
      output?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const u = json.usage ?? {};
    return {
      content: json.result ?? json.output ?? '',
      usage: {
        promptTokens: u.prompt_tokens ?? 0,
        completionTokens: u.completion_tokens ?? 0,
        totalTokens: u.total_tokens ?? 0,
      },
    };
  }
}
