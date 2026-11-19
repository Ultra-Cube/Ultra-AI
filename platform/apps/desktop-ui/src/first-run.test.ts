// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { FirstRunWizard } from './first-run';

function tmpPath(): string {
  return join(mkdtempSync(join(tmpdir(), 'ultra-first-run-')), 'state.json');
}

describe('FirstRunWizard', () => {
  it('starts at welcome and reports first run needed', () => {
    const w = new FirstRunWizard(tmpPath());
    expect(w.getStep()).toBe('welcome');
    expect(w.needsFirstRun()).toBe(true);
  });

  it('walks the step order forward and clamps at done', () => {
    const w = new FirstRunWizard(tmpPath());
    expect(w.next()).toBe('hardware');
    expect(w.next()).toBe('models');
    expect(w.next()).toBe('engines');
    expect(w.next()).toBe('privacy');
    expect(w.next()).toBe('done');
    expect(w.next()).toBe('done');
  });

  it('walks backward without going before welcome', () => {
    const w = new FirstRunWizard(tmpPath());
    w.next();
    w.next();
    expect(w.back()).toBe('hardware');
    expect(w.back()).toBe('welcome');
    expect(w.back()).toBe('welcome');
  });

  it('persists state across instances', () => {
    const path = tmpPath();
    const w1 = new FirstRunWizard(path);
    w1.goTo('models');
    w1.toggleModel('llama3.2:3b');
    const w2 = new FirstRunWizard(path);
    expect(w2.getStep()).toBe('models');
    expect(w2.getState().selectedModels).toEqual(['llama3.2:3b']);
  });

  it('probes hardware and stores the result', () => {
    const w = new FirstRunWizard(tmpPath());
    const probe = w.probeHardware();
    expect(probe.platform).toBe(process.platform);
    expect(probe.cpuCount).toBeGreaterThan(0);
    expect(probe.probedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(w.getState().hardware).toEqual(probe);
  });

  it('suggests lightweight models on low-memory hosts and more on >=16GB', () => {
    const w = new FirstRunWizard(tmpPath());
    const low = w.suggestModels({
      platform: 'linux',
      arch: 'x64',
      totalMemGB: 8,
      cpuCount: 4,
      gpuDetected: false,
      probedAt: new Date().toISOString(),
    });
    expect(low.map((m) => m.id)).toEqual(['llama3.2:3b', 'nomic-embed-text']);

    const high = w.suggestModels({
      platform: 'linux',
      arch: 'x64',
      totalMemGB: 32,
      cpuCount: 16,
      gpuDetected: true,
      probedAt: new Date().toISOString(),
    });
    expect(high.map((m) => m.id)).toContain('deepseek-coder-v2:16b');
  });

  it('blocks completion when a licence-bearing engine is opted in without acknowledgement', () => {
    const w = new FirstRunWizard(tmpPath());
    w.toggleEngine('n8n');
    const res = w.complete();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/licence/);
    expect(w.needsFirstRun()).toBe(true);
  });

  it('completes once licence is acknowledged and never needs first run again', () => {
    const path = tmpPath();
    const w = new FirstRunWizard(path);
    w.toggleEngine('n8n');
    w.acknowledgeLicence();
    expect(w.complete()).toEqual({ ok: true });
    expect(w.needsFirstRun()).toBe(false);

    // Fresh instance reading the same state file must skip the wizard.
    const w2 = new FirstRunWizard(path);
    expect(w2.needsFirstRun()).toBe(false);
    expect(w2.getState().completedAt).toBeDefined();
  });

  it('completes without acknowledgement when only licence-free engines are selected', () => {
    const w = new FirstRunWizard(tmpPath());
    w.toggleEngine('ollama');
    w.toggleEngine('langflow');
    expect(w.complete()).toEqual({ ok: true });
  });

  it('reset() returns to a fresh incomplete state', () => {
    const w = new FirstRunWizard(tmpPath());
    w.toggleEngine('ollama');
    w.complete();
    w.reset();
    expect(w.needsFirstRun()).toBe(true);
    expect(w.getStep()).toBe('welcome');
  });

  it('recovers from a corrupt state file instead of crashing', () => {
    const path = tmpPath();
    writeFileSync(path, '{not json', 'utf8');
    const w = new FirstRunWizard(path);
    expect(w.getStep()).toBe('welcome');
    expect(w.needsFirstRun()).toBe(true);
  });

  it('merges persisted state over defaults for partial files', () => {
    const path = tmpPath();
    writeFileSync(
      path,
      JSON.stringify({ completed: true, step: 'done' }),
      'utf8'
    );
    const w = new FirstRunWizard(path);
    expect(w.needsFirstRun()).toBe(false);
    expect(w.getState().selectedModels).toEqual([]);
  });

  it('toggles engines and models idempotently', () => {
    const w = new FirstRunWizard(tmpPath());
    w.toggleEngine('ollama');
    w.toggleEngine('ollama');
    expect(w.getState().optedInEngines).toEqual([]);
    w.toggleModel('nomic-embed-text');
    w.toggleModel('nomic-embed-text');
    expect(w.getState().selectedModels).toEqual([]);
  });

  it('writes valid JSON state to disk', () => {
    const path = tmpPath();
    const w = new FirstRunWizard(path);
    w.goTo('engines');
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    expect(parsed.step).toBe('engines');
    expect(parsed.completed).toBe(false);
  });
});
