import { IntentRecognizer } from '../nlp/intent-recognizer';
import { NLPProcessor } from '../nlp/nlp-processor';
import { TaskPlanner } from '../planning/task-planner';
import { AnthropicProvider } from '../providers/anthropic-provider';
import { MockProvider } from '../providers/mock-provider';
import { OpenAIProvider } from '../providers/openai-provider';
import { LLMProvider } from '../providers/types';
import { ModelRouter } from '../routing/model-router';
import { AIConfig, ProcessRequest, ProcessResponse } from '../types';

export class AICore {
  private readonly nlp = new NLPProcessor();
  private readonly intents = new IntentRecognizer();
  private readonly planner = new TaskPlanner();
  private readonly router: ModelRouter;

  constructor(config: AIConfig) {
    const providers = this.buildProviders(config);
    this.router = new ModelRouter(config, providers);
  }

  async process(request: string | ProcessRequest): Promise<ProcessResponse> {
    const startedAt = Date.now();
    const input = typeof request === 'string' ? request : request.input;
    const normalized = this.nlp.normalize(input);
    const intent = this.intents.recognize(normalized);
    const task = this.planner.plan(normalized, intent);
    const selection = this.router.selectModel(task);

    let output: string;
    if (selection) {
      output = await selection.provider.complete(task, selection.model);
    } else {
      output = await new MockProvider().complete(task, 'mock-model');
    }

    return {
      model: selection?.model ?? 'mock-model',
      intent,
      task,
      output,
      elapsedMs: Date.now() - startedAt,
    };
  }

  private buildProviders(config: AIConfig): LLMProvider[] {
    const creds = config.providers ?? {};
    return [
      new OpenAIProvider(creds.openaiApiKey, creds.openaiBaseUrl),
      new AnthropicProvider(creds.anthropicApiKey),
      new MockProvider(),
    ];
  }
}
