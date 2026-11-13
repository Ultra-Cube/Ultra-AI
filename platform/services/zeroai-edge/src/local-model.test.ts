import {
  createOllamaLocalModel,
  createOpenAICompatibleLocalModel,
  localModelLaneFromEnv,
  localModelPortFromLane,
} from './local-model';

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

describe('createOpenAICompatibleLocalModel', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('posts chat completions with model+messages and returns content', async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse({ choices: [{ message: { content: 'hi there' } }] })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const port = createOpenAICompatibleLocalModel({
      baseURL: 'http://127.0.0.1:20128/v1/',
      model: 'default',
      apiKey: 'k',
      systemPrompt: 'be terse',
    });
    const out = await port.run('hello', { sessionId: 's', memory: [] });

    expect(out).toBe('hi there');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('http://127.0.0.1:20128/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer k'
    );
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('default');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be terse' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hello' });
  });

  it('throws on non-2xx with status detail', async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse({ error: 'down' }, 503)
    ) as unknown as typeof fetch;
    const port = createOpenAICompatibleLocalModel({
      baseURL: 'http://x/v1',
      model: 'm',
    });
    await expect(port.run('p', { sessionId: 's', memory: [] })).rejects.toThrow(
      '503'
    );
  });

  it('throws on empty choices content', async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse({ choices: [] })
    ) as unknown as typeof fetch;
    const port = createOpenAICompatibleLocalModel({
      baseURL: 'http://x/v1',
      model: 'm',
    });
    await expect(port.run('p', { sessionId: 's', memory: [] })).rejects.toThrow(
      'empty response'
    );
  });
});

describe('createOllamaLocalModel', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('posts /api/generate with prompt and returns response', async () => {
    const fetchMock = jest.fn(async () =>
      jsonResponse({ response: 'ollama says hi' })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const port = createOllamaLocalModel({
      baseURL: 'http://127.0.0.1:11434/',
      model: 'llama3.2',
      systemPrompt: 'sys',
    });
    const out = await port.run('hello', { sessionId: 's', memory: [] });

    expect(out).toBe('ollama says hi');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('http://127.0.0.1:11434/api/generate');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('llama3.2');
    expect(body.prompt).toContain('sys');
    expect(body.prompt).toContain('hello');
    expect(body.stream).toBe(false);
  });

  it('throws on non-2xx', async () => {
    global.fetch = jest.fn(async () =>
      jsonResponse({}, 500)
    ) as unknown as typeof fetch;
    const port = createOllamaLocalModel({
      baseURL: 'http://x',
      model: 'm',
    });
    await expect(port.run('p', { sessionId: 's', memory: [] })).rejects.toThrow(
      '500'
    );
  });
});

describe('localModelLaneFromEnv', () => {
  it('returns undefined when unset or unknown', () => {
    expect(localModelLaneFromEnv({})).toBeUndefined();
    expect(
      localModelLaneFromEnv({ ZEROAI_LOCAL_MODEL: 'bogus' })
    ).toBeUndefined();
  });

  it('defaults ollama to 127.0.0.1:11434 / llama3.2', () => {
    expect(localModelLaneFromEnv({ ZEROAI_LOCAL_MODEL: 'ollama' })).toEqual({
      kind: 'ollama',
      baseURL: 'http://127.0.0.1:11434',
      model: 'llama3.2',
    });
  });

  it('defaults openai-compatible to 9router port /v1', () => {
    expect(
      localModelLaneFromEnv({ ZEROAI_LOCAL_MODEL: 'openai-compatible' })
    ).toEqual({
      kind: 'openai-compatible',
      baseURL: 'http://127.0.0.1:20128/v1',
      model: 'default',
      apiKey: undefined,
    });
  });

  it('honours overrides', () => {
    expect(
      localModelLaneFromEnv({
        ZEROAI_LOCAL_MODEL: 'openai-compatible',
        ZEROAI_LOCAL_BASE_URL: 'http://router:9000/v1',
        ZEROAI_LOCAL_MODEL_NAME: 'qwen3',
        ZEROAI_LOCAL_API_KEY: 'secret',
      })
    ).toEqual({
      kind: 'openai-compatible',
      baseURL: 'http://router:9000/v1',
      model: 'qwen3',
      apiKey: 'secret',
    });
  });
});

describe('localModelPortFromLane', () => {
  it('builds ports for both lane kinds', () => {
    const a = localModelPortFromLane({
      kind: 'ollama',
      baseURL: 'http://x',
      model: 'm',
    });
    const b = localModelPortFromLane({
      kind: 'openai-compatible',
      baseURL: 'http://x/v1',
      model: 'm',
    });
    expect(typeof a.run).toBe('function');
    expect(typeof b.run).toBe('function');
  });
});
