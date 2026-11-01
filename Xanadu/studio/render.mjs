// Conspiracy Theories renderer.
//   node studio/render.mjs <slug> --voice              generate narration + sound effects, print each line's words (cheap; cached)
//   node studio/render.mjs <slug> --stills[=auto|t,..]  contact sheet of preview frames → episodes/<slug>/stills.jpg
//   node studio/render.mjs <slug> --final [--no-open]   full render → ~/Desktop/Studio/Episode Files/<series dir>/NN - Title/takes/<Title> - Take NN.mp4 (+ thumbnail),
//                                                           then verify length, loudness and the loop seam, and open it (series dirs: lib/paths.mjs)
//   node studio/render.mjs <slug> --pick=N               copy take N to "<Title> - FINAL.mp4" (the one to upload), then refresh ~/Desktop/Videos/<channel>/
// Scenes on the cinema camera (lib/camera.js + lib/lights.js) shoot raw plates first, then post them into a take:
//   node studio/render.mjs <slug> --shoot [--shot=ID --take=N] [--subframes=N] [--strict]   raw plates → /Volumes/T7 footage/plates/<slug>/take-NN/
//   node studio/render.mjs <slug> --post [--take=N] [--mb=post] [--no-open]                   plates → the next take, checked like --final, opened
// Test scenes live in studio/tests/<slug>/ and render the same way.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const here = path.dirname(fileURLToPath(import.meta.url)), studio = path.resolve(here, '..');
import { TEMP } from './lib/paths.mjs';
// all disposable output (stills, previews, scratch) goes to <root>/Temp, never the Mac; tools/sweep-temp.mjs empties it
fs.mkdirSync(path.join(TEMP, 'tmp'), { recursive: true }); process.env.TMPDIR = path.join(TEMP, 'tmp');
const args = process.argv.slice(2), slug = args.find(a => !a.startsWith('--')), flag = n => args.find(a => a === n || a.startsWith(n + '='));
if (!slug) { console.log('usage: node studio/render.mjs <slug> --voice | --stills[=auto|t1,t2] | --final [--no-open] | --pick=N'); process.exit(1); }
const dir = [path.join(here, 'episodes', slug), path.join(here, 'tests', slug)].find(d => fs.existsSync(path.join(d, 'spec.js'))) || path.join(here, 'episodes', slug), specFile = path.join(dir, 'spec.js'), scene = path.join(dir, 'index.html');
if (!fs.existsSync(specFile)) { console.log('no episode at', dir, '— create it with: node studio/new-episode.mjs', slug, '"Title" year'); process.exit(1); }
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(specFile, 'utf8'), ctx); const SPEC = ctx.SPEC, meta = SPEC.meta;
// originals live in the episode library (Studio/Episode Files); only upload copies go to ~/Desktop/Videos (upnext.mjs)
const { macDir, t7Of } = await import('./lib/paths.mjs'), series = meta.series || 'Conspiracy Theories';
const folder = path.join(macDir(series), `${String(meta.n).padStart(2, '0')} - ${meta.title}${meta.year ? ` (${meta.year})` : ''}`);
const name = meta.title + (meta.cut ? ` - ${meta.cut}` : '');   // meta.cut: an alternate version of an episode (e.g. 'PS1') saved beside the original
const make = (...a) => { const r = spawnSync(process.execPath, [path.join(studio, 'notebook', 'make.mjs'), specFile, scene, ...a], { cwd: studio, stdio: 'inherit' }); if (r.status) process.exit(r.status || 1); };
const ff = a => spawnSync(ffmpegPath, a, { encoding: 'utf8', maxBuffer: 1 << 28 });

