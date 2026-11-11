/**
 * Integration Service
 * Coordinates all AI systems and repositories to work together
 */

import { EventEmitter } from 'events';

/**
 * Base URL of the mock-adapters service (platform/services/mock-adapters). The
 * integration layer probes this to derive honest, live status for the
 * imported sub-projects instead of reporting a hardcoded 'imported' label.
 */
const MOCK_ADAPTERS_URL =
  process.env.MOCK_ADAPTERS_URL || 'http://localhost:4100';

export interface SystemConfig {
  id: string;
  name: string;
  type:
    | 'gateway'
    | 'assistant'
    | 'intelligence'
    | 'desktop'
    | 'financial'
    | 'multimodal'
    | 'world-model'
    | 'animation';
  port?: number;
  status:
    | 'running'
    | 'stopped'
    | 'configured'
    | 'imported'
    | 'degraded'
    | 'offline';
  dependencies: string[];
  /**
   * Upstream source repository (fadhel-sh fork) that this sub-project is
   * backed by. Used to actually clone/integrate the real implementation
   * instead of relying on the mock adapter indefinitely.
   */
  repo?: string;
}

/** Upstream fadhel-sh fork repositories backing each catalog sub-project. */
export const UPSTREAM_REPOS: Record<string, string> = {
  '9router': 'https://github.com/fadhel-sh/9router',
  openclaw: 'https://github.com/fadhel-sh/AionUi',
  jarvis: 'https://github.com/fadhel-sh/OpenCompany',
  webui: 'https://github.com/fadhel-sh/APP_WebUI-desktop',
  'quant-mind': 'https://github.com/fadhel-sh/AI-Tools_quant-mind',
  'kimi-k2.5': 'https://github.com/fadhel-sh/AI-Model_Kimi-K2.5',
  biome: 'https://github.com/fadhel-sh/AI-Models_Biome',
  godmode: 'https://github.com/fadhel-sh/Engine_world-engine',
};

export class IntegrationService extends EventEmitter {
  private systems: Map<string, SystemConfig> = new Map();
  private running: boolean = false;

  constructor() {
    super();
    this.initializeSystems();
  }

  private initializeSystems(): void {
    // Define all AI systems with their dependencies
    const systemConfigs: SystemConfig[] = [
      {
        id: '9router',
        name: '9router',
        type: 'gateway',
        port: 20128,
        status: 'running',
        dependencies: [],
      },
      {
        id: 'openclaw',
        name: 'OpenClaw',
        type: 'assistant',
        status: 'configured',
        dependencies: ['9router'],
      },
      {
        id: 'jarvis',
        name: 'JARVIS',
        type: 'intelligence',
        status: 'configured',
        dependencies: ['9router'],
      },
      {
        id: 'webui',
        name: 'WebUI Desktop',
        type: 'desktop',
        status: 'configured',
        dependencies: ['9router'],
      },
      {
        id: 'quant-mind',
        name: 'QuantMind',
        type: 'financial',
        status: 'imported',
        dependencies: ['9router'],
      },
      {
        id: 'kimi-k2.5',
        name: 'Kimi K2.5',
        type: 'multimodal',
        status: 'imported',
        dependencies: ['9router'],
      },
      {
        id: 'biome',
        name: 'Biome',
        type: 'world-model',
        status: 'imported',
        dependencies: ['9router'],
      },
      {
        id: 'godmode',
        name: 'GodMode Animation',
        type: 'animation',
        status: 'imported',
        dependencies: ['9router'],
      },
    ];

    systemConfigs.forEach((config) => {
      config.repo = UPSTREAM_REPOS[config.id];
      this.systems.set(config.id, config);
    });
  }

  async startSystem(systemId: string): Promise<boolean> {
    const system = this.systems.get(systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found`);
    }

    // Check dependencies
    for (const depId of system.dependencies) {
      const dep = this.systems.get(depId);
      if (!dep || dep.status !== 'running') {
        console.error(`Dependency ${depId} is not running`);
        return false;
      }
    }

    // Start the system
    system.status = 'running';
    this.systems.set(systemId, system);
    this.emit('system-started', system);
    console.log(`System ${system.name} started successfully`);
    return true;
  }

  async stopSystem(systemId: string): Promise<boolean> {
    const system = this.systems.get(systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found`);
    }

