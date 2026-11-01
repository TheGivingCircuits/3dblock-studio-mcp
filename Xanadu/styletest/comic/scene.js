// STYLE TEST — Pulp horror comic: a yellowed 1950s-style horror comic page (our own "Midnight Terror Tales"), bold inks, Ben-Day
// halftone dots, slightly off-register colour, yellow caption boxes, big SFX lettering. The camera rides from panel to panel.
(function () {
const { P, lerp, eio, eo, clamp, rng, at, st, en } = NB;
const W = 1080, H = 1920, PW = 1200, PH = 2133;
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; (document.body || document.documentElement).appendChild(cv); const g = cv.getContext('2d');
const INK = '#141014', PAPER = '#f1e4c2', CAP = '"Comic Sans MS", "Chalkboard SE", sans-serif', SFX = 'Impact, "Arial Black", sans-serif';
const PANELS = { head: [40, 30, 1120, 220], p1: [40, 270, 1120, 620], p2: [40, 910, 545, 560], p3: [615, 910, 545, 560], p4: [40, 1490, 1120, 300], p5: [40, 1810, 1120, 290] };

// ---------- ink tools ----------
const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
const ell = (x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.283); };
const rrect = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
// colour printed a hair off the ink line (cheap comic printing), then the ink on top
function inked(shape, fill, lw = 6) { if (fill) { g.save(); g.translate(2.5, 1.5); shape(); g.fillStyle = fill; g.fill(); g.restore(); } shape(); g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }
// Ben-Day dots: a rotated grid of dots whose size follows rf(x, y) in 0..1 (call inside a clip)
function dots(x0, y0, w, h, col, sp, ang, rf) { g.fillStyle = col; const ca = Math.cos(ang), sa = Math.sin(ang), cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + sp;
  for (let i = -R; i <= R; i += sp) for (let j = -R; j <= R; j += sp) { const x = cx + i * ca - j * sa, y = cy + i * sa + j * ca; if (x < x0 - sp || x > x0 + w + sp || y < y0 - sp || y > y0 + h + sp) continue;
    const r = clamp(rf(x, y)) * sp * .56; if (r < .5) continue; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); } }
function panel(name, draw) { const [x, y, w, h] = PANELS[name]; g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); draw(w, h); g.restore(); g.lineWidth = 7; g.strokeStyle = INK; g.strokeRect(x, y, w, h); }
function captionBox(x, y, lines, size = 40, maxW = 900) { g.font = `bold ${size}px ${CAP}`; const w = Math.min(maxW, Math.max(...lines.map(l => g.measureText(l).width)) + 40), h = lines.length * size * 1.18 + 26;
  g.fillStyle = '#ffe14d'; g.fillRect(x + 3, y + 2, w, h); g.lineWidth = 4; g.strokeStyle = INK; g.strokeRect(x, y, w, h); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'top'; lines.forEach((l, i) => g.fillText(l, x + 20, y + 15 + i * size * 1.18)); }
function sfx(text, x, y, size, rot, fill, edge) { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${size}px ${SFX}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.fillStyle = INK; g.fillText(text, size * .07, size * .07); g.lineWidth = size * .16; g.strokeStyle = INK; g.strokeText(text, 0, 0); g.lineWidth = size * .08; g.strokeStyle = edge; g.strokeText(text, 0, 0); g.fillStyle = fill; g.fillText(text, 0, 0); g.restore(); }
// a typed-on caption: the narration line's words appear as they're spoken (and stay printed afterwards)
const said = (id, t) => { const l = NB.TL.lines[id]; if (!l || t < l.start - .05) return null; return l.words.filter(w => t >= l.start + w.s - .05).map(w => w.w.toUpperCase()).join(' '); };
const wrap = (s, n) => { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; };

