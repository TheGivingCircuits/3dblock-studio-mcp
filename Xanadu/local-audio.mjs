// Offline audio for the studio: a free macOS voice and synthesized sound effects and music, so an episode can be voiced and scored without
// ElevenLabs credits. eleven.mjs routes to it, and the results land in the same cache files, so make.mjs and the mixer read them unchanged:
//   voice 'say:<Name>'     speak() runs macOS `say`, then a warm room treatment; word times come from the pauses in the audio (silencedetect)
//                          and are spread by syllables inside each phrase. settings: { rate (words a minute), pitch (1 = as spoken), fx (ffmpeg filter) }
//   sfx   'local:<name>'   synthesized: typewriter, bills, clap, hammer, rifle, reels, tapes
//   music 'local:<name>'   synthesized: organ-strings (a slow 60s horror organ, tremolo strings, a low drone, soft timpani), organ-swell (a rising finale)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const SR = 44100, TAU = Math.PI * 2;
const ff = a => spawnSync(ffmpegPath, a, { encoding: 'utf8', maxBuffer: 1 << 26 });
export function writeWav(file, x) { const n = x.length, b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2); fs.writeFileSync(file, b); return file; }
const rng = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const normalize = (x, peak = .89) => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; };
const lp = (x, fc) => { const a = 1 - Math.exp(-TAU * fc / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } return x; };
const hp = (x, fc) => { const a = Math.exp(-TAU * fc / SR); let px = 0, y = 0; for (let i = 0; i < x.length; i++) { y = a * (y + x[i] - px); px = x[i]; x[i] = y; } return x; };
// a small Schroeder room: four combs into two allpasses
function reverb(x, mix = .25, size = 1) { const out = new Float32Array(x.length), combs = [1557, 1617, 1491, 1422].map(d => ({ d: Math.round(d * size), b: new Float32Array(Math.round(d * size)), i: 0 })), aps = [225, 556].map(d => ({ d, b: new Float32Array(d), i: 0 }));
  for (let n = 0; n < x.length; n++) { let s = 0; for (const c of combs) { const y = c.b[c.i]; c.b[c.i] = x[n] + y * .78; c.i = (c.i + 1) % c.d; s += y; } s *= .25; for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * .5; a.i = (a.i + 1) % a.d; s = y - s * .5; } out[n] = x[n] * (1 - mix) + s * mix; } return out; }

