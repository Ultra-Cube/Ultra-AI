import { AICore } from './ai-core';

describe('AICore', () => {
  it('processes input and returns structured response', async () => {
    const aiCore = new AICore({
      models: ['gpt-4o-mini', 'claude-3-haiku'],
      defaultModel: 'gpt-4o-mini',
      language: 'en',
    });

    const result = await aiCore.process('Please summarize this report');

    expect(result.output).toContain('Initial result from gpt-4o-mini');
    expect(result.intent.name).toBe('summarization');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
