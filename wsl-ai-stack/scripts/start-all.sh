#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=""
RUNTIME_DIR="/runtime"
N8N_DIR="/n8n"
N8N_DATA="/n8n-data"
LOG_DIR="/logs"
N8N_LOG="/n8n.log"
N8N_PORT="5678"
OLLAMA_HOST="http://172.19.144.1:11434"
MODEL="ollama/gemma4:latest"

load_node_runtime() {
  local node_root="/mnt/c/Users/PC/Documents/Codex/2026-05-30/download-and-install-opneclaw-jarvis-ai/work/linux-tools/node/bin"
  if [ -x "/node" ]; then
    PATH=":/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/usr/lib/wsl/lib:/mnt/c/Program Files/WindowsApps/Microsoft.PowerShell_7.6.2.0_x64__8wekyb3d8bbwe:/mnt/c/Users/PC/.codex/tmp/arg0/codex-arg0x9PaMC:/mnt/c/WINDOWS/system32:/mnt/c/WINDOWS:/mnt/c/WINDOWS/System32/Wbem:/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/:/mnt/c/WINDOWS/System32/OpenSSH/:/mnt/c/Program Files/NVIDIA Corporation/NVIDIA App/NvDLISR:/mnt/c/Program Files (x86)/NVIDIA Corporation/PhysX/Common:/mnt/c/Program Files/dotnet/:/mnt/c/Program Files/Docker/Docker/resources/bin:/mnt/c/Program Files/Git/cmd:/mnt/c/Program Files/nodejs/:/mnt/c/Users/PC/.local/bin:/mnt/c/Users/PC/AppData/Local/Microsoft/WindowsApps:/mnt/c/Users/PC/AppData/Local/Programs/Microsoft VS Code/bin:/mnt/c/Gate_OS/DevHub/Windsurf/Windsurf/bin:/mnt/c/Users/PC/AppData/Local/XPipe/cli/bin:/mnt/c/Program Files/Git/bin:/mnt/c/Users/PC/AppData/Roaming/npm:/mnt/c/Gate_OS/DevHub/Antigravity/Antigravity/bin:/mnt/c/Users/PC/AppData/Local/PowerToys/DSCModules/:/mnt/c/Users/PC/AppData/Local/Programs/Ollama:/mnt/c/Users/PC/AppData/Local/OpenAI/Codex/bin/ada252862d154cdd:/mnt/c/Program Files/WindowsApps/OpenAI.Codex_26.527.3686.0_x64__2p2nqsd0c76g0/app/resources"
    return
  fi
  if [ -s "/home/pc/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "/home/pc/.nvm/nvm.sh"
    if command -v nvm >/dev/null 2>&1; then
      local nvm_node_bin
      nvm_node_bin=""
      if [ -x "" ]; then
        PATH=".:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/usr/lib/wsl/lib:/mnt/c/Program Files/WindowsApps/Microsoft.PowerShell_7.6.2.0_x64__8wekyb3d8bbwe:/mnt/c/Users/PC/.codex/tmp/arg0/codex-arg0x9PaMC:/mnt/c/WINDOWS/system32:/mnt/c/WINDOWS:/mnt/c/WINDOWS/System32/Wbem:/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/:/mnt/c/WINDOWS/System32/OpenSSH/:/mnt/c/Program Files/NVIDIA Corporation/NVIDIA App/NvDLISR:/mnt/c/Program Files (x86)/NVIDIA Corporation/PhysX/Common:/mnt/c/Program Files/dotnet/:/mnt/c/Program Files/Docker/Docker/resources/bin:/mnt/c/Program Files/Git/cmd:/mnt/c/Program Files/nodejs/:/mnt/c/Users/PC/.local/bin:/mnt/c/Users/PC/AppData/Local/Microsoft/WindowsApps:/mnt/c/Users/PC/AppData/Local/Programs/Microsoft VS Code/bin:/mnt/c/Gate_OS/DevHub/Windsurf/Windsurf/bin:/mnt/c/Users/PC/AppData/Local/XPipe/cli/bin:/mnt/c/Program Files/Git/bin:/mnt/c/Users/PC/AppData/Roaming/npm:/mnt/c/Gate_OS/DevHub/Antigravity/Antigravity/bin:/mnt/c/Users/PC/AppData/Local/PowerToys/DSCModules/:/mnt/c/Users/PC/AppData/Local/Programs/Ollama:/mnt/c/Users/PC/AppData/Local/OpenAI/Codex/bin/ada252862d154cdd:/mnt/c/Program Files/WindowsApps/OpenAI.Codex_26.527.3686.0_x64__2p2nqsd0c76g0/app/resources"
      fi
    fi
  fi
}

check_ollama() {
  if curl -fsS "/api/version" >/dev/null 2>&1; then
    echo "[OK] Ollama reachable at "
  else
    echo "[WARN] Ollama is not reachable at "
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
  mkdir -p "" ""
  export N8N_USER_FOLDER=""
  export N8N_PORT=""
  export N8N_HOST="127.0.0.1"
  export N8N_PROTOCOL="http"
  export N8N_SECURE_COOKIE="false"

  if [ ! -x "/node_modules/.bin/n8n" ]; then
    echo "[MISS] n8n binary not found under "
    return 1
  fi

  if pgrep -f "n8n.*" >/dev/null 2>&1; then
    echo "[OK] n8n already running on port "
    return 0
  fi

  nohup "/node_modules/.bin/n8n" start >"" 2>&1 &
  echo "[OK] n8n starting on http://127.0.0.1:"
  echo "     log: "
}

main() {
  load_node_runtime
  cd ""
  echo "Ultra AI WSL stack start"
  echo "Project: "
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
  echo "  tail -f \"\""
  echo
  echo "Model alias in use: "
}

main ""
