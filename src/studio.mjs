// The studio: episodes, takes, render jobs and checks. The MCP server (server.mjs) is a thin layer over these functions.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { HOME, EPISODES, OUTPUT, JOBS, ENGINE, CREW, TEMPLATES, EXAMPLES, SERIES, PKG, chromePath, ffmpegPath, elevenKey, CACHE } from './config.mjs';

const ff = a => spawnSync(ffmpegPath(), a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const EDITABLE = /^(spec\.js|scene\.js|[a-z0-9-]+\.(md|json))$/;   // the only files an AI may write in an episode folder

// ---------- setup ----------
export function info() {
  const ffv = ff(['-version']).stdout?.split('\n')[0] || null;
  return { studio_folder: HOME, episodes: EPISODES, output: OUTPUT, audio_cache: CACHE, chrome: chromePath(), ffmpeg: ffv ? `${ffmpegPath()} (${ffv})` : null,
    elevenlabs_key: elevenKey() ? 'configured' : 'missing (renders still work with draft: true, silent)', engines: listEngines(), series: SERIES, platform: process.platform };
}
export const listEngines = () => ['ps1', 'woodcut'];

// ---------- crew + rules ----------
export const crewRoles = () => fs.readdirSync(CREW).filter(f => f.endsWith('.md') && f !== 'HOUSE-RULES.md').map(f => f.slice(0, -3));
export const houseRules = () => fs.readFileSync(path.join(CREW, 'HOUSE-RULES.md'), 'utf8');
export function crewBrief(role) {
  const f = path.join(CREW, `${role}.md`);
  if (!crewRoles().includes(role)) throw new Error(`No crew role "${role}". Roles: ${crewRoles().join(', ')}`);
  return fs.readFileSync(f, 'utf8').replace(/^---[\s\S]*?---\n/, '');
}
export const crewDescription = role => (/description:\s*(.+)/.exec(fs.readFileSync(path.join(CREW, `${role}.md`), 'utf8')) || [])[1] || role;

// ---------- engine guides: the header comments + the public API lines of each engine file ----------
export function engineGuide(engine) {
  const file = { ps1: 'ps1.js', woodcut: 'woodcut.js', timeline: 'notebook/lib.js' }[engine];
  if (!file) throw new Error('engine must be ps1, woodcut or timeline');
  const src = fs.readFileSync(path.join(ENGINE, file), 'utf8').split('\n');
  const head = []; for (const l of src) { if (!l.startsWith('//')) break; head.push(l.slice(3)); }
  const api = src.filter(l => /^\s*(PS|WC|NB)\.[A-Za-z]\w*\s*=/.test(l) || /^\s*\/\/ /.test(l) && /PS\.|WC\.|NB\./.test(l)).map(l => l.trim().slice(0, 220));
  return `# ${engine} engine (${file})\n\n${head.join('\n')}\n\n## API (first 220 characters of each definition or note)\n${api.join('\n')}\n\nEach page loads, in order: /three/three.min.js, /engine/notebook/lib.js (timeline helpers: at, st, en, P, lerp, easing), then the engine, then optional /engine/ps1-props/<module>.js, then scene.js. Read a full example with read_episode.`;
}

// ---------- prop library ----------
export function listProps(module) {
  const dir = path.join(ENGINE, 'ps1-props'), mods = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3));
  if (!module) return mods.map(m => { const s = fs.readFileSync(path.join(dir, m + '.js'), 'utf8'); return { module: m, builders: [...new Set([...s.matchAll(/PS\.props\.(\w+)\s*=/g)].map(x => x[1]))], about: (s.split('\n')[0] || '').replace(/^\/\/\s*/, '') }; });
  if (!mods.includes(module)) throw new Error(`No prop module "${module}". Modules: ${mods.join(', ')}`);
  const s = fs.readFileSync(path.join(dir, module + '.js'), 'utf8').split('\n'), head = []; for (const l of s) { if (!l.startsWith('//')) break; head.push(l.slice(3)); }
  return { module, script: `/engine/ps1-props/${module}.js`, guide: head.join('\n'), builders: [...new Set(s.join('\n').match(/PS\.props\.(\w+)\s*=/g) || [])].map(x => x.replace(/PS\.props\.|\s*=/g, '')) };
}

