// PS1 prop library: HALLOWEEN THINGS (load after ps1.js; registers builders on PS1.props, nothing else global but PS1.hallo).
//   <script src="/studio/lib/ps1-props/halloween-things.js"></script>      scene.add(PS1.props.jackOLantern({ face: 'evil' }));
//
// Ordinary household + holiday objects for a 1970s American-suburbia autumn night: pumpkins, kitchen knives, a wire hanger, a snub-nose
// revolver, trick-or-treat bags, a clothesline, a hedge, fallen leaves. Non-graphic: nothing here is bloody.
//
// CONVENTIONS (same as furniture.js / places.js)
//   Metres, y up, the prop rests on y = 0 unless noted, fronts face +z. Every builder: (o = {}) => THREE.Group at the origin (not parented).
//   Every builder takes the optional placement opts  pos:[x,y,z], ry (radians), scale  and sets  userData.size = [w, h, d]  and  userData.tris
//   (triangle count). Handles are in group.userData. Local V3s in userData are in the GROUP's space: g.localToWorld(ud.light.clone()) for PS1.light().
//   Everything is deterministic in o.seed. Static geometry is merged into one mesh per material; textures are tiny canvases (8..128 px),
//   shared through module caches, so never mutate a cached material. Per-instance materials (the pumpkin glow) are made fresh per call.
//   Anything with userData.update(t) needs it called each frame (the prop viewer does); pure in t.
//
// 1. PUMPKINS
//   jackOLantern({ size=.4 (width), face:'classic'|'happy'|'evil'|'blank', lit=true, seed=1 })   squat ribbed orange pumpkin (10..12 ribs by seed), brown-green
//     stem, a carved face (the holes glow unlit yellow-orange, or are dark when not lit). 'blank' = uncarved.
//     userData: light (V3 at the centre of the body: PS1.light slot), lightOut (V3 just in front of the face: use THIS to light the ground / the pumpkin
//     itself), lightColor [r,g,b], lightRange (m), setLit(k 0 dark .. 1 glowing), lit (current k), flicker(t) (sets the glow to lit*wobble, RETURNS the
//     wobble multiplier ~.65..1.0 so you can scale your point light), update(t) (= flicker when lit), faceDir (V3), bodyTop (y of the stem base), ribs.
//   pumpkin({ size=.4, seed=1 })   the same pumpkin, uncarved, no glow (userData.light still exists).
// 2. KNIVES + KNITTING
//   kitchenKnife({ blade=.22, style:'chef'|'butcher'|'paring', handle:'black'|'wood' })   steel blade, riveted handle. ORIGIN = centre of the handle, the
//     blade extends along local +y (parent to a hand group with no rotation: the blade points along the fingers). Flat of the blade faces +-x, the
//     cutting EDGE faces +z, the spine -z. blade defaults: chef .22, butcher .25, paring .1 (when you do not pass `blade`). handle default: chef black,
//     butcher wood, paring black.
//     userData: tip (V3), length (blade length), handleLen, totalLength, style, edge (V3 midpoint of the edge), grip (V3 = origin).
//   knifeBlock({ knives=5, slots=knives+1, seed })   slanted wooden countertop block, handles sticking out of the top, the extra slot(s) are empty.
//     userData: slot(i) (V3 where a blade enters the top at slot i), slotDir(i) (V3, the way the knife points when sunk in: unit, into the block),
//     knives[] (one Group per knife, a full kitchenKnife; hide or move them), pull(i, k 0..1) slides knife i out of its slot along its axis,
//     take(i) hides knife i in the block and returns a standalone kitchenKnife of the same style (origin = handle centre, ready for a hand), top (y of the
//     block at the middle), emptySlots (indices).
//   knittingNeedle({ length=.28, color })   steel rod, ball knob at +y, point at -y. ORIGIN = midpoint, along y. userData: tip (V3 point), knob (V3), length.
//   yarnBall({ color='#a8483a' })   wound ball ~9 cm with a loose strand lying on the ground. userData: radius, end (V3 strand end).
//   knittingBasket({ seed })   wicker basket with yarn balls and two needles sticking out. userData: needles[] (V3 tips), top (y of the rim), radius.
// 3. wireHanger({ straight:false })   bent-wire coat hanger in the xy plane (hook, sloping shoulders, bottom bar), ORIGIN = centre of the bottom bar.
//     userData: hookTop (V3 highest point of the hook), endPoint (V3 free tip of the hook wire).
//   straight:true = the same wire untwisted into ONE straight wire (.8 m) lying along x, centred, with the hook end bent into a J at +x and the other end plain.
//     userData: hookTop (V3 top of the J), endPoint (V3 the plain free end at -x), length.
// 4. revolver({ barrel=.1 })   snub-nose .38, dark steel + wood grip. ORIGIN = grip centre, barrel along local +y (muzzle at +y). Sights/hammer on the
//   +z side, the grip hangs toward -z and is angled back 18 deg (like a gun held in front of a hand whose fingers point along +y).
//     userData: muzzle (V3), light (V3 just ahead of the muzzle: put a PS1.light there while flashing), flash(k 0..1) drives the unlit orange muzzle-flash
//     star (scales with k, hidden at 0), flashColor [r,g,b], dir (V3 0,1,0).
// 5. treatBag({ style:'pillowcase'|'plastic'|'pail', color, seed })   trick-or-treat container with wrapped candy poking out. pail = orange pumpkin
//     pail with a printed jack-o'-lantern face (front +z) and a bent handle. userData: top (y of the opening), style, openingCenter (V3).
// 6. clothesline({ length=6, height=2.1, sheets=3, clothes:'sheets'|'mixed', post:'wood'|'metal', wind=1, seed })   two posts at x = +-length/2, a sagging
//   line, white sheets (plus shirts / jeans / towels when mixed) hung with pegs. Sheets hang ~1.45 m, the bottom is ~.6 m off the ground. Give it ~1.3 m of length per sheet (sheets squeeze down to .75 m wide, then overlap).
//     userData: update(t) (wind sway of the cloth, deterministic in t), gaps[] (V3 floor positions, y = 0, centred in each clear space between two sheets
//     where a person could stand), gapWidth, behind[] (V3 floor positions .45 m behind each sheet), sheetX[] (x centres), lineY (line height at the posts),
//     lineYAt(x) (sagging height), posts[] (V3 tops).
// 7. hedge({ length=6, height=1.8, depth=.9, seed })   dense dark-green trimmed shrub wall along x, lumpy top, leafy texture. userData: top (nominal top y),
//     topAt(x) (lumpy top height at x), length.
// 8. leaves({ radius=6, count=250, seed })   flat autumn leaf cards (orange / red / brown / ochre) scattered over a disc, y = .02..0.032, ONE mesh, 2 tris each.
//   leafPile({ r=.6, seed })   a lumpy leafy mound with leaf cards on it. userData: top (y), radius.
// HELPERS  PS1.hallo = { batch, tube, xf, merge, grid, TX, MT, SOLID, candy(...) }  for other prop files.
(function () {
'use strict';
const PS = window.PS1;
if (!PS || !PS.props) throw new Error('halloween-things.js: load lib/ps1.js first');
const TAU = Math.PI * 2, PI = Math.PI, DS = THREE.DoubleSide;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hashS = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 99991 + 1; };
const hash2 = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y, s = 0) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, f = t => t * t * (3 - 2 * t), o = s * 17.3;
  return lerp(lerp(hash2(xi + o, yi), hash2(xi + 1 + o, yi), f(xf)), lerp(hash2(xi + o, yi + 1), hash2(xi + 1 + o, yi + 1), f(xf)), f(yf)); };
const hx = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const sh = (h, k) => rgb(hx(h).map(v => v * k));
const mixc = (a, b, t) => { const A = hx(a), B = hx(b); return rgb(A.map((v, i) => v + (B[i] - v) * t)); };
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
const spk = PS.noise;

// ---------- caches: textures + materials shared by every builder ----------
const TC = {}, MC = {};
const TX = (key, w, h, draw, o = {}) => { if (!TC[key]) { const t = PS.tex(w, h, draw, o.seed ?? hashS(key)); if (o.mip) PS.mip(t); t._k = key; TC[key] = t; } return TC[key]; };
const MT = (t, o = {}) => { const k = t._k + '|' + (o.unlit ? 'u' : '') + (o.noFog ? 'n' : '') + (o.tint || '') + (o.side ? 's' + o.side : ''); return MC[k] || (MC[k] = PS.mat(t, o)); };
const SOLID = (hex, o) => MT(TX('s' + hex, 4, 4, q => { q.fillStyle = hex; q.fillRect(0, 0, 4, 4); }), o);

// ---------- geometry helpers ----------
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const xf = (g, p, r, s) => g.applyMatrix4(_m4.compose(_p.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0), _q.setFromEuler(_e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0)), _s.set(s ? s[0] : 1, s ? s[1] : 1, s ? s[2] : 1)));
const merge = geos => {
  const gs = geos.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const g of gs) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of gs) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return m; };
// a batch collects geometry per material and builds ONE mesh per material: B.add(geo, mat, [x,y,z], [rx,ry,rz], [sx,sy,sz]); B.build(group)
function batch() {
  const by = new Map(), api = {
    add(geo, mat, p, r, s) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (p || r || s) xf(g, p, r, s); if (!by.has(mat)) by.set(mat, []); by.get(mat).push(g); return api; },
    build(parent) { const out = []; for (const [mat, gs] of by) { const m = new THREE.Mesh(merge(gs), mat); m.frustumCulled = false; parent.add(m); out.push(m); } return out; } };
  return api; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cylg = (r1, r2, h, n = 8, open = false) => new THREE.CylinderGeometry(r1, r2, h, n, 1, open);
