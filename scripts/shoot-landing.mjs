import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/opt/data/shots/01-landing.png', fullPage: true });
await browser.close();
console.log('landing shot ok');
