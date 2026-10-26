// The renderer: spec (script + sound) + scene (three.js page) -> MP4. Run by the MCP server as a child process:
//   node src/render.mjs <episode dir> <out.mp4> [--stills=auto|1,2.5,...] [--draft] [--probe=<js>]
// --draft: no ElevenLabs calls; word timings are estimated from the text and the take is silent (for previews without a key).
// Prints 'frame f/N' while rendering (the job runner reads it for progress).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ffmpegPath as ffp, chromePath, ENGINE, THREE_BUILD } from './config.mjs';
import { speak as elevenSpeak, sfx, music } from './eleven.mjs';
const ffmpegPath = ffp();

const [epArg, outArg] = process.argv.slice(2).filter(a => !a.startsWith('--')), root = path.resolve(epArg);
const specFile = path.join(root, 'spec.js'), DRAFT = process.argv.includes('--draft');
// draft narration: ~2.6 words a second (scaled by settings.speed), so stills and silent previews line up roughly with the real voice
const draftSpeak = (text, voice, { settings } = {}) => { const k = 1 / ((settings && settings.speed) || 1); let t = 0;
  const words = text.split(/\s+/).filter(Boolean).map(w => { const d = (.16 + .045 * w.replace(/[^\w]/g, '').length) * k, s = t; t += d + (/[.,!?;:]$/.test(w) ? .22 * k : .02); return { w, s, e: s + d }; }); return { wav: null, words }; };
const speak = DRAFT ? draftSpeak : elevenSpeak;
const stills = (process.argv.find(a => a.startsWith('--stills=')) || '').slice(9);
const out = path.resolve(outArg), tmp = out.replace(/\.mp4$/, '') + '.parts'; fs.mkdirSync(tmp, { recursive: true });
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(specFile, 'utf8'), ctx); const SPEC = ctx.SPEC;
const FPS = 30, SR = 48000, [VW, VH] = SPEC.size || [1920, 1080];

// ---- 1. narration + timeline ----
const lines = {}, clipAt = {}; let cursor = 0;
const resolve = ([id, word, off = 0, nth = 0]) => {
  if (id === null) return word + off; if (clipAt[id] !== undefined) return clipAt[id] + (word === '$end' ? SPEC.clips.find(c => c.id === id).dur : 0) + off;
  const l = lines[id]; if (!word) return l.start + off; if (word === '$end') return l.start + l.dur + off;
  const hits = l.words.filter(w => w.w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(word)); return l.start + (hits[nth] || hits[0] || { s: 0 }).s + off;
};
// archival clips sit between narration lines: a clip's `at` refers to an earlier line, and a line can start `after` a clip
const placeClips = () => { for (const c of SPEC.clips || []) if (clipAt[c.id] === undefined) { try { clipAt[c.id] = resolve(c.at); } catch { } } };
for (const l of SPEC.lines) {
  const r = await speak(l.text, l.voice || SPEC.voice, { model: l.model || SPEC.model, settings: l.settings || SPEC.settings || null });
  // a line can have its own voice and an ffmpeg audio filter (l.fx); word timings are rescaled to the processed length
  if (l.fx && r.wav) { const fxWav = r.wav.replace(/\.wav$/, '.' + crypto.createHash('sha1').update(l.fx).digest('hex').slice(0, 10) + '.wav');
    if (!fs.existsSync(fxWav)) spawnSync(ffmpegPath, ['-v', 'error', '-y', '-i', r.wav, '-af', l.fx, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', fxWav]);
    const len = f => (fs.statSync(f).size - 44) / 88200, k = len(fxWav) / len(r.wav); r.words = r.words.map(w => ({ ...w, s: w.s * k, e: w.e * k })); r.wav = fxWav; }
  const dur = r.words.at(-1).e;
  placeClips(); for (const c of SPEC.clips || []) if (clipAt[c.id] !== undefined && !c.overlay) cursor = Math.max(cursor, clipAt[c.id] + c.dur);   // narration waits for a clip unless it plays underneath
  const start = l.at ?? (l.after ? resolve([l.after, '$end']) : cursor) + (l.gap ?? .4);
  lines[l.id] = { start, dur, wav: r.wav, words: r.words.map(w => ({ w: w.w, s: w.s, e: w.e })) }; cursor = Math.max(cursor, start + dur);
}
placeClips();
for (const c of SPEC.clips || []) cursor = Math.max(cursor, clipAt[c.id] + c.dur);
const END = cursor + (SPEC.tail ?? 2);
const TL = { end: END, lines: Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, { start: v.start, dur: v.dur, words: v.words }])),
  clips: (SPEC.clips || []).map(c => ({ ...c, start: clipAt[c.id] })) };
