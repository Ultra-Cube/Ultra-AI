/**
 * System Monitor
 * Monitors system resources and generates alerts
 */

import { EventEmitter } from 'events';
import * as os from 'os';

import * as cron from 'node-cron';
import { ScheduledTask } from 'node-cron';

import { ControlCenterConfig, SystemConfig, Service } from '../types';

export class SystemMonitor extends EventEmitter {
  private config: ControlCenterConfig;
  private systemConfig: SystemConfig;
  private monitoring: boolean = false;
  private monitorJob?: ScheduledTask;

  constructor(config: ControlCenterConfig) {
    super();
    this.config = config;
    this.systemConfig = {
      cpuThreshold: 80,
      memoryThreshold: 80,
      diskThreshold: 90,
      alertEnabled: true,
    };
  }

  async initialize(): Promise<void> {
    console.log('Initializing System Monitor...');
    await this.loadSystemConfig();
  }

  async start(): Promise<void> {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;

    // Monitor every minute
    this.monitorJob = cron.schedule('* * * * *', async () => {
      await this.checkSystem();
    });
    console.log('System Monitor started');
  }

  async stop(): Promise<void> {
    if (this.monitorJob) {
      this.monitorJob.stop();
    }
    this.monitoring = false;
    console.log('System Monitor stopped');
  }

  async checkSystem(): Promise<void> {
    const stats = await this.getSystemStats();

    if (this.systemConfig.alertEnabled) {
      if (stats.cpu > this.systemConfig.cpuThreshold) {
        this.emit('alert', {
          type: 'cpu',
          threshold: this.systemConfig.cpuThreshold,
          current: stats.cpu,
          message: `CPU usage ${stats.cpu}% exceeds threshold ${this.systemConfig.cpuThreshold}%`,
        });
      }

      if (stats.memory > this.systemConfig.memoryThreshold) {
        this.emit('alert', {
          type: 'memory',
          threshold: this.systemConfig.memoryThreshold,
          current: stats.memory,
          message: `Memory usage ${stats.memory}% exceeds threshold ${this.systemConfig.memoryThreshold}%`,
        });
      }

      if (stats.disk > this.systemConfig.diskThreshold) {
        this.emit('alert', {
          type: 'disk',
          threshold: this.systemConfig.diskThreshold,
          current: stats.disk,
          message: `Disk usage ${stats.disk}% exceeds threshold ${this.systemConfig.diskThreshold}%`,
        });
      }
    }

    this.emit('stats', stats);
  }

  async getSystemStats(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  }> {
    const cpus = os.cpus();
    const cpuUsage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + (total - idle) / total;
      }, 0) / cpus.length;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    // Disk usage (simplified - would need proper implementation)
    const diskUsage = 50; // Placeholder

    return {
      cpu: Math.round(cpuUsage * 100),
      memory: Math.round(memoryUsage),
      disk: diskUsage,
      uptime: os.uptime(),
    };
  }

  async getServices(): Promise<Service[]> {
    // This would integrate with actual service management
    return [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        status: 'running',
        port: 20129,
        cpu: 5,
        memory: 100,
        uptime: 3600,
      },
      {
        id: 'web-server',
        name: 'Web Server',
        status: 'running',
        port: 3000,
        cpu: 3,
        memory: 80,
        uptime: 7200,
      },
    ];
  }

  updateSystemConfig(config: Partial<SystemConfig>): void {
    this.systemConfig = { ...this.systemConfig, ...config };
    this.saveSystemConfig();
  }

  getSystemConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  private async loadSystemConfig(): Promise<void> {
    try {
      const configPath = `${this.config.dataPath}/system-config.json`;
      const data = await import('fs/promises');
      const content = await data.readFile(configPath, 'utf-8');
      this.systemConfig = JSON.parse(content);
    } catch (error) {
      console.log('Using default system config');
    }
  }

  private async saveSystemConfig(): Promise<void> {
    try {
      const configPath = `${this.config.dataPath}/system-config.json`;
      const data = await import('fs/promises');
      await data.mkdir(this.config.dataPath, { recursive: true });
      await data.writeFile(
        configPath,
        JSON.stringify(this.systemConfig, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save system config:', error);
    }
  }
}