// ---------- episodes ----------
const epDir = slug => { if (!SLUG.test(slug)) throw new Error('slug: lowercase letters, digits and dashes'); return path.join(EPISODES, slug); };
const exampleDir = slug => path.join(EXAMPLES, slug);
export const listExamples = () => fs.existsSync(EXAMPLES) ? fs.readdirSync(EXAMPLES).filter(d => fs.existsSync(path.join(EXAMPLES, d, 'spec.js'))) : [];
export function loadSpec(dir) { const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(dir, 'spec.js'), 'utf8'), ctx, { timeout: 1000 }); if (!ctx.SPEC) throw new Error('spec.js must set SPEC'); return ctx.SPEC; }
const engineOf = dir => /\/engine\/woodcut\.js/.test(fs.readFileSync(path.join(dir, 'index.html'), 'utf8')) ? 'woodcut' : 'ps1';

export function indexHtml(title, engine, props = []) {
  const lib = engine === 'woodcut' ? '/engine/woodcut.js' : '/engine/ps1.js';
  return `<!doctype html>\n<meta charset="utf-8">\n<title>${title.replace(/[<&]/g, '')}</title>\n<style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style>\n<script src="/three/three.min.js"></script>\n<script src="/engine/notebook/lib.js"></script>\n<script src="${lib}"></script>\n${props.map(p => `<script src="/engine/ps1-props/${p}.js"></script>\n`).join('')}<script src="scene.js"></script>\n`;
}

