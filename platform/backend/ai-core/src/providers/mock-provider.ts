// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { Task } from '../types';

import { LLMProvider } from './types';

/**
 * Deterministic offline provider used when no real provider credentials are
 * configured. Keeps the platform runnable end-to-end in dev/CI.
 */
export class MockProvider implements LLMProvider {
  readonly id = 'mock';
  readonly models: string[] = ['mock-model'];

  isAvailable(): boolean {
    return true;
  }

  async complete(task: Task, model: string): Promise<string> {
    const prefix = `[${task.type}/${model}]`;
    return `${prefix} ${task.payload}`;
  }
}
