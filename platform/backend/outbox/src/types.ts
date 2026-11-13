/**
 * WP-1 — Signed event outbox types (build prompt §WP-1, ADR-0006).
 *
 * Events are `ultra.event.v1`: JSON-only payloads, ULID ids, sha256 hash
 * chain, Ed25519 signatures. No chain/wallet/token features — this is the
 * platform's tamper-evident audit + export log.
 */

import type { KeyObject } from 'node:crypto';

export type Hash = `sha256:${string}`;

export const OUTBOX_SCHEMA = 'ultra.event.v1' as const;
export const GENESIS_HASH: Hash = `sha256:${'0'.repeat(64)}`;

export type OutboxEventType =
  | `usage.${string}`
  | `contribution.${string}`
  | `provenance.${string}`;

export interface OutboxEventSubject {
  /** Platform instance / deployment identifier. */
  instance: string;
  /** Agent or user that produced the event (opaque id). */
  agent?: string;
  [key: string]: unknown;
}

export interface OutboxEventSignature {
  alg: 'Ed25519';
  /** Key identifier — reference into the verifier's public key ring. */
  key_id: string;
  /** Base64url Ed25519 signature over canonicalJson(event without sig). */
  value: string;
}

export interface OutboxEvent {
  schema: typeof OUTBOX_SCHEMA;
  /** ULID: 48-bit ms time + 80-bit randomness, Crockford base32. */
  id: string;
  /** ISO-8601 UTC, millisecond precision. */
  ts: string;
  type: OutboxEventType;
  subject: OutboxEventSubject;
  /** JSON only; never secrets. */
  payload: Record<string, unknown>;
  /** sha256(canonicalJson(previous event without sig)); genesis for the first. */
  prev_hash: Hash;
  sig: OutboxEventSignature;
}

export type UnsignedOutboxEvent = Omit<OutboxEvent, 'sig'>;

/** Append-only event persistence. Implementations may be sync or async. */
export interface EventStore {
  append(event: OutboxEvent): void | Promise<void>;
  all(): OutboxEvent[] | Promise<OutboxEvent[]>;
}

/** Signs the canonical JSON of an unsigned event. */
export interface Signer {
  readonly keyId: string;
  /** Returns a base64url signature over `data` (utf8). */
  sign(data: string): string;
  /** Verifies a base64url signature over `data` (utf8). */
  verify(data: string, signature: string): boolean;
  /** Public key for distribution to verifiers. */
  publicKey(): KeyObject;
}

/** Per-target export cursor persistence. */
export interface CursorStore {
  get(targetId: string): string | undefined | Promise<string | undefined>;
  set(targetId: string, id: string): void | Promise<void>;
}

/** Idempotent export sink: re-sending a batch must be a no-op. */
export interface ExportTarget {
  send(batch: OutboxEvent[]): Promise<{ acceptedThroughId: string }>;
}

export type VerifyFailureReason =
  | 'bad-signature'
  | 'bad-prev-hash'
  | 'bad-schema'
  | 'unknown-key'
  | 'non-monotonic-id';

export type VerifyResult =
  | { ok: true }
  | { ok: false; index: number; reason: VerifyFailureReason };

/** Verification key ring: key_id → Ed25519 public key. */
export type PublicKeyRing = Record<string, KeyObject>;
