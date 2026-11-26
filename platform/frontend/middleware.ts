// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
// ║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
// ║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
// ║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
// ║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
// ║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
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

import { NextRequest, NextResponse } from 'next/server';

import {
  resolveUltraIdentity,
  ULTRA_USER_EMAIL_HEADER,
  ULTRA_USER_NAME_HEADER,
  ULTRA_USER_ROLE_HEADER,
} from './app/_lib/webui-sso';

/**
 * Open WebUI SSO (see docs/OPEN_WEBUI_INTEGRATION.md).
 *
 * The rewrites in next.config.js forward WebUI paths to the container.
 * Middleware runs before rewrites, so it is the only place that can inject
 * the trusted identity headers WebUI's WEBUI_AUTH_TRUSTED_* mechanism reads.
 *
 * WebUI has two auth layers and they must not be conflated:
 *  - Platform session (`ultra_session` cookie / Bearer platform JWT) —
 *    verified here; drives trusted-header injection at signin.
 *  - WebUI session (its own JWT from /api/v1/auths/signin) — enforced by
 *    WebUI itself on every /api/v1/* call.
 *
 * Behaviour when ULTRA_WEBUI_SSO=1:
 *  - Valid platform identity -> inject x-ultra-user-* headers, pass through.
 *  - No identity on page/asset paths (/webui, /_app, /static, manifest,
 *    favicon) -> redirect to /login.
 *  - No identity on /api/v1/*, /oauth/*, /ws/* -> pass through untouched;
 *    WebUI's own session auth decides (its 401s are correct, and its
 *    Bearer tokens are NOT platform JWTs — verifying them here would
 *    break the WebUI SPA).
 */
export async function middleware(request: NextRequest) {
  if (process.env.ULTRA_WEBUI_SSO !== '1') {
    return NextResponse.next();
  }

  const identity = await resolveUltraIdentity(request);
  const { pathname } = request.nextUrl;

  if (!identity) {
    const isApiPath =
      pathname.startsWith('/api/') ||
      pathname.startsWith('/oauth/') ||
      pathname.startsWith('/ws/');
    if (isApiPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ULTRA_USER_EMAIL_HEADER, identity.email);
  requestHeaders.set(ULTRA_USER_NAME_HEADER, identity.name);
  // WebUI trusted-role header accepts admin|user|pending only.
  const role = identity.role?.toLowerCase();
  if (role === 'admin' || role === 'user') {
    requestHeaders.set(ULTRA_USER_ROLE_HEADER, role);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/webui/:path*',
    '/_app/:path*',
    '/static/:path*',
    '/api/v1/:path*',
    '/oauth/:path*',
    '/ws/:path*',
    '/manifest.json',
    '/favicon.ico',
  ],
};