// ---------- the voice ----------
const syl = w => { const s = w.toLowerCase().replace(/[^a-z0-9]/g, ''); if (/^\d+$/.test(s)) return s.length * 1.6; const g = s.match(/[aeiouy]+/g); let n = g ? g.length : 1; if (s.length > 2 && s.endsWith('e') && !/[aeiouy]le$/.test(s)) n = Math.max(1, n - 1); return n; };
export function sayLine(text, voice, settings = {}, wav) {
  const tmp = path.join(os.tmpdir(), `say-${process.pid}-${Date.now()}.aiff`), name = voice.replace(/^say:/, ''), rate = settings.rate || 160, pitch = settings.pitch || 1;
  const r = spawnSync('say', ['-v', name, '-r', String(rate), '-o', tmp, text]); if (r.status) throw new Error('say failed: ' + r.stderr);
  const sr = +(/(\d+) Hz/.exec(ff(['-i', tmp]).stderr) || [0, 22050])[1];
  const fx = settings.fx || 'highpass=f=70,lowpass=f=6200,equalizer=f=140:t=q:w=1:g=4,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,aecho=0.8:0.5:40|75:0.16|0.09,loudnorm=I=-18:TP=-2';
  const shift = pitch !== 1 ? `asetrate=${Math.round(sr * pitch)},aresample=${SR},atempo=${(1 / pitch).toFixed(4)},` : '';
  const o = ff(['-v', 'error', '-y', '-i', tmp, '-af', `${shift}${fx},apad=pad_dur=0.25`, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', wav]); fs.rmSync(tmp, { force: true }); if (o.status) throw new Error('ffmpeg voice failed: ' + o.stderr);
  return { wav, words: wordTimes(text, wav) };
}
// word times from the audio: the pauses split it into spoken stretches, the stretches are matched to the phrases (split at punctuation),
// and each phrase's words share its stretch by syllables
export function wordTimes(text, wav) {
  const dur = +(/Duration: (\d+):(\d+):([\d.]+)/.exec(ff(['-i', wav]).stderr) || []).slice(1).reduce((a, v, i) => a + v * [3600, 60, 1][i], 0);
  const sil = [...ff(['-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.09', '-f', 'null', '-']).stderr.matchAll(/silence_(start|end): ([\d.]+)/g)].map(m => [m[1], +m[2]]);
  const gaps = []; for (let i = 0; i < sil.length; i++) if (sil[i][0] === 'start') { const e = sil[i + 1] && sil[i + 1][0] === 'end' ? sil[i + 1][1] : dur; gaps.push([sil[i][1], e]); }
  let segs = [], cur = 0; for (const [a, b] of gaps) { if (a - cur > .05) segs.push([cur, a]); cur = b; } if (dur - cur > .05) segs.push([cur, dur]);
  const words = text.split(/\s+/).filter(Boolean), phrases = []; let ph = []; words.forEach((w, i) => { ph.push(w); if (/[,.;:?!]["')]?$/.test(w) || i === words.length - 1) { phrases.push(ph); ph = []; } });
  while (segs.length > phrases.length) { let k = 0, best = Infinity; for (let i = 0; i < segs.length - 1; i++) { const g = segs[i + 1][0] - segs[i][1]; if (g < best) { best = g; k = i; } } segs.splice(k, 2, [segs[k][0], segs[k + 1][1]]); }
  const out = [], place = (ws, a, b) => { const wt = ws.map(w => syl(w) + .55), tot = wt.reduce((x, y) => x + y, 0); let t = a; ws.forEach((w, i) => { const d = (b - a) * wt[i] / tot; out.push({ w, s: +t.toFixed(3), e: +(t + d * .94).toFixed(3) }); t += d; }); };
  if (segs.length === phrases.length) phrases.forEach((p, i) => place(p, segs[i][0], segs[i][1]));
  else { const a = segs.length ? segs[0][0] : 0, b = segs.length ? segs.at(-1)[1] : dur; place(words, a, b); }
  return out;
}

// ---------- sound effects ----------
export function synthSfx(name, dur, wav) {
  const n = Math.round((dur || 2) * SR), x = new Float32Array(n), r = rng(name.length * 977 + 13), at = (t, f) => { const i0 = Math.round(t * SR); f(i0); };
  const burst = (t, len, amp, tone = 0, tdec = .02, f0 = 0) => at(t, i0 => { for (let i = 0; i < len * SR && i0 + i < n; i++) { const u = i / SR; x[i0 + i] += amp * ((r() * 2 - 1) * Math.exp(-u / (len / 4)) + (tone ? tone * Math.sin(TAU * f0 * u) * Math.exp(-u / tdec) : 0)); } });
  const k = name.replace(/^local:/, '');
  if (k === 'typewriter') { let t = .05; while (t < (dur - .6)) { burst(t, .012, .7, .5, .015, 320); t += .07 + r() * .11 + (r() < .12 ? .25 : 0); } at(dur - .5, i0 => { for (let i = 0; i < .5 * SR && i0 + i < n; i++) { const u = i / SR; x[i0 + i] += .5 * Math.sin(TAU * 2100 * u) * Math.exp(-u / .18); } }); hp(x, 300); }
  else if (k === 'bills') { for (let j = 0; j < 6; j++) at(.05 + j * .3, i0 => { for (let i = 0; i < .26 * SR && i0 + i < n; i++) { const u = i / .26 / SR; x[i0 + i] += (r() * 2 - 1) * Math.sin(Math.PI * u) * .5; } }); hp(lp(x, 4500), 900); }
  else if (k === 'clap') { burst(.02, .03, 1, 1.2, .03, 900); burst(.02, .01, .6); hp(x, 200); }
  else if (k === 'hammer') { for (let j = 0; j < Math.floor(dur / .55); j++) { burst(j * .55, .02, .6, 1.1, .09, 120); burst(j * .55, .2, 0, .5, .06, 410); } }
  else if (k === 'rifle') { burst(0, .05, 1.2, 1.5, .25, 58); for (const [d, g] of [[.22, .35], [.47, .18], [.8, .08]]) burst(d, .25, g, g * 1.2, .3, 52); lp(x, 5000); }
  else if (k === 'reels') { for (let j = 0; j < 8; j++) at(.05 + j * .22 + r() * .05, i0 => { const f = [1180, 2930, 4310].map(v => v * (.9 + r() * .2)); for (let i = 0; i < .35 * SR && i0 + i < n; i++) { const u = i / SR; x[i0 + i] += .25 * f.reduce((s, ff_, q) => s + Math.sin(TAU * ff_ * u) / (q + 1), 0) * Math.exp(-u / .08); } }); }
  else if (k === 'tapes') { for (let j = 0; j < 7; j++) burst(.05 + j * .26 + r() * .04, .015, .6, .7, .025, 310); hp(x, 180); }
  else throw new Error('local sfx: no recipe for ' + name);
  return writeWav(wav, normalize(reverb(x, .18, .6), .8));
}

// ---------- music ----------
// a wavetable oscillator bank (fast enough for four minutes in plain JS)
const table = harm => { const N = 4096, t = new Float32Array(N); harm.forEach((a, h) => { if (a) for (let i = 0; i < N; i++) t[i] += a * Math.sin(TAU * (h + 1) * i / N); }); return normalize(t, 1); };
const ORGAN = table([1, .7, .45, .35, 0, .2, 0, .12]), SAW = table([1, .5, .33, .25, .2, .17, .14, .12, .11, .1]), N_ = 4096;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// D minor: Dm, Bb, Gm, A, Dm, F, Gm, A7 (organ voicings and string lines as MIDI notes)
const PROG = [[[50, 53, 57, 62], [74, 77]], [[46, 53, 58, 62], [74, 77]], [[43, 50, 55, 58], [70, 74]], [[45, 52, 57, 61], [73, 76]], [[50, 53, 57, 62], [77, 81]], [[41, 48, 53, 57], [72, 77]], [[43, 50, 55, 58], [74, 79]], [[45, 49, 55, 61], [73, 76]]];
export function synthMusic(name, seconds, wav) {
  const k = name.replace(/^local:/, ''), n = Math.round(seconds * SR), out = new Float32Array(n), CH = 5.2;   // seconds a chord
  const swell = k === 'organ-swell'; if (!swell && k !== 'organ-strings') throw new Error('local music: no recipe for ' + name);
  const voice = (notes, wave, amp, t0, t1, o = {}) => { const ph = notes.map(() => 0), i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(n, Math.ceil(t1 * SR)), atk = o.atk || .5, rel = o.rel || .7;
    for (let i = i0; i < i1; i++) { const t = i / SR, u = t - t0, env = Math.min(1, u / atk, (t1 - t) / rel) * (o.amp ? o.amp(t) : 1), vib = 1 + (o.vib || 0) * Math.sin(TAU * (o.vibHz || 5.5) * t), trem = o.trem ? 1 - o.trem * (.5 + .5 * Math.sin(TAU * (o.tremHz || 7) * t)) : 1;
      let s = 0; for (let j = 0; j < notes.length; j++) { ph[j] = (ph[j] + hz(notes[j]) * vib / SR * N_) % N_; s += wave[ph[j] | 0]; } out[i] += s / notes.length * amp * env * trem; } };
  const chords = swell ? [PROG[0], PROG[1], PROG[7], [[50, 51, 57, 62], [75, 81]]] : PROG, span = swell ? seconds / chords.length : CH;
  const lvl = t => swell ? .35 + .65 * Math.min(1, t / (seconds * .85)) : 1;
  for (let c = 0, t = 0; t < seconds; c++, t += span) { const [org, str] = chords[c % chords.length], t1 = Math.min(seconds + .7, t + span + .7);
    voice(org, ORGAN, .55, t, t1, { atk: .9, rel: .9, vib: .0025, vibHz: 6.2, amp: lvl });
    voice(str, SAW, .3, t + .2, t1, { atk: 1.4, rel: 1.0, vib: .004, vibHz: 5, trem: .55, tremHz: swell ? 9 : 6.5, amp: lvl }); }
  voice([38, 45], ORGAN, .35, 0, seconds, { atk: 3, rel: 3, amp: lvl });   // the drone: D and A low
  // soft timpani: on every Dm, and a building roll under the swell
  const timp = (t, g) => { const i0 = Math.floor(t * SR); for (let i = 0; i < 1.6 * SR && i0 + i < n; i++) { const u = i / SR, f = 73 * (1 + .06 * Math.exp(-u * 8)); out[i0 + i] += g * (Math.sin(TAU * f * u) * Math.exp(-u / .55) + (Math.random() * 2 - 1) * .15 * Math.exp(-u / .04)); } };
  if (swell) { for (let t = seconds * .4; t < seconds - 1.5; t += Math.max(.07, .35 - (t / seconds) * .3)) timp(t, .12 + .3 * (t / seconds)); timp(seconds - 3.2, .6); }
  else for (let t = 0; t < seconds; t += CH * 4) timp(t + .05, .35);
  lp(out, swell ? 5200 : 3800); const wet = reverb(out, .38, 1.4);
  if (swell) for (let i = 0; i < n; i++) wet[i] *= Math.min(1, (n - i) / (1.0 * SR));
  return writeWav(wav, normalize(wet, .85));
}
