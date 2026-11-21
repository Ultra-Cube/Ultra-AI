/**
 * Open WebUI SSO groundwork.
 *
 * Ultra-AI platform auth does not exist yet (no auth pages/session store).
 * This module is the single seam where an authenticated platform identity
 * will be resolved once auth lands. Until then it supports only an explicit
 * dev override via env — NEVER enable that outside local development.
 *
 * Compose side: uncomment WEBUI_AUTH_TRUSTED_EMAIL_HEADER /
 * WEBUI_AUTH_TRUSTED_NAME_HEADER in control/config/docker/docker-compose.yml
 * and set WEBUI_AUTH=true once this seam returns real identities.
 */

export const ULTRA_USER_EMAIL_HEADER = 'x-ultra-user-email';
export const ULTRA_USER_NAME_HEADER = 'x-ultra-user-name';

export interface UltraIdentity {
  email: string;
  name: string;
}

/**
 * Resolve the platform identity for the current request.
 * Returns null when unauthenticated — callers must not inject headers then.
 *
 * TODO(platform-auth): replace the dev-env seam with real session
 * verification (signed cookie / backend session lookup) when the platform
 * auth system ships.
 */
export function resolveUltraIdentity(): UltraIdentity | null {
  // Dev-only escape hatch for local SSO testing. Requires BOTH the SSO gate
  // and this explicit email; documented as insecure in OPEN_WEBUI_INTEGRATION.md.
  if (process.env.ULTRA_WEBUI_SSO_DEV_IDENTITY === '1') {
    const email = process.env.ULTRA_DEV_SSO_EMAIL;
    if (email) {
      return { email, name: process.env.ULTRA_DEV_SSO_NAME ?? email };
    }
  }
  return null;
}