if (flag('--voice')) {
  const { speak, sfx } = await import(path.join(studio, 'eleven.mjs'));
  let total = 0;
  for (const l of SPEC.lines) { const r = await speak(l.text, l.voice || SPEC.voice, { model: l.model || SPEC.model, settings: l.settings || SPEC.settings || null }), d = r.words.at(-1).e; total += d + (l.gap ?? .4);
    console.log(`${l.id.padEnd(4)} ${d.toFixed(2)}s  ${r.words.map(w => w.w.toLowerCase().replace(/[^a-z0-9'-]/g, '')).join(' ')}`); }
  for (const [, [p, d]] of Object.entries(SPEC.sfx || {})) await sfx(p, { duration: d });   // one at a time: gentler on the API and on slow connections
  console.log(`≈ ${(total + (SPEC.tail ?? 1.2)).toFixed(1)}s of narration; ${Object.keys(SPEC.sfx || {}).length} sound effects ready`);
}
if (flag('--stills')) {
  const tdir = path.join(TEMP, 'stills', slug); fs.mkdirSync(tdir, { recursive: true });
  const v = flag('--stills').split('=')[1] || 'auto', out = path.join(tdir, 'preview.mp4');
  make(out, `--stills=${v}`, ...args.filter(a => a.startsWith("--probe=")));
  fs.renameSync(path.join(tdir, 'preview-stills.jpg'), path.join(tdir, 'stills.jpg')); fs.rmSync(path.join(tdir, 'preview.parts'), { recursive: true, force: true });
  console.log('STILLS →', path.join(tdir, 'stills.jpg'));
}
// every render is a numbered take in <episode>/takes/; the newest take's first frame (the cover) becomes the thumbnail. Nothing is called
// FINAL until the user picks a take: --pick=N copies take N to "<name> - FINAL.mp4".
const nextTake = () => { const takes = path.join(folder, 'takes'); fs.mkdirSync(takes, { recursive: true });
  // the next number after the highest take on the Mac or in the T7 mirror (old takes get moved to the T7, so counting files would reuse a number)
  const t7 = t7Of(series, takes), num = d => fs.existsSync(d) ? fs.readdirSync(d).map(f => f.startsWith(`${name} - Take `) && f.endsWith('.mp4') ? parseInt(f.slice(name.length + 8)) : 0) : [];
  const n = Math.max(0, ...num(takes), ...num(t7)) + 1; return { n, out: path.join(takes, `${name} - Take ${String(n).padStart(2, '0')}.mp4`) }; };
const opt = n => (flag(n) || '').split('=')[1];
if (flag('--shoot')) {
  const { shoot, PLATE_ROOT } = await import('./lib/shoot.mjs');
  await shoot({ studio, slug, dir, specFile, sceneFile: scene, platesRoot: PLATE_ROOT, take: opt('--take'), shot: opt('--shot'), subframes: +(opt('--subframes') || 0) || undefined, strict: !!flag('--strict') });
}
// Phase 5: the editor (--edit → edit.json), the mixer's plan (--plan-mix → mix.json) and the mixer itself (--post --mix). All cache only:
// the narration timeline is read only when every line is already in the ElevenLabs cache.
const timelineOf = async () => { const { voiceFile } = await import('./lib/mixer.mjs'), { MODEL } = await import(path.join(studio, 'eleven.mjs'));
  const miss = (SPEC.lines || []).filter(l => !fs.existsSync(voiceFile(l.text, l.voice || SPEC.voice, l.model || SPEC.model || MODEL, l.settings || SPEC.settings || null)));
  if (miss.length) { console.log('NOT CACHED (the mixer never generates): ' + miss.map(l => l.id).join(', ') + ' — run --voice first if new narration is wanted'); process.exit(1); }
  const f = path.join(os.tmpdir(), `tl-${slug}-${process.pid}.json`); make(f, `--timeline=${f}`); const tl = JSON.parse(fs.readFileSync(f, 'utf8')); fs.rmSync(f, { force: true }); return tl; };
const scanPlan = async (tl, write) => { const { plan } = await import('./lib/mixer.mjs'), r = await plan({ studio, dir, sceneFile: scene, SPEC, END: tl.end, timeline: tl });
  fs.writeFileSync(path.join(dir, 'sound-scan.json'), JSON.stringify(r.scan)); if (write) { fs.writeFileSync(path.join(dir, 'mix.json'), JSON.stringify(r.mix, null, 1)); console.log(`MIX PLAN → ${path.join(dir, 'mix.json')}: ${r.mix.foley.length} foley, ${r.mix.engines.length} engines, ${r.mix.beds.length} beds (${r.mix.timeOfDay})`); } return r; };
if (flag('--plan-mix')) { const tl = await timelineOf(); await scanPlan(tl, true); }
if (flag('--edit')) { const { cut } = await import('./lib/editor.mjs'), { plateRootFor, takes } = await import('./lib/shoot.mjs'), root = plateRootFor(slug, opt('--take')), base = path.join(root, slug), tk = opt('--take') ? `take-${String(opt('--take')).padStart(2, '0')}` : takes(base).at(-1);
  const take = JSON.parse(fs.readFileSync(path.join(base, tk, 'take.json'), 'utf8')), tl = await timelineOf(), sf = path.join(dir, 'sound-scan.json'), scan = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : (await scanPlan(tl, !fs.existsSync(path.join(dir, 'mix.json')))).scan;
  const e = cut({ take, timeline: tl, SPEC, scan, episode: series !== 'Studio Tests' }); fs.writeFileSync(path.join(dir, 'edit.json'), JSON.stringify(e, null, 1));
  console.log(`EDIT → ${path.join(dir, 'edit.json')}: ${e.cut.length} pieces, ${e.length} s, cuts on action ${e.cuts.filter(c => c.on === 'action').length} · on word gaps ${e.cuts.filter(c => c.on === 'word gap').length} · as shot ${e.cuts.filter(c => c.on === 'as shot').length}${e.checks.length ? '\n  checks: ' + e.checks.join(' | ') : ''}`); }
