// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

'use client';

import { useEffect, useState } from 'react';

interface Settings {
  theme: string;
  defaultModel: string;
  zeroaiLocal: boolean;
  confirmSensitive: boolean;
  refreshMs: number;
  sidebarCollapsed: boolean;
}

const DEFAULTS: Settings = {
  theme: 'dark',
  defaultModel: 'auto',
  zeroaiLocal: true,
  confirmSensitive: true,
  refreshMs: 5000,
  sidebarCollapsed: false,
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ultra-settings');
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      // ignore malformed settings
    }
  }, []);

  const save = () => {
    localStorage.setItem('ultra-settings', JSON.stringify(s));
    localStorage.setItem(
      'ultra-sidebar',
      s.sidebarCollapsed ? 'collapsed' : 'expanded'
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS({ ...s, [k]: v });

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Platform preferences — stored locally</p>
        </div>
        <button className="btn primary" onClick={save}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </header>

      <section className="card">
        <h2>Appearance</h2>
        <label>
          Theme
          <select
            value={s.theme}
            onChange={(e) => set('theme', e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.sidebarCollapsed}
            onChange={(e) => set('sidebarCollapsed', e.target.checked)}
          />
          Start with sidebar collapsed
        </label>
      </section>

      <section className="card">
        <h2>AI & Models</h2>
        <label>
          Default model
          <select
            value={s.defaultModel}
            onChange={(e) => set('defaultModel', e.target.value)}
          >
            <option value="auto">Auto (router)</option>
            <option value="hermes-agent">Hermes Agent</option>
            <option value="omniroute">OmniRoute</option>
            <option value="ollama">Ollama Local</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.zeroaiLocal}
            onChange={(e) => set('zeroaiLocal', e.target.checked)}
          />
          Prefer local ZeroAI execution before gateway escalation
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={s.confirmSensitive}
            onChange={(e) => set('confirmSensitive', e.target.checked)}
          />
          Require confirmation for sensitive actions
        </label>
      </section>

      <section className="card">
        <h2>Monitoring</h2>
        <label>
          Status refresh interval
          <select
            value={s.refreshMs}
            onChange={(e) => set('refreshMs', Number(e.target.value))}
          >
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </label>
      </section>
    </div>
  );
}