// ---------- the page ----------
function header(t) { panel('head', (w, h) => {
  g.fillStyle = '#2a1238'; g.fillRect(0, 0, w, h); dots(0, 0, w, h, '#4b2463', 14, .5, (x, y) => 1 - y / h * .9);
  g.save(); g.translate(580, 92); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const word = 'MIDNIGHT TERROR TALES'; g.letterSpacing = '4px'; let fs = 118; g.font = `${fs}px ${SFX}`; while (g.measureText(word).width > 860) g.font = `${--fs}px ${SFX}`; g.lineWidth = 24; g.strokeStyle = INK; g.strokeText(word, 0, 0); g.lineWidth = 12; g.strokeStyle = '#6a2a8c'; g.strokeText(word, 0, 0); g.fillStyle = '#a4e23a'; g.fillText(word, 0, 0);
  const r = rng(9); for (let i = 0; i < 16; i++) { const x = -420 + r() * 840, len = 14 + r() * 34; g.fillStyle = '#a4e23a'; g.beginPath(); g.roundRect(x, 46, 11, len, 6); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); } g.restore(); g.letterSpacing = '0px';   // dripping letters
  g.fillStyle = '#ffe14d'; g.save(); g.translate(560, 178); g.rotate(-.02); g.fillRect(-250, -26, 500, 52); g.lineWidth = 4; g.strokeStyle = INK; g.strokeRect(-250, -26, 500, 52); g.font = `46px ${SFX}`; g.fillStyle = '#c4161c'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('IN: "THE CURSED TAPE!"', 0, 2); g.restore();
  ell(80, 110, 56, 56); g.fillStyle = '#ffe14d'; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; g.font = `bold 24px ${CAP}`; g.textAlign = 'center'; g.fillText('No.', 80, 90); g.font = `42px ${SFX}`; g.fillText('1', 80, 128);
  g.font = `bold 30px ${CAP}`; g.fillStyle = '#ffe14d'; g.fillText('10¢', 1060, 120); }); }

