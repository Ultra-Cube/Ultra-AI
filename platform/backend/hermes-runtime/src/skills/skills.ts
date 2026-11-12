/**
 * Skill registry — loads and resolves agent skills.
 *
 * Skills live in `brain-stack/skills/` (project skills) and `.devin/skills/`
 * (tool skill packs). This registry resolves skill definitions by name and
 * exposes their instructions to the agent loop. Loading from disk is a
 * filesystem concern left to callers; this class is the in-memory index.
 */

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
