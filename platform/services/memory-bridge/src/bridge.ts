// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
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

import { hashPayload } from './fts-store';
import type {
  BankAdapter,
  MemoryPointer,
  MemoryRecord,
  MemoryStore,
  SearchHit,
} from './types';

export interface BridgeOptions {
  store: MemoryStore;
  bank: BankAdapter;
  /** Hermes-facing store name used in generated pointers. */
  hermesStore?: string;
}

/**
 * Memory Bank ↔ Hermes bridge.
 * The Memory Bank stays the source of truth: records are stored once with a
 * pointer, and Hermes receives pointer records plus materialized payloads
 * on demand. Writes made by Hermes are pushed back to the bank.
 */
export class MemoryBridge {
  private store: import('./types').MemoryStore;
  private bank: BankAdapter;
  private hermesStore: string;

  constructor(opts: BridgeOptions) {
    this.store = opts.store;
    this.bank = opts.bank;
    this.hermesStore = opts.hermesStore ?? 'hermes';
  }

  /** Register a record in the bank; stores pointer + summary in the index. */
  async remember(input: {
    scope: MemoryRecord['scope'];
    kind: MemoryRecord['kind'];
    title: string;
    payload: unknown;
    summary?: string;
    tags?: string[];
  }): Promise<MemoryPointer> {
    const bankId = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const pointer: MemoryPointer = {
      bankId,
      store: 'memory-bank',
      hash: hashPayload(input.payload),
    };
    await this.bank.store(pointer, input.payload);
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      pointer,
      scope: input.scope,
      kind: input.kind,
      title: input.title,
      summary: input.summary ?? input.title,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
      external: true,
    };
    await this.store.put(record);
    return pointer;
  }

  /** Materialize a record for Hermes: fetch payload from the bank and cache a pointer copy. */
  async recallForHermes(query: string, limit = 5): Promise<MemoryRecord[]> {
    const hits = await this.store.search(query, { limit });
    const out: MemoryRecord[] = [];
    for (const { record } of hits) {
      if (!record.external) {
        out.push(record);
        continue;
      }
      try {
        const payload = await this.bank.fetch(record.pointer);
        const hermesPointer: MemoryPointer = {
          ...record.pointer,
          store: this.hermesStore,
        };
        const materialized: MemoryRecord = {
          ...record,
          pointer: hermesPointer,
          payload,
          external: false,
        };
        await this.store.put(materialized);
        out.push(materialized);
      } catch {
        // Bank unreachable — return the pointer-only record so Hermes can retry later.
        out.push(record);
      }
    }
    return out;
  }

  /** Hermes-side write: store payload locally under a hermes pointer and mirror to the bank. */
  async rememberFromHermes(input: {
    scope: MemoryRecord['scope'];
    kind: MemoryRecord['kind'];
    title: string;
    payload: unknown;
    tags?: string[];
  }): Promise<MemoryPointer> {
    const pointer = await this.remember({
      scope: input.scope,
      kind: input.kind,
      title: input.title,
      payload: input.payload,
      tags: input.tags,
    });
    return { ...pointer, store: this.hermesStore };
  }

  async search(
    query: string,
    opts?: Parameters<import('./types').MemoryStore['search']>[1]
  ) {
    return this.store.search(query, opts);
  }

  async list(scope?: MemoryRecord['scope']) {
    return this.store.list(scope);
  }
}

/** Optional pgvector-backed adapter contract — implemented by deployments with Postgres+pgvector. */
export interface PgvectorStore extends MemoryStore {
  /** kNN search over embedded payloads; optional in v0. */
  vectorSearch?(embedding: number[], limit: number): Promise<SearchHit[]>;
}
