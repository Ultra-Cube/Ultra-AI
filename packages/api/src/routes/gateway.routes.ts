import { Router } from 'express';
import { APIGateway } from '@ultra-ai/api-gateway';

export function createGatewayRoutes(gateway: APIGateway): Router {
  const router = Router();

  /**
   * GET /api/gateway/health
   * Check gateway service health
   */
  router.get('/health', async (req, res) => {
    try {
      const nineRouterStatus = gateway.isUsingNineRouter();
      res.json({
        status: 'ok',
        usingNineRouter: nineRouterStatus,
        port: 20129,
      });
    } catch (error) {
      res.status(500).json({ error: 'Health check failed' });
    }
  });

  /**
   * GET /api/gateway/providers
   * Get all configured providers
   */
  router.get('/providers', async (req, res) => {
    try {
      const providers = await gateway.getProviderStatus();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  });

  /**
   * POST /api/gateway/providers
   * Add a new provider
   */
  router.post('/providers', async (req, res) => {
    try {
      const { id, name, type, endpoint, models, credentials } = req.body;

      // Validate required fields
      if (!id || !name || !type || !endpoint) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const providerConfig = {
        id,
        name,
        type,
        endpoint,
        models: models || [],
        credentials: credentials || {},
      };

      gateway.addProvider(id, providerConfig);

      res.status(201).json({
        message: 'Provider added successfully',
        provider: providerConfig,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add provider' });
    }
  });

  /**
   * GET /api/gateway/models
   * Get available models
   */
  router.get('/models', async (req, res) => {
    try {
      const models = await gateway.getModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  /**
   * GET /api/gateway/usage
   * Get usage statistics
   */
  router.get('/usage', async (req, res) => {
    try {
      const usage = await gateway.getUsageStats();
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
  });

  /**
   * POST /api/gateway/route
   * Route a request through the gateway
   */
  router.post('/route', async (req, res) => {
    try {
      const { model, messages, parameters } = req.body;

      // Validate required fields
      if (!model || !messages) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const gatewayRequest = {
        model,
        messages,
        parameters: parameters || {},
      };

      const headers = req.headers as Record<string, string>;
      const response = await gateway.routeRequest(gatewayRequest, headers);

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Request routing failed' });
    }
  });

  /**
   * GET /api/gateway/config
   * Get gateway configuration
   */
  router.get('/config', async (req, res) => {
    try {
      res.json({
        usingNineRouter: gateway.isUsingNineRouter(),
        port: 20129,
        authEnabled: gateway.getAuthIntegration().getConfig().verifyAuth,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  });

  /**
   * PATCH /api/gateway/config
   * Update gateway configuration
   */
  router.patch('/config', async (req, res) => {
    try {
      const { useNineRouter, verifyAuth } = req.body;

      if (typeof useNineRouter === 'boolean') {
        gateway.setUseNineRouter(useNineRouter);
      }

      if (typeof verifyAuth === 'boolean') {
        gateway.updateAuthConfig({ verifyAuth });
      }

      res.json({
        message: 'Configuration updated successfully',
        config: {
          usingNineRouter: gateway.isUsingNineRouter(),
          authEnabled: gateway.getAuthIntegration().getConfig().verifyAuth,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  return router;
}