// screenshot a style-test page at time t after running setup JS: node styletest/dbgshot.mjs <dir> <t> <out.jpg> "<js>"
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), [dir, t, out, js = ''] = process.argv.slice(2);
const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920 }); page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/styletest/${dir}/index.html`); await page.waitForFunction('window.ready === true', { timeout: 20000 });
if (js) console.log(await page.evaluate(js)); await page.evaluate(x => window.seek(x), +t); await page.screenshot({ path: out, type: 'jpeg', quality: 80, clip: { x: 200, y: 200, width: 700, height: 800 } });
await browser.close(); server.close();