function room(t) { panel('p1', (w, h) => {
  g.fillStyle = '#3a2152'; g.fillRect(0, 0, w, h); dots(0, 0, w, h, '#1d0f2b', 13, .4, (x, y) => 1.1 - y / h * 1.1 + (x < 300 ? .2 : 0));
  // window, rain
  inked(() => { g.beginPath(); g.rect(70, 60, 230, 300); }, '#16325c', 6); g.save(); g.beginPath(); g.rect(70, 60, 230, 300); g.clip(); const r = rng(3); g.strokeStyle = '#8fb6e8'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = 70 + r() * 260, y = 60 + ((r() * 300 + t * 500) % 320); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 34); g.stroke(); } g.restore();
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(185, 60); g.lineTo(185, 360); g.moveTo(70, 210); g.lineTo(300, 210); g.stroke();
  inked(() => path([[40, 40], [110, 40], [100, 400], [52, 400]]), '#8c1d2e', 5); inked(() => path([[330, 40], [260, 40], [270, 400], [318, 400]]), '#8c1d2e', 5);
  // floor
  inked(() => path([[0, 480], [w, 480], [w, h], [0, h]]), '#4a2a1e', 6); g.save(); g.beginPath(); g.rect(0, 480, w, h - 480); g.clip(); dots(0, 480, w, h - 480, '#2a140c', 11, .8, (x, y) => (y - 480) / 140); g.restore();
  // the TV, its light pouring over the room
  g.save(); g.globalAlpha = .28; g.fillStyle = '#c6ff6e'; path([[770, 250], [990, 250], [w, h], [120, h]]); g.fill(); g.restore();
  g.save(); path([[770, 250], [990, 250], [w, h], [120, h]]); g.clip(); dots(120, 250, w, h, '#c6ff6e', 12, -.3, (x, y) => .45 - Math.abs(x - 760) / 900); g.restore();
  inked(() => rrect(690, 470, 380, 120, 8), '#5a3424', 6); for (let k = 0; k < 4; k++) inked(() => g.rect(720 + k * 80, 500, 56, 70), '#24161c', 4);
  inked(() => rrect(730, 180, 300, 290, 26), '#2f2c38', 7); dots(730, 180, 300, 290, '#15131a', 9, .7, (x, y) => (x - 900) / 140);
  inked(() => rrect(760, 210, 220, 180, 18), '#050606', 6);
  const gl = g.createRadialGradient(870, 300, 10, 870, 300, 150); gl.addColorStop(0, 'rgba(210,255,170,.65)'); gl.addColorStop(1, 'rgba(210,255,170,0)'); g.fillStyle = gl; g.fillRect(700, 160, 340, 300);
  ell(870, 300, 62, 62); g.lineWidth = 16; g.strokeStyle = '#f4fff0'; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#9be35a'; ell(870, 300, 74, 74); g.stroke(); ell(870, 300, 50, 50); g.stroke();
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(850, 180); g.lineTo(800, 110); g.moveTo(890, 180); g.lineTo(950, 104); g.stroke();
  // her: from behind, on the couch, lit green from the TV
  inked(() => path([[150, 470], [180, 420], [300, 400], [420, 420], [450, 470]]), '#2b2f45', 6);
  inked(() => { g.beginPath(); g.moveTo(232, 330); g.bezierCurveTo(222, 250, 378, 250, 368, 330); g.bezierCurveTo(390, 400, 392, 450, 380, 470); g.lineTo(220, 470); g.bezierCurveTo(208, 450, 210, 400, 232, 330); g.closePath(); }, '#f4c534', 6);
  g.save(); g.beginPath(); g.moveTo(232, 330); g.bezierCurveTo(222, 250, 378, 250, 368, 330); g.bezierCurveTo(390, 400, 392, 450, 380, 470); g.lineTo(220, 470); g.bezierCurveTo(208, 450, 210, 400, 232, 330); g.clip(); dots(200, 250, 200, 230, '#d9822b', 9, .6, (x, y) => (300 - x) / 80 + .2); g.restore();
  g.strokeStyle = INK; g.lineWidth = 2.5; for (const x of [250, 275, 300, 325, 350]) { g.beginPath(); g.moveTo(x, 290); g.quadraticCurveTo(x + (x - 300) * .2, 390, x + (x - 300) * .3, 465); g.stroke(); }
  g.strokeStyle = '#c6ff6e'; g.lineWidth = 6; g.beginPath(); g.moveTo(362, 300); g.bezierCurveTo(380, 360, 386, 420, 378, 466); g.stroke();
  inked(() => { g.beginPath(); g.moveTo(0, h); g.lineTo(0, 480); g.quadraticCurveTo(10, 440, 60, 440); g.lineTo(560, 440); g.quadraticCurveTo(610, 440, 612, 490); g.lineTo(620, h); g.closePath(); }, '#7a1f2c', 7);
  g.save(); g.beginPath(); g.rect(0, 440, 620, h - 440); g.clip(); dots(0, 440, 620, h - 440, '#3d0b14', 10, .9, (x, y) => .3 + (y - 440) / 200); g.restore();
  const cap = said('L3', t); if (cap) captionBox(28, 26, [cap.split('...')[0] + (cap.includes('...') ? '...' : '')], 44);
}); }

function tv(t) { panel('p2', (w, h) => {
  g.fillStyle = '#20142a'; g.fillRect(0, 0, w, h); inked(() => rrect(26, 40, 493, 430, 40), '#2f2c38', 8);
  inked(() => rrect(66, 80, 413, 320, 34), '#cfd6d0', 6); g.save(); rrect(66, 80, 413, 320, 34); g.clip(); const r = rng(Math.floor(t * 12));
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < .55 ? INK : '#ffffff'; g.fillRect(66 + r() * 413, 80 + r() * 320, 6 + r() * 26, 4); } g.restore();
  for (let k = 0; k < 3; k++) inked(() => { g.beginPath(); g.arc(130 + k * 50, 435, 12, 0, 6.283); }, '#141016', 3);
  sfx('KSSSHHH...', 300, 495, 74, -.08, '#ffffff', '#5a6a8a');
}); }

