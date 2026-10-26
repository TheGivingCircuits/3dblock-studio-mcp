// GUESS THE HORROR #1, PS1 CUT v2 — "The Cursed Tape" (The Ring, never named), on conspiracy/lib/ps1.js. Redone to the TikTok playbook
// (2026-10-24): no camcorder, the case opens at once under a burned-in title card (also the cover/thumbnail and the loop seam), a clue
// ladder ending on "Seven days.", the ring of light flashing unnarrated on the TV (the hidden clue), the boy watching, the girl in the well.
// Places (all in one world, far apart, fog hides the rest): her living room (x=0) · the woods (x=60) · Cabin 12 (x=90) ·
// inside the well (x=120) · his apartment (x=-40). The case lies on her coffee table: it opens right away and the camera cranes
// up to the TV; at the end a dip to black cuts back to it, it snaps shut and the title card returns (the loop seam / thumbnail).
// Research notes: the tape shows a ring of light, a ladder, a fly, a burning tree; the well is under Cabin 12; it's her
// ex-husband's TV, on HIS seventh night, that turns itself on.
const { P, lerp, eio, eo, clamp, rng, at, st, en, back, V } = PS1;
const M = PS1.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, rep = PS1.rep, grp = PS1.group;

// ---------- textures (tiny, on purpose) ----------
const T = {
  wallA: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4b5a45'; q.fillRect(0, 0, w, h); q.fillStyle = '#58694f'; q.fillRect(0, 0, 3, h); q.fillRect(8, 0, 3, h); noise(q, w, h, r, '#1c241a', 60, .6); }),
  wallE: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a5466'; q.fillRect(0, 0, w, h); q.fillStyle = '#56607a'; for (let y = 2; y < h; y += 6) q.fillRect(0, y, w, 2); noise(q, w, h, r, '#202634', 70, .6); }),
  floor: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a3226'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1a12', 90, .8); noise(q, w, h, r, '#6a4a36', 40, .6); }),
  boards: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a4030'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2618'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5a40', 30, .6); }),
  ceil: PS1.color('#2a2826'), black: PS1.color('#020203'), skin: PS1.color('#d6a084'), pale: PS1.color('#c8ccc4'), white: PS1.color('#d8dcd8'),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  tableTop: tex(64, 64, (q, w, h, r) => { q.fillStyle = '#3a2416'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a180e'; for (let y = 3; y < h; y += 7) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#5a3a24', 120, .6); }),
  tv: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2b2a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a191e'; for (let y = 3; y < h; y += 3) q.fillRect(2, y, 5, 1); noise(q, w, h, r, '#45444c', 20, .6); }),
  vcr: tex(32, 8, (q) => { q.fillStyle = '#26252a'; q.fillRect(0, 0, 32, 8); q.fillStyle = '#050505'; q.fillRect(4, 3, 14, 2); q.fillStyle = '#3cff7a'; q.fillRect(23, 3, 6, 2); }),
  couch: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a1f24'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e0c10', 80, .9); noise(q, w, h, r, '#7a3036', 30, .7); }),
  couchE: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a4a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1c261c', 80, .9); }),
  coat: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#30333a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1c1e22', 14, .8); }),
  jacket: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#5a3e2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a2618', 14, .8); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#33456a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1f2c48', 14, .8); }),
  blonde: tex(8, 16, (q, w, h) => { q.fillStyle = '#d6b04a'; q.fillRect(0, 0, w, h); q.fillStyle = '#a8842c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  brown: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#3a2a1e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1e140c', 20, .8); }),
  blackHair: tex(8, 16, (q, w, h) => { q.fillStyle = '#0c0b0c'; q.fillRect(0, 0, w, h); q.fillStyle = '#26262a'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  dress: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#d4d6cc'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a8e86', 30, .7); q.fillStyle = '#6a6e64'; q.fillRect(0, h - 3, w, 3); }),
  window: tex(16, 20, (q, w, h, r) => { q.fillStyle = '#0c1a33'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8d4f0'; q.fillRect(10, 3, 3, 3); q.fillStyle = '#7a8ab0'; for (let i = 0; i < 10; i++) q.fillRect(r() * w | 0, r() * h | 0, 1, 2); q.fillStyle = '#c9c2b0'; q.fillRect(7, 0, 2, h); q.fillRect(0, 9, w, 2); }),
  dawnWindow: tex(16, 20, (q, w, h) => { const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2c27a'); g.addColorStop(1, '#f6e2b0'); q.fillStyle = g; q.fillRect(0, 0, w, h); q.fillStyle = '#c9c2b0'; q.fillRect(7, 0, 2, h); q.fillRect(0, 9, w, 2); }),
  picture: tex(16, 12, (q) => { q.fillStyle = '#8a6a2a'; q.fillRect(0, 0, 16, 12); q.fillStyle = '#c8c0a8'; q.fillRect(2, 2, 12, 8); q.fillStyle = '#2a1e16'; q.fillRect(4, 5, 7, 2); q.fillRect(10, 4, 2, 2); q.fillRect(4, 7, 1, 2); q.fillRect(9, 7, 1, 2); }),
  phone: tex(8, 16, (q, w, h) => { q.fillStyle = '#d8d0bc'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2a2a'; for (let y = 6; y < 14; y += 2) for (let x = 1; x < 7; x += 2) q.fillRect(x, y, 1, 1); q.fillStyle = '#6a7a6a'; q.fillRect(2, 1, 4, 3); }),
  led: PS1.color('#4cff6a'), shade: PS1.color('#8a7a5a'),
  tape: tex(32, 16, (q) => { q.fillStyle = '#111114'; q.fillRect(0, 0, 32, 16); q.fillStyle = '#ece6d6'; q.fillRect(3, 2, 26, 6); q.fillStyle = '#2c2c30'; q.fillRect(6, 10, 6, 4); q.fillRect(20, 10, 6, 4); }),
  cork: tex(48, 36, (q, w, h, r) => { q.fillStyle = '#6b4a32'; q.fillRect(0, 0, w, h); q.fillStyle = '#b9875a'; q.fillRect(2, 2, w - 4, h - 4); noise(q, w, h, r, '#7a4a22', 120, .6);
    for (const [x, y] of [[5, 4], [17, 3], [29, 5], [10, 19], [23, 19]]) { q.fillStyle = '#f4f1e8'; q.fillRect(x, y, 9, 11); q.fillStyle = '#5a6270'; q.fillRect(x + 1, y + 1, 7, 7); q.fillStyle = '#c9b8a0'; q.fillRect(x + 3, y + 2, 3, 3); q.fillStyle = '#c4161c'; for (let k = 0; k < 7; k++) { q.fillRect(x + 1 + k, y + 1 + k, 1, 1); q.fillRect(x + 7 - k, y + 1 + k, 1, 1); } }
    q.fillStyle = '#f0e27a'; q.fillRect(36, 22, 10, 8); q.fillStyle = '#b02a20'; q.font = 'bold 5px Arial'; q.fillText('7?', 38, 28); }),
  cal: (n) => tex(24, 30, (q) => { q.fillStyle = '#f1ead8'; q.fillRect(0, 0, 24, 30); q.fillStyle = '#a8241c'; q.fillRect(0, 0, 24, 7); q.fillStyle = '#fff'; q.font = 'bold 6px Arial'; q.fillText('OCT', 7, 6);
    for (let d = 1; d <= 12; d++) { const x = 2 + ((d - 1) % 4) * 6, y = 9 + Math.floor((d - 1) / 4) * 7; q.fillStyle = '#222'; q.fillRect(x, y, 3, 4); if (d < n) { q.fillStyle = '#a8241c'; q.fillRect(x - 1, y + 1, 5, 1); } if (d === n) { q.strokeStyle = n === 8 ? '#2a8a3a' : '#c4161c'; q.lineWidth = 1; q.strokeRect(x - 1.5, y - 1.5, 6, 7); } } }),
  clockFace: tex(32, 32, (q) => { q.fillStyle = '#efe6d0'; q.beginPath(); q.arc(16, 16, 15, 0, 6.283); q.fill(); q.fillStyle = '#222'; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; q.fillRect(16 + Math.cos(a) * 12 - 1, 16 + Math.sin(a) * 12 - 1, 2, 2); } }),
  grass: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#1c2a1c'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e4a2a', 60, .8); noise(q, w, h, r, '#0c140c', 50, .8); }),
  pine: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#1e3a2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#0e2016', 30, .9); noise(q, w, h, r, '#2e5a3a', 14, .8); }),
  bark: PS1.color('#3a2a1e'), roof: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2a2622'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1612'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); }),
  logs: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3e26'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2614'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5a3a', 20, .6); }),
  lit: PS1.color('#e8c86a'),
  stone: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a6c66'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a4c46'; for (let y = 0; y < h; y += 5) { q.fillRect(0, y, w, 1); for (let x = (y / 5 % 2) * 4; x < w; x += 8) q.fillRect(x, y, 1, 5); } noise(q, w, h, r, '#3a5a2a', 12, .7); }),
  num: n => tex(16, 10, (q) => { q.fillStyle = '#e8e3d6'; q.fillRect(0, 0, 16, 10); q.fillStyle = '#1a1a1a'; q.font = 'bold 8px Arial'; q.fillText(String(n), n > 9 ? 3 : 5, 8); }),
  face: (kind) => tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    if (kind === 'ghost') { px('#c8ccc4', 0, 0, 24, 28); px('#0c0b0c', 0, 0, 24, 9); px('#0c0b0c', 0, 9, 9, 19); px('#0c0b0c', 17, 9, 7, 19); px('#f4f6f0', 11, 12, 4, 3); px('#000', 13, 13); return; }
    const boy = kind === 'him' || kind === 'kid', hair = boy ? '#3a2a1e' : '#d6b04a'; px('#d6a084', 0, 0, 24, 28); px(hair, 0, 0, 24, boy ? 5 : 6); if (!boy) { px(hair, 0, 6, 3, 14); px(hair, 21, 6, 3, 14); }
    const scared = kind === 'scared'; px('#5a3a22', 5, scared ? 8 : 9, 4, 1); px('#5a3a22', 15, scared ? 8 : 9, 4, 1); if (scared) { px('#5a3a22', 4, 9); px('#5a3a22', 19, 9); }
    px('#f4f2ec', 5, 11, 4, scared ? 3 : 2); px('#f4f2ec', 15, 11, 4, scared ? 3 : 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3);
    if (scared) { px('#3a1612', 10, 20, 4, 3); px('#7a2a24', 11, 21, 2, 1); } else px('#8a4a3a', 9, 21, 6, 1);
    if (kind === 'him') { px('#3a2a1e', 4, 17, 16, 2); px('#3a2a1e', 5, 19, 14, 6); px('#5a3a2a', 9, 21, 6, 1); } }),
  cover: (() => { const c = document.createElement('canvas'); c.width = 270; c.height = 380; const g = c.getContext('2d'), r = rng(500);   // the redrawn home-video cover, title withheld
    const bg = g.createLinearGradient(0, 0, 0, 380); bg.addColorStop(0, '#0b1112'); bg.addColorStop(1, '#040606'); g.fillStyle = bg; g.fillRect(0, 0, 270, 380); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(150,180,175,${r() * .08})`; g.fillRect(r() * 270, r() * 380, 2 + r() * 16, 1); }
    const cx = 135, cy = 178, R = 62, gl = g.createRadialGradient(cx, cy, R * .8, cx, cy, R * 1.7); gl.addColorStop(0, 'rgba(220,210,255,.4)'); gl.addColorStop(1, 'rgba(220,210,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, 270, 380);
    for (let i = 0; i < 600; i++) { const a = r() * 6.283, r1 = R + 2 + r() * 4, len = 3 + Math.pow(r(), 2) * 24; g.strokeStyle = `rgba(240,238,255,${.1 + r() * .35})`; g.lineWidth = .6 + r(); g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * (r1 + len), cy + Math.sin(a) * (r1 + len)); g.stroke(); }
    g.strokeStyle = '#fbfaff'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke(); g.fillStyle = '#020303'; g.beginPath(); g.arc(cx, cy, R - 4, 0, 6.283); g.fill();
    g.fillStyle = '#f2f0f6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 26px "Marker Felt", "Chalkboard SE", cursive'; g.fillText('? ? ?', cx, cy - 16); g.font = 'bold 32px "Marker Felt", "Chalkboard SE", cursive'; g.fillText('? ? ? ?', cx, cy + 18);
    g.save(); g.translate(cx, cy + 50); g.rotate(-.09); g.strokeStyle = '#d23a2a'; g.lineWidth = 2.5; g.strokeRect(-64, -11, 128, 22); g.fillStyle = '#d23a2a'; g.font = 'bold 13px Rockwell, "Courier New", serif'; g.fillText('TITLE WITHHELD', 0, 1); g.restore();
    g.fillStyle = '#e9eef0'; g.font = '600 17px "Times New Roman", serif'; g.letterSpacing = '3px'; g.fillText('BEFORE YOU DIE,', cx, 64); g.fillText('YOU SEE', cx, 86); g.letterSpacing = '0px'; g.fillStyle = '#9aa1ab'; g.font = 'bold 8px Helvetica'; g.letterSpacing = '2px'; g.fillText('MIDNIGHT PICTURES PRESENTS', cx, 30); g.letterSpacing = '0px';
    g.font = 'italic 11px "Times New Roman", serif'; g.fillStyle = '#e7e9ee'; g.fillText('“You won’t sleep for a week.”', cx, 278); g.fillStyle = '#b9bec7'; g.font = '500 8px "Avenir Next Condensed", sans-serif'; ['A FILM BY ???', 'STARRING ??? · ??? · ???', 'MUSIC BY ??? · WRITTEN BY ??? · DIRECTED BY ???'].forEach((s, i) => g.fillText(s, cx, 300 + i * 13));
    g.strokeStyle = '#d7dae0'; g.lineWidth = 1.5; g.strokeRect(14, 340, 70, 28); g.fillStyle = '#f1f2f5'; g.font = 'bold 12px Helvetica'; g.textAlign = 'left'; g.fillText('RATED ?', 20, 354); g.textAlign = 'center'; g.font = 'bold 9px Helvetica'; g.fillText('WIDESCREEN', 175, 354);
    g.save(); g.translate(236, 44); g.rotate(.14); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 24, 0, 6.283); g.fill(); g.strokeStyle = '#c0302a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#c0302a'; g.font = 'bold 5px Arial'; g.fillText('MIDNIGHT VIDEO', 0, -9); g.fillStyle = '#111'; g.font = 'bold 8px Helvetica'; g.fillText('NEW RELEASE', 0, 2); g.font = 'bold 5px Arial'; g.fillText('2 NIGHTS · $3.99', 0, 11); g.restore();
    const sh = g.createLinearGradient(0, 0, 270, 380); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, 270, 380); return c; })(),
  disc: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#a8adb4'; g.beginPath(); g.arc(32, 32, 31, 0, 6.283); g.fill(); g.fillStyle = '#060808'; g.beginPath(); g.arc(32, 32, 28, 0, 6.283); g.fill();
    g.strokeStyle = '#f4f6ff'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 15, 0, 6.283); g.stroke(); g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(32, 32, 6, 0, 6.283); g.fill(); g.fillStyle = '#101114'; g.beginPath(); g.arc(32, 32, 2.5, 0, 6.283); g.fill(); return c; })(),
};
const diskTex = (() => { const t = new THREE.CanvasTexture(T.disc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();

// ---------- the TV picture: a tiny live canvas, shared by both TVs ----------
const scrC = document.createElement('canvas'); scrC.width = 128; scrC.height = 96; const sg = scrC.getContext('2d'); const scrT = new THREE.CanvasTexture(scrC); scrT.magFilter = scrT.minFilter = THREE.NearestFilter; scrT.generateMipmaps = false;
function screen(kind, t, prog = 0) { const g = sg, w = 128, h = 96, r = rng(Math.floor(t * 15)); g.save(); g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, w, h); const white = '#e4eaf0', grey = '#6b7078';
  if (kind === 'static') for (let i = 0; i < 1400; i++) { const v = r() * 255 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * w | 0, r() * h | 0, 2, 1); }
  else if (kind === 'blue') { g.fillStyle = '#1b2ea8'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eefc'; g.font = 'bold 11px "Courier New"'; g.fillText('PLAY ▶', 10, 18); }
  else if (kind === 'ring') { g.strokeStyle = 'rgba(220,230,255,.35)'; g.lineWidth = 9; g.beginPath(); g.arc(64, 48, 26, 0, 6.283); g.stroke(); g.strokeStyle = white; g.lineWidth = 3; g.stroke(); }
  else if (kind === 'ladder') { g.fillStyle = grey; g.fillRect(0, 66, w, 30); g.strokeStyle = white; g.lineWidth = 2; for (const x0 of [52, 76]) { g.beginPath(); g.moveTo(x0, 92); g.lineTo(x0 - 18, 4); g.stroke(); } for (let k = 1; k < 8; k++) { const y = 92 - k * 11, dx = (92 - y) / 88 * 18; g.beginPath(); g.moveTo(52 - dx, y); g.lineTo(76 - dx, y); g.stroke(); } }
  else if (kind === 'fly') { g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, w, h); g.fillStyle = '#0c0c0e'; g.beginPath(); g.ellipse(64, 50, 11, 17, .2, 0, 6.283); g.fill(); g.beginPath(); g.arc(68, 32, 7, 0, 6.283); g.fill(); g.fillStyle = 'rgba(30,30,34,.55)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 17, 42, 17, 7, s * .5, 0, 6.283); g.fill(); } }
  else if (kind === 'tree') { g.fillStyle = grey; g.fillRect(0, 74, w, 22); g.fillStyle = '#050506'; g.fillRect(61, 42, 6, 34); for (const [x, y, rr] of [[64, 36, 17], [50, 42, 12], [78, 42, 12]]) { g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fill(); }
    for (let k = 0; k < 11; k++) { const a = Math.PI * (1.05 + k * .08), x = 64 + Math.cos(a) * 23, y = 38 + Math.sin(a) * 18, fh = 16 + Math.sin(t * 17 + k * 2.1) * 6 + r() * 5; g.fillStyle = k % 3 ? white : '#ffc896'; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + Math.sin(t * 9 + k) * 2, y - fh); g.lineTo(x + 4, y); g.closePath(); g.fill(); } }
  else if (kind === 'well' || kind === 'climb') { g.fillStyle = '#2a2d32'; g.fillRect(0, 0, w, 53); g.fillStyle = grey; g.fillRect(0, 53, w, 43); g.fillStyle = '#9a9ea6'; g.fillRect(46, 52, 36, 22); g.beginPath(); g.ellipse(64, 52, 18, 4, 0, 0, 6.283); g.fill(); g.fillStyle = '#050506'; g.beginPath(); g.ellipse(64, 52, 14, 3, 0, 0, 6.283); g.fill();
    if (kind === 'climb') { const k = clamp(prog); g.fillStyle = '#e4e2da'; g.fillRect(58, 52 - 18 * k, 12, 18 * k); g.fillStyle = '#050506'; g.beginPath(); g.ellipse(64, 48 - 18 * k, 6, 8, 0, 0, 6.283); g.fill(); g.fillRect(58, 48 - 18 * k, 12, 15 * k); } }
  else if (kind === 'flash') { g.fillStyle = `rgba(240,248,255,${1 - prog})`; g.fillRect(0, 0, w, h); }
  if (kind && kind !== 'static' && kind !== 'blue' && kind !== 'flash') { const by = ((t * 35) % (h + 30)) - 15; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, by - 6, w, 12); for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${r() * .14})`; g.fillRect(r() * w, r() * h, 1, 1); } }
  if (kind === 'off') { g.fillStyle = '#121518'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 2) g.fillRect(0, y, w, 1); g.restore(); scrT.needsUpdate = true; }

