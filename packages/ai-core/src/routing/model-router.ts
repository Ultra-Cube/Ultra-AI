import { AIConfig, Task } from '../types';

export class ModelRouter {
  constructor(private readonly config: AIConfig) {}

  selectModel(task: Task): string {
    if (task.type === 'summarize' && this.config.models.includes('gpt-4o-mini')) {
      return 'gpt-4o-mini';
    }

    if (task.type === 'translate' && this.config.models.includes('claude-3-haiku')) {
      return 'claude-3-haiku';
    }

    if (this.config.defaultModel) {
      return this.config.defaultModel;
    }

    return this.config.models[0] ?? 'mock-model';
  }
}
