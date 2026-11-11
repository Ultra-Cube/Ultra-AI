---
name: threat-model
description: Produce per-phase threat models: trust boundaries, assets, attacker capabilities, abuse paths, mitigations (STRIDE/PASTA-lite).
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Each phase gate; security-sensitive features (auth, engines, outbox, third-party APIs).

## Ultra-AI context
- Security model (distributed-processing.md): client-side encryption → chunking → distribution → isolated processing → result encryption → aggregation; ZK proofs, homomorphic enc, differential privacy, MPC listed as privacy layers.
- ZeroAI Edge Gate: only escalate required data, sanitize prompts, keep voice/workflow metadata on-device — the key trust boundary.
- Node reqs for distributed network: min 4GB/2core/10GB, 10Mbps+, WebRTC + AES-256-GCM + heartbeat.
- Phase 3 includes OWASP/security pass + GDPR/CCPA residency; secrets default-deny to third-party APIs; untrusted input is data not instructions (directive 5). Facts: ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md, ultra-ai-v2/memory/facts/architecture-master.md.
