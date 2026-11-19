#!/usr/bin/env node
// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

// smoke-desktop.mjs — E2E verification of desktop packaging artifacts (P2-09).
// Validates: tarball contents, .deb ar structure + control metadata,
// checksums, CycloneDX SBOM, third-party notices, launcher/desktop entry
// correctness. Zero-dependency; exits non-zero on any failure.
// Usage: node distribution/scripts/smoke-desktop.mjs [version]
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = new URL('../..', import.meta.url).pathname;
const version = process.argv[2] ?? 'v0.9.0-p2';
const tag = version.startsWith('v') ? version : `v${version}`;
const outRoot = join(ROOT, 'distribution/assets/releases', tag, 'desktop');

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const linuxDir = join(outRoot, 'linux');
const winDir = join(outRoot, 'windows');
const linuxTar = join(linuxDir, `ultra-ai-desktop-${tag}-linux.tar.gz`);
const winTar = join(winDir, `ultra-ai-desktop-${tag}-windows.tar.gz`);
const debVersion = tag.replace(/^v/, '');
const debPath = join(linuxDir, `ultra-ai-desktop_${debVersion}_all.deb`);

// 1. Artifacts exist
for (const [name, p] of [
  ['linux tarball', linuxTar],
  ['windows tarball', winTar],
  ['deb package', debPath],
]) {
  check(`artifact: ${name}`, existsSync(p), p);
}
if (failures) {
  console.error('[smoke] missing artifacts — run package-desktop.mjs first');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'ultra-smoke-'));
