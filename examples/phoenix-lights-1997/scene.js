// CONSPIRACY #2 — The Phoenix Lights (1997), on the woodcut engine (../../lib/woodcut.js).
// Beats: sunset over Phoenix → people step out and freeze → a giant V, lights pop on "five, six, seven" → silent, a mile wide,
// stars vanish behind it → map: 300 miles Nevada → Prescott → Phoenix → 10 o'clock clock, a row of orange orbs over the
// mountains → camcorders, REC → "FLARES" stamp, A-10s fly over and chutes open, the real USAF photo → press conference,
// the aide in an alien costume → everyone laughs → 2007: the governor alone, looking up → flares sink vs. the V blotting
// out the stars → fold back into the broadsheet.
const { P, lerp, eo, eio, back, clamp, rng, at, st, en, C } = WC;
const { INK, RED, BLOOD, BLUE, GREEN, GOLD, OCHRE } = C;
const W = WC.W, H = WC.H;

// ---------- episode drawings ----------
const V_POLY = [[-600, -330], [-480, -330], [0, 90], [480, -330], [600, -330], [0, 330]];   // nose down, wings spread
const V_LIGHTS = [[0, 292], [-190, 96], [190, 96], [-375, -112], [375, -112], [-552, -312], [552, -312]];   // nose, pairs out to the wing tips
const VW = 4.6, VS = VW / 1300;
function drawV(g) {
  WC.wash(g, V_POLY, '#1d1922', 77, 1, 3);
  g.save(); g.beginPath(); V_POLY.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.strokeStyle = 'rgba(150,160,195,.28)'; g.lineWidth = 2;
  for (let o = -900; o < 900; o += 14) { g.beginPath(); g.moveTo(o, -340); g.lineTo(o + 340, 340); g.stroke(); } g.restore();
  for (const s of [-1, 1]) WC.inkLine(g, [[s * 40, 230], [s * 520, -300]], 2, 'rgba(150,160,195,.5)', 78 + s);
  WC.inkPoly(g, V_POLY, 7, INK, 79);
}
// the craft's underside (texture for the 3-D model): dark plating, pale panel lines, light sockets, a pale rim so it reads against the night
function drawUnderside(g) {
  WC.wash(g, V_POLY, '#1f1b26', 81, 1, 0);
  g.save(); g.beginPath(); V_POLY.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.strokeStyle = 'rgba(150,160,195,.22)'; g.lineWidth = 2;
  for (let o = -900; o < 900; o += 13) { g.beginPath(); g.moveTo(o, -340); g.lineTo(o + 340, 340); g.stroke(); } g.restore();
  for (const s of [-1, 1]) for (const [a, b] of [[[s * 40, 236], [s * 520, -300]], [[s * 18, 168], [s * 470, -318]], [[s * 60, 288], [s * 566, -316]]]) WC.inkLine(g, [a, b], 2.2, 'rgba(160,170,205,.5)', 82 + a[0]);
  for (const [x, y] of V_LIGHTS) { WC.shape(g, WC.circ(x, y, 36, 16), '#0d0b10', 3, 90 + x); WC.inkLine(g, WC.circ(x, y, 36, 16), 2, 'rgba(205,214,236,.6)', 91 + x); }
  WC.inkPoly(g, V_POLY, 12, 'rgba(205,214,236,.55)', 95); WC.inkPoly(g, V_POLY, 4, INK, 96);
}
// the craft is a real 3-D object: a chevron in its own XY plane (nose toward local -Y), underside = local -Z
function buildCraft(S) {
  const shape = new THREE.Shape(); V_POLY.forEach(([x, y], i) => i ? shape.lineTo(x * VS, -y * VS) : shape.moveTo(x * VS, -y * VS));
  const grp = new THREE.Group(), side = new THREE.MeshBasicMaterial({ color: '#141118' }); S.TINT_SKY.push(side);
  grp.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .16, bevelEnabled: false }), side));
  const c = WC.cnv(1300, 760), g = c.getContext('2d'); g.translate(650, 380); drawUnderside(g);
  const tex = WC.texOf(c); tex.repeat.set(1 / (1300 * VS), 1 / (760 * VS)); tex.offset.set(.5, .5);   // ShapeGeometry UVs are the shape's own x/y
  const um = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }); S.TINT_SKY.push(um);
  const under = new THREE.Mesh(new THREE.ShapeGeometry(shape), um); under.position.z = -.004; grp.add(under);
  grp.visible = false; S.scene.add(grp); return grp;
}
const L3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
// where the craft is: sweeps in high from the north-west (L3), hovers over the town (L4), drifts in and passes right over our heads (L5);
// a ghost of its lights for 2007 (L11); crosses the sky again, blotting out the stars (L12)
function craftState(t, S) {
  const g0 = at('L3', 'giant') - .5;
  if (t > g0 && t < en('L5') + 1) {
    const k1 = eio(P(t, g0, 1.9)), k2 = P(t, g0 + 1.9, st('L5') - g0 - 1.9), k3 = eio(P(t, st('L5'), at('L5', 'over') - st('L5'))), tp = at('L5', 'phoenix') + .4,
      k4 = eio(P(t, at('L5', 'over'), tp - at('L5', 'over'))), k5 = eio(P(t, tp, en('L5') + 1 - tp));
    const p = L3(L3(L3(L3(L3([-4.4, -1.4, 11.6], [0, -3.0, 6.6], k1), [.25, -4.2, 6.5], k2), [.35, -6.2, 6.4], k3), [.7, -13.4, 6.3], k4), [1.2, -24, 7.2], k5);
    const nLit = t < at('L3', 'five') - .05 ? 0 : t < at('L3', 'six') - .05 ? 5 : t < at('L3', 'seven') - .05 ? 6 : 7;
    return { p, yaw: lerp(-.7, 0, k1) + .12 * k4, pitch: lerp(-.5, -.42, k2) * (1 - k4 * .6), body: 1, nLit, lit: 1, intro: true };
  }
  if (t > at('L11', 'saw') - .6 && t < en('L11') + .8) return { p: [0, -3.4, 6.6], yaw: 0, pitch: -.45, body: 0, nLit: 7, lit: P(t, at('L11', 'saw') - .6, .5) * (1 - P(t, en('L11') + .3, .5)) * .85 };
  if (t > at('L12', 'and') - .5 && t < S.closeUp + .6) { const k1 = eio(P(t, at('L12', 'and') - .5, at('L12', 'stars') - at('L12', 'and') + .3)), k2 = eio(P(t, at('L12', 'stars') + .5, S.closeUp + .1 - at('L12', 'stars')));
    return { p: L3(L3([-6.5, -2.8, 7.6], [0, -3.2, 6.9], k1), [6.6, -3.6, 7.4], k2), yaw: Math.PI / 2, pitch: -.42, body: 1, nLit: 7, lit: 1 }; }
  return null;
}
// how strongly its lights wash over the town (0..1)
function craftGlow(t, S) { const c = craftState(t, S); if (!c || !c.body) return 0; const d = Math.hypot(c.p[0], c.p[1] + 4.5, c.p[2] - 2); return clamp(1.8 - d / 4.5) * c.nLit / 7; }
function glowBandTex() { const c = WC.cnv(512, 128), g = c.getContext('2d'), gr = g.createRadialGradient(256, 128, 10, 256, 128, 260); gr.addColorStop(0, 'rgba(255,170,95,.55)'); gr.addColorStop(1, 'rgba(255,170,95,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 128); return WC.texOf(c); }
function drawA10(g, seed) {   // side view, nose right
  const grey = '#8e969c', fus = [[-380, 6], [-300, -10], [180, -16], [320, -12], [400, 4], [330, 22], [-300, 24]];
  WC.block(g, [[-440, 12], [-300, 10], [-300, 22], [-440, 20]], grey, 3, seed);                                  // tailplane
  WC.block(g, [[-390, 8], [-425, -92], [-380, -96], [-340, -4]], grey, 3.5, seed + 1);                           // fin
  WC.wash(g, fus, grey, seed + 2, .98, 2); WC.hatchIn(g, fus, -380, 8, 400, 26, 6, 0, 1.3, .45, seed + 3); WC.inkPoly(g, fus, 4, INK, seed + 4);
  WC.block(g, [[-200, -14], [-160, -40], [-130, -40], [-120, -14]], grey, 3, seed + 5);                          // pylon
  WC.shape(g, WC.ell(-170, -52, 84, 26, 0, 18), grey, 3.5, seed + 6); WC.shape(g, WC.ell(-92, -52, 10, 22, 0, 10), '#3a3a42', 2.5, seed + 7);   // engine pod
  WC.block(g, [[-60, 16], [130, 14], [140, 28], [-50, 30]], '#5d646a', 3, seed + 8);                            // wing edge-on
  WC.shape(g, WC.ell(240, -20, 44, 17, 0, 14), '#9fb3cf', 3, seed + 9);                                        // canopy
  g.fillStyle = BLOOD; g.beginPath(); g.moveTo(318, -2); g.quadraticCurveTo(370, 4, 392, 6); g.quadraticCurveTo(360, 22, 316, 20); g.closePath(); g.fill();   // shark mouth
  g.fillStyle = '#f4efe4'; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(326 + k * 11, 8); g.lineTo(331 + k * 11, 15); g.lineTo(336 + k * 11, 8); g.fill(); }
  WC.inkLine(g, [[400, 4], [436, 6]], 4, INK, seed + 10);                                                      // gun barrel
}
function drawChute(g) {
  const dome = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; dome.push([Math.cos(a) * 100, -60 + Math.sin(a) * 70]); }
  WC.wash(g, [...dome, [100, -50], [60, -44], [20, -40], [-20, -40], [-60, -44], [-100, -50]], '#efe9dc', 91, 1, 2);
  for (let k = -2; k <= 2; k++) WC.inkLine(g, [[0, -130], [k * 42, -76], [k * 46, -44]], 1.6, 'rgba(42,31,24,.55)', 92 + k);
  WC.inkLine(g, [...dome, [60, -44], [20, -40], [-20, -40], [-60, -44], [-100, -50]], 3.5, INK, 98);
  for (const x of [-100, -50, 0, 50, 100]) WC.inkLine(g, [[x, -44], [0, 120]], 1.6, INK, 99 + x);
}
function drawPodium(g) {
  const wood = '#8a5a34', body = [[60, 110], [320, 110], [300, 450], [80, 450]];
  WC.block(g, body, wood, 4, 501); WC.hatchIn(g, body, 200, 110, 330, 450, 8, 0, 1.4, .45, 502);
  WC.block(g, [[30, 62], [350, 62], [330, 112], [50, 112]], '#6b4426', 4, 503);
  // the Arizona flag as a seal: 13 rays over blue, a copper star
  const cx = 190, cy = 270, R = 84; g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip(); g.fillStyle = BLUE; g.fillRect(cx - R, cy, 2 * R, R);
  for (let k = 0; k < 13; k++) { const a0 = Math.PI + k / 13 * Math.PI, a1 = a0 + Math.PI / 13; g.fillStyle = k % 2 ? '#e2b04e' : '#b9563c'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fill(); } g.restore();
  const star = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 15 : 36; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }); WC.block(g, star, '#b87333', 3, 504);
  WC.inkLine(g, WC.circ(cx, cy, R, 30), 4, INK, 505);
  for (const [x0, x1, y1] of [[170, 140, 8], [210, 238, 12]]) { WC.inkLine(g, [[x0, 62], [x1, y1 + 14]], 4, '#3a3a42', 506 + x0); WC.shape(g, WC.ell(x1, y1, 12, 16, 0, 12), '#3a3a42', 2.5, 507 + x0); }
}
function phoenixArt() {
  const CW = 1536, CH = 537, c = WC.cnv(CW, CH), g = c.getContext('2d'), r = rng(500);
  WC.mountains(g, [[0, 300], [80, 250], [160, 205], [230, 172], [290, 214], [340, 200], [420, 262], [520, 304]], '#8f7a8a', 501, 430);    // Camelback
  WC.mountains(g, [[440, 330], [600, 272], [760, 252], [900, 244], [1060, 262], [1200, 232], [1340, 254], [1536, 300]], '#a88470', 502, 430);   // South Mountain / Estrellas
  for (const [x, w, top] of [[610, 62, 196], [680, 54, 150], [742, 80, 112], [830, 58, 160], [896, 70, 206], [974, 48, 236]]) WC.office(g, x, w, top, 450, x + 3);
  let x = 0; while (x < CW) { const w = 70 + r() * 60; WC.house(g, x, w, 40 + r() * 34, 474, (x | 0) + 11, true); x += w + 4; }
  WC.palm(g, 330, 474, 230, 601); WC.palm(g, 1180, 474, 250, 602); WC.palm(g, 1290, 474, 200, 603); WC.palm(g, 222, 474, 180, 604);
  const bank = [[0, CH], [0, 470], [400, 462], [800, 474], [1200, 464], [CW, 472], [CW, CH]]; WC.wash(g, bank, '#d4ad74', 610, .96, 3); WC.hatchIn(g, bank, 0, 462, CW, CH, 9, -.5, 1.4, .35, 611); WC.inkLine(g, bank.slice(1, -1), 4, INK, 612);
  WC.saguaro(g, 140, 528, 120, 620); WC.saguaro(g, 470, 532, 96, 621); WC.saguaro(g, 1420, 528, 130, 622);
  return WC.cutout(c, 7);
}
const SKINS = ['#efd6b0', '#d9a77a', '#b67b52', '#8a5a3c', '#f1d2b4'];
const M = o => ({ era: 'modern', ...o });   // modern (fitted) woodcut people — dressed for March 1997 in Phoenix
// the front crowd: a windbreaker, a denim jacket, a Suns jersey, a flannel, a cowboy hat, a kid in a backwards cap, Grandpa in a sweater, a hoodie
const FOLK = [
  [250, 1520, false, { top: 'windbreaker', topCol: '#2f8a8a', top2: '#6e2f8a', top3: '#e86aa0', hair: 'short', hairCol: '#3a2616', hat: 'ball', hatCol: BLOOD }],
  [372, 1600, false, { top: 'denim', topCol: '#5d7fa6', inner: '#f1ede2', bottomCol: '#3d4f70', hair: 'big', hairCol: '#7a3a1e' }],
  [470, 1500, false, { top: 'jersey', topCol: '#4b2a7a', top2: '#e8762a', number: 7, bottom: 'shorts', bottomCol: '#4b2a7a', baggy: true, hair: 'flat', hairCol: '#1e1612' }],
  [600, 1590, true, { top: 'flannel', topCol: '#b03a2e', top2: '#1e1612', hair: 'ponytail', hairCol: '#c9a24a', scrunchie: '#e86aa0' }],
  [700, 1505, true, { top: 'denim', topCol: '#4f6f98', inner: '#e8dcc0', bottomCol: '#3d4f70', shoes: 'cowboy', hat: 'cowboy', hatCol: '#c9a878', mustache: '#5a3a22', hair: 'short', hairCol: '#5a3a22' }],
  [826, 1600, true, { top: 'tee', topCol: '#e2b04e', top2: '#2f8a8a', bottom: 'shorts', bottomCol: '#3d5a7a', baggy: true, hat: 'ballBack', hatCol: '#3d5a7a', hair: 'short', h: 1.7 }],
  [935, 1520, true, { top: 'sweater', topCol: '#7b6a5a', top2: '#c9a640', bottom: 'slacks', bottomCol: '#5a5040', shoes: 'dress', hair: 'bald', hairCol: '#9a8a7a', glasses: '#2a1d14' }],
  [520, 1690, false, { top: 'hoodie', topCol: '#6e2f8a', top2: '#5a2672', hair: 'long', hairCol: '#2a1d14' }]];
