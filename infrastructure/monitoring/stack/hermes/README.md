# Hermes Monitoring Stack

Hermes is the observability layer for Ultra-AI. It is a self-contained
Prometheus + Grafana + Alertmanager + node-exporter stack that scrapes the
metrics the platform already emits — it adds **zero** runtime coupling to the
app and can be started or stopped independently.

## What it monitors

The `@ultra-ai/api` package already exposes:

- `GET /metrics` — 40+ prom-client metrics (HTTP latency/throughput, errors,
  auth, DB query perf, cache hit/miss, AI processing + token usage, system)
- `GET /health` and `GET /health/detailed` — component health probes

Hermes scrapes these plus host metrics from node-exporter.

## Components

| Service       | Port  | Purpose                                  |
|---------------|-------|------------------------------------------|
| Grafana       | 3001  | Dashboards (auto-provisioned)            |
| Prometheus    | 9090  | Scrape + alert-rule evaluation           |
| Alertmanager  | 9093  | Alert routing (Slack/PagerDuty-ready)    |
| node-exporter | 9100  | Host CPU / memory / disk metrics         |

> Grafana uses host port **3001** so it never collides with the web app on 3000.

## Quick start

```bash
cd infrastructure/monitoring/stack/hermes
./start-hermes.sh up        # start
./start-hermes.sh status    # check
./start-hermes.sh down      # stop
```

Then open Grafana at http://localhost:3001 (default `admin` / `admin` — change
via `GRAFANA_ADMIN_PASSWORD`). The **Ultra-AI Overview** dashboard is
pre-loaded under the `Ultra-AI` folder.

## How it finds the app

Prometheus targets try the compose service name first (`api:4000`,
`api-gateway:20129`) and fall back to `host.docker.internal:<port>` for a
host-run app. The canonical API port is **4000**.

- Running the full root stack? Hermes joins its `ultra-ai-network` and scrapes
  by service name.
- Running the app on the host (npm dev)? The `host.docker.internal` fallback
  target picks it up automatically.

## Alerts

Rules live in `prometheus/alerts.yml` (thresholds mirror
`docs/PERFORMANCE_MONITORING_STRATEGY.md`): API/gateway down, p95 latency
> 500ms, error rate > 1/s, host CPU > 80%, host memory > 85%. Wire a real
receiver by editing `alertmanager/alertmanager.yml` (Slack/PagerDuty blocks are
stubbed — inject secrets at deploy time, never commit them).

## Files

```
infrastructure/monitoring/stack/hermes/
  docker-compose.hermes.yml        # the stack
  start-hermes.sh                  # up / down / status helper
  prometheus/prometheus.yml        # scrape config
  prometheus/alerts.yml            # alert rules
  alertmanager/alertmanager.yml    # alert routing
  grafana/provisioning/            # datasource + dashboard providers
  grafana/dashboards/              # dashboard JSON
```
