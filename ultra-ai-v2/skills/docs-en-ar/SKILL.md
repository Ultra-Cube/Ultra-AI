---
name: docs-en-ar
description: Write and maintain English repo docs plus Arabic owner-facing summaries; Question Cards bilingual; consistent terminology via glossary.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Docs work (A15); owner reports; release notes.

## Ultra-AI context
- Directive 9: UI is bilingual AR/EN from first screen; repo docs stay English; Question Cards = English + one-line Arabic.
- ai-core already has Arabic intent keywords + English (packages/ai-core) — extend, don't restart.
- RTL requirement flows into adaptive-ui-spec and i18n-rtl skills; ZeroAI docs are English-only by design (wsl-ai-stack/ZeroAI rule) — that rule applies to that subtree only.
- No i18n framework chosen yet for apps/web (Next.js 14) — decision needed in P2 desktop/web phase. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md.
