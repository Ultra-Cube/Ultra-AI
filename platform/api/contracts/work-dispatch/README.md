# work-dispatch contract (ultra.work-dispatch.v1)

Readiness contract for distributing work across customers and specialized
agents. Defines the envelope a dispatcher emits when routing a task to a
target (`local`, `hermes`, `openhands`, `ultra-studio`, `customer`,
`specialist-agent`).

Rules (per platform security architecture):

- `sensitivity: "sensitive"` or `requiresConfirmation: true` tasks MUST pass an
  explicit confirmation gate before execution; `execution.confirmedAt` records
  it.
- `execution.locality` must be reported (`local` vs `escalated`) so the UI can
  show where work ran; `trailRef` links to the execution trail.
- `signature` is readiness-only (Ed25519 over canonical JSON) for later phases;
  no blockchain/chain features are implemented here.
