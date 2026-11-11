/**
 * End-to-End Data Encryption and Secure Chunking
 * Implements AES-256-GCM encryption for distributed processing
 * Prevents any single node from accessing complete unencrypted data
 */

import crypto from 'node:crypto';

export interface EncryptedChunk {
  chunkId: string;
  taskId: string;
  sequence: number;
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  encryptedData: string; // Base64 encoded encrypted data
  keyId: string; // Key identifier for rotation
}

export interface EncryptionKey {
  keyId: string;
  key: Buffer;
  createdAt: Date;
  rotatedAt?: Date;
  active: boolean;
}

export interface DecryptionResult {
  chunkId: string;
  taskId: string;
  sequence: number;
  decryptedData: string;
  integrityVerified: boolean;
}

export class DataEncryption {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string;
  private algorithm = 'aes-256-gcm';

  constructor() {
    // Initialize with a default key
    const defaultKey = this.generateKey();
    this.currentKeyId = defaultKey.keyId;
  }

  /**
   * Generate a new encryption key
   */
  generateKey(): EncryptionKey {
    const key = crypto.randomBytes(32); // 256-bit key
    const keyId = crypto.randomUUID();

    const encryptionKey: EncryptionKey = {
      keyId,
      key,
      createdAt: new Date(),
      active: true,
    };

    this.keys.set(keyId, encryptionKey);
    return encryptionKey;
  }

  /**
   * Encrypt a data chunk
   */
  encryptChunk(
    chunkId: string,
    taskId: string,
    sequence: number,
    data: string
  ): EncryptedChunk {
    const key = this.keys.get(this.currentKeyId);
    if (!key) {
      throw new Error(`Key not found: ${this.currentKeyId}`);
    }

    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key.key, iv) as any;

    // Encrypt data
    let encryptedData = cipher.update(data, 'utf8') as any;
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag() as Buffer;

    return {
      chunkId,
      taskId,
      sequence,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedData: encryptedData.toString('base64'),
      keyId: this.currentKeyId,
    };
  }

  /**
   * Decrypt a data chunk
   */
  decryptChunk(encrypted: EncryptedChunk): DecryptionResult {
    const key = this.keys.get(encrypted.keyId);
    if (!key) {
      throw new Error(`Key not found: ${encrypted.keyId}`);
    }

    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    const encryptedData = Buffer.from(encrypted.encryptedData, 'base64');

    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key.key,
        iv
      ) as any;
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decryptedData = decipher.update(encryptedData) as any;
      decryptedData = Buffer.concat([decryptedData, decipher.final()]);

      return {
        chunkId: encrypted.chunkId,
        taskId: encrypted.taskId,
        sequence: encrypted.sequence,
        decryptedData: decryptedData.toString('utf8'),
        integrityVerified: true,
      };
    } catch (error) {
      // Authentication failed - data integrity compromised
      throw new Error('Decryption failed: Data integrity check failed');
    }
  }

  /**
   * Encrypt multiple chunks
   */
  encryptChunks(
    chunks: Array<{
      chunkId: string;
      taskId: string;
      sequence: number;
      data: string;
    }>
  ): EncryptedChunk[] {
    return chunks.map((chunk) =>
      this.encryptChunk(chunk.chunkId, chunk.taskId, chunk.sequence, chunk.data)
    );
  }

  /**
   * Decrypt multiple chunks
   */
  decryptChunks(encrypted: EncryptedChunk[]): DecryptionResult[] {
    return encrypted.map((chunk) => this.decryptChunk(chunk));
  }

  /**
   * Rotate encryption key
   */
  rotateKey(): EncryptionKey {
    const oldKeyId = this.currentKeyId;
    const oldKey = this.keys.get(oldKeyId);
    if (oldKey) {
      oldKey.active = false;
      oldKey.rotatedAt = new Date();
    }

    const newKey = this.generateKey();
    this.currentKeyId = newKey.keyId;

    return newKey;
  }

  /**
   * Get list of all keys
   */
  getKeys(): EncryptionKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Get current active key
   */
  getCurrentKeyId(): string {
    return this.currentKeyId;
  }

  /**
   * Hash data for integrity verification
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyIntegrity(data: string, hash: string): boolean {
    return this.hashData(data) === hash;
  }
}

/**
 * Secure Chunking with built-in encryption
 */
export class SecureChunker {
  private encryption: DataEncryption;

  constructor(encryption?: DataEncryption) {
    this.encryption = encryption || new DataEncryption();
  }

  /**
   * Split and encrypt data ensuring no single chunk contains readable data
   */
  splitAndEncrypt(
    taskId: string,
    data: string,
    chunkSize: number = 1024
  ): EncryptedChunk[] {
    const chunks: Array<{
      chunkId: string;
      taskId: string;
      sequence: number;
      data: string;
    }> = [];

    // First, compress/process data
    const processedData = Buffer.from(data, 'utf8').toString('base64');

    // Split into chunks
    for (let i = 0; i < processedData.length; i += chunkSize) {
      chunks.push({
        chunkId: crypto.randomUUID(),
        taskId,
        sequence: chunks.length,
        data: processedData.slice(i, i + chunkSize),
      });
    }

    // Encrypt all chunks
    return this.encryption.encryptChunks(chunks);
  }

  /**
   * Decrypt and reassemble data
   */
  decryptAndReassemble(encrypted: EncryptedChunk[]): string {
    // Sort by sequence
    const sorted = [...encrypted].sort((a, b) => a.sequence - b.sequence);

    // Decrypt all chunks
    const decrypted = sorted.map((chunk) =>
      this.encryption.decryptChunk(chunk)
    );

    // Verify all chunks have integrity
    const allVerified = decrypted.every((chunk) => chunk.integrityVerified);
    if (!allVerified) {
      throw new Error('One or more chunks failed integrity verification');
    }

    // Reassemble
    const reassembled = decrypted.map((chunk) => chunk.decryptedData).join('');

    // Decode from base64
    return Buffer.from(reassembled, 'base64').toString('utf8');
  }
}
