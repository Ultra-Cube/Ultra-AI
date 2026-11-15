'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};
type NavSection = { title: string; items: NavItem[] };

const ICONS: Record<string, string> = {
  chat: 'M21 12a8 8 0 01-8 8H5l-2 2V12a8 8 0 018-8h2a8 8 0 018 8z',
  agents:
    'M12 8V4m0 0a2 2 0 11-4 0 2 2 0 014 0zm0 0a2 2 0 104 0 2 2 0 10-4 0zM5 20h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z',
  brain:
    'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  wrench:
    'M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.8 2.8-2.1-2.1 2.8-2.8z',
  blocks:
    'M4 7v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H6a2 2 0 00-2 2z',
  route: 'M4 12h4l3-8 4 16 3-8h2',
  gauge: 'M12 15l4-6M3 12a9 9 0 1118 0 9 9 0 01-18 0z',
  chart: 'M3 3v18h18M7 14l4-4 3 3 5-6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cube: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  external: 'M14 3h7v7M10 14L21 3M21 14v7H3V3h7',
  panels: 'M4 4h16v16H4zM9 4v16',
};

export function Icon({
  name,
  size = 18,
}: {
  name: keyof typeof ICONS | string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONS[name] ?? ICONS.grid} />
    </svg>
  );
}

const SECTIONS: NavSection[] = [
  {
    title: 'Chat',
    items: [
      { href: '/chat', label: 'New Chat', icon: 'chat' },
      { href: '/hermes/agent', label: 'Hermes Agent', icon: 'agents' },
      { href: '/zeroai', label: 'ZeroAI', icon: 'brain' },
    ],
  },
  {
    title: 'Build',
    items: [
      { href: '/automation', label: 'Automation', icon: 'bolt' },
      { href: '/studio', label: 'Studio', icon: 'wrench' },
      { href: '/workspace', label: 'Workspace', icon: 'blocks' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/services', label: 'Services & Engines', icon: 'grid' },
      { href: '/gateway', label: 'Model Gateway', icon: 'route' },
      { href: '/dashboard', label: 'Dashboard', icon: 'gauge' },
      { href: '/control-center', label: 'Control Center', icon: 'cube' },
    ],
  },
];

const EXTERNAL: NavItem[] = [
  {
    href: 'http://localhost:9119/',
    label: 'Hermes Dashboard',
    icon: 'chart',
    external: true,
  },
  {
    href: 'http://localhost:5678/',
    label: 'n8n',
    icon: 'bolt',
    external: true,
  },
  {
    href: 'http://localhost:20128/',
    label: 'OmniRoute',
    icon: 'route',
    external: true,
  },
  {
    href: 'http://localhost:3001/',
    label: 'Grafana',
    icon: 'chart',
    external: true,
  },
];

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="ultra-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6ea8fe" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="url(#ultra-g)"
        opacity="0.9"
      />
      <path
        d="M10 22V10l12 12V10"
        stroke="#0b1020"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('ultra-sidebar') === 'collapsed');
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem('ultra-sidebar', c ? 'expanded' : 'collapsed');
      return !c;
    });
  };

  const cls = `ultra-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`;

  const renderItem = (item: NavItem) => {
    const active =
      !item.external &&
      (pathname === item.href || pathname.startsWith(item.href + '/'));
    if (item.external) {
      return (
        <a
          key={item.href}
          className="side-link external"
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.label}
        >
          <Icon name={item.icon} />
          <span className="side-label">{item.label}</span>
          <Icon name="external" size={12} />
        </a>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`side-link${active ? ' active' : ''}`}
        title={item.label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon name={item.icon} />
        <span className="side-label">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <button
        className="side-burger"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        <Icon name="panels" />
      </button>
      {mobileOpen && (
        <div className="side-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cls}>
        <div className="side-head">
          <Link href="/chat" className="side-brand">
            <Logo />
            <span className="side-label side-title">Ultra AI</span>
          </Link>
          <button
            className="side-toggle"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <nav className="side-nav">
          {SECTIONS.map((s) => (
            <div key={s.title} className="side-group">
              <div className="side-group-title">
                <span className="side-label">{s.title}</span>
              </div>
              {s.items.map(renderItem)}
            </div>
          ))}
          <div className="side-group">
            <div className="side-group-title">
              <span className="side-label">External</span>
            </div>
            {EXTERNAL.map(renderItem)}
          </div>
        </nav>
      </aside>
    </>
  );
}
