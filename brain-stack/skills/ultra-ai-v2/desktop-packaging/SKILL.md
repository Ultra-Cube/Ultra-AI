---
name: desktop-packaging
description: Package Ultra-AI as Linux + Windows desktop app: choose shell (Tauri 2 recommended pending G-2.1), sidecar bundling, auto-update, signing.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/platform/apps/desktop-ui/ work (A10), phase P2.

## Ultra-AI context
- CRITICAL fact F6: platform/platform/apps/desktop-ui-ui is NOT Electron — it is a TypeScript control-surface model (express + socket.io) with no Electron dep or window code, despite docs claiming Electron.
- Plan calls for Code-OSS/Open VS Code-based Devin-like dev experience + Electron desktop in Phase 3 — packaging skill must decide real shell (Electron vs Tauri vs neutral webview) via ADR before build.
- platform/services/voice-recognition and platform/services/memory-optimizer are stubs; desktop-ui is the only desktop-adjacent package and it is a model, not an app. Facts: ultra-ai-v2/memory/facts/planning.yaml (F6), ultra-ai-v2/memory/facts/architecture-master.md.
