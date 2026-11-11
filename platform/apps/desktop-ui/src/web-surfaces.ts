/**
 * Web surface registry.
 *
 * The desktop shell doesn't reimplement the UI — it embeds the routes served
 * by the @ultra-ai/web app. This registry is the canonical list of surfaces
 * the desktop app exposes, including the Hermes monitoring view, so the desktop
 * and browser experiences stay in lockstep.
 */

import { WebSurface } from './types';

export const DEFAULT_WEB_BASE_URL = 'http://localhost:3000';

export const WEB_SURFACES: WebSurface[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    primary: true,
  },
  {
    id: 'gateway',
    label: 'Gateway',
    path: '/gateway',
    icon: '🌐',
    primary: true,
  },
  {
    id: 'control-center',
    label: 'Control Center',
    path: '/control-center',
    icon: '🎛️',
    primary: true,
  },
  { id: 'zeroai', label: 'ZeroAI', path: '/zeroai', icon: '🤖', primary: true },
  {
    id: 'hermes',
    label: 'Hermes Monitoring',
    path: '/hermes',
    icon: '📡',
    primary: true,
  },
];

/** Resolve a surface's absolute URL against the running web app. */
export function surfaceUrl(
  surface: WebSurface,
  baseUrl: string = DEFAULT_WEB_BASE_URL
): string {
  return `${baseUrl.replace(/\/$/, '')}${surface.path}`;
}

/** Look up a surface by id. */
export function getSurface(id: string): WebSurface | undefined {
  return WEB_SURFACES.find((s) => s.id === id);
}
