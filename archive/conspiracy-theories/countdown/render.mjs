// Countdown to Strange renderer (16:9 long-form, not looped). Uses the shared notebook/make.mjs for voice, frames and mix.
//   node countdown/render.mjs <slug> --voice                generate narration + sound effects, print each line's words (cheap; cached)
//   node countdown/render.mjs <slug> --stills[=auto|t,..]   contact sheet of preview frames → episodes/<slug>/stills.jpg
//   node countdown/render.mjs <slug> --final [--out=<file.mp4>] [--no-open]
//        full render into ~/Desktop/Studio/Episode Files/Countdown to Strange/<Title>/ (or --out), then report length and loudness
//        and write a contact sheet next to the episode (contact.jpg) and next to the video
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const here = path.dirname(fileURLToPath(import.meta.url)), studio = path.resolve(here, '..');
const args = process.argv.slice(2), slug = args.find(a => !a.startsWith('--')), flag = n => args.find(a => a === n || a.startsWith(n + '='));
if (!slug) { console.log('usage: node countdown/render.mjs <slug> --voice | --stills[=auto|t1,t2] | --final [--out=file.mp4] [--no-open]'); process.exit(1); }
const dir = path.join(here, 'episodes', slug), specFile = path.join(dir, 'spec.js'), scene = path.join(dir, 'index.html');
if (!fs.existsSync(specFile)) { console.log('no episode at', dir, '— create it with: node countdown/new-episode.mjs', slug, '"Title" year numeral'); process.exit(1); }
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(specFile, 'utf8'), ctx); const SPEC = ctx.SPEC, meta = SPEC.meta;
const folder = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'), 'Episodes', 'Countdown to Strange', `${meta.title} (${meta.year})`);
const make = (...a) => { const r = spawnSync(process.execPath, [path.join(studio, 'notebook', 'make.mjs'), specFile, scene, ...a], { cwd: studio, stdio: 'inherit' }); if (r.status) process.exit(r.status || 1); };
const ff = a => spawnSync(ffmpegPath, a, { encoding: 'utf8', maxBuffer: 1 << 28 });

if (flag('--voice')) {
  const { speak, sfx } = await import(path.join(studio, 'eleven.mjs'));
  let total = SPEC.lines[0].at ?? 0;
  for (const l of SPEC.lines) { const r = await speak(l.text, SPEC.voice, { model: SPEC.model, settings: SPEC.settings || null }), d = r.words.at(-1).e; total += d + (l.at === undefined ? l.gap ?? .4 : 0);
    console.log(`${l.id.padEnd(4)} ${d.toFixed(2)}s  ${r.words.map(w => w.w.toLowerCase().replace(/[^a-z0-9'-]/g, '')).join(' ')}`); }
  for (const [, [p, d]] of Object.entries(SPEC.sfx || {})) await sfx(p, { duration: d });
  console.log(`≈ ${(total + (SPEC.tail ?? 2)).toFixed(1)}s total; ${Object.keys(SPEC.sfx || {}).length} sound effects ready`);
}
if (flag('--stills')) {
  const v = flag('--stills').split('=')[1] || 'auto', out = path.join(dir, 'preview.mp4');
  make(out, `--stills=${v}`);
  fs.renameSync(path.join(dir, 'preview-stills.jpg'), path.join(dir, 'stills.jpg')); fs.rmSync(path.join(dir, 'preview.parts'), { recursive: true, force: true });
  console.log('STILLS →', path.join(dir, 'stills.jpg'));
}
if (flag('--final')) {
  const custom = flag('--out') && flag('--out').split('=').slice(1).join('=');
  const out = custom ? path.resolve(custom) : path.join(folder, `${meta.title} - FINAL.mp4`); fs.mkdirSync(path.dirname(out), { recursive: true });
  if (fs.existsSync(out)) { const old = path.join(path.dirname(out), 'older versions'); fs.mkdirSync(old, { recursive: true }); fs.renameSync(out, path.join(old, `${path.basename(out, '.mp4')} - ${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.mp4`)); }
  const t0 = Date.now(); make(out); const mins = ((Date.now() - t0) / 60000).toFixed(1);
  // verify: length and loudness, and a contact sheet (one frame every 4 s) for a final look
  const dur = /Duration: ([\d:.]+)/.exec(ff(['-i', out]).stderr)?.[1];
  const lufs = [...ff(['-i', out, '-af', 'ebur128', '-f', 'null', '-']).stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)?.[1];
  const sheet = path.join(dir, 'contact.jpg');
  ff(['-v', 'error', '-y', '-i', out, '-vf', 'fps=1/4,scale=384:216,tile=6x5:padding=4:color=white', '-frames:v', '1', sheet]);
  const sheetOut = out.replace(/\.mp4$/, ' - contact.jpg'); fs.copyFileSync(sheet, sheetOut);
  console.log(`\nFINAL → ${out}\n  length ${dur} · loudness ${lufs} LUFS (target -14) · render ${mins} min\n  contact sheet → ${sheetOut}`);
  if (!flag('--no-open')) spawnSync('open', [out]);
}
