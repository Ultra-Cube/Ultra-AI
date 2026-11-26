# OSS Support Scan — Ultra AI (P1.5 / R30 / R34)

> Evaluation of open-source projects that can strengthen the Ultra AI build.
> Constraint (R34): everything runs internally — no external services.
> Date: 2026-11-22 · Branch: `release/planning-study`

## Verdicts

| Project | Verdict | Rationale |
|---------|---------|-----------|
| **kiri** (container building) | **DEFER** | Useful for packaging the engine-supervisor services into OCI images, but Docker Desktop + WSL2 already covers dev runs. Revisit at packaging time (P6). Not blocking. |
| aion-ui | DEFER | React chat UI library; overlaps with our own Next.js pages. Only useful if Open WebUI theming proves insufficient. |
| web3ui | REJECT | Blockchain/Web3 components — out of scope for Ultra AI. |
| AnythingLLM / RAG stacks | DEFER | RAG covered by brain-stack skills + Ollama embeddings; evaluate at P4 skills layer. |
| LiteLLM | ADOPT (pattern) | Already vendored via OmniRoute; adopt its routing/fallback patterns, not the service. |
| Ollama | ADOPTED | Running :11434 (Windows host). |
| vLLM | DEFER | GPU-dependent; WSL box has no CUDA. Revisit on GPU host. |
| Langfuse | DEFER | Self-hostable LLM observability; heavy (ClickHouse+PG). Prometheus/Grafana already cover ops metrics. |
| n8n | ADOPTED | :5678 running, SUL-compliant connect-only. |
| Open WebUI | ADOPTED | :8080 running as target UI shell (BSD-3 branding clause respected). |
| Hermes (NousResearch) | ADOPTED | hermes-runtime in `platform/backend/`; bridge :8642. |
| OpenClaw (fadhel-sh) | ADOPTED | :18789 running (systemd). |
| OmniRoute | ADOPTED | :20128 running. |
| AirLLM | PENDING | pip install queued in P2.9; large-model CPU inference. |
| Obsidian | DETECT-ONLY | Proprietary — never bundled; runtime detection only. |
| OpenManus | DEFER | MIT agent framework; Hermes already fills the agent role. |
| Grafana + Prometheus | ADOPTED | Docker stack :3001/:9090. |
| Directory-Control-Systems | ADOPTED | Integrated in P10; README repaired. |

## kiri detail (R30)

`kiri` is a container-image builder aimed at reproducible OCI packaging.
**Decision: DEFER** — not adopted now.

- Why not adopt: Ultra AI currently runs services natively (systemd/setsid)
  and via `docker-compose` for observability. Adding a second image
  pipeline duplicates effort.
- When to revisit: Phase P6 release packaging, or if we need to ship
  the engine-supervisor catalog as distributable containers.
- Action: keep `kiri` on the shortlist; no code changes required.

## Next scan triggers

- GPU host available → evaluate vLLM, TensorRT-LLM.
- P4 skills layer → evaluate AnythingLLM vs in-house RAG.
- Multi-tenant plans → re-check Dify license constraint (no multi-tenant).
