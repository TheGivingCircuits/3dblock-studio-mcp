// THE MIXER (Phase 5): the sound engineer's mix.json, planned from the picture and mixed in stereo, from the ElevenLabs cache only.
//   plan(...)  scans the scene (lib/sound-scan.js: foot plants, doors, engines, physics impacts, blood hits, emitters, the camera's space) and
//              writes mix.json: narration on top, foley on every event with its pan, distance and muffling, ambience beds per space and time of
//              day with J/L cuts at the scene changes, reverb per room, music cues, and the TikTok song slot (a timestamp, never mixed in).
//   mixdown(...) renders mix.json: narration dry and centred, everything else ducked under it, foley panned by screen position, reverb per
//              space, muffling through walls, the loop's tail folded into its head, -14 LUFS integrated, true peak under -1 dB, muxed onto the picture.
// Cache only: every narration line, sound and music cue must already be in ~/Desktop/Studio/Support/eleven-cache (lib/sfx-index.json
// lists the sounds). Anything missing is reported and left out; nothing is ever generated here.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process'; import ffmpegPath from 'ffmpeg-static';
import { CACHE, MODEL } from '../../eleven.mjs';
import { serve, browse } from './shoot.mjs';
const SR = 48000, hash = (...p) => crypto.createHash('sha1').update(p.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('|')).digest('hex');
const sfxFile = (prompt, duration = null, influence = .5) => path.join(CACHE, 'sfx-' + hash('sfx', prompt, duration, influence) + '.wav');
const musicFile = (prompt, seconds) => path.join(CACHE, 'music-' + hash('music', prompt, seconds) + '.wav');
export const voiceFile = (text, voice, model = MODEL, settings = null) => path.join(CACHE, hash('tts', voice, model, text, settings || {}) + '.wav');
const decodeFx = (f, fx, rate = SR) => { const r = spawnSync(ffmpegPath, ['-v', 'error', '-i', f, '-af', fx, '-f', 'f32le', '-ac', '1', '-ar', String(rate), '-'], { maxBuffer: 1 << 30 }); return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length)); };
const decode = (f, rate = SR) => { const r = spawnSync(ffmpegPath, ['-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', String(rate), '-'], { maxBuffer: 1 << 30 }); return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length)); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), h1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- the sound library: what each kind of event sounds like, as cached prompts [prompt, duration]
export const LIB = {
  step: { hard: ['footsteps on a wooden staircase descending into a cellar, echoing', 3], soft: ['footsteps on a wooden staircase descending into a cellar, echoing', 3], outdoor: ['footsteps crunching through dry leaves and twigs in a forest', 3], run: ['a woman running through dry brush at night, panicked breathing', 2.2] },
  impact: { plastic: ['a plastic DVD keep case snapping shut, one crisp firm click', .7], ceramic: ['small stones being stacked and settling', 1.6], glass: ['small stones being stacked and settling', 1.6], metal: ['a hammer tapping weakly on a wooden table, three slow taps', 1.6],
    wood: ['one heavy dull thud, low and muffled', .8], heavy: ['one heavy dull thud, low and muffled', .8], soft: ['one heavy dull thud, low and muffled', .8], paper: ['a paper map being unfolded and crumpled', 1.6], bone: ['small stones being stacked and settling', 1.6],
    rubber: ['one heavy dull thud, low and muffled', .8], bounce: ['one heavy dull thud, low and muffled', .8], cardboard: ['one heavy dull thud, low and muffled', .8], chainsaw: ['one heavy dull thud, low and muffled', .8], thud: ['one heavy dull thud, low and muffled', .8] },
  door: ['an old wooden door creaking open in a derelict house', 2], carDoor: ['a muffled thump and a car door slamming shut at night', 1.2], busDoor: ['a heavy steel sliding door rolling fast on a rusty track and banging open', 1.4], fridge: ['a wooden closet door being yanked open and wire hangers rattling', 1.4],
  hit: ['one heavy dull thud, low and muffled', .8],
  engine: { van: ['an old 1970s van driving on a country road, steady engine rumble, rattling panels, wind', 4], pickup: ['an old pickup truck racing past and speeding away on a country road', 3], bus: ['an old rusty truck engine roaring and revving very close behind, rattling metal', 3],
    sedan: ['a car driving on an empty country highway, steady engine hum, road noise and wind', 4], wagon: ['a car driving on an empty country highway, steady engine hum, road noise and wind', 4], police: ['a car driving on an empty country highway, steady engine hum, road noise and wind', 4],
    motorbike: ['a car driving on an empty country highway, steady engine hum, road noise and wind', 4] },
  emit: { chainsaw: ['a chainsaw roaring and revving wildly up and down, close, in an open field', 4] },
  bed: { day: { outdoor: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4], indoor: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4] },
    dusk: { outdoor: ['crickets and a warm evening wind over a dry farm at dusk', 3.5], indoor: ['crickets and a warm evening wind over a dry farm at dusk', 3.5] },
    night: { outdoor: ['crickets and night insects in an empty field under the moon', 4], indoor: ['crickets and night insects in an empty field under the moon', 4] }, dawn: { outdoor: ['early morning birds on an empty country road at dawn, light wind', 3.5], indoor: ['early morning birds chirping softly after rain', 3] } } };
