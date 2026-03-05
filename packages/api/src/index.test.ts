import { buildApp } from './index';

describe('@ultra-ai/api', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  async function registerAndGetToken(email = 'test@ultra.ai') {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, password: 'pass1234' },
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
      payload: { email: 'login-test@ultra.ai', password: 'pass1234' },
    });

    expect(register.statusCode).toBe(200);

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-test@ultra.ai', password: 'pass1234' },
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
});
