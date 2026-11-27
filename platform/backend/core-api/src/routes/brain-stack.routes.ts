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

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAIN_STACK_DIR = path.resolve(HERE, '../../../../../brain-stack');
const REGISTRY_DIR = path.join(BRAIN_STACK_DIR, 'registry');
const COMPONENTS_FILE = path.join(REGISTRY_DIR, 'components.json');
const SKILLS_DIR = path.join(BRAIN_STACK_DIR, 'skills');
const PROMPTS_DIR = path.join(BRAIN_STACK_DIR, 'prompts');
const MANAGED_MARKER = 'x-ultra-managed: true';
const MANAGED_KEY = 'x-ultra-managed';

interface BrainComponent {
  id: string;
  name: string;
  desc: string;
  icon?: string;
  port?: number;
  status?: string;
  detail?: string;
  createdAt: string;
  updatedAt: string;
}

interface SkillEntry {
  id: string;
  name: string;
  description: string;
  managed: boolean;
  path: string;
  updatedAt: string;
}

interface PromptEntry {
  id: string;
  name: string;
  description: string;
  managed: boolean;
  path: string;
  updatedAt: string;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function listDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function findSkillFiles(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await findSkillFiles(p, base)));
    } else if (e.name === 'SKILL.md') {
      out.push(path.relative(base, p));
    }
  }
  return out;
}

function safeRelId(raw: string): string | null {
  const rel = raw.split('/').filter(Boolean).join('/');
  if (!rel || rel.includes('..') || rel.includes('\\')) return null;
  return rel;
}

async function readFrontmatter(file: string): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const stripped = raw.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
    const m = stripped.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const out: Record<string, string> = {};
    if (m) {
      for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (kv) out[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
    return out;
  } catch {
    return {};
  }
}

function parseSkillMd(name: string, file: string, fm: Record<string, string>, stat: { mtime: Date }): SkillEntry {
  return {
    id: name,
    name: fm.name || name,
    description: fm.description || '',
    managed: fm[MANAGED_KEY] === 'true',
    path: file,
    updatedAt: stat.mtime.toISOString(),
  };
}

