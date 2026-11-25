// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Ultra AI — DCS Routes (Directory-Control-Systems backend integration)    ║
// ║  Wraps control/directory-control-systems/main.js — JSON CLI output          ║
// ║  Ultra Cube Tech — ucubetech.com — github.com/Ultra-Cube/Ultra-AI       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import type { FastifyInstance } from 'fastify';
import {
  dcsActionType,
  dcsDomainStatus,
  dcsExecute,
  dcsStatus,
  dcsSystemCheck,
  isDcsDomain,
} from '../services/dcs-service';

const DOMAINS = ['distribution', 'environment', 'infrastructure', 'platform'];

export async function dcsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dcs', async () => {
    try {
      const status = await dcsStatus();
      return { ok: true, system: 'directory-control-systems', status };
    } catch (err) {
      return {
        ok: false,
        system: 'directory-control-systems',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  app.get('/dcs/check', async () => {
    try {
      const result = await dcsSystemCheck();
      return { ok: true, check: result };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  app.get('/dcs/:domain/status', async (request, reply) => {
    const { domain } = request.params as { domain: string };
    if (!isDcsDomain(domain)) {
      return reply.code(404).send({ error: 'unknown DCS domain', domain, allowed: DOMAINS });
    }
    try {
      const status = await dcsDomainStatus(domain);
      return { ok: true, domain, status };
    } catch (err) {
      return {
        ok: false,
        domain,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  // Execute a DCS command. Read-only commands (status/health/validate) run
  // directly; mutating commands require confirm=1 and are allowlisted.
  app.post('/dcs/:domain/:command', async (request, reply) => {
    const { domain, command } = request.params as { domain: string; command: string };
    if (!isDcsDomain(domain)) {
      return reply.code(404).send({ error: 'unknown DCS domain', domain, allowed: DOMAINS });
    }
    const action = dcsActionType(domain, command);
    if (!action) {
      return reply.code(400).send({ error: 'command not allowed', domain, command });
    }
    const body = (request.body ?? {}) as { args?: string[]; confirm?: string };
    if (action === 'write' && body.confirm !== '1') {
      return reply.code(403).send({
        error: 'mutating DCS command — re-request with confirm=1',
        domain,
        command,
      });
    }
    const args = Array.isArray(body.args)
      ? body.args.filter((a): a is string => typeof a === 'string').slice(0, 20)
      : [];
    const result = await dcsExecute(domain, command, args);
    return reply.code(result.ok ? 200 : 502).send(result);
  });
}
