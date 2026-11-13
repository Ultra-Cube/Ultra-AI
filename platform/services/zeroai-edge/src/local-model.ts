import type { LocalModelPort, MemoryHit } from './types';

/**
 * Ready-made LocalModelPort implementations for real local model lanes.
 * Both are zero-dependency (native fetch) and keep execution on-device:
 * - Ollama native API (`/api/generate`) or its OpenAI-compatible mode.
 * - Any OpenAI-compatible endpoint: 9router, OmniRoute, LM Studio, vLLM,
 *   LiteLLM, or Ollama at `/v1`.
 */

export interface OpenAICompatibleLocalModelOptions {
  /** Base URL including the `/v1` prefix, e.g. http://127.0.0.1:11434/v1 */
  baseURL: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
  systemPrompt?: string;
}

/** LocalModelPort over an OpenAI-compatible `/chat/completions` endpoint. */
export function createOpenAICompatibleLocalModel(
  opts: OpenAICompatibleLocalModelOptions
): LocalModelPort {
  const baseURL = opts.baseURL.replace(/\/+$/, '');
  const timeoutMs = opts.timeoutMs ?? 120_000;
  return {
    async run(prompt, _ctx: { sessionId: string; memory: MemoryHit[] }) {
      const messages: { role: string; content: string }[] = [];
      if (opts.systemPrompt) {
        messages.push({ role: 'system', content: opts.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (opts.apiKey) headers.authorization = `Bearer ${opts.apiKey}`;
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: opts.model,
          messages,
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(
          `local model endpoint ${baseURL} returned ${res.status}: ${await res.text().catch(() => '')}`
        );
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = json.choices?.[0]?.message?.content;
      if (!answer) throw new Error('local model returned empty response');
      return answer;
    },
  };
}

export interface OllamaLocalModelOptions {
  /** Ollama base URL, e.g. http://127.0.0.1:11434 */
  baseURL: string;
  model: string;
  timeoutMs?: number;
  systemPrompt?: string;
}

/** LocalModelPort over Ollama's native `/api/generate` endpoint. */
export function createOllamaLocalModel(
  opts: OllamaLocalModelOptions
): LocalModelPort {
  const baseURL = opts.baseURL.replace(/\/+$/, '');
  const timeoutMs = opts.timeoutMs ?? 120_000;
  return {
    async run(prompt, _ctx: { sessionId: string; memory: MemoryHit[] }) {
      const full = opts.systemPrompt
        ? `${opts.systemPrompt}\n\n${prompt}`
        : prompt;
      const res = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: opts.model,
          prompt: full,
          stream: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(
          `ollama ${baseURL} returned ${res.status}: ${await res.text().catch(() => '')}`
        );
      }
      const json = (await res.json()) as { response?: string };
      if (!json.response) throw new Error('ollama returned empty response');
      return json.response;
    },
  };
}

export type LocalModelLane =
  | { kind: 'ollama'; baseURL: string; model: string }
  | {
      kind: 'openai-compatible';
      baseURL: string;
      model: string;
      apiKey?: string;
    };

/**
 * Resolve a local model lane from environment variables.
 *
 *   ZEROAI_LOCAL_MODEL=ollama|openai-compatible  (unset → no lane)
 *   ZEROAI_LOCAL_BASE_URL  default http://127.0.0.1:11434 (ollama) /
 *                          http://127.0.0.1:20128 (9router/omniroute)
 *   ZEROAI_LOCAL_MODEL_NAME  default llama3.2 / default
 *   ZEROAI_LOCAL_API_KEY   optional bearer for openai-compatible
 *
 * Returns undefined when no lane is configured, so callers can fall back
 * to the runtime-backed lane.
 */
export function localModelLaneFromEnv(
  env: NodeJS.ProcessEnv = process.env
): LocalModelLane | undefined {
  const kind = env.ZEROAI_LOCAL_MODEL;
  if (kind !== 'ollama' && kind !== 'openai-compatible') return undefined;
  const model = env.ZEROAI_LOCAL_MODEL_NAME;
  if (kind === 'ollama') {
    return {
      kind,
      baseURL: env.ZEROAI_LOCAL_BASE_URL ?? 'http://127.0.0.1:11434',
      model: model ?? 'llama3.2',
    };
  }
  return {
    kind,
    baseURL: env.ZEROAI_LOCAL_BASE_URL ?? 'http://127.0.0.1:20128/v1',
    model: model ?? 'default',
    apiKey: env.ZEROAI_LOCAL_API_KEY,
  };
}

/** Build a LocalModelPort from a resolved lane. */
export function localModelPortFromLane(lane: LocalModelLane): LocalModelPort {
  if (lane.kind === 'ollama') {
    return createOllamaLocalModel({
      baseURL: lane.baseURL,
      model: lane.model,
    });
  }
  return createOpenAICompatibleLocalModel({
    baseURL: lane.baseURL,
    model: lane.model,
    apiKey: lane.apiKey,
  });
}
