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
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// verify-tag.mjs — verify a release tag is consistent and its bundle is intact.
// Usage: node distribution/scripts/verify-tag.mjs <tag> [--bundle-only]
// Checks:
//   1. tag exists locally (or as v-prefixed variant)
//   2. root package.json version at that tag matches the tag
//   3. release bundle exists under distribution/assets/releases/<tag>/
//   4. every SHA256SUMS entry verifies against the tarball on disk
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const tagArg = process.argv[2];
const bundleOnly = process.argv.includes("--bundle-only");
if (!tagArg || !/^v?\d+\.\d+\.\d+/.test(tagArg)) {
  console.error("usage: verify-tag.mjs <tag> [--bundle-only]");
  process.exit(2);
}
const tag = tagArg.startsWith("v") ? tagArg : `v${tagArg}`;
const version = tag.slice(1);
let failures = 0;
const ok = (msg) => console.log(`  PASS ${msg}`);
const fail = (msg) => {
  failures++;
  console.error(`  FAIL ${msg}`);
};
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts }).trim();

if (!bundleOnly) {
  console.log(`[verify-tag] tag checks for ${tag}`);
  let commit;
  try {
    commit = run("git", ["rev-list", "-n", "1", tag]);
    ok(`tag resolves to ${commit.slice(0, 12)}`);
  } catch {
    fail(`tag ${tag} not found locally — fetch tags first`);
  }
  if (commit) {
    let pkgVersion;
    try {
      pkgVersion = JSON.parse(
        run("git", ["show", `${tag}:package.json`]),
      ).version;
      if (pkgVersion === version) ok(`package.json version ${pkgVersion} matches tag`);
      else fail(`package.json version ${pkgVersion} != tag ${version}`);
    } catch (e) {
      fail(`cannot read package.json at ${tag}: ${e.message}`);
    }
    // tag must not be on a dirty-tree commit relative to a clean checkout —
    // we only verify the tag object itself; working tree state is pre-release's job.
  }
}

console.log(`[verify-tag] bundle checks for ${tag}`);
const bundleDir = join(ROOT, "distribution/assets/releases", tag);
const sumsPath = join(bundleDir, "SHA256SUMS.txt");
if (!existsSync(sumsPath)) {
  fail(`missing release bundle: ${sumsPath} — run package-release.mjs ${version}`);
} else {
  const lines = readFileSync(sumsPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length === 0) fail("SHA256SUMS.txt has no entries");
  for (const line of lines) {
    const m = line.match(/^([0-9a-f]{64})\s+(.+)$/);
    if (!m) {
      fail(`malformed SHA256SUMS line: ${line}`);
      continue;
    }
    const [, expected, rel] = m;
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      fail(`missing artifact: ${rel}`);
      continue;
    }
    const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
    if (actual === expected) ok(`${rel}`);
    else fail(`checksum mismatch: ${rel}`);
  }
}

if (failures > 0) {
  console.error(`[verify-tag] ${failures} check(s) failed`);
  process.exit(1);
}
console.log(`[verify-tag] ${tag} verified`);
