import Anthropic from '@anthropic-ai/sdk';
import { Task } from '../types';
import { ANTHROPIC_MODELS, resolveAnthropicModel } from '../models';
import { CompletionOptions, LLMProvider } from './types';

const TASK_INSTRUCTIONS: Record<Task['type'], string> = {
  analyze: 'Analyze the following input. Provide key findings, risks and recommendations.',
  generate: 'Generate high-quality content for the following request.',
  summarize: 'Summarize the following content concisely while preserving key facts.',
  translate: 'Translate the following content. Preserve meaning, tone and formatting.',
  respond: 'Respond helpfully to the following user message.',
};

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic';
  private client: Anthropic | null = null;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? '') {
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  readonly models: string[] = [...ANTHROPIC_MODELS];

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(task: Task, model: string, options: CompletionOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('AnthropicProvider is not configured (missing API key)');
    }

    const response = await this.client.messages.create({
      model: resolveAnthropicModel(model),
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      system: TASK_INSTRUCTIONS[task.type],
      messages: [{ role: 'user', content: task.payload }],
    });

    const block = response.content[0];
    return block && block.type === 'text' ? block.text : '';
  }
}