// rooms: [comb delays ms, feedback, wet]
const REVERB = { outdoor: [[118], .18, .07], small: [[29.7, 37.1, 41.1, 43.7], .55, .13], tiled: [[31, 37.9, 43.3, 47.5], .7, .2], medium: [[41, 47, 53, 59], .66, .17], cellar: [[49, 61, 67, 73], .78, .28], wooden: [[33, 39, 45, 51], .6, .15] };
const SOFT = new Set(['carpet']), HARD = new Set(['tile', 'concrete', 'wood']);

// ---- plan: scan the scene and write mix.json (the sound engineer edits it by hand afterwards if a beat wants something else)
export async function plan({ studio, dir, sceneFile, SPEC, END, edit, timeline = null, fps = 60 }) {
  const { server, port } = serve(studio, studio), { browser, page } = await browse(`http://localhost:${port}/${path.relative(studio, sceneFile)}`, 360, 640);
  // scenes that hang on the narration's word times need the timeline, as the shoot gives them
  if (timeline) await page.evaluate(tl => window.setTL(tl), timeline);
  await page.addScriptTag({ url: '/studio/lib/sound-scan.js' }); const scan = await page.evaluate((a, b, f) => window.SOUNDSCAN(a, b, f), 0, END, fps);
  const sky = await page.evaluate(() => { const L = window.LIGHTS; return L && L.U && L.U.sunDir ? L.U.sunDir.value.y : 1; }); await browser.close(); server.close();
  const tod = SPEC.mix && SPEC.mix.timeOfDay || (sky > .25 ? 'day' : sky > .02 ? 'dusk' : 'night'), foley = [], beds = [], P = { voxGain: SPEC.voxGain ?? 1, sfxDuck: .45, bedDuck: .6, musicDuck: .7, loudness: { I: -14, TP: -1 }, timeOfDay: tod };
  for (const e of scan.events) { const g = clamp(1 / (1 + Math.max(0, e.dist - 1.5) / 4), .08, 1), base = { t: e.t, pan: +e.pan.toFixed(2), muffle: e.muffle, space: e.space, why: '' };
    if (e.kind === 'step') foley.push({ ...base, sound: e.run ? LIB.step.run : HARD.has(e.surface) ? LIB.step.hard : SOFT.has(e.surface) ? LIB.step.soft : LIB.step.outdoor, grain: true, gain: +(g * (e.run ? .55 : .42) * (SOFT.has(e.surface) ? .6 : 1)).toFixed(2), lowpass: SOFT.has(e.surface) ? 1800 : null, why: `${e.who} ${e.foot} foot on ${e.surface}` });
    else if (e.kind === 'impact') { const s = LIB.impact[e.material] || LIB.impact.thud; // a hard impact is a story beat (a dropped phone, a falling TV): louder, and only lightly ducked under the voice
      const hard = e.speed > 3; foley.push({ ...base, sound: s, grain: true, gain: +(g * clamp(e.speed / 4.5, .12, 1) ** 1.2 * (hard ? 1.5 : 1)).toFixed(2), duck: hard ? .15 : undefined, why: `${e.what} hits ${e.with} at ${e.speed} m/s` }); }
    else if (LIB[e.kind] && !Array.isArray(LIB[e.kind][0]) && typeof LIB[e.kind][0] === 'string') foley.push({ ...base, sound: LIB[e.kind], gain: +(g * (e.kind === 'door' ? .6 : .7)).toFixed(2), why: e.kind }); }
  // engines: one bed per vehicle, following its pan and distance sample by sample
  const engines = Object.values(scan.engines).filter(v => v.samples.length > 3).map(v => ({ sound: LIB.engine[v.kind] || LIB.engine.sedan, pitch: v.kind === 'motorbike' ? 1.45 : 1, kind: v.kind, samples: v.samples.filter((_, i) => i % 3 === 0).map(s => [s.t, +s.pan.toFixed(2), +clamp(1 / (1 + Math.max(0, s.dist - 3) / 9), .03, 1).toFixed(2), s.muffle ? 1 : 0, s.speed]) }));
  const emits = (scan.emits || []).map(e => ({ sound: LIB.emit[e.kind] || LIB.impact.thud, from: e.from, to: e.to, gain: .7 }));
  // ambience: a bed per run of shots in one space; J cut (the next bed starts .45 s early) and L cut (the last one lingers .3 s) at space changes
  const runs = []; for (const s of scan.shots) { const kind = s.space === 'outdoor' ? 'outdoor' : 'indoor'; if (!runs.length || runs.at(-1).space !== s.space) runs.push({ space: s.space, kind, from: s.t, reverb: s.reverb }); }
  runs.forEach((r, i) => { r.to = i + 1 < runs.length ? runs[i + 1].from : END; const b = LIB.bed[tod] || LIB.bed.day; beds.push({ sound: b[r.kind], from: +Math.max(0, r.from - (i ? .45 : 0)).toFixed(2), to: +Math.min(END, r.to + (i + 1 < runs.length ? .3 : 0)).toFixed(2), gain: r.kind === 'indoor' ? .3 : .32, muffle: r.kind === 'indoor', space: r.space, cut: i ? 'J' : null }); });
  const spaces = runs.map(r => ({ from: r.from, to: r.to, space: r.space, reverb: r.reverb }));
  // the score is cached at the length the old engine asked for (the loop's end plus the fold, plus 2 s), and SPEC.beds are music beds
  const FOLD0 = SPEC.loop ? (SPEC.loop.fold ?? 2.5) : 0, music = SPEC.music ? [{ prompt: SPEC.music.prompt, seconds: SPEC.music.seconds ?? Math.ceil(END + FOLD0) + 2, from: 0, gain: SPEC.music.gain ?? .2, duck: SPEC.music.duck }] : [];
  for (const b of SPEC.beds || []) music.push({ prompt: b.prompt, seconds: b.seconds, from: b.at, until: b.until, gain: b.gain ?? .3, duck: b.duck, fadeIn: b.fadeIn, fadeOut: b.fadeOut });
  const mix = { ...P, from: 'planned by lib/mixer.mjs from the sound scan; edit freely', foley, engines, emits, beds, spaces, music, cues: SPEC.cues || [], sfx: SPEC.sfx || {},
    tiktok: { start: +(SPEC.mix && SPEC.mix.tiktokAt || 2.0).toFixed(1), note: 'Add a trending song from TikTok\'s library in the app, starting here, about -18 dB under the narration. Never baked into the file.' } };
  return { mix, scan }; }

