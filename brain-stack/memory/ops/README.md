# brain-stack/memory/ops — Live Operations Memory

Owner decision (layout-map.yaml): `memory/` project-level ops memory lives here, NOT at repo root. Root `memory/` never existed post-WP-0.

## Contents
- `project-map.md` — canonical repository map reflecting the post-WP-0/WP-0b layout. **First file any agent should read** when navigating the repo.

## Related memory homes
- `../planning/` — planning-phase memory (facts, decisions+ledger, glossary, contradictions, timeline, sources, coverage). Frozen research corpus from the v2 build study.
- `../diagrams/` — Mermaid diagram registry (116 diagrams, `graphs/registry.json`).

## Conventions
- English. Append-only. Cite path+line for repo claims.
- Record ops events (verification results, migration steps, incident notes) here, not in planning/.
