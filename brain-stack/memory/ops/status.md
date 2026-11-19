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

<!--
<!--
# Ops Status

- WP-0 monorepo migration: COMPLETE (verify-moves --post 58/58, lint/type-check/test green)
- WP-0b layout conformance + brain-stack promotion: this commit
- WP-2 monitoring sentinel + WP-2b expansion: COMPLETE (`infrastructure/monitoring/stack/{sentinel,hermes}`)
- v0.3.0-planning release: tagged & pushed
- S4-P1 platform core: COMPLETE — `@ultra-ai/hermes-runtime` at `platform/backend/hermes-runtime` (adapter contracts, memory, skills, ReAct reasoner, orchestrator, mock provider; tests/type-check/build/lint green)
- S4-P2 desktop surface: COMPLETE — `@ultra-ai/desktop-bridge` at `platform/devtools/desktop-bridge` (JSON-RPC 2.0 over WebSocket; sessions/tasks/memory/skills methods; runtime event broadcast; 6/6 Jest tests; lint/type-check/build green)
- S4-P3 Gate-OS readiness: COMPLETE — contract at `platform/api/contracts/gate-os/` (openapi.yaml + README, 7 environments, /v1 surface) + `@ultra-ai/gate-os-bridge` at `platform/services/gate-os-bridge` (node:http, no framework; health/capabilities/environments/profile/ui-spec/intents/events; 15/15 Jest tests; lint/type-check/build green; Gate-OS itself untouched)
- S4-P4 Ultra Core bridge: COMPLETE — `@ultra-ai/ultra-core-bridge` at `platform/services/ultra-core-bridge` (signed `ultra.event.v1` hash-chained outbox, Ed25519 signing, ULID ids, JSONL persistence, `ExportTarget` port + `MockExportTarget`; 10/10 Jest tests; lint/type-check/build green; readiness-only — no blockchain/chain features)
- ZeroAI edge contract: COMPLETE (@ultra-ai/zeroai-edge — local-first router: memory→policy→local model/tool/workflow→escalate; confirmation gate; locality visibility; 12 tests green)
- S4-P5 adapter expansion (2026-11-12): OpenAICompatibleProvider (OpenAI/Ollama/9router via baseURL) + AnthropicProvider over native fetch (commit f253822); ToolRegistry + builtin tools (echo/datetime/calculator) + HttpMCPClient JSON-RPC over fetch, zero deps (hermes-runtime: 27/27 tests, lint/type-check/build green) — repo-wide `npm run lint` (13/13), `type-check` (15/15), `test` (29/29), `build` (15/15) all green after S4-P4
- Provider adapters: COMPLETE — `@ultra-ai/hermes-runtime` gained real providers `OpenAICompatibleProvider` (OpenAI/Ollama/9router via baseURL + `providers` factories) and `AnthropicProvider` — native fetch, zero deps; 12/12 Jest tests; repo lint/type-check/test/build green
- Release packaging (2026-11-13): `distribution/scripts/package-release.mjs` — discovers workspace packages, tars each `dist/` into `distribution/assets/releases/<tag>/` + `SHA256SUMS.txt`; skips source-only (`@ultra-ai/shared`) and non-dist apps (`@ultra-ai/web` `.next`); v0.3.0 produced 14 tarballs; commit 6858799
- platform/database prisma move (2026-11-13): schema.prisma + migrations relocated to `platform/database/prisma/`; core-api package.json gained `prisma.schema` pointer; `prisma validate`/`generate` clean, 386/386 jest tests pass
- Desktop packaging (2026-11-13): distribution/scripts/package-desktop.mjs — stages desktop-ui + desktop-bridge + hermes-runtime dists into node_modules layout, emits linux/windows tar.gz bundles + launchers (bin/ultra-desktop, .cmd) + platform manifests + SHA256SUMS; v0.3.0 verified
- ZeroAI edge wiring (2026-11-13): desktop-bridge exposes zeroai.run / zeroai.trail.get / zeroai.trail.list / zeroai.routes over JSON-RPC (commit d02fec6); core-api gained EdgeBridgeClient (JSON-RPC-over-WS to ws://127.0.0.1:19477) + /zeroai/edge/{status,routes,run,trails} routes with 503 offline semantics and edge interaction traces; EdgePanel on /zeroai page renders locality/route/trails (commit 53869a7)
- Final verification (2026-11-13): repo-wide lint 15/15, type-check 18/18, test 33/33, build 17/17 all green — ZeroAI local-first chain (zeroai-edge -> desktop-bridge -> core-api -> web UI) complete
- 3D Control Center (2026-11-13, commit 7956c2d): functional Three.js scene at /control-center fed by live system-stats + service-probe APIs; metric/service nodes reflect real usage, clickable detail overlay, last-sync indicator; frontend type-check/lint/build green
- Engine supervisor: COMPLETE — `@ultra-ai/engine-supervisor` at `platform/services/engine-supervisor` (manifest-driven lifecycle for embedded sidecars: ollama/9router/openclaw/openhands/langflow managed; dify/n8n docker unmanaged; openvscode-server (Ultra Studio, Code-OSS web IDE) added for G-2.2 Option 2 with clean product.json + Open VSX gallery; env validation, health-probe gated start, SIGTERM→SIGKILL stop, nonzero-exit→failed, degrade-on-probe-fail, probeAll; injectable runner/fetch; 8/8 Jest tests; lint/type-check/build green)
- Engine state -> control center (2026-11-13): core-api GET /engines|/engines/probe-all|/engines/:id/status + POST /engines/:id/probe over desktop-bridge JSON-RPC (offline -> 503); web /api/control-center/engines proxy; /control-center renders live engine statuses with supervisor-offline badge + per-engine detail; commit 55e254a
- Engine lifecycle controls (2026-11-13, commit c9d446c): full start/stop/probe chain — control-center engine rows gain Start/Stop buttons behind window.confirm (row restructured: select button + independent action buttons, no nested <button>, per-action busy state + post-action refresh); core-api POST /engines/:id/{start,stop} -> bridge engines.{start,stop}; frontend dynamic route /api/control-center/engines/[id]/[action]; frontend type-check/lint/build green
- Next: work-dispatch core-api/bridge/UI wiring + real target executors, Ultra Studio runtime, then roadmap per `brain-stack/memory/ops/project-map.md`
- S4-P5 integration engine adapters (2026-11-12): adapters/engines.ts adds N8nEngine (webhook), LangflowEngine (/api/v1/run), DifyEngine (blocking /v1/chat-messages), OpenHandsEngine (conversation + poll, terminal/error/timeout handling), openWebUI provider factory (OpenAI-compatible), EngineHttpError; native fetch, zero deps; 12/12 new Jest tests (39/39 package total); repo lint (13/13), type-check (15/15), test (29/29), build (15/15) green — this commit
- S4-P5 CLI agent adapters (2026-11-12): adapters/cli-tools.ts adds CliToolAdapter (process-backed ToolAdapter over injectable ProcessRunner; arg/stdin prompt modes, timeout, abort, 1MiB output cap) + factories claudeCodeTool (claude -p), hermesAgentTool (hermes run), openClawTool (openclaw message send via stdin); native child_process.spawn, zero deps; 10/10 new Jest tests (49/49 package total); lint/type-check/build green — this commit
- Outbox event subsystem (2026-11-12): new package @ultra-ai/outbox at platform/backend/outbox — signed canonical event records (ultra.event.v1, Ed25519 HMAC-style signer over canonical JSON, prev-hash chain), JSONL event store with crash recovery, JsonCursorStore + memory cursor stores, Outbox.exportPending with per-target cursors, batching, and partial acceptance via acceptedThroughId; 20/20 Jest tests incl. chain-of-100, deletion/reorder/forgery, secret non-serialisation, 10k-event verify budget (~0.65s measured); commits 1dee54b + 8fd31d3; lint/type-check/build green; repo lint (14/14), type-check (16/16), test (31/31), build (16/16) green — blockchain readiness only, no chain features
- Engine supervisor -> desktop-bridge wiring (2026-11-12): @ultra-ai/desktop-bridge now embeds EngineSupervisor (ENGINE_PRESETS) with engines.{list,status,probe,probeAll,start,stop} JSON-RPC methods + engine.status broadcast notifications; disable via BridgeOptions.engines.enabled=false; optional @ultra-ai/engine-supervisor workspace dep; new WS-level test covers engines.list/status/error path (8/8 bridge tests); eslint/tsc/tsup green -- this commit
- ZeroAI local model lanes (ollama native API + OpenAI-compatible 9router/OmniRoute/LM Studio/vLLM via ZEROAI_LOCAL_MODEL env) wired through zeroai-edge local-model.ts and desktop-bridge ZeroAIBridgeOptions.localModel override; 22 edge tests + 7 bridge tests green.
- Work-dispatch package (this commit): @ultra-ai/work-dispatch at platform/services/work-dispatch implements ultra.work-dispatch.v1 — WorkDispatcher validates task/route, requires explicit confirmation for sensitive or requiresConfirmation tasks (awaiting-confirmation pending map), dispatches through injected DispatchExecutor ports (local/hermes/openhands/ultra-studio/customer/specialist-agent), reports execution.locality (local|escalated), keeps lifecycle trail (received/confirmation-required/confirmed/denied/dispatched/completed/failed), optional Ed25519 signature via injected signer (readiness-only, no chain features); 15/15 Jest tests; repo lint (17/17), type-check (21/21), test (37/37), build (19/19) green
- Next: remaining roadmap items per `brain-stack/memory/ops/project-map.md` — work-dispatch core-api/bridge/UI wiring + real target executors (P1E), then P1B model gateway, P1D chat/automation hubs + ZeroAI adaptive UI, P1F Model Foundry, P2 desktop runtime
- P1E completion (commits 710a5b4 + agent-network): desktop-bridge exposes dispatch.{submit,confirm,deny,trail,trailAll} + agents.{register,list,get} + bus.{publish,history} + delegate.check JSON-RPC; @ultra-ai/work-dispatch gained agent-network.ts (AgentRegistry, TaskBus, DelegationPolicy with approval/budget gates); bridge 12/12 tests green
- P1B model gateway (commits through model-gateway wiring): @ultra-ai/model-gateway — DeepSeek/GLM/Kimi/Manus OpenAI-compatible adapters, quality/cost/latency routing, circuit breaker, metering; wired into desktop-bridge gateway.* methods + core-api /gateway routes + /gateway UI page
- P1D chat/automation hubs + ZeroAI adaptive UI (commit 3998762): /chat and /automation pages, ZeroAI UI catalog/schema contract + AdaptiveRenderer, /zeroai/ui/{catalog,schema} core-api routes
- P1C workflow engine (commit f4d6781): @ultra-ai/workflow-engine — unified WorkflowEngine port, sidecar probes, conformance suite (15/15 tests)
- P1F model foundry (commits 2599c82 + ADR-001 2c768fd): @ultra-ai/model-foundry — dataset/recipe registries, licensing gates, model cards, Ollama GGUF bridge; distillation recipe blocked pending ToS sign-off (14/14 tests)
- P2 desktop runtime (commits 8f606b1, 76760dc, 3ae8ae8, 73a35e9, 74b85dd): FirstRunWizard (hardware probe -> model suggestions -> engine opt-ins, persisted, 14/14 Jest tests); functional SystemTray + AutoUpdater with platform-adapter seams wired into DesktopUI (23/23 + 31/31 tests); package-desktop.mjs emits .desktop entry + install.sh/install.ps1 + CycloneDX 1.5 SBOM (22 components) + SHA256SUMS, install.sh executable in tarball; embedded OpenHands workspace — @ultra-ai/workspace zero-dep REST client (port 3300), bridge workspace.{health,list,get,open,close}, core-api /workspace/* proxies (503 offline), /workspace session-manager page + /api/workspace routes
- Next: P2 remaining — Ultra Studio runtime surface, desktop E2E, RC+SBOM acceptance; then P3/P4 owner decisions per project-map.md
- P2 desktop runtime cont. (commits 5fcb25c, fdb4558, 3531df9, 96ad119): engine-supervisor WSL2 runtime — manifests accept runtime:'wsl2' + wslCwd, Python sidecars launch via wsl.exe on Windows while other engines stay native (12/12 tests); package-desktop.mjs emits .deb (in-Node ar writer, no dpkg-deb dep) + THIRD-PARTY-NOTICES.txt + corrected .desktop Exec= installed path + install.sh/install.ps1; frontend /studio page embeds supervised openvscode-server (Ultra Studio, port 8443) with start/stop behind confirm; smoke-desktop.mjs E2E verifies tarballs/.deb/SBOM/notices/launchers — 34/34 checks green on v0.9.0-p2
- P2 desktop runtime final (commit dc53b9d): package-desktop.mjs emits AppImage squashfs payload (mksquashfs used; appimagetool when present) + Inno Setup .iss script for Windows installer; smoke-desktop.mjs extended to 47 checks covering squashfs superblock, AppRun, .iss content — ALL CHECKS PASSED on v0.9.0-p2; .deb validated via dpkg-deb structure + ar/data/control inspection
- P2 status: COMPLETE for build+verify scope — residual on-target items only (physical .deb install run, live openvscode-server launch, real appimagetool/makensis compilation); these require target hosts/toolchains
- Next: P3/P4 owner decisions per project-map.md (Gate-OS adapter, Ultra Core real integration — reserved)
- P1A services completion (2026-11-14, commits 5a387a1 and prior): @ultra-ai/mcp-hub (platform/services/mcp-hub) — pluggable MCP transports (stdio/HTTP), policy map by server/tool, mcp.json loading; 6/6 tests. @ultra-ai/skill-registry (platform/services/skill-registry) — SKILL.md discovery, frontmatter parser, scopes (universal/platform/agent), skill-registry.json manifest, pack export/import validation, idempotent import, pluggable signing; 9/9 tests. @ultra-ai/edge-proxy (platform/services/edge-proxy) — single-origin reverse proxy, longest-prefix routes, per-route JWT auth + identity header injection, CSP+security headers; 18 tests. @ultra-ai/port-registry (platform/services/port-registry) — PortRegistry claims + conflict detection + strict/offset/skip resolution; 11 tests. @ultra-ai/secrets-vault (platform/services/secrets-vault) — SecretProvider port, EnvProvider, FileProvider (0600), envFor; 9 tests. @ultra-ai/brain (platform/services/brain) — Brain process manager, JSON+YAML config merge, readiness waiters, readiness.md emit, spawnCommand injection; 9 tests. @ultra-ai/memory-bridge (platform/services/memory-bridge) — Memory Bank<->Hermes pointer bridge, pure-TS sha256, FTS5 adapter, BankAdapter port; 7 tests. P1A-11 monitoring — sentinel targetFiles + engine-supervisor toSentinelTargets exporter wired into prometheus/prometheus.yml scrape. P1A-06/07/12 verified existing: engine-supervisor manifests+supervisor, ultra-core-bridge signed hash-chained outbox — ULTRA_AI_TODO.md P1A section reconciled to all DONE except P1A-01 (needs real-environment spike).
- Next: P1A-01 Hermes embed-mode spike on real Linux/WSL2/Windows hosts; P0 administrative items (backup tag, clean-sandbox verify) per owner; P3/P4 remain owner-gated.

## 2026-11-14 — P1A-01 spike attempted (BLOCKED: no Hermes binary)
- Added `distribution/scripts/spike-hermes-embed.sh` — probes CLI/gateway/HTTP modes, emits markdown report.
- Ran on WSL2 → `docs/spikes/hermes-embed-wsl2-2026-11-14.md`: **BLOCKED** — no `hermes`/`hermes-agent` on PATH in WSL2 or Windows user dirs.
- P1A-01 stays open (`WORKING`); requires Hermes Agent installed on Linux/WSL2/Windows target hosts. No modes verified.
- README + brain-stack ops updated for P1A/P2 completion (commit `1cebff8`).
- Remaining: P0 admin gates (backup tag 🔒 R2, clean-sandbox verify, verify-tag, pre-release, docs archive, network API tests) + P3 Gate-OS real adapter + P4 real Ultra Core — all owner-decision/environment gated.

## 2026-11-15 — P1A-01 Hermes embed spike: POSITIVE (WSL2)

- Hermes Agent v0.23.1 installed in WSL2 at `/home/pc/.local/bin/hermes` (git install under `~/.hermes/hermes-agent`).
- Key discovery: the OpenAI-compatible API is served by the gateway `platforms.api_server` platform (port 8642), NOT by `hermes serve` (dashboard backend, port 9119).
- Enabled via `platforms.api_server.enabled=true` + `platforms.api_server.extra.key`; `hermes gateway run` binds `127.0.0.1:8642`.
- Verified live: `/health`, `/v1/models` (model `hermes-agent`), `/v1/capabilities`, `/api/sessions`, `POST /v1/chat/completions` (OpenAI envelope; agent-level error — no provider credentials configured); unauthenticated requests → 401.
- `/v1/capabilities` also exposes `/v1/responses`, `/v1/runs` (+events/approval/steer/stop, 24h idempotency), `X-Hermes-Session-*` headers, skills/toolsets endpoints.
- Conclusion: NO hermes-bridge needed — the model-gateway / Open WebUI can target `http://127.0.0.1:8642/v1` with Bearer key; agentic work maps onto work-dispatch via `/v1/runs`.
- Reports: `docs/spikes/hermes-embed-results-wsl2-2026-11-15.md` (results) + `docs/spikes/hermes-embed-wsl2-rerun-2026-11-15.md` (raw probe log). TODO P1A-01 → DONE (WSL2).
- Remaining: provider credentials (`hermes auth add <provider>` — owner credential gate) for real inference; bare-Linux + Windows-native reruns.
- P3/P4 unchanged: owner-decision gated (Gate-OS adapter, Ultra Core real + legal gate before crypto).

## 2026-11-19 — P4B Ultra Core integration (contract-first, mock-validated)

- Owner approved real Ultra-Core connectivity and credits/rewards/tokens where needed (team owns the core platform). G-4.1 interface spec + G-4.2 T2 gate recorded as owner-approved direction; T2 on-chain stays contract-blocked until legal/security sign-off per tier rules.
- P4B-05 contracts package: contracts/ultra-core/ — openapi.yaml (OpenAPI 3.1) + 4 JSON Schemas (ultra-event.v1, export-batch, ingest-response, ultra-core-callback.v1) + README with idempotency/ordering/skew/error model/T0-T2 tiers.
- P4B-06/10/11 mock + contract tests: src/mock-server.ts implements the full contract (keys, ingest w/ signature+idempotency+207 partials, proofs, heads, credits T1-gated, registry, SSE callbacks); src/ultra-core-mock.test.ts 17 tests incl. failure injection (one-shot 503 retry, 250-event batch, tampered key, broken prev_hash); compose service ultra-core-mock :4100 + npm run core:mock / test:core-contract.
- P4B-07 InboundReceiver (src/inbound-receiver.ts): ultra-core.callback.v1 intake — shape validation, Ed25519 verify vs publisher key registry, clock-skew window, callback_id/nonce dedupe, T2 blocked by G-4.2, dead-letter store (memory + optional JSONL), payloads never executed. 10 tests.
- P4B-08 handler stubs (src/callback-handlers.ts): anchor.confirmed, credits.balance_changed, governance.policy_changed, registry.item_revoked, approval.decided + wildcard recorder. 4 tests.
- Frontend: /chat is now the Open WebUI surface (thin Ultra AI bar + full-bleed iframe, honest offline fallback); studio/workspace rebuilt on unified uai-* classes; Tailwind pipeline enabled (postcss+tailwind configs committed in 6e83e8b); services page Start/Stop wired to real engine-supervisor ids via port matching.
- Bridge suite: 47/47 tests, tsc clean, eslint clean. Branch release/planning-study pushed through d47233a/6e83e8b.
- Remaining P4B: P4B-09 CoreClient typed from OpenAPI, P4B-12 env/observability, P4B-13 E2E demo vs mock, P4B-14 evidence report, P4B-15 owner Question Card before first real call.

## 2026-11-19 (cont.) — P4B completed to mock ceiling + Hermes↔Open WebUI bridge

- P4B-09 CoreClient completed earlier (typed OpenAPI surface, read-only default, approval_ref enforcement).
- P4B-12 DONE: src/ops.ts (BridgeMetrics Prometheus exposition, logEvent JSON + recursive secret redaction, ULTRA_CORE_ENABLED kill switch) wired into HttpExportTarget; .env.example; README ops section; src/spending-cap.ts withSpendingCap per-agent sliding-window token ceiling (fail-closed); Gate-OS bridge README reachability section.
- P4B-13 DONE(mock): src/e2e-demo.test.ts — usage.model_call → outbox → HttpExportTarget ingest → anchored head + inclusion proof → signed anchor.confirmed over SSE → InboundReceiver dispatch; cursor idempotency; T1 credits flow (read-only guard, approval_ref enforcement, reservation create/list).
- P4B-14 DONE: brain-stack/memory/ops/ultra-core-integration-status.md evidence report; contracts/ultra-core/README.md implementer checklist.
- P4B-15 DRAFTED (awaiting owner): brain-stack/memory/planning/decisions/question-cards.md QC-P4B-15 — options live-now / freeze-contract / staging-canary; recommendation canary-or-freeze. Live Ultra-Core calls remain prohibited.
- P4B-02 DONE: docs/adr/ADR-002-ultra-core-receiver-and-tiers.md.
- P1C-04 PARTIAL: new platform/services/hermes-openai-bridge — OpenAI-compatible /v1/chat/completions (+/v1/models, /health, SSE, bearer auth) over HermesRuntime; sessions via x-hermes-session/conversation_id/user; HERMES_UPSTREAM_URL points Hermes provider at Ollama/9router (default MockProvider); compose service :9400; live-verified (health/models/chat 200). NOTE: WSL2 Hermes Agent gateway already serves OpenAI API at 127.0.0.1:8642 — Open WebUI can target it directly; this bridge is the embedded-runtime alternative.
- Bridge suite: 66/66 tests; hermes-openai-bridge 4/4; tsc+eslint clean (4 any-warnings in test mocks).
- Commits this session: f027781, e2e7677, cbb2c3e, 98666aa, cd2994f, d3662d0 on release/planning-study.
- Remaining gated: QC-P4B-15 answer (first live call + T1 enable), G-4.2 legal opinion (T2), P0 release/admin items, P3 Gate-OS real adapter.

## 2026-11-19 (cont.2) — Real Merkle proofs + WSL recovery

- Real Merkle inclusion proofs implemented (9b66a95): src/merkle.ts shared tree (sha256 leaves, odd-tail duplication, proof items {hash, side} matching contract Proof.proof[]); mock-server now emits genuine proofs; CoreClient.verifyProof() verifies leaf->root client-side; e2e demo uses a 2-event batch so the proof is non-empty and asserts verification.
- Bug fixed: mock prev_hash chain check compared against sha256(JSON.stringify(ev)) instead of the event leaf (eventHash) — chained second events were falsely rejected; now compares to previous leaf.
- WSL2 VM crashed mid-session (wsl -e catastrophic failure); recovered via wsl --shutdown. All dev servers (Next :3000, Open WebUI :8080) need restart if still desired.
- Bridge suite: 66/66 tests, tsc clean, eslint clean (4 pre-existing any-warnings in ops.test.ts mocks).

## 2026-11-19 (cont.3) — Integrations surface, palette, copyright banners

- External-app integrations shipped (98433f84): app/api/apps/catalog.ts unified catalog (n8n, Grafana, OmniRoute, Hermes, Open WebUI); /api/apps live status; /api/apps/[id]/proxy hardened read-only GET proxy (SSRF checks, apiBase path restriction, requiresConfirm -> 409, 8s timeout, sanitized headers, no body/credential forwarding); /integrations page with live cards + iframe embed + guarded API console; next.config rewrites -> fallback so local handlers win; sidebar entry added. Runtime-verified: /integrations 200, /api/apps 200, grafana proxy 200.
- Palette finalized dark gray + orange (4c6b9398) via ultra-theme.css; design-system.css unified to same tokens.
- Copyright banners v2 (8bcf9112, 200fc9ce): Kombai-style ASCII box on ~3,088 files via scripts/apply-copyright.mjs; INFO enriched with GitHub Org (github.com/Ultra-Cube) + Repository (github.com/Ultra-Cube/Ultra-AI) per copy.txt spec; stripOldBanner rewritten to handle legacy one-liner/small-box/full-box/duplicates while preserving comment wrappers; copy.txt excluded + restored to Kombai reference; file-guard manifest regenerated (10,330 files).
- vlab audit: repo-wide word-boundary search finds ZERO literal "vlab" — only "vlabel" variable names inside vendored OfficeCLI code under external/ (excluded from stamping). All banners read "Ultra AI". No UI source renders "vlab" in rights sections.
- Page audit: all app/ pages carry live wiring (fetch/useEffect//api/) except app/page.tsx dashboard shell (static by design); no "Coming soon"/stub markers remain — earlier grep hits were HTML placeholder= attributes.
- Commits this session: 98433f84, 4c6b9398, 8bcf9112, 200fc9ce on release/planning-study.
- Still gated: QC-P4B-15 owner answer (first live Ultra-Core call + T1 enable); G-4.2 legal opinion (T2).


## 2026-11-19 (cont.4) — Owner decisions + P4B-13 completion + banner fix

- Banner art fix (23595f9c): ART glyphs in apply-copyright.mjs were malformed (read as garbage/"VLAB"); replaced with proper big-font ULTRA letterforms; re-applied to all ~3,089 files; README verified.
- QC-P4B-15 ANSWERED: owner chose live connection now (Option 1) — question-cards.md + ledger updated; still needs Ultra-Core base URL + credentials; T1 enablement approved pending those.
- G-4.2 direction: owner chose "design T2 without enabling" — spec/design docs only, no activation.
- P4B-13 COMPLETE: settlement flow added — mock POST /v1/credits/reservations/{id}/settle (404/409), openapi.yaml path, CoreClient.settleCreditReservation (readOnly-refused), e2e assertions (settle -> settled, re-settle 409, missing 404, readOnly reject); clock-skew contract test added (stale ts -> rejected + dead-letter). Bridge suite 67/67, tsc+eslint clean.

## 2026-11-19 (cont.5) — Real browser verification + T2 design doc

- Playwright MCP visual check EXECUTED (real browser, WSL IP): /chat loads (2 console errors = Open WebUI :8080 auth 401/403, external-service auth not page bug); /integrations fully functional — all connector cards render with live status (Grafana ONLINE 15ms/HTTP200, n8n/OmniRoute/Hermes OFFLINE), "2/9 services up" strip, API console + confirm notice present; sidebar complete (Chat/Build/Platform/System/External sections + collapse button).
- REAL BUG FOUND+FIXED: /zeroai returned 500s — /api/zeroai/* proxied to :4000 (core-api) which was not running. Started platform/backend/core-api via tsx (health 200); page now renders live state, zero console errors. Note: core-api + next dev are dev-mode processes, not production services.
- T2 design doc written per owner direction (design, no enable): docs/T2_VALUE_LAYER_DESIGN.md — contract surface draft, component mapping, 5 activation gates, explicit non-goals. G-4.2 remains CLOSED.
- QC-P4B-15 recorded as ANSWERED (live approved); blocked only on Ultra-Core base URL + credentials supply.
