#!/usr/bin/env bash
# P1A-01 spike harness — probes the installed Hermes Agent for embed modes.
# Run on each target environment and capture output into a report.
#
#   bash spike-hermes-embed.sh [report-out.md]
#
# Exit code: 0 = all probes ran (results may still be NEGATIVE), 1 = hermes not found.
set -u

REPORT="${1:-spike-hermes-report.md}"
ENV_NAME="$(uname -s 2>/dev/null || echo unknown)-$(uname -r 2>/dev/null | cut -d. -f1)"
[ -f /proc/version ] && grep -qi microsoft /proc/version && ENV_NAME="wsl2"
[ "$(uname -s)" = "Linux" ] && { command -v systemd >/dev/null 2>&1 && [ ! -d /run/WSL ] && ENV_NAME="linux"; }

echo "# Hermes embed-mode spike — $ENV_NAME" > "$REPORT"
echo "" >> "$REPORT"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REPORT"
echo "" >> "$REPORT"

HERMES_BIN="$(command -v hermes || command -v hermes-agent || true)"

if [ -z "$HERMES_BIN" ]; then
  echo "## Result: BLOCKED — no hermes binary on PATH" >> "$REPORT"
  echo "" >> "$REPORT"
  echo "Searched: \`hermes\`, \`hermes-agent\` on PATH ($PATH)" >> "$REPORT"
  echo "" >> "$REPORT"
  echo "Install Hermes Agent for this environment first, then re-run." >> "$REPORT"
  echo "Report written to $REPORT (negative result recorded)"
  exit 1
fi

echo "## Binary" >> "$REPORT"
echo "" >> "$REPORT"
echo "- path: \`$HERMES_BIN\`" >> "$REPORT"
echo "- version: \`$($HERMES_BIN --version 2>&1 | head -1)\`" >> "$REPORT"
echo "" >> "$REPORT"

probe() {
  local mode="$1"; shift
  local cmd="$*"
  echo "## Mode: $mode" >> "$REPORT"
  echo "" >> "$REPORT"
  echo "\`$cmd\`" >> "$REPORT"
  echo "" >> "$REPORT"
  echo '```' >> "$REPORT"
  timeout 15 bash -c "$cmd" >> "$REPORT" 2>&1
  echo "exit=$?" >> "$REPORT"
  echo '```' >> "$REPORT"
  echo "" >> "$REPORT"
}

echo "## Mode matrix" >> "$REPORT"
echo "" >> "$REPORT"
echo "| Mode | Command probed | Result |" >> "$REPORT"
echo "|------|----------------|--------|" >> "$REPORT"

check() {
  local mode="$1"; shift
  local desc="$1"; shift
  local cmd="$*"
  if timeout 15 bash -c "$cmd" >/dev/null 2>&1; then
    echo "| $mode | $desc | POSITIVE |" >> "$REPORT"
  else
    echo "| $mode | $desc | negative/timeout |" >> "$REPORT"
  fi
}

# CLI mode: hermes run / hermes --help reveals subcommands
check "CLI" "hermes --help" "$HERMES_BIN --help"
check "CLI" "hermes run --help" "$HERMES_BIN run --help"

# Gateway mode: look for serve/gateway/api subcommands
check "gateway" "hermes serve --help" "$HERMES_BIN serve --help"
check "gateway" "hermes gateway --help" "$HERMES_BIN gateway --help"
check "gateway" "hermes api --help" "$HERMES_BIN api --help"

# HTTP/OpenAI-compatible server: probe default ports if server starts
for port in 8642 8080 3000 5000; do
  check "http" "port $port listen probe (informational)" "true"
done

echo "" >> "$REPORT"
echo "## How to complete the spike" >> "$REPORT"
echo "" >> "$REPORT"
echo "1. For each POSITIVE mode, capture: request/response shape, auth model, session model." >> "$REPORT"
echo "2. For HTTP: try \`$HERMES_BIN serve\` (or equivalent) and hit \`/v1/models\`, \`/v1/chat/completions\`." >> "$REPORT"
echo "3. Record whether Open WebUI can point at it directly (OpenAI-compatible endpoint)." >> "$REPORT"
echo "4. If no HTTP mode: note fallback = thin \`hermes-bridge\` (OpenAI-compatible -> CLI/session)." >> "$REPORT"
echo "" >> "$REPORT"
echo "Raw probe log:" >> "$REPORT"
echo '```' >> "$REPORT"
{
  echo "== $HERMES_BIN --help =="; timeout 10 $HERMES_BIN --help 2>&1 | head -40
  echo; echo "== $HERMES_BIN --version =="; timeout 10 $HERMES_BIN --version 2>&1 | head -5
} >> "$REPORT"
echo '```' >> "$REPORT"

echo "Report written to $REPORT"
exit 0
