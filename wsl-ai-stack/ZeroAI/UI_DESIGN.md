# ZeroAI UI Design

ZeroAI needs a local user interface that acts as the control surface for the assistant.

## UI goals

- start and stop ZeroAI
- show system status
- show voice input state
- show model routing state
- show memory and task history
- expose n8n workflow visibility
- keep the user inside one interface

## Recommended shape

- a lightweight local web app or desktop launcher
- a single command entry box
- a voice input button
- status cards for OpenClaw, Ollama, n8n, and tools
- a task log panel

## UI principle

The UI should not replace Zero.
It should simply let the user operate ZeroAI while Zero handles orchestration in the background.

