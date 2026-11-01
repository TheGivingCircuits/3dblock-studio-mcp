// Render a PS1 prop from 4 angles (plus an optional close-up) into one contact image.
//   node studio/props-test/view.mjs <module> <builder> ['<opts json>'] [--dist=6] [--height=2.2] [--look=0.9] [--close=x,y,z:lx,ly,lz] [--out=file.jpg]
// e.g. node studio/props-test/view.mjs vehicles car '{"color":"#3a6a8a"}' --dist=8
// Prints any page error (and a missing builder) and exits 1 so you can fix it. Output: studio/props-test/out/<module>-<builder>.jpg
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core'; import ffmpegPath from 'ffmpeg-static';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..', '..');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const [mod, fn, opts = '{}'] = pos; if (!mod || !fn) { console.log('usage: view.mjs <module> <builder> [opts-json] [--dist=6] [--height=2.2] [--look=0.9] [--close=x,y,z:lx,ly,lz]'); process.exit(1); }
const dist = +flag('dist', 6), hgt = +flag('height', 2.2), look = +flag('look', .9), out = path.resolve(flag('out', path.join(here, 'out', `${mod.replace(/\+/g, '_')}-${fn}.jpg`)));
const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920 }); const errs = []; page.on('pageerror', e => errs.push(e.stack || e.message));
await page.goto(`http://localhost:${server.address().port}/studio/props-test/index.html?mod=${encodeURIComponent(mod)}&fn=${encodeURIComponent(fn)}&opts=${encodeURIComponent(opts)}`);
await page.waitForFunction('window.ready === true', { timeout: 30000 }).catch(() => errs.push('page never became ready'));
const perr = await page.evaluate(() => window.PROPERR); if (perr) errs.push(perr);
if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); await browser.close(); server.close(); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(here, 'out', '.tmp-')), shots = [];
for (const deg of [35, 125, 215, 305]) { const a = deg * Math.PI / 180; shots.push([[Math.sin(a) * dist, hgt, Math.cos(a) * dist], [0, look, 0], 45]); }
const close = flag('close', ''); if (close) { const [c, l] = close.split(':').map(s => s.split(',').map(Number)); shots.push([c, l, 40]); }
for (let i = 0; i < shots.length; i++) { await page.evaluate(([p, l, f]) => window.viewAt(p, l, f), shots[i]); await page.screenshot({ path: path.join(tmp, `s${i}.jpg`), type: 'jpeg', quality: 85 }); }
await browser.close(); server.close();
spawnSync(ffmpegPath, ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 's%d.jpg'), '-vf', `scale=432:768,tile=${shots.length}x1:padding=6:color=white`, '-frames:v', '1', out]);
fs.rmSync(tmp, { recursive: true, force: true }); console.log('VIEW →', out);
