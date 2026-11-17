'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Logo, Icon } from '../components/Sidebar';

import ZeroAiChat from './ZeroAiChat';

type Tab = 'open-webui' | 'zeroai';

const OPEN_WEBUI_URL =
  process.env.NEXT_PUBLIC_OPEN_WEBUI_URL ?? 'http://localhost:8080';

interface Portal {
  href: string;
  label: string;
  sub: string;
  icon: string;
  external?: boolean;
}

const PORTALS: Portal[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    sub: 'Live system overview',
    icon: 'gauge',
  },
  {
    href: '/hermes/agent',
    label: 'Hermes Agent',
    sub: 'Agent runtime',
    icon: 'agents',
  },
  { href: '/zeroai', label: 'ZeroAI', sub: 'Local-first chat', icon: 'brain' },
  {
    href: '/automation',
    label: 'Automation',
    sub: 'Workflows & n8n',
    icon: 'bolt',
  },
  { href: '/studio', label: 'Studio', sub: 'Content studio', icon: 'wrench' },
  {
    href: '/workspace',
    label: 'Workspace',
    sub: 'Files & projects',
    icon: 'blocks',
  },
  {
    href: '/brain-stack',
    label: 'Brain Stack',
    sub: 'Memory & models',
    icon: 'brain',
  },
  { href: '/models', label: 'Models', sub: 'Model registry', icon: 'route' },
  {
    href: '/customers',
    label: 'Customers',
    sub: 'Teams & tenants',
    icon: 'agents',
  },
  {
    href: '/services',
    label: 'Services',
    sub: 'Engines & infra',
    icon: 'grid',
  },
  { href: '/gateway', label: 'Gateway', sub: 'Model routing', icon: 'route' },
  {
    href: '/control-center',
    label: 'Control Center',
    sub: 'Central navigation',
    icon: 'cube',
  },
  {
    href: 'http://localhost:8080',
    label: 'Open WebUI',
    sub: 'Standalone UI',
    icon: 'external',
    external: true,
  },
];

interface EngineHealth {
  id: string;
  label: string;
  port: number;
  up: boolean;
}

export default function ChatPage() {
  const [tab, setTab] = useState<Tab>('open-webui');
  const [engines, setEngines] = useState<EngineHealth[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/engines')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.engines) setEngines(d.engines);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const healthy = engines?.filter((e) => e.up).length ?? 0;
  const total = engines?.length ?? 0;

  return (
    <div className="uai-page">
      <div className="uai-content">
        {/* Brand header */}
        <header className="uai-hero">
          <div className="uai-hero-brand">
            <Logo />
            <div>
              <div className="uai-hero-title">Ultra AI</div>
              <div className="uai-hero-sub">
                Local-first AI platform — chat, agents, engines and control
                surfaces in one shell
              </div>
            </div>
          </div>
          {engines && (
            <div className="uai-hero-status">
              <span
                className={`uai-dot ${healthy === total ? 'ok' : 'warn'}`}
              />
              {healthy}/{total} engines healthy
            </div>
          )}
        </header>

        {/* Surface tabs */}
        <div className="uai-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'open-webui'}
            className={`uai-tab ${tab === 'open-webui' ? 'active' : ''}`}
            onClick={() => setTab('open-webui')}
          >
            <Icon name="chat" size={14} /> Open WebUI
          </button>
          <button
            role="tab"
            aria-selected={tab === 'zeroai'}
            className={`uai-tab ${tab === 'zeroai' ? 'active' : ''}`}
            onClick={() => setTab('zeroai')}
          >
            <Icon name="chat" size={14} /> ZeroAI
          </button>
        </div>

        {/* Chat surface */}
        <div className="uai-surface" hidden={tab !== 'open-webui'}>
          {tab === 'open-webui' && (
            <>
              <iframe
                src={OPEN_WEBUI_URL}
                title="Open WebUI"
                className="uai-frame"
                allow="microphone; clipboard-read; clipboard-write"
              />
              <div className="uai-frame-note">
                <Icon name="chat" size={12} />
                <a href={OPEN_WEBUI_URL} target="_blank" rel="noreferrer">
                  Open standalone ↗
                </a>
                <span className="uai-frame-note-sep">·</span>
                Point this at your model gateway in Open WebUI → Settings →
                Connections.
              </div>
            </>
          )}
        </div>
        <div className="uai-surface" hidden={tab !== 'zeroai'}>
          {tab === 'zeroai' && <ZeroAiChat />}
        </div>

        {/* Portals rail */}
        <section className="uai-portals">
          <div className="uai-portals-head">
            <Icon name="cube" size={14} />
            <span>Ultra AI surfaces</span>
          </div>
          <div className="uai-portals-grid">
            {PORTALS.map((p) => {
              const inner = (
                <>
                  <Icon name={p.icon} size={16} />
                  <span className="uai-portal-label">{p.label}</span>
                  <span className="uai-portal-sub">{p.sub}</span>
                </>
              );
              const cls = 'uai-portal';
              return p.external ? (
                <a
                  key={p.href}
                  href={p.href}
                  className={cls}
                  target="_blank"
                  rel="noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <Link key={p.href} href={p.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