console.log('length', END.toFixed(2) + 's', Object.entries(lines).map(([k, v]) => `${k}@${v.start.toFixed(2)}`).join(' '));

// ---- 2. frames ----
// the page server: /engine/* = the engines, /three/* = three.js, /ep/* = this episode's folder
const MOUNTS = [['/engine/', ENGINE], ['/three/', THREE_BUILD], ['/ep/', root]];
const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]), m = MOUNTS.find(([p]) => u.startsWith(p)), base = m && m[1], f = m ? path.join(base, u.slice(m[0].length)) : ''; if (!m || !f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const url = `http://localhost:${server.address().port}/ep/index.html`, exe = chromePath();
if (!exe) { console.log('NO CHROME: install Google Chrome (or Chromium/Edge), or set CHROME_PATH'); process.exit(2); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, protocolTimeout: 1800000, args: ['--force-color-profile=srgb', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])] });
const page = await browser.newPage(); await page.setViewport({ width: VW, height: VH });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(url); await page.waitForFunction('window.ready === true', { timeout: 120000 }).catch(() => {});
if (errs.length) { console.log('PAGE ERRORS:\n' + errs.join('\n')); process.exit(1); }
await page.evaluate(tl => window.setTL(tl), TL);
if (stills) { for (const f of fs.readdirSync(tmp)) if (f.startsWith('s-')) fs.rmSync(path.join(tmp, f));
  const ts = stills === 'auto' ? Array.from({ length: 30 }, (_, i) => +(i * END / 29).toFixed(2)) : stills.split(',').map(Number);   // auto: 30 evenly spaced frames, first and last included
  const probe = (process.argv.find(a => a.startsWith('--probe=')) || '').slice(8);   // debug: evaluate a JS expression after each still's seek
  for (const t of ts) { await page.evaluate(x => window.seek(x), t); if (probe) console.log('probe', t, JSON.stringify(await page.evaluate(probe))); await page.screenshot({ path: path.join(tmp, `s-${String(Math.round(t * 100)).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 85 }); }
  const miss = await page.evaluate(() => window.MISSING ? [...window.MISSING] : []); if (miss.length) console.log('MISSING WORDS (scene refers to words the narration does not contain):', miss.join(', '));
  await browser.close(); server.close();
  spawnSync(ffmpegPath, ['-v', 'error', '-y', '-pattern_type', 'glob', '-framerate', '1', '-i', path.join(tmp, 's-*.jpg'), '-vf', `scale=${VW > VH ? '640:360' : '360:640'},tile=${VW > VH ? 3 : 5}x${Math.ceil(ts.length / (VW > VH ? 3 : 5))}:padding=6:color=white`, '-frames:v', '1', out.replace(/\.mp4$/, '-stills.jpg')]);
  console.log('stills →', out.replace(/\.mp4$/, '-stills.jpg'), errs.join('\n')); process.exit(0);
}
const silent = DRAFT ? out : path.join(tmp, 'video.mp4'), N = Math.round(END * FPS);
const enc = spawn(ffmpegPath, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(SPEC.crf ?? 16), '-preset', 'medium', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < N; f++) { await page.evaluate(t => window.seek(t), f / FPS); const buf = await page.screenshot({ type: 'jpeg', quality: 95 }); if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r)); if (f % 150 === 0) console.log(`frame ${f}/${N}`); }
enc.stdin.end(); await new Promise(r => enc.on('close', r));
const miss = await page.evaluate(() => window.MISSING ? [...window.MISSING] : []); if (miss.length) console.log('MISSING WORDS:', miss.join(', '));
await browser.close(); server.close();
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 5).join('\n'));
if (DRAFT) { fs.rmSync(tmp, { recursive: true, force: true }); console.log('wrote (draft, silent)', out); process.exit(0); }

// ---- 3. audio ----
const decode = f => { const r = spawnSync(ffmpegPath, ['-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 }); return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4); };
const FOLD = SPEC.loop ? (SPEC.loop.fold ?? 2.5) : 0, NS = Math.ceil(END * SR), L = Math.ceil((END + FOLD) * SR), mix = new Float32Array(L), vox = new Float32Array(L);
const add = (dst, s, t, g) => { const a = Math.round(t * SR); for (let i = 0; i < s.length && a + i < L; i++) if (a + i >= 0) dst[a + i] += s[i] * g; };
Object.values(lines).forEach(l => add(vox, decode(l.wav), l.start, SPEC.voxGain ?? 1));
// archival clip audio rides with the voice (the music ducks under it); short fades avoid clicks at the cuts
for (const c of TL.clips) if (c.audio) { const a = decode(path.join(root, SPEC.clipDir, c.id + '.wav')), n = Math.min(a.length, Math.round(c.dur * SR)), fi = SR * (c.fadeIn ?? .04), fo = SR * (c.fadeOut ?? .08);
  for (let i = 0; i < n; i++) a[i] *= Math.min(1, i / fi, (n - i) / fo); add(vox, a.subarray(0, n), c.start, c.audio); }
const fx = {}; for (const [k, [p, d]] of Object.entries(SPEC.sfx || {})) fx[k] = await sfx(p, { duration: d });
// the voice envelope (0..1, fast attack, slow release): music, beds and (with SPEC.sfxDuck) sound effects all duck under it
const env = new Float32Array(L); { let e = 0; for (let i = 0; i < L; i++) { const tgt = Math.abs(vox[i]) > .01 ? 1 : 0; e += (tgt - e) * (tgt > e ? .004 : .00008); env[i] = e; } }
const sd = SPEC.sfxDuck ?? 0; (SPEC.cues || []).forEach(([k, ref, g]) => { const a = decode(fx[k]), t0 = Math.round(resolve(ref) * SR); for (let i = 0; i < a.length && t0 + i < L; i++) if (t0 + i >= 0) mix[t0 + i] += a[i] * g * (1 - sd * env[t0 + i]); });
const stingAt = SPEC.sting ? resolve(SPEC.sting.at) : END;
if (SPEC.sting) add(mix, decode(await music(SPEC.sting.prompt, SPEC.sting.seconds)), stingAt, SPEC.sting.gain);
if (SPEC.music) {
  const m = decode(await music(SPEC.music.prompt, Math.ceil(SPEC.loop ? END + FOLD : stingAt) + 2)); let e = 0;
  for (let i = 0; i < L; i++) { const tgt = Math.abs(vox[i]) > .01 ? 1 : 0; e += (tgt - e) * (tgt > e ? .004 : .00008); const t = i / SR, fade = SPEC.loop ? 1 : Math.min(1, t / .8, (stingAt + .3 - t) / 1.2); mix[i] += (m[i] || 0) * (SPEC.music.gain - SPEC.music.duck * e) * Math.max(0, fade); }
}
// extra music beds that start/stop at cue points (e.g. the jig that kicks in on "more music")
for (const b of SPEC.beds || []) {
  const m = decode(await music(b.prompt, b.seconds)), t0 = resolve(b.at), t1 = b.until ? resolve(b.until) : END; let e = 0;
  for (let i = Math.max(0, Math.round(t0 * SR)); i < L; i++) { const t = i / SR, k = i - Math.round(t0 * SR); if (k >= m.length) break; const tgt = Math.abs(vox[i]) > .01 ? 1 : 0; e += (tgt - e) * (tgt > e ? .004 : .00008); const fade = Math.min(1, (t - t0) / (b.fadeIn ?? .3), (t1 - t) / (b.fadeOut ?? 1)); if (fade <= 0 && t > t1) break; mix[i] += m[k] * (b.gain - (b.duck ?? 0) * e) * Math.max(0, fade); }
}
// seamless loop: whatever plays past the end (music tail, reverb) is crossfaded onto the first seconds,
// so the last sample flows straight into the first one when the video repeats
if (FOLD) { const F = Math.round(FOLD * SR); for (let i = 0; i < F; i++) { const w = i / F, a = Math.sin(w * Math.PI / 2), b = Math.cos(w * Math.PI / 2); mix[i] = mix[i] * a + (mix[NS + i] || 0) * b; } }
const out32 = mix.subarray(0, NS); for (let i = 0; i < NS; i++) out32[i] += vox[i];
const raw = path.join(tmp, 'mix.f32'); fs.writeFileSync(raw, Buffer.from(out32.buffer, out32.byteOffset, NS * 4));
const loud = spawnSync(ffmpegPath, ['-v', 'info', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
const j = JSON.parse(loud.stderr.slice(loud.stderr.lastIndexOf('{')));
const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000,aformat=channel_layouts=stereo`;
const r = spawnSync(ffmpegPath, ['-v', 'error', '-y', '-i', silent, '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', raw, '-af', ln, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
if (r.status) throw new Error(String(r.stderr));
fs.rmSync(tmp, { recursive: true, force: true }); console.log('wrote', out);
