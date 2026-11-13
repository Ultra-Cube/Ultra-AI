/**
 * Engine adapters — HTTP clients for external workflow/agent engines.
 *
 *   - N8nEngine       n8n webhook trigger (POST goal payload, JSON answer)
 *   - LangflowEngine  Langflow flow runner (POST /api/v1/run/{flowId})
 *   - DifyEngine      Dify chat/workflow app (POST /v1/chat-messages, blocking)
 *   - OpenHandsEngine OpenHands agent (POST /api/conversations + status poll)
 *   - openWebUI()     Open WebUI as an OpenAI-compatible provider
 *
 * Zero dependencies — uses the global fetch (Node >= 18). Engine-specific
 * response shapes are isolated behind small extractor hooks so upstream API
 * drift only requires a config change, not a code change.
 */

import type {
  EngineAdapter,
  EngineDeps,
  EngineRunRequest,
  EngineRunResult,
  EngineStep,
} from './contracts';
import { OpenAICompatibleProvider } from './openai-compatible';

export interface EngineHttpOptions {
  /** Engine id label, e.g. 'n8n', 'langflow', 'dify', 'openhands'. */
  id: string;
  /** Base URL of the engine, e.g. 'http://localhost:5678'. */
  baseURL: string;
  /** API key / bearer token when the engine requires auth. */
  apiKey?: string;
  /** Request timeout in ms (default 60_000; OpenHands polls may need more). */
  timeoutMs?: number;
  /** Polling interval for async engines in ms (default 2_000). */
  pollIntervalMs?: number;
  /** Max poll iterations for async engines (default 150 ≈ 5 min at 2s). */
  maxPolls?: number;
  /** Extra headers merged into every request. */
  headers?: Record<string, string>;
}

export class EngineHttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'EngineHttpError';
  }
}

