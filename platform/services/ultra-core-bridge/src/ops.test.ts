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

import { HttpExportTarget } from './http-target';
import {
  BridgeMetrics,
  bridgeMetrics,
  isUltraCoreEnabled,
  logEvent,
  redactSecrets,
} from './ops';
import { ExportBatch, UltraEvent } from './types';

function ev(id: string): UltraEvent {
  return {
    schema: 'ultra.event.v1',
    id,
    ts: '2026-11-19T00:00:00.000Z',
    type: 'usage.model_call',
    subject: { instance: 'i1' },
    payload: {},
    prev_hash: 'sha256:' + '0'.repeat(64),
    sig: { alg: 'Ed25519', key_id: 'k1', value: 'sig' },
  };
}

function batch(): ExportBatch {
  return { batch_id: 'b1', events: [ev('e1'), ev('e2')] } as ExportBatch;
}

describe('ops: metrics', () => {
  it('renders Prometheus text exposition', () => {
    const m = new BridgeMetrics();
    m.inc('test_counter', { result: 'ok' }, 3);
    m.set('test_gauge', 42);
    const out = m.render();
    expect(out).toContain('# TYPE test_counter counter');
    expect(out).toContain('test_counter{result="ok"} 3');
    expect(out).toContain('test_gauge 42');
  });
});

describe('ops: redaction + logging', () => {
  it('redacts secret-looking keys recursively', () => {
    const r = redactSecrets({
      token: 'abc',
      nested: { api_key: 'x', ok: 1 },
      list: [{ password: 'p', keep: true }],
    }) as any;
    expect(r.token).toBe('[redacted]');
    expect(r.nested.api_key).toBe('[redacted]');
    expect(r.nested.ok).toBe(1);
    expect(r.list[0].password).toBe('[redacted]');
    expect(r.list[0].keep).toBe(true);
  });

  it('logEvent emits JSON without secrets', () => {
    const spy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    logEvent('info', 'test.event', { api_token: 'secret', n: 1 });
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.event).toBe('test.event');
    expect(parsed.api_token).toBe('[redacted]');
    expect(line).not.toContain('secret');
    spy.mockRestore();
  });
});

describe('ops: kill switch', () => {
  it('isUltraCoreEnabled defaults true, false only on explicit false', () => {
    expect(isUltraCoreEnabled({})).toBe(true);
    expect(isUltraCoreEnabled({ ULTRA_CORE_ENABLED: 'true' })).toBe(true);
    expect(isUltraCoreEnabled({ ULTRA_CORE_ENABLED: 'false' })).toBe(false);
  });

  it('HttpExportTarget throws when disabled and does not call client', async () => {
    const client = {
      ingestBatch: jest.fn().mockResolvedValue({ accepted: ['e1', 'e2'] }),
    } as any;
    const t = new HttpExportTarget({
      baseUrl: 'http://x',
      client,
      enabled: false,
    });
    await expect(t.send(batch())).rejects.toThrow(/disabled/);
    expect(client.ingestBatch).not.toHaveBeenCalled();
    expect(bridgeMetrics.render()).toContain('result="disabled"');
  });

  it('HttpExportTarget emits metrics on success', async () => {
    const client = {
      ingestBatch: jest.fn().mockResolvedValue({
        accepted: ['e1'],
        rejected: [{ event_id: 'e2', reason: 'bad' }],
      }),
    } as any;
    const t = new HttpExportTarget({ baseUrl: 'http://x', client });
    const res = await t.send(batch());
    expect(res.accepted).toEqual(['e1']);
    const out = bridgeMetrics.render();
    expect(out).toContain('result="accepted"');
    expect(out).toContain('result="rejected"');
    expect(out).toContain('ultra_core_export_duration_ms');
  });

  it('HttpExportTarget emits error metric and rethrows on failure', async () => {
    const client = {
      ingestBatch: jest.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const t = new HttpExportTarget({ baseUrl: 'http://x', client });
    await expect(t.send(batch())).rejects.toThrow('boom');
    expect(bridgeMetrics.render()).toContain('result="error"');
  });
});
