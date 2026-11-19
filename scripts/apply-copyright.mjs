#!/usr/bin/env node
/**
 * apply-copyright.mjs — Ultra AI / Ultra Cube Tech
 *
 * Prepends a boxed copyright banner (Kombai-style ASCII frame) to every
 * tracked text file that supports comments. Idempotent. Binary, generated,
 * lockfile, and third-party vendored files are excluded.
 *
 * Usage:
 *   node scripts/apply-copyright.mjs            # apply
 *   node scripts/apply-copyright.mjs --check    # report coverage only
 *   node scripts/apply-copyright.mjs --migrate  # strip old 4-line banner, then apply
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const CHECK_ONLY = process.argv.includes('--check');
const MIGRATE = process.argv.includes('--migrate');
const MARKER = 'UCUBETECH-COPYRIGHT';

const IW = 74; // inner width of the box

const ART = [
  '██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗  ',
  '██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║  ',
  '██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║  ',
 '╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║  ',
  ' ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║  ',
  '  ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝  ',
];

const INFO = [
  'Project   : Ultra AI — Proprietary AI Platform',
  'Developer : Ultra Cube Tech — ucubetech.com',
  'Team      : Ultra Zone Team — ultra-zone.ucubetech.com',
  'GitHub Org: github.com/Ultra-Cube',
  'Repository: github.com/Ultra-Cube/Ultra-AI',
  'Copyright : (c) Ultra Cube Tech — All rights reserved',
  `[${MARKER}]`,
];

function boxLine(text) {
  const inner = ' ' + text;
  return '║' + inner.padEnd(IW, ' ') + '║';
}

function buildBox() {
  const top = '╔' + '═'.repeat(IW) + '╗';
  const bottom = '╚' + '═'.repeat(IW) + '╝';
  const lines = [top, boxLine(''), ...ART.map(boxLine), boxLine('')];
  for (const l of INFO) lines.push(boxLine(l));
  lines.push(boxLine(''), bottom);
  return lines;
}

const BANNER_LINES = buildBox();

const EXCLUDE_DIRS = [
  'node_modules/', '.git/', '.devin/skills/', 'external/',
  'dist/', 'build/', '.next/', 'coverage/', '.turbo/', 'out/',
];

// Reference/spec files that must keep their original content unstamped.
const EXCLUDE_FILES = new Set(['copy.txt']);

const BINARY_EXT = new Set([
  'png','jpg','jpeg','gif','webp','ico','icns','svgz',
  'webm','mp4','mov','avi','mp3','wav','ogg',
  'pptx','ppt','docx','doc','xlsx','xls','pdf',
  'zip','tar','gz','7z','rar','woff','woff2','ttf','otf','eot',
  'exe','dll','so','dylib','bin','wasm','pyc','class','jar',
  'db','sqlite','parquet','onnx','safetensors','gguf','ckpt',
]);

const GENERATED = /(?:^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|.*\.snap|.*\.min\.(js|css)|.*\.generated\..*|tsconfig\.tsbuildinfo)$/;

function bannerFor(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const base = path.basename(file).toLowerCase();
  const lineComment = {
    ts:'//',tsx:'//',js:'//',jsx:'//',mjs:'//',cjs:'//',
    java:'//',cs:'//',c:'//',h:'//',cpp:'//',hpp:'//',
    go:'//',rs:'//',swift:'//',kt:'//',kts:'//',scala:'//',
    php:'//',groovy:'//',dart:'//',vue:'//',svelte:'//',
    sh:'#',bash:'#',zsh:'#',fish:'#',py:'#',rb:'#',
    pl:'#',pm:'#',r:'#',jl:'#',ex:'#',exs:'#',
    yaml:'#',yml:'#',toml:'#',ini:'#',cfg:'#',conf:'#',
    gitignore:'#',gitattributes:'#',gitkeep:'#',dockerignore:'#',
    env:'#',properties:'#',gitmodules:'#',
    ps1:'#',psm1:'#',bat:'REM ',cmd:'REM ',nsh:'#',
    tf:'#',hcl:'#',nix:'#',mk:'#',cmake:'#',
    coffee:'#',nim:'#',crystal:'#',el:'#',erl:'%',
    clj:';',lisp:';',scm:';',sql:'--',
    lua:'--',hs:'--',ml:'(*',fs:'(*',
    tex:'%',latex:'%',
  };
  const blockComment = {
    css:'/*',scss:'/*',sass:'/*',less:'/*',
    html:'<!--',xml:'<!--',svg:'<!--',vue:'<!--',svelte:'<!--',
    md:'<!--',markdown:'<!--',mdx:'{/*',
    gql:'#',graphql:'#',
  };
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return { kind:'line', prefix:'#' };
  if (base === 'makefile' || base === 'gnumakefile') return { kind:'line', prefix:'#' };
  if (ext === 'json' || ext === 'jsonc') {
    return ext === 'jsonc' ? { kind:'line', prefix:'//' } : null;
  }
  if (ext === 'mmd') return { kind:'line', prefix:'%%' };
  if (ext === 'txt' || ext === 'text' || ext === 'log' || ext === 'example' ||
      base === 'license' || base === 'notice' || base === 'authors' ||
      base === 'contributors' || base === 'changelog') return { kind:'raw' };
  if (lineComment[ext]) return { kind:'line', prefix:lineComment[ext] };
  if (blockComment[ext]) {
    const o = blockComment[ext];
    return { kind:'block', open:o, close: o === '<!--' ? '-->' : o === '{/*' ? '*/}' : '*/' };
  }
  return null;
}

