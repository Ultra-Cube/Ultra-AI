// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { HermesRuntime, MockProvider } from '@ultra-ai/hermes-runtime';

import { startHermesOpenAIServer } from './server';

import { createDefaultRuntime } from './index';

function runtimeWithMock() {
  const rt = new HermesRuntime({ provider: 'mock' });
  rt.registerProvider(new MockProvider({ id: 'mock' }));
  return rt;
}

describe('hermes-openai-bridge', () => {
  it('serves /health, /v1/models and chat completions', async () => {
    const { server, url } = await startHermesOpenAIServer({
      runtime: runtimeWithMock(),
      port: 0,
    });
    try {
      const health = await fetch(`${url}/health`);
      expect(health.status).toBe(200);

      const models = await fetch(`${url}/v1/models`);
      const modelsBody = (await models.json()) as any;
      expect(modelsBody.data[0].id).toBe('hermes');

      const res = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes',
          messages: [{ role: 'user', content: 'hello hermes' }],
        }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.object).toBe('chat.completion');
      expect(body.choices[0].message.role).toBe('assistant');
      expect(typeof body.choices[0].message.content).toBe('string');
      expect(body.ultra.session_id).toMatch(/^sess-/);
    } finally {
      server.close();
    }
  });

  it('streams SSE when stream=true', async () => {
    const { server, url } = await startHermesOpenAIServer({
      runtime: runtimeWithMock(),
      port: 0,
    });
    try {
      const res = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes',
          stream: true,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('chat.completion.chunk');
      expect(text).toContain('data: [DONE]');
    } finally {
      server.close();
    }
  });

  it('rejects unauthorized requests when token set', async () => {
    const { server, url } = await startHermesOpenAIServer({
      runtime: runtimeWithMock(),
      port: 0,
      token: 'sekret',
    });
    try {
      const res = await fetch(`${url}/v1/models`);
      expect(res.status).toBe(401);
      const ok = await fetch(`${url}/v1/models`, {
        headers: { authorization: 'Bearer sekret' },
      });
      expect(ok.status).toBe(200);
    } finally {
      server.close();
    }
  });

  it('createDefaultRuntime uses MockProvider without upstream env', () => {
    delete process.env.HERMES_UPSTREAM_URL;
    const rt = createDefaultRuntime();
    expect(rt.getConfig().provider).toBe('upstream');
  });
});
