/**
 * Canonical model catalog — single source of truth for provider model ids.
 *
 * Centralised here to stop the model-id drift the docs repeatedly flagged
 * (provider lists, the router affinity map, the api ModelGateway and several
 * configs all used to hard-code their own stale copies). Import from here
 * instead of inlining model-id string literals.
 */

/** Friendly OpenAI model ids, newest/most-capable first. */
export const OPENAI_MODELS = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
] as const;

/** Friendly Anthropic model ids, newest/most-capable first. */
export const ANTHROPIC_MODELS = [
  'claude-opus-4.1',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
] as const;

/** Local Ollama model ids (unversioned, pulled on demand). */
export const OLLAMA_MODELS = ['llama3.1', 'mistral', 'codellama'] as const;

/**
 * Maps the friendly Anthropic ids above to the dated API model ids the
 * Anthropic SDK actually expects. Keeps call sites readable while sending
 * the fully-qualified id over the wire.
 */
export const ANTHROPIC_API_IDS: Record<string, string> = {
  'claude-opus-4.1': 'claude-opus-4-1-20250805',
  'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  'claude-haiku-4.5': 'claude-haiku-4-5-20251001',
};

/** Resolve a friendly Anthropic id to its dated API id (pass-through if unknown). */
export function resolveAnthropicModel(model: string): string {
  return ANTHROPIC_API_IDS[model] ?? model;
}

/** Sensible default model for general-purpose, cost-aware routing. */
export const DEFAULT_MODEL = 'gpt-5-mini';

/**
 * Task → preferred-model affinity. Picks a model that suits each task's
 * cost/quality profile; the router falls back to configured defaults when a
 * preferred model isn't available.
 */
export const TASK_MODEL_AFFINITY: Record<string, string> = {
  summarize: 'gpt-5-mini',
  translate: 'claude-haiku-4.5',
  analyze: 'claude-opus-4.1',
  generate: 'gpt-5',
  respond: 'gpt-5-mini',
};
