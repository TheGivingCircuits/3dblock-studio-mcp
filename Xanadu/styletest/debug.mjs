// debug a style-test page: node styletest/debug.mjs <dir> — prints page errors with stacks and console output
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import puppeteer from 'puppeteer-core'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = process.argv[2];
const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920 });
page.on('pageerror', e => console.log('PAGEERROR', e.message, e.stack)); page.on('console', m => console.log('CONSOLE', m.type(), m.text()));
await page.goto(`http://localhost:${server.address().port}/${dir.includes("/") ? dir : `styletest/${dir}`}/index.html`); await page.waitForFunction('window.ready === true', { timeout: 20000 }).catch(e => console.log('not ready', e.message));
try { console.log('seek', await page.evaluate(() => { try { window.seek(1); return 'ok'; } catch (e) { return e.stack; } })); } catch (e) { console.log('eval error', e.message); }
await browser.close(); server.close();
