import { ExportBatch } from './types';

/**
 * Typed client for the Ultra-Core ingest receiver (ultra-core-ingest).
 * Contract: ADR-0001 — POST /v1/ingest/batches with Idempotency-Key = batch_id.
 * 200 = all accepted, 207 = partial (see accepted/rejected), other = throw.
 */

export interface CoreClientOptions {
  /** Base URL of ultra-core-ingest, e.g. http://127.0.0.1:4400 */
  baseUrl: string;
  timeoutMs?: number;
  /**
   * Bearer token for producer routes (POST /v1/ingest/batches, POST /v1/keys).
   * Defaults to env UCI_INGEST_TOKEN.
   */
  token?: string;
  /**
   * Bearer token for read/admin routes (GET /v1/keys, instance heads, etc.).
   * Defaults to env UCI_ADMIN_TOKEN, falling back to `token`.
   */
  adminToken?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export interface IngestRejection {
  id: string;
  reason: string;
}

export interface IngestResponse {
  batch_id?: string;
  accepted: string[];
  rejected?: IngestRejection[];
}

export interface RegisteredKey {
  key_id: string;
}

export class UltraCoreApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `Ultra-Core API error ${status}`);
    this.name = 'UltraCoreApiError';
  }
}

const PRODUCER_PATHS = new Set(['/v1/ingest/batches', '/v1/keys']);

export class UltraCoreClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly token?: string;
  private readonly adminToken?: string;

  constructor(options: CoreClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.token = options.token ?? process.env.UCI_INGEST_TOKEN;
    this.adminToken = options.adminToken ?? process.env.UCI_ADMIN_TOKEN ?? this.token;
  }

  private authFor(path: string, method: string): Record<string, string> {
    const isProducer = method !== 'GET' && PRODUCER_PATHS.has(path);
    const t = isProducer ? this.token : this.adminToken;
    return t ? { authorization: `Bearer ${t}` } : {};
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const method = init?.method ?? 'GET';
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.authFor(path, method), ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* keep raw text */
    }
    if (!res.ok) {
      throw new UltraCoreApiError(res.status, body);
    }
    return body;
  }

  async health(): Promise<{ ok: boolean; service?: string; ts?: string }> {
    return (await this.request('/v1/health')) as { ok: boolean };
  }

  async listKeys(): Promise<RegisteredKey[]> {
    const body = (await this.request('/v1/keys')) as { keys?: RegisteredKey[] };
    return body.keys ?? [];
  }

  async registerKey(keyId: string, publicKeyPem: string): Promise<void> {
    await this.request('/v1/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key_id: keyId, public_key_pem: publicKeyPem }),
    });
  }

  /**
   * Deliver a batch. Idempotency-Key = batch.batch_id — retries of the same
   * batch replay the stored result verbatim on the receiver.
   * Throws UltraCoreApiError on non-2xx (safe to retry later).
   */
  async ingestBatch(batch: ExportBatch): Promise<IngestResponse> {
    const body = (await this.request('/v1/ingest/batches', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': batch.batch_id,
      },
      body: JSON.stringify(batch),
    })) as IngestResponse;
    return {
      batch_id: body.batch_id,
      accepted: body.accepted ?? [],
      rejected: body.rejected ?? [],
    };
  }

  async instanceHead(instance: string): Promise<{ instance: string; head: string }> {
    return (await this.request(
      `/v1/instances/${encodeURIComponent(instance)}/head`
    )) as { instance: string; head: string };
  }
}

export function createCoreClient(options: CoreClientOptions): UltraCoreClient {
  return new UltraCoreClient(options);
}
