/**
 * Desktop UI Application
 * Main desktop application controller
 */

import { EventEmitter } from 'events';
import { DesktopUIConfig } from './types';
import { ControlPanel } from './control-panel';
import { SystemTray } from './system-tray';

export class DesktopUI extends EventEmitter {
  private config: DesktopUIConfig;
  private controlPanel: ControlPanel;
  private systemTray: SystemTray;
  private running: boolean = false;

  constructor(config: Partial<DesktopUIConfig> = {}) {
    super();
    this.config = {
      title: config.title || 'Ultra AI Platform',
      width: config.width || 1200,
      height: config.height || 800,
      icon: config.icon || 'assets/icon.png',
      enableTray: config.enableTray !== false,
      enableAutoUpdate: config.enableAutoUpdate !== false,
      port: config.port || 3000,
    };

    this.controlPanel = new ControlPanel(this.config);
    this.systemTray = new SystemTray(this.config);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Desktop UI...');
    
    await this.controlPanel.initialize();
    
    if (this.config.enableTray) {
      await this.systemTray.initialize();
      this.systemTray.on('quit', () => {
        this.emit('quit-requested');
      });
    }

    this.emit('initialized');
    console.log('Desktop UI initialized successfully');
  }

  async start(): Promise<void> {
    if (!this.running) {
      await this.initialize();
    }

    this.running = true;
    console.log(`Desktop UI started: ${this.config.title}`);
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log('Stopping Desktop UI...');
    
    await this.controlPanel.cleanup();
    
    if (this.config.enableTray) {
      await this.systemTray.cleanup();
    }

    this.running = false;
    this.emit('stopped');
    console.log('Desktop UI stopped');
  }

  getControlPanel(): ControlPanel {
    return this.controlPanel;
  }

  getSystemTray(): SystemTray {
    return this.systemTray;
  }

  getConfig(): DesktopUIConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DesktopUIConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-updated', this.config);
  }

  isRunning(): boolean {
    return this.running;
  }
}