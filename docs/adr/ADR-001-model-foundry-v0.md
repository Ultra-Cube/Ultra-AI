# ADR-001: Model Foundry v0 — stages, artifacts, and hardware tiers

- **Status**: proposed (pending owner gate G-1.7)
- **Date**: 2026-11-14
- **Deciders**: TBD
- **Tags**: P1F, model-foundry, licensing, local-first

## Context

P1F asks for a "model-making" capability (DeepSeek-inspired): dataset
pipelines, SFT/LoRA recipes, distillation, speculative decoding, GGUF
quantization, and Ollama serving. The sandbox has **no GPU**, so training
recipes cannot be executed or verified here — they must be declared,
validated, and runnable on a GPU host without pretending otherwise.

Separately, derived models inherit their base model's licence obligations
(P1F-07) and distillation requires teacher ToS permission (P1F-04, gate
R2). These constraints must be enforced in the data model, not in prose.

## Decision

Introduce `@ultra-ai/model-foundry` as a zero-dependency contract +
registry package implementing the v0 surface:

- **Dataset pipeline** (`datasets.ts`): manifests with per-dataset
  licence, commercial-use flag, PII flag, format, checksum, and lineage.
  A registry validates manifests and refuses datasets whose licence
  forbids the intended use.
- **Recipe manifests** (`recipes.ts`): declarative SFT/LoRA,
  distillation, DeepSpec speculative-decoding, GGUF quantization, and
  Ollama-serve recipes. Every recipe carries `status: 'unverified'`
  until executed on real hardware, and `requiresGpuHost` where applicable.
  Distillation manifests must set `teacherToSAllowsDistillation: true`;
  the validator rejects them otherwise (R2 sign-off is a data flag, not
  a bypass).
- **Model cards** (`model-cards.ts`): card schema + validation including
  **licence inheritance** — a derived model's licence must be compatible
  with every dataset licence and the base model licence.
- **Ollama bridge** (`ollama.ts`): renders a `Modelfile` from a GGUF
  artifact + model card so `ollama create` can serve the derived model.

Hardware tiers are explicit in each recipe: `sandbox` (this repo —
contract tests only), `gpu-host` (recipe execution), `edge` (served via
Ollama on-device).

## Consequences

### Positive
- Licence obligations are machine-checked, not documentation-only.
- Recipes are honest: nothing claims to be trained until `status` flips.
- Foundry artifacts (dataset manifests, cards, Modelfiles) are
  serializable and versionable.

### Negative
- No actual training/quantization happens in this repo — v0 is contracts
  + registries; execution is delegated to GPU hosts.
- Distillation and DeepSpec remain blocked on external sign-offs (R2,
  ToS verification) even though the manifest schema supports them.

### Neutral
- Model Foundry does not replace the model gateway catalog; derived
  models register into `MODEL_CATALOG` only after quantization + card
  validation (P1F-06).

## Links
- P1F-01..P1F-07 in `brain-stack/workflows/ULTRA_AI_TODO.md`
- `@ultra-ai/model-gateway` catalog (`platform/services/model-gateway`)
