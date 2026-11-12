---
name: plugin-packaging
description: Assemble the ultra-ai-builder plugin: plugin.json, skills, agents a00-a15, commands, hooks, .mcp.json, AGENTS.md. Verify manifest format against chosen runtime docs first.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Building or updating brain-stack/plugin/ultra-ai-builder/.

## Layout
.claude-plugin/plugin.json (name, version, description, author - verify format vs official docs, record URL+date)
skills/<name>/SKILL.md (full catalog App. D)
agents/a00-orchestrator.md ... a15-docs.md
commands/ultra-status.md, ultra-gate.md, ultra-verify.md, ultra-release.md
hooks/hooks.json (preservation-guard on pre-commit/pre-push)
.mcp.json (optional: filesystem, github read-only, docs lookup)
AGENTS.md (runtime-neutral copy of super prompt sections 2-3)

## Verification
- Plugin installs in a clean sandbox of the chosen runtime (evidence captured).
- Manifest format verified against current official docs (URL + date recorded).
- Existing repo skills imported unchanged and wrapped; Gate-OS/Ultra-Zone skills referenced, not copied.

## Failure modes
- Manifest format guessed; skills duplicated instead of referenced; hooks blocking legitimate work.

## References
- ULTRA_AI_SUPER_PROMPT.md App. D, App. E

## Ultra-AI context
- ultra-ai-builder plugin = 57 files: plugin.json, 33 skills, 16 agents (A00–A15), 4 commands (/ultra-status /ultra-gate /ultra-verify /ultra-release), hooks.json (preservation-guard on pre-commit/pre-push), .mcp.json, AGENTS.md.
- Design: runtime-neutral — works with Hermes Agent, Claude Code, or any AGENTS.md-compatible runtime (plugin AGENTS.md).
- Status: structure VERIFIED, skill bodies were stubs at S1 — deepened during S2b from memory/facts.
- Mirror rule: skills/ and brain-stack/skills/ultra-ai-v2/ should stay in sync; pick one canonical source when they diverge (open question for S3). Facts: brain-stack/memory/planning/facts/docs-classification-batch4.md.
