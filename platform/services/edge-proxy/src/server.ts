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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import {
  createServer,
  type Server,
  IncomingMessage,
  ServerResponse,
} from 'node:http';

import { verifyJwt } from './jwt';
import {
  forward,
  securityHeaders,
  _setSecurityHeaders,
  _getSecurityHeaders,
} from './proxy';
import { matchRoute } from './router';
import type { ProxyConfig } from './types';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json',
    ..._getSecurityHeaders(),
  });
  res.end(JSON.stringify(body));
}

export function createEdgeProxy(config: ProxyConfig): Server {
  _setSecurityHeaders(securityHeaders(config));

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(
      req.url ?? '/',
      `http://${req.headers.host ?? 'localhost'}`
    );
    const pathname = url.pathname;

    if (pathname === '/healthz') {
      return json(res, 200, { status: 'ok', service: 'edge-proxy' });
    }

    const match = matchRoute(pathname, config.routes);
    if (!match) return json(res, 404, { error: 'no route', path: pathname });

    const userHeaders: Record<string, string> = {};
    if (match.route.auth) {
      const header = req.headers.authorization ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      const claims = token
        ? verifyJwt(token, config.jwtSecret, {
            issuer: config.jwtIssuer,
            audience: config.jwtAudience,
          })
        : null;
      if (!claims)
        return json(res, 401, { error: 'sso token required or invalid' });
      userHeaders['x-ultra-user'] = String(claims.userId ?? claims.sub ?? '');
      userHeaders['x-ultra-role'] = String(claims.role ?? 'user');
      userHeaders['x-ultra-email'] = String(claims.email ?? '');
    }

    return forward(req, res, match, userHeaders);
  });
}

export { DEFAULT_CSP, securityHeaders } from './proxy';
