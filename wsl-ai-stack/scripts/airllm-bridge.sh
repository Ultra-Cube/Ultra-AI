#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AIRLLM_DIR="$ROOT_DIR/runtime/airllm"
AIRLLM_PYTHON="$AIRLLM_DIR/.venv/bin/python"
MODEL_ID="${AIRLLM_MODEL:-moonshotai/kimi-k2.5}"
COMPRESSION="${AIRLLM_COMPRESSION:-none}"
MAX_LENGTH="${AIRLLM_MAX_LENGTH:-256}"
MAX_NEW_TOKENS="${AIRLLM_MAX_NEW_TOKENS:-128}"
PROMPT="${*:-}"

if [ -z "$PROMPT" ]; then
  if [ -t 0 ]; then
    echo "Usage: $0 [prompt text]" >&2
    exit 2
  fi
  PROMPT="$(cat)"
fi

if [ ! -x "$AIRLLM_PYTHON" ]; then
  echo "AirLLM venv is missing. Run scripts/setup-airllm.sh --setup first." >&2
  exit 1
fi

if [ "${AIRLLM_DRY_RUN:-0}" = "1" ]; then
  printf 'AirLLM dry run\nmodel=%s\ncompression=%s\nprompt=%s\n' "$MODEL_ID" "$COMPRESSION" "$PROMPT"
  exit 0
fi

exec "$AIRLLM_PYTHON" - "$MODEL_ID" "$COMPRESSION" "$MAX_LENGTH" "$MAX_NEW_TOKENS" "$PROMPT" <<'PY'
import sys

try:
    import torch
    from airllm import AutoModel
except Exception as exc:
    print(f"AirLLM import failed: {exc}", file=sys.stderr)
    raise SystemExit(1)

model_id = sys.argv[1]
compression = sys.argv[2]
max_length = int(sys.argv[3])
max_new_tokens = int(sys.argv[4])
prompt = sys.argv[5]

if not torch.cuda.is_available():
    print("CUDA GPU is not available in this WSL session", file=sys.stderr)
    raise SystemExit(2)

init_kwargs = {}
if compression != "none":
    init_kwargs["compression"] = compression

model = AutoModel.from_pretrained(model_id, **init_kwargs)
input_tokens = model.tokenizer(
    [prompt],
    return_tensors="pt",
    return_attention_mask=False,
    truncation=True,
    max_length=max_length,
    padding=False,
)

generation_output = model.generate(
    input_tokens["input_ids"].cuda(),
    max_new_tokens=max_new_tokens,
    use_cache=True,
    return_dict_in_generate=True,
)

print(model.tokenizer.decode(generation_output.sequences[0]))
PY