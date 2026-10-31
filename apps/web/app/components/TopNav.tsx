'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Shared top navigation rendered on every page via the root layout.
 *
 * Before this, each page was an island with no way to move between the
 * dashboard, gateway, control-center and ZeroAI views without hand-typing
 * URLs. The nav highlights the active route and gives one-click access to the
 * Grafana/Hermes monitoring stack.
 */

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/gateway', label: 'Gateway' },
  { href: '/control-center', label: 'Control Center' },
  { href: '/zeroai', label: 'ZeroAI' },
  { href: '/hermes', label: 'Hermes' },
];

export default function TopNav() {
  const pathname = usePathname() || '/';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="topnav">
      <Link href="/" className="topnav-brand">
        🚀 <span>Ultra AI</span>
      </Link>

      <nav className="topnav-links">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`topnav-link${isActive(link.href) ? ' active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <a
        className="topnav-cta"
        href="http://localhost:3001"
        target="_blank"
        rel="noreferrer"
      >
        📡 Grafana
      </a>
    </header>
  );
}
