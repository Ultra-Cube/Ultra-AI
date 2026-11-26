<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

# Open WebUI — same-origin integration

## What is live

`platform/frontend/next.config.js` proxies Open WebUI (default
`http://localhost:8080`, override with `OPEN_WEBUI_ORIGIN`) onto the Next
origin:

| Browser path | Proxied to |
|---|---|
| `/webui`, `/webui/*` | `OPEN_WEBUI_ORIGIN/*` (SPA shell + deep links) |
| `/_app/*` | SvelteKit immutable assets |
| `/static/*` | WebUI static assets incl. `custom.css` (Ultra theme) |
| `/api/v1/*` | WebUI backend API |
| `/oauth/*`, `/ws/*` | WebUI OAuth + socket.io |
| `/manifest.json`, `/favicon.ico` | WebUI PWA assets |

These `beforeFiles` rewrites run before the existing `/api/*` →
`127.0.0.1:4000` fallback and before filesystem routes. Verified live:
`/webui` returns the WebUI index, `/_app/immutable/*.js` serves JS,
`/static/custom.css` serves the Ultra theme, `/api/v1/*` reaches the API.

`app/chat/page.tsx` embeds `/webui/` in the iframe (override:
`NEXT_PUBLIC_OPEN_WEBUI_EMBED`), so the chat surface is now **same-origin**:
no X-Frame-Options/CORS issues, cookies and `localStorage` are shared with
the platform origin.

## Known limitations

- WebUI SPA client-side routes (`/c/...`, `/auth`, `/admin`) are proxied
  correctly through `/webui/*`, but a **hard reload** on a deep route hits
  the Next router, not WebUI. In-app navigation is client-side and works.
- `/api/v1/*` is claimed globally for WebUI. The `:4000` core-api has no
  `/api/v1` routes today; if that changes, scope the rewrite or move WebUI
  API under a dedicated prefix (requires WebUI-side support — it has none).

## SSO (active, verified end-to-end)

Real platform auth exists in core-api (`POST /auth/login` /
`/auth/register`, HS256 JWT, 12h expiry, secret `ULTRA_AI_JWT_SECRET`).
The SSO chain is wired and verified live:

1. **Login** — `platform/frontend/app/login/page.tsx` posts to
   `POST /api/auth/login`, which proxies to core-api and stores the JWT in
   an HttpOnly `ultra_session` cookie (`SameSite=Lax`, 12h). Companion
   routes: `GET /api/auth/me` (verified identity), `POST /api/auth/logout`.
2. **Middleware** — `platform/frontend/middleware.ts` +
   `app/_lib/webui-sso.ts`: when `ULTRA_WEBUI_SSO=1`, the resolver verifies
   the platform JWT (via `jose`, same `ULTRA_AI_JWT_SECRET`) from the cookie
   or an `Authorization: Bearer` header, then injects `x-ultra-user-email` /
   `x-ultra-user-name` / `x-ultra-user-role` on WebUI paths.
3. **WebUI trusted-header signin** — Open WebUI does NOT auto-auth per
   request. Its SPA calls `POST /api/v1/auths/signin`; only on that call do
   the `WEBUI_AUTH_TRUSTED_*` headers matter — WebUI provisions the user
   (email/name/role) and returns its own session JWT (`auth_method:
   trusted_header`), which the SPA then uses for all `/api/v1/*` calls.

**Two auth layers — do not conflate them:**
- Platform session (`ultra_session`) = who you are on Ultra-AI.
- WebUI session (WebUI JWT) = WebUI's own API credential.
Middleware therefore: injects trusted headers when a platform identity
resolves; passes `/api/v1/*`, `/oauth/*`, `/ws/*` through untouched when it
doesn't (WebUI enforces its own auth — its Bearer tokens are not platform
JWTs); redirects page/asset paths (`/webui`, `/_app`, `/static`, manifest,
favicon) to `/login` when unauthenticated.

