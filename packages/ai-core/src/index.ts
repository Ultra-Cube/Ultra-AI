/**
 * @ultra-ai/ai-core
 * Core AI Engine for Ultra AI Platform
 */

export { AICore } from './core/ai-core';
export { NLPProcessor } from './nlp/nlp-processor';
export { IntentRecognizer } from './nlp/intent-recognizer';
export { TaskPlanner } from './planning/task-planner';
export { ModelRouter } from './routing/model-router';
export type { ModelSelection } from './routing/model-router';
export { OpenAIProvider } from './providers/openai-provider';
export { AnthropicProvider } from './providers/anthropic-provider';
export { MockProvider } from './providers/mock-provider';
export type { LLMProvider, CompletionOptions } from './providers/types';

// Canonical model catalog (single source of truth for model ids)
export {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  OLLAMA_MODELS,
  ANTHROPIC_API_IDS,
  resolveAnthropicModel,
  DEFAULT_MODEL,
  TASK_MODEL_AFFINITY,
} from './models';

// Types
export type {
  AIConfig,
  ProcessRequest,
  ProcessResponse,
  Intent,
  Task,
} from './types';
