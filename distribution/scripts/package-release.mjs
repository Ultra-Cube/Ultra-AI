#!/usr/bin/env node
// package-release.mjs — build a release bundle under distribution/assets/releases/<version>/
// Usage: node distribution/scripts/package-release.mjs <version> [--skip-build]
// Zero-dependency: uses npm workspaces + tar + sha256. No chain features.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const ROOT = new URL("../..", import.meta.url).pathname;
const version = process.argv[2];
const skipBuild = process.argv.includes("--skip-build");
if (!version || !/^v?\d+\.\d+\.\d+/.test(version)) {
  console.error("usage: package-release.mjs <version> [--skip-build]");
  process.exit(2);
}
const tag = version.startsWith("v") ? version : `v${version}`;
const outDir = join(ROOT, "distribution/assets/releases", tag);

if (!skipBuild) {
  console.log("[release] npm run build ...");
  execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
}

// collect workspaces with a dist/ build output
// workspaces globs like "platform/*" or "platform/*/*" — expand '*' segments as one dir level
const ws = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).workspaces ?? [];
const expandGlob = (pattern) => {
  const segments = pattern.split("/");
  let dirs = [join(ROOT, segments[0])];
  for (const seg of segments.slice(1)) {
    const next = [];
    for (const d of dirs) {
      if (seg === "*") {
        try {
          for (const e of readdirSync(d, { withFileTypes: true })) {
            if (e.isDirectory()) next.push(join(d, e.name));
          }
        } catch { /* missing dir */ }
      } else {
        next.push(join(d, seg));
      }
    }
    dirs = next;
  }
  return dirs;
};
const dirs = ws
  .flatMap(expandGlob)
  // skip build-output dirs (e.g. platform/frontend/.next has a stray package.json)
  .filter((d) => !d.split("/").includes(".next"));
const pkgs = dirs
  .map((d) => ({ dir: d, pkg: join(d, "package.json") }))
  .filter((p) => existsSync(p.pkg))
  .map((p) => ({
    ...p,
    name: JSON.parse(readFileSync(p.pkg, "utf8")).name,
    dist: join(p.dir, "dist"),
  }))
  .filter((p) => p.name && existsSync(p.dist));

if (pkgs.length === 0) {
  console.error("[release] no built packages found — run npm run build first");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const staging = join(outDir, ".staging");
mkdirSync(staging, { recursive: true });

const manifest = [];
for (const p of pkgs) {
  const safe = p.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
  const dest = join(staging, safe);
  mkdirSync(dest, { recursive: true });
  execFileSync("cp", ["-r", p.dist, join(dest, "dist")]);
  execFileSync("cp", [p.pkg, join(dest, "package.json")]);
  const tarball = join(outDir, `${safe}-${tag}.tar.gz`);
  execFileSync("tar", ["-czf", tarball, "-C", staging, safe]);
  const sha = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  manifest.push(`${sha}  ${relative(ROOT, tarball)}`);
  console.log(`[release] ${safe} -> ${relative(ROOT, tarball)}`);
}

writeFileSync(
  join(outDir, "SHA256SUMS.txt"),
  `# ultra-ai release bundle ${tag}\n# generated: ${new Date().toISOString()}\n${manifest.join("\n")}\n`,
);
rmSync(staging, { recursive: true, force: true });
console.log(`[release] done: ${pkgs.length} package(s) -> ${relative(ROOT, outDir)}`);
