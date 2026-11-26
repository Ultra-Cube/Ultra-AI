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

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

import type {
  RegisteredSkill,
  SkillFrontmatter,
  SkillPackManifest,
  SkillSource,
} from './types';

export interface RegistryOptions {
  roots: string[];
  scopes?: string[];
  verifySignature?: (
    skill: RegisteredSkill,
    manifest?: SkillPackManifest
  ) => boolean;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const LEADING_COMMENT_RE = /^(?:<!--[\s\S]*?-->\s*)+/;

export function parseSkillMarkdown(
  raw: string
): { frontmatter: SkillFrontmatter; body: string } | null {
  const stripped = raw.replace(LEADING_COMMENT_RE, '');
  const m = stripped.match(FRONTMATTER_RE);
  if (!m) return null;
  const fm: Record<string, unknown> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v: unknown = kv[2].trim();
    if (typeof v === 'string' && v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["\x27]|["\x27]$/g, ''))
        .filter(Boolean);
    } else if (v === '') v = undefined;
    fm[kv[1]] = v;
  }
  if (typeof fm.name !== 'string' || typeof fm.description !== 'string')
    return null;
  return {
    frontmatter: fm as unknown as SkillFrontmatter,
    body: stripped.slice(m[0].length),
  };
}

export function skillPayload(s: RegisteredSkill): string {
  return `${s.id}\n${s.path}\n${s.version ?? '0.0.0'}`;
}

export function computeSkillHash(skill: RegisteredSkill): string {
  return createHash('sha256').update(skillPayload(skill)).digest('hex');
}

export class SkillRegistry {
  private readonly skills = new Map<string, RegisteredSkill>();
  private readonly byName = new Map<string, RegisteredSkill>();
  private readonly sources = new Map<string, SkillSource>();
  private readonly opts: RegistryOptions;

  constructor(opts: RegistryOptions) {
    this.opts = opts;
  }

  scan(): RegisteredSkill[] {
    const found: RegisteredSkill[] = [];
    for (const root of this.opts.roots) {
      if (!existsSync(root)) continue;
      this.walk(root, found);
    }
    for (const s of found) this.add(s, 'scan');
    return found;
  }

  private walk(dir: string, out: RegisteredSkill[]) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith('.') || e === 'node_modules') continue;
      const p = join(dir, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (existsSync(join(p, 'SKILL.md'))) {
          const skill = this.loadSkillFile(p);
          if (skill) out.push(skill);
        } else this.walk(p, out);
      }
    }
  }

  private loadSkillFile(dir: string): RegisteredSkill | null {
    const file = join(dir, 'SKILL.md');
    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      return null;
    }
    const parsed = parseSkillMarkdown(raw);
    if (!parsed) return null;
    const fm = parsed.frontmatter;
    const id = `${basename(dir)}@${fm.version ?? '0.0.0'}`;
    return {
      ...fm,
      id,
      path: file,
      scopes: this.opts.scopes ?? [],
      registeredAt: new Date().toISOString(),
      packDir: dir,
    };
  }

  register(skill: RegisteredSkill, source: SkillSource = 'register'): void {
    this.add(skill, source);
  }

  private add(skill: RegisteredSkill, source: SkillSource) {
    const existing = this.byName.get(skill.name);
    if (
      existing &&
      this.cmpVer(this.versionOf(existing), this.versionOf(skill)) >= 0
    )
      return;
    if (existing) this.skills.delete(existing.id);
    this.skills.set(skill.id, skill);
    this.byName.set(skill.name, skill);
    this.sources.set(skill.id, source);
  }

  private versionOf(s: RegisteredSkill): number[] {
    return (s.version ?? '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  }

  private cmpVer(a: number[], b: number[]): number {
    for (let i = 0; i < 3; i++) {
      const d = (a[i] ?? 0) - (b[i] ?? 0);
      if (d) return d;
    }
    return 0;
  }

  get(id: string): RegisteredSkill | undefined {
    return this.skills.get(id);
  }
  getByName(name: string): RegisteredSkill | undefined {
    return this.byName.get(name);
  }
  list(filter?: {
    scope?: string;
    platform?: string;
    query?: string;
  }): RegisteredSkill[] {
    let out = [...this.skills.values()];
    if (filter?.scope)
      out = out.filter((s) => s.scopes.includes(filter.scope!));
    if (filter?.platform)
      out = out.filter(
        (s) => !s.platforms || s.platforms.includes(filter.platform!)
      );
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return out.sort((a, b) =>
      this.cmpVer(this.versionOf(b), this.versionOf(a))
    );
  }
  sourceOf(id: string): SkillSource | undefined {
    return this.sources.get(id);
  }
  size(): number {
    return this.skills.size;
  }

  sign(
    id: string,
    keyId: string,
    signFn: (payload: string) => string
  ): boolean {
    const s = this.skills.get(id);
    if (!s) return false;
    s.signature = signFn(skillPayload(s));
    s.signatureKeyId = keyId;
    return true;
  }

  verify(
    id: string,
    verifyFn: (payload: string, sig: string, keyId?: string) => boolean
  ): boolean {
    const s = this.skills.get(id);
    if (!s?.signature) return false;
    return verifyFn(skillPayload(s), s.signature, s.signatureKeyId);
  }

  exportPack(
    packName: string,
    packVersion: string,
    signFn?: (payload: string) => string,
    keyId?: string
  ): SkillPackManifest {
    const manifest: SkillPackManifest = {
      pack: packName,
      version: packVersion,
      skills: this.list()
        .map((s) => s.name)
        .sort(),
    };
    if (signFn && keyId) {
      manifest.signature = signFn(JSON.stringify(manifest));
      manifest.signatureKeyId = keyId;
    }
    return manifest;
  }
}
