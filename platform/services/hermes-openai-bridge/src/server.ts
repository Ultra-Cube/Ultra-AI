// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { randomUUID } from 'node:crypto';
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';

import { HermesRuntime } from '@ultra-ai/hermes-runtime';

/**
 * OpenAI-compatible bridge for HermesRuntime.
 *
 * Exposes POST /v1/chat/completions (+ GET /v1/models, /health) so Open
 * WebUI — or any OpenAI client — can select "hermes" as a model provider.
 * Each request runs a Hermes task (memory recall -> reason -> answer ->
 * memory write) inside a session keyed by the `x-hermes-session` header,
 * the request `user` field, or `metadata.conversation_id`; default
 * "openwebui".
 */

export interface HermesOpenAIOptions {
  runtime: HermesRuntime;
  /** Bearer token required on /v1/* (except /health). Default: env HERMES_OPENAI_TOKEN. */
  token?: string;
  /** Model id advertised in /v1/models and echoed in responses. */
  modelId?: string;
}

interface ChatMessage {
  role: string;
  content: unknown;
}

interface ChatRequest {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  user?: string;
  metadata?: { conversation_id?: string };
}

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const textOf = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content
          .map((p) =>
            typeof p === 'object' && p !== null && 'text' in p
              ? String((p as { text: unknown }).text)
              : ''
          )
          .join('')
      : '';

/** Build the request handler; usable standalone or inside createServer. */
export function createHermesOpenAIHandler(opts: HermesOpenAIOptions) {
  const token = opts.token ?? process.env.HERMES_OPENAI_TOKEN;
  const modelId = opts.modelId ?? 'hermes';
  const { runtime } = opts;
  const sessions = new Map<string, string>(); // sessionKey -> sessionId

  const sessionFor = (key: string): string => {
    let id = sessions.get(key);
    if (!id || !runtime.getSession(id)) {
      id = runtime.createSession('openwebui').id;
      sessions.set(key, id);
    }
    return id;
  };

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;

    if (path === '/health' && req.method === 'GET') {
      return json(res, 200, { status: 'ok', model: modelId });
    }

    if (token) {
      const auth = req.headers.authorization ?? '';
      if (auth !== `Bearer ${token}`) {
        return json(res, 401, {
          error: { message: 'unauthorized', type: 'auth_error' },
        });
      }
    }

    if (path === '/v1/models' && req.method === 'GET') {
      return json(res, 200, {
        object: 'list',
        data: [
          {
            id: modelId,
            object: 'model',
            created: 0,
            owned_by: 'ultra-ai',
          },
        ],
      });
    }

    if (path === '/v1/chat/completions' && req.method === 'POST') {
      const body = await readJson(req);
      if (body === undefined)
        return json(res, 400, { error: 'malformed json' });
      const chat = body as ChatRequest;
      const messages = Array.isArray(chat.messages) ? chat.messages : [];
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const prompt = lastUser ? textOf(lastUser.content) : '';
      if (!prompt) {
        return json(res, 400, {
          error: { message: 'no user message', type: 'invalid_request' },
        });
      }

      const key =
        (req.headers['x-hermes-session'] as string | undefined) ??
        chat.metadata?.conversation_id ??
        chat.user ??
        'openwebui';
      const sessionId = sessionFor(key);

      const task = await runtime.runTask(sessionId, prompt);
      if (task.status !== 'completed' || !task.result) {
        return json(res, 502, {
          error: {
            message: task.error ?? 'hermes task failed',
            type: 'upstream_error',
          },
        });
      }

      const completionId = `chatcmpl-${randomUUID().slice(0, 8)}`;
      const created = Math.floor(Date.now() / 1000);
      if (chat.stream) {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        const chunk = (delta: Record<string, unknown>, finish: string | null) =>
          `data: ${JSON.stringify({
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: modelId,
            choices: [{ index: 0, delta, finish_reason: finish }],
          })}\n\n`;
        res.write(chunk({ role: 'assistant' }, null));
        res.write(chunk({ content: task.result }, null));
        res.write(chunk({}, 'stop'));
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      return json(res, 200, {
        id: completionId,
        object: 'chat.completion',
        created,
        model: modelId,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: task.result },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: Math.ceil(task.result.length / 4),
          total_tokens: Math.ceil(task.result.length / 4),
        },
        ultra: { session_id: sessionId, task_id: task.id },
      });
    }

    return json(res, 404, {
      error: { message: 'not found', type: 'not_found' },
    });
  };
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', () => resolve(undefined));
  });
}

export interface HermesOpenAIServerOptions extends HermesOpenAIOptions {
  host?: string;
  port?: number;
}

export function startHermesOpenAIServer(
  opts: HermesOpenAIServerOptions
): Promise<{ server: Server; port: number; url: string }> {
  const handler = createHermesOpenAIHandler(opts);
  const server = createServer((req, res) => {
    handler(req, res).catch((err) => {
      json(res, 500, {
        error: {
          message: err instanceof Error ? err.message : String(err),
          type: 'internal_error',
        },
      });
    });
  });
  const host = opts.host ?? process.env.HERMES_OPENAI_HOST ?? '127.0.0.1';
  const port = opts.port ?? Number(process.env.HERMES_OPENAI_PORT ?? 9400);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actual = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ server, port: actual, url: `http://${host}:${actual}` });
    });
  });
}
