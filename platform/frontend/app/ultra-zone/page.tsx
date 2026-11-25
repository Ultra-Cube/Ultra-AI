// Ultra Zone — public landing page for the Ultra Cube developer zone
// Brand: dark gray cube outlined in orange circuit lines (AI signal paths)

import Link from 'next/link';
import { Logo } from '../components/Sidebar';

const FEATURES = [
  {
    title: 'Ultra AI Platform',
    body: 'Multi-agent cognitive platform — Hermes core, ZeroAI local-first inference, model gateway, and workflow automation.',
    href: '/dashboard',
  },
  {
    title: 'Brain Stack',
    body: 'The cognitive brain of the platform: components, skills, prompts, and memory — all managed visually from one control surface.',
    href: '/brain-stack',
  },
  {
    title: 'Model Gateway',
    body: 'Unified routing across providers — OmniRoute, Ollama, OpenRouter, Hermes — with per-team model assignment.',
    href: '/gateway',
  },
  {
    title: 'Automation Engine',
    body: 'n8n-powered workflows orchestrating agents, schedules, and external apps without leaving the dashboard.',
    href: '/automation',
  },
];

export default function UltraZonePage() {
  return (
    <div className="page uz-page">
      <header className="page-head">
        <div className="uz-brand">
          <Logo />
          <div>
            <h1>Ultra Zone</h1>
            <p className="muted">
              Developer zone · Ultra Cube Tech · ultra-zone.ucubetech.com
            </p>
          </div>
        </div>
      </header>

      <section className="uz-hero">
        <div className="uz-cube" aria-hidden>
          <svg viewBox="0 0 220 200" fill="none">
            {/* dark gray cube */}
            <g stroke="#3a3f4a" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M110 20 L190 65 L110 110 L30 65 Z" fill="#23262f" />
              <path d="M30 65 L110 110 L110 180 L30 135 Z" fill="#1b1e26" />
              <path d="M190 65 L110 110 L110 180 L190 135 Z" fill="#20242e" />
            </g>
            {/* orange circuit outlines */}
            <g
              stroke="#f97316"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M110 20 L190 65 L110 110 L30 65 Z" />
              <path d="M30 65 L110 110 L110 180 L30 135 Z" />
              <path d="M190 65 L110 110 L110 180 L190 135 Z" />
              {/* inner circuit traces — AI signal paths */}
              <path d="M70 52 L92 64 L92 96 L70 108" strokeWidth="1" opacity="0.9" />
              <path d="M150 52 L128 64 L128 96 L150 108" strokeWidth="1" opacity="0.9" />
              <path d="M92 96 L110 104 L128 96" strokeWidth="1" opacity="0.9" />
              <path d="M110 40 L110 76" strokeWidth="1" opacity="0.9" />
              <path d="M70 122 L92 134 L92 158 L110 165" strokeWidth="1" opacity="0.9" />
              <path d="M150 122 L128 134 L128 158 L110 165" strokeWidth="1" opacity="0.9" />
            </g>
            {/* electronic nodes */}
            <g fill="#f97316">
              <circle cx="70" cy="52" r="2.4" />
              <circle cx="92" cy="96" r="2.4" />
              <circle cx="150" cy="52" r="2.4" />
              <circle cx="128" cy="96" r="2.4" />
              <circle cx="110" cy="20" r="2.4" />
              <circle cx="110" cy="165" r="2.4" />
              <circle cx="30" cy="65" r="2.4" />
              <circle cx="190" cy="65" r="2.4" />
              <circle cx="30" cy="135" r="2.4" />
              <circle cx="190" cy="135" r="2.4" />
            </g>
          </svg>
        </div>
        <div className="uz-hero-text">
          <h2>
            The zone where Ultra AI is <span className="uz-accent">built</span>
          </h2>
          <p>
            Ultra Zone is the developer and operations hub for the Ultra Cube
            AI platform — agent orchestration, model routing, and cognitive
            infrastructure, all behind one dark-gray-and-orange interface.
          </p>
          <div className="uz-actions">
            <Link href="/chat" className="btn primary">
              Open Ultra AI
            </Link>
            <Link href="/about" className="btn">
              About & Credits
            </Link>
          </div>
        </div>
      </section>

      <section className="grid-cards">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="panel uz-card">
            <h3>{f.title}</h3>
            <p className="muted small">{f.body}</p>
            <span className="uz-card-link">→ {f.href}</span>
          </Link>
        ))}
      </section>

      <footer className="uz-footer">
        <p className="muted small">
          Development team:{' '}
          <a href="https://ultra-zone.ucubetech.com/">ultra-zone.ucubetech.com</a>
          {' · '}Owner & sponsor:{' '}
          <a href="https://ucubetech.com/">Ultra Cube Technology — ucubetech.com</a>
        </p>
        <p className="muted small">
          © {new Date().getFullYear()} Ultra Cube Tech — All rights reserved
        </p>
      </footer>
    </div>
  );
}
