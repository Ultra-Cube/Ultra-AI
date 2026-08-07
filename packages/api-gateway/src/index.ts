/**
 * Ultra AI API Gateway Service
 * Multi-provider AI routing and token management
 */

import { NineRouterBridge, NineRouterConfig } from './9router-bridge';
import { AuthIntegration, AuthConfig, AuthContext } from './auth-integration';

// Export auth integration types for external use
export { AuthIntegration, AuthConfig, AuthContext };

export class APIGateway {
  private port: number;
  private providers: Map<string, ProviderConfig>;
  private nineRouterBridge: NineRouterBridge;
  private useNineRouter: boolean;
  private authIntegration: AuthIntegration;

  constructor(
    port: number = 20129,
    nineRouterConfig?: NineRouterConfig,
    authConfig?: AuthConfig
  ) {
    this.port = port;
    this.providers = new Map();
    this.useNineRouter = !!nineRouterConfig;
    this.nineRouterBridge = new NineRouterBridge(nineRouterConfig);
    this.authIntegration = new AuthIntegration(authConfig);
  }

  /**
   * Initialize the gateway service
   */
  async initialize(): Promise<void> {
    console.log(`Initializing API Gateway on port ${this.port}`);
    
    // Load provider configurations
    await this.loadProviders();
    console.log(`Loaded ${this.providers.size} provider configurations`);
    
    // Check 9router availability if configured
    if (this.useNineRouter) {
      const nineRouterAvailable = await this.nineRouterBridge.healthCheck();
      if (nineRouterAvailable) {
        console.log('9router service is available and will be used for routing');
        const models = await this.nineRouterBridge.getModels();
        console.log(`9router has ${models.length} available models`);
      } else {
        console.warn('9router service is not available, falling back to internal routing');
        this.useNineRouter = false;
      }
    }
  }

  /**
   * Load provider configurations from storage
   */
  private async loadProviders(): Promise<void> {
    // TODO: Load from database/storage
    // For now, initialize with empty map
  }

  /**
   * Add a provider configuration
   */
  addProvider(id: string, config: ProviderConfig): void {
    this.providers.set(id, config);
  }

  /**
   * Get provider configuration
   */
  getProvider(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Route request to appropriate provider
   */
  async routeRequest(
    request: GatewayRequest,
    headers?: Record<string, string>
  ): Promise<GatewayResponse> {
    console.log(`Routing request to model: ${request.model}`);
    
    // Verify authentication if headers provided
    let authContext: AuthContext | null = null;
    if (headers) {
      authContext = this.authIntegration.authenticateRequest(headers);
      if (!authContext) {
        return {
          success: false,
          data: { error: 'Authentication failed' },
          provider: 'auth',
          usage: { promptTokens: 0, completionTokens: 0 },
        };
      }
      console.log(`Authenticated user: ${authContext.email} (${authContext.role})`);
    }
    
    // Use 9router if available and configured
    if (this.useNineRouter) {
      try {
        return await this.nineRouterBridge.routeChatCompletion(request);
      } catch (error) {
        console.error('9router routing failed, falling back to internal routing:', error);
        // Fall through to internal routing
      }
    }
    
    // Internal routing fallback
    return this.routeInternal(request);
  }

  /**
   * Internal routing logic (fallback when 9router is unavailable)
   */
  private async routeInternal(request: GatewayRequest): Promise<GatewayResponse> {
    // TODO: Implement internal routing logic
    // For now, return a placeholder response
    return {
      success: true,
      data: { message: "Request routed internally (placeholder)" },
      provider: "internal",
      usage: { promptTokens: 0, completionTokens: 0 }
    };
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    if (this.useNineRouter) {
      return await this.nineRouterBridge.getModels();
    }
    
    // Return internal models
    return [];
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<any> {
    if (this.useNineRouter) {
      return await this.nineRouterBridge.getProviderStatus();
    }
    
    // Return internal provider status
    return {
      providers: Array.from(this.providers.entries()).map(([id, config]) => ({
        id,
        name: config.name,
        type: config.type,
        models: config.models,
      })),
    };
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<any> {
    if (this.useNineRouter) {
      return await this.nineRouterBridge.getUsageStats();
    }
    
    // Return internal usage stats
    return {
      totalRequests: 0,
      totalTokens: 0,
      providers: {},
    };
  }

  /**
   * Start the gateway server
   */
  async start(): Promise<void> {
    console.log(`Starting API Gateway server on port ${this.port}`);
    // TODO: Start Express server
  }

  /**
   * Stop the gateway server
   */
  async stop(): Promise<void> {
    console.log("Stopping API Gateway server");
    // TODO: Stop Express server
  }

  /**
   * Toggle 9router usage
   */
  setUseNineRouter(use: boolean): void {
    this.useNineRouter = use;
  }

  /**
   * Check if 9router is being used
   */
  isUsingNineRouter(): boolean {
    return this.useNineRouter;
  }

  /**
   * Get auth integration instance for external use
   */
  getAuthIntegration(): AuthIntegration {
    return this.authIntegration;
  }

  /**
   * Update auth configuration
   */
  updateAuthConfig(config: Partial<AuthConfig>): void {
    this.authIntegration.updateConfig(config);
  }
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'oauth' | 'api-key' | 'compatible';
  endpoint: string;
  models: string[];
  credentials?: Record<string, string>;
}

export interface GatewayRequest {
  model: string;
  messages: any[];
  parameters?: Record<string, any>;
}

export interface GatewayResponse {
  success: boolean;
  data: any;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Export singleton instance
export const gateway = new APIGateway();