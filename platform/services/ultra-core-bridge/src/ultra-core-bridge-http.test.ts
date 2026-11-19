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
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { createServer, Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { UltraCoreApiError, UltraCoreClient } from './core-client';
import { HttpExportTarget } from './http-target';
import { ExportBatch } from './types';

describe('HttpExportTarget / UltraCoreClient (WS-C, ADR-0001)', () => {
  let server: Server;
  let baseUrl: string;
  let lastRequest: {
    path?: string;
    headers: Record<string, unknown>;
    body: string;
  } | null;
  let responder: (body: string) => { status: number; json: unknown };

  const batch: ExportBatch = {
    batch_id: 'batch_abc123',
    target: 'ultra-core',
    events: [],
  };

  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        lastRequest = { path: req.url, headers: req.headers, body };
        const { status, json } = responder(body);
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(json));
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
  });

  beforeEach(() => {
    lastRequest = null;
    responder = () => ({
      status: 200,
      json: { batch_id: 'batch_abc123', accepted: [], rejected: [] },
    });
  });

  it('posts batch to /v1/ingest/batches with Idempotency-Key = batch_id', async () => {
    const target = new HttpExportTarget({ baseUrl });
    await target.send(batch);
    expect(lastRequest?.path).toBe('/v1/ingest/batches');
    expect(lastRequest?.headers['idempotency-key']).toBe('batch_abc123');
    expect(JSON.parse(lastRequest!.body)).toMatchObject({
      batch_id: 'batch_abc123',
    });
  });

  it('returns accepted/rejected on 200', async () => {
    responder = () => ({
      status: 200,
      json: { batch_id: 'b', accepted: ['e1', 'e2'], rejected: [] },
    });
    const target = new HttpExportTarget({ baseUrl });
    const result = await target.send(batch);
    expect(result.accepted).toEqual(['e1', 'e2']);
    expect(result.rejected).toEqual([]);
  });

  it('treats 207 partial acceptance as a result, not an error', async () => {
    responder = () => ({
      status: 207,
      json: {
        batch_id: 'b',
        accepted: ['e1'],
        rejected: [{ id: 'e2', reason: 'bad sig' }],
      },
    });
    const target = new HttpExportTarget({ baseUrl });
    const result = await target.send(batch);
    expect(result.accepted).toEqual(['e1']);
    expect(result.rejected).toEqual([{ id: 'e2', reason: 'bad sig' }]);
  });

  it('throws UltraCoreApiError on 4xx/5xx so exporter retries later', async () => {
    responder = () => ({ status: 503, json: { error: 'transient' } });
    const target = new HttpExportTarget({ baseUrl });
    await expect(target.send(batch)).rejects.toBeInstanceOf(UltraCoreApiError);
  });

  it('client exposes health/listKeys/registerKey/instanceHead', async () => {
    responder = (body) => {
      if (body === '')
        return { status: 200, json: { keys: [{ key_id: 'k1' }] } };
      return { status: 200, json: { ok: true } };
    };
    const client = new UltraCoreClient({ baseUrl });
    await expect(client.listKeys()).resolves.toEqual([{ key_id: 'k1' }]);
  });

  it('sends ingest token on producer routes and admin token on reads (WS-F)', async () => {
    responder = () => ({ status: 200, json: { ok: true, keys: [] } });
    const client = new UltraCoreClient({
      baseUrl,
      token: 'ing-tok',
      adminToken: 'adm-tok',
    });

    await client.ingestBatch({
      batch_id: 'b1',
      target: 't',
      events: [],
    } as never);
    expect(lastRequest?.headers['authorization']).toBe('Bearer ing-tok');

    await client.listKeys();
    expect(lastRequest?.headers['authorization']).toBe('Bearer adm-tok');
  });
});
