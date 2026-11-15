"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ULTRA_LOGO = (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ulg" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#7c6cff" />
        <stop offset="1" stopColor="#4dd0e1" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#ulg)" />
    <path d="M10 22V10h3.2l6.8 7.4V10H23v12h-3.2L13 14.6V22H10z" fill="#fff" />
  </svg>
);

const SECTIONS: { title?: string; links: { href: string; label: string; external?: string }[] }[] = [
  {
    links: [
      { href: '/chat', label: '💬 Chat' },
      { href: '/agents', label: '🤖 Agents' },
      { href: '/zeroai', label: '🧠 ZeroAI' },
      { href: '/hermes', label: '🛰 Hermes' },
      { href: '/hermes/agent', label: '💬 Hermes Agent' },
    ],
  },
  {
    title: 'Build',
    links: [
      { href: '/automation', label: '⚡ Automation' },
      { href: '/studio', label: '🛠 Studio' },
      { href: '/workspace', label: '🧩 Workspace' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/gateway', label: '🔀 Model Gateway' },
      { href: '/dashboard', label: '📊 Dashboard' },
      { href: '/control-center', label: '🎛 Control Center' },
    ],
  },
  {
    title: 'External',
    links: [
      { href: 'http://localhost:9119', label: '🛰 Hermes Dashboard ↗', external: 'http://localhost:9119' },
      { href: 'http://localhost:5678', label: '🔁 n8n ↗', external: 'http://localhost:5678' },
      { href: 'http://localhost:20128', label: '🔀 OmniRoute ↗', external: 'http://localhost:20128' },
      { href: 'http://localhost:3001', label: '📈 Grafana ↗', external: 'http://localhost:3001' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname() ?? '/';
  return (
    <aside className="ultra-sidebar">
      <Link href="/" className="ultra-brand">
        {ULTRA_LOGO}
        <span>Ultra AI</span>
      </Link>
      {SECTIONS.map((section, i) => (
        <div key={i}>
          {section.title && <div className="ultra-nav-section">{section.title}</div>}
          {section.links.map((link) => {
            const external = !!link.external;
            const active = !external && (pathname === link.href || pathname.startsWith(link.href + '/'));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`ultra-nav-link${active ? ' active' : ''}`}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {link.label}
                {!external && <span className="dot" />}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
