import { createCoreClient, UltraCoreClient } from './core-client';
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
}

/**
 * ExportTarget that delivers batches to ultra-core-ingest over HTTP.
 *
 * Contract (ADR-0001): POST /v1/ingest/batches, Idempotency-Key = batch_id.
 * 200/207 -> ExportResult; anything else throws so the exporter retries the
 * same window on the next flush (cursor only advances over accepted ids).
 */
export class HttpExportTarget implements ExportTarget {
  readonly id: string;
  private readonly client: UltraCoreClient;

  constructor(options: HttpExportTargetOptions) {
    this.id = options.id ?? 'ultra-core';
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
    const result = await this.client.ingestBatch(batch);
    return {
      accepted: result.accepted,
      rejected: result.rejected ?? [],
    };
  }
}
