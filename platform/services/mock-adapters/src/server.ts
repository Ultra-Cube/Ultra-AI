/**
 * Ultra AI - Mock Adapters Service
 *
 * A single lightweight Fastify process that stands in for the imported
 * sub-projects (9router, OpenClaw, JARVIS, WebUI, QuantMind, Kimi K2.5,
 * Biome, GodMode). It exposes one set of routes keyed by sub-project id so
 * the platform's integration layer can probe real HTTP endpoints instead of
 * reading hardcoded 'imported' catalog entries.
 *
 * Routes:
 *   GET /health                 -> service-level health + list of adapters
 *   GET /adapters               -> adapter catalog (ids, names, types)
 *   GET /adapters/:id/health    -> per-adapter health (status, uptime)
 *   GET /adapters/:id/status    -> per-adapter rich status (metrics)
 */

import Fastify, { FastifyInstance } from 'fastify';

import {
  ADAPTER_DEFINITIONS,
  buildHealth,
  buildStatus,
  getAdapter,
} from './adapters';

const PORT = parseInt(process.env.MOCK_ADAPTERS_PORT || '4100', 10);
const HOST = process.env.MOCK_ADAPTERS_HOST || '0.0.0.0';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  // Service-level health: confirms the mock-adapters process itself is up.
  app.get('/health', async () => ({
    service: 'mock-adapters',
    status: 'running',
    healthy: true,
    adapters: ADAPTER_DEFINITIONS.map((a) => a.id),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }));

  // Adapter catalog.
  app.get('/adapters', async () => ({
    adapters: ADAPTER_DEFINITIONS,
    count: ADAPTER_DEFINITIONS.length,
  }));

  // Per-adapter health probe.
  app.get<{ Params: { id: string } }>(
    '/adapters/:id/health',
    async (request, reply) => {
      const def = getAdapter(request.params.id);
      if (!def) {
        return reply
          .code(404)
          .send({ error: `Unknown adapter: ${request.params.id}` });
      }
      return buildHealth(def);
    }
  );

  // Per-adapter rich status.
  app.get<{ Params: { id: string } }>(
    '/adapters/:id/status',
    async (request, reply) => {
      const def = getAdapter(request.params.id);
      if (!def) {
        return reply
          .code(404)
          .send({ error: `Unknown adapter: ${request.params.id}` });
      }
      return buildStatus(def);
    }
  );

  return app;
}

async function main() {
  const app = buildApp();
  try {
    await app.listen({ port: PORT, host: HOST });
    // eslint-disable-next-line no-console
    console.log(
      `🧩 Ultra AI Mock Adapters listening on http://localhost:${PORT}`
    );
    // eslint-disable-next-line no-console
    console.log(
      `   Adapters: ${ADAPTER_DEFINITIONS.map((a) => a.id).join(', ')}`
    );

    const shutdown = async () => {
      await app.close();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Mock adapters failed to start:', err);
    process.exit(1);
  }
}

// Only auto-start when run directly, not when imported for tests.
const invokedDirectly =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js'));

if (invokedDirectly) {
  void main();
}
