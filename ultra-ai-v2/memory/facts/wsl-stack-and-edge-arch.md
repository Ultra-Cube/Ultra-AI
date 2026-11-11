# Facts — wsl-ai-stack/* + docs/architecture/{zero-ai-integration,ai-os-blueprint}.md

## wsl-ai-stack/README.md (live-state snapshot)
- WSL Ubuntu control plane for Ultra-AI workspace; binds OpenClaw (orchestration) + Ollama (local models) + n8n (flows) + OpenVoiceOS (voice) + Linux tools
- LIVE STATE recorded: OpenClaw → ollama/gemma4:latest; kimi-k2.5 alias → moonshot/Kimi-K2.5; Node.js present; Docker NOT installed in distro; passwordless sudo for user pc
- Scripts: bootstrap-wsl-ai.sh, openclaw-bridge.sh, setup-airllm.sh, setup-n8n.sh, setup-voice.sh, voice-sample.sh, voice-bridge.sh; n8n/openclaw-starter-flow.json; runtime/ for state
- Control path: assistant → agent → model → tools; OpenClaw = main control plane, n8n = explicit flows, Linux tools = execution surface
- OpenVoiceOS recommended voice base (Mycroft archived/read-only)

## wsl-ai-stack/PLAN.md (6-phase build, mostly done)
- Phase1 Baseline ✅ | Phase2 Planner/flow ✅ | Phase3 Voice ✅ | Phase4 Tooling (partial: Linux wrappers ❌, recovery path ❌) | Phase5 Validation (partial: bash -n ❌, n8n launch ❌) | Phase6 Model tracks ✅ + AirLLM GPU lane ✅
- Acceptance criteria mostly met except Phase4/5 leftovers

## docs/architecture/zero-ai-integration.md
- "Source of truth for the edge-cloud relationship until implementation starts"
- Edge-first rule: ZeroAI input → local resolve → OpenClaw routes (local model | n8n | local tools | Ultra AI escalation)
- Routing rules 1-5: local-first for private/simple/device-bound; local model for reasoning without remote scale; n8n for repeatable workflows; Ultra AI only for distributed compute/shared services/cloud; NEVER bypass OpenClaw for direct model selection
- UI strategy: Open WebUI primary OR LocalAI lighter path; UX stays ZeroAI-controlled
- Versioning: Ultra AI = network-platform line; ZeroAI = local assistant line; merged docs describe co-evolution
- STATUS: superseded-in-direction by ADR-0001 (Hermes runtime) but routing/escalation principles carry forward

## docs/architecture/ai-os-blueprint.md
- Vision: Ultra AI evolving into full "AI operating system"; ZeroAI = local operator + professional panel for engineers/operators
- Dual mode: Simple (end users) + Professional (command center: routing, agent health, workflows, reasoning traces)
- Runtime layers: Ingress (voice/text via ZeroAI, sanitize+record) → Routing (OpenClaw bridge = default policy engine, trace every route) → Automation (reusable workflows, run endpoints, status+trace) → Observability (health snapshots for OpenClaw/n8n/local model/network, memory+trace history)
- API surface: GET /zeroai/{state,memory,workflows}, POST /zeroai/message, POST /zeroai/workflows, POST /zeroai/workflows/:id/run
- State: durable JSON state file for memory/workflows/agent-health/traces (MASTER_ARCHITECTURE notes plan to move to Postgres + auth)
- Next milestones listed: role-based workspaces, more provider/tool adapters, trace timeline/event stream, auth + multi-user workspaces
