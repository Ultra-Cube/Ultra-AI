import OpenAI from 'openai';
import { Task } from '../types';
import { OPENAI_MODELS } from '../models';
import { CompletionOptions, LLMProvider } from './types';

const TASK_INSTRUCTIONS: Record<Task['type'], string> = {
  analyze: 'Analyze the following input. Provide key findings, risks and recommendations.',
  generate: 'Generate high-quality content for the following request.',
  summarize: 'Summarize the following content concisely while preserving key facts.',
  translate: 'Translate the following content. Preserve meaning, tone and formatting.',
  respond: 'Respond helpfully to the following user message.',
};

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  private client: OpenAI | null = null;

  constructor(
    apiKey: string = process.env.OPENAI_API_KEY ?? '',
    private readonly baseUrl?: string
  ) {
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: baseUrl,
      });
    }
  }

  readonly models: string[] = [...OPENAI_MODELS];

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(task: Task, model: string, options: CompletionOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAIProvider is not configured (missing API key)');
    }

    const response = await this.client.chat.completions.create({
      model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      messages: [
        { role: 'system', content: TASK_INSTRUCTIONS[task.type] },
        { role: 'user', content: task.payload },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
