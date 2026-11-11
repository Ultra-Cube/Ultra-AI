#!/usr/bin/env bash
# =============================================================================
# run-airllm-server.sh — EXAMPLE TEMPLATE, DO NOT RUN ON THIS HOST
# =============================================================================
# This is a documented, NON-EXECUTED template. It loads a large model via AirLLM
# (layer-by-layer streaming) and wraps it in a tiny OpenAI-compatible FastAPI
# server so Hermes can talk to it at http://localhost:8000/v1.
#
#   *** REQUIRES A GPU HOST. ***
#   This box has NO GPU and ~1.3 GB free RAM — running this here is pointless
#   (impractically slow / will OOM). The script refuses to run without a GPU
#   unless you explicitly set ALLOW_NO_GPU=1.
#
# Prefer vLLM or llama.cpp when they fit (see brain.config.yaml). Use AirLLM only
# when the model is far larger than available VRAM.
# =============================================================================
set -euo pipefail

# ---- Config (edit these) ----------------------------------------------------
VENV="/opt/data/venvs/airllm"
MODEL="${MODEL:-meta-llama/Meta-Llama-3.1-8B-Instruct}"  # HF repo id to serve
SERVED_NAME="${SERVED_NAME:-local-model}"                # must match brain.config.yaml `model`
HOST="${HOST:-127.0.0.1}"                                # bind localhost by default (safer)
PORT="${PORT:-8000}"
MAX_NEW_TOKENS="${MAX_NEW_TOKENS:-256}"

# ---- GPU guard --------------------------------------------------------------
if ! nvidia-smi >/dev/null 2>&1; then
  if [ "${ALLOW_NO_GPU:-0}" != "1" ]; then
    echo "ERROR: no GPU detected. AirLLM is impractical without a GPU." >&2
    echo "       This is a template — deploy on a GPU host." >&2
    echo "       (Override for testing only with ALLOW_NO_GPU=1, not recommended.)" >&2
    exit 1
  fi
  echo "WARNING: ALLOW_NO_GPU=1 set — proceeding without a GPU (will be very slow)." >&2
fi

# ---- Environment ------------------------------------------------------------
if [ ! -d "$VENV" ]; then
  echo "ERROR: venv not found at $VENV (see the 'airllm' skill to create it)." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"

# On a GPU host, ensure CUDA torch + the server deps are installed:
#   uv pip install torch --index-url https://download.pytorch.org/whl/cu124
#   uv pip install airllm fastapi uvicorn
python3 -c "import fastapi, uvicorn" 2>/dev/null || {
  echo "ERROR: fastapi/uvicorn missing in venv. Install: uv pip install fastapi uvicorn" >&2
  exit 1
}

# ---- Inline OpenAI-compatible FastAPI shim over AirLLM ----------------------
# AirLLM has no built-in OpenAI server, so we expose minimal /v1 routes.
export BRAIN_MODEL="$MODEL" BRAIN_SERVED_NAME="$SERVED_NAME" BRAIN_MAX_NEW="$MAX_NEW_TOKENS"

python3 - "$HOST" "$PORT" <<'PY'
import os, sys, time, uuid
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from airllm import AutoModel
import torch

MODEL       = os.environ["BRAIN_MODEL"]
SERVED_NAME = os.environ["BRAIN_SERVED_NAME"]
MAX_NEW     = int(os.environ["BRAIN_MAX_NEW"])

print(f"[brain] loading {MODEL} via AirLLM (first run downloads + splits layers — slow)...")
model = AutoModel.from_pretrained(MODEL)   # layer weights stream at generation time
device = "cuda" if torch.cuda.is_available() else "cpu"

app = FastAPI()

class Msg(BaseModel):
    role: str
    content: str

class ChatReq(BaseModel):
    model: str | None = None
    messages: list[Msg]
    max_tokens: int | None = None

@app.get("/v1/models")
def list_models():
    return {"object": "list",
            "data": [{"id": SERVED_NAME, "object": "model", "owned_by": "local-brain"}]}

@app.post("/v1/chat/completions")
def chat(req: ChatReq):
    prompt = "\n".join(f"{m.role}: {m.content}" for m in req.messages) + "\nassistant:"
    inp = model.tokenizer([prompt], return_tensors="pt", return_attention_mask=False,
                          truncation=True, max_length=2048, padding=False)
    out = model.generate(inp["input_ids"].to(device),
                         max_new_tokens=req.max_tokens or MAX_NEW,
                         use_cache=True, return_dict_in_generate=True)
    text = model.tokenizer.decode(out.sequences[0], skip_special_tokens=True)
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": SERVED_NAME,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": text},
                     "finish_reason": "stop"}],
    }

host, port = sys.argv[1], int(sys.argv[2])
print(f"[brain] serving OpenAI-compatible API on http://{host}:{port}/v1 (model id: {SERVED_NAME})")
uvicorn.run(app, host=host, port=port)
PY
