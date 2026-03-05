import { buildApp } from './index';

describe('@ultra-ai/api', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('returns health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.status).toBe('ok');
  });

  it('processes AI request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai/process',
      payload: { input: 'Summarize this document' },
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.result.output).toContain('Initial result from');
  });

  it('recommends adaptive workspace by role', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai/workspace/recommend',
      payload: {
        userId: 'u1',
        role: 'video-designer',
        usageSignals: ['caption editing', 'render export'],
      },
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.recommendation.role).toBe('video-designer');
    expect(data.recommendation.sections).toContain('timeline');
    expect(data.recommendation.suggestedTools).toContain('caption-generator');
  });
});
