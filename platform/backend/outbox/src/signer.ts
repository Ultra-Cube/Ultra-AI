/**
 * Ed25519 signer backed by node:crypto. The signing key is the *instance*
 * key (to be sourced from the OS keychain in production); the platform never
 * holds user private keys.
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  KeyObject,
  sign,
  verify,
} from 'node:crypto';

import type { Signer } from './types';

export class Ed25519Signer implements Signer {
  constructor(
    private readonly privateKey: KeyObject,
    public readonly keyId: string
  ) {}

  sign(data: string): string {
    return sign(null, Buffer.from(data, 'utf8'), this.privateKey).toString(
      'base64url'
    );
  }

  verify(data: string, signature: string): boolean {
    try {
      return verify(
        null,
        Buffer.from(data, 'utf8'),
        this.publicKey(),
        Buffer.from(signature, 'base64url')
      );
    } catch {
      return false;
    }
  }

  publicKey(): KeyObject {
    return createPublicKey(this.privateKey);
  }

  /** Export the public key as PEM (safe to distribute to verifiers). */
  publicKeyPem(): string {
    return this.publicKey().export({ type: 'spki', format: 'pem' }) as string;
  }

  static generate(keyId: string): Ed25519Signer {
    const { privateKey } = generateKeyPairSync('ed25519');
    return new Ed25519Signer(privateKey, keyId);
  }

  /** Load a PKCS8 PEM private key (e.g. from OS keychain storage). */
  static fromPem(pem: string, keyId: string): Ed25519Signer {
    return new Ed25519Signer(createPrivateKey(pem), keyId);
  }
}
