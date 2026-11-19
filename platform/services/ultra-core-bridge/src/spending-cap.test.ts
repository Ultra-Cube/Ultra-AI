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

import { withSpendingCap } from './spending-cap';
import { ExportBatch, ExportTarget, UltraEvent } from './types';

const ev = (id: string, agent: string, tokens: number): UltraEvent =>
  ({
    schema: 'ultra.event.v1',
    id,
    ts: new Date().toISOString(),
    type: 'usage.model_call',
    subject: { instance: 'i1', agent },
    payload: { tokens },
    prev_hash: 'sha256:' + '0'.repeat(64),
    sig: { alg: 'Ed25519', key_id: 'k', value: 's' },
  }) as UltraEvent;

const batch = (events: UltraEvent[]): ExportBatch =>
  ({ batch_id: 'b', target: 't', events }) as ExportBatch;

const okTarget = (): ExportTarget & { sent: ExportBatch[] } => {
  const t = {
    id: 'inner',
    sent: [] as ExportBatch[],
    async send(b: ExportBatch) {
      t.sent.push(b);
      return { accepted: b.events.map((e) => e.id) };
    },
  };
  return t;
};

describe('withSpendingCap (P4B-12)', () => {
  it('passes batches under the cap', async () => {
    const inner = okTarget();
    const t = withSpendingCap(inner, { maxCostPerAgent: 100 });
    const res = await t.send(batch([ev('e1', 'a', 40), ev('e2', 'a', 50)]));
    expect(res.accepted).toEqual(['e1', 'e2']);
    expect(inner.sent).toHaveLength(1);
  });

  it('blocks and does not delegate when the cap would be exceeded', async () => {
    const inner = okTarget();
    const t = withSpendingCap(inner, { maxCostPerAgent: 100 });
    await t.send(batch([ev('e1', 'a', 60)]));
    await expect(t.send(batch([ev('e2', 'a', 50)]))).rejects.toThrow(
      /spending cap/
    );
    expect(inner.sent).toHaveLength(1); // second batch never sent
  });

  it('tracks agents independently', async () => {
    const inner = okTarget();
    const t = withSpendingCap(inner, { maxCostPerAgent: 100 });
    await t.send(batch([ev('e1', 'a', 90)]));
    const res = await t.send(batch([ev('e2', 'b', 90)]));
    expect(res.accepted).toEqual(['e2']);
  });

  it('window slides: old spend expires', async () => {
    let now = 1_000_000;
    const inner = okTarget();
    const t = withSpendingCap(inner, {
      maxCostPerAgent: 100,
      windowMs: 1000,
      now: () => now,
    });
    await t.send(batch([ev('e1', 'a', 90)]));
    now += 2000; // outside window
    const res = await t.send(batch([ev('e2', 'a', 90)]));
    expect(res.accepted).toEqual(['e2']);
  });

  it('zero/negative cost events are ignored', async () => {
    const inner = okTarget();
    const t = withSpendingCap(inner, { maxCostPerAgent: 1 });
    const res = await t.send(batch([ev('e1', 'a', 0), ev('e2', 'a', -5)]));
    expect(res.accepted).toEqual(['e1', 'e2']);
  });
});
