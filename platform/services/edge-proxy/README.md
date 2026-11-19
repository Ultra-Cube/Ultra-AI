<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
║ ██║   ██║██║     ███████║██████╔╝                                        ║
║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub Org: github.com/Ultra-Cube                                        ║
║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

<!--
# @ultra-ai/edge-proxy

Single-origin reverse proxy for Ultra-AI (P1A-08): one public origin fronts the Next.js UI, core-api, and every supervised engine — users never leave the product to reach n8n, Langflow, Dify, OpenHands, Open WebUI, or the VS Code server.

## Features

- **Longest-prefix routing** — `/api/*` → core-api, `/engines/<id>/*` → engine ports, `/` → frontend. `stripPrefix` controls path rewriting.
- **SSO/JWT gate** — per-route `auth: true` requires a Bearer HS256 JWT signed with the same `ULTRA_AI_JWT_SECRET` as core-api. Verified claims are forwarded upstream as `x-ultra-user` / `x-ultra-role` / `x-ultra-email` headers so engines can attribute actions. Optional `iss`/`aud` checks.
- **Zero-dependency JWT** — `signJwt`/`verifyJwt` implemented on `node:crypto` (HMAC-SHA256 + `timingSafeEqual`); no `jsonwebtoken` needed.
- **CSP + security headers** — `Content-Security-Policy` (self + ws/wss for engine sockets, `unsafe-eval` required by vscode-server/flow editors), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Extensible via `cspExtra`/`securityHeaders`.
- **Health endpoint** — `/healthz` always answered locally.
- **502 on upstream failure** — clean JSON error, never hangs.

## Usage

```ts
import { createEdgeProxy } from "@ultra-ai/edge-proxy";

const server = createEdgeProxy({
  listenPort: 443,
  jwtSecret: process.env.ULTRA_AI_JWT_SECRET!,
  jwtIssuer: "ultra-ai",
  routes: [
    { prefix: "/api", target: "http://127.0.0.1:4000" },
    { prefix: "/engines/n8n", target: "http://127.0.0.1:5678", auth: true },
    { prefix: "/", target: "http://127.0.0.1:3000" },
  ],
});
server.listen(443);
```

## Route table (reference config)

Engine routes are generated from `engine-supervisor` manifests — each manifest's `id` maps to `/engines/<id>` and its `port` to the target. `ws: true` is reserved for engines that need raw upgrade tunneling (v1 forwards HTTP only; upgrade handling lands with the desktop-bridge socket work).

## Tests

`npm test` — router matching, JWT sign/verify/expiry/issuer/audience, proxy auth gating, header injection, CSP stamping, 404/502 paths. All in-process HTTP servers, no network.