const BACK_LOOKS = [{ top: 'tee', topCol: '#c9653a', hair: 'short' }, { top: 'flannel', topCol: '#3d5a7a', top2: '#1e1612', hair: 'long', hairCol: '#5a3a22' }, { top: 'windbreaker', topCol: '#e2b04e', top2: '#2f8a8a', top3: '#9c3a2a', hat: 'ball', hatCol: '#3d5a7a' },
  { top: 'hoodie', topCol: '#7b7466', hair: 'curly' }, { top: 'denim', topCol: '#5d7fa6', hair: 'big', hairCol: '#2a1d14' }, { top: 'jersey', topCol: '#4b2a7a', top2: '#e8762a', number: 34, hair: 'buzz' },
  { top: 'sweater', topCol: '#4f7a5a', top2: '#efd6b0', hair: 'bob', hairCol: '#c9a24a' }, { top: 'tee', topCol: '#f1ede2', top2: BLOOD, hat: 'ballBack', hatCol: BLOOD, hair: 'short' },
  { top: 'dress', topCol: '#6e2f45', top2: '#f1e6c9', hair: 'long', hairCol: '#7a3a1e' }, { top: 'windbreaker', topCol: '#3d5a7a', top2: '#e86aa0', top3: '#f1ede2', hair: 'mullet', hairCol: '#5a3a22' }];
