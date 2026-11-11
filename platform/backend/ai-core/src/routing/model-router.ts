import { AIConfig, Task } from '../types';
import { TASK_MODEL_AFFINITY } from '../models';
import { LLMProvider } from '../providers/types';

export interface ModelSelection {
  model: string;
  provider: LLMProvider;
}

/**
 * Routes a task to the best available model/provider pair.
 * Preference order: task-specific affinity > configured default > first
 * configured model served by any available provider.
 */
export class ModelRouter {
  private readonly providers: LLMProvider[];

  constructor(
    private readonly config: AIConfig,
    providers: LLMProvider[]
  ) {
    this.providers = providers.filter((p) => p.isAvailable());
  }

  selectModel(task: Task): ModelSelection | null {
    const candidates = this.orderedModels(task);
    for (const model of candidates) {
      const provider = this.providers.find((p) => p.models.includes(model));
      if (provider) {
        return { model, provider };
      }
    }
    // Fall back to any available provider's first model.
    for (const provider of this.providers) {
      if (provider.models.length > 0) {
        return { model: provider.models[0], provider };
      }
    }
    return null;
  }

  /** Providers that can serve at least one configured model. */
  getAvailableProviders(): LLMProvider[] {
    return [...this.providers];
  }

  private orderedModels(task: Task): string[] {
    const models = this.config.models;

    const preferred: string[] = [];
    const affinityModel = TASK_MODEL_AFFINITY[task.type];
    if (affinityModel && models.includes(affinityModel)) {
      preferred.push(affinityModel);
    }
    if (this.config.defaultModel && models.includes(this.config.defaultModel)) {
      preferred.push(this.config.defaultModel);
    }

    return [...new Set([...preferred, ...models])];
  }
}
