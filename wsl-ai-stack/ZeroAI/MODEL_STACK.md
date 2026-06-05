# ZeroAI Model Stack

## Default lane

- OpenClaw default model: `ollama/gemma4:latest`
- Local inference stays on Ollama first

## Future lanes

- Kimi alias when the provider profile is ready
- AirLLM when we want a GPU-oriented lane

## Selection rule

1. Prefer Ollama for the local WSL loop
2. Keep OpenClaw as the routing layer
3. Swap the model backend without changing Zero
4. Add new providers only if they fit the same control contract
