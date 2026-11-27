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

# Brain-Stack Skills Catalog — ultra-ai-v2

Platform skill pack for Ultra AI. Each entry is a directory containing `SKILL.md`
(HTML copyright banner + YAML frontmatter + procedure). Registered by
`platform/services/skill-registry` as `<dirname>@<version>` and surfaced in the
`/brain-stack` dashboard skills tab.

## Platform skills (V3-P4 — R12/R13)

| Skill | Purpose |
|-------|---------|
| `rag` | Retrieval-Augmented Generation: ingestion, chunking, embeddings, vector search, grounded answers |
| `agents` | Agent lifecycle, tool contracts, memory, multi-agent teams (Dot/Muse/GrokBot/SkillTree/AnyModelBot) |
| `ai-agent` | Single-agent craft: ReAct loops, planning, tool use, stopping rules |
| `agentic-ai` | End-to-end autonomous pipelines, orchestration, human-in-the-loop gates |
| `llmops` | Model lifecycle ops: deploy, monitor, cost control, incident response |
| `evals` | Evaluation suites: LLM-as-judge, pairwise comparison, regression gates |
| `fine-tuning` | Dataset prep, LoRA/QLoRA runs, eval gates, registry deployment |
| `guardrails` | Input/output safety filters, injection defense, PII, policy enforcement |
| `artcraft` | ArtCraft/Craft-Anything: reverse-engineer capabilities into new SKILL.md files (self-extension) |

## Core platform skills

| Skill | Purpose |
|-------|---------|
| `model-policy` | Model routing policy: tiers, data-sensitivity, fallback chains |
| `model-foundry` | Model registry/foundry operations |
| `hermes-integration` | Hermes Agent runtime integration (:9119, bridge :8642) |
| `skill-authoring` | Authoring new brain-stack SKILL.md files |
| `engine-adapter` | Engine supervisor adapter contract |
| `provider-adapters` | Model provider adapter patterns |
| `signed-event-outbox` | Auditable event outbox pattern |
| `sidecar-lifecycle` | External app sidecar lifecycle management |
| `reverse-proxy-sso` | SSO/reverse-proxy auth wiring |
| `contract-first-api` | API contract-first development |
| `doc-ingestion` | Document ingestion pipeline |
| `memory-bank` | Brain-stack memory operations |
| `diagram-registry` | Mermaid/diagram registry |
| `i18n-rtl` | Internationalization + RTL support |
| `docs-en-ar` | English/Arabic documentation sync |
| `license-audit` | License compliance auditing |
| `sbom` | Software bill of materials generation |
| `threat-model` | Threat modeling (STRIDE/PASTA) |
| `test-strategy` | Test strategy and coverage planning |
| `evidence-report` | Evidence-ladder reporting |
| `eval-harness` | EDD evaluation harness |
| `kanban-orchestration` | Kanban-based work orchestration |
| `ask-with-options` | Clarifying-questions workflow |
| `agentskills-standard` | Agent Skills specification reference |
| `preservation-guard` | Preservation/rollback guardrails |
| `gate-os-contract` | Gate-OS contract boundary |
| `plugin-packaging` | Plugin packaging conventions |
| `deb-packaging` | Debian package build conventions |
| `desktop-packaging` | Desktop app packaging |
| `adaptive-ui-spec` | Adaptive UI specification |
| `threejs-control-center` | Three.js control-center scene |
| `tos-review` | Terms-of-service review workflow |
| `adr-writing` | Architecture Decision Record authoring |

## Legacy

`brain-stack/skills/legacy/` holds pre-V3 skills kept for reference.
