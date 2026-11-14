import { request as httpRequest } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { request as httpsRequest } from 'node:https';

import type { RouteMatch } from './router';
import type { ProxyConfig } from './types';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

export const DEFAULT_CSP = [
  "default-src 'self'",
  // engines need eval (vscode-server, flow editors)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

let securityHeadersGlobal: Record<string, string> = {};
export function _setSecurityHeaders(h: Record<string, string>) {
  securityHeadersGlobal = h;
}
export function _getSecurityHeaders(): Record<string, string> {
  return securityHeadersGlobal;
}

export function securityHeaders(config: ProxyConfig): Record<string, string> {
  const csp = [DEFAULT_CSP, ...(config.cspExtra ?? [])].join('; ');
  return {
    'content-security-policy': csp,
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    ...config.securityHeaders,
  };
}

/** Forward a request to the matched upstream; pipe status/headers/body back. */
export function forward(
  req: IncomingMessage,
  res: ServerResponse,
  match: RouteMatch,
  userHeaders: Record<string, string>
): void {
  const target = new URL(match.route.target);
  const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const upstreamPath = match.upstreamPath + qs;
  const isHttps = target.protocol === 'https:';
  const doRequest = isHttps ? httpsRequest : httpRequest;

  const headers: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && v !== undefined) headers[k] = v;
  }
  headers.host = target.host;
  Object.assign(headers, userHeaders);

  const up = doRequest(
    {
      hostname: target.hostname,
      port: target.port || (isHttps ? 443 : 80),
      path: upstreamPath,
      method: req.method,
      headers,
    },
    (upRes) => {
      const outHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(upRes.headers)) {
        if (v === undefined || HOP_BY_HOP.has(k.toLowerCase())) continue;
        outHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
      }
      Object.assign(outHeaders, securityHeadersGlobal);
      res.writeHead(upRes.statusCode ?? 502, outHeaders);
      upRes.pipe(res);
    }
  );
  up.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, {
        'content-type': 'application/json',
        ...securityHeadersGlobal,
      });
      res.end(
        JSON.stringify({
          error: 'upstream unreachable',
          target: match.route.target,
        })
      );
    } else {
      res.end();
    }
  });
  req.pipe(up);
}
