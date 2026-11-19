#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
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
 * file-guard.mjs — Ultra AI repository integrity guard.
 *
 * Builds/verifies a SHA-256 manifest of all git-tracked files.
 * `check` reports deleted, modified, or added files so accidental or
 * automated removal is detected in CI / pre-push. It does NOT make files
 * undeletable — it makes deletion visible and reviewable.
 *
 * Usage:
 *   node scripts/file-guard.mjs update   # regenerate security/file-manifest.sha256
 *   node scripts/file-guard.mjs check    # verify working tree against manifest (exit 1 on drift)
 *   node scripts/file-guard.mjs check --staged   # only verify staged deletions vs HEAD manifest
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const MANIFEST_REL = 'security/file-manifest.sha256';
const MANIFEST = path.join(ROOT, MANIFEST_REL);
const MODE = process.argv[2] || 'check';
const STAGED = process.argv.includes('--staged');

function listFiles() {
  const args = STAGED
    ? ['ls-files', '-s'] // staged entries: "<mode> <sha> <stage>\t<path>"
    : ['ls-files'];
  const out = execSync(`git ${args.join(' ')}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\n').filter(Boolean).map((l) => {
    if (STAGED) return l.split('\t')[1];
    return l;
  });
}

function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

if (MODE === 'update') {
  const files = listFiles().filter((rel) => rel !== MANIFEST_REL);
  const lines = files.map((rel) => {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) return null; // skip gitlinks/submodules
    return `${sha256File(abs)}  ${rel}`;
  }).filter(Boolean);
  writeFileSync(MANIFEST, lines.join('\n') + '\n');
  console.log(`file-guard: manifest written — ${lines.length} files -> security/file-manifest.sha256`);
  process.exit(0);
}

if (MODE !== 'check') {
  console.error('usage: file-guard.mjs [update|check] [--staged]');
  process.exit(2);
}

if (!existsSync(MANIFEST)) {
  console.error('file-guard: no manifest found. Run: node scripts/file-guard.mjs update');
  process.exit(1);
}

const manifest = new Map();
for (const line of readFileSync(MANIFEST, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const m = line.match(/^([0-9a-f]{64}|MISSING)  (.+)$/);
  if (m) manifest.set(m[2], m[1]);
}

const current = new Set(listFiles().filter((rel) => rel !== MANIFEST_REL));
const missing = [];
const modified = [];
const added = [];

for (const [rel, hash] of manifest) {
  if (!current.has(rel)) { missing.push(rel); continue; }
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) { missing.push(rel); continue; }
  if (!statSync(abs).isFile()) continue; // gitlink/submodule entry
  if (hash !== 'MISSING' && sha256File(abs) !== hash) modified.push(rel);
}
for (const rel of current) if (!manifest.has(rel)) added.push(rel);

const total = manifest.size;
console.log(`file-guard: checked=${total} missing=${missing.length} modified=${modified.length} added=${added.length}`);

if (missing.length || modified.length) {
  const show = (label, arr) => {
    console.error(`\n${label} (${arr.length}):`);
    for (const f of arr.slice(0, 50)) console.error(`  ${f}`);
    if (arr.length > 50) console.error(`  ... and ${arr.length - 50} more`);
  };
  if (missing.length) show('DELETED/MISSING files', missing);
  if (modified.length) show('MODIFIED files (hash drift)', modified);
  console.error('\nIf changes are intentional: node scripts/file-guard.mjs update && git add security/file-manifest.sha256');
  process.exit(1);
}
if (added.length) console.log(`note: ${added.length} new files not yet in manifest (run update to include them)`);
console.log('file-guard: OK');
