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

import { createServer, request as httpRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { ProxyConfig } from './types';

import { createEdgeProxy, signJwt, securityHeaders } from './index';

const SECRET = 'test-secret';

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () =>
      resolve((server.address() as AddressInfo).port)
    );
  });
}

interface HttpResult {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

function get(
  port: number,
  path: string,
  headers: Record<string, string> = {}
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: '127.0.0.1', port, path, method: 'GET', headers },
      (res) => {
        let body = '';
        res.on('data', (c: Buffer) => (body += c.toString()));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });
}

describe('createEdgeProxy', () => {
  let upstream: Server;
  let proxy: Server;
  let upPort: number;
  let proxyPort: number;
  let seenHeaders: Record<string, string> = {};

  beforeAll(async () => {
    upstream = createServer((req, res) => {
      seenHeaders = req.headers as Record<string, string>;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, url: req.url }));
    });
    upPort = await listen(upstream);

    const config: ProxyConfig = {
      listenPort: 0,
      jwtSecret: SECRET,
      routes: [
        { prefix: '/api', target: `http://127.0.0.1:${upPort}` },
        { prefix: '/secure', target: `http://127.0.0.1:${upPort}`, auth: true },
      ],
    };
    proxy = createEdgeProxy(config);
    proxyPort = await listen(proxy);
  });

  afterAll(async () => {
    await new Promise((r) => proxy.close(r));
    await new Promise((r) => upstream.close(r));
  });

  it('healthz responds locally', async () => {
    const r = await get(proxyPort, '/healthz');
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body).service).toBe('edge-proxy');
  });

  it('proxies unauthenticated route and strips prefix', async () => {
    const r = await get(proxyPort, '/api/health?x=1');
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body).url).toBe('/health?x=1');
  });

  it('sets CSP and security headers', async () => {
    const r = await get(proxyPort, '/api/health');
    expect(r.headers['content-security-policy']).toContain(
      "default-src 'self'"
    );
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
  });

  it('rejects auth route without token', async () => {
    const r = await get(proxyPort, '/secure/data');
    expect(r.status).toBe(401);
  });

  it('rejects auth route with invalid token', async () => {
    const r = await get(proxyPort, '/secure/data', {
      authorization: 'Bearer bad.token.here',
    });
    expect(r.status).toBe(401);
  });

  it('forwards auth route with valid token and injects identity headers', async () => {
    const token = signJwt(
      { userId: 'u42', role: 'admin', email: 'u@x.y' },
      SECRET
    );
    const r = await get(proxyPort, '/secure/data', {
      authorization: `Bearer ${token}`,
    });
    expect(r.status).toBe(200);
    expect(seenHeaders['x-ultra-user']).toBe('u42');
    expect(seenHeaders['x-ultra-role']).toBe('admin');
  });

  it('returns 404 for unmatched path', async () => {
    const r = await get(proxyPort, '/unknown/path');
    expect(r.status).toBe(404);
  });

  it('returns 502 when upstream is down', async () => {
    const dead: Server = createServer((_req, res) => res.end());
    const deadPort = await listen(dead);
    await new Promise((r) => dead.close(r)); // closed immediately
    const config: ProxyConfig = {
      listenPort: 0,
      jwtSecret: SECRET,
      routes: [{ prefix: '/dead', target: `http://127.0.0.1:${deadPort}` }],
    };
    const p2 = createEdgeProxy(config);
    const p2Port = await listen(p2);
    const r = await get(p2Port, '/dead/x');
    expect(r.status).toBe(502);
    await new Promise((r) => p2.close(r));
  });

  it('securityHeaders merges cspExtra', () => {
    const h = securityHeaders({
      listenPort: 0,
      jwtSecret: 's',
      routes: [],
      cspExtra: ['img-src https://cdn.example'],
    });
    expect(h['content-security-policy']).toContain(
      'img-src https://cdn.example'
    );
  });
});
