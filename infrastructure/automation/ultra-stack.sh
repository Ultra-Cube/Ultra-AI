#!/usr/bin/env bash
# Ultra-AI unified system orchestrator
# -------------------------------------
# Runs the whole platform as one "full system": the multi-project wsl-ai-stack
# idea (several services started together behind one control surface) applied to
# the main monorepo. Brings up every layer in dependency order, waits on health,
# and prints a single status board.
#
#   ./infrastructure/automation/ultra-stack.sh up        # start full stack (default)
#   ./infrastructure/automation/ultra-stack.sh down      # stop everything this script started
#   ./infrastructure/automation/ultra-stack.sh status    # health board for all services
#   ./infrastructure/automation/ultra-stack.sh smoke     # run the MVP smoke tests
#
# Flags:
#   --with-hermes     also start the Hermes monitoring stack (docker)
#   --no-web          skip the Next.js web UI
#
# Layer order:  Postgres -> API (:4000) -> Gateway (:20129) -> Web (:3000)
#               [-> Hermes monitoring: Grafana :3001 / Prometheus :9090]
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"
PG_TOOL="/opt/data/pgtool/start-pg.mjs"

API_PORT=4000
GATEWAY_PORT=20129
WEB_PORT=3000

WITH_HERMES=0
NO_WEB=0
ACTION="up"

mkdir -p "$LOG_DIR" "$PID_DIR"

for arg in "$@"; do
  case "$arg" in
    up|down|status|smoke) ACTION="$arg" ;;
    --with-hermes) WITH_HERMES=1 ;;
    --no-web) NO_WEB=1 ;;
    *) echo "[WARN] unknown arg: $arg" ;;
  esac
done

log()  { printf '%s %s\n' "$(date +%H:%M:%S)" "$*"; }
ok()   { printf '  [ OK ] %s\n' "$*"; }
warn() { printf '  [WARN] %s\n' "$*"; }
miss() { printf '  [MISS] %s\n' "$*"; }

http_ok() { # url
  curl -s --connect-timeout 2 --max-time 5 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null
}

wait_for() { # name url max_tries
  local name="$1" url="$2" tries="${3:-30}" i=1 code
  while [ "$i" -le "$tries" ]; do
    code="$(http_ok "$url")"
    if [ "$code" = "200" ] || [ "$code" = "302" ] || [ "$code" = "401" ]; then
      ok "$name ready ($url -> $code)"
      return 0
    fi
    sleep 1; i=$((i+1))
  done
  warn "$name did not become ready at $url"
  return 1
}

start_bg() { # name logfile cmd...
  local name="$1" logfile="$2"; shift 2
  if [ -f "$PID_DIR/$name.pid" ] && kill -0 "$(cat "$PID_DIR/$name.pid")" 2>/dev/null; then
    ok "$name already running (pid $(cat "$PID_DIR/$name.pid"))"
    return 0
  fi
  nohup "$@" >"$logfile" 2>&1 &
  echo $! >"$PID_DIR/$name.pid"
  ok "$name started (pid $!), log: $logfile"
}

stop_bg() { # name
  local name="$1" pidfile="$PID_DIR/$name.pid"
  if [ -f "$pidfile" ]; then
    local pid; pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      pkill -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      ok "stopped $name (pid $pid)"
    fi
    rm -f "$pidfile"
  else
    warn "$name not tracked (no pidfile)"
  fi
}

# ---------------------------------------------------------------------------

start_postgres() {
  log "Layer 1/4: Postgres"
  if [ -f "$PG_TOOL" ]; then
    if pgrep -f 'start-pg.mjs' >/dev/null 2>&1; then
      ok "Postgres already running"
    else
      start_bg postgres "$LOG_DIR/postgres.log" node "$PG_TOOL"
      sleep 3
    fi
  else
    warn "embedded pg tool not found at $PG_TOOL (assuming external Postgres)"
  fi
}

