// Cut the hand-built PS1 characters out of each Guess The Horror episode (their own scene.js, nothing from ps1-props) as transparent PNGs.
//   node guess-profile/character-cutouts.mjs                     every character in CAST → guess-profile/characters/<episode>-<name>.png + contact.png
//   node guess-profile/character-cutouts.mjs --only=<ep>-<name>  just that one
//   node guess-profile/character-cutouts.mjs --scan=<ep>-<name>  a sheet of that character at every second it is on screen (to pick t)
// The episode loads over a local server like notebook/make.mjs, gets its real timeline (make.mjs --timeline, all cached audio), is seeked to t
// so the character has that scene's pose and lights, then everything else is hidden and the character is rendered on its own from a 3/4 camera
// into a magenta, zero-alpha target. The episode's own gamma and grade plus the 15-bit Bayer dither are applied; the edges stay hard pixels.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..'), outDir = path.join(here, 'characters');
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
// t: a moment the character stands in its own scene; yaw: radians from straight-on (+ = their left side to camera); h: output height in px (×2 on the banner)
// pose: optional JS run on the person p after the seek (p.apply(PS1.POSE(...)) etc.) to stand them up straight
export const CAST = [
  { ep: 'the-cursed-tape-ps1', name: 'the-girl', label: 'The girl from the well', expr: 'O.ghost', t: 67, yaw: -.5, h: 290 },
  { ep: 'the-rusted-truck', name: 'the-creeper', label: 'The Creeper', expr: 'O.creS', t: 50, yaw: -.55, h: 335 },
  { ep: 'the-black-woods', name: 'heather', label: 'Heather with the camera', expr: 'O.cHea', t: 34, yaw: -.45, h: 285 },
  { ep: 'the-hitchhiker', name: 'the-hitchhiker', label: 'The hitchhiker', expr: 'O.hitOut', t: 5, yaw: -.5, h: 290 },
  { ep: 'the-hitchhiker', name: 'the-butcher', label: 'The butcher with the chainsaw', expr: 'O.butR', t: 64, yaw: -.5, h: 345 },
  { ep: 'the-babysitter', name: 'the-shape', label: 'The Shape', expr: 'O.shapeY', t: 31, yaw: .5, h: 305 },
  { ep: 'the-babysitter', name: 'the-sheet-ghost', label: 'The sheet ghost', expr: 'O.ghost', t: 39, yaw: .45, h: 290 },
  { ep: 'the-lockdown', name: 'the-leader', label: 'The masked leader', expr: 'O.gang[0]', t: 56, yaw: .5, h: 290 },
  { ep: 'the-lockdown', name: 'the-machete-mask', label: 'The masked man with the machete', expr: 'O.att', t: 50, yaw: .5, h: 300 },
  // the rest of the cast (no t: the moment is picked automatically: on screen, standing tallest, best lit); they line up along the bottom of the banner
  { ep: 'the-cursed-tape-ps1', name: 'rachel', label: 'Rachel', expr: 'O.her', h: 210, cast: true },
  { ep: 'the-cursed-tape-ps1', name: 'noah', label: 'Noah', expr: 'O.himA', h: 210, cast: true },
  { ep: 'the-cursed-tape-ps1', name: 'aidan', label: 'Aidan', expr: 'O.kid', h: 135, cast: true },
  { ep: 'the-rusted-truck', name: 'darry', label: 'Darry', expr: 'O.darD', h: 210, cast: true },
  { ep: 'the-rusted-truck', name: 'trish', label: 'Trish', expr: 'O.triC', h: 210, cast: true },
  { ep: 'the-rusted-truck', name: 'waitress', label: 'The waitress', expr: 'O.wait', h: 210, cast: true },
  { ep: 'the-black-woods', name: 'mike', label: 'Mike', expr: 'O.bMik', h: 210, cast: true },
  { ep: 'the-black-woods', name: 'josh', label: 'Josh', expr: 'O.bJos', h: 210, cast: true },
  { ep: 'the-black-woods', name: 'townsman', label: 'The man in town', expr: 'O.town', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'sally', label: 'Sally', expr: 'O.salF', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'franklin', label: 'Franklin', expr: 'O.fraF', with: ['O.chair'], h: 185, cast: true },
  { ep: 'the-hitchhiker', name: 'kirk', label: 'Kirk', expr: 'O.kirF', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'pam', label: 'Pam', expr: 'O.pamF', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'jerry', label: 'Jerry', expr: 'O.jerF', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'old-man', label: 'The old man at the station', expr: 'O.oldS', h: 210, cast: true },
  { ep: 'the-hitchhiker', name: 'grandpa', label: 'Grandpa', expr: 'O.grand', h: 170, cast: true },
  { ep: 'the-babysitter', name: 'laurie', label: 'Laurie', expr: 'O.lau', h: 210, cast: true },
  { ep: 'the-babysitter', name: 'annie', label: 'Annie', expr: 'O.ann', h: 210, cast: true },
  { ep: 'the-babysitter', name: 'lynda', label: 'Lynda', expr: 'O.lyn', h: 210, cast: true },
  { ep: 'the-babysitter', name: 'tommy', label: 'Tommy', expr: 'O.tom', h: 150, cast: true },
  { ep: 'the-babysitter', name: 'loomis', label: 'The doctor', expr: 'O.doc', h: 210, cast: true },
  { ep: 'the-babysitter', name: 'young-michael', label: 'The boy in the clown suit', expr: 'O.boy', h: 145, cast: true },
  { ep: 'the-lockdown', name: 'dad', label: 'Dad', expr: 'O.dad', h: 210, cast: true },
  { ep: 'the-lockdown', name: 'mom', label: 'Mom', expr: 'O.mom', h: 210, cast: true },
  { ep: 'the-lockdown', name: 'daughter', label: 'The daughter', expr: 'O.girl', h: 210, cast: true },
  { ep: 'the-lockdown', name: 'son', label: 'The son', expr: 'O.boy', h: 155, cast: true },
  { ep: 'the-lockdown', name: 'stranger', label: 'The stranger', expr: 'O.str', h: 210, cast: true },
  { ep: 'the-lockdown', name: 'grace', label: 'Grace', expr: 'O.grace', h: 210, cast: true },
  { ep: 'the-lockdown', name: 'neighbour', label: 'The neighbour', expr: 'O.nb1', h: 210, cast: true },
];

