#!/usr/bin/env bash
# OmniRoute dev server launcher for the Ultra-AI WSL stack.
# OmniRoute requires Node >=22 (engines: >=22 <23 || >=24 <27); the system
# /usr/bin/node may be older, so resolve the nvm default runtime first.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ULTRA_AI_DIR="$(cd "$ROOT_DIR/.." && pwd)"
OMNIROUTE_DIR="$ULTRA_AI_DIR/external/github-forks/OmniRoute"
PORT="${OMNIROUTE_PORT:-20128}"
LOG_DIR="$ROOT_DIR/runtime/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/omniroute.log"

load_node_runtime() {
  unset npm_config_prefix npm_config_userconfig npm_config_global_prefix 2>/dev/null || true
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    if command -v nvm >/dev/null 2>&1; then
      local nvm_node_bin
      nvm_node_bin="$(nvm which --lts 2>/dev/null || nvm which default 2>/dev/null || true)"
      if [ -x "$nvm_node_bin" ]; then
        PATH="$(dirname "$nvm_node_bin"):$PATH"
      fi
    fi
  fi
}

main() {
  load_node_runtime

  if ! [ -d "$OMNIROUTE_DIR" ]; then
    echo "[FAIL] OmniRoute checkout not found at $OMNIROUTE_DIR" >&2
    exit 1
  fi

  local node_version
  node_version="$(node --version 2>/dev/null || echo missing)"
  echo "[INFO] node: $node_version"

  # engines: >=22 <23 || >=24 <27 — refuse to start on older runtimes
  if ! node -e "const v=process.versions.node.split(\".\").map(Number);process.exit((v[0]===22||(v[0]===24||v[0]===25||v[0]===26))?0:1)" 2>/dev/null; then
    echo "[FAIL] OmniRoute needs Node >=22 (got $node_version). Install via nvm: nvm install --lts" >&2
    exit 1
  fi

  if curl --connect-timeout 2 --max-time 4 -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 \
     || pgrep -f "run-next.mjs dev" >/dev/null 2>&1; then
    echo "[OK] OmniRoute already running on http://127.0.0.1:$PORT"
    return 0
  fi

  cd "$OMNIROUTE_DIR"
  if [ ! -d node_modules ]; then
    echo "[INFO] Installing OmniRoute dependencies (first run)..."
    npm install
  fi

  echo "[OK] Starting OmniRoute on http://127.0.0.1:$PORT (log: $LOG_FILE)"
  # setsid + full fd detach so the server survives this launcher exiting
  setsid nohup npm run dev >"$LOG_FILE" 2>&1 < /dev/null &
  echo "[PID] $!"
}

main "$@"
