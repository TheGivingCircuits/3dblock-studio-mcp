// --shoot: render every shot of an episode's shot list as raw plates (lib/camera.js in the page does the rendering).
//   <plates>/<slug>/take-NN/<shot>/{color,depth,motion,overlay}/00000.png …, preview.mp4 (480p dailies), shot.json (lens, body, per-frame focus)
//   <plates>/<slug>/take-NN/take.json (timeline, shot order, plate format, timings, safety checks)
// colour: 16-bit RGB, linear, 0..HEAD (8 = three stops over the key's white) · depth: 16-bit grey, millimetres · motion: 16-bit RGB,
// x/y velocity in plate pixels per frame × 256 + 32768 (y down) · overlay: 8-bit RGBA at the HUD's 360x640 (captions, title card).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';
import { WebSocketServer } from 'ws';   // already installed with puppeteer-core; no new dependency

export const FPS = 30;
// PLATE STORAGE (the one place it is set): every shoot writes to the Mac's internal SSD, never straight to the T7 (it writes ~40 MB/s).
// After --post, archive() copies the take to the T7, checks the sizes, and frees the SSD copy only when the SSD is under 40 GB free.
export const PLATE_ROOT = path.join(os.homedir(), 'Desktop', 'Studio', 'Support', 'plates'), T7_PLATES = '/Volumes/T7 footage/plates', KEEP_FREE_GB = 40;
export const freeGB = (p = os.homedir()) => { const s = fs.statfsSync(p); return s.bavail * s.bsize / 1e9; };
// where a take's plates are now: the SSD if it still has them, else the T7
export const plateRootFor = (slug, take) => { for (const root of [PLATE_ROOT, T7_PLATES]) { const t = takes(path.join(root, slug)); if (t.length && (!take || t.includes(`take-${String(take).padStart(2, '0')}`))) return root; } return PLATE_ROOT; };
const sizes = dir => { const r = spawnSync('find', [dir, '-type', 'f', '!', '-name', '._*', '-exec', 'stat', '-f', '%z %N', '{}', '+'], { encoding: 'utf8', maxBuffer: 1 << 28 }); return r.stdout.split('\n').filter(Boolean).map(l => { const i = l.indexOf(' '); return [path.relative(dir, l.slice(i + 1)), +l.slice(0, i)]; }).sort(); };
// THE ONLY WAY plates leave the SSD (manual cleanups included: node studio/free-plates.mjs <slug> <take>). One guarded step: the T7 must be
// mounted and readable, its copy must exist and match the SSD copy file for file (count and every size), and the check runs again right
// before the delete. Any failure aborts and deletes nothing.
export function freeSSDCopy(slug, takeDir) { const dst = path.join(T7_PLATES, slug, path.basename(takeDir)), why = m => { console.log(`FREE ${takeDir}: NOT deleted (${m})`); return { freed: false, why: m }; };
  if (!takeDir.startsWith(PLATE_ROOT + path.sep) || !fs.existsSync(takeDir)) return why('not an SSD plate folder');
  try { fs.readdirSync(T7_PLATES); } catch { return why('the T7 is not mounted or not readable'); }
  if (!fs.existsSync(dst)) return why('no copy on the T7');
  const same = () => { const a = sizes(takeDir), b = sizes(dst); return a.length > 0 && JSON.stringify(a) === JSON.stringify(b) ? a.length : 0; };
  const n = same(); if (!n) return why('the T7 copy does not match (count or sizes)');
  if (same() !== n) return why('the copy changed during the check');
  fs.rmSync(takeDir, { recursive: true, force: true }); console.log(`FREE ${takeDir}: deleted; ${n} files verified on the T7 at ${dst}`); return { freed: true, n }; }
