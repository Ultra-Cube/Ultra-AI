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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Desktop UI Application
 * Main desktop application controller
 */

import { EventEmitter } from 'events';

import { AutoUpdater } from './auto-updater';
import { ControlPanel } from './control-panel';
import { FirstRunWizard } from './first-run';
import { SystemTray } from './system-tray';
import { DesktopUIConfig, WebSurface } from './types';
import { WEB_SURFACES, surfaceUrl, getSurface } from './web-surfaces';

export class DesktopUI extends EventEmitter {
  private config: DesktopUIConfig;
  private controlPanel: ControlPanel;
  private systemTray: SystemTray;
  private firstRun: FirstRunWizard;
  private autoUpdater: AutoUpdater;
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
    this.firstRun = new FirstRunWizard();
    this.autoUpdater = new AutoUpdater();
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
      this.systemTray.setSurfaces(this.getSurfaces());
      await this.systemTray.initialize();
      this.systemTray.on('quit', () => {
        this.emit('quit-requested');
      });
      this.systemTray.on('action', ({ action, payload }) => {
        switch (action) {
          case 'open-surface':
            if (payload) this.openSurface(payload);
            break;
          case 'show-window':
          case 'hide-window':
            this.systemTray.setWindowVisible(action === 'show-window');
            this.emit('window-visibility', action === 'show-window');
            break;
        }
      });
    }

    if (this.firstRun.needsFirstRun()) {
      this.emit('first-run', this.firstRun.getState());
    }

    this.emit('initialized');
    console.log('Desktop UI initialized successfully');
  }

  async start(): Promise<void> {
    if (!this.running) {
      await this.initialize();
    }

    this.systemTray.setStatus('running');
    this.running = true;

    if (this.config.enableAutoUpdate) {
      // Background update check; failures surface via updater events, not start().
      void this.autoUpdater.check();
    }

    console.log(`Desktop UI started: ${this.config.title}`);
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log('Stopping Desktop UI...');

    await this.controlPanel.cleanup();

    if (this.config.enableTray) {
      this.systemTray.setStatus('stopped');
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

  getFirstRunWizard(): FirstRunWizard {
    return this.firstRun;
  }

  getAutoUpdater(): AutoUpdater {
    return this.autoUpdater;
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
