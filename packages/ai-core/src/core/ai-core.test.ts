import { AICore } from './ai-core';

describe('AICore', () => {
  it('processes input and returns structured response', async () => {
    const aiCore = new AICore({
      models: ['gpt-5-mini', 'claude-haiku-4.5'],
      defaultModel: 'gpt-5-mini',
      language: 'en',
    });

    const result = await aiCore.process('Please summarize this report');

    // No API keys configured in test env -> falls back to MockProvider,
    // but intent/task routing must still work.
    expect(result.model).toBe('mock-model');
    expect(result.task.type).toBe('summarize');
    expect(result.intent.name).toBe('summarization');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to mock provider when no credentials are configured', async () => {
    const aiCore = new AICore({ models: ['mock-model'] });
    const result = await aiCore.process('hello world');

    expect(result.model).toBe('mock-model');
    expect(result.task.type).toBe('respond');
    expect(result.output).toContain('hello world');
  });

  it('detects Arabic input and routes translation intent', async () => {
    const aiCore = new AICore({ models: ['claude-haiku-4.5'] });
    const result = await aiCore.process('ترجم هذا النص');

    expect(result.intent.name).toBe('translation');
    expect(result.task.type).toBe('translate');
  });
});