function phone(t) { panel('p3', (w, h) => {
  const ring = t > at('L3', 'phone') - .1, cx = 272, cy = 300;
  for (let i = 0; i < 28; i++) { const a0 = i / 28 * 6.283, a1 = (i + 1) / 28 * 6.283; g.fillStyle = i % 2 ? '#ffd23a' : '#ff8a1e'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * 900, cy + Math.sin(a0) * 900); g.lineTo(cx + Math.cos(a1) * 900, cy + Math.sin(a1) * 900); g.closePath(); g.fill(); }
  dots(0, 0, w, h, '#e4561c', 13, .3, (x, y) => Math.hypot(x - cx, y - cy) / 420);
  inked(() => path([[110, 430], [118, h + 10], [146, h + 10], [150, 440]]), '#4a2616', 5); inked(() => path([[400, 430], [394, h + 10], [422, h + 10], [430, 440]]), '#4a2616', 5);
  inked(() => ell(272, 430, 190, 40), '#6b3a24', 6);
  const sh = ring ? Math.sin(t * 70) * .09 : 0; g.save(); g.translate(272, 400); g.rotate(sh);
  inked(() => rrect(-95, -30, 190, 54, 14), '#e8dfc8', 6);
  g.save(); g.rotate(.08); inked(() => rrect(-34, -230, 68, 210, 20), '#efe6cf', 6); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = INK; g.beginPath(); g.arc(-16 + j * 16, -150 + i * 22, 5, 0, 6.283); g.fill(); }
  inked(() => g.rect(-12, -210, 24, 30), '#7a8a7a', 3); g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(22, -228); g.lineTo(30, -300); g.stroke(); g.fillStyle = ring && Math.floor(t * 8) % 2 ? '#58ff6a' : '#1d3a22'; g.fillRect(-28, -20, 14, 8); g.restore();
  g.restore();
  if (ring) { g.strokeStyle = INK; g.lineCap = 'round'; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.lineWidth = 8 - k * 2; g.beginPath(); g.arc(272, 250, 130 + k * 34, s < 0 ? Math.PI * .8 : -Math.PI * .2, s < 0 ? Math.PI * 1.2 : Math.PI * .2); g.stroke(); } }
  const cap = said('L3', t); if (cap && cap.includes('...') && cap.split('...')[1].trim()) captionBox(24, h - 92, ['...' + cap.split('...')[1].trim()], 36, 500);
}); if (t > at('L3', 'phone') - .1) { const k = eo(P(t, at('L3', 'phone') - .1, .25)); sfx('RIIING!!', 900, 1000, 120 * (.6 + .4 * k), -.14, '#ffe14d', '#d4231c'); } }