const sphg = (r, nw = 8, nh = 6) => new THREE.SphereGeometry(r, nw, nh);
// a tube between two points [x,y,z] (open cylinder; `ext` lengthens both ends so polylines have no gaps)
function tube(a, b, r, n = 4, ext = 0, closed = false) {
  const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-4; const g = new THREE.CylinderGeometry(r, r, len + ext * 2, n, 1, !closed);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()); return g.applyMatrix4(new THREE.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V3(1, 1, 1))); }
// every vertex of the geometry gets the same uv (a flat colour picked from an atlas cell)
const uvAll = (g, u, v) => { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, u, v); return g; };
// swap the winding + flip the normals (a surface you look at from the other side)
const inward = g => { g = g.index ? g.toNonIndexed() : g; for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; if (!a) continue; const s = a.itemSize, arr = a.array; for (let i = 0; i < a.count; i += 3) for (let c = 0; c < s; c++) { const t = arr[(i + 1) * s + c]; arr[(i + 1) * s + c] = arr[(i + 2) * s + c]; arr[(i + 2) * s + c] = t; } }
  const n = g.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] *= -1; return g; };
// an (nx+1)x(ny+1) vertex grid from fn(i,j) -> [x,y,z]. With i along +x and j going DOWN the faces point +z (like a wall facing the viewer); in a lathe (i = angle
// with x = r sin, z = r cos; j going down) the faces point OUTWARD. flip reverses. wrap averages the seam normals.
function grid(nx, ny, fn, o = {}) {
  const P = [], U = [], idx = [], W = nx + 1;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const p = fn(i, j); P.push(p[0], p[1], p[2]); U.push(o.u ? o.u(i, j) : i / nx, o.v ? o.v(i, j) : 1 - j / ny); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; if (o.flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); g.setIndex(idx); g.computeVertexNormals();
  if (o.wrap) { const n = g.attributes.normal; for (let j = 0; j <= ny; j++) { const a = j * W, b = a + nx, x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
  return g; }
// push a triangle (flat arrays) whose winding is flipped if needed so its normal agrees with `want`
function tri3(P, U, a, b, c, ua, ub, uc, want) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2], acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
  if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
  P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); U.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]); }
const geoFrom = (P, U) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); g.computeVertexNormals(); return g; };
// pixel-exact polygon fill (even-odd, pixel centres): crisp edges, no anti-aliasing
function fillPoly(q, pts, col) { q.fillStyle = col; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) { const cx = x + .5, cy = y + .5; let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > cy) !== (b[1] > cy) && cx < (b[0] - a[0]) * (cy - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; }
    if (ins) q.fillRect(x, y, 1, 1); } }
const countTris = g => { let n = 0; g.traverse(m => { if (m.isMesh && m.geometry && m.visible) { const gg = m.geometry; n += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return Math.round(n); };
// finish a builder: userData.size + tris (measured BEFORE placement), then pos / ry / scale
function done(g, o = {}, size) {
  const ud = g.userData; if (size) ud.size = size; else { const bb = new THREE.Box3().setFromObject(g), s = bb.getSize(V3()); ud.size = [+s.x.toFixed(3), +s.y.toFixed(3), +s.z.toFixed(3)]; }
  ud.tris = countTris(g); if (o.pos) g.position.set(o.pos[0], o.pos[1], o.pos[2]); if (o.ry) g.rotation.y = o.ry; if (o.scale) g.scale.setScalar(o.scale); return g; }

// ---------- shared textures ----------
const woodTex = hex => TX('wood' + hex, 16, 16, (q, w, h, r) => {
  px(q, hex, 0, 0, w, h); q.fillStyle = sh(hex, .78); for (let y = 1; y < h; y += 3) q.fillRect(0, y + (r() * 2 | 0), w, 1);
  q.fillStyle = sh(hex, 1.15); for (let y = 2; y < h; y += 5) q.fillRect(r() * 8 | 0, y, 6 + (r() * 6 | 0), 1); spk(q, w, h, r, sh(hex, .6), 14, .6); }, { mip: true });
const metalTex = (hex = '#9aa0a6') => TX('metal' + hex, 8, 8, (q, w, h, r) => { px(q, hex, 0, 0, w, h); px(q, sh(hex, 1.25), 0, 1, w, 1); px(q, sh(hex, .75), 0, 5, w, 1); spk(q, w, h, r, sh(hex, .6), 8, .5); });
const paintTex = (hex, grime = .5) => TX('paint' + hex + grime, 16, 16, (q, w, h, r) => { px(q, hex, 0, 0, w, h); spk(q, w, h, r, sh(hex, .8), 26, grime); spk(q, w, h, r, sh(hex, 1.15), 14, grime * .6); });

// ============================================================================================================
// 1. PUMPKINS
// ============================================================================================================
const pumpkinSkin = ribs => TX('pk' + ribs, ribs * 4, 32, (q, w, h, r) => {
  px(q, '#c0601b', 0, 0, w, h);
  for (let x = 0; x < w; x += 4) { px(q, '#d9792a', x, 0, 1, h); px(q, '#a8520f', x + 2, 0, 1, h); px(q, '#8e4210', x + 3, 0, 1, h); px(q, '#b25a16', x + 1, 0, 1, h); }
  spk(q, w, h, r, '#6a300a', 70, .55); spk(q, w, h, r, '#e08a34', 40, .45);
  for (let i = 0; i < 5; i++) px(q, '#7a5a1c', r() * w | 0, 2 + (r() * 28 | 0), 2, 1);
  px(q, '#7a5420', 0, 0, w, 2); px(q, '#9a4a12', 0, 30, w, 2); }, { seed: ribs + 5 });
const stemTex = () => TX('pkstem', 8, 24, (q, w, h, r) => {
  px(q, '#6a5530', 0, 0, w, h); for (let x = 0; x < w; x += 2) px(q, '#50401f', x, 0, 1, h);
  px(q, '#586a2c', 0, 0, w, 7); px(q, '#44521f', 1, 0, 1, 7); px(q, '#44521f', 5, 0, 1, 7); px(q, '#62723a', 3, 1, 1, 4); px(q, '#4a4a26', 0, 8, w, 4); spk(q, w, h, r, '#2a2010', 20, .6); });
const glowTex = () => TX('jglow', 8, 2, (q, w, h) => { ['#fff4b0', '#ffe684', '#ffd658', '#ffc83c', '#ffb02a', '#ff9a20', '#f08418', '#d86a10'].forEach((c, i) => px(q, c, i, 0, 1, h)); });

// squat ribbed pumpkin body; origin at the bottom centre, rests on y = 0. returns the indexed geometry
function pumpkinGeo(rx, ry, ribs, ph, sn) {
  const nT = ribs * 3, nP = 8, shift = ry * .94;
  return grid(nT, nP, (i, j) => {
    const th = i / nT * TAU, phi = j / nP * PI, s = Math.sin(phi), c = Math.cos(phi);
    const lump = 1 + .04 * Math.sin(th + ph) * s + (hash2(i % nT, j + sn) - .5) * .02, rib = 1 + .085 * Math.cos(ribs * th) * Math.pow(s, .6);
    let rr = rx * s * rib * lump, y = ry * c;
    if (j === 0) y -= ry * .2; else if (j === 1) y -= ry * .05; else if (j === nP - 1) { rr *= 1.22; y = -ry * .9; } else if (j === nP) y = -ry * .94;
    return [rr * Math.sin(th), y + shift, rr * Math.cos(th)]; }, { wrap: true }); }

// classic jack-o'-lantern faces, in units of the pumpkin width, centred on the front (x right, y up)
const triUp = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx, cy + h / 2]];
const oct = (cx, cy, rad, n = 8) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU + PI / n) * rad, cy + Math.sin(i / n * TAU + PI / n) * rad]);
function grin(hw, y0, curve, n, open, top, bot, th, bh) {
  const xs = Array.from({ length: n + 1 }, (_, k) => -hw + 2 * hw * k / n), cv = x => curve * (x / hw) * (x / hw);
  const T = xs.map((x, k) => [x, y0 + cv(x) - (top.includes(k) ? th : 0)]), Bt = xs.map((x, k) => [x, y0 + cv(x) - open(x) + (bot.includes(k) ? bh : 0)]).reverse(); return T.concat(Bt); }
const FACES = {
  classic: () => [triUp(-.17, .15, .15, .14), triUp(.17, .15, .15, .14), triUp(0, .02, .08, .09), grin(.29, -.04, .09, 8, () => .12, [1, 3, 5, 7], [2, 4, 6], .045, .045)],
  happy: () => [oct(-.18, .15, .06), oct(.18, .15, .06), triUp(0, .02, .07, .07), grin(.3, -.06, .14, 10, x => .03 + .11 * (1 - (x / .3) * (x / .3)), [3, 7], [5], .045, .04)],
  evil: () => [[[-.33, .23], [-.07, .11], [-.19, .05]], [[.33, .23], [.07, .11], [.19, .05]], triUp(0, .0, .1, .12), grin(.35, -.09, .06, 12, () => .16, [1, 3, 5, 7, 9, 11], [2, 4, 6, 8, 10], .075, .065)],
  blank: () => [] };
