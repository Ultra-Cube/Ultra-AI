#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZEROAI_DIR="$ROOT_DIR/ZeroAI"

echo "ZeroAI start"
echo "Docs: $ZEROAI_DIR"
echo

cd "$ROOT_DIR"
bash ./scripts/bootstrap-wsl-ai.sh --check
echo
echo "ZeroAI UI: http://localhost:3000/zeroai"
echo "API base:   http://localhost:4000"
echo
bash ./scripts/openclaw-bridge.sh "ZeroAI online. Summarize the current assistant routing and local workflow state."