export function archive(slug, takeDir) {
  if (!fs.existsSync(T7_PLATES.replace(/\/plates$/, ''))) { console.log('T7 not mounted: plates stay on the SSD at', takeDir); return { archived: false }; }
  if (takeDir.startsWith(T7_PLATES)) return { archived: true, already: true };
  const dst = path.join(T7_PLATES, slug, path.basename(takeDir)); fs.mkdirSync(dst, { recursive: true });
  const r = spawnSync('nice', ['-n', '19', 'rsync', '-rt', '--exclude', '.DS_Store', takeDir + '/', dst + '/']); spawnSync('find', [dst, '-name', '._*', '-delete']);
  const a = sizes(takeDir), b = sizes(dst), ok = !r.status && JSON.stringify(a) === JSON.stringify(b);
  console.log(`ARCHIVE ${takeDir} → ${dst}: ${a.length} files, ${ok ? 'sizes match' : 'MISMATCH (SSD copy kept)'}`);
  const free = freeGB(); let freed = false; if (ok && free < KEEP_FREE_GB) freed = freeSSDCopy(slug, takeDir).freed;
  console.log(`  SSD free ${free.toFixed(1)} GB → ${freed ? `deleted the SSD copy (under ${KEEP_FREE_GB} GB free); now ${freeGB().toFixed(1)} GB` : 'kept the SSD copy'}`); return { archived: ok, freed, dst };
}
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

// the studio's static server, plus /plates/ (the plate store, outside the project) and POST hooks for the shoot
export function serve(root, platesRoot, onPost) {
  const server = http.createServer((req, res) => { const u = decodeURIComponent(req.url.split('?')[0]);
    if (req.method === 'POST' && onPost) { const parts = []; req.on('data', c => parts.push(c)); req.on('end', () => Promise.resolve(onPost(u, Buffer.concat(parts))).then(() => { res.writeHead(200); res.end('ok'); }, e => { console.log('upload error', u, e.message); res.writeHead(500); res.end(); })); return; }
    const f = u.startsWith('/plates/') ? path.join(platesRoot, u.slice(8)) : path.join(root, u), ok = (f.startsWith(root) || f.startsWith(platesRoot)) && fs.existsSync(f) && !fs.statSync(f).isDirectory();
    if (!ok) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
  return { server, port: server.address().port };
}
export async function browse(url, w, h) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 3600000, args: ['--force-color-profile=srgb', '--enable-unsafe-swiftshader'] });
  const pid = browser.process() && browser.process().pid; if (pid) spawnSync('renice', ['10', '-p', String(pid)]);   // keep the user's apps ahead of the render
  const page = await browser.newPage(); await page.setViewport({ width: w, height: h }); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
  await page.goto(url); await page.waitForFunction('window.ready === true', { timeout: 120000 }).catch(() => {});
  if (errs.some(e => !/GPU stall|WebGL|ReadPixels|Failed to load resource/.test(e))) { console.log('PAGE ERRORS:\n' + errs.join('\n')); await browser.close(); process.exit(1); }
  return { browser, page, errs };
}
// the narration timeline (cached voices) via notebook/make.mjs --timeline
export function timeline(studio, specFile, sceneFile) {
  const tmp = path.join(os.tmpdir(), `tl-${process.pid}-${Date.now()}`), tl = tmp + '.json';
  const r = spawnSync(process.execPath, [path.join(studio, 'notebook', 'make.mjs'), specFile, sceneFile, tmp + '.mp4', `--timeline=${tl}`], { cwd: studio, encoding: 'utf8' });
  if (r.status || !fs.existsSync(tl)) { console.log(r.stdout, r.stderr); throw new Error('timeline failed'); } const TL = JSON.parse(fs.readFileSync(tl, 'utf8')); fs.rmSync(tl); return TL;
}
export const takes = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(d => /^take-\d+$/.test(d)).sort() : [];
export const du = p => { const r = spawnSync('du', ['-sk', p], { encoding: 'utf8' }); return +(r.stdout.split(/\s/)[0] || 0) * 1024; };
export const mb = b => (b / 1048576).toFixed(1) + ' MB';

