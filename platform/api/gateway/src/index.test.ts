import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIGateway } from './index';
import { NineRouterConfig } from './9router-bridge';

// Mock the NineRouterBridge
jest.mock('./9router-bridge', () => {
  return {
    NineRouterBridge: jest.fn().mockImplementation(() => ({
      healthCheck: jest.fn().mockResolvedValue(true),
      getModels: jest.fn().mockResolvedValue([]),
      getProviderStatus: jest.fn().mockResolvedValue({}),
      routeChatCompletion: jest.fn().mockResolvedValue({
        success: true,
        data: { message: 'Test response' },
        provider: '9router',
        usage: { promptTokens: 10, completionTokens: 20 },
      }),
      addProvider: jest.fn().mockResolvedValue(true),
      getUsageStats: jest.fn().mockResolvedValue({}),
    })),
  };
});

describe('APIGateway', () => {
  let gateway: APIGateway;
  let nineRouterConfig: NineRouterConfig;

  beforeEach(() => {
    nineRouterConfig = {
      host: 'localhost',
      port: 20128,
      apiKey: 'test-key',
      timeout: 30000,
    };
    gateway = new APIGateway(20129, nineRouterConfig);
  });

  describe('constructor', () => {
    it('should initialize with default port', () => {
      const gw = new APIGateway();
      expect(gw).toBeDefined();
    });

    it('should initialize with custom port', () => {
      const gw = new APIGateway(3000);
      expect(gw).toBeDefined();
    });

    it('should initialize with 9router config', () => {
      const gw = new APIGateway(20129, nineRouterConfig);
      expect(gw).toBeDefined();
      expect(gw.isUsingNineRouter()).toBe(true);
    });

    it('should not use 9router when config not provided', () => {
      const gw = new APIGateway(20129);
      expect(gw.isUsingNineRouter()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(gateway.initialize()).resolves.not.toThrow();
    });

    it('should load providers', async () => {
      await gateway.initialize();
      const providers = gateway.getProvider('test');
      expect(providers).toBeUndefined();
    });
  });

  describe('addProvider', () => {
    it('should add provider', () => {
      const config = {
        name: 'Test Provider',
        type: 'api-key' as const,
        endpoint: 'https://api.test.com',
        models: ['gpt-4'],
        credentials: { apiKey: 'test-key' },
      };
      gateway.addProvider('test-provider', config);
      const retrieved = gateway.getProvider('test-provider');
      expect(retrieved).toEqual(config);
    });

    it('should overwrite existing provider', () => {
      const config1 = { name: 'Provider 1', type: 'api-key' as const, endpoint: 'https://api1.com', models: [], credentials: {} };
      const config2 = { name: 'Provider 2', type: 'api-key' as const, endpoint: 'https://api2.com', models: [], credentials: {} };
      
      gateway.addProvider('test', config1);
      gateway.addProvider('test', config2);
      
      const retrieved = gateway.getProvider('test');
      expect(retrieved).toEqual(config2);
    });
  });

  describe('getProvider', () => {
    it('should return undefined for non-existent provider', () => {
      const provider = gateway.getProvider('non-existent');
      expect(provider).toBeUndefined();
    });

    it('should return provider config', () => {
      const config = { name: 'Test', type: 'api-key' as const, endpoint: 'https://test.com', models: [], credentials: {} };
      gateway.addProvider('test', config);
      const retrieved = gateway.getProvider('test');
      expect(retrieved).toEqual(config);
    });
  });

  describe('routeRequest', () => {
    it('should route request through 9router when available', async () => {
      const request = {
        model: 'gpt-4',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        parameters: {},
      };
      
      const response = await gateway.routeRequest(request);
      expect(response.success).toBe(true);
      expect(response.provider).toBe('9router');
    });

    it('should route request internally when 9router unavailable', async () => {
      gateway.setUseNineRouter(false);
      
      const request = {
        model: 'gpt-4',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        parameters: {},
      };
      
      const response = await gateway.routeRequest(request);
      expect(response.success).toBe(true);
      expect(response.provider).toBe('internal');
    });

    it('should fail authentication with invalid headers', async () => {
      const request = {
        model: 'gpt-4',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        parameters: {},
      };
      
      const response = await gateway.routeRequest(request, { Authorization: 'invalid' });
      expect(response.success).toBe(false);
      expect(response.provider).toBe('auth');
    });
  });

  describe('getModels', () => {
    it('should return models from 9router when available', async () => {
      const models = await gateway.getModels();
      expect(Array.isArray(models)).toBe(true);
    });

    it('should return empty array when 9router unavailable', async () => {
      gateway.setUseNineRouter(false);
      const models = await gateway.getModels();
      expect(models).toEqual([]);
    });
  });

  describe('getProviderStatus', () => {
    it('should return provider status from 9router when available', async () => {
      const status = await gateway.getProviderStatus();
      expect(status).toBeDefined();
    });

    it('should return internal provider status when 9router unavailable', async () => {
      gateway.setUseNineRouter(false);
      const status = await gateway.getProviderStatus();
      expect(status).toHaveProperty('providers');
    });
  });

  describe('getUsageStats', () => {
    it('should return usage stats from 9router when available', async () => {
      const stats = await gateway.getUsageStats();
      expect(stats).toBeDefined();
    });

    it('should return internal usage stats when 9router unavailable', async () => {
      gateway.setUseNineRouter(false);
      const stats = await gateway.getUsageStats();
      expect(stats).toHaveProperty('totalRequests');
    });
  });

  describe('setUseNineRouter', () => {
    it('should toggle 9router usage', () => {
      gateway.setUseNineRouter(false);
      expect(gateway.isUsingNineRouter()).toBe(false);
      
      gateway.setUseNineRouter(true);
      expect(gateway.isUsingNineRouter()).toBe(true);
    });
  });

  describe('isUsingNineRouter', () => {
    it('should return current 9router usage status', () => {
      gateway.setUseNineRouter(true);
      expect(gateway.isUsingNineRouter()).toBe(true);
      
      gateway.setUseNineRouter(false);
      expect(gateway.isUsingNineRouter()).toBe(false);
    });
  });

  describe('getAuthIntegration', () => {
    it('should return auth integration instance', () => {
      const auth = gateway.getAuthIntegration();
      expect(auth).toBeDefined();
      expect(auth).toHaveProperty('verifyToken');
      expect(auth).toHaveProperty('authenticateRequest');
    });
  });

  describe('updateAuthConfig', () => {
    it('should update auth configuration', () => {
      gateway.updateAuthConfig({ verifyAuth: false });
      const auth = gateway.getAuthIntegration();
      const config = auth.getConfig();
      expect(config.verifyAuth).toBe(false);
    });
  });
});