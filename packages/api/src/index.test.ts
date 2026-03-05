import { buildApp, AppContext } from './index';
import { AuthService } from './services/auth/auth-service';
import { InMemoryUserService } from './services/auth/in-memory-user-service';
import { WorkspaceProfileStore } from './services/profile/workspace-profile-store';
import { WorkspaceRecommender } from './services/workspace-recommender';
import { AICore } from '@ultra-ai/ai-core';
import { createModelGateway } from './services/ai/model-gateway';

describe('@ultra-ai/api', () => {
  let app: any;
  let userService: InMemoryUserService;

  beforeAll(async () => {
    // Use in-memory user service for tests (no database required)
    userService = new InMemoryUserService();
    const authService = new AuthService(userService as any);
    const aiCore = new AICore({
      models: ['gpt-4o-mini', 'claude-3-haiku'],
      defaultModel: 'gpt-4o-mini',
      language: 'en',
    });
    const profileStore = new WorkspaceProfileStore();
    const recommender = new WorkspaceRecommender();
    const modelGateway = createModelGateway();

    const context: AppContext = {
      prisma: null as any, // Not needed for in-memory service
      authService,
      aiCore,
      profileStore,
      recommender,
      modelGateway,
    };

    app = await buildApp(context);
  });

  afterEach(async () => {
    // Clear user data between tests
    userService.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndGetToken(email = 'test@ultra.ai') {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password: 'TestPassword123!' },
    });

    expect(response.statusCode).toBe(200);
    return response.json().token as string;
  }

  it('returns health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.status).toBe('ok');
  });

  it('registers and logs in a user', async () => {
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'login-test@ultra.ai', password: 'LoginTest123!' },
    });

    expect(register.statusCode).toBe(200);

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-test@ultra.ai', password: 'LoginTest123!' },
    });

    expect(login.statusCode).toBe(200);
    expect(login.json().token).toBeTruthy();
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

  it('recommends adaptive workspace by role for authenticated users', async () => {
    const token = await registerAndGetToken('workspace@ultra.ai');

    const response = await app.inject({
      method: 'POST',
      url: '/ai/workspace/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        role: 'video-designer',
        usageSignals: ['caption editing', 'render export'],
      },
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.recommendation.role).toBe('video-designer');
    expect(data.recommendation.sections).toContain('timeline');
    expect(data.recommendation.suggestedTools).toContain('caption-generator');
    expect(data.profile.userId).toBeTruthy();
  });

  it('reads and updates workspace profile', async () => {
    const token = await registerAndGetToken('profile@ultra.ai');

    await app.inject({
      method: 'POST',
      url: '/ai/workspace/recommend',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        role: 'developer',
        usageSignals: ['bug fixing'],
      },
    });

    const getProfile = await app.inject({
      method: 'GET',
      url: '/user/workspace-profile',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(getProfile.statusCode).toBe(200);
    expect(getProfile.json().profile.role).toBe('developer');

    const updateProfile = await app.inject({
      method: 'PUT',
      url: '/user/workspace-profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        role: 'video-designer',
        pinnedWidgets: ['timeline', 'preview'],
      },
    });

    expect(updateProfile.statusCode).toBe(200);
    expect(updateProfile.json().profile.role).toBe('video-designer');
  });

  it('lists available AI models from gateway', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ai/models',
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.providers).toBeDefined();
    expect(Object.keys(data.providers).length).toBeGreaterThan(0);
  });

  it('returns gateway health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ai/gateway/health',
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.gatewayStatus).toBe('operational');
    expect(Array.isArray(data.providers)).toBe(true);
    expect(data.providers.length).toBeGreaterThan(0);
    expect(data.providers[0]).toHaveProperty('provider');
    expect(data.providers[0]).toHaveProperty('healthy');
  });

  it('processes advanced AI request with model gateway', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/ai/advanced-process',
      payload: { input: 'Advanced: Explain quantum computing', model: 'mistral' }, // Use Ollama model as default
    });

    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data.result).toBeDefined();
    expect(data.routing).toBeDefined();
    expect(data.routing.provider).toBeTruthy();
    expect(data.routing.model).toBeTruthy();
    expect(data.routing.endpoint).toBeTruthy();
  });
});

