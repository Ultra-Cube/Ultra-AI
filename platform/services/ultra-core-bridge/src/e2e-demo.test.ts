// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { generateKeyPairSync, sign } from 'node:crypto';

import { createCoreClient } from './core-client';
import { EventExporter } from './exporter';
import { HttpExportTarget } from './http-target';
import {
  callbackSigningPayload,
  InboundReceiver,
  UltraCoreCallback,
} from './inbound-receiver';
import { startUltraCoreMock, UltraCoreMock } from './mock-server';
import { EventOutbox } from './outbox';
import { createEventSigner } from './signer';

/**
 * P4B-13 E2E demo against ultra-core-mock (local only — no live Ultra-Core):
 *
 *   usage.model_call -> outbox -> exporter -> HttpExportTarget -> ingest
 *   -> anchored head/proof -> signed anchor.confirmed callback over SSE
 *   -> InboundReceiver -> handler.
 */

const INSTANCE = 'inst-e2e-demo';

function makePublisher() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    privateKey,
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
    keyId: 'core-publisher-e2e',
  };
}

function signCallback(
  cb: Omit<UltraCoreCallback, 'sig'>,
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  keyId: string
): UltraCoreCallback {
  const value = sign(
    null,
    Buffer.from(callbackSigningPayload(cb), 'utf8'),
    privateKey
  ).toString('base64url');
  return { ...cb, sig: { alg: 'Ed25519', key_id: keyId, value } };
}

/** Read one SSE data frame from a fetch Response body. */
async function readSseData(res: Response): Promise<unknown> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) throw new Error('sse stream ended before data frame');
    buf += dec.decode(value, { stream: true });
    const idx = buf.indexOf('data: ');
    if (idx >= 0) {
      const lineEnd = buf.indexOf('\n', idx);
      const raw = buf.slice(idx + 6, lineEnd >= 0 ? lineEnd : undefined);
      await reader.cancel();
      return JSON.parse(raw);
    }
  }
}

describe('P4B-13 E2E demo: usage.model_call -> ingest -> anchor -> proof', () => {
  let mock: UltraCoreMock;
  let baseUrl: string;

  beforeAll(async () => {
    const started = await startUltraCoreMock({
      port: 0,
      tiers: { T0: true, T1: true },
    });
    mock = started.mock;
    baseUrl = started.url;
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('runs the full contract flow against the mock', async () => {
    // 1. Producer key registration (contract: POST /v1/keys).
    const signer = createEventSigner({ keyId: 'producer-e2e' });
    const keysRes = await fetch(`${baseUrl}/v1/keys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key_id: signer.keyId,
        alg: 'Ed25519',
        public_key: Buffer.from(signer.publicKeyPem, 'utf8').toString('base64'),
      }),
    });
    expect(keysRes.status).toBe(201);

    // 2. usage.model_call -> signed outbox event.
    const outbox = new EventOutbox({ instanceId: INSTANCE, signer });
    const event = outbox.append(
      'usage.model_call',
      { agent: 'demo-agent' },
      {
        model: 'mock-model',
        tokens: 128,
      }
    );
    // A second event so the Merkle proof has at least one sibling.
    outbox.append(
      'usage.model_call',
      { agent: 'demo-agent' },
      {
        model: 'mock-model',
        tokens: 64,
      }
    );
    expect(outbox.verifyChain().ok).toBe(true);

    // 3. Export via HttpExportTarget -> POST /v1/ingest/batches.
    const client = createCoreClient({ baseUrl, token: 'demo-ingest' });
    const target = new HttpExportTarget({
      baseUrl,
      token: 'demo-ingest',
      client,
    });
    const exporter = new EventExporter({
      records: () => outbox.list(),
      targets: [target],
    });
    const reports = await exporter.flush();
    expect(reports).toEqual([
      { target: 'ultra-core', sent: 2, accepted: 2, rejected: 0 },
    ]);

    // 4. Anchored head + inclusion proof (mock anchors on ingest).
    const admin = createCoreClient({ baseUrl, adminToken: 'demo-admin' });
    const head = await admin.instanceHead(INSTANCE);
    expect(head.height).toBe(1);
    const proof = await admin.getProof(INSTANCE, event.id);
    expect(proof.event_id).toBe(event.id);
    expect(proof.height).toBe(0);
    expect(proof.root).toBe(head.head);
    expect(proof.proof.length).toBeGreaterThan(0);
    expect(await admin.verifyProof(INSTANCE, event.id)).toBe(true);

    // 5. anchor.confirmed callback: signed by publisher, delivered over SSE.
    const pub = makePublisher();
    const sseRes = await fetch(`${baseUrl}/v1/events`, {
      headers: { accept: 'text/event-stream' },
    });
    expect(sseRes.status).toBe(200);
    const cb = signCallback(
      {
        schema: 'ultra-core.callback.v1',
        callback_id: 'cb-e2e-1',
        ts: new Date().toISOString(),
        type: 'anchor.confirmed',
        subject: { instance: INSTANCE, batch_id: 'batch-e2e' },
        payload: { merkle_root: head.head, height: head.height },
        tier: 'T0',
      },
      pub.privateKey,
      pub.keyId
    );
    mock.emitCallback(cb as unknown as Record<string, unknown>);
    const received = (await readSseData(sseRes)) as UltraCoreCallback;
    expect(received.callback_id).toBe('cb-e2e-1');

    // 6. InboundReceiver verifies signature + dispatches handler.
    const rx = new InboundReceiver({
      publisherKeys: { [pub.keyId]: pub.publicKeyPem },
    });
    const confirmed: UltraCoreCallback[] = [];
    rx.on('anchor.confirmed', (c) => {
      confirmed.push(c);
    });
    const result = await rx.receive(received);
    expect(result).toEqual({ accepted: true });
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0].payload.merkle_root).toBe(head.head);

    // 7. Cursor advanced: a second flush sends nothing (idempotent export).
    const again = await exporter.flush();
    expect(again[0].sent).toBe(0);
  });

  it('T1 credits: balance, approval-gated reservation, read-only guard', async () => {
    // Read-only client: mutations refused client-side before any HTTP call.
    const ro = createCoreClient({
      baseUrl,
      adminToken: 'demo-admin',
      readOnly: true,
    });
    await expect(
      ro.createCreditReservation({
        subject: 'agent:demo',
        amount: '10',
        approval_ref: 'appr-1',
      })
    ).rejects.toThrow(/read-only/i);

    // Writable client: balance read + reservation requires approval_ref.
    const rw = createCoreClient({ baseUrl, adminToken: 'demo-admin' });
    const bal = await rw.getCreditBalance('agent:demo');
    expect(bal.subject).toBe('agent:demo');

    await expect(
      rw.createCreditReservation({
        subject: 'agent:demo',
        amount: '10',
        approval_ref: '',
      })
    ).rejects.toThrow(/approval_ref/);

    const res = await rw.createCreditReservation({
      subject: 'agent:demo',
      amount: '10',
      approval_ref: 'appr-e2e-1',
    });
    expect(res.status).toBe('open');
    expect(res.approval_ref).toBe('appr-e2e-1');

    const list = await rw.listCreditReservations();
    expect(list.some((r) => r.reservation_id === res.reservation_id)).toBe(
      true
    );
  });
});
