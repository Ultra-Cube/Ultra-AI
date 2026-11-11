/**
 * Desktop UI Application
 * Main entry point for desktop application
 */

export { DesktopUI } from './desktop-ui';
export { ControlPanel } from './control-panel';
export { SystemTray } from './system-tray';
export {
  WEB_SURFACES,
  DEFAULT_WEB_BASE_URL,
  surfaceUrl,
  getSurface,
} from './web-surfaces';

export type { DesktopUIConfig, ControlPanelConfig, WebSurface } from './types';
