import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import type { HermesRuntime } from '@ultra-ai/hermes-runtime';

import {
  ENVIRONMENT_PRESETS,
  ENVIRONMENT_IDS,
  buildUiSpec,
} from './environments';
import { classifyIntent } from './intents';
import type {
  ApiError,
  Capabilities,
  EnvironmentId,
  EnvironmentProfile,
  IntentRequest,
  PlatformEvent,
  PlatformEventType,
} from './types';

export const CONTRACT_VERSION = '1.0.0-draft';
const EVENT_TYPES: PlatformEventType[] = [
  'environment.switched',
  'resource.pressure',
  'user.preference.changed',
  'notification.request',
];

export interface BridgeOptions {
  /** Shared-secret bearer token; when set, /v1/* (except /health) requires it. */
  token?: string;
  runtime?: HermesRuntime;
}

export interface BridgeState {
  profiles: Map<EnvironmentId, EnvironmentProfile>;
  events: { id: string; event: PlatformEvent; receivedAt: string }[];
  startedAt: number;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(data);
}

function err(res: ServerResponse, status: number, e: ApiError): void {
  json(res, status, e);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

function isEnvId(v: string): v is EnvironmentId {
  return (ENVIRONMENT_IDS as string[]).includes(v);
}

function authorized(req: IncomingMessage, token?: string): boolean {
  if (!token) return true;
  return req.headers.authorization === `Bearer ${token}`;
}

export function createGateOsBridge(opts: BridgeOptions = {}): {
  server: Server;
  state: BridgeState;
} {
  const state: BridgeState = {
    profiles: new Map(),
    events: [],
    startedAt: Date.now(),
  };
  const { token, runtime } = opts;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;
    const method = req.method ?? 'GET';

    try {
      // ---- meta ----
      if (method === 'GET' && path === '/v1/health') {
        return json(res, 200, {
          status: 'ok',
          contractVersion: CONTRACT_VERSION,
          uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
        });
      }

      if (!authorized(req, token)) {
        return err(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      if (method === 'GET' && path === '/v1/capabilities') {
        const cfg = runtime?.getConfig();
        const caps: Capabilities = {
          contractVersion: CONTRACT_VERSION,
          environments: ENVIRONMENT_IDS,
          providers: cfg?.provider ? [cfg.provider] : [],
          engines: cfg?.engine ? [cfg.engine] : [],
          skills: runtime ? runtime.skills.list().map((s) => s.name) : [],
          features: {
            environmentSwitching: true,
            adaptiveUiSpec: true,
            intents: true,
            eventsOutbox: true,
            llmIntentRouting: false,
          },
        };
        return json(res, 200, caps);
      }

      // ---- environments ----
      if (method === 'GET' && path === '/v1/environments') {
        return json(res, 200, {
          environments: ENVIRONMENT_IDS.map((id) => {
            const p = ENVIRONMENT_PRESETS[id];
            const override = state.profiles.get(id);
            return { ...p, ...(override ?? {}) };
          }),
        });
      }

      const profileMatch = path.match(
        /^\/v1\/environments\/([a-z]+)\/profile$/
      );
      if (method === 'PUT' && profileMatch) {
        const env = profileMatch[1];
        if (!isEnvId(env)) {
          return err(res, 404, {
            error: `Unknown environment: ${env}`,
            code: 'NOT_FOUND',
          });
        }
        const body = (await readBody(req)) as
          | Partial<EnvironmentProfile>
          | undefined;
        if (!body || typeof body !== 'object') {
          return err(res, 422, {
            error: 'Invalid JSON body',
            code: 'VALIDATION_ERROR',
          });
        }
        const profile: EnvironmentProfile = {
          ...body,
          env,
          updatedAt: new Date().toISOString(),
        };
        if (
          profile.budgets?.maxConcurrentTasks !== undefined &&
          (!Number.isInteger(profile.budgets.maxConcurrentTasks) ||
            profile.budgets.maxConcurrentTasks < 1)
        ) {
          return err(res, 422, {
            error: 'budgets.maxConcurrentTasks must be an integer >= 1',
            code: 'VALIDATION_ERROR',
          });
        }
        state.profiles.set(env, profile);
        return json(res, 200, profile);
      }

      const uiMatch = path.match(/^\/v1\/ui-spec\/([a-z]+)$/);
      if (method === 'GET' && uiMatch) {
        const env = uiMatch[1];
        if (!isEnvId(env)) {
          return err(res, 404, {
            error: `Unknown environment: ${env}`,
            code: 'NOT_FOUND',
          });
        }
        return json(res, 200, buildUiSpec(env));
      }

      // ---- intents ----
      if (method === 'POST' && path === '/v1/intents') {
        const body = (await readBody(req)) as IntentRequest | undefined;
        const text = body?.text;
        if (
          !body ||
          typeof text !== 'string' ||
          text.length === 0 ||
          text.length > 4000
        ) {
          return err(res, 422, {
            error: 'text is required (string, 1..4000 chars)',
            code: 'VALIDATION_ERROR',
          });
        }
        return json(res, 200, classifyIntent(body));
      }

      // ---- events ----
      if (method === 'POST' && path === '/v1/events') {
        const body = (await readBody(req)) as PlatformEvent | undefined;
        if (
          !body ||
          !EVENT_TYPES.includes(body.type) ||
          typeof body.ts !== 'string'
        ) {
          return err(res, 422, {
            error: `type must be one of ${EVENT_TYPES.join(', ')} and ts (ISO date-time) is required`,
            code: 'VALIDATION_ERROR',
            details:
              body && body.env && !isEnvId(body.env)
                ? [`unknown env: ${body.env}`]
                : undefined,
          });
        }
        const id = body.idempotencyKey ?? randomUUID();
        // Idempotent accept: same idempotencyKey returns the existing ack.
        const existing = state.events.find(
          (e) => e.event.idempotencyKey === body.idempotencyKey
        );
        if (existing) {
          return json(res, 202, { id, accepted: true });
        }
        state.events.push({
          id,
          event: body,
          receivedAt: new Date().toISOString(),
        });
        return json(res, 202, { id, accepted: true });
      }

      err(res, 404, {
        error: `No route: ${method} ${path}`,
        code: 'NOT_FOUND',
      });
    } catch (e) {
      err(res, 500, {
        error: e instanceof Error ? e.message : 'Internal error',
      });
    }
  });

  return { server, state };
}
