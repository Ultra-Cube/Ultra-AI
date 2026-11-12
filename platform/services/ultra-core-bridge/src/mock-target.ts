import { ExportBatch, ExportResult, ExportTarget, UltraEvent } from './types';

export interface MockExportTargetOptions {
  /** Target id recorded in batches. */
  id?: string;
  /** When true, send() throws — simulates Ultra Core being unreachable. */
  fail?: boolean;
  /** When set, these event ids are rejected with this reason. */
  rejectIds?: Set<string>;
}

/**
 * Mock ExportTarget for contract tests and offline development.
 * Records every batch and dedupes by event id — models the idempotency
 * Ultra Core must provide once its real interface lands (gate G-4.1).
 */
export class MockExportTarget implements ExportTarget {
  readonly id: string;
  readonly batches: ExportBatch[] = [];
  private readonly seen = new Set<string>();
  private fail: boolean;
  private readonly rejectIds: Set<string>;

  constructor(options: MockExportTargetOptions = {}) {
    this.id = options.id ?? 'mock-ultra-core';
    this.fail = options.fail ?? false;
    this.rejectIds = options.rejectIds ?? new Set();
  }

  setFail(fail: boolean): void {
    this.fail = fail;
  }

  async send(batch: ExportBatch): Promise<ExportResult> {
    if (this.fail) throw new Error(`MockExportTarget(${this.id}) unreachable`);
    this.batches.push(batch);
    const accepted: string[] = [];
    const rejected: { id: string; reason: string }[] = [];
    for (const ev of batch.events as UltraEvent[]) {
      if (this.seen.has(ev.id)) continue; // idempotent: already delivered
      if (this.rejectIds.has(ev.id)) {
        rejected.push({ id: ev.id, reason: 'rejected-by-mock' });
        continue;
      }
      this.seen.add(ev.id);
      accepted.push(ev.id);
    }
    return { accepted, rejected };
  }

  /** All event ids ever accepted (deduped). */
  deliveredIds(): string[] {
    return [...this.seen];
  }

  /** All events across all batches, in arrival order. */
  deliveredEvents(): UltraEvent[] {
    const out: UltraEvent[] = [];
    const seen = new Set<string>();
    for (const b of this.batches) {
      for (const ev of b.events) {
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          out.push(ev);
        }
      }
    }
    return out;
  }
}
