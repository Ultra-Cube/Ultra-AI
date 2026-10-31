export interface AIConfig {
  models: string[];
  language?: 'en' | 'ar';
  defaultModel?: string;
  /** Explicit provider credentials; falls back to standard env vars. */
  providers?: {
    openaiApiKey?: string;
    openaiBaseUrl?: string;
    anthropicApiKey?: string;
  };
}

export interface ProcessRequest {
  input: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface Intent {
  name: 'analysis' | 'generation' | 'summarization' | 'translation' | 'general';
  confidence: number;
}

export interface Task {
  type: 'analyze' | 'generate' | 'summarize' | 'translate' | 'respond';
  payload: string;
  intent: Intent;
}

export interface ProcessResponse {
  model: string;
  intent: Intent;
  task: Task;
  output: string;
  elapsedMs: number;
}
