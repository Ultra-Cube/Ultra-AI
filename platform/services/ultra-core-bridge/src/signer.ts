import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  KeyObject,
} from 'node:crypto';

import { UltraEvent, UltraEventType } from './types';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Generate a ULID (48-bit ms timestamp + 80-bit randomness, Crockford base32). */
export function ulid(now: number = Date.now()): string {
  let time = now;
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[time % 32] + out;
    time = Math.floor(time / 32);
  }
  const rand = createHash('sha256').update(`${now}:${Math.random()}`).digest();
  for (let i = 0; i < 16; i++) out += CROCKFORD[rand[i] % 32];
  return out;
}

/** Deterministic JSON serialization — sorted object keys, no whitespace. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

export function eventHash(event: UltraEvent): string {
  return `sha256:${sha256Hex(canonicalize(event))}`;
}

/** Fields covered by the Ed25519 signature (everything except `sig`). */
export function signingPayload(event: Omit<UltraEvent, 'sig'>): string {
  return canonicalize({
    schema: event.schema,
    id: event.id,
    ts: event.ts,
    type: event.type,
    subject: event.subject,
    payload: event.payload,
    prev_hash: event.prev_hash,
  });
}

export interface EventSigner {
  readonly keyId: string;
  readonly publicKeyPem: string;
  sign(event: Omit<UltraEvent, 'sig'>): UltraEvent['sig'];
  verify(event: UltraEvent): boolean;
}

export interface SignerOptions {
  /** PEM private key (PKCS8). If omitted, an ephemeral Ed25519 keypair is generated. */
  privateKeyPem?: string;
  /** Public key id recorded in `sig.key_id` (e.g. fingerprint or key-store ref). */
  keyId?: string;
}

export function createEventSigner(options: SignerOptions = {}): EventSigner {
  const privateKey: KeyObject = options.privateKeyPem
    ? createPrivateKey(options.privateKeyPem)
    : generateKeyPairSync('ed25519').privateKey;
  const publicKey = createPublicKey(privateKey);
  const keyId =
    options.keyId ??
    publicKey
      .export({ format: 'der', type: 'spki' })
      .toString('base64')
      .slice(0, 16);
  const publicKeyPem = publicKey
    .export({ format: 'pem', type: 'spki' })
    .toString();

  return {
    keyId,
    publicKeyPem,
    sign(event) {
      const signature = sign(
        null,
        Buffer.from(signingPayload(event), 'utf8'),
        privateKey
      );
      return {
        alg: 'Ed25519',
        key_id: keyId,
        value: signature.toString('base64'),
      };
    },
    verify(ev) {
      try {
        const { sig, ...rest } = ev;
        if (sig.alg !== 'Ed25519' || sig.key_id !== keyId) return false;
        return verify(
          null,
          Buffer.from(signingPayload(rest as Omit<UltraEvent, 'sig'>), 'utf8'),
          publicKey,
          Buffer.from(sig.value, 'base64')
        );
      } catch {
        return false;
      }
    },
  };
}

export const VALID_EVENT_TYPE =
  /^(usage|contribution|provenance)\.[a-z0-9_.-]+$/;

export function isValidEventType(type: string): type is UltraEventType {
  return VALID_EVENT_TYPE.test(type);
}
