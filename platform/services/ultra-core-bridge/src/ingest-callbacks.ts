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

/**
 * Adapter for the ACTUAL ultra-core-ingest callback contract.
 *
 * Two callback shapes exist:
 *  - `ultra-core.callback.v1` — the planned push contract consumed by
 *    InboundReceiver (signature over canonical payload fields).
 *  - `ultra.callback.v1` — what ultra-core-ingest actually emits today on
 *    GET /v1/callbacks: hash-chained records whose Ed25519 signature covers
 *    the string `sha256:<hex>` of the canonical unsigned record.
 *
 * This module bridges the gap honestly: it polls the ingest callbacks
 * endpoint, verifies each record with the ingest signature scheme, dedupes
 * by record id, dead-letters failures, and dispatches normalized events to
 * the same handler registry style used by callback-handlers.ts. It does NOT
 * pretend the records are ultra-core.callback.v1.
 */

import {
  verify as cryptoVerify,
  createPublicKey,
  KeyObject,
} from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import type { IngestCallbackRecord, UltraCoreClient } from './core-client';
import type { CallbackHandler, UltraCoreCallback } from './inbound-receiver';
import { logEvent } from './ops';
import { canonicalize, sha256Hex } from './signer';

export interface IngestCallbackDeadLetter {
  id?: string;
  reason: string;
  raw: unknown;
  at: string;
}

export interface IngestCallbackPollerOptions {
  client: UltraCoreClient;
  /** Directory for cursor + dead-letter persistence. */
  dataDir?: string;
  /** Poll interval ms for start(); poll() can also be called manually. */
  intervalMs?: number;
  /** Override publisher key (else fetched from /v1/callbacks/public-key). */
  publisherKeyPem?: string;
  publisherKeyId?: string;
  now?: () => number;
}

/** Reconstruct the exact bytes ingest signs: "sha256:<hex>" of canonical unsigned record. */
export function ingestCallbackSigningMessage(
  rec: Omit<IngestCallbackRecord, 'sig'>
): string {
  return `sha256:${sha256Hex(canonicalize(rec))}`;
}

export function verifyIngestCallback(
  rec: IngestCallbackRecord,
  publicKeyPem: string
): boolean {
  try {
    const { sig, ...unsigned } = rec;
    if (sig.alg !== 'Ed25519') return false;
    const key: KeyObject = createPublicKey(publicKeyPem);
    return cryptoVerify(
      null,
      Buffer.from(
        ingestCallbackSigningMessage(
          unsigned as Omit<IngestCallbackRecord, 'sig'>
        ),
        'utf8'
      ),
      key,
      Buffer.from(sig.value, 'base64url')
    );
  } catch {
    return false;
  }
}

/** Normalize an ingest record into the shape handlers expect. */
export function normalizeIngestCallback(
  rec: IngestCallbackRecord
): UltraCoreCallback {
  const subject = { instance: 'ultra-core', ...rec.subject };
  return {
    schema: 'ultra-core.callback.v1',
    callback_id: rec.id,
    ts: rec.ts,
    type: rec.type,
    subject,
    payload: rec.payload,
    sig: rec.sig,
  };
}

export class IngestCallbackPoller {
  private readonly opts: IngestCallbackPollerOptions;
  private readonly listeners = new Map<string, Set<CallbackHandler>>();
  private readonly seen = new Set<string>();
  private readonly deadLetters: IngestCallbackDeadLetter[] = [];
  private cursor = 0;
  private key?: { keyId: string; pem: string; key: KeyObject };
  private timer?: NodeJS.Timeout;

  constructor(options: IngestCallbackPollerOptions) {
    this.opts = options;
    if (options.dataDir) {
      mkdirSync(options.dataDir, { recursive: true });
      const cursorFile = join(options.dataDir, 'callbacks-cursor.json');
      if (existsSync(cursorFile)) {
        try {
          this.cursor = Number(
            JSON.parse(readFileSync(cursorFile, 'utf8')).since ?? 0
          );
        } catch {
          this.cursor = 0;
        }
      }
    }
  }

  get deadLetterCount(): number {
    return this.deadLetters.length;
  }

