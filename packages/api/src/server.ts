/**
 * Ultra AI Platform - API Server
 * 
 * Starts the Fastify server with all integrated features:
 * - Phase 6: RBAC
 * - Phase 7: Swagger API Documentation
 * - Phase 8: Monitoring & Observability
 * - Phase 9: Performance Caching
 */

import { startServer } from './index';
import { appLogger } from './services/monitoring/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function main() {
  try {
    appLogger.info(`Starting Ultra AI API Server on port ${PORT}...`);
    
    const { app } = await startServer(PORT);
    
    appLogger.info('🚀 Ultra AI Platform API Server Started!');
    appLogger.info(`📚 Swagger UI:      http://localhost:${PORT}/api-docs`);
    appLogger.info(`📊 Prometheus:      http://localhost:${PORT}/metrics`);
    appLogger.info(`💚 Health Check:    http://localhost:${PORT}/health/detailed`);
    appLogger.info(`🔐 Admin Dashboard: http://localhost:${PORT}/admin/dashboard (requires ADMIN role)`);
    
    // Handle graceful shutdown
    const shutdown = async () => {
      appLogger.info('Shutting down server...');
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    appLogger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
