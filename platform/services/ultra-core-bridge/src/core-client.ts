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

import { verifyMerkleProof } from './merkle';
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
  /**
   * Read-only mode (P4B-09): when true, value-moving calls
   * (POST /v1/credits/*) are refused client-side even if the server
   * would accept them. Defaults to env ULTRA_CORE_READ_ONLY === "true".
   */
  readOnly?: boolean;
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

export interface Proof {
  event_id: string;
  instance?: string;
  leaf?: string;
  root: string;
  height?: number;
  proof: Array<{ hash: string; side?: string }>;
}

export interface CreditBalance {
  subject: string;
  balance: string;
  currency?: string;
  tier?: string;
}

export interface CreditReservation {
  reservation_id: string;
  subject: string;
  amount: string;
  status?: 'open' | 'settled' | 'released' | 'expired';
  expires_at?: string;
  approval_ref?: string;
}

export interface RegistryItem {
  id: string;
  kind: 'skill' | 'key' | 'policy' | 'agent';
  version: string;
  status?: 'active' | 'revoked' | 'deprecated';
  revoked_at?: string;
  payload?: Record<string, unknown>;
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
  private readonly readOnly: boolean;

  constructor(options: CoreClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.token = options.token ?? process.env.UCI_INGEST_TOKEN;
    this.adminToken =
      options.adminToken ?? process.env.UCI_ADMIN_TOKEN ?? this.token;
    this.readOnly =
      options.readOnly ?? process.env.ULTRA_CORE_READ_ONLY === 'true';
  }

  private authFor(path: string, method: string): Record<string, string> {
    const isProducer = method !== 'GET' && PRODUCER_PATHS.has(path);
    const t = isProducer ? this.token : this.adminToken;
    return t ? { authorization: `Bearer ${t}` } : {};
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const method = init?.method ?? 'GET';
    if (this.readOnly && method !== 'GET' && path.startsWith('/v1/credits/')) {
      throw new UltraCoreApiError(
        0,
        null,
        'Ultra-Core client is read-only (ULTRA_CORE_READ_ONLY); credits mutations refused'
      );
    }
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

  async instanceHead(
    instance: string
  ): Promise<{ instance: string; head: string; height?: number }> {
    return (await this.request(
      `/v1/instances/${encodeURIComponent(instance)}/head`
    )) as { instance: string; head: string; height?: number };
  }

  /** T0: Merkle inclusion proof for an anchored event. 404 throws UltraCoreApiError. */
  async getProof(instance: string, eventId: string): Promise<Proof> {
    const path =
      '/v1/proofs/' +
      encodeURIComponent(instance) +
      '/' +
      encodeURIComponent(eventId);
    return (await this.request(path)) as Proof;
  }

  /**
   * T0: fetch an inclusion proof and verify it client-side against the
   * returned root. Returns false on verification failure (never throws
   * for a bad proof - a 404 still throws UltraCoreApiError).
   */
  async verifyProof(instance: string, eventId: string): Promise<boolean> {
    const proof = await this.getProof(instance, eventId);
    if (!proof.leaf) return false;
    return verifyMerkleProof(
      proof.leaf,
      proof.proof.map((i) => ({
        hash: i.hash,
        side: (i.side === 'left' ? 'left' : 'right') as 'left' | 'right',
      })),
      proof.root
    );
  }

  /** T1 read: off-chain credit balance for a subject. */
  async getCreditBalance(subject: string): Promise<CreditBalance> {
    return (await this.request(
      '/v1/credits/balance?subject=' + encodeURIComponent(subject)
    )) as CreditBalance;
  }

  /**
   * T1 write: reserve credits. approval_ref is REQUIRED - value-moving
   * calls must trace to an approval record. Refused in readOnly mode.
   */
  async createCreditReservation(input: {
    subject: string;
    amount: string;
    approval_ref: string;
    expires_at?: string;
  }): Promise<CreditReservation> {
    if (!input.approval_ref) {
      throw new UltraCoreApiError(
        0,
        null,
        'createCreditReservation requires approval_ref'
      );
    }
    return (await this.request('/v1/credits/reservations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })) as CreditReservation;
  }

  /** T1 read: list open credit reservations. */
  async listCreditReservations(): Promise<CreditReservation[]> {
    const body = (await this.request('/v1/credits/reservations')) as {
      reservations?: CreditReservation[];
    };
    return body.reservations ?? [];
  }

  /** List registry items (skills/keys/policies/agents) published by Ultra-Core. */
  async listRegistryItems(): Promise<RegistryItem[]> {
    const body = (await this.request('/v1/registry/items')) as {
      items?: RegistryItem[];
    };
    return body.items ?? [];
  }
}

export function createCoreClient(options: CoreClientOptions): UltraCoreClient {
  return new UltraCoreClient(options);
}
