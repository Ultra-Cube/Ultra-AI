'use client';

import { useEffect, useState } from 'react';

/**
 * Live service-health strip.
 *
 * Polls the unified /api/system/status endpoint every 5s and shows a compact,
 * always-visible row of service pills (API, Gateway, Web, Grafana) with real
 * up/down state and latency. Gives the operator an at-a-glance answer to
 * "is the stack actually running?" on every page.
 */

type Service = {
  id: string;
  name: string;
  port: number;
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
};

type Status = {
  services: Service[];
  summary: { total: number; up: number; down: number; healthy: boolean };
  host: { cpu: number; memory: number; cores: number };
};

export default function ServiceHealthStrip() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('/api/system/status', { cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as Status;
        if (active) {
          setStatus(data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (error && !status) {
    return (
      <div className="health-strip">
        <span className="health-summary down">status unavailable</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="health-strip">
        <span className="health-summary">checking services…</span>
      </div>
    );
  }

  const { summary, services, host } = status;

  return (
    <div className="health-strip">
      <span className={`health-summary ${summary.healthy ? 'up' : 'down'}`}>
        {summary.up}/{summary.total} services up
      </span>
      <div className="health-pills">
        {services.map((s) => (
          <span
            key={s.id}
            className={`health-pill ${s.up ? 'up' : 'down'}`}
            title={
              s.up
                ? `${s.name} :${s.port} — ${s.latencyMs ?? '?'}ms (HTTP ${s.httpStatus})`
                : `${s.name} :${s.port} — unreachable`
            }
          >
            <span className="dot" />
            {s.name}
            {s.up && s.latencyMs !== null ? (
              <em>{s.latencyMs}ms</em>
            ) : null}
          </span>
        ))}
      </div>
      <span className="health-host">
        CPU {host.cpu}% · MEM {host.memory}% · {host.cores} cores
      </span>
    </div>
  );
}
