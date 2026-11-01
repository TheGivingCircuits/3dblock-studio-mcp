// Prop preview sheets: one PNG per prop (hero, side, top, with the collision shape and grip point drawn on) in docs/props/, plus a contact
// sheet of every prop, mirrored to the T7 with the library itself.   node studio/lib/props/sheet.mjs [filter]
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import ffmpegPath from 'ffmpeg-static'; import { fileURLToPath } from 'node:url';
import { serve, browse } from '../shoot.mjs';
const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), out = path.join(studio, 'docs', 'props'), tmp = path.join(out, '.parts'); fs.mkdirSync(tmp, { recursive: true });
const filter = process.argv[2] || '', { server, port } = serve(studio, studio), { browser, page } = await browse(`http://localhost:${port}/studio/lib/props/sheet.html`, 1080, 1920);
const ids = await page.evaluate(() => PROPS.list.map(d => d.room + '/' + d.id)); let n = 0; const made = [];
for (const rid of ids) { const id = rid.split('/')[1]; if (filter && !rid.includes(filter)) continue; await page.evaluate(id => window.SHEET(id), id); const views = [];
  for (let v = 0; v < 3; v++) { await page.evaluate(t => window.seek(t), v + .5); const f = path.join(tmp, `${id}-${v}.png`); await page.screenshot({ path: f }); views.push(f); }
  const file = path.join(out, `${rid.replace('/', '-')}.png`); spawnSync(ffmpegPath, ['-v', 'error', '-y', ...views.flatMap(v => ['-i', v]), '-filter_complex', '[0][1][2]hstack=3,scale=1080:640:flags=neighbor', file]); made.push(file); n++; }
await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
if (!filter) { const cols = 6, all = fs.readdirSync(out).filter(f => f.endsWith('.png') && f !== 'contact-sheet.png').sort(), rows = Math.ceil(all.length / cols), inputs = all.flatMap(f => ['-i', path.join(out, f)]);
  const cells = all.map((_, i) => `[${i}]scale=360:213[c${i}]`).join(';'), pad = all.length % cols ? Array.from({ length: cols - all.length % cols }, (_, k) => `color=black:s=360x213:d=1[p${k}]`).join(';') + ';' : '', names = [...all.map((_, i) => `[c${i}]`), ...Array.from({ length: (cols - all.length % cols) % cols }, (_, k) => `[p${k}]`)];
  const rowsF = Array.from({ length: rows }, (_, r) => `${names.slice(r * cols, r * cols + cols).join('')}hstack=${cols}[r${r}]`).join(';');
  spawnSync(ffmpegPath, ['-v', 'error', '-y', ...inputs, '-filter_complex', `${cells};${pad}${rowsF};${Array.from({ length: rows }, (_, r) => `[r${r}]`).join('')}vstack=${rows}`, '-frames:v', '1', path.join(out, 'contact-sheet.png')]); }
console.log(`PROP SHEETS ${n} → ${out}`);
