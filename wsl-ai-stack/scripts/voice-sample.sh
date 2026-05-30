#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SAMPLES_DIR="$ROOT_DIR/runtime/samples"
OUTPUT_FILE="$SAMPLES_DIR/voice-sample.wav"
TEXT="ready to use openclaw from voice"

while [ $# -gt 0 ]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --text)
      TEXT="${2:-}"
      shift 2
      ;;
    -h|--help)
      cat <<'EOF'
Usage: voice-sample.sh [--output FILE.wav] [--text "sample text"]

Create a reusable WAV sample with espeak-ng for the WSL voice bridge.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if ! command -v espeak-ng >/dev/null 2>&1; then
  echo "espeak-ng is required to create the sample WAV" >&2
  exit 1
fi

if [ -z "$OUTPUT_FILE" ]; then
  echo "Missing output path" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"
espeak-ng -w "$OUTPUT_FILE" "$TEXT"
printf '%s\n' "$OUTPUT_FILE"