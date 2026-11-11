/**
 * 9Router Bridge Service
 * Bridges Ultra-AI with 9router as a standalone service
 */

import { ProviderConfig, GatewayRequest, GatewayResponse } from './index';

export interface NineRouterConfig {
  host: string;
  port: number;
  apiKey: string;
  timeout: number;
}

export class NineRouterBridge {
  private config: NineRouterConfig;
  private baseUrl: string;

  constructor(config: Partial<NineRouterConfig> = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 20128,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
    };
    this.baseUrl = `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Check if 9router service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error('9router health check failed:', error);
      return false;
    }
  }

  /**
   * Get available models from 9router
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`9router models request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch models from 9router:', error);
      return [];
    }
  }

  /**
   * Get provider status from 9router
   */
  async getProviderStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/providers`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`9router provider status request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch provider status from 9router:', error);
      return null;
    }
  }

  /**
   * Route chat completion request through 9router
   */
  async routeChatCompletion(request: GatewayRequest): Promise<GatewayResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          ...request.parameters,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`9router chat completion failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        provider: '9router',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Failed to route request through 9router:', error);
      return {
        success: false,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        provider: '9router',
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    }
  }

  /**
   * Add provider configuration to 9router
   */
  async addProvider(provider: ProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/providers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(provider),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to add provider to 9router:', error);
      return false;
    }
  }

  /**
   * Get usage statistics from 9router
   */
  async getUsageStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/usage`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`9router usage stats request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch usage stats from 9router:', error);
      return null;
    }
  }

  /**
   * Get API key from 9router dashboard
   */
  async getApiKey(): Promise<string> {
    // This would require authentication with 9router dashboard
    // For now, return the configured key
    return this.config.apiKey;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NineRouterConfig>): void {
    this.config = { ...this.config, ...config };
    this.baseUrl = `http://${this.config.host}:${this.config.port}`;
  }
}