const scratch = path.join(here, '.cutout-tl'); fs.mkdirSync(scratch, { recursive: true }); fs.mkdirSync(outDir, { recursive: true });
const timeline = ep => { const f = path.join(scratch, ep + '.json'), d = path.join(root, 'conspiracy', 'episodes', ep);
  if (!fs.existsSync(f)) { const r = spawnSync(process.execPath, [path.join(root, 'notebook', 'make.mjs'), path.join(d, 'spec.js'), path.join(d, 'index.html'), path.join(scratch, ep + '.mp4'), `--timeline=${f}`], { cwd: root, stdio: 'inherit' }); if (r.status) process.exit(1); }
  return JSON.parse(fs.readFileSync(f, 'utf8')); };

// ---- runs in the page: render one character alone ----
function cutInPage(c, t, px) {
  const S = PS1.S, O = S.O, THREE = window.THREE, U = PS1.U, R = PS1.renderer;
  window.seek(t); const p = (0, eval)('(O) => ' + c.expr)(O); if (!p || !p.G) return { err: 'no character ' + c.expr };
  if (c.pose) new Function('p', 'PS1', 'V', c.pose)(p, PS1, PS1.V);
  const G = p.G; S.scene.updateMatrixWorld(true);
  const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  if (!shown(G) || G.getWorldPosition(new THREE.Vector3()).y < -20) return { err: 'not on screen at ' + t };
  // hide everything but the character (its own hidden bits, like a blood pool parked at y -99, stay hidden)
  const extra = (c.with || []).map(e => (0, eval)('(O) => ' + e)(O)).filter(Boolean), keep = new Set(); for (const g of [G, ...extra]) g.traverse(o => keep.add(o)); const anc = new Set(); for (const g of [G, ...extra]) for (let q = g.parent; q; q = q.parent) anc.add(q);
  const saved = []; S.scene.traverse(o => { saved.push([o, o.visible]); if (!keep.has(o) && !anc.has(o)) o.visible = false; });
  // bounds of what is actually drawn
  const box = new THREE.Box3(); for (const g of [G, ...extra]) g.traverse(o => { if (o.isMesh && shown(o)) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.min.y > -20) box.union(b); } });
  const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  // 3/4 view: the character's facing (+z local) turned by yaw, camera a little above chest height looking slightly down
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(G.getWorldQuaternion(new THREE.Quaternion())); fwd.y = 0; fwd.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), c.yaw ?? .5);
  const H = Math.round(px), W = Math.round(px * .8), cam = new THREE.PerspectiveCamera(16, W / H, .1, 400);
  const corners = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  let dist = size.y / (2 * Math.tan(8 * Math.PI / 180)) * 1.1; const look = ctr.clone();
  for (let i = 0; i < 4; i++) { cam.position.copy(look).addScaledVector(fwd, dist).add(new THREE.Vector3(0, dist * .06, 0)); cam.lookAt(look); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    let mx = 0, my = 0, cx = 0, cy = 0, n = 0; const pr = corners.map(v => v.clone().project(cam)); const xs = pr.map(v => v.x), ys = pr.map(v => v.y);
    mx = (Math.max(...xs) - Math.min(...xs)) / 2; my = (Math.max(...ys) - Math.min(...ys)) / 2; cx = (Math.max(...xs) + Math.min(...xs)) / 2; cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    // re-centre, then scale the distance so the height fills 92% of the frame (width gets what it needs below)
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1), half = dist * Math.tan(8 * Math.PI / 180);
    look.addScaledVector(right, cx * half * cam.aspect).addScaledVector(up, cy * half); dist *= Math.max(my / .92, mx / .96); }
  const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const keepU = { snap: U.snap.value.clone(), fn: U.fogNear.value, ff: U.fogFar.value, fc: U.fogColor.value.clone() };
  U.snap.value.set(W, H); U.fogNear.value = 1e4; U.fogFar.value = 2e4; U.fogColor.value.set('#ff00ff');
  const cc = R.getClearColor(new THREE.Color()), ca = R.getClearAlpha();
  R.setRenderTarget(rt); R.setClearColor('#ff00ff', 0); R.clear(); R.render(S.scene, cam); R.setRenderTarget(null);
  const buf = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  R.setClearColor(cc, ca); U.snap.value.copy(keepU.snap); U.fogNear.value = keepU.fn; U.fogFar.value = keepU.ff; U.fogColor.value.copy(keepU.fc); for (const [o, v] of saved) o.visible = v; rt.dispose();
  // the episode's post: gamma .72, then the scene's grade, then 15-bit colour with the 4x4 Bayer dither. Key: alpha 0 (cleared) or pure magenta
  const G8 = S.grade || PS1.GRADES.neutral, bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const q = cv.getContext('2d'), img = q.createImageData(W, H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1, lum = 0, n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = ((H - 1 - y) * W + x) * 4, d = (y * W + x) * 4;
    const r0 = buf[s], g0 = buf[s + 1], b0 = buf[s + 2], a0 = buf[s + 3];
    if (a0 < 128 || (r0 > 235 && g0 < 25 && b0 > 235)) continue;
    let c3 = [r0, g0, b0].map((v, i) => Math.pow(v / 255, .72) * G8.gain[i] + G8.lift[i]); const l = c3[0] * .3 + c3[1] * .59 + c3[2] * .11;
    c3 = c3.map(v => ((l + (v - l) * G8.sat) - .5) * G8.contrast + .5); c3[0] += G8.temp * .07; c3[2] -= G8.temp * .07;
    const bb = bay[(y % 4) * 4 + (x % 4)] / 16 - .5; c3 = c3.map(v => Math.max(0, Math.min(1, Math.floor(v * 31 + bb + .5) / 31)));
    img.data[d] = c3[0] * 255; img.data[d + 1] = c3[1] * 255; img.data[d + 2] = c3[2] * 255; img.data[d + 3] = 255;
    lum += c3[0] * .3 + c3[1] * .59 + c3[2] * .11; n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return { err: 'nothing drawn at ' + t };
  // edge check: anything touching the frame border means the character is clipped
  const clipped = x0 === 0 || y0 === 0 || x1 === W - 1 || y1 === H - 1;
  q.putImageData(img, 0, 0); const out = document.createElement('canvas'); out.width = x1 - x0 + 3; out.height = y1 - y0 + 3; out.getContext('2d').drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 1, 1, x1 - x0 + 1, y1 - y0 + 1);
  return { png: out.toDataURL('image/png'), w: out.width, h: out.height, clipped, lum: lum / n };
}

