// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
// ║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
// ║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
// ║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
// ║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
// ║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
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

// Rights & Credits — project details, development team, copyright owner

import Link from 'next/link';
import { Logo } from '../components/Sidebar';

const TEAM_LINKS = [
  { label: 'Ultra Zone — Developer Zone', href: 'https://ultra-zone.ucubetech.com/' },
  { label: 'Ultra Cube Technology — Official Site', href: 'https://ucubetech.com/' },
  { label: 'GitHub Organization — Ultra-Cube', href: 'https://github.com/Ultra-Cube' },
  { label: 'Repository — Ultra-AI', href: 'https://github.com/Ultra-Cube/Ultra-AI' },
];

const STACK = [
  'Hermes Agent — core agent runtime',
  'OpenClaw — backend assistant bridge',
  'n8n — workflow automation',
  'OmniRoute — model gateway & routing',
  'Ollama / airllm — local-first inference',
  'Brain Stack — cognitive memory & skills',
];

export default function RightsPage() {
  return (
    <div className="page">
      <header className="page-head">
        <div className="uz-brand">
          <Logo />
          <div>
            <h1>Rights & Credits</h1>
            <p className="muted">
              Ultra AI — proprietary AI platform · project details and ownership
            </p>
          </div>
        </div>
      </header>

      <section className="grid-cards">
        <div className="panel">
          <h3>Development Team</h3>
          <p className="muted small">
            Built and maintained by the Ultra Zone development team.
          </p>
          <ul className="uz-links">
            {TEAM_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>Owner & Sponsor</h3>
          <p className="muted small">
            <strong>Ultra Cube Technology</strong> — the company that owns,
            funds, and supports Ultra AI.
          </p>
          <p>
            <a href="https://ucubetech.com/" target="_blank" rel="noreferrer">
              ucubetech.com ↗
            </a>
          </p>
        </div>

        <div className="panel">
          <h3>Copyright</h3>
          <p className="muted small">
            © {new Date().getFullYear()} Ultra Cube Tech (ucubetech.com).
            All rights reserved. Ultra AI, the Ultra AI logo, and the Ultra
            Zone identity are proprietary marks of Ultra Cube Technology.
          </p>
          <p className="muted small">
            Third-party components remain under their own licenses — see
            NOTICE and each integrated project's license terms.
          </p>
        </div>

        <div className="panel">
          <h3>Integrated Components</h3>
          <ul className="uz-links">
            {STACK.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="uz-footer">
        <p className="muted small">
          <Link href="/ultra-zone">← Ultra Zone</Link>
          {' · '}
          <Link href="/about">About & Credits</Link>
        </p>
      </footer>
    </div>
  );
}
