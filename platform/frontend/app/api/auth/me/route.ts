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

import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SESSION_COOKIE = 'ultra_session';

/**
 * GET /api/auth/me — returns the verified platform identity for the
 * `ultra_session` cookie, or 401. Lets client code check auth state without
 * exposing the JWT itself.
 */

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.ULTRA_AI_JWT_SECRET;
  if (!token || !secret) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  try {
    const { payload } = await jwtVerify<JwtPayload>(
      token,
      new TextEncoder().encode(secret)
    );
    if (!payload.email) throw new Error('missing email');
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
}
