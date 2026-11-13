# @ultra-ai/engine-supervisor

Runtime supervisor for embedded engine sidecars (Ollama, 9router/OmniRoute,
OpenClaw, OpenHands, Langflow, n8n, Dify, Ultra Studio/openvscode-server).
Exposes lifecycle management
(`start`/`stop`/`restart`), health probing (HTTP + TCP), and a read-only
status surface consumed by `desktop-bridge` and the control center.

## Design

- **Manifest-driven**: each engine is a static `EngineManifest` (command,
  args, port, health path, timeouts, required env). Docker-backed engines
  are marked `managed: false` — the supervisor only probes them, never spawns.
- **Injectable I/O**: `ProcessRunner` and `FetchLike` ports keep the
  supervisor testable without real processes or network.
- **State machine**: `stopped → starting → running ⇄ degraded → failed →
  stopping → stopped`. Unexpected exits mark the engine `failed` with the
  exit code/signal in `lastError`.
- **Health loop**: after a successful startup probe, a timer probes every
  `healthIntervalMs` (default 5s). Probes time out at `healthTimeoutMs`.
- **Startup guard**: if health never passes within `startupTimeoutMs`, the
  process is SIGKILLed and the engine is marked `failed`.
- **Graceful stop**: SIGTERM first, SIGKILL after `shutdownTimeoutMs`.

## Usage

```ts
import { EngineSupervisor, ENGINE_PRESETS } from '@ultra-ai/engine-supervisor';

const sup = new EngineSupervisor(ENGINE_PRESETS, {
  onStatus: (s) => console.log(s.id, s.state, s.healthOk),
});

await sup.start('ollama');
await sup.stop('openhands');
await sup.stopAll();
sup.shutdown();
```

## Status surface

`sup.listStatus()` returns `EngineStatus[]` — id, label, state, effective
port, pid, url, healthOk, latencyMs, lastError, startedAt. This is the
shape bridges/UI render; engines with `managed: false` never get a `pid`.

## Tests

Jest suite in `src/supervisor.test.ts` covers: happy-path start, health
timeout → SIGKILL, missing required env, non-managed refusal, graceful
stop → SIGKILL escalation, unexpected exit → failed, degrade on probe
failure, and `probeAll`.
