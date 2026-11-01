// Countdown to Strange: the Conspiracy Theories woodcut pop-up style, widened to a 16:9 long-form frame (1920x1080).
// A copy of studio/lib/woodcut.js (same drawers, people and ink tools) with a landscape broadsheet, a wide sky card,
// lower-third captions, a countdown title card that folds up off the paper, and a non-looping ending (fold back + fade out).
// Load after three.min.js and /notebook/lib.js. An episode's scene.js calls WC.episode({...}) — see templates/scene.js.
// Everything is a pure function of time t (window.seek), so frames render deterministically.
(function () {
const WC = window.WC = {};
const { P, lerp, eo, eio, back, clamp, rng, st, en } = NB;
const W = 1920, H = 1080, PW = 3200, PH = 1800, U = 24 / PW, PAGE_H = 13.5, ZTOP = PAGE_H / 2 / Math.tan(15 * Math.PI / 180);
const MISSING = window.MISSING = new Set(), norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
// at() that remembers words it couldn't find (render.mjs prints them) — a typo would otherwise silently fire at the line start
const at = (id, word, nth = 0) => { const l = NB.TL && NB.TL.lines[id]; if (!l) MISSING.add(id); else if (!l.words.some(w => norm(w.w).startsWith(norm(word)))) MISSING.add(`${id}:${word}`); return NB.at(id, word, nth); };
// a time reference: ['L3', 'word', offset] | ['L3', null, offset] (line start) | ['L3', '$end', offset]
const T = ([l, w, off = 0]) => (w === '$end' ? en(l) : w ? at(l, w) : st(l)) + off;
Object.assign(WC, { P, lerp, eo, eio, back, clamp, rng, at, st, en, T, W, H, PW, PH, U, ZTOP, ei: NB.ei });
const toW = WC.toW = (px, py) => [(px - PW / 2) * U, (PH / 2 - py) * U];
const C = WC.C = { INK: '#2a1f18', RED: '#b9563c', BLOOD: '#9c2a1e', BLUE: '#6f8aac', BLK: '#33261f', TAN: '#dcbc8c', OCHRE: '#e2b04e', GOLD: '#c9a23a', GREEN: '#7f9c5c', SKIN: '#efd6b0', SMOKE: '#8a9bb2', ROOF: '#a9533b', WALL: '#e6d7b6', STONE: '#c9b896', PAPER: '#efe6cf', LIT: '#f3c95a', ORANGE: '#e8873a' };
const { INK, RED, BLOOD, BLUE, BLK, TAN, OCHRE, GOLD, GREEN, SKIN, SMOKE, ROOF, WALL, STONE } = C;
const LUM = WC.LUM = 'Luminari, "Apple Chancery", serif';
const cnv = WC.cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const texOf = WC.texOf = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };

// ================= ink tools =================
function inkLine(g, pts, w = 4, col = INK, seed = 1, close = false) {
  const r = rng(seed); for (const [pass, a, off] of [[0, .92, 0], [1, .35, .9]]) {
    g.beginPath(); const p = pts.map(([x, y]) => [x + (r() - .5) * off * 2, y + (r() - .5) * off * 2]);
    g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; g.quadraticCurveTo(p[i][0], p[i][1], mx, my); }
    const l = p[p.length - 1]; g.lineTo(l[0], l[1]); if (close) g.closePath();
    g.lineWidth = pass ? w * .6 : w; g.strokeStyle = col; g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  g.globalAlpha = 1;
}
function shape(g, pts, fill, w = 4, seed = 1) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } g.lineTo(...pts[pts.length - 1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } inkLine(g, [...pts, pts[0]], w, INK, seed); }
function hatchIn(g, clipPts, x0, y0, x1, y1, gap = 9, ang = -1, lw = 1.6, alpha = .5, seed = 3) {
  g.save(); g.beginPath(); g.moveTo(...clipPts[0]); clipPts.forEach(p => g.lineTo(...p)); g.closePath(); g.clip();
  g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const r = rng(seed), d = Math.hypot(x1 - x0, y1 - y0), ca = Math.cos(ang), sa = Math.sin(ang), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  g.strokeStyle = INK; g.lineWidth = lw; g.globalAlpha = alpha;
  for (let o = -d; o < d; o += gap) { const ox = cx - sa * o, oy = cy + ca * o; g.beginPath(); g.moveTo(ox - ca * d + (r() - .5) * 3, oy - sa * d); g.lineTo(ox + ca * d, oy + sa * d + (r() - .5) * 3); g.stroke(); }
  g.restore(); g.globalAlpha = 1;
}
function inkPoly(g, pts, w = 4, col = INK, seed = 1, close = true) {
  const r = rng(seed), P2 = close ? [...pts, pts[0]] : pts, seg = [];
  for (let i = 0; i < P2.length - 1; i++) { const [x0, y0] = P2[i], [x1, y1] = P2[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40)); for (let k = 0; k < n; k++) seg.push([x0 + (x1 - x0) * k / n + (r() - .5) * 1.6, y0 + (y1 - y0) * k / n + (r() - .5) * 1.6]); }
  seg.push(P2[P2.length - 1]);
  for (const [a, f, off] of [[.92, 1, 0], [.35, .6, .9]]) { g.beginPath(); seg.forEach(([x, y], i) => { const xx = x + (r() - .5) * off * 2, yy = y + (r() - .5) * off * 2; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }); g.lineWidth = w * f; g.strokeStyle = col; g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  g.globalAlpha = 1;
}
function block(g, pts, fill, w = 4, seed = 1) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } inkPoly(g, pts, w, INK, seed); }
const ell = (x, y, rx, ry, rot, n = 18) => Array.from({ length: n }, (_, k) => { const a = k / n * 6.283, c = Math.cos(a) * rx, s = Math.sin(a) * ry; return [x + c * Math.cos(rot) - s * Math.sin(rot), y + c * Math.sin(rot) + s * Math.cos(rot)]; });
const circ = (x, y, r, n = 28) => NB.circlePts(x, y, r, n);
// hand-colouring: the wash is brushed on a little off-register from the black line, like the 16th-century prints
function wash(g, pts, col, seed, a = .92, off = 5) { const r = rng(seed), dx = (r() - .5) * off * 2, dy = (r() - .5) * off * 2; g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)); g.closePath(); g.fill(); g.restore(); }
// scissor-cut paper edge around anything drawn on a transparent canvas (this is what makes it read as a pop-up)
function cutout(src, pad = 8) {
  const c = cnv(src.width, src.height), g = c.getContext('2d'), tint = cnv(src.width, src.height), tg = tint.getContext('2d');
  tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#f3ead6'; tg.fillRect(0, 0, src.width, src.height);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.drawImage(tint, Math.cos(a) * pad, Math.sin(a) * pad); }
  g.globalAlpha = .5; g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#b49b72'; g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.drawImage(tint, Math.cos(a) * (pad - 2.5), Math.sin(a) * (pad - 2.5)); }
  g.drawImage(src, 0, 0); return c;
}
function paper(w, h, seed, edge = .4) {
  const c = cnv(w, h), g = c.getContext('2d'), r = rng(seed);
  const b = g.createRadialGradient(w / 2, h * .45, 50, w / 2, h / 2, Math.max(w, h) * .75); b.addColorStop(0, '#f3ebd8'); b.addColorStop(.7, '#e9dcc0'); b.addColorStop(1, '#d4c09a'); g.fillStyle = b; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 60000; i++) { const x = r() * w, y = r() * h, rad = 50 + r() * 260, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(150,110,60,${.02 + r() * .05})`); gr.addColorStop(1, 'rgba(150,110,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  for (let i = 0; i < w * h / 28; i++) { g.fillStyle = r() < .55 ? `rgba(90,60,25,${r() * .07})` : `rgba(255,250,238,${r() * .12})`; const z = 1 + r() * 2; g.fillRect(r() * w, r() * h, z, z); }
  for (let i = 0; i < w * h / 34000; i++) { g.fillStyle = `rgba(130,80,35,${.06 + r() * .12})`; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 4, 0, 6.283); g.fill(); }
  if (edge) { const e = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .42, w / 2, h / 2, Math.max(w, h) * .62); e.addColorStop(0, 'rgba(70,45,20,0)'); e.addColorStop(1, `rgba(70,45,20,${edge})`); g.fillStyle = e; g.fillRect(0, 0, w, h); }
  return c;
}
Object.assign(WC, { inkLine, shape, hatchIn, inkPoly, block, ell, circ, wash, cutout, paper });

// ================= woodcut drawers (centred on 0,0; call inside g.save/translate) =================
function drawOrb(g, R, col, seed) {
  const dark = col === BLK || col === '#251b16';
  wash(g, circ(0, 0, R, 30), col, seed, .97, R * .08);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.clip(); g.lineCap = 'round';
  for (let k = 1; k <= 4; k++) { g.strokeStyle = dark ? 'rgba(170,160,150,.5)' : 'rgba(42,31,24,.55)'; g.lineWidth = Math.max(1.5, R * .045); g.beginPath(); g.arc(-k * R * .15, -k * R * .15, R, -.2 * Math.PI, .9 * Math.PI); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,248,232,.8)'; g.lineWidth = R * .08; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, R * .64, 3.6, 4.5); g.stroke();
  inkLine(g, circ(0, 0, R, 26), Math.max(2.5, R * .07), INK, seed + 1);
}
function drawSun(g, R, seed, face = true, cols = [OCHRE, RED]) {
  const F = R * .48, pt = (rr, aa) => [Math.cos(aa) * rr, Math.sin(aa) * rr];
  for (let k = 0; k < 26; k++) { const a = k / 26 * 6.283, L = R * (k % 2 ? .8 : 1), w = .1;
    shape(g, [pt(F * .92, a - w), pt(F + (L - F) * .35, a - w * .5 + .07), pt(F + (L - F) * .7, a - .03), pt(L, a + .04), pt(F + (L - F) * .6, a + w * .5 + .06), pt(F + (L - F) * .3, a + w * .8 - .02), pt(F * .92, a + w)], cols[k % 2], Math.max(2, R * .008), seed + k); }
  wash(g, circ(0, 0, F, 30), '#e9c46a', seed + 40, .98, 3);
  hatchIn(g, circ(0, 0, F * .92, 24), F * .2, -F, F, F, Math.max(5, F * .05), -1, 1.4, .4, seed + 60);
  inkLine(g, circ(0, 0, F, 28), Math.max(2.5, F * .025), INK, seed + 41); inkLine(g, circ(0, 0, F * .9, 28), 1.6, INK, seed + 42);
  if (!face) return;
  const lw = Math.max(2, F * .022);
  for (const s of [-1, 1]) { const ex = s * F * .34, ey = -F * .12;
    inkLine(g, [[ex - F * .16, ey], [ex, ey - F * .08], [ex + F * .16, ey]], lw * 1.3, INK, seed + 43 + s);
    inkLine(g, [[ex - F * .14, ey + F * .02], [ex, ey + F * .06], [ex + F * .14, ey + F * .02]], lw, INK, seed + 45 + s);
    g.fillStyle = INK; g.beginPath(); g.arc(ex + F * .03, ey - F * .01, F * .045, 0, 6.283); g.fill();
    inkLine(g, [[ex - F * .2, ey - F * .2], [ex, ey - F * .27], [ex + F * .18, ey - F * .2]], lw * 1.3, INK, seed + 47 + s); }
  inkLine(g, [[F * .02, -F * .1], [-F * .04, F * .2], [F * .08, F * .24]], lw * 1.2, INK, seed + 50);
  inkLine(g, [[-F * .26, F * .48], [0, F * .42], [F * .26, F * .48]], lw * 1.4, INK, seed + 51);
  inkLine(g, [[-F * .14, F * .56], [F * .14, F * .56]], lw, INK, seed + 52);
}
function crescentPts(L) { const pts = [], N = 26, cy = -L * .3, Ro = L * .5;
  for (let k = 0; k <= N; k++) { const th = (18 + k * 144 / N) * Math.PI / 180; pts.push([Math.cos(th) * Ro, cy + Math.sin(th) * Ro]); }
  for (let k = N; k >= 0; k--) { const th = (18 + k * 144 / N) * Math.PI / 180, tt = L * .13 * Math.sin(Math.PI * k / N) + 2; pts.push([Math.cos(th) * (Ro - tt), cy + Math.sin(th) * (Ro - tt)]); }
  return pts; }
function drawCrescent(g, L, seed, col = BLOOD) { const pts = crescentPts(L); wash(g, pts, col, seed, .96, 5); hatchIn(g, pts, -L / 2, 0, L / 2, L * .25, 9, .9, 1.6, .45, seed + 1); inkPoly(g, pts, 4, INK, seed + 2); }
function drawTube(g, L, seed) {
  const R = L * .11, x0 = -L / 2 + R * .6, x1 = L / 2 - R * .45;
  const body = [[x1, -R], [x0, -R], ...Array.from({ length: 9 }, (_, k) => { const a = -Math.PI / 2 - k / 8 * Math.PI; return [x0 + Math.cos(a) * R * .55, Math.sin(a) * R]; }), [x1, R]];
  wash(g, body, BLUE, seed, .96, 4); hatchIn(g, body, x0 - R, R * .25, x1, R, 7, 0, 1.4, .5, seed + 1);
  for (let k = 0; k < 4; k++) { g.save(); g.translate(x0 + R * .9 + k * (x1 - x0 - R * 1.7) / 3, 0); drawOrb(g, R * .6, RED, seed + 10 + k); g.restore(); }
  inkPoly(g, body, 4, INK, seed + 2);
  for (const bx of [x0 + R * .25, x1 - R * .55]) inkLine(g, [[bx, -R], [bx + R * .14, 0], [bx, R]], 3, INK, seed + 20 + bx);
  const mo = circ(x1, 0, R * .4, 22).map(([x, y]) => [x, y * 2.5]); wash(g, mo, '#2c2a33', seed + 3, 1, 1); inkLine(g, mo, 4, INK, seed + 4);
}
function drawRod(g, L, seed) { const h = L * .04, pts = [[-L / 2, -h * .8], [L / 2, -h], [L / 2 - 6, h], [-L / 2 + 4, h * .8]]; wash(g, pts, TAN, seed, .97, 3); inkLine(g, [[-L / 2 + 8, h * .45], [L / 2 - 10, h * .55]], 5, RED, seed + 1); inkPoly(g, pts, 3.5, INK, seed + 9); }
function drawCross(g, S, seed) { const a = S * .5, b = S * .12, pts = [[-b, -a], [b, -a], [b, -b], [a, -b], [a, b], [b, b], [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b]]; wash(g, pts, RED, seed, .96, 4); hatchIn(g, pts, -a, 0, a, a, 7, -.8, 1.4, .45, seed + 1); inkPoly(g, pts, 4, INK, seed + 2); }
function drawSpear(g, L, seed) { const pts = [[-L / 2, 0], [L * .3, -L * .055], [L * .34, -L * .085], [L / 2, -L * .1], [L * .43, 0], [L / 2, L * .1], [L * .34, L * .085], [L * .3, L * .055]]; wash(g, pts, '#251b16', seed, 1, 3); inkPoly(g, pts, 4, INK, seed + 1); }
function drawBurst(g, R, seed, cols = [OCHRE, RED]) { const r = rng(seed), out = [], inn = [];
  for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, rr = k % 2 ? R * (.42 + r() * .1) : R * (.8 + r() * .2); out.push([Math.cos(a) * rr, Math.sin(a) * rr]); inn.push([Math.cos(a) * rr * .55, Math.sin(a) * rr * .55]); }
  wash(g, out, cols[0], seed, .97, 3); wash(g, inn, cols[1], seed + 1, .92, 2); inkPoly(g, out, 3.5, INK, seed + 2); g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(0, 0, R * .16, 0, 6.283); g.fill(); }
function flamePts(Hh, f, sc = 1) { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * 6.283, y = -Math.cos(t) * Hh * .5 * sc, wv = Math.sin(y * .05 + f * 2.3) * Hh * .06 * (1 - Math.cos(t)) * .5; pts.push([Math.sin(t) * Math.pow(Math.sin(t / 2), 1.6) * Hh * .3 * sc + (y < 0 ? wv : 0), y + Hh * (1 - sc) * .22]); } return pts; }
function drawFlame(g, Hh, f, seed) { const o = flamePts(Hh, f), m = flamePts(Hh, f + 1, .64), c = flamePts(Hh, f + 2, .32); wash(g, o, RED, seed, .96, 2); wash(g, m, OCHRE, seed + 1, .96, 2); wash(g, c, '#fbefc8', seed + 2, .96, 1); inkLine(g, o, 3.5, INK, seed + 3); inkLine(g, m, 2, 'rgba(42,31,24,.6)', seed + 4); }
function drawIce(g, R, seed) { const hex = Array.from({ length: 6 }, (_, k) => [Math.cos(k * Math.PI / 3) * R, Math.sin(k * Math.PI / 3) * R]); wash(g, hex, '#d6e6f2', seed, .94, 2);
  for (let k = 0; k < 3; k++) inkLine(g, [hex[k], hex[k + 3]], 1.6, 'rgba(42,31,24,.55)', seed + k); inkPoly(g, hex, 3, INK, seed + 6); }
// a woodcut star: four long points, four short
function drawStar(g, R, seed, col = '#f6e7b0') { const pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283 - Math.PI / 2, rr = k % 4 === 0 ? R : k % 2 ? R * .28 : R * .55; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } wash(g, pts, col, seed, 1, 1); inkPoly(g, pts, Math.max(1.5, R * .06), INK, seed + 1); }
// a light in the night sky, cut in wood: soft washed halo, little ink rays, a hot core
function drawGlow(g, R, col, seed, rays = true) {
  for (const [rr, a] of [[1, .22], [.78, .35], [.56, .6]]) { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(0, 0, R * rr, 0, 6.283); g.fill(); } g.globalAlpha = 1;
  if (rays) for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283, r0 = R * .45, r1 = R * (k % 2 ? .7 : .92); inkLine(g, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r1, Math.sin(a) * r1]], Math.max(1.5, R * .04), 'rgba(42,31,24,.7)', seed + k); }
  shape(g, circ(0, 0, R * .3, 20), '#fff4d2', Math.max(2, R * .05), seed + 20);
}
function drawCloud(g, cx, cy, s, seed, fill = '#f1e8d6') { const r = rng(seed), Cs = [];
  for (let k = 0; k < 8; k++) { const a = k / 7; Cs.push([cx + (a - .5) * 300 * s, cy - Math.sin(a * Math.PI) * 50 * s + (r() - .5) * 10, (24 + Math.sin(a * Math.PI) * 26) * s]); }
  g.lineWidth = 5; g.strokeStyle = INK; Cs.forEach(([x, y, rad]) => { g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.stroke(); });
  g.fillStyle = fill; Cs.forEach(([x, y, rad]) => { g.beginPath(); g.arc(x, y, rad - 2.5, 0, 6.283); g.fill(); });
  g.lineWidth = 2; for (let k = 1; k < 7; k += 2) { const [x, y, rad] = Cs[k]; g.beginPath(); g.arc(x, y, rad * .5, .5, 3.6); g.stroke(); } }
// curly woodcut smoke / dust puff texture (fill colour selectable)
function puffTex(fill = SMOKE, seed = 880) { const c = cnv(256, 200), g = c.getContext('2d'), r = rng(seed), Cs = [];
  for (let k = 0; k < 9; k++) { const a = k / 8; Cs.push([40 + a * 176 + (r() - .5) * 16, 140 - Math.sin(a * Math.PI) * 70 + (r() - .5) * 14, 26 + Math.sin(a * Math.PI) * 26]); }
  g.lineWidth = 6; g.strokeStyle = INK; Cs.forEach(([x, y, rad]) => { g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.stroke(); });
  g.fillStyle = fill; Cs.forEach(([x, y, rad]) => { g.beginPath(); g.arc(x, y, rad - 2.5, 0, 6.283); g.fill(); });
  g.lineWidth = 2.5; g.strokeStyle = 'rgba(42,31,24,.6)'; for (let k = 0; k < 4; k++) { const [x, y, rad] = Cs[1 + k * 2]; g.beginPath(); g.arc(x, y, rad * .5, .5, 4.4); g.stroke(); } return texOf(c); }
// any drawer → a cut-out sprite texture
// a shooting star: bright head, tapering woodcut trail to the left
function drawComet(g, L, seed) { const pts = [[L * .5, 0], [-L * .5, -L * .018], [-L * .5, L * .018]]; g.globalAlpha = .55; wash(g, pts, '#fff2c4', seed, .7, 1); g.globalAlpha = 1;
  for (let k = 0; k < 5; k++) inkLine(g, [[L * .45, (k - 2) * 2], [-L * .5 + k * L * .08, (k - 2) * L * .012]], 1.5, 'rgba(255,244,210,.8)', seed + k); drawStar(g, L * .07, seed + 9, '#fff6d8'); }
// a faint woodcut Milky Way: a soft band packed with tiny stars (use as an untinted, depthWrite:false sprite)
function milkyTex(seed = 1) { const c = cnv(1024, 300), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 26; i++) { const x = r() * 1024, y = 150 + (r() - .5) * 90, rad = 60 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(225,230,255,.13)'); gr.addColorStop(1, 'rgba(225,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 300); }
  for (let i = 0; i < 1400; i++) { const x = r() * 1024, y = 150 + (r() + r() + r() - 1.5) * 110; g.fillStyle = `rgba(255,250,232,${.25 + r() * .6})`; g.fillRect(x, y, 1.5 + r() * 2, 1.5 + r() * 2); }
  for (let i = 0; i < 40; i++) { const x = r() * 1024, y = 150 + (r() - .5) * 120; inkLine(g, [[x, y], [x + 30 + r() * 60, y + (r() - .5) * 10]], 1.2, 'rgba(255,250,232,.25)', seed + i); }
  return texOf(c); }
function spriteTex(w, h, draw, pad = 5) { const c = cnv(w, h), g = c.getContext('2d'); g.save(); g.translate(w / 2, h / 2); draw(g); g.restore(); return texOf(pad ? cutout(c, pad) : c); }
Object.assign(WC, { drawComet, milkyTex, drawOrb, drawSun, crescentPts, drawCrescent, drawTube, drawRod, drawCross, drawSpear, drawBurst, flamePts, drawFlame, drawIce, drawStar, drawGlow, drawCloud, puffTex, spriteTex });

// ================= architecture (canvas coords, ground line = bas) =================
function tower(g, x, w, top, bas, roofH, seed, col = WALL, roof = ROOF) {
  const body = [[x, bas], [x, top], [x + w, top], [x + w, bas]]; block(g, body, col, 4, seed); hatchIn(g, body, x + w * .55, top, x + w, bas, 8, 0, 1.4, .45, seed + 1);
  for (let y = top + 26; y < bas - 24; y += 44) block(g, [[x + w * .44, y], [x + w * .56, y], [x + w * .56, y + 18], [x + w * .44, y + 18]], INK, 1.5, seed + y);
  if (roofH) { const rf = [[x - 8, top], [x + w / 2, top - roofH], [x + w + 8, top]]; block(g, rf, roof, 4, seed + 2); hatchIn(g, rf, x + w / 2, top - roofH, x + w + 8, top, 9, .9, 1.4, .5, seed + 3); }
}
function house(g, x, w, h, bas, seed, flat = false) {
  const top = bas - h, rt = top - w * .75, wall = [WALL, '#efe2c4', '#d9c49a'][seed % 3];
  block(g, [[x, bas], [x, top], [x + w, top], [x + w, bas]], wall, 3.5, seed);
  if (flat) block(g, [[x - 4, top], [x + w + 4, top], [x + w + 4, top + 8], [x - 4, top + 8]], '#b8654a', 3, seed + 1);
  else { const rf = [[x - 6, top], [x + w / 2, rt], [x + w + 6, top]]; block(g, rf, seed % 2 ? ROOF : '#b8654a', 3.5, seed + 1); hatchIn(g, rf, x - 6, rt, x + w + 6, top, 10, -.35, 1.6, .5, seed + 2);
    inkLine(g, [[x, top + h * .5], [x + w, top + h * .5]], 3, '#4a3020', seed + 3); for (let k = 0; k <= 2; k++) inkLine(g, [[x + k * w / 2, top], [x + k * w / 2, bas]], 3, '#4a3020', seed + 4 + k); }
  for (let wy = top + 14; wy < bas - 20; wy += 34) for (let wx = x + 8; wx < x + w - 18; wx += 22) block(g, [[wx, wy], [wx + 10, wy], [wx + 10, wy + 14], [wx, wy + 14]], (wx * 7 + wy * 3) % 5 < 2 ? C.LIT : '#3a2a1c', 1.6, (wx + wy) | 0);
}
function church(g, x, w, top, bas, spire, seed, stone, spireCol) {
  const body = [[x, bas], [x, top], [x + w, top], [x + w, bas]]; block(g, body, stone, 4, seed); hatchIn(g, body, x + w * .6, top, x + w, bas, 7, 0, 1.4, .45, seed + 1);
  const sp = [[x - 4, top], [x + w / 2, top - spire], [x + w + 4, top]]; block(g, sp, spireCol, 4, seed + 2); hatchIn(g, sp, x - 4, top - spire, x + w + 4, top, 8, .95, 1.4, .45, seed + 3);
}
// a modern office tower: flat top, window grid (some lit), shaded right side
function office(g, x, w, top, bas, seed, col = '#d8cdb4', lit = .35) {
  const r = rng(seed), body = [[x, bas], [x, top], [x + w, top], [x + w, bas]]; block(g, body, col, 4, seed);
  for (let wy = top + 12; wy < bas - 14; wy += 20) for (let wx = x + 7; wx < x + w - 10; wx += 15) { g.fillStyle = r() < lit ? C.LIT : '#3b3a44'; g.fillRect(wx, wy, 8, 11); }
  hatchIn(g, body, x + w * .62, top, x + w, bas, 6, 0, 1.4, .5, seed + 1); inkPoly(g, body, 4, INK, seed + 2);
  block(g, [[x + w * .3, top], [x + w * .3, top - 14], [x + w * .7, top - 14], [x + w * .7, top]], col, 3, seed + 3);
}
function palm(g, x, bas, h, seed) { const r = rng(seed), lean = (r() - .5) * 30, top = [x + lean, bas - h];
  for (const [w, col] of [[16, INK], [11, '#8a6a44']]) { g.beginPath(); g.moveTo(x, bas); g.quadraticCurveTo(x + lean * .2, bas - h * .5, top[0], top[1]); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }
  for (let k = 0; k < 9; k++) { const y = bas - h * (k + 1) / 10; inkLine(g, [[x + lean * (k / 10) ** 2 - 6, y], [x + lean * (k / 10) ** 2 + 6, y + 3]], 2, INK, seed + k); }
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .5, L = h * (.34 + r() * .08), tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * .55 + L * .25 * Math.abs(k - 3) / 3], mid = [(top[0] + tip[0]) / 2, (top[1] + tip[1]) / 2 - L * .18];
    shape(g, [top, [mid[0] - 6, mid[1] - 8], tip, [mid[0] + 6, mid[1] + 6]], GREEN, 2.5, seed + 20 + k); }
}
function saguaro(g, x, bas, h, seed) { const w = h * .12, body = [[x - w / 2, bas], [x - w / 2, bas - h + w / 2], [x, bas - h], [x + w / 2, bas - h + w / 2], [x + w / 2, bas]];
  const arm = (s, y0, len) => { const ax = x + s * w / 2, pts = [[ax, y0], [ax + s * w * 1.3, y0], [ax + s * w * 1.3, y0 - len], [ax + s * w * .55, y0 - len - w * .3], [ax + s * w * .3, y0 - len], [ax + s * w * .3, y0 - w * .8], [ax, y0 - w * .8]]; shape(g, pts, '#6f9455', 3, seed + s); };
  arm(-1, bas - h * .42, h * .28); arm(1, bas - h * .58, h * .22); shape(g, body, '#6f9455', 3.5, seed + 3);
  for (const k of [-.25, 0, .25]) inkLine(g, [[x + k * w, bas - 4], [x + k * w, bas - h + w * .6]], 1.5, 'rgba(42,31,24,.55)', seed + 5 + k * 8); }
function mountains(g, pts, col, seed, bas) { const poly = [[pts[0][0], bas], ...pts, [pts[pts.length - 1][0], bas]]; wash(g, poly, col, seed, .96, 3); hatchIn(g, poly, pts[0][0], Math.min(...pts.map(p => p[1])), pts[pts.length - 1][0], bas, 9, -.7, 1.4, .4, seed + 1); inkLine(g, pts, 4, INK, seed + 2); }
Object.assign(WC, { tower, house, church, office, palm, saguaro, mountains });

// ================= woodcut people: each frame is a 400x640 sheet, feet at the bottom, facing right =================
// o: { male, robe, dress, hose, hat ('barett'|'doctor'|'hood'|'cap'|'ball'|null), hatCol, beard, collar, skin,
//      modern (jeans, sneakers, hair instead of coif), pants (woman in trousers), hair (colour), suit (+ tie), alien (mask) }
const SB = [132, 205], SF = [188, 205];
function person(o, f) {
  const c = cnv(400, 640), g = c.getContext('2d'), s = o.seed * 31 + f * 7, cx = 160, q = o.pose(f), sway = q.sway || 0, long = (!o.male && !o.pants) || o.robe, skin = o.skin || SKIN;
  g.translate(40, 0);
  const shoeCol = o.modern ? '#e8e2d4' : '#3a2616';
  const shoe = (x, y, dir) => { g.save(); g.translate(x, y); shape(g, [[-14, 0], [0, -14], [16 * dir + 10, -10], [44 * dir, 0], [14 * dir, 8], [-12, 8]], shoeCol, 3, s + x); g.restore(); };
  if (!long) { const hose = o.hose || (o.modern ? '#4a6488' : '#5a3d2a');
    for (const [lx, fx, fy, dir] of [[146, 132, 598, -1], [174, 190, 598, 1]]) { shape(g, [[lx - 12, 420], [lx + 12, 420], [(lx + fx) / 2 + 9, 520], [fx + 8, fy - 6], [fx - 8, fy - 6], [(lx + fx) / 2 - 9, 520]], hose, 3.5, s + lx); shoe(fx, fy, dir); }
  } else { shoe(cx - 34 + sway, 600, -1); shoe(cx + 34 + sway, 604, 1); }
  if (!o.male && o.modern && o.hair) shape(g, [[112, 150], [118, 100], [cx, 86], [204, 102], [212, 170], [204, 232], [120, 232]], o.hair, 3.5, s + 30);   // long hair behind
  q.behind && q.behind(g, s);
  const sleeve = ([sh, el, hd]) => { for (const [w, col] of [[30, INK], [23, o.dress]]) { g.beginPath(); g.moveTo(...sh); g.quadraticCurveTo(...el, ...hd); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); } };
  q.arms.forEach(sleeve);
  const hem = long ? 600 : 430, flare = long ? (o.robe ? 76 : 92) : 52;
  const body = [[122, 196], [198, 196], [186, 270], [cx + flare + sway, hem - 6], [cx + flare * .5 + sway, hem + 8], [cx + sway, hem - 4], [cx - flare * .5 + sway, hem + 8], [cx - flare + sway, hem - 6], [134, 270]];
  shape(g, body, o.dress, 4.5, s + 1);
  hatchIn(g, body, cx + 6, 190, 320, hem + 20, 8, -1.05, 1.5, .45, s + 2);
  if (!o.suit) for (const k of [-.45, 0, .45]) inkLine(g, [[cx + k * 30, 280], [cx + k * flare * .9 + sway * .6, (280 + hem) / 2], [cx + k * flare * 1.1 + sway, hem - 8]], 2, 'rgba(43,29,18,.6)', s + 3 + k * 10);
  if (!o.suit && !o.modern) inkLine(g, [[134, 272], [cx, 278], [186, 272]], 4, INK, s + 4);
  if (o.male && !o.robe && !o.modern) { g.fillStyle = '#5a3d2a'; g.fillRect(176, 278, 16, 22); }
  if (o.suit) { shape(g, [[146, 198], [174, 198], [160, 252]], '#f4efe4', 2.5, s + 40); shape(g, [[157, 204], [163, 204], [167, 252], [160, 266], [153, 252]], o.tie || BLOOD, 2, s + 41); inkLine(g, [[140, 198], [156, 262], [150, 330]], 2.5, INK, s + 42); inkLine(g, [[180, 198], [166, 262], [172, 330]], 2.5, INK, s + 43); }
  if (o.robe) shape(g, [[120, 200], [200, 200], [204, 236], [cx, 250], [116, 236]], o.collar || '#6b4a2e', 3.5, s + 18);
  q.front && q.front(g, s);
  q.arms.forEach(([, , hd], i) => { g.fillStyle = skin; g.beginPath(); g.arc(hd[0], hd[1], 11, 0, 6.283); g.fill(); inkLine(g, NB.circlePts(hd[0], hd[1], 11, 12), 2.5, INK, s + 5 + i); });
  q.over && q.over(g, s);
  if (o.alien) {   // the rubber alien mask
    shape(g, ell(cx + 4, 128, 44, 56, .12, 22), '#9cc07a', 3.5, s + 50); hatchIn(g, ell(cx + 4, 128, 44, 56, .12, 22), cx + 10, 70, cx + 60, 190, 7, -1, 1.3, .4, s + 51);
    for (const [ex, ey, rot] of [[146, 124, -.5], [186, 128, .5]]) shape(g, ell(ex, ey, 17, 9, rot, 14), '#14100e', 2, s + 52 + ex);
    inkLine(g, [[166, 166], [176, 164]], 2.5, INK, s + 55);
  } else {
    if (!o.male && !o.modern) shape(g, [[116, 112], [cx, 84], [204, 112], [214, 200], [cx, 214], [106, 200]], '#f3ead6', 3.5, s + 9);
    g.fillStyle = skin; g.beginPath(); g.arc(cx, 140, 33, 0, 6.283); g.fill(); inkLine(g, NB.circlePts(cx, 140, 33, 18), 3.5, INK, s + 10);
    const ey = q.look ? 123 : 131;   // looking up at the sky: eye and brow lift
    g.fillStyle = INK; g.fillRect(166, ey, 6, 6); inkLine(g, q.look ? [[158, ey - 9], [176, ey - 14]] : [[160, 124], [174, 122]], 2.5, INK, s + 11); inkLine(g, [[178, 136], [186, 150], [178, 153]], 2.5, INK, s + 12);
    g.beginPath(); g.ellipse(174, 162, q.grin ? 9 : 5, q.mouth ?? o.mouth ?? 6, 0, 0, 6.283); g.fill();
    if (o.beard) shape(g, [[146, 158], [160, 176], [184, 170], [176, 196], [150, 194]], o.beard, 3, s + 8);
    g.fillStyle = 'rgba(180,60,40,.25)'; g.beginPath(); g.arc(184, 152, 6, 0, 6.283); g.fill();
    if (!o.male && !o.modern) shape(g, [[124, 128], [cx, 100], [196, 128], [190, 112], [cx, 92], [130, 112]], '#f3ead6', 3, s + 13);
    else if (o.hat === 'barett') { shape(g, ell(cx + 4, 104, 64, 15, -.08, 20), o.hatCol, 3.5, s + 14); shape(g, ell(cx, 94, 34, 15, 0, 16), o.hatCol, 3, s + 15); inkLine(g, [[192, 92], [222, 62], [248, 50]], 7, '#f1e6c9', s + 16); inkLine(g, [[192, 92], [222, 62], [248, 50]], 2, INK, s + 17); }
    else if (o.hat === 'doctor') block(g, [[118, 114], [202, 114], [196, 80], [124, 80]], '#2a2420', 3.5, s + 14);
    else if (o.hat === 'hood') shape(g, [[118, 150], [124, 104], [cx, 92], [204, 110], [236, 90], [212, 150], [200, 196], [120, 196]], o.hatCol, 3.5, s + 16);
    else if (o.hat === 'ball') { shape(g, [[124, 126], [128, 100], [cx, 88], [192, 98], [196, 122]], o.hatCol || BLUE, 3, s + 17); shape(g, [[186, 116], [232, 118], [228, 128], [186, 126]], o.hatCol || BLUE, 2.5, s + 18); }
    else if (o.hat === 'cap') shape(g, [[126, 124], [130, 100], [cx, 92], [190, 100], [194, 124]], o.hatCol || '#3a2616', 3, s + 17);
    else if (o.hair) shape(g, o.male ? [[124, 132], [126, 104], [cx, 92], [194, 104], [196, 122], [180, 112], [150, 112], [134, 120]] : [[120, 140], [124, 104], [cx, 90], [200, 104], [204, 130], [188, 112], [150, 110]], o.hair, 3, s + 19);
  }
  q.top && q.top(g, s);
  return cutout(c);
}
// poses: each returns { arms:[[shoulder, elbow, hand]×2], sway, mouth, look, grin, behind/front/over/top(g,s) }
const camcorder = (g, s, rec) => { block(g, [[182, 112], [252, 112], [252, 160], [182, 160]], '#3a3a42', 3, s + 60); block(g, [[200, 100], [236, 100], [236, 112], [200, 112]], '#3a3a42', 2.5, s + 61);
  shape(g, circ(262, 136, 15, 14), '#22222a', 3, s + 62); g.fillStyle = '#9fb3cf'; g.beginPath(); g.arc(262, 136, 7, 0, 6.283); g.fill(); g.fillStyle = rec ? '#e8402a' : '#5a2a22'; g.beginPath(); g.arc(194, 122, 5, 0, 6.283); g.fill(); };
const POSE = WC.POSE = {
  point: { look: true, mouth: 8, sway: -2, arms: [[SB, [120, 300], [128, 384]], [SF, [236, 150], [276, 50]]] },
  handsUp: { look: true, mouth: 13, sway: 3, arms: [[SB, [96, 152], [80, 66]], [SF, [232, 150], [258, 60]]] },
  cower: { look: false, mouth: 11, sway: 7, arms: [[SB, [104, 128], [148, 98]], [SF, [226, 126], [180, 92]]] },
  cam: { look: true, mouth: 5, arms: [[SB, [150, 250], [196, 170]], [SF, [238, 220], [236, 166]]], top: (g, s) => camcorder(g, s, false) },
  camRec: { look: true, mouth: 5, arms: [[SB, [150, 250], [196, 170]], [SF, [238, 220], [236, 166]]], top: (g, s) => camcorder(g, s, true) },
  laugh: { look: false, mouth: 15, grin: true, sway: -4, arms: [[SB, [112, 280], [150, 300]], [SF, [214, 284], [182, 306]]] },
  laugh2: { look: true, mouth: 17, grin: true, sway: 5, arms: [[SB, [112, 280], [150, 300]], [SF, [236, 210], [214, 150]]],
    top: (g, s) => { g.font = `bold 52px ${LUM}`; g.fillStyle = RED; g.strokeStyle = '#f1e4c4'; g.lineWidth = 7; g.strokeText('Ha!', 214, 70); g.fillText('Ha!', 214, 70); } },
  talk: { look: false, mouth: 5, arms: [[SB, [120, 300], [150, 330]], [SF, [240, 240], [268, 196]]] },
  talk2: { look: false, mouth: 12, arms: [[SB, [120, 300], [150, 330]], [SF, [246, 200], [262, 128]]] },
  wave: { look: false, mouth: 8, arms: [[SB, [120, 300], [128, 384]], [SF, [246, 150], [282, 70]]] },
  wave2: { look: false, mouth: 10, arms: [[SB, [120, 300], [128, 384]], [SF, [226, 140], [228, 56]]] },
  stand: { look: false, mouth: 5, arms: [[SB, [124, 300], [130, 384]], [SF, [196, 300], [192, 384]]] },
};
// a pose list → a frame function (frame f uses list[f])
WC.poses = (...names) => f => POSE[names[f]] || names[f];
Object.assign(WC, { person, SB, SF });
// ================= the runtime (16:9) =================
WC.episode = function (ep) {
  const S = WC.S = { ep, TINT: [], TINT_SKY: [], hits: [], tags: [], img: {} };
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputEncoding = THREE.sRGBEncoding; renderer.autoClear = false; (document.body || document.documentElement).appendChild(renderer.domElement);
  const BG = '#1b120a', scene = S.scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.Fog(BG, 32, 64);
  const camera = S.camera = new THREE.PerspectiveCamera(30, W / H, .1, 140);
  const hud = cnv(W, H), hg = S.hg = hud.getContext('2d'), hudTex = texOf(hud), hudScene = new THREE.Scene(), hudCam = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0, 1);
  hudScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false })));

  // ---- scene helpers the episode uses (same API as the vertical engine) ----
  S.sprite = (tex, w, o = {}) => { const h = o.h || w * tex.image.height / tex.image.width, mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: o.alphaTest ?? .3, side: THREE.DoubleSide, depthWrite: o.depthWrite ?? true }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.visible = false; scene.add(m); if (o.tint !== false) S.TINT_SKY.push(mat); return m; };
  S.bill = (m, x, y, z, rot = 0, s = 1) => { if (!(Array.isArray(s) ? s[0] && s[1] : s > .001)) { m.visible = false; return m; } m.visible = true; m.position.set(x, y, z); m.quaternion.copy(camera.quaternion); m.rotateZ(rot); Array.isArray(s) ? m.scale.set(s[0], s[1], 1) : m.scale.set(s, s, 1); return m; };
  S.standee = (cans, px, py, h, o = {}) => { const w = h * cans[0].width / cans[0].height, pivot = new THREE.Group(), [x, y] = toW(px, py), texs = cans.map(texOf);
    const mat = new THREE.MeshBasicMaterial({ map: texs[0], transparent: true, alphaTest: .3, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.y = h / 2; if (o.flip) m.scale.x = -1; pivot.add(m); pivot.position.set(x, y, o.z ?? .012); pivot.rotation.order = 'ZXY'; pivot.visible = !!o.flat; scene.add(pivot); S.TINT.push(mat);
    return { o, pivot, m, mat, texs, h, w }; };
  S.doll = o => S.standee(Array.from({ length: o.nf || 1 }, (_, f) => person(o, f)), o.px, o.py, o.h || 2.2, o);
  // a skyline card hinged on the page, centred left-right (it lies flat — visible — at t=0 when o.flat)
  S.card = (canvas, py, h, o = {}) => S.standee([canvas], PW / 2, py, h, { z: .02, ...o });
  S.setTex = (d, f) => { f = Math.max(0, Math.min(d.texs.length - 1, f | 0)); if (d.mat.map !== d.texs[f]) { d.mat.map = d.texs[f]; d.mat.needsUpdate = true; } };
  S.faceCamera = d => { const up = clamp(d.pivot.rotation.x / (Math.PI / 2)); d.pivot.rotation.z = Math.atan2(camera.position.x - d.pivot.position.x, Math.max(.5, d.pivot.position.y - camera.position.y)) * .35 * up; };
  S.hinge = (d, tUp, tDown = S.closeUp - .1, dur = .45, face = true) => { const t = S.t, up = back(P(t, tUp, dur)), down = eio(P(t, tDown, .6)); d.pivot.visible = up > 0 && down < 1; d.mat.opacity = 1 - down; d.pivot.rotation.x = Math.PI / 2 * up * (1 - down); if (face) S.faceCamera(d); return up > .9 && down < .05; };
  S.raise = (d, tUp, tDown, dur = .7) => { const t = S.t; d.pivot.visible = true; d.pivot.rotation.x = Math.PI / 2 * back(P(t, tUp, dur)) * (1 - eio(P(t, tDown, .6))); };
  S.hold = (m, kIn, kOut, o = {}) => { m.visible = kIn > 0 && kOut < 1; if (!m.visible) return null; const d = o.d ?? 4.4, tgt = camera.position.clone().addScaledVector(S.fwd, d).addScaledVector(S.upv, o.dy ?? .15).addScaledVector(S.right, o.dx ?? 0);
    const from = o.from ? o.from.clone() : tgt.clone().addScaledVector(S.upv, -2.6); m.position.lerpVectors(from, tgt, Math.min(1, kIn)).addScaledVector(S.upv, eo(kOut) * 3);
    m.quaternion.copy(camera.quaternion); m.rotateZ((o.rot ?? -.04) + (1 - Math.min(1, kIn)) * (o.spin ?? .3) + kOut * .4); m.scale.setScalar(o.grow ? .25 + .75 * Math.min(1, kIn) : 1); m.material.opacity = 1 - kOut;
    return m.position.clone().addScaledVector(S.upv, m.geometry.parameters.height / 2 * m.scale.y + .06); };
  S.print = (img, h) => { const w0 = img.naturalWidth, h0 = img.naturalHeight, c = cnv(w0 + 60, h0 + 60), g = c.getContext('2d'); g.fillStyle = C.PAPER; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 30, 30, w0, h0); inkPoly(g, [[6, 6], [c.width - 6, 6], [c.width - 6, c.height - 6], [6, c.height - 6]], 3, 'rgba(42,31,24,.5)', 5);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; };
  S.proj = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
  S.tagAt = (text, v, a, size = 38) => { if (a > 0 && v) { const [x, y] = S.proj(v); S.tags.push([text, clamp(x, 360, W - 360), clamp(y, 60, H - 220), a, size]); } };
  S.V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- the broadsheet page, landscape: header title, a wide framed picture, and a bottom band of black-letter
  //      columns either side of the countdown card (which lies printed flat in the middle until it folds up) ----
  const pg0 = ep.page || {}, cd = ep.countdown, CDY = cd ? cd.py ?? 1745 : 0, CDH = cd ? cd.h ?? 3.9 : 0, CDW = CDH * 1.5;
  const pageC = cnv(PW, PH), pageG = pageC.getContext('2d'), pageTex = texOf(pageC), pageMat = new THREE.MeshBasicMaterial({ map: pageTex }); S.TINT.push(pageMat);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(PW * U, PH * U), pageMat));
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshBasicMaterial({ color: '#2a1b10' })); desk.position.z = -.03; scene.add(desk);
  let base, titleGlow, titleFont = 104, lastGlow = -1;
  const blackletter = (g, r, x0, x1, y0, y1, indent) => { for (let y = y0; y < y1; y += 38) { let x = indent && y < indent[1] ? indent[0] : x0; while (x < x1 - 20) { const wl = 26 + r() * 80; g.globalAlpha = .7; for (let k = 0; k < wl && x + k < x1; k += 7) { const hgt = r() < .16 ? 22 : 12; g.fillRect(x + k, y - hgt, 3, hgt); if (r() < .45) g.fillRect(x + k, y - 12, 6, 2.5); } x += wl + 13; } } g.globalAlpha = 1; };
  function buildPage() {
    base = paper(PW, PH, pg0.seed || 11, .5); const g = base.getContext('2d'), r = rng(12);
    inkLine(g, [[300, 34], [PW - 300, 34]], 5, INK, 1); inkLine(g, [[300, 46], [PW - 300, 46]], 1.8, INK, 2);
    g.textAlign = 'center'; g.textBaseline = 'middle'; while (titleFont > 60) { g.font = `bold ${titleFont}px ${LUM}`; if (g.measureText(pg0.title || '').width < 2300) break; titleFont -= 4; }
    g.fillStyle = INK; g.fillText(pg0.title || '', PW / 2, 110);
    inkPoly(g, [[290, 172], [PW - 290, 172], [PW - 290, 1212], [290, 1212]], 7, INK, 3); inkPoly(g, [[300, 182], [PW - 300, 182], [PW - 300, 1202], [300, 1202]], 2.5, INK, 4);
    for (let k = 0; k < 6; k++) { const y0 = 1036 + k * 27; wash(g, [[300, y0], [PW - 300, y0 + 6], [PW - 300, y0 + 26], [300, y0 + 22]], k % 2 ? GREEN : '#cdb27a', 20 + k, .55, 3); }
    // left column: decorated initial + black-letter
    block(g, [[300, 1248], [420, 1248], [420, 1368], [300, 1368]], '#e6c879', 3.5, 40); for (let i = 0; i < 10; i++) inkLine(g, NB.circlePts(324 + r() * 72, 1272 + r() * 72, 7 + r() * 8, 10), 2, 'rgba(42,31,24,.55)', 41 + i);
    g.font = `bold 108px ${LUM}`; g.fillStyle = INK; g.fillText(pg0.initial || 'A', 360, 1314);
    const cx0 = cd ? PW / 2 - CDW / U / 2 - 80 : PW / 2 - 40, cx1 = cd ? PW / 2 + CDW / U / 2 + 80 : PW / 2 + 40;
    blackletter(g, r, 300, cx0, 1280, 1750, [446, 1390]);
    // right column: the red subtitle (Roman-numeral date), black-letter, colophon
    const rx = (cx1 + PW - 300) / 2; g.font = `42px ${LUM}`; g.fillStyle = RED; g.fillText(pg0.subtitle || '', rx, 1268);
    const sw = Math.min(g.measureText(pg0.subtitle || '').width, PW - 300 - cx1 - 120); for (const s of [-1, 1]) { const x = rx + s * (sw / 2 + 40), y = 1268; block(g, [[x, y - 12], [x + 12, y], [x, y + 12], [x - 12, y]], RED, 2.5, 5 + s); }
    g.fillStyle = INK; blackletter(g, r, cx1, PW - 300, 1340, 1720);
    g.font = `32px ${LUM}`; g.fillText(pg0.colophon || '', rx, 1768);
    // the pop-up book's cut line where the countdown card lies (seen once it has folded up)
    if (cd) { const x0 = PW / 2 - CDW / U / 2, x1 = PW / 2 + CDW / U / 2, y1 = CDY, y0 = CDY - CDH / U; g.save(); g.setLineDash([18, 12]); g.strokeStyle = 'rgba(42,31,24,.45)'; g.lineWidth = 3; g.strokeRect(x0 + 6, y0 + 6, x1 - x0 - 12, y1 - y0 - 12); g.restore(); }
    titleGlow = cnv(PW, 200); const tg = titleGlow.getContext('2d'); tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.font = `bold ${titleFont}px ${LUM}`; tg.fillStyle = RED; tg.fillText(pg0.title || '', PW / 2, 110);
  }
  function drawPage(t) { const glow = P(t, S.glowAt - .05, .35) * (1 - P(t, S.END + 5, .5)); if (Math.abs(glow - lastGlow) < .002) return; lastGlow = glow;
    pageG.drawImage(base, 0, 0); if (glow > 0) { pageG.globalAlpha = glow; pageG.drawImage(titleGlow, 0, 0); pageG.globalAlpha = 1; } pageTex.needsUpdate = true; }

  // ---- the countdown card: a big Roman numeral, the place and the date, printed flat on the paper; it folds up on
  //      ep.countdown.up and lies flat again on .down. Frames: 0 = plain, 1 = place in red, 2 = date in red ----
  function cdArt(f) {
    const cw = 1500, ch = 1000, c = cnv(cw, ch), g = c.getContext('2d'), pad = 14, edge = [[pad, pad + 4], [cw / 2, pad], [cw - pad, pad + 3], [cw - pad - 3, ch / 2], [cw - pad, ch - pad], [cw / 2, ch - pad - 3], [pad + 2, ch - pad], [pad, ch / 2]];
    g.save(); g.beginPath(); edge.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.drawImage(paper(cw, ch, 77, .3), 0, 0); g.restore();
    inkPoly(g, edge, 7, INK, 701); inkPoly(g, [[48, 48], [cw - 48, 48], [cw - 48, ch - 48], [48, ch - 48]], 2.5, INK, 702); inkPoly(g, [[62, 62], [cw - 62, 62], [cw - 62, ch - 62], [62, ch - 62]], 1.6, RED, 703);
    for (const [x, y] of [[62, 62], [cw - 62, 62], [cw - 62, ch - 62], [62, ch - 62]]) block(g, [[x, y - 22], [x + 22, y], [x, y + 22], [x - 22, y]], RED, 2.5, 704 + x + y);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (cd.kicker !== '') { g.font = `bold 44px ${LUM}`; g.fillStyle = 'rgba(42,31,24,.8)'; g.fillText(cd.kicker || 'Countdown to Strange', cw / 2, 124); for (const s of [-1, 1]) inkLine(g, [[cw / 2 + s * 270, 126], [cw / 2 + s * 440, 126]], 2.5, INK, 706 + s); }
    let nf = 420; g.font = `bold ${nf}px ${LUM}`; while (g.measureText(cd.numeral).width > cw - 260 && nf > 160) { nf -= 10; g.font = `bold ${nf}px ${LUM}`; }
    g.fillStyle = BLOOD; g.fillText(cd.numeral, cw / 2 + 9, 432 + 8); g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = '#f1e4c4'; g.strokeText(cd.numeral, cw / 2, 432); g.fillStyle = INK; g.fillText(cd.numeral, cw / 2, 432);
    inkLine(g, [[300, 662], [cw - 300, 662]], 4, INK, 708); block(g, [[cw / 2, 650], [cw / 2 + 12, 662], [cw / 2, 674], [cw / 2 - 12, 662]], RED, 2, 709);
    let pf = 128; g.font = `bold ${pf}px ${LUM}`; while (g.measureText(cd.place || '').width > cw - 200 && pf > 60) { pf -= 4; g.font = `bold ${pf}px ${LUM}`; }
    g.fillStyle = f === 1 ? RED : INK; g.fillText(cd.place || '', cw / 2, 770);
    g.font = `bold 64px ${LUM}`; g.fillStyle = f === 2 ? RED : 'rgba(42,31,24,.9)'; g.fillText(cd.date || '', cw / 2, 884);
    return cutout(c, 8);
  }

  // ---- the sky: a wide card standing up out of the picture, plus a flap that unfolds above it ----
  const SKW = 19.2, SKH = 5.94, FLH = 7.6, SCW = 2560, SCH = 792, SKY_PY = Math.round(PH / 2 + .59 / U), sk = ep.sky || {};
  function skyArt(w, h, seed, stops, flap) {
    const c = paper(w, h, seed, 0), g = c.getContext('2d'), r = rng(seed + 1), gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([s, col]) => gr.addColorStop(s, col));
    g.globalAlpha = .85; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    for (let y = 5; y < h * (flap ? 1 : .8);) { const gap = flap ? 7 + y / h * 5 : 9 + (y / h) * 22; inkLine(g, [[0, y + (r() - .5) * 2], [w * .25, y + (r() - .5) * 2.5], [w * .5, y + (r() - .5) * 2.5], [w * .75, y + (r() - .5) * 2.5], [w, y + (r() - .5) * 2]], 1.5, 'rgba(42,31,24,.28)', seed + y); y += gap; }
    if (!flap) for (const [cx, cy, s] of sk.clouds || [[380, 520, 1.1], [1000, 560, 1.35], [1650, 530, 1.15], [2250, 560, 1]]) drawCloud(g, cx, cy, s, seed + cx, sk.cloudFill);
    if (sk.art) sk.art(g, w, h, flap);
    inkPoly(g, flap ? [[6, h], [6, 6], [w - 6, 6], [w - 6, h]] : [[6, h], [6, 0], [w - 6, 0], [w - 6, h]], 6, INK, seed + 2, false);
    return c;
  }
  const skyFace = cnv(SCW, SCH), skyG = skyFace.getContext('2d'), skyTex = texOf(skyFace); let skyBase, skyPrint, lastPK = -1;
  const skyPivot = new THREE.Group(), flapPivot = new THREE.Group(), skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.DoubleSide }), flapMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  { const [x, y] = toW(PW / 2, SKY_PY), m = new THREE.Mesh(new THREE.PlaneGeometry(SKW, SKH), skyMat); m.position.y = SKH / 2; skyPivot.add(m); flapPivot.position.set(0, SKH - .002, 0); skyPivot.add(flapPivot);
    S.flapMesh = new THREE.Mesh(new THREE.PlaneGeometry(SKW, FLH), flapMat); S.flapMesh.position.y = FLH / 2; flapPivot.add(S.flapMesh); skyPivot.position.set(x, y, .008); scene.add(skyPivot); S.TINT.push(skyMat, flapMat); }
  function buildSky() {
    const stops = sk.stops || [[0, '#9fb3cf'], [.45, '#c1cddd'], [.75, '#ecd2b0'], [1, '#f2d898']];
    skyBase = skyArt(SCW, SCH, 300, stops, false); flapMat.map = texOf(skyArt(SCW, Math.round(SCW * FLH / SKW), 310, sk.flapStops || [[0, '#7f95b8'], [1, stops[0][1]]], true)); flapMat.needsUpdate = true;
    skyPrint = cnv(SCW, SCH); if (sk.print) sk.print(skyPrint.getContext('2d'), SCW, SCH);
    if (sk.ceiling) buildCeiling();
  }
  function drawSky(pk, t) { const live = sk.live && pk > .002; if (!live && Math.abs(pk - lastPK) < .002) return; lastPK = pk; skyG.drawImage(skyBase, 0, 0);
    if (pk > 0) { skyG.globalAlpha = pk; skyG.drawImage(skyPrint, 0, 0); if (live) { skyG.save(); sk.live(skyG, t, S); skyG.restore(); } skyG.globalAlpha = 1; } skyTex.needsUpdate = true; }
  let ceiling = null;
  function buildCeiling() { const c = skyArt(1024, 1024, 330, [[0, (sk.flapStops || [[0, '#141b33']])[0][1]], [1, (sk.flapStops || [[0, '#141b33']])[0][1]]], true), g = c.getContext('2d'), r = rng(331);
    for (let i = 0; i < 220; i++) { const x = r() * 1024, y = r() * 1024, big = r() < .15; g.fillStyle = 'rgba(255,246,214,.95)'; g.beginPath(); g.arc(x, y, big ? 3.5 : 1.2 + r() * 1.6, 0, 6.283); g.fill(); if (big) { g.save(); g.translate(x, y); drawStar(g, 12 + r() * 6, 340 + i, '#fff3cc'); g.restore(); } }
    const mat = new THREE.MeshBasicMaterial({ map: texOf(c), side: THREE.DoubleSide }); S.TINT.push(mat); ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat); ceiling.position.set(0, -.6 - 15, SKH + FLH - .04); ceiling.visible = false; scene.add(ceiling); }
  Object.assign(S, { SKW, SKH, SCW, SCH });

  // ---- HUD (1920x1080; keep words in the upper two thirds, captions own the lower third) ----
  const word = (s, size, fill, stroke = INK) => { const m = cnv(10, 10).getContext('2d'); m.font = `bold ${size}px ${LUM}`; const cw = Math.max(1000, m.measureText(s).width + size), c = cnv(cw, size * 1.6), g = c.getContext('2d'); g.font = `bold ${size}px ${LUM}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = size * .12; g.strokeStyle = '#f1e4c4'; g.strokeText(s, cw / 2, size * .8); g.lineWidth = size * .05; g.strokeStyle = stroke; g.strokeText(s, cw / 2, size * .8); g.fillStyle = fill; g.fillText(s, cw / 2, size * .8); return c; };
  const big = (c, x, y, p, a = 1, rot = 0, sc = 1) => { if (p <= 0 || a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y); hg.rotate(rot); const s = (1 + .2 * (1 - eo(clamp(p * 1.5)))) * sc * Math.min(1, 1700 / c.width); hg.scale(s, s); hg.beginPath(); hg.rect(-c.width / 2, -400, c.width * p, 800); hg.clip(); hg.drawImage(c, -c.width / 2, -c.height / 2); hg.restore(); hg.globalAlpha = 1; };
  S.BIG = {};
  S.show = (k, t0, t1, y = 230, rot = -.03, x = W / 2, sc = 1) => { const t = S.t; if (t < t0 || t > t1 + .35) return; big(S.BIG[k], x, y, eo(P(t, t0, .4)), 1 - P(t, t1, .35), rot, sc); };
  // a punch title: the black-letter word slams down from big to its size with a little jolt (no wipe)
  S.punch = (k, t0, t1, y = 230, rot = -.03, x = W / 2, sc = 1) => { const t = S.t, c = S.BIG[k]; if (!c || t < t0 || t > t1 + .35) return; const p = P(t, t0, .28), a = clamp(p * 4) * (1 - P(t, t1, .35)), j = Math.exp(-Math.max(0, t - t0 - .28) * 14) * (p >= 1 ? 1 : 0);
    hg.save(); hg.globalAlpha = a; hg.translate(x + Math.sin(t * 90) * 6 * j, y + Math.cos(t * 77) * 5 * j); hg.rotate(rot); const s = lerp(1.9, 1, eo(p)) * sc * Math.min(1, 1700 / c.width); hg.scale(s, s); hg.drawImage(c, -c.width / 2, -c.height / 2); hg.restore(); hg.globalAlpha = 1; };
  S.tag = (s, x, y, a, size = 40) => { if (a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.font = `bold ${size}px ${LUM}`; const w = hg.measureText(s).width + 56, h = size * 1.55; hg.translate(x, y); hg.rotate(-.02);
    hg.fillStyle = '#efe3c4'; hg.fillRect(-w / 2, -h / 2, w, h); hg.strokeStyle = INK; hg.lineWidth = 3.5; hg.strokeRect(-w / 2, -h / 2, w, h); hg.strokeStyle = RED; hg.lineWidth = 1.5; hg.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
    hg.fillStyle = INK; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(s, 0, 2); hg.restore(); };
  S.stamp = (s, x, y, p, a = 1, rot = -.12, size = 120, sub = '') => { if (p <= 0 || a <= 0) return; hg.save(); hg.globalAlpha = clamp(a) * .92; hg.translate(x, y); hg.rotate(rot); const k = 1 + 1.4 * (1 - eo(clamp(p))); hg.scale(k, k);
    hg.font = `bold ${size}px ${LUM}`; const w = hg.measureText(s).width + 70, h = size * 1.35 + (sub ? 50 : 0); hg.strokeStyle = BLOOD; hg.lineWidth = 9; hg.strokeRect(-w / 2, -h / 2, w, h); hg.lineWidth = 3; hg.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    hg.fillStyle = BLOOD; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(s, 0, sub ? -18 : 4); if (sub) { hg.font = `bold 38px ${LUM}`; hg.fillText(sub, 0, size * .55); }
    const r = rng(77); hg.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { hg.fillRect((r() - .5) * w, (r() - .5) * h, 3 + r() * 6, 2 + r() * 3); } hg.restore(); };
  S.hourglass = (x, y, k, a) => { if (a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y); const Hh = 240, Wd = 130, hw = yy => 9 + (Wd / 2 - 9) * Math.abs(yy) / (Hh / 2);
    for (const s of [-1, 1]) block(hg, [[-Wd * .78, s * Hh / 2], [Wd * .78, s * Hh / 2], [Wd * .78, s * (Hh / 2 + 24)], [-Wd * .78, s * (Hh / 2 + 24)]], '#8a5a34', 3.5, 901 + s);
    for (const s of [-1, 1]) inkLine(hg, [[s * Wd * .68, -Hh / 2], [s * Wd * .68, Hh / 2]], 8, '#5a3d2a', 903 + s);
    const glass = [[-Wd / 2, -Hh / 2], [Wd / 2, -Hh / 2], [9, 0], [Wd / 2, Hh / 2], [-Wd / 2, Hh / 2], [-9, 0]];
    hg.fillStyle = 'rgba(232,240,244,.8)'; hg.beginPath(); glass.forEach((p, i) => i ? hg.lineTo(...p) : hg.moveTo(...p)); hg.closePath(); hg.fill();
    hg.save(); hg.clip(); hg.fillStyle = '#d8b25c'; const ys = -(Hh / 2 - 8) * (1 - k); if (k < 1) { hg.beginPath(); hg.moveTo(-hw(ys), ys); hg.lineTo(hw(ys), ys); hg.lineTo(9, 0); hg.lineTo(-9, 0); hg.closePath(); hg.fill(); }
    const mh = (Hh / 2 - 10) * k * .9; hg.beginPath(); hg.moveTo(-Wd / 2, Hh / 2); hg.lineTo(Wd / 2, Hh / 2); hg.lineTo(0, Hh / 2 - mh - 6); hg.closePath(); hg.fill(); if (k > 0 && k < 1) hg.fillRect(-2, 0, 4, Hh / 2); hg.restore();
    inkPoly(hg, glass, 4, INK, 905); hg.restore(); };
  S.clock = (x, y, hours, a, R = 150) => { if (a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y);
    shape(hg, circ(0, 0, R, 40), '#efe3c4', 6, 930); inkLine(hg, circ(0, 0, R * .9, 40), 2, RED, 931);
    hg.font = `bold ${R * .2}px ${LUM}`; hg.fillStyle = INK; hg.textAlign = 'center'; hg.textBaseline = 'middle'; ['XII', 'III', 'VI', 'IX'].forEach((n, i) => { const an = i * Math.PI / 2 - Math.PI / 2; hg.fillText(n, Math.cos(an) * R * .72, Math.sin(an) * R * .72); });
    for (let k = 0; k < 12; k++) { const an = k / 12 * 6.283; inkLine(hg, [[Math.cos(an) * R * .84, Math.sin(an) * R * .84], [Math.cos(an) * R * .9, Math.sin(an) * R * .9]], 3, INK, 940 + k); }
    const ha = (hours % 12) / 12 * 6.283 - Math.PI / 2, ma = (hours % 1) * 6.283 - Math.PI / 2;
    inkLine(hg, [[0, 0], [Math.cos(ha) * R * .5, Math.sin(ha) * R * .5]], 10, INK, 950); inkLine(hg, [[0, 0], [Math.cos(ma) * R * .78, Math.sin(ma) * R * .78]], 6, INK, 951);
    hg.fillStyle = RED; hg.beginPath(); hg.arc(0, 0, 10, 0, 6.283); hg.fill(); hg.restore(); };
  // captions: the parchment ribbon in the lower third, current word in red
  let CHUNKS = null; const CAPY = ep.capY || 948, CAPN = ep.capWords || 4, CF = ep.capSize || 60, ck = CF / 70;
  function buildChunks() { CHUNKS = []; for (const l of Object.values(NB.TL.lines)) { let cur = []; const ws = l.words.filter(w => !/^\[/.test(w.w)); ws.forEach((w, i) => { cur.push({ ...w, s: l.start + w.s, e: l.start + w.e }); if (/[.,!?…]$/.test(w.w) || cur.length >= CAPN || i === ws.length - 1) { CHUNKS.push(cur); cur = []; } }); }
    CHUNKS.forEach((c, i) => { c.t0 = c[0].s - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].s - .05, c.at(-1).e + .55) : c.at(-1).e + .5; }); }
  function captions(t) {
    if (!CHUNKS) buildChunks(); const c = CHUNKS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
    const y = CAPY, a = Math.min(1, (t - c.t0) / .08, (c.t1 - t) / .1); hg.globalAlpha = clamp(a);
    hg.font = `bold ${CF}px ${LUM}`; hg.textBaseline = 'middle'; const ws = c.map(w => w.w), wd = ws.map(w => hg.measureText(w).width), gap = 20 * ck, tw = wd.reduce((x, y) => x + y, 0) + gap * (ws.length - 1);
    const bw = Math.max(480, tw + 110 * ck), x0 = W / 2 - bw / 2, q = v => v * ck;
    hg.fillStyle = '#b8955e'; for (const s of [-1, 1]) { const ex = s < 0 ? x0 + 10 : x0 + bw - 10; hg.beginPath(); hg.moveTo(ex, y - q(40)); hg.lineTo(ex + s * q(70), y - q(26)); hg.lineTo(ex + s * q(46), y + q(10)); hg.lineTo(ex + s * q(70), y + q(46)); hg.lineTo(ex, y + q(56)); hg.closePath(); hg.fill(); }
    const rb = hg.createLinearGradient(0, y - q(56), 0, y + q(56)); rb.addColorStop(0, '#f1e4c4'); rb.addColorStop(1, '#dcc28e'); hg.fillStyle = rb; hg.beginPath(); hg.moveTo(x0, y - q(50)); hg.quadraticCurveTo(W / 2, y - q(66), x0 + bw, y - q(50)); hg.lineTo(x0 + bw, y + q(50)); hg.quadraticCurveTo(W / 2, y + q(34), x0, y + q(50)); hg.closePath(); hg.fill();
    hg.strokeStyle = INK; hg.lineWidth = 3; hg.stroke();
    let x = W / 2 - tw / 2; ws.forEach((w, i) => { const now = t >= c[i].s && t < (c[i + 1] ? c[i + 1].s : c.t1); hg.fillStyle = now ? RED : INK; hg.textAlign = 'left'; hg.fillText(w, x, y - q(4)); x += wd[i] + gap; });
    hg.globalAlpha = 1;
  }

  // ---- timeline: no loop. Tilt in at ep.open, fold back to the page at S.closeUp (default 1.2 s after the last word), fade out ----
  let SHOTS = null;
  function prepare() {
    const ids = Object.keys(NB.TL.lines), last = ids[ids.length - 1];
    S.END = NB.TL.end; S.last = last; S.open = T(ep.open || ['L1', null, 0]); S.closeUp = ep.closeAt ? T(ep.closeAt) : en(last) + 1.2;
    S.flapAt = ep.flapAt ? T(ep.flapAt) : S.open + 1.0; S.glowAt = ep.glow ? T(ep.glow) : S.closeUp + 1.9;
    if (cd) { S.cdUp = T(cd.up || ['L1', null, -.25]); S.cdDown = cd.down ? T(cd.down) : S.cdUp + 4; S.cdPlace = cd.placeAt ? T(cd.placeAt) : 1e9; S.cdDate = cd.dateAt ? T(cd.dateAt) : 1e9; }
    S.hits = []; ep.prepare && ep.prepare(S); SHOTS = ep.shots(S);
  }
  window.seek = function (t) {
    S.t = t; if (!SHOTS) prepare(); drawPage(t);
    let cp = SHOTS[0][2].slice(), cl = SHOTS[0][3].slice(), roll = 0;
    for (const [t0, d, p, l, r = 0] of SHOTS) { const k = eio(P(t, t0, d)); if (k <= 0) break; cp = cp.map((v, i) => lerp(v, p[i], k)); cl = cl.map((v, i) => lerp(v, l[i], k)); roll = lerp(roll, r, k); }
    const tilt = S.tilt = eio(P(t, S.open - .4, 1.6)) * (1 - eio(P(t, S.closeUp - .1, 2.4)));
    const push = eio(clamp(t / Math.max(.5, S.open - .4))) * (1 - eio(P(t, S.closeUp + .4, 2.2))), pz = ZTOP - (ep.push ?? 2.4) * push, py0 = (ep.pushY ?? 0) * push;
    let shake = ep.shake ? ep.shake(t, S) : 0; for (const h of S.hits) { const d = t - h; if (d > 0 && d < .45) shake += Math.exp(-d * 11) * .22; }
    camera.position.set(lerp(0, cp[0] + Math.sin(t * .5) * .25, tilt) + Math.sin(t * 47) * shake, lerp(py0, cp[1], tilt) + Math.cos(t * 39) * shake * .5, lerp(pz, cp[2], tilt) + Math.cos(t * 43) * shake);
    // the diorama's "up" is +z: blend the camera's up vector from page-up to sky-up as it tilts (a fixed (0,1,0) renders low shots upside down)
    camera.up.set(0, 1 - tilt, tilt).normalize(); camera.lookAt(lerp(0, cl[0], tilt), lerp(py0, cl[1], tilt), lerp(0, cl[2], tilt)); camera.rotateZ(roll * tilt); camera.updateMatrixWorld(true);
    S.fwd = S.V(0, 0, -1).applyQuaternion(camera.quaternion); S.upv = S.V(0, 1, 0).applyQuaternion(camera.quaternion); S.right = S.V(1, 0, 0).applyQuaternion(camera.quaternion);
    const nk = clamp(ep.night ? ep.night(t, S) : 0) * tilt, tc = new THREE.Color(1 - .5 * nk, 1 - .42 * nk, 1 - .2 * nk), sc2 = new THREE.Color(1 - .25 * nk, 1 - .2 * nk, 1 - .08 * nk);
    if (ep.light) { const [lr, lg, lb] = ep.light(t, S); tc.r *= 1 + (lr - 1) * tilt; tc.g *= 1 + (lg - 1) * tilt; tc.b *= 1 + (lb - 1) * tilt; }
    S.TINT.forEach(m => m.color.copy(tc)); S.TINT_SKY.forEach(m => m.color.copy(sc2));
    const tSkyUp = S.open - .3, tSkyDown = S.closeUp + 1.25;
    drawSky(clamp(1 - P(t, tSkyUp - .1, .45) + P(t, tSkyDown + .2, .7)), t);
    skyPivot.rotation.x = Math.PI / 2 * back(P(t, tSkyUp, .7)) * (1 - eio(P(t, tSkyDown, .9)));
    const fk = back(P(t, S.flapAt, .8)) * (1 - eio(P(t, S.closeUp + 1.0, .7))); flapPivot.rotation.x = -Math.PI * (1 - fk); S.flapMesh.visible = fk > .02;
    if (ceiling) ceiling.visible = tilt > .6 && camera.position.z < SKH + FLH - 1.5 && fk > .9;
    if (S.cd) { S.raise(S.cd, S.cdUp, S.cdDown, .8); S.setTex(S.cd, t > S.cdDate ? 2 : t > S.cdPlace ? 1 : 0); S.cd.m.rotation.z = Math.sin(t * 1.1) * .012 * clamp(S.cd.pivot.rotation.x); }
    S.tags = []; ep.update(t, S);
    scene.updateMatrixWorld(true); renderer.setClearColor(BG); renderer.clear(); renderer.render(scene, camera);
    hg.clearRect(0, 0, W, H); ep.hud && ep.hud(t, S); S.tags.forEach(([s, x, y, a, size]) => S.tag(s, x, y, a, size)); captions(t);
    const v = hg.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, W * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(16,10,6,.58)'); hg.fillStyle = v; hg.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const r = rng(900 + i), x = (r() * W + Math.sin(t * .3 + i) * 40) % W, y = (r() * H - t * (8 + r() * 14) % H + H) % H; hg.fillStyle = `rgba(255,240,205,${.06 + r() * .12})`; hg.beginPath(); hg.arc(x, y, 1.5 + r() * 2.5, 0, 6.283); hg.fill(); }
    const gr = rng(Math.floor(t * 30) + 3); hg.fillStyle = 'rgba(40,20,5,0.05)'; for (let i = 0; i < 1600; i++) hg.fillRect(gr() * W, gr() * H, 2, 2);
    const fi = ep.fadeIn ?? .4, fo = ep.fadeOut ?? 1, fade = Math.max(fi ? 1 - P(t, 0, fi) : 0, fo ? P(t, S.END - fo, fo) : 0); if (fade > 0) { hg.fillStyle = `rgba(8,5,3,${clamp(fade)})`; hg.fillRect(0, 0, W, H); }
    hudTex.needsUpdate = true; renderer.clearDepth(); renderer.render(hudScene, hudCam);
    return true;
  };
  window.setTL = tl => { NB.TL = tl; CHUNKS = null; SHOTS = null; lastGlow = -1; lastPK = -1; return true; };

  // ---- boot: fonts + the episode's real artifacts, then build everything ----
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { MISSING.add('asset:' + src); res(null); }; i.src = new URL(src, location.href).href; });
  const assets = Object.entries(ep.assets || {});
  Promise.all([document.fonts.load(`88px ${LUM}`), ...assets.map(([, src]) => loadImg(src))]).then(([, ...imgs]) => {
    assets.forEach(([k], i) => S.img[k] = imgs[i]);
    buildPage(); buildSky();
    if (cd) S.cd = S.standee([0, 1, 2].map(cdArt), PW / 2, CDY, CDH, { flat: true, z: .021 });
    for (const [k, [s, size, col]] of Object.entries(ep.words || {})) S.BIG[k] = word(s, size, col || INK);
    ep.build(S); window.ready = true;
  });
};
})();
