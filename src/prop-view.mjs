// Render one prop-library builder from 4 angles (plus an optional close-up) into one contact image.
//   node src/prop-view.mjs <module> <builder> ['<opts json>'] [--dist=6] [--height=2.2] [--look=0.9] [--close=x,y,z:lx,ly,lz] --out=file.jpg
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core'; import { ENGINE, THREE_BUILD, chromePath, ffmpegPath } from './config.mjs';
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), flag = (n, d) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const [mod, fn, opts = '{}'] = pos; if (!mod || !fn) { console.log('usage: prop-view.mjs <module> <builder> [opts-json] --out=file.jpg'); process.exit(1); }
const dist = +flag('dist', 6), hgt = +flag('height', 2.2), look = +flag('look', .9), out = path.resolve(flag('out', `${mod}-${fn}.jpg`));
const MOUNTS = [['/engine/', ENGINE], ['/three/', THREE_BUILD]];
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]), m = MOUNTS.find(([p]) => u.startsWith(p)), f = m ? path.join(m[1], u.slice(m[0].length)) : '';
  if (!m || !f.startsWith(m[1]) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const exe = chromePath(); if (!exe) { console.log('NO CHROME: install Google Chrome, or set CHROME_PATH'); process.exit(2); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--force-color-profile=srgb', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])] });
const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920 }); const errs = []; page.on('pageerror', e => errs.push(e.stack || e.message));
await page.goto(`http://localhost:${server.address().port}/engine/prop-viewer.html?mod=${encodeURIComponent(mod)}&fn=${encodeURIComponent(fn)}&opts=${encodeURIComponent(opts)}`);
await page.waitForFunction('window.ready === true', { timeout: 60000 }).catch(() => errs.push('page never became ready'));
const perr = await page.evaluate(() => window.PROPERR); if (perr) errs.push(perr);
if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); await browser.close(); server.close(); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.tmp-')), shots = [];
for (const deg of [35, 125, 215, 305]) { const a = deg * Math.PI / 180; shots.push([[Math.sin(a) * dist, hgt, Math.cos(a) * dist], [0, look, 0], 45]); }
const close = flag('close', ''); if (close) { const [c, l] = close.split(':').map(s => s.split(',').map(Number)); shots.push([c, l, 40]); }
for (let i = 0; i < shots.length; i++) { await page.evaluate(([p, l, f]) => window.viewAt(p, l, f), shots[i]); await page.screenshot({ path: path.join(tmp, `s${i}.jpg`), type: 'jpeg', quality: 85 }); }
await browser.close(); server.close();
spawnSync(ffmpegPath(), ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 's%d.jpg'), '-vf', `scale=432:768,tile=${shots.length}x1:padding=6:color=white`, '-frames:v', '1', out]);
fs.rmSync(tmp, { recursive: true, force: true }); console.log('VIEW →', out);