// triangulate a 2D polygon, then bisect the longest edge until every edge is shorter than maxEdge
function triangulate(poly, maxEdge) {
  const pts = poly.map(p => new THREE.Vector2(p[0], p[1])); let idx = THREE.ShapeUtils.triangulateShape(pts, []); if (!idx.length) idx = poly.slice(2).map((_, i) => [0, i + 1, i + 2]);
  const out = [], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const split = (t, depth) => { const e = [d(t[0], t[1]), d(t[1], t[2]), d(t[2], t[0])], m = Math.max(e[0], e[1], e[2]); if (depth > 4 || m <= maxEdge) { out.push(t); return; }
    const k = e.indexOf(m), a = t[k], b = t[(k + 1) % 3], c = t[(k + 2) % 3], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; split([a, mid, c], depth + 1); split([mid, b, c], depth + 1); };
  for (const t of idx) split(t.map(i => poly[i]), 0); return out; }
// project the face polygons onto the pumpkin surface (rays from the front), giving a glowing patch plus a slightly bigger dark rim
function carveFace(geo, polys, size, cy) {
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial()); mesh.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(), GP = [], GU = [], RP = [], RU = [];
  const proj = (x, y, off) => { rc.set(V3(x, y, size * 2), V3(0, 0, -1)); const h = rc.intersectObject(mesh, false)[0]; return h ? { p: [h.point.x + h.face.normal.x * off, h.point.y + h.face.normal.y * off, h.point.z + h.face.normal.z * off], n: [h.face.normal.x, h.face.normal.y, h.face.normal.z] } : { p: [x, y, 0], n: [0, 0, 1] }; };
  for (const poly of polys) {
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cyy = poly.reduce((a, p) => a + p[1], 0) / poly.length, rad = Math.max(...poly.map(p => Math.hypot(p[0] - cx, p[1] - cyy)));
    const fat = poly.map(p => { const dx = p[0] - cx, dy = p[1] - cyy, l = Math.hypot(dx, dy) || 1; return [cx + dx / l * (l + .035), cyy + dy / l * (l + .035)]; });
    for (const t of triangulate(poly, .07)) { const pr = t.map(p => proj(p[0] * size, cy + p[1] * size, size * .022)), n = pr[0].n; tri3(GP, GU, pr[0].p, pr[1].p, pr[2].p, ...t.map(p => [(Math.min(1, Math.hypot(p[0] - cx, p[1] - cyy) / rad) * 7 + .5) / 8, .5]), n); }
    for (const t of triangulate(fat, .09)) { const pr = t.map(p => proj(p[0] * size, cy + p[1] * size, size * .013)), n = pr[0].n; tri3(RP, RU, pr[0].p, pr[1].p, pr[2].p, [.5, .5], [.5, .5], [.5, .5], n); } }
  return { glow: GP.length ? geoFrom(GP, GU) : null, rim: RP.length ? geoFrom(RP, RU) : null }; }

const FACE_CACHE = {};
function makePumpkin(o, faceName) {
  const size = o.size ?? .4, seed = o.seed ?? 1, r = PS.rng(seed * 7919 + 13), g = new THREE.Group(), ud = g.userData;
  const ribs = 10 + Math.floor(r() * 3), rx = size / 2, ry = rx * (.7 + r() * .08), ph = r() * TAU, shift = ry * .94, B = batch();
  const geo = pumpkinGeo(rx, ry, ribs, ph, seed * 3.7), cyc = shift;
  B.add(geo, MT(pumpkinSkin(ribs)));
  const poleY = ry * .8 + shift, stemM = MT(stemTex()), sw = size * .075;
  for (let k = 0; k < 3; k++) { const y0 = poleY - size * .015 + k * size * .055, ra = lerp(sw, sw * .6, k / 3), rb = lerp(sw, sw * .6, (k + 1) / 3); const sg = cylg(rb, ra, size * .058, 6, k < 2), uvs = sg.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setY(i, (k + uvs.getY(i)) / 3); B.add(sg, stemM, [k * size * .012, y0 + size * .029, k * size * .006], [k * .06, 0, -k * .1]); }
  const topY = poleY + size * .19; ud.bodyTop = poleY; ud.ribs = ribs;
  let glowM = null, rimM = null;
  if (faceName && faceName !== 'blank') {
    const fk = faceName + '|' + size + '|' + seed, f = FACE_CACHE[fk] || (FACE_CACHE[fk] = carveFace(geo, FACES[faceName](), size, cyc));
    glowM = PS.mat(glowTex(), { unlit: true, noFog: true }); rimM = PS.mat(TX('jrim', 4, 4, q => px(q, '#d4781e', 0, 0, 4, 4)), { unlit: true });
    if (f.rim) B.add(f.rim, rimM); if (f.glow) B.add(f.glow, glowM); }
  B.build(g);
  const dark = [.03, .02, .012], rimDark = [.045, .028, .016], rimLit = [.62, .36, .16];
  const apply = k => { k = clamp(k, 0, 1.2); ud.glowK = k; if (!glowM) return; const kk = Math.min(1, k); glowM.uniforms.tint.value.setRGB(lerp(dark[0], 1, kk), lerp(dark[1], 1, kk), lerp(dark[2], 1, kk)); rimM.uniforms.tint.value.setRGB(lerp(rimDark[0], rimLit[0], kk), lerp(rimDark[1], rimLit[1], kk), lerp(rimDark[2], rimLit[2], kk)); };
  ud.lit = faceName && faceName !== 'blank' && o.lit !== false ? 1 : 0;
  ud.setLit = k => { ud.lit = clamp(k); apply(ud.lit); return ud.lit; };
  ud.flicker = t => { const w = .84 + .12 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1) + .06 * Math.sin(t * 41 + 2) + .04 * Math.sin(t * 3.1); if (ud.lit > 0) apply(ud.lit * Math.min(1, w + .12)); return w; };
  ud.update = t => { if (ud.lit > 0) ud.flicker(t); };
  ud.light = V3(0, cyc, 0); ud.lightOut = V3(0, cyc, rx * 1.15); ud.lightColor = [1, .55, .2]; ud.lightRange = Math.max(2, size * 8); ud.faceDir = V3(0, 0, 1); apply(ud.lit);
  return done(g, o, [+(size * 1.07).toFixed(3), +topY.toFixed(3), +(size * 1.07).toFixed(3)]); }
PS.props.jackOLantern = (o = {}) => makePumpkin(o, FACES[o.face] ? o.face : 'classic');
PS.props.pumpkin = (o = {}) => makePumpkin(o, null);

// ============================================================================================================
// 2. KNIVES + KNITTING
// ============================================================================================================
const bladeTex = () => TX('blade', 16, 32, (q, w, h, r) => {
  px(q, '#a4abb2', 0, 0, w, h); px(q, '#6c737a', 0, 0, 2, h); px(q, '#868d94', 2, 0, 1, h); px(q, '#bcc3c9', 5, 0, 2, h); px(q, '#b0b7be', 9, 0, 2, h); px(q, '#c8ced3', 12, 0, 2, h); px(q, '#e4e8ea', 14, 0, 2, h);
  for (let i = 0; i < 8; i++) px(q, '#8a9198', 3 + (r() * 9 | 0), r() * h | 0, 1, 2 + (r() * 6 | 0)); spk(q, w, h, r, '#555b61', 10, .5); px(q, '#7a6a5a', 6, 26 + (r() * 3 | 0), 3, 1); }, { seed: 31 });
const KNIFE = {
  chef: { blade: .22, hl: .125, hwT: .0108, hwB: .0125, hd: .0085, t: .0016, wid: .046, handle: 'black', bolster: true, rivets: [-.035, 0, .035] },
  butcher: { blade: .25, hl: .12, hwT: .0115, hwB: .0135, hd: .0095, t: .0024, wid: .062, handle: 'wood', bolster: true, rivets: [-.03, .0, .03] },
  paring: { blade: .1, hl: .09, hwT: .0085, hwB: .0105, hd: .0075, t: .0012, wid: .02, handle: 'black', bolster: false, rivets: [-.018, .018] } };
// blade outline [u along the blade, z across] from the heel; the spine is at zs, the edge at zs + w (+z)
function bladeOutline(style, L, w, zs) {
  if (style === 'butcher') return [[0, 0], [.7, 0], [.92, .06], [1, .22], [.97, .48], [.86, .78], [.6, .95], [.3, .99], [0, 1]].map(([u, v]) => [u * L, zs + v * w]);
  if (style === 'paring') return [[0, 0], [.75, 0], [1, .45], [.7, .9], [.3, .99], [0, 1]].map(([u, v]) => [u * L, zs + v * w]);
  return [[0, 0], [.55, 0], [.9, .08], [1, .28], [.93, .5], [.8, .78], [.55, .95], [.25, 1], [0, 1]].map(([u, v]) => [u * L, zs + v * w]); }