function renderBanner(style) {
  if (style.kind === 'raw') return BANNER_LINES.join('\n') + '\n\n';
  if (style.kind === 'line') {
    const p = style.prefix;
    return BANNER_LINES.map((l) => `${p} ${l}`).join('\n') + '\n\n';
  }
  // block comment — wrap whole box
  return style.open + '\n' + BANNER_LINES.join('\n') + '\n' + style.close + '\n\n';
}

// Strip any prior Ultra banner variant: the legacy 4-line `[UCUBETECH-COPYRIGHT]`
// header, the `[UCUBETECH]` one-liner (possibly duplicated), the small 3-line
// box, and the current full box banner. Comment wrappers (<!-- --> /* */ {/* */})
// hugging the banner are removed with it. Returns null when nothing matched.
const LEGACY_RE = /\[UCUBETECH(?:-COPYRIGHT)?\]/;
const WRAPPER_RE = /^\s*(<!--|-->|\/\*|\*\/|\{\/\*|\*\/\})\s*$/;
const BOX_CHARS_RE = /[╔╗╚╝║═█]/;
const INFO_LINE_RE = /copyright|ultra cube|ultra zone|ucubetech|github\.com\/Ultra|all rights reserved/i;

function stripOldBanner(content) {
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => LEGACY_RE.test(l) && !/[║╔╗╚╝═]/.test(l));
  if (idx === -1) return null;

  let start = idx;
  let end = idx;

  // Marker inside a box (║ ... ║): expand to the ╔/╚ edges.
  if (lines[idx].includes('║')) {
    while (start > 0 && !lines[start].includes('╔')) start--;
    while (end < lines.length - 1 && !lines[end].includes('╚')) end++;
  }

  // Absorb comment-wrapper lines hugging the banner.
  while (start > 0 && WRAPPER_RE.test(lines[start - 1])) start--;
  while (end + 1 < lines.length && WRAPPER_RE.test(lines[end + 1])) end++;

  // Legacy inline form: <!--[UCUBETECH-COPYRIGHT] ... reserved--> — the
  // opening <!-- shares the marker line, so following orphan lines must be
  // consumed through the line that closes the comment.
  if (lines[idx].includes('<!--') && !lines[idx].includes('-->')) {
    let j = idx + 1;
    while (j < lines.length && !lines[j].includes('-->')) j++;
    if (j < lines.length) end = Math.max(end, j);
  }

  // Absorb sibling banner lines using the marker line's own comment prefix.
  const pm = lines[idx].match(/^\s*(\/\/|#|--|%%|REM |;|\(\*|%|<!--|\/\*|\{\/\*)/);
  const p = pm ? pm[1] : '';
  const isBannerLine = (l) => {
    if (LEGACY_RE.test(l) || BOX_CHARS_RE.test(l)) return true;
    if (!p) return false;
    const t = l.trimStart();
    return t.startsWith(p) && INFO_LINE_RE.test(l);
  };
  while (start > 0 && isBannerLine(lines[start - 1])) start--;
  while (end + 1 < lines.length && isBannerLine(lines[end + 1])) end++;

  // Consume one trailing blank and one preceding blank.
  if (end + 1 < lines.length && lines[end + 1].trim() === '') end++;
  if (start > 0 && lines[start - 1].trim() === '') start--;

  lines.splice(start, end - start + 1);
  return lines.join('\n');
}

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean);

let applied = 0, skippedMarked = 0, skippedType = 0, skippedBinary = 0,
    skippedExcluded = 0, migrated = 0, errors = 0;
const changed = [];

for (const rel of files) {
  const norm = rel.split(path.sep).join('/');
  if (EXCLUDE_DIRS.some((d) => norm.startsWith(d) || norm.includes(`/${d}`))) { skippedExcluded++; continue; }
  if (EXCLUDE_FILES.has(path.basename(norm).toLowerCase())) { skippedExcluded++; continue; }
  const ext = path.extname(norm).slice(1).toLowerCase();
  if (BINARY_EXT.has(ext)) { skippedBinary++; continue; }
  if (GENERATED.test(norm)) { skippedType++; continue; }
  const style = bannerFor(norm);
  if (!style) { skippedType++; continue; }

  const abs = path.join(ROOT, norm);
  let content;
  try { content = readFileSync(abs, 'utf8'); } catch { errors++; continue; }

  if (MIGRATE) {
    let stripped = stripOldBanner(content);
    if (stripped !== null) {
      content = stripped;
      for (let g = 0; g < 8; g++) {
        const again = stripOldBanner(content);
        if (again === null) break;
        content = again;
      }
      migrated++;
    }
  }

  const hasBox = content.includes('╔') && content.includes(MARKER);
  if (hasBox) { skippedMarked++; continue; }

  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  let prefix = '', body = content;
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

console.log(`\napply-copyright: applied=${applied} migrated=${migrated} already-marked=${skippedMarked} skipped-type=${skippedType} skipped-binary=${skippedBinary} skipped-excluded-dir=${skippedExcluded} errors=${errors}`);
if (!CHECK_ONLY && changed.length) {
  mkdirSync(path.join(ROOT, 'security'), { recursive: true });
  writeFileSync(path.join(ROOT, 'security', '.copyright-applied.json'),
    JSON.stringify({ count: changed.length, files: changed }, null, 2));
}
