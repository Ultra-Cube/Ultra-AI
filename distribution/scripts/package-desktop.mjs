#!/usr/bin/env node
// package-desktop.mjs — produce Linux + Windows desktop bundles under
// distribution/assets/releases/<version>/desktop/{linux,windows}/
// Usage: node distribution/scripts/package-desktop.mjs <version> [--skip-build]
// Zero-dependency: npm workspaces + tar + zip-free bundling (tar.gz on both OSes,
// installers remain a later step). No chain features.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, cpSync, chmodSync, symlinkSync } from "node:fs";
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

// Linux desktop entry + install script.
// Exec=ultra-ai resolves via /usr/local/bin (install.sh) or /usr/local/bin
// (dpkg .deb below); the raw tarball documents bin/ultra-desktop directly.
const DESKTOP_ENTRY = `[Desktop Entry]
Type=Application
Name=Ultra AI
Comment=Ultra AI Platform desktop shell
Exec=ultra-ai
Icon=ultra-ai
Terminal=false
Categories=Utility;Development;
StartupNotify=true
`;
writeFileSync(join(staging, "ultra-ai.desktop"), DESKTOP_ENTRY);
writeFileSync(join(staging, "install.sh"), `#!/usr/bin/env bash
# Ultra AI Desktop installer (Linux) — installs to /opt/ultra-ai
set -euo pipefail
SRC="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
DEST=/opt/ultra-ai
mkdir -p "$DEST"
cp -a "$SRC"/. "$DEST"/
ln -sf "$DEST/bin/ultra-desktop" /usr/local/bin/ultra-ai
mkdir -p ~/.local/share/applications
cp "$DEST/ultra-ai.desktop" ~/.local/share/applications/
echo "Installed. Run: ultra-ai"
`);
chmodSync(join(staging, "install.sh"), 0o755);
writeFileSync(join(staging, "install.ps1"), `# Ultra AI Desktop installer (Windows)
$ErrorActionPreference = 'Stop'
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest = Join-Path $env:LOCALAPPDATA 'Programs\\UltraAI'
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path "$Src\\*" -Destination $Dest -Recurse -Force
$cmd = Join-Path $Dest 'bin\\ultra-desktop.cmd'
Write-Output "Installed. Run: $cmd"
`);
writeFileSync(join(staging, "README-INSTALL.txt"), `Ultra AI Desktop
==================
Linux:   bash install.sh   (or extract and run bin/ultra-desktop)
Windows: powershell -ExecutionPolicy Bypass -File install.ps1
Updates are handled by the in-app auto-updater (enableAutoUpdate).
`);

// CycloneDX-lite SBOM: all npm workspace packages in the repo (P2-10)
const components = [];
function scanPkgs(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    const pj = join(p, "package.json");
    if (existsSync(pj)) {
      try {
        const pkg = JSON.parse(readFileSync(pj, "utf8"));
        if (pkg.name) {
          components.push({
            type: "library",
            name: pkg.name,
            version: pkg.version ?? "0.0.0",
            purl: `pkg:npm/${pkg.name.replace("@", "").replace("/", "%2F")}@${pkg.version ?? "0.0.0"}`,
            ...(pkg.license ? { licenses: [{ license: { id: typeof pkg.license === "string" ? pkg.license : pkg.license.type } }] } : {}),
          });
        }
      } catch { /* skip malformed package.json */ }
    }
    scanPkgs(p);
  }
}
scanPkgs(join(ROOT, "platform"));
writeFileSync(join(staging, "sbom.cdx.json"), JSON.stringify({
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: { component: { type: "application", name: "ultra-ai", version: tag } },
  components,
}, null, 2));

// Third-party notices (P2-10): license rollup from the same scan.
const notices = [
  "Ultra AI Desktop — Third-Party Notices",
  "========================================",
  "",
  `Release: ${tag}`,
  "",
  "This product bundles the following workspace components.",
  "See sbom.cdx.json for the machine-readable bill of materials.",
  "",
];
for (const c of components.sort((a, b) => a.name.localeCompare(b.name))) {
  const lic = c.licenses?.[0]?.license?.id ?? "UNKNOWN";
  notices.push(`- ${c.name}@${c.version} — ${lic}`);
}
writeFileSync(join(staging, "THIRD-PARTY-NOTICES.txt"), notices.join("\n") + "\n");

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

// .deb package (Linux, P2-03): ar archive of debian-binary + control.tar.gz
// + data.tar.gz. Built in-process (no dpkg-deb dependency).
function arHeader(name, size) {
  const fields = [
    name.length > 15 ? name.slice(0, 15) : name.padEnd(16),
    "0".repeat(12), // mtime
    "0".repeat(6),  // uid
    "0".repeat(6),  // gid
    "100644".padEnd(8), // mode
    String(size).padStart(10, "0"),
    "`\n",
  ];
  return Buffer.from(fields.join(""), "ascii");
}
function writeAr(path, entries) {
  const parts = [Buffer.from("!<arch>\n", "ascii")];
  for (const { name, data } of entries) {
    parts.push(arHeader(name, data.length), data);
    if (data.length % 2) parts.push(Buffer.from("\n"));
  }
  writeFileSync(path, Buffer.concat(parts));
}

