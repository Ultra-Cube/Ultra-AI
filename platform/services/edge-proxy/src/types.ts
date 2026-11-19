// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

export interface UpstreamRoute {
  /** URL path prefix this route owns, e.g. "/api" or "/engines/n8n". */
  prefix: string;
  /** Upstream base URL, e.g. "http://127.0.0.1:5678". */
  target: string;
  /** Strip the prefix before forwarding (default true). */
  stripPrefix?: boolean;
  /** Require a valid SSO JWT for this route. */
  auth?: boolean;
  /** WebSocket upgrade allowed (default false). */
  ws?: boolean;
}

export interface ProxyConfig {
  listenPort: number;
  listenHost?: string;
  /** HS256 shared secret matching core-api ULTRA_AI_JWT_SECRET. */
  jwtSecret: string;
  /** Issuer/audience checks; optional. */
  jwtIssuer?: string;
  jwtAudience?: string;
  routes: UpstreamRoute[];
  /** Extra CSP directives merged over defaults. */
  cspExtra?: string[];
  /** Headers always set on responses. */
  securityHeaders?: Record<string, string>;
}

export interface JwtClaims {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [k: string]: unknown;
}
