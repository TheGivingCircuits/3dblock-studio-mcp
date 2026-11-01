// The Guess The Horror banner with the episode cast standing around it.
//   node guess-profile/make-banner-cast.mjs  → guess-profile/guess-the-horror-banner-cast.jpg (2560x1440) + banner-cast-preview.jpg (safe areas outlined)
// Base: banner.html (unchanged). Cutouts: guess-profile/characters/*.png from character-cutouts.mjs, drawn at exactly 2x nearest-neighbour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url)), chars = path.join(here, 'characters');
// [file, left, top] in banner pixels; later entries are drawn in front. Left group faces right, right group faces left, both toward the title.
const CAST = [
  ['the-rusted-truck-the-creeper', 150, 410], ['the-hitchhiker-the-butcher', 360, 235], ['the-hitchhiker-the-hitchhiker', 0, 545],
  ['the-cursed-tape-ps1-the-girl', 146, 565], ['the-black-woods-heather', 322, 580],
  ['the-babysitter-the-shape', 2358, 490], ['the-lockdown-the-leader', 2165, 468], ['the-babysitter-the-sheet-ghost', 2030, 566], ['the-lockdown-the-machete-mask', 2272, 550],
];
// the rest of the cast: two staggered rows along the bottom of the banner (seen on TV and in the full image; below the desktop band), episode by episode
const LINEUP = ['the-cursed-tape-ps1-rachel', 'the-cursed-tape-ps1-noah', 'the-cursed-tape-ps1-aidan', 'the-rusted-truck-darry', 'the-rusted-truck-trish', 'the-rusted-truck-waitress',
  'the-black-woods-mike', 'the-black-woods-josh', 'the-black-woods-townsman', 'the-hitchhiker-sally', 'the-hitchhiker-franklin', 'the-hitchhiker-kirk', 'the-hitchhiker-pam',
  'the-hitchhiker-jerry', 'the-hitchhiker-grandpa', 'the-hitchhiker-old-man', 'the-babysitter-laurie', 'the-babysitter-annie', 'the-babysitter-lynda', 'the-babysitter-tommy',
  'the-babysitter-loomis', 'the-babysitter-young-michael', 'the-lockdown-dad', 'the-lockdown-mom', 'the-lockdown-daughter', 'the-lockdown-son', 'the-lockdown-stranger',
  'the-lockdown-grace', 'the-lockdown-neighbour'];
const size = f => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const load = (k, x, y, row) => { const f = path.join(chars, k + '.png'), [w, h] = size(f); return { k, x, y, w: w * 2, h: h * 2, row, src: 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') }; };
const placed = CAST.map(([k, x, y]) => load(k, x, y, 'side'));
// even entries in the back row (feet at y 1305), odd ones in front (feet at 1432), centred on a shared grid so neighbours overlap a little
const step = 2560 / (LINEUP.length / 2 + .5), line = LINEUP.map((k, i) => { const p = load(k, 0, 0, i % 2 ? 'front' : 'back'), cx = step * (.5 + i / 2) + (i % 2 ? step * .0 : 0);
  p.x = Math.round(cx - p.w / 2 + 10); p.y = (i % 2 ? 1432 : 1305) - p.h; return p; });

// the case + title block must stay clear: case x 560-832 y 525-920, title x 955-1955 y 545-900
const BLOCK = [[540, 500, 855, 940], [940, 520, 1975, 910]];
for (const p of placed) for (const [a, b, c, d] of BLOCK) if (p.x < c && p.x + p.w > a && p.y < d && p.y + p.h > b) { console.log('OVERLAPS THE CASE/TITLE:', p.k, p); process.exit(1); }

// drop the background eye pairs that sit behind a character
let svg = fs.readFileSync(path.join(here, 'banner.html'), 'utf8'); const dropped = [];
svg = svg.replace(/<g transform="translate\((\d+),(\d+)\) scale\(([\d.]+)\)" opacity="[\d.]+" filter="url\(#eyeGlow\)">.*?<\/g>/g, (m, x, y, s) => {
  const hit = [...placed, ...line].some(p => +x + 90 * s > p.x - 40 && +x - 90 * s < p.x + p.w + 40 && +y + 20 * s > p.y - 40 && +y - 20 * s < p.y + p.h + 20); if (hit) dropped.push(`${x},${y}`); return hit ? '' : m; });
console.log('removed eye pairs at', dropped.join('  '));

// the cast layer: a soft dark-red glow behind each group, a red rim on every figure, a low mist over the feet; all above the grain-free base
const glow = (cx, cy, rx, ry) => `<div style="position:absolute;left:${cx - rx}px;top:${cy - ry}px;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;background:radial-gradient(closest-side,rgba(150,22,14,.55),rgba(110,14,10,.25) 55%,rgba(60,6,4,0))"></div>`;
const html = svg.replace('</svg>', '</svg>' + `<div style="position:absolute;left:0;top:0;width:2560px;height:1440px;overflow:hidden">
<div style="position:absolute;left:-200px;top:1100px;width:2960px;height:500px;border-radius:50%;background:radial-gradient(closest-side,rgba(110,14,10,.45),rgba(60,6,4,0))"></div>
${glow(270, 760, 330, 470)}${glow(2280, 760, 330, 470)}
${[...placed, ...line.filter(p => p.row === 'back'), ...line.filter(p => p.row === 'front')].map(p => `<img src="${p.src}" style="position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;image-rendering:pixelated;filter:${p.row === 'back' ? 'brightness(.78) ' : ''}drop-shadow(0 0 3px rgba(40,4,2,.9)) drop-shadow(0 0 16px rgba(170,26,16,.75))">`).join('\n')}
</div>`).replace('html,body{margin:0;background:#000}', 'html,body{margin:0;background:#000;position:relative;width:2560px;height:1440px;overflow:hidden}');
fs.writeFileSync(path.join(here, 'banner-cast.html'), html);

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--force-color-profile=srgb'] });
const page = await browser.newPage(); await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'banner-cast.html')); await new Promise(r => setTimeout(r, 800));
const out = path.join(here, 'guess-the-horror-banner-cast.jpg'); await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
// preview: YouTube's areas. Desktop shows the full-width band y 508-931; every device shows x 507-2053 of it (the phone-safe area)
await page.evaluate(() => { const box = (x, y, w, h, c, label) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;outline:4px dashed ${c};box-sizing:border-box;font:bold 26px Arial;color:${c};padding:6px`; d.textContent = label; document.body.appendChild(d); };
  box(0, 508, 2560, 423, '#33ff66', 'DESKTOP (full width)'); box(507, 508, 1546, 423, '#ffd23a', 'SAFE AREA (all devices)'); box(0, 0, 2560, 1440, '#66aaff', 'TV'); });
await page.screenshot({ path: path.join(here, 'banner-cast-preview.jpg'), type: 'jpeg', quality: 80 });
await browser.close();
console.log(out, (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
