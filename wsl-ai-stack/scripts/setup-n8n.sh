#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
N8N_DIR="$ROOT_DIR/runtime/n8n"
N8N_DATA="$ROOT_DIR/runtime/n8n-data"
PORT="${N8N_PORT:-5678}"
MODE="${1:---check}"

mkdir -p "$N8N_DIR" "$N8N_DATA"

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

check_command() {
  command -v "$1" >/dev/null 2>&1
}

install_n8n() {
  load_node_runtime
  local node_bin npm_bin
  node_bin="$(command -v node)"
  npm_bin="$(command -v npm)"
  if [ ! -f "$N8N_DIR/package.json" ]; then
    PATH="$(dirname "$node_bin"):$PATH" "$npm_bin" init -y --prefix "$N8N_DIR" >/dev/null 2>&1
  fi
  PATH="$(dirname "$node_bin"):$PATH" "$npm_bin" install --legacy-peer-deps --no-audit --no-fund --prefix "$N8N_DIR" n8n
}

start_n8n() {
  load_node_runtime
  local node_bin
  node_bin="$(command -v node)"
  export N8N_USER_FOLDER="$N8N_DATA"
  export N8N_PORT="$PORT"
  export N8N_HOST="127.0.0.1"
  export N8N_PROTOCOL="http"
  export N8N_SECURE_COOKIE="false"
  if [ -x "$N8N_DIR/node_modules/.bin/n8n" ]; then
    PATH="$(dirname "$node_bin"):$PATH" exec "$N8N_DIR/node_modules/.bin/n8n" start
  fi
  PATH="$(dirname "$node_bin"):$PATH" exec npx -y n8n start
}

case "$MODE" in
  --check)
    load_node_runtime
    echo "n8n setup check"
    if check_command node; then
      echo "[OK] node: $(node --version)"
    else
      echo "[MISS] node"
    fi
    if check_command npm; then
      echo "[OK] npm: $(npm --version)"
    else
      echo "[MISS] npm"
    fi
    echo "n8n data folder: $N8N_DATA"
    ;;
  --setup)
    install_n8n
    ;;
  --start)
    start_n8n
    ;;
  *)
    echo "Usage: $0 [--check|--setup|--start]"
    exit 2
    ;;
esac