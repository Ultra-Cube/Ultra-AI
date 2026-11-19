import { MODEL_CATALOG } from './catalog';
import type { ChatRequest, ProviderAdapter, ProviderId, Usage } from './types';

import {
  CircuitBreaker,
  ManusProvider,
  ModelGateway,
  ModelRouter,
  OpenAICompatibleProvider,
  UsageMeter,
} from './index';

const okUsage: Usage = {
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
};

function okFetch(content = 'hello') {
  return jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    }),
    text: async () => Promise.resolve(''),
  }));
}

function failFetch() {
  return jest.fn(async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
    text: async () => Promise.resolve('boom'),
  }));
}

const req: ChatRequest = {
  messages: [{ role: 'user', content: 'hi' }],
  taskClass: 'chat',
  dataClass: 'internal',
};

function gatewayWith(
  adapters: Partial<Record<ProviderId, ProviderAdapter>>,
  opts?: { breaker?: CircuitBreaker; meter?: UsageMeter; now?: () => number }
) {
  return new ModelGateway({
    adapters,
    apiKeys: {},
    breaker: opts?.breaker,
    meter: opts?.meter,
    now: opts?.now,
  });
}

describe('OpenAICompatibleProvider', () => {
  it('posts chat completions and normalizes usage', async () => {
    const fetchImpl = okFetch('world');
    const p = new OpenAICompatibleProvider(
      'deepseek',
      undefined,
      fetchImpl as never
    );
    const out = await p.chat({ ...req, model: 'deepseek-chat' }, 'k');
    expect(out.content).toBe('world');
    expect(out.usage.totalTokens).toBe(150);
    const [url, init] = (fetchImpl as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer k'
    );
  });

  it('throws on non-2xx', async () => {
    const p = new OpenAICompatibleProvider(
      'kimi',
      undefined,
      failFetch() as never
    );
    await expect(p.chat({ ...req, model: 'moonshot-v1-8k' })).rejects.toThrow(
      'HTTP 500'
    );
  });
});

describe('ManusProvider', () => {
  it('creates a task and returns result', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ result: 'done', usage: { total_tokens: 10 } }),
      text: async () => Promise.resolve(''),
    }));
    const p = new ManusProvider(undefined, fetchImpl as never);
    const out = await p.chat(req);
    expect(out.content).toBe('done');
    expect(out.usage.totalTokens).toBe(10);
  });
});

describe('CircuitBreaker', () => {
  it('opens after threshold failures and recovers after cooldown', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 100 });
    // canRequest uses injected now via gateway; test class directly
    cb.recordFailure('deepseek');
    cb.recordFailure('deepseek');
    expect(cb.state('deepseek')).toBe('open');
    // half-open probe after cooldown — emulate by checking canRequest with now
    const future = Date.now() + 200;
    expect(cb.canRequest('deepseek', future)).toBe(true);
    expect(cb.state('deepseek')).toBe('half-open');
    cb.recordSuccess('deepseek');
    expect(cb.state('deepseek')).toBe('closed');
  });
});

describe('UsageMeter', () => {
  it('aggregates calls, tokens and cost per provider', () => {
    const m = new UsageMeter();
    m.record({
      ts: 0,
      provider: 'deepseek',
      model: 'deepseek-chat',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      costUsd: 0.0001,
      latencyMs: 10,
      ok: true,
    });
    m.record({
      ts: 1,
      provider: 'deepseek',
      model: 'deepseek-chat',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      latencyMs: 5,
      ok: false,
    });
    const s = m.summary();
    expect(s.calls).toBe(2);
    expect(s.failures).toBe(1);
    expect(s.byProvider.deepseek.calls).toBe(2);
  });

  it('costFor uses catalog rate', () => {
    const m = new UsageMeter();
    const cost = m.costFor('deepseek', 'deepseek-chat', okUsage);
    expect(cost).toBeCloseTo((150 / 1000) * 0.00027, 8);
  });
});