const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 600000, args: ['--force-color-profile=srgb'] });
const openEp = async ep => { const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920 }); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/studio/episodes/${ep}/index.html`); await page.waitForFunction('window.ready === true', { timeout: 120000 });
  if (errs.length) throw new Error(ep + ': ' + errs.join('\n')); await page.evaluate(tl => window.setTL(tl), timeline(ep)); await page.evaluate(() => window.seek(0)); return page; };
const save = (f, url) => fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
const key = c => `${c.ep}-${c.name}`;

const scan = arg('scan'), only = arg('only');
if (scan) {
  const c = CAST.find(c => key(c) === scan); if (!c) { console.log('unknown', scan); process.exit(1); }
  const page = await openEp(c.ep), end = await page.evaluate(() => NB.TL.end), shots = [];
  for (let t = 1; t < end - 3; t += 1) { const r = await page.evaluate(cutInPage, c, t, 160); if (!r.err) shots.push({ t, ...r }); }
  const sheet = await page.evaluate(async shots => { const cols = 10, cw = 140, ch = 170, rows = Math.ceil(shots.length / cols), cv = document.createElement('canvas'); cv.width = cols * cw; cv.height = rows * ch; const q = cv.getContext('2d');
    q.fillStyle = '#3a3a3a'; q.fillRect(0, 0, cv.width, cv.height); q.imageSmoothingEnabled = false; q.font = 'bold 14px Arial'; q.fillStyle = '#fff';
    for (const [i, s] of shots.entries()) { const im = new Image(); im.src = s.png; await im.decode(); const k = Math.min(1, (ch - 20) / im.height, (cw - 6) / im.width); q.drawImage(im, (i % cols) * cw + (cw - im.width * k) / 2, Math.floor(i / cols) * ch + 18, im.width * k, im.height * k); q.fillText('t' + s.t + (s.clipped ? ' CLIP' : ''), (i % cols) * cw + 4, Math.floor(i / cols) * ch + 14); }
    return cv.toDataURL('image/png'); }, shots);
  const f = path.join(scratch, `scan-${scan}.png`); save(f, sheet); console.log(shots.length, 'frames →', f);
} else {
  const list = CAST.filter(c => !only || key(c) === only), pages = {}, done = [];
  for (const c of list) { const page = pages[c.ep] || (pages[c.ep] = await openEp(c.ep));
    if (c.t == null) { const end = await page.evaluate(() => NB.TL.end); let best = null;   // standing tallest (not sitting or bent) and best lit, never clipped
      for (let t = 1; t < end - 3; t += .5) { const r = await page.evaluate(cutInPage, c, t, 120); if (r.err || r.clipped) continue; const sc = r.h / Math.max(r.w, r.h * .3) * (.35 + r.lum); if (!best || sc > best.sc) best = { t, sc }; }
      if (!best) { console.log('FAIL', key(c), 'never on screen'); continue; } c.t = best.t; }
    const r = await page.evaluate(cutInPage, c, c.t, c.h);
    if (r.err) { console.log('FAIL', key(c), r.err); continue; }
    const f = path.join(outDir, key(c) + '.png'); save(f, r.png); done.push({ ...c, f, w: r.w, h: r.h }); console.log(key(c), 't=' + c.t, `${r.w}x${r.h}`, r.clipped ? 'CLIPPED AT THE FRAME EDGE' : 'ok'); }
  if (!only) { // contact sheet: every cutout at 2x nearest on a mid grey (fringe shows) with its name
    const page = Object.values(pages)[0], items = done.map(d => ({ png: 'data:image/png;base64,' + fs.readFileSync(d.f).toString('base64'), label: `${d.ep} / ${d.name}` }));
    const sheet = await page.evaluate(async items => { const pad = 30, imgs = []; for (const it of items) { const im = new Image(); im.src = it.png; await im.decode(); imgs.push(im); }
      const W = imgs.reduce((s, im) => s + im.width * 2 + pad, pad), H = Math.max(...imgs.map(im => im.height * 2)) + 80, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const q = cv.getContext('2d');
      q.fillStyle = '#6a6a6a'; q.fillRect(0, 0, W, H); q.imageSmoothingEnabled = false; q.font = 'bold 15px Arial'; q.fillStyle = '#fff'; let x = pad;
      imgs.forEach((im, i) => { q.drawImage(im, x, H - 40 - im.height * 2, im.width * 2, im.height * 2); q.fillText(items[i].label, x, H - 14); x += im.width * 2 + pad; }); return cv.toDataURL('image/png'); }, items);
    save(path.join(outDir, 'contact.png'), sheet); console.log('contact →', path.join(outDir, 'contact.png')); }
}
await browser.close(); server.close();
