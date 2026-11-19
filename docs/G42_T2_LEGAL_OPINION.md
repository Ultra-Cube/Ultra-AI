# G-4.2 — Legal Opinion: T2 Value Layer (Credits, Rewards, Tokens, On-Chain Functions)

**Status:** DRAFT — requires review by qualified counsel before T2 activation.
**Gate:** G-4.2 remains CLOSED until every activation condition in §8 is satisfied.
**Scope:** This document analyzes the legal posture of the proposed T2 value layer
(`/v1/value/*` surface described in `docs/T2_VALUE_LAYER_DESIGN.md`) for the
Ultra AI platform operated by Ultra Cube Tech (ucubetech.com), developed by
Ultra Zone Team (ultra-zone.ucubetech.com).

> **Disclaimer.** This is an internal engineering/legal-risk assessment prepared
> to inform a go/no-go decision. It is **not** legal advice and does not create
> an attorney–client relationship. A licensed attorney in each relevant
> jurisdiction must review and approve the final terms before live T2
> functionality is enabled.

---

## 1. What T2 proposes (recap)

T2 adds a value layer on top of the already-approved T1 credit surface:

- **Credits / rewards** earned by platform usage, referrals, or agent work.
- **Optional tokenization** — representation of credits as entries on Ultra
  Core (the platform-owner-controlled chain), with event/callback contracts
  already specified under G-4.1.
- **Transferability** — credits may move between user accounts and, in the
  furthest design variant, be redeemable for external value.
- **Settlement** — on-chain anchoring of credit balances/reservations and
  optional conversion to Ultra Core-native units.

T1 (accounting of usage credits, reservations with `approval_ref`, balance
queries) is contract-complete against the Ultra Core mock and is **not**
subject to this gate. T2 is where legal exposure begins.

---

## 2. Threshold question: is this "money"?

The single most important classification:

| Design variant | Likely characterization | Risk level |
|---|---|---|
| A. Closed-loop credits, non-transferable, no cash-out | Stored value / loyalty points (low) | LOW |
| B. Credits transferable between users, no external redemption | P2P value transfer; e-money/EMT adjacent in some regimes | MEDIUM–HIGH |
| C. Credits convertible to fiat or crypto, or redeemable for goods/services at scale | E-money, stored-value facility, possibly payment services / VASP | HIGH |
| D. Token with speculative trading, secondary market, yield | Security (Howey), crypto-asset (MiCA), possibly commodity | VERY HIGH |

**Recommendation:** T2 launch should target **variant A** (closed-loop,
non-transferable, non-redeemable credits with expiry and no cash-out). Variants
B–D each require separate legal sign-off and are explicitly out of scope for
the first activation.

---

## 3. Jurisdictional analysis (assumptions to confirm)

Ultra Cube Tech's place of incorporation and the jurisdictions where users
reside are **not yet confirmed** — this is assumption A-1 and must be resolved
by counsel. Analysis below covers the regimes most likely to apply to a
digital platform with global users.

### 3.1 European Union / EEA

- **MiCA (Reg. 2023/1114):** if any T2 token is "offered to the public" in the
  EU and qualifies as a crypto-asset, issuer obligations (whitepaper,
  authorization, ongoing disclosure) apply. Utility tokens with genuine
  platform-use-only function may qualify for the exemption only if **not
  marketed as investment** and **not exchangeable for funds** outside the
  platform. Variant A likely avoids MiCA; variant C/D almost certainly triggers it.
- **PSD2 / EMD2:** credits that can be exchanged for goods/services and are
  accepted by third parties may constitute "electronic money" requiring an
  e-money institution license or exemption (limited network / commercial
  agent). Variant B is the danger zone.
- **Consumer credit / unfair terms:** prepaid credits usable only on-platform
  are generally low-risk but expiry/forfeiture rules must comply with consumer
  protection (no "use it or lose it" on paid balances without clear notice).

### 3.2 United States

- **State money-transmitter laws:** transmitting value between parties for a
  fee typically requires licensing per state. Variant A (no transfer, no
  cash-out) avoids this. Variant B/C likely triggers it.
- **SEC Howey test:** if credits/tokens are marketed with expectation of
  profit from the efforts of others → investment contract → securities
  registration. Never market credits as investments.
- **FinCEN:** convertible virtual currency (CVC) activity can make the
  platform a money services business (MSB) with BSA/AML obligations.

### 3.3 Gulf / MENA (platform's apparent region)

- **SAMA (Saudi), CBUAE (UAE), BMA (Bahrain):** stored-value and prepaid
  instruments are regulated; crypto-asset frameworks exist (VARA in Dubai,
  SAMA/ CMA rules in KSA). Variant C/D requires local counsel review before any
  public offering.