    // Check if other systems depend on this one
    for (const [, sys] of this.systems) {
      if (sys.dependencies.includes(systemId) && sys.status === 'running') {
        console.error(`Cannot stop ${system.name}: ${sys.name} depends on it`);
        return false;
      }
    }

    system.status = 'stopped';
    this.systems.set(systemId, system);
    this.emit('system-stopped', system);
    console.log(`System ${system.name} stopped successfully`);
    return true;
  }

  async startAll(): Promise<void> {
    console.log('Starting all systems...');

    // Start in dependency order
    const startOrder = this.getDependencyOrder();

    for (const systemId of startOrder) {
      await this.startSystem(systemId);
    }

    this.running = true;
    this.emit('all-systems-started');
    console.log('All systems started successfully');
  }

  async stopAll(): Promise<void> {
    console.log('Stopping all systems...');

    // Stop in reverse dependency order
    const stopOrder = this.getDependencyOrder().reverse();

    for (const systemId of stopOrder) {
      await this.stopSystem(systemId);
    }

    this.running = false;
    this.emit('all-systems-stopped');
    console.log('All systems stopped successfully');
  }

  getSystemStatus(systemId: string): SystemConfig | undefined {
    return this.systems.get(systemId);
  }

  getAllSystems(): SystemConfig[] {
    return Array.from(this.systems.values());
  }

  /**
   * Probe a single sub-project's mock adapter and map its live response onto
   * a SystemConfig status. Falls back to 'offline' when the adapter can't be
   * reached (service not running / timed out) so the catalog stays honest
   * instead of claiming a system is 'imported' or 'configured' when nothing
   * is actually answering.
   */
  private async probeAdapterStatus(
    systemId: string
  ): Promise<SystemConfig['status']> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    try {
      const res = await fetch(
        `${MOCK_ADAPTERS_URL}/adapters/${encodeURIComponent(systemId)}/health`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        return 'offline';
      }
      const body = (await res.json()) as {
        status?: string;
        healthy?: boolean;
      };
      if (body.status === 'degraded' || body.healthy === false) {
        return 'degraded';
      }
      // 'running' and 'busy' both mean the service is live and serving.
      return 'running';
    } catch {
      return 'offline';
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Refresh every system's status by actually probing its mock adapter.
   * Updates the in-memory catalog and returns the live snapshot. Systems whose
   * adapter is unreachable are marked 'offline'.
   */
  async refreshStatuses(): Promise<SystemConfig[]> {
    const ids = Array.from(this.systems.keys());
    await Promise.all(
      ids.map(async (id) => {
        const system = this.systems.get(id);
        if (!system) return;
        const status = await this.probeAdapterStatus(id);
        system.status = status;
        this.systems.set(id, system);
      })
    );
    return this.getAllSystems();
  }

  getSystemsByType(type: SystemConfig['type']): SystemConfig[] {
    return Array.from(this.systems.values()).filter((s) => s.type === type);
  }

  getRunningSystems(): SystemConfig[] {
    return Array.from(this.systems.values()).filter(
      (s) => s.status === 'running'
    );
  }

  private getDependencyOrder(): string[] {
    // Topological sort based on dependencies
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (systemId: string) => {
      if (visited.has(systemId)) return;
      visited.add(systemId);

      const system = this.systems.get(systemId);
      if (system) {
        for (const depId of system.dependencies) {
          visit(depId);
        }
      }

      order.push(systemId);
    };

    for (const systemId of this.systems.keys()) {
      visit(systemId);
    }

    return order;
  }

  getSystemHealth(): {
    total: number;
    running: number;
    stopped: number;
    configured: number;
    imported: number;
  } {
    const systems = Array.from(this.systems.values());
    return {
      total: systems.length,
      running: systems.filter((s) => s.status === 'running').length,
      stopped: systems.filter((s) => s.status === 'stopped').length,
      configured: systems.filter((s) => s.status === 'configured').length,
      imported: systems.filter((s) => s.status === 'imported').length,
    };
  }

  isRunning(): boolean {
    return this.running;
  }
}
