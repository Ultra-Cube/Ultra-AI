/**
 * Outbox — append signed, hash-chained `ultra.event.v1` records.
 *
 * - `append(type, subject, payload)` links each event to the previous one
 *   via `prev_hash` and signs the canonical JSON with Ed25519.
 * - `verifyChain(events, publicKeys)` validates schema, monotonic ULIDs,
 *   hash links, and signatures — offline, with only public keys.
 * - `exportPending(target, cursorStore)` ships events after a per-target
 *   cursor in idempotent batches; the cursor advances only on acceptance.
 *
 * No chain features: no blocks, wallets, tokens, or consensus.
 */

import { verify as cryptoVerify } from 'node:crypto';

import { canonicalJson, eventHash, UlidGenerator } from './canonical';
import {
  CursorStore,
  EventStore,
  ExportTarget,
  GENESIS_HASH,
  OutboxEvent,
  OutboxEventSubject,
  OutboxEventType,
  PublicKeyRing,
  Signer,
  UnsignedOutboxEvent,
  VerifyResult,
} from './types';

export interface OutboxOptions {
  /** Injectable clock (defaults to system time). */
  clock?: () => Date;
}

export interface ExportOptions {
  /** Max events per `target.send` call (default 100). */
  batchSize?: number;
  /** Cursor namespace for the target (default 'default'). */
  targetId?: string;
}

export interface ExportReport {
  /** Events confirmed accepted by the target in this run. */
  exported: number;
  /** Cursor value after this run (last accepted event id). */
  cursor: string | undefined;
  /** Number of `send` calls made. */
  batches: number;
}

export class Outbox {
  private readonly ulids: UlidGenerator;
  private events: OutboxEvent[] = [];
  private ready: Promise<void>;

  constructor(
    private readonly store: EventStore,
    private readonly signer: Signer,
    options: OutboxOptions = {}
  ) {
    const clock = options.clock ?? (() => new Date());
    this.ulids = new UlidGenerator(clock);
    this.ready = Promise.resolve(this.store.all()).then((evs) => {
      this.events = [...evs];
    });
  }

  /** Append a new signed event; resolves once it is persisted. */
  async append(
    type: OutboxEventType,
    subject: OutboxEventSubject,
    payload: Record<string, unknown> = {}
  ): Promise<OutboxEvent> {
    await this.ready;
    const prev = this.events[this.events.length - 1];
    const unsigned: UnsignedOutboxEvent = {
      schema: 'ultra.event.v1',
      id: this.ulids.next(),
      ts: new Date().toISOString(),
      type,
      subject,
      payload,
      prev_hash: prev ? eventHash(prev) : GENESIS_HASH,
    };
    const event: OutboxEvent = {
      ...unsigned,
      sig: {
        alg: 'Ed25519',
        key_id: this.signer.keyId,
        value: this.signer.sign(canonicalJson(unsigned)),
      },
    };
    await this.store.append(event);
    this.events.push(event);
    return event;
  }

  async all(): Promise<OutboxEvent[]> {
    await this.ready;
    return [...this.events];
  }

  /** All events in the chain, for verification or export. */
  async verify(publicKeys: PublicKeyRing): Promise<VerifyResult> {
    return verifyChain(await this.all(), publicKeys);
  }
}

/**
 * Verify an event array end-to-end. Returns the first failure with its
 * index and reason; `{ ok: true }` for a clean chain.
 */
export function verifyChain(
  events: OutboxEvent[],
  publicKeys: PublicKeyRing
): VerifyResult {
  let expectedPrev: string = GENESIS_HASH;
  let prevId: string | null = null;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    if (
      e === null ||
      typeof e !== 'object' ||
      e.schema !== 'ultra.event.v1' ||
      typeof e.id !== 'string' ||
      typeof e.type !== 'string' ||
      typeof e.ts !== 'string' ||
      typeof e.prev_hash !== 'string' ||
      typeof e.payload !== 'object' ||
      e.payload === null ||
      typeof e.sig !== 'object' ||
      e.sig === null ||
      e.sig.alg !== 'Ed25519' ||
      typeof e.sig.key_id !== 'string' ||
      typeof e.sig.value !== 'string'
    ) {
      return { ok: false, index: i, reason: 'bad-schema' };
    }

    if (prevId !== null && e.id <= prevId) {
      return { ok: false, index: i, reason: 'non-monotonic-id' };
    }

    if (e.prev_hash !== expectedPrev) {
      return { ok: false, index: i, reason: 'bad-prev-hash' };
    }

    const key = publicKeys[e.sig.key_id];
    if (!key) {
      return { ok: false, index: i, reason: 'unknown-key' };
    }

    const { sig: _sig, ...unsigned } = e;
    let canonical: string;
    try {
      canonical = canonicalJson(unsigned);
    } catch {
      return { ok: false, index: i, reason: 'bad-schema' };
    }
    let sigOk = false;
    try {
      sigOk = cryptoVerify(
        null,
        Buffer.from(canonical, 'utf8'),
        key,
        Buffer.from(e.sig.value, 'base64url')
      );
    } catch {
      sigOk = false;
    }
    if (!sigOk) {
      return { ok: false, index: i, reason: 'bad-signature' };
    }

    expectedPrev = eventHash(unsigned as UnsignedOutboxEvent);
    prevId = e.id;
  }

  return { ok: true };
}

/**
 * Export events after the target's stored cursor, in batches. The cursor
 * advances only to `acceptedThroughId` returned by the target — a failed
 * `send` leaves the cursor untouched so the batch is retried next run.
 * Targets must be idempotent (re-sends are safe).
 */
export async function exportPending(
  outbox: Outbox,
  target: ExportTarget,
  cursorStore: CursorStore,
  options: ExportOptions = {}
): Promise<ExportReport> {
  const targetId = options.targetId ?? 'default';
  const batchSize = options.batchSize ?? 100;
  const cursor = await cursorStore.get(targetId);
  const events = await outbox.all();

  let idx = 0;
  if (cursor !== undefined) {
    const at = events.findIndex((e) => e.id === cursor);
    if (at === -1) {
      throw new Error(`export cursor ${cursor} not found in outbox`);
    }
    idx = at + 1;
  }

  let exported = 0;
  let batches = 0;
  let lastCursor: string | undefined = cursor;

  while (idx < events.length) {
    const batch = events.slice(idx, idx + batchSize);
    const res = await target.send(batch);
    batches++;

    // acceptedThroughId marks the last event the target accepted; events
    // after it stay pending. If the id does not advance past the current
    // position the target accepted nothing new — stop to avoid a loop.
    const acceptedAt = events.findIndex((e) => e.id === res.acceptedThroughId);
    if (acceptedAt !== -1 && acceptedAt < idx) {
      break;
    }
    const acceptedCount =
      acceptedAt === -1 ? batch.length : acceptedAt - idx + 1;
    await cursorStore.set(targetId, res.acceptedThroughId);
    lastCursor = res.acceptedThroughId;
    exported += acceptedCount;
    idx += acceptedCount;
  }

  return { exported, cursor: lastCursor, batches };
}
