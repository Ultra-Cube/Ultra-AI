import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { HttpExportTarget } from './http-target';
import { startUltraCoreMock, UltraCoreMock } from './mock-server';
import { ExportBatch, UltraEvent } from './types';

/**
 * P4B-06 contract tests: ultra-core-mock must satisfy
 * contracts/ultra-core/openapi.yaml so the real Ultra-Core receiver can
 * be swapped in behind the same contract once G-4.1 is approved.
 */

const CONTRACT_DIR = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'contracts',
  'ultra-core'
);
const OPENAPI_PATH = join(CONTRACT_DIR, 'openapi.yaml');
const SCHEMA_DIR = join(CONTRACT_DIR, 'schemas');

const loadSchema = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(SCHEMA_DIR, name), 'utf8'));

const makeEvent = (over: Partial<UltraEvent> = {}): UltraEvent => ({
  schema: 'ultra.event.v1',
  id: `ev_${Math.random().toString(36).slice(2, 10)}`,
  ts: new Date().toISOString(),
  type: 'usage.model_call',
  subject: { instance: 'inst-test' },
  payload: { model: 'test-model', tokens: 10 },
  prev_hash: `sha256:${'0'.repeat(64)}`,
  sig: { alg: 'Ed25519', key_id: 'key-producer-1', value: 'c2ln' },
  ...over,
});