// the pieces of one knife as geometry lists: steel (blade), grip (handle), fit (bolster + rivets, plain steel / brass)
function knifeParts(style, blade, handleKind) {
  const K = KNIFE[style] || KNIFE.chef, L = blade, hl = K.hl, w = K.wid, zs = -K.hwT, y0 = hl / 2, out = { steel: [], grip: [], fit: [] };
  const outline = bladeOutline(style, L, w, zs), n = outline.length, tau = outline.map(p => K.t * (1 - .85 * clamp((p[1] - zs) / w)));
  const idx = THREE.ShapeUtils.triangulateShape(outline.map(p => new THREE.Vector2(p[1], p[0])), []), P = [], U = [], cz = zs + w / 2, cy = y0 + L / 2;
  const at = (i, sg) => [sg * tau[i], y0 + outline[i][0], outline[i][1]], uvOf = i => [(outline[i][1] - zs) / w, 1 - outline[i][0] / L];
  for (const t of idx) { tri3(P, U, at(t[0], 1), at(t[1], 1), at(t[2], 1), uvOf(t[0]), uvOf(t[1]), uvOf(t[2]), [1, 0, 0]); tri3(P, U, at(t[0], -1), at(t[1], -1), at(t[2], -1), uvOf(t[0]), uvOf(t[1]), uvOf(t[2]), [-1, 0, 0]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (outline[i][0] === 0 && outline[j][0] === 0) continue; const a = at(i, 1), b = at(j, 1), c = at(j, -1), d = at(i, -1), mz = (a[2] + b[2]) / 2, my = (a[1] + b[1]) / 2, want = [0, my - cy, mz - cz];
    tri3(P, U, a, b, c, [0, 0], [1, 0], [1, 1], want); tri3(P, U, a, c, d, [0, 0], [1, 1], [0, 1], want); }
  out.steel.push(geoFrom(P, U));
  const kind = handleKind || K.handle, rT = K.hwT / .924, rB = K.hwB / .924, hg = cylg(rT, rB, hl, 8, false); hg.rotateY(PI / 8); hg.scale(K.hd / K.hwT, 1, 1); out.grip.push(hg);
  if (K.bolster) out.fit.push(box(K.hd * 2.1, .014, w + .003).translate(0, y0 + .006, zs + w / 2));
    for (const ry of K.rivets) { const hwAt = lerp(K.hwB, K.hwT, (ry + hl / 2) / hl) * (K.hd / K.hwT); for (const sx of [-1, 1]) out.fit.push(box(.0018, .0058, .0058).translate(sx * (hwAt + .0006), ry, 0)); }
  const ti = outline.reduce((b, p, i) => p[0] > outline[b][0] ? i : b, 0); out.tip = V3(0, y0 + L, outline[ti][1]); out.edge = V3(0, y0 + L * .5, zs + w); out.K = K; out.hl = hl; return out; }
function knifeGroup(style, blade, handleKind) {
  const g = new THREE.Group(), K = KNIFE[style] || KNIFE.chef, parts = knifeParts(style, blade, handleKind), B = batch(), kind = handleKind || K.handle;
  for (const x of parts.steel) B.add(x, MT(bladeTex()));
  for (const x of parts.grip) B.add(x, MT(kind === 'wood' ? woodTex('#6a4226') : paintTex('#1b1a1d', .35)));
  for (const x of parts.fit) B.add(x, kind === 'wood' ? MT(metalTex('#b8a060')) : MT(metalTex('#aab0b6')));
  B.build(g); const ud = g.userData; ud.tip = parts.tip; ud.length = blade; ud.handleLen = K.hl; ud.totalLength = K.hl / 2 + blade + K.hl / 2; ud.style = style; ud.edge = parts.edge; ud.grip = V3(); return g; }
PS.props.kitchenKnife = (o = {}) => {
  const style = KNIFE[o.style] ? o.style : 'chef', blade = o.blade ?? KNIFE[style].blade; const g = knifeGroup(style, blade, o.handle); return done(g, o); };

// ---------- knife block ----------
PS.props.knifeBlock = (o = {}) => {
  const n = o.knives ?? 5, slots = Math.max(n, o.slots ?? n + 1), r = PS.rng((o.seed ?? 1) * 131 + 7), g = new THREE.Group(), ud = g.userData, B = batch();
  const w = Math.max(.2, .035 * slots + .04), d = .17, hF = .19, hB = .24, wd = MT(woodTex('#6e4a28')), slope = Math.atan((hB - hF) / d);
  const bb = box(w, 1, d); const pos = bb.attributes.position, uvA = bb.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i), top = pos.getY(i) > 0; pos.setY(i, top ? (z > 0 ? hF : hB) : 0); }
  const dims = [[d, hB], [d, hB], [w, d], [w, d], [w, hB], [w, hB]]; for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uvA.setXY(i, uvA.getX(i) * dims[f][0] * 3, uvA.getY(i) * dims[f][1] * 3); }
  bb.computeVertexNormals(); B.add(bb, wd);
  const topY = z => lerp(hB, hF, (z + d / 2) / d), nrm = V3(0, Math.cos(slope), Math.sin(slope)), styles = ['chef', 'butcher', 'paring', 'chef', 'paring', 'butcher', 'paring', 'chef'], blades = { chef: .17, butcher: .15, paring: .08 };
  ud.knives = []; ud.slotPos = []; ud.slotAxis = []; ud.emptySlots = []; ud.styles = [];
  const slotZ = i => (i % 2 ? .015 : -.025), slotX = i => (i - (slots - 1) / 2) * (w - .07) / Math.max(1, slots - 1);
  for (let i = 0; i < slots; i++) {
    const z = slotZ(i), x = slotX(i), p = V3(x, topY(z) + .0015, z); ud.slotPos.push(p); ud.slotAxis.push(nrm.clone().multiplyScalar(-1));
    B.add(box(.007, .003, .052), SOLID('#120c08'), [x, p.y, z], [slope, 0, 0]);
    if (i < n) { const st = styles[i % styles.length], K = KNIFE[st]; const kg = knifeGroup(st, blades[st], i % 2 ? 'wood' : 'black'); kg.position.copy(p).addScaledVector(nrm, K.hl / 2 + .001); kg.rotation.set(PI + slope, PI, 0); kg.userData.rest = kg.position.clone(); kg.userData.blades = blades[st]; g.add(kg); ud.knives.push(kg); ud.styles.push(st); }
    else ud.emptySlots.push(i); }
  B.build(g);
  ud.slot = i => ud.slotPos[i].clone(); ud.slotDir = i => ud.slotAxis[i].clone();
  ud.pull = (i, k) => { const kg = ud.knives[i]; if (!kg) return; kg.position.copy(kg.userData.rest).addScaledVector(nrm, clamp(k) * kg.userData.blades * .85); };
  ud.take = i => { const kg = ud.knives[i]; if (!kg) return null; kg.visible = false; const st = ud.styles[i], k = PS.props.kitchenKnife({ style: st, blade: kg.userData.blades, handle: i % 2 ? 'wood' : 'black' }); k.userData.fromSlot = i; return k; };
  ud.top = (hF + hB) / 2; return done(g, o); };

// ---------- knitting ----------
PS.props.knittingNeedle = (o = {}) => {
  const L = o.length ?? .28, g = new THREE.Group(), ud = g.userData, B = batch(), m = MT(metalTex(o.color || '#a8aeb4')), r = .0024;
  B.add(cylg(r, r, L - .03, 6, false), m, [0, .015, 0]); B.add(cylg(r, .0004, .03, 6, false), m, [0, -L / 2 + .015, 0]); B.add(sphg(.0068, 6, 4), m, [0, L / 2 - .0012, 0]); B.build(g);
  ud.tip = V3(0, -L / 2, 0); ud.knob = V3(0, L / 2, 0); ud.length = L; return done(g, o); };
const yarnTex = hex => TX('yarn' + hex, 16, 16, (q, w, h, r) => {
  px(q, hex, 0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = (x * 2 + y) % 8; if (d < 2) px(q, sh(hex, .86), x, y); else if (d === 4) px(q, sh(hex, 1.1), x, y); }
  spk(q, w, h, r, sh(hex, 1.2), 20, .4); spk(q, w, h, r, sh(hex, .8), 16, .4); });
PS.props.yarnBall = (o = {}) => {
  const col = o.color || '#a8483a', g = new THREE.Group(), ud = g.userData, B = batch(), rr = .045, ym = MT(yarnTex(col));
  B.add(sphg(rr, 12, 8), ym, [0, rr * .95, 0], [0, 0, 0], [1, .95, 1]);
  const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([rr * .75 + k * rr * 2.6, lerp(rr * .45, .0016, Math.pow(k, .6)), rr * .3 + Math.sin(k * 3.1) * rr * .9 + k * rr]); }
  for (let i = 0; i < 6; i++) B.add(tube(pts[i], pts[i + 1], .0018, 4, .001), ym);
  B.build(g); ud.radius = rr; ud.end = V3(...pts[6]); return done(g, o); };
const weaveTex = () => TX('weave', 16, 16, (q, w, h, r) => {
  px(q, '#5a4020', 0, 0, w, h); for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const hz = ((x + y) / 4) % 2 === 0; px(q, hz ? '#b08e54' : '#9a7a44', x, y + (hz ? 0 : 0), 4, 3); px(q, hz ? '#c8a868' : '#b08e54', x + (hz ? 0 : 1), y + (hz ? 0 : 0), hz ? 3 : 2, 1); }
  spk(q, w, h, r, '#3a2810', 20, .5); }, { mip: true });
PS.props.knittingBasket = (o = {}) => {
  const r = PS.rng((o.seed ?? 1) * 17 + 3), g = new THREE.Group(), ud = g.userData, B = batch(), rt = .17, rbm = .13, H = .22, wv = MT(weaveTex()), dark = MT(paintTex('#3a2a14', .5));
  B.add(cylg(rt, rbm, H, 10, true), wv, [0, H / 2, 0]); B.add(inward(cylg(rt - .006, rbm - .006, H - .01, 10, true)), dark, [0, H / 2 + .005, 0]); B.add(cylg(rbm - .004, rbm - .004, .01, 10), dark, [0, .015, 0]);
  B.add(new THREE.TorusGeometry(rt, .009, 4, 10).rotateX(PI / 2), wv, [0, H, 0]); B.add(new THREE.TorusGeometry(rbm + .004, .007, 4, 10).rotateX(PI / 2), wv, [0, .01, 0]);
  for (const sx of [-1, 1]) B.add(new THREE.TorusGeometry(.028, .006, 4, 8), wv, [sx * (rt + .018), H - .05, 0]);
  const cols = ['#a8483a', '#4a6a8a', '#c8a850'], balls = [[-.05, .09, .03, 0], [.06, .1, -.02, 1], [.01, .105, .08, 2]];
  for (const [x, y, z, ci] of balls) B.add(sphg(.05, 8, 6), MT(yarnTex(cols[ci])), [x, y + .035, z], [r(), r() * 3, 0]);
  const ndl = MT(metalTex('#a8aeb4')); ud.needles = [];
  [[-.03, .16, .04, -.38, .0, .26], [.04, .15, -.01, .22, 0, -.34]].forEach(([x, y, z, rx, ry, rz], i) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), up = V3(0, 1, 0).applyQuaternion(q), ctr = V3(x, y, z).addScaledVector(up, .09), L = .3;
    B.add(cylg(.0024, .0024, L - .03, 6, false), ndl, [ctr.x, ctr.y, ctr.z], [rx, ry, rz]); const knob = ctr.clone().addScaledVector(up, L / 2); B.add(sphg(.0068, 6, 4), ndl, [knob.x, knob.y, knob.z]);
    ud.needles.push(knob.clone()); });
  B.build(g); ud.top = H; ud.radius = rt; return done(g, o); };

