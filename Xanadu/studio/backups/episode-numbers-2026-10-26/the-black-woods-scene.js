// GUESS THE HORROR #3, PS1 CUT v3 (2026-10-24: rebuilt to the TikTok playbook and the Hitchhiker look: spoken hook, title card, hidden clue,
// cinematic camera, the film's grade, 540x960) — "The Black Woods" (The Blair Witch Project, never named), built by hand on studio/lib/ps1.js in the
// same style as The Cursed Tape PS1 cut, but with no camcorder overlay. (scene.v1.js is the first build on the prop library.)
// Research (Wikipedia + Blair Witch wiki): three film students (Heather, Mike, Josh) go to Burkittsville, Maryland, Oct 1994, to film a
// documentary about a local witch; locals warn them off the woods. Mike kicks the map into a creek and they keep coming back to the same
// creek. Something circles the tent at night (snapping sticks, children laughing); they wake to stick figures in the trees and piles of
// stones around the tent. Josh vanishes; his screams come from the dark. Heather finds a bundle of twigs wrapped in a scrap of his shirt.
// His voice leads them to an abandoned house with children's handprints on the walls; in the basement Mike stands facing the corner.
// Places (all in one world, far apart, fog hides the rest): the town street (x=0) · the woods + creek (x=60) · the camp (x=90) ·
// the house (x=130) · its basement (x=-40). The case lies on the hood of their car: it opens on "this", the camera cranes up to the
// street, and at the end a dip to black cuts back to it and it snaps shut (the loop seam / thumbnail).
const { P, lerp, eio, eo, clamp, rng, at, st, en, back, V } = PS1;
const M = PS1.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, rep = PS1.rep, grp = PS1.group;

