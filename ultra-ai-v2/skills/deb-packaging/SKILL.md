---
name: deb-packaging
description: Build Debian packages for Linux deployment: control files, dependencies, sidecar bundling, repo/policy compliance.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Linux packaging for desktop app and Gate-OS readiness.

## Ultra-AI context
- Distribution targets: Linux + Windows desktop (phases P2+). .deb is the Linux lane; Windows lane TBD (MSI/NSIS via electron-builder or Tauri — undecided, open question).
- Current runtime reality: no services/ dir despite root scripts referencing it; embedded-postgres (pgtool) is the working dev DB, docker-compose Postgres secondary — BUILD_PLAN.md.
- Verification bar before packaging: npm run lint + type-check + build + test (409 tests baseline) + scripts/preservation.sh verify-additive. Facts: ultra-ai-v2/memory/facts/root-docs-build-state.md, ultra-ai-v2/memory/facts/planning.yaml (F3).
