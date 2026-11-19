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

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { JwtClaims } from './types';

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

/** Sign HS256 JWT — used by tests/dev tokens; production issues via core-api. */
export function signJwt(
  payload: JwtClaims,
  secret: string,
  expiresInSec = 3600
): string {
  const now = Math.floor(Date.now() / 1000);
  const body: JwtClaims = { iat: now, exp: now + expiresInSec, ...payload };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const data = b64url(JSON.stringify(body));
  const sig = createHmac('sha256', secret)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${sig}`;
}

/** Verify HS256 JWT. Returns claims or null. Zero-dep (no jsonwebtoken). */
export function verifyJwt(
  token: string,
  secret: string,
  opts?: { issuer?: string; audience?: string }
): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, data, sig] = parts;
  let alg: string;
  try {
    alg = JSON.parse(Buffer.from(header, 'base64url').toString()).alg;
  } catch {
    return null;
  }
  if (alg !== 'HS256') return null;
  const expected = createHmac('sha256', secret)
    .update(`${header}.${data}`)
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  let claims: JwtClaims;
  try {
    claims = JSON.parse(Buffer.from(data, 'base64url').toString());
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === 'number' && claims.exp < now) return null;
  if (opts?.issuer && claims.iss !== opts.issuer) return null;
  if (opts?.audience) {
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(opts.audience)) return null;
  }
  return claims;
}