// ---------- textures (tiny, on purpose) ----------
const T = {
  dirt: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a5a44'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a3e2e', 80, .8); noise(q, w, h, r, '#8a7a5e', 40, .6); }),
  grassT: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a5232'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#323a22', 70, .8); noise(q, w, h, r, '#6a6a3e', 40, .6); }),
  leaves: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4e3e28'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e2416', 80, .9); noise(q, w, h, r, '#7a5a2e', 50, .7); noise(q, w, h, r, '#8a6a32', 20, .7); }),
  siding: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#c8bca4'; q.fillRect(0, 0, w, h); q.fillStyle = '#a89c84'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#8a7e68', 20, .6); }),
  siding2: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a9aa0'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a7a80'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#4a5a60', 20, .6); }),
  oldBoards: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a4440'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2622'; for (let x = 3; x < w; x += 4) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#6a625a', 40, .6); noise(q, w, h, r, '#1a1612', 30, .7); }),
  roof: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a2e2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#241c18'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); }),
  roofG: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2a2a2c'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a1a1c'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#3a3a3a', 20, .6); }),
  winLit: PS1.color('#e8c86a'), black: PS1.color('#020203'), skin: PS1.color('#d6a084'), pale: PS1.color('#c8c0b0'),
  paint: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4e5e52'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a4a3e', 30, .6); noise(q, w, h, r, '#6a5a3e', 10, .7); }),
  tyre: PS1.color('#141414'), chrome: PS1.color('#9aa0a4'), glass: PS1.color('#2a3238'), lamp: PS1.color('#f2e6b8'),
  pine: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#1e3226'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#0e1e14', 30, .9); noise(q, w, h, r, '#2e4a34', 14, .8); }),
  bark: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#3e3226'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2018'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  grayBark: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#6a645a'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a443c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  stick: PS1.color('#5a4630'), twine: PS1.color('#b8a87a'),
  stone: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a7870'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a5850', 50, .8); noise(q, w, h, r, '#9a988e', 30, .6); }),
  water: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#26383a'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a7a78'; for (let y = 1; y < h; y += 4) q.fillRect(r() * 8 | 0, y, 6, 1); noise(q, w, h, r, '#162426', 30, .8); }),
  map: tex(16, 12, (q, w, h) => { q.fillStyle = '#e4d8b8'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a8a5a'; q.fillRect(1, 7, 6, 4); q.fillStyle = '#3a6a9a'; q.fillRect(0, 4, w, 1); q.fillStyle = '#b03a2a'; q.fillRect(9, 2, 1, 8); q.fillRect(9, 2, 5, 1); }),
  tent: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#a8642a'; q.fillRect(0, 0, w, h); q.fillStyle = '#8a4e1e'; for (let x = 0; x < w; x += 8) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#c47a36', 20, .6); }),
  cloth: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a3a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a221c'; q.fillRect(0, 3, w, 1); noise(q, w, h, r, '#2a1410', 16, .8); }),
  plaster: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a8274'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a6254', 60, .7); noise(q, w, h, r, '#a49a88', 20, .6); }),
  hands: tex(32, 32, (q, w, h, r) => { q.fillStyle = '#8a8274'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a6254', 200, .7);
    for (let i = 0; i < 9; i++) { const x = 2 + r() * 24 | 0, y = 4 + r() * 22 | 0; q.fillStyle = r() < .5 ? '#3a2418' : '#4a2a1e'; q.fillRect(x, y + 2, 4, 4); for (let f = 0; f < 4; f++) q.fillRect(x + f, y, 1, 2); q.fillRect(x + 4, y + 3, 1, 2); } }),
  cellar: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a564e'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e3a34'; for (let y = 0; y < h; y += 5) { q.fillRect(0, y, w, 1); for (let x = (y / 5 % 2) * 4; x < w; x += 8) q.fillRect(x, y, 1, 5); } noise(q, w, h, r, '#2a2824', 30, .7); }),
  floorC: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a463e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e2a24', 70, .8); noise(q, w, h, r, '#5e5a50', 30, .6); }),
  ceil: PS1.color('#2a2622'), step: tex(16, 8, (q, w, h, r) => { q.fillStyle = '#5a4430'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2a1c'; q.fillRect(0, 0, w, 1); noise(q, w, h, r, '#2a1e14', 12, .7); }),
  camBody: PS1.color('#18181c'), beanie: tex(8, 8, (q, w, h) => { q.fillStyle = '#5a5e66'; q.fillRect(0, 0, w, h); q.fillStyle = '#44484e'; for (let x = 0; x < w; x += 2) q.fillRect(x, 0, 1, h); }),
  coatH: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4e5a48'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#323c2e', 14, .8); }),
  jacketM: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#2e3a4a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1c2430', 14, .8); }),
  flannelJ: tex(8, 8, (q, w, h) => { q.fillStyle = '#7a3a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a1e1a'; q.fillRect(0, 2, w, 1); q.fillRect(0, 6, w, 1); q.fillRect(2, 0, 1, h); q.fillRect(6, 0, 1, h); }),
  coatT: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#6a5a6a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a3e4a', 14, .8); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#33456a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1f2c48', 14, .8); }),
  slacks: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a4238'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e2822', 14, .8); }),
  hairH: tex(8, 16, (q, w, h) => { q.fillStyle = '#3a2618'; q.fillRect(0, 0, w, h); q.fillStyle = '#24160c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  hairM: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a3422'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1c12', 20, .8); }),
  hairJ: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#1a1612'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a2e24', 20, .8); }),
  hairT: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#a8a49c'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#7a7670', 20, .8); }),
  // faces: 24x28, painted like the Ring cut. kind: hea | mik | jos | town; scared opens the eyes and mouth
  face: (kind, scared) => tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    const hair = { hea: '#3a2618', mik: '#4a3422', jos: '#1a1612', town: '#a8a49c' }[kind]; px(kind === 'town' ? '#d8b098' : '#d6a084', 0, 0, 24, 28); px(hair, 0, 0, 24, kind === 'mik' ? 4 : 6);
    if (kind === 'hea' || kind === 'town') { px(hair, 0, 6, 3, kind === 'town' ? 8 : 14); px(hair, 21, 6, 3, kind === 'town' ? 8 : 14); } if (kind === 'jos') { px(hair, 2, 6, 2, 3); px(hair, 19, 6, 3, 2); }
    px('#4a3020', 5, scared ? 8 : 9, 4, 1); px('#4a3020', 15, scared ? 8 : 9, 4, 1); if (scared) { px('#4a3020', 4, 9); px('#4a3020', 19, 9); }
    px('#f4f2ec', 5, 11, 4, scared ? 3 : 2); px('#f4f2ec', 15, 11, 4, scared ? 3 : 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3);
    if (kind === 'town') { px('#b88a74', 4, 14, 3, 1); px('#b88a74', 17, 14, 3, 1); px('#6a3a2e', 9, 21, 6, 1); px('#b88a74', 8, 23, 8, 1); return; }
    if (scared) { px('#3a1612', 10, 20, 4, 3); px('#7a2a24', 11, 21, 2, 1); } else px('#8a4a3a', 9, 21, 6, 1);
    if (kind === 'jos') { px('#3a2a20', 6, 18, 12, 1); px('#3a2a20', 7, 24, 10, 2); } }),
  cover: (() => { const c = document.createElement('canvas'); c.width = 270; c.height = 380; const g = c.getContext('2d'), r = rng(613);   // the redrawn home-video cover, title withheld
    const bg = g.createLinearGradient(0, 0, 0, 380); bg.addColorStop(0, '#0c100c'); bg.addColorStop(1, '#040504'); g.fillStyle = bg; g.fillRect(0, 0, 270, 380); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(160,180,150,${r() * .07})`; g.fillRect(r() * 270, r() * 380, 2 + r() * 16, 1); }
    const cx = 135, cy = 180, R = 64; g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip(); const sky = g.createLinearGradient(0, cy - R, 0, cy + R); sky.addColorStop(0, '#6a7468'); sky.addColorStop(1, '#1c221c'); g.fillStyle = sky; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    for (let i = 0; i < 26; i++) { const x = cx - R + r() * R * 2, wd = 2 + r() * 6; g.fillStyle = `rgba(8,10,8,${.6 + r() * .4})`; g.fillRect(x, cy - R + r() * 30, wd, R * 2); for (let k = 0; k < 3; k++) { g.save(); g.translate(x + wd / 2, cy - R + 20 + r() * 50); g.rotate((r() - .5) * 1.6); g.fillRect(0, 0, 1.5, 14 + r() * 14); g.restore(); } }
    g.strokeStyle = '#e8e4d6'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy - 22); g.lineTo(cx, cy + 14); g.moveTo(cx - 16, cy - 8); g.lineTo(cx + 16, cy - 8); g.moveTo(cx, cy + 14); g.lineTo(cx - 10, cy + 34); g.moveTo(cx, cy + 14); g.lineTo(cx + 10, cy + 34); g.moveTo(cx, cy - 22); g.lineTo(cx, cy - 46); g.stroke(); g.restore();
    g.strokeStyle = '#e8e4d6'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke();
    g.save(); g.translate(cx, cy + 86); g.rotate(-.09); g.strokeStyle = '#d23a2a'; g.lineWidth = 2.5; g.strokeRect(-64, -11, 128, 22); g.fillStyle = '#d23a2a'; g.font = 'bold 13px Rockwell, "Courier New", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TITLE WITHHELD', 0, 1); g.restore();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e9eee6'; g.font = '600 17px "Times New Roman", serif'; g.letterSpacing = '3px'; g.fillText('SOME WOODS', cx, 64); g.fillText('DON\'T LET GO', cx, 86); g.letterSpacing = '0px'; g.fillStyle = '#9aa196'; g.font = 'bold 8px Helvetica'; g.letterSpacing = '2px'; g.fillText('MIDNIGHT PICTURES PRESENTS', cx, 30); g.letterSpacing = '0px';
    g.font = 'italic 11px "Times New Roman", serif'; g.fillStyle = '#e7e9e2'; g.fillText('“Stay out of the woods.”', cx, 290); g.fillStyle = '#b9beb4'; g.font = '500 8px "Avenir Next Condensed", sans-serif'; ['A FILM BY ???', 'STARRING ??? · ??? · ???', 'WRITTEN BY ??? · DIRECTED BY ???'].forEach((s, i) => g.fillText(s, cx, 308 + i * 11));
    g.strokeStyle = '#d7dad0'; g.lineWidth = 1.5; g.strokeRect(14, 344, 70, 26); g.fillStyle = '#f1f2ec'; g.font = 'bold 12px Helvetica'; g.textAlign = 'left'; g.fillText('RATED ?', 20, 357); g.textAlign = 'center'; g.font = 'bold 9px Helvetica'; g.fillText('WIDESCREEN', 175, 357);
    g.save(); g.translate(236, 44); g.rotate(.14); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 24, 0, 6.283); g.fill(); g.strokeStyle = '#c0302a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#c0302a'; g.font = 'bold 5px Arial'; g.fillText('MIDNIGHT VIDEO', 0, -9); g.fillStyle = '#111'; g.font = 'bold 8px Helvetica'; g.fillText('NEW RELEASE', 0, 2); g.font = 'bold 5px Arial'; g.fillText('2 NIGHTS · $3.99', 0, 11); g.restore();
    const sh = g.createLinearGradient(0, 0, 270, 380); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, 270, 380); return c; })(),
  disc: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#a8adb4'; g.beginPath(); g.arc(32, 32, 31, 0, 6.283); g.fill(); g.fillStyle = '#0a0c0a'; g.beginPath(); g.arc(32, 32, 28, 0, 6.283); g.fill();
    g.strokeStyle = '#e8e4d6'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 15, 0, 6.283); g.stroke(); g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(32, 32, 6, 0, 6.283); g.fill(); g.fillStyle = '#101114'; g.beginPath(); g.arc(32, 32, 2.5, 0, 6.283); g.fill(); return c; })(),
};
const diskTex = (() => { const t = new THREE.CanvasTexture(T.disc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();

// ---------- builders ----------
function ground(x, z, w, d, t, k = 1) { add(rep(new THREE.PlaneGeometry(w, d), w / 2 * k, d / 2 * k), M(t), x, 0, z).rotation.x = -Math.PI / 2; }
function pine(x, z, h, s = 1) { add(cyl(.08 * s, .12 * s, h * .3, 5), M(T.bark), x, h * .15, z); for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry((1.0 - k * .25) * s, h * .45, 6), M(T.pine), x, h * (.35 + k * .2), z); }
function bare(x, z, h, seed) { const r = rng(seed), G = grp(x, 0, z); add(cyl(.07, .13, h, 5), M(T.grayBark), 0, h / 2, 0, G);
  for (let k = 0; k < 4; k++) { const b = add(box(.05, h * .32, .05), M(T.grayBark), 0, h * (.5 + k * .12), 0, G); b.rotation.set((r() - .5) * 1.4, r() * 6.283, (r() < .5 ? -1 : 1) * (.5 + r() * .5)); b.translateY(h * .15); } return G; }
// a gable roof: a triangular prism, ridge along z, eaves width w, length d, height h, sitting on y
function roof(G, w, d, h, y, t) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, y, -d / 2); rep(g, .5, .5); return add(g, M(t), 0, 0, 0, G); }
function house(x, z, ry, wallT, lit) { const G = grp(x, 0, z); G.rotation.y = ry; add(box(3.2, 2.6, 3), M(wallT), 0, 1.3, 0, G); roof(G, 3.6, 3.4, 1.3, 2.6, T.roof);
  for (const wx of [-.8, .8]) add(new THREE.PlaneGeometry(.55, .6), M(lit ? T.winLit : T.black, { unlit: !!lit }), wx, 1.7, 1.51, G); add(new THREE.PlaneGeometry(.6, 1.2), M(T.black), 0, .6, 1.51, G); return G; }
function car(x, z) { const G = grp(x, 0, z), p = M(T.paint); add(box(1.7, .55, 4.3), p, 0, .52, 0, G); add(box(1.55, .5, 2.0), p, 0, 1.04, .45, G);
  add(new THREE.PlaneGeometry(1.4, .42), M(T.glass), 0, 1.06, -.56, G).rotation.x = -.35; add(new THREE.PlaneGeometry(1.4, .42), M(T.glass), 0, 1.06, 1.46, G).rotation.x = .35;
  for (const s of [-1, 1]) { add(new THREE.PlaneGeometry(1.7, .36), M(T.glass), s * .78, 1.06, .45, G).rotation.y = s * Math.PI / 2; for (const wz of [-1.4, 1.4]) { const w = add(cyl(.32, .32, .22, 8), M(T.tyre), s * .8, .32, wz, G); w.rotation.z = Math.PI / 2; } add(box(.24, .14, .04), M(T.lamp, { unlit: true }), s * .58, .62, -2.16, G); }
  add(box(1.75, .1, .1), M(T.chrome), 0, .3, -2.17, G); add(box(1.75, .1, .1), M(T.chrome), 0, .3, 2.17, G); return G; }
// a hanging stick man: a spine, an arms crossbar, two splayed legs, bound with twine. Origin at the hang point
function stickMan(x, y, z, s, seed) { const G = grp(x, y, z), r = rng(seed), b = M(T.stick), tw = M(T.twine); add(box(.012, .26, .012), tw, 0, -.13, 0, G);
  add(box(.05, .66, .05), b, 0, -.58, 0, G).rotation.z = (r() - .5) * .1; add(box(.6, .045, .045), b, 0, -.44, .02, G).rotation.z = (r() - .5) * .2;
  for (const sd of [-1, 1]) add(box(.045, .4, .045), b, sd * .08, -.98, 0, G).rotation.z = sd * (.3 + r() * .15); add(box(.09, .09, .09), tw, 0, -.44, .02, G); add(box(.08, .07, .08), tw, 0, -.7, 0, G);
  G.scale.setScalar(s); return G; }
function cairn(x, z, seed) { const r = rng(seed), G = grp(x, 0, z); let y = 0; for (let i = 0; i < 5; i++) { const s = .26 - i * .04; const b = add(box(s, s * .5, s * .9), M(T.stone), (r() - .5) * .03, y + s * .25, 0, G); b.rotation.y = r() * 3; y += s * .5; } return G; }
function tent(x, z, ry) { const G = grp(x, 0, z); G.rotation.y = ry; const s = new THREE.Shape(); s.moveTo(-.95, 0); s.lineTo(.95, 0); s.lineTo(0, 1.15); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: false }); g.translate(0, 0, -1.1); rep(g, .8, .8); G.userData.body = add(g, M(T.tent), 0, 0, 0, G);
  const d = new THREE.Shape(); d.moveTo(-.32, 0); d.lineTo(.32, 0); d.lineTo(0, .78); d.closePath(); add(new THREE.ShapeGeometry(d), M(T.black), 0, .01, 1.105, G); return G; }
function legsWalk(Pn, ph) { const a = Math.sin(ph * 6.283) * .22; Pn.legs([V(-.09, .8, 0), V(-.09, .42, .03 + a * .5), V(-.09, .05, a)], [V(.09, .8, 0), V(.09, .42, .03 - a * .5), V(.09, .05, -a)]); }
function legsStand(Pn) { Pn.legs(PS1.LEGS.stand(-1), PS1.LEGS.stand(1)); }
const ARM_CAM = [V(.24, 1.36, 0), V(.2, 1.32, .26), V(.09, 1.5, .24)], ARM_CAM_L = [V(-.24, 1.36, 0), V(-.16, 1.3, .24), V(-.02, 1.46, .26)];
const ARM_MAP_L = [V(-.24, 1.36, 0), V(-.22, 1.12, .2), V(-.16, 1.08, .42)], ARM_MAP_R = [V(.24, 1.36, 0), V(.22, 1.12, .2), V(.16, 1.08, .42)];
const people = {
  hea: () => { const p = PS1.person({ skin: T.skin, top: T.coatH, legs: T.jeans, hair: T.hairH, face: T.face('hea'), long: .3 }); add(box(.235, .1, .245), M(T.beanie), 0, 1.71, 0, p.G); p.cam = add(box(.07, .09, .16), M(T.camBody), .07, 1.52, .3, p.G); return p; },
  mik: () => PS1.person({ skin: T.skin, top: T.jacketM, legs: T.jeans, hair: T.hairM, face: T.face('mik') }),
  jos: () => PS1.person({ skin: T.skin, top: T.flannelJ, legs: T.jeans, hair: T.hairJ, face: T.face('jos') }),
};

// ---------- the episode ----------
// colour grades matched to the film: drab, desaturated 16mm/Hi8 browns and greens by day, crushed near-black nights lit by a harsh torch
const GR = { town: { lift: [.02, .02, .01], gain: [1.0, .98, .9], sat: .75, contrast: 1.1, temp: .05 }, woods: { lift: [.01, .02, .01], gain: [.95, 1.0, .92], sat: .65, contrast: 1.15, temp: -.05 },
  night: { lift: [-.03, -.03, -.02], gain: [.95, .95, .9], sat: .6, contrast: 1.35, temp: 0 }, house: { lift: [-.02, -.02, -.02], gain: [1.0, .95, .85], sat: .55, contrast: 1.35, temp: .1 } };
PS1.episode({
  camcorder: false, res: 1.5, letterbox: .06, bloom: .36,   // the series look (no REC overlay) + the cinematic layer
  open: ['L1', null, .55],   // playbook: motion from the first frames
  hud(t, S, q) {   // the burned-in title card: frames 0–2.4 s, and back on the closed case at the end, so frame 0 = the last frame = the cover
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - S.lidShut - .2) / .3))); if (a <= 0) return;
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round'; const LW2 = 180;
    const txt = (s, y, size, fill, ls = 0) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.letterSpacing = ls + 'px'; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, LW2, y); q.fillStyle = fill; q.fillText(s, LW2, y); };
    txt('GUESS THE HORROR', 112, 30, '#f2f0ea', 1); txt('#3', 156, 44, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 198, 17, '#ffd23a', 1);
    q.translate(LW2, 232); q.rotate(-.06); q.letterSpacing = '2px'; q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.fillStyle = 'rgba(0,0,0,.55)'; q.fillRect(-90, -12, 180, 24); q.strokeStyle = '#e2342a'; q.lineWidth = 2.5; q.strokeRect(-90, -12, 180, 24); q.fillStyle = '#e2342a'; q.fillText('DIFFICULTY: MEDIUM', 0, 1);
    q.restore(); },
  build(S) { const O = S.O = {};
    // A. the town street: a dirt road, three houses, pines behind, their parked car (the case on its hood), the three, a townswoman
    ground(0, -10, 60, 60, T.grassT, .8); ground(0, -10, 5, 60, T.dirt, 1.2);
    for (const [x, z, ry, t, l] of [[-6.5, -9, .4, T.siding, true], [6.8, -13, -.5, T.siding2, false], [-7.5, -20, .2, T.siding2, true]]) house(x, z, ry, t, l);
    { const r = rng(5); for (let i = 0; i < 46; i++) { const x = (r() - .5) * 40, z = -24 - r() * 14; pine(x, z, 5 + r() * 4, .9 + r() * .5); } }
    O.car = car(0, 0); S.case = PS1.dvdCase(T.cover, diskTex, 0, .8, -1.45, 0); S.caseCam = [V(0, .8 + .62, -1.51 + .001), V(0, .8, -1.51), 40];
    O.aHea = people.hea(); O.aMik = people.mik(); O.aJos = people.jos();
    O.aHea.G.position.set(1.25, 0, -.4); O.aHea.G.rotation.y = .9; O.aMik.G.position.set(-1.3, 0, .6); O.aMik.G.rotation.y = -1.2; O.aJos.G.position.set(1.5, 0, 1.6); O.aJos.G.rotation.y = .4;
    O.clue = stickMan(-4.6, 2.25, -4.6, 1.1, 9); add(box(1.4, .07, .07), M(T.grayBark), -4.6, 2.25, -4.6); add(box(.08, 2.25, .08), M(T.grayBark), -5.25, 1.12, -4.6);   // the hidden clue: a stick man hanging on a porch
    O.town = PS1.person({ skin: T.skin, top: T.coatT, legs: T.slacks, hair: T.hairT, face: T.face('town') }); O.town.G.position.set(-2.4, 0, -7.4); O.town.G.rotation.y = .35;
    // B. the woods (x=60): leaf litter, pines and bare trees, a path, the creek across it at z=-8; the three walking with the camera and the map
    ground(60, -2, 40, 40, T.leaves); { const r = rng(17); for (let i = 0; i < 90; i++) { const x = 60 + (r() - .5) * 36, z = -2 + (r() - .5) * 36; if (Math.abs(x - 60) < 2.4 && z > -12) continue; if (r() < .45) bare(x, z, 5 + r() * 3, i); else pine(x, z, 5 + r() * 4, .8 + r() * .5); } }
    O.creek = add(rep(new THREE.PlaneGeometry(30, 1.8), 12, 1), M(T.water, { unlit: true, tint: '#8a9a9a' }), 60, .02, -8); O.creek.rotation.x = -Math.PI / 2;
    for (const [x, z] of [[58.6, -7.3], [61.3, -8.6], [62.6, -7.6], [57.4, -8.5], [60.2, -7.1]]) add(box(.4, .16, .3), M(T.stone), x, .05, z).rotation.y = x;
    O.mapFloat = add(new THREE.PlaneGeometry(.34, .26), M(T.map, { side: THREE.DoubleSide }), 60.6, .04, -8); O.mapFloat.rotation.x = -Math.PI / 2;
    O.bHea = people.hea(); O.bMik = people.mik(); O.bJos = people.jos(); O.map = add(new THREE.PlaneGeometry(.36, .27), M(T.map, { side: THREE.DoubleSide }), 0, 1.1, .45, O.bMik.G); O.map.rotation.x = -1.0;
    // C. the camp (x=90): a clearing in the pines, the tent, the stick men hanging from branches, the cairns, the bundle
    ground(90, 0, 40, 40, T.leaves); { const r = rng(23); for (let i = 0; i < 80; i++) { const x = 90 + (r() - .5) * 34, z = (r() - .5) * 34; if (Math.hypot(x - 90, z) < 4.5) continue; if (r() < .4) bare(x, z, 5 + r() * 3, i + 40); else pine(x, z, 5 + r() * 4, .8 + r() * .5); } }
    O.tent = tent(90, 0, 0); for (const [x, z, sd] of [[87.2, -2.6, 71], [86.6, .4, 72], [93.4, -1.8, 73], [93.0, 3.4, 74], [88.8, -4.0, 75]]) bare(x, z, 5.5, sd);   // a few trunks at the edge of the torchlight
    O.sticks = grp(0, 0, 0); for (const [x, y, z, s, sd] of [[88.9, 2.3, -1.6, 1.25, 1], [92.2, 2.6, -2.4, 1, 2], [87.4, 2.5, .8, 1, 3], [93.1, 2.4, .6, .9, 4], [89.6, 2.9, -3.6, .9, 5], [91.2, 2.7, -3.2, .8, 6]]) {
      add(box(1.4, .07, .07), M(T.grayBark), x, y, z, O.sticks).rotation.y = sd; const m = stickMan(x, y, z, s, sd); O.sticks.add(m); }
    O.cairns = grp(0, 0, 0); for (const [x, z, sd] of [[89.0, 1.6, 1], [91.0, 1.7, 2], [91.6, -.3, 3], [88.3, -.2, 4], [90.0, 2.4, 5]]) O.cairns.add(cairn(x, z, sd));
    O.bundle = grp(90.6, .02, 1.6); for (let i = 0; i < 7; i++) add(box(.03, .03, .5), M(T.stick), -.09 + i * .03, .03, (i % 2) * .03, O.bundle).rotation.y = (i - 3) * .06; add(box(.24, .07, .22), M(T.cloth), 0, .05, 0, O.bundle); add(box(.25, .075, .03), M(T.twine), 0, .05, .08, O.bundle); O.bundle.rotation.y = .5;
    O.cHea = people.hea(); O.cMik = people.mik(); O.cHea.G.position.set(90.7, 0, 2.2); O.cHea.G.rotation.y = 2.6; O.cMik.G.position.set(89.3, 0, 2.0); O.cMik.G.rotation.y = -2.7;
    // D. the house in the woods (x=130): a dark two-storey wreck among bare trees
    ground(130, 0, 40, 40, T.leaves); { const r = rng(41); for (let i = 0; i < 60; i++) { const x = 130 + (r() - .5) * 34, z = (r() - .5) * 34; if (Math.abs(x - 130) < 5 && z > -6 && z < 10) continue; bare(x, z, 5 + r() * 4, i + 90); } }
    { const G = grp(130, 0, -3); add(box(5, 4.6, 4), M(T.oldBoards), 0, 2.3, 0, G); roof(G, 5.6, 4.4, 1.8, 4.6, T.roofG); for (const [wx, wy] of [[-1.5, 1.3], [1.5, 1.3], [-1.5, 3.4], [1.5, 3.4], [0, 3.4]]) add(new THREE.PlaneGeometry(.7, .8), M(T.black), wx, wy, 2.01, G); add(new THREE.PlaneGeometry(.85, 1.8), M(T.black), 0, .9, 2.01, G); add(box(5.6, .12, 1.2), M(T.oldBoards), 0, .06, 2.6, G); }
    O.dHea = people.hea(); O.dMik = people.mik();
    // E. the basement (x=-40): plaster walls covered in small handprints, stone floor, wooden steps down, him in the far corner
    { const ox = -40; add(rep(new THREE.PlaneGeometry(5, 4.5), 4, 4), M(T.floorC), ox, 0, .25).rotation.x = -Math.PI / 2; add(new THREE.PlaneGeometry(5, 4.5), M(T.ceil), ox, 2.4, .25).rotation.x = Math.PI / 2;
      add(rep(new THREE.PlaneGeometry(5, 2.4), 2, 1), M(T.hands), ox, 1.2, -2); add(rep(new THREE.PlaneGeometry(4.5, 2.4), 2, 1), M(T.hands), ox - 2.5, 1.2, .25).rotation.y = Math.PI / 2; add(rep(new THREE.PlaneGeometry(4.5, 2.4), 2, 1), M(T.cellar), ox + 2.5, 1.2, .25).rotation.y = -Math.PI / 2;
      for (let k = 0; k < 7; k++) add(box(.9, .06, .3), M(T.step), ox + 1.9, .3 + k * .3, 1.9 - k * .3); add(box(.05, 2.4, .05), M(T.stick), ox + 1.4, 1.2, 1.9); }
    O.corner = people.mik(); O.corner.G.position.set(-42.12, 0, -1.62); O.corner.G.rotation.y = -2.36; O.corner.head.rotation.x = .3;
  },
  prepare(S) { S.hits = [at('L6', 'circles'), at('L8', 'vanishes'), en('L11') + .2]; },
  shots: S => { const e11 = en('L11'); return [   // [t0, dur, camera, look, fov] — gentle drift is added by the engine
    [0, 1, V(1.7, 1.55, 3.0), V(-.4, 1.0, -6), 52],                                           // up from the case: the street, the car, the three
    [at('L2', 'students') - .2, .4, V(3.0, 1.5, -1.6), V(.6, 1.1, .6), 48],                    // the three by the car
    [at('L2', 'documentary') - .2, .35, V(2.82, 1.55, -.06), V(1.25, 1.5, -.35), 38, { focus: 1.60, blur: .4 }],            // her and the camera
    [at('L2', 'witch') - .2, .02, V(.2, 2.0, -4), V(-.5, 2.0, -26), 56],                       // CUT: the dark pines past the end of the street
    [at('L3', 'everyone') - .2, .02, V(-1.75, 1.55, -5.6), V(-2.4, 1.48, -7.4), 40, { focus: 1.92, blur: .4 }],           // the townswoman
    [at('L3', 'same') - .1, .02, V(-3.7, 1.75, -2.9), V(-4.6, 1.85, -4.6), 40, { focus: 1.9, blur: .45 }],                 // the hidden clue: a stick man hanging off a porch
    [at('L3', 'stay') - .2, 1.2, V(-1.2, 1.6, -5.2), V(-3.4, 2.4, -24), 52],                   // …past her to the woods
    [st('L4') - .1, .02, V(61.0, 1.6, 12.5), V(60, 1.2, 4), 54],                              // CUT: the woods, three walking in
    [at('L4', 'camera') - .25, .35, V(60.9, 1.5, 3.2), V(60.4, 1.3, 7), 46, { focus: 3.84, blur: .4 }],                   // turning back on them: her camera
    [at('L4', 'map') - .2, .35, V(59.9, 1.35, 3.6), V(59.5, 1.1, 5.4), 40, { focus: 1.86, blur: .4 }],                    // the map in his hands
    [st('L5') - .1, .02, V(62.6, 1.7, -3.4), V(59.6, .9, -8), 52],                             // CUT: the creek
    [at('L5', 'gone') - .2, .35, V(61.8, 1.6, -4.6), V(60.6, .1, -8.2), 48],                    // the map floating away
    [at('L5', 'creek') - .2, .5, V(56.6, 1.4, -5.6), V(61, .7, -8.4), 54],                     // the same creek, again
    [st('L6') - .1, .02, V(92.4, 1.45, 3.6), V(90, .6, 0), 54],                               // CUT: night, the tent
    [at('L6', 'snapping') - .2, .3, V(90.5, 1.55, 2.6), V(86.5, 1.5, -4), 58],                 // the dark trees
    [at('L6', 'laughing') - .2, .3, V(88.4, 1.5, 3.6), V(93, 1.3, -1.5), 58],                    // …turning, into the dark the other way
    [st('L7') - .1, .02, V(89.9, 1.25, .3), V(88.9, 1.6, -1.6), 50],                          // CUT: grey morning, a stick man
    [at('L7', 'trees') - .2, .6, V(90.6, 1.4, 1.4), V(90.4, 2.4, -3), 58],                     // …more of them in the trees
    [at('L7', 'stones') - .2, .35, V(92.0, 1.3, 3.0), V(90.4, .15, 1.5), 50],                  // the piles of stones
    [st('L8') - .1, .02, V(91.9, 1.5, 4.6), V(90, 1.2, 1.6), 54],                             // CUT: night, only two of them
    [at('L8', 'screams') - .2, .35, V(90.2, 1.6, 3.4), V(87, 1.6, -6), 60],                    // into the dark
    [st('L9') - .1, .02, V(91.2, 1.15, 2.7), V(90.6, .05, 1.6), 46, { focus: 1.67, blur: .4 }],                          // CUT: morning, the bundle
    [at('L9', 'wrapped') - .2, 1.2, V(90.85, .75, 2.15), V(90.6, .05, 1.6), 36, { focus: 0.92, blur: .4 }],               // …closer
    [st('L10') - .1, .02, V(132.2, 1.6, 9), V(130, 2.4, -3), 54],                             // CUT: the house
    [at('L10', 'house') - .2, 1.4, V(131.2, 1.6, 5.6), V(130, 1.6, -1), 50],                   // walking up to it
    [at('L10', 'handprints') - .25, .02, V(-40.6, 1.45, .4), V(-41.2, 1.35, -2), 46, { focus: 2.48, blur: .4 }],          // CUT: inside, the handprints
    [st('L11') - .1, .02, V(-38.6, 1.9, 1.5), V(-41.6, 1.0, -1.4), 58],                       // CUT: the basement steps
    [at('L11', 'corner') - .2, 1.6, V(-40.3, 1.55, .2), V(-41.9, 1.2, -1.7), 50],              // closer: him, facing the corner
    [e11 + .2, .25, V(-40.6, .12, -.1), V(-41.8, .45, -1.6), 64],                             // the camera hits the floor
  ]; },
  wob: (t, S) => { const cuts = [at('L2', 'witch') - .2, st('L4') - .1, st('L5') - .1, st('L6') - .1, st('L7') - .1, st('L8') - .1, st('L9') - .1, st('L10') - .1, at('L10', 'handprints') - .25, st('L11') - .1]; return Math.max(...cuts.map(c => t > c - .06 && t < c + .1 ? 1 : 0), t > en('L11') + .2 && t < en('L11') + .5 ? 1 : 0); },
  flash: (t) => { const u = t - at('L8', 'vanishes') + .05; return u > 0 && u < .3 ? (1 - u / .3) * (u < .05 || u > .1 ? .8 : .3) : 0; },
  update(t, S) { const O = S.O, e11 = en('L11'), c = S.camera.position;
    const town = t < st('L4') - .1 || t >= S.cutBack, woods = !town && t < st('L6') - .1, camp = !town && t >= st('L6') - .1 && t < st('L10') - .1, house = !town && t >= st('L10') - .1 && t < at('L10', 'handprints') - .25, base = !town && t >= at('L10', 'handprints') - .25;
    const morning = camp && ((t >= st('L7') - .1 && t < st('L8') - .1) || t >= st('L9') - .1), night = camp && !morning, dropped = base && t > e11 + .2;
    const off = [0, -50, 0], none = [0, 0, 0];
    S.grade = t >= S.cutBack ? PS1.GRADES.neutral : t < 1.6 ? PS1.mixGrade(PS1.GRADES.neutral, GR.town, clamp((t - .5) / 1.0)) : town ? GR.town : woods || morning ? GR.woods : house || base ? GR.house : GR.night;
    // light per place: fog colour/near/far, ambient, then 1 = the sun / a flashlight at the camera, 2 = the lantern in the tent
    if (town) { S.U.fogColor.value.set('#b4ad9c'); S.U.fogNear.value = 6; S.U.fogFar.value = 36; S.U.amb.value.setRGB(.5, .47, .42); PS1.light(1, [-14, 18, 12], [.9, .82, .66], 60); PS1.light(2, off, none); PS1.light(3, off, none); }
    else if (woods) { S.U.fogColor.value.set('#8c928a'); S.U.fogNear.value = 2; S.U.fogFar.value = 17; S.U.amb.value.setRGB(.38, .4, .4); PS1.light(1, [70, 20, 10], [.5, .52, .5], 60); PS1.light(2, off, none); PS1.light(3, off, none); }
    else if (morning) { S.U.fogColor.value.set('#7c827e'); S.U.fogNear.value = 1.5; S.U.fogFar.value = 14; S.U.amb.value.setRGB(.32, .33, .34); PS1.light(1, [c.x, c.y + .1, c.z], [.5, .5, .46], 8); PS1.light(2, off, none); PS1.light(3, off, none); }
    else if (night || house) { S.U.fogColor.value.set('#04060a'); S.U.fogNear.value = 1.5; S.U.fogFar.value = house ? 15 : 13; S.U.amb.value.setRGB(.05, .06, .09); PS1.light(1, [c.x, c.y + .1, c.z], [1.7, 1.6, 1.3], house ? 14 : 12);
      const lantern = night && t < st('L7') - .1, fl = .8 + .2 * Math.sin(t * 23) * Math.sin(t * 7); PS1.light(2, lantern ? [90, .5, 0] : off, [1.4 * fl, 1.0 * fl, .5 * fl], 3.2); PS1.light(3, off, none); }
    else { S.U.fogColor.value.set('#030304'); S.U.fogNear.value = 1; S.U.fogFar.value = 8; S.U.amb.value.setRGB(.05, .05, .06); PS1.light(1, dropped ? [-40.6, .15, -.1] : [c.x, c.y + .1, c.z], [1.7, 1.6, 1.3], dropped ? 5 : 7); PS1.light(2, off, none); PS1.light(3, off, none); }
    // A. the street: they stand by the car, she films; the townswoman watches them
    for (const p of [O.aHea, O.aMik, O.aJos]) { p.G.visible = town; legsStand(p); } O.aHea.pose(ARM_CAM_L, ARM_CAM); O.aMik.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); O.aJos.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); O.town.G.visible = town; O.town.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1));
    // B. the woods: they walk in single file, then stop at the creek; the map is in his hands, then floating downstream
    const wk = clamp((t - st('L4') + .1) / (at('L5', 'gone') - st('L4'))), wz = lerp(9, -5.6, eio(wk)), walking = woods && wk < 1;
    [[O.bHea, .5, 0], [O.bMik, -.4, 1.1], [O.bJos, .2, 2.1]].forEach(([p, dx, dz], i) => { p.G.visible = woods; p.G.position.set(60 + dx, 0, wz + dz); p.G.rotation.y = Math.PI; if (walking) legsWalk(p, t * 1.4 + i * .33); else legsStand(p); });
    O.bHea.pose(ARM_CAM_L, ARM_CAM); O.bJos.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); O.map.visible = t < at('L5', 'gone') - .3; if (O.map.visible) O.bMik.pose(ARM_MAP_L, ARM_MAP_R); else O.bMik.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1));
    O.mapFloat.visible = woods && t >= at('L5', 'gone') - .3; O.mapFloat.position.x = 60.6 + Math.max(0, t - at('L5', 'gone')) * .5; O.creek.material.uniforms.uvOff.value.x = t * .25;
    // C. the camp: the tent shakes at night with the lantern inside; by morning the stick men and stones; then two of them, then the bundle
    O.tent.rotation.z = night && t < st('L7') - .1 && t > at('L6', 'circles') - .1 ? Math.sin(t * 40) * .02 : 0; O.sticks.visible = O.cairns.visible = camp && t >= st('L7') - .1;
    O.sticks.children.forEach((m, i) => { if (m.type === 'Group') m.rotation.y = Math.sin(t * .8 + i) * .4; });
    O.cHea.G.visible = O.cMik.G.visible = camp && t >= st('L7') - .1; legsStand(O.cHea); legsStand(O.cMik); const scared = t > at('L8', 'screams') - .3;
    O.cHea.pose(scared ? PS1.ARMS.up(-1) : ARM_CAM_L, scared ? PS1.ARMS.up(1) : ARM_CAM); O.cMik.pose(scared ? PS1.ARMS.up(-1) : PS1.ARMS.down(-1), scared ? PS1.ARMS.up(1) : PS1.ARMS.down(1));
    if (t >= st('L9') - .1) { O.cMik.G.visible = false; O.cHea.G.position.set(89.7, -.35, 1.3); O.cHea.G.rotation.y = 1.25; O.cHea.pose(PS1.ARMS.reach(-1), PS1.ARMS.reach(1)); } else { O.cHea.G.position.set(90.7, 0, 2.2); O.cHea.G.rotation.y = 2.6; }
    O.cHea.faceMat.uniforms.map.value = t > st('L6') ? (O.heaScared = O.heaScared || T.face('hea', true)) : O.cHea.faceMat.uniforms.map.value; O.bundle.visible = camp && t >= st('L9') - .1;
    // D. the house: the two walk up to it
    const hk = eio(clamp((t - st('L10') + .1) / 2.2)); [[O.dHea, .5], [O.dMik, -.5]].forEach(([p, dx], i) => { p.G.visible = house; p.G.position.set(130 + dx, 0, lerp(5, 1.4, hk)); p.G.rotation.y = Math.PI; if (hk < 1) legsWalk(p, t * 1.3 + i * .5); else legsStand(p); });
    O.dHea.pose(ARM_CAM_L, ARM_CAM); O.dMik.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1));
    // E. the basement: he is just standing in the corner, completely still
    O.corner.G.visible = base && t >= st('L11') - .1; legsStand(O.corner); O.corner.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1));
  },
});