const ORB_X = Array.from({ length: 9 }, (_, i) => -2.3 + i * .575), orbZ = i => 2.5 + .1 * Math.sin(i * 1.7);

// ---------- 1997 props: the street, two 90s cars, the press stage ----------
function streetArt(g, w, h) {   // ground layer: canvas top = the curb by the skyline (y -2.2), bottom = near the camera (y -13)
  const r = rng(77);
  WC.wash(g, [[0, 0], [w, 0], [w, 58], [0, 58]], '#cfc6b4', 1, .9, 0); for (let x = 0; x < w; x += 64) WC.inkLine(g, [[x, 4], [x + 2, 56]], 1.5, 'rgba(42,31,24,.45)', 2 + x);   // sidewalk
  WC.inkLine(g, [[0, 60], [w, 62]], 5, INK, 3);
  WC.wash(g, [[0, 62], [w, 62], [w, 330], [0, 330]], '#55565e', 4, .95, 0); WC.hatchIn(g, [[0, 62], [w, 62], [w, 330], [0, 330]], 0, 62, w, 330, 9, -.2, 1.3, .3, 5);   // asphalt
  for (let x = 20; x < w; x += 110) { g.fillStyle = '#e8c14a'; g.fillRect(x, 192, 62, 9); }   // centre line
  for (const y of [74, 318]) { g.fillStyle = 'rgba(240,236,224,.85)'; g.fillRect(0, y, w, 5); }
  for (let i = 0; i < 9; i++) { const x = r() * w, y = 80 + r() * 230; WC.inkLine(g, [[x, y], [x + 20 + r() * 40, y + (r() - .5) * 18], [x + 50 + r() * 50, y + (r() - .5) * 26]], 1.4, 'rgba(20,20,24,.5)', 10 + i); }   // cracks
  WC.inkLine(g, [[0, 330], [w, 334]], 4, INK, 30);
  WC.wash(g, [[0, 334], [w, 334], [w, h], [0, h]], '#c9a878', 31, .95, 0); WC.hatchIn(g, [[0, 334], [w, 334], [w, h], [0, h]], 0, 334, w, h, 12, -.6, 1.3, .25, 32);   // desert shoulder
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < .5 ? '90,70,45' : '240,228,200'},${.25 + r() * .4})`; g.beginPath(); g.arc(r() * w, 340 + r() * (h - 340), 1 + r() * 3, 0, 6.283); g.fill(); }
  for (let i = 0; i < 14; i++) { const x = r() * w, y = 380 + r() * (h - 420); for (let k = 0; k < 7; k++) WC.inkLine(g, [[x, y], [x + Math.cos(k * .9 - 2.6) * 18, y + Math.sin(k * .9 - 2.6) * 14]], 2, '#6f8a4a', 40 + i * 9 + k); }   // brush
}
function drawTruck(g) {   // a 1990s pickup, side view, nose right; wheels touch the bottom of the canvas
  const col = '#a8402e', body = [[60, 340], [60, 230], [470, 230], [500, 160], [640, 150], [700, 240], [930, 250], [950, 340]];
  WC.block(g, body, col, 4, 401); WC.hatchIn(g, body, 60, 280, 950, 340, 7, 0, 1.3, .35, 402);
  WC.block(g, [[520, 170], [630, 164], [672, 236], [512, 236]], '#9fb3cf', 3, 403); WC.inkLine(g, [[70, 245], [460, 245]], 3, INK, 404);
  WC.inkLine(g, [[505, 240], [505, 330]], 2.5, INK, 405); WC.inkLine(g, [[690, 245], [690, 330]], 2.5, INK, 406); WC.block(g, [[640, 262], [668, 262], [668, 270], [640, 270]], '#d8d0c0', 1.5, 407);
  WC.block(g, [[920, 320], [968, 320], [968, 346], [920, 346]], '#cfcfcf', 3, 408); WC.block(g, [[40, 320], [76, 320], [76, 346], [40, 346]], '#cfcfcf', 3, 409);
  WC.block(g, [[928, 258], [952, 260], [952, 284], [928, 282]], '#fff1b8', 2.5, 410); WC.block(g, [[60, 246], [74, 246], [74, 276], [60, 276]], BLOOD, 2, 411);
  for (const x of [220, 790]) { WC.shape(g, WC.circ(x, 352, 62, 22), '#22201e', 4, 412 + x); WC.shape(g, WC.circ(x, 352, 28, 16), '#bdbdbd', 3, 413 + x); }
}
function drawSedan(g) {   // a 1990s sedan, nose right
  const col = '#3d7a78', body = [[40, 330], [56, 262], [250, 246], [330, 172], [600, 166], [710, 244], [930, 262], [958, 330]];
  WC.block(g, body, col, 4, 421); WC.hatchIn(g, body, 40, 290, 958, 330, 7, 0, 1.3, .35, 422);
  WC.block(g, [[350, 184], [460, 180], [460, 242], [290, 246]], '#9fb3cf', 3, 423); WC.block(g, [[476, 180], [590, 178], [680, 240], [476, 242]], '#9fb3cf', 3, 424);
  WC.inkLine(g, [[468, 182], [470, 324]], 3, INK, 425); WC.inkLine(g, [[60, 290], [940, 296]], 2, 'rgba(240,236,224,.6)', 426);
  WC.block(g, [[930, 268], [954, 270], [954, 290], [930, 288]], '#fff1b8', 2.5, 427); WC.block(g, [[44, 268], [60, 268], [60, 290], [44, 290]], BLOOD, 2, 428);
  for (const x of [210, 780]) { WC.shape(g, WC.circ(x, 344, 60, 22), '#22201e', 4, 429 + x); WC.shape(g, WC.circ(x, 344, 26, 16), '#bdbdbd', 3, 430 + x); }
}
function drawBackdrop(g) {   // the press-room backdrop: navy curtain, a big seal, the U.S. and Arizona flags
  WC.block(g, [[20, 696], [20, 60], [880, 60], [880, 696]], '#26325c', 4, 501);
  for (let x = 40; x < 880; x += 44) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, 64, 14, 630); WC.inkLine(g, [[x + 22, 66], [x + 25, 692]], 1.5, 'rgba(170,180,220,.35)', 502 + x); }
  const val = []; for (let x = 20; x <= 880; x += 54) val.push([x, 60], [x + 27, 118]); val.push([880, 60]); WC.wash(g, [[20, 40], [880, 40], ...val.reverse()], BLOOD, 503, 1, 0); WC.inkLine(g, [[20, 44], [880, 44]], 6, GOLD, 504);
  const cx = 450, cy = 340; WC.shape(g, WC.circ(cx, cy, 158, 40), '#e6c879', 5, 505); WC.shape(g, WC.circ(cx, cy, 116, 36), '#26325c', 3, 506);
  g.save(); g.beginPath(); g.arc(cx, cy, 112, 0, 6.283); g.clip(); g.fillStyle = BLUE; g.fillRect(cx - 120, cy, 240, 120);
  for (let k = 0; k < 13; k++) { const a0 = Math.PI + k / 13 * Math.PI; g.fillStyle = k % 2 ? OCHRE : RED; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 116, a0, a0 + Math.PI / 13); g.closePath(); g.fill(); } g.restore();
  const star = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 20 : 48; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }); WC.block(g, star, '#b87333', 3, 507);
  g.font = `bold 30px "Times New Roman", serif`; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  const arcText = (txt, r0, a0, dir) => { const step = .2; [...txt].forEach((ch, i) => { const a = a0 + dir * (i - (txt.length - 1) / 2) * step; g.save(); g.translate(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.rotate(a + (dir > 0 ? Math.PI / 2 : -Math.PI / 2)); g.fillText(ch, 0, 0); g.restore(); }); };
  arcText('STATE OF', 137, -Math.PI / 2, 1); arcText('ARIZONA', 137, Math.PI / 2, -1);
  // flags on poles
  for (const [px, us] of [[96, true], [804, false]]) { WC.inkLine(g, [[px, 696], [px, 130]], 9, '#8a6a3a', 510 + px); g.fillStyle = GOLD; g.beginPath(); g.arc(px, 124, 12, 0, 6.283); g.fill();
    const fx = us ? px + 6 : px - 186, fl = [[fx, 150], [fx + 180, 160], [fx + 180, 280], [fx, 270]];
    if (us) { g.save(); g.beginPath(); fl.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); for (let k = 0; k < 13; k++) { g.fillStyle = k % 2 ? '#f1ede2' : BLOOD; g.fillRect(fx, 150 + k * 10, 182, 10); } g.fillStyle = '#2c3f78'; g.fillRect(fx, 150, 80, 66); g.fillStyle = '#f1ede2'; for (let k = 0; k < 12; k++) { g.beginPath(); g.arc(fx + 12 + (k % 4) * 18, 164 + Math.floor(k / 4) * 18, 3, 0, 6.283); g.fill(); } g.restore(); }
    else { g.save(); g.beginPath(); fl.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.fillStyle = BLUE; g.fillRect(fx, 215, 182, 80); for (let k = 0; k < 13; k++) { const a0 = Math.PI + k / 13 * Math.PI; g.fillStyle = k % 2 ? OCHRE : RED; g.beginPath(); g.moveTo(fx + 90, 215); g.arc(fx + 90, 215, 140, a0, a0 + Math.PI / 13); g.closePath(); g.fill(); } WC.block(g, Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 9 : 22; return [fx + 90 + Math.cos(a) * rr, 215 + Math.sin(a) * rr]; }), '#b87333', 2, 520); g.restore(); }
    WC.inkPoly(g, fl, 3.5, INK, 521 + px); }
}
// the stage: a low wooden platform with red-white-and-blue bunting, and three steps on the right
function buildStage(S) {
  const grp = new THREE.Group(), front = WC.cnv(1024, 128), fg = front.getContext('2d'), top = WC.cnv(512, 128), tg = top.getContext('2d');
  fg.fillStyle = '#8a5a34'; fg.fillRect(0, 0, 1024, 128); for (let x = 0; x < 1024; x += 64) WC.inkLine(fg, [[x, 0], [x + 1, 128]], 2, INK, 600 + x);
  for (let x = 0; x < 1024; x += 128) { for (const [c, d] of [[BLOOD, 0], ['#f1ede2', 14], ['#2c3f78', 28]]) { fg.fillStyle = c; fg.beginPath(); fg.moveTo(x, 6 + d); fg.quadraticCurveTo(x + 64, 70 + d, x + 128, 6 + d); fg.lineTo(x + 128, 18 + d); fg.quadraticCurveTo(x + 64, 82 + d, x, 18 + d); fg.closePath(); fg.fill(); } }
  WC.inkPoly(fg, [[2, 2], [1022, 2], [1022, 126], [2, 126]], 4, INK, 610);
  tg.fillStyle = '#a0703f'; tg.fillRect(0, 0, 512, 128); for (let y = 0; y < 128; y += 16) WC.inkLine(tg, [[0, y], [512, y + 1]], 1.6, 'rgba(42,31,24,.6)', 611 + y);
  const mats = [WC.texOf(front), WC.texOf(top)].map(m => { const mt = new THREE.MeshBasicMaterial({ map: m }); S.TINT_SKY.push(mt); return mt; }), dark = new THREE.MeshBasicMaterial({ color: '#5a3d2a' }); S.TINT_SKY.push(dark);
  const box = (w, d, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), [dark, dark, dark, mats[0], mats[1], dark]); m.position.set(x, y, h / 2); grp.add(m); };
  box(3.0, .68, .34, -.5, -5.76); for (let k = 0; k < 3; k++) box(.16, .68, .11 * (3 - k), 1.08 + k * .16, -5.76);
  grp.visible = false; S.scene.add(grp); return grp;
}
// walking along a list of [time, [x, y, z]] keyframes (constant speed between them)
function walkPath(t, keys) { if (t <= keys[0][0]) return { p: keys[0][1], moving: false };
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const k = (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]), a = keys[i - 1][1], b = keys[i][1]; return { p: a.map((v, j) => lerp(v, b[j], k)), moving: a.some((v, j) => Math.abs(v - b[j]) > .01) }; }
  return { p: keys.at(-1)[1], moving: false }; }

WC.episode({
  // a (made-up) Phoenix newspaper, the morning after
  page: { style: 'newspaper', masthead: 'The Saguaro Gazette', ears: ['Weather\nClear, 71°', 'Final\nEdition'], dateline: 'Vol. 104 · No. 73 · Phoenix, Arizona · Friday, March 14, 1997 · 35¢',
    headline: 'Lights over Phoenix', deck: 'Thousands report a silent, mile-wide “V” of lights over the Valley; the Air Force says flares', photoCaption: 'ARTIST’S RENDERING — the craft as witnesses described it. Staff illustration.',
    byline: 'By Gazette staff', initial: 'T', teaser: 'Inside: “We all saw it” — readers tell their stories, A6', folio: 'A1' },
  captions: 'vhs',
  open: ['L1', 'phoenix', 0], flapAt: ['L1', 'phoenix', .35],
  assets: { a10: 'prints/a10-flares.jpg' },
  sky: {
    stops: [[0, '#2b3a63'], [.45, '#47557f'], [.72, '#8c6b86'], [.88, '#d9895e'], [1, '#efc176']], flapStops: [[0, '#141b33'], [1, '#2b3a63']],
    clouds: [[250, 720, .8], [1050, 690, .7]], cloudFill: '#c9a6a0', ceiling: true,
    live(g, t, S) {   // the hook: on the flat broadsheet the printed lights pulse (periodic in END, so the loop still matches)
      const ph = t / S.END * Math.PI * 2, a0 = g.globalAlpha;
      V_LIGHTS.forEach(([x, y], i) => { const k = .5 + .5 * Math.sin(ph * 9 + i * .9); g.globalAlpha = a0 * (.25 + .5 * k); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(640 + x * .62, 330 + y * .62, 26 + 16 * k, 0, 6.283); g.fill(); });
      for (let i = 0; i < 9; i++) { const k = .5 + .5 * Math.sin(ph * 7 + i * 1.3); g.globalAlpha = a0 * (.2 + .45 * k); g.fillStyle = '#ffb36a'; g.beginPath(); g.arc(170 + i * 118, 790 + Math.sin(i * 1.7) * 10, 16 + 12 * k, 0, 6.283); g.fill(); }
    },
    print(g, w, h) {   // the broadsheet's printed picture while the card lies flat
      const r = rng(5); for (let i = 0; i < 70; i++) { g.save(); g.translate(30 + r() * (w - 60), 20 + r() * 700); WC.drawStar(g, 7 + r() * 9, 10 + i); g.restore(); }
      g.save(); g.translate(640, 330); g.scale(.62, .62); drawV(g); for (const [x, y] of V_LIGHTS) { g.save(); g.translate(x, y); WC.drawGlow(g, 58, '#ffd98a', 20 + x, false); g.restore(); } g.restore();
      for (let i = 0; i < 9; i++) { g.save(); g.translate(170 + i * 118, 790 + Math.sin(i * 1.7) * 10); WC.drawGlow(g, 30, '#ff9a3c', 40 + i, false); g.restore(); }
    },
  },
  words: {
    date: ['MARCH 13, 1997', 120, RED], phx: ['PHOENIX, ARIZONA', 128, INK], froze: ['FROZE.', 170, BLUE], n5: ['5', 260, INK], n6: ['6', 260, INK], n7: ['7', 260, RED],
    silent: ['SILENT.', 160, INK], mile: ['ONE MILE', 120, INK], y97: ['1997', 240, INK], y07: ['2007', 240, RED], ha: ['HA! HA! HA!', 150, RED],
  },
  light: (t, S) => { const w = craftGlow(t, S) * (.9 + .1 * Math.sin(t * 5)); return [1 + .55 * w, 1 + .32 * w, 1 + .04 * w]; },   // the town glows warm under the craft
  ground: { art: streetArt, y0: -2.2, y1: -13, width: 14 },   // a street and a desert shoulder instead of the page's text as the floor
  fog: { color: '#141c33', near: 15, far: 40 },                 // night haze for depth
  capColor: { L9b: '#8be36b' },                                 // the alien's line is captioned in green
  night: (t, S) => P(t, at('L1', 'sunset') - .2, 3) - .45 * P(t, st('L9') - .3, .6) * (1 - P(t, at('L11', 'saw') - .3, .8)),

  build(S) {
    const O = S.O = {};
    O.phx = S.card(phoenixArt(), 1300, 2.6, { flat: true });
    O.sun = S.sprite(WC.spriteTex(720, 720, g => WC.drawSun(g, 340, 20)), 2.4, { tint: false });
    O.stars = Array.from({ length: 90 }, (_, i) => { const r = rng(300 + i); return { m: S.sprite(WC.spriteTex(90, 90, g => WC.drawStar(g, 36, 30 + i)), .16 + r() * .14, { tint: false }), p: [(r() - .5) * 7.2, -.86, 2.2 + r() * 9.5], ph: r() * 6.28, d: r() }; });
    O.craft = buildCraft(S);
    O.milky = S.sprite(WC.milkyTex(7), 11, { tint: false, depthWrite: false, alphaTest: .01 });
    O.cityGlow = S.sprite(glowBandTex(), 9.5, { tint: false, depthWrite: false, alphaTest: .01, h: 1.6 });
    const comet = WC.spriteTex(600, 80, g => WC.drawComet(g, 560, 5), 0); O.comets = [0, 1].map(() => S.sprite(comet, 1.6, { tint: false, depthWrite: false, alphaTest: .02 }));
    const warm = WC.spriteTex(120, 120, g => WC.drawGlow(g, 50, '#ffd98a', 63, false), 0);
    O.porch = Array.from({ length: 16 }, (_, i) => { const r = rng(1100 + i); return { m: S.sprite(warm, .2, { tint: false, depthWrite: false, alphaTest: .02 }), p: [-3.5 + i * .47 + (r() - .5) * .2, -2.22, .32 + r() * .22], d: r() }; });
    O.back = BACK_LOOKS.map((look, i) => { const r = rng(1200 + i), px = 300 + i * 62 + (r() - .5) * 20; return S.doll(M({ px, py: 1398 + (i % 2) * 22, h: 1.85 + r() * .2, flip: px > 576, skin: SKINS[(i + 1) % 5], seed: 200 + i, nf: 2, pose: WC.poses('point', 'handsUp'), ...look })); });
    O.truck = S.standee([WC.cutout((() => { const c = WC.cnv(1000, 420); drawTruck(c.getContext('2d')); return c; })(), 6)], 230, 1340, 1.35, { shadowW: .8, shadowA: .4 });
    O.sedan = S.standee([WC.cutout((() => { const c = WC.cnv(1000, 380); drawSedan(c.getContext('2d')); return c; })(), 6)], 925, 1345, 1.2, { flip: true, shadowW: .8, shadowA: .4 });
    O.beams = [0, 1].map(() => S.sprite(warm, .55, { tint: false, depthWrite: false, alphaTest: .02 }));
    const glow = WC.spriteTex(280, 280, g => WC.drawGlow(g, 120, '#ffd98a', 60), 0), orange = WC.spriteTex(280, 280, g => WC.drawGlow(g, 120, '#ff9a3c', 61), 0), red = WC.spriteTex(120, 120, g => WC.drawGlow(g, 50, '#ff3a2a', 62, false), 0);
    O.lights = V_LIGHTS.map(() => S.sprite(glow, .62, { tint: false, depthWrite: false, alphaTest: .02 }));
    const chute = WC.spriteTex(240, 300, drawChute, 4);
    O.orbs = ORB_X.map(() => ({ glow: S.sprite(orange, .62, { tint: false, depthWrite: false, alphaTest: .02 }), chute: S.sprite(chute, .62) }));
    const jet = WC.spriteTex(940, 300, g => drawA10(g, 70), 5); O.jets = [0, 1].map(() => S.sprite(jet, 2.3));
    O.rec = Array.from({ length: 16 }, (_, i) => { const r = rng(700 + i); return { m: S.sprite(red, .2, { tint: false, depthWrite: false, alphaTest: .02 }), p: [(r() - .5) * 6.4, -2.25, .3 + r() * 1.6], ph: r() * 6.28 }; });
    const flash = WC.spriteTex(300, 300, g => WC.drawBurst(g, 130, 80, ['#fffbe8', '#ffe9a0']), 4); O.flashes = Array.from({ length: 8 }, (_, i) => ({ m: S.sprite(flash, .7, { tint: false }), r: rng(800 + i) }));
    O.crowd = FOLK.map(([px, py, flip, look], i) => S.doll(M({ px, py, flip, h: look.h || 2.15 + (i % 3) * .1, skin: SKINS[i % 5], seed: 20 + i, nf: 8, pose: WC.poses('point', 'handsUp', 'cower', 'cam', 'camRec', 'laugh', 'laugh2', 'stand'), ...look })));
    // the press conference: a stage with bunting, a backdrop with the seal and both flags, the podium, the governor, the aide in an alien suit and two state troopers
    O.stage = buildStage(S);
    O.backdrop = S.standee([WC.cutout((() => { const c = WC.cnv(900, 760); drawBackdrop(c.getContext('2d')); return c; })(), 6)], 520, 1712, 2.75, { noShadow: true });
    O.podium = S.standee([WC.cutout((() => { const c = WC.cnv(380, 460); drawPodium(c.getContext('2d')); return c; })(), 7)], 545, 1756, 1.45);
    O.gov = S.doll(M({ px: 560, py: 1735, h: 2.45, top: 'suit', topCol: '#2f3442', tie: BLOOD, shoes: 'dress', hair: 'short', hairCol: '#8a7a6a', seed: 70, nf: 8, pose: WC.poses('talk', 'talk2', 'laugh', 'laugh2', 'point', 'stand', 'walk', 'walk2') }));
    O.alien = S.doll(M({ px: 900, py: 1810, h: 2.35, top: 'alien', topCol: '#9aa39a', shoes: 'boots', shoeCol: '#7a827a', alien: true, flip: true, seed: 80, nf: 7, pose: WC.poses('walk', 'walk2', 'talk', 'talk2', 'wave', 'wave2', 'stand') }));
    const trooper = (i, extra) => S.doll(M({ px: 900, py: 1810, h: 2.35, top: 'uniform', topCol: '#c9b58a', bottom: 'slacks', bottomCol: '#5a5640', shoes: 'boots', shoeCol: '#1e1a1a', hat: 'trooper', hatCol: '#9a8a64', hair: 'short', flip: true, seed: 85 + i, nf: 5, pose: WC.poses('escort', 'escort2', 'stand', 'laugh', 'laugh2'), ...extra }));
    O.troopers = [trooper(0, { mustache: '#3a2616' }), trooper(1, { skin: '#b67b52' })];
    O.press = [S.doll(M({ px: 300, py: 1915, h: 2.2, top: 'suit', topCol: '#b03a2e', tie: '#f1ede2', bottom: 'skirt', bottomCol: '#2f3442', shoes: 'dress', hair: 'big', hairCol: '#c9a24a', seed: 95, nf: 3, pose: WC.poses('mic', 'laugh', 'laugh2') })),
      S.doll(M({ px: 410, py: 1935, h: 2.2, top: 'windbreaker', topCol: '#3d5a7a', top2: '#e2b04e', top3: '#f1ede2', bottom: 'slacks', glasses: '#2a1d14', hair: 'short', hairCol: '#5a3a22', seed: 96, nf: 3, pose: WC.poses('write', 'laugh', 'laugh2') })),
      S.doll(M({ px: 930, py: 1925, h: 2.25, top: 'flannel', topCol: '#4f7a5a', top2: '#1e1612', hat: 'ballBack', hatCol: '#2a2420', flip: true, seed: 97, nf: 3, pose: WC.poses('tvcam', 'laugh', 'laugh2') }))];
    O.gov07 = S.doll(M({ px: 560, py: 1765, h: 2.45, top: 'suit', topCol: '#2f3442', tie: '#3d5a7a', shoes: 'dress', hair: 'short', hairCol: '#cfc8bd', seed: 90, nf: 2, pose: WC.poses('point', 'handsUp') }));
    if (S.img.a10) O.photo = S.print(S.img.a10, .84);
  },
  prepare(S) { S.hits = [at('L8', 'flares'), at('L8', 'jets') + .4]; },
  shots: S => [
    [0, 1, [0, -15.6, 2.4], [0, -1.6, 2.4], 0],                                          // Phoenix at sunset
    [at('L2', 'thousands') - .25, 1.4, [0, -15.4, 2.6], [0, -2.2, 3.2], 0],             // people (and more people) step outside
    [at('L2', 'froze') - .25, .7, [0, -12.4, 2.1], [0, -4.0, 2.5], 0],                  // ... and freeze
    [at('L3', 'giant') - .45, 1.5, [0, -17.2, 1.6], [-.4, -2.2, 6.6], 0],              // the craft sweeps in
    [at('L3', 'five') - .25, 1.2, [0, -15.8, 1.7], [0, -3.0, 6.3], 0],                  // lights: five, six, seven
    [at('L4', 'mile') - .3, 1.0, [0, -19.4, 2.0], [0, -2.8, 6.0], 0],                   // a mile wide
    [at('L4', 'so') - .2, 1.6, [.3, -14.6, 1.3], [.1, -3.6, 7.3], .03],                 // blotting out the stars
    [at('L5', 'drifted') - .3, 1.6, [0, -15.6, 1.3], [.2, -5.0, 6.8], 0],               // drifting closer (the map)
    [at('L5', 'over') - .2, 2.2, [0, -15.8, 1.2], [.5, -10.5, 8.6], 0],                 // ... and right over our heads
    [at('L5', 'phoenix') - .3, 1.2, [0, -15.8, 1.2], [.9, -14.2, 9.8], .04],
    [at('L6', 'then') - .2, 1.5, [0, -19.4, 3.7], [0, -1.6, 2.3], 0],                    // ten o'clock: wide on the mountains
    [at('L6', 'orange') - .2, 2.6, [0, -15.4, 2.9], [0, -1.6, 2.45], 0],                 // slow push on the orbs
    [at('L7', 'grabbed') - .3, .9, [-.7, -10.6, 2.3], [-.45, -4.4, 2.5], .04],           // camcorders up
    [at('L7', 'whole') - .2, 1.1, [0, -19.2, 3.3], [0, -1.8, 2.7], 0],                   // the whole city filming
    [at('L7', 'filming') - .25, .7, [.25, -9.6, 3.3], [.3, -1.35, 2.5], .02],            // through the viewfinder
    [at('L8', 'flares') - .3, 1.0, [0, -16.4, 2.4], [0, -1.6, 3.0], 0],                  // "flares"
    [at('L8', 'dropped') - .4, .8, [-1.1, -8.6, 2.9], [.3, -2.0, 3.2], -.03],             // the jets roar past, chutes open
    [at('L9', 'governor') - .35, 1.3, [-.3, -12.6, 2.5], [-.3, -5.6, 2.0], 0],            // the governor at the podium
    [at('L9', 'brought') - .35, 1.1, [1.7, -12.0, 2.3], [1.9, -5.9, 1.7], 0],              // here comes the aide, with two troopers
    [at('L9', 'stage') - .2, 1.0, [.8, -12.2, 2.4], [.6, -5.7, 2.0], 0],                   // up the steps
    [at('L9', 'alien') - .1, 1.0, [0, -11.4, 2.6], [-.1, -5.6, 2.3], 0],                   // at the microphones
    [st('L9b') - .2, 1.6, [-.05, -9.8, 2.75], [-.1, -5.55, 2.45], 0],                      // "Relax, everybody..."
    [st('L10') - .15, 1.0, [0, -14.6, 2.7], [0, -5.9, 1.9], 0],                            // the whole room laughs
    [at('L11', 'ten') - .25, 1.4, [0, -14.6, 1.6], [0, -4.4, 3.6], 0],                   // 2007: the governor, alone, looking up
    [at('L12', 'flares') - .3, 1.3, [0, -17, 2.2], [0, -1.6, 4.2], 0],                  // flares sink...
    [at('L12', 'block') - .45, 1.5, [0, -15.4, 1.3], [0, -3.0, 6.6], 0],                 // ... the craft blots out the stars
  ],

  update(t, S) {
    const O = S.O, closeUp = S.closeUp;
    S.raise(O.phx, S.open - .05, closeUp + .25);
    // the sun sinks behind the mountains ("just after sunset")
    const sunZ = lerp(2.3, -1.4, eio(P(t, at('L1', 'just') - .4, 2.4)));
    S.bill(O.sun, 1.25, -1.3, sunZ, Math.sin(t * .4) * .04, eo(clamp(S.tilt * 1.6)) * (sunZ > -1.3 ? 1 : 0));
    // stars come out as night falls, twinkle, and go back in for the fold
    O.stars.forEach((s, i) => { const k = back(P(t, at('L1', 'sunset') + s.d * 2.6, .4)) * (1 - P(t, closeUp + s.d * .6, .4)); S.bill(s.m, s.p[0], s.p[1], s.p[2], s.ph, k * (.8 + .25 * Math.sin(t * 3 + s.ph * 5))); });

    // sky dressing: the Milky Way and the city's glow come out with the night; two shooting stars
    const nightK = P(t, at('L1', 'sunset') + .6, 2.4) * (1 - P(t, closeUp - .1, .5));
    O.milky.material.opacity = nightK; S.bill(O.milky, .3, -.78, 8.6, .55, nightK > .01 ? 1 : 0);
    O.cityGlow.material.opacity = .85 * nightK; S.bill(O.cityGlow, 0, -1.95, .75, 0, nightK > .01 ? 1 : 0);
    [at('L1', 'sunset') + 1.4, at('L11', 'later') + .1].forEach((tc, j) => { const k = P(t, tc, 1.0); S.bill(O.comets[j], lerp(-2.2, 2.4, k), -.8, lerp(9.6, 7.9, k), -.36, k > 0 && k < 1 ? Math.sin(Math.PI * k) * 1.2 : 0); });
    O.porch.forEach(pl => { const k = back(P(t, at('L2', 'stepped') - .2 + pl.d * .7, .3)) * (1 - P(t, closeUp - .2 + pl.d * .3, .4)); S.bill(pl.m, ...pl.p, 0, k * (.9 + .1 * Math.sin(t * 4 + pl.d * 9))); });

    // the craft (3-D) and its seven lights
    const cs = craftState(t, S), cg = O.craft;
    cg.visible = !!(cs && cs.body); if (cs) { cg.position.set(...cs.p); cg.rotation.set(cs.pitch, 0, cs.yaw); cg.updateMatrixWorld(true); }
    S.vTips = null;
    O.lights.forEach((m, i) => { if (!cs || i >= cs.nLit || cs.lit <= 0) { m.visible = false; return; }
      const [lx, ly] = V_LIGHTS[i], on = cs.intro && t < at('L3', 'seven') + .5 ? back(P(t, (i < 5 ? at('L3', 'five') + i * .07 : i === 5 ? at('L3', 'six') : at('L3', 'seven')) - .05, .3)) : 1;
      const p = cg.localToWorld(S.V(lx * VS, -ly * VS, -.1)).addScaledVector(S.fwd, -.05);
      S.bill(m, p.x, p.y, p.z, 0, cs.lit * on * (.92 + .12 * Math.sin(t * 5 + i))); });
    if (cs && cs.body) S.vTips = [-1, 1].map(sg => S.proj(cg.localToWorld(S.V(sg * 600 * VS, 330 * VS, 0))));

    // ten o'clock: a row of orange orbs over the mountains; the jets pass and each one turns into a flare on a chute
    const tJ = at('L8', 'jets') - 1.5, JD = 3.0, tChute = i => tJ + (ORB_X[i] + 5.5) / 11 * JD;
    O.orbs.forEach((o, i) => {
      let z = null, chute = 0, a = 0; const on = at('L6', 'orange') - .2 + i * .09;
      if (t > on && t < st('L9') + .3) { a = back(P(t, on, .35)) * (1 - P(t, st('L9') - .2, .5)); const tc = tChute(i); chute = back(P(t, tc, .45)); z = orbZ(i) - Math.max(0, t - tc) * .22; }
      else if (t > at('L12', 'flares') - .4 && t < at('L12', 'block') + .8) { const t0 = at('L12', 'flares') - .4 + i * .05; a = back(P(t, t0, .35)) * (1 - P(t, at('L12', 'block') + .2, .6)); chute = a; z = orbZ(i) + .5 - (t - t0) * .3; }
      if (z === null) { o.glow.visible = o.chute.visible = false; return; }
      const sway = Math.sin(t * 1.3 + i) * .05 * chute;
      S.bill(o.glow, ORB_X[i] + sway, -1.35, z, 0, a * (.85 + .2 * Math.sin(t * 3 + i * 1.3)));
      S.bill(o.chute, ORB_X[i] + sway, -1.36, z + .52, sway * 2, a * chute);
    });
    O.jets.forEach((m, j) => { const k = P(t, tJ + j * .3, JD); S.bill(m, lerp(-5.5, 5.5, k), -2.6 + j * .05, 3.0 + j * .45 + Math.sin(k * 6) * .05, Math.sin(t * 3 + j) * .03, k > 0 && k < 1 ? 1 : 0); });
    // "the whole city was filming": REC lights blink all over town
    O.rec.forEach((r, i) => { const k = P(t, at('L7', 'whole') - .3 + i * .03, .2) * (1 - P(t, en('L7') + .4, .3)); S.bill(r.m, ...r.p, 0, k * (Math.sin(t * 6 + r.ph) > -.2 ? 1 : 0)); });

    // the townsfolk: out for the sighting, step aside for the press conference and 2007, back for the last crossing
    const away = t > st('L9') + .6, upA = i => away ? st('L12') - .35 + i * .05 : at('L2', 'thousands') - .2 + i * .07, downA = i => away ? closeUp - .1 + i * .025 : st('L9') - .45 + i * .02;
    O.crowd.forEach((d, i) => {
      S.hinge(d, upA(i), downA(i));
      let f = 7;   // stand
      if (t > at('L2', 'froze') - .1) f = i % 2 ? 1 : 0;
      if (t > at('L3', 'giant') - .3) f = i % 3 === 1 ? 1 : 0;
      if (t > at('L7', 'grabbed') - .1 + i * .06) f = Math.floor(t * 2 + i) % 2 ? 4 : 3;
      if (t > at('L8', 'flares') - .2) f = 0;
      if (t > st('L12') - .4) f = i % 3 === 1 ? 1 : 0;
      S.setTex(d, f);
      const still = t > at('L2', 'froze') && t < at('L3', 'giant') - .3;   // "froze": no idle sway at all
      d.m.rotation.set(0, 0, still ? 0 : Math.sin(t * 1.2 + i) * .025);
      d.m.position.y = d.h / 2 + (f === 1 && !still ? Math.abs(Math.sin(t * 6 + i)) * .03 : 0);
    });
    O.back.forEach((d, i) => { S.hinge(d, upA(i) + .35, downA(i)); S.setTex(d, t > at('L2', 'froze') - .1 && (i + Math.floor(t * .7)) % 3 === 0 ? 1 : 0); d.m.rotation.z = Math.sin(t * 1.1 + i * 2) * .03; });
    // two 90s cars pulled over on the street, headlights on
    [[O.truck, 1], [O.sedan, -1]].forEach(([car, dir], j) => { const up = S.hinge(car, upA(j) + .1, downA(j), .5, false), k = clamp(car.pivot.rotation.x / (Math.PI / 2));
      S.bill(O.beams[j], car.pivot.position.x + dir * car.w * .46, car.pivot.position.y - .05, car.h * (j ? .26 : .32), 0, car.pivot.visible ? k * (1.4 + .08 * Math.sin(t * 7 + j)) : 0); });

    // the press conference: the governor at the podium; troopers march the "alien" in, up the steps, to the microphones
    const p0 = at('L9', 'governor') - .3, pEnd = st('L11') + .05;
    const stUp = back(P(t, p0 - .15, .5)) * (1 - eio(P(t, pEnd, .6))); O.stage.visible = stUp > .004; O.stage.scale.z = Math.max(.004, stUp); const SH = .34 * stUp;
    S.hinge(O.backdrop, p0 - .1, pEnd, .5, false); S.hinge(O.podium, p0, pEnd, .5); O.podium.pivot.position.z = SH + .012;
    const tA = at('L9', 'brought') - .45, tB = at('L9', 'up') - .05, tC = at('L9', 'stage') + .3, tD = at('L9', 'alien') + .35;
    const gw = walkPath(t, [[tD - 1.0, [-.12, -5.56, 0]], [tD - .2, [-1.05, -5.56, 0]]]); O.gov.pivot.position.set(gw.p[0], gw.p[1], SH + .012); S.hinge(O.gov, p0 + .1, pEnd, .5);
    S.setTex(O.gov, t > at('L10', 'laughed') - .35 ? (Math.floor(t * 3) % 2 ? 3 : 2) : gw.moving ? 6 + Math.floor(t * 4.5) % 2 : t < at('L9', 'brought') ? Math.floor(t * 4) % 2 : 5);
    const aw = walkPath(t, [[tA, [3.4, -6.2, 0]], [tB, [1.62, -6.2, 0]], [tC, [1.0, -5.86, .34]], [tD, [-.1, -5.6, .34]]]);
    O.alien.pivot.position.set(aw.p[0], aw.p[1], aw.p[2] * stUp + .012); S.hinge(O.alien, tA - .35, pEnd, .4);
    const talking = t > st('L9b') - .05 && t < en('L9b') + .1;
    S.setTex(O.alien, aw.moving ? Math.floor(t * 4.5) % 2 : talking ? 2 + Math.floor(t * 7) % 2 : t > at('L10', 'laughed') - .4 ? 4 + Math.floor(t * 3) % 2 : 6);
    O.alien.m.position.y = O.alien.h / 2 + (aw.moving ? Math.abs(Math.sin(t * 14)) * .04 : 0);
    O.troopers.forEach((d, i) => { const w = walkPath(t, i ? [[tA, [2.75, -6.02, 0]], [tB - .2, [1.95, -6.02, 0]]] : [[tA, [4.2, -6.5, 0]], [tB + .1, [2.3, -6.5, 0]]]); d.pivot.position.set(w.p[0], w.p[1], .012); S.hinge(d, tA - .3, pEnd, .4);
      S.setTex(d, w.moving ? Math.floor(t * 4.5 + i) % 2 : t > at('L10', 'laughed') - .35 ? 3 + Math.floor(t * 3 + i) % 2 : 2); d.m.position.y = d.h / 2 + (w.moving ? Math.abs(Math.sin(t * 14 + i)) * .04 : 0); });
    O.press.forEach((d, i) => { S.hinge(d, p0 + .15 + i * .1, pEnd, .45); S.setTex(d, t > at('L10', 'laughed') - .35 + i * .05 ? 1 + Math.floor(t * 3.2 + i) % 2 : 0); d.m.rotation.z = Math.sin(t * 1.3 + i) * .02; });
    O.flashes.forEach((fl, i) => { let s = 0; for (let k = 0; k < 9; k++) { const tf = at('L9', 'press') - .1 + k * .52 + i * .19, u = t - tf; if (u > 0 && u < .16) s = 1 - u / .16; }
      const r = rng(800 + i), p = [(r() - .5) * 5, -6.7 - r() * .4, 2.0 + r() * 1]; S.bill(fl.m, ...p, i, t < en('L10') + .3 ? s : 0); });
    S.hinge(O.gov07, at('L11', 'that') - .3, st('L12') + .2, .5); S.setTex(O.gov07, t > at('L11', 'saw') - .2 ? 1 : 0);
    // the real U.S. Air Force photo
    if (O.photo) { const top = S.hold(O.photo, eo(P(t, at('L8', 'training') - .3, .55)), eio(P(t, st('L9') + .15, .5)), { dy: .3 }); S.tagAt('Real photo · A-10 dropping flares · U.S. Air Force', top, P(t, at('L8', 'training'), .3) * (1 - P(t, st('L9'), .25)), 32); }
    const gt = O.gov.pivot.position.clone(); gt.z += 2.75; S.tagAt('Governor Fife Symington', gt, P(t, at('L9', 'governor'), .3) * (1 - P(t, at('L9', 'aide') - .3, .3)));
    const atg = O.alien.pivot.position.clone(); atg.z += 2.65; S.tagAt('His aide, in costume', atg, P(t, at('L9', 'alien') - .1, .3) * (1 - P(t, st('L9b'), .3)));
    const g7 = O.gov07.pivot.position.clone(); g7.z += 2.75; S.tagAt('Fife Symington · 2007', g7, P(t, at('L11', 'admitted'), .3) * (1 - P(t, en('L11') + .4, .3)));
  },

  hud(t, S) {
    const hg = S.hg;
    S.show('date', at('L1', 'march') - .1, at('L1', 'phoenix') - .3, 440); S.show('phx', at('L1', 'phoenix') - .05, at('L1', 'just') + .2, 400, .03);
    S.show('froze', at('L2', 'froze') - .05, en('L2') + .5, 420, -.02);
    S.show('n5', at('L3', 'five') - .05, at('L3', 'six') - .15, 400); S.show('n6', at('L3', 'six') - .05, at('L3', 'seven') - .15, 400); S.show('n7', at('L3', 'seven') - .05, en('L3') + .3, 400, .03);
    S.show('silent', at('L4', 'silent') - .05, at('L4', 'mile') - .2, 420);
    // "a mile wide": a woodcut ruler across the wing tips
    { const a = P(t, at('L4', 'mile') - .15, .3) * (1 - P(t, at('L4', 'so') + .2, .3)); if (a > 0 && S.vTips) { const [[x0, y0], [x1, y1]] = S.vTips, y = Math.min(y0, y1) - 70, k = eo(P(t, at('L4', 'mile') - .15, .5)), xm = (x0 + x1) / 2, hw = (x1 - x0) / 2 * k;
      hg.save(); hg.globalAlpha = a; for (const [w, col] of [[14, '#f1e4c4'], [6, INK]]) { hg.strokeStyle = col; hg.lineWidth = w; hg.lineCap = 'round'; hg.beginPath(); hg.moveTo(xm - hw, y); hg.lineTo(xm + hw, y); hg.moveTo(xm - hw, y - 26); hg.lineTo(xm - hw, y + 26); hg.moveTo(xm + hw, y - 26); hg.lineTo(xm + hw, y + 26); hg.stroke(); }
      hg.restore(); S.show('mile', at('L4', 'mile') - .1, at('L4', 'so') + .2, y - 90, 0, xm, .9); } }
    // the route on a woodcut map of Arizona
    { const t0 = at('L5', 'drifted') - .25, a = P(t, t0, .35) * (1 - P(t, en('L5') + .35, .35)); if (a > 0) {
      const sh = eio(P(t, at('L5', 'over') - .25, .6)); hg.save(); hg.globalAlpha = a; hg.translate(lerp(W / 2, 236, sh), lerp(560, 400, sh)); hg.scale(lerp(1, .42, sh), lerp(1, .42, sh)); hg.rotate(-.02);
      hg.fillStyle = '#efe3c4'; hg.fillRect(-380, -360, 760, 720); WC.inkPoly(hg, [[-380, -360], [380, -360], [380, 360], [-380, 360]], 5, INK, 960); WC.inkPoly(hg, [[-366, -346], [366, -346], [366, 346], [-366, 346]], 1.6, RED, 961);
      hg.font = `800 54px ${WC.F.head}`; hg.fillStyle = INK; hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillText('ARIZONA', 0, -300);
      const X = u => -220 + u * 470, Y = v => -240 + v * 520, az = [[0, 0], [1, 0], [1, 1], [.46, 1], [0, .82], [.02, .7], [.06, .6], [.04, .5], [.08, .42], [.04, .3], [.07, .2], [0, .14]].map(([u, v]) => [X(u), Y(v)]);
      WC.wash(hg, az, '#e3c98e', 962, .9, 4); WC.inkPoly(hg, az, 4, INK, 963);
      hg.font = `700 26px ${WC.F.tag}`; hg.fillStyle = 'rgba(42,31,24,.75)'; hg.save(); hg.translate(X(-.17), Y(.2)); hg.rotate(-1.2); hg.fillText('NEVADA', 0, 0); hg.restore();
      const route = [[-.14, .06], [.1, .2], [.36, .42], [.42, .58], [.58, .82]].map(([u, v]) => [X(u), Y(v)]), marks = [at('L5', 'nevada') - .4, at('L5', 'over'), at('L5', 'prescott'), at('L5', 'phoenix'), en('L5') + .3];
      let head = route[0]; const pts = [route[0]]; for (let s = 1; s < route.length; s++) { const k = eio(P(t, marks[s - 1], marks[s] - marks[s - 1])); if (k <= 0) break; head = [lerp(route[s - 1][0], route[s][0], k), lerp(route[s - 1][1], route[s][1], k)]; pts.push(head); if (k < 1) break; }
      if (t > marks[0]) { hg.setLineDash([16, 12]); hg.strokeStyle = BLOOD; hg.lineWidth = 7; hg.lineCap = 'round'; hg.beginPath(); pts.forEach((p, i) => i ? hg.lineTo(...p) : hg.moveTo(...p)); hg.stroke(); hg.setLineDash([]);
        hg.save(); hg.translate(...head); hg.scale(.07, .07); drawV(hg); hg.restore(); }
      for (const [name, i, w] of [['Prescott', 2, 'prescott'], ['Phoenix', 3, 'phoenix'], ['Tucson', 4, null]]) { const k = P(t, w ? at('L5', w) - .1 : en('L5') + .1, .25); if (k <= 0) continue; const [x, y] = route[i], pulse = w === 'phoenix' ? 1 + .5 * Math.max(0, 1 - (t - at('L5', 'phoenix')) / .5) : 1;
        hg.fillStyle = RED; hg.beginPath(); hg.arc(x, y, 11 * pulse, 0, 6.283); hg.fill(); WC.inkLine(hg, WC.circ(x, y, 11 * pulse, 12), 3, INK, 970 + i); hg.globalAlpha = a * k; hg.font = `700 34px ${WC.F.tag}`; hg.fillStyle = INK; hg.textAlign = 'left'; hg.fillText(name, x + 22, y); hg.globalAlpha = a; }
      const mk = P(t, at('L5', 'three') - .1, .35); if (mk > 0) { hg.globalAlpha = a * mk; hg.font = `800 66px ${WC.F.head}`; hg.fillStyle = BLOOD; hg.textAlign = 'center'; hg.fillText('300 MILES', 0, 312); }
      hg.restore(); } }
    // ten o'clock
    { const t0 = at('L6', 'ten') - .25, a = P(t, t0, .25) * (1 - P(t, at('L6', 'row') - .1, .3)); S.clock(W / 2, 420, lerp(7.5, 10, eio(P(t, t0, .7))), a); }
    // 1990s camcorder viewfinder
    { const a = P(t, at('L7', 'filming') - .3, .15) * (1 - P(t, st('L8') + .05, .2)); if (a > 0) { hg.save(); hg.globalAlpha = a; hg.fillStyle = 'rgba(0,0,0,.09)'; for (let y = 0; y < H; y += 4) hg.fillRect(0, y, W, 1.5); hg.fillStyle = 'rgba(255,190,120,.05)'; hg.fillRect(0, 0, W, H); hg.lineWidth = 6; hg.strokeStyle = '#f4f4f0'; hg.lineCap = 'square';
      for (const [x, y, sx, sy] of [[90, 290, 1, 1], [990, 290, -1, 1], [90, 1290, 1, -1], [990, 1290, -1, -1]]) { hg.beginPath(); hg.moveTo(x, y + sy * 70); hg.lineTo(x, y); hg.lineTo(x + sx * 70, y); hg.stroke(); }
      const txt = (s, x, y, al = 'left', col = '#f4f4f0') => { hg.font = 'bold 52px Menlo, "Courier New", monospace'; hg.textAlign = al; hg.textBaseline = 'middle'; hg.lineWidth = 8; hg.strokeStyle = 'rgba(0,0,0,.75)'; hg.strokeText(s, x, y); hg.fillStyle = col; hg.fillText(s, x, y); };
      if (Math.floor(t * 2) % 2 === 0) { hg.fillStyle = '#e8402a'; hg.beginPath(); hg.arc(140, 350, 16, 0, 6.283); hg.fill(); } txt('REC', 170, 352, 'left');
      txt('SP', 900, 352, 'right'); hg.strokeStyle = '#f4f4f0'; hg.lineWidth = 4; hg.strokeRect(918, 334, 52, 26); hg.fillStyle = '#f4f4f0'; hg.fillRect(970, 341, 6, 12); hg.fillRect(922, 338, 30, 18);
      const sec = 14 + Math.floor(t - at('L7', 'filming')); txt('MAR 13 1997', 130, 1170); txt(`10:02:${String(sec).padStart(2, '0')} PM`, 130, 1232); hg.restore(); } }
    // the official answer
    S.stamp('FLARES', W / 2, 470, P(t, at('L8', 'flares') - .08, .22), 1 - P(t, at('L8', 'jets') - .2, .3), -.1, 130, '— U.S. Air Force —');
    S.show('ha', at('L10', 'laughed') - .3, en('L10') + .6, 400, -.04);
    S.show('y97', at('L11', 'ten') - .05, at('L11', 'later') + .05, 420); S.show('y07', at('L11', 'later') + .1, at('L11', 'admitted') - .1, 420, .03);
  },
});
