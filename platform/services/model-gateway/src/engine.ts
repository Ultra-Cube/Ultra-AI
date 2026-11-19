// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { MODEL_CATALOG } from './catalog';
import type {
  ProviderAdapter,
  BreakerState,
  ChatRequest,
  ChatResponse,
  DataClass,
  MeterRecord,
  ProviderId,
  Usage,
} from './types';

// ---------- Circuit breaker ----------

interface BreakerEntry {
  state: BreakerState;
  failures: number;
  successes: number;
  openedAt: number;
}

export class CircuitBreaker {
  private readonly breakers = new Map<ProviderId, BreakerEntry>();
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(opts?: { failureThreshold?: number; cooldownMs?: number }) {
    this.failureThreshold = opts?.failureThreshold ?? 3;
    this.cooldownMs = opts?.cooldownMs ?? 30_000;
  }

  private entry(id: ProviderId): BreakerEntry {
    let e = this.breakers.get(id);
    if (!e) {
      e = { state: 'closed', failures: 0, successes: 0, openedAt: 0 };
      this.breakers.set(id, e);
    }
    return e;
  }

  /** May a request to this provider be attempted now? */
  canRequest(id: ProviderId, now = Date.now()): boolean {
    const e = this.entry(id);
    if (e.state === 'closed') return true;
    if (e.state === 'half-open') return true;
    // open: allow a probe after cooldown
    if (now - e.openedAt >= this.cooldownMs) {
      e.state = 'half-open';
      return true;
    }
    return false;
  }

  recordSuccess(id: ProviderId): void {
    const e = this.entry(id);
    e.successes += 1;
    e.failures = 0;
    e.state = 'closed';
  }

  recordFailure(id: ProviderId): void {
    const e = this.entry(id);
    e.failures += 1;
    if (e.state === 'half-open' || e.failures >= this.failureThreshold) {
      e.state = 'open';
      e.openedAt = Date.now();
    }
  }

  state(id: ProviderId): BreakerState {
    return this.entry(id).state;
  }

  reset(id: ProviderId): void {
    this.breakers.delete(id);
  }

  all(): Record<ProviderId, BreakerState> {
    const out = {} as Record<ProviderId, BreakerState>;
    for (const m of MODEL_CATALOG) out[m.provider] = this.state(m.provider);
    return out;
  }
}

// ---------- Metering ----------

export class UsageMeter {
  private readonly records: MeterRecord[] = [];
  private readonly maxRecords: number;

  constructor(maxRecords = 10_000) {
    this.maxRecords = maxRecords;
  }

  record(r: MeterRecord): void {
    this.records.push(r);
    if (this.records.length > this.maxRecords) {
      this.records.splice(0, this.records.length - this.maxRecords);
    }
  }

  /** USD cost for a completed call based on catalog costPer1k. */
  costFor(provider: ProviderId, model: string, usage: Usage): number {
    const entry = MODEL_CATALOG.find(
      (m) => m.provider === provider && m.model === model
    );
    const rate = entry?.costPer1k ?? 0;
    return (usage.totalTokens / 1000) * rate;
  }

  summary(): {
    calls: number;
    failures: number;
    totalTokens: number;
    totalCostUsd: number;
    byProvider: Record<
      string,
      { calls: number; tokens: number; costUsd: number }
    >;
  } {
    const byProvider: Record<
      string,
      { calls: number; tokens: number; costUsd: number }
    > = {};
    let calls = 0;
    let failures = 0;
    let totalTokens = 0;
    let totalCostUsd = 0;
    for (const r of this.records) {
      calls += 1;
      if (!r.ok) failures += 1;
      totalTokens += r.totalTokens;
      totalCostUsd += r.costUsd;
      const p = (byProvider[r.provider] ??= {
        calls: 0,
        tokens: 0,
        costUsd: 0,
      });
      p.calls += 1;
      p.tokens += r.totalTokens;
      p.costUsd += r.costUsd;
    }
    return { calls, failures, totalTokens, totalCostUsd, byProvider };
  }
}

// ---------- Router ----------

export interface RouteCandidate {
  provider: ProviderId;
  model: string;
  score: number;
}

