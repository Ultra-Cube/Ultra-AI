# Glossary — Ultra-AI v2

| Term | Meaning | Notes |
|------|---------|-------|
| **Hermes Agent** | AI agent runtime by Nous Research (MIT). Persistent memory, skills in `SKILL.md`/agentskills.io format, MCP support, multi-platform gateway. | The owner's "Hermes" = this. NOT the repo's Prometheus/Grafana `monitoring/hermes` stack (see contradictions). |
| **Hermes (repo)** | Prometheus + Grafana monitoring stack inside this repo (`monitoring/hermes`, `/hermes` page). | Name collision with Hermes Agent — G-0.4 pending. |
| **Ultra-AI** | This repository / the AI platform product. | TypeScript monorepo (Turborepo). |
| **Ultra Core** | Separate Ultra Cube project: the blockchain platform. | Public interface UNKNOWN — do not couple; use neutral signed-event outbox (G-4.1). |
| **Gate-OS** | Ultra Cube Linux distribution: one adaptable edition, seven switchable environments (Everyday, Gaming, Dev, Design, Media, Security, Business), no reboot, AI-adaptive "powered by Ultra AI". | github.com/Ultra-Cube/Gate-OS. We prepare integration points only; never modify Gate-OS itself. |
| **ZeroAI** | Adaptive interactive interface concept referenced by owner. | Adaptive, directly interactive chat surface. |
| **OpenClaw** | Open-source agent/tool engine referenced in legacy docs as edge control plane. | Role vs Hermes brain is decision G-1.9 (pending). |
| **9router / OmniRoute** | Model routing/gateway layer (OpenAI-compatible). | Provider/model adapters candidate. |
| **n8n** | Workflow automation tool. | License restricts bundling (G-1.2 pending). |
| **Ollama** | Local LLM runtime. | Engine adapter target. |
| **Langflow / Dify / Open WebUI / OpenHands** | Automation, LLM-UI, agent-IDE engines to embed. | License rows pending in ULTRA_AI_LEGAL_LICENSING.md. |
| **Memory Bank** | `ultra-ai-v2/memory/` directory: facts, decisions, glossary, contradictions, timeline, sources, coverage. | Hermes compact memory files (MEMORY.md/USER.md) are pointers into this bank, never the store. |
| **Question Card** | Structured decision request (Class R0/R1/R2) with options instead of stopping silently. | Protocol in ULTRA_AI_SUPER_PROMPT.md §3. |
| **Task Card** | Work assignment format: ID, owner, deps, owned paths, contracts, DoD, gates, estimate, evidence. | App. C of super prompt. |
| **Status vocabulary** | IDEAL → SPEC → STUB → WORKING → VERIFIED. | Never describe aspirational work as implemented. |
| **verify-additive** | `scripts/preservation.sh` check: 0 changed, 0 deleted files vs baseline. | Gate for the planning release. |
