// Scaffold a new Countdown to Strange segment from templates/:
//   node countdown/new-episode.mjs <slug> "<Title>" <year> <numeral> "<Place>"
// → episodes/<slug>/{index.html, spec.js, scene.js, prints/}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [slug, title, year, numeral = 'I', place = 'Somewhere'] = process.argv.slice(2);
if (!slug || !title || !year || !/^[a-z0-9-]+$/.test(slug)) { console.log('usage: node countdown/new-episode.mjs <slug-like-this> "<Title>" <year> <numeral> "<Place>"'); process.exit(1); }
const dir = path.join(here, 'episodes', slug);
if (fs.existsSync(dir)) { console.log('already exists:', dir); process.exit(1); }
fs.mkdirSync(path.join(dir, 'prints'), { recursive: true });
for (const f of ['index.html', 'spec.js', 'scene.js']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(here, 'templates', f), 'utf8')
  .replaceAll('__TITLE__', title).replaceAll('__YEAR__', year).replaceAll('__NUMERAL__', numeral).replaceAll('__PLACE__', place).replaceAll('__SLUG__', slug));
console.log(`segment #${numeral} scaffolded → ${dir}\n  next: write the narration in spec.js, then: node countdown/render.mjs ${slug} --voice`);
