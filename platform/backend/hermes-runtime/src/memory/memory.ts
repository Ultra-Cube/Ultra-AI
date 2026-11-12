/**
 * Memory subsystem contracts.
 *
 * Three memory tiers mirroring agent-memory conventions:
 *  - short-term: per-session working memory
 *  - long-term: persistent, namespace-scoped recall
 *  - task: scoped to a single task execution
 */

export type MemoryScope = 'short-term' | 'long-term' | 'task';

export interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  namespace: string;
  key?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryQuery {
  namespace: string;
  scope?: MemoryScope;
  /** Substring match fallback until vector search lands. */
  text?: string;
  limit?: number;
}

export interface MemoryStore {
  write(
    entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MemoryEntry>;
  read(id: string): Promise<MemoryEntry | undefined>;
  query(q: MemoryQuery): Promise<MemoryEntry[]>;
  delete(id: string): Promise<boolean>;
}

/** In-memory implementation — dev/test default; Postgres/vector impls come later. */
export class InMemoryMemoryStore implements MemoryStore {
  private entries = new Map<string, MemoryEntry>();
  private seq = 0;

  async write(
    entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MemoryEntry> {
    const now = Date.now();
    const full: MemoryEntry = {
      ...entry,
      id: `mem-${++this.seq}`,
      createdAt: now,
      updatedAt: now,
    };
    this.entries.set(full.id, full);
    return full;
  }

  async read(id: string): Promise<MemoryEntry | undefined> {
    return this.entries.get(id);
  }

  async query(q: MemoryQuery): Promise<MemoryEntry[]> {
    const limit = q.limit ?? 50;
    return [...this.entries.values()]
      .filter((e) => e.namespace === q.namespace)
      .filter((e) => (q.scope ? e.scope === q.scope : true))
      .filter((e) => (q.text ? e.content.includes(q.text) : true))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }
}
