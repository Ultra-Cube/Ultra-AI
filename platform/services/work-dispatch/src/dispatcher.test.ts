import { WorkDispatcher } from './dispatcher';
import { DispatchExecutor, DispatchRequest } from './types';

const okExecutor: DispatchExecutor = {
  execute: jest.fn(async (d) => ({
    output: 'done',
    trailRef: `trail:${d.dispatchId}`,
  })),
};

const baseReq = (over: Partial<DispatchRequest> = {}): DispatchRequest => ({
  task: { kind: 'code', payload: { repo: 'x' } },
  route: { target: 'local' },
  ...over,
});

describe('WorkDispatcher', () => {
  let d: WorkDispatcher;
  beforeEach(() => {
    jest.clearAllMocks();
    d = new WorkDispatcher({ executors: { local: okExecutor } });
  });

  it('dispatches a public task to local and reports locality=local', async () => {
    const r = await d.dispatch(baseReq());
    expect(r.status).toBe('completed');
    expect(r.dispatch.execution?.locality).toBe('local');
    expect(r.dispatch.execution?.trailRef).toMatch(/^trail:/);
  });

  it('escalates non-local targets by default', async () => {
    const dd = new WorkDispatcher({
      executors: { hermes: okExecutor },
    });
    const r = await dd.dispatch(baseReq({ route: { target: 'hermes' } }));
    expect(r.status).toBe('completed');
    expect(r.dispatch.execution?.locality).toBe('escalated');
  });

  it('honours locality overrides', async () => {
    const dd = new WorkDispatcher({
      executors: { hermes: okExecutor },
      locality: { hermes: 'local' },
    });
    const r = await dd.dispatch(baseReq({ route: { target: 'hermes' } }));
    expect(r.dispatch.execution?.locality).toBe('local');
  });

  it('queues sensitive tasks awaiting confirmation', async () => {
    const r = await d.dispatch(
      baseReq({ task: { kind: 'ops', payload: {}, sensitivity: 'sensitive' } })
    );
    expect(r.status).toBe('awaiting-confirmation');
    expect(okExecutor.execute).not.toHaveBeenCalled();
    expect(d.pendingIds()).toHaveLength(1);
    const events = d.trailFor(r.dispatch.dispatchId).map((t) => t.event);
    expect(events).toEqual(['received', 'confirmation-required']);
  });

  it('queues requiresConfirmation tasks the same way', async () => {
    const r = await d.dispatch(
      baseReq({
        task: { kind: 'code', payload: {}, requiresConfirmation: true },
      })
    );
    expect(r.status).toBe('awaiting-confirmation');
  });

  it('runs a confirmed task inline with confirmedAt', async () => {
    const r = await d.dispatch(
      baseReq({
        task: { kind: 'ops', payload: {}, sensitivity: 'sensitive' },
        confirmation: { approved: true, confirmedBy: 'user-1' },
      })
    );
    expect(r.status).toBe('completed');
    expect(r.dispatch.execution?.confirmedAt).toBeTruthy();
    expect(okExecutor.execute).toHaveBeenCalledTimes(1);
  });

  it('confirm() approves a pending dispatch', async () => {
    const r1 = await d.dispatch(
      baseReq({ task: { kind: 'ops', payload: {}, sensitivity: 'sensitive' } })
    );
    const r2 = await d.confirm(r1.dispatch.dispatchId, {
      approved: true,
      confirmedBy: 'admin',
    });
    expect(r2?.status).toBe('completed');
    expect(r2?.dispatch.execution?.confirmedAt).toBeTruthy();
    const events = d.trailFor(r1.dispatch.dispatchId).map((t) => t.event);
    expect(events).toContain('confirmed');
    expect(events).toContain('completed');
  });

  it('confirm() denial produces denied status', async () => {
    const r1 = await d.dispatch(
      baseReq({ task: { kind: 'ops', payload: {}, sensitivity: 'sensitive' } })
    );
    const r2 = await d.confirm(r1.dispatch.dispatchId, { approved: false });
    expect(r2?.status).toBe('denied');
    expect(okExecutor.execute).not.toHaveBeenCalled();
  });

  it('confirm() returns null for unknown dispatch', async () => {
    expect(await d.confirm('nope', { approved: true })).toBeNull();
  });

  it('fails when no executor is registered for the target', async () => {
    const r = await d.dispatch(baseReq({ route: { target: 'openhands' } }));
    expect(r.status).toBe('failed');
    expect(r.reason).toContain('openhands');
  });

  it('fails when the executor throws', async () => {
    const bad: DispatchExecutor = {
      execute: jest.fn(async () => {
        throw new Error('boom');
      }),
    };
    const dd = new WorkDispatcher({ executors: { local: bad } });
    const r = await dd.dispatch(baseReq());
    expect(r.status).toBe('failed');
    expect(r.reason).toBe('boom');
  });

  it('prefers agentId executor over target executor', async () => {
    const agentExec: DispatchExecutor = {
      execute: jest.fn(async () => ({ output: 'agent' })),
    };
    const dd = new WorkDispatcher({
      executors: { local: okExecutor, 'agent-9': agentExec },
    });
    const r = await dd.dispatch(
      baseReq({ route: { target: 'specialist-agent', agentId: 'agent-9' } })
    );
    expect(r.status).toBe('completed');
    expect(agentExec.execute).toHaveBeenCalled();
  });

  it('rejects invalid requests', async () => {
    expect(
      (await d.dispatch(baseReq({ route: { target: 'bogus' as never } })))
        .status
    ).toBe('failed');
    expect(
      (await d.dispatch(baseReq({ route: { target: 'customer' } }))).reason
    ).toContain('customerId');
    expect(
      (await d.dispatch(baseReq({ route: { target: 'specialist-agent' } })))
        .reason
    ).toContain('agentId');
    expect(
      (await d.dispatch(baseReq({ route: { target: 'local', priority: 10 } })))
        .status
    ).toBe('failed');
  });

  it('attaches an Ed25519 signature when a signer is configured', async () => {
    const dd = new WorkDispatcher({
      executors: { local: okExecutor },
      signer: { keyId: 'k1', sign: (p) => `sig:${p.length}` },
    });
    const r = await dd.dispatch(baseReq());
    expect(r.dispatch.signature).toEqual({
      alg: 'Ed25519',
      keyId: 'k1',
      value: expect.stringMatching(/^sig:/),
    });
  });

  it('uses injected ids and clock', async () => {
    let n = 0;
    const dd = new WorkDispatcher({
      executors: { local: okExecutor },
      idgen: () => `id-${++n}`,
      now: () => new Date('2026-01-01T00:00:00Z'),
    });
    const r = await dd.dispatch(baseReq());
    expect(r.dispatch.dispatchId).toBe('id-1');
    expect(r.dispatch.task.id).toBe('id-2');
    expect(dd.trailFor(r.dispatch.dispatchId)[0].at).toBe(
      '2026-01-01T00:00:00.000Z'
    );
  });
});
