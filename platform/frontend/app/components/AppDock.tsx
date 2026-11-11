'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * AppDock — an OS-style launcher pinned to the bottom of every page, turning
 * the separate pages into one cohesive "operating system" environment. Hover
 * for a label; the active surface shows an indicator dot.
 */

const APPS = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/agents', icon: '👥', label: 'Agents' },
  { href: '/gateway', icon: '🌐', label: 'Gateway' },
  { href: '/control-center', icon: '🎛️', label: 'Control Center' },
  { href: '/zeroai', icon: '🧠', label: 'ZeroAI' },
  { href: '/hermes', icon: '📡', label: 'Hermes' },
];

export default function AppDock() {
  const pathname = usePathname() || '/';
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="app-dock" aria-label="App launcher">
      {APPS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={`dock-item${isActive(a.href) ? ' active' : ''}`}
          aria-label={a.label}
        >
          <span aria-hidden>{a.icon}</span>
          <span className="dock-tip">{a.label}</span>
        </Link>
      ))}
    </nav>
  );
}
