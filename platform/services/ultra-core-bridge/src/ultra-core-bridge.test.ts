import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { EventExporter } from './exporter';
import { MockExportTarget } from './mock-target';
import { EventOutbox } from './outbox';

import {
  createEventSigner,
  eventHash,
  GENESIS_HASH,
  ULTRA_EVENT_SCHEMA,
} from './index';

describe('ultra-core-bridge', () => {
  const signer = createEventSigner({ keyId: 'test-key-1' });
  const makeOutbox = (persistPath?: string) =>
    new EventOutbox({ instanceId: 'inst-test', signer, persistPath });

  describe('EventOutbox', () => {
    it('appends signed ultra.event.v1 events with ULID ids', () => {
      const box = makeOutbox();
      const ev = box.append(
        'usage.model_call',
        { agent: 'a1' },
        { model: 'mock', tokens: 10 }
      );
      expect(ev.schema).toBe(ULTRA_EVENT_SCHEMA);
      expect(ev.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(ev.type).toBe('usage.model_call');
      expect(ev.subject.instance).toBe('inst-test');
      expect(ev.subject.agent).toBe('a1');
      expect(ev.prev_hash).toBe(GENESIS_HASH);
      expect(ev.sig.alg).toBe('Ed25519');
      expect(signer.verify(ev)).toBe(true);
    });

    it('chains prev_hash to the previous event hash', () => {
      const box = makeOutbox();
      const e1 = box.append('usage.token_count', {}, { n: 1 });
      const e2 = box.append('contribution.task_completed', {}, { task: 't1' });
      const rec1 = box.list()[0];
      expect(e2.prev_hash).toBe(rec1.hash);
      expect(rec1.hash).toBe(eventHash(e1));
      expect(box.verifyChain().ok).toBe(true);
    });

    it('rejects invalid event types', () => {
      const box = makeOutbox();
      expect(() => box.append('bogus.event' as never, {}, {})).toThrow(
        /Invalid ultra\.event\.v1 type/
      );
      expect(() => box.append('usage.' as never, {}, {})).toThrow();
      expect(() => box.append('system.boot' as never, {}, {})).toThrow();
    });

    it('detects tampering via verifyChain', () => {
      const box = makeOutbox();
      box.append('usage.model_call', {}, { v: 1 });
      box.append('usage.token_count', {}, { v: 2 });
      // Tamper with stored record payload.
      const recs = box.list() as unknown as {
        event: { payload: Record<string, unknown> };
      }[];
      recs[0].event.payload.v = 999;
      const result = box.verifyChain();
      expect(result.ok).toBe(false);
      expect(result.brokenAt).toBe(0);
    });

    it('detects broken prev_hash links', () => {
      const box = makeOutbox();
      box.append('usage.model_call', {}, {});
      box.append('usage.token_count', {}, {});
      const recs = box.list() as unknown as { event: { prev_hash: string } }[];
      recs[1].event.prev_hash = GENESIS_HASH; // break link
      expect(box.verifyChain().ok).toBe(false);
      expect(box.verifyChain().brokenAt).toBe(1);
    });

    it('persists to JSONL and reloads with intact chain', () => {
      const dir = mkdtempSync(join(tmpdir(), 'ucb-'));
      const path = join(dir, 'outbox.jsonl');
      try {
        const box1 = makeOutbox(path);
        box1.append('usage.model_call', {}, { a: 1 });
        box1.append('provenance.memory_write', { agent: 'a' }, { key: 'k' });

        const box2 = makeOutbox(path);
        expect(box2.list()).toHaveLength(2);
        expect(box2.verifyChain().ok).toBe(true);
        // Signatures still verify after reload (same signer instance).
        expect(signer.verify(box2.list()[1].event)).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('EventExporter + MockExportTarget', () => {
    it('exports pending events in batches and advances cursor', async () => {
      const box = makeOutbox();
      for (let i = 0; i < 5; i++) box.append('usage.token_count', {}, { i });
      const target = new MockExportTarget({ id: 't1' });
      const exporter = new EventExporter({
        records: () => box.list(),
        targets: [target],
        batchSize: 2,
      });

      const reports = await exporter.flush();
      expect(reports[0].sent).toBe(5);
      expect(reports[0].accepted).toBe(5);
      expect(target.deliveredIds()).toHaveLength(5);
      // batchSize=2 → 3 batches (2+2+1)
      expect(target.batches).toHaveLength(3);
      expect(target.batches[0].events).toHaveLength(2);

      // Second flush: nothing pending.
      const again = await exporter.flush();
      expect(again[0].sent).toBe(0);
    });

    it('is idempotent — re-sent events are deduped by the target', async () => {
      const box = makeOutbox();
      box.append('usage.model_call', {}, {});
      box.append('usage.token_count', {}, {});
      const target = new MockExportTarget({ id: 't1' });
      const exporter = new EventExporter({
        records: () => box.list(),
        targets: [target],
      });

      await exporter.flush();
      // Simulate redelivery: reset cursor by creating a new exporter over same records.
      const exporter2 = new EventExporter({
        records: () => box.list(),
        targets: [target],
      });
      await exporter2.flush();
      expect(target.deliveredIds()).toHaveLength(2); // no duplicates
    });

    it('retries failed sends without losing events', async () => {
      const box = makeOutbox();
      box.append('usage.model_call', {}, { n: 1 });
      box.append('usage.model_call', {}, { n: 2 });
      const target = new MockExportTarget({ id: 't1' });
      target.setFail(true);
      const exporter = new EventExporter({
        records: () => box.list(),
        targets: [target],
      });

      const failed = await exporter.flush();
      expect(failed[0].error).toMatch(/unreachable/);
      expect(target.deliveredIds()).toHaveLength(0);

      target.setFail(false);
      const ok = await exporter.flush();
      expect(ok[0].accepted).toBe(2);
      expect(target.deliveredIds()).toHaveLength(2);
    });

    it('stops at first rejected event and retries later', async () => {
      const box = makeOutbox();
      const e1 = box.append('usage.model_call', {}, { n: 1 });
      box.append('usage.model_call', {}, { n: 2 });
      box.append('usage.model_call', {}, { n: 3 });
      const target = new MockExportTarget({
        id: 't1',
        rejectIds: new Set([e1.id]),
      });
      // Reject first event → cursor should not advance past it.
      const exporter = new EventExporter({
        records: () => box.list(),
        targets: [target],
      });
      const report = await exporter.flush();
      expect(report[0].accepted).toBe(0);
      expect(exporter.cursor('t1')).toBe(0);
    });
  });
});