export function newEpisode({ slug, title, series = 'Guess The Horror', year = null, engine, props = [] }) {
  const dir = epDir(slug); if (fs.existsSync(dir)) throw new Error(`Episode "${slug}" already exists`);
  engine = engine || (SERIES[series] || SERIES.Custom).engine;
  const n = Math.max(0, ...listEpisodes().filter(e => e.series === series).map(e => +e.n || 0)) + 1;
  fs.mkdirSync(dir, { recursive: true });
  const fill = s => s.replaceAll('__TITLE__', title.replace(/'/g, "\\'")).replaceAll('__YEAR__', year == null ? 'null' : String(year)).replaceAll('__N__', String(n)).replaceAll('__SLUG__', slug)
    .replaceAll('__SERIES_UPPER__', series.toUpperCase().replace(/'/g, "\\'")).replaceAll('__SERIES__', series.replace(/'/g, "\\'"));
  for (const f of ['spec.js', 'scene.js']) {
    let src = fill(fs.readFileSync(path.join(TEMPLATES, engine, f), 'utf8'));
    if (engine === 'woodcut' && f === 'spec.js') src = src.replace('meta: { n:', `meta: { series: '${series.replace(/'/g, "\\'")}', n:`);
    fs.writeFileSync(path.join(dir, f), src);
  }
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml(title, engine, props));
  return { slug, n, series, engine, folder: dir, files: fs.readdirSync(dir), next: 'Write the script in spec.js (write_file), run voice_lines, build scene.js, check render_stills, then render_take.' };
}

export function listEpisodes() {
  if (!fs.existsSync(EPISODES)) return [];
  return fs.readdirSync(EPISODES).filter(d => fs.existsSync(path.join(EPISODES, d, 'spec.js'))).map(slug => {
    try { const m = loadSpec(path.join(EPISODES, slug)).meta || {}; return { slug, series: m.series || 'Custom', n: m.n, title: m.title, takes: listTakes(slug).length }; }
    catch (e) { return { slug, error: String(e.message || e) }; }
  });
}

function resolveEp(slug) { const d = epDir(slug); if (fs.existsSync(path.join(d, 'spec.js'))) return d; const x = exampleDir(slug); if (SLUG.test(slug) && fs.existsSync(path.join(x, 'spec.js'))) return x; throw new Error(`No episode "${slug}". list_episodes shows yours; examples: ${listExamples().join(', ')}`); }

export function readEpisode(slug) {
  const dir = resolveEp(slug), files = fs.readdirSync(dir).filter(f => EDITABLE.test(f) || f === 'index.html');
  return { slug, folder: dir, example: dir.startsWith(EXAMPLES), files: Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')])) };
}

export function readFile(slug, file) { const dir = resolveEp(slug); if (!EDITABLE.test(file) && file !== 'index.html') throw new Error('file must be spec.js, scene.js, index.html or a .md/.json note'); return fs.readFileSync(path.join(dir, file), 'utf8'); }

export function writeFile(slug, file, content) {
  const dir = epDir(slug); if (!fs.existsSync(dir)) throw new Error(`No episode "${slug}" (examples are read-only; new_episode first)`);
  if (!EDITABLE.test(file)) throw new Error('You can write spec.js, scene.js, or a lowercase .md/.json note (treatment.md, cast.json, shots.json, grade.json ...)');
  const checks = [];
  if (file.endsWith('.js')) { try { new vm.Script(content, { filename: file }); checks.push('syntax ok'); } catch (e) { throw new Error(`${file} has a syntax error, nothing written: ${e.message}`); } }
  if (file.endsWith('.json')) { try { JSON.parse(content); } catch (e) { throw new Error(`${file} is not valid JSON, nothing written: ${e.message}`); } }
  if (file === 'spec.js') {
    const ctx = {}; vm.createContext(ctx); try { vm.runInContext(content, ctx, { timeout: 1000 }); } catch (e) { throw new Error(`spec.js failed to run, nothing written: ${e.message}`); }
    const S = ctx.SPEC; if (!S || !Array.isArray(S.lines) || !S.lines.length) throw new Error('spec.js must set SPEC with a non-empty lines array, nothing written');
    const ids = new Set(); for (const l of S.lines) { if (!l.id || !l.text) throw new Error('every line needs id and text'); if (ids.has(l.id)) throw new Error(`duplicate line id ${l.id}`); ids.add(l.id); }
    for (const c of S.cues || []) if (!(S.sfx || {})[c[0]]) checks.push(`warning: cue uses unknown sfx "${c[0]}"`);
    const words = S.lines.reduce((a, l) => a + l.text.split(/\s+/).length, 0); checks.push(`${S.lines.length} lines, ${words} words (about ${(words / 2.6).toFixed(0)} s spoken)`);
  }
  const prev = path.join(dir, file); if (fs.existsSync(prev)) { const bak = path.join(dir, '.history'); fs.mkdirSync(bak, { recursive: true }); fs.copyFileSync(prev, path.join(bak, `${file}.${Date.now()}`)); }
  fs.writeFileSync(prev, content);
  if (file === 'scene.js') { const idx = path.join(dir, 'index.html'), props = [...content.matchAll(/PS1\.props\.(\w+)/g)].length ? propsUsed(content) : null; if (props) { const html = fs.readFileSync(idx, 'utf8'); const want = props.filter(p => !html.includes(`/ps1-props/${p}.js`)); if (want.length) { fs.writeFileSync(idx, html.replace('<script src="scene.js">', want.map(p => `<script src="/engine/ps1-props/${p}.js"></script>\n`).join('') + '<script src="scene.js">')); checks.push(`loaded prop modules: ${want.join(', ')}`); } } }
  return { written: path.join(dir, file), bytes: Buffer.byteLength(content), checks };
}
// which prop modules a scene needs, from the builders it calls
function propsUsed(src) { const used = new Set([...src.matchAll(/PS1\.props\.(\w+)/g)].map(m => m[1])), out = []; for (const m of listProps()) if (m.builders.some(b => used.has(b))) out.push(m.module); return out; }

// ---------- takes ----------
function takeFolder(dir) { const m = loadSpec(dir).meta || {}, series = m.series || 'Custom'; const name = (m.title || path.basename(dir)) + (m.cut ? ` - ${m.cut}` : '');
  return { folder: path.join(OUTPUT, series.replace(/[\\/:*?"<>|]/g, ''), `${String(m.n || 0).padStart(2, '0')} - ${(m.title || path.basename(dir)).replace(/[\\/:*?"<>|]/g, '')}`), name: name.replace(/[\\/:*?"<>|]/g, '') }; }
export function listTakes(slug) { const dir = resolveEp(slug), { folder, name } = takeFolder(dir), t = path.join(folder, 'takes'); if (!fs.existsSync(t)) return [];
  return fs.readdirSync(t).filter(f => f.startsWith(`${name} - Take `) && f.endsWith('.mp4')).sort().map(f => ({ take: +/Take (\d+)/.exec(f)[1], file: path.join(t, f), mb: +(fs.statSync(path.join(t, f)).size / 1e6).toFixed(1) })); }

export function pickTake(slug, n) { const dir = resolveEp(slug), { folder, name } = takeFolder(dir), take = listTakes(slug).find(t => t.take === n); if (!take) throw new Error(`No take ${n}`);
  const dst = path.join(folder, `${name} - FINAL.mp4`); fs.copyFileSync(take.file, dst); ff(['-v', 'error', '-y', '-i', dst, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', path.join(folder, `${name} - Thumbnail.jpg`)]); return { final: dst, from_take: n }; }

export function qc(file, spec) {
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(ff(['-i', file]).stderr || ''), secs = dur ? (+dur[1]) * 3600 + (+dur[2]) * 60 + (+dur[3]) : null;
  const lufs = [...(ff(['-i', file, '-af', 'ebur128', '-f', 'null', '-']).stderr || '').matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)?.[1];
  const tmp = fs.mkdtempSync(path.join(path.dirname(file), '.qc-')), a = path.join(tmp, 'a.png'), b = path.join(tmp, 'b.png');
  ff(['-v', 'error', '-y', '-i', file, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', a]); ff(['-v', 'error', '-y', '-sseof', '-0.04', '-i', file, '-frames:v', '1', b]);
  const ssim = /All:([\d.]+)/.exec(ff(['-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-']).stderr || '')?.[1]; fs.rmSync(tmp, { recursive: true, force: true });
  const series = SERIES[(spec && spec.meta && spec.meta.series) || 'Custom'] || SERIES.Custom, [lo, hi] = series.length;
  const pass = { length: secs != null && secs >= lo && secs <= hi, loudness: lufs == null ? null : Math.abs(+lufs + 14) <= 1.5, loop_seam: ssim ? +ssim >= .95 : null };
  return { file, seconds: secs && +secs.toFixed(2), target_seconds: [lo, hi], loudness_lufs: lufs == null ? 'no audio' : +lufs, target_lufs: -14, loop_seam_ssim: ssim && +(+ssim).toFixed(3), pass,
    copyright_checklist: ['No real posters, stills, clips, logos or theme music', 'Movie not named on screen, in narration, caption or tags', 'Made-up brands only'] };
}

// ---------- render jobs (child processes; the AI polls job_status) ----------
const jobs = new Map();
export function startJob(kind, slug, opts = {}) {
  const dir = resolveEp(slug); if (dir.startsWith(EXAMPLES) && kind === 'take') throw new Error('Examples can be previewed with render_stills; copy one into a new episode to render takes');
  if (!chromePath()) throw new Error('Chrome not found: install Google Chrome, Chromium or Edge, or set CHROME_PATH');
  const id = crypto.randomBytes(4).toString('hex'); fs.mkdirSync(JOBS, { recursive: true });
  const args = [path.join(PKG, 'src', 'render.mjs'), dir]; let out, after;
  if (kind === 'stills') { out = path.join(JOBS, `${id}-preview.mp4`); args.push(out, `--stills=${opts.times || 'auto'}`); after = () => { const jpg = out.replace(/\.mp4$/, '-stills.jpg'); return fs.existsSync(jpg) ? { image: jpg } : null; }; }
  else { const { folder, name } = takeFolder(dir), t = path.join(folder, 'takes'); fs.mkdirSync(t, { recursive: true });
    const n = Math.max(0, ...listTakes(slug).map(x => x.take)) + 1; out = path.join(t, `${name} - Take ${String(n).padStart(2, '0')}${opts.draft ? ' (draft)' : ''}.mp4`); args.push(out);
    after = () => { if (!fs.existsSync(out)) return null; const thumb = path.join(folder, `${name} - Thumbnail.jpg`); ff(['-v', 'error', '-y', '-i', out, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', thumb]);
      const sheet = path.join(folder, `${name} - Take ${String(n).padStart(2, '0')} contact.jpg`); ff(['-v', 'error', '-y', '-i', out, '-vf', 'fps=1/3,scale=216:384,tile=8x3:padding=4:color=white', '-frames:v', '1', sheet]);
      return { take: n, file: out, thumbnail: thumb, contact_sheet: sheet, qc: qc(out, loadSpec(dir)) }; }; }
  if (opts.draft) args.push('--draft');
  const job = { id, kind, slug, state: 'running', started: new Date().toISOString(), progress: null, log: [], out };
  const p = spawn(process.execPath, args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  const onLine = buf => { for (const l of String(buf).split('\n').filter(Boolean)) { job.log.push(l); if (job.log.length > 80) job.log.shift(); const m = /frame (\d+)\/(\d+)/.exec(l); if (m) job.progress = `${(100 * +m[1] / +m[2]).toFixed(0)}%`; } };
  p.stdout.on('data', onLine); p.stderr.on('data', onLine);
  p.on('close', code => { job.finished = new Date().toISOString(); try { job.result = code === 0 ? after() : null; } catch (e) { job.log.push(String(e)); }
    job.state = code === 0 && job.result ? 'done' : 'failed'; if (job.state === 'failed') job.error = job.log.filter(l => /error|ERRORS|NO CHROME|Error/.test(l)).slice(-8).join('\n') || job.log.slice(-8).join('\n'); });
  jobs.set(id, job); return { job_id: id, kind, slug, state: 'running', poll: 'job_status' };
}
export function jobStatus(id) { const j = jobs.get(id); if (!j) throw new Error(`No job ${id} (jobs live until the server restarts)`); const { log, ...rest } = j; return { ...rest, last_lines: log.slice(-6) }; }
export const listJobs = () => [...jobs.values()].map(({ log, ...j }) => j);

// ---------- voice (narration timings without rendering) ----------
export async function voiceLines(slug) {
  const dir = resolveEp(slug), S = loadSpec(dir), { speak, sfx } = await import('./eleven.mjs'); let total = 0; const out = [];
  for (const l of S.lines) { const r = await speak(l.text, l.voice || S.voice, { model: l.model || S.model, settings: l.settings || S.settings || null }), d = r.words.at(-1).e; total += d + (l.gap ?? .4); out.push({ id: l.id, seconds: +d.toFixed(2), words: r.words.map(w => w.w).join(' ') }); }
  for (const [, [p, d]] of Object.entries(S.sfx || {})) await sfx(p, { duration: d });
  return { lines: out, approx_length_s: +(total + (S.tail ?? 1.2)).toFixed(1), sfx_ready: Object.keys(S.sfx || {}).length };
}

// ---------- prop preview ----------
export function previewProp(module, builder, opts = {}, view = {}) {
  return new Promise((resolve, reject) => {
    const out = path.join(JOBS, `prop-${module}-${builder}-${Date.now()}.jpg`); fs.mkdirSync(JOBS, { recursive: true });
    const args = [path.join(PKG, 'src', 'prop-view.mjs'), module, builder, JSON.stringify(opts), `--out=${out}`, ...Object.entries(view).map(([k, v]) => `--${k}=${v}`)];
    const p = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let log = ''; p.stdout.on('data', d => log += d); p.stderr.on('data', d => log += d);
    p.on('close', c => c === 0 && fs.existsSync(out) ? resolve(out) : reject(new Error(log.trim().slice(-1500) || 'preview failed')));
  });
}

// ---------- post kit ----------
export function postKit(slug, { caption, hashtags = [], song } = {}) {
  const dir = resolveEp(slug), S = loadSpec(dir), m = S.meta || {}, { folder, name } = takeFolder(dir); fs.mkdirSync(folder, { recursive: true });
  const tags = (hashtags.length ? hashtags : m.series === 'Guess The Horror' ? ['#horror', '#guessthemovie', '#horrormovies', '#ps1', '#scary'] : ['#history', '#strange', '#mystery', '#ps1', '#storytime']).slice(0, 5);
  const kit = `# Post kit: ${name}\n\n- Series: ${m.series || 'Custom'} #${m.n}\n- Caption: ${caption || (m.series === 'Guess The Horror' ? 'Can you name this movie? One clue is hidden on screen. Comment your guess.' : 'Would you believe this really happened? Comment what you think.')}\n- Hashtags (max 5): ${tags.join(' ')}\n- Song: ${song || 'none baked in; add a track from the app library if you want one'}\n- Best time: early evening in your audience's time zone (the playbook uses 7 PM ET)\n- Cover: the first frame (title card), saved as the thumbnail\n${m.answer ? `- Answer (do not post it): ${m.answer}\n` : ''}`;
  const f = path.join(folder, 'Post kit.md'); fs.writeFileSync(f, kit); return { file: f, text: kit };
}

export function openFile(file) { const cmd = process.platform === 'darwin' ? ['open', [file]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', file]] : ['xdg-open', [file]]; spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref(); return { opened: file }; }
export const specOf = slug => loadSpec(resolveEp(slug));
