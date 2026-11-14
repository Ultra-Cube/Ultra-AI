export type ProviderId =
  | 'deepseek'
  | 'glm'
  | 'kimi'
  | 'manus'
  | 'openai-compatible'
  | 'ollama';

export type DataClass = 'public' | 'internal' | 'sensitive' | 'regulated';

export interface ModelEntry {
  provider: ProviderId;
  model: string;
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