export async function shoot({ studio, slug, dir, specFile, sceneFile, platesRoot, take: takeArg, shot: shotArg, subframes, strict }) {
  console.log(`SSD free before the shoot: ${freeGB().toFixed(1)} GB`); const T0 = Date.now(), TL = timeline(studio, specFile, sceneFile), base = path.join(platesRoot, slug); fs.mkdirSync(base, { recursive: true });
  // take numbers count the takes on the SSD and on the T7, so a new take never lands on an archived one
  const have = [...new Set([...takes(base), ...takes(path.join(T7_PLATES, slug))])].sort(), nTake = takeArg ? +takeArg : shotArg && have.length ? +have.at(-1).slice(5) : have.length ? +have.at(-1).slice(5) + 1 : 1, takeDir = path.join(base, `take-${String(nTake).padStart(2, '0')}`);
  fs.mkdirSync(takeDir, { recursive: true });
  // uploads from the page land in the current shot's writers: one ffmpeg per plate turns raw 16-bit frames into a PNG sequence
  let W = null; const write = (p, buf) => new Promise((res, rej) => p.stdin.write(buf, e => e ? rej(e) : res()));
  const handle = async (u, buf) => { const [, , , frame, kind] = u.split('/');   // /plate/<shot>/<frame>/<kind>
    if (kind === 'overlay') return fs.promises.writeFile(path.join(W.dir, 'overlay', String(frame).padStart(5, '0') + '.png'), buf); return write(W[kind], buf); };
  const { server, port } = serve(studio, platesRoot, handle);
  // plates travel over a WebSocket (about 12x faster than an HTTP POST from headless Chrome: 12 MB in ~50 ms instead of ~600 ms).
  // Each upload is a text header { id, url } followed by its binary body; the server acks the id once the bytes are with the encoder
  const wss = new WebSocketServer({ port: 0, maxPayload: 1 << 30 }); wss.on('connection', ws => { let head = null; ws.on('message', (d, bin) => { if (!bin) { head = JSON.parse(d.toString()); return; }
    const h = head; head = null; handle(h.url, d).then(() => ws.send(JSON.stringify({ id: h.id })), e => ws.send(JSON.stringify({ id: h.id, error: e.message }))); }); });
  const { browser, page } = await browse(`http://localhost:${port}/${path.relative(studio, sceneFile)}`, 1080, 1920);
  await page.evaluate(tl => window.setTL(tl), TL); await page.evaluate(p => window.plateSocket && window.plateSocket(p), wss.address().port);
  const info = await page.evaluate(() => window.plateInfo()), shots = await page.evaluate(() => window.shotList());
  if (!info || !shots) throw new Error('this scene does not use the cinema camera (lib/camera.js); use --final');
  const checks = await page.evaluate(() => window.checkShots()); const T1 = Date.now();
  console.log(`SHOOT ${slug} take ${nTake} · ${shots.length} shots · ${TL.end.toFixed(2)} s · plates ${info.w}x${info.h} → ${takeDir}`);
  if (checks.length) { console.log('CAM.check:'); for (const c of checks) console.log(`  ${c.shot} @${c.t}s  ${c.problem}`); if (strict || checks.some(c => c.fatal)) { console.log(checks.some(c => c.fatal) ? 'STOP: a character is doubled in frame (see above). Fix the scene; nothing was shot.' : 'STOP (--strict)'); await browser.close(); server.close(); wss.close(); process.exit(1); } } else console.log('CAM.check: clear (no geometry in front of a subject, no camera inside a mesh, every 180-degree line kept)');
  const N = Math.round(TL.end * FPS), first = s => Math.ceil(s.t0 * FPS - 1e-6), todo = shots.map((s, i) => ({ ...s, f0: Math.max(0, first(s)), f1: s.cover ? Math.min(N, Math.ceil((s.t0 + s.dur) * FPS - 1e-6)) : i < shots.length - 1 ? first(shots[i + 1]) : N }));
  const prevTake = fs.existsSync(path.join(takeDir, 'take.json')) ? JSON.parse(fs.readFileSync(path.join(takeDir, 'take.json'), 'utf8')) : null, stats = prevTake ? Object.fromEntries(prevTake.shots.map(s => [s.id, s])) : {};
  for (const s of todo) { if (shotArg && s.id !== shotArg) continue; const sdir = path.join(takeDir, s.id), ts = Date.now(); fs.rmSync(sdir, { recursive: true, force: true }); for (const k of ['color', 'depth', 'motion', 'overlay']) fs.mkdirSync(path.join(sdir, k), { recursive: true });
    const wr = (k, fmt) => spawn('nice', ['-n', '10', ffmpegPath, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', fmt, '-s', `${info.w}x${info.h}`, '-i', '-', '-compression_level', '1', '-threads', '2', '-start_number', '0', path.join(sdir, k, '%05d.png')], { stdio: ['pipe', 'inherit', 'inherit'] });
    W = { dir: sdir, color: wr('color', 'rgb48le'), depth: wr('depth', 'gray16le'), motion: wr('motion', 'rgb48le') };
    const frames = [], ms = { render: 0, depth: 0, upload: 0 };
    for (let f = s.f0; f < s.f1; f++) { const n = f - s.f0, m = await page.evaluate((t, i, b, o) => window.plate(t, i, b, o), f / FPS, s.i, `/plate/${s.id}/${n}`, { subframes });
      frames.push({ n, t: +m.t.toFixed(4), focus: m.focus, f: m.f, gain: m.gain }); for (const k in ms) ms[k] += m.ms[k]; if (m.clamped && n === 0) console.log(`  ${s.id}: focus closer than the lens's minimum focus, clamped`); }
    await page.evaluate(() => window.flushPlates()); const loop = (Date.now() - ts) / 1000;
    for (const k of ['color', 'depth', 'motion']) { W[k].stdin.end(); await new Promise(r => W[k].on('close', r)); }
    // dailies: a 480p preview of the colour plate (a plain gamma, no grade)
    const lut = `'clip(pow(val/${Math.round(65535 / info.head)},0.72)*65535,0,65535)'`;
    spawnSync(ffmpegPath, ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(sdir, 'color', '%05d.png'), '-vf', `format=rgb48le,lutrgb=r=${lut}:g=${lut}:b=${lut},scale=480:854:flags=neighbor,format=yuv420p`, '-c:v', 'libx264', '-crf', '22', path.join(sdir, 'preview.mp4')]);
    spawnSync('find', [sdir, '-name', '._*', '-delete']); await new Promise(res => setTimeout(res, 500));   // macOS AppleDouble files on the exFAT T7
    const wall = (Date.now() - ts) / 1000, size = du(sdir), meta = { ...s, frames, subframes: subframes || 'auto (4; 8 for fast moves)', plate: info, timings: { wall, loop, loopPerFrameMs: +(loop * 1000 / frames.length).toFixed(1), perFrameMs: +(wall * 1000 / frames.length).toFixed(1), pageMs: Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, +(v / frames.length).toFixed(1)])) }, bytes: size };
    fs.writeFileSync(path.join(sdir, 'shot.json'), JSON.stringify(meta, null, 1)); stats[s.id] = { id: s.id, frames: frames.length, wall, bytes: size };
    console.log(`  ${s.id.padEnd(6)} ${String(frames.length).padStart(4)} frames · ${s.lens} f/${s.stop} ${s.size} ${s.move}${s.handheld ? ' handheld ' + s.handheld : ''} · ${wall.toFixed(1)} s · ${mb(size)}`); }
  await browser.close(); server.close(); wss.close();
  const take = { slug, take: nTake, end: TL.end, frames: N, fps: FPS, plate: info, timeline: TL, shots: todo.map(s => ({ id: s.id, f0: s.f0, f1: s.f1, t0: s.t0, dur: s.dur, size: s.size, subject: String(s.subject ?? ''), cover: !!s.cover, scene: s.scene ?? null, note: s.note || '', ...(stats[s.id] ? { wall: stats[s.id].wall, bytes: stats[s.id].bytes } : {}) })),
    checks, subframes: subframes || 'auto', shotAt: new Date().toISOString(), timings: { setup: (T1 - T0) / 1000, total: (Date.now() - T0) / 1000 }, bytes: du(takeDir) };
  // a re-shoot of one shot keeps the take's original timing and logs itself separately
  if (shotArg && prevTake) { take.timings = prevTake.timings; take.shotAt = prevTake.shotAt; take.reshoots = [...(prevTake.reshoots || []), { shot: shotArg, at: new Date().toISOString(), seconds: (Date.now() - T0) / 1000 }]; }
  fs.writeFileSync(path.join(takeDir, 'take.json'), JSON.stringify(take, null, 1));
  take.ssdFreeAfterGB = +freeGB().toFixed(1); fs.writeFileSync(path.join(takeDir, 'take.json'), JSON.stringify(take, null, 1)); console.log(`SSD free after the shoot: ${take.ssdFreeAfterGB} GB`);
  console.log(`SHOT take ${nTake}: ${take.frames} frames in ${take.timings.total.toFixed(1)} s · plates ${mb(take.bytes)} → ${takeDir}`);
  return { takeDir, take };
}
