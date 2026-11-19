// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * Memory Optimizer Types
 */

export interface MemoryConfig {
  maxHeapSize: number;
  gcInterval: number;
  enableAutoGC: boolean;
  memoryThreshold: number;
  aggressiveGC: boolean;
}

export interface ResourceConfig {
  cpuThreshold: number;
  memoryThreshold: number;
  enableThrottling: boolean;
  maxConcurrentTasks: number;
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface OptimizationResult {
  before: MemoryStats;
  after: MemoryStats;
  freed: number;
  duration: number;
}
