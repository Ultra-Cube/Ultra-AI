// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import {
  AgentRegistry,
  TaskBus,
  DelegationPolicy,
  type RegisteredAgent,
  type WorkDispatch,
} from './index';

function dispatch(route: Partial<WorkDispatch['route']> = {}): WorkDispatch {
  return {
    dispatchId: 'd-1',
    task: { id: 't-1', kind: 'code', payload: {} },
    route: { target: 'hermes', ...route },
    execution: { locality: 'escalated' },
  };
}

describe('AgentRegistry', () => {
  it('registers, lists, filters, and unregisters agents', () => {
    const reg = new AgentRegistry();
    reg.register({
      agentId: 'a1',
      target: 'hermes',
      capabilities: ['code'],
      status: 'online',
    });
    reg.register({
      agentId: 'a2',
      target: 'openhands',
      capabilities: ['research'],
      status: 'offline',
    });
    expect(reg.list()).toHaveLength(2);
    expect(reg.list({ target: 'hermes' }).map((a) => a.agentId)).toEqual([
      'a1',
    ]);
    expect(reg.list({ capability: 'research' })[0].agentId).toBe('a2');
    expect(reg.unregister('a2')).toBe(true);
    expect(reg.get('a2')).toBeUndefined();
  });

  it('rejects agents without capabilities', () => {
    const reg = new AgentRegistry();
    expect(() =>
      reg.register({
        agentId: 'x',
        target: 'local',
        capabilities: [],
        status: 'online',
      })
    ).toThrow('capability');
  });

  it('candidatesFor honours agentId and excludes offline', () => {
    const reg = new AgentRegistry();
    const agent: RegisteredAgent = {
      agentId: 'spec-1',
      target: 'specialist-agent',
      capabilities: ['media'],
      status: 'online',
    };
    reg.register(agent);
    reg.register({
      agentId: 'h1',
      target: 'hermes',
      capabilities: ['code'],
      status: 'offline',
    });
    expect(
      reg.candidatesFor(
        dispatch({ target: 'specialist-agent', agentId: 'spec-1' })
      )
    ).toHaveLength(1);
    expect(reg.candidatesFor(dispatch())).toHaveLength(0); // only offline hermes
  });
});

describe('TaskBus', () => {
  it('publishes to capability subscribers and tracks queue', async () => {
    const bus = new TaskBus();
    const seen: string[] = [];
    bus.subscribe('code', (e) => {
      seen.push(e.busId);
    });
    const env = await bus.publish(dispatch(), 'code', () => 'bus-x');
    expect(env.busId).toBe('bus-x');
    expect(seen).toEqual(['bus-x']);
    expect(bus.pending()).toHaveLength(1);
    expect(bus.ack('bus-x')).toBe(true);
    expect(bus.pending()).toHaveLength(0);
  });

  it('unsubscribe stops delivery', async () => {
    const bus = new TaskBus();
    let n = 0;
    const off = bus.subscribe('ops', () => n++);
    off();
    await bus.publish(dispatch({ target: 'local' }), 'ops');
    expect(n).toBe(0);
  });
});

describe('DelegationPolicy', () => {
  it('allows local without confirmation', () => {
    const p = new DelegationPolicy();
    const d = p.decide({ dispatch: dispatch({ target: 'local' }) });
    expect(d.allowed).toBe(true);
    expect(d.requiresConfirmation).toBe(false);
  });

  it('blocks beyond maxDepth and non-allowed targets', () => {
    const p = new DelegationPolicy({ maxDepth: 1, allowedTargets: ['hermes'] });
    p.acquire('agent-a');
    const blocked = p.decide({
      dispatch: dispatch(),
      fromAgentId: 'agent-a',
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain('depth');
    const badTarget = p.decide({
      dispatch: dispatch({ target: 'customer', customerId: 'c1' }),
    });
    expect(badTarget.allowed).toBe(false);
  });

  it('flags sensitive dispatches for confirmation', () => {
    const p = new DelegationPolicy();
    const d = dispatch();
    d.task.sensitivity = 'sensitive';
    const dec = p.decide({ dispatch: d });
    expect(dec.allowed).toBe(true);
    expect(dec.requiresConfirmation).toBe(true);
  });

  it('enforces concurrency budget', () => {
    const p = new DelegationPolicy({ maxConcurrent: 1 });
    p.acquire('a');
    const dec = p.decide({ dispatch: dispatch() });
    expect(dec.allowed).toBe(false);
    expect(dec.reason).toContain('concurrency');
    p.release('a');
    expect(p.decide({ dispatch: dispatch() }).allowed).toBe(true);
  });
});
