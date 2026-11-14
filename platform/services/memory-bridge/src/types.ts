export type MemoryScope = 'project' | 'user' | 'global' | 'session' | 'agent';

export type MemoryKind =
  | 'fact'
  | 'decision'
  | 'preference'
  | 'artifact'
  | 'episode';

export interface MemoryPointer {
  /** Stable id in the Memory Bank (source of truth). */
  bankId: string;
  /** Which store holds the payload (e.g. "memory-bank", "hermes"). */
  store: string;
  /** Optional content hash for integrity. */
  hash?: string;
}

export interface MemoryRecord {
  pointer: MemoryPointer;
  scope: MemoryScope;
  kind: MemoryKind;
  /** Short title used for FTS and UI. */
  title: string;
  /** Body may live in the bank; bridge stores only a summary/pointer. */
  summary: string;
  /** Full payload — present only when materialized for Hermes. */
  payload?: unknown;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** True when payload lives only in the bank and must be fetched. */
  external: boolean;
}

export interface SearchHit {
  record: MemoryRecord;
  score: number;
  matchedTerms: string[];
}

export interface MemoryStore {
  put(record: MemoryRecord): Promise<void>;
  get(pointer: MemoryPointer): Promise<MemoryRecord | undefined>;
  delete(pointer: MemoryPointer): Promise<boolean>;
  search(query: string, opts?: SearchOptions): Promise<SearchHit[]>;
  list(scope?: MemoryScope): Promise<MemoryRecord[]>;
}

export interface SearchOptions {
  scope?: MemoryScope;
  kind?: MemoryKind;
  limit?: number;
}

export interface BankAdapter {
  /** Fetch the full payload for an external record. */
  fetch(pointer: MemoryPointer): Promise<unknown>;
  /** Persist a payload back to the bank. */
  store(pointer: MemoryPointer, payload: unknown): Promise<void>;
}
