# ULTRA AI — LEGAL, LICENSING AND COMPLIANCE ANALYSIS

**Date of research:** 2026-11-09 · **Prepared for:** Ultra Cube Tech / Ultra Zone · **Owner agent:** A04 Legal & License Auditor
**IMPORTANT:** this is an engineering-side compliance analysis, **not legal advice**. Licence texts change; several sources below are *secondary* (blogs, comparison sites). Before any row becomes `APPROVED`, A04 must read the **primary licence file at the pinned commit** and record the URL, commit SHA and date. Qualified counsel must review every R2 item (Super Prompt §3).

**Row status values:** `APPROVED` (primary text read, obligations met) · `CONDITIONAL` (allowed if listed conditions are met) · `PENDING` (not yet verified — not vendored) · `REJECTED` (must not ship).

---

## 1. Executive summary — what the research changes

| # | Finding | Effect on the plan |
|---|---|---|
| 1 | **n8n** is source-available (Sustainable Use License), not open source. It permits internal-business and non-commercial/personal use; redistributing/embedding it in a commercial product or hosting it for others needs a separate commercial agreement (n8n Embed). | n8n is **connected as a user-installed engine, never bundled** (G-1.2). Langflow becomes the default flow builder. |
| 2 | **Open WebUI** has been under a BSD-3-based licence **with a branding clause since v0.6.6 (Apr–May 2025)**: its name/logo may not be removed or replaced unless ≤ 50 users in 30 days, written permission, or an enterprise licence. v0.6.5 and earlier are plain BSD-3. | Embed it as a **separate service with branding intact**; no white-labelling without a licence (G-1.4). |
| 3 | **Dify** = Apache-2.0 **plus**: no multi-tenant operation without written authorization (one workspace = one tenant), console logo/copyright must stay, and the licensor may change the terms. | Allowed as a **single-tenant, per-install** engine; **incompatible with a future multi-tenant "Ultra Cloud" built on Dify's source** (G-1.3). |
| 4 | **9router** (MIT) routes coding tools to 40+ providers and advertises OAuth-subscription tiers (e.g. Claude Code, Codex, GitHub Copilot). Whether pooling consumer subscriptions through a proxy complies with each provider's terms is **UNVERIFIED** and plausibly restricted. | Ship with **OAuth pooling disabled**; BYO API keys only; A04 reads each provider's ToS before any enablement (G-1.6). |
| 5 | **Kimi**: K2.x uses a *Modified MIT* licence (must prominently display the model name in products with > 100 M monthly users or > US$ 20 M monthly revenue — read in our local copy for K2.5). **K3 (July 2026) uses a new "Kimi K3 License"**: same display trigger, and a "Model as a Service" operator must sign a separate agreement; independent analysts classify it as commercial-use restricted. | Fine for internal/own use and fine-tuning; **not** for reselling hosted inference at scale without an agreement. |
| 6 | **Manus** is a closed commercial agent service (API only); Meta's acquisition was blocked by Chinese authorities in April 2026 and unwound, so access/data flows are volatile. **OpenManus** (MIT) is a separate community project. | Manus only as an **optional connector with the user's own key**; open agent framework = OpenManus (evaluate). |
| 7 | The repo **vendors Skales under BSL 1.1**: personal/learning/non-commercial use only; no SaaS or competing product without consent; converts to Apache-2.0 on **2030-04-19**. | Keep the file (preservation) but **exclude from every build and package** (P0-22). |
| 8 | **Five upstream imports are empty gitlinks** (no `.gitmodules`). Recovered and read on 2026-11-09 (all public; pinned commit = upstream tip): **AI-Models_Biome is GPL-3.0 (copyleft)**; quant-mind MIT; godmode-animation Apache-2.0; Directory-Control-Systems and project-template say MIT in `package.json` but have **no LICENSE file**. | Biome must never be linked/bundled into Apache-2.0 Ultra AI code (GPL-3.0 is one-way compatible: Apache-2.0 code may enter a GPL-3.0 work, not the reverse); separate-process use only after counsel. Add LICENSE files to the two Ultra-Cube repos. Mirror per G-0.6. |
| 9 | The repo has **no `LICENSE` file** while `package.json` says MIT, and no third-party notices. | Add `LICENSE`, `NOTICE`, `THIRD_PARTY.md`, SBOM (P0-17, P0-11). |
| 10 | **Distillation/training with API outputs** may be prohibited by provider terms (typically "do not use outputs to develop competing models"); fine-tuned models inherit the **base model's** licence. | Foundry distils only from licence-permitted teachers; model cards list obligations (P1F-04, P1F-07). |
| 11 | **Names:** "Ultra" is already used by an unrelated blockchain/game-distribution company (Ultra, `ultra.io`, with its own blockchain); "Hermes" is also a luxury trademark and a model family (Nous *Hermes*). | Trademark clearance before registering "Ultra Core"/chain names or public branding. |
| 12 | Sending data to **China-hosted or other third-country APIs** raises data-protection transfer questions. | Default-deny for sensitive data; consent + region badge (G-1.5). |

