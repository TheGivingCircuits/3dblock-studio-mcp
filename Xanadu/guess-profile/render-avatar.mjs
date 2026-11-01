import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
const prev = process.argv[3];
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'avatar.html'));
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: out, type: 'png' });
if (prev) {
  await page.evaluate(() => { document.body.style.cssText = 'margin:0;background:#2a2a2a;display:flex;align-items:center;justify-content:center;width:1080px;height:1080px'; const s = document.querySelector('svg'); s.style.cssText = 'width:900px;height:900px;border-radius:50%;'; });
  await page.screenshot({ path: prev, type: 'png' });
}
await browser.close();