function parsePromptMd(name: string, file: string, content: string, stat: { mtime: Date }): PromptEntry {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta: Record<string, string> = {};
  if (fm) {
    for (const line of fm[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return {
    id: name.replace(/\.md$/, ''),
    name: meta.name || name.replace(/\.md$/, ''),
    description: meta.description || '',
    managed: meta[MANAGED_KEY] === 'true',
    path: file,
    updatedAt: stat.mtime.toISOString(),
  };
}

export async function brainStackRoutes(app: FastifyInstance): Promise<void> {
  /* ------------------------------------------------------- components */

  app.get('/brain-stack/components', async () => {
    const items = await readJson<BrainComponent[]>(COMPONENTS_FILE, []);
    return { components: items };
  });

  app.post('/brain-stack/components', async (request, reply) => {
    const body = request.body as Partial<BrainComponent>;
    if (!body.name?.trim()) {
      return reply.code(400).send({ error: 'name is required' });
    }
    const items = await readJson<BrainComponent[]>(COMPONENTS_FILE, []);
    const now = new Date().toISOString();
    const item: BrainComponent = {
      id: `custom-${Date.now().toString(36)}-${slugify(body.name)}`,
      name: body.name.trim(),
      desc: body.desc?.trim() || 'Custom component',
      icon: body.icon || '◈',
      port: typeof body.port === 'number' && Number.isFinite(body.port) ? body.port : undefined,
      status: 'unknown',
      detail: 'Registered via Brain Stack API',
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    await writeJson(COMPONENTS_FILE, items);
    return reply.code(201).send({ component: item });
  });

  app.put('/brain-stack/components/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<BrainComponent>;
    const items = await readJson<BrainComponent[]>(COMPONENTS_FILE, []);
    const idx = items.findIndex((c) => c.id === id);
    if (idx < 0) return reply.code(404).send({ error: 'not found' });
    items[idx] = {
      ...items[idx],
      name: body.name?.trim() || items[idx].name,
      desc: body.desc?.trim() ?? items[idx].desc,
      icon: body.icon ?? items[idx].icon,
      port: body.port !== undefined ? body.port : items[idx].port,
      updatedAt: new Date().toISOString(),
    };
    await writeJson(COMPONENTS_FILE, items);
    return { component: items[idx] };
  });

  app.delete('/brain-stack/components/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const items = await readJson<BrainComponent[]>(COMPONENTS_FILE, []);
    const next = items.filter((c) => c.id !== id);
    if (next.length === items.length) return reply.code(404).send({ error: 'not found' });
    await writeJson(COMPONENTS_FILE, next);
    return { ok: true };
  });

  /* ------------------------------------------------------------ skills */

  app.get('/brain-stack/skills', async () => {
    const files = await findSkillFiles(SKILLS_DIR);
    const out: SkillEntry[] = [];
    for (const rel of files) {
      const file = path.join(SKILLS_DIR, rel);
      const id = path.dirname(rel).split(path.sep).join('/');
      try {
        const [fm, stat] = await Promise.all([
          readFrontmatter(file),
          fs.stat(file),
        ]);
        out.push(parseSkillMd(id, file, fm, stat));
      } catch {
        /* skip unreadable */
      }
    }
    return { skills: out.sort((a, b) => a.name.localeCompare(b.name)) };
  });

  app.post('/brain-stack/skills', async (request, reply) => {
    const body = request.body as { id?: string; name?: string; description?: string; content?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: 'name is required' });
    const id = body.id ? safeRelId(body.id) : slugify(body.name);
    if (!id) return reply.code(400).send({ error: 'invalid skill id' });
    const dir = path.join(SKILLS_DIR, id);
    const file = path.join(dir, 'SKILL.md');
    try {
      await fs.access(file);
      return reply.code(409).send({ error: `skill "${id}" already exists` });
    } catch {
      /* not exists — create */
    }
    const desc = body.description?.trim() || body.name.trim();
    const bodyText = body.content?.trim() || `# ${body.name.trim()}\n\n${desc}`;
    const content = `---\nname: ${body.name.trim()}\ndescription: ${desc}\n${MANAGED_MARKER}\n---\n\n${bodyText}\n`;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, content.endsWith('\n') ? content : content + '\n', 'utf8');
    const stat = await fs.stat(file);
    return reply.code(201).send({ skill: parseSkillMd(id, file, await readFrontmatter(file), stat) });
  });

  app.put('/brain-stack/skills/*', async (request, reply) => {
    const rel = safeRelId((request.params as Record<string, string>)['*'] || '');
    if (!rel) return reply.code(400).send({ error: 'invalid skill id' });
    const body = request.body as { name?: string; description?: string; content?: string };
    const file = path.join(SKILLS_DIR, rel, 'SKILL.md');
    let raw: string;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch {
      return reply.code(404).send({ error: 'not found' });
    }
    const fm = await readFrontmatter(file);
    const name = body.name?.trim() || fm.name || path.basename(rel);
    const desc = body.description?.trim() || fm.description || '';
    const managed = fm[MANAGED_KEY] === 'true' ? MANAGED_MARKER : '';
    const bodyText = body.content?.trim() ?? raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
    const next = `---\nname: ${name}\ndescription: ${desc}\n${managed ? managed + '\n' : ''}---\n\n${bodyText}`;
    await fs.writeFile(file, next.endsWith('\n') ? next : next + '\n', 'utf8');
    const stat = await fs.stat(file);
    return { skill: parseSkillMd(rel, file, await readFrontmatter(file), stat) };
  });

  app.delete('/brain-stack/skills/*', async (request, reply) => {
    const rel = safeRelId((request.params as Record<string, string>)['*'] || '');
    if (!rel) return reply.code(400).send({ error: 'invalid skill id' });
    const dir = path.join(SKILLS_DIR, rel);
    const file = path.join(dir, 'SKILL.md');
    const fm = await readFrontmatter(file);
    const force = (request.query as { force?: string }).force === '1';
    if (fm[MANAGED_KEY] !== 'true' && !force) {
      return reply.code(403).send({ error: 'only Ultra-managed skills can be deleted here (pass ?force=1 to override)' });
    }
    await fs.rm(dir, { recursive: true, force: true });
    return { ok: true };
  });

  /* ----------------------------------------------------------- prompts */

  app.get('/brain-stack/prompts', async () => {
    const files = (await listDir(PROMPTS_DIR)).filter((f) => f.endsWith('.md'));
    const out: PromptEntry[] = [];
    for (const f of files) {
      const file = path.join(PROMPTS_DIR, f);
      try {
        const [content, stat] = await Promise.all([fs.readFile(file, 'utf8'), fs.stat(file)]);
        out.push(parsePromptMd(f, file, content, stat));
      } catch {
        /* skip unreadable */
      }
    }
    return { prompts: out.sort((a, b) => a.name.localeCompare(b.name)) };
  });

  app.post('/brain-stack/prompts', async (request, reply) => {
    const body = request.body as { name?: string; description?: string; content?: string };
    if (!body.name?.trim()) return reply.code(400).send({ error: 'name is required' });
    const id = slugify(body.name);
    const file = path.join(PROMPTS_DIR, `${id}.md`);
    try {
      await fs.access(file);
      return reply.code(409).send({ error: `prompt "${id}" already exists` });
    } catch {
      /* create */
    }
    const desc = body.description?.trim() || body.name.trim();
    const bodyText = body.content?.trim() || desc;
    const content = `---\nname: ${body.name.trim()}\ndescription: ${desc}\n${MANAGED_MARKER}\n---\n\n${bodyText}\n`;
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
    await fs.writeFile(file, content.endsWith('\n') ? content : content + '\n', 'utf8');
    const stat = await fs.stat(file);
    return reply.code(201).send({ prompt: parsePromptMd(`${id}.md`, file, await fs.readFile(file, 'utf8'), stat) });
  });

  app.put('/brain-stack/prompts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; description?: string; content?: string };
    const file = path.join(PROMPTS_DIR, `${slugify(id)}.md`);
    let raw: string;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch {
      return reply.code(404).send({ error: 'not found' });
    }
    const fm = await readFrontmatter(file);
    const name = body.name?.trim() || fm.name || id;
    const desc = body.description?.trim() || fm.description || '';
    const managed = fm[MANAGED_KEY] === 'true' ? MANAGED_MARKER : '';
    const bodyText = body.content?.trim() ?? raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
    const next = `---\nname: ${name}\ndescription: ${desc}\n${managed ? managed + '\n' : ''}---\n\n${bodyText}`;
    await fs.writeFile(file, next.endsWith('\n') ? next : next + '\n', 'utf8');
    const stat = await fs.stat(file);
    return { prompt: parsePromptMd(`${slugify(id)}.md`, file, await fs.readFile(file, 'utf8'), stat) };
  });

  app.delete('/brain-stack/prompts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const file = path.join(PROMPTS_DIR, `${slugify(id)}.md`);
    const content = await fs.readFile(file, 'utf8').catch(() => '');
    const force = (request.query as { force?: string }).force === '1';
    if (!content.includes(MANAGED_MARKER) && !force) {
      return reply.code(403).send({ error: 'only Ultra-managed prompts can be deleted here (pass ?force=1 to override)' });
    }
    await fs.rm(file, { force: true });
    return { ok: true };
  });
}
