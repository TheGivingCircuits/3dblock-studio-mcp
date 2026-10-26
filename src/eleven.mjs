// ElevenLabs client for the studio: voices, sound effects and music, all cached on disk.
// The API key comes from ELEVENLABS_API_KEY or ~/.config/elevenlabs.key (see config.mjs) and is never logged.
// Cache key = sha1(kind|voice|model|text|settings), so re-running a build only pays for lines that changed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ffmpegPath as ffp, CACHE as STUDIO_CACHE, elevenKey } from './config.mjs';
const ffmpegPath = ffp();

const API = 'https://api.elevenlabs.io';
export const CACHE = STUDIO_CACHE;
export const MODEL = process.env.ELEVEN_MODEL || 'eleven_v3';
const FORMAT = process.env.ELEVEN_FORMAT || 'mp3_44100_128'; // 128 works on every plan; set mp3_44100_192 on Creator and up

let _key = null;
function key() {
  if (_key) return _key;
  _key = elevenKey();
  if (!_key) throw new Error('No ElevenLabs key: set ELEVENLABS_API_KEY or put the key in ~/.config/elevenlabs.key (or render with draft: true)');
  return _key;
}
/** True when a key is configured (the key itself is never exposed). */
export const hasKey = () => !!elevenKey();
const hash = (...parts) => crypto.createHash('sha1').update(parts.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join('|')).digest('hex');

async function post(url, body, { json = false, tries = 4 } = {}) {
  for (let attempt = 1; ; attempt++) {
    let r; try { r = await fetch(API + url, { method: 'POST', headers: { 'xi-api-key': key(), 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
    catch (e) { if (attempt < tries) { await new Promise(res => setTimeout(res, 1500 * attempt ** 2)); continue; } throw e; }   // network blip (connect timeout): retry too
    if (r.ok) return json ? r.json() : Buffer.from(await r.arrayBuffer());
    const msg = (await r.text()).slice(0, 400);
    // 429 = rate limit / concurrency, 5xx = transient: back off and retry. Anything else is a real error.
    if ((r.status === 429 || r.status >= 500) && attempt < tries) { await new Promise(res => setTimeout(res, 1500 * attempt ** 2)); continue; }
    throw new Error(`ElevenLabs ${url.split('?')[0]} -> HTTP ${r.status}: ${msg}`);
  }
}

// mp3 -> mono 16-bit WAV at 44.1 kHz (readWav in build.mjs resamples to the mix rate)
function toWav(mp3, wavFile) {
  const tmp = wavFile + '.mp3';
  fs.writeFileSync(tmp, mp3);
  const r = spawnSync(ffmpegPath, ['-v', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', wavFile]);
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) throw new Error('ffmpeg decode failed: ' + r.stderr);
  return wavFile;
}

// Words with real start/end times, rebuilt from ElevenLabs' character alignment.
function wordsFromAlignment(al) {
  if (!al || !al.characters) return null;
  const out = []; let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { out.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', s: al.character_start_times_seconds[i], e: 0 };
    cur.w += ch; cur.e = al.character_end_times_seconds[i];
  });
  if (cur) out.push(cur);
  return out;
}

/** Text to speech. Returns { wav, words } where words = [{w, s, e}] in seconds from the start of the clip. */
export async function speak(text, voice, { model = MODEL, settings = null } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  const id = hash('tts', voice, model, text, settings || {});
  const wav = path.join(CACHE, id + '.wav'), meta = path.join(CACHE, id + '.json');
  if (fs.existsSync(wav) && fs.existsSync(meta) && fs.statSync(wav).size > 2000) return { wav, words: JSON.parse(fs.readFileSync(meta, 'utf8')).words };
  const body = { text, model_id: model, ...(settings ? { voice_settings: settings } : {}) };
  const res = await post(`/v1/text-to-speech/${voice}/with-timestamps?output_format=${FORMAT}`, body, { json: true });
  toWav(Buffer.from(res.audio_base64, 'base64'), wav);
  const words = wordsFromAlignment(res.alignment || res.normalized_alignment);
  fs.writeFileSync(meta, JSON.stringify({ text, voice, model, words }));
  return { wav, words };
}

/** Sound effect from a text prompt. duration in seconds (0.5-30) or null to let the model choose. */
export async function sfx(prompt, { duration = null, influence = 0.5 } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  const wav = path.join(CACHE, 'sfx-' + hash('sfx', prompt, duration, influence) + '.wav');
  if (fs.existsSync(wav)) return wav;
  const body = { text: prompt, prompt_influence: influence, ...(duration ? { duration_seconds: Math.max(0.5, Math.min(30, duration)) } : {}) };
  return toWav(await post(`/v1/sound-generation?output_format=${FORMAT}`, body), wav);
}

/** Instrumental music from a text prompt. seconds = track length. */
export async function music(prompt, seconds) {
  fs.mkdirSync(CACHE, { recursive: true });
  const wav = path.join(CACHE, 'music-' + hash('music', prompt, seconds) + '.wav');
  if (fs.existsSync(wav)) return wav;
  const body = { prompt, music_length_ms: Math.round(seconds * 1000), force_instrumental: true };
  return toWav(await post(`/v1/music?output_format=${FORMAT}`, body), wav);
}

/** Speech to text with word timings (finds moments inside long archival footage). Returns [{w, s, e}]. */
export async function stt(audioFile, { model = 'scribe_v1', language = null } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  const data = fs.readFileSync(audioFile), out = path.join(CACHE, 'stt-' + hash('stt', model, language || '', crypto.createHash('sha1').update(data).digest('hex')) + '.json');
  if (fs.existsSync(out)) return JSON.parse(fs.readFileSync(out, 'utf8'));
  for (let attempt = 1; ; attempt++) {
    const form = new FormData(); form.append('model_id', model); if (language) form.append('language_code', language);
    form.append('file', new Blob([data]), path.basename(audioFile));
    const r = await fetch(API + '/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key() }, body: form });
    if (r.ok) { const j = await r.json(), words = (j.words || []).filter(w => w.type !== 'spacing').map(w => ({ w: w.text, s: w.start, e: w.end })); fs.writeFileSync(out, JSON.stringify(words)); return words; }
    const msg = (await r.text()).slice(0, 400);
    if ((r.status === 429 || r.status >= 500) && attempt < 4) { await new Promise(res => setTimeout(res, 1500 * attempt ** 2)); continue; }
    throw new Error(`ElevenLabs /v1/speech-to-text -> HTTP ${r.status}: ${msg}`);
  }
}

export const cached = file => fs.existsSync(file);

/** The voices on this account: [{ voice_id, name, labels }]. */
export async function voices() {
  const r = await fetch(API + '/v1/voices', { headers: { 'xi-api-key': key() } });
  if (!r.ok) throw new Error(`ElevenLabs /v1/voices -> HTTP ${r.status}`);
  return (await r.json()).voices.map(v => ({ voice_id: v.voice_id, name: v.name, labels: v.labels, preview_url: v.preview_url }));
}