**Verified live (2026-11-21):** register → `/api/auth/login` sets cookie →
`/api/auth/me` returns identity → `POST /api/v1/auths/signin` through the
proxy returns a WebUI token for `sso-test@ultra.local` (role `user`) →
`GET /api/v1/models` with that token → 200. Without a platform session:
`/webui` → 307 `/login`, signin → WebUI "no trusted header" rejection.

**Deployment envs:**
- Frontend: `ULTRA_WEBUI_SSO=1`, `ULTRA_AI_JWT_SECRET` (must equal
  core-api's secret; `.env.local` carries the dev fallback locally).
- WebUI container: `WEBUI_AUTH=true` + `WEBUI_AUTH_TRUSTED_EMAIL_HEADER` /
  `WEBUI_AUTH_TRUSTED_NAME_HEADER` / `WEBUI_AUTH_TRUSTED_ROLE_HEADER`
  (commented in compose until rollout is intentional).

**Exposure rule:** the `open-webui` port is bound to `127.0.0.1:8080`
only. Do NOT publish it on all interfaces — direct `:8080` access bypasses
the Next.js middleware, and trusted-header auth has no proxy check, so
anyone who can reach the port could spoof `x-ultra-user-*` headers. The
middleware is the auth boundary; WebUI must stay behind it.

Dev escape hatch: `ULTRA_WEBUI_SSO_DEV_IDENTITY=1` +
`ULTRA_DEV_SSO_EMAIL` bypasses JWT verification — local testing only,
never in shared/production environments.

## Theme

`control/config/docker/open-webui/custom.css` (mounted into the container)
carries the Ultra dark theme tokens (`--ultra-bg-*`, `--ultra-accent*`) and
is served through the proxy at `/static/custom.css`.

## Platform tools (Open WebUI Functions)

`control/config/docker/open-webui/functions/ultra_ai_tools.py` is mounted
into the container at `/app/backend/data/functions` and calls the core-api
(`ULTRA_CORE_API`, default `http://host.docker.internal:4000`) so chat can
reach Ultra AI surfaces directly: agent teams, model families, apps,
engines, Hermes state and n8n workflows.

Enable it per workspace: Admin Panel -> Functions -> "Ultra AI Platform"
toggle on. Requires `requests` (bundled in the image).

## Model providers (R6b)

Two OpenAI-compatible providers are registered in WebUI's `config` table
(`openai.api_base_urls` + `openai.api_keys`, parallel arrays — DB-managed,
not env). Both reach the container via `host.docker.internal`:

| Provider | URL | Model ids | Upstream |
|---|---|---|---|
| OmniRoute | `http://host.docker.internal:20128/v1` | `auto/*` combos (~100) | gateway `external/github-forks/OmniRoute` (webpack dev mode; better-sqlite3 rebuilt for Node 24 — see note below) |
| Hermes bridge | `http://host.docker.internal:8642/v1` | `hermes` | `platform/services/hermes-openai-bridge` (`HERMES_UPSTREAM_URL` decides the real backend; MockProvider default) |

Verified live: `GET /api/v1/models` lists 100 models including `hermes`.

**OmniRoute launch note (R25):** dev server must run with webpack —
`turbopack` breaks `better-sqlite3` (`MODULE_NOT_FOUND ./db/omp` →
`Database closed` fatal). Use `OMNIROUTE_USE_TURBOPACK=0` with
`scripts/dev/run-next.mjs dev`; if SQLite fails again, rebuild
better-sqlite3 for the active Node ABI (`npm rebuild better-sqlite3`).

**Locale/theme:** admin user `locale` set to `ar` in `webui.db`; the
Ultra theme is `custom.css` (dark gray + orange tokens) served at
`/static/custom.css` and auto-applied by WebUI.

Feature pages (`/models`, `/customers`, `/brain-stack`, `/settings`,
`/agent-os`) remain Ultra AI routes; chat-side access is via the tools
above plus the `/webui` iframe shell (ADR-003).
