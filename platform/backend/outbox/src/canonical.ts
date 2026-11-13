/**
 * Canonical JSON (JCS-compatible subset), event hashing, and monotonic ULIDs.
 */

import { createHash, randomBytes } from 'node:crypto';

import { GENESIS_HASH, Hash, UnsignedOutboxEvent } from './types';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Deterministic JSON serialization: recursive sorted object keys, no
 * whitespace. Throws on NaN/Infinity/undefined/bigint/functions/symbols —
 * anything that cannot round-trip through JSON must never be signed.
 */
export function canonicalJson(value: unknown): string {
  return writeValue(value);
}

function writeValue(v: unknown): string {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'boolean':
      return v ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(v)) {
        throw new TypeError('canonicalJson: non-finite number');
      }
      return JSON.stringify(v);
    case 'string':
      return JSON.stringify(v);
    case 'object': {
      if (Array.isArray(v)) {
        return `[${v.map(writeValue).join(',')}]`;
      }
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const parts: string[] = [];
      for (const k of keys) {
        const val = obj[k];
        if (val === undefined) {
          throw new TypeError(`canonicalJson: undefined value at key "${k}"`);
        }
        parts.push(`${JSON.stringify(k)}:${writeValue(val)}`);
      }
      return `{${parts.join(',')}}`;
    }
    default:
      throw new TypeError(`canonicalJson: unsupported type "${typeof v}"`);
  }
}

export function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/** sha256(canonicalJson(event without sig)) — the chain link value. */
export function eventHash(event: UnsignedOutboxEvent): Hash {
  const { sig: _sig, ...unsigned } = event as UnsignedOutboxEvent & {
    sig?: unknown;
  };
  return `sha256:${sha256Hex(canonicalJson(unsigned))}` as Hash;
}

export { GENESIS_HASH };

/** Encode a millisecond timestamp as the 10-char ULID time prefix. */
export function ulidTimePart(ms: number): string {
  let t = Math.max(0, Math.floor(ms));
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

/** 16-char Crockford base32 random part (80 bits). */
export function ulidRandomPart(): string {
  const bytes = randomBytes(10);
  let bits = 0n;
  for (const b of bytes) bits = (bits << 8n) | BigInt(b);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out = CROCKFORD[Number(bits & 31n)] + out;
    bits >>= 5n;
  }
  return out;
}

/** Increment a 16-char Crockford base32 string by one (mod 2^80). */
export function incrementUlidPart(part: string): string {
  let value = 0n;
  for (const ch of part) {
    const idx = CROCKFORD.indexOf(ch);
    if (idx < 0) throw new Error(`invalid Crockford char: ${ch}`);
    value = (value << 5n) | BigInt(idx);
  }
  value = (value + 1n) & ((1n << 80n) - 1n);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out = CROCKFORD[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
}

/**
 * Monotonic ULID generator: ids are strictly increasing even when many are
 * minted inside the same millisecond (random part is incremented instead).
 * Clock regression is tolerated by reusing the last time prefix.
 */
export class UlidGenerator {
  private lastTimePart: string | null = null;
  private lastRandomPart: string | null = null;

  constructor(private readonly clock: () => Date = () => new Date()) {}

  next(): string {
    const ms = this.clock().getTime();
    const tp = ulidTimePart(ms);
    let rp: string;
    if (tp === this.lastTimePart && this.lastRandomPart !== null) {
      rp = incrementUlidPart(this.lastRandomPart);
    } else {
      rp = ulidRandomPart();
    }
    this.lastTimePart = tp;
    this.lastRandomPart = rp;
    return tp + rp;
  }
}
