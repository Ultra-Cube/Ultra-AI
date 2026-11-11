import { DataEncryption, SecureChunker } from './data-encryption';

describe('DataEncryption', () => {
  let encryption: DataEncryption;

  beforeEach(() => {
    encryption = new DataEncryption();
  });

  it('generates encryption keys', () => {
    const key = encryption.generateKey();

    expect(key.keyId).toBeTruthy();
    expect(key.key).toBeTruthy();
    expect(key.key.length).toBe(32); // 256-bit key
    expect(key.active).toBe(true);
  });

  it('encrypts and decrypts data correctly', () => {
    const originalData = 'Sensitive information that needs encryption';
    const chunkId = 'chunk-1';
    const taskId = 'task-1';
    const sequence = 0;

    // Encrypt
    const encrypted = encryption.encryptChunk(
      chunkId,
      taskId,
      sequence,
      originalData
    );

    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(encrypted.encryptedData).toBeTruthy();
    expect(encrypted.encryptedData).not.toContain(originalData);

    // Decrypt
    const decrypted = encryption.decryptChunk(encrypted);

    expect(decrypted.decryptedData).toBe(originalData);
    expect(decrypted.integrityVerified).toBe(true);
  });

  it('detects tampering with encrypted data', () => {
    const originalData = 'Important data';
    const encrypted = encryption.encryptChunk(
      'chunk-1',
      'task-1',
      0,
      originalData
    );

    // Tamper with encrypted data
    const tampered = { ...encrypted };
    const encryptedBuffer = Buffer.from(encrypted.encryptedData, 'base64');
    encryptedBuffer[0] = encryptedBuffer[0] ^ 1; // Flip a bit
    tampered.encryptedData = encryptedBuffer.toString('base64');

    // Decryption should fail
    expect(() => encryption.decryptChunk(tampered)).toThrow(
      'Decryption failed'
    );
  });

  it('encrypts multiple chunks', () => {
    const chunks = [
      { chunkId: 'chunk-1', taskId: 'task-1', sequence: 0, data: 'Part 1' },
      { chunkId: 'chunk-2', taskId: 'task-1', sequence: 1, data: 'Part 2' },
      { chunkId: 'chunk-3', taskId: 'task-1', sequence: 2, data: 'Part 3' },
    ];

    const encrypted = encryption.encryptChunks(chunks);

    expect(encrypted.length).toBe(3);
    expect(encrypted.every((chunk) => chunk.encryptedData)).toBe(true);
  });

  it('decrypts multiple chunks', () => {
    const chunks = [
      { chunkId: 'chunk-1', taskId: 'task-1', sequence: 0, data: 'Part 1' },
      { chunkId: 'chunk-2', taskId: 'task-1', sequence: 1, data: 'Part 2' },
    ];

    const encrypted = encryption.encryptChunks(chunks);
    const decrypted = encryption.decryptChunks(encrypted);

    expect(decrypted.length).toBe(2);
    expect(decrypted[0].decryptedData).toBe('Part 1');
    expect(decrypted[1].decryptedData).toBe('Part 2');
  });

  it('rotates encryption keys', () => {
    const oldKeyId = encryption.getCurrentKeyId();
    const newKey = encryption.rotateKey();

    expect(newKey.keyId).not.toBe(oldKeyId);
    expect(encryption.getCurrentKeyId()).toBe(newKey.keyId);

    const keys = encryption.getKeys();
    const oldKey = keys.find((k) => k.keyId === oldKeyId);
    expect(oldKey?.active).toBe(false);
    expect(oldKey?.rotatedAt).toBeTruthy();
  });

  it('hashes data correctly', () => {
    const data = 'Test data';
    const hash1 = encryption.hashData(data);
    const hash2 = encryption.hashData(data);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('verifies data integrity', () => {
    const data = 'Integrity check';
    const hash = encryption.hashData(data);

    expect(encryption.verifyIntegrity(data, hash)).toBe(true);
    expect(encryption.verifyIntegrity(data + 'tampered', hash)).toBe(false);
  });

  it('uses different IVs for same data', () => {
    const data = 'Same data';
    const encrypted1 = encryption.encryptChunk('chunk-1', 'task-1', 0, data);
    const encrypted2 = encryption.encryptChunk('chunk-2', 'task-1', 1, data);

    // IVs should be different (random)
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    // But decryption should work for both
    expect(encryption.decryptChunk(encrypted1).decryptedData).toBe(data);
    expect(encryption.decryptChunk(encrypted2).decryptedData).toBe(data);
  });

  it('handles key rotation for decryption', () => {
    const data = 'Old key data';
    const encrypted = encryption.encryptChunk('chunk-1', 'task-1', 0, data);
    const _oldKeyId = encrypted.keyId;

    // Rotate key
    encryption.rotateKey();

    // Should still decrypt with old key
    const decrypted = encryption.decryptChunk(encrypted);
    expect(decrypted.decryptedData).toBe(data);
  });
});

describe('SecureChunker', () => {
  let chunker: SecureChunker;

  beforeEach(() => {
    chunker = new SecureChunker();
  });

  it('splits and encrypts data', () => {
    const taskId = 'task-1';
    const data = 'a'.repeat(3000);

    const encrypted = chunker.splitAndEncrypt(taskId, data, 1024);

    expect(encrypted.length).toBeGreaterThan(1);
    expect(encrypted.every((chunk) => chunk.encryptedData)).toBe(true);
    expect(encrypted.every((chunk) => chunk.taskId === taskId)).toBe(true);
  });

  it('decrypts and reassembles data correctly', () => {
    const taskId = 'task-1';
    const originalData = 'Confidential data that needs secure distribution';

    // Split and encrypt
    const encrypted = chunker.splitAndEncrypt(taskId, originalData, 50);

    // Decrypt and reassemble
    const decrypted = chunker.decryptAndReassemble(encrypted);

    expect(decrypted).toBe(originalData);
  });

  it('detects tampering in reassembly', () => {
    const taskId = 'task-1';
    const data = 'Secure data';

    const encrypted = chunker.splitAndEncrypt(taskId, data, 10);

    // Tamper with one chunk
    const tampered = [...encrypted];
    const firstChunk = tampered[0];
    const encryptedBuffer = Buffer.from(firstChunk.encryptedData, 'base64');
    encryptedBuffer[0] = encryptedBuffer[0] ^ 1;
    tampered[0] = {
      ...firstChunk,
      encryptedData: encryptedBuffer.toString('base64'),
    };

    // Reassembly should fail
    expect(() => chunker.decryptAndReassemble(tampered)).toThrow();
  });

  it('preserves data order during reassembly', () => {
    const taskId = 'task-1';
    const data = '123456789';

    let encrypted = chunker.splitAndEncrypt(taskId, data, 3);

    // Shuffle chunks (out of order)
    encrypted = encrypted.reverse();

    // Should still reassemble correctly (because we sort by sequence)
    const decrypted = chunker.decryptAndReassemble(encrypted);
    expect(decrypted).toBe(data);
  });

  it('handles large files', () => {
    const taskId = 'task-1';
    const largeData = 'X'.repeat(1000000); // 1MB

    const encrypted = chunker.splitAndEncrypt(taskId, largeData, 10000);
    const decrypted = chunker.decryptAndReassemble(encrypted);

    expect(decrypted).toBe(largeData);
  });
});
