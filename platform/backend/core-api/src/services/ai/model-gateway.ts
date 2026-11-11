/**
 * Advanced Model Routing and Provider Gateway
 * Supports multiple AI providers (OpenAI, Anthropic, Ollama)
 * with health checks and automatic failover
 */

import {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  OLLAMA_MODELS,
} from '@ultra-ai/ai-core';

export interface ProviderConfig {
  name: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  enabled: boolean;
  priority: number; // Lower number = higher priority
}

export interface ModelRouteResult {
  provider: string;
  model: string;
  endpoint: string;
  headers: Record<string, string>;
}

export interface ProviderHealthStatus {
  provider: string;
  healthy: boolean;
  lastChecked: Date;
  errorCount: number;
  successCount: number;
}

export class ModelGateway {
  private providers: Map<string, ProviderConfig> = new Map();
  private healthStatus: Map<string, ProviderHealthStatus> = new Map();
  private errorCountThreshold = 5;

  constructor(configs: ProviderConfig[] = []) {
    // Initialize with default providers if none provided
    if (configs.length === 0) {
      configs = this.getDefaultProviders();
    }

    for (const config of configs) {
      this.registerProvider(config);
    }
  }

  /**
   * Get default provider configurations
   * In production, these would come from environment variables
   */
  private getDefaultProviders(): ProviderConfig[] {
    return [
      {
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        models: [...OPENAI_MODELS],
        enabled: !!process.env.OPENAI_API_KEY,
        priority: 1,
      },
      {
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        models: [...ANTHROPIC_MODELS],
        enabled: !!process.env.ANTHROPIC_API_KEY,
        priority: 2,
      },
      {
        name: 'ollama',
        baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
        models: [...OLLAMA_MODELS],
        enabled: !!process.env.OLLAMA_BASE_URL || true, // Local fallback
        priority: 3,
      },
    ];
  }

  private registerProvider(config: ProviderConfig): void {
    this.providers.set(config.name, config);
    this.healthStatus.set(config.name, {
      provider: config.name,
      healthy: true,
      lastChecked: new Date(),
      errorCount: 0,
      successCount: 0,
    });
  }

  /**
   * Route a model request to the best available provider
   * Returns provider endpoint and authentication headers
   */
  async routeRequest(model: string): Promise<ModelRouteResult> {
    // Find all providers that support this model
    const availableProviders = this.findProvidersForModel(model);

    if (availableProviders.length === 0) {
      throw new Error(`No provider available for model: ${model}`);
    }

    // Sort by priority and health status
    const sortedProviders = availableProviders.sort((a, b) => {
      const aHealth = this.healthStatus.get(a.name);
      const bHealth = this.healthStatus.get(b.name);

      // Healthy providers come first
      if (aHealth?.healthy !== bHealth?.healthy) {
        return aHealth?.healthy ? -1 : 1;
      }

      // Then sort by priority
      return a.priority - b.priority;
    });

    // Use the best available provider
    const chosen = sortedProviders[0];

    return {
      provider: chosen.name,
      model,
      endpoint: this.getProviderEndpoint(chosen.name),
      headers: this.getProviderHeaders(chosen.name),
    };
  }

  /**
   * Record a successful request to a provider
   */
  recordSuccess(provider: string): void {
    const status = this.healthStatus.get(provider);
    if (status) {
      status.successCount++;
      status.errorCount = Math.max(0, status.errorCount - 1);
      status.lastChecked = new Date();

      // Mark as healthy if errors are below threshold
      if (status.errorCount < this.errorCountThreshold) {
        status.healthy = true;
      }
    }
  }

  /**
   * Record a failed request to a provider
   */
  recordFailure(provider: string): void {
    const status = this.healthStatus.get(provider);
    if (status) {
      status.errorCount++;
      status.lastChecked = new Date();

      // Mark as unhealthy if errors exceed threshold
      if (status.errorCount >= this.errorCountThreshold) {
        status.healthy = false;
      }
    }
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): ProviderHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Find providers that support a given model
   */
  private findProvidersForModel(model: string): ProviderConfig[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.enabled && provider.models.includes(model)
    );
  }

  /**
   * Get endpoint URL for a provider
   */
  private getProviderEndpoint(provider: string): string {
    const config = this.providers.get(provider as any);
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'ollama':
        return `${config.baseUrl || 'http://localhost:11434'}/api/generate`;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get authentication headers for a provider
   */
  private getProviderHeaders(provider: string): Record<string, string> {
    const config = this.providers.get(provider as any);
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      switch (provider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${config.apiKey}`;
          break;
        case 'anthropic':
          headers['x-api-key'] = config.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          break;
      }
    }

    return headers;
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(provider: string): Promise<boolean> {
    try {
      // In a real implementation, this would make actual health check requests
      // For now, we check if the provider is configured and enabled
      const config = this.providers.get(provider as any);
      if (!config || !config.enabled) {
        return false;
      }

      // For API-based providers, we'd check their health endpoint
      // For local providers (Ollama), we'd make a test request
      return true;
    } catch {
      this.recordFailure(provider);
      return false;
    }
  }

  /**
   * List available models across all providers
   */
  listAvailableModels(): Map<string, string[]> {
    const models = new Map<string, string[]>();

    for (const [provider, config] of this.providers) {
      if (config.enabled) {
        models.set(provider, config.models);
      }
    }

    return models;
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(
    provider: string,
    config: Partial<ProviderConfig>
  ): void {
    const existing = this.providers.get(provider as any);
    if (!existing) {
      throw new Error(`Provider not found: ${provider}`);
    }

    const updated = { ...existing, ...config, name: existing.name };
    this.registerProvider(updated);
  }
}

/**
 * Factory function to create a gateway with default configuration
 */
export function createModelGateway(configs?: ProviderConfig[]): ModelGateway {
  return new ModelGateway(configs);
}
