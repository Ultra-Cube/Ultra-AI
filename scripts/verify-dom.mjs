import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newContext().then((c) => c.newPage());

async function check(path, needles, pro = false) {
  await page.goto('http://localhost:3000' + path, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (pro) {
    const b = page.getByRole('button', { name: /professional/i }).first();
    if (await b.count()) { await b.click(); await page.waitForTimeout(1200); }
  }
  const text = (await page.innerText('body')).replace(/\s+/g, ' ');
  const found = needles.map((n) => `${needles.length && text.toLowerCase().includes(n.toLowerCase()) ? 'OK ' : 'MISS'} ${n}`);
  console.log(`\n${path}`);
  found.forEach((f) => console.log('   ' + f));
}

await check('/agents', ['Agent Staff Console', 'Roster', 'Atlas', 'Scribe', 'Assign', 'Drag to rotate']);
await check('/hermes', ['Hermes Observability', 'Prometheus', 'Grafana', 'Active Alerts']);
await check('/zeroai', ['Mind Control', 'Pause routing', 'Model override', 'Forced route'], true);
await check('/dashboard', ['Ultra AI Platform', 'Services Online', 'Core Services Up']);

await browser.close();
