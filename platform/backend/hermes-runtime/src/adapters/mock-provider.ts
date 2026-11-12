/**
 * Built-in Mock provider adapter.
 *
 * Deterministic, zero-dependency provider for tests and offline dev.
 * Simulates: echo generation, scripted tool-call responses, latency,
 * and failure injection (429 / 5xx / timeout) for resilience tests.
 */

import type { HermesMessage } from '../types';

import type {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
} from './contracts';

export interface MockProviderOptions {
  /** Simulated latency in ms (default 0). */
  latencyMs?: number;
  /** Fail the next N generate() calls with the given status. */
  failWith?: { status: number; times: number };
  /** Scripted responses consumed in order; falls back to echo. */
  script?: string[];
  /** Provider id label (default 'mock'). */
  id?: string;
}

export class MockProvider implements ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities = {
    streaming: false,
    toolCalling: true,
    embeddings: true,
  };

  private latencyMs: number;
  private failStatus: number | null = null;
  private failRemaining = 0;
  private script: string[];
  private callCount = 0;

  constructor(opts: MockProviderOptions = {}) {
    this.id = opts.id ?? 'mock';
    this.latencyMs = opts.latencyMs ?? 0;
    this.script = [...(opts.script ?? [])];
    if (opts.failWith) {
      this.failStatus = opts.failWith.status;
      this.failRemaining = opts.failWith.times;
    }
  }

  get calls(): number {
    return this.callCount;
  }

  async generate(
    req: ProviderGenerateRequest
  ): Promise<ProviderGenerateResponse> {
    this.callCount++;
    const start = Date.now();

    if (this.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.latencyMs));
    }
    if (req.signal?.aborted) throw new Error('aborted');

    if (this.failStatus !== null && this.failRemaining > 0) {
      this.failRemaining--;
      throw new ProviderHttpError(
        this.failStatus,
        `${this.id} simulated HTTP ${this.failStatus}`
      );
    }

    const lastUser = [...req.messages]
      .reverse()
      .find((m: HermesMessage) => m.role === 'user');
    const content =
      this.script.length > 0
        ? this.script.shift()!
        : `mock(${this.id}): ${lastUser?.content ?? ''}`;

    return {
      content,
      model: req.model,
      provider: this.id,
      usage: {
        promptTokens: Math.ceil(JSON.stringify(req.messages).length / 4),
        completionTokens: Math.ceil(content.length / 4),
      },
      latencyMs: Date.now() - start,
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Deterministic pseudo-embeddings: bag-of-chars hashed to 32 dims.
    return texts.map((t) => {
      const v = new Array(32).fill(0);
      for (const ch of t) v[ch.charCodeAt(0) % 32] += 1;
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
      return v.map((x) => x / norm);
    });
  }
}

export class ProviderHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ProviderHttpError';
  }
}
