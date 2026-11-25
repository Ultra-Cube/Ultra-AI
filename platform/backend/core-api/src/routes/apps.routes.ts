// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Ultra AI — Apps Routes (external app integration / control layer)        ║
// ║  Ultra Cube Tech — ucubetech.com — github.com/Ultra-Cube/Ultra-AI       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import type { FastifyInstance } from 'fastify';
import {
  APP_CATALOG,
  isReadOnlyProxy,
  listApps,
  proxyGet,
  type AppConnector,
} from '../services/apps-service';

function findApp(id: string): AppConnector | undefined {
  return APP_CATALOG.find((a) => a.id === id);
}

export async function appsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/apps', async (request) => {
    const { probe } = request.query as { probe?: string };
    const apps = await listApps(probe !== '0');
    return { apps, count: apps.length, checkedAt: new Date().toISOString() };
  });

  app.get('/apps/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const appDef = findApp(id);
    if (!appDef) return reply.code(404).send({ error: 'unknown app', id });
    const [status] = await listApps(true).then((list) => list.filter((a) => a.id === id));
    return status ?? { ...appDef, online: false, checkedAt: new Date().toISOString() };
  });

  // Read-only GET proxy into an external app's API. Sensitive/write paths and
  // paths not in the connector's readOnlyPaths list are rejected.
  app.get('/apps/:id/proxy', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { path: rawPath, confirm } = request.query as { path?: string; confirm?: string };
    const appDef = findApp(id);
    if (!appDef) return reply.code(404).send({ error: 'unknown app', id });

    const pathname = (rawPath || appDef.healthPath || '/').split('?')[0];
    if (!pathname.startsWith('/')) {
      return reply.code(400).send({ error: 'path must start with /' });
    }
    if (!isReadOnlyProxy(appDef, pathname)) {
      if (appDef.sensitive && confirm !== '1') {
        return reply.code(403).send({
          error: 'sensitive endpoint — re-request with confirm=1',
          path: pathname,
        });
      }
      return reply.code(403).send({ error: 'path is not in the read-only allowlist', path: pathname });
    }

    try {
      const result = await proxyGet(appDef, pathname);
      return reply.code(result.status).send(result.body);
    } catch (err) {
      return reply.code(502).send({
        error: 'upstream unreachable',
        app: id,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
