# ADR-003: Open WebUI mount strategy

- Status: Accepted (spike outcome)
- Date: 2026-11-20
- Deciders: A00 orchestrator, owner directive (Phase 0.3)

## Context
Owner mandated Open WebUI as the dashboard base. Options: (a) Open WebUI at `/` with console as iframe/panel, (b) Next.js shell hosting Open WebUI components, (c) spike then decide.

## Decision
**Option (c) result — hybrid:** Open WebUI runs as an independently updatable sidecar (docker, pinned image, `GET /health` probe, catalog id `open-webui` in `app/api/apps/catalog.ts`). The Next.js console remains the control plane; `/chat` embeds Open WebUI via iframe/panel. Console pages are NOT rebuilt inside Open WebUI's codebase — that would fork upstream and break independent updates.

## Consequences
- Open WebUI stays updateable from upstream (sidecar-updates.md).
- Console keeps dark/orange Ultra theme; Open WebUI keeps its own UI inside its iframe boundary.
- If a future spike shows Open WebUI supports reliable panel embedding, revisit as ADR-003a — do not migrate pages into its tree.
