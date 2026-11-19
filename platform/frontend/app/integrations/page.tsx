// Copyright (c) Ultra Cube Tech — All rights reserved  [UCUBETECH]

"use client";

import { useCallback, useEffect, useState } from "react";

interface AppStatus {
  id: string;
  name: string;
  category: string;
  baseUrl: string;
  embedUrl: string | null;
  apiBase: string | null;
  requiresConfirm: boolean;
  description: string;
  status: "online" | "degraded" | "offline";
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  online: "var(--accent)",
  degraded: "var(--accent-2)",
  offline: "var(--muted)",
};

export default function IntegrationsPage() {
  const [apps, setApps] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [embed, setEmbed] = useState<AppStatus | null>(null);
  const [consoleApp, setConsoleApp] = useState<AppStatus | null>(null);
  const [apiPath, setApiPath] = useState("");
  const [apiResult, setApiResult] = useState<string>("");
  const [apiBusy, setApiBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/apps", { cache: "no-store" });
      const data = await res.json();
      setApps(data.apps ?? []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const callApi = async () => {
    if (!consoleApp || !apiPath.trim()) return;
    setApiBusy(true);
    setApiResult("");
    try {
      const params = new URLSearchParams({ path: apiPath.trim() });
      if (confirmed[consoleApp.id]) params.set("confirm", "1");
      const res = await fetch(`/api/apps/${consoleApp.id}/proxy?${params}`);
      const text = await res.text();
      setApiResult(`HTTP ${res.status}\n${text.slice(0, 4000)}`);
    } catch (e) {
      setApiResult(`error: ${(e as Error).message}`);
    } finally {
      setApiBusy(false);
    }
  };

  return (
    <div className="uai-page-fill">
      <header className="uai-page-head">
        <div>
          <h1>Integrations</h1>
          <p className="uai-muted">
            External applications reachable through the Ultra AI dashboard —
            health, embedded views, and read-only API access.
          </p>
        </div>
        <button className="uai-btn" onClick={refresh} disabled={loading}>
          {loading ? "Checking…" : "Refresh"}
        </button>
      </header>

      <section className="uai-grid uai-grid-2">
        {apps.map((a) => (
          <article key={a.id} className="uai-card">
            <div className="uai-card-head">
              <h2>{a.name}</h2>
              <span
                className="uai-pill"
                style={{ color: STATUS_COLOR[a.status], borderColor: STATUS_COLOR[a.status] }}
              >
                {a.status}
              </span>
            </div>
            <p className="uai-muted">{a.description}</p>
            <dl className="uai-kv">
              <dt>Endpoint</dt>
              <dd>{a.baseUrl}</dd>
              <dt>Category</dt>
              <dd>{a.category}</dd>
              <dt>Latency</dt>
              <dd>{a.latencyMs != null ? `${a.latencyMs} ms` : "—"}</dd>
              <dt>HTTP</dt>
              <dd>{a.httpStatus ?? "—"}</dd>
            </dl>
            <div className="uai-actions">
              {a.embedUrl && (
                <button className="uai-btn uai-btn-primary" onClick={() => setEmbed(a)}>
                  Open embedded
                </button>
              )}
              {a.apiBase && (
                <button
                  className="uai-btn"
                  onClick={() => {
                    setConsoleApp(a);
                    setApiPath(a.apiBase ?? "");
                    setApiResult("");
                  }}
                >
                  API console
                </button>
              )}
              <a className="uai-btn uai-btn-ghost" href={a.baseUrl} target="_blank" rel="noreferrer">
                External ↗
              </a>
            </div>
            {a.requiresConfirm && (
              <p className="uai-muted uai-warn">
                API access requires explicit confirmation (sensitive gateway).
              </p>
            )}
          </article>
        ))}
        {!loading && apps.length === 0 && (
          <div className="uai-empty uai-card">
            <p>No connectors registered.</p>
          </div>
        )}
      </section>

      {embed && (
        <div className="uai-modal-backdrop" onClick={() => setEmbed(null)}>
          <div className="uai-modal uai-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="uai-card-head">
              <h2>{embed.name}</h2>
              <div className="uai-actions">
                <a className="uai-btn uai-btn-ghost" href={embed.embedUrl ?? "#"} target="_blank" rel="noreferrer">
                  Pop out ↗
                </a>
                <button className="uai-btn" onClick={() => setEmbed(null)}>Close</button>
              </div>
            </div>
            <iframe
              className="uai-frame-fill"
              src={embed.embedUrl ?? undefined}
              title={`${embed.name} embedded`}
            />
          </div>
        </div>
      )}

      {consoleApp && (
        <div className="uai-modal-backdrop" onClick={() => setConsoleApp(null)}>
          <div className="uai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="uai-card-head">
              <h2>{consoleApp.name} — API console</h2>
              <button className="uai-btn" onClick={() => setConsoleApp(null)}>Close</button>
            </div>
            <p className="uai-muted">
              Read-only GET proxy · base {consoleApp.apiBase} · host pinned to{" "}
              {consoleApp.baseUrl}
            </p>
            <div className="uai-row">
              <input
                className="uai-input"
                value={apiPath}
                onChange={(e) => setApiPath(e.target.value)}
                placeholder="/v1/..."
              />
              <button className="uai-btn uai-btn-primary" onClick={callApi} disabled={apiBusy}>
                {apiBusy ? "Calling…" : "GET"}
              </button>
            </div>
            {consoleApp.requiresConfirm && (
              <label className="uai-check">
                <input
                  type="checkbox"
                  checked={!!confirmed[consoleApp.id]}
                  onChange={(e) =>
                    setConfirmed((c) => ({ ...c, [consoleApp.id]: e.target.checked }))
                  }
                />
                I confirm this API call to {consoleApp.name}
              </label>
            )}
            {apiResult && <pre className="uai-pre">{apiResult}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}