// ---------- builders ----------
function room(ox, wallT, couchT) { const R = { ox };
  add(rep(new THREE.PlaneGeometry(5, 4.5), 5, 4.5), M(T.floor), ox, 0, .25).rotation.x = -Math.PI / 2;
  add(rep(new THREE.PlaneGeometry(5, 2.6), 6, 3), M(wallT), ox, 1.3, -2); add(rep(new THREE.PlaneGeometry(4.5, 2.6), 5.5, 3), M(wallT), ox - 2.5, 1.3, .25).rotation.y = Math.PI / 2;
  add(rep(new THREE.PlaneGeometry(4.5, 2.6), 5.5, 3), M(wallT), ox + 2.5, 1.3, .25).rotation.y = -Math.PI / 2; add(new THREE.PlaneGeometry(5, 4.5), M(T.ceil), ox, 2.6, .25).rotation.x = Math.PI / 2;
  for (const [x, z, w, d] of [[0, -1.98, 5, .04], [-2.48, .25, .04, 4.5], [2.48, .25, .04, 4.5]]) add(box(w, .14, d), M(T.wood), ox + x, .07, z);
  R.windowMat = M(T.window, { unlit: true, tint: '#8a96b8' }); add(new THREE.PlaneGeometry(1.0, 1.25), R.windowMat, ox - 2.47, 1.45, -.5).rotation.y = Math.PI / 2;
  add(new THREE.PlaneGeometry(.9, 2.0), M(T.black), ox + 2.47, 1.0, 1.3).rotation.y = -Math.PI / 2;
  add(box(1.3, .5, .5), M(T.wood), ox + .6, .25, -1.7); add(box(.84, .66, .6), M(T.tv), ox + .6, .83, -1.68); R.screen = add(new THREE.PlaneGeometry(.6, .45), M(scrT, { unlit: true }), ox + .54, .85, -1.375);
  for (const s of [-1, 1]) { const a = add(box(.015, .42, .015), M(T.tv), ox + .6 + s * .12, 1.3, -1.7); a.rotation.z = -s * .45; }
  add(box(1.9, .42, .85), M(couchT), ox + .3, .21, .95); add(box(1.9, .56, .22), M(couchT), ox + .3, .63, 1.3); for (const x of [-.65, 1.25]) add(box(.22, .58, .85), M(couchT), ox + x, .29, .95);
  add(cyl(.08, .1, .62, 6), M(T.wood), ox - 1.4, .31, -1.3); add(cyl(.38, .38, .05, 7), M(T.wood), ox - 1.4, .645, -1.3);
  add(cyl(.02, .02, 1.5, 4), M(T.tv), ox - 2.1, .75, -1.7); R.shade = add(cyl(.14, .28, .3, 6, true), M(T.shade, { side: THREE.DoubleSide }), ox - 2.1, 1.6, -1.7); return R; }
