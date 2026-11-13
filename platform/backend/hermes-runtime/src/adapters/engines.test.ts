import type { EngineRunRequest } from '../adapters/contracts';

import {
  DifyEngine,
  EngineHttpError,
  LangflowEngine,
  N8nEngine,
  OpenHandsEngine,
  openWebUI,
} from './engines';

const req: EngineRunRequest = {
  goal: 'summarize the repo',
  context: [{ role: 'user', content: 'hi' }],
  tools: [],
  maxSteps: 5,
};

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('N8nEngine', () => {
  it('POSTs goal context to the webhook and extracts responsePath', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return jsonResponse({ result: { text: 'done' } });
    }) as any;

    const engine = new N8nEngine({
      id: 'n8n',
      baseURL: 'http://n8n.local:5678',
      webhookPath: 'ultra-hook',
      responsePath: 'result.text',
    });
    const res = await engine.run(req);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://n8n.local:5678/webhook/ultra-hook');
    expect((calls[0].body as any).goal).toBe('summarize the repo');
    expect(res.answer).toBe('done');
    expect(res.iterationsUsed).toBe(1);
  });

  it('serializes whole body when no responsePath', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: 1 })) as any;
    const engine = new N8nEngine({
      id: 'n8n',
      baseURL: 'http://n8n.local',
      webhookURL: 'http://n8n.local/webhook/x',
    });
    const res = await engine.run(req);
    expect(res.answer).toBe('{"ok":1}');
  });

  it('throws EngineHttpError on non-2xx', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ e: 1 }, 500)) as any;
    const engine = new N8nEngine({
      id: 'n8n',
      baseURL: 'http://n8n.local',
      webhookURL: 'http://n8n.local/webhook/x',
    });
    await expect(engine.run(req)).rejects.toBeInstanceOf(EngineHttpError);
  });
});

describe('LangflowEngine', () => {
  it('runs the flow and digs the default answer path', async () => {
    const calls: Array<{ url: string; body: any }> = [];
    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return jsonResponse({
        outputs: [
          {
            outputs: [
              { results: { message: { data: { text: 'flow answer' } } } },
            ],
          },
        ],
      });
    }) as any;

    const engine = new LangflowEngine({
      id: 'langflow',
      baseURL: 'http://lf.local:7860/',
      flowId: 'abc-123',
    });
    const res = await engine.run(req);

    expect(calls[0].url).toBe('http://lf.local:7860/api/v1/run/abc-123/');
    expect(calls[0].body.input_value).toBe('summarize the repo');
    expect(res.answer).toBe('flow answer');
  });

  it('uses custom extractor when provided', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ custom: 'X' })) as any;
    const engine = new LangflowEngine({
      id: 'langflow',
      baseURL: 'http://lf.local',
      flowId: 'f',
      extract: (b) => (b as any).custom,
    });
    const res = await engine.run(req);
    expect(res.answer).toBe('X');
  });
});

describe('DifyEngine', () => {
  it('posts blocking chat-messages with app api key', async () => {
    const calls: Array<{ url: string; init: any }> = [];
    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ answer: 'dify says hi' });
    }) as any;

    const engine = new DifyEngine({
      id: 'dify',
      baseURL: 'http://dify.local',
      appApiKey: 'app-key-1',
    });
    const res = await engine.run(req);

    expect(calls[0].url).toBe('http://dify.local/v1/chat-messages');
    expect(calls[0].init.headers.authorization).toBe('Bearer app-key-1');
    const sent = JSON.parse(calls[0].init.body);
    expect(sent.query).toBe('summarize the repo');
    expect(sent.response_mode).toBe('blocking');
    expect(res.answer).toBe('dify says hi');
  });

  it('requires appApiKey', () => {
    expect(
      () => new DifyEngine({ id: 'dify', baseURL: 'http://x', appApiKey: '' })
    ).toThrow('appApiKey');
  });

  it('workflow mode hits workflows/run with workflow_id', async () => {
    const calls: Array<{ url: string; body: any }> = [];
    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return jsonResponse({ data: { outputs: { text: 'wf out' } } });
    }) as any;

    const engine = new DifyEngine({
      id: 'dify',
      baseURL: 'http://dify.local',
      appApiKey: 'k',
      mode: 'workflow',
      workflowId: 'wf-9',
    });
    const res = await engine.run(req);
    expect(calls[0].url).toBe('http://dify.local/v1/workflows/run');
    expect(calls[0].body.workflow_id).toBe('wf-9');
    expect(res.answer).toContain('wf out');
  });
});

describe('OpenHandsEngine', () => {
  it('creates a conversation then polls until terminal status', async () => {
    const urls: string[] = [];
    let polls = 0;
    global.fetch = jest.fn(async (url: any, init: any) => {
      const u = String(url);
      urls.push(u);
      if (init?.method === 'POST') {
        return jsonResponse({ conversation_id: 'conv-1' });
      }
      polls += 1;
      return jsonResponse(
        polls < 2
          ? { status: 'running' }
          : { status: 'finished', latest_agent_message: 'openhands done' }
      );
    }) as any;

    const engine = new OpenHandsEngine({
      id: 'openhands',
      baseURL: 'http://oh.local:3000',
      pollIntervalMs: 1,
    });
    const res = await engine.run(req);

    expect(urls[0]).toBe('http://oh.local:3000/api/conversations');
    expect(urls[1]).toBe('http://oh.local:3000/api/conversations/conv-1');
    expect(polls).toBe(2);
    expect(res.answer).toBe('openhands done');
  });

  it('extracts agent message from messages array fallback', async () => {
    global.fetch = jest.fn(async (url: any, init: any) => {
      if (init?.method === 'POST') return jsonResponse({ id: 'c2' });
      return jsonResponse({
        status: 'finished',
        messages: [
          { role: 'user', content: 'q' },
          { role: 'agent', content: 'a-from-msgs' },
        ],
      });
    }) as any;

    const engine = new OpenHandsEngine({
      id: 'openhands',
      baseURL: 'http://oh.local',
      pollIntervalMs: 1,
    });
    const res = await engine.run(req);
    expect(res.answer).toBe('a-from-msgs');
  });

  it('throws when no conversation id returned', async () => {
    global.fetch = jest.fn(async () => jsonResponse({})) as any;
    const engine = new OpenHandsEngine({
      id: 'openhands',
      baseURL: 'http://oh.local',
      pollIntervalMs: 1,
    });
    await expect(engine.run(req)).rejects.toBeInstanceOf(EngineHttpError);
  });
});

describe('openWebUI', () => {
  it('returns an OpenAI-compatible provider pointed at Open WebUI', () => {
    const p = openWebUI({ baseURL: 'http://owui.local:8080' });
    expect(p.id).toBe('open-webui');
    expect(p.capabilities.toolCalling).toBe(true);
  });
});
