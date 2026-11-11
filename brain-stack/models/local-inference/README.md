# Local-Model "Brain" Scaffold

This directory scaffolds a **self-hosted model backend** ("brain") so Ultra-AI /
Hermes can run on a local inference endpoint instead of (or alongside) a hosted
API provider — the moment a GPU host is available.

> **Status: scaffold only.** Nothing here runs on this box. This host has **no GPU**
> and ~1.3 GB free RAM, so local inference is **not practical here**. These files are
> templates to drop onto a future GPU host.

## The concept

A "brain" is a local, OpenAI-compatible inference server (e.g. `http://localhost:8000/v1`)
that serves a self-hosted model. Hermes points at it through a **custom provider**
block (see `brain.config.yaml`). Once the endpoint is live, Hermes/Ultra-AI can route
model calls to your own hardware — no per-token API cost, full data locality.

```
Hermes / Ultra-AI  ──OpenAI-compatible HTTP──▶  local inference server (:8000/v1)  ──▶  GPU + model weights
```

## Hardware requirement

Local inference needs a **GPU** for any usable throughput.
- **This box: no GPU, ~1.3 GB free RAM → do not run inference here.**
- Target: a GPU host (CUDA). Size the GPU to the model + serving engine you pick.
- Model weights download in full first; ensure enough disk (a 70B model ≈ 100 GB+).

Check hardware before attempting anything:
```bash
nvidia-smi --query-gpu=name,memory.total --format=csv 2>/dev/null \
  || echo "NO GPU — do not run local inference here"
free -h | head -2
df -h .
```

## Files in this directory

| File | Purpose |
|---|---|
| `README.md` | This overview — concept + the GPU hardware requirement. |
| `brain.config.yaml` | Documented Hermes custom-provider block pointing at the local endpoint. |
| `run-airllm-server.sh` | **Example (NOT executed)** template that would load a model via AirLLM and serve it on a GPU host. |

## Choosing an inference engine

| Engine | Use when | Notes |
|---|---|---|
| **vLLM** | You have enough VRAM for the model and want throughput + an OpenAI-compatible server | Best default for serving. `--served-model-name`, exposes `/v1`. |
| **llama.cpp** (`llama-server`) | CPU or small-GPU, quantized GGUF weights | Much faster than AirLLM on CPU; OpenAI-compatible server built in. |
| **AirLLM** | Model is far larger than VRAM (e.g. 70B on 4–8 GB) and throughput doesn't matter | Layer-by-layer streaming from disk → slow; good for running huge models on tiny GPUs. Installed at `/opt/data/venvs/airllm`. See the `airllm` skill. |

Rule of thumb: **vLLM if it fits, llama.cpp for CPU/quantized, AirLLM only when the
model won't otherwise fit.** AirLLM does not ship an OpenAI server, so the example
script wraps it in a tiny FastAPI shim (see `run-airllm-server.sh`).

## Bring the brain online (on a GPU host)

1. Provision a GPU host; verify `nvidia-smi`.
2. Start an inference server (vLLM recommended) exposing `http://localhost:8000/v1`.
   - AirLLM path: install CUDA torch in `/opt/data/venvs/airllm`, then run
     `run-airllm-server.sh` (edit the model + host first).
3. Point Hermes at it: merge the provider block from `brain.config.yaml` into
   `~/.hermes/config.yaml` (or `$HERMES_HOME/config.yaml`), set `base_url`/`model`.
4. Verify: `curl -sS http://localhost:8000/v1/models` lists the served model, then
   run a trivial Hermes prompt against the custom provider.
