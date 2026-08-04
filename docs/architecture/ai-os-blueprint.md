# AI Operating System Blueprint

## Overview

Ultra AI is evolving from a fragmented AI experience into a full AI operating system. The new control surface keeps ZeroAI as the local operator, while adding a professional panel for engineers and operators to inspect routing, agent health, workflow execution, and the latest reasoning trace.

## Core experience

- Simple mode: a user-friendly surface for everyday prompts and workflow execution.
- Professional mode: a command center for operators, engineers, and AI builders.
- Local-first routing: ZeroAI stays on the device, then escalates to OpenClaw, n8n, or the distributed network when needed.
- Persistent state: the API stores memory, workflows, agent health, and runtime traces in a durable JSON state file.

## Runtime layers

1. Ingress layer
   - Receives voice and text input through ZeroAI.
   - Sanitizes and records the prompt before any routing occurs.

2. Routing layer
   - Uses the OpenClaw bridge as the default policy engine.
   - Records a trace entry for every successful and degraded route.

3. Automation layer
   - Stores reusable workflows and exposes run endpoints for ZeroAI and operators.
   - Updates workflow status and emits a trace on start, success, and failure.

4. Observability layer
   - Exposes health snapshots for OpenClaw, n8n, local model, and network state.
   - Keeps recent memory and trace history available to UI and operators.

## API surface

- `GET /zeroai/state`
- `GET /zeroai/memory`
- `GET /zeroai/workflows`
- `POST /zeroai/message`
- `POST /zeroai/workflows`
- `POST /zeroai/workflows/:id/run`

## UI surface

The ZeroAI web page now supports a dual experience:

- Simple mode for end users
- Professional mode for operators and developers

Both modes read from the same backend state and reflect the latest memory, workflow, and trace events.

## Next milestones

- Add richer role-based workspaces for different user personas.
- Connect the control surface to additional providers and tool adapters.
- Expand the trace view into a full timeline and event stream.
- Add authentication and multi-user workspaces for shared operator views.
