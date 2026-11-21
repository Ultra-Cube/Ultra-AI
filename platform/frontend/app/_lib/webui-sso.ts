import { jwtVerify } from 'jose';

/**
 * Open WebUI SSO — real session verification.
 *
 * The platform auth lives in core-api (`/auth/login`, `/auth/register`,
 * port :4000) and issues HS256 JWTs (`jsonwebtoken`, 12h expiry) with
 * payload { sub, email, role }. This module verifies those tokens so the
 * middleware can inject the trusted headers WebUI reads when
 * WEBUI_AUTH_TRUSTED_* is enabled.
 *
 * Token transport (in order):
 *   1. `ultra_session` cookie — set by the platform login flow (httponly).
 *   2. `Authorization: Bearer <jwt>` — for API clients.
 *
 * Activation: middleware only engages when ULTRA_WEBUI_SSO=1. Token
 * verification requires ULTRA_AI_JWT_SECRET to match core-api's secret.
 * A dev-only env override (ULTRA_WEBUI_SSO_DEV_IDENTITY) remains for local
 * testing without a backend — never enable outside development.
 */

export const ULTRA_USER_EMAIL_HEADER = 'x-ultra-user-email';
export const ULTRA_USER_NAME_HEADER = 'x-ultra-user-name';
export const SESSION_COOKIE = 'ultra_session';

export interface UltraIdentity {
  email: string;
  name: string;
  userId?: string;
  role?: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

function extractToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length);
  }
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

async function verifyPlatformJwt(token: string): Promise<UltraIdentity | null> {
  const secret = process.env.ULTRA_AI_JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify<JwtPayload>(
      token,
      new TextEncoder().encode(secret)
    );
    if (!payload.email) return null;
    return {
      email: payload.email,
      name: payload.email,
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the platform identity for the current request.
 * Returns null when unauthenticated — callers must not inject headers then.
 */
export async function resolveUltraIdentity(
  request: Request
): Promise<UltraIdentity | null> {
  const token = extractToken(request);
  if (token) {
    const identity = await verifyPlatformJwt(token);
    if (identity) return identity;
  }

  // Dev-only escape hatch for local SSO testing without a backend.
  if (process.env.ULTRA_WEBUI_SSO_DEV_IDENTITY === '1') {
    const email = process.env.ULTRA_DEV_SSO_EMAIL;
    if (email) {
      return { email, name: process.env.ULTRA_DEV_SSO_NAME ?? email };
    }
  }
  return null;
}
