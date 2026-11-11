'use client';

import { useEffect, useState } from 'react';

/**
 * MindControl — interactive operator panel for the AI "mind".
 *
 * Turns the previously read-only ZeroAI view into a steerable surface: pause or
 * resume routing (paused → new prompts are rejected with 423 by the API), pin a
 * model override, or force a route. Reads/writes /api/zeroai/control.
 */

type Control = {
  routingPaused: boolean;
  modelOverride: string | null;
  forcedRoute: string | null;
  updatedAt: string;
};

const MODELS = [
  'auto',
  'gpt-5',
  'gpt-5-mini',
  'gpt-4.1',
  'claude-opus-4.1',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
];

const ROUTES = ['auto', 'local', 'workflow', 'network'];

export default function MindControl() {
  const [control, setControl] = useState<Control | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/zeroai/control', { cache: 'no-store' });
      const data = await res.json();
      setControl(data.control ?? null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch('/api/zeroai/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setControl(data.control ?? null);
    } finally {
      setSaving(false);
    }
  }

  if (!control) {
    return (
      <div className="mind-control card">
        <h3>🧠 Mind Control</h3>
        <p className="muted">Loading control state…</p>
      </div>
    );
  }

  return (
    <div className="mind-control card">
      <div className="mind-head">
        <h3>🧠 Mind Control</h3>
        <span className={`mind-state ${control.routingPaused ? 'paused' : 'live'}`}>
          {control.routingPaused ? 'PAUSED' : 'LIVE'}
        </span>
      </div>
      <p className="muted mind-sub">
        Steer the routing mind in real time. Paused holds all new prompts.
      </p>

      <button
        className={`mind-toggle ${control.routingPaused ? 'resume' : 'pause'}`}
        disabled={saving}
        onClick={() => patch({ routingPaused: !control.routingPaused })}
      >
        {control.routingPaused ? '▶ Resume routing' : '⏸ Pause routing'}
      </button>

      <label className="mind-field">
        <span>Model override</span>
        <select
          value={control.modelOverride ?? 'auto'}
          disabled={saving}
          onChange={(e) =>
            patch({ modelOverride: e.target.value === 'auto' ? null : e.target.value })
          }
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="mind-field">
        <span>Forced route</span>
        <select
          value={control.forcedRoute ?? 'auto'}
          disabled={saving}
          onChange={(e) =>
            patch({ forcedRoute: e.target.value === 'auto' ? null : e.target.value })
          }
        >
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <p className="muted mind-ts">
        Updated {new Date(control.updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