describe('ModelRouter', () => {
  const router = new ModelRouter();

  it('prefers local ollama for sensitive data', () => {
    const c = router.route({ ...req, dataClass: 'sensitive' });
    expect(c[0].provider).toBe('ollama');
  });

  it('blocks regulated data from cloud providers', () => {
    const c = router.route({ ...req, dataClass: 'regulated' });
    expect(c.every((x) => x.provider === 'ollama')).toBe(true);
  });

  it('honors preferLocal', () => {
    const c = router.route({ ...req, preferLocal: true });
    expect(c[0].provider).toBe('ollama');
  });

  it('routes agent tasks to an agent-capable model', () => {
    const c = router.route({ ...req, taskClass: 'agent', dataClass: 'public' });
    const top = MODEL_CATALOG.find(
      (m) => m.provider === c[0].provider && m.model === c[0].model
    );
    expect(top?.capabilities).toContain('agent');
  });

  it('honors explicit model override', () => {
    const c = router.route({ ...req, model: 'glm-4-air' });
    expect(c).toHaveLength(1);
    expect(c[0].provider).toBe('glm');
  });
});

describe('ModelGateway', () => {
  it('serves chat through the routed provider and meters it', async () => {
    const fetchImpl = okFetch('hi there');
    const gw = gatewayWith({
      deepseek: new OpenAICompatibleProvider(
        'deepseek',
        undefined,
        fetchImpl as never
      ),
      kimi: new OpenAICompatibleProvider('kimi', undefined, fetchImpl as never),
      glm: new OpenAICompatibleProvider('glm', undefined, fetchImpl as never),
      ollama: new OpenAICompatibleProvider(
        'ollama',
        undefined,
        fetchImpl as never
      ),
      manus: new ManusProvider(undefined, fetchImpl as never),
    });
    const out = await gw.chat(req);
    expect(out.content).toBe('hi there');
    expect(out.usage.totalTokens).toBe(150);
    const s = gw.meterSummary();
    expect(s.calls).toBe(1);
    expect(s.failures).toBe(0);
    expect(s.totalTokens).toBe(150);
  });

  it('falls back to next provider on failure', async () => {
    // glm-4-air scores highest for plain chat; make it fail so the
    // gateway falls through to the next candidate.
    const bad = new OpenAICompatibleProvider(
      'glm',
      undefined,
      failFetch() as never
    );
    const good = new OpenAICompatibleProvider(
      'deepseek',
      undefined,
      okFetch('fallback ok') as never
    );
    const gw = gatewayWith({
      glm: bad,
      deepseek: good,
      kimi: good,
      ollama: good,
      manus: good,
    });
    const out = await gw.chat(req);
    expect(out.content).toBe('fallback ok');
    expect(out.fallbackFrom).toBeDefined();
    expect(gw.meterSummary().calls).toBe(2);
    expect(gw.meterSummary().failures).toBe(1);
  });

  it('opens breaker after repeated failures and skips provider', async () => {
    const bad = new OpenAICompatibleProvider(
      'deepseek',
      undefined,
      failFetch() as never
    );
    const good = new OpenAICompatibleProvider(
      'kimi',
      undefined,
      okFetch() as never
    );
    const gw = gatewayWith({ deepseek: bad, kimi: good });
    // force deepseek-only requests to burn failures
    for (let i = 0; i < 3; i++) {
      await gw
        .chat({ ...req, provider: 'deepseek', model: 'deepseek-chat' })
        .catch(() => {});
    }
    expect(gw.circuitBreaker.state('deepseek')).toBe('open');
    // now a general request should skip deepseek entirely
    const out = await gw.chat(req);
    expect(out.provider).not.toBe('deepseek');
  });

  it('throws when no model satisfies data-class constraints', async () => {
    const gw = gatewayWith({});
    // no catalog entry allows 'regulated' except ollama; remove ollama adapter
    await expect(gw.chat({ ...req, dataClass: 'regulated' })).rejects.toThrow();
  });
});
