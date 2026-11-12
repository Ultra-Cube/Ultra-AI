/**
 * Ultra Core bridge types — spec §14 (technical-spec.md).
 *
 * The platform emits signed, hash-chained `ultra.event.v1` events into an
 * append-only outbox. An exporter may deliver them later via `ExportTarget`.
 * Ultra Core is a separate project; its interface is NOT yet known (gate G-4.1).
 * Until the owner supplies it, only the mock target + contract tests exist.
 *
 * Explicitly out of scope: tokens, wallets, mining/rewards, smart contracts,
 * chain nodes, private-key custody. Signing keys here sign *events* only.
 */

export const ULTRA_EVENT_SCHEMA = 'ultra.event.v1' as const;
export const ULTRA_EVENT_SCHEMA_VERSION = 1 as const;
export const GENESIS_HASH = `sha256:${'0'.repeat(64)}`;

/** Event types the platform may emit (spec §14 examples + reserved prefixes). */
export type UltraEventType =
  | 'usage.model_call'
  | 'usage.token_count'
  | 'usage.cost_estimate'
  | 'contribution.task_completed'
  | 'contribution.skill_invoked'
  | 'provenance.memory_write'
  | `usage.${string}`
  | `contribution.${string}`
  | `provenance.${string}`;

export interface UltraEventSubject {
  /** Platform instance / deployment identifier. */
  instance: string;
  /** Agent or user that produced the event (opaque id). */
  agent?: string;
  /** Session id when the event originates from a runtime session. */
  session?: string;
  [key: string]: unknown;
}

export interface UltraEventSignature {
  alg: 'Ed25519';
  /** Key identifier — public key reference, never private material. */
  key_id: string;
  /** Base64-encoded Ed25519 signature over the canonical signing payload. */
  value: string;
}

export interface UltraEvent {
  schema: typeof ULTRA_EVENT_SCHEMA;
  /** ULID — sortable, unique event id. */
  id: string;
  /** ISO-8601 timestamp. */
  ts: string;
  type: UltraEventType;
  subject: UltraEventSubject;
  payload: Record<string, unknown>;
  /** Hash of the previous event in the chain (`sha256:<hex>`); genesis for the first. */
  prev_hash: string;
  sig: UltraEventSignature;
}

export interface ExportBatch {
  batch_id: string;
  target: string;
  events: UltraEvent[];
}

export interface ExportRejection {
  id: string;
  reason: string;
}

export interface ExportResult {
  /** Event ids the target accepted (may be a subset of sent ids). */
  accepted: string[];
  rejected?: ExportRejection[];
}

/**
 * The port Ultra Core must implement once its interface is supplied (G-4.1).
 * Implementations MUST be idempotent: re-sending the same event id must not
 * create duplicates. The platform relies on `accepted` to advance cursors.
 */
export interface ExportTarget {
  readonly id: string;
  send(batch: ExportBatch): Promise<ExportResult>;
}

export interface OutboxRecord {
  event: UltraEvent;
  /** Hash of this event's canonical form — used as next event's prev_hash. */
  hash: string;
  /** True once every registered target has accepted this event. */
  exported: boolean;
}

export interface ChainVerification {
  ok: boolean;
  /** Index of the first broken link, if any. */
  brokenAt?: number;
  reason?: string;
}