---

## 2. Licence matrix (20 components)

Legend for *Stance*: ✅ may bundle/embed · 🔗 connect to user-installed only · 🧩 separate service, conditions apply · 🌐 API/connector only · ⛔ do not ship.

| ID | Component | Use in Ultra AI | Licence (as verified) | Key obligations / conditions | Stance | Status | Action |
|---|---|---|---|---|---|---|---|
| L-01 | **Hermes Agent** (Nous Research) | Brain | **MIT** | Keep copyright + licence notice; native Windows experimental | ✅ | CONDITIONAL | Read primary LICENSE at pin; WSL2 on Windows |
| L-02 | **OpenClaw** | Assistant gateway (:18789, Node ≥ 22) | **MIT** | Notices; treat inbound DMs as untrusted; pairing on | ✅ | CONDITIONAL | Fix catalog mismatch (repo maps "openclaw" to AionUi in places) |
| L-03 | **Ollama** | Local model runtime | **MIT** (from project repo; *re-verify*) | Notices; **model weights carry their own licences** | ✅ | PENDING | Verify primary text |
| L-04 | **9router** (decolua) | Provider router | **MIT** | Notices; provider ToS apply to what is routed; OAuth pooling risk (finding 4) | ✅ | CONDITIONAL | Pooling off; keep fork attribution |
| L-05 | **Langflow** | Flow builder (default) | **MIT** (secondary source: IBM/DataStax-owned, no extra terms) | Notices | ✅ | CONDITIONAL | Verify primary text |
| L-06 | **OpenManus** (FoundationAgents) | Open agent framework | **MIT** (secondary source) | Notices | ✅ | PENDING | Verify; maturity review |
| L-07 | **DeepSeek V4 weights** (Pro, Flash; V4.1-Flash) | Model via API or local if hardware allows | **MIT** | Notices; earlier DeepSeek code models used a separate "DeepSeek License" with use restrictions → check per model | ✅ / 🌐 | CONDITIONAL | Per-checkpoint check |
| L-08 | **DeepSeek Harness (dsh)** | Candidate agent runtime | **MIT** (preview, Aug 2026) | Third-party notices file shipped by upstream | ✅ | PENDING | Maturity + licence check |
| L-09 | **DeepSeek DeepSpec** | Foundry: draft-model training | **MIT** (builds on SpecForge Apache-2.0, DFlash MIT) | Keep upstream notices | ✅ | CONDITIONAL | Pin SHA |
| L-10 | **GLM-5 / 5.1 / 5.2** (Z.ai) | Model via API/local | **MIT** | Notices; Z.ai API has its own terms | ✅ / 🌐 | CONDITIONAL | Read API terms |
| L-11 | **Code-OSS / VSCodium build scripts** | Optional "Ultra Studio" | **MIT** (source and VSCodium scripts) | Use a *clean* `product.json`; **do not** use Microsoft's binaries, branding, telemetry or Marketplace endpoints | ✅ | PENDING | Decide G-2.2 |
| L-12 | **AionUi** (in repo) | Reference UI | **Apache-2.0** (local `LICENSE`) | NOTICE + changes stated | ✅ | CONDITIONAL | Only if used |
| L-13 | **OpenHands** | Agentic coding workspace | **MIT core**; `enterprise/` is source-available (PolyForm Free Trial; licence needed beyond a trial) | **Exclude `enterprise/`** from any bundle | 🧩 | CONDITIONAL | Build allowlist |
| L-14 | **Open WebUI** | Chat UI | **BSD-3 + branding clause** (v0.6.6+), CLA for contributions | Keep branding visible (exceptions: ≤ 50 users/30 days, permission, enterprise licence) | 🧩 | CONDITIONAL | G-1.4 |
| L-15 | **Dify** | App/RAG builder | **Apache-2.0 + additional conditions** | No multi-tenant use without written authorization; keep console logo/copyright; licensor may alter terms | 🧩 | CONDITIONAL | Single-tenant only; G-1.3 |
| L-16 | **Kimi K2.x** (incl. K2.5/K2.6; local copy in repo) | Model | **Modified MIT** | Display "Kimi K2.x" if > 100 M MAU or > US$ 20 M monthly revenue | ✅ / 🌐 | CONDITIONAL | Re-read file at use |
| L-17 | **n8n** | Workflow automation | **Sustainable Use License** (`.ee.` files: Enterprise licence) | Internal business / personal / non-commercial only; no resale, hosting for others, or embedding without Embed agreement | 🔗 | CONDITIONAL | Connect-only; G-1.2 |
| L-18 | **Kimi K3** | Model | **Kimi K3 License** (custom) | Display trigger as above; **MaaS operators need a separate agreement**; revenue-tiered | 🌐 | CONDITIONAL | Counsel before hosted resale |
| L-19 | **Skales** (in repo) | none | **BSL 1.1** (until 2030-04-19, then Apache-2.0) | Non-commercial/learning only; no SaaS/competing product | ⛔ | REJECTED | Exclude from builds |
| L-20 | **Manus** | Optional agent connector | **Closed**, commercial terms | Vendor ToS, data processing terms; geopolitical volatility | 🌐 | PENDING | User key only |

