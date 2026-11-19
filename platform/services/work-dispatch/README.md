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

# @ultra-ai/work-dispatch

Implements the `ultra.work-dispatch.v1` contract
(`platform/api/contracts/work-dispatch/work-dispatch.v1.json`):
distributes tasks across `local`, `hermes`, `openhands`,
`ultra-studio`, `customer`, and `specialist-agent` targets.

## Guarantees

- `task.sensitivity === 'sensitive'` or `task.requiresConfirmation === true`
  never executes without explicit approval — the dispatch is queued as
  `awaiting-confirmation` until `confirm()` is called.
- `execution.locality` is always reported (`local` vs `escalated`) so the
  UI can distinguish local-first execution from gateway escalation.
- `execution.trailRef` propagates the executor's trail reference; every
  dispatch produces an in-memory audit trail (`trailFor`).
- `signature` is readiness-only Ed25519 (contract field); no chain,
  wallet, token, or mining functionality is implemented.

## Usage

```ts
import { WorkDispatcher } from '@ultra-ai/work-dispatch';

const dispatcher = new WorkDispatcher({
  executors: {
    local: { execute: async (d) => ({ trailRef: `trail:${d.dispatchId}` }) },
    hermes: hermesExecutor,
  },
  locality: { hermes: 'local' }, // optional overrides
});

const result = await dispatcher.dispatch({
  task: { kind: 'code', payload: { repo: 'Ultra-AI' }, sensitivity: 'internal' },
  route: { target: 'hermes', priority: 5 },
});
```
