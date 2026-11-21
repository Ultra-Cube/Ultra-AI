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

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login — platform login bridge.
 *
 * Forwards credentials to core-api `POST /auth/login` (port :4000), which
 * issues the HS256 JWT consumed by middleware.ts for Open WebUI SSO. On
 * success the token is stored in an HttpOnly `ultra_session` cookie — the
 * browser never sees it via JS, and middleware resolves identity from it.
 */

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const SESSION_COOKIE = 'ultra_session';
const SESSION_MAX_AGE = 12 * 60 * 60; // matches core-api JWT expiry (12h)

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: 'email and password are required' },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'auth service unreachable' },
      { status: 502 }
    );
  }

  const data = (await upstream.json().catch(() => null)) as {
    token?: string;
    user?: { id?: string; email?: string };
    error?: string;
  } | null;

  if (!upstream.ok || !data?.token) {
    return NextResponse.json(
      { error: data?.error ?? 'login failed' },
      { status: upstream.ok ? 502 : upstream.status }
    );
  }

  const response = NextResponse.json({
    user: data.user ?? { email: body.email },
  });
  response.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