function pine(x, z, h, s = 1) { add(cyl(.08 * s, .12 * s, h * .3, 5), M(T.bark), x, h * .15, z); for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry((1.0 - k * .25) * s, h * .45, 6), M(T.pine), x, h * (.35 + k * .2), z); }
function cabin(x, z, n, lit) { const C = grp(x, 0, z); add(box(2.4, 1.9, 2.2), M(T.logs), 0, .95, 0, C); const roof = add(cyl(1.35, 1.35, 2.7, 3), M(T.roof), 0, 2.57, 0, C); roof.rotation.z = Math.PI / 2; roof.rotation.x = -Math.PI / 2;   // a triangular prism, ridge along x
  add(new THREE.PlaneGeometry(.55, 1.2), M(T.black), -.5, .6, 1.105, C); add(new THREE.PlaneGeometry(.5, .4), M(lit ? T.lit : T.black, { unlit: !!lit }), .55, 1.1, 1.105, C); add(new THREE.PlaneGeometry(.34, .22), M(T.num(n), { unlit: true, tint: '#b8b4a8' }), -.5, 1.42, 1.11, C); return C; }

// ---------- the episode ----------
PS1.episode({
  camcorder: false,   // the series look: no REC overlay
  open: ['L1', null, .55],   // playbook: motion from the first frames. The lid starts to swing at ~0.15s, the crane at ~0.45s
  capColor: { L9b: '#cfd8ff' },
  hud(t, S, q) {   // the burned-in title card: frames 0–2.4s, and back on the closed case at the end, so frame 0 = the last frame = the cover
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - S.lidShut - .2) / .3))); if (a <= 0) return;
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
    const txt = (s, y, size, fill, ls = 0) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.letterSpacing = ls + 'px'; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, LW2, y); q.fillStyle = fill; q.fillText(s, LW2, y); };
    const LW2 = 180; txt('GUESS THE HORROR', 112, 30, '#f2f0ea', 1); txt('#1', 156, 44, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 198, 17, '#ffd23a', 1);
    q.translate(LW2, 232); q.rotate(-.06); q.letterSpacing = '2px'; q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.fillStyle = 'rgba(0,0,0,.55)'; q.fillRect(-74, -12, 148, 24); q.strokeStyle = '#e2342a'; q.lineWidth = 2.5; q.strokeRect(-74, -12, 148, 24); q.fillStyle = '#e2342a'; q.fillText('DIFFICULTY: EASY', 0, 1);
    q.restore(); },
  build(S) { const O = S.O = {};
    // her living room, the coffee table with the case, the VCR and the tape
    O.A = room(0, T.wallA, T.couch); add(new THREE.PlaneGeometry(.5, .38), M(T.picture), -1.1, 1.62, -1.98);
    O.calMat = M(T.cal(7)); add(new THREE.PlaneGeometry(.42, .52), O.calMat, 2.47, 1.5, .25).rotation.y = -Math.PI / 2; add(new THREE.PlaneGeometry(1.0, .75), M(T.cork), 2.47, 1.55, -.75).rotation.y = -Math.PI / 2;
    add(cyl(.18, .18, .05, 12), M(T.tv), .6, 2.0, -1.97).rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(.16, 12), M(T.clockFace, { unlit: true, tint: '#b8b0a0' }), .6, 2.0, -1.94);
    O.hands = [grp(.6, 2.0, -1.93), grp(.6, 2.0, -1.93)]; add(box(.012, .1, .005), M(T.black), 0, .05, 0, O.hands[0]); add(box(.008, .14, .005), M(T.black), 0, .07, 0, O.hands[1]);
    add(box(.9, .04, .5), M(T.tableTop, { unlit: true, noFog: true }), .4, .39, .25); for (const [x, z] of [[-.02, .05], [.82, .05], [-.02, .45], [.82, .45]]) add(box(.05, .37, .05), M(T.wood), x, .185, z);
    S.case = PS1.dvdCase(T.cover, diskTex, .4, .41, .25, 0); S.caseCam = [V(.4, .41 + .62, .19 + .001), V(.4, .41, .19), 40];   // higher, and the case sits in the lower half: the title card owns the top (both inside the 3:4 profile crop)
    add(box(.5, .09, .34), M(T.vcr), .6, .36, -1.47); O.tape = add(box(.19, .025, .1), M(T.tape), .6, .36, -1.25);
    O.phoneBase = add(box(.24, .07, .17), M(T.phone), -1.4, .705, -1.3); O.handset = add(box(.07, .23, .06), M(T.phone), -1.46, .83, -1.33); O.handset.rotation.z = .12; O.led = add(box(.025, .012, .012), M(T.led, { unlit: true }), -1.33, .745, -1.215);
    O.her = PS1.person({ skin: T.skin, top: T.coat, legs: T.jeans, hair: T.blonde, face: T.face('calm'), long: .5 }); O.faceCalm = O.her.faceMat.uniforms.map.value; O.faceScared = T.face('scared');
    O.held = add(box(.06, .22, .055), M(T.phone), 0, 0, 0, O.her.G);
    O.himA = PS1.person({ skin: T.skin, top: T.jacket, legs: T.jeans, hair: T.brown, face: T.face('him') });
    O.kid = PS1.person({ skin: T.skin, top: PS1.color('#3a5a8a'), legs: T.jeans, hair: T.brown, face: T.face('kid'), shoes: '#e8e4dc' }); O.kid.G.scale.setScalar(.62);   // the boy: a small person, sneakers
    // the woods: pines, four cabins (12 lit), rain
    add(rep(new THREE.PlaneGeometry(40, 40), 20, 20), M(T.grass), 60, 0, 0).rotation.x = -Math.PI / 2; const r = rng(31);
    for (let i = 0; i < 70; i++) { const x = 60 + (r() - .5) * 34, z = (r() - .5) * 34; if (Math.abs(x - 60) < 3.2 && z > -4 && z < 9) continue; if (z < -3.5 && z > -8 && Math.abs(x - 61.8) < 7) continue; pine(x, z, 4 + r() * 4, .9 + r() * .5); }
    for (const [x, z] of [[55, 5], [56, -1], [64, -1.5], [65.5, 4], [53, 9], [67, 9]]) pine(x, z, 5 + r() * 2);
    [[56.5, -5, 10], [60, -6.5, 11], [63.5, -5, 12], [67, -3.5, 13]].forEach(([x, z, n]) => { const c = cabin(x, z, n, n === 12); c.rotation.y = (60 - x) * .06; });
    { const n = 700, pos = new Float32Array(n * 6), rr = rng(9); for (let i = 0; i < n; i++) { const x = 52 + rr() * 16, y = rr() * 6, z = -8 + rr() * 18; pos.set([x, y, z, x - .03, y - .35, z], i * 6); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); O.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#8a9ab8', transparent: true, opacity: .55 })); S.scene.add(O.rain); O.rainY = pos.filter((_, k) => k % 3 === 1); }
    // Cabin 12 inside: plank floor around a square hole, two floor doors, the well beneath with its stone lid
    const cx = 90; for (const [x, z, w, d] of [[-1.3, 0, 1.4, 3.6], [1.3, 0, 1.4, 3.6], [0, -1.3, 1.2, 1.0], [0, 1.3, 1.2, 1.0]]) add(rep(new THREE.PlaneGeometry(w, d), w * 1.5, d * 1.5), M(T.boards), cx + x, 0, z).rotation.x = -Math.PI / 2;
    for (const [x, z, ry] of [[0, -1.8, 0], [-2, 0, Math.PI / 2], [2, 0, -Math.PI / 2]]) add(rep(new THREE.PlaneGeometry(3.6, 2.4), 3, 2), M(T.logs), cx + x, 1.2, z).rotation.y = ry;
    add(new THREE.PlaneGeometry(.7, .5), M(T.window, { unlit: true, tint: '#6a7698' }), cx - 1.99, 1.5, -.6).rotation.y = Math.PI / 2;
    O.doors = [-1, 1].map(s => { const pv = grp(cx + s * .6, 0, 0); add(box(.6, .04, 1.6), M(T.boards), -s * .3, .02, 0, pv); return { pv, s }; });
    add(cyl(.62, .62, .9, 8, true), M(T.stone, { side: THREE.DoubleSide }), cx, -.45, 0); add(new THREE.CircleGeometry(.6, 8), M(T.black), cx, -.6, 0).rotation.x = -Math.PI / 2;
    add(new THREE.RingGeometry(.56, .68, 8), M(T.stone), cx, -.02, 0).rotation.x = -Math.PI / 2; O.lid = add(cyl(.66, .66, .07, 8), M(T.stone), cx, .0, 0);
    O.hand = grp(cx - .45, -.02, .2); add(box(.13, .03, .16), M(T.pale), 0, 0, 0, O.hand); for (let k = 0; k < 4; k++) add(box(.025, .025, .12), M(T.pale), -.045 + k * .03, .01, .13, O.hand); O.hand.rotation.y = .9;
    // inside the well, looking up: stone throat, a ring of light at the top
    { const g = rep(cyl(.62, .62, 7, 8, true), 4, 10), n = g.attributes.normal; for (let i = 0; i < n.array.length; i++) n.array[i] *= -1; add(g, M(T.stone, { side: THREE.BackSide }), 120, 3.5, 0); }   // normals point inward so the light from the top reaches the walls
    add(new THREE.CircleGeometry(.62, 8), M(PS1.color('#0e1214')), 120, .01, 0).rotation.x = -Math.PI / 2;   // the muddy bottom, where the girl stands
    O.lightRing = add(new THREE.RingGeometry(.48, .6, 24), M(PS1.color('#f4f8ff'), { unlit: true, noFog: true, side: THREE.DoubleSide }), 120, 6.9, 0); O.lightRing.rotation.x = Math.PI / 2;
    add(new THREE.CircleGeometry(.5, 24), M(T.black, { side: THREE.DoubleSide }), 120, 6.92, 0).rotation.x = Math.PI / 2;
    // his apartment: the TV that turns itself on; him; her (the ghost)
    O.E = room(-40, T.wallE, T.couchE); O.him = PS1.person({ skin: T.skin, top: T.jacket, legs: T.jeans, hair: T.brown, face: T.face('him') });
    O.ghost = PS1.person({ skin: T.pale, top: T.dress, legs: T.dress, hair: T.blackHair, face: T.face('ghost'), long: .62, veil: .42, dress: true, bareArms: true });
  },
  prepare(S) { S.hits = [at('L3', 'phone'), at('L9', 'then'), en('L9') + 1.05, at('L10', 'movie')]; },
  shots: S => { const E = -40, e9 = en('L9'); return [   // [t0, dur, camera, look, fov] — handheld drift is added by the engine
    [0, 1, V(.15, 1.35, 1.2), V(.62, .9, -1.6), 52],                                        // up from the case to the TV (static)
    [at('L2', 'videotape') - .25, .45, V(.55, .62, -.55), V(.6, .36, -1.4), 46],            // the VCR: a tape with no label slides in
    [at('L2', 'label') - .1, .35, V(.6, .52, -.92), V(.6, .36, -1.3), 34],                 // …blank label
    [at('L2', 'strange') - .2, .4, V(.54, .86, -.75), V(.54, .85, -1.4), 44],               // into the screen: the broken pictures
    [en('L2') - .3, 1.6, V(.54, .86, -.95), V(.54, .85, -1.4), 40],                         // …creep in: the ring of light flashes up (unnarrated: the hidden clue)
    [at('L3', 'phone') - .2, .22, V(-.45, 1.3, -.15), V(-1.42, .76, -1.3), 42],             // whip-pan: the phone rings
    [at('L3', 'someone') - .25, .35, V(-.42, 1.5, .62), V(-1.0, 1.36, -.72), 50],           // "someone on the line whispers…" — her face
    [at('L4', 'everyone') - .2, .4, V(1.2, 1.55, -.6), V(2.47, 1.52, -.75), 50],            // the people who watched it
    [at('L4', 'week') - .3, .5, V(1.4, 1.5, .3), V(2.47, 1.5, .25), 42],                    // the calendar: day 7 circled
    [at('L5', 'reporter') - .25, .35, V(.45, 1.65, 1.9), V(.45, 1.0, -1.6), 56],             // her, watching it…
    [at('L5', 'ex') - .25, .5, V(.85, 1.6, 1.8), V(.6, 1.1, -1.5), 56],                     // …and her ex-husband
    [at('L5', 'clocks') - .2, .4, V(.6, 1.95, -1.25), V(.6, 2.0, -1.9), 42],                 // the clock
    [st('L5b') - .2, .02, V(-.2, .8, 1.25), V(.55, .55, -1.5), 50],                           // CUT: low, behind the couch: the boy alone at the TV
    [at('L5b', 'watches') - .2, 1.5, V(.36, .74, .4), V(.55, .8, -1.4), 44],                 // …creep in over his shoulder
    [at('L6', 'clues') - .2, .02, V(60.3, 1.6, 6.5), V(61.2, 1.3, -2), 58],                         // CUT: the woods, rain, flashlight
    [at('L6', 'clues') - .15, 2.2, V(61.3, 1.6, 3.2), V(62.6, 1.3, -4.5), 54],               // walking toward the cabins
    [at('L6', 'cabin') - .25, .5, V(62.5, 1.6, .4), V(63.5, 1.45, -4.2), 46],               // Cabin 12
    [at('L6', 'floor') - .35, .02, V(90.9, 1.5, 1.6), V(90, .0, 0), 54],                      // CUT: inside — the floor doors
    [at('L6', 'well') - .1, .5, V(90.5, 1.35, .9), V(90, -.2, 0), 50],                       // the well
    [st('L7') - .1, .02, V(120, .3, .02), V(120, 6, 0), 62],                                 // CUT: inside the well, looking up at the ring of light
    [at('L7', 'long') - .35, .02, V(90.4, .65, .75), V(89.6, .0, .15), 46],                   // CUT: a hand on the rim
    [st('L7b') - .1, .02, V(120.14, 4.4, .2), V(120, .6, 0), 58],                            // CUT: back down the well, looking down: a girl at the bottom
    [st('L7b'), 2.4, V(120.1, 3.3, .14), V(120, .7, 0), 54],                                 // …sinking toward her
    [st('L8') - .15, .02, V(91.1, 1.2, 1.2), V(90, .0, 0), 50],                               // the lid slams back on
    [at('L8', 'thinks') - .25, .02, V(.9, 1.55, 1.7), V(-1.6, 1.1, -.6), 54],                 // CUT: dawn
    [at('L9', 'then') - .05, .02, V(E + 1.9, 1.7, 2.1), V(E + .2, .9, -1.2), 60],            // CUT: his seventh night
    [at('L9', 'seventh'), 2.0, V(E + 1.4, 1.55, 1.3), V(E + .4, .95, -1.3), 54],               // creeping in
    [at('L9', 'tv') - .1, .3, V(E + .8, 1.15, .1), V(E + .55, .85, -1.4), 46],                 // the TV turns itself on
    [e9 + .3, .6, V(E + .62, .34, 1.0), V(E + .55, .5, -1.4), 58],   // down on the floor: she crawls straight at the lens                           // something comes out
    [st('L9b') - .1, 1.6, V(E + .55, 1.48, 1.3), V(E + .5, 1.42, -.1), 50],                    // face to face: "seven days." 
  ]; },
  wob: (t, S) => { const cuts = [st('L5b') - .2, at('L6', 'clues') - .2, at('L6', 'floor') - .35, st('L7') - .1, at('L7', 'long') - .35, st('L7b') - .1, at('L8', 'thinks') - .25, at('L9', 'then') - .05]; return Math.max(...cuts.map(c => t > c - .06 && t < c + .1 ? 1 : 0), t > en('L9') + 1.05 && t < en('L9') + 1.3 ? .8 : 0, t > at('L10', 'movie') - .05 && t < at('L10', 'movie') + .25 ? 1 : 0); },
  flash: (t) => { const u = t - at('L9', 'then') + .05; return u > 0 && u < .3 ? (1 - u / .3) * (u < .05 || u > .1 ? .9 : .3) : 0; },
  update(t, S) { const O = S.O, E = -40, e9 = en('L9'), r = rng(Math.floor(t * 12)), tq = Math.floor(t * 8) / 8;
    const wellGirl = t >= st('L7b') - .1 && t < st('L8') - .15, inWell = (t >= st('L7') - .1 && t < at('L7', 'long') - .35) || wellGirl;
    const woods = t > at('L6', 'clues') - .2 && t < at('L6', 'floor') - .35, inCabin = t >= at('L6', 'floor') - .35 && t < at('L8', 'thinks') - .25 && !inWell, kidOn = t >= st('L5b') - .2 && t < at('L6', 'clues') - .2;
    const dawn = t >= at('L8', 'thinks') - .25 && t < at('L9', 'then') - .05, his = t >= at('L9', 'then') - .05 && t < S.cutBack;
    // the TV picture
    const ends = at('L3', 'ends'), pic = at('L2', 'strange') - .1, tape = at('L2', 'videotape') - .1, t9 = at('L9', 'tv') - .1;
    let kind = 'static', prog = 0; if (t >= tape && t < pic) kind = 'blue'; else if (t >= pic && t < ends) { kind = 'static'; for (const [k, w] of [['ladder', 'ladder'], ['fly', 'fly'], ['tree', 'burning']]) if (t >= at('L2', w) - .08) kind = k; if (t >= en('L2') - .1) kind = 'ring'; }
    else if (t >= at('L5', 'watches') - .1 && t < en('L5') + .1) kind = ['ring', 'ladder', 'tree', 'static'][Math.floor((t - at('L5', 'watches')) * 2.5) % 4];
    else if (t >= at('L5b', 'watches') - .1 && t < at('L6', 'clues') - .2) kind = ['ladder', 'fly', 'tree', 'ring'][Math.floor((t - at('L5b', 'watches')) * 2.2) % 4];
    if (dawn) kind = 'off'; if (his) { if (t < t9) kind = 'off'; else { const u = t - t9; kind = u < .35 ? 'flash' : u < .9 ? 'static' : t < e9 + .15 ? 'well' : t < e9 + 1.3 ? 'climb' : 'static'; prog = u < .35 ? u / .35 : (t - e9 - .15) / 1.15; } }
    screen(kind, t, prog);
    // lights per place: 1 = the TV / a flashlight / the light up the well, 2 = a lamp / the cabin window / the sun / lightning
    const tvOn = kind !== 'off', fl = kind === 'static' ? .7 + .5 * r() : .9;
    S.U.fogColor.value.set(woods ? '#1a2432' : dawn ? '#9a8e7c' : his ? '#06080e' : '#04060a'); S.U.fogNear.value = woods ? 1.5 : dawn ? 6 : 2.4; S.U.fogFar.value = woods ? 17 : dawn ? 22 : inWell ? 9 : 9;   // the woods: trees as silhouettes in pale fog
    S.U.amb.value.setRGB(...(woods ? [.13, .14, .19] : inWell ? [.05, .05, .07] : inCabin ? [.13, .13, .15] : dawn ? [.42, .38, .34] : his ? [.14, .15, .2] : [.16, .16, .2]));
    if (woods || inCabin) { const c = S.camera.position; PS1.light(1, [c.x, c.y + .1, c.z], [1.7, 1.6, 1.3], 12); PS1.light(2, woods ? [63.9, 1.1, -3.6] : [88.2, 1.5, -.6], woods ? [1.4, 1.1, .5] : [.4, .45, .7], woods ? 4 : 5); PS1.light(3, [0, -50, 0], [0, 0, 0]); }
    else if (inWell) { PS1.light(1, [120, 6.6, 0], [1.6, 1.7, 2.1], 8.5); PS1.light(2, wellGirl ? [120, 2.6, .2] : [0, -50, 0], wellGirl ? [.45, .52, .7] : [0, 0, 0], 4.5); PS1.light(3, [0, -50, 0], [0, 0, 0]); }
    else if (dawn) { PS1.light(1, [-3.4, 1.8, -.5], [1.9, 1.5, 1.0], 8); PS1.light(2, [0, -50, 0], [0, 0, 0]); PS1.light(3, [0, -50, 0], [0, 0, 0]); }
    else if (his) { PS1.light(1, [E + .6, .9, -1.0], tvOn ? [1.0 * fl, 1.15 * fl, 1.6 * fl] : [0, 0, 0], 5.5); const lt = S.flashLevel = Math.max(0, 1 - (t - at('L9', 'then') + .05) / .4) * (t > at('L9', 'then') - .05 ? 1 : 0); PS1.light(2, [E - 3.2, 1.8, -.5], [1.6 * lt + .05, 1.7 * lt + .06, 2.2 * lt + .1], 7); PS1.light(3, [E - 1.95, 1.86, -1.6], [.5, .34, .2], 5); }
    else { PS1.light(1, [.6, .9, -1.0], [1.0 * fl, 1.15 * fl, 1.6 * fl], 5.5); PS1.light(2, [-2.1, 1.7, -1.6], [.75, .52, .3], 6.5); PS1.light(3, [2.3, 2.0, 1.6], [.3, .22, .14], 4.8); }
    O.A.windowMat.uniforms.map.value = dawn ? T.dawnWindow : T.window; O.calMat.uniforms.map.value = dawn ? (O.cal8 = O.cal8 || T.cal(8)) : T.cal7 || (T.cal7 = O.calMat.uniforms.map.value);
    // the tape slides into the VCR
    { const k = eio(P(t, at('L2', 'label') + .35, .5)); O.tape.visible = t > at('L2', 'videotape') - .4 && k < 1; O.tape.position.z = lerp(-1.18, -1.4, k); }
    // the phone rings
    const ring = at('L3', 'phone') - .1, pick = at('L3', 'someone') - .35, ringing = t > ring && t < pick; O.led.visible = ringing && Math.floor(t * 8) % 2 === 0; O.handset.rotation.z = .12 + (ringing ? Math.sin(t * 80) * .06 : 0); O.phoneBase.position.x = -1.4 + (ringing ? Math.sin(t * 90) * .006 : 0);
    // her: watching (back to us), then on the phone, then watching with him; at dawn by the window
    const H = O.her; H.faceMat.uniforms.map.value = t > pick && !dawn ? O.faceScared : O.faceCalm; O.held.visible = false; O.handset.visible = true; H.G.visible = !woods && !inCabin && !inWell && !his && !kidOn;
    if (t < pick) { H.G.position.set(.02, 0, -.55); H.G.rotation.y = Math.PI + .3; H.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); }
    else if (t < at('L5', 'reporter') - .3) { H.G.position.set(-1.0, 0, -.72); H.G.rotation.y = .5; H.pose(PS1.ARMS.down(-1), PS1.ARMS.phone()); O.held.position.set(.13, 1.52, .06); O.held.rotation.set(.2, 0, .5); O.held.visible = true; O.handset.visible = false; }
    else if (!dawn) { H.G.position.set(.15, 0, -.25); H.G.rotation.y = Math.PI + .1; H.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); }
    else { H.G.position.set(-1.7, 0, -.45); H.G.rotation.y = -Math.PI / 2 + .3; H.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); }
    O.himA.G.visible = t > at('L5', 'ex') - .35 && t < st('L5b') - .2;
    O.kid.G.visible = kidOn; O.kid.G.position.set(.5, 0, -.75); O.kid.G.rotation.y = Math.PI + .08; O.kid.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); O.himA.G.position.set(.95, 0, -.15); O.himA.G.rotation.y = Math.PI - .15;
    // the clock: both clocks ticking
    O.hands[0].rotation.z = -(t * .9) - 1; O.hands[1].rotation.z = -(t * 11);
    // the woods: rain falls
    { const a = O.rain.geometry.attributes.position; for (let i = 0; i < a.count; i += 2) { const y0 = O.rainY[i], y = ((y0 - t * 9) % 6 + 6) % 6; a.setY(i, y); a.setY(i + 1, y - .35); } a.needsUpdate = true; O.rain.visible = woods; }
    // Cabin 12: the floor doors swing open, the lid scrapes aside; a hand on the rim; the lid slams back at dawn's edge
    { const open = eio(P(t, at('L6', 'floor') - .25, .6)); O.doors.forEach(d => d.pv.rotation.z = -d.s * 1.9 * open); const off = eio(P(t, at('L6', 'well') - .15, .7)) * (1 - eio(P(t, st('L8') - .1, .2)));
      O.lid.position.set(90 + .9 * off, .0 + .02 * off, .35 * off); O.lid.rotation.z = -.15 * off; O.hand.visible = t > at('L7', 'long') - .35 && t < st('L7b') - .1; O.hand.position.y = -.02 + Math.sin(tq * 3) * .004; }
    O.lightRing.material.uniforms.tint.value.setScalar(.85 + .15 * Math.sin(t * 6));
    // his seventh night: him backing away; a hand through the glass, she crawls out in stop-motion steps, stands, comes for the camera
    // she comes head first out of the glass, slides down to the floor and crawls; on the last line she rises and comes for the lens
    const G = O.ghost, out = clamp((tq - e9 - .55) / 1.6), stand = clamp((tq - st('L9b') + .2) / .9), walk = clamp((tq - st('L9b') - .5) / 1.6);
    O.him.G.visible = his; O.him.G.position.set(E + 1.35 + .35 * eio(P(t, e9 + .5, 1.2)), 0, .1 + .45 * eio(P(t, e9 + .5, 1.2))); O.him.G.rotation.y = -2.6; O.him.faceMat.uniforms.map.value = O.him.faceMat.uniforms.map.value;
    O.him.pose(t > e9 + .45 ? PS1.ARMS.up(-1) : PS1.ARMS.down(-1), t > e9 + .45 ? PS1.ARMS.up(1) : PS1.ARMS.down(1));
    G.G.visible = his && tq > e9 + .45; G.G.position.set(E + .55, lerp(lerp(.6, .16, out), 0, stand), lerp(lerp(-2.95, -1.6, out), -.35, stand) + walk * 1.25); G.G.rotation.set(lerp(lerp(1.45, 1.52, out), 0, stand), Math.sin(tq * 9) * .05, Math.sin(tq * 7) * .04);
    if (wellGirl) { G.G.visible = true; G.G.position.set(120, .01, 0); G.G.rotation.set(-.38, .4 + Math.sin(tq * 2) * .05, 0); G.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); return; }   // the girl at the bottom of the well, years ago, leaning back to look up at the light
    G.pose(stand > .5 ? PS1.ARMS.reach(-1) : [V(-.24, 1.36, 0), V(-.26, 1.36, .3), V(-.25, 1.34, .62)], stand > .5 ? PS1.ARMS.reach(1) : [V(.24, 1.36, 0), V(.26, 1.36, .3), V(.25, 1.34, .62)]);
  },
});
