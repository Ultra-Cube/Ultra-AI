/**
 * Resource Monitor
 * Monitors resource usage and triggers events
 */

import { EventEmitter } from 'events';

import { MemoryStats } from './types';

export class ResourceMonitor extends EventEmitter {
  private intervalId?: NodeJS.Timeout;
  private monitoring: boolean = false;

  constructor() {
    super();
  }

  start(interval: number = 5000): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.checkResources();
    }, interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
  }

  private checkResources(): void {
    const stats = this.getMemoryStats();
    const threshold = 0.8; // 80%

    if (stats.heapUsed / stats.heapTotal > threshold) {
      this.emit('threshold-exceeded', stats);
    }

    this.emit('stats', stats);
  }

  getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
    };
  }

  cleanup(): void {
    this.stop();
  }
}
