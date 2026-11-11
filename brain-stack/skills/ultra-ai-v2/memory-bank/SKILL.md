---
name: memory-bank
description: Maintain the Memory Bank: facts/*.yaml, decisions/ADR-*.md + ledger.md, glossary.md, contradictions.md, timeline.md, sources.jsonl, coverage.md.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Recording facts, decisions, contradictions, timeline events; answering 'what do we know'.

## Layout
ultra-ai-v2/memory/facts/<domain>.yaml - id, statement, status (IDEAL/SPEC/STUB/WORKING/VERIFIED), source, source_sha256, confidence, tags.
ultra-ai-v2/memory/decisions/ADR-NNNN-slug.md - context, decision, alternatives, consequences, status.
ultra-ai-v2/memory/decisions/ledger.md - every Question Card answer.
ultra-ai-v2/memory/glossary.md - disambiguation (Hermes agent vs monitoring, ZeroAI, Gate-OS, Ultra Core).
ultra-ai-v2/memory/contradictions.md - both citations + resolution.
ultra-ai-v2/memory/timeline.md - dated events.
ultra-ai-v2/memory/sources.jsonl - one line per ingested file.
ultra-ai-v2/memory/coverage.md - script-generated, never hand-edited.

## Rules
- Hermes compact memory files (MEMORY.md, USER.md) are pointers into the bank, never the store.
- Every fact cites a path or URL+date; unknown = UNVERIFIED.
- Plan contradictions resolved via ADR, not silent deviation.

## References
- ULTRA_AI_SUPER_PROMPT.md App. F

## Ultra-AI context
- ultra-ai-v2/memory/ is the persistent memory bank: facts/ (7 extraction files + planning.yaml F1–F11), decisions/ (ADR-0001/0002 + ledger), glossary.md, contradictions.md (10 entries), timeline.md, sources.jsonl, coverage.md, notes/.
- ZeroAI MEMORY_DESIGN target: 3 layers — short-term conversation window, long-term prefs/workflows, task memory (commands/failures/tool runs); suggested stack SQLite + Qdrant + Mem0; local-first, offline-capable.
- Hermes Agent will own runtime memory; this memory/ tree is the project-knowledge layer feeding it — keep both, link via facts files.
- Naming: avoid clashing with monitoring "Hermes" and with .devin/skills memory packs — this is project memory, not agent runtime memory. Facts: ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md, ultra-ai-v2/memory/facts/zeroai-architecture.md.
