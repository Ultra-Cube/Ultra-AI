import { createServer, Server } from 'http';
import type { AddressInfo } from 'net';

import type { HermesMessage } from '../types';

import { AnthropicProvider } from './anthropic';
import { OpenAICompatibleProvider } from './openai-compatible';

interface Captured {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

describe('provider adapters (live HTTP)', () => {
  let server: Server;
  let baseURL: string;
  let last: Captured;
  let responder: (
    url: string,
    body: unknown
  ) => { status: number; json: unknown };

  beforeAll(async () => {
    server = createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        last = {
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: raw ? JSON.parse(raw) : undefined,
        };
        const out = responder(req.url ?? '', last.body);
        res.writeHead(out.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(out.json));
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  });

  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  beforeEach(() => {
    last = { headers: {} };
    responder = () => ({
      status: 200,
      json: { choices: [{ message: { content: 'ok' } }] },
    });
  });

  const msgs = (content = 'hi'): HermesMessage[] => [
    { role: 'user', content, timestamp: Date.now() },
  ];

  describe('OpenAICompatibleProvider', () => {
    it('posts chat completions with auth + model', async () => {
      responder = () => ({
        status: 200,
        json: {
          model: 'gpt-4o-mini',
          choices: [{ message: { content: 'hello' } }],
          usage: { prompt_tokens: 3, completion_tokens: 5 },
        },
      });
      const p = new OpenAICompatibleProvider({
        id: 'openai',
        baseURL,
        apiKey: 'sk-test',
      });
      const res = await p.generate({ model: 'gpt-4o-mini', messages: msgs() });
      expect(res.content).toBe('hello');
      expect(res.provider).toBe('openai');
      expect(res.usage).toEqual({ promptTokens: 3, completionTokens: 5 });
      expect(last.url).toBe('/v1/chat/completions');
      expect(last.headers.authorization).toBe('Bearer sk-test');
      expect((last.body as any).model).toBe('gpt-4o-mini');
    });

    it('maps tool calls from the response', async () => {
      responder = () => ({
        status: 200,
        json: {
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'lookup',
                      arguments: '{"q":"x"}',
                    },
                  },
                ],
              },
            },
          ],
        },
      });
      const p = new OpenAICompatibleProvider({ id: 'x', baseURL });
      const res = await p.generate({
        model: 'm',
        messages: msgs(),
        tools: [
          {
            name: 'lookup',
            description: 'd',
            parameters: { type: 'object' },
          },
        ],
      });
      expect(res.toolCalls).toEqual([
        { id: 'call_1', name: 'lookup', arguments: { q: 'x' } },
      ]);
      const tools = (last.body as any).tools;
      expect(tools[0].function.name).toBe('lookup');
    });

    it('falls back to defaultModel for "default" model', async () => {
      const p = new OpenAICompatibleProvider({
        id: 'ollama',
        baseURL,
        defaultModel: 'llama3.2',
      });
      await p.generate({ model: 'default', messages: msgs() });
      expect((last.body as any).model).toBe('llama3.2');
      expect(last.headers.authorization).toBeUndefined();
    });

    it('throws ProviderHttpError on non-2xx', async () => {
      responder = () => ({ status: 429, json: { error: 'rate' } });
      const p = new OpenAICompatibleProvider({ id: 'x', baseURL });
      await expect(
        p.generate({ model: 'm', messages: msgs() })
      ).rejects.toMatchObject({ status: 429 });
    });

    it('embeds via /embeddings', async () => {
      responder = () => ({
        status: 200,
        json: { data: [{ embedding: [0.1, 0.2] }] },
      });
      const p = new OpenAICompatibleProvider({ id: 'x', baseURL });
      const out = await p.embed(['a', 'b']);
      expect(last.url).toBe('/v1/embeddings');
      expect(out).toEqual([[0.1, 0.2]]);
    });
  });

  describe('AnthropicProvider', () => {
    const aURL = () => baseURL.replace(/\/v1$/, '');

    it('posts messages with anthropic headers and hoists system', async () => {
      responder = () => ({
        status: 200,
        json: {
          model: 'claude-sonnet-4-5',
          content: [{ type: 'text', text: 'hi there' }],
          usage: { input_tokens: 10, output_tokens: 4 },
        },
      });
      const p = new AnthropicProvider({ apiKey: 'sk-ant', baseURL: aURL() });
      const res = await p.generate({
        model: 'default',
        messages: [
          { role: 'system', content: 'be terse', timestamp: 1 },
          { role: 'user', content: 'hello', timestamp: 2 },
        ],
      });
      expect(res.content).toBe('hi there');
      expect(res.provider).toBe('anthropic');
      expect(last.url).toBe('/v1/messages');
      expect(last.headers['x-api-key']).toBe('sk-ant');
      expect(last.headers['anthropic-version']).toBe('2023-06-01');
      expect((last.body as any).system).toBe('be terse');
      expect((last.body as any).messages).toEqual([
        { role: 'user', content: 'hello' },
      ]);
    });

    it('maps tool_use blocks', async () => {
      responder = () => ({
        status: 200,
        json: {
          content: [
            { type: 'text', text: 'checking' },
            {
              type: 'tool_use',
              id: 'tu_1',
              name: 'search',
              input: { q: 'y' },
            },
          ],
        },
      });
      const p = new AnthropicProvider({ apiKey: 'k', baseURL: aURL() });
      const res = await p.generate({
        model: 'claude-sonnet-4-5',
        messages: msgs(),
        tools: [
          {
            name: 'search',
            description: 'd',
            parameters: { type: 'object' },
          },
        ],
      });
      expect(res.content).toBe('checking');
      expect(res.toolCalls).toEqual([
        { id: 'tu_1', name: 'search', arguments: { q: 'y' } },
      ]);
    });

    it('does not support embeddings', () => {
      const p = new AnthropicProvider({ apiKey: 'k', baseURL: aURL() });
      expect(p.capabilities.embeddings).toBe(false);
      expect(p.embed).toBeUndefined();
    });
  });
});
