import { HermesRuntime, MockProvider } from '../index';

describe('HermesRuntime', () => {
  it('creates a session and runs a task to completion', async () => {
    const rt = new HermesRuntime({ provider: 'mock' });
    rt.registerProvider(new MockProvider({ id: 'mock' }));

    const session = rt.createSession('agent-1');
    const task = await rt.runTask(session.id, 'hello');

    expect(task.status).toBe('completed');
    expect(task.result).toContain('mock(mock)');
    expect(session.messages.length).toBe(2);
  });

  it('writes short-term memory after a task', async () => {
    const rt = new HermesRuntime({ provider: 'mock' });
    rt.registerProvider(new MockProvider({ id: 'mock' }));
    const session = rt.createSession('agent-mem');

    await rt.runTask(session.id, 'remember this');
    const entries = await rt.memory.query({
      namespace: 'agent-mem',
      scope: 'short-term',
    });
    expect(entries.length).toBe(1);
    expect(entries[0].content).toContain('remember this');
  });

  it('emits runtime events', async () => {
    const rt = new HermesRuntime({ provider: 'mock' });
    rt.registerProvider(new MockProvider({ id: 'mock' }));
    const events: string[] = [];
    rt.onEvent((e) => events.push(e.type));

    const session = rt.createSession();
    await rt.runTask(session.id, 'hi');

    expect(events).toContain('session.created');
    expect(events).toContain('task.started');
    expect(events).toContain('task.completed');
    expect(events).toContain('reasoning.step');
    expect(events).toContain('memory.written');
  });

  it('fails the task when the provider throws', async () => {
    const rt = new HermesRuntime({ provider: 'mock' });
    rt.registerProvider(
      new MockProvider({ id: 'mock', failWith: { status: 500, times: 99 } })
    );
    const session = rt.createSession();

    const task = await rt.runTask(session.id, 'boom');
    expect(task.status).toBe('failed');
    expect(task.error).toContain('500');
  });
});
