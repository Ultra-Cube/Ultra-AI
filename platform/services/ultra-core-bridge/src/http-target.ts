// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { createCoreClient, UltraCoreClient } from './core-client';
import { bridgeMetrics, isUltraCoreEnabled, logEvent } from './ops';
import { ExportBatch, ExportResult, ExportTarget } from './types';

export interface HttpExportTargetOptions {
  /** ultra-core-ingest base URL, e.g. http://127.0.0.1:4400 */
  baseUrl: string;
  /** Target id recorded in batches. Default 'ultra-core'. */
  id?: string;
  timeoutMs?: number;
  /** Bearer token for ingest/key-registration routes (default env UCI_INGEST_TOKEN). */
  token?: string;
  /** Bearer token for read routes (default env UCI_ADMIN_TOKEN, else `token`). */
  adminToken?: string;
  /** Pre-built client (tests). */
  client?: UltraCoreClient;
  fetchImpl?: typeof fetch;
  /** Override kill switch (default: ULTRA_CORE_ENABLED env, enabled unless 'false'). */
  enabled?: boolean;
}

/**
 * ExportTarget that delivers batches to ultra-core-ingest over HTTP.
 *
 * Contract (ADR-0001): POST /v1/ingest/batches, Idempotency-Key = batch_id.
 * 200/207 -> ExportResult; anything else throws so the exporter retries the
 * same window on the next flush (cursor only advances over accepted ids).
 *
 * P4B-12: honours the ULTRA_CORE_ENABLED kill switch (throws when disabled so
 * the batch stays in the outbox), emits Prometheus counters via
 * bridgeMetrics, and logs only counts/ids — never event payloads or tokens.
 */
export class HttpExportTarget implements ExportTarget {
  readonly id: string;
  private readonly client: UltraCoreClient;
  private readonly enabled: boolean;

  constructor(options: HttpExportTargetOptions) {
    this.id = options.id ?? 'ultra-core';
    this.enabled = options.enabled ?? isUltraCoreEnabled();
    this.client =
      options.client ??
      createCoreClient({
        baseUrl: options.baseUrl,
        timeoutMs: options.timeoutMs,
        token: options.token,
        adminToken: options.adminToken,
        fetchImpl: options.fetchImpl,
      });
  }

  async send(batch: ExportBatch): Promise<ExportResult> {
    if (!this.enabled) {
      bridgeMetrics.inc('ultra_core_exports_total', { result: 'disabled' });
      logEvent('warn', 'ultra_core.export.disabled', {
        target: this.id,
        batch_id: batch.batch_id,
      });
      throw new Error(
        `ultra-core export disabled (ULTRA_CORE_ENABLED=false); batch ${batch.batch_id} held in outbox`
      );
    }

    const started = Date.now();
    try {
      const result = await this.client.ingestBatch(batch);
      const accepted = result.accepted?.length ?? 0;
      const rejected = result.rejected?.length ?? 0;
      bridgeMetrics.inc(
        'ultra_core_exports_total',
        { result: accepted > 0 ? 'accepted' : 'rejected' },
        1
      );
      if (accepted > 0) {
        bridgeMetrics.inc(
          'ultra_core_events_total',
          { result: 'accepted' },
          accepted
        );
      }
      if (rejected > 0) {
        bridgeMetrics.inc(
          'ultra_core_events_total',
          { result: 'rejected' },
          rejected
        );
      }
      bridgeMetrics.set('ultra_core_export_duration_ms', Date.now() - started);
      logEvent('info', 'ultra_core.export.sent', {
        target: this.id,
        batch_id: batch.batch_id,
        accepted,
        rejected,
      });
      return {
        accepted: result.accepted,
        rejected: result.rejected ?? [],
      };
    } catch (err) {
      bridgeMetrics.inc('ultra_core_exports_total', { result: 'error' });
      logEvent('error', 'ultra_core.export.failed', {
        target: this.id,
        batch_id: batch.batch_id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
