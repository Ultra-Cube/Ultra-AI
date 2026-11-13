import { PolicyEngine } from './policy';
import { ZeroAIRouter } from './router';
import type {
  GatewayPort,
  LocalModelPort,
  MemoryPort,
  ToolPort,
  WorkflowPort,
  ZeroAIEvent,
  ZeroAIRequest,
} from './types';

const req = (over: Partial<ZeroAIRequest> = {}): ZeroAIRequest => ({
  id: 'r1',
  sessionId: 's1',
  text: 'hello',
  ...over,
});

const memory = (
  hits: { id: string; content: string; score: number }[] = []
): MemoryPort => ({
  recall: jest.fn(async () => hits),
  remember: jest.fn(async () => undefined),
});

const localModel = (answer = 'local answer'): LocalModelPort => ({
  run: jest.fn(async () => answer),
});

describe('ZeroAIRouter — local-first contract', () => {
  it('routes a plain request to the local model by default', async () => {
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel(),
    });
    const res = await router.handle(req());
    expect(res.status).toBe('completed');
    expect(res.route).toBe('local-model');
    expect(res.locality).toBe('local');
    expect(res.answer).toBe('local answer');
  });

  it('injects recalled memory into the local model prompt', async () => {
    const lm = localModel();
    const router = new ZeroAIRouter({
      memory: memory([
        { id: 'm1', content: 'user prefers dark mode', score: 0.9 },
      ]),
      policy: new PolicyEngine(),
      localModel: lm,
    });
    await router.handle(req());
    expect(lm.run).toHaveBeenCalledWith(
      expect.stringContaining('dark mode'),
      expect.anything()
    );
  });

  it('escalates when the request mentions Ultra and gateway is configured', async () => {
    const gateway: GatewayPort = {
      escalate: jest.fn(async () => 'cloud answer'),
    };
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel(),
      gateway,
    });
    const res = await router.handle(req({ text: 'offload this to ultra ai' }));
    expect(res.route).toBe('escalate');
    expect(res.locality).toBe('escalated');
    expect(res.answer).toBe('cloud answer');
  });

  it('falls back to local model when gateway is unavailable', async () => {
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel('fallback'),
    });
    const res = await router.handle(req({ text: 'use ultra ai cloud' }));
    expect(res.route).toBe('escalate');
    expect(res.locality).toBe('local'); // honest: stayed local
    expect(res.answer).toBe('fallback');
  });

  it('blocks sensitive actions pending confirmation', async () => {
    const tool: ToolPort = {
      name: 'shell',
      sensitive: true,
      canHandle: () => true,
      invoke: jest.fn(async () => ({ ok: true, content: 'done' })),
    };
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel(),
      tools: [tool],
    });
    const res = await router.handle(
      req({ text: 'delete the old files', hint: 'local-tool' })
    );
    expect(res.status).toBe('awaiting-confirmation');
    expect(tool.invoke).not.toHaveBeenCalled();
  });

  it('executes a sensitive action once confirmed', async () => {
    const tool: ToolPort = {
      name: 'shell',
      canHandle: () => true,
      invoke: jest.fn(async () => ({ ok: true, content: 'deleted' })),
    };
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel(),
      tools: [tool],
    });
    const res = await router.handle(
      req({
        text: 'delete the old files',
        hint: 'local-tool',
        confirmation: { approved: true },
      })
    );
    expect(res.status).toBe('completed');
    expect(res.route).toBe('local-tool');
    expect(res.locality).toBe('local');
    expect(tool.invoke).toHaveBeenCalled();
  });

  it('runs a matching workflow', async () => {
    const wf: WorkflowPort = {
      id: 'nightly-sync',
      canHandle: (r) => r.text.includes('sync'),
      run: jest.fn(async () => ({ ok: true, content: 'synced' })),
    };
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: localModel(),
      workflows: [wf],
    });
    const res = await router.handle(
      req({ text: 'sync my notes', hint: 'workflow' })
    );
    expect(res.status).toBe('completed');
    expect(res.executed).toEqual(['nightly-sync']);
  });

  it('emits the full event trail for UI visibility', async () => {
    const events: ZeroAIEvent[] = [];
    const router = new ZeroAIRouter({
      memory: memory([{ id: 'm', content: 'x', score: 1 }]),
      policy: new PolicyEngine(),
      localModel: localModel(),
      onEvent: (e) => events.push(e),
    });
    await router.handle(req({ text: 'hi' }));
    const types = events.map((e) => e.type);
    expect(types).toEqual([
      'request.received',
      'memory.recalled',
      'policy.decided',
      'route.executed',
      'response.ready',
    ]);
    expect(events.find((e) => e.type === 'route.executed')?.locality).toBe(
      'local'
    );
  });

  it('returns failed status when the route throws', async () => {
    const router = new ZeroAIRouter({
      memory: memory(),
      policy: new PolicyEngine(),
      localModel: {
        run: jest.fn(async () => {
          throw new Error('model down');
        }),
      },
    });
    const res = await router.handle(req());
    expect(res.status).toBe('failed');
    expect(res.error).toBe('model down');
    expect(res.locality).toBe('local');
  });
});

describe('PolicyEngine', () => {
  it('defaults to local-model', async () => {
    const d = await new PolicyEngine().decide(req({ text: 'what time is it' }));
    expect(d.route).toBe('local-model');
    expect(d.requiresConfirmation).toBe(false);
  });

  it('flags sensitive patterns for confirmation', async () => {
    const d = await new PolicyEngine().decide(
      req({ text: 'please transfer the funds' })
    );
    expect(d.requiresConfirmation).toBe(true);
  });

  it('escalation keyword wins over local default', async () => {
    const d = await new PolicyEngine().decide(
      req({ text: 'this needs cloud scale' })
    );
    expect(d.route).toBe('escalate');
  });
});
