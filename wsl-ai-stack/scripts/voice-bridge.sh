#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOICE_DIR="$ROOT_DIR/runtime/voice"
SAMPLES_DIR="$ROOT_DIR/runtime/samples"
LOG_DIR="$ROOT_DIR/runtime/logs"
VOICE_PYTHON="$VOICE_DIR/.venv/bin/python"
MODE="file"
INPUT_FILE=""
SAMPLE_TEXT="ready to use openclaw from voice"
SPEAK_RESPONSE=false

mkdir -p "$LOG_DIR" "$SAMPLES_DIR"

usage() {
  cat <<'EOF'
Usage: voice-bridge.sh --file AUDIO.wav [--speak-response]
       voice-bridge.sh --sample [--speak-response]
       voice-bridge.sh --demo [--speak-response]

Transcribes a WAV file with local PocketSphinx, sends the text to OpenClaw,
and prints the response. Sample and demo modes synthesize a reusable WAV with
espeak-ng so the full voice path can be tested in WSL without a microphone.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --file)
      INPUT_FILE="${2:-}"
      MODE="file"
      shift 2
      ;;
    --sample)
      MODE="sample"
      shift
      ;;
    --demo)
      MODE="sample"
      shift
      ;;
    --demo-text|--sample-text)
      SAMPLE_TEXT="${2:-}"
      shift 2
      ;;
    --speak-response)
      SPEAK_RESPONSE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ ! -x "$VOICE_PYTHON" ]; then
  echo "Voice venv is missing. Run scripts/setup-voice.sh --setup first." >&2
  exit 1
fi

if ! command -v espeak-ng >/dev/null 2>&1; then
  echo "espeak-ng is required for sample mode" >&2
  exit 1
fi

audio_file="$INPUT_FILE"
sample_file="$SAMPLES_DIR/voice-sample.wav"
cleanup() {
  :
}
trap cleanup EXIT

if [ "$MODE" = "sample" ]; then
  audio_file="$sample_file"
  "$ROOT_DIR/scripts/voice-sample.sh" --output "$audio_file" --text "$SAMPLE_TEXT" >/dev/null
fi

if [ -z "$audio_file" ]; then
  echo "Missing audio input. Use --file AUDIO.wav or --sample." >&2
  exit 2
fi

if [ ! -f "$audio_file" ]; then
  echo "Audio file not found: $audio_file" >&2
  exit 1
fi

transcript="$($VOICE_PYTHON - "$audio_file" <<'PY'
import importlib.util
import sys

audio_path = sys.argv[1]
if importlib.util.find_spec("speech_recognition") is None:
    print("speech_recognition is not installed", file=sys.stderr)
    raise SystemExit(1)

import speech_recognition as sr

recognizer = sr.Recognizer()
with sr.AudioFile(audio_path) as source:
    audio = recognizer.record(source)

try:
    text = recognizer.recognize_sphinx(audio)
except sr.UnknownValueError:
    print("Could not understand the audio", file=sys.stderr)
    raise SystemExit(3)
except sr.RequestError as exc:
    print(f"Speech recognition error: {exc}", file=sys.stderr)
    raise SystemExit(4)

print(text.strip())
PY
)"

if [ -z "$transcript" ]; then
  echo "Voice transcription returned no text" >&2
  exit 1
fi

printf '%s\n' "[$(date -Is)] mode=$MODE input=$audio_file transcript=$transcript" >> "$LOG_DIR/voice-bridge.log"
printf 'Transcript: %s\n' "$transcript"

response="$($ROOT_DIR/scripts/openclaw-bridge.sh "$transcript")"
printf '%s\n' "$response"

if [ "$SPEAK_RESPONSE" = true ]; then
  spoken_text="$(printf '%s\n' "$response" | awk 'NF { line=$0 } END { print line }')"
  if [ -n "$spoken_text" ]; then
    espeak-ng "$spoken_text" >/dev/null 2>&1 || true
  fi
fi