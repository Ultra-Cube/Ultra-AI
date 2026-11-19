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

import { createPublicKey, verify, KeyObject } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { canonicalize } from './signer';

/**
 * P4B-07 InboundReceiver — verifies and dispatches `ultra-core.callback.v1`
 * envelopes published by Ultra-Core (contract:
 * contracts/ultra-core/schemas/ultra-core-callback.v1.schema.json).
 *
 * Guarantees:
 *  - structural validation against the callback schema (hand-rolled; no ajv dep)
 *  - Ed25519 signature verification against registered publisher keys
 *  - clock-skew window on `ts`
 *  - dedupe on `callback_id` (primary) and `nonce` (secondary)
 *  - T2-tier callbacks rejected while G-4.2 is closed
 *  - payloads are data only — nothing here executes payload contents
 *  - rejected/failed callbacks go to a dead-letter store (memory + optional file)
 */

export interface UltraCoreCallback {
  schema: 'ultra-core.callback.v1';
  callback_id: string;
  ts: string;
  nonce?: string;
  type: string;
  subject: { instance: string; [k: string]: unknown };
  payload: Record<string, unknown>;
  sig: { alg: 'Ed25519'; key_id: string; value: string };
  tier?: 'T0' | 'T1' | 'T2';
}

export interface DeadLetter {
  callback_id?: string;
  reason: string;
  raw: unknown;
  at: string;
}

export type CallbackHandler = (cb: UltraCoreCallback) => void | Promise<void>;

export interface InboundReceiverOptions {
  /** Publisher public keys (PEM, SPKI) keyed by `sig.key_id`. */
  publisherKeys: Record<string, string>;
  /** Max |now - ts| accepted. Default 5 min. */
  maxClockSkewMs?: number;
  /** Optional file path — dead letters are appended as JSONL. */
  deadLetterPath?: string;
  /** Injectable clock for tests. */
  now?: () => number;
}

export type ReceiveResult =
  | { accepted: true; duplicate?: boolean }
  | { accepted: false; reason: string };

const CALLBACK_TYPE = /^[a-z0-9_.-]+$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Structural validation mirroring ultra-core-callback.v1.schema.json. */
export function validateCallbackShape(raw: unknown): string | null {
  if (!isPlainObject(raw)) return 'not an object';
  if (raw.schema !== 'ultra-core.callback.v1') return 'bad schema';
  if (typeof raw.callback_id !== 'string' || raw.callback_id.length === 0)
    return 'bad callback_id';
  if (typeof raw.ts !== 'string' || Number.isNaN(Date.parse(raw.ts)))
    return 'bad ts';
  if (raw.nonce !== undefined && typeof raw.nonce !== 'string')
    return 'bad nonce';
  if (typeof raw.type !== 'string' || !CALLBACK_TYPE.test(raw.type))
    return 'bad type';
  if (
    !isPlainObject(raw.subject) ||
    typeof raw.subject.instance !== 'string' ||
    raw.subject.instance.length === 0
  )
    return 'bad subject';
  if (!isPlainObject(raw.payload)) return 'bad payload';
  if (!isPlainObject(raw.sig)) return 'bad sig';
  const sig = raw.sig as Record<string, unknown>;
  if (sig.alg !== 'Ed25519') return 'bad sig.alg';
  if (typeof sig.key_id !== 'string' || sig.key_id.length === 0)
    return 'bad sig.key_id';
  if (typeof sig.value !== 'string' || sig.value.length === 0)
    return 'bad sig.value';
  if (
    raw.tier !== undefined &&
    raw.tier !== 'T0' &&
    raw.tier !== 'T1' &&
    raw.tier !== 'T2'
  )
    return 'bad tier';
  return null;
}

/** Canonical bytes covered by the publisher signature (everything except `sig`). */
export function callbackSigningPayload(
  cb: Omit<UltraCoreCallback, 'sig'>
): string {
  return canonicalize({
    schema: cb.schema,
    callback_id: cb.callback_id,
    ts: cb.ts,
    ...(cb.nonce !== undefined ? { nonce: cb.nonce } : {}),
    type: cb.type,
    subject: cb.subject,
    payload: cb.payload,
    ...(cb.tier !== undefined ? { tier: cb.tier } : {}),
  });
}

