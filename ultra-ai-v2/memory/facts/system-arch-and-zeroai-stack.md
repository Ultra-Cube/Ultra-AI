# Facts — docs/architecture/system-architecture.md + wsl-ai-stack/ZeroAI/*

## docs/architecture/system-architecture.md
- North-star vision: hybrid centralized-intelligence + distributed-processing platform
- Layers: User Layer (Web/Mobile UI, AdaptiveUI, WorkspaceManager, ZeroAI local control, CLI, APIs) → Intelligence Layer (AICore, NLP, TaskPlanner, ModelRouter, ModelGateway, ToolRecommender) → Orchestration (Orchestrator, ChunkManager, NetworkManager, ResultAggregator) → Distributed Network (volunteer nodes) → Blockchain Layer (Rewards, Governance, IPFS) → Data Layer (Postgres, Mongo, Redis, S3)
- Adaptive Interface Subsystem: role-aware workspaces (video-designer/developer/researcher/marketer/custom), interaction telemetry, manual overrides, safe rollback; AdaptiveWorkspaceProfile TypeScript interface defined
- ModelGatewayPolicy: providers openai|anthropic|local|custom; routing modes quality/cost/latency/hybrid; ProviderManager.selectOptimalProvider
- ZeroAI local control surface: STT via transcribe-audio.py + voice-bridge.sh; memory via packages/api/src/services/zeroai/zeroai-store.ts; UI apps/web/app/zeroai/page.tsx; workflows via routes/workflows.routes.ts
- Distributed network node reqs: min 4GB RAM/2 cores/10GB; recommended 8GB/4 cores/50GB; 10Mbps+; WebRTC + AES-256-GCM + heartbeat
- Security model: client-side encryption → chunking → distribution → isolated processing → result encryption → aggregation; auth/authz/transport-encryption/ZK-proofs
- API surface (REST): auth/*, ai/*, zeroai/* (6 endpoints), n8n/workflows CRUD+execute, network/*, user/*; GraphQL types User/Task/NetworkNode; wallet field on User (blockchain deferred)
- Perf targets: API <200ms p95, task <30s, node latency <100ms, 99.9% uptime, 1000+ concurrent tasks, linear to 10k+ nodes
- Infra: K8s deployment spec, Prometheus+Grafana, ELK, Jaeger, PagerDuty; multi-region NA/EU/APAC/ME
- Gata-OS (sic — actually Gate-OS) integration interface: authenticate/syncUserPreferences/syncWorkspaces/pushNotifications/requestSystemResources
- Implementation phases (historical): P1 core infra ✅ claimed, P2 distributed network in progress, P3 advanced (multi-provider routing, Gate-OS integration, analytics, mobile, enterprise)
- NOTE: doc is aspirational (blockchain, wallet, rewards) — conflicts with deferred-chain decision; treat as future-state, not current scope

## wsl-ai-stack/ZeroAI/MEMORY_DESIGN.md
- Memory goals: recent convos, task outcomes, user prefs, tool-usage recall, long-term improvement
- 3 layers: short-term (conversation window), long-term (prefs/workflows/behavior tuning), task memory (commands/failures/tool runs/workflow history)
- Suggested OSS stack: SQLite (durable local) + Qdrant (vector search) + Mem0 (agent memory mgmt)
- Principle: local-first, offline-capable; network must not be hard dependency

## wsl-ai-stack/ZeroAI/MODEL_STACK.md
- Default lane: ollama/gemma4:latest; local inference Ollama-first
- Future lanes: Kimi alias, AirLLM GPU lane
- Selection rule: Ollama for local WSL loop; OpenClaw = routing layer; swap model backend without changing ZeroAI contract; new providers only if they fit same control contract

## docs/architecture/distributed-processing.md
- Volunteer-node compute network is a DOWNSTREAM capability: ZeroAI local-first → OpenClaw/n8n → escalate only for distributed compute/shared services
- Flow: User→ZeroAI→OpenClaw→Orchestrator→ChunkManager(encrypt)→parallel nodes→Aggregator→OpenClaw→ZeroAI→User; rewards via blockchain (DEFERRED)
- ChunkingStrategy: semantic|random|functional; SecureChunker encrypts chunks, sanitizes metadata, checksums
- Privacy layers: ZK proofs, homomorphic enc, differential privacy, MPC; ZeroAI Edge Gate = only escalate required data, sanitize prompts, keep voice/workflow metadata on-device
- Node: ProcessingNode capabilities (cpu/ram/storage/gpu/bandwidth/models/specializations), reputation, earnings; NodeManager registers + health reports + task listening
- RewardCalculator: baseReward × performanceMultiplier(speed/quality/reliability) × bonuses; Solidity UltraAIRewards contract sketched (onlyOracle distributeRewards)
- TaskOrchestrator: analyze requirements → select nodes (capabilities, minReputation, geoDistribution, redundancyFactor 1.5) → plan → execute
- QA: checksum validation → cross-node verification → statistical analysis → consensus → quality score → accept/reject
- Caching: node→network(IPFS)→global LRU; task-signature keyed
- Network growth table: 1k nodes@6mo → 50k@24mo; targets: <100ms latency, 95% SLA, 99.9% uptime, rewards <1h
- 4 regional hubs: NA/EU/APAC/ME mesh

## wsl-ai-stack/ZeroAI/README.md
- Zero = voice ingress; OpenClaw = router/control plane; Ollama = default backend; AirLLM = future heavy lane; n8n = visible flows; Linux tools = execution
- UI: Open WebUI (quickest) or LocalAI (tighter serving); focus local status/task control/memory visibility/workflow confirmation
- Goals: English docs, WSL-only assistant, NO direct fallback replies in Zero, straight into OpenClaw, model selection behind OpenClaw, extensible tools
- Intent: fold older UltraAI work into same execution model later
- Start: `cd wsl-ai-stack && bash ./scripts/start-zeroai.sh`

## ZeroAI/ARCHITECTURE.md
- Closed offline-first WSL system; English-only docs enforced
- Layer model: Voice UI → Speech-to-Text → Brain+Memory → OpenClaw → Model Layer(Ollama/AirLLM) | Workflow(n8n) | Tools/Apps | Ultra AI Cloud Bridge
- STT candidates: Whisper, faster-whisper, Vosk (PocketSphinx rejected — too inaccurate)
- Memory candidates: Mem0, Qdrant, SQLite-backed; brain layer decides answer/delegate/tool/escalate
- OpenClaw = single control plane; NO direct model selection bypass
- ZeroAI = device-local assistant; Ultra AI = distributed platform called when shared services needed; edge handles local first
- UI: Open WebUI fastest polished; LocalAI lighter serving-oriented
- Voice base candidate: OpenVoiceOS
- Principle: adapt UltraAI components to ZeroAI control flow, not blind copy

## ZeroAI/AGENT_LAYER.md
- No separate public persona; internal agent layer behind Zero+OpenClaw decides: answer/model/tool/app/n8n/agentic-workflow
- NOT a second user surface; classifies requests, chooses agent vs inference, tracks task state, updates memory
- Shape: lightweight Python/shell router + memory-backed policy + tool registry + OpenClaw bridge

## ZeroAI/FLOW.md
- Sequence: User→Zero→OpenClaw→Ollama(+n8n,Tools)→result→Zero speaks
- Rules: Zero = transport only (no canned fallbacks), OpenClaw routes, Ollama generates, n8n visible/reusable, WSL-local unless explicit bridge
- New tools must go behind OpenClaw, never hard-wired into Zero

## ZeroAI/MEMORY_DESIGN.md
- 3 memory layers: short-term (conversation window), long-term (preferences/workflows/tuning), task memory (commands/failures/tool runs)
- OSS stack: SQLite durable records + Qdrant vector search + Mem0 agent memory management
- Local-first/offline-capable; no network hard-dependency for core assistant behavior

## ZeroAI/MODEL_STACK.md
- Default: `ollama/gemma4:latest` via Ollama; future lanes: Kimi alias, AirLLM GPU lane
- Rule: prefer Ollama local → OpenClaw routes → swap backend w/o changing Zero → new providers only if same control contract

## ZeroAI/ROADMAP.md (phases)
- P1: clean scaffolding, English docs, arch capture, versioned checkpoint
- P2: offline STT eval, memory store, clean UI entrypoint, OpenClaw routing w/o fallbacks
- P3: tool wrappers for local apps, n8n workflows, model selection/fallback policy
- P4: AirLLM integration, merge UltraAI into ZeroAI control model, WSL-testable

## ZeroAI/UI_DESIGN.md
- UI = control surface only; Zero handles orchestration behind it
- Goals: start/stop, status, voice state, routing state, memory/task history, n8n visibility, local-vs-cloud routing visibility, confirmations for sensitive actions, offline-usable
- Shape: lightweight local web app/desktop launcher; Open WebUI or LocalAI first; single input box, voice button, status cards (OpenClaw/Ollama/n8n/tools), task log
- P1 priorities: health status, voice+text w/ routing feedback, memory visibility, n8n workflow visibility, tool launch+confirmations

## ZeroAI/OPEN_SOURCE_OPTIONS.md (candidate matrix)
- STT: Whisper / faster-whisper / Vosk | Memory: Mem0 / Qdrant / SQLite | UI: Open WebUI / custom launcher | Orchestration: n8n | Voice base: OpenVoiceOS | Runtime: Ollama / AirLLM
- Selection criteria: local execution, offline support, maintainability

## wsl-ai-stack/README.md
- Control plane = OpenClaw; model = Ollama (`ollama/gemma4:latest`); n8n = visual planner; OpenVoiceOS preferred voice base (Mycroft Core archived → rejected)
- Live state: OpenClaw configured w/ ollama/gemma4 + `kimi-k2.5` alias → moonshot/Kimi-K2.5; Node.js present; Docker NOT installed in distro; passwordless sudo for user pc
- Model tracks in MODELS.md; GPU lane AirLLM.md; scripts: bootstrap-wsl-ai, openclaw-bridge, setup-airllm, setup-n8n, setup-voice, voice-sample, voice-bridge; n8n starter flow JSON

## wsl-ai-stack/PLAN.md
- Goal: OpenClaw=agent shell, Ollama=local model, n8n=visible planning/routing, OpenVoiceOS=voice, Linux tools=execution surface
- P1 baseline DONE; P2 planner/n8n DONE; P3 voice DONE; P4 tooling PARTIAL (tool wrappers + recovery path pending); P5 validation PARTIAL (bash -n, n8n launch pending); P6 model tracks + AirLLM lane DONE
- Acceptance gates per phase recorded

## wsl-ai-stack/FLOW.md
- Layer contract: OpenClaw=control plane, model layer swappable behind it, n8n=visible/repeatable tool use, Linux tools=execution surface
- Current path: WAV/typed → voice-bridge → PocketSphinx STT → OpenClaw → model alias → n8n → tools → TTS/console
- WSL exposes no live microphone; WAV sample is first reliable path

## wsl-ai-stack/MODELS.md
- Repos: AirLLM=github.com/Fadhel-SH/Tools-GPU-AI_airllm; Kimi=github.com/Fadhel-SH/AI-Model_Kimi-K2.5
- Kimi alias `kimi-k2.5`→`moonshot/Kimi-K2.5` = provider-profile handoff point
- Selection rule: Ollama local loop / AirLLM low-VRAM large models / Kimi agentic multimodal when backend ready; control path unchanged

## wsl-ai-stack/VOICE.md
- OpenVoiceOS (ovos-core) preferred; Mycroft archived→rejected
- Fallback chain: WAV sample→PocketSphinx→OpenClaw→espeak-ng TTS; headless text path retained

## wsl-ai-stack/AIRLLM.md
- AirLLM = GPU memory-optimized lane behind OpenClaw control plane; same voice/shell bridges route into Ollama or AirLLM by model path
- Env knobs: AIRLLM_MODEL (HF id), AIRLLM_COMPRESSION (none/4bit/8bit), AIRLLM_DRY_RUN=1
- setup-airllm.sh creates runtime/airllm/.venv + checks nvidia-smi
