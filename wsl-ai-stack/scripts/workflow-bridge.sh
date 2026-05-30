#!/usr/bin/env bash
# Simple workflow bridge placeholder for WSL stack
# Usage: ./workflow-bridge.sh --start <workflowId> [--input '{...}']

set -euo pipefail

WORKFLOW_ID=""
INPUT_PAYLOAD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start)
      WORKFLOW_ID="$2"
      shift 2
      ;;
    --input)
      INPUT_PAYLOAD="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 --start <workflowId> [--input '{...}']"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "$WORKFLOW_ID" ]]; then
  echo "No workflow id provided. See --help"
  exit 1
fi

API_URL="http://localhost:4000/api/workflows/${WORKFLOW_ID}/execute"

echo "Starting workflow ${WORKFLOW_ID} via API: ${API_URL}"

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{ \"input\": ${INPUT_PAYLOAD:-null} }" | jq .