  deadLettersList(): readonly IngestCallbackDeadLetter[] {
    return this.deadLetters;
  }

  get cursorPosition(): number {
    return this.cursor;
  }

  on(type: string, handler: CallbackHandler): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(handler);
  }

  private deadLetter(reason: string, raw: unknown, id?: string): void {
    const entry: IngestCallbackDeadLetter = {
      ...(id ? { id } : {}),
      reason,
      raw,
      at: new Date(this.opts.now?.() ?? Date.now()).toISOString(),
    };
    this.deadLetters.push(entry);
    const dir = this.opts.dataDir;
    if (dir) {
      try {
        const file = join(dir, 'callbacks-dead.jsonl');
        appendFileSync(file, JSON.stringify(entry) + '\n');
      } catch {
        // dead-letter write failure must not break polling
      }
    }
    logEvent('warn', 'bridge.callback.dead_letter', { reason, id });
  }

  private async publisherKey(): Promise<{
    keyId: string;
    pem: string;
    key: KeyObject;
  } | null> {
    if (this.key) return this.key;
    if (this.opts.publisherKeyPem) {
      this.key = {
        keyId: this.opts.publisherKeyId ?? 'override',
        pem: this.opts.publisherKeyPem,
        key: createPublicKey(this.opts.publisherKeyPem),
      };
      return this.key;
    }
    try {
      const pk = await this.opts.client.callbackPublicKey();
      this.key = {
        keyId: pk.key_id,
        pem: pk.public_key_pem,
        key: createPublicKey(pk.public_key_pem),
      };
      return this.key;
    } catch (err) {
      logEvent('warn', 'bridge.callback.key_fetch_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  private async dispatch(rec: IngestCallbackRecord): Promise<void> {
    const cb = normalizeIngestCallback(rec);
    const sets = [
      ...(this.listeners.get(cb.type) ?? []),
      ...(this.listeners.get('*') ?? []),
    ];
    for (const h of sets) {
      try {
        await h(cb);
      } catch (err) {
        logEvent('error', 'bridge.callback.handler_failed', {
          type: cb.type,
          id: cb.callback_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * Fetch callbacks since the persisted cursor, verify signatures, dedupe,
   * dispatch, and advance the cursor. Safe to call repeatedly.
   */
  async poll(): Promise<{
    fetched: number;
    accepted: number;
    rejected: number;
  }> {
    const key = await this.publisherKey();
    if (!key) return { fetched: 0, accepted: 0, rejected: 0 };

    let records: IngestCallbackRecord[];
    try {
      records = await this.opts.client.listCallbacks(this.cursor);
    } catch (err) {
      logEvent('warn', 'bridge.callback.poll_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return { fetched: 0, accepted: 0, rejected: 0 };
    }

    let accepted = 0;
    let rejected = 0;
    for (const rec of records) {
      // advance cursor per record regardless of outcome — the ingest log is
      // append-only; a permanently-bad record must not wedge the poller.
      this.cursor += 1;
      if (this.seen.has(rec.id)) continue;
      this.seen.add(rec.id);

      if (rec.sig.key_id !== key.keyId || !verifyIngestCallback(rec, key.pem)) {
        rejected += 1;
        this.deadLetter('bad signature', rec, rec.id);
        continue;
      }
      accepted += 1;
      await this.dispatch(rec);
    }

    if (records.length > 0) this.persistCursor();
    return { fetched: records.length, accepted, rejected };
  }

  private persistCursor(): void {
    const dir = this.opts.dataDir;
    if (!dir) return;
    try {
      writeFileSync(
        join(dir, 'callbacks-cursor.json'),
        JSON.stringify({
          since: this.cursor,
          updated_at: new Date().toISOString(),
        })
      );
    } catch {
      // cursor persistence failure is non-fatal; dedupe set still protects
    }
  }

  start(): void {
    const ms = this.opts.intervalMs ?? 10_000;
    if (ms <= 0 || this.timer) return;
    this.timer = setInterval(() => void this.poll(), ms);
    this.timer.unref();
    void this.poll();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.persistCursor();
  }
}
