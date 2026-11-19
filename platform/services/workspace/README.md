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

<!--
<!--
# @ultra-ai/workspace

Embedded workspace contract for the Ultra desktop shell (P2-06, G-2.2 Option 1).

Manages agentic coding sessions (Devin-like dev surface) over the OpenHands
sidecar REST API — `openhands serve` on port 3300, supervised by
`engine-supervisor` (manifest `openhands`, health `/health`, MIT core with
`enterprise/` excluded).

## Surface

- `WorkspacePort` — port the shell implements to reach the sidecar:
  `health`, `listSessions`, `openSession`, `getSession`, `closeSession`.
- `OpenHandsWorkspaceClient` — default zero-dependency implementation
  (native `fetch`) over `/api/health` + `/api/conversations`.
- `WorkspaceSession` / `OpenWorkspaceRequest` / `WorkspaceResult` /
  `WorkspaceHealth` / `WorkspaceError` — contract types.

## Wiring

- `desktop-bridge`: `workspace.*` JSON-RPC methods delegate to a
  `WorkspacePort` (default `OpenHandsWorkspaceClient`, `ULTRA_WORKSPACE_URL`
  override).
- `core-api`: `/workspace/*` proxy routes forward to the bridge.
- Sessions carry `execution.locality = 'local'` semantics — the sidecar runs
  on the user's machine; escalation stays governed by `zeroai-edge` policy.

## Gates

```bash
npm run test        # jest
npm run lint
npm run type-check
npm run build       # tsup esm+cjs
```
