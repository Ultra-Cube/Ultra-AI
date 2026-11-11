/**
 * Desktop UI Types
 */

export interface DesktopUIConfig {
  title: string;
  width: number;
  height: number;
  icon: string;
  enableTray: boolean;
  enableAutoUpdate: boolean;
  port: number;
}

export interface ControlPanelConfig {
  enableMonitoring: boolean;
  refreshInterval: number;
  showSystemStats: boolean;
  showServiceStatus: boolean;
  enableQuickActions: boolean;
}

/**
 * A web surface the desktop shell can open in a window/tab. Surfaces map to
 * routes served by the @ultra-ai/web app, letting the desktop app embed the
 * same UI the browser uses (dashboard, gateway, ZeroAI, and the Hermes
 * monitoring view) instead of reimplementing them natively.
 */
export interface WebSurface {
  id: string;
  label: string;
  /** Route path on the web app, e.g. '/hermes'. */
  path: string;
  icon?: string;
  /** Show in the primary desktop navigation. */
  primary?: boolean;
}
