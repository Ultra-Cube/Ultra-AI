'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from './Sidebar';

/**
 * AppDock — an OS-style launcher pinned to the bottom of every page, turning
 * the separate pages into one cohesive "operating system" environment. Hover
 * for a label; the active surface shows an indicator dot.
 */

const APPS = [
  { href: '/', icon: 'cube', label: 'Home' },
  { href: '/dashboard', icon: 'chart', label: 'Dashboard' },
  { href: '/agents', icon: 'agents', label: 'Agents' },
  { href: '/gateway', icon: 'route', label: 'Gateway' },
  { href: '/control-center', icon: 'grid', label: 'Control Center' },
  { href: '/zeroai', icon: 'brain', label: 'ZeroAI' },
  { href: '/hermes', icon: 'agents', label: 'Hermes' },
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
          <span aria-hidden>
            <Icon name={a.icon} size={15} />
          </span>
          <span className="dock-tip">{a.label}</span>
        </Link>
      ))}
    </nav>
  );
}
