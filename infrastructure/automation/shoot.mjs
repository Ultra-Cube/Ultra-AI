import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '/opt/data/shots';
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { path: '/', name: '01-landing' },
  { path: '/dashboard', name: '02-dashboard' },
  { path: '/agents', name: '03-agents-staff-console' },
  { path: '/hermes', name: '04-hermes-monitoring' },
  { path: '/zeroai', name: '05-zeroai-mind-control' },
  { path: '/gateway', name: '06-gateway' },
  { path: '/control-center', name: '07-control-center' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const p of pages) {
  try {
    await page.goto('http://localhost:3000' + p.path, { waitUntil: 'networkidle', timeout: 20000 });
    // Give client components (health strip, 3D scene, fetches) a moment.
    await page.waitForTimeout(2500);
    // On the ZeroAI page, switch to the Professional view to show Mind Control.
    if (p.path === '/zeroai') {
      const proBtn = page.getByRole('button', { name: /professional/i }).first();
      if (await proBtn.count()) {
        await proBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: true });
    console.log('shot', p.name);
  } catch (e) {
    console.log('FAIL', p.name, String(e).split('\n')[0]);
  }
}

await browser.close();
console.log('done ->', OUT);
