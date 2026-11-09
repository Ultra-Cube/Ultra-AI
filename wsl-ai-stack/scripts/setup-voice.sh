#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/runtime/voice"
MODE="${1:---check}"
VOICE_PACKAGES=(ovos-core SpeechRecognition pocketsphinx)

mkdir -p "$VOICE_DIR"

check_command() {
  command -v "$1" >/dev/null 2>&1
}

setup_voice_env() {
  if ! check_command python3; then
    echo "python3 is missing" >&2
    exit 1
  fi
  python3 -m venv "$VOICE_DIR/.venv"
  "$VOICE_DIR/.venv/bin/pip" install -U pip wheel setuptools
  "$VOICE_DIR/.venv/bin/pip" install "${VOICE_PACKAGES[@]}"
}

check_voice_env() {
  echo "Voice stack check"
  if check_command python3; then echo "[OK] python3: $(python3 --version 2>&1)"; else echo "[MISS] python3"; fi
  if check_command ffmpeg; then echo "[OK] ffmpeg"; else echo "[MISS] ffmpeg"; fi
  if check_command espeak-ng; then echo "[OK] espeak-ng"; else echo "[MISS] espeak-ng"; fi
  if [ -d "$VOICE_DIR/.venv" ]; then echo "[OK] voice venv exists"; else echo "[MISS] voice venv"; fi
  if [ -x "$VOICE_DIR/.venv/bin/python" ]; then
    if "$VOICE_DIR/.venv/bin/python" - <<'PY'
import importlib.util

required = ["ovos_core", "speech_recognition", "pocketsphinx"]
missing = [name for name in required if importlib.util.find_spec(name) is None]
if missing:
    print("[MISS] voice packages: " + ", ".join(missing))
    raise SystemExit(1)
print("[OK] voice packages: ovos_core, speech_recognition, pocketsphinx")
PY
    then
      :
    fi
  else
    echo "[MISS] voice python"
  fi
}

case "$MODE" in
  --check)
    check_voice_env
    ;;
  --setup)
    setup_voice_env
    ;;
  *)
    echo "Usage: $0 [--check|--setup]"
    exit 2
    ;;
esac