// --grade-preview=<power grade>[,<another>...]: the colorist's quick look: the middle frame of every shot, graded, as a contact sheet per grade
// (no audio, nothing archived) → <dir>/grade-preview-<name>.jpg. With no name it uses the episode's grade.json.
if (flag('--grade-preview')) { const { post } = await import('./lib/post-run.mjs'), { plateRootFor, takes } = await import('./lib/shoot.mjs'), root = plateRootFor(slug, opt('--take')), base = path.join(root, slug), tk = opt('--take') ? `take-${String(opt('--take')).padStart(2, '0')}` : takes(base).at(-1);
  const take = JSON.parse(fs.readFileSync(path.join(base, tk, 'take.json'), 'utf8')), names = (opt('--grade-preview') || '').split(',').filter(Boolean), gfile = path.join(dir, 'grade.json'), own = fs.existsSync(gfile) ? JSON.parse(fs.readFileSync(gfile, 'utf8')) : null;
  const edit = { from: 'grade preview', cut: take.shots.map(s => { const m = Math.floor((s.f1 - s.f0) / 2); return { shot: s.id, in: m, out: m + 1 }; }) };
  for (const g of names.length ? names : [null]) { const tmpv = path.join(os.tmpdir(), `gp-${slug}-${g || 'own'}.mp4`), grade = g ? { ...(own || {}), powerGrade: g, shots: (own || {}).shots } : own;
    await post({ studio, slug, dir, specFile, sceneFile: scene, SPEC, platesRoot: root, take: tk.slice(5), out: tmpv, editOverride: edit, gradeOverride: grade, silentOnly: true });
    const sheet = path.join(dir, `grade-preview-${g || 'own'}.jpg`), cols = Math.min(8, edit.cut.length); ff(['-v', 'error', '-y', '-i', tmpv, '-vf', `scale=216:384,tile=${cols}x${Math.ceil(edit.cut.length / cols)}:padding=4:color=white`, '-frames:v', '1', sheet]); fs.rmSync(tmpv, { force: true }); console.log('GRADE PREVIEW →', sheet); } }
