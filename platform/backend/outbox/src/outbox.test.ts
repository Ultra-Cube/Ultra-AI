import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { canonicalJson, UlidGenerator } from './canonical';
import { exportPending, Outbox, verifyChain } from './outbox';
import { Ed25519Signer } from './signer';
import {
  InMemoryCursorStore,
  InMemoryEventStore,
  JsonlEventStore,
} from './store';
import { OutboxEvent, PublicKeyRing } from './types';

function setup(clock?: () => Date) {
  const signer = Ed25519Signer.generate('inst-1');
  const ring: PublicKeyRing = { 'inst-1': signer.publicKey() };
  const store = new InMemoryEventStore();
  const outbox = new Outbox(store, signer, clock ? { clock } : {});
  return { signer, ring, store, outbox };
}

describe('canonicalJson', () => {
  it('sorts keys recursively and omits whitespace', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { y: 1, x: 2 }] } })).toBe(
      '{"a":{"c":[3,{"x":2,"y":1}],"d":2},"b":1}'
    );
  });

  it('is stable across key insertion order', () => {
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });

  it('rejects undefined and non-finite numbers', () => {
    expect(() => canonicalJson({ a: undefined })).toThrow(TypeError);
    expect(() => canonicalJson({ a: NaN })).toThrow(TypeError);
    expect(() => canonicalJson({ a: Infinity })).toThrow(TypeError);
  });
});