**Licence classes (for the chart in the Spec):** Permissive = L-01…L-12 (12) · Permissive + extra conditions = L-13…L-16 (4) · Source-available/restricted = L-17…L-19 (3) · Closed service = L-20 (1).

### 2.1 Supporting libraries (not counted above — verify at pin time)
Tauri 2 (MIT/Apache-2.0 expected), Electron (MIT expected), three.js and React Three Fiber (MIT expected), Playwright, Prometheus/Grafana (Grafana is AGPL-3.0 — fine as a separate service; do not modify-and-offer-as-network-service without compliance), Redis (licence changed in recent years — verify version/fork choice), PostgreSQL (PostgreSQL licence), Next.js/React (MIT).

### 2.2 Other items to clear
| Item | Issue |
|---|---|
| **Microsoft VS Code binaries / Marketplace** | Microsoft's builds are under a separate licence with telemetry; the Marketplace terms limit use to Microsoft products → forks use **Open VSX**; some extensions are licence-restricted to official builds |
| **Locally served models** (Llama, Gemma, Qwen, Mistral …) | Per-model licence (e.g., community licences with use/size thresholds) — catalog stores licence per model |
| **Linux kernel / Gate-OS components** | GPL obligations belong to Gate-OS distribution; keep Ultra AI as a separate process across a network/API boundary; counsel to confirm |
| **Biome, quant-mind, godmode-animation, Directory-Control-Systems, project-template** | Recovered 2026-11-09 — see section 2.4 |
| **Datasets** for the Foundry | Per-dataset licence and provenance required |

---

### 2.4 Recovered orphan components (read from upstream on 2026-11-09; not part of the 20-row chart)
| ID | Component | Upstream | Licence (primary file read) | Stance | Status |
|---|---|---|---|---|---|
| L-21 | AI-Models_Biome | Fadhel-SH/AI-Models_Biome @ `066bb50` | **GPL-3.0** (`LICENSE`) | ⛔ do not link or bundle; separate process only after counsel | REJECTED for bundling |
| L-22 | AI-Tools_quant-mind | Fadhel-SH/AI-Tools_quant-mind @ `8e21888` | **MIT** © LLMQuant | ✅ | CONDITIONAL (notices) |
| L-23 | Tools_godmodeanimation | Fadhel-SH/Tools_godmodeanimation @ `0565112` | **Apache-2.0** | ✅ | CONDITIONAL (NOTICE) |
| L-24 | Directory-Control-Systems | Ultra-Cube/Directory-Control-Systems @ `0e2f65d` | MIT per `package.json`; **no LICENSE file** | ✅ after adding LICENSE | PENDING |
| L-25 | project-template | Ultra-Cube/project-template @ `7c69471` | MIT per `package.json`; **no LICENSE file** | ✅ after adding LICENSE | PENDING |

