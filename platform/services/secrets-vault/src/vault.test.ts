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

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  EnvProvider,
  FileProvider,
  SecretsVault,
  SecretNotFoundError,
} from './index';

describe('SecretsVault', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vault-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    delete process.env.ULTRA_TEST_SECRET;
  });

  it('get walks providers in order', async () => {
    process.env.ULTRA_TEST_SECRET = 'from-env';
    const vault = new SecretsVault({
      providers: [new FileProvider(join(dir, 's.env')), new EnvProvider()],
    });
    expect(await vault.get('ULTRA_TEST_SECRET')).toBe('from-env');
  });

  it('file provider wins when it has the key', async () => {
    const file = new FileProvider(join(dir, 's.env'));
    await file.set('K', 'from-file');
    const vault = new SecretsVault({ providers: [file, new EnvProvider()] });
    expect(await vault.get('K')).toBe('from-file');
  });

  it('throws SecretNotFoundError when absent everywhere', async () => {
    const vault = new SecretsVault({
      providers: [new FileProvider(join(dir, 'missing.env'))],
    });
    await expect(vault.get('NOPE')).rejects.toThrow(SecretNotFoundError);
    expect(await vault.getOrNull('NOPE')).toBeNull();
  });

  it('set writes to first writable provider', async () => {
    const file = new FileProvider(join(dir, 's.env'));
    const vault = new SecretsVault({ providers: [new EnvProvider(), file] });
    await vault.set('API_KEY', 'sk-test');
    expect(await file.get('API_KEY')).toBe('sk-test');
  });

  it('set fails when no writable provider', async () => {
    const vault = new SecretsVault({ providers: [new EnvProvider()] });
    await expect(vault.set('K', 'v')).rejects.toThrow(
      'no writable secret provider'
    );
  });

  it('delete removes from all providers', async () => {
    const file = new FileProvider(join(dir, 's.env'));
    await file.set('K', 'v');
    const vault = new SecretsVault({ providers: [file] });
    await vault.delete('K');
    expect(await file.get('K')).toBeNull();
  });

  it('listKeys unions providers sorted', async () => {
    const file = new FileProvider(join(dir, 's.env'));
    await file.set('B_KEY', '1');
    await file.set('A_KEY', '2');
    const vault = new SecretsVault({ providers: [file] });
    expect(await vault.listKeys()).toEqual(['A_KEY', 'B_KEY']);
  });

  it('envFor builds env map skipping missing', async () => {
    const vault = new SecretsVault({
      providers: [new FileProvider(join(dir, 'empty.env'))],
    });
    const env = await vault.envFor(['MISSING_A', 'MISSING_B']);
    expect(env).toEqual({});
  });

  it('file provider replaces existing key on set', async () => {
    const file = new FileProvider(join(dir, 's.env'));
    await file.set('K', 'old');
    await file.set('K', 'new');
    const raw = await readFile(join(dir, 's.env'), 'utf8');
    expect(raw.match(/K=/g)).toHaveLength(1);
    expect(await file.get('K')).toBe('new');
  });
});
