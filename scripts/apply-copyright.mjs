#!/usr/bin/env node
/**
 * apply-copyright.mjs — Ultra AI / Ultra Cube Tech
 *
 * Prepends a hidden copyright banner to every tracked text file that
 * supports comments. Idempotent: files already carrying the marker are
 * skipped. Binary, generated, lockfile, and third-party vendored files
 * are excluded (see EXCLUDE_DIRS / BINARY_EXT / GENERATED).
 *
 * Usage:
 *   node scripts/apply-copyright.mjs          # apply
 *   node scripts/apply-copyright.mjs --check  # report coverage only
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const CHECK_ONLY = process.argv.includes('--check');
const MARKER = 'UCUBETECH-COPYRIGHT';

const BANNER_LINES = [
  'Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com',
  'Developed by Ultra Zone Team — ultra-zone.ucubetech.com',
  'GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved',
];

// Directories that are third-party imports, generated, or not project IP.
const EXCLUDE_DIRS = [
  'node_modules/',
  '.git/',
  '.devin/skills/', // imported mdskills/GitHub packs — third-party content
  'external/', // vendored forks/imports
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  '.turbo/',
  'out/',
];

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'icns', 'svgz',
  'webm', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'ogg',
  'pptx', 'ppt', 'docx', 'doc', 'xlsx', 'xls', 'pdf',
  'zip', 'tar', 'gz', '7z', 'rar', 'woff', 'woff2', 'ttf', 'otf', 'eot',
  'exe', 'dll', 'so', 'dylib', 'bin', 'wasm', 'pyc', 'class', 'jar',
  'db', 'sqlite', 'parquet', 'onnx', 'safetensors', 'gguf', 'ckpt',
]);

const GENERATED = /(?:^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|.*\.snap|.*\.min\.(js|css)|.*\.generated\..*|tsconfig\.tsbuildinfo)$/;

// Comment syntaxes. 'line' = prefix per line, 'block' = wrap whole banner.
function bannerFor(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const base = path.basename(file).toLowerCase();

  const lineComment = {
    ts: '//', tsx: '//', js: '//', jsx: '//', mjs: '//', cjs: '//',
    java: '//', cs: '//', c: '//', h: '//', cpp: '//', hpp: '//',
    go: '//', rs: '//', swift: '//', kt: '//', kts: '//', scala: '//',
    php: '//', groovy: '//', dart: '//', vue: '//', svelte: '//',
    sh: '#', bash: '#', zsh: '#', fish: '#', py: '#', rb: '#',
    pl: '#', pm: '#', r: '#', jl: '#', ex: '#', exs: '#',
    yaml: '#', yml: '#', toml: '#', ini: '#', cfg: '#', conf: '#',
    gitignore: '#', gitattributes: '#', gitkeep: '#', dockerignore: '#',
    env: '#', properties: '#', gitmodules: '#',
    ps1: '#', psm1: '#', bat: 'REM ', cmd: 'REM ', nsh: '#',
    tf: '#', hcl: '#', nix: '#', mk: '#', cmake: '#',
    coffee: '#', nim: '#', crystal: '#', el: '#', erl: '%',
    clj: ';', lisp: ';', scm: ';', sql: '--',
    lua: '--', hs: '--', ml: '(*', fs: '(*',
    tex: '%', latex: '%',
  };
  const blockComment = {
    css: '/*', scss: '/*', sass: '/*', less: '/*',
    html: '<!--', xml: '<!--', svg: '<!--', vue: '<!--', svelte: '<!--',
    md: '<!--', markdown: '<!--', mdx: '{/*',
    gql: '#', graphql: '#',
  };

  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return { kind: 'line', prefix: '#' };
  if (base === 'makefile' || base === 'gnumakefile') return { kind: 'line', prefix: '#' };
  if (ext === 'json' || ext === 'jsonc') {
    // JSON has no comments. jsonc allows them; plain .json is skipped
    // (adding keys risks breaking strict parsers/schemas).
    return ext === 'jsonc' ? { kind: 'line', prefix: '//' } : null;
  }
  if (ext === 'mmd') return { kind: 'line', prefix: '%%' };
  if (ext === 'txt' || ext === 'text' || ext === 'log' || ext === 'example' || base === 'license' || base === 'notice' || base === 'authors' || base === 'contributors' || base === 'changelog') {
    return { kind: 'raw' };
  }
  if (lineComment[ext]) return { kind: 'line', prefix: lineComment[ext] };
  if (blockComment[ext]) return { kind: 'block', open: blockComment[ext], close: blockComment[ext] === '<!--' ? '-->' : blockComment[ext] === '{/*' ? '*/}' : '*/' };
  return null; // unknown — skip rather than corrupt
}

function renderBanner(style) {
  const tag = `[${MARKER}]`;
  if (style.kind === 'raw') {
    return `${tag}\n${BANNER_LINES.join('\n')}\n\n`;
  }
  if (style.kind === 'line') {
    const p = style.prefix;
    return `${p} ${tag}\n${BANNER_LINES.map((l) => `${p} ${l}`).join('\n')}\n\n`;
  }
  // block
  const pad = ' ';
  return `${style.open}${tag}\n${BANNER_LINES.map((l) => `${style.open === '<!--' ? ' ' : ''}${l}`).join('\n')}${style.close}\n\n`;
}

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .filter(Boolean);

let applied = 0, skippedMarked = 0, skippedType = 0, skippedBinary = 0, skippedExcluded = 0, errors = 0;
const changed = [];

for (const rel of files) {
  const norm = rel.split(path.sep).join('/');
  if (EXCLUDE_DIRS.some((d) => norm.startsWith(d) || norm.includes(`/${d}`))) { skippedExcluded++; continue; }
  const ext = path.extname(norm).slice(1).toLowerCase();
  if (BINARY_EXT.has(ext)) { skippedBinary++; continue; }
  if (GENERATED.test(norm)) { skippedType++; continue; }
  const style = bannerFor(norm);
  if (!style) { skippedType++; continue; }

  const abs = path.join(ROOT, norm);
  let content;
  try { content = readFileSync(abs, 'utf8'); } catch { errors++; continue; }
  if (content.includes(MARKER)) { skippedMarked++; continue; }
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip BOM; banner goes first

  // Preserve shebang as the very first line.
  let prefix = '';
  let body = content;
  const nl = body.indexOf('\n');
  const firstLine = nl === -1 ? body : body.slice(0, nl);
  if (firstLine.startsWith('#!')) { prefix = firstLine + '\n'; body = nl === -1 ? '' : body.slice(nl + 1); }

  const banner = renderBanner(style);
  if (CHECK_ONLY) { console.log(`WOULD banner: ${norm}`); continue; }
  try {
    writeFileSync(abs, prefix + banner + body);
    applied++;
    changed.push(norm);
  } catch (e) { errors++; console.error(`ERR ${norm}: ${e.message}`); }
}

console.log(`\napply-copyright: applied=${applied} already-marked=${skippedMarked} skipped-type=${skippedType} skipped-binary=${skippedBinary} skipped-excluded-dir=${skippedExcluded} errors=${errors}`);
if (!CHECK_ONLY && changed.length) {
  mkdirSync(path.join(ROOT, 'security'), { recursive: true });
  writeFileSync(path.join(ROOT, 'security', '.copyright-applied.json'), JSON.stringify({ count: changed.length, files: changed }, null, 2));
}