### 2.5 Pattern sources used by the legacy design
| ID | Component | Licence | Obligation |
|---|---|---|---|
| L-26 | Claude Code Game Studios (`Donchitos/Claude-Code-Game-Studios`) — tier hierarchy, ask-before-write, quality gates adapted in `docs/AGENT_STUDIO_ARCHITECTURE.md` | **MIT** (verified 2026-11-09 via repository summaries) | Keep the MIT notice and credit in `NOTICE`/`THIRD_PARTY.md` if any text, agent definitions or scripts were copied rather than re-written |

## 3. Policies (binding on the Crew)

| ID | Policy |
|---|---|
| **LP-01 Vendoring gate** | No third-party code/weights in repo, installer or image unless the matrix row is `APPROVED`/`CONDITIONAL` with conditions implemented and `THIRD_PARTY.md` + SBOM updated. |
| **LP-02 Pin and attribute** | Exact versions + checksums; keep upstream `LICENSE`/`NOTICE`; fork attribution preserved (as OrcaFlow does for 9router). |
| **LP-03 No rebrand traps** | Never remove or replace Open WebUI or Dify branding; never present third-party engines as Ultra-made. |
| **LP-04 No bundling of source-available engines** | n8n (and any BSL/Sustainable-Use/PolyForm component) is connected, not redistributed; `enterprise/` directories excluded. |
| **LP-05 Single-tenant engines** | Dify/Open WebUI/n8n run per install; a multi-tenant cloud offering requires written agreements first. |
| **LP-06 Provider terms** | Each provider adapter links its ToS in the catalog; OAuth-subscription pooling off by default; no scraping or ToS circumvention; no use of API outputs to train models unless the ToS allow it. |
| **LP-07 Model licence inheritance** | Model cards list base model, dataset licences and obligations; derived models inherit restrictions. |
| **LP-08 Data classes** | Public / internal / sensitive; sensitive never leaves the device by default; third-country processing needs explicit consent and a lawful transfer basis. |
| **LP-09 Transparency** | Users are told when they talk to an AI, which provider/region answered, and which agent actions were taken; AI-generated content marking where the law requires. |
| **LP-10 Agent safety** | Human approval for irreversible/external actions; audit log; kill switch; spend limits. |
| **LP-11 Security disclosure** | `SECURITY.md`, private reporting channel, 90-day coordinated disclosure target, CVE process. |
| **LP-12 Contributions** | DCO sign-off by default; CLA only if the owner decides (record in ADR); no contributions of code from incompatible licences. |
| **LP-13 Crypto freeze** | No token, wallet, reward, or exchange-like feature before a written legal opinion (G-4.2); the platform never custodies keys. |
| **LP-14 Trademarks** | Clear "Ultra Core", chain/token names and the Sentinel/Hermes naming before public use. |
| **LP-16 No copyleft linking** | No GPL/AGPL/LGPL code is linked, bundled or vendored into Ultra AI (Apache-2.0, ADR-0008). Copyleft tools run only as separate processes after counsel review (example: AI-Models_Biome, GPL-3.0). |
| **LP-15 Export/sanctions** | Screen distribution targets and provider partners against current sanctions/export rules before releases. |

---

## 4. Compliance process (what CI and A04 do)

1. **Inventory:** CycloneDX SBOM per build (npm, pip, container layers, model files). 2. **Scan:** licence scanner (e.g., ScanCode or REUSE) + dependency audit; fail on `REJECTED`/`PENDING` licences or on `enterprise/` paths in artifacts. 3. **Notices:** generate `THIRD_PARTY_NOTICES.md` and in-app "About → Licences" screen. 4. **Engine gate:** the supervisor refuses to install an engine whose manifest `matrix_row.status` is not `APPROVED`/`CONDITIONAL`. 5. **Release checklist:** matrix reviewed within 30 days, notices included, SBOM attached, installer licence screens present. 6. **Re-verify on every pin bump** (licence changes are common: Open WebUI changed MIT → BSD-3 → branding clause; n8n changed Commons Clause → Sustainable Use; Kimi changed K2 → K3 terms).

---

## 5. Regulatory watchlist (for counsel — verify applicability and dates)

