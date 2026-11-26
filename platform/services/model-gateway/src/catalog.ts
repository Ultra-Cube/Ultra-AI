// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

import type { ModelEntry, ProviderId } from './types';

/** Canonical model catalog — single source of truth for routing. */
export const MODEL_CATALOG: ModelEntry[] = [
  // DeepSeek — strong reasoning, cheap
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    family: 'LLM',
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
    family: 'LLM',
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
    family: 'LLM',
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
    family: 'SLM',
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
    family: 'LCM',
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
    family: 'LLM',
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
    family: 'LAM',
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
    family: 'MoE',
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
    family: 'LLM',
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
    family: 'SLM',
    quality: 0.6,
    costPer1k: 0,
    latencyClass: 1,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal', 'sensitive', 'regulated'],
    capabilities: ['chat', 'code'],
    enabled: true,
  },
  // Kimi K2 / K3 open-weight — agentic coding & reasoning (R14)
  {
    provider: 'kimi',
    model: 'kimi-k2-0905-preview',
    family: 'LAM',
    quality: 0.88,
    costPer1k: 0.0006,
    latencyClass: 1,
    contextWindow: 262144,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'code', 'agent', 'reasoning'],
    enabled: true,
  },
  {
    provider: 'kimi',
    model: 'kimi-k2-thinking',
    family: 'LLM',
    quality: 0.9,
    costPer1k: 0.0008,
    latencyClass: 2,
    contextWindow: 262144,
    allowedDataClasses: ['public', 'internal'],
    capabilities: ['chat', 'reasoning', 'code'],
    enabled: true,
  },
  // DeepSeek harness — offline open-source runner (R14)
  // served locally via Ollama-compatible endpoint; fully private
  {
    provider: 'ollama',
    model: 'deepseek-r1',
    family: 'MoE',
    quality: 0.82,
    costPer1k: 0,
    latencyClass: 2,
    contextWindow: 128000,
    allowedDataClasses: ['public', 'internal', 'sensitive', 'regulated'],
    capabilities: ['chat', 'reasoning', 'code'],
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
