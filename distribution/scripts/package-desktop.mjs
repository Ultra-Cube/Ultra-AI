#!/usr/bin/env node
// package-desktop.mjs — produce Linux + Windows desktop bundles under
// distribution/assets/releases/<version>/desktop/{linux,windows}/
// Usage: node distribution/scripts/package-desktop.mjs <version> [--skip-build]
// Zero-dependency: npm workspaces + tar + zip-free bundling (tar.gz on both OSes,
// installers remain a later step). No chain features.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = new URL("../..", import.meta.url).pathname;
const version = process.argv[2];
const skipBuild = process.argv.includes("--skip-build");
if (!version || !/^v?\d+\.\d+\.\d+/.test(version)) {
  console.error("usage: package-desktop.mjs <version> [--skip-build]");
  process.exit(2);
}
const tag = version.startsWith("v") ? version : `v${version}`;
const outRoot = join(ROOT, "distribution/assets/releases", tag, "desktop");

if (!skipBuild) {
  console.log("[desktop] npm run build ...");
  execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
}

// required workspace packages for the desktop bundle
const REQUIRED = [
  ["platform/apps/desktop-ui", "desktop-ui"],
  ["platform/devtools/desktop-bridge", "desktop-bridge"],
  ["platform/backend/hermes-runtime", "hermes-runtime"],
];

const staging = join(outRoot, ".staging");
rmSync(staging, { recursive: true, force: true });

const bundles = {};
for (const [rel, short] of REQUIRED) {
  const dir = join(ROOT, rel);
  const pkgPath = join(dir, "package.json");
  const dist = join(dir, "dist");
  if (!existsSync(pkgPath) || !existsSync(dist)) {
    console.error(`[desktop] missing package or dist: ${rel}`);
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const dest = join(staging, "node_modules", pkg.name);
  mkdirSync(dest, { recursive: true });
  cpSync(dist, join(dest, "dist"), { recursive: true });
  // minimal package.json for runtime resolution
  writeFileSync(
    join(dest, "package.json"),
    JSON.stringify({ name: pkg.name, version: pkg.version, main: pkg.main ?? "dist/index.js", type: pkg.type ?? "module" }, null, 2)
  );
  bundles[short] = pkg.name;
}

// desktop entrypoint scripts
const binDir = join(staging, "bin");
mkdirSync(binDir, { recursive: true });

writeFileSync(join(binDir, "ultra-desktop"), `#!/usr/bin/env bash
# Ultra AI Desktop launcher (Linux)
set -euo pipefail
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$DIR/node_modules/@ultra-ai/desktop-ui/dist/index.js" "$@"
`);
writeFileSync(join(binDir, "ultra-desktop.cmd"), `@echo off
rem Ultra AI Desktop launcher (Windows)
setlocal
set DIR=%~dp0..
node "%DIR%\\node_modules\\@ultra-ai\\desktop-ui\\dist\\index.js" %*
`);
execFileSync("chmod", ["+x", join(binDir, "ultra-desktop")]);

// platform manifests
writeFileSync(join(staging, "desktop.linux.json"), JSON.stringify({
  productName: "Ultra AI",
  desktopEntry: "ultra-ai.desktop",
  categories: ["Utility", "Development"],
  bin: ["bin/ultra-desktop"],
}, null, 2));
writeFileSync(join(staging, "desktop.windows.json"), JSON.stringify({
  productName: "Ultra AI",
  exe: "UltraAI.exe",
  installer: "nsis",
  portable: true,
}, null, 2));

// SHA256 manifest
const sums = [];
for (const [rel, short] of REQUIRED) {
  const pkgPath = join(ROOT, rel, "package.json");
  const hash = createHash("sha256").update(readFileSync(pkgPath)).digest("hex");
  sums.push(`${hash}  ${bundles[short]}`);
}
writeFileSync(join(staging, "SHA256SUMS.txt"), sums.join("\n") + "\n");

// pack per-OS tarballs
for (const os of ["linux", "windows"]) {
  const osDir = join(outRoot, os);
  mkdirSync(osDir, { recursive: true });
  const archive = join(osDir, `ultra-ai-desktop-${tag}-${os}.tar.gz`);
  execFileSync("tar", ["-czf", archive, "-C", staging, "."], { stdio: "inherit" });
  console.log(`[desktop] ${archive}`);
}

rmSync(staging, { recursive: true, force: true });
console.log(`[desktop] done -> ${outRoot}`);
