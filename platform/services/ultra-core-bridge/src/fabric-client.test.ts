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

import { FabricAssetsClient, FabricGatewayApiError } from './fabric-client';

function mockFetch(
  handler: (
    url: string,
    init?: RequestInit
  ) => { status?: number; body?: unknown }
): typeof fetch {
  return (async (url: unknown, init?: RequestInit) => {
    const { status = 200, body = {} } = handler(String(url), init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

describe('FabricAssetsClient', () => {
  const asset = {
    id: 'cr-1',
    kind: 'credit',
    owner: 'ultra-ai',
    amount: 100,
    unit: 'credit',
    status: 'active',
  };

  it('issues an asset with bearer auth and json body', async () => {
    const seen: { url?: string; auth?: string; body?: string } = {};
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test/',
      token: 'tok',
      fetchImpl: mockFetch((url, init) => {
        seen.url = url;
        seen.auth = (init?.headers as Record<string, string>).authorization;
        seen.body = String(init?.body);
        return { status: 201, body: asset };
      }),
    });
    const res = await client.issue({
      id: 'cr-1',
      kind: 'credit',
      owner: 'ultra-ai',
      amount: 100,
      reference: 'ref-1',
    });
    expect(res.id).toBe('cr-1');
    expect(seen.url).toBe('http://gw.test/v1/assets');
    expect(seen.auth).toBe('Bearer tok');
    expect(JSON.parse(seen.body!)).toMatchObject({
      id: 'cr-1',
      amount: 100,
      reference: 'ref-1',
    });
  });

  it('reads balance and history', async () => {
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test',
      token: 'tok',
      fetchImpl: mockFetch((url) => {
        if (url.endsWith('/balance'))
          return { body: { id: 'cr-1', balance: 70 } };
        if (url.endsWith('/history'))
          return { body: { id: 'cr-1', history: [{ asset, txId: 'tx1' }] } };
        return { status: 404, body: { error: 'nf' } };
      }),
    });
    await expect(client.balanceOf('cr-1')).resolves.toBe(70);
    const hist = await client.history('cr-1');
    expect(hist).toHaveLength(1);
    expect(hist[0].txId).toBe('tx1');
  });

  it('spend posts amount+reference', async () => {
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test',
      token: 'tok',
      fetchImpl: mockFetch(() => ({ body: { ...asset, amount: 70 } })),
    });
    const res = await client.spend('cr-1', { amount: 30, reference: 'r' });
    expect(res.amount).toBe(70);
  });

  it('throws FabricGatewayApiError on non-2xx', async () => {
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test',
      token: 'tok',
      fetchImpl: mockFetch(() => ({
        status: 401,
        body: { error: 'unauthorized' },
      })),
    });
    await expect(client.balanceOf('cr-1')).rejects.toBeInstanceOf(
      FabricGatewayApiError
    );
    await expect(client.balanceOf('cr-1')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('refuses writes in read-only mode', async () => {
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test',
      token: 'tok',
      readOnly: true,
      fetchImpl: mockFetch(() => ({ body: asset })),
    });
    await expect(
      client.issue({ id: 'x', owner: 'o', amount: 1 })
    ).rejects.toMatchObject({ status: 0 });
    await expect(
      client.spend('x', { amount: 1, reference: 'r' })
    ).rejects.toBeInstanceOf(FabricGatewayApiError);
    // reads still allowed
    await expect(client.balanceOf('x')).resolves.toBeDefined();
  });

  it('ping aggregates healthz + readyz', async () => {
    const client = new FabricAssetsClient({
      baseUrl: 'http://gw.test',
      token: 'tok',
      fetchImpl: mockFetch((url) => {
        if (url.endsWith('/healthz')) return { body: { status: 'ok' } };
        if (url.endsWith('/readyz')) return { body: { fabric: { ok: true } } };
        return { status: 404 };
      }),
    });
    const p = await client.ping();
    expect(p.ok).toBe(true);
    expect(p.fabric?.ok).toBe(true);
  });
});
