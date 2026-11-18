/**
 * ultra-core-mock — contract test double for the Ultra-Core receiver
 * defined in contracts/ultra-core/openapi.yaml (P4B-06).
 *
 * Implements every endpoint in the draft contract with in-memory state:
 * key registry, idempotent batch ingest, per-instance anchored head,
 * Merkle-style inclusion proofs, T1 credits (approval-gated), registry
 * items, and an SSE callback stream.
 *
 * In-memory only — state resets on restart. Not a blockchain node.
 */
import { createHash, randomUUID } from 'node:crypto';
import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
} from 'node:http';

const sha256 = (s: string) =>
  `sha256:${createHash('sha256').update(s).digest('hex')}`;
const GENESIS = `sha256:${'0'.repeat(64)}`;
const TIER_ORDER = ['T0', 'T1', 'T2'] as const;
type Tier = (typeof TIER_ORDER)[number];

interface KeyEntry {
  key_id: string;
  alg: 'Ed25519';
  public_key: string;
  status: 'active' | 'revoked';
}
interface IngestedEvent {
  id: string;
  instance: string;
  hash: string;
  prev_hash: string;
}
interface Reservation {
  reservation_id: string;
  subject: string;
  amount: string;
  status: 'open' | 'settled' | 'released' | 'expired';
  expires_at: string;
  approval_ref?: string;
}
interface RegistryItem {
  id: string;
  kind: 'skill' | 'key' | 'policy' | 'agent';
  version: string;
  status: 'active' | 'revoked' | 'deprecated';
  revoked_at?: string;
  payload?: Record<string, unknown>;
}

export interface UltraCoreMockOptions {
  port?: number;
  host?: string;
  /** Tiers reported by /v1/health. T2 stays disabled while G-4.2 is open. */
  tiers?: Partial<Record<Tier, boolean>>;
}

export class UltraCoreMock {
  private readonly tiers: Record<Tier, boolean>;
  private readonly keys = new Map<string, KeyEntry>();
  private readonly idempotency = new Map<
    string,
    { status: number; body: unknown }
  >();
  private readonly events = new Map<string, IngestedEvent[]>(); // instance -> events
  private readonly balances = new Map<string, string>();
  private readonly reservations = new Map<string, Reservation>();
  private readonly registry = new Map<string, RegistryItem>();
  private readonly sseClients = new Set<ServerResponse>();
  private server: Server | null = null;

  constructor(private readonly opts: UltraCoreMockOptions = {}) {
    this.tiers = { T0: true, T1: false, T2: false, ...(opts.tiers ?? {}) };
  }

