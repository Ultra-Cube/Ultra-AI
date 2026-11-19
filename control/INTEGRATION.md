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
# Control Plane — Directory-Control-Systems

`control/directory-control-systems/` is the vendored control tool for Ultra-AI
(upstream: https://github.com/Ultra-Cube/Directory-Control-Systems).

## Layout

- `directory-control-systems/` — the tool itself (Node.js, zero-build).
- `distribution`, `environments`, `infrastructure`, `platform` — symlinks to the
  repo-root trees so the controllers operate on the real project layout.
- `compliance/`, `config/`, `operations/`, `policies/`, `templates/`,
  `workflows/` — governance trees consumed by the platform.

## Usage

    cd control/directory-control-systems
    node main.js directory status     # aggregate status of all controllers
    node main.js system check         # health-check all controllers
    node main.js environment status   # env switch/validate/sync/backup
    node main.js distribution status  # releases/assets/templates
    node main.js infrastructure status
    node main.js platform status

## Syncing upstream updates

    git clone https://github.com/Ultra-Cube/Directory-Control-Systems.git /tmp/dcs
    rsync -a --delete --exclude .git /tmp/dcs/ control/directory-control-systems/

Re-apply local patches after sync (see git log for this directory).

## Local patches applied (v2.1.0)

- `main.js` rewritten (upstream file was corrupted/duplicated) — clean
  dispatcher over the four controllers.
- `package.json`: repo URLs fixed to Directory-Control-Systems, engines `>=20`.
- `environments-controller.js`: MongoDB defaults replaced with Postgres
  (`postgresql://localhost:5432/ultra_ai_*`), log prefix `ultra-ai-`.