// ============================================================================================================
// 3. WIRE HANGER
// ============================================================================================================
PS.props.wireHanger = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, B = batch(), m = MT(metalTex('#8e949a')), rw = .0026, W = .21, Hh = .13, ext = rw * .9;
  const wire = pts => { for (let i = 0; i < pts.length - 1; i++) B.add(tube(pts[i], pts[i + 1], rw, 5, ext), m); };
  const hook = (cx, cy, rad, a0, a1, n, plane) => { const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push(plane === 'xy' ? [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0] : [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0]); } return pts; };
  if (!o.straight) {
    wire([[-W, 0, 0], [W, 0, 0]]); wire([[W, 0, 0], [0, Hh, 0], [-W, 0, 0]]); wire([[0, Hh, 0], [0, Hh + .035, 0]]);
    const hp = hook(.026, Hh + .035, .026, PI, -PI * .38, 12, 'xy'); wire(hp);
    let top = hp[0]; for (const p of hp) if (p[1] > top[1]) top = p; ud.hookTop = V3(...top); ud.endPoint = V3(...hp[hp.length - 1]);
  } else {
    const L = .8, hp = hook(L / 2, .024, .024, -PI / 2, PI * .85, 11, 'xy').map(p => [p[0], p[1] - .0, 0]);
    wire([[-L / 2, 0, 0], [L / 2, 0, 0]]); wire(hp);
    let top = hp[0]; for (const p of hp) if (p[1] > top[1]) top = p; ud.hookTop = V3(...top); ud.endPoint = V3(-L / 2, 0, 0); ud.length = L + .12;
  }
  B.build(g); return done(g, o); };

// ============================================================================================================
// 4. REVOLVER
// ============================================================================================================
const gunTex = () => TX('gun', 16, 16, (q, w, h, r) => {
  px(q, '#262a30', 0, 0, w, h); px(q, '#3c424a', 0, 2, w, 1); px(q, '#16181c', 0, 9, w, 1); px(q, '#454c55', 0, 5, 7, 1); spk(q, w, h, r, '#5a616a', 14, .6); spk(q, w, h, r, '#101214', 18, .6); }, { seed: 77 });
const gripTex = () => TX('grip', 16, 16, (q, w, h, r) => {
  px(q, '#5c3416', 0, 0, w, h); for (let y = 0; y < h; y += 2) px(q, '#4a2a10', 0, y, w, 1); px(q, '#74441e', 2, 0, 1, h); px(q, '#74441e', 9, 0, 1, h);
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { px(q, '#3a200c', x, y, 1, 1); px(q, '#3a200c', x + 2, y + 2, 1, 1); } spk(q, w, h, r, '#2a1608', 12, .6); }, { seed: 78 });
const flashTex = () => TX('muzzle', 32, 32, (q, w, h) => {
  const star = (sc, col) => { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, long = i % 4 === 0, mid = i % 2 === 0, R = (long ? 15.5 : mid ? 9.5 : 4.5) * sc; pts.push([16 + Math.sin(a) * R, 16 - Math.cos(a) * R]); } fillPoly(q, pts, col); };
  star(1, '#ff7a1a'); star(.74, '#ffb02a'); star(.46, '#ffe070'); star(.24, '#fffbe0'); });
PS.props.revolver = (o = {}) => {
  const bl = o.barrel ?? .1, g = new THREE.Group(), ud = g.userData, B = batch(), steel = MT(gunTex()), wood = MT(gripTex()), hole = SOLID('#060606'), a = 18 * PI / 180;
  const zc = .067, zb = .08, drumY0 = .004, drumY1 = .062, muzzleY = drumY1 + bl;
  const gdir = V3(0, -Math.sin(a), -Math.cos(a));
  B.add(box(.03, .03, .09), wood, [0, 0, 0], [-a, 0, 0]); B.add(box(.034, .036, .016), wood, [0, gdir.y * .05, gdir.z * .05], [-a, 0, 0]);
  B.add(box(.026, .06, .05), steel, [0, -.02, .0655]); B.add(cylg(.0215, .0215, drumY1 - drumY0, 12), steel, [0, (drumY0 + drumY1) / 2, zc]);
  B.add(box(.02, .066, .006), steel, [0, .029, .0905]); B.add(box(.022, .03, .012), steel, [0, .045, .056]);
  B.add(cylg(.0085, .0085, bl, 8), steel, [0, drumY1 + bl / 2, zb]); B.add(box(.012, bl * .7, .012), steel, [0, drumY1 + bl * .35, .0645]);
  B.add(box(.003, .01, .007), steel, [0, muzzleY - .008, zb + .0125]); B.add(box(.012, .01, .006), steel, [0, -.046, .0935]);
  B.add(box(.007, .014, .024), steel, [0, -.054, .084], [.55, 0, 0]);
  B.add(box(.007, .052, .004), steel, [0, .046, .027]); B.add(box(.007, .004, .0195), steel, [0, .07, .0365]); B.add(box(.005, .004, .014), steel, [0, .043, .039], [.3, 0, 0]);
  B.add(new THREE.CircleGeometry(.0042, 6).rotateX(-PI / 2), hole, [0, muzzleY + .0004, zb]);
  for (let k = 0; k < 6; k++) { const t = k * PI / 3; B.add(new THREE.CircleGeometry(.0048, 6).rotateX(-PI / 2), hole, [Math.sin(t) * .0125, drumY1 + .0004, zc + Math.cos(t) * .0125]); }
  B.build(g);
  { const bb = new THREE.Box3().setFromObject(g), sv = bb.getSize(V3()); ud.sizeNoFlash = [+sv.x.toFixed(3), +sv.y.toFixed(3), +sv.z.toFixed(3)]; }
  const fm = PS.mat(flashTex(), { unlit: true, noFog: true, side: DS }), fg = new THREE.Group(); fg.position.set(0, muzzleY, zb);
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(.13, .24), fm), p2 = new THREE.Mesh(new THREE.PlaneGeometry(.13, .24), fm), p3 = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), fm);
  p1.position.y = .06; p2.position.y = .06; p2.rotation.y = PI / 2; p3.rotation.x = -PI / 2; p3.position.y = .004; fg.add(p1, p2, p3); fg.visible = false; fg.frustumCulled = false; g.add(fg);
  ud.muzzle = V3(0, muzzleY, zb); ud.light = V3(0, muzzleY + .07, zb); ud.dir = V3(0, 1, 0); ud.flashColor = [1, .62, .2]; ud.flashGroup = fg;
  ud.flash = k => { k = clamp(k); fg.visible = k > .01; fg.scale.setScalar(.35 + .95 * k); fg.rotation.y = k * 2.2; return fg.visible; };
  ud.flash(o.flash ?? 0); return done(g, o, ud.sizeNoFlash); };

// ============================================================================================================
// 5. TRICK-OR-TREAT BAGS
// ============================================================================================================
const CANDY = ['#d8681c', '#241830', '#b02828', '#e0d0a0', '#3a64a8', '#d4a82c', '#6a3a1c', '#8a3a8a'];
const candyTex = () => TX('candy', 16, 8, (q, w, h) => { CANDY.forEach((c, i) => { const x = (i % 4) * 4, y = (i >> 2) * 4; px(q, c, x, y, 4, 4); px(q, sh(c, 1.3), x, y, 4, 1); px(q, sh(c, .7), x, y + 3, 4, 1); }); });
// wrapped candies scattered in an ellipse around (cx, cy, cz); adds to the batch B
function candy(B, r, n, cx, cy, cz, rx, rz, rise = .03) {
  const m = MT(candyTex());
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()), col = Math.floor(r() * 8), big = r() < .25, w = big ? .045 : .03 + r() * .01, hh = big ? .014 : .016, dd = big ? .024 : .016;
    const u = ((col % 4) * 4 + 2) / 16, v = 1 - ((col >> 2) * 4 + 2) / 8, pos = [cx + Math.cos(a) * d * rx, cy + r() * rise, cz + Math.sin(a) * d * rz], rot = [r() * 2.4, r() * TAU, r() * 2.4];
    const parts = [uvAll(box(w, hh, dd), u, v)]; if (!big) for (const s of [-1, 1]) parts.push(uvAll(box(.009, hh * .7, dd * .4), u, v).translate(s * (w / 2 + .004), 0, 0));
    B.add(merge(parts), m, pos, rot); } }
