import { Task } from '../types';

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  /** Provider identifier, e.g. 'openai' | 'anthropic' | 'mock'. */
  readonly id: string;
  /** Models this provider can serve. */
  readonly models: string[];
  /** Whether the provider has credentials/config to run. */
  isAvailable(): boolean;
  complete(
    task: Task,
    model: string,
    options?: CompletionOptions
  ): Promise<string>;
}

export function isModelServedBy(model: string, models: string[]): boolean {
  return models.includes(model);
}
