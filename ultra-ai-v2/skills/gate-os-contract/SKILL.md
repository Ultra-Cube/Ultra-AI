---
name: gate-os-contract
description: Define the versioned Gate-OS integration contract: capability discovery, environment switching hooks, AI-adaptive surface; contract tests. Never modify Gate-OS.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/gate-os-bridge/ + contracts/gate-os/ (A12), phase P3.

## Ultra-AI context
- Gate-OS verified spec (F8): one adaptable edition, seven switchable environments — Everyday, Gaming, Dev, Design, Media, Security, Business — no reboot, AI-adaptive powered by Ultra AI (github.com/Ultra-Cube/Gate-OS).
- Contract surface from system-architecture.md: authenticate, syncUserPreferences, syncWorkspaces, pushNotifications, requestSystemResources. Current repo has Gata-OS (sic) as MOCK only.
- Hard rule: Gate-OS remains UNCHANGED in current scope — we build to the contract, they adopt later. .github/copilot-instructions.md confirms "runs on Gate-OS" framing.
- Phase P3 = Gate-OS readiness gate; signed-event outbox is the likely transport. Facts: ultra-ai-v2/memory/facts/planning.yaml (F8), ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md.
