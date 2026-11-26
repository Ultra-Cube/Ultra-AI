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

/**
 * Skill registry — loads and resolves agent skills.
 *
 * Skills live in `brain-stack/skills/` (project skills) and `.devin/skills/`
 * (tool skill packs). This registry resolves skill definitions by name and
 * exposes their instructions to the agent loop. `loadSkillsFromDirectory`
 * performs the filesystem scan; callers can also register skills manually.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface SkillDefinition {
  name: string;
  description: string;
  /** Markdown body / instructions of the skill. */
  instructions: string;
  /** Optional trigger keywords for auto-selection. */
  triggers?: string[];
  source?: 'project' | 'tool' | 'user';
}

export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    this.skills.set(skill.name, skill);
  }

  registerAll(skills: SkillDefinition[]): void {
    for (const s of skills) this.register(s);
  }

  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  list(): SkillDefinition[] {
    return [...this.skills.values()];
  }

  /** Naive keyword match — used for skill pre-selection hints. */
  match(prompt: string): SkillDefinition[] {
    const lower = prompt.toLowerCase();
    return this.list().filter((s) =>
      (s.triggers ?? []).some((t) => lower.includes(t.toLowerCase()))
    );
  }

  /** Render skills as prompt context for the agent loop. */
  renderContext(names: string[]): string {
    return names
      .map((n) => this.skills.get(n))
      .filter((s): s is SkillDefinition => Boolean(s))
      .map((s) => `### Skill: ${s.name}\n${s.description}\n\n${s.instructions}`)
      .join('\n\n---\n\n');
  }
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  triggers?: string[];
}

function parseSkillFile(file: string, fallbackName: string): SkillDefinition | null {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const stripped = raw.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
  const fm = stripped.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: SkillFrontmatter = {};
  let body = stripped;
  if (fm) {
    body = fm[2] ?? '';
    for (const line of fm[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      const value = kv[2].trim().replace(/^['"]|['"]$/g, '');
      if (key === 'name') meta.name = value;
      else if (key === 'description') meta.description = value;
      else if (key === 'triggers') {
        meta.triggers = value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
      }
    }
  }
  const name = meta.name || fallbackName;
  if (!name) return null;
  return {
    name,
    description: meta.description ?? '',
    instructions: body.trim(),
    triggers: meta.triggers,
    source: 'project',
  };
}

function findSkillFiles(dir: string, out: string[] = []): string[] {
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findSkillFiles(p, out);
    else if (e.name === 'SKILL.md') out.push(p);
  }
  return out;
}

/**
 * Scan a directory tree for `SKILL.md` files and return parsed skill
 * definitions. Skill name falls back to the containing directory name.
 */
export function loadSkillsFromDirectory(root: string): SkillDefinition[] {
  const skills: SkillDefinition[] = [];
  for (const file of findSkillFiles(root)) {
    const skill = parseSkillFile(file, path.basename(path.dirname(file)));
    if (skill) skills.push(skill);
  }
  return skills;
}
