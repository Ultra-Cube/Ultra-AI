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

import { MemoryBridge } from './bridge';

import { FtsMemoryStore, hashPayload, tokenize } from './index';
import type { BankAdapter, MemoryPointer, MemoryRecord } from './index';

class MapBank implements BankAdapter {
  data = new Map<string, unknown>();
  async fetch(p: MemoryPointer) {
    return this.data.get(`${p.store}:${p.bankId}`);
  }
  async store(p: MemoryPointer, payload: unknown) {
    this.data.set(`${p.store}:${p.bankId}`, payload);
  }
}

describe('memory-bridge', () => {
  it('tokenizes and hashes payloads', () => {
    expect(tokenize('The quick brown fox')).toEqual(['quick', 'brown', 'fox']);
    expect(hashPayload({ a: 1 })).toHaveLength(16);
    expect(hashPayload({ a: 1 })).toBe(hashPayload({ a: 1 }));
  });

  it('stores and searches records via FTS', async () => {
    const store = new FtsMemoryStore();
    const now = new Date().toISOString();
    const rec: MemoryRecord = {
      pointer: { bankId: 'm1', store: 'memory-bank' },
      scope: 'project',
      kind: 'decision',
      title: 'Use edge proxy for SSO',
      summary: 'All engines sit behind single-origin proxy',
      tags: ['sso', 'proxy'],
      createdAt: now,
      updatedAt: now,
      external: true,
    };
    await store.put(rec);
    const hits = await store.search('sso proxy');
    expect(hits.length).toBe(1);
    expect(hits[0].record.pointer.bankId).toBe('m1');
    expect(await store.search('nonexistent')).toHaveLength(0);
  });

  it('filters search by scope and kind', async () => {
    const store = new FtsMemoryStore();
    const now = new Date().toISOString();
    const base = {
      pointer: { bankId: 'x', store: 'memory-bank' },
      title: 'alpha',
      summary: 'alpha',
      tags: [],
      createdAt: now,
      updatedAt: now,
      external: false,
    };
    await store.put({ ...base, scope: 'project', kind: 'fact' });
    await store.put({
      ...base,
      pointer: { bankId: 'y', store: 'memory-bank' },
      scope: 'user',
      kind: 'preference',
    });
    expect((await store.search('alpha', { scope: 'user' })).length).toBe(1);
    expect((await store.search('alpha', { kind: 'fact' })).length).toBe(1);
  });

  it('bridge remembers to bank and recalls materialized payloads for Hermes', async () => {
    const bank = new MapBank();
    const bridge = new MemoryBridge({ store: new FtsMemoryStore(), bank });
    const pointer = await bridge.remember({
      scope: 'project',
      kind: 'fact',
      title: 'Deploy freeze on Fridays',
      payload: { rule: 'no deploys friday' },
      tags: ['deploy'],
    });
    expect(pointer.store).toBe('memory-bank');
    expect(bank.data.size).toBe(1);

    const recalled = await bridge.recallForHermes('deploy freeze');
    expect(recalled.length).toBe(1);
    expect(recalled[0].external).toBe(false);
    expect(recalled[0].payload).toEqual({ rule: 'no deploys friday' });
    expect(recalled[0].pointer.store).toBe('hermes');
  });

  it('returns pointer-only record when bank fetch fails', async () => {
    const bank: BankAdapter = {
      fetch: async () => {
        throw new Error('bank down');
      },
      store: async () => {},
    };
    const bridge = new MemoryBridge({ store: new FtsMemoryStore(), bank });
    await bridge.remember({
      scope: 'global',
      kind: 'fact',
      title: 'offline fact',
      payload: {},
    });
    const recalled = await bridge.recallForHermes('offline fact');
    expect(recalled[0].external).toBe(true);
    expect(recalled[0].payload).toBeUndefined();
  });

  it('hermes writes are mirrored back to the bank', async () => {
    const bank = new MapBank();
    const bridge = new MemoryBridge({ store: new FtsMemoryStore(), bank });
    const p = await bridge.rememberFromHermes({
      scope: 'agent',
      kind: 'episode',
      title: 'fixed lint errors',
      payload: { files: 3 },
    });
    expect(p.store).toBe('hermes');
    expect(bank.data.size).toBe(1);
  });

  it('store dump/load round-trips the index', async () => {
    const store = new FtsMemoryStore();
    const now = new Date().toISOString();
    await store.put({
      pointer: { bankId: 'r1', store: 'memory-bank' },
      scope: 'session',
      kind: 'artifact',
      title: 'report draft',
      summary: 'quarterly report',
      tags: [],
      createdAt: now,
      updatedAt: now,
      external: false,
    });
    const fresh = new FtsMemoryStore();
    fresh.load(store.dump());
    expect((await fresh.search('quarterly')).length).toBe(1);
  });
});
