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
║ GitHub    : github.com/Ultra-Cube                                        ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

# Ownership headers & file integrity (Ultra AI)

## Copyright headers

`scripts/apply-copyright.mjs` stamps a hidden, per-language comment header on
tracked text files:

```
```

- Shebangs (`#!/usr/bin/env bash`) and directives (`"use client"`) stay first;
  the banner is inserted after them.
- Skipped: binaries, generated files, lockfile internals where comments are
  invalid, and third-party trees (`.devin/skills/`, `external/`,
  `external-integrations/`, `external/github-forks/`).
- Idempotent — the `[UCUBETECH-COPYRIGHT]` marker prevents double-stamping.

```bash
npm run copyright:apply   # apply / refresh headers
npm run copyright:check   # report files missing the header (dry run)
```

## File integrity guard

`scripts/file-guard.mjs` maintains `security/file-manifest.sha256` — a
SHA-256 checksum for every tracked regular file (gitlinks/submodules skipped).

```bash
npm run guard:update   # (re)generate the manifest after intentional changes
npm run guard:check    # fail on modified/missing files; report added files
```

`guard:check` **detects** unauthorized modification or deletion after the
fact — it does not prevent deletion. Real prevention requires filesystem
permissions, backups, or CI enforcement of `guard:check` on every commit.
