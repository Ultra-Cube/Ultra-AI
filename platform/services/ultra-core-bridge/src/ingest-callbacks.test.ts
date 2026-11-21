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

import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  IngestCallbackPoller,
  ingestCallbackSigningMessage,
  verifyIngestCallback,
} from './ingest-callbacks';
import type { IngestCallbackRecord, UltraCoreClient } from './core-client';
import type { UltraCoreCallback } from './inbound-receiver';

/** Build a properly-signed ingest record using a fresh keypair. */
function signedRecord(
  kp: { privateKey: import('node:crypto').KeyObject; publicKeyPem: string; keyId: string },
  over: Record<string, unknown> = {}
): { rec: IngestCallbackRecord; publicKeyPem: string } {
  const unsigned = {
    schema: 'ultra.callback.v1' as const,
    id: `cb_${Math.random().toString(36).slice(2, 10)}`,
    ts: new Date().toISOString(),
    type: 'credits.balance_changed',
    subject: { subject: 'uai:user:1' },
    payload: { kind: 'grant' },
    prev_hash: `sha256:${'0'.repeat(64)}`,
    ...over,
  };
  const msg = ingestCallbackSigningMessage(unsigned);
  const value = cryptoSign(null, Buffer.from(msg, 'utf8'), kp.privateKey).toString('base64url');
  return {
    rec: { ...unsigned, sig: { alg: 'Ed25519', key_id: kp.keyId, value } } as IngestCallbackRecord,
    publicKeyPem: kp.publicKeyPem,
  };
}

function fakeClient(records: IngestCallbackRecord[], pubPem: string) {
  return {
    listCallbacks: jest.fn(async (since = 0) => records.slice(since)),
    callbackPublicKey: jest.fn(async () => ({ key_id: 'uc-callback-test', public_key_pem: pubPem })),
  } as unknown as UltraCoreClient;
}

describe('ingest callback adapter (ultra.callback.v1)', () => {
  const kp = (() => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    return {
      privateKey,
      publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
      keyId: 'uc-callback-test',
    };
  })();

  it('verifies a correctly signed record and rejects tampering', () => {
    const { rec } = signedRecord(kp);
    expect(verifyIngestCallback(rec, kp.publicKeyPem)).toBe(true);
    const tampered = { ...rec, payload: { kind: 'evil' } };
    expect(verifyIngestCallback(tampered, kp.publicKeyPem)).toBe(false);
  });

  it('poll fetches, verifies, dedupes and dispatches to handlers', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ucb-cb-'));
    const { rec } = signedRecord(kp);
    const client = fakeClient([rec], kp.publicKeyPem);
    const poller = new IngestCallbackPoller({ client, dataDir: dir, intervalMs: 0 });
    const seen: UltraCoreCallback[] = [];
    poller.on('credits.balance_changed', (cb) => { seen.push(cb); });

    const r1 = await poller.poll();
    expect(r1).toEqual({ fetched: 1, accepted: 1, rejected: 0 });
    expect(seen).toHaveLength(1);
    expect(seen[0].callback_id).toBe(rec.id);
    expect(seen[0].type).toBe('credits.balance_changed');

    // second poll: cursor advanced → nothing refetched
    const r2 = await poller.poll();
    expect(r2.fetched).toBe(0);
    expect(seen).toHaveLength(1);
    rmSync(dir, { recursive: true, force: true });
  });

  it('dead-letters bad signatures and keeps polling', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ucb-cb-'));
    const { rec } = signedRecord(kp);
    const forged = { ...rec, sig: { ...rec.sig, value: Buffer.alloc(64).toString('base64url') } };
    const client = fakeClient([forged], kp.publicKeyPem);
    const poller = new IngestCallbackPoller({ client, dataDir: dir, intervalMs: 0 });

    const r = await poller.poll();
    expect(r).toEqual({ fetched: 1, accepted: 0, rejected: 1 });
    expect(poller.deadLetterCount).toBe(1);
    rmSync(dir, { recursive: true, force: true });
  });
});