{
  const linuxDir = join(outRoot, "linux");
  const debRoot = join(outRoot, ".deb-root");
  const ctrlDir = join(outRoot, ".deb-control");
  rmSync(debRoot, { recursive: true, force: true });
  rmSync(ctrlDir, { recursive: true, force: true });
  mkdirSync(ctrlDir, { recursive: true });

  // data payload -> /opt/ultra-ai + launcher symlink + desktop entry
  cpSync(staging, join(debRoot, "opt", "ultra-ai"), { recursive: true });
  mkdirSync(join(debRoot, "usr", "local", "bin"), { recursive: true });
  mkdirSync(join(debRoot, "usr", "share", "applications"), { recursive: true });
  symlinkSync("/opt/ultra-ai/bin/ultra-desktop", join(debRoot, "usr", "local", "bin", "ultra-ai"));
  writeFileSync(join(debRoot, "usr", "share", "applications", "ultra-ai.desktop"), DESKTOP_ENTRY);

  const debVersion = tag.replace(/^v/, "");
  writeFileSync(join(ctrlDir, "control"), `Package: ultra-ai
Version: ${debVersion}
Section: utils
Priority: optional
Architecture: all
Maintainer: Ultra AI
Description: Ultra AI Platform desktop shell
 Local-first AI platform runtime: Hermes cognitive core, ZeroAI
 edge execution, embedded OpenHands workspace, engine supervision,
 and system tray. Bundles Node.js workspace services.
`);
  const dataTar = join(outRoot, ".deb-data.tar.gz");
  const ctrlTar = join(outRoot, ".deb-control.tar.gz");
  execFileSync("tar", ["-czf", dataTar, "-C", debRoot, "."], { stdio: "inherit" });
  execFileSync("tar", ["-czf", ctrlTar, "-C", ctrlDir, "control"], { stdio: "inherit" });
  const deb = join(linuxDir, `ultra-ai-desktop_${debVersion}_all.deb`);
  writeAr(deb, [
    { name: "debian-binary", data: Buffer.from("2.0\n", "ascii") },
    { name: "control.tar.gz", data: readFileSync(ctrlTar) },
    { name: "data.tar.gz", data: readFileSync(dataTar) },
  ]);
  rmSync(debRoot, { recursive: true, force: true });
  rmSync(ctrlDir, { recursive: true, force: true });
  rmSync(dataTar, { force: true });
  rmSync(ctrlTar, { force: true });
  console.log(`[desktop] ${deb}`);
}

// AppImage payload (Linux, P2-03): squashfs image + AppDir tarball.
// A real .AppImage needs the appimagetool runtime binary; when absent we
// emit the squashfs + AppDir tarball so CI/release hosts can finish it.
{
  const linuxDir = join(outRoot, "linux");
  const appDir = join(outRoot, ".appdir");
  rmSync(appDir, { recursive: true, force: true });
  cpSync(staging, join(appDir, "usr"), { recursive: true });
  writeFileSync(join(appDir, "AppRun"), `#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
exec "$HERE/usr/bin/ultra-desktop" "$@"
`);
  chmodSync(join(appDir, "AppRun"), 0o755);
  const sqsh = join(linuxDir, `ultra-ai-desktop-${tag}-linux.squashfs`);
  execFileSync("mksquashfs", [appDir, sqsh, "-noappend", "-no-xattrs", "-comp", "gzip"], { stdio: "inherit" });
  const appdirTar = join(linuxDir, `ultra-ai-desktop-${tag}-appdir.tar.gz`);
  execFileSync("tar", ["-czf", appdirTar, "-C", outRoot, ".appdir"], { stdio: "inherit" });
  rmSync(appDir, { recursive: true, force: true });
  console.log(`[desktop] ${sqsh}`);
  console.log(`[desktop] ${appdirTar}`);
}

// Windows installer script (P2-03): Inno Setup .iss emitted alongside the
// tarball; compile with `iscc ultra-ai.iss` on a Windows release host.
{
  const winDir = join(outRoot, "windows");
  const ver = tag.replace(/^v/, "");
  const iss = `; Ultra AI Desktop - Inno Setup script (generated ${tag})
; Build: iscc /DAppVersion=${ver} ultra-ai.iss
#define AppVersion "${ver}"
[Setup]
AppName=Ultra AI
AppVersion={#AppVersion}
DefaultDirName={localappdata}\\Programs\\UltraAI
OutputDir=.
OutputBaseFilename=UltraAI-Setup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
[Files]
Source: "ultra-ai-desktop-${tag}-windows.tar.gz"; DestDir: "{app}"; Flags: ignoreversion
[Run]
Filename: "{app}\\bin\\ultra-desktop.cmd"; Description: "Launch Ultra AI"; Flags: nowait postinstall skipifsilent
`;
  const issPath = join(winDir, "ultra-ai.iss");
  writeFileSync(issPath, iss);
  console.log(`[desktop] ${issPath}`);
}

rmSync(staging, { recursive: true, force: true });
console.log(`[desktop] done -> ${outRoot}`);
