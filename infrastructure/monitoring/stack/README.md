# Stack monitor configs

Status: ACTIVE — hosts two complementary stacks:

- `sentinel/` (WP-2): application-level watchdog (`sentinel.mjs` +
  `sentinel.config.json`, Node >= 20, zero deps, port 9200; endpoints
  `/status`, `/health`, `/metrics`). See `sentinel/README.md`.
- `hermes/` (WP-2b): infra-level Prometheus + Grafana + Alertmanager +
  node-exporter via `docker-compose.hermes.yml` (relocated from
  `legacy-hermes` in WP-2b). See `hermes/README.md`.
