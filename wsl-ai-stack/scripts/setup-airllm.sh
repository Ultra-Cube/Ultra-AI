#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AIRLLM_DIR="$ROOT_DIR/runtime/airllm"
MODE="${1:---check}"
TORCH_INDEX_URL="${AIRLLM_TORCH_INDEX_URL:-https://download.pytorch.org/whl/cu124}"

mkdir -p "$AIRLLM_DIR"

check_command() {
  command -v "$1" >/dev/null 2>&1
}

setup_airllm_env() {
  if ! check_command python3; then
    echo "python3 is missing" >&2
    exit 1
  fi

  python3 -m venv "$AIRLLM_DIR/.venv"
  "$AIRLLM_DIR/.venv/bin/pip" install -U pip wheel setuptools

  if check_command nvidia-smi; then
    "$AIRLLM_DIR/.venv/bin/pip" install --index-url "$TORCH_INDEX_URL" torch torchvision torchaudio
  else
    "$AIRLLM_DIR/.venv/bin/pip" install torch torchvision torchaudio
  fi

  "$AIRLLM_DIR/.venv/bin/pip" install airllm "optimum<2" "transformers<4.49" accelerate sentencepiece safetensors

  if [ "${AIRLLM_INSTALL_BNB:-0}" = "1" ] && check_command nvidia-smi; then
    "$AIRLLM_DIR/.venv/bin/pip" install bitsandbytes || true
  fi
}

check_airllm_env() {
  echo "AirLLM stack check"
  if check_command python3; then echo "[OK] python3: $(python3 --version 2>&1)"; else echo "[MISS] python3"; fi
  if check_command nvidia-smi; then
    echo "[OK] nvidia-smi"
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader 2>/dev/null | sed -n '1,4p' || true
  else
    echo "[MISS] nvidia-smi"
  fi
  if [ -d "$AIRLLM_DIR/.venv" ]; then echo "[OK] airllm venv exists"; else echo "[MISS] airllm venv"; fi
  if [ -x "$AIRLLM_DIR/.venv/bin/python" ]; then
    if "$AIRLLM_DIR/.venv/bin/python" - <<'PY'
import importlib.util

required = ["torch", "airllm", "transformers", "accelerate", "safetensors"]
missing = [name for name in required if importlib.util.find_spec(name) is None]
if missing:
    print("[MISS] airllm packages: " + ", ".join(missing))
    raise SystemExit(1)
print("[OK] airllm packages: torch, airllm, transformers, accelerate, safetensors")
PY
    then
      :
    fi
  fi
}

case "$MODE" in
  --check)
    check_airllm_env
    ;;
  --setup)
    setup_airllm_env
    ;;
  *)
    echo "Usage: $0 [--check|--setup]" >&2
    exit 2
    ;;
esac