// The lookbook: turnaround sheets (front, side, back, close-up, in scene light) for every body, outfit, hairstyle, mask and hat in the cast
// library, saved as PNGs to docs/lookbook/ and mirrored to the T7.   node studio/lib/cast/lookbook.mjs [filter]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'node:url';
import { serve, browse } from '../shoot.mjs';
const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), out = path.join(studio, 'docs', 'lookbook'), tmp = path.join(out, '.parts');
fs.mkdirSync(tmp, { recursive: true }); const filter = process.argv[2] || '';
const man = { body: 'man', hair: 'short', hairColor: 'brown', outfit: { top: 'tee', bottom: 'jeans', shoes: 'sneakers' } }, woman = { body: 'woman', hair: 'long', hairColor: 'auburn', outfit: { top: 'blouse', bottom: 'jeans', shoes: 'shoes' } };
const SHEETS = [];
for (const b of ['man', 'woman', 'teen', 'child', 'big', 'elderly', 'frail']) SHEETS.push([`body-${b}`, { ...man, body: b, name: `BODY: ${b}`, hair: b === 'woman' ? 'long' : 'short' }]);
const W = {
  tee: 'top', stripedTee: 'top', shirt: 'top', plaidShirt: 'top', sweater: 'top', turtleneck: 'top', tank: 'top', halter: 'top', hoodie: 'top', blouse: 'top',
  jeans: 'bottom', slacks: 'bottom', shorts: 'bottom', skirt: 'bottom', dress: 'full', nightgown: 'full', sneakers: 'shoes', boots: 'shoes', shoes: 'shoes', bare: 'shoes',
  denimJacket: 'jacket', leatherJacket: 'jacket', varsity: 'jacket', suitJacket: 'jacket', police: 'full', nurse: 'full', coveralls: 'full', attendant: 'full', butcherApron: 'apron' };
for (const [k, slot] of Object.entries(W)) { const fem = ['halter', 'blouse', 'skirt', 'dress', 'nightgown', 'nurse'].includes(k), base = fem ? woman : man;
  const outfit = slot === 'full' ? { full: k, shoes: base.outfit.shoes } : { ...base.outfit, [slot]: k, ...(slot === 'jacket' ? { top: 'shirt' } : {}) }; SHEETS.push([`outfit-${k}`, { ...base, outfit, name: `OUTFIT: ${k}` }]); }
for (const h of ['bald', 'buzz', 'short', 'shag', 'feathered', 'long', 'ponytail', 'bun', 'afro', 'veil']) SHEETS.push([`hair-${h}`, { ...(h === 'veil' || h === 'long' || h === 'ponytail' || h === 'bun' ? woman : man), hair: h, hairColor: h === 'veil' ? 'black' : 'darkBrown', name: `HAIR: ${h}` }]);
SHEETS.push(['hair-beard', { ...man, hair: 'shag', beard: 'darkBrown', name: 'HAIR: beard' }], ['hair-moustache', { ...man, moustache: 'brown', name: 'HAIR: moustache' }], ['hair-grey', { ...man, body: 'elderly', hairColor: 'grey', name: 'HAIR: grey' }]);
for (const m of ['skin', 'hockey', 'white', 'ghost']) SHEETS.push([`mask-${m}`, { ...man, body: m === 'skin' ? 'big' : 'man', mask: m, hair: m === 'skin' ? 'shag' : 'short', outfit: m === 'ghost' ? { full: 'coveralls' } : m === 'skin' ? { top: 'shirt', bottom: 'slacks', apron: 'butcherApron' } : { full: 'coveralls' }, colors: m === 'ghost' ? { full: '#0c0c0e' } : {}, name: `MASK: ${m}` }]);
for (const h of ['cap', 'trucker', 'cowboy', 'fedora', 'beanie', 'nurseCap', 'policeHat']) SHEETS.push([`hat-${h}`, { ...man, headwear: h, name: `HAT: ${h}` }]);
for (const e of ['neutral', 'scared', 'screaming', 'smiling', 'dead']) SHEETS.push([`face-${e}`, { ...woman, expression: e, name: `FACE: ${e}` }]);
SHEETS.push(['extras-glasses-backpack', { ...man, extras: ['glasses', 'backpack'], name: 'EXTRAS: glasses, backpack' }], ['extras-wear', { ...man, name: 'EXTRAS: dirt and blood (full)', wear: { dirt: 1, blood: 1 } }]);
const { server, port } = serve(studio, studio), { browser, page } = await browse(`http://localhost:${port}/studio/lib/cast/lookbook.html`, 1080, 1920);
let n = 0; for (const [file, r] of SHEETS) { if (filter && !file.includes(filter)) continue; const label = r.name; await page.evaluate((r, l) => window.LOOK(r, l), r, label);
  const views = []; for (let v = 0; v < 4; v++) { await page.evaluate(t => window.seek(t), v + .5); const f = path.join(tmp, `${file}-${v}.png`); await page.screenshot({ path: f }); views.push(f); }
  spawnSync(ffmpegPath, ['-v', 'error', '-y', ...views.flatMap(v => ['-i', v]), '-filter_complex', '[0][1][2][3]hstack=4,scale=1440:640:flags=neighbor', path.join(out, `${file}.png`)]); n++; }
await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true }); console.log(`LOOKBOOK ${n} sheets → ${out}`);
