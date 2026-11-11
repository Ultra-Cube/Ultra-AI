/**
 * Control Panel
 * Main control panel for desktop application
 */

import { EventEmitter } from 'events';

import { DesktopUIConfig, ControlPanelConfig } from './types';

export class ControlPanel extends EventEmitter {
  private config: DesktopUIConfig;
  private panelConfig: ControlPanelConfig;
  private intervalId?: NodeJS.Timeout;

  constructor(config: DesktopUIConfig) {
    super();
    this.config = config;
    this.panelConfig = {
      enableMonitoring: true,
      refreshInterval: 5000,
      showSystemStats: true,
      showServiceStatus: true,
      enableQuickActions: true,
    };
  }

  async initialize(): Promise<void> {
    console.log('Initializing Control Panel...');

    if (this.panelConfig.enableMonitoring) {
      this.startMonitoring();
    }

    this.emit('initialized');
  }

  async startMonitoring(): Promise<void> {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.refreshStats();
    }, this.panelConfig.refreshInterval);

    console.log('Control Panel monitoring started');
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Control Panel monitoring stopped');
  }

  private async refreshStats(): Promise<void> {
    // This would fetch stats from control-center
    const stats = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
    };

    this.emit('stats-updated', stats);
  }

  async cleanup(): Promise<void> {
    this.stopMonitoring();
    console.log('Control Panel cleaned up');
  }

  updateConfig(config: Partial<ControlPanelConfig>): void {
    this.panelConfig = { ...this.panelConfig, ...config };

    if (config.enableMonitoring !== undefined) {
      if (config.enableMonitoring) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }

    this.emit('config-updated', this.panelConfig);
  }

  getConfig(): ControlPanelConfig {
    return { ...this.panelConfig };
  }
}
