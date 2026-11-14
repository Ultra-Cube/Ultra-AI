import type { UpstreamRoute } from './types';

export interface RouteMatch {
  route: UpstreamRoute;
  /** Path forwarded upstream (prefix stripped unless stripPrefix=false). */
  upstreamPath: string;
}

/** Longest-prefix match; ties broken by first declaration order. */
export function matchRoute(
  pathname: string,
  routes: UpstreamRoute[]
): RouteMatch | null {
  let best: RouteMatch | null = null;
  for (const route of routes) {
    const p = route.prefix;
    const hit =
      pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`);
    if (!hit) continue;
    if (!best || p.length > best.route.prefix.length) {
      let upstreamPath = pathname;
      if (route.stripPrefix !== false) {
        upstreamPath = pathname.slice(p.length) || '/';
      }
      best = { route, upstreamPath };
    }
  }
  return best;
}