| Area | Why it matters |
|---|---|
| **Data protection** — GDPR (EU users), Bahrain Personal Data Protection Law (Law No. 30 of 2018), other local laws | Lawful basis, transfers to third-country AI APIs, retention, user rights (access, deletion), DPIA for agent memory |
| **EU AI Act** | Transparency duties for AI systems interacting with people; obligations for **providers of general-purpose models** if the Foundry publishes models; check current application dates and any delays |
| **Consumer/product liability** | Autonomous agents acting for users; disclaimers do not replace safe design |
| **Crypto-assets (deferred)** | Token classification (securities/commodity/utility), AML/KYC/travel rule, EU MiCA, Central Bank of Bahrain crypto-asset rules and licensing, tax — **none to be built before an opinion** |
| **Export controls / sanctions** | Distribution to restricted jurisdictions; hardware/cloud partners |
| **Open-source compliance** | Notice obligations, copyleft boundaries (GPL/AGPL components used as separate services) |
| **Content/safety** | Different model families apply different alignment/censorship rules — evaluate behaviour per model before defaulting users to it |

---

## 6. Hooks into the decision gates
G-0.3 (own licence: Apache-2.0 recommended for its explicit patent grant and compatibility with the matrix; MIT acceptable) · G-1.2 n8n · G-1.3 Dify · G-1.4 Open WebUI · G-1.5 data policy · G-1.6 OAuth pooling · G-1.7 Foundry scope (distillation terms) · G-2.2 Code-OSS vs OpenHands · G-4.2 crypto freeze.

---

## 7. Sources (accessed 2026-11-09) — secondary unless marked primary
- Hermes Agent: repository README and site (MIT; skills standard; Windows note) — `github.com/NousResearch/hermes-agent`, `hermes-agent.org/docs`; overview: `kanerika.com/blogs/hermes-agent/`.
- OpenClaw: repository README (MIT; gateway 18789; Node ≥ 22) — `github.com/openclaw/openclaw` (viewed via mirrors/forks).
- 9router: `github.com/decolua/9router`; licence summary `dev.co/ai/frameworks/9router`; fork attribution example `github.com/Alexi5000/9router_OrcaFlow`.
- n8n: `ssdnodes.com/learn/n8n-sustainable-use-license-explained` (quotes the repo `LICENSE.md`), `activepieces.com/blog/n8n-license-fair-code-community-enterprise-2026` (**competitor — treat with care**). **Primary: n8n repository `LICENSE.md`, `LICENSE_EE.md`.**
- Open WebUI: **primary:** `docs.openwebui.com/license` and repository `LICENSE`/`LICENSE_HISTORY`; analysis `wz-it.com/en/blog/open-webui-license-branding-business/`.
- Dify: **primary:** `docs.dify.ai/policies/open-source` and `github.com/langgenius/dify/blob/main/LICENSE`; comparison `wz-it.com/en/blog/dify-flowise-langflow-n8n-comparison/` (also for Langflow MIT).
- OpenHands: `openhands.dev/blog/devin-ai-alternatives`, `rywalker.com/research/openhands`, `opensourcealternatives.to/item/openhands` (MIT core; `enterprise/` PolyForm Free Trial).
- DeepSeek: `en.wikipedia.org/wiki/DeepSeek_(AI)`, `opensourceforu.com/2026/08/deepseek-open-sources-v4-flash/`, `github.com/deepseek-ai/DeepSpec` (**primary**), DeepSeek Harness coverage on `dev.to` (preview status).
- Z.ai GLM: `huggingface.co/blog/mlabonne/glm-5`, `dev.to/damogallagher/glm-52-…`, `inferencex.semianalysis.com/model/glm-5-1`.
- Kimi: `rits.shanghai.nyu.edu/ai/kimi-k3-open-weights-ship-2-8t-parameters-1-4-tb-to-run/`, `unite.ai` K3 licence coverage; **primary (local):** `external-integrations/AI-Model_Kimi-K2.5/LICENSE`.
- Manus: `rywalker.com/research/manus`, `eweek.com/news/meta-manus-ai-deal-china-unwind-apac/`, `scmp.com/tech/big-tech/article/3365986/…`.
- VS Code / VSCodium / Open VSX: `github.com/VSCodium/vscodium`, `devclass.com/development/2023/06/27/open-vsx-…`.
- Repo-local primary files read: `external-integrations/skales/LICENSE` (BSL 1.1), `AionUi/LICENSE` (Apache-2.0), `OpenWA/LICENSE` (MIT), `colibri/LICENSE` (Apache-2.0).
- Not found: public information on **Ultra Core** (owner must supply); unrelated "Ultra" (`ultra.io`) blockchain/game platform exists.
