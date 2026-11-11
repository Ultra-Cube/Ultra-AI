# ADR-0001 — Crew runtime: Hermes Agent + Claude Code (hybrid)

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** Owner (Fadhel) via Question Card G-0.1
- **Context:** The build crew A00–A15 needs a runtime. Hermes Agent (Nous Research, MIT) is the intended platform brain; Claude Code is the available implementation agent.
- **Decision:** Hybrid — Hermes Agent supplies memory, skills, reasoning and orchestration semantics; Claude Code (and compatible agents) execute implementation tasks. The plugin `ultra-ai-v2/plugin/ultra-ai-builder/` stays runtime-neutral so either engine can load it.
- **Alternatives:** Hermes only; Claude Code only.
- **Consequences:** Skill/agent/command formats must be portable (agentskills.io `SKILL.md`, runtime-neutral `AGENTS.md`). Plugin manifest must be verified against chosen runtime docs at build time.
