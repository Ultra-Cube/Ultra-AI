// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Desktop UI Application
 * Main entry point for desktop application
 */

export { DesktopUI } from './desktop-ui';
export { AutoUpdater, NullUpdateAdapter } from './auto-updater';
export type {
  UpdateAdapter,
  UpdateInfo,
  UpdateProgress,
  UpdateStatus,
} from './auto-updater';
export { ControlPanel } from './control-panel';
export { SystemTray, NullTrayAdapter } from './system-tray';
export type {
  TrayAdapter,
  TrayMenuItem,
  TrayStatus,
  TrayAction,
} from './system-tray';
export {
  WEB_SURFACES,
  DEFAULT_WEB_BASE_URL,
  surfaceUrl,
  getSurface,
} from './web-surfaces';

export type { DesktopUIConfig, ControlPanelConfig, WebSurface } from './types';
export { FirstRunWizard, defaultStatePath } from './first-run';
export type {
  WizardStepId,
  HardwareProbe,
  ModelSuggestion,
  EngineOptIn,
  FirstRunState,
} from './first-run';
