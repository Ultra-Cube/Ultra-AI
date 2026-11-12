# Ultra-AI Sentinel (WP-2)

Application-level watchdog for the Ultra-AI stack. Zero dependencies — plain
Node >= 20 ESM (`sentinel.mjs`). Complements the infra-level Hermes stack
(`infrastructure/monitoring/stack/hermes/`: Prometheus + Grafana + Alertmanager)
by polling **application health endpoints** and dependency reachability, keeping
per-target state, and emitting alerts.

## What it does

- Polls every target in `sentinel.config.json` every `pollIntervalMs` (default 15s).
- HTTP targets: expects 2xx (override with `expectStatus`); treats body
  `status: "degraded"` or unexpected status codes as DEGRADED.
- TCP targets: port-reachability check (postgres, redis, mongo, ipfs, ...).
- State machine per target: `UP` / `DEGRADED` / `DOWN` (DOWN after
  `failThreshold` consecutive failures, default 2).
- Emits console alerts on every status transition (severity: critical=DOWN,
  warning=DEGRADED) and POSTs an Alertmanager-compatible payload to
  `alertWebhook` when configured.
- Exposes `GET /status` and `GET /health` on `statusPort` (default **9200**).
- Persists the last snapshot to `status.json` each poll.

## Run

```bash
cd infrastructure/monitoring/stack/sentinel
node sentinel.mjs                      # uses sentinel.config.json
node sentinel.mjs --config my.json    # custom config
```

Check status:

```bash
curl http://127.0.0.1:9200/status
```

## Configuration (`sentinel.config.json`)

| Key | Default | Meaning |
|-----|---------|---------|
| `pollIntervalMs` | 15000 | Poll cadence |
| `timeoutMs` | 5000 | Per-check timeout |
| `failThreshold` | 2 | Consecutive failures before DOWN |
| `statusPort` | 9200 | Sentinel's own HTTP port |
| `statusFile` | `status.json` | Snapshot output file |
| `alertWebhook` | `null` | Alertmanager/Slack-compatible webhook URL |
| `targets[]` | — | `{name, type: "http"\|"tcp", url\|host+port, expectStatus?}` |

Default targets cover: api `/health` + `/health/detailed` + `/metrics` (4000),
gateway `/health` (20129), web (3000), postgres/redis/mongo/ipfs TCP ports,
and the Hermes stack itself (prometheus 9090, grafana 3001) — so sentinel also
alerts when the monitoring stack dies.

## Relationship to Hermes

| Layer | Component | Role |
|-------|-----------|------|
| Infra metrics | `stack/hermes/` (Prometheus/Grafana) | Time-series, dashboards, alert rules |
| App watchdog | `stack/sentinel/` (this) | Health-endpoint polling, state transitions, webhook alerts |

Both are independent: sentinel runs fine with Hermes down and vice versa.