  async start(): Promise<{ port: number; url: string }> {
    this.server = createServer((req, res) => void this.route(req, res));
    const port = this.opts.port ?? 4100;
    const host = this.opts.host ?? '127.0.0.1';
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(port, host, resolve);
    });
    const address = this.server.address();
    const actual = typeof address === 'object' && address ? address.port : port;
    return { port: actual, url: `http://${host}:${actual}` };
  }

  async stop(): Promise<void> {
    for (const res of this.sseClients) res.end();
    this.sseClients.clear();
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    this.server = null;
  }

  /** Emit a signed callback envelope on the SSE stream (contract: ultra-core.callback.v1). */
  emitCallback(callback: Record<string, unknown>): void {
    const frame = `data: ${JSON.stringify(callback)}\n\n`;
    for (const res of this.sseClients) res.write(frame);
  }

  private json(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(payload);
  }

  private err(
    res: ServerResponse,
    status: number,
    error: string,
    extra?: object
  ): void {
    this.json(res, status, { error, ...extra });
  }

  private async readBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString('utf8');
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return undefined; // malformed JSON marker
    }
  }

  private async route(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://mock.local');
    const path = url.pathname;
    const method = req.method ?? 'GET';

    try {
      // /v1/events — SSE callback stream
      if (path === '/v1/events' && method === 'GET') {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        });
        res.write(': ultra-core-mock sse\n\n');
        this.sseClients.add(res);
        req.on('close', () => this.sseClients.delete(res));
        return;
      }

      if (path === '/v1/health' && method === 'GET') {
        this.json(res, 200, {
          status: 'ok',
          version: '0.1.0-mock',
          tiers: this.tiers,
        });
        return;
      }

      if (path === '/v1/keys') {
        if (method === 'GET') {
          this.json(res, 200, { keys: [...this.keys.values()] });
          return;
        }
        if (method === 'POST') {
          const body = (await this.readBody(req)) as
            | Partial<KeyEntry>
            | null
            | undefined;
          if (body === undefined) return this.err(res, 400, 'malformed-json');
          if (
            !body ||
            typeof body.key_id !== 'string' ||
            !body.key_id ||
            body.alg !== 'Ed25519' ||
            typeof body.public_key !== 'string' ||
            !body.public_key
          ) {
            return this.err(res, 400, 'invalid-key-registration', {
              code: 'schema',
            });
          }
          if (this.keys.has(body.key_id)) {
            return this.err(res, 409, 'key_id already registered', {
              code: 'duplicate',
            });
          }
          const entry: KeyEntry = {
            key_id: body.key_id,
            alg: 'Ed25519',
            public_key: body.public_key,
            status: 'active',
          };
          this.keys.set(entry.key_id, entry);
          this.json(res, 201, entry);
          return;
        }
      }

      if (path === '/v1/ingest/batches' && method === 'POST') {
        return this.ingest(req, res);
      }

      const proofMatch = path.match(/^\/v1\/proofs\/([^/]+)\/([^/]+)$/);
      if (proofMatch && method === 'GET') {
        const [, instance, eventId] = proofMatch.map(decodeURIComponent);
        const list = this.events.get(instance) ?? [];
        const idx = list.findIndex((e) => e.id === eventId);
        if (idx < 0)
          return this.err(res, 404, 'event not anchored', {
            code: 'not_found',
          });
        const root = list.length ? list[list.length - 1].hash : GENESIS;
        this.json(res, 200, {
          event_id: eventId,
          instance,
          root,
          height: idx,
          proof: list
            .slice(0, idx + 1)
            .map((e) => ({ hash: e.hash, side: 'left' })),
        });
        return;
      }

      const headMatch = path.match(/^\/v1\/instances\/([^/]+)\/head$/);
      if (headMatch && method === 'GET') {
        const instance = decodeURIComponent(headMatch[1]);
        const list = this.events.get(instance);
        if (!list || list.length === 0) {
          return this.err(res, 404, 'unknown instance', { code: 'not_found' });
        }
        this.json(res, 200, {
          instance,
          head: list[list.length - 1].hash,
          height: list.length - 1,
        });
        return;
      }

      if (path === '/v1/credits/balance' && method === 'GET') {
        const subject = url.searchParams.get('subject');
        if (!subject) return this.err(res, 400, 'subject query param required');
        if (!this.tiers.T1) {
          return this.err(res, 403, 'tier T1 not enabled', {
            code: 'tier_disabled',
          });
        }
        this.json(res, 200, {
          subject,
          balance: this.balances.get(subject) ?? '0',
          currency: 'ultra-credit',
          tier: 'T1',
        });
        return;
      }

      if (path === '/v1/credits/reservations') {
        if (method === 'GET') {
          this.json(res, 200, {
            reservations: [...this.reservations.values()],
          });
          return;
        }
        if (method === 'POST') {
          const body = (await this.readBody(req)) as
            | Partial<Reservation>
            | null
            | undefined;
          if (body === undefined) return this.err(res, 400, 'malformed-json');
          if (
            !body ||
            typeof body.subject !== 'string' ||
            typeof body.amount !== 'string' ||
            !body.subject ||
            !body.amount
          ) {
            return this.err(res, 400, 'invalid reservation', {
              code: 'schema',
            });
          }
          if (!body.approval_ref) {
            return this.err(res, 403, 'missing approval', {
              code: 'approval_required',
            });
          }
          const reservation: Reservation = {
            reservation_id: `res_${randomUUID()}`,
            subject: body.subject,
            amount: body.amount,
            status: 'open',
            expires_at:
              body.expires_at ?? new Date(Date.now() + 3_600_000).toISOString(),
            approval_ref: body.approval_ref,
          };
          this.reservations.set(reservation.reservation_id, reservation);
          this.json(res, 201, reservation);
          return;
        }
      }

      if (path === '/v1/registry/items' && method === 'GET') {
        this.json(res, 200, { items: [...this.registry.values()] });
        return;
      }

      this.err(res, 404, 'not found', { code: 'unknown_route' });
    } catch {
      this.err(res, 503, 'receiver unavailable', { retryable: true });
    }
  }

  private async ingest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const idemKey = req.headers['idempotency-key'];
    if (typeof idemKey !== 'string' || !idemKey) {
      return this.err(
        res,
        400,
        'Idempotency-Key header required and must equal batch_id'
      );
    }
    const cached = this.idempotency.get(idemKey);
    if (cached) {
      // Replay: return recorded result verbatim without re-processing.
      res.writeHead(cached.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(cached.body));
      return;
    }

    const body = (await this.readBody(req)) as
      | {
          batch_id?: string;
          target?: string;
          events?: Array<Record<string, unknown>>;
        }
      | null
      | undefined;
    if (body === undefined) return this.err(res, 400, 'malformed-json');
    if (
      !body ||
      typeof body.batch_id !== 'string' ||
      !Array.isArray(body.events)
    ) {
      return this.err(
        res,
        422,
        'schema violation: batch_id and events[] required',
        { code: 'schema' }
      );
    }
    if (idemKey !== body.batch_id) {
      return this.err(res, 400, 'Idempotency-Key must equal body.batch_id');
    }

    const accepted: string[] = [];
    const rejected: { id: string; reason: string }[] = [];
    for (const ev of body.events) {
      const id = typeof ev?.id === 'string' ? ev.id : undefined;
      const instance =
        typeof (ev?.subject as Record<string, unknown> | undefined)
          ?.instance === 'string'
          ? ((ev!.subject as Record<string, unknown>).instance as string)
          : undefined;
      if (
        !id ||
        !instance ||
        typeof ev.schema !== 'string' ||
        !ev.schema.startsWith('ultra.event.')
      ) {
        rejected.push({ id: id ?? '<missing>', reason: 'schema violation' });
        continue;
      }
      const sig = ev.sig as { key_id?: string; alg?: string } | undefined;
      const key = sig?.key_id ? this.keys.get(sig.key_id) : undefined;
      if (!key || key.status !== 'active' || sig?.alg !== 'Ed25519') {
        rejected.push({ id, reason: 'unknown or revoked signing key' });
        continue;
      }
      const list = this.events.get(instance) ?? [];
      const hash = sha256(JSON.stringify(ev));
      list.push({
        id,
        instance,
        hash,
        prev_hash: list.length ? list[list.length - 1].hash : GENESIS,
      });
      this.events.set(instance, list);
      accepted.push(id);
    }

    const status =
      rejected.length === 0 ? 200 : accepted.length === 0 ? 422 : 207;
    const instance = body.events.length
      ? ((body.events[0].subject as Record<string, unknown> | undefined)
          ?.instance as string | undefined)
      : undefined;
    const head = instance ? this.events.get(instance)?.at(-1)?.hash : undefined;
    const responseBody = {
      batch_id: body.batch_id,
      accepted,
      rejected,
      ...(instance ? { instance, head, tier: 'T0' as const } : {}),
    };
    this.idempotency.set(idemKey, { status, body: responseBody });
    this.json(res, status, responseBody);
  }
}

/** Start the mock on a port (default 4100 per contracts/ultra-core/openapi.yaml). */
export async function startUltraCoreMock(
  opts: UltraCoreMockOptions = {}
): Promise<{ mock: UltraCoreMock; port: number; url: string }> {
  const mock = new UltraCoreMock(opts);
  const { port, url } = await mock.start();
  return { mock, port, url };
}

// Standalone entry: `node dist/mock-server.js` or ts-node for dev.
if (require.main === module) {
  const port = Number(process.env.ULTRA_CORE_MOCK_PORT ?? 4100);
  startUltraCoreMock({ port, tiers: { T0: true, T1: true } }).then(
    ({ url }) => {
      // eslint-disable-next-line no-console
      console.log(
        `ultra-core-mock listening at ${url} (contract: contracts/ultra-core/openapi.yaml)`
      );
    }
  );
}
