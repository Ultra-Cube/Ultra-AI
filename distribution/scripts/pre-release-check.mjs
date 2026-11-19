#!/usr/bin/env node
// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

// pre-release-check.mjs — gate suite that must pass before tagging a release.
// Usage: node distribution/scripts/pre-release-check.mjs [--skip-build] [--skip-tests]
// Runs: clean-tree check -> lint -> type-check -> test -> build -> smoke-desktop -> bundle verify (if tag given via --tag).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const skipTests = args.includes("--skip-tests");
const tagIdx = args.indexOf("--tag");
const tag = tagIdx >= 0 ? args[tagIdx + 1] : null;

const run = (name, cmd, cmdArgs, opts = {}) => {
  console.log(`\n[pre-release] === ${name} ===`);
  try {
    execFileSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", ...opts });
    console.log(`[pre-release] PASS ${name}`);
  } catch (e) {
    console.error(`[pre-release] FAIL ${name} (exit ${e.status ?? "?"})`);
    process.exit(e.status ?? 1);
  }
};

// 1. clean tree (uncommitted changes allowed only if --allow-dirty)
if (!args.includes("--allow-dirty")) {
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  if (dirty) {
    console.error("[pre-release] FAIL working tree is dirty — commit or stash first:");
    console.error(dirty);
    process.exit(1);
  }
  console.log("[pre-release] PASS clean working tree");
}

run("lint", "npm", ["run", "lint"]);
run("type-check", "npm", ["run", "type-check"]);
if (!skipTests) run("test", "npm", ["run", "test"]);
if (!skipBuild) run("build", "npm", ["run", "build"]);

const smoke = join(ROOT, "distribution/scripts/smoke-desktop.mjs");
if (existsSync(smoke)) run("smoke-desktop", "node", [smoke]);

if (tag) {
  run("verify-tag", "node", [
    join(ROOT, "distribution/scripts/verify-tag.mjs"),
    tag,
  ]);
}

console.log("\n[pre-release] ALL GATES PASSED");
