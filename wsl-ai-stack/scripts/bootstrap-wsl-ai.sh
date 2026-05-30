#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/runtime"
VOICE_DIR="$RUNTIME_DIR/voice"
N8N_DIR="$RUNTIME_DIR/n8n"
LOG_DIR="$RUNTIME_DIR/logs"

check_command() {
  command -v "$1" >/dev/null 2>&1
}

print_line() {
  printf '%s\n' "$1"
}

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

ensure_runtime_dirs() {
  mkdir -p "$RUNTIME_DIR" "$VOICE_DIR" "$N8N_DIR" "$LOG_DIR"
}

check_system() {
  load_node_runtime
  print_line "WSL AI bootstrap check"
  print_line "Project root: $ROOT_DIR"
  print_line ""

  if check_command bash; then print_line "[OK] bash"; else print_line "[MISS] bash"; fi
  if check_command curl; then print_line "[OK] curl"; else print_line "[MISS] curl"; fi
  if check_command git; then print_line "[OK] git"; else print_line "[MISS] git"; fi
  if check_command node; then print_line "[OK] node: $(node --version)"; else print_line "[MISS] node"; fi
  if check_command python3; then print_line "[OK] python3: $(python3 --version 2>&1)"; else print_line "[MISS] python3"; fi
  if check_command openclaw; then
    print_line "[OK] openclaw"
  else
    print_line "[MISS] openclaw"
  fi
  if check_command docker; then
    print_line "[OK] docker: $(docker --version 2>/dev/null)"
  else
    print_line "[MISS] docker"
  fi

  print_line ""
  if sudo -n true >/dev/null 2>&1; then
    print_line "[OK] passwordless sudo available"
  else
    print_line "[WARN] sudo needs a password"
  fi

  print_line ""
  if [ -f "$HOME/.openclaw/openclaw.json" ]; then
    print_line "[OK] OpenClaw config exists at ~/.openclaw/openclaw.json"
  else
    print_line "[WARN] OpenClaw config is missing"
  fi

  local ollama_hosts=(
    "${OLLAMA_HOST:-}"
    "http://127.0.0.1:11434"
    "http://localhost:11434"
    "http://172.19.144.1:11434"
    "http://172.21.240.1:11434"
  )

  local found_ollama=false
  for host in "${ollama_hosts[@]}"; do
    [ -n "$host" ] || continue
    if curl -fsS "$host/api/version" >/dev/null 2>&1; then
      print_line "[OK] Ollama reachable at $host"
      found_ollama=true
      break
    fi
  done

  if [ "$found_ollama" = false ]; then
    print_line "[WARN] Ollama not detected on common hosts"
  fi
}

setup_packages() {
  if ! sudo -n true >/dev/null 2>&1; then
    print_line "sudo requires a password, cannot auto-install packages"
    return 1
  fi

  print_line "Installing WSL packages"
  sudo apt update
  sudo apt install -y python3-venv python3-pip jq ripgrep ffmpeg sox espeak-ng portaudio19-dev build-essential
}

setup_openvoiceos() {
  print_line "Setting up OpenVoiceOS voice venv"
  python3 -m venv "$VOICE_DIR/.venv"
  "$VOICE_DIR/.venv/bin/pip" install -U pip wheel setuptools
  "$VOICE_DIR/.venv/bin/pip" install ovos-core
}

setup_n8n_note() {
  cat <<'NOTE'
Local n8n setup note:

This project uses a shell first WSL install path for n8n.
Recommended command when you are ready:

  cd /home/pc/ucube/project/Ultra-AI/wsl-ai-stack
  bash ./scripts/setup-n8n.sh --setup

NOTE
}

main() {
  ensure_runtime_dirs
  case "${1:---check}" in
    --check)
      check_system
      setup_n8n_note
      ;;
    --setup|--all)
      check_system
      setup_packages
      setup_openvoiceos
      setup_n8n_note
      ;;
    *)
      echo "Usage: $0 [--check|--setup|--all]"
      exit 2
      ;;
  esac
}

main "$@"