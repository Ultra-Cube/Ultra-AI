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