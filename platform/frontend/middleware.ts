import { NextRequest, NextResponse } from 'next/server';

import {
  resolveUltraIdentity,
  ULTRA_USER_EMAIL_HEADER,
  ULTRA_USER_NAME_HEADER,
} from './app/_lib/webui-sso';

/**
 * Open WebUI SSO groundwork (see docs/OPEN_WEBUI_INTEGRATION.md).
 *
 * The rewrites in next.config.js forward WebUI paths to the container.
 * Middleware runs before rewrites, so it is the only place that can inject
 * the trusted identity headers WebUI's WEBUI_AUTH_TRUSTED_* mechanism reads.
 *
 * Behaviour:
 *  - ULTRA_WEBUI_SSO != '1'  -> pass-through (current default; WEBUI_AUTH=false).
 *  - ULTRA_WEBUI_SSO = '1'   -> inject x-ultra-user-* headers when an identity
 *    resolves; requests without identity are rejected for /api/v1/* and
 *    redirected to '/' for page paths.
 */

const WEBUI_PATHS = [
  '/webui/:path*',
  '/_app/:path*',
  '/static/:path*',
  '/api/v1/:path*',
  '/oauth/:path*',
  '/ws/:path*',
  '/manifest.json',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  if (process.env.ULTRA_WEBUI_SSO !== '1') {
    return NextResponse.next();
  }

  const identity = resolveUltraIdentity();
  const { pathname } = request.nextUrl;

  if (!identity) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ULTRA_USER_EMAIL_HEADER, identity.email);
  requestHeaders.set(ULTRA_USER_NAME_HEADER, identity.name);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: WEBUI_PATHS,
};