function pumpkinFacePrint(q, x0, y0, w, h) {
  const blk = '#17100c';
  const eyes = [[x0 + w * .22, y0 + h * .28, x0 + w * .38, y0 + h * .28, x0 + w * .3, y0 + h * .12], [x0 + w * .62, y0 + h * .28, x0 + w * .78, y0 + h * .28, x0 + w * .7, y0 + h * .12]];
  for (const e of eyes) fillPoly(q, [[e[0], e[1]], [e[2], e[3]], [e[4], e[5]]], blk);
  fillPoly(q, [[x0 + w * .46, y0 + h * .44], [x0 + w * .54, y0 + h * .44], [x0 + w * .5, y0 + h * .34]], blk);
  const m = []; for (let k = 0; k <= 6; k++) m.push([x0 + w * (.2 + .6 * k / 6), y0 + h * (.56 + (k % 2 ? .1 : 0)) + Math.pow((k / 3 - 1), 2) * -h * .04 + h * .04]);
  for (let k = 6; k >= 0; k--) m.push([x0 + w * (.2 + .6 * k / 6), y0 + h * (.8 - (k % 2 ? 0 : .08))]); fillPoly(q, m, blk); }
const printTex = base => TX('print' + base, 64, 64, (q, w, h, r) => {
  px(q, base, 0, 0, w, h); for (let x = 3; x < w; x += 8) { px(q, sh(base, .88), x, 0, 1, h); } spk(q, w, h, r, sh(base, .8), 40, .4); spk(q, w, h, r, sh(base, 1.15), 24, .35);
  pumpkinFacePrint(q, 6, 12, 52, 44); px(q, '#4a5a22', 28, 6, 8, 5); px(q, '#2a3a12', 30, 4, 4, 3); px(q, sh(base, .75), 0, 0, w, 2); px(q, sh(base, .75), 0, h - 2, w, 2); });
const pailTex = base => TX('pail' + base, 96, 32, (q, w, h, r) => {
  px(q, base, 0, 0, w, h); for (let x = 0; x < w; x += 8) { px(q, sh(base, .82), x + 4, 0, 1, h); px(q, sh(base, 1.12), x, 0, 1, h); } spk(q, w, h, r, sh(base, .8), 80, .4); spk(q, w, h, r, sh(base, 1.18), 40, .3);
  pumpkinFacePrint(q, 34, 5, 28, 25); px(q, sh(base, .7), 0, 0, w, 1); px(q, sh(base, .75), 0, h - 2, w, 2); }, { seed: 91 });
const clothTex = hex => TX('cloth' + hex, 16, 16, (q, w, h, r) => { px(q, hex, 0, 0, w, h); spk(q, w, h, r, sh(hex, .86), 38, .5); spk(q, w, h, r, sh(hex, 1.07), 22, .4); for (let x = 0; x < w; x += 5) px(q, sh(hex, .94), x, 0, 1, h); px(q, sh(hex, .8), 0, h - 2, w, 1); });

PS.props.treatBag = (o = {}) => {
  const style = ['pillowcase', 'plastic', 'pail'].includes(o.style) ? o.style : 'pillowcase', seed = o.seed ?? 1, r = PS.rng(seed * 211 + 5), g = new THREE.Group(), ud = g.userData, B = batch();
  ud.style = style;
  if (style === 'pillowcase') {
    const base = o.color || '#ddd5bd', fm = MT(clothTex(base)), inner = MT(clothTex(sh(base, .72)));
    const prof = [[0, 0], [.012, .075], [.07, .118], [.14, .13], [.21, .114], [.265, .09], [.3, .098], [.325, .11]], n = 10, top = prof.length - 1;
    const ring = (i, j) => { const th = i / n * TAU, jit = 1 + (hash2(i % n, j + seed * 3.1) - .5) * .3, rr = prof[j][1] * (j === 0 ? 0 : jit), y = prof[j][0] + (j >= 6 ? (hash2(i % n, 9 + seed) - .5) * .04 : 0);
      return [rr * Math.sin(th) + j * j * .0012, y, rr * Math.cos(th) - j * .003]; };
    B.add(grid(n, top, ring, { wrap: true, flip: true, v: (i, j) => j / top }), fm);
    const ox = top * top * .0012, oz = -top * .003, sc = [1, .93, .8], dy = [0, -.04, -.1];
    B.add(inward(grid(n, 2, (i, j) => { const p = ring(i, top); return [(p[0] - ox) * sc[j] + ox, p[1] + dy[j], (p[2] - oz) * sc[j] + oz]; }, { wrap: true, flip: true })), inner);
    candy(B, r, 13, ox, .285, oz, .075, .075, .06); ud.top = .33; ud.openingCenter = V3(ox, .325, oz);
  } else if (style === 'plastic') {
    const base = o.color || '#d2641a', pf = MT(printTex(base)), side = MT(paintTex(base, .5)), hw = .125, hb = .055, H = .36;
    const wF = v => lerp(hw * .8, hw * 1.03, Math.sin(Math.min(1, v * 1.4) * PI / 2)), tF = v => lerp(hb * .45, hb, sstep(0, .55, v));
    const wall = sg => grid(4, 6, (i, j) => { const u = i / 4, v = j / 6, bulge = Math.sin(u * PI) * Math.sin(Math.min(1, v * 1.15) * PI * .9) * .025;
      return [(u - .5) * 2 * wF(v), H * (1 - v) + (v < .05 ? (hash2(i, 3 + seed) - .5) * .03 : 0), sg * (tF(v) + bulge) + (i > 0 && i < 4 ? (hash2(i, j + seed * 2) - .5) * .008 : 0)]; }, { flip: sg < 0 });
    B.add(wall(1), pf); B.add(wall(-1), pf);
    for (const sx of [-1, 1]) B.add(grid(2, 6, (i, j) => { const v = j / 6; return [sx * wF(v), H * (1 - v), (i / 2 - .5) * 2 * tF(v)]; }, { flip: sx > 0 }), side);
    B.add(box(hw * 1.6, .01, hb * 1.8), side, [0, .005, 0]);
    for (const sx of [-1, 1]) B.add(box(.03, .1, .004), side, [sx * hw * .5, H + .045, 0], [0, 0, sx * .06]);
    B.add(box(hw * 1.06, .03, .004), side, [0, H + .09, 0]);
    candy(B, r, 9, 0, H + .01, 0, hw * .6, hb * .35, .05); ud.top = H; ud.openingCenter = V3(0, H, 0);
  } else {
    const base = o.color || '#d2641a', pm = MT(pailTex(base)), inn = MT(paintTex(sh(base, .65), .5)), ribs = 12, n = 24, H = .19, hand = MT(paintTex('#17120e', .3));
    const prof = [[0, .0], [.012, .085], [.06, .12], [.11, .138], [.155, .132], [.185, .115], [.19, .108]], top = prof.length - 1;
    B.add(grid(n, top, (i, j) => { const th = i / n * TAU + PI, rr = prof[j][1] * (1 + .035 * Math.cos(ribs * th)); return [rr * Math.sin(th), prof[j][0], rr * Math.cos(th)]; }, { wrap: true, flip: true, v: (i, j) => j / top }), pm);
    B.add(inward(grid(n, 1, (i, j) => { const th = i / n * TAU, rr = j ? .1 : .106; return [rr * Math.sin(th), j ? .13 : .19, rr * Math.cos(th)]; }, { wrap: true })), inn);
    B.add(new THREE.TorusGeometry(.108, .006, 4, 12).rotateX(PI / 2), SOLID(sh(base, .82)), [0, H, 0]);
    const pts = [], lean = .45; for (let i = 0; i <= 10; i++) { const a = PI * i / 10, k = i > 5 ? .86 : 1, hy = Math.sin(a) * .13 * k, sk = i > 5 ? 1 + (i - 5) * .01 : 1; pts.push([Math.cos(a) * .114 * sk, H + hy * Math.cos(lean), hy * Math.sin(lean) + (i > 5 ? (i - 5) * .006 : 0)]); }
    for (let i = 0; i < 10; i++) B.add(tube(pts[i], pts[i + 1], .0042, 4, .0025), hand);
    for (const sx of [-1, 1]) B.add(box(.026, .022, .016), hand, [sx * .114, H, 0]);
    candy(B, r, 11, 0, H - .015, 0, .075, .075, .05); ud.top = H; ud.openingCenter = V3(0, H, 0); }
  B.build(g); return done(g, o); };

// ============================================================================================================
// 6. CLOTHESLINE
// ============================================================================================================
const sheetTex = hex => TX('sheet' + hex, 16, 32, (q, w, h, r) => {
  px(q, hex, 0, 0, w, h); spk(q, w, h, r, sh(hex, .9), 40, .45); spk(q, w, h, r, sh(hex, 1.05), 20, .4);
  q.globalAlpha = .22; px(q, sh(hex, .7), 0, h - 7, w, 6); q.globalAlpha = 1; px(q, sh(hex, .9), 0, 3, w, 1); px(q, sh(hex, .9), 0, h - 3, w, 1); px(q, sh(hex, .93), 0, 0, 1, h); px(q, sh(hex, .93), w - 1, 0, 1, h); });
const teeTex = hex => TX('tee' + hex, 24, 28, (q, w, h, r) => {
  const inTee = (x, y) => { if (y < 3) return x >= 5 && x < 19 && !(x >= 9 && x < 15 && y < 2); if (y < 10) { const slope = (y - 3) * .5; return (x >= 6 && x < 18) || (x >= 0 && x < 6 && y >= 3 + (6 - x) * .0 && y < 10 - slope * .6 + (x < 3 ? -1 : 0)) || (x >= 18 && x < 24 && y < 10 - slope * .6 + (x > 20 ? -1 : 0)); } return x >= 6 && x < 18; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inTee(x, y)) px(q, hex, x, y); spk(q, w, h, r, sh(hex, .85), 50, .5);
  for (let x = 9; x < 15; x++) px(q, sh(hex, .75), x, 2); px(q, sh(hex, .8), 6, h - 2, 12, 1); });