- **E-commerce / consumer protection laws:** disclosure of credit terms,
  expiry, and non-refundability required.

### 3.4 Other

- GDPR/PDPL: credit ledgers are personal data; transfer history creates
  profiling risk. Privacy notice + data minimization required (see §6).

---

## 4. AML / KYC / sanctions

| Variant | Trigger | Required controls |
|---|---|---|
| A (closed-loop, no cash-out) | Usually none below thresholds | Basic velocity/fraud limits, sanctions screening only if fiat on-ramp exists |
| B (P2P transfer) | Possible MSB/VASP | KYC tiers, transaction monitoring, STR filing capability |
| C/D | Almost certain | Full AML program: KYC/CDD, sanctions screening, transaction monitoring, record retention (5y), MLRO |

**Gate condition:** no fiat on-ramp or cash-out may be enabled in T2 without a
completed AML program and legal sign-off. Credit issuance from platform usage
(earned, not purchased) is materially lower risk.

---

## 5. Securities and investment risk

- Credits must **never** be marketed with ROI, staking yield, or "earn more by
  holding" mechanics. Any yield-bearing feature converts the analysis to
  securities territory.
- Referral/reward credits should be sized as modest, usage-based incentives —
  not purchasable assets.
- If Ultra Core tokens gain a secondary market or external price discovery,
  assume securities/crypto-asset classification applies regardless of intent.

---

## 6. Privacy and data protection

- Credit ledgers, transfer history, and agent-attribution data are personal
  data (GDPR Art. 4) and likely regulated personal data under Saudi PDPL and
  UAE PDPL.
- Requirements: lawful basis (contract/legitimate interest), transparency in
  the privacy notice, retention limits, user rights (access, erasure where
  feasible — note conflict with immutable ledgers; mitigate via off-chain PII
  separation and on-chain pseudonymous identifiers), DPIA before T2 launch.
- **Design rule already aligned:** Ultra Core events should carry
  pseudonymous `account_ref`/hash identifiers, never raw PII.

---

## 7. Contractual and consumer requirements

Before T2 activation, publish/update:

1. **Terms of Service** — credit definition, earn/redeem rules, expiry,
   forfeiture, non-transferability (variant A), dispute resolution.
2. **Credit Terms** — denominated-unit clarity (credits ≠ money, ≠ tokens,
   ≠ securities), no cash value unless legally cleared.
3. **Privacy Policy** — ledger data, retention, cross-border transfers.
4. **Acceptable Use** — prohibition on credit trading, money laundering,
   multi-accounting abuse.
5. **Refund/chargeback policy** — treatment of purchased vs earned credits.

---

## 8. Activation gates (all must be GREEN before T2 goes live)

| # | Gate | Owner | Status |
|---|---|---|---|
| L-1 | Incorporation jurisdiction + user geography confirmed | Business + counsel | OPEN |
| L-2 | Written opinion from licensed counsel in primary jurisdiction confirming variant-A classification | External counsel | OPEN |
| L-3 | ToS + Credit Terms + Privacy Policy published and accepted by users | Legal + eng | OPEN |
| L-4 | AML/KYC decision: confirm no fiat on-ramp/cash-out in v1, or complete AML program | Counsel + compliance | OPEN |
| L-5 | Security review of `/v1/value/*` + Ultra Core callback endpoints (auth, replay, idempotency) | Security | OPEN |
| L-6 | DPIA completed for ledger/PII handling | Privacy | OPEN |
| L-7 | Kill switch + circuit breaker verified for value operations (`ULTRA_VALUE_KILL_SWITCH`) | Eng | OPEN |
| L-8 | Monitoring/alerting on anomalous credit issuance/transfer | Eng | OPEN |

**T2 remains contract-blocked until L-1 through L-8 are closed.** Engineering
work on `/v1/value/*` may proceed behind feature flags; it must not be exposed
to real users until the gates close.

---

## 9. Explicit non-goals (reaffirmed)

- No public token sale, ICO/IDO, or investment offering.
- No staking, yield, lending, or derivatives on credits.
- No fiat on-ramp/out or third-party payment acceptance in v1.
- No marketing credits as investments, savings, or profit-generating assets.
- No cross-chain bridges or external exchange listings.

---

## 10. Open questions for counsel

1. Entity jurisdiction and whether users are in EU/US/GCC — determines regime.
2. Is Ultra Core a public chain or platform-private? (Affects MiCA/Howey.)
3. Will credits ever be purchasable with fiat? (Triggers e-money/MSB analysis.)
4. Expiry/forfeiture policy acceptable under target consumer laws?
5. Data-residency requirements for ledger replicas?

---

*Prepared by Ultra Zone Team for Ultra Cube Tech — internal gate document.
Next step: route §3–§8 to licensed counsel in the confirmed jurisdiction(s).*
