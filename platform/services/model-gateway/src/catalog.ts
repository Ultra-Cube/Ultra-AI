import type { ModelEntry, ProviderId } from './types';

/** Canonical model catalog — single source of truth for routing. */
export const MODEL_CATALOG: ModelEntry[] = [
  // DeepSeek — strong reasoning, cheap
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    quality: 0.85,
    costPer1k: 0.00027,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'code', 'reasoning'],
    enabled: true,
  },
  {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    quality: 0.92,
    costPer1k: 0.00055,
    latencyClass: 2,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'reasoning'],
    enabled: true,
  },
  // Zhipu GLM — balanced general
  {
    provider: 'glm',
    model: 'glm-4-plus',
    quality: 0.82,
    costPer1k: 0.0005,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'code', 'reasoning'],
    enabled: true,
  },
  {
    provider: 'glm',
    model: 'glm-4-air',
    quality: 0.7,
    costPer1k: 0.0001,
    latencyClass: 0,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat'],
    enabled: true,
  },
  // Moonshot Kimi — long context
  {
    provider: 'kimi',
    model: 'moonshot-v1-128k',
    quality: 0.8,
    costPer1k: 0.002,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'reasoning'],
    enabled: true,
  },
  {
    provider: 'kimi',
    model: 'moonshot-v1-8k',
    quality: 0.72,
    costPer1k: 0.0005,
    latencyClass: 0,
    contextWindow: 8192,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat'],
    enabled: true,
  },
  // Manus — agentic task execution
  {
    provider: 'manus',
    model: 'manus-1.0',
    quality: 0.9,
    costPer1k: 0.005,
    latencyClass: 2,
    contextWindow: 200000,
    allowedDataClasses: ['public'],
    capabilities: ['agent', 'reasoning'],
    enabled: true,
  },
  // OpenRouter — aggregated providers via OpenAI-compatible API
  {
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat-v3-0324',
    quality: 0.85,
    costPer1k: 0.00027,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'reasoning', 'code'],
    enabled: true,
  },
  {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    quality: 0.8,
    costPer1k: 0.00013,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'agent'],
    enabled: true,
  },
  // Local Ollama — private by definition
  {
    provider: 'ollama',
    model: 'llama3.1',
    quality: 0.6,
    costPer1k: 0,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal', 'sensitive', 'regulated'],
    capabilities: ['chat', 'code'],
    enabled: true,
  },
];

export const PROVIDER_BASE_URLS: Record<ProviderId, string> = {
  deepseek: 'https://api.deepseek.com',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
  kimi: 'https://api.moonshot.cn/v1',
  manus: 'https://api.manus.ai',
  openrouter: 'https://openrouter.ai/api/v1',
  'openai-compatible': 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434/v1',
};

export function catalogFor(provider: ProviderId): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.provider === provider && m.enabled);
}
