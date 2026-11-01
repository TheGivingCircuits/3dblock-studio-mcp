// --post: plates → a take. Reads <plates>/<slug>/take-NN, the episode's edit.json (for now: the shot list's order and timings),
// grade.json (a power grade from lib/post/grades plus overrides and per-shot blocks) and mix.json (for now: the spec's own audio),
// runs lib/post.js on the GPU for every frame, then mixes the sound with notebook/make.mjs --video. render.mjs then checks the take.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { serve, browse, takes, FPS } from './shoot.mjs';

const read = f => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? merge(a[k], v) : v; return o; };
export function gradeFor(studio, dir, SPEC, override) { const g = override || read(path.join(dir, 'grade.json')) || { powerGrade: SPEC.grade || 'neutral' }, pg = read(path.join(studio, 'conspiracy', 'lib', 'post', 'grades', (g.powerGrade || 'neutral') + '.json'));
  if (!pg) throw new Error('no power grade ' + g.powerGrade); const { shots, ...rest } = g; const base = merge(pg, rest); return { base, shot: id => merge(base, (shots || {})[id] || {}) }; }

export async function post({ studio, slug, dir, specFile, sceneFile, SPEC, platesRoot, take: takeArg, out, motionBlur, mixer = null, editOverride = null, gradeOverride = null, silentOnly = false }) {
  const T0 = Date.now(), base = path.join(platesRoot, slug), have = takes(base); if (!have.length) throw new Error(`no plates for ${slug} in ${base}; run --shoot first`);
  const takeName = takeArg ? `take-${String(takeArg).padStart(2, '0')}` : have.at(-1), takeDir = path.join(base, takeName), take = read(path.join(takeDir, 'take.json'));
  // the cut: the episode's edit.json if the editor wrote one, else every shot in shot-list order, whole
  const edit = editOverride || read(path.join(dir, 'edit.json')) || { from: 'shot list', cut: take.shots.map(s => ({ shot: s.id, in: 0, out: s.f1 - s.f0 })) }; if (!silentOnly) fs.writeFileSync(path.join(takeDir, 'edit.json'), JSON.stringify(edit, null, 1));
  const G = gradeFor(studio, dir, SPEC, gradeOverride); if (!silentOnly) fs.writeFileSync(path.join(takeDir, 'grade.json'), JSON.stringify(G.base, null, 1));
  const { server, port } = serve(studio, platesRoot), { browser, page } = await browse(`http://localhost:${port}/studio/lib/post/post.html`, 1080, 1920);
  await page.evaluate(i => window.POST.init(i), take.plate);
  const silent = out.replace(/\.mp4$/, '') + '.picture.mp4';
  const enc = spawn(ffmpegPath, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(SPEC.crf ?? 18), '-preset', 'medium', '-force_key_frames', `expr:eq(n,0)+eq(n,${take.frames - 1})`, '-x264-params', 'mbtree=0', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  // the loop: the last frame reuses frame 0's film layer (grain, weave, dust, flicker) so the seam matches
  // the film layer's loop: the cut's last frame (not the take's: an edit may be shorter) reuses frame 0's seed
  const total = edit.cut.reduce((a, c) => a + c.out - c.in, 0);
  let g = 0; const ms = { load: 0, upload: 0, gpu: 0, grab: 0 };
  for (const c of edit.cut) { const meta = read(path.join(takeDir, c.shot, 'shot.json')); if (!meta) throw new Error('missing shot ' + c.shot + ' in ' + takeDir);
    await page.evaluate((m, gr) => window.POST.setShot(m, gr), { ...meta, frames: undefined, motionBlur: motionBlur || meta.motionBlur }, G.shot(c.shot));
    for (let n = c.in; n < c.out; n++) { const r = await page.evaluate((b, n, fm, gf) => window.POST.frame(b, n, fm, gf), `/plates/${slug}/${takeName}/${c.shot}`, n, meta.frames[n], g === total - 1 ? 0 : g); const tg = Date.now();
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 }); ms.grab += Date.now() - tg; for (const k of ['load', 'upload', 'gpu']) ms[k] += r[k];
      if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r)); if (g % 300 === 0) console.log(`post frame ${g}/${take.frames}`); g++; } }
  enc.stdin.end(); await new Promise(r => enc.on('close', r)); await browser.close(); server.close(); const T1 = Date.now();
  // sound: the mixer (mix.json, stereo, cache only) when the episode has one, else the spec's own audio path as before
  let mixed = null;
  // silentOnly: a picture-only pass (grade previews), kept as <out>.picture.mp4
  if (silentOnly) { fs.renameSync(silent, out); return { takeDir, take, timings: { post: (Date.now() - T0) / 1000 } }; }
  if (mixer) mixed = await mixer({ video: silent, out }); else { const r = spawnSync(process.execPath, [path.join(studio, 'notebook', 'make.mjs'), specFile, sceneFile, out, `--video=${silent}`], { cwd: studio, stdio: 'inherit' }); if (r.status) throw new Error('mix failed'); }
  fs.rmSync(silent, { force: true }); const T2 = Date.now();
  const per = Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, +(v / g).toFixed(1)])), timings = { post: (T1 - T0) / 1000, mix: (T2 - T1) / 1000, perFrameMs: per, frames: g };
  fs.writeFileSync(path.join(takeDir, 'post.json'), JSON.stringify({ out, timings, grade: G.base.name, motionBlur: motionBlur || null, mix: mixed }, null, 1));
  console.log(`POST ${g} frames in ${timings.post.toFixed(1)} s (per frame: load ${per.load} ms · upload ${per.upload} · gpu ${per.gpu} · grab ${per.grab}) · mix ${timings.mix.toFixed(1)} s`);
  return { takeDir, take, timings };
}
