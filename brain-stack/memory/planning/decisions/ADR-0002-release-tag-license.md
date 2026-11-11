# ADR-0002 — Planning release tag `v0.2.0-planning` and license Apache-2.0

- **Status:** Accepted
- **Date:** 2026-11-11
- **Deciders:** Owner via Question Cards G-0.2, G-0.3
- **Context:** The planning/study release must not be confused with product releases; the repo has no LICENSE file at all.
- **Decision:** Tag the planning release `v0.2.0-planning` (GitHub pre-release). License Ultra AI code under Apache-2.0 (explicit patent grant). The `LICENSE` file itself is added in Phase 0 after the baseline tag, keeping the planning release additions-only.
- **Alternatives:** `v1.0.0-planning` (misleading vs README claim), `planning-2026-11` (breaks semver), MIT (no patent grant).
- **Consequences:** `package.json` stays `0.1.0` in the planning release; version/license fixes deferred to Phase 0 on a normal branch.
