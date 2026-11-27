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

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  defaultBrainConfig,
  loadHermesConfig,
  mergeHermesConfig,
  saveHermesConfig,
} from './config-merge';
import { BrainManager } from './process-manager';

describe('mergeHermesConfig', () => {
  const brain = defaultBrainConfig({
    platformGatewayUrl: 'http://127.0.0.1:9999/v1',
  });

  it('rewrites a custom provider to the platform gateway', () => {
    const merged = mergeHermesConfig(
      {
        provider: {
          provider: 'deepseek',
          model: 'deepseek-chat',
          apiKeyEnv: 'DEEPSEEK_KEY',
        },
      },
      brain
    );
    expect(merged.providerRewritten).toBe(true);
    const p = merged.provider as Record<string, unknown>;
    expect(p.provider).toBe('openai-compatible');
    expect(p.baseUrl).toBe('http://127.0.0.1:9999/v1');
    expect(p.originalProvider).toBe('deepseek');
    expect(p.model).toBe('deepseek-chat'); // preserved
  });

  it('keeps platform providers untouched', () => {
    const merged = mergeHermesConfig(
      { provider: { provider: 'ultra', baseUrl: 'http://127.0.0.1:20128/v1' } },
      brain
    );
    expect(merged.providerRewritten).toBe(false);
    expect((merged.provider as Record<string, unknown>).provider).toBe('ultra');
  });

  it('handles string provider shorthand', () => {
    const merged = mergeHermesConfig({ provider: 'anthropic' }, brain);
    expect(merged.providerRewritten).toBe(true);
    expect((merged.provider as Record<string, unknown>).originalProvider).toBe(
      'anthropic'
    );
  });

  it('always ensures a gateway block', () => {
    const merged = mergeHermesConfig({}, brain);
    expect(merged.gateway?.host).toBe('127.0.0.1');
    expect(merged.gateway?.port).toBe(8642);
  });
});

describe('config file round-trip', () => {
  it('loads, merges, saves and reloads', () => {
    const dir = mkdtempSync(join(tmpdir(), 'brain-'));
    const path = join(dir, 'config.yaml');
    writeFileSync(path, 'provider: deepseek\nmodel: deepseek-chat\n', {
      mode: 0o600,
    });

    const user = loadHermesConfig(path);
    expect(user.model).toBe('deepseek-chat');

    const brain = defaultBrainConfig({
      platformGatewayUrl: 'http://gw.local/v1',
    });
    const merged = mergeHermesConfig(user, brain);
    saveHermesConfig(path, merged);

    const reloaded = loadHermesConfig(path) as {
      provider: Record<string, unknown>;
    };
    expect(reloaded.provider.baseUrl).toBe('http://gw.local/v1');
    expect(reloaded.provider.originalProvider).toBe('deepseek');
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty config for missing file', () => {
    expect(loadHermesConfig('/nonexistent/path/config.yaml')).toEqual({});
  });
});

describe('BrainManager', () => {
  const brain = defaultBrainConfig();

  it('starts stopped and reports health', () => {
    const mgr = new BrainManager(brain);
    const h = mgr.health();
    expect(h.state).toBe('stopped');
    expect(h.checkedAt).toBeTruthy();
  });

  it('selects first available preferred mode', () => {
    const mgr = new BrainManager(brain);
    expect(mgr.selectMode()).toBe('gateway');
    const mgr2 = new BrainManager(
      defaultBrainConfig({ preferredModes: ['cli'] })
    );
    expect(mgr2.selectMode()).toBe('cli');
  });

  it('records failure for missing command', async () => {
    const mgr = new BrainManager(brain, {
      command: 'definitely-not-a-real-binary-xyz',
    });
    const h = mgr.start('cli');
    expect(['starting', 'running', 'failed', 'stopped']).toContain(h.state);
    await new Promise((r) => setTimeout(r, 150));
    const after = mgr.health();
    expect(after.lastError).toBeTruthy();
    mgr.stop();
  });
});
