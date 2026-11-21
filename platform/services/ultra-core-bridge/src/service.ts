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
 * ultra-core-bridge daemon — the runnable carry-over endpoint.
 *
 * Wires the library pieces into a live producer:
 *   Ultra-AI services ──POST /v1/events──▶ EventOutbox (signed, hash-chained,
 *   JSONL-persisted) ──EventExporter/HttpExportTarget──▶ ultra-core-ingest
 *   (/v1/ingest/batches, Idempotency-Key = batch_id).
 *
 * Local API (node:http, no framework deps):
 *   GET  /health                 public
 *   GET  /metrics                Prometheus text (bridgeMetrics)
 *   GET  /v1/outbox              chain verification + counts (Bearer)
 *   POST /v1/events              append ultra.event.v1 (Bearer BRIDGE_TOKEN)
 *   POST /v1/flush               drain outbox to Ultra-Core now (Bearer)
 *
 * Env:
 *   ULTRA_INSTANCE_ID   instance id recorded in event subjects (default: hostname-pid)
 *   BRIDGE_DATA_DIR     persistence dir (default: ./data)
 *   BRIDGE_PORT         listen port (default: 4410)
 *   BRIDGE_HOST         bind host (default: 127.0.0.1 — set 0.0.0.0 only with BRIDGE_TOKEN)
 *   BRIDGE_TOKEN        Bearer token for /v1/* routes; REQUIRED for non-localhost bind
 *   ULTRA_CORE_INGEST_URL  ingest base URL (default: http://127.0.0.1:4400)
 *   UCI_INGEST_TOKEN    producer token for ingest writes (also registers our pubkey)
 *   UCI_ADMIN_TOKEN     admin/read token (falls back to UCI_INGEST_TOKEN)
 *   ULTRA_CORE_ENABLED  'false' holds all exports in the outbox (kill switch)
 *   BRIDGE_FLUSH_MS     export loop interval (default: 5000; 0 disables loop)
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes, generateKeyPairSync } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import {
  createCoreClient,
  createEventSigner,
  createObservations,
  EventExporter,
  EventOutbox,
  HttpExportTarget,
  IngestCallbackPoller,
  isValidEventType,
  bridgeMetrics,
  logEvent,
  registerStubHandlers,
} from './index';
import type { EventSigner } from './signer';
import type { UltraEventType } from './types';

// ---------------------------------------------------------------------------
// signer key persistence (Ed25519; private key stays on this host only)
// ---------------------------------------------------------------------------

interface PersistedSigner {
  privateKeyPem: string;
  keyId: string;
  publicKeyPem: string;
}

function loadOrCreateSigner(dataDir: string): { signer: EventSigner; persisted: PersistedSigner } {
  const keyPath = join(dataDir, 'signer-key.json');
  if (existsSync(keyPath)) {
    const raw = JSON.parse(readFileSync(keyPath, 'utf8')) as PersistedSigner;
    return {
      signer: createEventSigner({ privateKeyPem: raw.privateKeyPem, keyId: raw.keyId }),
      persisted: raw,
    };
  }
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
  const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  const keyId = `ucb-${randomBytes(4).toString('hex')}`;
  const persisted: PersistedSigner = { privateKeyPem, keyId, publicKeyPem };
  writeFileSync(keyPath, JSON.stringify(persisted, null, 2), { mode: 0o600 });
  return { signer: createEventSigner({ privateKeyPem, keyId }), persisted };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function send(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(data);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function bearerToken(req: IncomingMessage): string | null {
  const h = req.headers.authorization;
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

// ---------------------------------------------------------------------------
// service
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dataDir = process.env.BRIDGE_DATA_DIR ?? join(process.cwd(), 'data');
  mkdirSync(dataDir, { recursive: true });

  const instanceId =
    process.env.ULTRA_INSTANCE_ID ?? `${hostname()}-${process.pid}`;
  const port = Number(process.env.BRIDGE_PORT ?? 4410);
  const host = process.env.BRIDGE_HOST ?? '127.0.0.1';
  const bridgeToken = process.env.BRIDGE_TOKEN || undefined;
  const ingestUrl =
    process.env.ULTRA_CORE_INGEST_URL ?? 'http://127.0.0.1:4400';
  const flushMs = Number(process.env.BRIDGE_FLUSH_MS ?? 5000);

  const local = host === '127.0.0.1' || host === '::1' || host === 'localhost';
  if (!local && !bridgeToken && process.env.BRIDGE_ALLOW_INSECURE !== '1') {
    throw new Error(
      `Refusing to bind ${host} without BRIDGE_TOKEN (set BRIDGE_ALLOW_INSECURE=1 to override)`
    );
  }

  const { signer, persisted } = loadOrCreateSigner(dataDir);
  const outbox = new EventOutbox({
    instanceId,
    signer,
    persistPath: join(dataDir, 'outbox.jsonl'),
  });
  const target = new HttpExportTarget({
    baseUrl: ingestUrl,
    token: process.env.UCI_INGEST_TOKEN,
    adminToken: process.env.UCI_ADMIN_TOKEN,
  });
  const exporter = new EventExporter({
    records: () => outbox.list(),
    targets: [target],
    batchSize: 100,
  });
  const client = createCoreClient({
    baseUrl: ingestUrl,
    token: process.env.UCI_INGEST_TOKEN,
    adminToken: process.env.UCI_ADMIN_TOKEN,
  });

  // Register our producer public key with ingest (idempotent; ignores
  // 'already registered' style failures so restarts are safe).
  try {
    const keys = await client.listKeys();
    if (!keys.some((k) => k.key_id === persisted.keyId)) {
      await client.registerKey(persisted.keyId, persisted.publicKeyPem);
      logEvent('info', 'bridge.key.registered', { key_id: persisted.keyId });
    }
  } catch (err) {
    logEvent('warn', 'bridge.key.register_failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Background export loop.
  let flushing = false;
  const flush = async () => {
    if (flushing) return;
    flushing = true;
    try {
      const reports = await exporter.flush();
      for (const r of reports) {
        if (r.sent > 0 || r.error) {
          logEvent(r.error ? 'warn' : 'info', 'bridge.flush', { ...r });
        }
      }
    } finally {
      flushing = false;
    }
  };
  if (flushMs > 0) {
    const timer = setInterval(() => void flush(), flushMs);
    timer.unref();
  }
  void flush();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const path = url.pathname;

    try {
      if (req.method === 'GET' && path === '/health') {
        const chain = outbox.verifyChain();
        return send(res, 200, {
          ok: chain.ok,
          service: 'ultra-core-bridge',
          instance: instanceId,
          key_id: persisted.keyId,
          records: outbox.list().length,
          cursor: exporter.cursor(target.id),
          pending: outbox.pending(target.id).length,
        });
      }
      if (req.method === 'GET' && path === '/metrics') {
        res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4' });
        return res.end(bridgeMetrics.render());
      }

      // everything below requires the bridge token when configured
      if (bridgeToken && bearerToken(req) !== bridgeToken) {
        return send(res, 401, { error: 'unauthorized' });
      }
      if (!bridgeToken && !local) {
        return send(res, 401, { error: 'unauthorized' });
      }

      if (req.method === 'GET' && path === '/v1/outbox') {
        const chain = outbox.verifyChain();
        return send(res, 200, {
          instance: instanceId,
          count: outbox.list().length,
          chain_ok: chain.ok,
          ...(chain.ok ? {} : { chain_broken_at: chain.brokenAt, chain_reason: chain.reason }),
        });
      }

      if (req.method === 'POST' && path === '/v1/events') {
        const body = JSON.parse((await readBody(req)) || '{}') as {
          type?: string;
          subject?: Record<string, unknown>;
          payload?: Record<string, unknown>;
        };
        if (!body.type || !isValidEventType(body.type)) {
          return send(res, 400, {
            error: 'type must match ^(usage|contribution|provenance)\\..+',
          });
        }
        const { instance: _drop, ...subject } = (body.subject ?? {}) as Record<
          string,
          unknown
        >;
        const event = outbox.append(
          body.type as UltraEventType,
          subject as never,
          (body.payload ?? {}) as Record<string, unknown>
        );
        bridgeMetrics.inc('bridge_events_appended_total', { type: body.type });
        return send(res, 201, event);
      }

      if (req.method === 'POST' && path === '/v1/flush') {
        await flush();
        return send(res, 200, { flushed: true, cursor: exporter.cursor(target.id) });
      }

      return send(res, 404, { error: 'not found' });
    } catch (err) {
      logEvent('error', 'bridge.http.error', {
        path,
        error: err instanceof Error ? err.message : String(err),
      });
      return send(res, 500, { error: 'internal error' });
    }
  });

  server.listen(port, host, () => {
    logEvent('info', 'bridge.service.started', {
      host,
      port,
      instance: instanceId,
      ingest: ingestUrl,
      enabled: process.env.ULTRA_CORE_ENABLED !== 'false',
    });
    console.log(
      `ultra-core-bridge listening on http://${host}:${port} ` +
        `(instance=${instanceId}, ingest=${ingestUrl})`
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
