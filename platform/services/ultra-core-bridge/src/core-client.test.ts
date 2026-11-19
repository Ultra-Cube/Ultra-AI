import { createCoreClient, UltraCoreApiError } from './core-client';
import { startUltraCoreMock, UltraCoreMock } from './mock-server';
import { ExportBatch, UltraEvent } from './types';

const makeEvent = (id: string): UltraEvent => ({
  schema: 'ultra.event.v1',
  id,
  ts: new Date().toISOString(),
  type: 'usage.model_call',
  subject: { instance: 'inst-client' },
  payload: { model: 'm', tokens: 1 },
  prev_hash: 'sha256:' + '0'.repeat(64),
  sig: { alg: 'Ed25519', key_id: 'key-producer-1', value: 'c2ln' },
});

describe('P4B-09 UltraCoreClient typed contract', () => {
  let mock: UltraCoreMock;
  let baseUrl: string;

  beforeAll(async () => {
    const started = await startUltraCoreMock({
      port: 0,
      tiers: { T0: true, T1: true },
    });
    mock = started.mock;
    baseUrl = started.url;
    await fetch(baseUrl + '/v1/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key_id: 'key-producer-1',
        alg: 'Ed25519',
        public_key: 'dGVzdA',
      }),
    });
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('ingest -> proof -> head round-trip through typed client', async () => {
    const client = createCoreClient({ baseUrl });
    const batch: ExportBatch = {
      batch_id: 'batch_client_1',
      target: 'ultra-core',
      events: [makeEvent('ev_client_a'), makeEvent('ev_client_b')],
    };
    const res = await client.ingestBatch(batch);
    expect(res.accepted).toEqual(['ev_client_a', 'ev_client_b']);

    const proof = await client.getProof('inst-client', 'ev_client_a');
    expect(proof.event_id).toBe('ev_client_a');
    expect(proof.root).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(Array.isArray(proof.proof)).toBe(true);

    const head = await client.instanceHead('inst-client');
    expect(head.head).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(head.height).toBe(1);
  });

  it('getProof throws UltraCoreApiError(404) for unknown event', async () => {
    const client = createCoreClient({ baseUrl });
    await expect(client.getProof('inst-client', 'nope')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('credits: balance read, reservation requires approval_ref, list works', async () => {
    const client = createCoreClient({ baseUrl });
    const bal = await client.getCreditBalance('agent-1');
    expect(bal.subject).toBe('agent-1');
    expect(bal.tier).toBe('T1');

    await expect(
      client.createCreditReservation({
        subject: 'agent-1',
        amount: '10',
        approval_ref: '',
      })
    ).rejects.toBeInstanceOf(UltraCoreApiError);

    const res = await client.createCreditReservation({
      subject: 'agent-1',
      amount: '10',
      approval_ref: 'approval-ticket-1',
    });
    expect(res.reservation_id).toMatch(/^res_/);
    expect(res.status).toBe('open');

    const list = await client.listCreditReservations();
    expect(list.some((r) => r.reservation_id === res.reservation_id)).toBe(
      true
    );
  });

  it('readOnly mode refuses credits mutations client-side', async () => {
    const client = createCoreClient({ baseUrl, readOnly: true });
    // reads still work
    await expect(client.getCreditBalance('agent-1')).resolves.toBeTruthy();
    // mutation refused before any network call
    await expect(
      client.createCreditReservation({
        subject: 'agent-1',
        amount: '5',
        approval_ref: 'approval-ticket-2',
      })
    ).rejects.toMatchObject({ status: 0 });
  });

  it('listRegistryItems returns array shape', async () => {
    const client = createCoreClient({ baseUrl });
    const items = await client.listRegistryItems();
    expect(Array.isArray(items)).toBe(true);
  });
});