// ---- DSP helpers
const grains = (buf, n = 12) => { const W = Math.round(SR * .01), env = []; for (let i = 0; i + W < buf.length; i += W) { let s = 0; for (let k = 0; k < W; k++) s += buf[i + k] * buf[i + k]; env.push(Math.sqrt(s / W)); }
  const mx = Math.max(...env, 1e-6), peaks = []; for (let i = 1; i + 1 < env.length; i++) if (env[i] > mx * .3 && env[i] >= env[i - 1] && env[i] >= env[i + 1] && (!peaks.length || i - peaks.at(-1) > 12)) peaks.push(i);
  return (peaks.length ? peaks : [0]).slice(0, n).map(p => { const a = Math.max(0, p * W - Math.round(SR * .015)), len = Math.round(SR * .24), g = buf.slice(a, a + len); for (let i = 0; i < g.length; i++) g[i] *= Math.min(1, i / (SR * .003)) * Math.min(1, (g.length - i) / (SR * .09)); return g; }); };
const resample = (a, k) => { if (k === 1) return a; const n = Math.floor(a.length / k), o = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * k, j = Math.floor(x), f = x - j; o[i] = (a[j] || 0) * (1 - f) + (a[j + 1] || 0) * f; } return o; };
const lowpass = (a, hz) => { const o = new Float32Array(a.length), k = 1 - Math.exp(-2 * Math.PI * hz / SR); let y = 0; for (let i = 0; i < a.length; i++) { y += k * (a[i] - y); o[i] = y; } return o; };
const reverb = (a, [delays, fb, wet]) => { const o = new Float32Array(a.length); for (const d of delays) { const D = Math.round(d * SR / 1000), buf = new Float32Array(a.length); for (let i = 0; i < a.length; i++) { buf[i] = a[i] + (i >= D ? buf[i - D] * fb : 0); o[i] += buf[i] / delays.length; } }
  for (const ap of [5.0, 1.7]) { const D = Math.round(ap * SR / 1000), g = .5, x = o.slice(); for (let i = 0; i < o.length; i++) o[i] = -g * x[i] + (i >= D ? x[i - D] + g * o[i - D] : 0); } for (let i = 0; i < a.length; i++) o[i] = a[i] + o[i] * wet; return o; };

