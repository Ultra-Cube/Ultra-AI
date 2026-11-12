#!/usr/bin/env node
/**
 * Ultra-AI Sentinel — application-level watchdog (WP-2).
 *
 * Complements the infra-level Hermes stack (stack/hermes: Prometheus/Grafana)
 * by polling application health endpoints and dependency reachability, keeping
 * per-target state (UP / DEGRADED / DOWN), and emitting alerts to the console
 * and an optional webhook (Alertmanager/Slack compatible).
 *
 * Zero dependencies — Node >= 20, ESM. Run: `node sentinel.mjs [--config path]`
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const configPath = args.includes('--config')
  ? resolve(args[args.indexOf('--config') + 1])
  : resolve(HERE, 'sentinel.config.json');

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const POLL_MS = config.pollIntervalMs ?? 15_000;
const TIMEOUT_MS = config.timeoutMs ?? 5_000;
const FAIL_THRESHOLD = config.failThreshold ?? 2; // consecutive failures -> DOWN
const STATUS_PORT = config.statusPort ?? 9200;
const STATUS_FILE = resolve(HERE, config.statusFile ?? 'status.json');

const state = new Map(); // name -> { status, consecutiveFailures, lastCheck, latencyMs, detail }

function now() { return new Date().toISOString(); }

async function checkHttp(target) {
  const started = performance.now();
  try {
    const res = await fetch(target.url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    const latencyMs = Math.round(performance.now() - started);
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON ok */ }
    const degraded = target.expectStatus && !target.expectStatus.includes(res.status);
    return {
      ok: res.ok && !degraded,
      degraded: degraded || (body && body.status === 'degraded'),
      statusCode: res.status,
      latencyMs,
      detail: body ? JSON.stringify(body).slice(0, 300) : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { ok: false, degraded: false, latencyMs: null, detail: String(err?.cause?.code ?? err.message ?? err) };
  }
}

async function checkTcp(target) {
  const { Socket } = await import('node:net');
  const started = performance.now();
  return new Promise((resolvePromise) => {
    const socket = new Socket();
    const done = (ok, detail) => {
      socket.destroy();
      resolvePromise({ ok, degraded: false, latencyMs: Math.round(performance.now() - started), detail });
    };
    socket.setTimeout(TIMEOUT_MS);
    socket.once('connect', () => done(true, 'tcp connect ok'));
    socket.once('timeout', () => done(false, 'tcp timeout'));
    socket.once('error', (err) => done(false, err.code ?? err.message));
    socket.connect(target.port, target.host ?? '127.0.0.1');
  });
}

function evaluate(name, result) {
  const prev = state.get(name) ?? { status: 'UP', consecutiveFailures: 0 };
  let next;
  if (result.ok && !result.degraded) {
    next = { ...prev, status: 'UP', consecutiveFailures: 0 };
  } else if (result.degraded) {
    next = { ...prev, status: 'DEGRADED', consecutiveFailures: 0 };
  } else {
    const failures = prev.consecutiveFailures + 1;
    next = { ...prev, status: failures >= FAIL_THRESHOLD ? 'DOWN' : prev.status, consecutiveFailures: failures };
  }
  const changed = next.status !== prev.status;
  state.set(name, { ...next, lastCheck: now(), latencyMs: result.latencyMs, detail: result.detail });
  if (changed) emitAlert(name, next.status, result.detail);
  return changed;
}

async function emitAlert(name, status, detail) {
  const severity = status === 'DOWN' ? 'critical' : 'warning';
  const message = `[sentinel] ${name} -> ${status} (${detail ?? 'no detail'})`;
  console.log(`${now()} ${severity.toUpperCase()} ${message}`);

  const webhook = config.alertWebhook;
  if (!webhook) return;
  // Alertmanager-compatible payload; Slack accepts the same `text` field shape
  // when configured with a Slack-compatible receiver, so we send both keys.
  const payload = {
    status: 'firing',
    alerts: [{
      status: 'firing',
      labels: { alertname: 'UltraAISentinel', severity, target: name },
      annotations: { summary: message },
      startsAt: now(),
    }],
    text: message,
  };
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`${now()} WARN webhook delivery failed: ${err.message}`);
  }
}

async function pollOnce() {
  const checks = [];
  for (const target of config.targets ?? []) {
    checks.push((async () => {
      const result = target.type === 'tcp'
        ? await checkTcp(target)
        : await checkHttp(target);
      evaluate(target.name, result);
    })());
  }
  await Promise.all(checks);
  persistStatus();
}

function snapshot() {
  const targets = {};
  let down = 0, degraded = 0;
  for (const [name, s] of state) {
    targets[name] = {
      status: s.status,
      latencyMs: s.latencyMs ?? null,
      lastCheck: s.lastCheck,
      detail: s.detail ?? null,
    };
    if (s.status === 'DOWN') down++;
    if (s.status === 'DEGRADED') degraded++;
  }
  return {
    sentinel: 'ultra-ai-sentinel',
    version: '0.1.0',
    timestamp: now(),
    overall: down > 0 ? 'DOWN' : degraded > 0 ? 'DEGRADED' : 'UP',
    summary: { total: state.size, up: state.size - down - degraded, degraded, down },
    targets,
  };
}

function renderMetrics() {
  const lines = [
    '# HELP sentinel_target_up Whether the sentinel considers the target reachable (1=UP/DEGRADED, 0=DOWN).',
    '# TYPE sentinel_target_up gauge',
  ];
  for (const [name, s] of state) {
    const up = s.status === 'DOWN' ? 0 : 1;
    const esc = name.replace(/"/g, '\\"');
    lines.push(`sentinel_target_up{target="${esc}"} ${up}`);
    lines.push(
      `sentinel_target_status{target="${esc}",status="${s.status.toLowerCase()}"} 1`,
    );
    if (s.latencyMs != null) {
      lines.push(`sentinel_target_latency_ms{target="${esc}"} ${s.latencyMs}`);
    }
  }
  const snap = snapshot();
  lines.push(
    '# HELP sentinel_overall_status Overall sentinel status (1 for current overall state).',
    '# TYPE sentinel_overall_status gauge',
    `sentinel_overall_status{status="${snap.overall.toLowerCase()}"} 1`,
    `sentinel_targets_total ${snap.summary.total}`,
    `sentinel_targets_down ${snap.summary.down}`,
    `sentinel_targets_degraded ${snap.summary.degraded}`,
    '',
  );
  return lines.join('\n');
}

function persistStatus() {
  try {
    mkdirSync(dirname(STATUS_FILE), { recursive: true });
    writeFileSync(STATUS_FILE, JSON.stringify(snapshot(), null, 2));
  } catch (err) {
    console.error(`${now()} WARN status persist failed: ${err.message}`);
  }
}

// --- status HTTP endpoint -------------------------------------------------
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'sentinel' }));
  } else if (req.url === '/status' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(snapshot(), null, 2));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(renderMetrics());
  } else {
    res.writeHead(404); res.end();
  }
});
server.listen(STATUS_PORT, () => {
  console.log(`${now()} sentinel listening on :${STATUS_PORT} (/status, /health, /metrics)`);
});

// --- main loop ------------------------------------------------------------
console.log(`${now()} sentinel starting — ${config.targets?.length ?? 0} targets, poll ${POLL_MS}ms`);
pollOnce();
setInterval(pollOnce, POLL_MS);