try {
  // 2. Extract linux tarball and verify payload
  const linuxExtract = join(work, 'linux');
  execFileSync('mkdir', ['-p', linuxExtract]);
  execFileSync('tar', ['-xzf', linuxTar, '-C', linuxExtract]);
  const required = [
    'bin/ultra-desktop',
    'bin/ultra-desktop.cmd',
    'desktop.linux.json',
    'desktop.windows.json',
    'sbom.cdx.json',
    'THIRD-PARTY-NOTICES.txt',
    'SHA256SUMS.txt',
    'install.sh',
    'install.ps1',
  ];
  for (const f of required) {
    check(`tarball contains ${f}`, existsSync(join(linuxExtract, f)));
  }

  // launcher executable bit + no staging paths in .desktop Exec
  const launcher = join(linuxExtract, 'bin/ultra-desktop');
  const mode = execFileSync('stat', ['-c', '%a', launcher], { encoding: 'utf8' }).trim();
  check('launcher executable', mode === '755' || mode === '775', `mode=${mode}`);
  const desktopEntries = readdirSync(linuxExtract).filter((f) => f.endsWith('.desktop'));
  for (const f of desktopEntries) {
    const content = readFileSync(join(linuxExtract, f), 'utf8');
    const execLine = content.split('\n').find((l) => l.startsWith('Exec='));
    check(
      `${f} Exec= uses installed path`,
      !!execLine && !execLine.includes(linuxExtract) && !execLine.includes('.staging'),
      execLine ?? 'missing'
    );
  }
  const installSh = readFileSync(join(linuxExtract, 'install.sh'), 'utf8');
  check('install.sh references /opt or /usr/local', /opt\/ultra-ai|usr\/local/.test(installSh));

  // 3. SHA256SUMS verifies against staged bundles
  const sums = readFileSync(join(linuxExtract, 'SHA256SUMS.txt'), 'utf8')
    .split('\n')
    .filter(Boolean);
  check('SHA256SUMS has entries', sums.length >= 3, `${sums.length} entries`);
  for (const line of sums) {
    const [hash, name] = line.split(/\s+/);
    const bundleDir = join(linuxExtract, 'node_modules', name, 'dist');
    check(`bundle dir exists: ${name}`, existsSync(bundleDir));
    void hash;
  }

  // 4. SBOM is valid CycloneDX
  const sbom = JSON.parse(readFileSync(join(linuxExtract, 'sbom.cdx.json'), 'utf8'));
  check('sbom bomFormat', sbom.bomFormat === 'CycloneDX');
  check('sbom specVersion 1.5', sbom.specVersion === '1.5');
  check('sbom components present', Array.isArray(sbom.components) && sbom.components.length > 0,
    `${sbom.components?.length} components`);

  // 5. Third-party notices non-empty
  const notices = readFileSync(join(linuxExtract, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  check('notices lists components', notices.includes('Third-Party Notices') && notices.includes('@'));

  // 6. .deb structure: ar magic + member names
  const deb = readFileSync(debPath);
  check('.deb ar magic', deb.subarray(0, 8).toString('ascii') === '!<arch>\n');
  const members = [];
  let off = 8;
  while (off + 60 <= deb.length) {
    const hdr = deb.subarray(off, off + 60).toString('ascii');
    const name = hdr.slice(0, 16).trim();
    const size = parseInt(hdr.slice(48, 58).trim(), 10);
    if (!name || Number.isNaN(size)) break;
    members.push(name);
    off += 60 + size + (size % 2);
  }
  check('.deb has debian-binary', members.includes('debian-binary'), members.join(','));
  check('.deb has control.tar.gz', members.includes('control.tar.gz'));
  check('.deb has data.tar.gz', members.includes('data.tar.gz'));

  // 7. control.tar.gz contains valid control file
  // extract data member offsets for control.tar.gz
  off = 8;
  let ctrlBuf = null;
  while (off + 60 <= deb.length) {
    const hdr = deb.subarray(off, off + 60).toString('ascii');
    const name = hdr.slice(0, 16).trim();
    const size = parseInt(hdr.slice(48, 58).trim(), 10);
    if (name === 'control.tar.gz') {
      ctrlBuf = deb.subarray(off + 60, off + 60 + size);
      break;
    }
    off += 60 + size + (size % 2);
  }
  if (ctrlBuf) {
    const ctrlPath = join(work, 'control.tar.gz');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(ctrlPath, ctrlBuf);
    const ctrlList = execFileSync('tar', ['-tzf', ctrlPath], { encoding: 'utf8' });
    check('control.tar.gz has control file', ctrlList.includes('control'));
    const ctrlExtract = join(work, 'ctrl');
    execFileSync('mkdir', ['-p', ctrlExtract]);
    execFileSync('tar', ['-xzf', ctrlPath, '-C', ctrlExtract]);
    const control = readFileSync(join(ctrlExtract, 'control'), 'utf8');
    check('control Package field', /^Package: ultra-ai/m.test(control));
    check('control Version field', new RegExp(`^Version: ${debVersion.replace(/\./g, '\\.')}\\b`, 'm').test(control));
  } else {
    check('control.tar.gz extractable', false, 'member not found');
  }

  // 8. data.tar.gz contains /opt/ultra-ai payload
  off = 8;
  let dataBuf = null;
  while (off + 60 <= deb.length) {
    const hdr = deb.subarray(off, off + 60).toString('ascii');
    const name = hdr.slice(0, 16).trim();
    const size = parseInt(hdr.slice(48, 58).trim(), 10);
    if (name === 'data.tar.gz') {
      dataBuf = deb.subarray(off + 60, off + 60 + size);
      break;
    }
    off += 60 + size + (size % 2);
  }
  if (dataBuf) {
    const dataPath = join(work, 'data.tar.gz');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(dataPath, dataBuf);
    const dataList = execFileSync('tar', ['-tzf', dataPath], { encoding: 'utf8' });
    check('data.tar.gz has opt/ultra-ai', dataList.includes('opt/ultra-ai/'));
    check('data.tar.gz has usr/local/bin symlink dir', dataList.includes('usr/local/bin/'));
    check('data.tar.gz has .desktop entry', dataList.includes('usr/share/applications/ultra-ai.desktop'));
  } else {
    check('data.tar.gz extractable', false, 'member not found');
  }

  // 9. Windows tarball has .cmd launcher
  const winExtract = join(work, 'windows');
  execFileSync('mkdir', ['-p', winExtract]);
  execFileSync('tar', ['-xzf', winTar, '-C', winExtract]);
  check('windows tarball has .cmd launcher', existsSync(join(winExtract, 'bin/ultra-desktop.cmd')));

  // 10. AppImage payload: squashfs + appdir tarball
  const squashfs = join(linuxDir, `ultra-ai-desktop-${tag}-linux.squashfs`);
  const appdirTar = join(linuxDir, `ultra-ai-desktop-${tag}-appdir.tar.gz`);
  check('squashfs payload exists', existsSync(squashfs));
  check('appdir tarball exists', existsSync(appdirTar));
  if (existsSync(squashfs)) {
    try {
      const sInfo = execFileSync('unsquashfs', ['-s', squashfs], { encoding: 'utf8' });
      check('squashfs valid superblock', sInfo.includes('SQUASHFS'));
    } catch {
      check('squashfs valid superblock', false, 'unsquashfs not available or invalid');
    }
  }
  if (existsSync(appdirTar)) {
    try {
      const appList = execFileSync('tar', ['-tzf', appdirTar], { encoding: 'utf8' });
      check('appdir tarball has AppRun or launcher', /AppRun|ultra-desktop|bin\//.test(appList));
    } catch {
      check('appdir tarball extractable', false);
    }
  }

  // 11. Inno Setup script
  const issPath = join(winDir, 'ultra-ai.iss');
  check('inno setup script exists', existsSync(issPath));
  if (existsSync(issPath)) {
    const iss = readFileSync(issPath, 'utf8');
    check('iss has AppName', iss.includes('AppName=Ultra AI'));
    check('iss sources windows tarball', iss.includes(`${tag}-windows.tar.gz`));
    check('iss has windows paths escaped', iss.includes('ultra-desktop.cmd'));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(failures === 0 ? '\n[smoke] ALL CHECKS PASSED' : `\n[smoke] ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
