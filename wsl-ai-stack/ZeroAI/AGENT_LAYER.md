# ZeroAI Agent Layer

ZeroAI does not need a separate public assistant personality in front of OpenClaw.
It does need an internal agent layer that can decide when to:

- answer directly
- ask the model layer for help
- trigger a local tool
- open or control an application
- route into n8n
- escalate to a longer agentic workflow

## Rule

The agent layer should stay behind Zero and OpenClaw.
It should not become a second assistant surface for the user.

## Responsibilities

- classify the request
- decide the execution path
- choose whether to use agent mode or simple inference
- keep track of task state
- update memory with what happened

## Suggested implementation shape

- a lightweight router in Python or shell
- a memory-backed policy module
- a tool registry for local apps and workflows
- an OpenClaw bridge for model and action selection

