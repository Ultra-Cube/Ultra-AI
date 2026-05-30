# Model Tracks

This stack currently treats the model layer as a pluggable target behind OpenClaw.
The control path is still:

assistant -> agent -> model -> tools

## Current default

- OpenClaw default: `ollama/gemma4:latest`
- This is the local, low-friction path for the WSL-first setup.

## AirLLM track

Repository: https://github.com/Fadhel-SH/Tools-GPU-AI_airllm

AirLLM is the memory-optimization layer for the GPU-hosted path. It is useful
when you want large-model inference on constrained VRAM by loading the model
through AirLLM instead of a standard full-memory runtime.

Use it when the assistant is moved to a GPU machine or a GPU-backed WSL host.
See [AIRLLM.md](AIRLLM.md) and `scripts/setup-airllm.sh` for the local lane.

## Kimi track

Repository: https://github.com/Fadhel-SH/AI-Model_Kimi-K2.5

OpenClaw now has a model alias for Kimi K2.5:

- alias: `kimi-k2.5`
- target: `moonshot/Kimi-K2.5`

That alias is the clean handoff point for a compatible OpenClaw provider or
remote API profile.

## Selection rule

- Use Ollama for the current local loop.
- Use AirLLM when the goal is low-VRAM large-model inference on GPU hardware.
- Use Kimi K2.5 when you want the agentic multimodal model track and the backend
  is ready for it.
- Keep the OpenClaw control path unchanged when swapping models.