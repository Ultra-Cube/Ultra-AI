/**
 * Main Control Center Controller
 */

import { EventEmitter } from 'events';

import { ControlCenterConfig } from '../types';

import { DirectoryManager } from './directory-manager';
import { FileManager } from './file-manager';
import { SystemMonitor } from './system-monitor';

export class ControlCenter extends EventEmitter {
  private config: ControlCenterConfig;
  private directoryManager: DirectoryManager;
  private fileManager: FileManager;
  private systemMonitor: SystemMonitor;
  private running: boolean = false;

  constructor(config: Partial<ControlCenterConfig> = {}) {
    super();
    this.config = {
      port: config.port || 3000,
      enableAuth: config.enableAuth !== false,
      enableMonitoring: config.enableMonitoring !== false,
      enableAutomation: config.enableAutomation !== false,
      logLevel: config.logLevel || 'info',
      dataPath: config.dataPath || './data',
    };

    this.directoryManager = new DirectoryManager(this.config);
    this.fileManager = new FileManager(this.config);
    this.systemMonitor = new SystemMonitor(this.config);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Control Center...');

    await this.directoryManager.initialize();
    await this.fileManager.initialize();

    if (this.config.enableMonitoring) {
      await this.systemMonitor.initialize();
      this.systemMonitor.on('alert', (alert) => {
        this.emit('alert', alert);
      });
    }

    this.running = true;
    this.emit('initialized');
    console.log('Control Center initialized successfully');
  }

  async start(): Promise<void> {
    if (!this.running) {
      await this.initialize();
    }

    console.log(`Control Center running on port ${this.config.port}`);
    this.emit('started');
  }

  async stop(): Promise<void> {
    console.log('Stopping Control Center...');

    if (this.config.enableMonitoring) {
      await this.systemMonitor.stop();
    }

    await this.directoryManager.cleanup();
    await this.fileManager.cleanup();

    this.running = false;
    this.emit('stopped');
    console.log('Control Center stopped');
  }

  getDirectoryManager(): DirectoryManager {
    return this.directoryManager;
  }

  getFileManager(): FileManager {
    return this.fileManager;
  }

  getSystemMonitor(): SystemMonitor {
    return this.systemMonitor;
  }

  getConfig(): ControlCenterConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ControlCenterConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-updated', this.config);
  }

  isRunning(): boolean {
    return this.running;
  }
}