const jeansTex = hex => TX('jeans' + hex, 24, 32, (q, w, h, r) => {
  const inJ = (x, y) => y < 3 ? x >= 5 && x < 19 : y < 12 ? x >= 5 && x < 19 : (x >= 5 && x < 11.5) || (x >= 12.5 && x < 19);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inJ(x, y)) px(q, hex, x, y); spk(q, w, h, r, sh(hex, .8), 60, .5); spk(q, w, h, r, sh(hex, 1.15), 30, .4);
  px(q, sh(hex, 1.3), 5, 3, 14, 1); px(q, '#c8b070', 11, 1, 2, 1); px(q, sh(hex, .7), 5, h - 2, 6, 1); px(q, sh(hex, .7), 13, h - 2, 6, 1); });
const towelTex = hex => TX('towel' + hex, 16, 16, (q, w, h, r) => { px(q, hex, 0, 0, w, h); px(q, sh(hex, 1.35), 0, 3, w, 2); px(q, sh(hex, 1.35), 0, h - 5, w, 2); spk(q, w, h, r, sh(hex, .85), 40, .5); });

PS.props.clothesline = (o = {}) => {
  const L = o.length ?? 6, Hy = o.height ?? 2.1, nS = o.sheets ?? 3, mixed = o.clothes === 'mixed', metalPost = o.post === 'metal', wind = o.wind ?? 1, seed = o.seed ?? 1, r = PS.rng(seed * 313 + 11);
  const g = new THREE.Group(), ud = g.userData, B = batch(), sag = .07 * L / 6, ax = L / 2 - .055;
  const lineYAt = x => Hy - sag * (1 - Math.pow(x / ax, 2));
  const wd = MT(woodTex('#6a5a44')), mt = MT(metalTex('#7e868c')), peg = MT(woodTex('#a07c4c')), lineM = SOLID('#c8c4b4');
  for (const sx of [-1, 1]) {
    const px0 = sx * L / 2;
    if (metalPost) { B.add(cylg(.028, .03, Hy + .2, 8), mt, [px0, (Hy + .2) / 2, 0]); B.add(box(.04, .035, .26), mt, [px0 - sx * .07, Hy + .06, 0]); B.add(cylg(.034, .034, .03, 8), mt, [px0, Hy + .205, 0]); B.add(cylg(.07, .07, .05, 8), SOLID('#7a766c'), [px0, .025, 0]); }
    else { B.add(box(.09, Hy + .25, .09), wd, [px0, (Hy + .25) / 2, 0]); B.add(box(.06, .05, .4), wd, [px0, Hy + .12, 0]); B.add(box(.05, .05, .24), wd, [px0 - sx * .05, Hy - .2, 0], [0, 0, sx * .6]); }
    B.add(box(.014, .02, .02), mt, [sx * (L / 2 - .05), Hy, 0]); }
  const NL = 14, lp = []; for (let i = 0; i <= NL; i++) { const x = -ax + 2 * ax * i / NL; lp.push([x, lineYAt(x), 0]); } for (let i = 0; i < NL; i++) B.add(tube(lp[i], lp[i + 1], .0035, 4, .001), lineM);
  ud.posts = [V3(-L / 2, Hy + .25, 0), V3(L / 2, Hy + .25, 0)];
  // layout: slots[0..nS] hold nothing (sheets mode) or small clothes (mixed); between-slot k odd = a clear gap
  const items = [], small = () => { const kinds = ['tee', 'jeans', 'tee', 'towel']; const k = kinds[Math.floor(r() * kinds.length)]; return { kind: k, w: k === 'tee' ? .5 : k === 'jeans' ? .44 : .6, h: k === 'tee' ? .62 : k === 'jeans' ? .86 : .78 }; };
  const clusterW = c => c.reduce((a, it) => a + it.w, 0) + .1 * Math.max(0, c.length - 1);
  const slots = []; for (let k = 0; k <= nS; k++) { const between = k > 0 && k < nS; if (between && (k % 2 === 1 || !mixed)) slots.push({ gap: true }); else if (!mixed) slots.push({ cluster: [] }); else { const c = []; const cnt = between ? 1 + Math.floor(r() * 2) : 1 + Math.floor(r() * 2); for (let i = 0; i < cnt; i++) c.push(small()); slots.push({ cluster: c }); } }
  const usable = L - .5, gapW0 = .66, clW = slots.reduce((a, s) => a + (s.cluster ? clusterW(s.cluster) + (s.cluster.length ? .12 : 0) : 0), 0), nGap = slots.filter(s => s.gap).length;
  let sheetW = Math.min(1.4, (usable - nGap * gapW0 - clW - .1 * nS) / Math.max(1, nS)), gapW = gapW0; if (sheetW < .75) { sheetW = .75; gapW = Math.max(.5, (usable - sheetW * nS - clW) / Math.max(1, nGap)); }
  const seq = []; slots.forEach((s, k) => { if (s.gap) seq.push({ gap: gapW }); else for (const it of s.cluster) seq.push(it); if (k < nS) seq.push({ kind: 'sheet', w: sheetW, h: Math.min(1.45, Hy - .6) }); });
  const total = seq.reduce((a, it) => a + (it.gap || it.w) + (it.gap ? 0 : .05), 0); let cx = -total / 2; ud.gaps = []; ud.behind = []; ud.sheetX = []; ud.gapWidth = gapW; let si = 0;
  const sets = new Map(), getSet = mat => { if (!sets.has(mat)) sets.set(mat, { mat, P: [], U: [], N: [], Mt: [] }); return sets.get(mat); };
  const SHEETC = ['#dedad0', '#d4cdb2', '#dadddf', '#cdd4da'], TEEC = ['#6a8aa0', '#a8584a', '#c8bfa0', '#5a7a52'], JEANC = ['#3a4c6c', '#4a5a78'], TOWC = ['#a85a3a', '#d8d0b8', '#4a7a7a'];
  function cloth(set, x0, w, h, nx, ny, z0, amp, ph, fold) {
    for (const side of [1, -1]) {
      const zz = z0 + side * .002; const vert = (i, j) => { const u = i / nx, v = j / ny, x = x0 + u * w, y = lineYAt(clamp(x, -ax, ax)) - .02 - v * h, z = zz + fold * Math.sin(u * TAU * 2.2 + ph) * v; return { p: [x, y, z], uv: [side > 0 ? u : 1 - u, 1 - v], m: [u, v, amp, ph] }; };
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1), tris = side > 0 ? [[a, c, b], [b, c, d]] : [[a, b, c], [b, d, c]];
        for (const t of tris) for (const vv of t) { set.P.push(...vv.p); set.U.push(...vv.uv); set.N.push(0, 0, side); set.Mt.push(...vv.m); } } } }
  for (const it of seq) {
    if (it.gap) { ud.gaps.push(V3(cx + it.gap / 2, 0, 0)); cx += it.gap; continue; }
    const x0 = cx, ph = r() * TAU, z0 = (r() - .5) * .02;
    if (it.kind === 'sheet') { const tex = sheetTex(SHEETC[si % SHEETC.length]); cloth(getSet(MT(tex)), x0, it.w, it.h, 5, 7, z0, .17, ph, .02); ud.sheetX.push(x0 + it.w / 2); ud.behind.push(V3(x0 + it.w / 2, 0, -.45)); si++; }
    else { const tex = it.kind === 'tee' ? teeTex(TEEC[Math.floor(r() * TEEC.length)]) : it.kind === 'jeans' ? jeansTex(JEANC[Math.floor(r() * JEANC.length)]) : towelTex(TOWC[Math.floor(r() * TOWC.length)]); cloth(getSet(MT(tex)), x0, it.w, it.h, 4, 5, z0, .12, ph, .012); }
    for (const px1 of [x0 + it.w * .12, x0 + it.w * .88]) B.add(box(.014, .07, .02), peg, [px1, lineYAt(clamp(px1, -ax, ax)) - .01, 0]);
    cx += it.w + .05; }
  B.build(g);
  const live = [];
  for (const s of sets.values()) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(s.P), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(s.N), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(s.U), 2));
    const mesh = new THREE.Mesh(geo, s.mat); mesh.frustumCulled = false; g.add(mesh); live.push({ mesh, rest: new Float32Array(s.P), meta: new Float32Array(s.Mt) }); }
  ud.update = t => {
    for (const c of live) { const pos = c.mesh.geometry.attributes.position, a = pos.array, rs = c.rest, m = c.meta;
      for (let k = 0, n = a.length / 3; k < n; k++) { const v = m[k * 4 + 1], amp = m[k * 4 + 2], ph = m[k * 4 + 3], x = rs[k * 3], s = Math.pow(v, 1.3);
        const gust = .5 + .5 * Math.sin(t * .9 + ph * .5), fl = .6 * Math.sin(t * 2.3 + ph * 1.3 + x * 2.1) + .4 * Math.sin(t * 4.9 + ph * 2.7 + x * 3.7 + v * 2), dz = amp * wind * s * (.3 + .7 * gust + .3 * fl);
        a[k * 3] = x; a[k * 3 + 1] = rs[k * 3 + 1] - Math.abs(dz) * .2 * s; a[k * 3 + 2] = rs[k * 3 + 2] + dz; }
      pos.needsUpdate = true; } };
  ud.update(0); ud.lineY = Hy; ud.lineYAt = lineYAt; return done(g, o, [L + .2, Hy + .25, 1.1]); };

