---
name: memory-bank
description: Maintain the Memory Bank: facts/*.yaml, decisions/ADR-*.md + ledger.md, glossary.md, contradictions.md, timeline.md, sources.jsonl, coverage.md.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Recording facts, decisions, contradictions, timeline events; answering 'what do we know'.

## Layout
brain-stack/memory/planning/facts/<domain>.yaml - id, statement, status (IDEAL/SPEC/STUB/WORKING/VERIFIED), source, source_sha256, confidence, tags.
brain-stack/memory/planning/decisions/ADR-NNNN-slug.md - context, decision, alternatives, consequences, status.
brain-stack/memory/planning/decisions/ledger.md - every Question Card answer.
brain-stack/memory/planning/glossary.md - disambiguation (Hermes agent vs monitoring, ZeroAI, Gate-OS, Ultra Core).
brain-stack/memory/planning/contradictions.md - both citations + resolution.
brain-stack/memory/planning/timeline.md - dated events.
brain-stack/memory/planning/sources.jsonl - one line per ingested file.
brain-stack/memory/planning/coverage.md - script-generated, never hand-edited.

## Rules
- Hermes compact memory files (MEMORY.md, USER.md) are pointers into the bank, never the store.
- Every fact cites a path or URL+date; unknown = UNVERIFIED.
- Plan contradictions resolved via ADR, not silent deviation.

## References
- ULTRA_AI_SUPER_PROMPT.md App. F

## Ultra-AI context
- brain-stack/memory/planning/ is the persistent memory bank: facts/ (7 extraction files + planning.yaml F1–F11), decisions/ (ADR-0001/0002 + ledger), glossary.md, contradictions.md (10 entries), timeline.md, sources.jsonl, coverage.md, notes/.
- ZeroAI MEMORY_DESIGN target: 3 layers — short-term conversation window, long-term prefs/workflows, task memory (commands/failures/tool runs); suggested stack SQLite + Qdrant + Mem0; local-first, offline-capable.
- Hermes Agent will own runtime memory; this memory/ tree is the project-knowledge layer feeding it — keep both, link via facts files.
- Naming: avoid clashing with monitoring "Hermes" and with .devin/skills memory packs — this is project memory, not agent runtime memory. Facts: brain-stack/memory/planning/facts/system-arch-and-zeroai-stack.md, brain-stack/memory/planning/facts/zeroai-architecture.md.
