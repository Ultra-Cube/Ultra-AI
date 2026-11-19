// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import type { EngineAdapter, EngineRunResult } from '@ultra-ai/hermes-runtime';

import {
  assertWorkflowConformance,
  assertWorkflowErrorConformance,
} from './conformance';
import { AdapterWorkflowEngine } from './engine';
import { createWorkflowEngine } from './factories';
import { probeTarget, probeAll, defaultWorkflowEngineProbes } from './probes';
import { WorkflowEngineError } from './types';

function mockAdapter(result: EngineRunResult | Error): EngineAdapter {
  return {
    id: 'mock',
    run: jest.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  } as unknown as EngineAdapter;
}

const goodResult: EngineRunResult = {
  answer: 'done',
  steps: [
    { kind: 'thought', content: 'thinking' },
    { kind: 'action', content: 'called tool' },
    { kind: 'observation', content: 'saw result' },
    { kind: 'answer', content: 'done' },
  ],
  toolCallsMade: 1,
  iterationsUsed: 1,
};

describe('AdapterWorkflowEngine', () => {
  it('normalizes a hermes EngineRunResult into WorkflowResult', async () => {
    const engine = new AdapterWorkflowEngine(
      'n8n',
      mockAdapter(goodResult),
      'local'
    );
    const res = await engine.run({ goal: 'x' });
    expect(res.engine).toBe('n8n');
    expect(res.answer).toBe('done');
    expect(res.locality).toBe('local');
    expect(res.steps).toHaveLength(4);
    expect(res.steps[0]).toEqual({ kind: 'thought', content: 'thinking' });
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
    expect(res.raw).toEqual({ toolCallsMade: 1, iterationsUsed: 1 });
  });

  it('wraps adapter failures in WorkflowEngineError carrying the kind', async () => {
    const engine = new AdapterWorkflowEngine(
      'dify',
      mockAdapter(new Error('boom')),
      'remote'
    );
    await expect(engine.run({ goal: 'x' })).rejects.toMatchObject({
      engine: 'dify',
      cause: expect.any(Error),
    });
    await expect(engine.run({ goal: 'x' })).rejects.toBeInstanceOf(
      WorkflowEngineError
    );
  });
});

describe('factories', () => {
  it('createWorkflowEngine returns kind langflow', () => {
    expect(createWorkflowEngine('langflow', { flowId: 'f1' }).kind).toBe(
      'langflow'
    );
  });
  it('createWorkflowEngine returns kind n8n', () => {
    expect(createWorkflowEngine('n8n').kind).toBe('n8n');
  });
  it('createWorkflowEngine returns kind dify', () => {
    expect(createWorkflowEngine('dify', { appApiKey: 'k' }).kind).toBe('dify');
  });
  it('langflow without flowId throws', () => {
    expect(() => createWorkflowEngine('langflow')).toThrow('flowId');
  });
  it('dify without appApiKey throws', () => {
    expect(() => createWorkflowEngine('dify')).toThrow('appApiKey');
  });
});

describe('probes', () => {
  const okFetch = (async () =>
    new Response('{}', { status: 200 })) as typeof fetch;

  it('probeTarget reports ok on 2xx', async () => {
    const r = await probeTarget(
      { id: 'x', url: 'http://h/' },
      { fetchImpl: okFetch, now: () => 0 }
    );
    expect(r).toMatchObject({ id: 'x', ok: true, status: 200 });
  });

  it('probeTarget accepts 401 only when acceptUnauthorized', async () => {
    const unauth = (async () =>
      new Response('{}', { status: 401 })) as typeof fetch;
    const t = { id: 'x', url: 'http://h/' };
    expect((await probeTarget(t, { fetchImpl: unauth })).ok).toBe(false);
    expect(
      (
        await probeTarget(
          { ...t, acceptUnauthorized: true },
          { fetchImpl: unauth }
        )
      ).ok
    ).toBe(true);
  });

  it('probeTarget reports status 0 on network failure', async () => {
    const fail = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    const r = await probeTarget(
      { id: 'x', url: 'http://h/' },
      { fetchImpl: fail }
    );
    expect(r).toMatchObject({ ok: false, status: 0, detail: 'ECONNREFUSED' });
  });

  it('probeAll returns one result per target', async () => {
    const rs = await probeAll(defaultWorkflowEngineProbes(), {
      fetchImpl: okFetch,
    });
    expect(rs).toHaveLength(4);
    expect(rs.every((r) => r.ok)).toBe(true);
  });
});

describe('conformance suite', () => {
  it('passes for a conforming adapter', async () => {
    const engine = new AdapterWorkflowEngine('n8n', mockAdapter(goodResult));
    const c = await assertWorkflowConformance(engine);
    expect(c.violations).toEqual([]);
    expect(c.passed).toBe(true);
  });

  it('fails when answer step is missing', async () => {
    const bad: EngineRunResult = {
      ...goodResult,
      steps: [{ kind: 'thought', content: 'x' }],
    };
    const engine = new AdapterWorkflowEngine('langflow', mockAdapter(bad));
    const c = await assertWorkflowConformance(engine);
    expect(c.passed).toBe(false);
    expect(c.violations.some((v) => v.check === 'steps')).toBe(true);
  });

  it('fails when engine kind mismatches', async () => {
    const engine = new AdapterWorkflowEngine('n8n', mockAdapter(goodResult));
    // force a mismatched result via run override
    jest
      .spyOn(engine, 'run')
      .mockResolvedValue({ ...(goodResult as never), engine: 'dify' } as never);
    const c = await assertWorkflowConformance(engine);
    expect(c.passed).toBe(false);
    expect(c.violations.some((v) => v.check === 'engine')).toBe(true);
  });

  it('error conformance: run failure surfaces as WorkflowEngineError', async () => {
    const engine = new AdapterWorkflowEngine(
      'dify',
      mockAdapter(new Error('x'))
    );
    expect(await assertWorkflowErrorConformance(engine, { goal: 'x' })).toBe(
      true
    );
  });
});
