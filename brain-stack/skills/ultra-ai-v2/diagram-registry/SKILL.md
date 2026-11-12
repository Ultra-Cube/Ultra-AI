---
name: diagram-registry
description: Extract Mermaid blocks to .mmd files, validate syntax, and emit machine-readable graph JSON so the AI can query connections.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
S2 diagram extraction; redrawing corrected v2 diagrams.

## Procedure
1. Extract each mermaid block to brain-stack/memory/diagrams/<doc>__<n>.mmd.
2. Validate syntax (mermaid parser / mmdc); baseline: 116 valid, 1 invalid (.github/copilot-instructions.md block #1 - arrow chain, not a diagram; keep original, re-express in brain-stack/memory/diagrams/v2/).
3. Emit brain-stack/memory/diagrams/graphs/<id>.json: nodes, edges, labels, source.
4. Redraw corrected Technical Spec diagrams into brain-stack/memory/diagrams/v2/.
5. Register every diagram with status in the registry.

## Verification
- 117/117 extracted; every extracted/redrawn diagram syntax-valid.
- Graph JSON queryable: 'what connects to X' returns edges.

## Failure modes
- Modifying source .md; invalid Mermaid committed; graphs not machine-readable.

## References
- ULTRA_AI_V2_TECHNICAL_SPEC.md (9 corrected diagrams); fact F11

## Ultra-AI context
- Registry built: brain-stack/memory/diagrams/graphs/*.json — 116 Mermaid diagrams extracted from the 113-md corpus, each linked to source file with type + node/edge stats.
- Type distribution: graph:TB 53, graph:LR 31, sequenceDiagram 6, gantt 13, pie 5, timeline 3, journey 4, graph:TD 1.
- One invalid block: .github/copilot-instructions.md mermaid #1 (F11); user-journeys.md block 13 was extracted manually to diagrams/docs_ux-design_user-journeys__13.mmd.
- Registry is the AI-operable index for S4 implementation — query it before redrawing architecture. Facts: brain-stack/memory/planning/facts/planning.yaml (F11), memory/coverage.md.