if (flag('--post')) {
  const { post } = await import('./lib/post-run.mjs'), { plateRootFor, archive } = await import('./lib/shoot.mjs'), { n, out } = nextTake();
  // --mix (or a mix.json beside the spec): the Phase 5 mixer; it plans mix.json first if there is none
  // a mix plan older than the spec misses its new cues, music and gains: say so loudly (re-plan with --plan-mix, after saving any hand edits)
  if (fs.existsSync(path.join(dir, 'mix.json')) && fs.statSync(path.join(dir, 'mix.json')).mtimeMs < fs.statSync(specFile).mtimeMs) console.log('WARNING: mix.json is older than spec.js, so the spec\'s latest cues, music and gains are NOT in this mix. Re-plan with --plan-mix.');
  // the mixer always runs on a cinema-camera post (it plans mix.json from the sound scan when there is none); --no-mix keeps the old engine's audio
  let mixer = null; if (!flag('--no-mix')) { const tl = await timelineOf(); if (!fs.existsSync(path.join(dir, 'mix.json'))) await scanPlan(tl, true); const { mixdown } = await import('./lib/mixer.mjs'), mix = JSON.parse(fs.readFileSync(path.join(dir, 'mix.json'), 'utf8'));
    mixer = ({ video, out }) => mixdown({ dir, SPEC, mix, timeline: tl, END: tl.end, video, out }); }
  const r = await post({ studio, slug, dir, specFile, sceneFile: scene, SPEC, platesRoot: plateRootFor(slug, opt('--take')), take: opt('--take'), out, motionBlur: opt('--mb'), mixer });
  verify(n, out);
  const prev = path.join(folder, 'previews'); fs.mkdirSync(prev, { recursive: true }); const p720 = path.join(prev, `${name} - Take ${String(n).padStart(2, '0')} (720p).mp4`);
  ff(['-v', 'error', '-y', '-i', out, '-vf', 'scale=720:1280:flags=neighbor', '-c:v', 'libx264', '-crf', '28', '-maxrate', '3M', '-bufsize', '6M', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', p720]); console.log('  720p preview →', p720);
  fs.appendFileSync(path.join(r.takeDir, 'production.log'), `${new Date().toISOString()} take ${n} ← ${path.basename(r.takeDir)} · shoot ${r.take.timings.total.toFixed(1)} s · post ${r.timings.post.toFixed(1)} s · mix ${r.timings.mix.toFixed(1)} s · plates ${(r.take.bytes / 1048576).toFixed(0)} MB · ${out}\n`);
  if (!flag('--no-open')) spawnSync('open', [out]);
  archive(slug, r.takeDir);   // plates to the T7, then free the SSD if it is short of space
}
if (flag('--final')) {
  const { n, out } = nextTake();
  make(out);
  verify(n, out);
  if (!flag('--no-open')) spawnSync('open', [out]);
}
function verify(n, out) {
  // verify: length, loudness, loop seam (first vs last frame), the thumbnail, and a contact sheet for a final look
  const dur = /Duration: ([\d:.]+)/.exec(ff(['-i', out]).stderr)?.[1];
  const eb = ff(['-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr, lufs = [...eb.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)?.[1], tpk = [...eb.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].at(-1)?.[1];
  const a = path.join(dir, 'first.png'), b = path.join(dir, 'last.png');
  ff(['-v', 'error', '-y', '-i', out, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', a]); ff(['-v', 'error', '-y', '-sseof', '-0.04', '-i', out, '-frames:v', '1', b]);
  const ssim = /All:([\d.]+)/.exec(ff(['-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-']).stderr)?.[1];
  // the same comparison with the film grain blurred away: grain is re-noised by the encoder on every frame, so the raw score undersells a film-look seam
  const ssimPic = /All:([\d.]+)/.exec(ff(['-i', a, '-i', b, '-lavfi', '[0]gblur=sigma=3[x];[1]gblur=sigma=3[y];[x][y]ssim', '-f', 'null', '-']).stderr)?.[1]; fs.rmSync(a, { force: true }); fs.rmSync(b, { force: true });
  // the episode's thumbnail belongs to its FINAL once one is picked; a new take's cover goes beside its preview instead
  const thumb = fs.existsSync(path.join(folder, `${name} - FINAL.mp4`)) ? path.join(folder, 'previews', `${name} - Take ${String(n).padStart(2, '0')} - Thumbnail.jpg`) : path.join(folder, `${name} - Thumbnail.jpg`); fs.mkdirSync(path.dirname(thumb), { recursive: true }); ff(['-v', 'error', '-y', '-i', out, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', thumb]);
  ff(['-v', 'error', '-y', '-i', out, '-vf', 'fps=1/3,scale=216:384,tile=8x3:padding=4:color=white', '-frames:v', '1', path.join(dir, 'contact.jpg')]);
  console.log(`\nTAKE ${n} → ${out}\n  length ${dur} · loudness ${lufs} LUFS (target -14), true peak ${tpk} dBTP (under -1) · loop seam SSIM ${ssim} (≥ 0.95 = seamless; without grain ${ssimPic})\n  thumbnail → ${thumb}\n  contact sheet → ${path.join(dir, 'contact.jpg')}\n  happy with it?  node studio/render.mjs ${slug} --pick=${n}   marks it as the FINAL`);
  return { dur, lufs, ssim, ssimPic };
}
if (flag('--pick')) {
  const n = +flag('--pick').split('=')[1], src = path.join(folder, 'takes', `${name} - Take ${String(n).padStart(2, '0')}.mp4`), dst = path.join(folder, `${name} - FINAL.mp4`);
  if (!fs.existsSync(src)) { console.log('no such take:', src); process.exit(1); }
  fs.copyFileSync(src, dst); ff(['-v', 'error', '-y', '-i', dst, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', path.join(folder, `${name} - Thumbnail.jpg`)]); console.log(`FINAL ← take ${n}\n  ${dst}`);
}
// a new FINAL or take refreshes the upload folders (~/Desktop/Videos/<channel>/); test scenes don't post
if ((flag('--pick') || flag('--post') || flag('--final')) && !dir.includes(`${path.sep}tests${path.sep}`)) (await import('./upnext.mjs')).refresh({ quiet: true });
