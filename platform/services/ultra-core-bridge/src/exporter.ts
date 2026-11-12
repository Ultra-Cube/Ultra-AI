import { randomBytes } from 'node:crypto';

import {
  ExportBatch,
  ExportResult,
  ExportTarget,
  UltraEvent,
  OutboxRecord,
} from './types';

export interface ExporterOptions {
  /** Records source — typically an EventOutbox. */
  records: () => readonly OutboxRecord[];
  targets: ExportTarget[];
  /** Max events per batch per target. */
  batchSize?: number;
}

export interface FlushReport {
  target: string;
  sent: number;
  accepted: number;
  rejected: number;
  error?: string;
}

/**
 * Drains pending outbox events to registered ExportTargets in batches.
 *
 * Idempotency contract: a per-target cursor tracks the last accepted event
 * index; failed targets retry the same window on the next flush. Targets must
 * dedupe by `event.id` (see MockExportTarget / contract tests).
 */
export class EventExporter {
  private readonly opts: ExporterOptions;
  private readonly cursors = new Map<string, number>();

  constructor(opts: ExporterOptions) {
    this.opts = { batchSize: 100, ...opts };
  }

  /** Flush pending events to every target. Returns a per-target report. */
  async flush(): Promise<FlushReport[]> {
    const reports: FlushReport[] = [];
    for (const target of this.opts.targets) {
      reports.push(await this.flushTarget(target));
    }
    return reports;
  }

  private async flushTarget(target: ExportTarget): Promise<FlushReport> {
    const all = this.opts.records();
    const cursor = this.cursors.get(target.id) ?? 0;
    const pending = all.slice(cursor);
    if (pending.length === 0) {
      return { target: target.id, sent: 0, accepted: 0, rejected: 0 };
    }

    const batchSize = this.opts.batchSize ?? 100;
    let sent = 0;
    let acceptedTotal = 0;
    let rejectedTotal = 0;
    let advanced = cursor;

    for (let i = 0; i < pending.length; i += batchSize) {
      const slice = pending.slice(i, i + batchSize);
      const events: UltraEvent[] = slice.map((r) => r.event);
      const batch: ExportBatch = {
        batch_id: `batch_${randomBytes(8).toString('hex')}`,
        target: target.id,
        events,
      };
      try {
        const result: ExportResult = await target.send(batch);
        sent += events.length;
        const acceptedSet = new Set(result.accepted);
        const rejected = result.rejected ?? [];
        rejectedTotal += rejected.length;
        // Advance cursor past the contiguous accepted prefix.
        let j = 0;
        while (j < slice.length && acceptedSet.has(slice[j].event.id)) j++;
        advanced = cursor + i + j;
        acceptedTotal += j;
        if (j < slice.length) break; // stop at first rejection; retry later
      } catch (err) {
        return {
          target: target.id,
          sent,
          accepted: acceptedTotal,
          rejected: rejectedTotal,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    this.cursors.set(target.id, advanced);
    return {
      target: target.id,
      sent,
      accepted: acceptedTotal,
      rejected: rejectedTotal,
    };
  }

  /** Current cursor (records index) per target — for observability/tests. */
  cursor(targetId: string): number {
    return this.cursors.get(targetId) ?? 0;
  }
}