function eyes(t) { panel('p4', (w, h) => {
  g.fillStyle = '#f0c29b'; g.fillRect(0, 0, w, h); dots(0, 0, w, h, '#c47a52', 11, .5, (x, y) => Math.abs(y - 160) / 170 + (x < 120 || x > 980 ? .4 : 0));
  inked(() => path([[0, 0], [190, 0], [150, 120], [70, 300], [0, 300]]), '#f4c534', 6); inked(() => path([[w, 0], [920, 0], [960, 140], [1010, 300], [w, 300]]), '#f4c534', 6);
  g.strokeStyle = INK; g.lineWidth = 2.5; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(20 + k * 28, 0); g.quadraticCurveTo(10 + k * 20, 150, k * 14, 300); g.stroke(); }
  for (const [ex, sd] of [[380, 1], [720, 2]]) { const ey = 175, r = rng(sd);
    inked(() => { g.beginPath(); g.moveTo(ex - 125, ey); g.bezierCurveTo(ex - 70, ey - 82, ex + 70, ey - 82, ex + 125, ey); g.bezierCurveTo(ex + 70, ey + 60, ex - 70, ey + 60, ex - 125, ey); g.closePath(); }, '#ffffff', 7);
    g.strokeStyle = '#d4231c'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = r() * 6.283; g.beginPath(); g.moveTo(ex + Math.cos(a) * 110, ey + Math.sin(a) * 34); g.lineTo(ex + Math.cos(a) * 60, ey + Math.sin(a) * 20 + (r() - .5) * 10); g.stroke(); }
    inked(() => ell(ex, ey - 4, 26, 26), '#4a7ab0', 4); g.fillStyle = INK; ell(ex, ey - 4, 9, 9); g.fill(); g.fillStyle = '#fff'; ell(ex - 8, ey - 12, 5, 5); g.fill();
    g.lineWidth = 12; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 130, ey - 6); g.bezierCurveTo(ex - 70, ey - 92, ex + 70, ey - 92, ex + 130, ey - 6); g.stroke();
    g.lineWidth = 14; g.beginPath(); g.moveTo(ex - 120 * (sd === 1 ? 1 : -1), ey - 96); g.quadraticCurveTo(ex, ey - 150, ex + 110 * (sd === 1 ? 1 : -1), ey - 128); g.stroke(); }
  for (const [x, y, s] of [[200, 70, 1], [880, 210, .8]]) inked(() => { g.beginPath(); g.moveTo(x, y - 30 * s); g.quadraticCurveTo(x + 22 * s, y + 4 * s, x, y + 16 * s); g.quadraticCurveTo(x - 22 * s, y + 4 * s, x, y - 30 * s); g.closePath(); }, '#cfeeff', 3);
  inked(() => rrect(1000, 60, 160, 240, 40), '#efe6cf', 6);
  // the whisper: a dashed, wavy balloon in icy blue
  const k = P(t, st('L3b') - .05, .3); if (k > 0) { g.save(); g.globalAlpha = k; g.setLineDash([12, 9]); g.lineWidth = 4; g.strokeStyle = '#1d3f73'; g.fillStyle = '#e6f6ff';
    g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283, rr = 1 + Math.sin(a * 9) * .05; const x = 640 + Math.cos(a) * 190 * rr, y = 55 + Math.sin(a) * 52 * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(800, 80); g.lineTo(980, 120); g.lineTo(780, 100); g.fill(); g.stroke(); g.setLineDash([]);
    g.font = `italic bold 46px ${CAP}`; g.fillStyle = '#1d4f9a'; g.textAlign = 'left'; g.textBaseline = 'middle'; let x = 488; for (const ch of 'seven days...') { g.fillText(ch, x, 58 + Math.sin(x * .06 + t * 6) * 5); x += g.measureText(ch).width; } g.restore(); }
}); }

