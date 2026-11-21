# Sidecar Update Runbook

Rule: dashboard controls these apps; **upstream stays the source of truth**. Never vendor their code into `platform/`. All entries are pinned — update = bump pin → contract/health check → commit.

| App | Upstream | Pin location | Health probe | Embed URL |
|---|---|---|---|---|
| n8n | github.com/n8n-io/n8n | compose image tag | `GET /healthz` @ :5678 | `/automation` (iframe) |
| Open WebUI | github.com/open-webui/open-webui | compose image tag | `GET /health` @ :8080 | `/chat` (iframe/panel) |
| Grafana | github.com/grafana/grafana | compose image tag | `GET /api/health` @ :3001 | `/integrations` embed |
| OmniRoute | github.com/Ultra-Cube/OmniRoute | version file/manifest | `GET /health` @ :20128 | `/gateway` status + proxy |
| Hermes | hermes agent runtime | compose image tag | `GET /health` @ :9119 | `/studio` embed |
| Obsidian | obsidian.md (Local REST API plugin) | plugin version note | `GET /` @ :27123 | vault REST proxy only |

## Update procedure (per app)
1. Check upstream releases: `gh release list -R <owner/repo>` or image tags.
2. Bump the pin (compose `image:` tag or version constant).
3. `npm run docker:dev` (or restart the sidecar), then probe `healthPath`.
4. Open the dashboard page — status must go online without console errors.
5. Commit `chore(sidecars): bump <app> to <version>` and push.
6. If the app's API surface changed, update `app/api/apps/catalog.ts` (`apiBase`, `healthPath`) and re-run the route checks.

## Honest offline states
If `healthPath` fails, every UI surface must show `offline`/`degraded` — never fabricate availability. This is enforced by the catalog probe + gateway graceful degradation (commit b7d7f055).
