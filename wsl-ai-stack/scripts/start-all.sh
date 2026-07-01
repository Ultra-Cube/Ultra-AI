#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/runtime"
N8N_DIR="$RUNTIME_DIR/n8n"
LOG_DIR="$RUNTIME_DIR/logs"
N8N_LOG="$LOG_DIR/n8n.log"
N8N_PORT="5678"
OLLAMA_HOST="${OLLAMA_HOST:-http://172.19.144.1:11434}"
MODEL="${OPENCLAW_MODEL:-ollama/gemma4:latest}"

load_node_runtime() {
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    if command -v nvm >/dev/null 2>&1; then
      local nvm_node_bin
      nvm_node_bin="$(nvm which --lts 2>/dev/null || true)"
      if [ -x "$nvm_node_bin" ]; then
        PATH="$(dirname "$nvm_node_bin"):$PATH"
      fi
    fi
  fi
}

check_ollama() {
  if curl -fsS "$OLLAMA_HOST/api/version" >/dev/null 2>&1; then
    echo "[OK] Ollama reachable at $OLLAMA_HOST"
  else
    echo "[WARN] Ollama is not reachable at $OLLAMA_HOST"
  fi
}

check_openclaw() {
  if command -v openclaw >/dev/null 2>&1; then
    echo "[OK] OpenClaw CLI available"
    openclaw status || true
  else
    echo "[MISS] OpenClaw CLI not on PATH"
  fi
}

start_n8n() {
  mkdir -p "$N8N_DIR" "$LOG_DIR"
  export N8N_USER_FOLDER="$N8N_DIR"
  export N8N_PORT="$N8N_PORT"
  export N8N_HOST="127.0.0.1"
  export N8N_PROTOCOL="http"
  export N8N_SECURE_COOKIE="false"

  if [ ! -x "$ROOT_DIR/node_modules/.bin/n8n" ]; then
    echo "[MISS] n8n binary not found under $ROOT_DIR/node_modules/.bin/n8n"
    return 1
  fi

  if pgrep -f "n8n start" >/dev/null 2>&1; then
    echo "[OK] n8n already running on port $N8N_PORT"
    return 0
  fi

  nohup "$ROOT_DIR/node_modules/.bin/n8n" start >"$N8N_LOG" 2>&1 &
  echo "[OK] n8n starting on http://127.0.0.1:$N8N_PORT"
  echo "     log: $N8N_LOG"
}

main() {
  load_node_runtime
  cd "$ROOT_DIR"
  echo "ZeroAI / WSL stack start"
  echo "Project: $ROOT_DIR"
  echo "Model alias: $MODEL"
  echo

  check_ollama
  echo
  check_openclaw
  echo
  start_n8n
  echo
  echo "Useful checks:"
  echo "  bash ./scripts/openclaw-bridge.sh \"summarize the current system state\""
  echo "  bash ./scripts/voice-bridge.sh --sample --speak-response"
  echo "  bash ./scripts/setup-airllm.sh --check"
  echo "  bash ./scripts/setup-voice.sh --check"
  echo "  tail -f \"$N8N_LOG\""
}

main "$@"