describe('UlidGenerator', () => {
  it('produces monotonic ids within the same millisecond', () => {
    const fixed = () => new Date('2026-01-01T00:00:00.000Z');
    const gen = new UlidGenerator(fixed);
    const ids = Array.from({ length: 5 }, () => gen.next());
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
    for (const id of ids) expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});

describe('Outbox append + verify', () => {
  it('appends signed hash-chained events that verify cleanly', async () => {
    const { ring, outbox } = setup();
    const e1 = await outbox.append(
      'usage.request',
      { instance: 'inst-1', agent: 'a1' },
      { model: 'mock', tokens: 10 }
    );
    const e2 = await outbox.append(
      'contribution.score',
      { instance: 'inst-1' },
      { delta: 0.5 }
    );

    expect(e1.schema).toBe('ultra.event.v1');
    expect(e1.prev_hash).toMatch(/^sha256:0{64}$/);
    expect(e2.prev_hash).not.toBe(e1.prev_hash);
    expect(e2.sig.alg).toBe('Ed25519');
    expect(e2.sig.key_id).toBe('inst-1');

    const result = await outbox.verify(ring);
    expect(result).toEqual({ ok: true });
  });

  it('detects tampering with the payload', async () => {
    const { ring, outbox } = setup();
    await outbox.append('usage.request', { instance: 'i' }, { a: 1 });
    const events = await outbox.all();
    const tampered = events.map((e) => ({
      ...e,
      payload: { ...e.payload, a: 999 },
    }));
    const result = verifyChain(tampered, ring);
    expect(result).toMatchObject({
      ok: false,
      index: 0,
      reason: 'bad-signature',
    });
  });

  it('detects a broken prev_hash link', async () => {
    const { ring, outbox } = setup();
    await outbox.append('usage.request', { instance: 'i' }, {});
    await outbox.append('usage.request', { instance: 'i' }, {});
    const events = await outbox.all();
    const broken = events.map((e, i) =>
      i === 1 ? { ...e, prev_hash: 'sha256:deadbeef' as never } : e
    );
    const result = verifyChain(broken, ring);
    expect(result).toMatchObject({
      ok: false,
      index: 1,
      reason: 'bad-prev-hash',
    });
  });

  it('detects unknown signing key', async () => {
    const { outbox } = setup();
    await outbox.append('usage.request', { instance: 'i' }, {});
    const events = await outbox.all();
    const result = verifyChain(events, {});
    expect(result).toMatchObject({
      ok: false,
      index: 0,
      reason: 'unknown-key',
    });
  });

  it('verifies across restarts from a persisted JSONL store', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'outbox-'));
    try {
      const path = join(dir, 'events.jsonl');
      const signer = Ed25519Signer.generate('inst-1');
      const ring: PublicKeyRing = { 'inst-1': signer.publicKey() };

      const store1 = new JsonlEventStore(path);
      store1.open();
      const ob1 = new Outbox(store1, signer);
      await ob1.append('usage.request', { instance: 'i' }, { n: 1 });
      await ob1.append('usage.request', { instance: 'i' }, { n: 2 });
      store1.close();

      // Simulate crash: reopen and continue the chain.
      const store2 = new JsonlEventStore(path);
      store2.open();
      const ob2 = new Outbox(store2, signer);
      await ob2.append('usage.request', { instance: 'i' }, { n: 3 });
      store2.close();

      const events = (await new Outbox(
        (() => {
          const s = new JsonlEventStore(path);
          s.open();
          return s;
        })(),
        signer
      ).all()) as OutboxEvent[];

      const lines = readFileSync(path, 'utf8').trim().split('\n');
      expect(lines).toHaveLength(3);
      const result = verifyChain(events, ring);
      expect(result).toEqual({ ok: true });
      expect(events[2].prev_hash).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('recovers from a truncated trailing line (crash mid-write)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'outbox-'));
    try {
      const path = join(dir, 'events.jsonl');
      const signer = Ed25519Signer.generate('inst-1');
      const store = new JsonlEventStore(path);
      store.open();
      const ob = new Outbox(store, signer);
      await ob.append('usage.request', { instance: 'i' }, {});
      store.close();

      // Corrupt: append a partial line as if the process died mid-write.
      writeFileSync(
        path,
        readFileSync(path, 'utf8') + '{"schema":"ultra.ev',
        'utf8'
      );

      const reopened = new JsonlEventStore(path);
      reopened.open();
      expect(reopened.all()).toHaveLength(1);
      reopened.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('exportPending', () => {
  function makeTarget(acceptThrough?: (batch: OutboxEvent[]) => string) {
    const sent: OutboxEvent[][] = [];
    const target = {
      sent,
      async send(batch: OutboxEvent[]) {
        sent.push(batch);
        const last = batch[batch.length - 1];
        return {
          acceptedThroughId: acceptThrough ? acceptThrough(batch) : last.id,
        };
      },
    };
    return target;
  }

  it('exports all pending events and advances the cursor', async () => {
    const { outbox } = setup();
    for (let i = 0; i < 5; i++) {
      await outbox.append('usage.request', { instance: 'i' }, { i });
    }
    const target = makeTarget();
    const cursors = new InMemoryCursorStore();

    const report = await exportPending(outbox, target, cursors, {
      batchSize: 2,
    });
    expect(report.exported).toBe(5);
    expect(report.batches).toBe(3);
    expect(target.sent.map((b) => b.length)).toEqual([2, 2, 1]);

    const cursor = await cursors.get('default');
    const events = await outbox.all();
    expect(cursor).toBe(events[events.length - 1].id);

    // Second run exports nothing.
    const report2 = await exportPending(outbox, target, cursors);
    expect(report2.exported).toBe(0);
    expect(report2.batches).toBe(0);
  });

  it('keeps the cursor untouched when send fails', async () => {
    const { outbox } = setup();
    await outbox.append('usage.request', { instance: 'i' }, {});
    await outbox.append('usage.request', { instance: 'i' }, {});

    const cursors = new InMemoryCursorStore();
    let calls = 0;
    const failing = {
      async send(batch: OutboxEvent[]) {
        calls++;
        if (calls === 1) throw new Error('network down');
        const last = batch[batch.length - 1];
        return { acceptedThroughId: last.id };
      },
    };

    await expect(exportPending(outbox, failing, cursors)).rejects.toThrow(
      'network down'
    );
    expect(await cursors.get('default')).toBeUndefined();

    const report = await exportPending(outbox, failing, cursors);
    expect(report.exported).toBe(2);
    expect(await cursors.get('default')).toBeDefined();
  });

  it('supports partial acceptance via acceptedThroughId', async () => {
    const { outbox } = setup();
    const events: OutboxEvent[] = [];
    for (let i = 0; i < 3; i++) {
      events.push(
        await outbox.append('usage.request', { instance: 'i' }, { i })
      );
    }
    const target = makeTarget(() => events[1].id); // accept only through event 2
    const cursors = new InMemoryCursorStore();

    const report = await exportPending(outbox, target, cursors);
    expect(report.exported).toBe(2);
    expect(await cursors.get('default')).toBe(events[1].id);
  });
});