function board(t) { panel('p5', (w, h) => {
  g.fillStyle = '#b5814c'; g.fillRect(0, 0, w, h); dots(0, 0, w, h, '#7a4a22', 10, .2, () => .5);
  const pins = []; [[60, 30, -.08], [250, 40, .07], [440, 26, -.05], [630, 44, .06]].forEach(([x, y, rot], i) => { g.save(); g.translate(x + 80, y + 100); g.rotate(rot);
    inked(() => g.rect(-80, -100, 160, 200), '#fbf6ea', 5); inked(() => g.rect(-64, -84, 128, 128), '#5a6a8a', 3); inked(() => ell(0, -26, 30, 34), '#e8b48c', 3); inked(() => path([[-44, 44], [-34, 10], [34, 10], [44, 44]]), '#384058', 3);
    g.lineWidth = 12; g.strokeStyle = '#d4231c'; g.lineCap = 'round'; g.beginPath(); g.moveTo(-58, -78); g.lineTo(58, 38); g.moveTo(58, -78); g.lineTo(-58, 38); g.stroke(); g.restore(); pins.push([x + 80, y + 10]); });
  g.strokeStyle = '#d4231c'; g.lineWidth = 4; g.beginPath(); pins.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); pins.forEach(([x, y]) => inked(() => ell(x, y, 10, 10), '#d4231c', 3));
  g.save(); g.translate(950, 140); g.rotate(.05); inked(() => g.rect(-150, -120, 300, 250), '#fbf6ea', 6); inked(() => g.rect(-150, -120, 300, 56), '#d4231c', 6); g.font = `40px ${SFX}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OCTOBER', 0, -92);
    g.font = `bold 30px ${CAP}`; for (let d = 1; d <= 7; d++) { const x = -110 + ((d - 1) % 4) * 74, y = -30 + Math.floor((d - 1) / 4) * 74; g.fillStyle = INK; g.fillText(String(d), x, y); if (d < 7) { g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.moveTo(x - 20, y - 20); g.lineTo(x + 20, y + 20); g.stroke(); } else { g.lineWidth = 7; g.strokeStyle = '#d4231c'; ell(x, y, 32, 30, -.2); g.stroke(); } } g.restore();
  const cap = said('L4', t); if (cap) captionBox(24, h - 26 - wrap(cap, 34).length * 40 * 1.18 - 26, wrap(cap, 34), 40, 820);
}); }

// ---------- the camera: page view → panel to panel ----------
const SHOTS = () => [
  [0, 1, [600, 1066, 1.0]],
  [st('L3') - .35, .55, [600, 760, 1.15]],
  [at('L3', 'ends') + .3, .35, [312, 1190, 1.9]],
  [at('L3', 'phone') - .25, .3, [888, 1180, 1.9]],
  [st('L3b') - .2, .4, [600, 1640, 1.3]],
  [st('L4') - .2, .5, [600, 1860, 1.16]],
  [at('L4', 'gone') - .2, 1.6, [600, 1880, 1.1]],
];
window.seek = t => {
  let cam = SHOTS()[0][2].slice(); for (const [t0, d, c] of SHOTS()) { const k = eio(P(t, t0, d)); if (k <= 0) break; cam = cam.map((v, i) => lerp(v, c[i], k)); }
  const shake = t > at('L3', 'phone') - .1 && t < en('L3') + .3 ? 6 : 0, s = W / PW * cam[2];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d0a0c'; g.fillRect(0, 0, W, H);
  g.setTransform(s, 0, 0, s, W / 2 - cam[0] * s + Math.sin(t * 61) * shake, H / 2 - cam[1] * s + Math.cos(t * 53) * shake);
  g.fillStyle = '#1c130d'; g.fillRect(-PW, -PH, PW * 3, PH * 3); { const r = rng(4); for (let y = -PH; y < PH * 2; y += 90) { g.fillStyle = `rgba(${r() < .5 ? '60,40,26' : '12,8,5'},.6)`; g.fillRect(-PW, y, PW * 3, 86); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(-PW, y + 86, PW * 3, 4); } }
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(14, 22, PW, PH); g.fillStyle = PAPER; g.fillRect(0, 0, PW, PH); const age = g.createRadialGradient(PW / 2, PH / 2, PH * .3, PW / 2, PH / 2, PH * .75); age.addColorStop(0, 'rgba(160,110,40,0)'); age.addColorStop(1, 'rgba(160,110,40,.35)'); g.fillStyle = age; g.fillRect(0, 0, PW, PH);
  header(t); room(t); tv(t); phone(t); eyes(t); board(t);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(GRAIN, 0, 0); g.globalCompositeOperation = 'source-over';
  const v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return true; };
const GRAIN = document.createElement('canvas'); GRAIN.width = W; GRAIN.height = H; { const q = GRAIN.getContext('2d'), r = rng(77); q.fillStyle = '#fff'; q.fillRect(0, 0, W, H); for (let i = 0; i < 26000; i++) { q.fillStyle = `rgba(120,90,50,${r() * .35})`; q.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5); } }
window.setTL = tl => { NB.TL = tl; return true; };
Promise.all([`bold 40px "Comic Sans MS"`, `italic bold 40px "Comic Sans MS"`, '100px Impact'].map(f => document.fonts.load(f))).then(() => { window.ready = true; });
})();
