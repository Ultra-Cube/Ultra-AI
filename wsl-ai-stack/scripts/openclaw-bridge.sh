#!/usr/bin/env bash
set -euo pipefail

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

load_node_runtime

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'EOF'
Usage: openclaw-bridge.sh [--agent] "prompt text"

Defaults to OpenClaw infer/model mode. Pass --agent to use agent mode.
EOF
  exit 0
fi

MODE="${OPENCLAW_MODE:-infer}"
if [ "${1:-}" = "--agent" ]; then
  MODE="agent"
  shift
fi

PROMPT="${*:-}"
if [ -z "$PROMPT" ]; then
  if [ -t 0 ]; then
    echo "Usage: $0 [--agent] \"prompt text\"" >&2
    exit 2
  fi
  PROMPT="$(cat)"
fi

if ! command -v openclaw >/dev/null 2>&1; then
  echo "openclaw CLI is not installed or not on PATH" >&2
  exit 1
fi

if [ "$MODE" = "agent" ]; then
  exec openclaw agent --message "$PROMPT" --thinking high
fi

MODEL="${OPENCLAW_MODEL:-ollama/gemma4:latest}"
exec openclaw infer model run --model "$MODEL" --prompt "$PROMPT"