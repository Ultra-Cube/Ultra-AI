# ZeroAI Memory Design

ZeroAI needs memory to behave like a real assistant rather than a one-shot chatbot.

## Memory goals

- remember recent conversations
- store task outcomes
- keep user preferences
- recall previous tool usage
- support long-term improvement

## Memory layers

### Short-term memory

Used for the current conversation window and active task context.

### Long-term memory

Used for persistent user preferences, repeated workflows, and assistant behavior tuning.

### Task memory

Used for commands, failures, successful tool runs, and workflow history.

## Suggested OSS stack

- SQLite for durable local records
- Qdrant for vector search and retrieval
- Mem0 for agent memory management

## Principle

Memory should be local-first and offline-capable.
If a memory component needs the network, it should not become a hard dependency for core assistant behavior.