async function requestJson<T>(
  method: string,
  url: string,
  opts: EngineHttpOptions,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(opts.headers ?? {}),
  };
  if (opts.apiKey) headers.authorization = `Bearer ${opts.apiKey}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: withTimeout(signal, opts.timeoutMs ?? 60_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new EngineHttpError(
      res.status,
      `${opts.id} HTTP ${res.status}: ${text.slice(0, 300)}`
    );
  }
  return (await res.json()) as T;
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  if (!signal) return AbortSignal.timeout(ms);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  AbortSignal.timeout(ms).addEventListener('abort', onAbort, { once: true });
  return controller.signal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function baseUrl(opts: EngineHttpOptions): string {
  return opts.baseURL.replace(/\/+$/, '');
}

function singleStep(content: string): EngineStep[] {
  return [{ kind: 'answer', content }];
}

function goalContext(req: EngineRunRequest): Record<string, unknown> {
  return {
    goal: req.goal,
    messages: req.context.map((m) => ({ role: m.role, content: m.content })),
  };
}

// ---------------------------------------------------------------------------
// n8n — webhook-triggered workflows
// ---------------------------------------------------------------------------

export interface N8nEngineOptions extends EngineHttpOptions {
  /**
   * Full webhook URL. When omitted, `baseURL` + `/webhook/` + `webhookPath`
   * is used (n8n production webhook convention).
   */
  webhookURL?: string;
  /** Path segment appended to `${baseURL}/webhook/` (default 'ultra'). */
  webhookPath?: string;
  /**
   * Dot-separated path into the JSON response used as the answer.
   * Default: the whole response body serialized.
   */
  responsePath?: string;
}

export class N8nEngine implements EngineAdapter {
  readonly id = 'n8n';
  private opts: N8nEngineOptions;

  constructor(opts: N8nEngineOptions) {
    this.opts = opts;
  }

  async run(req: EngineRunRequest): Promise<EngineRunResult> {
    const url =
      this.opts.webhookURL ??
      `${baseUrl(this.opts)}/webhook/${this.opts.webhookPath ?? 'ultra'}`;
    const body = await requestJson<unknown>(
      'POST',
      url,
      this.opts,
      goalContext(req),
      req.signal
    );
    const answer = this.extract(body);
    return {
      answer,
      steps: singleStep(answer),
      toolCallsMade: 0,
      iterationsUsed: 1,
    };
  }

  private extract(body: unknown): string {
    const path = this.opts.responsePath;
    if (!path) {
      return typeof body === 'string' ? body : JSON.stringify(body);
    }
    let cur: unknown = body;
    for (const key of path.split('.')) {
      if (cur === null || typeof cur !== 'object') return '';
      cur = (cur as Record<string, unknown>)[key];
    }
    return typeof cur === 'string' ? cur : JSON.stringify(cur ?? '');
  }
}

// ---------------------------------------------------------------------------
// Langflow — flow execution API
// ---------------------------------------------------------------------------

export interface LangflowEngineOptions extends EngineHttpOptions {
  /** Flow id to execute (required). */
  flowId: string;
  /** Input type sent to the flow (default 'chat'). */
  inputType?: string;
  /** Output type requested from the flow (default 'chat'). */
  outputType?: string;
  /**
   * Extract the answer text from the run response.
   * Default digs into outputs[0].outputs[0].results.message.data.text and
   * falls back to the serialized body.
   */
  extract?: (body: unknown) => string;
}

export class LangflowEngine implements EngineAdapter {
  readonly id = 'langflow';
  private opts: LangflowEngineOptions;

  constructor(opts: LangflowEngineOptions) {
    this.opts = opts;
  }

  async run(req: EngineRunRequest): Promise<EngineRunResult> {
    const body = await requestJson<unknown>(
      'POST',
      `${baseUrl(this.opts)}/api/v1/run/${this.opts.flowId}/`,
      this.opts,
      {
        input_value: req.goal,
        input_type: this.opts.inputType ?? 'chat',
        output_type: this.opts.outputType ?? 'chat',
        session_id: `hermes-${Date.now()}`,
      },
      req.signal
    );
    const answer = this.opts.extract
      ? this.opts.extract(body)
      : defaultLangflowExtract(body);
    return {
      answer,
      steps: singleStep(answer),
      toolCallsMade: 0,
      iterationsUsed: 1,
    };
  }
}

function defaultLangflowExtract(body: unknown): string {
  const b = body as {
    outputs?: Array<{
      outputs?: Array<{ results?: { message?: { data?: { text?: string } } } }>;
    }>;
  };
  const text = b?.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text;
  return text ?? (typeof body === 'string' ? body : JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// Dify — chat-messages / workflows run API
// ---------------------------------------------------------------------------

export interface DifyEngineOptions extends EngineHttpOptions {
  /** Dify app api_key (sent as Bearer). Required. */
  appApiKey: string;
  /** Dify user id stamped on each request (default 'hermes-runtime'). */
  user?: string;
  /** response_mode: 'blocking' (default) or 'streaming' is unsupported. */
  mode?: 'chat' | 'workflow';
  /** Workflow id, required when mode='workflow'. */
  workflowId?: string;
}

export class DifyEngine implements EngineAdapter {
  readonly id = 'dify';
  private opts: DifyEngineOptions;

  constructor(opts: DifyEngineOptions) {
    if (!opts.appApiKey) throw new Error('DifyEngine requires appApiKey');
    this.opts = opts;
  }

  async run(req: EngineRunRequest): Promise<EngineRunResult> {
    const mode = this.opts.mode ?? 'chat';
    const url =
      mode === 'workflow'
        ? `${baseUrl(this.opts)}/v1/workflows/run`
        : `${baseUrl(this.opts)}/v1/chat-messages`;
    if (mode === 'workflow' && !this.opts.workflowId) {
      throw new Error('DifyEngine mode=workflow requires workflowId');
    }
    const body = await requestJson<{
      answer?: string;
      data?: { outputs?: Record<string, unknown> };
    }>(
      'POST',
      url,
      { ...this.opts, apiKey: this.opts.appApiKey },
      {
        inputs: {},
        query: req.goal,
        ...(mode === 'workflow' ? { workflow_id: this.opts.workflowId } : {}),
        response_mode: 'blocking',
        user: this.opts.user ?? 'hermes-runtime',
      },
      req.signal
    );
    const answer =
      body.answer ??
      (body.data?.outputs ? JSON.stringify(body.data.outputs) : '');
    return {
      answer,
      steps: singleStep(answer),
      toolCallsMade: 0,
      iterationsUsed: 1,
    };
  }
}

// ---------------------------------------------------------------------------
// OpenHands — agent conversation with polling
// ---------------------------------------------------------------------------

export interface OpenHandsEngineOptions extends EngineHttpOptions {
  /** Conversation runtime id (default 'default'). */
  runtimeId?: string;
  /** Initial task extras merged into the conversation request. */
  extra?: Record<string, unknown>;
  /** Extract the final agent answer from the status/events payload. */
  extract?: (payload: unknown) => string | undefined;
}

const OPENHANDS_TERMINAL = new Set(['finished', 'error', 'stuck', 'paused']);

export class OpenHandsEngine implements EngineAdapter {
  readonly id = 'openhands';
  private opts: OpenHandsEngineOptions;

  constructor(opts: OpenHandsEngineOptions) {
    this.opts = opts;
  }

  async run(req: EngineRunRequest): Promise<EngineRunResult> {
    const created = await requestJson<{
      conversation_id?: string;
      id?: string;
    }>(
      'POST',
      `${baseUrl(this.opts)}/api/conversations`,
      this.opts,
      {
        initial_user_msg: req.goal,
        runtime_id: this.opts.runtimeId ?? 'default',
        ...(this.opts.extra ?? {}),
      },
      req.signal
    );
    const convId = created.conversation_id ?? created.id;
    if (!convId) throw new EngineHttpError(0, 'openhands: no conversation id');

    const maxPolls = this.opts.maxPolls ?? 150;
    const interval = this.opts.pollIntervalMs ?? 2_000;
    let last: unknown;
    for (let i = 0; i < maxPolls; i++) {
      if (req.signal?.aborted) throw new Error('openhands: aborted');
      await sleep(interval);
      last = await requestJson<unknown>(
        'GET',
        `${baseUrl(this.opts)}/api/conversations/${convId}`,
        this.opts,
        undefined,
        req.signal
      );
      const status = (last as { status?: string })?.status ?? '';
      if (OPENHANDS_TERMINAL.has(status.toLowerCase())) break;
    }

    const answer = this.opts.extract
      ? (this.opts.extract(last) ?? '')
      : defaultOpenHandsExtract(last);
    return {
      answer,
      steps: singleStep(answer || `(openhands conversation ${convId})`),
      toolCallsMade: 0,
      iterationsUsed: maxPolls,
    };
  }
}

function defaultOpenHandsExtract(payload: unknown): string {
  const p = payload as {
    latest_agent_message?: string;
    agent_state?: { last_message?: string };
    messages?: Array<{ role?: string; content?: string }>;
  };
  if (p?.latest_agent_message) return p.latest_agent_message;
  if (p?.agent_state?.last_message) return p.agent_state.last_message;
  const msgs = p?.messages;
  if (Array.isArray(msgs)) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m?.role === 'agent' || m?.role === 'assistant') {
        return m.content ?? '';
      }
    }
  }
  return typeof payload === 'string' ? payload : JSON.stringify(payload ?? '');
}

// ---------------------------------------------------------------------------
// Open WebUI — OpenAI-compatible chat surface
// ---------------------------------------------------------------------------

/**
 * Open WebUI exposes an OpenAI-compatible API. Point it at the Open WebUI
 * backend (default http://localhost:8080) and it rides the same
 * OpenAICompatibleProvider implementation — no separate class needed.
 */
export function openWebUI(opts?: {
  baseURL?: string;
  apiKey?: string;
  defaultModel?: string;
}): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    id: 'open-webui',
    baseURL:
      opts?.baseURL ??
      process.env.OPEN_WEBUI_BASE_URL ??
      'http://localhost:8080',
    apiKey: opts?.apiKey ?? process.env.OPEN_WEBUI_API_KEY,
    defaultModel: opts?.defaultModel ?? 'default',
  });
}

// Keep EngineDeps referenced for consumers implementing custom engines.
export type { EngineDeps };