export class ModelRouter {
  /**
   * Pick the best catalog entry for a request.
   * Constraints (hard): enabled, data-class allowed, preferLocal,
   * provider+model override. Scoring (soft): task capability match,
   * quality, cost, latency — weighted by request hints.
   */
  route(
    req: ChatRequest,
    opts?: {
      weightQuality?: number;
      weightCost?: number;
      weightLatency?: number;
    }
  ): RouteCandidate[] {
    const wQ = opts?.weightQuality ?? 0.5;
    const wC = opts?.weightCost ?? 0.3;
    const wL = opts?.weightLatency ?? 0.2;
    const dataClass: DataClass = req.dataClass ?? 'internal';

    let entries = MODEL_CATALOG.filter(
      (m) =>
        m.enabled &&
        m.allowedDataClasses.includes(dataClass) &&
        (!req.preferLocal || m.provider === 'ollama' || m.costPer1k === 0) &&
        (!req.model || m.model === req.model) &&
        (!req.provider || m.provider === req.provider)
    );

    // taskClass capability filter (summarize/chat are generic)
    if (
      req.taskClass &&
      req.taskClass !== 'summarize' &&
      req.taskClass !== 'chat'
    ) {
      const capable = entries.filter((m) =>
        m.capabilities.includes(req.taskClass as 'code' | 'reasoning' | 'agent')
      );
      if (capable.length) entries = capable;
    }

    const maxCost = Math.max(...entries.map((e) => e.costPer1k), 0.001);
    return entries
      .map((m) => {
        const capMatch =
          req.taskClass && m.capabilities.includes(req.taskClass as never)
            ? 0.1
            : 0;
        const score =
          m.quality * wQ +
          (1 - m.costPer1k / maxCost) * wC +
          (1 - m.latencyClass / 2) * wL +
          capMatch;
        return { provider: m.provider, model: m.model, score };
      })
      .sort((a, b) => b.score - a.score);
  }
}

// ---------- Gateway ----------

export interface GatewayOptions {
  adapters: Partial<Record<ProviderId, ProviderAdapter>>;
  apiKeys?: Partial<Record<ProviderId, string>>;
  breaker?: CircuitBreaker;
  meter?: UsageMeter;
  router?: ModelRouter;
  /** max fallback attempts across providers */
  maxFallbacks?: number;
  now?: () => number;
}

export class ModelGateway {
  private readonly adapters: Partial<Record<ProviderId, ProviderAdapter>>;
  private readonly apiKeys: Partial<Record<ProviderId, string>>;
  private readonly breaker: CircuitBreaker;
  private readonly meter: UsageMeter;
  private readonly router: ModelRouter;
  private readonly maxFallbacks: number;
  private readonly now: () => number;

  constructor(opts: GatewayOptions) {
    this.adapters = opts.adapters;
    this.apiKeys = opts.apiKeys ?? {};
    this.breaker = opts.breaker ?? new CircuitBreaker();
    this.meter = opts.meter ?? new UsageMeter();
    this.router = opts.router ?? new ModelRouter();
    this.maxFallbacks = opts.maxFallbacks ?? 2;
    this.now = opts.now ?? Date.now;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const candidates = this.router.route(req);
    if (!candidates.length) {
      throw new Error('no eligible model for request constraints');
    }

    const attempted = new Set<ProviderId>();
    let lastError: Error | null = null;
    let fallbacks = 0;

    for (const cand of candidates) {
      if (attempted.has(cand.provider)) continue;
      const adapter = this.adapters[cand.provider];
      if (!adapter) continue;
      if (!this.breaker.canRequest(cand.provider, this.now())) continue;
      if (fallbacks > 0 && fallbacks >= this.maxFallbacks) break;

      attempted.add(cand.provider);
      const started = this.now();
      try {
        const out = await adapter.chat(
          { ...req, provider: cand.provider, model: cand.model },
          this.apiKeys[cand.provider]
        );
        const latencyMs = this.now() - started;
        this.breaker.recordSuccess(cand.provider);
        const costUsd = this.meter.costFor(
          cand.provider,
          cand.model,
          out.usage
        );
        this.meter.record({
          ts: this.now(),
          provider: cand.provider,
          model: cand.model,
          promptTokens: out.usage.promptTokens,
          completionTokens: out.usage.completionTokens,
          totalTokens: out.usage.totalTokens,
          costUsd,
          latencyMs,
          ok: true,
          dataClass: req.dataClass,
        });
        return {
          provider: cand.provider,
          model: cand.model,
          content: out.content,
          usage: out.usage,
          latencyMs,
          fallbackFrom: fallbacks > 0 ? [...attempted][0] : undefined,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.breaker.recordFailure(cand.provider);
        const latencyMs = this.now() - started;
        this.meter.record({
          ts: this.now(),
          provider: cand.provider,
          model: cand.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          latencyMs,
          ok: false,
          dataClass: req.dataClass,
        });
        fallbacks += 1;
      }
    }

    throw lastError ?? new Error('all providers unavailable');
  }

  /** Exposed for tests/diagnostics. */
  get circuitBreaker(): CircuitBreaker {
    return this.breaker;
  }

  get usageMeter(): UsageMeter {
    return this.meter;
  }

  availableModels(dataClass: DataClass = 'internal') {
    return MODEL_CATALOG.filter(
      (m) => m.enabled && m.allowedDataClasses.includes(dataClass)
    );
  }

  breakerStates() {
    return this.breaker.all();
  }

  meterSummary() {
    return this.meter.summary();
  }
}
