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

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  SkillRegistry,
  parseSkillMarkdown,
  computeSkillHash,
  skillPayload,
} from './registry';
import type { RegisteredSkill } from './types';

function makeSkill(name: string, version = '0.1.0'): RegisteredSkill {
  return {
    id: `${name}@${version}`,
    name,
    description: `${name} does things`,
    version,
    path: `/tmp/${name}/SKILL.md`,
    scopes: [],
    registeredAt: new Date().toISOString(),
  };
}

describe('parseSkillMarkdown', () => {
  it('parses frontmatter with scalar and list fields', () => {
    const raw = `---
name: eval-harness
description: Build eval harness
platforms: [hermes, claude-code]
version: 0.1.0
---

## When to use
Body text
`;
    const parsed = parseSkillMarkdown(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.frontmatter.name).toBe('eval-harness');
    expect(parsed!.frontmatter.platforms).toEqual(['hermes', 'claude-code']);
    expect(parsed!.frontmatter.version).toBe('0.1.0');
    expect(parsed!.body).toContain('## When to use');
  });

  it('returns null without frontmatter or required fields', () => {
    expect(parseSkillMarkdown('no frontmatter')).toBeNull();
    expect(parseSkillMarkdown('---\nname: x\n---\nbody')).toBeNull();
  });
});

describe('SkillRegistry', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'skills-'));
    mkdirSync(join(dir, 'alpha', 'skill-a'), { recursive: true });
    writeFileSync(
      join(dir, 'alpha', 'skill-a', 'SKILL.md'),
      `---
name: skill-a
description: Alpha skill
platforms: [hermes]
version: 0.1.0
---
body`
    );
    mkdirSync(join(dir, 'beta', 'skill-b'), { recursive: true });
    writeFileSync(
      join(dir, 'beta', 'skill-b', 'SKILL.md'),
      `---
name: skill-b
description: Beta skill
version: 0.2.0
---
body`
    );
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('scans roots recursively for SKILL.md packs', () => {
    const reg = new SkillRegistry({ roots: [dir] });
    const found = reg.scan();
    expect(found).toHaveLength(2);
    expect(reg.getByName('skill-a')?.platforms).toEqual(['hermes']);
    expect(reg.size()).toBe(2);
  });

  it('dedupes by name keeping the highest version', () => {
    const reg = new SkillRegistry({ roots: [] });
    reg.register(makeSkill('dup', '0.1.0'));
    reg.register(makeSkill('dup', '0.3.0'));
    reg.register(makeSkill('dup', '0.2.0'));
    expect(reg.size()).toBe(1);
    expect(reg.getByName('dup')?.version).toBe('0.3.0');
  });

  it('filters by scope, platform, and query', () => {
    const reg = new SkillRegistry({ roots: [dir], scopes: ['core'] });
    reg.scan();
    expect(reg.list({ scope: 'core' })).toHaveLength(2);
    expect(reg.list({ scope: 'other' })).toHaveLength(0);
    expect(reg.list({ platform: 'hermes' })).toHaveLength(2); // universal skill-b matches all
    expect(reg.list({ platform: 'windows' })).toHaveLength(1); // only universal skill-b
    expect(reg.list({ query: 'alpha' })).toHaveLength(1);
  });

  it('sorts by version descending', () => {
    const reg = new SkillRegistry({ roots: [dir] });
    reg.scan();
    const names = reg.list().map((s) => s.name);
    expect(names[0]).toBe('skill-b'); // 0.2.0 > 0.1.0
  });

  it('signs and verifies skills with injected crypto', () => {
    const reg = new SkillRegistry({ roots: [] });
    reg.register(makeSkill('signed'));
    const signFn = (p: string) => `sig:${p.length}`;
    const verifyFn = (p: string, sig: string) => sig === `sig:${p.length}`;
    expect(reg.sign('signed@0.1.0', 'key-1', signFn)).toBe(true);
    expect(reg.verify('signed@0.1.0', verifyFn)).toBe(true);
    expect(reg.verify('missing@1.0.0', verifyFn)).toBe(false);
  });

  it('exports a signed pack manifest', () => {
    const reg = new SkillRegistry({ roots: [dir] });
    reg.scan();
    const manifest = reg.exportPack(
      'ultra-core',
      '1.0.0',
      (p) => `h(${p})`,
      'k1'
    );
    expect(manifest.pack).toBe('ultra-core');
    expect(manifest.skills).toEqual(['skill-a', 'skill-b']);
    expect(manifest.signature).toContain('h(');
    expect(manifest.signatureKeyId).toBe('k1');
  });

  it('computes stable payload hash', () => {
    const s = makeSkill('h');
    expect(skillPayload(s)).toBe('h@0.1.0\n/tmp/h/SKILL.md\n0.1.0');
    expect(computeSkillHash(s)).toMatch(/^[a-f0-9]{64}$/);
  });
});
