// The cast sheet for an episode: a turnaround (front, side, back, close-up) for every character in <episode>/cast.json, on the lookbook stage,
// saved to <episode>/cast/<id>.png plus cast-sheet.png (all of them, for Chria's approval).   node studio/lib/cast/castsheet.mjs <slug>
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import ffmpegPath from 'ffmpeg-static'; import { fileURLToPath } from 'node:url';
import { serve, browse } from '../shoot.mjs';
const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), slug = process.argv[2], dir = path.join(studio, 'conspiracy', 'episodes', slug), out = path.join(dir, 'cast'), tmp = path.join(out, '.parts');
fs.mkdirSync(tmp, { recursive: true }); const { cast } = JSON.parse(fs.readFileSync(path.join(dir, 'cast.json'), 'utf8'));
const { server, port } = serve(studio, studio), { browser, page } = await browse(`http://localhost:${port}/studio/lib/cast/lookbook.html`, 1080, 1920), made = [];
for (const [id, r] of Object.entries(cast)) { await page.evaluate((r, l) => window.LOOK(r, l), r, `${id.toUpperCase()}: ${r.role}`); const views = [];
  for (let v = 0; v < 4; v++) { await page.evaluate(t => window.seek(t), v + .5); const f = path.join(tmp, `${id}-${v}.png`); await page.screenshot({ path: f }); views.push(f); }
  const f = path.join(out, `${id}.png`); spawnSync(ffmpegPath, ['-v', 'error', '-y', ...views.flatMap(v => ['-i', v]), '-filter_complex', '[0][1][2][3]hstack=4,scale=1440:640:flags=neighbor', f]); made.push(f); }
await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
spawnSync(ffmpegPath, ['-v', 'error', '-y', ...made.flatMap(f => ['-i', f]), '-filter_complex', `${made.map((_, i) => `[${i}]scale=720:320[s${i}]`).join(';')};${made.map((_, i) => `[s${i}]`).join('')}vstack=${made.length}`, path.join(dir, 'cast-sheet.png')]);
console.log(`CAST SHEET ${made.length} characters → ${path.join(dir, 'cast-sheet.png')}`);
