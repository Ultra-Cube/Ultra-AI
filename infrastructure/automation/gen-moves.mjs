#!/usr/bin/env node
// gen-moves.mjs — generate moves.tsv (src\tdst) from docs/planning/layout-map.yaml
// Usage: node infrastructure/automation/gen-moves.mjs [layout-map.yaml] [out.tsv]
// Emits comment lines "# STEP<n>" between groups; rows are exactly: src<TAB>dst
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// dirHasFiles: true if path exists on disk and contains >=1 file (recursive)
function dirHasFiles(p) {
  if (!existsSync(p)) return false;
  const st = statSync(p);
  if (st.isFile()) return true;
  for (const e of readdirSync(p)) {
    if (dirHasFiles(join(p, e))) return true;
  }
  return false;
}

const mapPath = process.argv[2] ?? 'docs/planning/layout-map.yaml';
const outPath = process.argv[3] ?? 'moves.tsv';
const text = readFileSync(mapPath, 'utf8');

const STEP_RE = /^step(\d)_([a-z_]+):\s*$/gm;
const ROW_RE = /-\s*\{\s*src:\s*"?([^",}]+?)"?,\s*dst:\s*"?([^",}]+)"?(?=[,}])/g;

// find step section boundaries
const steps = [];
for (const m of text.matchAll(STEP_RE)) steps.push({ n: +m[1], name: m[2], start: m.index });
steps.push({ n: 99, name: 'end', start: text.length });

const out = [];
const seen = new Set();
let skipped = 0;

for (let i = 0; i < steps.length - 1; i++) {
  const s = steps[i], e = steps[i + 1];
  const body = text.slice(s.start, e.start);
  const rows = [];
  for (const m of body.matchAll(ROW_RE)) {
    const src = m[1].trim();
    let dst = m[2].trim();
    if (dst === '(stay)' || dst.startsWith('(')) { skipped++; continue; }
    if (src.includes('*')) { skipped++; continue; } // deferred glob rows (prisma)
    // normalize dst: strip trailing slash
    dst = dst.replace(/\/+$/, '');
    if (src === dst) { skipped++; console.error(`SKIP self-move: ${src}`); continue; }
    if (!dirHasFiles(src)) { skipped++; console.error(`SKIP empty-dir: ${src}`); continue; }
    if (seen.has(src)) { console.error(`DUP src: ${src}`); process.exit(2); }
    seen.add(src);
    rows.push([src, dst]);
  }
  if (rows.length) {
    out.push(`# STEP${s.n}_${s.name}`);
    for (const [src, dst] of rows) out.push(`${src}\t${dst}`);
  }
}

// env rule: environments/.env.example -> environments/developmentenvironments/.env.example
if (/action:\s*"\.env\.example -> environments\/development\.env\.example"/.test(text)) {
  if (!seen.has('environments/.env.example')) {
    out.push('# STEP5_env_rule');
    out.push('environments/.env.example\tenvironments/developmentenvironments/.env.example');
  }
}

writeFileSync(outPath, out.join('\n') + '\n');
const rows = out.filter(l => !l.startsWith('#')).length;
console.log(`moves.tsv: ${rows} rows, ${skipped} skipped (stay/glob), written to ${outPath}`);
