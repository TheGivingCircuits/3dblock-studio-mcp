// Conspiracy Theories house style: a hand-coloured woodcut broadsheet that stands up off the page as a pop-up diorama.
// Load after three.min.js and /notebook/lib.js. An episode's scene.js calls WC.episode({...}) — see templates/scene.js.
// Everything is a pure function of time t (window.seek), so frames render deterministically. Loop contract: the frame at
// t=0 and the frame at t=END are the same flat broadsheet (the engine tilts in, the episode plays, the engine folds back).
// A 'cover' page (Guess The Horror) is a closed movie case instead: the lid swings open, the diorama stands up, it all folds, the lid snaps shut.
(function () {
const WC = window.WC = {};
const { P, lerp, eo, eio, back, clamp, rng, st, en } = NB;
const W = 1080, H = 1920, PW = 1152, PH = 2048, U = 9 / PW;
const MISSING = window.MISSING = new Set(), norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
// at() that remembers words it couldn't find (render.mjs prints them) — a typo would otherwise silently fire at the line start
const at = (id, word, nth = 0) => { const l = NB.TL && NB.TL.lines[id]; if (!l) MISSING.add(id); else if (!l.words.some(w => norm(w.w).startsWith(norm(word)))) MISSING.add(`${id}:${word}`); return NB.at(id, word, nth); };
// a time reference: ['L3', 'word', offset] | ['L3', null, offset] (line start) | ['L3', '$end', offset]
const T = ([l, w, off = 0]) => (w === '$end' ? en(l) : w ? at(l, w) : st(l)) + off;
Object.assign(WC, { P, lerp, eo, eio, back, clamp, rng, at, st, en, T, W, H, PW, PH, U, ei: NB.ei });
const toW = WC.toW = (px, py) => [(px - PW / 2) * U, (PH / 2 - py) * U];
const C = WC.C = { INK: '#2a1f18', RED: '#b9563c', BLOOD: '#9c2a1e', BLUE: '#6f8aac', BLK: '#33261f', TAN: '#dcbc8c', OCHRE: '#e2b04e', GOLD: '#c9a23a', GREEN: '#7f9c5c', SKIN: '#efd6b0', SMOKE: '#8a9bb2', ROOF: '#a9533b', WALL: '#e6d7b6', STONE: '#c9b896', PAPER: '#efe6cf', LIT: '#f3c95a', ORANGE: '#e8873a' };
const { INK, RED, BLOOD, BLUE, BLK, TAN, OCHRE, GOLD, GREEN, SKIN, SMOKE, ROOF, WALL, STONE } = C;
const LUM = WC.LUM = 'Luminari, "Apple Chancery", serif';
// page + lettering themes. The woodcut ART is the same in every era; the PAGE and the TYPE follow the period of the story:
// 'broadsheet' = a 16th-century woodcut broadsheet (Luminari, Roman numerals, scroll captions) — for stories before ~1800
// 'newspaper'  = a modern newspaper front page (masthead, dateline, headline, newsprint columns; Big Caslon / Avenir Condensed /
//                Times / Helvetica) — for stories from ~1850 on. Captions: 'news' (default) or 'vhs' (white + yellow, 80s–90s).
const THEMES = WC.THEMES = {
  broadsheet: { name: 'broadsheet', head: LUM, big: LUM, bigWeight: 'bold', cap: LUM, capWeight: 'bold', tag: LUM, stamp: LUM, roman: true, captions: 'ribbon', load: [`88px ${LUM}`] },
  newspaper: { name: 'newspaper', mast: '"Big Caslon", "Bodoni 72", Didot, serif', head: '"Avenir Next Condensed", "Arial Narrow", sans-serif', deck: '"Times New Roman", Times, serif',
    big: '"Avenir Next Condensed", "Arial Narrow", sans-serif', bigWeight: 800, cap: '"Helvetica Neue", Helvetica, Arial, sans-serif', capWeight: 800, tag: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    stamp: 'Rockwell, "Courier New", serif', roman: false, captions: 'news',
    load: ['bold 90px "Big Caslon"', '800 90px "Avenir Next Condensed"', '800 60px "Helvetica Neue"', '700 20px "Helvetica Neue"', 'bold 40px Rockwell', 'italic 21px "Times New Roman"', 'bold 38px "Times New Roman"'] },
};
// 'cover' = a movie case (DVD / VHS) with the title withheld — for "Guess The Horror". It opens like a real case (pg0.case: false = flat page)
THEMES.cover = { name: 'cover', head: '"Avenir Next Condensed", "Arial Narrow", sans-serif', big: '"Avenir Next Condensed", "Arial Narrow", sans-serif', bigWeight: 800, cap: '"Helvetica Neue", Helvetica, Arial, sans-serif', capWeight: 800,
  tag: '"Helvetica Neue", Helvetica, Arial, sans-serif', stamp: 'Rockwell, "Courier New", serif', deck: 'Didot, "Times New Roman", serif', roman: false, captions: 'vhs',
  load: ['800 90px "Avenir Next Condensed"', '500 30px "Avenir Next Condensed"', '800 60px "Helvetica Neue"', '700 20px "Helvetica Neue"', 'bold 40px Rockwell', 'italic 40px Didot', '900 40px "Arial Black"'] };
WC.F = THEMES.broadsheet;
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
function paper(w, h, seed, edge = .4, tones = ['#f3ebd8', '#e9dcc0', '#d4c09a']) {
  const c = cnv(w, h), g = c.getContext('2d'), r = rng(seed);
  const b = g.createRadialGradient(w / 2, h * .45, 50, w / 2, h / 2, Math.max(w, h) * .75); b.addColorStop(0, tones[0]); b.addColorStop(.7, tones[1]); b.addColorStop(1, tones[2]); g.fillStyle = b; g.fillRect(0, 0, w, h);
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
// ================= modern people (roughly 1900 → today): a fitted body, real hair, and a period wardrobe =================
// Use { era: 'modern', ... } and MATCH THE CLOTHES TO THE EPISODE'S YEAR — e.g. 1997: flannel, windbreakers, denim jackets, team
// jerseys, ball caps, baggy jeans, sneakers; 1942: fedoras, suits, coats, dresses; 1980 (soldiers): uniforms, berets/caps.
//   top: 'tee' | 'flannel' | 'windbreaker' | 'denim' | 'jersey' | 'hoodie' | 'suit' | 'uniform' | 'sweater' | 'dress' | 'coat' | 'alien'
//        topCol, top2 (plaid stripe / colour block / trim / pattern / tee graphic), top3, inner (shirt under open jackets), number, tie
//   bottom: 'jeans' | 'slacks' | 'shorts' | 'skirt'; bottomCol; baggy;  shoes: 'sneakers' | 'boots' | 'cowboy' | 'dress'; shoeCol, shoe2
//   hair: 'short' | 'buzz' | 'flat' | 'curly' | 'long' | 'big' | 'ponytail' | 'bob' | 'mullet' | 'bald'; hairCol; scrunchie (colour)
//   hat: 'ball' | 'ballBack' | 'cowboy' | 'trooper' | 'fedora' | 'beanie'; hatCol;  glasses / mustache / beard (colours); skin; alien (mask)
const qpt = (a, b, c, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
function modernPerson(o, f) {
  const c = cnv(400, 640), g = c.getContext('2d'), s = o.seed * 31 + f * 7, q = o.pose(f), cx = 160, sway = q.sway || 0, skin = o.skin || SKIN, hairCol = o.hairCol || '#2a1d14';
  g.translate(40, 0);
  const top = o.top || 'tee', topCol = o.topCol || (top === 'alien' ? '#9aa39a' : '#9c3a2a'), bottom = o.bottom || 'jeans', shoes = o.shoes || 'sneakers';
  const pantsCol = o.bottomCol || ({ jeans: '#4a6488', slacks: '#3a3a44', shorts: '#8a7a5a', skirt: '#3d5a7a' })[bottom];
  const suitLike = top === 'suit' || top === 'uniform' || top === 'alien', legCol = top === 'alien' ? topCol : top === 'suit' ? (o.bottomCol || topCol) : pantsCol;
  // ---- legs + shoes
  const step = q.step ? 22 : 0, feet = [[132 - step + sway * .3, 590, -1], [190 + step + sway * .3, 594, 1]];
  const shoe = (x, y, dir, k) => { g.save(); g.translate(x, y); const col = o.shoeCol || ({ sneakers: '#efeae0', boots: '#5a3a22', cowboy: '#7a4a28', dress: '#1e1a1a' })[shoes];
    if (shoes === 'cowboy') shape(g, [[-12, 8], [-14, -26], [10, -28], [12, -8], [46 * dir, -2], [48 * dir, 6], [10 * dir, 10]], col, 3, s + k);
    else if (shoes === 'boots') shape(g, [[-14, 8], [-14, -24], [12, -24], [14, -10], [40 * dir, -4], [42 * dir, 8]], col, 3, s + k);
    else shape(g, [[-14, 6], [-8, -14], [18 * dir + 6, -12], [44 * dir, -2], [42 * dir, 8], [-12, 10]], col, 3, s + k);
    if (shoes === 'sneakers') { inkLine(g, [[2 * dir, -4], [30 * dir, 0]], 4, o.shoe2 || RED, s + k + 1); g.fillStyle = '#d8d0c0'; g.fillRect(dir > 0 ? -12 : -40, 4, 52, 4); }
    g.restore(); };
  const leg = (hipX, foot, k) => { const [fx, fy] = foot, w0 = 23, w1 = o.baggy ? 25 : 19, kneeX = (hipX + fx) / 2 + (k ? 4 : -4);
    const full = [[hipX - w0, 328], [hipX + w0, 328], [kneeX + w0 * .85, 460], [fx + w1, fy - 10], [fx - w1, fy - 10], [kneeX - w0 * .85, 460]];
    if (bottom === 'shorts' || bottom === 'skirt' || top === 'dress' || top === 'coat') shape(g, [[kneeX - 10, 430], [kneeX + 10, 430], [fx + 10, fy - 10], [fx - 10, fy - 10]], top === 'coat' ? legCol : skin, 3, s + 20 + k);
    if (bottom === 'shorts' && top !== 'dress') shape(g, [[hipX - w0, 328], [hipX + w0, 328], [kneeX + w0, 440], [kneeX - w0, 440]], legCol, 3.5, s + 22 + k);
    else if (bottom !== 'skirt' && top !== 'dress' && top !== 'coat') { shape(g, full, legCol, 3.5, s + 24 + k); hatchIn(g, full, hipX + 2, 328, hipX + 40, fy, 8, -1.1, 1.3, .35, s + 26 + k);
      if (bottom === 'jeans' && top !== 'alien') inkLine(g, [[hipX + (k ? 8 : -8), 340], [kneeX + (k ? 6 : -6), 460], [fx + (k ? 6 : -6), fy - 14]], 1.6, 'rgba(240,230,200,.55)', s + 28 + k); }
    shoe(fx, fy, foot[2], 30 + k); };
  leg(142, feet[0], 0); leg(178, feet[1], 1);
  // ---- hair that hangs behind the head; a hoodie's hood
  const Hs = o.hair, headOn = () => { g.save(); g.translate(cx, 152); g.scale(1.22, 1.22); g.translate(-cx, -140); }, headOff = () => g.restore();   // heads are drawn 1.22x and a little lower: adult proportions, short necks
  headOn();
  if (Hs === 'long') shape(g, [[112, 150], [118, 100], [cx, 86], [204, 102], [212, 170], [206, 244], [116, 244]], hairCol, 3.5, s + 40);
  if (Hs === 'big') shape(g, [[98, 160], [106, 90], [cx, 70], [216, 90], [228, 168], [216, 254], [102, 254]], hairCol, 3.5, s + 40);
  if (Hs === 'bob') shape(g, [[116, 150], [120, 102], [cx, 88], [202, 102], [208, 160], [200, 196], [120, 196]], hairCol, 3.5, s + 40);
  if (Hs === 'mullet') shape(g, [[120, 130], [128, 160], [124, 236], [146, 238], [150, 170]], hairCol, 3, s + 40);
  if (Hs === 'ponytail') shape(g, [[126, 116], [104, 150], [96, 220], [110, 236], [120, 170], [134, 132]], hairCol, 3, s + 40);
  headOff();
  if (top === 'hoodie') shape(g, [[118, 210], [112, 160], [130, 136], [150, 150], [146, 206]], o.top2 || topCol, 3, s + 41);
  q.behind && q.behind(g, s);
  // ---- arms: the back arm behind the body, the front arm in front of it
  const sleeveCol = top === 'jersey' ? (o.inner || '#f1ede2') : top === 'windbreaker' ? (o.top2 || topCol) : topCol, shortSleeve = top === 'tee' || top === 'jersey';
  const arm = ([sh, el, hd]) => { const path = (t0, t1) => { g.beginPath(); g.moveTo(...qpt(sh, el, hd, t0)); for (let i = 1; i <= 14; i++) g.lineTo(...qpt(sh, el, hd, t0 + (t1 - t0) * i / 14)); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (shortSleeve) { path(0, 1); g.lineWidth = 27; g.strokeStyle = INK; g.stroke(); path(0, 1); g.lineWidth = 20; g.strokeStyle = skin; g.stroke(); path(0, .42); g.lineWidth = 36; g.strokeStyle = INK; g.stroke(); path(0, .42); g.lineWidth = 29; g.strokeStyle = sleeveCol; g.stroke(); }
    else { path(0, 1); g.lineWidth = 34; g.strokeStyle = INK; g.stroke(); path(0, 1); g.lineWidth = 27; g.strokeStyle = sleeveCol; g.stroke();
      if (top === 'flannel') for (let t = .1; t < .95; t += .15) { const p = qpt(sh, el, hd, t); g.fillStyle = o.top2 || '#3a2a20'; g.globalAlpha = .5; g.fillRect(p[0] - 10, p[1] - 3, 20, 6); g.globalAlpha = 1; }
      if (top === 'suit' || top === 'uniform') { const p = qpt(sh, el, hd, .9); g.fillStyle = '#f4efe4'; g.beginPath(); g.arc(p[0], p[1], 8, 0, 6.283); g.fill(); } } };
  arm(q.arms[0]);
  // ---- neck + torso
  g.fillStyle = skin; g.fillRect(149, 180, 24, 26); inkLine(g, [[149, 182], [149, 204]], 2.5, INK, s + 42); inkLine(g, [[173, 182], [173, 204]], 2.5, INK, s + 43);
  const wide = top === 'suit' ? 8 : 0, hem = top === 'suit' ? 352 : top === 'coat' ? 476 : top === 'dress' ? 480 : 336;
  const torso = top === 'dress' ? [[122, 202], [198, 202], [204, 240], [196, 318], [218, hem], [cx + sway, hem + 10], [102, hem], [124, 318], [116, 240]]
    : top === 'coat' ? [[114, 202], [206, 202], [210, 240], [214, hem], [cx, hem + 8], [106, hem], [110, 240]]
    : [[114 - wide, 202], [206 + wide, 202], [210 + wide, 238], [204 + wide * .6, hem], [cx, hem + 4], [118 - wide * .6, hem], [110 - wide, 238]];
  shape(g, torso, topCol, 4.5, s + 44);
  const clipTo = fn => { g.save(); g.beginPath(); torso.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); fn(); g.restore(); };
  if (top === 'flannel') clipTo(() => { g.globalAlpha = .5; g.fillStyle = o.top2 || '#3a2a20'; for (let x = 100; x < 230; x += 24) g.fillRect(x, 190, 9, 300); for (let y = 196; y < 500; y += 24) g.fillRect(90, y, 140, 9); g.globalAlpha = .7; g.strokeStyle = '#f1e6c9'; g.lineWidth = 1.2; for (let x = 108; x < 230; x += 24) { g.beginPath(); g.moveTo(x, 190); g.lineTo(x, 480); g.stroke(); } g.globalAlpha = 1; });
  if (top === 'windbreaker') clipTo(() => { g.fillStyle = o.top2 || '#6e2f8a'; g.beginPath(); g.moveTo(90, 250); g.lineTo(240, 210); g.lineTo(240, 268); g.lineTo(90, 308); g.closePath(); g.fill(); g.fillStyle = o.top3 || '#e86aa0'; g.beginPath(); g.moveTo(90, 308); g.lineTo(240, 268); g.lineTo(240, 290); g.lineTo(90, 330); g.closePath(); g.fill(); inkLine(g, [[90, 250], [240, 210]], 2.5, INK, s + 45); inkLine(g, [[90, 308], [240, 268]], 2.5, INK, s + 46); });
  if (top === 'sweater') clipTo(() => { g.strokeStyle = o.top2 || OCHRE; g.lineWidth = 7; for (const y of [250, 282]) { g.beginPath(); for (let x = 100; x < 230; x += 16) { g.lineTo(x, y); g.lineTo(x + 8, y + 12); } g.stroke(); } });
  if (top === 'dress') clipTo(() => { const r = rng(s + 47); for (let i = 0; i < 26; i++) { const x = 100 + r() * 120, y = 210 + r() * 270; g.fillStyle = o.top2 || '#f1e6c9'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.257) * 4, y + Math.sin(k * 1.257) * 4, 3, 0, 6.283); g.fill(); } g.fillStyle = OCHRE; g.beginPath(); g.arc(x, y, 2, 0, 6.283); g.fill(); } });
  if (top === 'alien') clipTo(() => { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6; for (const x of [134, 150]) { g.beginPath(); g.moveTo(x, 210); g.quadraticCurveTo(x - 10, 270, x, 330); g.stroke(); } });
  hatchIn(g, torso, cx + 10, 196, 240, hem + 10, 8, -1.05, 1.4, .35, s + 48);
  if (bottom === 'skirt' && top !== 'dress' && top !== 'coat') shape(g, [[120, 330], [202, 330], [214, 462], [108, 462]], pantsCol, 3.5, s + 49);
  // fronts: open jackets, pockets, zips, numbers, lapels, badges, belts
  if (top === 'flannel' || top === 'denim' || top === 'coat') { shape(g, [[166, 204], [184, 204], [182, Math.min(hem, 400) - 2], [168, Math.min(hem, 400) - 2]], o.inner || '#f1ede2', 2.5, s + 50); inkLine(g, [[154, 204], [166, 230], [170, 210]], 3, INK, s + 51); inkLine(g, [[196, 204], [184, 230], [180, 210]], 3, INK, s + 52); }
  if (top === 'denim') { for (const x of [138, 196]) { block(g, [[x - 12, 246], [x + 12, 246], [x + 12, 268], [x - 12, 268]], null, 2, s + 53 + x); g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(x, 250, 3, 0, 6.283); g.fill(); } inkLine(g, [[118, 238], [206, 236]], 2, 'rgba(240,230,200,.6)', s + 55); }
  if (top === 'windbreaker' || top === 'hoodie') inkLine(g, [[176, 206], [178, hem]], 3, '#d8d0c0', s + 56);
  if (top === 'hoodie') { block(g, [[132, 286], [190, 286], [196, 320], [126, 320]], null, 2.5, s + 57); inkLine(g, [[166, 206], [164, 248]], 2, '#f1ede2', s + 58); inkLine(g, [[176, 206], [178, 250]], 2, '#f1ede2', s + 59); }
  if (top === 'jersey') { shape(g, [[146, 202], [174, 202], [160, 228]], o.inner || '#f1ede2', 2, s + 60); inkLine(g, [[122, 206], [138, 216], [148, 204]], 6, o.top2 || OCHRE, s + 61); inkLine(g, [[172, 204], [186, 216], [200, 206]], 6, o.top2 || OCHRE, s + 62);
    g.font = `900 50px "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = o.top2 || OCHRE; g.strokeText(String(o.number ?? 13), 168, 276); g.fillStyle = '#f4efe4'; g.fillText(String(o.number ?? 13), 168, 276); }
  if (top === 'tee' && o.top2) shape(g, circ(168, 262, 20, 14), o.top2, 2.5, s + 63);
  if (top === 'tee' || top === 'sweater' || top === 'dress') inkLine(g, [[146, 204], [160, 214], [174, 204]], 3, INK, s + 64);
  if (top === 'suit') { shape(g, [[146, 204], [176, 204], [161, 272]], '#f4efe4', 2.5, s + 65); shape(g, [[158, 210], [164, 210], [168, 262], [161, 276], [154, 262]], o.tie || BLOOD, 2, s + 66);
    for (const sg of [-1, 1]) inkLine(g, [[161 + sg * 24, 202], [161 + sg * 10, 272], [161 + sg * 4, 302]], 3, INK, s + 67 + sg);
    g.fillStyle = INK; for (const y of [300, 326]) { g.beginPath(); g.arc(174, y, 4.5, 0, 6.283); g.fill(); } block(g, [[112, 222], [126, 222], [126, 232], [112, 232]], '#f4efe4', 1.5, s + 69); }
  if (top === 'uniform') { block(g, [[126, 236], [150, 236], [150, 256], [126, 256]], null, 2, s + 70); block(g, [[172, 236], [196, 236], [196, 256], [172, 256]], null, 2, s + 71);
    const badge = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 6 : 13; return [138 + Math.cos(a) * rr, 226 + Math.sin(a) * rr]; }); block(g, badge, GOLD, 2, s + 72);
    shape(g, [[157, 206], [165, 206], [167, 262], [161, 272], [155, 262]], '#2a2420', 2, s + 73); }
  if (top === 'coat') for (const y of [250, 300, 350, 400]) { g.fillStyle = INK; g.beginPath(); g.arc(188, y, 4, 0, 6.283); g.fill(); }
  if (top === 'uniform' || (!suitLike && top !== 'dress' && top !== 'coat' && top !== 'hoodie')) { block(g, [[118, 326], [204, 326], [204, 338], [118, 338]], top === 'uniform' ? '#1e1a1a' : '#3a2616', 2, s + 74); block(g, [[156, 324], [170, 324], [170, 340], [156, 340]], top === 'uniform' ? GOLD : '#b8a070', 1.5, s + 75); }
  arm(q.arms[1]);
  q.front && q.front(g, s);
  q.arms.forEach(([, , hd], i) => { g.fillStyle = o.alien ? '#9cc07a' : skin; g.beginPath(); g.arc(hd[0], hd[1], 13, 0, 6.283); g.fill(); inkLine(g, NB.circlePts(hd[0], hd[1], 13, 12), 2.5, INK, s + 5 + i); });
  q.over && q.over(g, s);
  // ---- head (drawn 1.22x, see headOn)
  headOn();
  if (o.alien) { shape(g, ell(cx + 4, 128, 44, 56, .12, 22), '#9cc07a', 3.5, s + 80); hatchIn(g, ell(cx + 4, 128, 44, 56, .12, 22), cx + 10, 70, cx + 60, 190, 7, -1, 1.3, .4, s + 81);
    for (const [ex, ey, rot] of [[146, 124, -.5], [186, 128, .5]]) shape(g, ell(ex, ey, 17, 9, rot, 14), '#14100e', 2, s + 82 + ex);
    g.fillStyle = INK; g.beginPath(); g.ellipse(172, 166, 6, (q.mouth ?? 4) > 8 ? 8 : 2, 0, 0, 6.283); g.fill(); headOff(); q.top && q.top(g, s); return cutout(c); }
  g.fillStyle = skin; g.beginPath(); g.arc(cx, 140, 33, 0, 6.283); g.fill(); inkLine(g, NB.circlePts(cx, 140, 33, 18), 3.5, INK, s + 84);
  shape(g, ell(140, 144, 7, 10, 0, 10), skin, 2.5, s + 85);
  const ey = q.look ? 123 : 131; g.fillStyle = INK; g.fillRect(166, ey, 6, 6); inkLine(g, q.look ? [[158, ey - 9], [176, ey - 14]] : [[160, 124], [174, 122]], 2.5, INK, s + 86); inkLine(g, [[178, 136], [186, 150], [178, 153]], 2.5, INK, s + 87);
  g.beginPath(); g.ellipse(174, 162, q.grin ? 9 : 5, q.mouth ?? o.mouth ?? 6, 0, 0, 6.283); g.fillStyle = INK; g.fill();
  if (o.mustache) shape(g, [[164, 154], [184, 152], [186, 158], [164, 160]], o.mustache, 2, s + 88);
  if (o.beard) shape(g, [[146, 158], [160, 176], [184, 170], [176, 196], [150, 194]], o.beard, 3, s + 89);
  g.fillStyle = 'rgba(180,60,40,.22)'; g.beginPath(); g.arc(184, 152, 6, 0, 6.283); g.fill();
  if (o.glasses) { g.strokeStyle = o.glasses; g.lineWidth = 3; g.strokeRect(162, ey - 6, 18, 14); g.beginPath(); g.moveTo(162, ey); g.lineTo(142, ey + 2); g.stroke(); }
  const hp = { short: [[126, 134], [124, 106], [150, 92], [182, 94], [198, 108], [196, 122], [184, 112], [156, 110], [138, 118], [134, 136]], buzz: [[128, 128], [130, 108], [cx, 100], [190, 106], [194, 118], [cx, 110], [134, 120]],
    flat: [[124, 130], [126, 88], [196, 88], [198, 116], [186, 108], [140, 110], [132, 130]], mullet: [[126, 134], [124, 106], [150, 92], [182, 94], [198, 108], [196, 122], [184, 112], [156, 110], [138, 118], [134, 136]],
    long: [[122, 140], [124, 104], [cx, 90], [198, 104], [202, 126], [188, 112], [150, 110], [132, 124]], big: [[118, 140], [118, 96], [cx, 80], [204, 96], [210, 128], [196, 106], [176, 120], [cx, 104], [140, 118], [128, 130]],
    ponytail: [[124, 136], [124, 104], [cx, 90], [198, 104], [200, 120], [186, 110], [150, 110], [132, 122]], bob: [[122, 140], [124, 104], [cx, 90], [198, 104], [202, 126], [188, 112], [150, 110], [132, 124]] }[Hs];
  const hatHides = o.hat && o.hat !== 'ballBack' && !['long', 'big', 'ponytail', 'bob'].includes(Hs);
  if (Hs === 'curly' && !hatHides) for (let k = 0; k < 10; k++) { const a = Math.PI * (1.02 + k * .1), x = cx - 2 + Math.cos(a) * 34, y = 132 + Math.sin(a) * 36; shape(g, circ(x, y, 15, 12), hairCol, 2.5, s + 90 + k); }
  else if (Hs === 'bald') { shape(g, [[126, 146], [128, 124], [140, 126], [138, 152]], hairCol, 2, s + 90); g.strokeStyle = 'rgba(255,250,235,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, 140, 26, 3.8, 4.6); g.stroke(); }
  else if (hp && !hatHides) shape(g, hp, hairCol, 3, s + 90);
  if (Hs === 'ponytail' && o.scrunchie) shape(g, ell(124, 124, 9, 12, -.4, 12), o.scrunchie, 2.5, s + 99);
  const hc = o.hatCol || BLUE;
  if (o.hat === 'ball' || o.hat === 'ballBack') { shape(g, [[124, 126], [128, 100], [cx, 88], [192, 98], [196, 122]], hc, 3, s + 100); shape(g, o.hat === 'ball' ? [[186, 116], [232, 118], [228, 128], [186, 126]] : [[134, 116], [94, 112], [96, 124], [134, 126]], hc, 2.5, s + 101); }
  else if (o.hat === 'cowboy') { shape(g, [[86, 112], [104, 100], [cx, 106], [216, 100], [236, 110], [212, 120], [cx, 116], [108, 120]], hc, 3, s + 100); shape(g, [[128, 108], [132, 72], [cx, 64], [188, 72], [192, 108]], hc, 3, s + 101); inkLine(g, [[cx, 66], [cx, 80]], 2, INK, s + 102); block(g, [[130, 100], [190, 100], [190, 108], [130, 108]], '#3a2616', 2, s + 103); }
  else if (o.hat === 'trooper') { shape(g, ell(cx, 104, 70, 12, 0, 22), hc, 3, s + 100); shape(g, [[132, 104], [144, 62], [cx, 74], [176, 62], [188, 104]], hc, 3, s + 101); block(g, [[134, 96], [186, 96], [186, 104], [134, 104]], '#3a2616', 2, s + 102); }
  else if (o.hat === 'fedora') { shape(g, ell(cx + 4, 106, 58, 11, -.05, 20), hc, 3, s + 100); shape(g, [[128, 106], [132, 78], [cx, 72], [188, 78], [192, 106]], hc, 3, s + 101); inkLine(g, [[146, 80], [cx, 88], [174, 80]], 2, INK, s + 102); block(g, [[130, 96], [190, 96], [190, 104], [130, 104]], '#2a2420', 2, s + 103); }
  else if (o.hat === 'beanie') { shape(g, [[124, 130], [128, 96], [cx, 84], [192, 96], [196, 130]], hc, 3, s + 100); block(g, [[122, 118], [198, 118], [198, 132], [122, 132]], hc, 2.5, s + 101); }
  headOff();
  q.top && q.top(g, s);
  return cutout(c);
}
function person(o, f) {
  if (o.era === 'modern') return modernPerson(o, f);
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
    top: (g, s) => { g.font = `${WC.F.bigWeight} 52px ${WC.F.big}`; g.fillStyle = RED; g.strokeStyle = '#f1e4c4'; g.lineWidth = 7; g.strokeText('Ha!', 214, 70); g.fillText('Ha!', 214, 70); } },
  talk: { look: false, mouth: 5, arms: [[SB, [120, 300], [150, 330]], [SF, [240, 240], [268, 196]]] },
  talk2: { look: false, mouth: 12, arms: [[SB, [120, 300], [150, 330]], [SF, [246, 200], [262, 128]]] },
  wave: { look: false, mouth: 8, arms: [[SB, [120, 300], [128, 384]], [SF, [246, 150], [282, 70]]] },
  wave2: { look: false, mouth: 10, arms: [[SB, [120, 300], [128, 384]], [SF, [226, 140], [228, 56]]] },
  stand: { look: false, mouth: 5, arms: [[SB, [124, 300], [130, 384]], [SF, [196, 300], [192, 384]]] },
  walk: { look: false, mouth: 5, step: true, arms: [[SB, [112, 280], [104, 352]], [SF, [212, 280], [224, 350]]] },
  walk2: { look: false, mouth: 5, sway: 2, arms: [[SB, [134, 292], [140, 372]], [SF, [196, 292], [196, 374]]] },
  escort: { look: false, mouth: 5, step: true, arms: [[SB, [120, 300], [128, 380]], [SF, [236, 250], [278, 278]]] },
  escort2: { look: false, mouth: 5, arms: [[SB, [120, 300], [128, 380]], [SF, [236, 250], [278, 278]]] },
  mic: { look: false, mouth: 9, arms: [[SB, [120, 300], [128, 380]], [SF, [240, 226], [282, 202]]], top: (g, s) => { inkLine(g, [[282, 202], [300, 170]], 8, '#2a2a30', s + 300); shape(g, circ(304, 162, 13, 12), '#3a3a42', 2.5, s + 301); block(g, [[284, 186], [308, 186], [308, 204], [284, 204]], RED, 2, s + 302); } },
  write: { look: false, mouth: 4, arms: [[SB, [140, 280], [168, 292]], [SF, [226, 292], [204, 286]]], over: (g, s) => { block(g, [[160, 262], [204, 258], [208, 312], [164, 316]], '#f4efe4', 2.5, s + 310); for (let k = 0; k < 4; k++) inkLine(g, [[168, 272 + k * 10], [198, 270 + k * 10]], 1.4, 'rgba(42,31,24,.6)', s + 311 + k); inkLine(g, [[204, 286], [218, 262]], 3, '#3a3a42', s + 316); } },
  tvcam: { look: false, mouth: 4, arms: [[SB, [150, 232], [196, 152]], [SF, [236, 222], [252, 170]]], top: (g, s) => { block(g, [[150, 104], [262, 104], [262, 168], [150, 168]], '#3a3a42', 3, s + 320); shape(g, circ(272, 136, 22, 14), '#22222a', 3, s + 321); g.fillStyle = '#9fb3cf'; g.beginPath(); g.arc(272, 136, 10, 0, 6.283); g.fill(); block(g, [[170, 92], [220, 92], [220, 104], [170, 104]], '#3a3a42', 2, s + 322); g.fillStyle = '#e8402a'; g.beginPath(); g.arc(162, 116, 5, 0, 6.283); g.fill(); for (const [k, col] of [[0, RED], [1, '#f4efe4'], [2, BLUE]]) { g.fillStyle = col; g.fillRect(180, 128 + k * 9, 48, 7); } } },
};
// a pose list → a frame function (frame f uses list[f])
WC.poses = (...names) => f => POSE[names[f]] || names[f];
Object.assign(WC, { person, modernPerson, SB, SF });

// ================= the runtime =================
WC.episode = function (ep) {
  const S = WC.S = { ep, TINT: [], TINT_SKY: [], hits: [], tags: [], img: {} }, F = WC.F = THEMES[(ep.page || {}).style || 'broadsheet'];
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputEncoding = THREE.sRGBEncoding; renderer.autoClear = false; (document.body || document.documentElement).appendChild(renderer.domElement);
  const BG = '#1b120a', scene = S.scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.Fog(BG, 26, 50);
  const camera = S.camera = new THREE.PerspectiveCamera(30, W / H, .1, 120);
  const hud = cnv(W, H), hg = S.hg = hud.getContext('2d'), hudTex = texOf(hud), hudScene = new THREE.Scene(), hudCam = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0, 1);
  hudScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false })));

  // ---- scene helpers the episode uses ----
  S.sprite = (tex, w, o = {}) => { const h = o.h || w * tex.image.height / tex.image.width, mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: o.alphaTest ?? .3, side: THREE.DoubleSide, depthWrite: o.depthWrite ?? true }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.visible = false; scene.add(m); if (o.tint !== false) S.TINT_SKY.push(mat); return m; };
  // place a camera-facing sprite (billboard); s may be a number or [sx, sy]
  S.bill = (m, x, y, z, rot = 0, s = 1) => { if (!(Array.isArray(s) ? s[0] && s[1] : s > .001)) { m.visible = false; return m; } m.visible = true; m.position.set(x, y, z); m.quaternion.copy(camera.quaternion); m.rotateZ(rot); Array.isArray(s) ? m.scale.set(s[0], s[1], 1) : m.scale.set(s, s, 1); return m; };
  // soft contact shadow under every standing figure/prop (grounds them; S.card skylines don't get one)
  const SHADOW = (() => { const c = cnv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(12,8,6,.8)'); gr.addColorStop(1, 'rgba(12,8,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return texOf(c); })();
  S.shadowed = [];
  S.standee = (cans, px, py, h, o = {}) => { const w = h * cans[0].width / cans[0].height, pivot = new THREE.Group(), [x, y] = toW(px, py), texs = cans.map(texOf);
    const mat = new THREE.MeshBasicMaterial({ map: texs[0], transparent: true, alphaTest: .3, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.y = h / 2; if (o.flip) m.scale.x = -1; pivot.add(m); pivot.position.set(x, y, o.z ?? .012); pivot.rotation.order = 'ZXY'; pivot.visible = !!o.flat; scene.add(pivot); S.TINT.push(mat);
    const d = { o, pivot, m, mat, texs, h, w };
    if (!o.noShadow) { d.shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * (o.shadowW || .9), w * .3), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false, opacity: 0 })); d.shadow.visible = false; scene.add(d.shadow); S.shadowed.push(d); }
    return d; };
  S.doll = o => S.standee(Array.from({ length: o.nf || 1 }, (_, f) => person(o, f)), o.px, o.py, o.h || 2.2, o);
  // a skyline card hinged on the page (it lies flat — visible — at t=0 when o.flat, so it is part of the printed picture)
  S.card = (canvas, py, h, o = {}) => S.standee([canvas], 576, py, h, { z: .02, noShadow: true, ...o });
  S.setTex = (d, f) => { f = Math.max(0, Math.min(d.texs.length - 1, f | 0)); if (d.mat.map !== d.texs[f]) { d.mat.map = d.texs[f]; d.mat.needsUpdate = true; } };
  S.faceCamera = d => { const up = clamp(d.pivot.rotation.x / (Math.PI / 2)); d.pivot.rotation.z = Math.atan2(camera.position.x - d.pivot.position.x, Math.max(.5, d.pivot.position.y - camera.position.y)) * .35 * up; };
  // pop a standee up on its hinge at tUp, fold it back down (and fade) at tDown; returns true while fully up
  S.hinge = (d, tUp, tDown = S.closeUp - .1, dur = .45, face = true) => { const t = S.t, up = back(P(t, tUp, dur)), down = eio(P(t, tDown, S.foldDur || .6)); d.pivot.visible = up > 0 && down < 1; d.mat.opacity = 1 - down; d.pivot.rotation.x = Math.PI / 2 * up * (1 - down); if (face) S.faceCamera(d); return up > .9 && down < .05; };
  // a skyline card that stays flat on the page (no fade) when it is down
  S.raise = (d, tUp, tDown, dur = .7) => { const t = S.t; d.pivot.visible = true; d.pivot.rotation.x = Math.PI / 2 * back(P(t, tUp, dur)) * (1 - eio(P(t, tDown, (S.foldDur || .6) + .1))); };
  // a flat card held in front of the camera (real photos/prints): kIn/kOut are 0..1 progress; returns its top-centre in world space
  S.hold = (m, kIn, kOut, o = {}) => { m.visible = kIn > 0 && kOut < 1; if (!m.visible) return null; const d = o.d ?? 4.4, tgt = camera.position.clone().addScaledVector(S.fwd, d).addScaledVector(S.upv, o.dy ?? .15).addScaledVector(S.right, o.dx ?? 0);
    const from = o.from ? o.from.clone() : tgt.clone().addScaledVector(S.upv, -2.6); m.position.lerpVectors(from, tgt, Math.min(1, kIn)).addScaledVector(S.upv, eo(kOut) * 3);
    m.quaternion.copy(camera.quaternion); m.rotateZ((o.rot ?? -.04) + (1 - Math.min(1, kIn)) * (o.spin ?? .3) + kOut * .4); m.scale.setScalar(o.grow ? .25 + .75 * Math.min(1, kIn) : 1); m.material.opacity = 1 - kOut;
    return m.position.clone().addScaledVector(S.upv, m.geometry.parameters.height / 2 * m.scale.y + .06); };
  S.print = (img, h) => { const w0 = img.naturalWidth, h0 = img.naturalHeight, c = cnv(w0 + 60, h0 + 60), g = c.getContext('2d'); g.fillStyle = C.PAPER; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 30, 30, w0, h0); inkPoly(g, [[6, 6], [c.width - 6, 6], [c.width - 6, c.height - 6], [6, c.height - 6]], 3, 'rgba(42,31,24,.5)', 5);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; };
  S.proj = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
  S.tagAt = (text, v, a, size = 38) => { if (a > 0 && v) { const [x, y] = S.proj(v); S.tags.push([text, clamp(x, 330, W - 330), y, a, size]); } };
  S.V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- the broadsheet page ----
  const pg0 = ep.page || {};
  const pageC = cnv(PW, PH), pageG = pageC.getContext('2d'), pageTex = texOf(pageC), pageMat = new THREE.MeshBasicMaterial({ map: pageTex }); S.TINT.push(pageMat);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(9, 16), pageMat));
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ color: '#2a1b10' })); desk.position.z = -.03; scene.add(desk);
  // 'cover' pages open like a real movie case, not a book: the printed front is a lid hinged on the spine (the left edge) that swings
  // open to the left, showing the inside of the case (a black tray with the disc on its hub) where the pop-up diorama lies folded flat.
  // Everything stands up only once the lid is past upright, and the lid snaps shut again after the last fold (S.lidOpen / S.lidShut).
  const CASE = S.CASE = F.name === 'cover' && pg0.case !== false;
  const trayC = CASE && cnv(PW, PH), insideC = CASE && cnv(PW, PH), trayTex = CASE && texOf(trayC), insideTex = CASE && texOf(insideC); let lid = null;
  if (CASE) { pageMat.map = trayTex; const lidMat = new THREE.MeshBasicMaterial({ map: pageTex }), inMat = new THREE.MeshBasicMaterial({ map: insideTex }); S.TINT.push(lidMat, inMat);
    lid = S.lid = new THREE.Group(); lid.position.set(-4.5, 0, .06); const front = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), lidMat); front.position.x = 4.5; lid.add(front);
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), inMat); inside.position.set(4.5, 0, -.002); inside.rotation.y = Math.PI; lid.add(inside); scene.add(lid); }
  let base, titleGlow, titleFont = 122, lastGlow = -1;
  // a modern newspaper front page around the same picture window (py 340–1300): masthead, ears, dateline, headline, caption, deck, three columns
  function buildNewspaper() {
    const NI = '#1c1a18'; base = paper(PW, PH, pg0.seed || 11, .22, ['#f2efe7', '#e8e3d6', '#d6cebb']); const g = base.getContext('2d'), r = rng(12);
    g.fillStyle = NI; g.strokeStyle = NI; g.textBaseline = 'middle'; g.textAlign = 'center';
    const fit = (txt, font, max, size, min = 28) => { let z = size; g.font = font(z); while (g.measureText(txt).width > max && z > min) { z -= 2; g.font = font(z); } return z; };
    const ears = pg0.ears || []; ears.forEach((e, i) => { const x0 = i ? PW - 262 : 70, w = 192; g.lineWidth = 2; g.strokeRect(x0, 82, w, 86); g.font = `700 19px ${F.tag}`; const ls = e.split('\n'); ls.forEach((ln, k) => g.fillText(ln.toUpperCase(), x0 + w / 2, 125 + (k - (ls.length - 1) / 2) * 26)); });
    const mast = pg0.masthead || 'The Evening Courier', ms = fit(mast, z => `bold ${z}px ${F.mast}`, ears.length ? 570 : 1000, 100); g.font = `bold ${ms}px ${F.mast}`; g.fillText(mast, PW / 2, 128);
    g.fillRect(70, 186, PW - 140, 4); g.fillRect(70, 194, PW - 140, 1.5); g.font = `700 20px ${F.tag}`; g.letterSpacing = '2px'; g.fillText((pg0.dateline || '').toUpperCase(), PW / 2, 213); g.letterSpacing = '0px'; g.fillRect(70, 231, PW - 140, 1.5); g.fillRect(70, 236, PW - 140, 4);
    const hl = (pg0.headline || pg0.title || '').toUpperCase(); titleFont = fit(hl, z => `800 ${z}px ${F.head}`, 1010, 104); g.font = `800 ${titleFont}px ${F.head}`; g.fillText(hl, PW / 2, 290);
    g.lineWidth = 3; g.strokeRect(96, 336, PW - 192, 968);
    g.textAlign = 'left'; g.font = `italic 21px ${F.deck}`; g.fillText(pg0.photoCaption || '', 100, 1324); g.fillRect(96, 1342, PW - 192, 1.5);
    g.font = `bold 38px ${F.deck}`; const deckLines = []; let line = ''; for (const wd of (pg0.deck || '').split(' ')) { if (g.measureText(line + ' ' + wd).width > 960 && line) { deckLines.push(line); line = wd; } else line = line ? line + ' ' + wd : wd; } if (line) deckLines.push(line);
    deckLines.forEach((ln, i) => g.fillText(ln, 98, 1380 + i * 44)); const y0 = 1380 + deckLines.length * 44 + 4; g.fillRect(96, y0 - 14, PW - 192, 1.5);
    const cols = [[96, 404], [422, 730], [748, 1056]]; g.fillRect(412, y0, 1.2, 1932 - y0); g.fillRect(738, y0, 1.2, 1932 - y0);
    g.font = `700 17px ${F.tag}`; g.fillText((pg0.byline || 'By staff writers').toUpperCase(), 98, y0 + 12);
    g.font = `bold 86px ${F.deck}`; g.fillText((pg0.initial || 'T').toUpperCase(), 96, y0 + 76);
    const teaserTop = 1786; cols.forEach(([x0, x1], ci) => { let y = y0 + (ci ? 10 : 38); const yEnd = ci === 2 && pg0.teaser ? teaserTop - 16 : 1928;
      for (; y < yEnd; y += 22) { if (r() < .07) { y += 8; continue; } let x = x0 + (ci === 0 && y < y0 + 104 ? 70 : 0) + (r() < .1 ? 20 : 0); while (x < x1 - 14) { const wl = 14 + r() * 58, ww = Math.min(wl, x1 - x); g.globalAlpha = .72; g.fillRect(x, y, ww, 6.5); x += wl + 6; } g.globalAlpha = 1; } });
    if (pg0.teaser) { g.lineWidth = 3; g.strokeRect(748, teaserTop, 308, 1928 - teaserTop); g.font = `800 25px ${F.head}`; const words = pg0.teaser.toUpperCase().split(' '); let ln = '', yy = teaserTop + 36; for (const wd of words) { if (g.measureText(ln + ' ' + wd).width > 272 && ln) { g.fillText(ln, 766, yy); yy += 30; ln = wd; } else ln = ln ? ln + ' ' + wd : wd; } g.fillText(ln, 766, yy); }
    g.font = `700 17px ${F.tag}`; g.fillText(pg0.folio || 'A1', 96, 1962); g.textAlign = 'right'; g.fillText(mast.toUpperCase(), PW - 96, 1962);
    titleGlow = cnv(PW, 340); const tg = titleGlow.getContext('2d'); tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.font = `800 ${titleFont}px ${F.head}`; tg.fillStyle = RED; tg.fillText(hl, PW / 2, 290);
  }
  // a movie case front (DVD keep case or VHS clamshell) with the title withheld. Two ways to fill the printed sleeve:
  //   pg0.art(g, PW, PH, WC) — REDRAW THE MOVIE'S REAL COVER in our style (its layout, colours, imagery and tagline), minus the title;
  //                            pg0.title(g, col) draws the masked title where the real one sits (col = null: its own colours; red for the glow);
  //                            pg0.stampAt [x, y, rot] places the TITLE WITHHELD stamp; pg0.quoteY / pg0.billingY place those blocks
  //   (no art)               — a generic layout: studio line, tagline, "? ? ? ? ?", a picture window, quote, billing
  // Either way the engine adds the case, the billing block of "???" names, the RATED ? box, the rental sticker and the sleeve glare.
  function buildCover() {
    base = cnv(PW, PH); const g = base.getContext('2d'), r = rng(31), vhs = pg0.format === 'vhs', art = !!pg0.art;
    const rr = (x, y, w, h, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad); g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); };
    g.fillStyle = vhs ? '#e9e6dd' : '#0b0c0f'; g.fillRect(0, 0, PW, PH);                                   // the case
    const cg = g.createLinearGradient(0, 0, PW, 0); cg.addColorStop(0, 'rgba(255,255,255,.05)'); cg.addColorStop(.5, 'rgba(255,255,255,0)'); cg.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = cg; g.fillRect(0, 0, PW, PH);
    rr(14, 14, PW - 28, PH - 28, 34); g.strokeStyle = vhs ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.stroke();
    // the printed sleeve
    rr(44, 44, PW - 88, PH - 88, 10); g.save(); g.clip(); const sg = g.createLinearGradient(0, 44, 0, PH - 44); sg.addColorStop(0, pg0.sheetTop || '#181b21'); sg.addColorStop(1, pg0.sheetBottom || '#0c0d10'); g.fillStyle = sg; g.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(255,255,255,${r() * .05})`; g.fillRect(r() * PW, r() * PH, 1.5, 1.5); }
    const INKL = '#e7e9ee', DIM = '#9aa1ab'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (art) { g.save(); pg0.art(g, PW, PH, WC); g.restore(); if (pg0.title) { g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; pg0.title(g, null); g.restore(); } g.textAlign = 'center'; g.textBaseline = 'middle'; }
    else {
      g.font = `700 21px ${F.tag}`; g.letterSpacing = '7px'; g.fillStyle = DIM; g.fillText((pg0.studio || 'Midnight Pictures presents').toUpperCase(), PW / 2, 104); g.letterSpacing = '0px';
      g.font = `italic 42px ${F.deck}`; g.fillStyle = INKL; g.fillText(pg0.tagline || '', PW / 2, 168);
      // the title, withheld
      g.font = `800 112px ${F.head}`; g.letterSpacing = '18px'; g.fillStyle = '#f1f2f5'; g.fillText(pg0.mask || '? ? ? ? ?', PW / 2 + 9, 262); g.letterSpacing = '0px';
      // the picture window
      g.lineWidth = 3; g.strokeStyle = 'rgba(231,233,238,.55)'; g.strokeRect(96, 336, PW - 192, 968);
    }
    { const [sx, sy, sr] = pg0.stampAt || [PW / 2 + 150, 282, -.12]; g.save(); g.translate(sx, sy); g.rotate(sr); g.strokeStyle = '#d23a2a'; g.lineWidth = 5; g.strokeRect(-178, -30, 356, 60); g.font = `bold 34px ${F.stamp}`; g.fillStyle = '#d23a2a'; g.fillText('TITLE WITHHELD', 0, 2); g.restore(); }
    if (pg0.quote) { const qy = pg0.quoteY || 1360; g.font = `italic 31px ${F.deck}`; g.fillStyle = INKL; g.fillText(pg0.quote, PW / 2, qy); g.font = `700 19px ${F.tag}`; g.fillStyle = DIM; g.fillText((pg0.quoteBy || '').toUpperCase(), PW / 2, qy + 42); }
    // billing block: tall condensed credits where every name is "???"
    const bill = Array.isArray(pg0.billing) ? pg0.billing : ['MIDNIGHT PICTURES PRESENTS A ??? PRODUCTION', 'A FILM BY ???', 'STARRING ??? · ??? · ??? · ???', 'MUSIC BY ??? · EDITED BY ??? · DIRECTOR OF PHOTOGRAPHY ???', 'PRODUCED BY ??? · WRITTEN BY ??? · DIRECTED BY ???'];
    if (pg0.billing !== false) { g.save(); g.fillStyle = '#b9bec7'; bill.forEach((ln, i) => { g.save(); g.translate(PW / 2, (pg0.billingY || 1470) + i * 50); g.scale(1, 1.55); g.font = `500 ${i === 1 ? 27 : 22}px ${F.head}`; g.letterSpacing = '2px'; let fs = i === 1 ? 27 : 22; while (g.measureText(ln).width > 960 && fs > 12) { fs--; g.font = `500 ${fs}px ${F.head}`; } g.fillText(ln, 0, 0); g.restore(); }); g.restore(); g.letterSpacing = '0px'; }
    // bottom bar: rating box, edition, studio logo
    const by = 1820; g.strokeStyle = '#d7dae0'; g.lineWidth = 3; g.strokeRect(96, by, 300, 132); g.font = `800 44px ${F.head}`; g.fillStyle = '#f1f2f5'; g.textAlign = 'left'; g.fillText('RATED ?', 118, by + 40);
    g.font = `500 17px ${F.tag}`; g.fillStyle = '#c3c8d0'; (pg0.ratingNote || 'for terror, dread and one\nvery long night').split('\n').forEach((ln, i) => g.fillText(ln, 118, by + 84 + i * 22));
    g.textAlign = 'center'; g.font = `800 30px ${F.head}`; g.fillStyle = '#f1f2f5'; g.fillText(pg0.edition || 'WIDESCREEN · SPECIAL EDITION', PW / 2 + 60, by + 66);
    g.save(); g.translate(PW - 170, by + 66); g.fillStyle = '#e8e3c8'; g.beginPath(); g.arc(0, -8, 34, 0, 6.283); g.fill(); g.fillStyle = pg0.sheetTop || '#181b21'; g.beginPath(); g.arc(12, -16, 30, 0, 6.283); g.fill(); g.font = `700 15px ${F.tag}`; g.letterSpacing = '3px'; g.fillStyle = '#e8e3c8'; g.fillText('MIDNIGHT', 0, 46); g.restore(); g.letterSpacing = '0px';
    g.restore();
    // the rental store's sticker
    const stk = pg0.sticker || ['MIDNIGHT VIDEO', 'NEW RELEASE', '2 NIGHTS · $3.99'];
    g.save(); g.translate(pg0.stickerAt ? pg0.stickerAt[0] : 1000, pg0.stickerAt ? pg0.stickerAt[1] : 214); g.rotate(.14); g.scale(.82, .82); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 112, 0, 6.283); g.fill(); g.strokeStyle = '#c0302a'; g.lineWidth = 8; g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 98, 0, 6.283); g.stroke();
    g.fillStyle = '#c0302a'; let s0 = 20; g.font = `900 20px "Arial Black", sans-serif`; while (g.measureText(stk[0]).width > 150 && s0 > 11) g.font = `900 ${--s0}px "Arial Black", sans-serif`; g.fillText(stk[0], 0, -48); let sf = 40; g.font = `800 40px ${F.head}`; while (g.measureText(stk[1]).width > 176 && sf > 20) g.font = `800 ${--sf}px ${F.head}`; g.fillStyle = '#1a1a1a'; g.fillText(stk[1], 0, 4); let s2 = 22; g.font = `700 22px ${F.tag}`; while (g.measureText(stk[2]).width > 150 && s2 > 11) g.font = `700 ${--s2}px ${F.tag}`; g.fillText(stk[2], 0, 48); g.restore();
    // the clear plastic sleeve over everything: a few soft glare bands
    g.save(); g.globalCompositeOperation = 'screen'; for (const [x0, w, a] of [[-200, 160, .06], [260, 60, .05], [700, 220, .04]]) { const gg = g.createLinearGradient(x0, 0, x0 + w + 900, PH); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, `rgba(255,255,255,${a})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w + 900, PH); g.lineTo(x0 + 900, PH); g.closePath(); g.fill(); } g.restore();
    titleGlow = cnv(PW, PH); const tg = titleGlow.getContext('2d'); tg.textAlign = 'center'; tg.textBaseline = 'middle';
    if (art) { if (pg0.title) pg0.title(tg, '#e8402a'); } else { tg.font = `800 112px ${F.head}`; tg.letterSpacing = '18px'; tg.fillStyle = '#e8402a'; tg.fillText(pg0.mask || '? ? ? ? ?', PW / 2 + 9, 262); }
    if (CASE) buildCaseInside();
  }
  // the inside of the case: the tray with the disc (pg0.disc(g, R) prints the label art, centred on 0,0) and the inside of the front
  // cover with a scene-selection insert (pg0.chapters)
  function buildCaseInside() {
    const g = trayC.getContext('2d'), r = rng(41), R = 330, cx = PW / 2, cy = 1600;
    const rr = (c, x, y, w, h, rad) => { c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath(); };
    const plastic = c => { c.fillStyle = '#0c0d10'; c.fillRect(0, 0, PW, PH); const sh = c.createLinearGradient(0, 0, PW, PH); sh.addColorStop(0, 'rgba(255,255,255,.05)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = sh; c.fillRect(0, 0, PW, PH);
      for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${r() * .035})`; c.fillRect(r() * PW, r() * PH, 1.5, 1.5); }
      rr(c, 14, 14, PW - 28, PH - 28, 34); c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 3; c.stroke(); rr(c, 52, 52, PW - 104, PH - 104, 18); c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.stroke(); };
    plastic(g);
    // the disc well with its two finger notches, then the disc
    g.fillStyle = '#07080a'; g.beginPath(); g.arc(cx, cy, R + 18, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 3; g.stroke();
    for (const sd of [-1, 1]) { g.fillStyle = '#050607'; g.beginPath(); g.arc(cx + sd * (R + 18), cy, 46, 0, 6.283); g.fill(); }
    g.save(); g.translate(cx, cy); const sil = g.createRadialGradient(0, 0, R * .2, 0, 0, R); sil.addColorStop(0, '#d9dde2'); sil.addColorStop(1, '#a3a9b1'); g.fillStyle = sil; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R - 6, 0, 6.283); g.arc(0, 0, R * .23, 0, 6.283, true); g.clip(); g.textAlign = 'center'; g.textBaseline = 'middle';
    if (pg0.disc) pg0.disc(g, R, WC); else { g.fillStyle = '#101317'; g.fillRect(-R, -R, R * 2, R * 2); g.fillStyle = '#e9ecf0'; g.font = `800 64px ${F.head}`; g.fillText(pg0.mask || '? ? ? ? ?', 0, -R * .5); }
    g.fillStyle = '#c7ccd3'; g.font = `700 20px ${F.tag}`; g.letterSpacing = '4px'; g.fillText('DISC 1 · WIDESCREEN', 0, R * .62); g.letterSpacing = '0px'; g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; const sn = g.createConicGradient(.6, 0, 0); [[0, 'rgba(255,255,255,0)'], [.1, 'rgba(180,220,255,.16)'], [.2, 'rgba(255,255,255,0)'], [.55, 'rgba(0,0,0,0)'], [.62, 'rgba(255,210,240,.12)'], [.7, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']].forEach(([k, col]) => sn.addColorStop(k, col));
    g.fillStyle = sn; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill(); g.restore();
    g.fillStyle = 'rgba(190,200,210,.35)'; g.beginPath(); g.arc(0, 0, R * .23, 0, 6.283); g.fill(); g.fillStyle = '#0c0d10'; g.beginPath(); g.arc(0, 0, R * .075, 0, 6.283); g.fill();   // clear ring, the hole
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.fillStyle = '#2a2c31'; g.beginPath(); g.arc(Math.cos(a) * R * .06, Math.sin(a) * R * .06, 7, 0, 6.283); g.fill(); }   // the hub's teeth
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.font = `700 22px ${F.tag}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '6px'; g.fillText('PLEASE RETURN TO MIDNIGHT VIDEO', PW / 2, PH - 100); g.letterSpacing = '0px';
    trayTex.needsUpdate = true;
    // the inside of the front cover: two clips holding a scene-selection insert
    const h = insideC.getContext('2d'); plastic(h); h.textAlign = 'center'; h.textBaseline = 'middle';
    rr(h, 130, 300, PW - 260, 1360, 10); h.fillStyle = '#151a20'; h.fill(); h.strokeStyle = 'rgba(255,255,255,.12)'; h.lineWidth = 2; h.stroke();
    h.font = `800 50px ${F.head}`; h.fillStyle = '#e7e9ee'; h.letterSpacing = '6px'; h.fillText('SCENE SELECTION', PW / 2, 420); h.letterSpacing = '0px'; h.fillStyle = '#d23a2a'; h.fillRect(PW / 2 - 160, 466, 320, 4);
    const ch = pg0.chapters || ['???', '???', '???', '???', '???', '???', '???', '???']; h.textAlign = 'left'; ch.forEach((c, i) => { const y = 560 + i * (1000 / Math.max(8, ch.length));
      h.font = `500 44px ${F.head}`; h.fillStyle = '#9aa1ab'; h.fillText(String(i + 1).padStart(2, '0'), 200, y); h.fillStyle = '#e7e9ee'; h.fillText(c.toUpperCase(), 290, y); });
    h.textAlign = 'center'; h.font = `700 18px ${F.tag}`; h.fillStyle = '#9aa1ab'; h.letterSpacing = '4px'; h.fillText('MIDNIGHT PICTURES', PW / 2, 1600); h.letterSpacing = '0px';
    for (const y of [300, 1660]) { rr(h, PW / 2 - 70, y - 16, 140, 32, 8); h.fillStyle = '#1d1f24'; h.fill(); h.strokeStyle = 'rgba(255,255,255,.12)'; h.lineWidth = 2; h.stroke(); }
    insideTex.needsUpdate = true;
  }
  // a generic cover (no pg0.art) shows the sky card's printed picture in its window; with the case, the cover is a separate lid, so print it there
  function coverWindow() { const g = base.getContext('2d'); g.save(); g.beginPath(); g.rect(97, 337, PW - 194, 966); g.clip(); g.drawImage(skyBase, 100, 340, 952, 760); g.drawImage(skyPrint, 100, 340, 952, 760); g.restore(); lastGlow = -1; }
  function buildPage() {
    if (F.name === 'newspaper') return buildNewspaper();
    if (F.name === 'cover') return buildCover();
    base = paper(PW, PH, pg0.seed || 11, .5); const g = base.getContext('2d'), r = rng(12);
    inkLine(g, [[130, 80], [PW - 130, 80]], 5, INK, 1); inkLine(g, [[130, 94], [PW - 130, 94]], 1.8, INK, 2);
    g.textAlign = 'center'; g.textBaseline = 'middle'; while (titleFont > 70) { g.font = `bold ${titleFont}px ${LUM}`; if (g.measureText(pg0.title || '').width < 960) break; titleFont -= 4; }
    g.fillStyle = INK; g.fillText(pg0.title || '', PW / 2, 188);
    g.font = `42px ${LUM}`; g.fillStyle = RED; g.fillText(pg0.subtitle || '', PW / 2, 280);
    const sw = g.measureText(pg0.subtitle || '').width; for (const s of [-1, 1]) { const x = PW / 2 + s * (sw / 2 + 46), y = 280; block(g, [[x, y - 12], [x + 12, y], [x, y + 12], [x - 12, y]], RED, 2.5, 5 + s); }
    inkPoly(g, [[90, 330], [PW - 90, 330], [PW - 90, 1310], [90, 1310]], 7, INK, 3); inkPoly(g, [[100, 340], [PW - 100, 340], [PW - 100, 1300], [100, 1300]], 2.5, INK, 4);
    for (let k = 0; k < 6; k++) { const y0 = 1110 + k * 32; wash(g, [[100, y0], [PW - 100, y0 + 6], [PW - 100, y0 + 30], [100, y0 + 26]], k % 2 ? GREEN : '#cdb27a', 20 + k, .55, 3); }
    block(g, [[116, 1346], [236, 1346], [236, 1466], [116, 1466]], '#e6c879', 3.5, 40); for (let i = 0; i < 10; i++) inkLine(g, NB.circlePts(140 + r() * 72, 1370 + r() * 72, 7 + r() * 8, 10), 2, 'rgba(42,31,24,.55)', 41 + i);
    g.font = `bold 108px ${LUM}`; g.fillStyle = INK; g.fillText(pg0.initial || 'A', 176, 1412);
    for (let y = 1372; y < 1890; y += 38) for (const [x0, x1] of [[y < 1480 ? 252 : 116, 556], [596, 1036]]) { let x = x0; while (x < x1 - 20) { const wl = 26 + r() * 80; g.globalAlpha = .7; for (let k = 0; k < wl && x + k < x1; k += 7) { const hgt = r() < .16 ? 22 : 12; g.fillRect(x + k, y - hgt, 3, hgt); if (r() < .45) g.fillRect(x + k, y - 12, 6, 2.5); } x += wl + 13; } }
    g.globalAlpha = 1; g.font = `32px ${LUM}`; g.fillText(pg0.colophon || '', PW / 2, 1938);
    titleGlow = cnv(PW, 340); const tg = titleGlow.getContext('2d'); tg.textAlign = 'center'; tg.textBaseline = 'middle'; tg.font = `bold ${titleFont}px ${LUM}`; tg.fillStyle = RED; tg.fillText(pg0.title || '', PW / 2, 188);
  }
  function drawPage(t) { const glow = P(t, S.glowAt - .05, .35) * (1 - P(t, S.END - .9, .5)); if (Math.abs(glow - lastGlow) < .002) return; lastGlow = glow;
    pageG.drawImage(base, 0, 0); if (glow > 0) { pageG.globalAlpha = glow; pageG.drawImage(titleGlow, 0, 0); pageG.globalAlpha = 1; } pageTex.needsUpdate = true; }

  // ---- the sky: a tall card standing up out of the picture, plus a flap that unfolds above it ----
  const SKW = 7.44, SKH = 5.94, FLH = 7.6, SCW = 1280, SCH = 1022, sk = ep.sky || {};
  function skyArt(w, h, seed, stops, flap) {
    const c = paper(w, h, seed, 0), g = c.getContext('2d'), r = rng(seed + 1), gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([s, col]) => gr.addColorStop(s, col));
    g.globalAlpha = .85; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    for (let y = 5; y < h * (flap ? 1 : .8);) { const gap = flap ? 7 + y / h * 5 : 9 + (y / h) * 22; inkLine(g, [[0, y + (r() - .5) * 2], [w * .33, y + (r() - .5) * 2.5], [w * .66, y + (r() - .5) * 2.5], [w, y + (r() - .5) * 2]], 1.5, 'rgba(42,31,24,.28)', seed + y); y += gap; }
    if (!flap) for (const [cx, cy, s] of sk.clouds || [[230, 610, 1], [700, 660, 1.25], [1090, 600, .9]]) drawCloud(g, cx, cy, s, seed + cx, sk.cloudFill);
    if (sk.art) sk.art(g, w, h, flap);
    inkPoly(g, flap ? [[6, h], [6, 6], [w - 6, 6], [w - 6, h]] : [[6, h], [6, 0], [w - 6, 0], [w - 6, h]], 6, INK, seed + 2, false);
    return c;
  }
  const skyFace = cnv(SCW, SCH), skyG = skyFace.getContext('2d'), skyTex = texOf(skyFace); let skyBase, skyPrint, lastPK = -1;
  const skyPivot = new THREE.Group(), flapPivot = new THREE.Group(), skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.DoubleSide }), flapMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  { const [x, y] = toW(576, 1100), m = new THREE.Mesh(new THREE.PlaneGeometry(SKW, SKH), skyMat); m.position.y = SKH / 2; skyPivot.add(m); flapPivot.position.set(0, SKH - .002, 0); skyPivot.add(flapPivot);
    S.flapMesh = new THREE.Mesh(new THREE.PlaneGeometry(SKW, FLH), flapMat); S.flapMesh.position.y = FLH / 2; flapPivot.add(S.flapMesh); skyPivot.position.set(x, y, .008); scene.add(skyPivot); S.TINT.push(skyMat, flapMat); }
  function buildSky() {
    const stops = sk.stops || [[0, '#9fb3cf'], [.45, '#c1cddd'], [.75, '#ecd2b0'], [1, '#f2d898']];
    skyBase = skyArt(SCW, SCH, 300, stops, false); flapMat.map = texOf(skyArt(SCW, Math.round(SCW * FLH / SKW), 310, sk.flapStops || [[0, '#7f95b8'], [1, stops[0][1]]], true)); flapMat.needsUpdate = true;
    skyPrint = cnv(SCW, SCH); if (sk.print) sk.print(skyPrint.getContext('2d'), SCW, SCH);
    if (sk.ceiling) buildCeiling();
  }
  // sk.live(g, t, S) animates the printed picture while the card lies flat (the hook!) — keep it periodic in t/S.END so the loop matches
  function drawSky(pk, t) { const live = sk.live && pk > .002; if (!live && Math.abs(pk - lastPK) < .002) return; lastPK = pk; skyG.drawImage(skyBase, 0, 0);
    if (pk > 0) { skyG.globalAlpha = pk; skyG.drawImage(skyPrint, 0, 0); if (live) { skyG.save(); sk.live(skyG, t, S); skyG.restore(); } skyG.globalAlpha = 1; } skyTex.needsUpdate = true; }
  // sk.ceiling: a night-sky ceiling over the diorama, so shots can look straight up (e.g. something passing overhead) without seeing the desk
  let ceiling = null;
  function buildCeiling() { const c = skyArt(1024, 1024, 330, [[0, (sk.flapStops || [[0, '#141b33']])[0][1]], [1, (sk.flapStops || [[0, '#141b33']])[0][1]]], true), g = c.getContext('2d'), r = rng(331);
    for (let i = 0; i < 220; i++) { const x = r() * 1024, y = r() * 1024, big = r() < .15; g.fillStyle = 'rgba(255,246,214,.95)'; g.beginPath(); g.arc(x, y, big ? 3.5 : 1.2 + r() * 1.6, 0, 6.283); g.fill(); if (big) { g.save(); g.translate(x, y); drawStar(g, 12 + r() * 6, 340 + i, '#fff3cc'); g.restore(); } }
    const mat = new THREE.MeshBasicMaterial({ map: texOf(c), side: THREE.DoubleSide }); S.TINT.push(mat); ceiling = new THREE.Mesh(new THREE.PlaneGeometry(26, 24), mat); ceiling.position.set(0, -.6 - 12, SKH + FLH - .04); ceiling.visible = false; scene.add(ceiling); }
  // page-picture coordinates for the printed layer: canvas (0..SCW, 0..SCH) maps onto the standing sky card
  Object.assign(S, { SKW, SKH, SCW, SCH });

  // ---- HUD ----
  const word = (s, size, fill, stroke = INK) => { const fnt = `${F.bigWeight} ${size}px ${F.big}`, m = cnv(10, 10).getContext('2d'); m.font = fnt; const cw = Math.max(1000, m.measureText(s).width + size), c = cnv(cw, size * 1.6), g = c.getContext('2d'); g.font = fnt; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = size * .12; g.strokeStyle = '#f1e4c4'; g.strokeText(s, cw / 2, size * .8); g.lineWidth = size * .05; g.strokeStyle = stroke; g.strokeText(s, cw / 2, size * .8); g.fillStyle = fill; g.fillText(s, cw / 2, size * .8); return c; };
  const big = (c, x, y, p, a = 1, rot = 0, sc = 1) => { if (p <= 0 || a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y); hg.rotate(rot); const s = (1 + .2 * (1 - eo(clamp(p * 1.5)))) * sc * Math.min(1, 1000 / c.width * 1.04); hg.scale(s, s); hg.beginPath(); hg.rect(-c.width / 2, -400, c.width * p, 800); hg.clip(); hg.drawImage(c, -c.width / 2, -c.height / 2); hg.restore(); hg.globalAlpha = 1; };
  S.BIG = {};
  // show a big woodcut word from ep.words between two times
  S.show = (k, t0, t1, y = 420, rot = -.03, x = W / 2, sc = 1) => { const t = S.t; if (t < t0 || t > t1 + .35) return; big(S.BIG[k], x, y, eo(P(t, t0, .4)), 1 - P(t, t1, .35), rot, sc); };
  S.tag = (s, x, y, a, size = 40) => { if (a <= 0) return; const news = F.name === 'newspaper'; if (news) { s = s.toUpperCase(); size *= .8; } hg.save(); hg.globalAlpha = clamp(a); hg.font = `${news ? 700 : 'bold'} ${size}px ${F.tag}`; const w = hg.measureText(s).width + 56, h = size * 1.55; hg.translate(x, y); hg.rotate(news ? 0 : -.02);
    hg.fillStyle = news ? '#f7f5ef' : '#efe3c4'; hg.fillRect(-w / 2, -h / 2, w, h); hg.strokeStyle = INK; hg.lineWidth = news ? 3 : 3.5; hg.strokeRect(-w / 2, -h / 2, w, h); if (!news) { hg.strokeStyle = RED; hg.lineWidth = 1.5; hg.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14); }
    hg.fillStyle = INK; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(s, 0, 2); hg.restore(); };
  // a red rubber stamp that thumps down (p: 0..1)
  S.stamp = (s, x, y, p, a = 1, rot = -.12, size = 120, sub = '') => { if (p <= 0 || a <= 0) return; hg.save(); hg.globalAlpha = clamp(a) * .92; hg.translate(x, y); hg.rotate(rot); const k = 1 + 1.4 * (1 - eo(clamp(p))); hg.scale(k, k);
    hg.font = `bold ${size}px ${F.stamp}`; const w = hg.measureText(s).width + 70, h = size * 1.35 + (sub ? 50 : 0); hg.strokeStyle = BLOOD; hg.lineWidth = 9; hg.strokeRect(-w / 2, -h / 2, w, h); hg.lineWidth = 3; hg.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
    hg.fillStyle = BLOOD; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText(s, 0, sub ? -18 : 4); if (sub) { hg.font = `bold 38px ${F.stamp}`; hg.fillText(sub, 0, size * .55); }
    const r = rng(77); hg.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { hg.fillRect((r() - .5) * w, (r() - .5) * h, 3 + r() * 6, 2 + r() * 3); } hg.restore(); };
  S.hourglass = (x, y, k, a) => { if (a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y); const Hh = 240, Wd = 130, hw = yy => 9 + (Wd / 2 - 9) * Math.abs(yy) / (Hh / 2);
    for (const s of [-1, 1]) block(hg, [[-Wd * .78, s * Hh / 2], [Wd * .78, s * Hh / 2], [Wd * .78, s * (Hh / 2 + 24)], [-Wd * .78, s * (Hh / 2 + 24)]], '#8a5a34', 3.5, 901 + s);
    for (const s of [-1, 1]) inkLine(hg, [[s * Wd * .68, -Hh / 2], [s * Wd * .68, Hh / 2]], 8, '#5a3d2a', 903 + s);
    const glass = [[-Wd / 2, -Hh / 2], [Wd / 2, -Hh / 2], [9, 0], [Wd / 2, Hh / 2], [-Wd / 2, Hh / 2], [-9, 0]];
    hg.fillStyle = 'rgba(232,240,244,.8)'; hg.beginPath(); glass.forEach((p, i) => i ? hg.lineTo(...p) : hg.moveTo(...p)); hg.closePath(); hg.fill();
    hg.save(); hg.clip(); hg.fillStyle = '#d8b25c'; const ys = -(Hh / 2 - 8) * (1 - k); if (k < 1) { hg.beginPath(); hg.moveTo(-hw(ys), ys); hg.lineTo(hw(ys), ys); hg.lineTo(9, 0); hg.lineTo(-9, 0); hg.closePath(); hg.fill(); }
    const mh = (Hh / 2 - 10) * k * .9; hg.beginPath(); hg.moveTo(-Wd / 2, Hh / 2); hg.lineTo(Wd / 2, Hh / 2); hg.lineTo(0, Hh / 2 - mh - 6); hg.closePath(); hg.fill(); hg.restore();
    inkPoly(hg, glass, 4, INK, 905); hg.restore(); };
  // a woodcut clock face; hours as a float (10.0 = ten o'clock)
  S.clock = (x, y, hours, a, R = 150) => { if (a <= 0) return; hg.save(); hg.globalAlpha = clamp(a); hg.translate(x, y);
    shape(hg, circ(0, 0, R, 40), '#efe3c4', 6, 930); inkLine(hg, circ(0, 0, R * .9, 40), 2, RED, 931);
    hg.font = `bold ${R * .2}px ${F.head}`; hg.fillStyle = INK; hg.textAlign = 'center'; hg.textBaseline = 'middle'; (F.roman ? ['XII', 'III', 'VI', 'IX'] : ['12', '3', '6', '9']).forEach((n, i) => { const an = i * Math.PI / 2 - Math.PI / 2; hg.fillText(n, Math.cos(an) * R * .72, Math.sin(an) * R * .72); });
    for (let k = 0; k < 12; k++) { const an = k / 12 * 6.283; inkLine(hg, [[Math.cos(an) * R * .84, Math.sin(an) * R * .84], [Math.cos(an) * R * .9, Math.sin(an) * R * .9]], 3, INK, 940 + k); }
    const ha = (hours % 12) / 12 * 6.283 - Math.PI / 2, ma = (hours % 1) * 6.283 - Math.PI / 2;
    inkLine(hg, [[0, 0], [Math.cos(ha) * R * .5, Math.sin(ha) * R * .5]], 10, INK, 950); inkLine(hg, [[0, 0], [Math.cos(ma) * R * .78, Math.sin(ma) * R * .78]], 6, INK, 951);
    hg.fillStyle = RED; hg.beginPath(); hg.arc(0, 0, 10, 0, 6.283); hg.fill(); hg.restore(); };
  let CHUNKS = null; const CAPY = ep.capY || 1440;
  function buildChunks() { CHUNKS = []; for (const [id, l] of Object.entries(NB.TL.lines)) { let cur = []; const ws = l.words.filter(w => !/^\[/.test(w.w)); ws.forEach((w, i) => { cur.push({ ...w, s: l.start + w.s, e: l.start + w.e }); if (/[.,!?…]$/.test(w.w) || cur.length >= 3 || i === ws.length - 1) { cur.id = id; CHUNKS.push(cur); cur = []; } }); }
    CHUNKS.forEach((c, i) => { c.t0 = c[0].s - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].s - .05, c.at(-1).e + .55) : c.at(-1).e + .5; }); }
  function captions(t) {
    if (!CHUNKS) buildChunks(); const c = CHUNKS.find(c => t >= c.t0 && t < c.t1); if (!c) return;
    const y = CAPY, a = Math.min(1, (t - c.t0) / .08, (c.t1 - t) / .1), style = ep.captions || F.captions, lineCol = (ep.capColor || {})[c.id]; hg.globalAlpha = clamp(a);
    if (style !== 'ribbon') {
      hg.font = `${F.capWeight} ${style === 'vhs' ? 66 : 58}px ${F.cap}`; hg.textBaseline = 'middle'; hg.textAlign = 'left'; hg.lineJoin = 'round';
      const ws = c.map(w => w.w), wd = ws.map(w => hg.measureText(w).width), gap = 18, tw = wd.reduce((x, y) => x + y, 0) + gap * (ws.length - 1);
      if (style === 'news') { hg.fillStyle = '#f7f5ef'; hg.fillRect(W / 2 - tw / 2 - 30, y - 46, tw + 60, 92); hg.strokeStyle = INK; hg.lineWidth = 4; hg.strokeRect(W / 2 - tw / 2 - 30, y - 46, tw + 60, 92); }
      let x = W / 2 - tw / 2; ws.forEach((w, i) => { const now = t >= c[i].s && t < (c[i + 1] ? c[i + 1].s : c.t1);
        if (style === 'vhs') { hg.lineWidth = 13; hg.strokeStyle = '#0b0b0d'; hg.strokeText(w, x, y); hg.fillStyle = now ? '#ffd23a' : (lineCol || '#ffffff'); hg.fillText(w, x, y); }
        else { hg.fillStyle = now ? RED : (lineCol || INK); hg.fillText(w, x, y + 2); }
        x += wd[i] + gap; });
      hg.globalAlpha = 1; return; }
    hg.font = `bold 70px ${F.cap}`; hg.textBaseline = 'middle'; const ws = c.map(w => w.w), wd = ws.map(w => hg.measureText(w).width), gap = 22, tw = wd.reduce((x, y) => x + y, 0) + gap * (ws.length - 1);
    const bw = Math.max(520, tw + 120), x0 = W / 2 - bw / 2;
    hg.fillStyle = '#b8955e'; for (const s of [-1, 1]) { const ex = s < 0 ? x0 + 10 : x0 + bw - 10; hg.beginPath(); hg.moveTo(ex, y - 40); hg.lineTo(ex + s * 70, y - 26); hg.lineTo(ex + s * 46, y + 10); hg.lineTo(ex + s * 70, y + 46); hg.lineTo(ex, y + 56); hg.closePath(); hg.fill(); }
    const rb = hg.createLinearGradient(0, y - 56, 0, y + 56); rb.addColorStop(0, '#f1e4c4'); rb.addColorStop(1, '#dcc28e'); hg.fillStyle = rb; hg.beginPath(); hg.moveTo(x0, y - 50); hg.quadraticCurveTo(W / 2, y - 66, x0 + bw, y - 50); hg.lineTo(x0 + bw, y + 50); hg.quadraticCurveTo(W / 2, y + 34, x0, y + 50); hg.closePath(); hg.fill();
    hg.strokeStyle = INK; hg.lineWidth = 3; hg.stroke();
    let x = W / 2 - tw / 2; ws.forEach((w, i) => { const now = t >= c[i].s && t < (c[i + 1] ? c[i + 1].s : c.t1); hg.fillStyle = now ? RED : ((ep.capColor || {})[c.id] || INK); hg.textAlign = 'left'; hg.fillText(w, x, y - 4); x += wd[i] + gap; });
    hg.globalAlpha = 1;
  }

  // ---- timeline ----
  let SHOTS = null;
  function prepare() {
    const ids = Object.keys(NB.TL.lines), last = ids[ids.length - 1];
    S.END = NB.TL.end; S.last = last; S.open = T(ep.open || ['L1', null, 2]);
    // with >= 2.2 s of tail after the last line, the ending is "tight": the final image holds through the last line, then the whole
    // book closes in one quick fold on the last word and the camera settles on the cover. (Older episodes with a short tail fold during the last line.)
    S.tight = S.END - en(last) >= 2.2; S.closeUp = S.tight ? en(last) - .05 : st(last) + .4; S.foldDur = S.tight ? .35 : .6;
    S.flapAt = ep.flapAt ? T(ep.flapAt) : S.open + 1.0; S.glowAt = S.tight ? S.closeUp + 1.15 : T(ep.glow || [last, 'look']);
    S.lidOpen = S.open - .75; S.lidShut = S.tight ? S.closeUp + 1.3 : S.END - 1.0; if (S.CASE) S.glowAt = S.lidShut + .15;   // the withheld title flashes red as the case snaps shut
    S.hits = []; ep.prepare && ep.prepare(S); SHOTS = ep.shots(S);
  }
  window.seek = function (t) {
    S.t = t; if (!SHOTS) prepare(); drawPage(t);
    // camera: overhead on the flat page → into the diorama → back to the page for the loop
    let cp = SHOTS[0][2].slice(), cl = SHOTS[0][3].slice(), roll = 0;
    for (const [t0, d, p, l, r = 0] of SHOTS) { const k = eio(P(t, t0, d)); if (k <= 0) break; cp = cp.map((v, i) => lerp(v, p[i], k)); cl = cl.map((v, i) => lerp(v, l[i], k)); roll = lerp(roll, r, k); }
    const tilt = S.tilt = eio(P(t, S.open - .4, 1.6)) * (1 - eio(S.tight ? P(t, S.closeUp, 1.4) : P(t, S.closeUp - .1, 2.4)));
    const push = eio(clamp(t / Math.max(.5, S.open - .4))) * (1 - eio(S.tight ? P(t, S.closeUp + .25, 1.25) : P(t, S.closeUp + .4, 2.2))), pz = 29.86 - (ep.push ?? 4.2) * push, py0 = (ep.pushY ?? 1.3) * push;
    let shake = ep.shake ? ep.shake(t, S) : 0; for (const h of S.hits) { const d = t - h; if (d > 0 && d < .45) shake += Math.exp(-d * 11) * .22; }
    if (lid) { const d = t - (S.lidShut + .45); if (d > 0 && d < .35) shake += Math.exp(-d * 14) * .06; }   // a little jolt as the case snaps shut
    camera.position.set(lerp(0, cp[0] + Math.sin(t * .5) * .25, tilt) + Math.sin(t * 47) * shake, lerp(py0, cp[1], tilt) + Math.cos(t * 39) * shake * .5, lerp(pz, cp[2], tilt) + Math.cos(t * 43) * shake);
    // the diorama's "up" is +z: blend the camera's up vector from page-up to sky-up as it tilts (a fixed (0,1,0) renders low shots upside down)
    camera.up.set(0, 1 - tilt, tilt).normalize(); camera.lookAt(lerp(0, cl[0], tilt), lerp(py0, cl[1], tilt), lerp(0, cl[2], tilt)); camera.rotateZ(roll * tilt); camera.updateMatrixWorld(true);
    S.fwd = S.V(0, 0, -1).applyQuaternion(camera.quaternion); S.upv = S.V(0, 1, 0).applyQuaternion(camera.quaternion); S.right = S.V(1, 0, 0).applyQuaternion(camera.quaternion);
    // light: 0 = daylight print colours, 1 = deep night (scaled by tilt so the flat page is always untinted)
    const nk = clamp(ep.night ? ep.night(t, S) : 0) * tilt, tc = new THREE.Color(1 - .5 * nk, 1 - .42 * nk, 1 - .2 * nk), sc2 = new THREE.Color(1 - .25 * nk, 1 - .2 * nk, 1 - .08 * nk);
    if (ep.light) { const [lr, lg, lb] = ep.light(t, S); tc.r *= 1 + (lr - 1) * tilt; tc.g *= 1 + (lg - 1) * tilt; tc.b *= 1 + (lb - 1) * tilt; }
    S.TINT.forEach(m => m.color.copy(tc)); S.TINT_SKY.forEach(m => m.color.copy(sc2));
    // the sky card stands up, its printed picture fades away; the flap unfolds above it; all of it folds back for the loop
    const tSkyUp = S.open - .3, tSkyDown = S.closeUp + (S.tight ? .95 : 1.25);   // fold the sky only once the camera is heading back down to the page
    drawSky(clamp(1 - P(t, tSkyUp - .1, .45) + (S.tight ? P(t, tSkyDown + .1, .45) : P(t, tSkyDown + .2, .7))), t);
    skyPivot.rotation.x = Math.PI / 2 * back(P(t, tSkyUp, .7)) * (1 - eio(P(t, tSkyDown, S.tight ? .55 : .9)));
    // fold the sky only once the camera is up and looking down again
    const fk = back(P(t, S.flapAt, .8)) * (1 - eio(S.tight ? P(t, S.closeUp + .75, .45) : P(t, S.closeUp + 1.0, .7))); flapPivot.rotation.x = -Math.PI * (1 - fk); S.flapMesh.visible = fk > .02;
    // the case lid: swings open on its spine (eased), and snaps shut at the end (accelerating into the click)
    if (lid) { const o = eio(P(t, S.lidOpen, .6)), c = P(t, S.lidShut, .45); lid.rotation.y = -Math.PI * .985 * o * (1 - c * c); }
    if (ceiling) ceiling.visible = tilt > .6 && camera.position.z < SKH + FLH - 1.5 && fk > .9;
    if (S.groundMesh) { const k = eio(clamp((tilt - .25) / .6)); S.groundMesh.material.opacity = k; S.groundMesh.visible = k > .002; }
    const F = ep.fog || { color: BG, near: 26, far: 50 }; scene.fog.color.set(F.color); scene.fog.near = lerp(120, F.near, tilt); scene.fog.far = lerp(240, F.far, tilt);   // haze only inside the diorama
    S.tags = []; ep.update(t, S);
    for (const d of S.shadowed) { const up = d.pivot.visible ? clamp(d.pivot.rotation.x / (Math.PI / 2)) : 0; d.shadow.visible = up > .05; if (!d.shadow.visible) continue;
      d.shadow.position.set(d.pivot.position.x + (d.o.shadowDx || 0), d.pivot.position.y + .03, d.pivot.position.z + .004); d.shadow.material.opacity = (d.o.shadowA ?? .55) * up * d.mat.opacity; }
    scene.updateMatrixWorld(true); renderer.setClearColor(BG); renderer.clear(); renderer.render(scene, camera);
    hg.clearRect(0, 0, W, H); ep.hud && ep.hud(t, S); S.tags.forEach(([s, x, y, a, size]) => S.tag(s, x, y, a, size)); captions(t);
    const v = hg.createRadialGradient(W / 2, H * .46, H * .3, W / 2, H * .46, H * .8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(16,10,6,.58)'); hg.fillStyle = v; hg.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const r = rng(900 + i), x = (r() * W + Math.sin(t * .3 + i) * 40) % W, y = (r() * H - t * (8 + r() * 14) % H + H) % H; hg.fillStyle = `rgba(255,240,205,${.06 + r() * .12})`; hg.beginPath(); hg.arc(x, y, 1.5 + r() * 2.5, 0, 6.283); hg.fill(); }
    const gr = rng(Math.floor(t * 30) + 3); hg.fillStyle = 'rgba(40,20,5,0.05)'; for (let i = 0; i < 1600; i++) hg.fillRect(gr() * W, gr() * H, 2, 2);
    hudTex.needsUpdate = true; renderer.clearDepth(); renderer.render(hudScene, hudCam);
    return true;
  };
  window.setTL = tl => { NB.TL = tl; CHUNKS = null; SHOTS = null; lastGlow = -1; lastPK = -1; return true; };

  // ---- boot: fonts + the episode's real artifacts, then build everything ----
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { MISSING.add('asset:' + src); res(null); }; i.src = new URL(src, location.href).href; });
  const assets = Object.entries(ep.assets || {});
  Promise.all([Promise.all(F.load.map(f => document.fonts.load(f))), ...assets.map(([, src]) => loadImg(src))]).then(([, ...imgs]) => {
    assets.forEach(([k], i) => S.img[k] = imgs[i]);
    buildPage(); buildSky(); if (CASE && !pg0.art) coverWindow();
    if (ep.ground) { const G = ep.ground, c = paper(1024, 1024, 350, 0); G.art(c.getContext('2d'), 1024, 1024); const mat = new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, opacity: 0 }); S.TINT.push(mat);
      S.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(G.width || 14, G.y0 - G.y1), mat); S.groundMesh.position.set(0, (G.y0 + G.y1) / 2, .005); S.groundMesh.visible = false; scene.add(S.groundMesh); }
    for (const [k, [s, size, col]] of Object.entries(ep.words || {})) S.BIG[k] = word(s, size, col || INK);
    ep.build(S); window.ready = true;
  });
};
})();
