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

export type ProviderId =
  | 'deepseek'
  | 'glm'
  | 'kimi'
  | 'manus'
  | 'openrouter'
  | 'openai-compatible'
  | 'ollama';

export type DataClass = 'public' | 'internal' | 'sensitive' | 'regulated';

/**
 * Specialized model families (R11) — Agent OS groups and routes
 * models by architecture family, not just provider.
 * LLM  = large language model (general chat/reasoning)
 * LCM  = long-context model (extended context windows)
 * LAM  = large action/actionable model (tool use, agents)
 * MoE  = mixture-of-experts (sparse routing, efficient scale)
 * VLM  = vision-language model (multimodal)
 * SLM  = small language model (on-device/edge)
 * MLM  = masked language model (embeddings, classification)
 * SAM  = segment-anything model (image segmentation)
 */
export type ModelFamily =
  | 'LLM'
  | 'LCM'
  | 'LAM'
  | 'MoE'
  | 'VLM'
  | 'SLM'
  | 'MLM'
  | 'SAM';

export const MODEL_FAMILIES: readonly ModelFamily[] = [
  'LLM',
  'LCM',
  'LAM',
  'MoE',
  'VLM',
  'SLM',
  'MLM',
  'SAM',
] as const;

export interface ModelEntry {
  provider: ProviderId;
  model: string;
  /** architecture family for Agent OS grouping/routing */
  family: ModelFamily;
  /** 0-1 quality tier for routing */
  quality: number;
  /** relative cost per 1k tokens, lower is cheaper */
  costPer1k: number;
  /** typical latency class: 0 fast .. 2 slow */
  latencyClass: 0 | 1 | 2;
  contextWindow: number;
  /** data classes this model may receive */
  allowedDataClasses: DataClass[];
  capabilities: Array<'chat' | 'reasoning' | 'code' | 'agent'>;
  enabled: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: ProviderId;
  maxTokens?: number;
  temperature?: number;
  /** routing hints */
  taskClass?: 'chat' | 'code' | 'reasoning' | 'agent' | 'summarize';
  /** Agent OS family hint — restrict routing to one architecture family */
  family?: ModelFamily;
  dataClass?: DataClass;
  preferLocal?: boolean;
  timeoutMs?: number;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  provider: ProviderId;
  model: string;
  content: string;
  usage: Usage;
  latencyMs: number;
  /** set when this response came from a fallback provider */
  fallbackFrom?: ProviderId;
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly baseURL: string;
  chat(
    req: ChatRequest,
    apiKey?: string
  ): Promise<{
    content: string;
    usage: Usage;
  }>;
}

export interface MeterRecord {
  ts: number;
  provider: ProviderId;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  ok: boolean;
  dataClass?: DataClass;
}

export type BreakerState = 'closed' | 'open' | 'half-open';
