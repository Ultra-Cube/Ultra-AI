// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { bridgeMetrics, logEvent } from './ops';
import { ExportBatch, ExportResult, ExportTarget, UltraEvent } from './types';

/**
 * P4B-12: per-agent spending-cap guard.
 *
 * Wraps any ExportTarget and refuses (throws) batches that would push an
 * agent over its token budget within a sliding window. Fail-closed: the
 * exporter keeps the batch in the outbox and retries after the window
 * slides — nothing is silently dropped or partially sent.
 *
 * Cost model is deliberately minimal: `costOf` defaults to
 * `payload.tokens` (number). Ultra AI decides what a "token" costs
 * upstream; this guard only enforces ceilings, never prices value (T2
 * stays blocked by G-4.2).
 */

export interface SpendingCapOptions {
  /** Max summed cost per agent key inside the window. */
  maxCostPerAgent: number;
  /** Sliding window length. Default 1 hour. */
  windowMs?: number;
  /** Cost extractor. Default: payload.tokens if a finite number, else 0. */
  costOf?: (event: UltraEvent) => number;
  /** Agent key extractor. Default: subject.agent ?? subject.instance. */
  agentOf?: (event: UltraEvent) => string;
  /** Injectable clock for tests. */
  now?: () => number;
}

interface WindowEntry {
  cost: number;
  ts: number;
}

const defaultCostOf = (e: UltraEvent): number => {
  const t = (e.payload as Record<string, unknown> | undefined)?.tokens;
  return typeof t === 'number' && Number.isFinite(t) ? t : 0;
};

const defaultAgentOf = (e: UltraEvent): string =>
  ((e.subject as Record<string, unknown> | undefined)?.agent as string) ??
  e.subject.instance ??
  'unknown';

export function withSpendingCap(
  inner: ExportTarget,
  opts: SpendingCapOptions
): ExportTarget {
  const windowMs = opts.windowMs ?? 60 * 60 * 1000;
  const costOf = opts.costOf ?? defaultCostOf;
  const agentOf = opts.agentOf ?? defaultAgentOf;
  const now = opts.now ?? Date.now;
  // agent -> recent (ts, cost) entries
  const spend = new Map<string, WindowEntry[]>();

  return {
    id: `${inner.id}+spending-cap`,
    async send(batch: ExportBatch): Promise<ExportResult> {
      const t = now();
      // First pass: would any agent exceed? Evaluate without committing.
      const projected = new Map<string, number>();
      for (const ev of batch.events) {
        const agent = agentOf(ev);
        const cost = costOf(ev);
        if (cost <= 0) continue;
        const used =
          (spend.get(agent) ?? [])
            .filter((e) => t - e.ts < windowMs)
            .reduce((a, e) => a + e.cost, 0) + (projected.get(agent) ?? 0);
        projected.set(agent, (projected.get(agent) ?? 0) + cost);
        if (used + cost > opts.maxCostPerAgent) {
          bridgeMetrics.inc('ultra_core_spend_blocked_total', {
            agent: agent.slice(0, 64),
          });
          logEvent('warn', 'ultra_core.spend_cap.blocked', {
            target: inner.id,
            batch_id: batch.batch_id,
            agent,
            cost,
            cap: opts.maxCostPerAgent,
          });
          throw new Error(
            `spending cap exceeded for agent "${agent}": ` +
              `${used + cost} > ${opts.maxCostPerAgent} per ${windowMs}ms`
          );
        }
      }
      // Under cap: commit spend, then delegate.
      for (const ev of batch.events) {
        const agent = agentOf(ev);
        const cost = costOf(ev);
        if (cost <= 0) continue;
        const kept = (spend.get(agent) ?? []).filter(
          (e) => t - e.ts < windowMs
        );
        kept.push({ cost, ts: t });
        spend.set(agent, kept);
      }
      return inner.send(batch);
    },
  };
}
