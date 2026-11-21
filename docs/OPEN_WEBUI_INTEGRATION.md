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

## SSO (groundwork, not yet active)

The compose file (`control/config/docker/docker-compose.yml`) has commented
`WEBUI_AUTH_TRUSTED_EMAIL_HEADER` / `WEBUI_AUTH_TRUSTED_NAME_HEADER` envs.
Trusted-header SSO requires `WEBUI_AUTH=true` plus a header-injecting
component:

1. Ultra-AI platform auth session must exist (not implemented yet — the
   frontend currently has no auth pages).
2. `platform/frontend/middleware.ts` should inject
   `x-ultra-user-email` / `x-ultra-user-name` on `/webui/*` and `/api/v1/*`
   requests for authenticated users.
3. Uncomment the trusted-header envs and re-enable `WEBUI_AUTH`.

Until then `WEBUI_AUTH=false` keeps the embedded surface open on the local
development network only — do not expose port 3000/8080 beyond localhost
without completing SSO or adding an edge auth layer.

## Theme

`control/config/docker/open-webui/custom.css` (mounted into the container)
carries the Ultra dark theme tokens (`--ultra-bg-*`, `--ultra-accent*`) and
is served through the proxy at `/static/custom.css`.
