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

import { createObservations, registerStubHandlers } from './callback-handlers';
import {
  InboundReceiver,
  UltraCoreCallback,
  callbackSigningPayload,
} from './inbound-receiver';

const NOW = Date.parse('2026-01-01T00:00:00.000Z');

function makePublisher() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    privateKey,
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
    keyId: 'core-publisher-1',
  };
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

function cb(
  type: string,
  id: string,
  extra: Partial<Omit<UltraCoreCallback, 'sig' | 'type' | 'callback_id'>> = {}
): Omit<UltraCoreCallback, 'sig'> {
  return {
    schema: 'ultra-core.callback.v1',
    callback_id: id,
    ts: new Date(NOW).toISOString(),
    type,
    subject: { instance: 'inst-1' },
    payload: { note: 'data-only' },
    ...extra,
  };
}

describe('P4B-08 callback handler stubs', () => {
  it('routes each known type to its observation bucket', async () => {
    const pub = makePublisher();
    const rx = new InboundReceiver({
      publisherKeys: { [pub.keyId]: pub.publicKeyPem },
      now: () => NOW,
    });
    const obs = createObservations();
    registerStubHandlers(rx, obs);

    const cases: Array<[string, keyof typeof obs]> = [
      ['anchor.confirmed', 'anchorConfirmations'],
      ['credits.balance_changed', 'balanceChanges'],
      ['governance.policy_changed', 'policyChanges'],
      ['registry.item_revoked', 'registryRevocations'],
      ['approval.decided', 'approvalDecisions'],
    ];
    for (const [type, bucket] of cases) {
      const signed = signCallback(cb(type, 'cb-' + type), pub.privateKey);
      const res = await rx.receive(signed);
      expect(res.accepted).toBe(true);
      expect((obs[bucket] as unknown[]).length).toBe(1);
    }
  });

  it('routes unregistered types to the unknown bucket via wildcard', async () => {
    const pub = makePublisher();
    const rx = new InboundReceiver({
      publisherKeys: { [pub.keyId]: pub.publicKeyPem },
      now: () => NOW,
    });
    const obs = createObservations();
    registerStubHandlers(rx, obs);

    const signed = signCallback(cb('custom.new_type', 'cb-x'), pub.privateKey);
    const res = await rx.receive(signed);
    expect(res.accepted).toBe(true);
    expect(obs.unknown.length).toBe(1);
    expect(obs.unknown[0].type).toBe('custom.new_type');
  });

  it('does not dispatch payload contents as code', async () => {
    const pub = makePublisher();
    const rx = new InboundReceiver({
      publisherKeys: { [pub.keyId]: pub.publicKeyPem },
      now: () => NOW,
    });
    const obs = createObservations();
    registerStubHandlers(rx, obs);

    const evil = signCallback(
      cb('anchor.confirmed', 'cb-evil', {
        payload: { js: 'process.exit(1)', cmd: 'rm -rf /' },
      }),
      pub.privateKey
    );
    const res = await rx.receive(evil);
    expect(res.accepted).toBe(true);
    expect(obs.anchorConfirmations.length).toBe(1);
    expect(
      (obs.anchorConfirmations[0].payload as Record<string, unknown>).js
    ).toBe('process.exit(1)');
  });

  it('handler errors dead-letter without losing the callback record', async () => {
    const pub = makePublisher();
    const rx = new InboundReceiver({
      publisherKeys: { [pub.keyId]: pub.publicKeyPem },
      now: () => NOW,
    });
    rx.on('anchor.confirmed', () => {
      throw new Error('boom');
    });
    const signed = signCallback(
      cb('anchor.confirmed', 'cb-fail'),
      pub.privateKey
    );
    const res = await rx.receive(signed);
    // callback is still accepted; the handler failure is dead-lettered
    expect(res.accepted).toBe(true);
    expect(rx.deadLetterCount).toBe(1);
  });
});
