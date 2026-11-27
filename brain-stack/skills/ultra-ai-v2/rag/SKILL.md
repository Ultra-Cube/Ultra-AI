<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub Org: github.com/Ultra-Cube                                        ║
║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

---
name: rag
description: Retrieval-Augmented Generation platform skill — document ingestion, chunking, embeddings, vector search, and grounded answer generation wired to the Ultra AI model gateway.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Building or operating any retrieval-augmented feature: knowledge bases, doc Q&A, brain-stack memory retrieval, customer-gate document search.

## Ultra-AI context
- Ingestion pipeline: `brain-stack/skills/ultra-ai-v2/doc-ingestion` covers document intake; pair with this skill for the retrieval half.
- Model routing: embed + generate through the model-gateway (`platform/services/model-gateway`) so family policy (LLM/SLM/MoE) and data-classification rules apply automatically.
- Memory surfaces: brain-stack memory (`brain-stack/memory/`) and Obsidian vault (detect-only, R26) are the primary corpora; never index secrets or `.env*` files.
- Privacy: `allowedDataClasses` on the chosen ModelEntry decides whether `sensitive`/`regulated` content may leave the local Ollama path — check before routing internal docs to cloud providers.

## Procedure
1. **Corpus selection** — pick source dirs; exclude secrets, `node_modules`, `.git`, binary blobs.
2. **Chunking** — semantic chunks ~400–800 tokens with 10–15% overlap; keep metadata (path, section, updatedAt).
3. **Embeddings** — route through model-gateway embedding-capable entries; store vectors in the project vector store (HNSW).
4. **Retrieval** — hybrid search (dense + BM25) with MMR rerank; top-k=5 default, expose k as a policy knob.
5. **Generation** — inject retrieved chunks as cited context; require source attribution in output; fall back to parametric-only answer flagged as ungrounded when retrieval is empty.
6. **Evaluation** — run the `evals` skill on a fixed query set before promoting a corpus change.

## Guardrails
- Never send `regulated` data to non-local providers.
- Log every retrieval+generation pair for audit (`signed-event-outbox` pattern).
- Citations are mandatory; uncited answers must be marked.
