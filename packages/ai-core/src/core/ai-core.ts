import { IntentRecognizer } from '../nlp/intent-recognizer';
import { NLPProcessor } from '../nlp/nlp-processor';
import { TaskPlanner } from '../planning/task-planner';
import { ModelRouter } from '../routing/model-router';
import { AIConfig, ProcessRequest, ProcessResponse } from '../types';

export class AICore {
  private readonly nlp = new NLPProcessor();
  private readonly intents = new IntentRecognizer();
  private readonly planner = new TaskPlanner();
  private readonly router: ModelRouter;

  constructor(private readonly config: AIConfig) {
    this.router = new ModelRouter(config);
  }

  async process(request: string | ProcessRequest): Promise<ProcessResponse> {
    const startedAt = Date.now();
    const input = typeof request === 'string' ? request : request.input;
    const normalized = this.nlp.normalize(input);
    const intent = this.intents.recognize(normalized);
    const task = this.planner.plan(normalized, intent);
    const model = this.router.selectModel(task);

    const output = this.mockExecute(task.payload, model, this.nlp.detectLanguage(input));

    return {
      model,
      intent,
      task,
      output,
      elapsedMs: Date.now() - startedAt,
    };
  }

  private mockExecute(payload: string, model: string, language: 'en' | 'ar'): string {
    const prefix = language === 'ar' ? 'نتيجة أولية من' : 'Initial result from';
    return `${prefix} ${model}: ${payload}`;
  }
}
