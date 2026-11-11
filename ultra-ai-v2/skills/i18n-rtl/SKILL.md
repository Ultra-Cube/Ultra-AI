---
name: i18n-rtl
description: Internationalization with Arabic (RTL) and English from the first screen; locale files, RTL layout rules, Arabic docs where required.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
All UI work; docs for owner-facing material.

## Ultra-AI context
- Arabic is a first-class requirement: ai-core has Arabic intent keywords alongside English; UI must ship AR/EN bilingual with RTL layout from the first screen.
- ZeroAI subtree docs are English-only by its own rule — i18n applies to product UI, not that docs tree.
- RTL considerations for threejs-control-center and adaptive-ui-spec: mirrored layouts, Arabic font shaping, bidi text in chat surfaces.
- No i18n library selected — next-intl or similar decision deferred to web/desktop phase; record via ADR when chosen. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/docs-classification-batch3.md.
