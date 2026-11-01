// Screenshot the doll viewer: node tools/doll-shot.mjs "<query string>" <out.png> [w h] [frames]
import puppeteer from 'puppeteer-core'; import http from 'node:http'; import { spawn } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { TEMP } from '../studio/lib/paths.mjs';
const [qs = '', out = path.join(TEMP, 'doll.png'), w = 1400, h = 800, frames = 40] = process.argv.slice(2);
const srv = spawn(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'serve.mjs'), '8799'], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 600));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: +w, height: +h }); p.on('pageerror', e => console.log('PAGE ERROR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto(`http://localhost:8799/studio/lib/doll/viewer.html?manual=1&hideui=1&${qs}`); await p.waitForFunction('window.__ready', { timeout: 30000 });
await p.evaluate(n => window.__frame(1 / 60, n), +frames); await p.screenshot({ path: out }); console.log('shot →', out); await b.close(); srv.kill();