// ---- mixdown: mix.json → stereo, loudness, muxed onto the picture
export async function mixdown({ dir, SPEC, mix, timeline, END, video, out, log = console.log }) {
  const FOLD = SPEC.loop ? (SPEC.loop.fold ?? 2.5) : 0, L = Math.ceil((END + FOLD) * SR), NS = Math.ceil(END * SR), missing = new Set(), cache = new Map();
  const load = (s, pitch = 1) => { const [p, d] = s, f = sfxFile(p, d), k = f + pitch; if (cache.has(k)) return cache.get(k); if (!fs.existsSync(f)) { missing.add(p); cache.set(k, null); return null; } const a = resample(decode(f), pitch); cache.set(k, a); return a; };
  const vox = new Float32Array(L), Lb = new Float32Array(L), Rb = new Float32Array(L), buses = {};
  const bus = name => buses[name] || (buses[name] = { L: new Float32Array(L), R: new Float32Array(L) });
  const put = (b, a, t, g, pan = 0, vary = 0) => { const s = Math.round(t * SR), th = (clamp(pan, -1, 1) + 1) * Math.PI / 4, gl = Math.cos(th) * g, gr = Math.sin(th) * g; for (let i = 0; i < a.length; i++) { const j = s + i; if (j < 0 || j >= L) continue; b.L[j] += a[i] * gl; b.R[j] += a[i] * gr; } };
  // narration: every line must be cached; dry, centred, on top
  for (const l of SPEC.lines || []) { const f = voiceFile(l.text, l.voice || SPEC.voice, l.model || SPEC.model || MODEL, l.settings || SPEC.settings || null), st = timeline.lines[l.id]; if (!fs.existsSync(f)) { missing.add('voice: ' + l.id); continue; } if (!st) continue;
    // a line's own filter (l.fx, an ffmpeg -af chain, e.g. the whispered "Seven days.") is applied as the old engine did
    const a = l.fx ? decodeFx(f, l.fx) : decode(f), s = Math.round(st.start * SR); for (let i = 0; i < a.length && s + i < L; i++) vox[s + i] += a[i] * (mix.voxGain ?? 1); }
  const env = new Float32Array(L); { let e = 0; for (let i = 0; i < L; i++) { const tg = Math.abs(vox[i]) > .01 ? 1 : 0; e += (tg - e) * (tg > e ? .004 : .00008); env[i] = e; } }
  const spaceAt = t => (mix.spaces || []).find(s => t >= s.from && t < s.to) || { reverb: 'outdoor' };
  // foley: grains chosen per event, pitch varied a little, panned, muffled through walls, into the bus of the space the camera is in
  for (const f of mix.foley || []) { const a = load(f.sound); if (!a) continue; let g = f.grain ? (() => { const G = grains(a), k = Math.floor(h1(f.t * 13.7) * G.length); return resample(G[k], .92 + h1(f.t * 7.1) * .16); })() : a;
    if (f.lowpass) g = lowpass(g, f.lowpass); if (f.muffle) g = lowpass(g, 650); put(bus(spaceAt(f.t).reverb + (f.duck != null ? ':hard' : '')), g, f.t, f.gain * (f.muffle ? .5 : 1), f.pan); }
  // engines: the clip looped under the vehicle's run, gain and pan following its samples, muffled when it is outside the camera's space
  for (const e of mix.engines || []) { const a = load(e.sound, e.pitch || 1); if (!a || e.samples.length < 2) continue; const t0 = e.samples[0][0], t1 = e.samples.at(-1)[0], s0 = Math.round(t0 * SR), n = Math.round((t1 - t0) * SR), lp = 1 - Math.exp(-2 * Math.PI * 700 / SR); let y = 0, k = 0;
    const B = bus(spaceAt(t0).reverb); for (let i = 0; i < n; i++) { const t = t0 + i / SR; while (k + 1 < e.samples.length && e.samples[k + 1][0] <= t) k++; const A = e.samples[k], Z = e.samples[Math.min(k + 1, e.samples.length - 1)], u = Z[0] > A[0] ? (t - A[0]) / (Z[0] - A[0]) : 0;
      const pan = A[1] + (Z[1] - A[1]) * u, g = (A[2] + (Z[2] - A[2]) * u) * (e.gain ?? .8) * Math.min(1, i / (SR * .4), (n - i) / (SR * .6)), m = A[3]; let x = a[i % a.length]; y += lp * (x - y); x = m ? y * .55 : x;
      const th = (clamp(pan, -1, 1) + 1) * Math.PI / 4, j = s0 + i; if (j >= 0 && j < L) { B.L[j] += x * g * Math.cos(th); B.R[j] += x * g * Math.sin(th); } } }
  for (const e of mix.emits || []) { const a = load(e.sound); if (!a) continue; const s0 = Math.round(e.from * SR), n = Math.round((e.to - e.from) * SR), B = bus(spaceAt(e.from).reverb); for (let i = 0; i < n; i++) { const j = s0 + i; if (j < 0 || j >= L) continue; const v = a[i % a.length] * e.gain * Math.min(1, i / (SR * .2), (n - i) / (SR * .3)); B.L[j] += v * .7; B.R[j] += v * .7; } }
  // the spec's own cues (the scene author's placed sounds), centred, in the space's bus
  // a time: a number, [line, seconds] or the older [line, word, seconds] (word null = the line's start, '$end' = its last word's end)
  const wordAt = (Ln, w) => { if (w == null) return 0; if (w === '$end') return Ln.words.at(-1).e; const f = Ln.words.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '') === w.toLowerCase().replace(/[^a-z0-9']/g, '')); return f ? f.s : 0; };
  const resolveRef = r => { if (!Array.isArray(r)) return r; if (r[0] == null) return r[1]; const Ln = timeline.lines[r[0]]; if (!Ln) return 0; return r.length >= 3 || typeof r[1] === 'string' ? Ln.start + wordAt(Ln, r[1]) + (r[2] || 0) : Ln.start + (r[1] || 0); };
  // music: the score from the top, and music beds (a crescendo) from a time until a time, with fades; times may name words
  for (const m of mix.music || []) { const f = musicFile(m.prompt, m.seconds); if (!fs.existsSync(f)) { missing.add('music: ' + m.prompt.slice(0, 50)); continue; } const a = decode(f), s0 = Math.round((resolveRef(m.from) || 0) * SR), s1 = m.until != null ? Math.round(resolveRef(m.until) * SR) : Infinity;
    const fi = Math.max(1, (m.fadeIn || 0) * SR), fo = Math.max(1, (m.fadeOut || 0) * SR);
    for (let i = 0; i < a.length && s0 + i < L && s0 + i < s1; i++) { if (s0 + i < 0) continue; const d = m.gain * Math.min(1, i / fi, s1 === Infinity ? 1 : (s1 - s0 - i) / fo) * (1 - (m.duck ?? mix.musicDuck ?? .7) * env[s0 + i]); Lb[s0 + i] += a[i] * d; Rb[s0 + i] += a[i] * d; } }
  // a cue may carry its own ffmpeg filter (o.fx), e.g. an EQ that tames a harsh hiss and a fade-out: ['static', ref, gain, { fx: 'highshelf=f=6000:g=-8,afade=...' }]
  for (const [k, ref, g, o] of mix.cues || []) { const s = (mix.sfx || {})[k]; if (!s) continue; const f0 = sfxFile(s[0], s[1]); if (o && o.fx && !fs.existsSync(f0)) { missing.add(s[0]); continue; } const a = o && o.fx ? decodeFx(f0, o.fx) : load(s); if (!a) continue; const t = resolveRef(ref); put(bus(spaceAt(t).reverb), a, t, g, 0); }
  // reverb per space, then the sound-effect buses duck under the voice
  for (const [name0, b] of Object.entries(buses)) { const [name, hard] = name0.split(':'), R = REVERB[name] || REVERB.outdoor, wl = reverb(b.L, R), wr = reverb(b.R, [R[0].map(d => d * 1.07), R[1], R[2]]); for (let i = 0; i < L; i++) { const d = 1 - (hard ? .15 : (mix.sfxDuck ?? .45)) * env[i]; Lb[i] += wl[i] * d; Rb[i] += wr[i] * d; } }
  // ambience beds: looped, faded (J/L cuts overlap), muffled indoors, decorrelated left/right for width, ducked
  // beds loop with a crossfade at the seam; indoors they are muffled gently (crickets live above 1 kHz) over a steady room tone, so a quiet patch
  // in a clip never drops the room to silence
  const loopable = a => { const X = Math.min(Math.round(SR * .3), a.length >> 2), o = a.slice(0, a.length - X); for (let k = 0; k < X; k++) o[k] = a[k] * (k / X) + a[a.length - X + k] * (1 - k / X); return o; };
  const tone = (() => { const n = SR * 4, o = new Float32Array(n), k = 1 - Math.exp(-2 * Math.PI * 380 / SR); let y = 0, z = 0; for (let i = 0; i < n; i++) { y += k * ((h1(i * .37) * 2 - 1) - y); z += k * (y - z); o[i] = z * 2.2; } return loopable(o); })();
  for (const b of mix.beds || []) { const a0 = load(b.sound); if (!a0) continue; const a = loopable(b.muffle ? lowpass(a0, 2200) : a0), s0 = Math.round(b.from * SR), n = Math.round((b.to - b.from) * SR), off = Math.round(SR * .011), x = Math.round(SR * .35);
    for (let i = 0; i < n; i++) { const j = s0 + i; if (j < 0 || j >= L) continue; const f = Math.min(1, i / x, (n - i) / x) * b.gain * (1 - (mix.bedDuck ?? .6) * env[j]); Lb[j] += a[i % a.length] * f; Rb[j] += a[(i + off) % a.length] * f; if (b.muffle) { const tn = tone[i % tone.length] * .05 * Math.min(1, i / x, (n - i) / x); Lb[j] += tn; Rb[j] += tone[(i + off * 7) % tone.length] * .05 * Math.min(1, i / x, (n - i) / x); } } }
  // the loop: the tail past the end folds into the head (equal power), so the sound loops with the picture
  if (FOLD) { const F = Math.round(FOLD * SR); for (const b of [Lb, Rb]) for (let i = 0; i < F && NS + i < L; i++) { const w = i / F; b[i] = b[i] * Math.sin(w * Math.PI / 2) + b[NS + i] * Math.cos(w * Math.PI / 2); } }
  const st = new Float32Array(NS * 2); for (let i = 0; i < NS; i++) { st[2 * i] = Lb[i] + vox[i]; st[2 * i + 1] = Rb[i] + vox[i]; }
  const raw = out.replace(/\.mp4$/, '') + '.mix.f32'; fs.writeFileSync(raw, Buffer.from(st.buffer));
  const I = mix.loudness?.I ?? -14, TP = (mix.loudness?.TP ?? -1) - 1.0, a1 = spawnSync(ffmpegPath, ['-v', 'info', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const j = JSON.parse(a1.stderr.slice(a1.stderr.lastIndexOf('{'), a1.stderr.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=${I}:TP=${TP}:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000,alimiter=limit=${Math.pow(10, (TP - .2) / 20).toFixed(4)}:level=false`;
  const r = spawnSync(ffmpegPath, ['-v', 'error', '-y', '-i', video, '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', ln, '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { encoding: 'utf8' }); fs.rmSync(raw, { force: true });
  if (r.status) throw new Error('mixdown mux failed: ' + r.stderr);
  const m = spawnSync(ffmpegPath, ['-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, lufs = +[...m.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)?.[1], tp = +[...m.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].at(-1)?.[1];
  if (missing.size) log('MIX: not in the cache, left out: ' + [...missing].join(' | ')); log(`MIX ${out}: ${lufs} LUFS integrated, true peak ${tp} dBTP, ${(mix.foley || []).length} foley, ${(mix.engines || []).length} engines, ${(mix.beds || []).length} beds`);
  return { lufs, tp, missing: [...missing] }; }
