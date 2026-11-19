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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { generateKeyPairSync, sign } from 'node:crypto';

import {
  InboundReceiver,
  UltraCoreCallback,
  callbackSigningPayload,
  validateCallbackShape,
} from './inbound-receiver';
import { canonicalize } from './signer';

/**
 * P4B-07 contract tests: InboundReceiver must enforce the
 * ultra-core-callback.v1 contract — shape, Ed25519 signature,
 * clock-skew window, callback_id/nonce dedupe, T2 block (G-4.2),
 * and dead-letter capture — without ever executing payload contents.
 */

const NOW = Date.parse('2026-01-01T00:00:00.000Z');

function makePublisher() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey
    .export({ format: 'pem', type: 'spki' })
    .toString();
  const keyId = 'core-publisher-1';
  return { privateKey, publicKeyPem, keyId };
}

function signCallback(
  cb: Omit<UltraCoreCallback, 'sig'>,
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey']
): UltraCoreCallback {
  const value = sign(
    null,
    Buffer.from(callbackSigningPayload(cb), 'utf8'),
    privateKey
  ).toString('base64url');
  return {
    ...cb,
    sig: { alg: 'Ed25519', key_id: 'core-publisher-1', value },
  } as UltraCoreCallback;
}

function baseCallback(
  overrides: Partial<Omit<UltraCoreCallback, 'sig'>> = {}
): Omit<UltraCoreCallback, 'sig'> {
  return {
    schema: 'ultra-core.callback.v1',
    callback_id: `cb-${Math.random().toString(36).slice(2)}`,
    ts: new Date(NOW).toISOString(),
    type: 'anchor.confirmed',
    subject: { instance: 'inst-1', batch_id: 'batch-1' },
    payload: { merkle_root: 'sha256:abc' },
    ...overrides,
  };
}

function makeReceiver(pub: ReturnType<typeof makePublisher>) {
  return new InboundReceiver({
    publisherKeys: { [pub.keyId]: pub.publicKeyPem },
    now: () => NOW,
  });
}

describe('InboundReceiver (P4B-07)', () => {
  it('accepts a valid signed callback and dispatches to type handler', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    const seen: UltraCoreCallback[] = [];
    rx.on('anchor.confirmed', (cb) => {
      seen.push(cb);
    });
    const cb = signCallback(baseCallback(), pub.privateKey);
    const res = await rx.receive(cb);
    expect(res).toEqual({ accepted: true });
    expect(seen).toHaveLength(1);
    expect(seen[0].callback_id).toBe(cb.callback_id);
    expect(rx.deadLetterCount).toBe(0);
  });

  it('rejects malformed envelopes and writes dead letters', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    expect(validateCallbackShape(null)).toBe('not an object');
    expect(validateCallbackShape({ schema: 'wrong' })).toBe('bad schema');
    const res = await rx.receive({ schema: 'ultra-core.callback.v1' });
    expect(res.accepted).toBe(false);
    expect(rx.deadLetterCount).toBe(1);
    expect(rx.deadLettersList()[0].reason).toContain('shape');
  });

  it('rejects bad signatures', async () => {
    const pub = makePublisher();
    const other = makePublisher();
    const rx = makeReceiver(pub);
    const cb = signCallback(baseCallback(), other.privateKey);
    const res = await rx.receive(cb);
    expect(res).toEqual({ accepted: false, reason: 'bad signature' });
    expect(rx.deadLetterCount).toBe(1);
  });

  it('rejects unknown publisher key_id', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    const cb = signCallback(baseCallback(), pub.privateKey);
    cb.sig.key_id = 'unregistered';
    const res = await rx.receive(cb);
    expect(res).toEqual({ accepted: false, reason: 'unknown publisher key' });
  });

  it('rejects timestamps outside the clock-skew window', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    const stale = signCallback(
      baseCallback({ ts: new Date(NOW - 10 * 60 * 1000).toISOString() }),
      pub.privateKey
    );
    const res = await rx.receive(stale);
    expect(res).toEqual({ accepted: false, reason: 'clock skew' });
  });

  it('dedupes on callback_id and nonce', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    let calls = 0;
    rx.on('credits.balance_changed', () => {
      calls += 1;
    });
    const cb = signCallback(
      baseCallback({
        type: 'credits.balance_changed',
        nonce: 'nonce-1',
        payload: { balance: 42 },
      }),
      pub.privateKey
    );
    expect((await rx.receive(cb)).accepted).toBe(true);
    const dup = await rx.receive(cb);
    expect(dup).toEqual({ accepted: true, duplicate: true });
    expect(calls).toBe(1);
  });

  it('blocks T2-tier callbacks while G-4.2 is closed', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    const cb = signCallback(
      baseCallback({ tier: 'T2', type: 'credits.settle' }),
      pub.privateKey
    );
    const res = await rx.receive(cb);
    expect(res).toEqual({ accepted: false, reason: 'T2 blocked by G-4.2' });
  });

  it('dead-letters handler errors without dropping the callback', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    rx.on('governance.policy_changed', () => {
      throw new Error('boom');
    });
    const cb = signCallback(
      baseCallback({ type: 'governance.policy_changed' }),
      pub.privateKey
    );
    const res = await rx.receive(cb);
    expect(res.accepted).toBe(true);
    expect(rx.deadLetterCount).toBe(1);
    expect(rx.deadLettersList()[0].reason).toContain('handler error');
  });

  it('does not execute payload contents (data-only contract)', async () => {
    const pub = makePublisher();
    const rx = makeReceiver(pub);
    const cb = signCallback(
      baseCallback({
        type: 'ultra-core.custom',
        payload: { instruction: 'rm -rf /', exec: '$(touch /tmp/pwned)' },
      }),
      pub.privateKey
    );
    const res = await rx.receive(cb);
    expect(res.accepted).toBe(true);
    // payload passed through as inert data to handlers only
  });

  it('canonicalize is deterministic for signature stability', () => {
    const a = canonicalize({ b: 1, a: { d: 2, c: 3 } });
    const b = canonicalize({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
  });
});
