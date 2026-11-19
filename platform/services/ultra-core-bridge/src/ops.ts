// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * P4B-12 — ops surface for the Ultra Core bridge:
 *  - Prometheus-text metrics (no external deps)
 *  - structured JSON logging with secret redaction
 *  - ULTRA_CORE_ENABLED kill switch helper
 */

export interface MetricSample {
  name: string;
  help: string;
  type: 'counter' | 'gauge';
  labels?: Record<string, string>;
  value: number;
}

/** Minimal in-process metrics registry; render() emits Prometheus text. */
export class BridgeMetrics {
  private readonly samples = new Map<string, MetricSample>();

  private key(name: string, labels?: Record<string, string>): string {
    const ls = labels
      ? Object.keys(labels)
          .sort()
          .map((k) => `${k}="${labels[k]}"`)
          .join(',')
      : '';
    return `${name}{${ls}}`;
  }

  inc(name: string, labels?: Record<string, string>, by = 1): void {
    const k = this.key(name, labels);
    const existing = this.samples.get(k);
    if (existing) {
      existing.value += by;
    } else {
      this.samples.set(k, {
        name,
        help: name,
        type: 'counter',
        labels,
        value: by,
      });
    }
  }

  set(name: string, value: number, labels?: Record<string, string>): void {
    this.samples.set(this.key(name, labels), {
      name,
      help: name,
      type: 'gauge',
      labels,
      value,
    });
  }

  /** Prometheus text exposition format. */
  render(): string {
    const out: string[] = [];
    for (const s of this.samples.values()) {
      out.push(`# HELP ${s.name} ${s.help}`);
      out.push(`# TYPE ${s.name} ${s.type}`);
      const ls = s.labels
        ? '{' +
          Object.keys(s.labels)
            .sort()
            .map((k) => `${k}="${s.labels![k]}"`)
            .join(',') +
          '}'
        : '';
      out.push(`${s.name}${ls} ${s.value}`);
    }
    return out.join('\n') + '\n';
  }
}

/** Singleton for process-wide use. */
export const bridgeMetrics = new BridgeMetrics();

const SECRET_KEY = /token|secret|password|authorization|api[-_]?key|private/i;

/** Deep-copy `value` with secret-looking keys replaced by "[redacted]". */
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEY.test(k) ? '[redacted]' : redactSecrets(v);
    }
    return out;
  }
  return value;
}

export interface LogFields {
  [k: string]: unknown;
}

/** Structured JSON log line on stderr; secrets are redacted. */
export function logEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: LogFields = {}
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...((redactSecrets(fields) as LogFields) ?? {}),
  });
  process.stderr.write(line + '\n');
}

/**
 * Kill switch: ULTRA_CORE_ENABLED=false disables all outbound Ultra-Core
 * traffic. Default is enabled for local/mock use; set false in production
 * until the live contract (G-4.1 endpoint) is supplied.
 */
export function isUltraCoreEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.ULTRA_CORE_ENABLED !== 'false';
}