// ============================================================================================================
// 7. HEDGE
// ============================================================================================================
const hedgeTex = () => TX('hedge', 32, 32, (q, w, h, r) => {
  px(q, '#27421f', 0, 0, w, h);
  for (let i = 0; i < 150; i++) { const c = ['#37602a', '#1f3618', '#44702f', '#16280f', '#2e5024'][r() * 5 | 0]; px(q, c, r() * w | 0, r() * h | 0, 1 + (r() * 3 | 0), 1 + (r() * 2 | 0)); }
  for (let i = 0; i < 10; i++) px(q, '#4f7a38', r() * w | 0, r() * h | 0, 2, 1); for (let i = 0; i < 6; i++) px(q, '#3a2a18', r() * w | 0, r() * h | 0, 1, 2); }, { mip: true, seed: 1999 });
PS.props.hedge = (o = {}) => {
  const L = o.length ?? 6, H = o.height ?? 1.8, D = o.depth ?? .9, seed = o.seed ?? 1, g = new THREE.Group(), ud = g.userData;
  const cols = clamp(Math.round(L / .32), 4, 56), sect = [[-1, 0], [-1, .3], [-1, .62], [-.93, .86], [-.7, .97], [-.35, 1], [0, 1.0], [.35, 1], [.7, .97], [.93, .86], [1, .62], [1, .3], [1, 0]], M = sect.length - 1;
  const lump = (i, j) => { const x = i / cols * L; return (vnoise(x * 2.4, j * .9 + 3, seed) - .5) * 2 * .6 + (vnoise(x * 6.1, j * 1.9, seed + 4) - .5) * .4; };
  const topAt = x => H + (vnoise((x + L / 2) * 2.4, 4 * .9 + 3, seed) - .5) * 1.2 * .16;
  const geo = grid(cols, M, (i, j) => { const x = i / cols * L - L / 2, sp = sect[j], top = sp[1] >= .8 ? 1 : 0, lm = lump(i, j) * (sp[1] > .15 ? 1 : 0); let z = sp[0] * D / 2, y = sp[1] * H;
    const out = .09 * lm * (sp[1] < .9 ? 1 : .4), upj = sp[1] >= .86 ? .16 * lm : 0; z += Math.sign(sp[0]) * out * (Math.abs(sp[0]) > .5 ? 1 : 0); y += upj; return [x, y, z]; }, { u: (i, j) => i / cols * L * 1.3, v: (i, j) => j * 0.9, flip: false });
  const B = batch(); B.add(geo, MT(hedgeTex()));
  for (const sx of [-1, 1]) { const P = [], U = []; for (let j = 0; j < M; j++) { const a = sect[j], b = sect[j + 1]; tri3(P, U, [sx * L / 2, 0, 0], [sx * L / 2, a[1] * H, a[0] * D / 2], [sx * L / 2, b[1] * H, b[0] * D / 2], [.5, 0], [a[0] * .5 + .5, a[1]], [b[0] * .5 + .5, b[1]], [sx, 0, 0]); } B.add(geoFrom(P, U), MT(hedgeTex())); }
  B.build(g); ud.top = H; ud.topAt = topAt; ud.length = L; return done(g, o, [L, +(H + .08).toFixed(3), D]); };

// ============================================================================================================
// 8. LEAVES
// ============================================================================================================
const LEAFC = [['#b5601c', '#9a4a14', '#cc7a2a'], ['#9a2c1c', '#7a2014', '#b84024'], ['#6a4220', '#52321a', '#80542a'], ['#b4902c', '#967420', '#c8a63c']];
const leafIn = (kind, x, y) => {
  if (kind === 0) { const yy = y + .05, rr = Math.hypot(x, yy), a = Math.atan2(x, yy), lobes = [[0, 1], [.95, .92], [-.95, .92], [1.85, .72], [-1.85, .72]]; let lim = .34; for (const [l, s] of lobes) lim = Math.max(lim, (.34 + .62 * Math.max(0, 1 - Math.abs(a - l) / .42)) * (s > .9 ? 1 : s)); return (rr < lim && yy > -.78) || (y < -.62 && y > -.98 && Math.abs(x) < .08); }
  if (kind === 1) { const k = 1 + .13 * Math.sin(y * 13); return (x * x) / (.3 * k * k) + (y * y) / .78 < 1 || (y < -.8 && Math.abs(x) < .07); }
  if (kind === 2) { const t = (y + .9) / 1.8; if (t < 0 || t > 1) return false; return Math.abs(x) < .66 * Math.sin(PI * Math.pow(t, .75)) * (1 + .07 * Math.sin(y * 21)); }
  return Math.hypot(x, y + .05) < .66 || (y < -.65 && y > -.98 && Math.abs(x) < .07); };
const leafAtlas = () => TX('leaves', 64, 64, (q, w, h, r) => {
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) for (let py = 0; py < 16; py++) for (let pxx = 0; pxx < 16; pxx++) {
    const x = (pxx + .5) / 16 * 2 - 1, y = 1 - (py + .5) / 16 * 2; if (!leafIn(col, x, y)) continue;
    const pal = LEAFC[row], vein = Math.abs(x) < .07 || (col !== 0 && y > -.5 && Math.abs(Math.abs(x) - .33 * (y + .85)) < .055 && Math.abs(x) < .5);
    px(q, vein ? pal[1] : (r() < .22 ? pal[2] : pal[0]), col * 16 + pxx, row * 16 + py); if (y < -.65) px(q, '#5a3a1a', col * 16 + pxx, row * 16 + py); } }, { seed: 4242 });
function leafCard(B, m, p, normal, yaw, size, col, row) {
  const g = new THREE.PlaneGeometry(size, size * (.9 + hash2(col, row) * .2)), uv = g.attributes.uv;
  for (let i = 0; i < 4; i++) { const cu = .03 + .94 * uv.getX(i), cv = .03 + .94 * (1 - uv.getY(i)); uv.setXY(i, (col * 16 + cu * 16) / 64, 1 - (row * 16 + cv * 16) / 64); }
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), normal).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), yaw));
  g.applyMatrix4(new THREE.Matrix4().compose(V3(p[0], p[1], p[2]), q, V3(1, 1, 1))); B.add(g, m); }
PS.props.leaves = (o = {}) => {
  const R = o.radius ?? 6, N = o.count ?? 250, r = PS.rng((o.seed ?? 1) * 97 + 1), g = new THREE.Group(), B = batch(), m = MT(leafAtlas()), clusters = Array.from({ length: 7 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * R * .8; return [Math.cos(a) * d, Math.sin(a) * d]; });
  for (let i = 0; i < N; i++) {
    let x, z; if (r() < .55) { const c = clusters[Math.floor(r() * clusters.length)], a = r() * TAU, d = Math.abs(r() + r() + r() - 1.5) * R * .3; x = c[0] + Math.cos(a) * d; z = c[1] + Math.sin(a) * d; } else { const a = r() * TAU, d = Math.sqrt(r()) * R; x = Math.cos(a) * d; z = Math.sin(a) * d; }
    const len = Math.hypot(x, z); if (len > R) { x *= R / len; z *= R / len; }
    const pc = Math.floor(r() * 100), row = pc < 36 ? 0 : pc < 56 ? 1 : pc < 86 ? 2 : 3, tl = r() < .15 ? .8 : .28, n = V3((r() - .5) * tl, 1, (r() - .5) * tl).normalize();
    leafCard(B, m, [x, .02 + (i % 12) * .001, z], n, r() * TAU, .09 + r() * .07, Math.floor(r() * 4), row); }
  B.build(g); g.userData.radius = R; return done(g, o); };
const pileTex = () => TX('pile', 32, 32, (q, w, h, r) => {
  px(q, '#6e4420', 0, 0, w, h); for (let i = 0; i < 170; i++) { const pal = LEAFC[r() * 4 | 0]; px(q, pal[r() * 3 | 0], r() * w | 0, r() * h | 0, 1 + (r() * 3 | 0), 1 + (r() * 2 | 0)); } spk(q, w, h, r, '#3a2410', 40, .5); }, { mip: true, seed: 555 });
PS.props.leafPile = (o = {}) => {
  const R = o.r ?? .6, seed = o.seed ?? 1, r = PS.rng(seed * 53 + 9), g = new THREE.Group(), ud = g.userData, B = batch(), m = MT(leafAtlas()), n = 14, nr = 6, Hm = R * .5;
  const lumpAt = (i, j) => 1 + (vnoise(Math.cos(i / n * TAU) * 2 + 5 + j * .3, Math.sin(i / n * TAU) * 2 + 5 + j * .9, seed) - .5) * .5;
  const pos = (i, j) => { const t = j / nr, th = i / n * TAU, rr = R * Math.sin(t * PI / 2) * (1 + (hash2(i % n, 2 + seed) - .5) * .14), y = Hm * Math.pow(Math.cos(t * PI / 2), .8) * lumpAt(i, j); return [rr * Math.sin(th), y, rr * Math.cos(th)]; };
  B.add(grid(n, nr, pos, { wrap: true, u: (i, j) => pos(i, j)[0] / R * 1.6, v: (i, j) => pos(i, j)[2] / R * 1.6 }), MT(pileTex()));
  for (let c = 0; c < 90; c++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 1.08, rr = Math.min(1, d / R), y = d < R ? Hm * Math.pow(Math.sqrt(1 - rr * rr), .8) * .95 + .012 : .02;
    const nrm = V3(Math.sin(a) * rr * .8 + (r() - .5) * .5, 1, Math.cos(a) * rr * .8 + (r() - .5) * .5).normalize();
    leafCard(B, m, [Math.sin(a) * d, y, Math.cos(a) * d], nrm, r() * TAU, .09 + r() * .06, Math.floor(r() * 4), Math.floor(r() * 4)); }
  B.build(g); ud.top = Hm; ud.radius = R; return done(g, o); };

PS.hallo = { batch, tube, xf, merge, grid, TX, MT, SOLID, candy };
})();
