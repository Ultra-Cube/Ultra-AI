#!/usr/bin/env bash
# Start / stop the Hermes monitoring stack for Ultra-AI.
#
#   ./start-hermes.sh up      # start stack (default)
#   ./start-hermes.sh down    # stop stack
#   ./start-hermes.sh status  # show container + endpoint status
#
# Endpoints once up:
#   Grafana      http://localhost:3001  (admin / admin by default)
#   Prometheus   http://localhost:9090
#   Alertmanager http://localhost:9093
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.hermes.yml"
ACTION="${1:-up}"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "[ERR] Neither 'docker compose' nor 'docker-compose' is available." >&2
    exit 1
  fi
}

ensure_network() {
  # The compose file joins the external ultra-ai-network created by the root
  # stack. Create it if the root stack hasn't been started yet so Hermes can
  # run standalone against a host-run API (host.docker.internal fallback).
  if ! docker network inspect ultra-ai-network >/dev/null 2>&1; then
    echo "[INFO] Creating ultra-ai-network (root stack not running)"
    docker network create ultra-ai-network >/dev/null
  fi
}

case "$ACTION" in
  up)
    ensure_network
    compose -f "$COMPOSE_FILE" up -d
    echo
    echo "Hermes monitoring stack started:"
    echo "  Grafana      http://localhost:3001"
    echo "  Prometheus   http://localhost:9090"
    echo "  Alertmanager http://localhost:9093"
    ;;
  down)
    compose -f "$COMPOSE_FILE" down
    ;;
  status)
    compose -f "$COMPOSE_FILE" ps
    ;;
  *)
    echo "Usage: $0 {up|down|status}" >&2
    exit 1
    ;;
esac
