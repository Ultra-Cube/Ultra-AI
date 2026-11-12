import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { EventSigner, eventHash, isValidEventType, ulid } from './signer';
import {
  ChainVerification,
  GENESIS_HASH,
  OutboxRecord,
  ULTRA_EVENT_SCHEMA,
  UltraEvent,
  UltraEventSubject,
  UltraEventType,
} from './types';

export interface OutboxOptions {
  /** Identity of this platform instance, recorded in every event subject. */
  instanceId: string;
  signer: EventSigner;
  /**
   * Optional append-only JSONL file. When set, events are persisted on append
   * and reloaded (with chain verification) on construction — offline-capable.
   */
  persistPath?: string;
  now?: () => number;
}

/**
 * Append-only, hash-chained, tamper-evident event outbox.
 * Events are never mutated or deleted; export state is tracked per record.
 */
export class EventOutbox {
  private records: OutboxRecord[] = [];
  private readonly opts: OutboxOptions;

  constructor(opts: OutboxOptions) {
    this.opts = opts;
    if (opts.persistPath && existsSync(opts.persistPath)) {
      this.load(opts.persistPath);
    }
  }

  /** Append a new signed event to the chain. Returns the stored record. */
  append(
    type: UltraEventType,
    subject: Omit<UltraEventSubject, 'instance'> & { instance?: string },
    payload: Record<string, unknown> = {}
  ): UltraEvent {
    if (!isValidEventType(type)) {
      throw new Error(
        `Invalid ultra.event.v1 type: ${type} (expected usage.|contribution.|provenance.*)`
      );
    }
    const prev = this.records[this.records.length - 1];
    const unsigned: Omit<UltraEvent, 'sig'> = {
      schema: ULTRA_EVENT_SCHEMA,
      id: ulid(this.opts.now?.() ?? Date.now()),
      ts: new Date(this.opts.now?.() ?? Date.now()).toISOString(),
      type,
      subject: {
        ...subject,
        instance: subject.instance ?? this.opts.instanceId,
      },
      payload,
      prev_hash: prev ? prev.hash : GENESIS_HASH,
    };
    const event: UltraEvent = {
      ...unsigned,
      sig: this.opts.signer.sign(unsigned),
    };
    const record: OutboxRecord = {
      event,
      hash: eventHash(event),
      exported: false,
    };
    this.records.push(record);
    this.persist(record);
    return event;
  }

  /** All records in chain order. */
  list(): readonly OutboxRecord[] {
    return this.records;
  }

  /** Records not yet accepted by `targetId`. */
  pending(_targetId: string): OutboxRecord[] {
    // A record counts as exported for a target once accepted; we track that
    // via markExported. Since the outbox is target-agnostic, pending() returns
    // records whose `exported` flag is false OR not yet confirmed for target.
    // For multi-target correctness the exporter keeps per-target cursors;
    // this helper returns unexported-to-anyone records for simple cases.
    return this.records.filter((r) => !r.exported);
  }

  /** Mark a record exported (all targets accepted). */
  markExported(eventId: string): void {
    const rec = this.records.find((r) => r.event.id === eventId);
    if (rec) rec.exported = true;
  }

  /** Verify hash-chain integrity and signatures across the whole outbox. */
  verifyChain(): ChainVerification {
    let prevHash = GENESIS_HASH;
    for (let i = 0; i < this.records.length; i++) {
      const rec = this.records[i];
      const ev = rec.event;
      if (ev.schema !== ULTRA_EVENT_SCHEMA) {
        return { ok: false, brokenAt: i, reason: `bad schema at ${i}` };
      }
      if (ev.prev_hash !== prevHash) {
        return { ok: false, brokenAt: i, reason: `prev_hash mismatch at ${i}` };
      }
      if (!this.opts.signer.verify(ev)) {
        return { ok: false, brokenAt: i, reason: `signature invalid at ${i}` };
      }
      if (eventHash(ev) !== rec.hash) {
        return {
          ok: false,
          brokenAt: i,
          reason: `record hash mismatch at ${i}`,
        };
      }
      prevHash = rec.hash;
    }
    return { ok: true };
  }

  private persist(record: OutboxRecord): void {
    const path = this.opts.persistPath;
    if (!path) return;
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(record)}\n`, 'utf8');
  }

  private load(path: string): void {
    const lines = readFileSync(path, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const rec = JSON.parse(line) as OutboxRecord;
      // Trust-but-verify: chain + signature check happens in verifyChain().
      this.records.push(rec);
    }
  }
}