describe('ultra-core-mock contract (contracts/ultra-core/openapi.yaml)', () => {
  let mock: UltraCoreMock;
  let baseUrl: string;

  beforeAll(async () => {
    const started = await startUltraCoreMock({
      port: 0,
      tiers: { T0: true, T1: true },
    });
    mock = started.mock;
    baseUrl = started.url;
    // Register the producer key used by makeEvent.
    await fetch(`${baseUrl}/v1/keys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key_id: 'key-producer-1',
        alg: 'Ed25519',
        public_key: 'dGVzdC1wdWJrZXk',
      }),
    });
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('openapi.yaml exists and declares every implemented path', () => {
    const yaml = readFileSync(OPENAPI_PATH, 'utf8');
    for (const p of [
      '/v1/health',
      '/v1/keys',
      '/v1/ingest/batches',
      '/v1/proofs/{instance}/{event_id}',
      '/v1/instances/{instance}/head',
      '/v1/credits/balance',
      '/v1/credits/reservations',
      '/v1/registry/items',
      '/v1/events',
    ]) {
      expect(yaml).toContain(`  ${p}:`);
    }
    // All schema files referenced by the contract exist.
    for (const s of [
      'export-batch.schema.json',
      'ingest-response.schema.json',
      'ultra-event.v1.schema.json',
      'ultra-core-callback.v1.schema.json',
    ]) {
      expect(() => loadSchema(s)).not.toThrow();
    }
  });

  it('GET /v1/health returns Health schema shape', async () => {
    const res = await fetch(`${baseUrl}/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(typeof body.version).toBe('string');
    expect(body.tiers).toMatchObject({ T0: true, T1: true, T2: false });
  });

  it('POST /v1/keys registers a key; duplicate returns 409; GET lists it', async () => {
    const key = { key_id: 'key-extra', alg: 'Ed25519', public_key: 'cHVi' };
    const res = await fetch(`${baseUrl}/v1/keys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key),
    });
    expect(res.status).toBe(201);
    const entry = (await res.json()) as Record<string, unknown>;
    expect(entry).toMatchObject({ ...key, status: 'active' });

    const dup = await fetch(`${baseUrl}/v1/keys`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key),
    });
    expect(dup.status).toBe(409);

    const list = (await (await fetch(`${baseUrl}/v1/keys`)).json()) as {
      keys: Array<{
        key_id: string;
        alg: string;
        public_key: string;
        status: string;
      }>;
    };
    expect(list.keys.map((k) => k.key_id)).toEqual(
      expect.arrayContaining(['key-producer-1', 'key-extra'])
    );
    for (const k of list.keys) {
      expect(k.alg).toBe('Ed25519');
      expect(['active', 'revoked']).toContain(k.status);
    }
  });

  it('POST /v1/ingest/batches accepts a valid signed batch (200) and matches ingest-response schema', async () => {
    const batch: ExportBatch = {
      batch_id: 'batch_contract_1',
      target: 'ultra-core',
      events: [
        makeEvent({ id: 'ev_contract_a' }),
        makeEvent({ id: 'ev_contract_b' }),
      ],
    };
    const res = await fetch(`${baseUrl}/v1/ingest/batches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': batch.batch_id,
      },
      body: JSON.stringify(batch),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.batch_id).toBe('batch_contract_1');
    expect(body.accepted).toEqual(['ev_contract_a', 'ev_contract_b']);
    expect(Array.isArray(body.rejected)).toBe(true);
    // ingest-response schema required field
    expect(body).toHaveProperty('accepted');
    expect(body.tier).toBe('T0');
    expect(body.head).toMatch(/^sha256:[0-9a-f]{64}$/);
    // export-batch schema shape echoed in request contract
    const schema = loadSchema('export-batch.schema.json');
    expect(schema.required as string[]).toEqual(
      expect.arrayContaining(['batch_id', 'target', 'events'])
    );
  });

  it('Idempotency-Key replay returns the recorded result without re-processing', async () => {
    const batch: ExportBatch = {
      batch_id: 'batch_replay',
      target: 'ultra-core',
      events: [makeEvent({ id: 'ev_replay_1' })],
    };
    const send = () =>
      fetch(`${baseUrl}/v1/ingest/batches`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': batch.batch_id,
        },
        body: JSON.stringify(batch),
      });
    const first = await send();
    const second = await send();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());
  });

  it('rejects Idempotency-Key mismatch with 400', async () => {
    const res = await fetch(`${baseUrl}/v1/ingest/batches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'other',
      },
      body: JSON.stringify({ batch_id: 'b1', target: 't', events: [] }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });

  it('rejects events signed by an unknown key (207/422 with rejected items)', async () => {
    const batch: ExportBatch = {
      batch_id: 'batch_badkey',
      target: 'ultra-core',
      events: [
        makeEvent({
          id: 'ev_badkey',
          sig: { alg: 'Ed25519', key_id: 'nope', value: 'eA' },
        }),
      ],
    };
    const res = await fetch(`${baseUrl}/v1/ingest/batches`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': batch.batch_id,
      },
      body: JSON.stringify(batch),
    });
    // all rejected -> 422
    expect([207, 422]).toContain(res.status);
    const body = (await res.json()) as {
      rejected: Array<{ id: string; reason: string }>;
    };
    expect(body.rejected[0]).toMatchObject({ id: 'ev_badkey' });
  });

  it('HttpExportTarget delivers through the mock end-to-end', async () => {
    const target = new HttpExportTarget({ baseUrl });
    const batch: ExportBatch = {
      batch_id: 'batch_e2e',
      target: 'ultra-core',
      events: [makeEvent({ id: 'ev_e2e_1' })],
    };
    const result = await target.send(batch);
    expect(result.accepted).toEqual(['ev_e2e_1']);
    expect(result.rejected).toEqual([]);
  });

  it('GET /v1/instances/{instance}/head returns head after ingest', async () => {
    const head = (await (
      await fetch(`${baseUrl}/v1/instances/inst-test/head`)
    ).json()) as Record<string, unknown>;
    expect(head.instance).toBe('inst-test');
    expect(head.head).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(typeof head.height).toBe('number');

    const missing = await fetch(`${baseUrl}/v1/instances/nope/head`);
    expect(missing.status).toBe(404);
  });

  it('GET /v1/proofs/{instance}/{event_id} returns inclusion proof; 404 for unknown', async () => {
    const proof = (await (
      await fetch(`${baseUrl}/v1/proofs/inst-test/ev_contract_a`)
    ).json()) as Record<string, unknown>;
    expect(proof.event_id).toBe('ev_contract_a');
    expect(proof.instance).toBe('inst-test');
    expect(proof.root).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(Array.isArray(proof.proof)).toBe(true);

    const missing = await fetch(`${baseUrl}/v1/proofs/inst-test/nope`);
    expect(missing.status).toBe(404);
  });

  it('T1 credits: balance gated by tier; reservation requires approval_ref', async () => {
    const bal = await fetch(`${baseUrl}/v1/credits/balance?subject=agent-1`);
    expect(bal.status).toBe(200);
    const balBody = (await bal.json()) as Record<string, unknown>;
    expect(balBody).toMatchObject({
      subject: 'agent-1',
      balance: expect.any(String),
      tier: 'T1',
    });

    const noApproval = await fetch(`${baseUrl}/v1/credits/reservations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subject: 'agent-1', amount: '10' }),
    });
    expect(noApproval.status).toBe(403);

    const ok = await fetch(`${baseUrl}/v1/credits/reservations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subject: 'agent-1',
        amount: '10',
        approval_ref: 'approval-123',
      }),
    });
    expect(ok.status).toBe(201);
    const res = (await ok.json()) as Record<string, unknown>;
    expect(res.status).toBe('open');
    expect(res.approval_ref).toBe('approval-123');

    const list = (await (
      await fetch(`${baseUrl}/v1/credits/reservations`)
    ).json()) as {
      reservations: Array<{ reservation_id: string }>;
    };
    expect(list.reservations.length).toBeGreaterThan(0);
  });

  it('GET /v1/registry/items returns RegistryItem-shaped list', async () => {
    const res = await fetch(`${baseUrl}/v1/registry/items`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<Record<string, unknown>>;
    };
    expect(Array.isArray(body.items)).toBe(true);
    for (const item of body.items) {
      expect(['skill', 'key', 'policy', 'agent']).toContain(item.kind);
      expect(['active', 'revoked', 'deprecated']).toContain(item.status);
    }
  });

  it('GET /v1/events streams SSE callback frames (ultra-core-callback.v1 shape)', async () => {
    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/v1/events`, {
      signal: controller.signal,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const callback = {
      schema: 'ultra-core.callback.v1',
      callback_id: 'cb_test_1',
      ts: new Date().toISOString(),
      type: 'anchor.confirmed',
      subject: { instance: 'inst-test' },
      payload: { anchor: 'mock-anchor-1' },
      sig: { alg: 'Ed25519', key_id: 'ultra-core-pub', value: 'c2ln' },
      tier: 'T0',
    };
    mock.emitCallback(callback);
    // Read frames until the data: line arrives (initial chunk may only hold the comment line).
    let text = '';
    for (let i = 0; i < 5 && !text.includes('data: '); i++) {
      const { value } = await reader.read();
      text += decoder.decode(value, { stream: true });
    }
    controller.abort();
    const dataLine = text.split('\n').find((l) => l.startsWith('data: '));
    expect(dataLine).toBeTruthy();
    const parsed = JSON.parse(dataLine!.slice(6)) as Record<string, unknown>;
    // ultra-core-callback.v1 schema required fields
    for (const f of [
      'schema',
      'callback_id',
      'ts',
      'type',
      'subject',
      'payload',
      'sig',
    ]) {
      expect(parsed).toHaveProperty(f);
    }
    expect(parsed.schema).toBe('ultra-core.callback.v1');
    expect((parsed.sig as Record<string, unknown>).alg).toBe('Ed25519');
  }, 10000);
});
