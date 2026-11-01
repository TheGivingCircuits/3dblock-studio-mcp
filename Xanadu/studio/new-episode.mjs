// Scaffold a new Conspiracy Theories episode from templates/:
//   node studio/new-episode.mjs <slug> "<Title>" <year>
// → episodes/<slug>/{index.html, spec.js, scene.js, prints/}, numbered after the episodes already in the series' episode-library folder (lib/paths.mjs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [slug, title, year] = process.argv.slice(2).filter(a => !a.startsWith('--')), series = (process.argv.find(a => a.startsWith('--series=')) || '--series=Conspiracy Theories').slice(9);
if (!slug || !title || !year || !/^[a-z0-9-]+$/.test(slug)) { console.log('usage: node studio/new-episode.mjs <slug-like-this> "<Title>" <year>'); process.exit(1); }
const dir = path.join(here, 'episodes', slug);
if (fs.existsSync(dir)) { console.log('already exists:', dir); process.exit(1); }
// next episode number: the highest "NN - " in the videos folder or any episode's meta.n, plus one
const videos = (await import('./lib/paths.mjs')).macDir(series);
const nums = [...(fs.existsSync(videos) ? fs.readdirSync(videos) : []).map(f => parseInt(f)),
  ...fs.readdirSync(path.join(here, 'episodes')).filter(e => fs.existsSync(path.join(here, 'episodes', e, 'spec.js'))).map(e => { const src = fs.readFileSync(path.join(here, 'episodes', e, 'spec.js'), 'utf8'), m = /n:\s*(\d+)/.exec(src), ser = /series:\s*'([^']+)'/.exec(src); return m && (ser ? ser[1] : 'Conspiracy Theories') === series ? +m[1] : 0; })].filter(Number.isFinite);
const n = Math.max(0, ...nums) + 1;
fs.mkdirSync(path.join(dir, 'prints'), { recursive: true });
for (const f of ['index.html', 'spec.js', 'scene.js']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(here, 'templates', f), 'utf8').replaceAll('__TITLE__', title).replaceAll('__YEAR__', year).replaceAll('__N__', String(n)).replaceAll('__SLUG__', slug).replace("meta: { n:", series === 'Conspiracy Theories' ? "meta: { n:" : `meta: { series: '${series}', n:`));
console.log(`episode #${n} scaffolded → ${dir}\n  next: write the script in spec.js, then: node studio/render.mjs ${slug} --voice`);