start_api() {
  log "Layer 2/4: API (:$API_PORT)"
  local envf="$ROOT_DIR/platform/backend/core-api/.env.local"
  if pgrep -f 'tsx src/server.ts' >/dev/null 2>&1; then
    ok "API already running"
  else
    if [ -f "$envf" ]; then
      ( cd "$ROOT_DIR/platform/backend/core-api" && set -a && . ./.env.local && set +a \
        && nohup npx tsx src/server.ts >"$LOG_DIR/api.log" 2>&1 & echo $! >"$PID_DIR/api.pid" )
      ok "API started, log: $LOG_DIR/api.log"
    else
      warn "no $envf — starting API without local env"
      start_bg api "$LOG_DIR/api.log" bash -c "cd '$ROOT_DIR/platform/backend/core-api' && npx tsx src/server.ts"
    fi
  fi
  wait_for "API" "http://localhost:$API_PORT/health" 40
}

start_gateway() {
  log "Layer 3/4: Gateway (:$GATEWAY_PORT)"
  start_bg gateway "$LOG_DIR/gateway.log" \
    bash -c "cd '$ROOT_DIR/platform/api/gateway' && npx tsx src/server.ts"
  wait_for "Gateway" "http://localhost:$GATEWAY_PORT/health" 30
}

start_web() {
  [ "$NO_WEB" = "1" ] && { log "Layer 4/4: Web (skipped)"; return 0; }
  log "Layer 4/4: Web (:$WEB_PORT)"
  start_bg web "$LOG_DIR/web.log" \
    bash -c "cd '$ROOT_DIR/platform/frontend' && npx next dev -p $WEB_PORT"
  wait_for "Web" "http://localhost:$WEB_PORT" 40
}

start_hermes() {
  [ "$WITH_HERMES" = "1" ] || return 0
  log "Monitoring: Hermes stack"
  if [ -x "$ROOT_DIR/infrastructure/monitoring/stack/hermes/start-hermes.sh" ]; then
    "$ROOT_DIR/infrastructure/monitoring/stack/hermes/start-hermes.sh" up || warn "Hermes start reported an error (docker required)"
  else
    miss "infrastructure/monitoring/stack/hermes/start-hermes.sh not found"
  fi
}

status_board() {
  echo
  echo "================ Ultra-AI system status ================"
  printf '  %-14s %s\n' "Postgres" "$(pgrep -f start-pg.mjs >/dev/null 2>&1 && echo running || echo '-')"
  printf '  %-14s %s\n' "API"      "http://localhost:$API_PORT/health -> $(http_ok http://localhost:$API_PORT/health)"
  printf '  %-14s %s\n' "Gateway"  "http://localhost:$GATEWAY_PORT/health -> $(http_ok http://localhost:$GATEWAY_PORT/health)"
  printf '  %-14s %s\n' "Web"      "http://localhost:$WEB_PORT -> $(http_ok http://localhost:$WEB_PORT)"
  printf '  %-14s %s\n' "Grafana"  "http://localhost:3001 -> $(http_ok http://localhost:3001/api/health)"
  printf '  %-14s %s\n' "Prometheus" "http://localhost:9090 -> $(http_ok http://localhost:9090/-/healthy)"
  echo "========================================================"
}

do_up() {
  log "Starting Ultra-AI full system from $ROOT_DIR"
  start_postgres
  start_api
  start_gateway
  start_web
  start_hermes
  status_board
  echo
  echo "Open:  http://localhost:$WEB_PORT   (web UI)"
  echo "Smoke: ./infrastructure/automation/ultra-stack.sh smoke"
}

do_down() {
  log "Stopping Ultra-AI full system"
  stop_bg web
  stop_bg gateway
  stop_bg api
  stop_bg postgres
  if [ "$WITH_HERMES" = "1" ] && [ -x "$ROOT_DIR/infrastructure/monitoring/stack/hermes/start-hermes.sh" ]; then
    "$ROOT_DIR/infrastructure/monitoring/stack/hermes/start-hermes.sh" down || true
  fi
  ok "shutdown complete"
}

do_smoke() {
  if [ -x "$ROOT_DIR/infrastructure/automation/smoke-test.sh" ]; then
    bash "$ROOT_DIR/infrastructure/automation/smoke-test.sh"
  else
    warn "infrastructure/automation/smoke-test.sh not found"
  fi
}

case "$ACTION" in
  up) do_up ;;
  down) do_down ;;
  status) status_board ;;
  smoke) do_smoke ;;
esac
