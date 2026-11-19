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
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { signJwt, verifyJwt } from './jwt';
import { matchRoute } from './router';
import type { UpstreamRoute } from './types';

describe('matchRoute', () => {
  const routes: UpstreamRoute[] = [
    { prefix: '/api', target: 'http://127.0.0.1:4000' },
    { prefix: '/engines/n8n', target: 'http://127.0.0.1:5678' },
    { prefix: '/', target: 'http://127.0.0.1:3000' },
  ];

  it('matches longest prefix', () => {
    const m = matchRoute('/engines/n8n/webhook/x', routes);
    expect(m?.route.target).toBe('http://127.0.0.1:5678');
    expect(m?.upstreamPath).toBe('/webhook/x');
  });

  it('strips prefix and falls back to /', () => {
    expect(matchRoute('/api', routes)?.upstreamPath).toBe('/');
    expect(matchRoute('/api/health', routes)?.upstreamPath).toBe('/health');
  });

  it('respects stripPrefix=false', () => {
    const r: UpstreamRoute[] = [
      { prefix: '/app', target: 'http://x', stripPrefix: false },
    ];
    expect(matchRoute('/app/page', r)?.upstreamPath).toBe('/app/page');
  });

  it('returns null when no route matches', () => {
    expect(
      matchRoute('/nope/deep', [{ prefix: '/api', target: 'http://x' }])
    ).toBeNull();
  });
});

describe('jwt', () => {
  const secret = 'test-secret';

  it('signs and verifies a token', () => {
    const token = signJwt(
      { userId: 'u1', role: 'admin', email: 'a@b.c' },
      secret
    );
    const claims = verifyJwt(token, secret);
    expect(claims?.userId).toBe('u1');
    expect(claims?.role).toBe('admin');
  });

  it('rejects wrong secret', () => {
    const token = signJwt({ userId: 'u1' }, secret);
    expect(verifyJwt(token, 'other')).toBeNull();
  });

  it('rejects expired token', () => {
    const token = signJwt({ userId: 'u1' }, secret, -10);
    expect(verifyJwt(token, secret)).toBeNull();
  });

  it('rejects malformed token', () => {
    expect(verifyJwt('a.b.c', secret)).toBeNull();
    expect(verifyJwt('only-one-part', secret)).toBeNull();
  });

  it('enforces issuer and audience', () => {
    const token = signJwt({ iss: 'ultra', aud: 'edge' }, secret);
    expect(
      verifyJwt(token, secret, { issuer: 'ultra', audience: 'edge' })
    ).not.toBeNull();
    expect(verifyJwt(token, secret, { issuer: 'other' })).toBeNull();
    expect(verifyJwt(token, secret, { audience: 'other' })).toBeNull();
  });
});
