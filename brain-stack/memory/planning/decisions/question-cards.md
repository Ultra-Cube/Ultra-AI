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
# Question Cards — pending / draft

Drafted cards awaiting owner answer. Answered cards move to `ledger.md`.

---

## QC-P4B-15 — First live Ultra-Core connection + T1 enablement — ANSWERED (R2)

**Owner decision (2026-11-19): Option 1 — approve live connection now.**
Live anchoring + T1 enablement approved by owner. Still required before
the first real call: Ultra-Core base URL + ingest/admin credentials (or
key-registration flow) — not yet supplied. Rollback stays
ULTRA_CORE_ENABLED=false. T2 remains BLOCKED by G-4.2.

**Class:** R2 — blocks first real Ultra-Core call and any T1 credit activity.
**Phase:** P4B / WS-C→D transition.
**Context:** The full producer side is mock-validated (60/60 tests,
`contracts/ultra-core/` v0.1.0-draft, evidence:
`brain-stack/memory/ops/ultra-core-integration-status.md`). No live
Ultra-Core endpoint, credentials, or receiver deployment has been supplied.

**Options:**

1. **Approve live connection now** — supply Ultra-Core base URL +
   ingest/admin tokens (or key-registration flow); we run one supervised
   `usage.model_call` → ingest → anchor → `anchor.confirmed` → proof cycle
   against the real service, then enable T1 reads.
   - Consequence: real network egress to Ultra-Core infra; credentials must
     be provisioned; rollback = `ULTRA_CORE_ENABLED=false`.
   - Cost/risk: first real call is irreversible once anchored; needs the
     live contract to match `openapi.yaml` (drift = rejected batches).
2. **Approve contract freeze, defer live call** — lock `openapi.yaml` as
   v1.0, keep all traffic mock-only until Ultra-Core team confirms their
   receiver implements it; revisit at next review window.
   - Consequence: zero risk; P4B stays at VERIFIED-mock; live work waits.
3. **Approve staged canary** — live connection to a staging Ultra-Core
   instance only (if one exists), production stays mock until staging
   passes the E2E demo.
   - Consequence: needs a staging endpoint; extra environment to maintain.
4. **Other** — owner specifies endpoint/credentials/scope directly.

**Recommendation:** ★ **Option 3** if a staging Ultra-Core instance exists;
otherwise **Option 2** — freeze the contract and keep the 8-hour autonomous
window strictly mock/local. Live anchoring is irreversible; a staging
canary gives real-wire confidence without production exposure.

**Parallel-safe continuation (regardless of answer):** T1 cap/reservation
E2E vs mock, Merkle proof cryptographic verify, per-agent spending-cap
hook, Gate-OS reachability doc, frontend/ZeroAI integration work — none of
these require the live endpoint.

**Arabic:** البطاقة R2: هل نعتمد أول اتصال حي بـ Ultra-Core الآن، أم نجمّد
العقد v1.0 ونبقي كل الحركة على الـ mock حتى توفر بيئة staging/إنتاج؟
التوصية: staging canary إن وُجد، وإلا تجميد العقد — لا استدعاءات حية قبل
الإجابة.

**T2 note:** any on-chain/value/token function remains BLOCKED by G-4.2
(written legal opinion required) independent of this card's answer.
