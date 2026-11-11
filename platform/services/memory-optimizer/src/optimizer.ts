/**
 * Memory Optimizer
 * Main memory optimization controller
 */

import { EventEmitter } from 'events';

import { GarbageCollector } from './garbage-collector';
import { ResourceMonitor } from './resource-monitor';
import { MemoryConfig, MemoryStats, OptimizationResult } from './types';

export class MemoryOptimizer extends EventEmitter {
  private config: MemoryConfig;
  private garbageCollector: GarbageCollector;
  private resourceMonitor: ResourceMonitor;
  private intervalId?: NodeJS.Timeout;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    this.config = {
      maxHeapSize: config.maxHeapSize || 1024 * 1024 * 1024, // 1GB
      gcInterval: config.gcInterval || 60000, // 1 minute
      enableAutoGC: config.enableAutoGC !== false,
      memoryThreshold: config.memoryThreshold || 0.8, // 80%
      aggressiveGC: config.aggressiveGC || false,
    };

    this.garbageCollector = new GarbageCollector(this.config);
    this.resourceMonitor = new ResourceMonitor();
  }

  initialize(): void {
    console.log('Initializing Memory Optimizer...');

    if (this.config.enableAutoGC) {
      this.startAutoGC();
    }

    this.resourceMonitor.on('threshold-exceeded', (stats) => {
      this.emit('memory-warning', stats);
      if (this.config.aggressiveGC) {
        this.optimize(true);
      }
    });

    this.emit('initialized');
  }

  async optimize(aggressive: boolean = false): Promise<OptimizationResult> {
    const before = this.getMemoryStats();
    const startTime = Date.now();

    if (aggressive) {
      await this.garbageCollector.forceGC();
    } else {
      await this.garbageCollector.collect();
    }

    const after = this.getMemoryStats();
    const duration = Date.now() - startTime;
    const freed = before.heapUsed - after.heapUsed;

    const result: OptimizationResult = {
      before,
      after,
      freed,
      duration,
    };

    this.emit('optimized', result);
    return result;
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

  getMemoryUsagePercentage(): number {
    const stats = this.getMemoryStats();
    return stats.heapUsed / this.config.maxHeapSize;
  }

  startAutoGC(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(async () => {
      const usage = this.getMemoryUsagePercentage();
      if (usage > this.config.memoryThreshold) {
        await this.optimize(this.config.aggressiveGC);
      }
    }, this.config.gcInterval);
  }

  stopAutoGC(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  updateConfig(config: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enableAutoGC !== undefined) {
      if (config.enableAutoGC) {
        this.startAutoGC();
      } else {
        this.stopAutoGC();
      }
    }

    this.emit('config-updated', this.config);
  }

  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  cleanup(): void {
    this.stopAutoGC();
    this.resourceMonitor.cleanup();
  }
}
