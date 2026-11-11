/**
 * Desktop UI Application
 * Main desktop application controller
 */

import { EventEmitter } from 'events';

import { ControlPanel } from './control-panel';
import { SystemTray } from './system-tray';
import { DesktopUIConfig, WebSurface } from './types';
import { WEB_SURFACES, surfaceUrl, getSurface } from './web-surfaces';

export class DesktopUI extends EventEmitter {
  private config: DesktopUIConfig;
  private controlPanel: ControlPanel;
  private systemTray: SystemTray;
  private running: boolean = false;
  private webBaseUrl: string;
  private activeSurfaceId: string;

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

    // The desktop shell embeds the web app's surfaces (dashboard, gateway,
    // ZeroAI, Hermes monitoring) rather than reimplementing them.
    this.webBaseUrl = `http://localhost:${this.config.port}`;
    this.activeSurfaceId = 'dashboard';

    this.controlPanel = new ControlPanel(this.config);
    this.systemTray = new SystemTray(this.config);
  }

  /** All web surfaces the desktop app can open. */
  getSurfaces(): WebSurface[] {
    return [...WEB_SURFACES];
  }

  /** Resolve a surface id to its absolute URL on the running web app. */
  getSurfaceUrl(id: string): string | null {
    const surface = getSurface(id);
    return surface ? surfaceUrl(surface, this.webBaseUrl) : null;
  }

  /**
   * Open a web surface (e.g. 'hermes') in the desktop shell. Emits
   * 'open-surface' with the resolved URL so the host window can load it.
   */
  openSurface(id: string): boolean {
    const url = this.getSurfaceUrl(id);
    if (!url) return false;
    this.activeSurfaceId = id;
    this.emit('open-surface', { id, url });
    return true;
  }

  /** Convenience: jump straight to the Hermes monitoring view. */
  openMonitoring(): boolean {
    return this.openSurface('hermes');
  }

  getActiveSurfaceId(): string {
    return this.activeSurfaceId;
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