export class InboundReceiver {
  private readonly keys = new Map<string, KeyObject>();
  private readonly maxSkew: number;
  private readonly deadLetterPath?: string;
  private readonly now: () => number;
  private readonly seen = new Set<string>();
  private readonly listeners = new Map<string, Set<CallbackHandler>>();
  private readonly deadLetters: DeadLetter[] = [];

  constructor(options: InboundReceiverOptions) {
    for (const [keyId, pem] of Object.entries(options.publisherKeys)) {
      this.keys.set(keyId, createPublicKey(pem));
    }
    this.maxSkew = options.maxClockSkewMs ?? 5 * 60 * 1000;
    this.deadLetterPath = options.deadLetterPath;
    this.now = options.now ?? Date.now;
  }

  get deadLetterCount(): number {
    return this.deadLetters.length;
  }

  deadLettersList(): readonly DeadLetter[] {
    return this.deadLetters;
  }

  /** Register a handler for a callback type, or '*' for all. */
  on(type: string, handler: CallbackHandler): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(handler);
  }

  private deadLetter(reason: string, raw: unknown, callbackId?: string): void {
    const entry: DeadLetter = {
      ...(callbackId ? { callback_id: callbackId } : {}),
      reason,
      raw,
      at: new Date(this.now()).toISOString(),
    };
    this.deadLetters.push(entry);
    if (this.deadLetterPath) {
      try {
        mkdirSync(dirname(this.deadLetterPath), { recursive: true });
        appendFileSync(this.deadLetterPath, `${JSON.stringify(entry)}\n`);
      } catch {
        // dead-letter file write failure must not break ingestion
      }
    }
  }

  /**
   * Validate + verify + dispatch one callback envelope.
   * Returns `{accepted:false, reason}` for anything rejected — the caller
   * decides HTTP status; nothing is silently dropped.
   */
  async receive(raw: unknown): Promise<ReceiveResult> {
    const shapeError = validateCallbackShape(raw);
    if (shapeError) {
      this.deadLetter(`shape: ${shapeError}`, raw);
      return { accepted: false, reason: shapeError };
    }
    const cb = raw as UltraCoreCallback;

    if (cb.tier === 'T2') {
      this.deadLetter('tier T2 blocked by G-4.2', raw, cb.callback_id);
      return { accepted: false, reason: 'T2 blocked by G-4.2' };
    }

    const ts = Date.parse(cb.ts);
    if (Math.abs(this.now() - ts) > this.maxSkew) {
      this.deadLetter('clock skew', raw, cb.callback_id);
      return { accepted: false, reason: 'clock skew' };
    }

    const dedupeKeys = [cb.callback_id, ...(cb.nonce ? [cb.nonce] : [])];
    if (dedupeKeys.some((k) => this.seen.has(k))) {
      return { accepted: true, duplicate: true };
    }

    const key = this.keys.get(cb.sig.key_id);
    if (!key) {
      this.deadLetter('unknown publisher key', raw, cb.callback_id);
      return { accepted: false, reason: 'unknown publisher key' };
    }
    const { sig, ...rest } = cb;
    let ok = false;
    try {
      const bytes = Buffer.from(sig.value, 'base64url');
      ok = verify(
        null,
        Buffer.from(
          callbackSigningPayload(rest as Omit<UltraCoreCallback, 'sig'>),
          'utf8'
        ),
        key,
        bytes
      );
    } catch {
      ok = false;
    }
    if (!ok) {
      this.deadLetter('bad signature', raw, cb.callback_id);
      return { accepted: false, reason: 'bad signature' };
    }

    for (const k of dedupeKeys) this.seen.add(k);

    const handlers = [
      ...(this.listeners.get(cb.type) ?? []),
      ...(this.listeners.get('*') ?? []),
    ];
    for (const handler of handlers) {
      try {
        await handler(cb);
      } catch (err) {
        this.deadLetter(
          `handler error: ${err instanceof Error ? err.message : String(err)}`,
          raw,
          cb.callback_id
        );
      }
    }
    return { accepted: true };
  }
}
