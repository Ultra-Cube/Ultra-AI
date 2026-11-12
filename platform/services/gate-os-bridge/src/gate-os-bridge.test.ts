import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { ENVIRONMENT_IDS } from './environments';
import { createGateOsBridge, CONTRACT_VERSION } from './server';

let server: Server;
let base: string;

async function req(
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  ({ server } = createGateOsBridge());
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server.close());

describe('GET /v1/health', () => {
  it('returns ok with contract version and uptime', async () => {
    const { status, body } = await req('/v1/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.contractVersion).toBe(CONTRACT_VERSION);
    expect(typeof body.uptimeSeconds).toBe('number');
  });
});

describe('GET /v1/capabilities', () => {
  it('lists all seven environments and feature flags', async () => {
    const { status, body } = await req('/v1/capabilities');
    expect(status).toBe(200);
    expect(body.contractVersion).toBe(CONTRACT_VERSION);
    expect(body.environments).toEqual(ENVIRONMENT_IDS);
    expect(body.environments).toHaveLength(7);
    expect(body.features.adaptiveUiSpec).toBe(true);
    expect(body.features.llmIntentRouting).toBe(false);
  });
});

describe('environment profiles', () => {
  it('lists presets for all environments', async () => {
    const { status, body } = await req('/v1/environments');
    expect(status).toBe(200);
    expect(body.environments).toHaveLength(7);
    for (const e of body.environments) {
      expect([
        'everyday',
        'gaming',
        'dev',
        'design',
        'media',
        'security',
        'business',
      ]).toContain(e.id);
      expect(typeof e.aiProfile).toBe('string');
      expect(Array.isArray(e.enginesOn)).toBe(true);
    }
  });

  it('applies a profile override and returns it', async () => {
    const put = await req('/v1/environments/dev/profile', {
      method: 'PUT',
      body: JSON.stringify({
        models: { default: 'qwen2.5-coder' },
        budgets: { maxConcurrentTasks: 4, offlineOnly: true },
      }),
    });
    expect(put.status).toBe(200);
    expect(put.body.env).toBe('dev');
    expect(put.body.budgets.maxConcurrentTasks).toBe(4);
    expect(typeof put.body.updatedAt).toBe('string');

    const list = await req('/v1/environments');
    const dev = list.body.environments.find((e: any) => e.id === 'dev');
    expect(dev.budgets.maxConcurrentTasks).toBe(4);
  });

  it('rejects unknown environments with 404', async () => {
    const { status, body } = await req('/v1/ui-spec/nope');
    expect(status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('rejects invalid budget with 422', async () => {
    const { status, body } = await req('/v1/environments/dev/profile', {
      method: 'PUT',
      body: JSON.stringify({ budgets: { maxConcurrentTasks: 0 } }),
    });
    expect(status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /v1/ui-spec/{env}', () => {
  it('returns an adaptive UI spec per environment', async () => {
    for (const env of ENVIRONMENT_IDS) {
      const { status, body } = await req(`/v1/ui-spec/${env}`);
      expect(status).toBe(200);
      expect(body.env).toBe(env);
      expect(body.specVersion).toBe(CONTRACT_VERSION);
      expect(Array.isArray(body.panels)).toBe(true);
      expect(typeof body.assistant.enabled).toBe('boolean');
    }
  });

  it('gaming environment disables inline assistant', async () => {
    const { body } = await req('/v1/ui-spec/gaming');
    expect(body.assistant.enabled).toBe(false);
    expect(body.assistant.mode).toBe('overlay');
  });
});

describe('POST /v1/intents', () => {
  it('classifies a dev intent and suggests the dev environment', async () => {
    const { status, body } = await req('/v1/intents', {
      method: 'POST',
      body: JSON.stringify({
        text: 'help me debug this code and run the tests',
      }),
    });
    expect(status).toBe(200);
    expect(body.suggestedEnvironment).toBe('dev');
    expect(body.confidence).toBeGreaterThan(0.5);
    expect(body.actions.length).toBeGreaterThan(0);
  });

  it('honors an explicit env hint', async () => {
    const { body } = await req('/v1/intents', {
      method: 'POST',
      body: JSON.stringify({ text: 'hello', env: 'business' }),
    });
    expect(body.suggestedEnvironment).toBe('business');
  });

  it('rejects missing text with 422', async () => {
    const { status, body } = await req('/v1/intents', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect(status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /v1/events', () => {
  it('accepts a platform event and acknowledges it', async () => {
    const { status, body } = await req('/v1/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'environment.switched',
        env: 'dev',
        ts: new Date().toISOString(),
        payload: { reason: 'intent' },
      }),
    });
    expect(status).toBe(202);
    expect(body.accepted).toBe(true);
    expect(typeof body.id).toBe('string');
  });

  it('is idempotent on idempotencyKey', async () => {
    const event = {
      type: 'resource.pressure',
      env: 'gaming',
      ts: new Date().toISOString(),
      idempotencyKey: 'evt-test-1',
    };
    const first = await req('/v1/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    const second = await req('/v1/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(first.body.id).toBe('evt-test-1');
    expect(second.body.id).toBe('evt-test-1');
  });

  it('rejects invalid event type with 422', async () => {
    const { status, body } = await req('/v1/events', {
      method: 'POST',
      body: JSON.stringify({ type: 'bogus', ts: new Date().toISOString() }),
    });
    expect(status).toBe(422);
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

describe('auth', () => {
  it('requires bearer token when configured', async () => {
    const { server: s2 } = createGateOsBridge({ token: 'sekrit' });
    await new Promise<void>((r) => s2.listen(0, '127.0.0.1', r));
    const port = (s2.address() as AddressInfo).port;
    const b2 = `http://127.0.0.1:${port}`;
    try {
      const denied = await fetch(`${b2}/v1/capabilities`);
      expect(denied.status).toBe(401);
      const health = await fetch(`${b2}/v1/health`);
      expect(health.status).toBe(200);
      const allowed = await fetch(`${b2}/v1/capabilities`, {
        headers: { authorization: 'Bearer sekrit' },
      });
      expect(allowed.status).toBe(200);
    } finally {
      s2.close();
    }
  });
});
