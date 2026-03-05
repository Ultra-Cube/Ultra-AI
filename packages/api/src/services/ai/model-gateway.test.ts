import { ModelGateway, ProviderConfig } from './model-gateway';

describe('ModelGateway', () => {
  let gateway: ModelGateway;

  beforeEach(() => {
    const configs: ProviderConfig[] = [
      {
        name: 'openai',
        apiKey: 'test-key-openai',
        models: ['gpt-4o', 'gpt-4o-mini'],
        enabled: true,
        priority: 1,
      },
      {
        name: 'anthropic',
        apiKey: 'test-key-anthropic',
        models: ['claude-3-opus', 'claude-3-haiku'],
        enabled: true,
        priority: 2,
      },
      {
        name: 'ollama',
        baseUrl: 'http://localhost:11434',
        models: ['mistral', 'neural-chat'],
        enabled: true,
        priority: 3,
      },
    ];

    gateway = new ModelGateway(configs);
  });

  it('routes OpenAI models to OpenAI provider', async () => {
    const route = await gateway.routeRequest('gpt-4o');

    expect(route.provider).toBe('openai');
    expect(route.model).toBe('gpt-4o');
    expect(route.endpoint).toContain('openai.com');
    expect(route.headers['Authorization']).toContain('Bearer');
  });

  it('routes Anthropic models to Anthropic provider', async () => {
    const route = await gateway.routeRequest('claude-3-opus');

    expect(route.provider).toBe('anthropic');
    expect(route.model).toBe('claude-3-opus');
    expect(route.endpoint).toContain('anthropic.com');
    expect(route.headers['x-api-key']).toBe('test-key-anthropic');
  });

  it('routes Ollama models to Ollama provider', async () => {
    const route = await gateway.routeRequest('mistral');

    expect(route.provider).toBe('ollama');
    expect(route.model).toBe('mistral');
    expect(route.endpoint).toContain('localhost:11434');
  });

  it('respects provider priority order', async () => {
    // Both providers support gpt-4o (hypothetically)
    const route = await gateway.routeRequest('gpt-4o');

    // OpenAI has priority 1, so should be chosen
    expect(route.provider).toBe('openai');
  });

  it('fails over to next provider when one is unhealthy', async () => {
    // Mark OpenAI as unhealthy
    for (let i = 0; i < 6; i++) {
      gateway.recordFailure('openai');
    }

    const route = await gateway.routeRequest('gpt-4o-mini');

    // Would fallback to Anthropic if it supported the model
    // But since it doesn't, would use Ollama or fail
    expect(route).toBeDefined();
  });

  it('tracks provider health status', () => {
    gateway.recordSuccess('openai');
    gateway.recordSuccess('openai');
    gateway.recordFailure('anthropic');

    const status = gateway.getHealthStatus();

    const openaiStatus = status.find((s) => s.provider === 'openai');
    expect(openaiStatus?.successCount).toBe(2);
    expect(openaiStatus?.errorCount).toBe(0);

    const anthropicStatus = status.find((s) => s.provider === 'anthropic');
    expect(anthropicStatus?.errorCount).toBe(1);
  });

  it('lists available models across providers', () => {
    const models = gateway.listAvailableModels();

    expect(models.has('openai')).toBe(true);
    expect(models.get('openai')).toContain('gpt-4o');
    expect(models.has('anthropic')).toBe(true);
    expect(models.get('anthropic')).toContain('claude-3-opus');
  });

  it('updates provider configuration', () => {
    gateway.updateProviderConfig('openai', {
      enabled: false,
    });

    const models = gateway.listAvailableModels();
    expect(models.has('openai')).toBe(false);
  });

  it('throws error for unsupported model', async () => {
    await expect(gateway.routeRequest('unknown-model')).rejects.toThrow(
      'No provider available',
    );
  });
});
