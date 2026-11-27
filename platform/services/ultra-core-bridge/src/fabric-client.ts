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

/**
 * Typed client for Ultra-Core's fabric-gateway service (platform/services/
 * fabric-gateway in the Ultra-Core repo). The gateway fronts the Fabric
 * `internal-assets` chaincode — INTERNAL, NON-TRANSFERABLE assets only
 * (credits, attestations, reservations). No tokens, no wallets, no
 * transferable value — G-4.2 frozen scope.
 *
 * Auth: every non-health route requires `Authorization: Bearer
 * FABRIC_ADMIN_TOKEN`. Read-only mode mirrors UltraCoreClient: when
 * ULTRA_CORE_READ_ONLY=true all writes are refused client-side.
 */

export interface FabricAssetsClientOptions {
  /** Base URL of fabric-gateway, e.g. http://127.0.0.1:8092 */
  baseUrl?: string;
  timeoutMs?: number;
  /** Bearer token — defaults to env FABRIC_ADMIN_TOKEN. */
  token?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /**
   * Read-only mode: when true, all writes (issue/spend/revoke) are refused
   * client-side. Defaults to env ULTRA_CORE_READ_ONLY === "true".
   */
  readOnly?: boolean;
}

export interface FabricAsset {
  id: string;
  kind: string;
  owner: string;
  issuer?: string;
  amount: number;
  unit?: string;
  reference?: string;
  status?: string;
  issuedAt?: number;
  updatedAt?: number;
  metaJson?: string;
}

export interface FabricAssetIssueInput {
  id: string;
  kind?: string;
  owner: string;
  unit?: string;
  amount: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface FabricAssetEvent {
  asset: FabricAsset;
  txId?: string;
  at?: number;
}

export class FabricGatewayApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `fabric-gateway error ${status}`);
    this.name = 'FabricGatewayApiError';
  }
}

export class FabricAssetsClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly token?: string;
  private readonly readOnly: boolean;

  constructor(options: FabricAssetsClientOptions = {}) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.FABRIC_GATEWAY_URL ??
      'http://127.0.0.1:8092'
    ).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.token = options.token ?? process.env.FABRIC_ADMIN_TOKEN;
    this.readOnly =
      options.readOnly ?? process.env.ULTRA_CORE_READ_ONLY === 'true';
  }

  private async request(path: string, init?: RequestInit): Promise<unknown> {
    const method = init?.method ?? 'GET';
    if (this.readOnly && method !== 'GET') {
      throw new FabricGatewayApiError(
        0,
        null,
        'fabric-gateway client is read-only (ULTRA_CORE_READ_ONLY); asset mutations refused'
      );
    }
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    if (init?.body) headers['content-type'] = 'application/json';

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* keep raw text */
    }
    if (!res.ok) {
      throw new FabricGatewayApiError(res.status, body);
    }
    return body;
  }

  async ping(): Promise<{ ok: boolean; fabric?: { ok: boolean } }> {
    const [health, ready] = await Promise.all([
      this.request('/healthz'),
      this.request('/readyz').catch(() => null),
    ]);
    return {
      ok: (health as { status?: string }).status === 'ok',
      fabric: (ready as { fabric?: { ok: boolean } } | null)?.fabric,
    };
  }

  async issue(input: FabricAssetIssueInput): Promise<FabricAsset> {
    return (await this.request('/v1/assets', {
      method: 'POST',
      body: JSON.stringify(input),
    })) as FabricAsset;
  }

  async getAsset(id: string): Promise<FabricAsset> {
    return (await this.request(
      `/v1/assets/${encodeURIComponent(id)}`
    )) as FabricAsset;
  }

  async balanceOf(id: string): Promise<number> {
    const body = (await this.request(
      `/v1/assets/${encodeURIComponent(id)}/balance`
    )) as { balance?: number };
    return body.balance ?? 0;
  }

  async spend(
    id: string,
    input: { amount: number; reference: string }
  ): Promise<FabricAsset> {
    return (await this.request(`/v1/assets/${encodeURIComponent(id)}/spend`, {
      method: 'POST',
      body: JSON.stringify(input),
    })) as FabricAsset;
  }

  async revoke(
    id: string,
    input: { reason?: string } = {}
  ): Promise<FabricAsset> {
    return (await this.request(`/v1/assets/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: JSON.stringify(input),
    })) as FabricAsset;
  }

  async history(id: string): Promise<FabricAssetEvent[]> {
    const body = (await this.request(
      `/v1/assets/${encodeURIComponent(id)}/history`
    )) as { history?: FabricAssetEvent[] };
    return body.history ?? [];
  }
}

export function createFabricAssetsClient(
  options?: FabricAssetsClientOptions
): FabricAssetsClient {
  return new FabricAssetsClient(options);
}
