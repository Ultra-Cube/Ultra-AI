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

import { createHash } from 'node:crypto';

import type {
  MemoryPointer,
  MemoryRecord,
  MemoryScope,
  SearchHit,
  SearchOptions,
  MemoryStore,
} from './types';

const STOP = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'is',
  'it',
  'for',
  'on',
  'with',
  'as',
  'at',
  'by',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF_]+/u)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function hashPayload(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(payload ?? null))
    .digest('hex')
    .slice(0, 16);
}

/**
 * In-memory FTS index over Memory Bank records.
 * v0 keeps the index in memory and rebuilds from records on load —
 * deterministic, dependency-free, and sufficient for desktop-scale banks.
 * A pgvector/Postgres backend can implement the same MemoryStore contract.
 */
export class FtsMemoryStore implements MemoryStore {
  private records = new Map<string, MemoryRecord>();
  private index = new Map<string, Set<string>>(); // term -> bankIds

  private key(p: MemoryPointer): string {
    return `${p.store}:${p.bankId}`;
  }

  private reindex(record: MemoryRecord): void {
    const id = this.key(record.pointer);
    const text = `${record.title} ${record.summary} ${record.tags.join(' ')}`;
    for (const term of new Set(tokenize(text))) {
      let set = this.index.get(term);
      if (!set) this.index.set(term, (set = new Set()));
      set.add(id);
    }
  }

  async put(record: MemoryRecord): Promise<void> {
    const id = this.key(record.pointer);
    this.records.set(id, record);
    this.reindex(record);
  }

  async get(pointer: MemoryPointer): Promise<MemoryRecord | undefined> {
    return this.records.get(this.key(pointer));
  }

  async delete(pointer: MemoryPointer): Promise<boolean> {
    const id = this.key(pointer);
    return this.records.delete(id);
  }

  async search(query: string, opts: SearchOptions = {}): Promise<SearchHit[]> {
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    const limit = opts.limit ?? 20;
    const hits = new Map<string, { score: number; matched: Set<string> }>();
    for (const term of terms) {
      const ids = this.index.get(term);
      if (!ids) continue;
      for (const id of ids) {
        const h = hits.get(id) ?? { score: 0, matched: new Set<string>() };
        h.score += 1;
        h.matched.add(term);
        hits.set(id, h);
      }
    }
    const results: SearchHit[] = [];
    for (const [id, h] of hits) {
      const record = this.records.get(id);
      if (!record) continue;
      if (opts.scope && record.scope !== opts.scope) continue;
      if (opts.kind && record.kind !== opts.kind) continue;
      results.push({ record, score: h.score, matchedTerms: [...h.matched] });
    }
    return results
      .sort(
        (a, b) =>
          b.score - a.score || a.record.title.localeCompare(b.record.title)
      )
      .slice(0, limit);
  }

  async list(scope?: MemoryScope): Promise<MemoryRecord[]> {
    const all = [...this.records.values()];
    return scope ? all.filter((r) => r.scope === scope) : all;
  }

  /** Export all records — used to persist the index snapshot. */
  dump(): MemoryRecord[] {
    return [...this.records.values()];
  }

  /** Rebuild the index from a previously dumped snapshot. */
  load(records: MemoryRecord[]): void {
    this.records.clear();
    this.index.clear();
    for (const r of records) {
      this.records.set(this.key(r.pointer), r);
      this.reindex(r);
    }
  }
}
