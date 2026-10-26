// PS1 prop library: FURNITURE + HOUSEHOLD (load after ps1.js; registers builders on PS1.props, nothing else global but PS1.furn).
//   <script src="/engine/ps1-props/furniture.js"></script>      const g = PS1.props.tv({ vcr: true }); scene.add(g);
//
// CONVENTIONS
//   Metres, y up, group origin on the floor (y = 0) at the middle of the footprint. The FRONT faces +z (TV screen, couch seat, door front).
//   Wall-mounted things (wall phone, clock, calendar, pictureFrame, mirror 'wall', payphone) have the origin at their CENTRE with the back
//   at z = 0, facing +z: place them with g.position = (x, y, wallZ + 0.03). window: origin at the bottom-centre of the frame (sill height is
//   yours); door: origin on the floor at the middle of the opening. Ceiling lamps: origin on the floor, the fixture hangs from y = o.h (2.5).
//   Every builder: (o = {}) => THREE.Group, not parented. Every builder takes optional placement opts  pos:[x,y,z], ry (radians), scale.
//   Every builder sets userData.size = [w, h, d] (bounding size, metres). Handles are in userData (below). Anything with an update(t, S)
//   needs it called each frame (the prop viewer does it; in an episode call  prop.userData.update(t, S)  from ep.update). Pure in t.
//   Local positions in userData (light, seatPos, ...) are in the group's space: use  g.localToWorld(ud.light.clone())  for PS1.light().
//   Materials/textures are cached and SHARED between props: never mutate a cached material (tint / unlit). Use the handles that exist
//   (glow, set, screen, ...) or make your own with PS1.mat. Textures are 8..64 px (live screens 128x96), nearest filtered; big tiled
//   surfaces are mip-mapped. Props are 12..990 triangles. Insides you look into (fridge, wardrobe, drawers, tub) are real boxes.
//
// 1. TV     tv({ era:'crt'|'flat', stand:'cabinet'|'table'|null, vcr, tapes:n, color:'#hex' (casing), wood:'#hex' (stand), antenna:false,
//                clock:'12:00', blink:true (VCR clock flashes like an unset VCR), fx:false (no scanline/vignette), power:false })
//   Defaults: crt -> cabinet, flat -> table; stand:null puts the set on the floor (vcr then sits on top of it; antenna stays on the CRT).
//   userData.screen = { canvas, ctx (the WORK canvas 128x96 you draw on), tex, display, w, h, draw(fn(ctx,w,h)), static(t, level), bars(),
//     clear(color), power(on), update() (call after drawing straight on ctx), fx (function or null) }.  screen.draw(fn) stores fn and runs it.
//   userData.power(bool) -> dark glass / picture back;  .screenMesh;  .screenCenter (local Vector3, front of the glass);  .antenna;
//   userData.vcr = { setClock('3:07'), blink(bool), insert(k 0..1: a tape slides into the slot, hidden at 1), tape (the VHS group), update }
//   userData.animate = (screen, t, S) => {}  optional hook run from update(), so the picture can be driven by t.
//   vcr({clock, blink, label})  and  vhsTape({label, color})  also exist on their own (vhsTape: lying, spine toward +z, userData.setLabel(txt)).
// 2. PHONES  phone({ kind:'cordless'|'wall'|'rotary'|'payphone', color:'#hex' })      (the cursed-tape phone is kind 'cordless')
//   userData.handset = child group (origin = middle of the grip, so parent it to a person's hand: hand.add(ud.handset) and set its transform),
//     .dock() puts it back on the base, .rest = {p, r}; .ring(on, t) jiggles base + handset and blinks the LED (pure in t); .ringing = true
//     makes update() do it for you; .led (mesh or null); .cord (box segments) follows the handset wherever it is (update() / ud.updateCord()).
// 3. FURNITURE
//   couch({ color, pattern:'plain'|'stripe'|'plaid'|'floral', seats:3 })   armchair({ color, pattern, wings })
//     userData.seatPos[i] (local Vector3, top of the cushion), .seatY, .facing
//   bed({ size:'single'|'double'|'queen'|'king', sheets:'#hex', blanket:'#hex', pattern, pillows:2, wood })   head at -z, foot at +z
//     userData.covers(k 0..1) pulls the blanket down/bunches it at the foot, .blanket (group), .sitPos, .mattressTop
//   table({ kind:'coffee'|'dining'|'side'|'desk', w, d, h, color, shape:'round', cloth:'#hex', clothPattern })   nightstand(o) = a side table
//     userData.top (y of the surface to put things on), .drawers[], .open(k, i=0) (side table 1 drawer, desk 3)
//   chair({ kind:'kitchen'|'office'|'wood', color })   userData.seatY;  office: .swivel(radians), .top (the swivelling group)
//   bookshelf({ w, h, d, shelves, books:0..1, seed, color })  userData.shelfY[]    stool({ h, color })
//   dresser({ drawers:4, w, h, d, color })  userData.drawers[], .open(k, i=0 | 'all')      wardrobe({ w, h, d, color })  .open(k, 'l'|'r'|undefined)
//   rockingChair()  .rock(angle), .rocking=true + .amp   crib({ color, blanket })   grandfatherClock({ hours, running })  .set(h), .swing(a)
// 4. DOOR / WINDOW
//   door({ w:.9, h:2.05, color, style:'panel'|'flush'|'glass', knob:'round'|'lever'|false })  hinged on the LEFT edge (seen from +z);
//     userData.open(k 0..1) swings it toward -z (max ~100 deg), .turn(k) turns the knobs, .hinge (group), .knobs[]
//   window({ w:1.1, h:1.2, view:'night'|'day'|'dusk'|'fog'|'dark'|'#hex'|'none' (none = see-through), curtains:true|'#hex', curtainPattern,
//     curtainClosed:0..1, curtainLen, blinds:true, blindsUp:0..1, color })  userData.open(k) slides the lower sash up, .curtain(k), .blinds(k), .sash
// 5. LIGHTS + SMALL HOUSEHOLD
//   lamp({ kind:'floor'|'table'|'ceiling'|'fluorescent', variant:'dome'|'bare'|'pendant' (ceiling), h:2.5, len:1.2, shade:'#hex', glow:'#hex', base:'#hex',
//     on:true, flicker:false })   emissive (unlit) shade / bulb / tube.   userData.light (local Vector3 for your point light), .set(on), .glow(k 0..1
//     brightness of the glowing parts), .on, .flicker (true: update() flickers the tube and sets .flickerK 0..1 for your light)
//   radio({ era:'tube'|'transistor'|'boombox', color, on, tune })  glowing dial: userData.set(on), .tune(k 0..1) moves the needle, .light, .lightColor
//   clock({ kind:'wall'|'alarm', style:'digital'|'bell' (alarm), r, face, rim, hours, sec })  userData.set(hours (decimal, 3.5 = 3:30), sec?),
//     wall: .hands = {hour,min,sec};  alarm digital: red 7-segment digits that blink the colon in update(); .set(h)
//   calendar({ month:1..12, year:1999, day, circled:n|[n..], xOut:true (crosses out the days before `day`) })  userData.set({month, day, circled, xOut})
//   pictureFrame({ w, h, kind:'landscape'|'portrait'|'family'|'flowers', frame:'#hex', gold, draw:(ctx,w,h,rng)=>{} })  userData.screen (same API as the TV)
//   mirror({ kind:'wall'|'standing', shape:'round', w, h, frame, unlit })  userData.screen.draw(...) paints the "reflection"; standing: .tilt(a)
//   rug({ w:2, d:3, color, style:'persian'|'shag'|'stripe', shape:'round', fringe:false })   2 cm thick
// 6. KITCHEN / BATH
//   fridge({ color, hinge:'left'|'right', contents:false, w, h, d })  userData.open(k, 'fridge'|'freezer'|'both') (doors swing toward +z),
//     .lightOn (true while a door is open), .light (local Vector3 inside the cabinet), .doors, .lampMesh
//   stove({ color })  userData.open(k) (oven door drops forward), .burner(i 0..3, on) glowing ring, .light (inside the oven), .hinge
//   counter({ w, sink:true, upper:true, color, top })  sink(o) = counter({ w:1.2, sink:true })   userData.open(k, i) (cabinet doors), .faucetPos, .drain, .top
//   bathtub({ w, color, water:0..1, waterColor, curtain:true|'#hex', curtainClosed })  userData.water(k, color?), .curtain(k); tub runs along x, faucet at -x
//   toilet({ color })  userData.open(k) lifts the lid
// 7. SMALL PROPS (all sit on y = 0)
//   candle({ lit, h, color, holder:'dish'|'stick'|'none' })  unlit flame sprite; userData.set(on), .light, .lightColor, .flickerK(t) (0.6..1.1 multiplier
//     for your light), update() makes the flame dance
//   flashlight({ on, color, standing })  lying along z, lens toward +z; userData.set(on), .light (local, at the lens), .dir (local Vector3), .lightColor
//   box({ w, h, d, color, open, taped:false, label:false })  cardboard; userData.open(k) lifts the flaps, .tape
//   trashCan({ kind:'kitchen'|'metal', color })  userData.open(k) (lid)       mug({ color, stripe, coffee:false, liquid })  userData.coffee
//   bottle({ kind:'beer'|'wine'|'whiskey'|'medicine'|'milk', color, label:false, labelColor, lying })
//   book({ color, title, open, scrawl:false, standing, w, d, thick })  open = a diary with handwriting lines and a few red ones
// EXTRA HELPERS  PS1.furn = { liveScreen(w,h,{fx,init}), staticNoise(q,w,h,seed,level), colorBars, crtFx, darkGlass, seg7(q,'12:34',x,y,col,ghost,h),
//   num35(q,'27',x,y,col) (3x5 pixel digits), glowMat(tex, warmHex), fabric/wood/paint/plastic/metal(hex) -> cached textures, hash, bgeo }
(function () {
'use strict';
const M = PS1.mat, tex = PS1.tex, noise = PS1.noise, V = PS1.V, clamp = PS1.clamp, DS = THREE.DoubleSide;
const TAU = Math.PI * 2, PI = Math.PI;

// ============================================================================================================
// helpers: colours, cached textures + materials, boxes with texel-density UVs, groups
// ============================================================================================================
const hx = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const sh = (h, k) => rgb(hx(h).map(v => v * k));
const mixc = (a, b, t) => { const A = hx(a), B = hx(b); return rgb(A.map((v, i) => v + (B[i] - v) * t)); };
const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

const TC = {};
const mk = (key, w, h, draw, seed) => { const t = TC[key] || (TC[key] = tex(w, h, draw, seed)); t._k = key; return t; };
const mkm = (key, w, h, draw, seed) => { const had = TC[key]; const t = mk(key, w, h, draw, seed); if (!had) PS1.mip(t); return t; };
const S = hex => mk('s' + hex, 4, 4, q => { q.fillStyle = hex; q.fillRect(0, 0, 4, 4); });
const MC = {};
const MT = (t, o = {}) => { if (typeof t === 'string') t = S(t); const k = (t._k || ('x' + (t.id))) + (o.unlit ? 'u' : '') + (o.noFog ? 'n' : '') + (o.tint || '') + (o.side ? 's' + o.side : ''); return MC[k] || (MC[k] = M(t, o)); };

// box with UVs scaled per face so texel density is the same everywhere (tpm = texture repeats per metre)
function bgeo(w, h, d, tpm, skip) {
  const g = new THREE.BoxGeometry(w, h, d); if (!tpm) return g;
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { if (skip && skip.includes(f)) continue; const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * tpm, uv.getY(k) * dims[f][1] * tpm); }
  return g; }
const add = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
const bx = (g, w, h, d, m, x = 0, y = 0, z = 0, tpm = 0, skip) => add(g, bgeo(w, h, d, tpm, skip), m, x, y, z);
const grp = (g, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); if (g) g.add(o); return o; };
const cyl = (g, r1, r2, h, n, m, x = 0, y = 0, z = 0) => add(g, PS1.cyl(r1, r2, h, n), m, x, y, z);
// a cylinder lying along z / along x
const cylz = (g, r1, r2, h, n, m, x = 0, y = 0, z = 0) => { const o = cyl(g, r1, r2, h, n, m, x, y, z); o.rotation.x = PI / 2; return o; };
const cylx = (g, r1, r2, h, n, m, x = 0, y = 0, z = 0) => { const o = cyl(g, r1, r2, h, n, m, x, y, z); o.rotation.z = PI / 2; return o; };
// six face materials: all m, except the listed faces (0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z)
const faces = (m, over = {}) => [0, 1, 2, 3, 4, 5].map(i => over[i] || m);
// a flat plane (faces +z), optionally subdivided (PS1 affine texture warping)
const plane = (g, w, h, m, x = 0, y = 0, z = 0, seg = 1) => add(g, new THREE.PlaneGeometry(w, h, seg, seg), m, x, y, z);
// a lathe body from [radius, y] points
const lathe = (pts, n = 8) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n);
// lerp-able smoothstep
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// rounded rect path fill + pixel-exact rounded cut-out (alpha 0 → the PS1 shader discards it)
function rr(q, x, y, w, h, r, fill) { q.fillStyle = fill; q.beginPath(); q.moveTo(x + r, y); q.arcTo(x + w, y, x + w, y + h, r); q.arcTo(x + w, y + h, x, y + h, r); q.arcTo(x, y + h, x, y, r); q.arcTo(x, y, x + w, y, r); q.closePath(); q.fill(); }
function cutRR(q, x, y, w, h, r) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const dx = Math.max(r - i - .5, i + .5 - (w - r), 0), dy = Math.max(r - j - .5, j + .5 - (h - r), 0); if (dx * dx + dy * dy <= r * r) q.clearRect(x + i, y + j, 1, 1); } }
function disc(q, cx, cy, r, fill) { q.fillStyle = fill; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * .6) q.fillRect(cx + i, cy + j, 1, 1); }
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };

// tiny pixel fonts: a 3x5 digit font (calendars, dials) and a 7-segment display (clocks, VCRs, stoves)
const F35 = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111' };
function digit35(q, ch, x, y, col) { const g = F35[ch]; if (!g) return; q.fillStyle = col; for (let i = 0; i < 15; i++) if (g[i] === '1') q.fillRect(x + i % 3, y + (i / 3 | 0), 1, 1); }
function num35(q, s, x, y, col, gap = 1) { s = String(s); for (let i = 0; i < s.length; i++) digit35(q, s[i], x + i * (3 + gap), y, col); return s.length * (3 + gap) - gap; }
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
// digit cell 5 wide, hh high; ':' is 3 wide
function seg7(q, str, x, y, col, ghost, hh = 9) {
  const mid = hh >> 1; let cx = x;
  for (const ch of String(str)) {
    if (ch === ':') { q.fillStyle = col; q.fillRect(cx + 1, y + mid - 2, 1, 1); q.fillRect(cx + 1, y + mid + 2, 1, 1); cx += 3; continue; }
    if (ch === ' ') { cx += 6; continue; }
    const on = SEG[ch] || '';
    const segs = { a: [1, 0, 3, 1], b: [4, 1, 1, mid - 1], c: [4, mid + 1, 1, mid - 1], d: [1, hh - 1, 3, 1], e: [0, mid + 1, 1, mid - 1], f: [0, 1, 1, mid - 1], g: [1, mid, 3, 1] };
    for (const k in segs) { const s = segs[k]; if (on.includes(k)) { q.fillStyle = col; q.fillRect(cx + s[0], y + s[1], s[2], s[3]); } else if (ghost) { q.fillStyle = ghost; q.fillRect(cx + s[0], y + s[1], s[2], s[3]); } }
    cx += 6; }
  return cx - x; }

// ---------- materials / textures shared by many builders ----------
const fabric = (hex, pat = 'plain') => mkm('fab' + hex + pat, 16, 16, (q, w, h, r) => {
  q.fillStyle = hex; q.fillRect(0, 0, w, h); const dk = sh(hex, .72), lt = sh(hex, 1.25);
  if (pat === 'stripe') { q.fillStyle = lt; for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 2, h); }
  else if (pat === 'plaid') { q.fillStyle = dk; for (let x = 2; x < w; x += 8) q.fillRect(x, 0, 2, h); for (let y = 2; y < h; y += 8) q.fillRect(0, y, w, 2); q.fillStyle = lt; q.fillRect(6, 0, 1, h); q.fillRect(0, 6, w, 1); q.fillRect(14, 0, 1, h); q.fillRect(0, 14, w, 1); }
  else if (pat === 'floral') { for (const [x, y] of [[4, 4], [12, 11]]) { q.fillStyle = lt; q.fillRect(x - 1, y, 3, 1); q.fillRect(x, y - 1, 1, 3); q.fillStyle = dk; q.fillRect(x, y, 1, 1); } q.fillStyle = sh(hex, .85); q.fillRect(11, 3, 2, 1); q.fillRect(3, 12, 2, 1); }
  noise(q, w, h, r, dk, 50, .7); noise(q, w, h, r, lt, 28, .5); }, 11);
const wood = hex => mkm('wood' + hex, 16, 16, (q, w, h, r) => {
  q.fillStyle = hex; q.fillRect(0, 0, w, h); q.fillStyle = sh(hex, .78); for (let y = 1; y < h; y += 3) q.fillRect(0, y + (r() * 2 | 0), w, 1);
  q.fillStyle = sh(hex, 1.15); for (let y = 2; y < h; y += 5) q.fillRect(r() * 8 | 0, y, 6 + (r() * 6 | 0), 1); noise(q, w, h, r, sh(hex, .6), 14, .6); }, 5);
const paint = (hex, grime = .6) => mkm('paint' + hex + grime, 16, 16, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(hex, .8), 26, grime); noise(q, w, h, r, sh(hex, 1.15), 14, grime * .6); }, 3);
const plastic = (hex) => mkm('plas' + hex, 8, 8, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(hex, 1.3), 8, .4); noise(q, w, h, r, sh(hex, .7), 8, .5); }, 9);
const metal = (hex = '#9aa0a6') => mkm('metal' + hex, 8, 8, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); q.fillStyle = sh(hex, 1.25); q.fillRect(0, 1, w, 1); q.fillStyle = sh(hex, .75); q.fillRect(0, 5, w, 1); noise(q, w, h, r, sh(hex, .6), 8, .5); }, 4);
const LEG = o => o.wood || '#6b4a30';

// every builder ends with fin(g, o): optional placement options pos:[x,y,z], ry (radians), scale
const fin = (g, o = {}) => { if (o.pos) g.position.set(o.pos[0], o.pos[1], o.pos[2]); if (o.ry) g.rotation.y = o.ry; if (o.scale) g.scale.setScalar(o.scale); return g; };

// ---------- live screens (TVs, framed pictures, mirrors): a work canvas the episode draws on, a display canvas the texture reads ----------
function staticNoise(q, w, h, seed = 1, level = 1) {
  const im = q.createImageData(w, h), d = im.data; let s = (seed * 2654435761) >>> 0 || 1;
  for (let i = 0; i < w * h; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; const v = Math.min(255, (s & 255) * level * (0.55 + 0.45 * ((i / w | 0) & 1 ? 1 : .8)) | 0); d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = Math.min(255, v * 1.05); d[i * 4 + 3] = 255; }
  q.putImageData(im, 0, 0); }
function colorBars(q, w, h) { const cols = ['#c8c8c8', '#c8c800', '#00c8c8', '#00c800', '#c800c8', '#c80000', '#0000c8']; cols.forEach((c, i) => { q.fillStyle = c; q.fillRect(Math.round(i * w / 7), 0, Math.ceil(w / 7), h * .7 | 0); }); const lo = ['#0000c8', '#101010', '#c800c8', '#101010', '#00c8c8', '#101010', '#c8c8c8']; lo.forEach((c, i) => { q.fillStyle = c; q.fillRect(Math.round(i * w / 7), h * .7 | 0, Math.ceil(w / 7), h * .12 | 0); }); q.fillStyle = '#101820'; q.fillRect(0, h * .82 | 0, w, h); q.fillStyle = '#f0f0f0'; q.fillRect(w * .35 | 0, h * .86 | 0, w * .1 | 0, h * .1 | 0); }
function crtFx(q, w, h) {
  q.fillStyle = 'rgba(0,0,0,.14)'; for (let y = 1; y < h; y += 2) q.fillRect(0, y, w, 1);
  const g = q.createRadialGradient(w / 2, h / 2, h * .32, w / 2, h / 2, h * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); q.fillStyle = g; q.fillRect(0, 0, w, h);
  q.fillStyle = 'rgba(255,255,255,.05)'; q.beginPath(); q.moveTo(4, 3); q.lineTo(w * .42, 3); q.lineTo(5, h * .4); q.closePath(); q.fill(); }
function darkGlass(q, w, h) { q.fillStyle = '#0a0c0d'; q.fillRect(0, 0, w, h); q.fillStyle = 'rgba(120,150,170,.07)'; q.beginPath(); q.moveTo(0, 0); q.lineTo(w * .55, 0); q.lineTo(0, h * .7); q.closePath(); q.fill(); q.fillStyle = 'rgba(120,150,170,.04)'; q.beginPath(); q.moveTo(w, h); q.lineTo(w * .45, h); q.lineTo(w, h * .3); q.closePath(); q.fill(); }
function liveScreen(w, h, o = {}) {
  const work = document.createElement('canvas'); work.width = w; work.height = h; const wq = work.getContext('2d'); wq.imageSmoothingEnabled = false;
  const fx = o.fx === undefined ? null : o.fx, init = o.init || ((q, w, h) => staticNoise(q, w, h, 1));
  const t = tex(w, h, (q, w, h) => { }); const dq = t.canvas.getContext('2d'); dq.imageSmoothingEnabled = false;
  const s = { canvas: work, ctx: wq, tex: t, display: t.canvas, w, h, content: null, powered: true, fx };
  s.update = () => { if (!s.powered) darkGlass(dq, w, h); else { dq.drawImage(work, 0, 0); } if (s.fx && s.powered) s.fx(dq, w, h); else if (s.fx) s.fx(dq, w, h); t.needsUpdate = true; return s; };
  s.draw = fn => { s.content = fn; if (fn) fn(wq, w, h); return s.update(); };
  s.static = (time = 0, level = 1) => { staticNoise(wq, w, h, Math.floor(time * 24) + 3, level); return s.update(); };
  s.bars = () => { colorBars(wq, w, h); return s.update(); };
  s.clear = (c = '#000') => { wq.fillStyle = c; wq.fillRect(0, 0, w, h); return s.update(); };
  s.power = on => { s.powered = on !== false; return s.update(); };
  init(wq, w, h, PS1.rng(o.seed || 7)); s.update(); return s; }

// ---------- a hanging cord made of box segments (phones) ----------
function makeCord(g, n, thick, color) { const geo = new THREE.BoxGeometry(thick, 1, thick), m = MT(color); return Array.from({ length: n }, () => { const o = add(g, geo, m); o.frustumCulled = false; return o; }); }
function poseCord(segs, a, b, len, floorY) {
  const n = segs.length, dist = a.distanceTo(b), sag = Math.min(.4, Math.sqrt(Math.max(0, .375 * len * Math.max(0, len - dist)))); let prev = a.clone();
  for (let i = 0; i < n; i++) { const s = (i + 1) / n, p = a.clone().lerp(b, s); p.y -= sag * 4 * s * (1 - s); if (floorY !== undefined) p.y = Math.max(floorY, p.y); PS1.limb(segs[i], prev, p); prev = p; } }

// ============================================================================================================
// VHS TAPE   vhsTape({label, color})   lying flat, spine toward +z. userData.setLabel(text)
// ============================================================================================================
const vhsTop = (label) => { const draw = (q, w, h, r) => { q.fillStyle = '#17171a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a2a30', 26, .6); q.fillStyle = '#0c0c0e'; q.fillRect(w * .2 | 0, 3, w * .6 | 0, 13); q.fillStyle = '#34363c'; q.fillRect(w * .2 | 0, 3, w * .6 | 0, 1); disc(q, w * .34 | 0, 9, 4, '#8a8a8e'); disc(q, w * .66 | 0, 9, 4, '#8a8a8e'); disc(q, w * .34 | 0, 9, 2, '#1c1c1e'); disc(q, w * .66 | 0, 9, 2, '#1c1c1e');
    q.fillStyle = '#e8e4d4'; q.fillRect(5, h - 15, w - 10, 12); q.fillStyle = '#c03a30'; q.fillRect(5, h - 15, w - 10, 2); if (label) { q.fillStyle = '#1c1a18'; q.font = 'bold 7px "Courier New", monospace'; q.textBaseline = 'middle'; q.fillText(String(label).slice(0, 12), 8, h - 7); } else { q.fillStyle = '#9a948a'; q.fillRect(9, h - 8, 22, 1); } }; return draw; };
const vhsSpine = (label) => (q, w, h, r) => { q.fillStyle = '#e8e4d4'; q.fillRect(0, 0, w, h); q.fillStyle = '#17171a'; q.fillRect(0, 0, 3, h); q.fillRect(w - 3, 0, 3, h); q.fillStyle = '#c03a30'; q.fillRect(3, 0, w - 6, 1); if (label) { q.fillStyle = '#1c1a18'; q.font = 'bold 6px "Courier New", monospace'; q.textBaseline = 'middle'; q.fillText(String(label).slice(0, 12), 5, h / 2 + .5); } else { q.fillStyle = '#8a847a'; q.fillRect(6, 3, 20, 1); } };
function makeVhs(label) {
  const g = new THREE.Group(), body = MT(plastic('#17171a')), W = .187, H = .025, D = .102;
  const top = label ? tex(64, 35, vhsTop(label)) : mk('vhsTop', 64, 35, vhsTop(''));
  const spine = label ? tex(48, 8, vhsSpine(label)) : mk('vhsSpine', 48, 8, vhsSpine(''));
  const mesh = bx(g, W, H, D, [body, body, M(top), body, M(spine), MT(plastic('#101012'))], 0, H / 2, 0);
  g.userData.setLabel = (txt) => { const t2 = tex(64, 35, vhsTop(txt)), s2 = tex(48, 8, vhsSpine(txt)); mesh.material = [body, body, M(t2), body, M(s2), MT(plastic('#101012'))]; };
  g.userData.size = [W, H, D]; return g; }
PS1.props.vhsTape = (o = {}) => { const g = makeVhs(o.label); fin(g, o); if (o.color) { /* tint the shell */ g.children[0].material[0] = g.children[0].material[1] = g.children[0].material[3] = MT(plastic(o.color)); } return g; };

// ============================================================================================================
// VCR   vcr({clock:'12:00', blink:true})   userData.setClock(str), .blink(bool), .insert(k 0..1), .tape, .led
// ============================================================================================================
function vcrFront(q, w, h, clock, show, ledOn) {
  q.fillStyle = '#25252b'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a3a42'; q.fillRect(0, 0, w, 1); q.fillStyle = '#121216'; q.fillRect(0, h - 1, w, 1);
  rr(q, 4, 3, 54, 12, 2, '#101014'); q.fillStyle = '#0a0a0c'; q.fillRect(6, 6, 50, 6); q.fillStyle = '#3a3a42'; q.fillRect(6, 5, 50, 1); q.fillStyle = '#2d2d34'; q.fillRect(8, 7, 46, 1);
  rr(q, 62, 3, 30, 12, 1, '#0a0e0a'); if (show) seg7(q, clock, 66, 5, '#6aff8a', 'rgba(60,140,70,.16)', 8);
  for (let i = 0; i < 4; i++) { q.fillStyle = '#4a4a54'; q.fillRect(64 + i * 7, 16, 5, 2); q.fillStyle = '#191920'; q.fillRect(64 + i * 7, 18, 5, 1); }
  q.fillStyle = ledOn ? '#ff3a2a' : '#4a1410'; q.fillRect(90, 15, 2, 2); }
PS1.props.vcr = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, W = .43, H = .09, D = .3;
  const state = { clock: o.clock || '12:00', blink: o.blink !== false, show: true, led: true }, F = tex(96, 20, () => { }), fq = F.canvas.getContext('2d');
  const redraw = () => { vcrFront(fq, 96, 20, state.clock, state.show, state.led); F.needsUpdate = true; }; redraw();
  const shell = MT(plastic('#1c1c20')), top = MT(metal('#3c3e44'));
  bx(g, W, H, D, [shell, shell, top, shell, M(F), shell], 0, H / 2 + .012, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .04, .012, .04, MT('#101012'), sx * (W / 2 - .03), .006, sz * (D / 2 - .04));
  const tape = makeVhs(o.label || ''); tape.position.set(-.1, .012 + H * .6 - .0125 - .02, D / 2 + .05); g.add(tape); tape.visible = false;
  ud.tape = tape; ud.insert = k => { if (k === undefined) k = 1; tape.visible = k > .001 && k < .985; tape.position.z = D / 2 + .05 - clamp(k) * .1 + .006; };
  ud.setClock = s => { state.clock = s; redraw(); }; ud.blink = b => { state.blink = b; state.show = true; redraw(); };
  ud.update = (t) => { if (!state.blink) return; const on = (t * 1.2 | 0) % 2 === 0; if (on !== state.show) { state.show = on; redraw(); } };
  ud.size = [W, H + .012, D]; return fin(g, o); };

// ============================================================================================================
// TV   tv({era:'crt'|'flat', stand:'cabinet'|'table'|null, vcr, tapes, color, wood, antenna, power})
// ============================================================================================================
PS1.props.tv = (o = {}) => {
  const flat = o.era === 'flat', stand = o.stand === undefined ? (flat ? 'table' : 'cabinet') : o.stand;
  const g = new THREE.Group(), ud = g.userData;
  const W = flat ? .96 : .68, H = flat ? .58 : .54, D = flat ? .09 : .5, cabC = o.color || (flat ? '#15161a' : '#2c2a2e');
  const wd = wood(LEG(o)), woodD = wood(sh(LEG(o), .8)), standW = Math.max(.9, W + .12);
  let sy = 0, cub = null;
  // ----- the stand -----
  if (stand === 'cabinet') {
    sy = .55; const w = standW, d = .54, t = .03;
    bx(g, w, .035, d, MT(wd), 0, sy - .0175, 0, 3); bx(g, t, sy - .035 - .05, d - .02, MT(wd), -w / 2 + t / 2, .05 + (sy - .035 - .05) / 2, 0, 3); bx(g, t, sy - .035 - .05, d - .02, MT(wd), w / 2 - t / 2, .05 + (sy - .035 - .05) / 2, 0, 3);
    bx(g, w - .02, sy - .035 - .05, .02, MT(woodD), 0, .05 + (sy - .035 - .05) / 2, -d / 2 + .02, 3); bx(g, w - 2 * t, .025, d - .04, MT(wd), 0, .285, 0, 3); bx(g, w - 2 * t, .03, d - .06, MT(woodD), 0, .06, -.01, 3);
    bx(g, w - .04, .05, .03, MT(woodD), 0, .025, d / 2 - .04, 3);
    for (const sx of [-1, 1]) { const dw = (w - 2 * t) / 2 - .01; bx(g, dw, .2, .022, MT(wd), sx * (dw / 2 + .005), .175, d / 2 - .02, 3); bx(g, dw - .06, .13, .01, MT(woodD), sx * (dw / 2 + .005), .175, d / 2 - .006, 3); cyl(g, .014, .014, .02, 6, MT('#b8a070'), sx * .03, .175, d / 2 - .0).rotation.x = PI / 2; }
    cub = { y: .297, w: w - 2 * t, d: d - .06 };
  } else if (stand === 'table') {
    sy = .5; const w = standW, d = .5;
    bx(g, w, .035, d, MT(wd), 0, sy - .0175, 0, 3); bx(g, w - .1, .02, d - .08, MT(woodD), 0, .16, 0, 3);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, .02, .014, sy - .035, 6, MT(woodD), sx * (w / 2 - .05), (sy - .035) / 2, sz * (d / 2 - .05));
    cub = { y: .17, w: w - .1, d: d - .08 }; }
  // ----- the set itself -----
  const tvy = sy + .02, tv = grp(g, 0, tvy, 0), plas = MT(plastic(cabC)), dark = MT('#0e0e10');
  const scr = liveScreen(128, 96, { fx: o.fx === false ? null : crtFx }); ud.screen = scr;
  const tvH = H, tvW = W;
  if (!flat) {
    const fd = .2, fz = D / 2 - fd / 2, front = mk('crtFront' + cabC, 128, 96, (q, w, h, r) => {
      q.fillStyle = cabC; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(cabC, 1.6), 120, .3); noise(q, w, h, r, sh(cabC, .6), 120, .4);
      q.fillStyle = sh(cabC, 1.5); q.fillRect(0, 0, w, 1); q.fillRect(0, 0, 1, h); q.fillStyle = sh(cabC, .5); q.fillRect(0, h - 1, w, 1); q.fillRect(w - 1, 0, 1, h);
      rr(q, 3, 5, 100, 73, 9, sh(cabC, .5)); rr(q, 5, 7, 96, 69, 8, sh(cabC, .3)); cutRR(q, 6, 8, 96, 68, 8);
      for (const ky of [14, 31]) { disc(q, 114, ky, 6, sh(cabC, 1.9)); disc(q, 114, ky, 4, sh(cabC, 1.25)); q.fillStyle = sh(cabC, 2.3); q.fillRect(113, ky - 6, 2, 5); q.fillStyle = sh(cabC, .4); q.fillRect(108, ky + 7, 12, 1); }
      for (let y = 46; y < 72; y += 3) { q.fillStyle = sh(cabC, .35); q.fillRect(107, y, 14, 1); q.fillStyle = sh(cabC, 1.3); q.fillRect(107, y + 1, 14, 1); }
      q.fillStyle = sh(cabC, 1.8); q.fillRect(108, 82, 12, 5); q.fillStyle = sh(cabC, .5); q.fillRect(108, 87, 12, 1); q.fillStyle = '#b0302a'; q.fillRect(110, 79, 2, 1);
      rr(q, 6, 80, 96, 10, 2, sh(cabC, .6)); q.fillStyle = sh(cabC, 1.5); for (let x = 12; x < 40; x += 2) q.fillRect(x, 85, 1, 1); }, 17);
    bx(tv, W, H, fd, faces(plas, { 4: M(front) }), 0, H / 2, fz);
    const back = new THREE.CylinderGeometry(.27 * Math.SQRT2, .12 * Math.SQRT2, D - fd, 4, 1); back.rotateY(PI / 4); back.rotateX(PI / 2);
    const bk = add(tv, back, plas, 0, H / 2, fz - fd / 2 - (D - fd) / 2); bk.scale.set(1, .78, 1);
    const vent = mk('vent', 8, 8, (q, w, h) => { q.fillStyle = '#1a1a1c'; q.fillRect(0, 0, w, h); q.fillStyle = '#050505'; for (let y = 1; y < h; y += 2) q.fillRect(1, y, w - 2, 1); });
    bx(tv, .22, .01, .16, MT(vent), 0, H * .78 + .003, -.14);
    // screen: sized to the cut-out in the front texture (+ overscan)
    const m2x = u => (u / 128 - .5) * W, m2y = v => (.5 - v / 96) * H, x0 = m2x(6) - .012, x1 = m2x(102) + .012, y0 = m2y(76) - .012, y1 = m2y(8) + .012;
    ud.screenMesh = plane(tv, x1 - x0, y1 - y0, M(scr.tex, { unlit: true }), (x0 + x1) / 2, H / 2 + (y0 + y1) / 2, D / 2 - .016, 2);
    if (o.antenna !== false) {
      const ant = grp(tv, o.vcr && stand !== 'cabinet' ? 0 : 0, H + .001, -.12); cyl(ant, .06, .07, .035, 8, dark, 0, .0175, 0); cyl(ant, .02, .03, .02, 8, MT('#55555a'), 0, .045, 0);
      const chrome = MT(metal('#c8ccd0'), {});
      for (const s of [-1, 1]) { const rod = grp(ant, s * .02, .05, 0); rod.rotation.z = -s * .6; rod.rotation.x = -.1; cyl(rod, .0045, .0055, .46, 4, chrome, 0, .23, 0); bx(rod, .016, .016, .016, chrome, 0, .465, 0); } ud.antenna = ant; }
  } else {
    const fd = .05, front = mk('flatFront' + cabC, 128, 96, (q, w, h, r) => {
      q.fillStyle = cabC; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(cabC, 1.8), 40, .25); cutRR(q, 3, 3, 122, 75, 2);
      q.fillStyle = sh(cabC, 1.7); q.fillRect(0, 0, w, 1); q.fillStyle = '#d83a30'; q.fillRect(93, 87, 3, 2); q.fillStyle = sh(cabC, 2.6); q.fillRect(58, 84, 12, 1); for (let i = 0; i < 6; i++) q.fillRect(100 + i * 3, 86, 2, 1); }, 19);
    bx(tv, W, H, fd, faces(plas, { 4: M(front) }), 0, H / 2 + .02, D / 2 - fd / 2);
    bx(tv, W * .66, H * .6, .04, plas, 0, H / 2 + .04, D / 2 - fd - .02);
    const m2x = u => (u / 128 - .5) * W, m2y = v => (.5 - v / 96) * H, x0 = m2x(3) - .008, x1 = m2x(125) + .008, y0 = m2y(78) - .008, y1 = m2y(3) + .008;
    ud.screenMesh = plane(tv, x1 - x0, y1 - y0, M(scr.tex, { unlit: true }), (x0 + x1) / 2, H / 2 + .02 + (y0 + y1) / 2, D / 2 - .016, 2);
    bx(tv, .09, .12, .035, plas, 0, .08, D / 2 - .06); bx(tv, .5, .018, .24, plas, 0, .009, D / 2 - .1);
  }
  // ----- the VCR (on the shelf of a cabinet, otherwise on top of the set) and a few loose tapes -----
  if (o.vcr) {
    const v = PS1.props.vcr({ clock: o.clock, blink: o.blink }); ud.vcr = v.userData;
    if (cub) { v.position.set(-.02, cub.y, .02); } else { v.position.set(0, tvy + H + (flat ? .02 : 0), .0); }
    g.add(v); ud.vcrObj = v; }
  if (o.tapes && cub) { for (let i = 0; i < o.tapes; i++) { const tp = makeVhs(''); tp.position.set(cub.w / 2 - .14, cub.y + i * .026, .02); tp.rotation.y = (hash(i, 3) - .5) * .5; g.add(tp); } }
  // ----- state -----
  ud.power = on => { scr.power(on); return g; }; scr.static(0); if (o.power === false) scr.power(false);
  const total = tvy + H + (flat ? 0 : (o.antenna === false ? 0 : .4));
  ud.screenCenter = new THREE.Vector3(0, tvy + H / 2, D / 2); ud.size = [Math.max(standW, W), total, Math.max(.54, D)];
  ud.update = (t, S) => { if (ud.vcr) ud.vcr.update(t); if (ud.animate) ud.animate(scr, t, S); };
  return fin(g, o); };

// ============================================================================================================
// PHONES   phone({kind:'cordless'|'wall'|'rotary'|'payphone', color})
//   userData: handset (child group, origin = middle of the grip), dock() put it back, ring(on,t), ringing (bool, driven by update),
//   led, cord (segments, follows the handset in update), size
// ============================================================================================================
// U-shaped corded handset: grip along y, both cups pointing -z. cordAnchor = bottom of the grip
function uHandset(color, len = .12) {
  const g = new THREE.Group(), m = MT(plastic(color)), dk = MT('#0c0c0e');
  bx(g, .032, len, .03, m, 0, 0, 0); for (const s of [-1, 1]) { cylz(g, .028, .026, .056, 8, m, 0, s * (len / 2 + .018), -.012); cylz(g, .02, .02, .004, 8, dk, 0, s * (len / 2 + .018), -.042); bx(g, .02, .03, .026, m, 0, s * (len / 2 - .01), -.0); }
  g.userData.cordAnchor = new THREE.Vector3(0, -len / 2 - .04, -.01); return g; }
const dialTex = (hex) => mk('dial' + hex, 32, 32, (q, w, h, r) => {
  q.fillStyle = 'rgba(0,0,0,0)'; q.clearRect(0, 0, w, h); disc(q, 16, 16, 15, sh(hex, .55)); disc(q, 16, 16, 14, hex);
  for (let i = 0; i < 10; i++) { const a = (.65 + i * .55) * 1 + .3; const x = 16 + Math.cos(a + PI * .35) * 10, y = 16 + Math.sin(a + PI * .35) * 10; disc(q, Math.round(x), Math.round(y), 2, '#1a1a1c'); }
  disc(q, 16, 16, 6, sh(hex, 1.1)); disc(q, 16, 16, 4, '#e8e4d4'); q.fillStyle = '#9a948a'; q.fillRect(14, 16, 5, 1); });
const keypad = (q, x, y, cols, rows, cw, ch, gx, gy, c) => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { q.fillStyle = c; q.fillRect(x + i * (cw + gx), y + j * (ch + gy), cw, ch); } };
PS1.props.phone = (o = {}) => {
  const kind = o.kind || 'cordless', g = new THREE.Group(), ud = g.userData, body = grp(g);
  const color = o.color || ({ cordless: '#d8d0bc', wall: '#cfc7a8', rotary: '#1c1c1e', payphone: '#7a8088' })[kind];
  const led = M(S('#ff2a1a'), { unlit: true }); let handset, rest = { p: new THREE.Vector3(), r: new THREE.Euler() }, cord = null, cordTo = null, cordLen = .9, floorY;
  const dock = () => { g.add(handset); handset.position.copy(rest.p); handset.rotation.copy(rest.r); handset.scale.set(1, 1, 1); };
  if (kind === 'cordless') {
    const pm = MT(plastic(color)), dk = MT('#1c1c1e');
    bx(body, .12, .035, .16, pm, 0, .0175, 0); bx(body, .12, .075, .04, pm, 0, .0375, -.06); bx(body, .1, .012, .05, dk, 0, .041, .03); bx(body, .035, .02, .005, MT('#9a9890'), -.03, .02, .0825);
    for (const s of [-1, 1]) bx(body, .008, .06, .03, pm, s * .05, .065, -.025);
    ud.led = bx(body, .012, .006, .006, led, .04, .0365, .082); bx(body, .09, .004, .02, MT('#6a6a62'), 0, .036, -.035);
    const hf = mk('cordlessH' + color, 12, 44, (q, w, h, r) => { q.fillStyle = color; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(color, .8), 14, .5); q.fillStyle = sh(color, .55); for (let i = 0; i < 3; i++) q.fillRect(3 + i * 3, 2, 1, 1); q.fillStyle = '#6f8a6a'; q.fillRect(2, 6, 8, 5); q.fillStyle = '#3a4a38'; q.fillRect(3, 7, 4, 1); keypad(q, 2, 14, 3, 4, 2, 3, 1, 1, '#4a4842'); keypad(q, 2, 14, 3, 4, 2, 2, 1, 2, '#8a8780'); q.fillStyle = sh(color, .5); for (let i = 0; i < 3; i++) q.fillRect(3 + i * 3, 41, 1, 1); }, 6);
    handset = grp(g); bx(handset, .045, .2, .032, faces(pm, { 4: M(hf) }), 0, 0, 0); cyl(handset, .005, .005, .07, 5, MT('#2a2a2c'), .016, .135, -.008);
    rest.p.set(0, .04 + .1 * Math.cos(.17), -.028); rest.r.set(-.17, 0, 0); handset.userData.cordAnchor = null;
    ud.size = [.12, .26, .16];
  } else if (kind === 'rotary') {
    const pm = MT(plastic(color)), geo = new THREE.CylinderGeometry(.095, .125, .09, 4, 1); geo.rotateY(PI / 4); const bd = add(body, geo, pm, 0, .045, 0); bd.scale.set(1.05, 1, .9);
    bx(body, .26, .012, .24, MT(plastic(sh(color, .8))), 0, .006, 0);
    const dm = M(dialTex('#d8d4c8'), {}); const dial = add(body, new THREE.CircleGeometry(.052, 14), dm, 0, .055, .097); dial.rotation.x = -.35; dial.scale.set(1, 1, 1);
    for (const s of [-1, 1]) { bx(body, .035, .03, .06, pm, s * .1, .105, 0); }
    bx(body, .06, .014, .05, pm, 0, .092, -.03); ud.led = bx(body, .006, .006, .004, led, .0, .06, .1);
    handset = uHandset(color, .13); handset.rotation.set(-PI / 2, 0, -PI / 2); handset.position.set(0, .14, 0); rest.p.copy(handset.position); rest.r.copy(handset.rotation); g.add(handset);
    handset.userData.cordAnchor = new THREE.Vector3(0, -.12, -.01);
    cordTo = V(.09, .03, -.1); floorY = .004; cordLen = .8; ud.size = [.26, .17, .24];
  } else if (kind === 'wall') {
    const pm = MT(plastic(color)), geo = bgeo(.2, .3, .055);
    bx(body, .21, .31, .05, pm, 0, 0, .025); bx(body, .15, .05, .05, pm, .0, .18, .03); for (const s of [-1, 1]) cyl(body, .03, .03, .03, 8, MT(metal('#c8c8c0')), s * .05, .185, .06).rotation.x = PI / 2;
    const dial = add(body, new THREE.CircleGeometry(.065, 14), M(dialTex('#e8e4d4')), .02, -.02, .058); bx(body, .02, .012, .02, MT(metal('#8a8a80')), -.085, .08, .06);
    bx(body, .035, .02, .045, pm, -.115, .06, .045); bx(body, .035, .02, .045, pm, -.115, -.08, .045);
    ud.led = bx(body, .008, .008, .004, led, .075, -.12, .0515);
    handset = uHandset(color, .13); handset.rotation.set(0, 0, 0); handset.position.set(-.115, -.01, .09); rest.p.copy(handset.position); rest.r.copy(handset.rotation); g.add(handset);
    handset.userData.cordAnchor = new THREE.Vector3(0, -.105, -.015); cordTo = V(-.09, -.15, .03); cordLen = .5; ud.size = [.21, .31, .12];
  } else if (kind === 'payphone') {
    const pm = MT(metal(color)), front = mk('payF' + color, 32, 64, (q, w, h, r) => { q.fillStyle = color; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(color, .7), 40, .6); q.fillStyle = sh(color, 1.3); q.fillRect(0, 0, w, 1);
      q.fillStyle = '#1a2a2a'; q.fillRect(4, 4, 24, 8); q.fillStyle = '#4a8a6a'; q.fillRect(5, 5, 22, 6); q.fillStyle = '#2a4a3a'; for (let i = 0; i < 9; i++) q.fillRect(6 + i * 2, 7, 1, 2);
      keypad(q, 7, 17, 3, 4, 4, 3, 2, 2, '#d8d8d0'); keypad(q, 7, 17, 3, 4, 4, 1, 2, 4, '#7a7a74'); q.fillStyle = '#0a0a0a'; q.fillRect(25, 17, 3, 8); q.fillStyle = '#e8c030'; q.fillRect(24, 28, 5, 2); q.fillStyle = '#101010'; q.fillRect(6, 54, 20, 6); q.fillStyle = '#c8c8c0'; q.fillRect(7, 55, 18, 1); }, 4);
    bx(body, .27, .6, .13, faces(pm, { 4: M(front) }), 0, 0, .065, 0);
    bx(body, .28, .05, .15, pm, 0, .3, .075); bx(body, .22, .04, .005, MT('#1a3a6a'), 0, .3, .1525); bx(body, .05, .04, .04, MT(metal(sh(color, .7))), -.15, .1, .03);
    handset = uHandset('#1a1a1c', .13); handset.rotation.set(0, 0, 0); handset.position.set(-.155, .06, .08); rest.p.copy(handset.position); rest.r.copy(handset.rotation); g.add(handset);
    handset.userData.cordAnchor = new THREE.Vector3(0, -.105, -.015); cordTo = V(-.1, -.26, .13); cordLen = 1.0; ud.size = [.28, .6, .15]; ud.led = null; }
  if (cordTo) { cord = makeCord(g, 12, kind === 'payphone' ? .01 : .007, kind === 'payphone' ? '#8a8e92' : sh(color, .8) === color ? color : (kind === 'rotary' ? '#2a2a2c' : '#bdb596')); }
  dock(); ud.handset = handset; ud.dock = dock; ud.ringing = false; ud.rest = rest; ud.cord = cord;
  const poseCordNow = () => { if (!cord || !handset.userData.cordAnchor) return; g.updateWorldMatrix(true, false); handset.updateWorldMatrix(true, false); const a = g.worldToLocal(handset.localToWorld(handset.userData.cordAnchor.clone())); poseCord(cord, a, cordTo, cordLen, floorY); };
  ud.updateCord = poseCordNow; poseCordNow();
  ud.ring = (on, t = 0) => { const j = on ? Math.sin(t * 95) * .003 + Math.sin(t * 61) * .002 : 0, sw = on ? Math.sin(t * 80) * .04 : 0;
    body.position.x = j; body.rotation.z = sw * .3; if (handset.parent === g) { handset.position.x = rest.p.x + j; handset.rotation.z = rest.r.z + sw; handset.rotation.y = rest.r.y + (on ? Math.sin(t * 70) * .03 : 0); }
    if (ud.led) ud.led.visible = !on || Math.floor(t * 8) % 2 === 0; };
  ud.update = (t) => { if (ud.ringing) ud.ring(true, t); poseCordNow(); };
  return fin(g, o); };

// ============================================================================================================
// SEATING / BEDS / TABLES / CHAIRS
// ============================================================================================================
const cushion = (g, w, h, d, m, x, y, z) => { const c = grp(g, x, y, z); bx(c, w, h * .8, d, m, 0, -h * .1, 0, 3); bx(c, w - .04, h * .22, d - .04, m, 0, h * .39, 0, 3); return c; };
function sofa(o, seats, armW, seatW, D, backH) {
  const g = new THREE.Group(), ud = g.userData, color = o.color || '#6a2a2e', pat = o.pattern || 'plain';
  const fab = MT(fabric(color, pat)), dk = MT(fabric(sh(color, .8), pat)), legm = MT(wood('#3a2616'));
  const W = seats * seatW + 2 * armW, baseTop = .3, seatTop = .44;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, .035, .025, .1, 6, legm, sx * (W / 2 - .07), .05, sz * (D / 2 - .07));
  bx(g, W, .2, D, dk, 0, .2, 0, 3);
  bx(g, W - 2 * armW, backH - baseTop - .26, .2, fab, 0, baseTop + (backH - baseTop - .26) / 2, -D / 2 + .1, 3);
  for (const sx of [-1, 1]) { const ax = sx * (W / 2 - armW / 2); bx(g, armW, .27, D, fab, ax, baseTop + .135, 0, 3); const roll = cylz(g, armW * .52, armW * .52, D - .02, 6, fab, ax, baseTop + .27, 0); }
  ud.seatPos = [];
  for (let i = 0; i < seats; i++) { const x = (i - (seats - 1) / 2) * seatW;
    cushion(g, seatW - .01, .15, D - .24, fab, x, baseTop + .075, .1 + .01);
    const bc = cushion(g, seatW - .03, .46, .15, fab, x, seatTop + .02 + .22, -D / 2 + .27); bc.rotation.x = -.2;
    ud.seatPos.push(new THREE.Vector3(x, seatTop + .08, .12)); }
  ud.seatY = seatTop + .06; ud.size = [W, backH + .02, D]; ud.facing = V(0, 0, 1); return fin(g, o); }
PS1.props.couch = (o = {}) => sofa(o, o.seats || 3, .2, .6, .92, .86);
PS1.props.armchair = (o = {}) => { const g = sofa(o, 1, .17, .6, .88, .9); if (o.wings) { const fab = MT(fabric(o.color || '#6a2a2e', o.pattern || 'plain')); for (const sx of [-1, 1]) bx(g, .1, .34, .24, fab, sx * .27, .72, -.3, 3); } return g; };

// ---------- bed ----------
PS1.props.bed = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, dims = { single: [.95, 1.95], twin: [.95, 1.95], double: [1.4, 1.95], queen: [1.55, 2.05], king: [1.9, 2.05] }[o.size || 'double'];
  const [w, L] = dims, sheetsC = o.sheets || '#d8d4c4', blankC = o.blanket || '#7a3a3a', pat = o.pattern || 'plain', wd = MT(wood(o.wood || '#5a3a26')), pillowN = o.pillows === undefined ? 2 : o.pillows;
  const sheetM = MT(fabric(sheetsC, 'plain')), blankM = MT(fabric(blankC, pat)), matM = MT(fabric('#c8c2b0', 'stripe'));
  const mt = .36, mh = .22, mTop = mt + mh;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .06, .3, .06, wd, sx * (w / 2 + .02), .15, sz * (L / 2 - .02), 3);
  for (const sx of [-1, 1]) bx(g, .04, .18, L - .04, wd, sx * (w / 2 + .02), .3, 0, 3);
  bx(g, w + .08, .1, .04, wd, 0, .3, -L / 2 + .02, 3); bx(g, w + .08, .1, .04, wd, 0, .3, L / 2 - .02, 3);
  bx(g, w, mh, L - .08, matM, 0, mt + mh / 2 - .02, 0, 3);
  for (const sx of [-1, 1]) bx(g, .07, 1.0, .07, wd, sx * (w / 2 + .02), .5, -L / 2 + .02, 3);
  bx(g, w - .04, .6, .05, wd, 0, .68, -L / 2 + .02, 3); bx(g, w + .06, .06, .08, wd, 0, 1.01, -L / 2 + .02, 3);
  for (const sx of [-1, 1]) bx(g, .07, .55, .07, wd, sx * (w / 2 + .02), .3, L / 2 - .02, 3);
  bx(g, w - .04, .3, .04, wd, 0, .42, L / 2 - .02, 3); bx(g, w + .06, .045, .07, wd, 0, .58, L / 2 - .02, 3);
  // top sheet + blanket, built anchored at the foot so covers(k) can pull them down
  const cov = grp(g, 0, 0, L / 2 - .06), cl = L * .66, bw = w + .0;
  const blank = grp(cov, 0, mTop - .02, 0);
  bx(blank, bw - .02, .07, cl, blankM, 0, .035, -cl / 2, 3);
  for (const sx of [-1, 1]) bx(blank, .04, .2, cl, blankM, sx * (bw / 2 - .01), -.07, -cl / 2, 3);
  bx(blank, bw - .02, .2, .04, blankM, 0, -.07, -.01, 3);
  bx(blank, bw - .01, .08, .22, sheetM, 0, .037, -cl + .02, 3); bx(blank, bw - .0, .08, .06, sheetM, 0, .037, -cl + .13, 3);
  ud.blanket = blank;
  const lump = (u) => { };
  for (let i = 0; i < pillowN; i++) { const x = (i - (pillowN - 1) / 2) * (w / Math.max(1, pillowN)) * (pillowN > 1 ? .98 : 0); const pw = Math.min(.62, w / Math.max(1, pillowN) - .05); const p = cushion(g, pw, .13, .38, sheetM, x, mTop + .06, -L / 2 + .3); p.rotation.x = -.12; p.rotation.z = (hash(i, 2) - .5) * .06; }
  ud.covers = k => { k = clamp(k); blank.scale.z = 1 - k * .72; blank.scale.y = 1 + k * 1.1; blank.position.y = mTop - .02 + k * .015; };
  ud.sitPos = V(0, mTop, L / 2 - .3); ud.size = [w + .12, 1.06, L]; ud.mattressTop = mTop; return fin(g, o); };

// ---------- tables ----------
PS1.props.table = (o = {}) => {
  const kind = o.kind || 'coffee', g = new THREE.Group(), ud = g.userData, wc = o.color || (kind === 'dining' ? '#7a5030' : kind === 'desk' ? '#6a4a30' : '#6b4a30'), wd = MT(wood(wc)), wdD = MT(wood(sh(wc, .75)));
  const D0 = { coffee: [1.1, .55, .42], dining: [1.5, .9, .76], side: [.46, .46, .56], desk: [1.3, .66, .76] }[kind] || [1, .6, .5];
  const w = o.w || D0[0], d = o.d || D0[1], h = o.h || D0[2], round = o.shape === 'round', tt = .04; ud.drawers = [];
  const top = (ww, dd) => round ? cyl(g, ww / 2, ww / 2, tt, 12, wd, 0, h - tt / 2, 0) : bx(g, ww, tt, dd, wd, 0, h - tt / 2, 0, 3);
  const legR = (x, z, hh, ww = .06) => bx(g, ww, hh, ww, wdD, x, hh / 2, z, 3);
  if (round) { top(w, w); cyl(g, .05, .07, h - tt - .04, 6, wdD, 0, (h - tt - .04) / 2 + .04, 0); for (let i = 0; i < 3; i++) { const l = bx(g, .05, .05, w * .4, wdD, 0, .025, 0, 3); l.rotation.y = i * PI / 3; } }
  else {
    top(w, d); const lw = kind === 'coffee' ? .055 : kind === 'side' ? .04 : .07, ix = w / 2 - lw / 2 - .02, iz = d / 2 - lw / 2 - .02;
    if (kind !== 'desk') { for (const sx of [-1, 1]) for (const sz of [-1, 1]) legR(sx * ix, sz * iz, h - tt, lw);
      for (const sz of [-1, 1]) bx(g, w - .06, .07, .02, wdD, 0, h - tt - .04, sz * (iz), 3); for (const sx of [-1, 1]) bx(g, .02, .07, d - .06, wdD, sx * ix, h - tt - .04, 0, 3);
      if (kind === 'coffee') bx(g, w - .1, .025, d - .1, wd, 0, .13, 0, 3); if (kind === 'side') bx(g, w - .08, .02, d - .08, wd, 0, .12, 0, 3); }
    if (kind === 'side') { const dg = grp(g, 0, h - tt - .075, d / 2 - .03); bx(dg, w - .08, .09, .02, wd, 0, 0, 0, 3); bx(dg, .06, .012, .02, MT('#c8b890'), 0, 0, .017); const tray = grp(dg, 0, 0, -.12); bx(tray, w - .12, .01, d - .1, wdD, 0, -.035, 0); for (const sx of [-1, 1]) bx(tray, .01, .07, d - .1, wdD, sx * (w / 2 - .065), 0, 0); bx(tray, w - .12, .07, .01, wdD, 0, 0, -(d - .1) / 2); ud.drawers.push(dg); }
    if (kind === 'desk') {
      const pw = .45; bx(g, .03, h - tt, d - .03, wdD, w / 2 - .035, (h - tt) / 2, 0, 3); bx(g, w - .1, .35, .02, wdD, 0, h - tt - .25, -d / 2 + .04, 3);
      bx(g, pw, h - tt, d - .03, wdD, -w / 2 + pw / 2 + .02, (h - tt) / 2, -.0, 3);
      for (let i = 0; i < 3; i++) { const dh = (h - tt - .06) / 3, dg = grp(g, -w / 2 + pw / 2 + .02, .03 + dh * (i + .5), d / 2 - .0); bx(dg, pw - .02, dh - .015, .022, wd, 0, 0, 0, 3); bx(dg, .08, .012, .02, MT('#b0a070'), 0, dh * .15, .02); const tray = grp(dg, 0, 0, -.2); bx(tray, pw - .08, .01, d - .2, wdD, 0, -dh * .35, 0); ud.drawers.push(dg); } }
  }
  ud.open = (k, i = 0) => { const dg = ud.drawers[i]; if (dg) dg.position.z = (dg.userData.z0 ?? (dg.userData.z0 = dg.position.z)) + clamp(k) * .3; };
  if (o.cloth) { const cc = MT(fabric(o.cloth, o.clothPattern || 'plain')); if (round) { cyl(g, w / 2 + .03, w / 2 + .03, .015, 12, cc, 0, h + .0075, 0); add(g, PS1.rep(new THREE.CylinderGeometry(w / 2 + .03, w / 2 + .05, .26, 12, 1, true), 8, 1), M(fabric(o.cloth, o.clothPattern || 'plain'), { side: DS }), 0, h - .13, 0); } else { bx(g, w + .06, .015, d + .06, cc, 0, h + .0075, 0, 3); for (const sz of [-1, 1]) bx(g, w + .06, .26, .015, cc, 0, h - .13, sz * (d / 2 + .03), 3); for (const sx of [-1, 1]) bx(g, .015, .26, d + .06, cc, sx * (w / 2 + .03), h - .13, 0, 3); } }
  ud.top = h + (o.cloth ? .015 : 0); ud.size = [w, ud.top, d]; return fin(g, o); };

// ---------- chairs ----------
PS1.props.chair = (o = {}) => {
  const kind = o.kind || 'kitchen', g = new THREE.Group(), ud = g.userData; ud.seatY = .46; ud.size = [.45, .9, .45];
  if (kind === 'kitchen') {
    const col = o.color || '#b8452e', vin = MT(plastic(col)), ch = MT(metal('#c4c8cc')), sT = .46;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, .013, .013, sT, 6, ch, sx * .19, sT / 2, sz * .18);
    for (const sx of [-1, 1]) cyl(g, .013, .013, .4, 6, ch, sx * .19, sT + .2, -.18); cylx(g, .012, .012, .38, 6, ch, 0, sT + .4, -.18);
    for (const sx of [-1, 1]) cylx(g, .01, .01, .38, 5, ch, 0, .2, sx * .18); cylz(g, .01, .01, .36, 5, ch, -.19, .2, 0); cylz(g, .01, .01, .36, 5, ch, .19, .2, 0);
    cushion(g, .42, .07, .4, vin, 0, sT + .035, .0); const b = cushion(g, .38, .17, .04, vin, 0, sT + .3, -.2); ud.seatY = sT + .07;
  } else if (kind === 'office') {
    const col = o.color || '#2a303a', fm = MT(fabric(col)), bk = MT(plastic('#15161a')), ch = MT(metal('#4a4e54')); ud.seatY = .5;
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5, arm = grp(g, 0, .07, 0); arm.rotation.y = a; bx(arm, .03, .025, .3, bk, 0, 0, .15); cyl(arm, .016, .016, .04, 6, bk, 0, -.035, .3); }
    cyl(g, .03, .04, .3, 6, ch, 0, .24, 0);
    const top = grp(g, 0, .39, 0); ud.top = top; bx(top, .24, .03, .24, bk, 0, 0, 0);
    cushion(top, .48, .08, .46, fm, 0, .065, .0); const bg = grp(top, 0, .1, -.2); bg.rotation.x = -.1; bx(bg, .05, .24, .03, bk, 0, .12, -.04); cushion(bg, .44, .4, .07, fm, 0, .42, -.04);
    if (o.arms !== false) for (const sx of [-1, 1]) { bx(top, .03, .2, .03, bk, sx * .26, .17, -.02); bx(top, .06, .03, .26, bk, sx * .26, .28, .04); }
    ud.swivel = a => { top.rotation.y = a; }; ud.size = [.62, 1.0, .62];
  } else {
    const wd = MT(wood(o.color || '#7a5430')), sT = .45;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .04, sT, .04, wd, sx * .18, sT / 2, sz * .17, 3);
    bx(g, .42, .035, .4, wd, 0, sT, 0, 3);
    for (const sx of [-1, 1]) bx(g, .04, .46, .04, wd, sx * .18, sT + .23, -.17, 3);
    for (const y of [.62, .74, .86]) bx(g, .33, .07, .02, wd, 0, y, -.17, 3);
    bx(g, .36, .03, .03, wd, 0, .14, .17, 3); bx(g, .36, .03, .03, wd, 0, .14, -.17, 3);
    ud.seatY = sT + .02; }
  return fin(g, o); };

// ============================================================================================================
// STORAGE: bookshelf / dresser / wardrobe
// ============================================================================================================
const BOOKCOLS = ['#7a2a2a', '#2a3a5a', '#3a5a3a', '#6a4a2a', '#8a7a4a', '#4a2a4a', '#2a4a4a', '#9a8a6a', '#5a2a1a', '#3a3a3e', '#a8a090', '#6a1a1a'];
const bookStrip = (seed, wpx, hpx = 20) => mk('books' + seed + wpx, wpx, hpx, (q, w, h, r) => {
  q.fillStyle = '#120d09'; q.fillRect(0, 0, w, h); let x = 1;
  while (x < w - 2) { const bw = 2 + (r() * 3 | 0), bh = h - 2 - (r() * (r() < .25 ? 8 : 3) | 0), c = BOOKCOLS[r() * BOOKCOLS.length | 0]; q.fillStyle = c; q.fillRect(x, h - bh, bw, bh); q.fillStyle = sh(c, 1.4); q.fillRect(x, h - bh, 1, bh); q.fillStyle = sh(c, .6); q.fillRect(x + bw - 1, h - bh, 1, bh);
    if (r() < .6) { q.fillStyle = r() < .5 ? '#d8c890' : '#c8c8c0'; q.fillRect(x + 1, h - bh + 2 + (r() * 3 | 0), Math.max(1, bw - 2), 1); } x += bw; if (r() < .12) x += 2; }
  q.fillStyle = 'rgba(0,0,0,.25)'; q.fillRect(0, 0, w, 2); }, 31);
PS1.props.bookshelf = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .85, h = o.h || 1.8, d = o.d || .3, n = o.shelves || 5, wc = o.color || '#5a3a26', wd = MT(wood(wc)), wdD = MT(wood(sh(wc, .7))), t = .025, seed = o.seed ?? 3;
  bx(g, t, h, d, wd, -w / 2 + t / 2, h / 2, 0, 3); bx(g, t, h, d, wd, w / 2 - t / 2, h / 2, 0, 3); bx(g, w, .03, d, wd, 0, h - .015, 0, 3); bx(g, w - 2 * t, .08, d - .02, wdD, 0, .04, -.01, 3); bx(g, w - 2 * t, h - .06, .015, wdD, 0, h / 2, -d / 2 + .0075, 3);
  const cw = w - 2 * t, fill = o.books === undefined ? .75 : o.books, gap = (h - .08 - .03) / n; ud.shelfY = [];
  for (let i = 0; i < n; i++) { const y0 = .08 + i * gap; if (i > 0) bx(g, cw, .025, d - .02, wd, 0, y0, -.01, 3); ud.shelfY.push(y0 + (i > 0 ? .0125 : 0));
    const r = PS1.rng(seed * 13 + i); const avail = gap - (i > 0 ? .0125 : 0) - .03;
    if (r() < fill) { const bwid = cw * (.55 + r() * .4), bh = Math.min(avail, .22 + r() * .06), x = -cw / 2 + bwid / 2 + (r() < .5 ? 0 : cw - bwid) * (r() < .5 ? 1 : 0);
      const strip = bookStrip(seed * 7 + i, Math.max(16, Math.round(bwid * 60)), 20); const y = y0 + (i > 0 ? .0125 : 0) + bh / 2, pm = MT(plastic('#cfc6a8'));
      bx(g, bwid, bh, d - .08, [pm, pm, pm, pm, M(strip), pm], x, y, .02);
      if (r() < .5 && bh < avail - .06) { bx(g, .2, .035, .17, MT(fabric(BOOKCOLS[r() * 12 | 0])), x - bwid / 2 + .12, y0 + (i > 0 ? .0125 : 0) + bh + .0175, .02); } }
    else if (r() < .6) { const bk = bx(g, .03, .22, .17, MT(fabric(BOOKCOLS[r() * 12 | 0])), -cw / 2 + .14, y0 + .0125 + .11, .0); bk.rotation.z = -.28; bx(g, .04, .22, .17, MT(fabric(BOOKCOLS[r() * 12 | 0])), -cw / 2 + .06, y0 + .0125 + .11, .0); } }
  ud.size = [w, h, d]; return fin(g, o); };

PS1.props.dresser = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .95, h = o.h || .88, d = o.d || .46, n = o.drawers || 4, wc = o.color || '#6a4630', wd = MT(wood(wc)), wdD = MT(wood(sh(wc, .72))), t = .025, legH = .08, knob = MT('#c4b078');
  bx(g, w, .03, d + .02, wd, 0, h - .015, 0, 3); for (const sx of [-1, 1]) bx(g, t, h - .03 - legH, d, wd, sx * (w / 2 - t / 2), legH + (h - .03 - legH) / 2, 0, 3);
  bx(g, w - 2 * t, h - .03 - legH, .015, wdD, 0, legH + (h - .03 - legH) / 2, -d / 2 + .0075, 3); bx(g, w - 2 * t, .02, d - .02, wdD, 0, legH + .01, -.01, 3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .05, legH, .05, wdD, sx * (w / 2 - .035), legH / 2, sz * (d / 2 - .035), 3);
  const ih = h - .03 - legH - .02, dh = ih / n; ud.drawers = [];
  for (let i = 0; i < n; i++) { const y = legH + .02 + dh * (i + .5); if (i > 0) bx(g, w - 2 * t, .015, d - .02, wdD, 0, legH + .02 + dh * i, -.01, 3);
    const dg = grp(g, 0, y, d / 2 - .01); bx(dg, w - 2 * t - .006, dh - .012, .022, wd, 0, 0, 0, 3);
    for (const sx of [-1, 1]) { bx(dg, .03, .018, .014, knob, sx * w * .2, 0, .018); }
    const tray = grp(dg, 0, 0, -.2); const tw = w - 2 * t - .05, td = d - .08; bx(tray, tw, .008, td, wdD, 0, -dh / 2 + .02, 0); for (const sx of [-1, 1]) bx(tray, .01, dh - .05, td, wdD, sx * tw / 2, -.01, 0); bx(tray, tw, dh - .05, .01, wdD, 0, -.01, -td / 2);
    ud.drawers.push(dg); dg.userData.z0 = dg.position.z; }
  ud.open = (k, i = 0) => { const list = i === 'all' ? ud.drawers : [ud.drawers[i]]; for (const dg of list) if (dg) dg.position.z = dg.userData.z0 + clamp(k) * .32; };
  ud.top = h; ud.size = [w, h, d]; return fin(g, o); };

const doorPanel = (color, style) => mk('dpanel' + color + style, 32, 64, (q, w, h, r) => {
  q.fillStyle = color; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(color, .8), 60, .5); noise(q, w, h, r, sh(color, 1.2), 30, .4);
  if (style === 'flush') return;
  const lt = sh(color, 1.2), dk = sh(color, .68), panel = (x, y, ww, hh) => { q.fillStyle = dk; q.fillRect(x, y, ww, hh); q.fillStyle = lt; q.fillRect(x + 1, y + 1, ww - 1, hh - 1); q.fillStyle = color; q.fillRect(x + 2, y + 2, ww - 3, hh - 3); noise(q, ww - 3, hh - 3, r, sh(color, .85), 8, .4); };
  if (style === 'glass') { panel(5, 5, 22, 20); q.fillStyle = '#1a2a3a'; q.fillRect(8, 8, 16, 14); q.fillStyle = '#4a6a8a'; q.fillRect(9, 9, 5, 1); panel(5, 29, 22, 30); return; }
  panel(4, 5, 11, 22); panel(17, 5, 11, 22); panel(4, 31, 24, 11); panel(4, 46, 24, 14); }, 21);
PS1.props.wardrobe = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .98, h = o.h || 1.9, d = o.d || .56, wc = o.color || '#5a3d28', wd = MT(wood(wc)), wdD = MT(wood(sh(wc, .6))), t = .03, legH = .07, inner = MT(paint('#2a1e16', .8));
  const cabH = h - .09 - legH;
  for (const sx of [-1, 1]) bx(g, t, cabH, d, wd, sx * (w / 2 - t / 2), legH + cabH / 2, 0, 3);
  bx(g, w - 2 * t, cabH, .015, faces(inner, { 5: wdD }), 0, legH + cabH / 2, -d / 2 + .0075, 0); bx(g, w - 2 * t, .03, d - .03, wd, 0, legH + .015, -.0, 3); bx(g, w - 2 * t, .03, d - .03, wd, 0, legH + cabH - .015, 0, 3);
  bx(g, w + .06, .06, d + .04, wd, 0, h - .03, .0, 3); bx(g, w + .02, .03, d + .02, wd, 0, h - .075, 0, 3); bx(g, w + .02, .07, d + .02, wd, 0, legH - .0, 0, 3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .05, legH, .05, wdD, sx * (w / 2 - .04), legH / 2 - .005, sz * (d / 2 - .04), 3);
  bx(g, w - 2 * t, .02, d - .04, wd, 0, legH + .32, -.0, 3);
  cylx(g, .012, .012, w - 2 * t, 6, MT(metal('#b8b8b0')), 0, h - .38, -.04);
  const rr0 = PS1.rng(5); for (let i = 0; i < 5; i++) { const c = ['#2a3a5a', '#5a2a2a', '#3a4a3a', '#6a6a5a', '#222228', '#5a4a3a'][i % 6]; const x = -w / 2 + .12 + i * .13 + rr0() * .02; const hang = grp(g, x, h - .38, -.04); hang.rotation.y = .1 + rr0() * .4; bx(hang, .03, .015, .2, MT('#2a2a2a'), 0, -.005, 0); bx(hang, .02 + rr0() * .02, .62 + rr0() * .12, .38, MT(fabric(c)), 0, -.35, 0, 3); }
  const dw = (w - 2 * t) / 2 - .002, front = M(doorPanel(wc, 'panel')); ud.doors = [];
  for (const sx of [-1, 1]) { const hinge = grp(g, sx * (w / 2 - t) , legH + .03 + cabH / 2 - .015, d / 2 - .012), doorH = cabH - .02; bx(hinge, dw, doorH, .024, faces(wd, { 4: front }), -sx * dw / 2, 0, 0, 3, [4]);
    const hg = bx(hinge, .02, .02, .02, MT('#c4b078'), -sx * (dw - .04), 0, .02); ud.doors.push({ hinge, sx }); }
  ud.open = (k, which) => { for (const { hinge, sx } of ud.doors) { if (which === 'l' && sx === 1) continue; if (which === 'r' && sx === -1) continue; hinge.rotation.y = sx * -1 * clamp(k) * 1.9; } };
  ud.size = [w + .06, h, d + .04]; return fin(g, o); };

// ============================================================================================================
// DOOR + WINDOW
// ============================================================================================================
PS1.props.door = (o = {}) => {
  const w = o.w || .9, h = o.h || 2.05, color = o.color || '#c8c0a8', style = o.style || 'panel', knobK = o.knob === undefined ? 'round' : o.knob, g = new THREE.Group(), ud = g.userData;
  const cas = MT(paint(sh(color, 1.08), .5)), cw = .08, jd = .14, brass = MT('#c8b070'), dark = MT('#101012');
  bx(g, cw, h + cw, jd + .02, cas, -w / 2 - cw / 2, (h + cw) / 2, 0); bx(g, cw, h + cw, jd + .02, cas, w / 2 + cw / 2, (h + cw) / 2, 0); bx(g, w + 2 * cw, cw, jd + .02, cas, 0, h + cw / 2, 0);
  bx(g, w, .02, jd, MT(wood('#4a3424')), 0, .01, 0, 3);
  const hinge = grp(g, -w / 2 + .003, .02, 0), sw = w - .008, dh = h - .02, panel = M(doorPanel(color, style)), edge = MT(paint(sh(color, .85), .6));
  bx(hinge, sw, dh, .04, faces(edge, { 4: panel, 5: panel }), sw / 2, dh / 2, 0);
  for (const y of [.25, dh / 2, dh - .25]) cyl(hinge, .011, .011, .1, 6, brass, -.002, y, .0);
  ud.knobs = [];
  if (knobK) for (const sz of [-1, 1]) { const k = grp(hinge, sw - .08, dh * .46, sz * .02); bx(k, .05, .12, .006, brass, 0, 0, sz * .0 * 0 + 0); if (knobK === 'lever') { cylz(k, .012, .012, .05, 6, brass, 0, 0, sz * .025); bx(k, .12, .018, .018, brass, -.05, 0, sz * .05); } else { cylz(k, .011, .011, .04, 6, brass, 0, 0, sz * .02); const b = cyl(k, .028, .028, .035, 7, brass, 0, 0, sz * .055); b.rotation.x = PI / 2; } ud.knobs.push(k); }
  ud.open = k => { hinge.rotation.y = clamp(k) * 1.75; }; ud.turn = k => { for (const kn of ud.knobs) kn.rotation.z = clamp(k) * -.7; };
  ud.hinge = hinge; ud.size = [w + 2 * cw, h + cw, jd]; return fin(g, o); };

const viewTex = (kind) => mk('view' + kind, 16, 16, (q, w, h, r) => {
  const grad = (a, b) => { for (let y = 0; y < h; y++) { q.fillStyle = mixc(a, b, y / (h - 1)); q.fillRect(0, y, w, 1); } };
  if (kind === 'day') { grad('#6a9ad0', '#cfe0f0'); q.fillStyle = '#f4f6f8'; q.fillRect(2, 3, 5, 2); q.fillRect(9, 6, 4, 1); q.fillStyle = '#3a5a3a'; q.fillRect(0, 13, w, 3); q.fillStyle = '#2a4a2a'; q.fillRect(3, 12, 3, 1); q.fillRect(10, 11, 4, 2); }
  else if (kind === 'dusk') { grad('#3a3a6a', '#e0905a'); q.fillStyle = '#14101a'; q.fillRect(0, 13, w, 3); q.fillRect(4, 11, 2, 2); q.fillRect(11, 12, 3, 1); }
  else if (kind === 'fog') { grad('#9aa0a0', '#c8ccc8'); noise(q, w, h, r, '#ffffff', 20, .3); }
  else if (kind === 'dark') { grad('#020304', '#0a0c10'); }
  else { grad('#04060f', '#141c34'); q.fillStyle = '#c8d0e8'; for (let i = 0; i < 7; i++) q.fillRect(r() * w | 0, r() * 9 | 0, 1, 1); q.fillStyle = '#0a0e14'; q.fillRect(0, 13, w, 3); q.fillRect(3, 11, 1, 2); q.fillRect(11, 10, 2, 3); } }, 2);
PS1.props.window = (o = {}) => {
  const w = o.w || 1.1, h = o.h || 1.2, g = new THREE.Group(), ud = g.userData, fc = o.color || '#d4d0c0', fm = MT(paint(fc, .5)), fd = MT(paint(sh(fc, .8), .6)), bw = .06, dep = .1;
  bx(g, bw, h, dep, fm, -w / 2 + bw / 2, h / 2, 0); bx(g, bw, h, dep, fm, w / 2 - bw / 2, h / 2, 0); bx(g, w, bw, dep, fm, 0, h - bw / 2, 0); bx(g, w, bw, dep, fm, 0, bw / 2, 0);
  bx(g, w + .14, .035, dep + .12, fm, 0, -.0, .04); 
  const vm = o.view === 'none' ? null : (typeof o.view === 'string' && o.view[0] === '#') ? M(S(o.view), { unlit: true, noFog: true }) : M(viewTex(o.view || 'night'), { unlit: true, noFog: true });
  const iw = w - 2 * bw, ih = h - 2 * bw, sashH = ih / 2 + .02;
  if (vm) plane(g, iw, ih, vm, 0, h / 2, -.015, 1);
  bx(g, iw, .035, .045, fm, 0, h / 2, -.0); bx(g, .03, ih / 2, .045, fm, 0, h / 2 + ih / 4, -.0);
  const sash = grp(g, 0, bw, .035); ud.sash = sash; bx(sash, iw, .04, .035, fm, 0, .02, 0); bx(sash, iw, .035, .035, fm, 0, sashH - .0175, 0);
  for (const sx of [-1, 1]) bx(sash, .04, sashH, .035, fm, sx * (iw / 2 - .02), sashH / 2, 0);
  if (vm) plane(sash, iw - .06, sashH - .06, vm, 0, sashH / 2, -.005, 1); bx(sash, .025, sashH - .06, .02, fm, 0, sashH / 2, .008);
  ud.open = k => { sash.position.y = bw + clamp(k) * (ih / 2 - .05); };
  if (o.curtains) {
    const cc = typeof o.curtains === 'string' ? o.curtains : '#7a3a3a', cm = M(fabric(cc, o.curtainPattern || 'stripe'), { side: DS }), rod = MT(metal('#8a6a3a')), len = o.curtainLen || (h + .5), rodY = h + .22, cwid = (w + .5) / 2;
    cylx(g, .014, .014, w + .7, 6, rod, 0, rodY, .1); for (const sx of [-1, 1]) { add(g, new THREE.IcosahedronGeometry(.03, 0), rod, sx * (w / 2 + .36), rodY, .1); }
    ud.drapes = [];
    for (const sx of [-1, 1]) { const piv = grp(g, sx * (w + .5) / 2, rodY - .01, .1); const geo = PS1.rep(new THREE.PlaneGeometry(cwid, len, 6, 1), cwid * 3, len * 1.5); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(i % 7 * PI) * .035 * (i % 7 % 2 ? 1 : -1) * 0 + ((i % 7) % 2 ? .03 : -.0)); const dm = add(piv, geo, cm, -sx * cwid / 2, -len / 2, 0); ud.drapes.push({ piv, sx }); }
    ud.curtain = k => { k = clamp(k); for (const { piv } of ud.drapes) piv.scale.x = .34 + .66 * k; }; ud.curtain(o.curtainClosed === undefined ? 0 : o.curtainClosed); }
  if (o.blinds) {
    const slats = [], bm = MT(plastic('#cfc8b0')), top = h - bw, n = 18, span = ih + .1, grpB = grp(g, 0, 0, .075); bx(grpB, iw, .04, .04, MT(metal('#b8b8b0')), 0, top, 0);
    for (let i = 0; i < n; i++) { const sl = bx(grpB, iw - .02, .014, .035, bm, 0, top - .03 - i * span / n, 0); slats.push(sl); }
    ud.blinds = k => { k = clamp(k); const sp = span / n * (1 - .88 * k); slats.forEach((s, i) => { s.position.y = top - .03 - i * sp; }); }; ud.blinds(o.blindsUp || 0); }
  ud.size = [w + .14, h + (o.curtains ? .3 : 0), .2]; return fin(g, o); };

// ============================================================================================================
// LIGHTING + SMALL HOUSEHOLD: lamp / radio / clock / calendar / pictureFrame / mirror / rug
// ============================================================================================================
// a material that can glow: setGlow(k) 0..1 (k>0 = unlit and warm-tinted, 0 = a dull lit surface)
function glowMat(t, warm, side) { const m = M(typeof t === 'string' ? S(t) : t, { unlit: true, side }), bright = new THREE.Color(warm), dim = bright.clone().multiplyScalar(.4), off = new THREE.Color(.62, .58, .52);
  m.setGlow = k => { k = clamp(k); m.uniforms.unlit.value = k > .02 ? 1 : 0; m.uniforms.tint.value.copy(k > .02 ? dim.clone().lerp(bright, k) : off); }; m.setGlow(1); return m; }
const shadeTex = (hex) => mkm('shade' + hex, 16, 16, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) { q.fillStyle = sh(hex, x % 4 ? .86 : 1.06); q.fillRect(x, 0, 1, h); } q.fillStyle = sh(hex, .7); q.fillRect(0, 0, w, 1); q.fillRect(0, h - 1, w, 1); noise(q, w, h, r, sh(hex, .75), 20, .5); }, 8);
PS1.props.lamp = (o = {}) => {
  const kind = o.kind || 'floor', g = new THREE.Group(), ud = g.userData, warm = o.glow || (kind === 'fluorescent' ? '#e8fff0' : '#ffcf8a'), shadeC = o.shade || '#e4d4a8', H = o.h || 2.5;
  const metalM = MT(metal('#9a8a6a')), dark = MT('#2a2622'), glowers = [];
  const shadeM = glowMat(shadeTex(shadeC), warm, DS); glowers.push(shadeM);
  const bulb = () => { const bm = glowMat(S('#fff4d0'), '#fff2c8'); glowers.push(bm); return bm; };
  if (kind === 'floor') {
    cyl(g, .17, .19, .03, 10, dark, 0, .015, 0); cyl(g, .012, .012, 1.35, 6, metalM, 0, .7, 0); cyl(g, .03, .03, .06, 6, metalM, 0, 1.38, 0);
    add(g, PS1.cyl(.13, .22, .3, 10, true), shadeM, 0, 1.55, 0); add(g, new THREE.IcosahedronGeometry(.035, 0), bulb(), 0, 1.5, 0); ud.light = V(0, 1.45, 0); ud.size = [.44, 1.7, .44];
  } else if (kind === 'table') {
    const base = MT(wood(o.base || '#5a3a26')); add(g, lathe([[.0, 0], [.09, 0], [.1, .02], [.13, .12], [.1, .22], [.045, .28], [.03, .3], [.0, .3]], 8), MT(paint(o.base || '#4a5a6a', .5)), 0, 0, 0);
    cyl(g, .012, .012, .12, 6, metalM, 0, .36, 0); add(g, PS1.cyl(.1, .17, .22, 10, true), shadeM, 0, .47, 0); add(g, new THREE.IcosahedronGeometry(.03, 0), bulb(), 0, .4, 0); ud.light = V(0, .42, 0); ud.size = [.34, .6, .34];
  } else if (kind === 'ceiling') {
    const top = grp(g, 0, H, 0); cyl(top, .08, .08, .02, 8, MT('#c8c4b8'), 0, -.01, 0);
    if (o.variant === 'bare') { bx(top, .008, .35, .008, MT('#15151a'), 0, -.195, 0); cyl(top, .02, .025, .05, 6, MT('#d8d4c8'), 0, -.395, 0); add(top, new THREE.IcosahedronGeometry(.045, 1), bulb(), 0, -.46, 0); ud.light = V(0, H - .47, 0); }
    else if (o.variant === 'pendant') { bx(top, .01, .5, .01, MT('#15151a'), 0, -.26, 0); add(top, PS1.cyl(.05, .24, .2, 10, true), shadeM, 0, -.62, 0); add(top, new THREE.IcosahedronGeometry(.04, 0), bulb(), 0, -.62, 0); ud.light = V(0, H - .65, 0); }
    else { const bowl = glowMat(S('#f0ecd8'), warm); glowers.push(bowl); add(top, new THREE.SphereGeometry(.22, 10, 5, 0, TAU, PI / 2, PI / 2), bowl, 0, -.02, 0).scale.y = .75; cyl(top, .23, .23, .02, 10, MT('#b8b4a8'), 0, -.02, 0); ud.light = V(0, H - .3, 0); }
    ud.size = [.5, H, .5];
  } else {
    const top = grp(g, 0, H, 0), len = o.len || 1.2; bx(top, len, .04, .14, MT(paint('#c8cac8', .4)), 0, -.02, 0); bx(top, len - .1, .02, .05, MT('#a8aaa8'), 0, -.05, 0);
    const tube = glowMat(S('#f4fff4'), warm); glowers.push(tube); cylx(top, .018, .018, len - .08, 6, tube, 0, -.065, 0); for (const sx of [-1, 1]) bx(top, .03, .04, .04, MT('#2a2a28'), sx * (len / 2 - .04), -.06, 0);
    ud.light = V(0, H - .3, 0); ud.size = [len, H, .14]; ud.flicker = !!o.flicker; }
  ud.on = o.on !== false; ud.k = 1; ud.warm = warm;
  ud.glow = k => { ud.k = clamp(k); for (const m of glowers) m.setGlow(ud.on ? ud.k : 0); return ud.light; };
  ud.set = on => { ud.on = !!on; ud.glow(ud.k); return ud.on; }; ud.set(ud.on);
  ud.update = (t) => { if (!ud.on || !ud.flicker) return; const f = hash(Math.floor(t * 14), 7), k = f < .18 ? 0 : f < .3 ? .45 : 1; if (k !== ud.k) ud.glow(k); ud.flickerK = k; };
  return fin(g, o); };

// ---------- radio ----------
const dialTexR = mk('radioDial', 32, 10, (q, w, h) => { q.fillStyle = '#e8c070'; q.fillRect(0, 0, w, h); q.fillStyle = '#7a4a1a'; for (let x = 2; x < w - 1; x += 2) q.fillRect(x, 6, 1, x % 6 === 2 ? 4 : 2); q.fillStyle = '#5a3010'; q.fillRect(0, 5, w, 1); num35(q, '55', 3, 1, '#4a2a0a'); num35(q, '90', 14, 1, '#4a2a0a'); num35(q, '15', 24, 1, '#4a2a0a'); });
const grille = (hex) => mk('grille' + hex, 16, 16, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); q.fillStyle = sh(hex, .6); for (let i = 0; i < w; i += 2) { q.fillRect(i, 0, 1, h); q.fillRect(0, i, w, 1); } noise(q, w, h, r, sh(hex, 1.3), 20, .4); }, 12);
PS1.props.radio = (o = {}) => {
  const era = o.era || 'tube', g = new THREE.Group(), ud = g.userData, dialM = glowMat(dialTexR, '#ffc870'), needleM = glowMat(S('#c03020'), '#ff5a3a'); const bright = [dialM, needleM]; let needle;
  if (era === 'tube') {
    const wc = o.color || '#5a3418', wd = MT(wood(wc)), w = .42, h = .28, d = .2;
    bx(g, w, h, d, wd, 0, h / 2, 0, 3); bx(g, w - .06, .035, d - .02, wd, 0, h + .0175, 0, 3); bx(g, w - .14, .03, d - .04, wd, 0, h + .05, 0, 3);
    plane(g, .17, .17, MT(grille('#c8a868')), -.1, .115, d / 2 + .006); const dcx = .09, dcy = .2; bx(g, .2, .09, .006, MT('#1a1008'), dcx - .0, dcy - .0, d / 2 + .003);
    plane(g, .17, .054, dialM, dcx, dcy, d / 2 + .009); needle = bx(g, .004, .06, .004, needleM, dcx - .06, dcy, d / 2 + .013); ud.needle = needle; ud.dialRange = [dcx - .075, dcx + .075];
    for (const kx of [-.0, .1]) { const kn = cyl(g, .03, .03, .035, 8, MT('#2a1a0e'), .09 + (kx ? .0 : -.06) + (kx ? .06 : 0), .08, d / 2 + .018); kn.rotation.x = PI / 2; }
    ud.size = [w, h + .065, d]; ud.dialPos = V(dcx, dcy, d / 2);
  } else if (era === 'transistor') {
    const c = o.color || '#8a4a2a', pm = MT(plastic(c)), w = .24, h = .15, d = .07;
    bx(g, w, h, d, pm, 0, h / 2, 0); plane(g, .1, .1, MT(grille('#b8b0a0')), -.055, h / 2, d / 2 + .004); bx(g, .1, .06, .004, MT('#1a1008'), .07, .1, d / 2 + .002); plane(g, .085, .028, dialM, .07, .1, d / 2 + .007, 1); needle = bx(g, .003, .035, .003, needleM, .045, .1, d / 2 + .01); ud.needle = needle; ud.dialRange = [.03, .11];
    const kn = cyl(g, .018, .018, .02, 8, MT('#d8d0b8'), .07, .045, d / 2 + .01); kn.rotation.x = PI / 2; cyl(g, .003, .003, .3, 4, MT(metal('#d0d0d0')), .1, h + .15, -.0).rotation.z = -.35;
    bx(g, .15, .012, .012, MT('#3a2a20'), 0, h + .012, 0); ud.size = [w, h + .3, d]; ud.dialPos = V(.07, .1, d / 2);
  } else {
    const c = o.color || '#202226', pm = MT(plastic(c)), w = .52, h = .22, d = .15, sp = mk('speaker' + c, 24, 24, (q, w2, h2) => { q.fillStyle = '#16161a'; q.fillRect(0, 0, w2, h2); disc(q, 12, 12, 11, '#2a2a30'); disc(q, 12, 12, 8, '#101012'); disc(q, 12, 12, 4, '#3a3a42'); disc(q, 12, 12, 2, '#101012'); });
    bx(g, w, h, d, pm, 0, h / 2, 0); for (const sx of [-1, 1]) { const spk = plane(g, .15, .15, M(sp), sx * .18, h / 2, d / 2 + .004); }
    bx(g, .12, .1, .004, MT('#1a1a1c'), 0, h * .66, d / 2 + .002); plane(g, .1, .03, dialM, 0, h * .78, d / 2 + .006); plane(g, .08, .05, MT(S('#2a2a30')), 0, h * .5, d / 2 + .004); needle = bx(g, .003, .03, .003, needleM, -.02, h * .78, d / 2 + .009); ud.needle = needle; ud.dialRange = [-.04, .04];
    for (let i = 0; i < 5; i++) bx(g, .018, .014, .008, MT(i === 0 ? '#c03030' : '#8a8a90'), -.04 + i * .02, h * .24, d / 2 + .004);
    bx(g, .3, .015, .015, MT('#101010'), 0, h + .015, 0); for (const sx of [-1, 1]) bx(g, .02, .04, .02, MT('#101010'), sx * .15, h + .01, 0); cyl(g, .004, .004, .38, 4, MT(metal('#c8c8c8')), .2, h + .19, -.05).rotation.z = -.4;
    ud.size = [w, h + .2, d]; ud.dialPos = V(0, h * .78, d / 2); }
  ud.set = on => { ud.on = !!on; for (const m of bright) m.setGlow(ud.on ? 1 : 0); }; ud.set(o.on !== false);
  ud.tune = k => { if (needle) needle.position.x = lerp2(ud.dialRange[0], ud.dialRange[1], clamp(k)); };
  ud.light = ud.dialPos; ud.lightColor = [1, .7, .35]; ud.tune(o.tune ?? .3); return fin(g, o); };
const lerp2 = (a, b, k) => a + (b - a) * k;

// ---------- clocks ----------
function clockFace(hex, rim) { return mk('cface' + hex, 32, 32, (q, w, h) => { disc(q, 16, 16, 15, hex); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = 16 + Math.sin(a) * 12.5, y = 16 - Math.cos(a) * 12.5; q.fillStyle = '#1a1814'; q.fillRect(Math.round(x) - (k % 3 ? 0 : 1), Math.round(y) - (k % 3 ? 0 : 1), k % 3 ? 1 : 2, k % 3 ? 1 : 2); }
  num35(q, '12', 13, 5, '#1a1814'); digit35(q, '3', 24, 14, '#1a1814'); digit35(q, '6', 15, 22, '#1a1814'); digit35(q, '9', 5, 14, '#1a1814'); q.fillStyle = sh(hex, .7); q.fillRect(15, 15, 2, 2); }); }
const PX7 = (q, str, col, ghost, w, h) => { q.fillStyle = '#0c0606'; q.fillRect(0, 0, w, h); seg7(q, str, 4, 3, col, ghost, 11); };
PS1.props.clock = (o = {}) => {
  const kind = o.kind || 'wall', g = new THREE.Group(), ud = g.userData;
  if (kind === 'alarm') {
    const style = o.style || 'digital';
    if (style === 'digital') {
      const pm = MT(plastic(o.color || '#2a2a2e')), W = .2, Hh = .09, D = .1, dsp = tex(40, 14, () => { }), dq = dsp.canvas.getContext('2d'); let hrs = o.hours ?? 12, blink = true;
      bx(g, W, Hh, D, pm, 0, Hh / 2, 0); bx(g, W - .02, .012, D - .02, pm, 0, Hh + .006, 0); plane(g, .14, .05, M(dsp, { unlit: true }), -.0, Hh / 2 + .005, D / 2 + .004); for (const sx of [-1, 1]) bx(g, .02, .01, .02, MT('#101010'), sx * .08, Hh + .015, -.02);
      const draw = (t = 0) => { const hh = Math.floor(hrs) % 12 || 12, mm = Math.floor((hrs % 1) * 60), col = o.color2 || '#ff3a2a'; const colon = blink ? ':' : ' '; PX7(dq, `${hh}${colon}${String(mm).padStart(2, '0')}`, col, 'rgba(120,20,10,.18)', 40, 14); dsp.needsUpdate = true; };
      ud.set = (h) => { hrs = h; draw(); }; ud.update = (t) => { const b = (t * 1) % 2 < 1; if (b !== blink) { blink = b; draw(); } }; ud.setBlink = b => { ud.update = b ? ud.update : () => { }; }; draw(); ud.size = [W, Hh + .02, D];
    } else {
      const bm = MT(metal(o.color || '#b8b8b0')), face = clockFace('#e8e0c8'), R = .065;
      for (const sx of [-1, 1]) { cyl(g, .005, .005, .03, 4, bm, sx * .045, R * 2 + .04, 0); add(g, new THREE.SphereGeometry(.035, 8, 4, 0, TAU, 0, PI / 2), bm, sx * .05, R * 2 + .05, 0).rotation.z = -sx * .45; }
      cyl(g, .005, .005, .04, 4, bm, 0, R * 2 + .06, 0); bx(g, .01, .03, .01, bm, 0, R * 2 + .085, 0).rotation.z = .5;
      for (const sx of [-1, 1]) bx(g, .01, .04, .01, bm, sx * .045, .02, 0).rotation.z = sx * .35;
      const body = cylz(g, R, R, .06, 12, bm, 0, R + .035, 0); plane(g, R * 1.8, R * 1.8, M(face, { unlit: false }), 0, R + .035, .0325 + .004);
      const hands = grp(g, 0, R + .035, .043), mkH = (len, w2, z) => { const p = grp(hands, 0, 0, z); bx(p, w2, len, .003, MT('#101010'), 0, len / 2 - len * .1, 0); return p; };
      const hH = mkH(R * .5, .007, 0), hM = mkH(R * .78, .005, .006); ud.hands = { hour: hH, min: hM };
      ud.set = h => { h = ((h % 12) + 12) % 12; hH.rotation.z = -h / 12 * TAU; hM.rotation.z = -(h % 1) * TAU; };
      ud.set(o.hours ?? 10.1); ud.size = [.2, .22, .06]; }
  } else {
    const R = o.r || .18, face = clockFace(o.face || '#efe6d0'), rimM = MT(wood(o.rim || '#4a2e1a')), hm = MT('#1a1814');
    add(g, new THREE.CylinderGeometry(R, R, .045, 14, 1, true), rimM, 0, 0, 0).rotation.x = PI / 2; const ring = add(g, new THREE.RingGeometry(R * .9, R, 14), rimM, 0, 0, .0225);
    cylz(g, R, R, .01, 14, MT('#2a2018'), 0, 0, -.017); const fc = add(g, new THREE.CircleGeometry(R * .9, 14), M(face), 0, 0, .008);
    const mkHand = (len, w, z, c) => { const p = grp(g, 0, 0, z); bx(p, w, len, .004, MT(c), 0, len / 2 - len * .12, 0); return p; };
    const hH = mkHand(R * .5, .014, .014, '#1a1814'), hM = mkHand(R * .78, .01, .019, '#1a1814'), hS = mkHand(R * .85, .004, .024, '#a02a20'); cyl(g, .012, .012, .01, 6, MT('#1a1814'), 0, 0, .026).rotation.x = PI / 2;
    ud.set = (h, sec) => { h = ((h % 12) + 12) % 12; hH.rotation.z = -h / 12 * TAU; hM.rotation.z = -(h % 1) * TAU; hS.rotation.z = -((sec ?? ((h * 3600) % 60)) / 60) * TAU; };
    ud.set(o.hours ?? 10.1, o.sec ?? 0); ud.hands = { hour: hH, min: hM, sec: hS }; ud.size = [R * 2, R * 2, .05]; }
  return fin(g, o); };

// ---------- calendar ----------
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
function drawCalendar(q, w, h, c) {
  const month = c.month ?? 10, year = c.year ?? 1999, day = c.day, circled = [].concat(c.circled ?? []), r = PS1.rng(month * 31 + 7);
  q.fillStyle = '#e8e2d0'; q.fillRect(0, 0, w, h);
  // the picture: a cabin by a lake
  const sky = ['#6a8ab0', '#a8a0a0', '#c88a60', '#7a5a70'][month % 4]; q.fillStyle = sky; q.fillRect(2, 2, w - 4, 24); q.fillStyle = sh(sky, 1.15); q.fillRect(2, 15, w - 4, 4);
  q.fillStyle = '#3a4a3a'; q.beginPath(); q.moveTo(2, 20); q.lineTo(14, 9); q.lineTo(28, 19); q.lineTo(42, 10); q.lineTo(w - 2, 19); q.lineTo(w - 2, 26); q.lineTo(2, 26); q.fill(); q.fillStyle = '#6a8a9a'; q.fillRect(2, 20, w - 4, 6); q.fillStyle = '#8a5a3a'; q.fillRect(34, 14, 9, 6); q.fillStyle = '#4a2a1a'; q.beginPath(); q.moveTo(33, 14); q.lineTo(38.5, 9); q.lineTo(44, 14); q.fill(); q.fillStyle = '#2a4a2a'; for (const x of [8, 12, 52, 56]) { q.fillRect(x, 14 + (x % 3), 2, 6); }
  q.fillStyle = '#a02a24'; q.fillRect(2, 27, w - 4, 8); q.fillStyle = '#f0e8d8'; q.font = 'bold 7px Arial, Helvetica, sans-serif'; q.textBaseline = 'middle'; q.textAlign = 'center'; q.fillText(MONTHS[(month - 1 + 12) % 12], w / 2, 31.5); q.textAlign = 'left';
  const first = new Date(year, month - 1, 1).getDay(), dim = new Date(year, month, 0).getDate(), cw = 8.5, x0 = 3, y0 = 38;
  q.fillStyle = '#b8b0a0'; for (let i = 0; i < 7; i++) q.fillRect(x0 + 2 + i * cw | 0, 36, 3, 1);
  for (let d = 1; d <= dim; d++) { const idx = first + d - 1, col = idx % 7, row = idx / 7 | 0, x = x0 + col * cw | 0, y = y0 + row * 6, str = String(d), wpx = str.length * 4 - 1, tx = x + (str.length > 1 ? 0 : 2);
    num35(q, str, tx, y, col === 0 ? '#a02a24' : '#2a2620'); if (day && d < day && c.xOut) { q.fillStyle = 'rgba(200,30,20,.8)'; q.fillRect(x - 1, y + 2, str.length * 4 + 1, 1); } }
  for (const d of circled) { const idx = first + d - 1, col = idx % 7, row = idx / 7 | 0, x = x0 + col * cw + 3.5, y = y0 + row * 6 + 2.5; q.strokeStyle = '#d02018'; q.lineWidth = 1.2; q.beginPath(); q.ellipse(x, y, 5.2, 3.8, -.12, 0, TAU); q.stroke(); }
  q.fillStyle = '#c8c0ae'; q.fillRect(0, h - 1, w, 1); }
PS1.props.calendar = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, W = .27, Hh = .36, state = { month: o.month ?? 10, year: o.year ?? 1999, day: o.day, circled: o.circled, xOut: o.xOut };
  const t = tex(64, 80, (q, w, h) => drawCalendar(q, w, h, state)); ud.canvas = t.canvas;
  bx(g, W, Hh, .008, MT('#d8d2c0'), 0, 0, 0); plane(g, W - .01, Hh - .01, M(t), 0, 0, .012); bx(g, W * .6, .012, .01, MT('#8a8478'), 0, Hh / 2 + .004, .003); cyl(g, .006, .006, .02, 5, MT('#2a2a2a'), 0, Hh / 2 - .02, .008).rotation.x = PI / 2;
  ud.set = (c) => { Object.assign(state, c); drawCalendar(t.canvas.getContext('2d'), 64, 80, state); t.needsUpdate = true; return g; }; ud.size = [W, Hh, .02]; return fin(g, o); };

// ---------- picture frames + mirrors ----------
function paintArt(kind) { return (q, w, h, r) => {
  if (kind === 'portrait') { q.fillStyle = '#3a2c1c'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a4630', 60, .5); q.fillStyle = '#1c1612'; q.fillRect(w * .2 | 0, h * .62 | 0, w * .6 | 0, h); q.fillStyle = '#c8a888'; q.beginPath(); q.ellipse(w / 2, h * .38, w * .17, h * .2, 0, 0, TAU); q.fill(); q.fillStyle = '#2a1c12'; q.fillRect(w * .5 - 5 | 0, h * .35, 3, 1); q.fillRect(w * .5 + 3 | 0, h * .35, 3, 1); q.fillStyle = '#6a3a2a'; q.fillRect(w * .5 - 2 | 0, h * .5 | 0, 5, 1); q.fillStyle = '#1c1410'; q.fillRect(w * .33 | 0, h * .14 | 0, w * .34 | 0, 4); }
  else if (kind === 'family') { q.fillStyle = '#c8bca0'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#a89a80', 60, .5); const xs = [.22, .5, .78]; xs.forEach((fx, i) => { const hy = h * (.34 + (i === 1 ? -.04 : .02)); q.fillStyle = '#c09878'; q.beginPath(); q.ellipse(w * fx, hy, w * .09, h * .1, 0, 0, TAU); q.fill(); q.fillStyle = ['#3a3a5a', '#5a3a3a', '#3a5a3a'][i]; q.fillRect(w * fx - w * .12 | 0, hy + h * .1 | 0, w * .24 | 0, h); q.fillStyle = '#2a1c12'; q.fillRect(w * fx - 3 | 0, hy - 1 | 0, 2, 1); q.fillRect(w * fx + 1 | 0, hy - 1 | 0, 2, 1); }); }
  else if (kind === 'flowers') { q.fillStyle = '#d8d0b8'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#b8b098', 50, .5); q.fillStyle = '#4a6a3a'; for (let i = 0; i < 7; i++) q.fillRect(w * (.3 + i * .06) | 0, h * .4 | 0, 1, h * .35 | 0); for (let i = 0; i < 7; i++) { q.fillStyle = ['#c04a5a', '#e0b040', '#8a5ab0'][i % 3]; q.fillRect(w * (.3 + i * .06) - 1 | 0, h * (.3 + (i % 3) * .05) | 0, 3, 3); } q.fillStyle = '#6a4a8a'; q.fillRect(w * .32 | 0, h * .72 | 0, w * .36 | 0, h * .2 | 0); }
  else { for (let y = 0; y < h; y++) { q.fillStyle = mixc('#7a9ac0', '#d8c8a0', y / h * 1.3); q.fillRect(0, y, w, 1); } q.fillStyle = '#4a5a6a'; q.beginPath(); q.moveTo(0, h * .6); q.lineTo(w * .3, h * .3); q.lineTo(w * .5, h * .55); q.lineTo(w * .75, h * .25); q.lineTo(w, h * .6); q.lineTo(w, h); q.lineTo(0, h); q.fill(); q.fillStyle = '#3a5a4a'; q.fillRect(0, h * .72 | 0, w, h); q.fillStyle = '#7a9aa8'; q.fillRect(0, h * .8 | 0, w, h); noise(q, w, h, r, '#2a3a2a', 40, .5); q.fillStyle = '#e8e8e0'; q.fillRect(w * .15 | 0, h * .15 | 0, 6, 1); q.fillRect(w * .6 | 0, h * .2 | 0, 8, 1); } }; }
PS1.props.pictureFrame = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .45, h = o.h || .35, fr = o.frame || '#5a3a20', fm = MT(o.gold ? metal('#c8a850') : wood(fr)), b = .035, pw = Math.round(w * 64), ph = Math.round(h * 64);
  const scr = liveScreen(pw, ph, { fx: null, init: o.draw ? ((q, W, H) => o.draw(q, W, H, PS1.rng(5))) : paintArt(o.kind || 'landscape') }); ud.screen = scr; if (o.draw) scr.content = o.draw;
  bx(g, w, b, .03, fm, 0, h / 2 - b / 2, 0, 3); bx(g, w, b, .03, fm, 0, -h / 2 + b / 2, 0, 3); bx(g, b, h - 2 * b, .03, fm, -w / 2 + b / 2, 0, 0, 3); bx(g, b, h - 2 * b, .03, fm, w / 2 - b / 2, 0, 0, 3);
  bx(g, w - 2 * b, h - 2 * b, .004, MT('#d8d0b8'), 0, 0, -.008); ud.picture = plane(g, w - 2 * b, h - 2 * b, M(scr.tex), 0, 0, .002, 1); ud.size = [w, h, .03]; return fin(g, o); };
const mirrorArt = (q, w, h, r) => { for (let y = 0; y < h; y++) { q.fillStyle = mixc('#b8c4c8', '#7a8a90', y / h); q.fillRect(0, y, w, 1); } q.fillStyle = 'rgba(255,255,255,.18)'; q.beginPath(); q.moveTo(w * .1, 0); q.lineTo(w * .4, 0); q.lineTo(w * .1, h * .6); q.closePath(); q.fill(); q.fillStyle = 'rgba(255,255,255,.1)'; q.beginPath(); q.moveTo(w * .5, 0); q.lineTo(w * .62, 0); q.lineTo(w * .2, h * .9); q.lineTo(w * .1, h * .9); q.closePath(); q.fill(); noise(q, w, h, r, '#ffffff', 10, .2); };
PS1.props.mirror = (o = {}) => {
  const kind = o.kind || 'wall', g = new THREE.Group(), ud = g.userData, w = o.w || (kind === 'standing' ? .5 : .55), h = o.h || (kind === 'standing' ? 1.4 : .75), round = o.shape === 'round';
  const fm = MT(wood(o.frame || '#4a2e1a')), scr = liveScreen(32, Math.max(24, Math.round(32 * h / w)), { fx: null, init: mirrorArt }); ud.screen = scr; const mm = M(scr.tex, { unlit: !!o.unlit });
  const root = kind === 'standing' ? grp(g, 0, .18 + h / 2 + .06, 0) : g; const b = .045;
  if (round) { const r2 = w / 2; add(root, new THREE.CylinderGeometry(r2 + .03, r2 + .03, .035, 14), fm, 0, 0, 0).rotation.x = PI / 2; add(root, new THREE.CircleGeometry(r2, 14), mm, 0, 0, .0215); }
  else { bx(root, w, b, .035, fm, 0, h / 2 - b / 2, 0, 3); bx(root, w, b, .035, fm, 0, -h / 2 + b / 2, 0, 3); bx(root, b, h - 2 * b, .035, fm, -w / 2 + b / 2, 0, 0, 3); bx(root, b, h - 2 * b, .035, fm, w / 2 - b / 2, 0, 0, 3); bx(root, w - 2 * b, h - 2 * b, .005, MT('#6a6e70'), 0, 0, -.01); plane(root, w - 2 * b, h - 2 * b, mm, 0, 0, -.003, 2); }
  if (kind === 'standing') { for (const sx of [-1, 1]) { bx(root, .05, .1 + h, .05, fm, sx * (w / 2 + .01), -.06, -.1).rotation.x = .08; bx(g, .05, .05, .5, fm, sx * (w / 2 + .01), .025, -.05); } ud.tilt = a => { root.rotation.x = a; }; ud.tilt(-.1); }
  ud.size = [w, h + (kind === 'standing' ? .25 : 0), .1]; return fin(g, o); };

// ---------- rug ----------
const rugTex = (hex, style) => mkm('rug' + hex + style, 32, 48, (q, w, h, r) => {
  const dk = sh(hex, .55), lt = mixc(hex, '#e8d8b0', .5), ac = mixc(hex, '#2a3a6a', .6); q.fillStyle = hex; q.fillRect(0, 0, w, h);
  if (style === 'shag') { noise(q, w, h, r, lt, 120, .5); noise(q, w, h, r, dk, 120, .6); return; }
  if (style === 'stripe') { for (let y = 0; y < h; y += 8) { q.fillStyle = y % 16 ? lt : dk; q.fillRect(0, y, w, 4); } noise(q, w, h, r, dk, 60, .5); return; }
  q.fillStyle = dk; q.fillRect(0, 0, w, 3); q.fillRect(0, h - 3, w, 3); q.fillRect(0, 0, 3, h); q.fillRect(w - 3, 0, 3, h); q.fillStyle = lt; q.fillRect(4, 4, w - 8, 1); q.fillRect(4, h - 5, w - 8, 1); q.fillRect(4, 4, 1, h - 8); q.fillRect(w - 5, 4, 1, h - 8);
  q.fillStyle = ac; q.fillRect(6, 6, w - 12, h - 12); q.fillStyle = hex; q.fillRect(7, 7, w - 14, h - 14); const cx = w / 2, cy = h / 2;
  q.fillStyle = lt; q.beginPath(); q.moveTo(cx, cy - 13); q.lineTo(cx + 9, cy); q.lineTo(cx, cy + 13); q.lineTo(cx - 9, cy); q.closePath(); q.fill(); q.fillStyle = ac; q.beginPath(); q.moveTo(cx, cy - 9); q.lineTo(cx + 6, cy); q.lineTo(cx, cy + 9); q.lineTo(cx - 6, cy); q.closePath(); q.fill(); q.fillStyle = dk; q.fillRect(cx - 1, cy - 1, 3, 3);
  q.fillStyle = lt; for (const [x, y] of [[10, 10], [w - 11, 10], [10, h - 11], [w - 11, h - 11], [10, cy], [w - 11, cy]]) { q.fillRect(x - 1, y, 3, 1); q.fillRect(x, y - 1, 1, 3); } noise(q, w, h, r, dk, 90, .5); }, 14);
const fringeTex = mk('fringe', 16, 4, (q, w, h) => { q.clearRect(0, 0, w, h); q.fillStyle = '#d8c8a0'; for (let x = 0; x < w; x += 2) q.fillRect(x, 0, 1, h); });
PS1.props.rug = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || 2, d = o.d || 3, c = o.color || '#7a2a2a', style = o.style || 'persian', t = .018, tx = rugTex(c, style), top = MT(tx), edge = MT(paint(sh(c, .6), .5));
  if (o.shape === 'round') { const r = w / 2; add(g, new THREE.CylinderGeometry(r, r, t, 18), [edge, top, edge], 0, t / 2, 0); ud.size = [w, t, w]; }
  else { bx(g, w, t, d, [edge, edge, top, edge, edge, edge], 0, t / 2, 0); if (style === 'persian' && o.fringe !== false) for (const sz of [-1, 1]) { const f = plane(g, w, .07, M(fringeTex), 0, .012, sz * (d / 2 + .035)); f.rotation.x = -PI / 2; f.material.side = DS; } ud.size = [w, t, d]; }
  return fin(g, o); };

// ============================================================================================================
// KITCHEN + BATH: fridge / stove / counter / sink / bathtub / toilet
// ============================================================================================================
const cabDoorTex = (hex) => mk('cabdoor' + hex, 24, 24, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(hex, .8), 30, .5); q.fillStyle = sh(hex, .6); q.fillRect(3, 3, w - 6, h - 6); q.fillStyle = sh(hex, 1.2); q.fillRect(4, 4, w - 7, h - 7); q.fillStyle = hex; q.fillRect(5, 5, w - 9, h - 9); noise(q, w - 9, h - 9, r, sh(hex, .85), 10, .4); q.fillStyle = sh(hex, 1.3); q.fillRect(0, 0, w, 1); }, 22);
PS1.props.fridge = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .72, h = o.h || 1.72, d = o.d || .7, c = o.color || '#d6dccd', hingeL = (o.hinge || 'left') === 'left', t = .04, legH = .04;
  const out = MT(paint(c, .45)), inn = MT(paint('#e8ece4', .3)), chrome = MT(metal('#c4c8cc')), dark = MT('#14161a'), gasket = MT('#9aa098');
  const bodyH = h - legH, y0 = legH;
  bx(g, t, bodyH, d, faces(out, { 0: inn }), -w / 2 + t / 2, y0 + bodyH / 2, 0, 3); bx(g, t, bodyH, d, faces(out, { 1: inn }), w / 2 - t / 2, y0 + bodyH / 2, 0, 3);
  bx(g, w - 2 * t, t, d, faces(out, { 3: inn }), 0, h - t / 2, 0, 3); bx(g, w - 2 * t, t, d, faces(out, { 2: inn }), 0, y0 + t / 2, 0, 3); bx(g, w - 2 * t, bodyH - 2 * t, .03, faces(inn, { 5: out }), 0, y0 + bodyH / 2, -d / 2 + .015, 3);
  const splitY = y0 + bodyH * .7; bx(g, w - 2 * t, .035, d - .04, inn, 0, splitY, -.02, 3);
  const fz = d / 2 - .04, frz = d / 2;
  bx(g, .05, .02, d, dark, 0, legH / 2, 0); bx(g, w - .06, legH, .04, dark, 0, legH / 2, d / 2 - .06);
  const shelfM = MT(plastic('#cfdad4')); for (const sy of [.22, .5, .78]) bx(g, w - 2 * t - .02, .012, d - .12, shelfM, 0, y0 + t + sy * (splitY - y0 - t) / .78 * .98, -.04);
  // contents
  const bottle = (x, y, z, col, hh = .22, r = .03) => { const b = cyl(g, r, r, hh, 7, MT(col), x, y + hh / 2, z); cyl(g, r * .45, r * .55, .05, 6, MT('#d8d8d0'), x, y + hh + .02, z); };
  ud.contents = grp(g);
  if (o.contents !== false) { const lo = y0 + t + .0, shy = i => y0 + t + [.22, .5, .78][i] * (splitY - y0 - t) / .78 * .98 + .006;
    bottle(-.18, shy(0), -.1, '#4a6a3a', .26); bottle(-.09, shy(0), -.1, '#8a5a2a', .2); bx(g, .08, .17, .08, MT(paint('#e8e8e0', .3)), .05, shy(0) + .085, -.05); bx(g, .22, .09, .16, MT(paint('#8a9a7a', .5)), .17, shy(0) + .045, -.05);
    bx(g, .26, .1, .2, MT(paint('#c8c0a0', .5)), -.12, shy(1) + .05, -.05); cyl(g, .055, .055, .1, 8, MT('#7a4a2a'), .15, shy(1) + .05, -.08); bottle(0, shy(1), -.2, '#a8a8a0', .18);
    bx(g, .3, .12, .22, MT(paint('#7a8a6a', .6)), 0, shy(2) + .06, -.06); cyl(g, .05, .05, .08, 8, MT('#9a3a2a'), -.2, shy(2) + .04, -.1); }
  // doors
  const doorM = M(paint(c, .45)); ud.doors = {};
  const mkDoor = (name, yb, yt) => { const dh = yt - yb - .012, hinge = grp(g, hingeL ? -w / 2 + .005 : w / 2 - .005, yb + .006 + dh / 2, frz + .0); const sx = hingeL ? 1 : -1, ww = w - .01;
    bx(hinge, ww, dh, .045, out, sx * ww / 2, 0, .0225, 3); bx(hinge, ww - .12, dh - .12, .02, inn, sx * ww / 2, 0, -.01, 3);
    for (let i = 0; i < 2; i++) { bx(hinge, ww - .14, .012, .05, shelfM, sx * ww / 2, -dh * .28 + i * dh * .3, -.02); bottle(0, 0, 0, '#000'); g.children.pop(); }
    const hx2 = -sx * (ww - .06) + sx * ww; const handle = grp(hinge, sx * (ww - .05), 0, .045); bx(handle, .022, Math.min(.5, dh * .6), .018, chrome, 0, name === 'freezer' ? -dh * .15 : dh * .22, .02); for (const k of [-1, 1]) bx(handle, .012, .012, .03, chrome, 0, (name === 'freezer' ? -dh * .15 : dh * .22) + k * Math.min(.5, dh * .6) * .4, .008);
    ud.doors[name] = { hinge, sx }; return hinge; };
  mkDoor('freezer', splitY + .02, h - t * .0); mkDoor('fridge', y0 + .0, splitY - .02);
  const lamp = bx(g, .1, .015, .06, M(S('#fff4d8'), { unlit: true }), 0, h - t - .01, -.02); lamp.visible = false; ud.lampMesh = lamp;
  ud.open = (k, which = 'fridge') => { k = clamp(k); for (const [n, dd] of Object.entries(ud.doors)) { if (which !== 'both' && which !== n) continue; dd.hinge.rotation.y = -dd.sx * k * 1.85; } const op = Object.values(ud.doors).some(dd => Math.abs(dd.hinge.rotation.y) > .02); lamp.visible = op; ud.lightOn = op; };
  ud.light = V(0, y0 + bodyH * .4, 0); ud.lightOn = false; ud.size = [w, h, d]; return fin(g, o); };

PS1.props.stove = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .76, h = o.h || .92, d = o.d || .66, c = o.color || '#dcd8cc', t = .03;
  const out = MT(paint(c, .4)), dk = MT(paint('#1c1c1e', .3)), enamel = MT(paint('#222226', .8)), chrome = MT(metal('#c4c8cc')), top = MT(paint('#16161a', .2));
  const oh = .6, oy = .06;
  bx(g, t, h - .0, d, faces(out, { 0: enamel }), -w / 2 + t / 2, h / 2, 0, 3); bx(g, t, h, d, faces(out, { 1: enamel }), w / 2 - t / 2, h / 2, 0, 3);
  bx(g, w, .03, d, top, 0, h - .015, 0, 3); bx(g, w - 2 * t, h - .03, .02, faces(out, { 4: enamel }), 0, (h - .03) / 2, -d / 2 + .01, 3);
  bx(g, w - 2 * t, .03, d - .06, faces(out, { 2: enamel }), 0, oy + .015, -.0, 3); bx(g, w - 2 * t, .03, d - .06, faces(out, { 3: enamel }), 0, oy + oh - .015, 0, 3);
  bx(g, w - 2 * t, h - oy - oh - .03, d - .04, out, 0, oy + oh + (h - oy - oh - .03) / 2, -.0, 3); bx(g, w - .02, oy, .04, dk, 0, oy / 2, d / 2 - .06);
  bx(g, w + .0, .26, .04, out, 0, h + .13, -d / 2 + .02, 3);
  const clk = tex(24, 8, () => { }), cq = clk.canvas.getContext('2d'); cq.fillStyle = '#080c08'; cq.fillRect(0, 0, 24, 8); seg7(cq, '12:00', 2, 0, '#5aff7a', 'rgba(60,140,70,.16)', 7); clk.needsUpdate = true; plane(g, .12, .04, M(clk, { unlit: true }), 0, h + .15, -d / 2 + .052);
  ud.burners = [];
  for (const [bx0, bz0, r] of [[-.19, -.12, .085], [.19, -.12, .085], [-.19, .15, .075], [.19, .15, .075]]) { const gm = glowMat(S('#ff4a1a'), '#ff5a20'); gm.setGlow(0); const ring = cyl(g, r, r, .012, 12, gm, bx0, h + .006, bz0); ring.material = M(S('#2a2a2e')); const hot = M(S('#ff5a20'), { unlit: true }); const glow = cyl(g, r * .8, r * .8, .006, 12, hot, bx0, h + .0125, bz0); glow.visible = false; cyl(g, r * .5, r * .5, .02, 8, MT('#101012'), bx0, h + .01, bz0); ud.burners.push(glow); }
  ud.burner = (i, on) => { if (ud.burners[i]) ud.burners[i].visible = !!on; };
  const panel = tex(32, 8, (q, w2, h2) => { q.fillStyle = c; q.fillRect(0, 0, w2, h2); }), knobY = h - .065; for (let i = 0; i < 5; i++) { const kx = -.27 + i * .135; const kn = cyl(g, .025, .02, .03, 8, chrome, kx, knobY, d / 2 + .0 - .0); kn.rotation.x = PI / 2; kn.position.z = d / 2 - .005 + .0; }
  bx(g, w - 2 * t, .13, .02, out, 0, knobY, d / 2 - .02);
  // oven door: hinged at the bottom, falls forward
  const hinge = grp(g, 0, oy + .02, d / 2 + .0); const dw = w - 2 * t - .0, dh = oh - .03;
  const win = mk('ovenwin', 16, 12, (q, w2, h2, r) => { q.fillStyle = c; q.fillRect(0, 0, w2, h2); q.fillStyle = '#2a1e18'; q.fillRect(2, 2, w2 - 4, h2 - 4); q.fillStyle = '#4a3a2e'; q.fillRect(2, 2, 5, 1); q.fillRect(2, 2, 1, 4); noise(q, w2, h2, r, '#000', 20, .5); });
  bx(hinge, dw, dh, .04, out, 0, dh / 2, .02, 3); plane(hinge, dw * .66, dh * .5, M(win), 0, dh * .44, .0415, 1); bx(hinge, dw * .8, .025, .03, chrome, 0, dh - .06, .06); for (const sx of [-1, 1]) bx(hinge, .02, .02, .04, chrome, sx * dw * .38, dh - .06, .04);
  ud.open = k => { hinge.rotation.x = clamp(k) * (PI / 2 - .02); }; ud.hinge = hinge;
  ud.light = V(0, oy + oh * .6, 0); const rack = MT(metal('#8a8a8a')); for (const ry of [.25, .42]) for (let i = 0; i < 6; i++) bx(g, .012, .012, d - .12, rack, -w / 2 + .08 + i * (w - .16) / 5, oy + ry, 0);
  ud.size = [w, h + .26, d]; return fin(g, o); };

PS1.props.counter = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || 1.8, d = o.d || .62, h = o.h || .9, c = o.color || '#8a6a44', topC = o.top || '#d8d4c4', sink = !!o.sink, t = .04, bh = h - t;
  const body = MT(paint(sh(c, .7), .6)), topM = MT(paint(topC, .5)), steel = MT(metal('#aab0b4')), dark = MT('#101012'), handleM = MT(metal('#bcb08c'));
  bx(g, w, bh - .08, d - .04, body, 0, .08 + (bh - .08) / 2, -.02); bx(g, w - .04, .08, d - .1, dark, 0, .04, -.03);
  const n = Math.max(1, Math.round(w / .6)), dw = w / n, door = M(cabDoorTex(c)); ud.doors = [];
  for (let i = 0; i < n; i++) { const hinge = grp(g, -w / 2 + i * dw + .004, .1 + (bh - .12) / 2, d / 2 - .02); const dh = bh - .12;
    bx(hinge, dw - .01, dh, .022, faces(MT(paint(c, .5)), { 4: door }), (dw - .01) / 2, 0, .011, 3, [4]); bx(hinge, .012, .1, .015, handleM, (dw - .01) - .04, dh * .3, .03); ud.doors.push(hinge); }
  const tz = d / 2 + .02 - (d + .02) / 2 * 0;
  if (!sink) bx(g, w + .02, t, d + .02, topM, 0, h - t / 2, .0, 2);
  else { const sw = .5, sd = .38, sx0 = o.sinkX ?? 0, tw = w + .02, td = d + .02, ztop = 0; const lw = (tw - sw) / 2 + sx0, rw = (tw - sw) / 2 - sx0, fz = (td - sd) / 2 - .02, bz = td - fz - sd;
    bx(g, lw, t, td, topM, -tw / 2 + lw / 2, h - t / 2, 0, 2); bx(g, rw, t, td, topM, tw / 2 - rw / 2, h - t / 2, 0, 2); const sxc = -tw / 2 + lw + sw / 2; bx(g, sw, t, bz, topM, sxc, h - t / 2, -td / 2 + bz / 2, 2); bx(g, sw, t, fz, topM, sxc, h - t / 2, td / 2 - fz / 2, 2);
    const bd = .2, by = h - t - bd; bx(g, sw, .01, sd, steel, sxc, by, -td / 2 + bz + sd / 2); for (const s2 of [-1, 1]) bx(g, .01, bd, sd, steel, sxc + s2 * sw / 2, by + bd / 2, -td / 2 + bz + sd / 2); for (const s2 of [-1, 1]) bx(g, sw, bd, .01, steel, sxc, by + bd / 2, -td / 2 + bz + sd / 2 + s2 * sd / 2);
    cyl(g, .018, .018, .012, 8, dark, sxc, by + .01, -td / 2 + bz + sd / 2);
    const fx = grp(g, sxc, h, -td / 2 + bz * .5 - .02); cyl(fx, .03, .03, .03, 8, steel, 0, .015, 0); cyl(fx, .012, .012, .2, 6, steel, 0, .13, 0); bx(fx, .014, .014, .2, steel, 0, .235, .09); cyl(fx, .012, .012, .04, 6, steel, 0, .22, .185); for (const s2 of [-1, 1]) { const hh = bx(fx, .1, .018, .018, steel, s2 * .1, .05, 0); hh.position.x = s2 * .07; cyl(fx, .012, .012, .04, 6, MT(s2 < 0 ? '#2a5ab0' : '#b02a2a'), s2 * .11, .065, 0); }
    ud.faucetPos = V(sxc, h + .22, -td / 2 + bz * .5 + .1); ud.drain = V(sxc, by + .01, -td / 2 + bz + sd / 2); }
  bx(g, w + .02, .1, .02, topM, 0, h + .05, -d / 2 - .0);
  if (o.upper) { const uh = .7, uy = 1.45, uw = w, ud2 = .34; bx(g, uw, uh, ud2 - .02, body, 0, uy + uh / 2, -d / 2 + ud2 / 2 - .0, 3); for (let i = 0; i < n; i++) { const hinge = grp(g, -w / 2 + i * dw + .004, uy + uh / 2, -d / 2 + ud2 - .01); bx(hinge, dw - .01, uh - .02, .022, faces(MT(paint(c, .5)), { 4: door }), (dw - .01) / 2, 0, .011, 3, [4]); bx(hinge, .012, .1, .015, handleM, (dw - .01) - .04, -uh * .25, .03); ud.doors.push(hinge); } }
  ud.open = (k, i = 0) => { const hd = ud.doors[i]; if (hd) hd.rotation.y = -clamp(k) * 1.7; };
  ud.top = h; ud.size = [w, o.upper ? 2.15 : h, d]; return fin(g, o); };
PS1.props.sink = (o = {}) => PS1.props.counter({ w: 1.2, sink: true, ...o });

PS1.props.bathtub = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || 1.7, d = o.d || .75, h = o.h || .56, t = .07, c = o.color || '#e8e8e0', wm = MT(paint(c, .3)), inn = MT(paint(sh(c, .93), .4)), floorY = .22;
  const outer = wm, innerM = inn;
  for (const sz of [-1, 1]) bx(g, w, h - .12, t, faces(outer, { [sz > 0 ? 5 : 4]: innerM }), 0, .12 + (h - .12) / 2, sz * (d / 2 - t / 2), 3);
  for (const sx of [-1, 1]) bx(g, t, h - .12, d - 2 * t, faces(outer, { [sx > 0 ? 1 : 0]: innerM }), sx * (w / 2 - t / 2), .12 + (h - .12) / 2, 0, 3);
  bx(g, w - 2 * t, .1, d - 2 * t, faces(outer, { 2: innerM }), 0, floorY - .05 + .0, 0, 3);
  for (const sz of [-1, 1]) bx(g, w + .03, .025, t + .03, wm, 0, h + .0125, sz * (d / 2 - t / 2)); for (const sx of [-1, 1]) bx(g, t + .03, .025, d - 2 * t, wm, sx * (w / 2 - t / 2), h + .0125, 0);
  const foot = MT(metal('#b0a070')); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(g, .035, .03, .1, 6, foot, sx * (w / 2 - .12), .05, sz * (d / 2 - .12)); add(g, new THREE.IcosahedronGeometry(.045, 0), foot, sx * (w / 2 - .12), .1, sz * (d / 2 - .12)); }
  const fx = grp(g, -w / 2 + .0, h, 0); cyl(fx, .02, .02, .05, 6, MT(metal('#c4c8cc')), 0, .045, 0); bx(fx, .015, .015, .12, MT(metal('#c4c8cc')), .06, .09, 0).rotation.y = PI / 2; for (const sz of [-1, 1]) cyl(fx, .015, .015, .04, 6, MT(sz < 0 ? '#2a5ab0' : '#b02a2a'), .0, .075, sz * .06);
  const water = o.waterColor || '#6e8e98', wp = plane(g, w - 2 * t - .02, d - 2 * t - .02, M(S(water)), 0, floorY + .3, 0); wp.rotation.x = -PI / 2; wp.visible = false; ud.waterMesh = wp;
  ud.water = (k, col) => { k = clamp(k); wp.visible = k > .02; wp.position.y = floorY + .02 + k * (h - floorY - .08); if (col) wp.material = M(S(col)); }; ud.water(o.water || 0);
  if (o.curtain) { const cc = typeof o.curtain === 'string' ? o.curtain : '#8aa8b8', cm = M(fabric(cc, 'stripe'), { side: DS }); const rod = MT(metal('#b8bcc0')), rh = 1.85;
    for (const sx of [-1, 1]) cyl(g, .012, .012, rh, 6, rod, sx * (w / 2 - .02), rh / 2, d / 2 + .1); cylx(g, .012, .012, w, 6, rod, 0, rh, d / 2 + .1); cylz(g, .012, .012, d + .2, 6, rod, w / 2 - .02, rh, 0); cylz(g, .012, .012, d + .2, 6, rod, -w / 2 + .02, rh, 0);
    const geo = PS1.rep(new THREE.PlaneGeometry(w - .06, rh - .5, 10, 1), 5, 3), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (i % 11) % 2 ? .035 : 0); const piv = grp(g, -w / 2 + .03, rh - .02, d / 2 + .1); const cp = add(piv, geo, cm, (w - .06) / 2, -(rh - .5) / 2, 0); ud.curtainMesh = piv; ud.curtain = k => { piv.scale.x = .12 + .88 * clamp(k); }; ud.curtain(o.curtainClosed ?? 1); }
  ud.size = [w, o.curtain ? 1.9 : h + .1, d]; return fin(g, o); };

PS1.props.toilet = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, c = o.color || '#e6e6de', wm = MT(paint(c, .3)), dark = MT('#101418');
  const bz = .08;
  bx(g, .38, .4, .2, wm, 0, .62, -.27, 3); bx(g, .4, .03, .22, wm, 0, .835, -.27, 3); bx(g, .06, .06, .06, MT(metal('#c4c8cc')), -.14, .86, -.25);
  const bowl = add(g, lathe([[0, 0], [.07, 0], [.09, .06], [.12, .18], [.17, .32], [.2, .42], [.205, .46]], 12), wm, 0, 0, .08); bowl.scale.set(1, 1, 1.3);
  bx(g, .2, .3, .14, wm, 0, .15, -.2, 3);
  const ringTop = add(g, new THREE.RingGeometry(.11, .2, 12), M(S(c), { side: DS }), 0, .465, .08); ringTop.rotation.x = -PI / 2; ringTop.scale.set(1, 1.3, 1);
  const water = add(g, new THREE.CircleGeometry(.1, 10), M(S('#1a2a30')), 0, .36, .09); water.rotation.x = -PI / 2; water.scale.set(1, 1.3, 1);
  const lid = grp(g, 0, .485, -.12); const lidM = MT(paint(sh(c, 1.02), .3)); const ld = add(lid, new THREE.CylinderGeometry(.2, .2, .025, 12), lidM, 0, .0125, .2); ld.scale.set(1, 1, 1.3); ud.lid = lid;
  const seat = add(g, new THREE.CylinderGeometry(.205, .205, .02, 12, 1, true), M(S('#f0f0e8'), { side: DS }), 0, .475, .08); seat.scale.set(1, 1, 1.3);
  ud.open = k => { lid.rotation.x = -clamp(k) * 1.65; };
  ud.size = [.4, .86, .6]; return fin(g, o); };

// ============================================================================================================
// SMALL PROPS: candle / flashlight / box / trashCan / bottle / mug / book
// ============================================================================================================
const flameTex = mk('flame', 8, 12, (q, w, h) => { q.clearRect(0, 0, w, h); const rows = [[3, 4, '#ff8a20'], [2, 5, '#ff8a20'], [2, 5, '#ffb030'], [1, 6, '#ffb030'], [1, 6, '#ffcc50'], [1, 6, '#ffcc50'], [2, 4, '#fff0a0'], [2, 4, '#fff0a0'], [3, 2, '#ffffff']]; rows.forEach(([x, ww, c], i) => { q.fillStyle = c; q.fillRect(x, h - 2 - i - 1, ww, 1); }); q.fillStyle = '#3a5aff'; q.fillRect(3, h - 1, 2, 1); q.fillStyle = '#c04a10'; q.fillRect(3, 1, 1, 1); });
PS1.props.candle = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, hh = o.h || .14, wax = MT(paint(o.color || '#e8dfc4', .3)), holder = o.holder || 'dish', br = MT(metal('#b09050')); let y0 = 0;
  if (holder === 'dish') { cyl(g, .06, .045, .015, 10, br, 0, .0075, 0); const ring = new THREE.TorusGeometry(.018, .004, 4, 6); add(g, ring, br, .065, .015, 0).rotation.x = PI / 2; y0 = .015; }
  else if (holder === 'stick') { cyl(g, .05, .05, .012, 8, br, 0, .006, 0); cyl(g, .012, .018, .1, 6, br, 0, .062, 0); cyl(g, .03, .02, .018, 8, br, 0, .121, 0); y0 = .13; }
  const wx = cyl(g, .0215, .0235, hh, 7, wax, 0, y0 + hh / 2, 0); bx(g, .012, .035, .012, wax, .02, y0 + hh - .02, .0); bx(g, .01, .06, .01, wax, -.019, y0 + hh * .5, .008);
  bx(g, .003, .014, .003, MT('#1a1612'), 0, y0 + hh + .006, 0);
  const fm = M(flameTex, { unlit: true, noFog: true, side: DS }), flame = grp(g, 0, y0 + hh + .012, 0); const f1 = plane(flame, .022, .033, fm, 0, .0165, 0), f2 = plane(flame, .022, .033, fm, 0, .0165, 0); f2.rotation.y = PI / 2; ud.flame = flame;
  ud.light = V(0, y0 + hh + .03, 0); ud.lightColor = [1, .62, .26]; ud.lit = o.lit !== false; flame.visible = ud.lit;
  ud.set = on => { ud.lit = !!on; flame.visible = ud.lit; }; ud.flickerK = t => .82 + .18 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1) + .08 * Math.sin(t * 41);
  ud.update = t => { if (!ud.lit) return; const k = ud.flickerK(t); flame.scale.set(.9 + .12 * Math.sin(t * 23), .85 + .35 * k, 1); flame.rotation.z = Math.sin(t * 9) * .12; flame.rotation.y = t * 2; };
  ud.update(0); ud.size = [.1, y0 + hh + .05, .1]; return fin(g, o); };

PS1.props.flashlight = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, body = MT(plastic(o.color || '#c8a020')), grip = MT(plastic('#1a1a1c')), chrome = MT(metal('#b0b4b8')); const root = grp(g, 0, o.standing ? .0 : .028, 0), q = grp(root);
  cylz(q, .021, .021, .12, 8, body, 0, 0, -.02); for (let i = 0; i < 4; i++) cylz(q, .0225, .0225, .008, 8, grip, 0, 0, -.06 + i * .018); cylz(q, .019, .019, .03, 8, grip, 0, 0, -.095);
  cylz(q, .036, .024, .05, 10, chrome, 0, 0, .065); cylz(q, .034, .034, .008, 10, chrome, 0, 0, .092);
  const lens = glowMat(S('#fff6d8'), '#fff4c8'); const lensMesh = add(q, new THREE.CircleGeometry(.029, 10), lens, 0, 0, .0965); ud.lens = lens;
  bx(q, .012, .008, .02, MT('#2a2a2c'), 0, .024, .01); bx(q, .014, .004, .028, chrome, 0, -.0, -.0).visible = false;
  if (o.standing) { q.rotation.x = -PI / 2; q.position.set(0, .12, 0); }
  ud.on = o.on !== false; ud.set = on => { ud.on = !!on; lens.setGlow(ud.on ? 1 : 0); }; ud.set(ud.on);
  ud.light = o.standing ? V(0, .26, 0) : V(0, .028, .11); ud.dir = o.standing ? V(0, 1, 0) : V(0, 0, 1); ud.lightColor = [1, .95, .8]; ud.size = [.07, .07, .22]; return fin(g, o); };

const cardboard = (hex = '#a8804a') => mkm('card' + hex, 16, 16, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); q.fillStyle = sh(hex, .85); for (let y = 2; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, sh(hex, .7), 24, .6); noise(q, w, h, r, sh(hex, 1.2), 16, .5); }, 15);
const boxLabel = mk('boxlabel', 16, 16, (q, w, h, r) => { q.fillStyle = '#a8804a'; q.fillRect(0, 0, w, h); q.fillStyle = sh('#a8804a', .85); for (let y = 2; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#6a4a28', 20, .6); q.fillStyle = '#ece8dc'; q.fillRect(3, 3, 10, 7); q.fillStyle = '#2a2824'; for (let i = 0; i < 3; i++) q.fillRect(4, 4 + i * 2, 8 - i * 2, 1); q.fillStyle = '#c8c090'; q.fillRect(0, 12, w, 2); }, 16);
PS1.props.box = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, w = o.w || .4, h = o.h || .3, d = o.d || .3, cm = MT(cardboard(o.color)), inn = MT(cardboard(sh(o.color || '#a8804a', .75))), t = .008, lab = M(boxLabel);
  bx(g, w, h, t, faces(cm, { 4: o.label === false ? cm : lab, 5: inn }), 0, h / 2, d / 2 - t / 2, 3, [4]); bx(g, w, h, t, faces(cm, { 4: inn }), 0, h / 2, -d / 2 + t / 2, 3);
  for (const sx of [-1, 1]) bx(g, t, h, d - 2 * t, faces(cm, { [sx > 0 ? 1 : 0]: inn }), sx * (w / 2 - t / 2), h / 2, 0, 3); bx(g, w - 2 * t, t, d - 2 * t, faces(cm, { 2: inn }), 0, t / 2, 0, 3);
  const tape = MT(plastic('#c8b070')); ud.flaps = [];
  for (const sz of [-1, 1]) { const hg = grp(g, 0, h, sz * (d / 2)); bx(hg, w, t, d / 2 - .002, faces(cm, { 3: inn }), 0, t / 2, -sz * (d / 4 - .001), 3); ud.flaps.push({ hg, sz, kind: 'major' }); }
  for (const sx of [-1, 1]) { const hg = grp(g, sx * (w / 2), h - .012, 0); bx(hg, w * .32, t, d - .02, faces(cm, { 3: inn }), -sx * w * .16, t / 2, 0, 3); ud.flaps.push({ hg, sx, kind: 'minor' }); }
  const tp = bx(g, .05, .002, d + .004, tape, 0, h + t + .001, 0); ud.tape = tp; ud.tapeMesh = tp; if (o.taped === false) tp.visible = false;
  ud.open = k => { k = clamp(k); for (const f of ud.flaps) { if (f.kind === 'major') f.hg.rotation.x = f.sz * k * 2.1; else f.hg.rotation.z = f.sx * k * -1.9 * -1; } ud.tape.visible = k < .02 && o.taped !== false; };
  ud.open(o.open ? 1 : 0); ud.size = [w, h + .01, d]; return fin(g, o); };

PS1.props.trashCan = (o = {}) => {
  const kind = o.kind || 'kitchen', g = new THREE.Group(), ud = g.userData;
  if (kind === 'metal') {
    const m = MT(metal('#8a9096')), dm = MT(paint('#2a2c2e', .5)), r = .24, hh = .7;
    add(g, new THREE.CylinderGeometry(r, r * .9, hh, 12, 1, true), M(metal('#8a9096'), { side: DS }), 0, hh / 2, 0); cyl(g, r * .9, r * .9, .01, 12, dm, 0, .005, 0);
    for (const y of [.12, hh * .5, hh - .06]) cyl(g, r + .008, r * (.9 + .1 * y / hh) + .008, .025, 12, m, 0, y, 0);
    const hg = grp(g, 0, hh, -r + .0); const lid = cyl(hg, r + .02, r + .02, .03, 12, m, 0, .015, r); cyl(hg, .1, .1, .03, 8, m, 0, .045, r); bx(hg, .14, .02, .03, m, 0, .075, r); ud.lid = hg;
    ud.open = k => { hg.rotation.x = -clamp(k) * 1.9; hg.position.y = hh + (k > 0 ? .0 : 0); }; ud.size = [r * 2, hh + .1, r * 2];
    for (const sx of [-1, 1]) bx(g, .04, .03, .04, m, sx * (r + .02), hh * .6, 0);
  } else {
    const c = o.color || '#b8bcc0', m = MT(metal(c)), r = .17, hh = .6;
    add(g, new THREE.CylinderGeometry(r, r * .92, hh, 10, 1, true), M(metal(c), { side: DS }), 0, hh / 2 + .02, 0); cyl(g, r * .92, r * .92, .01, 10, MT('#202224'), 0, .025, 0); cyl(g, r + .005, r + .005, .03, 10, MT('#2a2c30'), 0, .035, 0);
    const hg = grp(g, 0, hh + .02, -r); cyl(hg, r + .01, r + .01, .035, 10, MT(metal(sh(c, .85))), 0, .0175, r); const dome = add(hg, new THREE.SphereGeometry(r + .005, 10, 3, 0, TAU, 0, PI / 2), MT(metal(sh(c, .85))), 0, .03, r); dome.scale.y = .35; ud.lid = hg;
    bx(g, .06, .03, .08, MT('#202224'), 0, .04, r + .04); ud.open = k => { hg.rotation.x = -clamp(k) * 1.7; }; ud.size = [r * 2, hh + .1, r * 2]; }
  return fin(g, o); };

const BOTTLES = { beer: { c: '#7a4a1a', pts: [[0, 0], [.03, 0], [.032, .01], [.032, .13], [.026, .17], [.013, .2], [.013, .26], [.0145, .265], [.0145, .27], [0, .27]], cap: '#d8b030', label: '#e8d8a8' }, wine: { c: '#1e3a22', pts: [[0, 0], [.036, 0], [.037, .01], [.037, .19], [.03, .23], [.014, .27], [.0135, .33], [.0145, .335], [.0145, .34], [0, .34]], cap: '#6a1a1a', label: '#e8e0c8' }, whiskey: { c: '#a8741a', pts: [[0, 0], [.04, 0], [.042, .01], [.042, .15], [.03, .19], [.015, .21], [.015, .24], [.018, .245], [.018, .25], [0, .25]], cap: '#2a2a2a', label: '#d8c8a0' }, medicine: { c: '#a8601a', pts: [[0, 0], [.03, 0], [.032, .01], [.032, .075], [.024, .09], [.022, .095], [.022, .105], [0, .105]], cap: '#eeeeee', label: '#f0f0e8' }, milk: { c: '#e8ecee', pts: [[0, 0], [.04, 0], [.04, .16], [.03, .2], [.022, .215], [.022, .23], [0, .23]], cap: '#2a5ab0', label: '#8ab0e0' } };
PS1.props.bottle = (o = {}) => {
  const kind = o.kind || 'beer', B = BOTTLES[kind] || BOTTLES.beer, col = o.color || B.c, g = new THREE.Group(), ud = g.userData;
  const topY = B.pts[B.pts.length - 1][1], key = 'bottle' + kind + col + (o.label === false ? 0 : 1) + (o.labelColor || '');
  const t = mk(key, 16, 32, (q, w, h, r) => { q.fillStyle = col; q.fillRect(0, 0, w, h); q.fillStyle = sh(col, 1.5); q.fillRect(3, 6, 1, 22); q.fillStyle = sh(col, 1.25); q.fillRect(4, 8, 1, 14); q.fillStyle = sh(col, .6); q.fillRect(11, 0, 4, h);
    q.fillStyle = B.cap; q.fillRect(0, 0, w, Math.round(h * (kind === 'medicine' ? .1 : .075)));
    if (o.label !== false && kind !== 'milk') { q.fillStyle = o.labelColor || B.label; const ly = h * (kind === 'medicine' ? .3 : .42), lh = h * (kind === 'medicine' ? .45 : .32); q.fillRect(0, ly, w, lh); q.fillStyle = '#2a2420'; q.fillRect(2, ly + 3, 12, 1); q.fillRect(3, ly + 6, 9, 1); q.fillStyle = '#9a2a24'; q.fillRect(2, ly + lh - 3, 5, 1); }
    if (kind === 'milk') { q.fillStyle = B.label; q.fillRect(0, h * .4, w, h * .25); q.fillStyle = '#e8ecee'; q.fillRect(2, h * .45, 12, 1); } noise(q, w, h, r, '#000000', 10, .3); }, 3);
  const bd = new THREE.LatheGeometry(B.pts.map(([r2, y]) => new THREE.Vector2(r2, y)), 8); for (let i = 0; i < bd.attributes.uv.count; i++) bd.attributes.uv.setY(i, bd.attributes.position.getY(i) / topY);
  const m = add(g, bd, M(t)); m.material.side = THREE.FrontSide; ud.size = [.08, topY, .08]; if (o.lying) { g.rotation.z = PI / 2; g.position.y = .035; } return fin(g, o); };

PS1.props.mug = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, c = o.color || '#c8c4b8', r = .04, hh = .09, tx = mk('mug' + c, 16, 8, (q, w, h, r2) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = sh(c, 1.2); q.fillRect(2, 0, 1, h); q.fillStyle = sh(c, .75); q.fillRect(w - 3, 0, 3, h); if (o.stripe) { q.fillStyle = o.stripe; q.fillRect(0, 2, w, 2); } noise(q, w, h, r2, sh(c, .7), 8, .4); }, 4);
  add(g, new THREE.CylinderGeometry(r, r * .92, hh, 10, 1, true), M(tx, { side: DS }), 0, hh / 2, 0); cyl(g, r * .92, r * .92, .006, 10, MT(c), 0, .003, 0);
  const hm = MT(plastic(c)); bx(g, .01, .012, .01, hm, r + .008, hh * .75, 0); bx(g, .01, .012, .01, hm, r + .008, hh * .25, 0); bx(g, .01, hh * .5 + .012, .01, hm, r + .018, hh * .5, 0);
  if (o.coffee !== false) { const cf = cyl(g, r * .92, r * .92, .004, 10, MT(o.liquid || '#2a1a10'), 0, hh - .014, 0); ud.coffee = cf; }
  ud.size = [.1, hh, .08]; return fin(g, o); };

const bookCover = (hex, title) => mk('bookc' + hex + (title || ''), 32, 44, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); noise(q, w, h, r, sh(hex, .75), 60, .6); noise(q, w, h, r, sh(hex, 1.25), 30, .4); q.fillStyle = sh(hex, .6); q.fillRect(0, 0, 3, h); q.fillStyle = '#d8c070'; q.fillRect(5, 6, w - 9, 1); q.fillRect(5, h - 7, w - 9, 1); if (title) { q.fillStyle = '#d8c890'; q.font = 'bold 6px "Courier New", monospace'; q.textAlign = 'center'; q.textBaseline = 'middle'; const words = String(title).split(' '); words.slice(0, 3).forEach((wd, i) => q.fillText(wd.slice(0, 7), w / 2 + 1, 16 + i * 8)); } else { q.fillStyle = '#d8c070'; q.fillRect(11, 16, 12, 1); q.fillRect(9, 22, 16, 1); } }, 8);
const pagesTex = (scrawl) => mk('pages' + (scrawl ? 1 : 0), 24, 32, (q, w, h, r) => { q.fillStyle = '#e4dcc0'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#c8bc98', 30, .5); q.fillStyle = scrawl ? '#2a1a14' : '#b0a888'; for (let y = 3; y < h - 2; y += 3) { let x = 2; while (x < w - 3) { const len = 1 + (r() * 4 | 0); if (r() < .85) q.fillRect(x, y, len, 1); x += len + 1; } } if (scrawl) { q.fillStyle = '#8a1a14'; q.fillRect(3, 9, 16, 1); q.fillRect(5, 10, 12, 1); } }, 13);
PS1.props.book = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, c = o.color || '#5a2a2a', W = o.w || .15, D = o.d || .22, th = o.thick || .03, cov = M(bookCover(c, o.title)), cm = MT(paint(sh(c, .8), .5)), pg = MT(plastic('#e0d8bc'));
  if (!o.open) { bx(g, W, th, D, [pg, cm, cov, cm, pg, pg], 0, th / 2, 0); bx(g, W - .006, th - .008, D - .008, pg, .003, th / 2, 0); if (o.standing) { g.rotation.x = PI / 2; g.position.set(0, D / 2, 0); } }
  else { const ps = M(pagesTex(o.scrawl !== false)), ang = .12; for (const sx of [-1, 1]) { const half = grp(g, 0, .012, 0); half.rotation.z = -sx * ang; const c2 = grp(half, sx * W / 2, 0, 0); bx(c2, W, .005, D, cm, 0, -.004, 0); bx(c2, W - .01, .012, D - .01, [pg, pg, ps, pg, pg, pg], 0, .005, 0); } cyl(g, .006, .006, D, 5, cm, 0, .008, 0).rotation.x = PI / 2; }
  ud.size = [o.open ? W * 2 : W, th, D]; return fin(g, o); };

// ============================================================================================================
// EXTRAS: nightstand / stool / grandfatherClock / rockingChair / crib
// ============================================================================================================
PS1.props.nightstand = (o = {}) => PS1.props.table({ kind: 'side', w: .46, d: .4, h: .58, ...o });
PS1.props.stool = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, h = o.h || .46, wd = MT(wood(o.color || '#7a5430'));
  cyl(g, .17, .17, .035, 10, wd, 0, h - .0175, 0); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + .5, l = cyl(g, .016, .02, h - .03, 6, wd, Math.sin(a) * .12, (h - .03) / 2, Math.cos(a) * .12); l.rotation.set(Math.cos(a) * .12, 0, -Math.sin(a) * .12); }
  cyl(g, .13, .13, .015, 8, wd, 0, h * .35, 0).scale.set(1, 1, 1); ud.seatY = h; ud.size = [.36, h, .36]; return fin(g, o); };

PS1.props.grandfatherClock = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, wc = o.color || '#4a2c18', wd = MT(wood(wc)), wdD = MT(wood(sh(wc, .7))), dark = MT('#0c0806'), brass = MT(metal('#c4a850')), W = .46, D = .26, H = o.h || 2.0;
  bx(g, W + .06, .22, D + .04, wd, 0, .11, 0, 3); bx(g, W + .02, .04, D + .02, wdD, 0, .24, 0, 3);
  const th = 1.06, ty = .26 + th / 2, tw = W - .08;
  for (const sx of [-1, 1]) bx(g, .05, th, D, wd, sx * (tw / 2 - .025 + .02), ty, 0, 3); bx(g, tw, th, .02, dark, 0, ty, -D / 2 + .01); bx(g, tw, .07, D, wd, 0, .26 + .035, 0, 3); bx(g, tw, .04, D, wd, 0, .26 + th - .02, 0, 3);
  bx(g, .05, th, .03, wdD, -tw / 2 + .045, ty, D / 2 - .015); bx(g, .05, th, .03, wdD, tw / 2 - .005, ty, D / 2 - .015); bx(g, tw, .05, .03, wdD, 0, .26 + .1, D / 2 - .015); bx(g, tw, .05, .03, wdD, 0, .26 + th - .06, D / 2 - .015);
  const pv = grp(g, 0, .26 + th - .1, -.02); ud.pendulum = pv; bx(pv, .012, .62, .008, brass, 0, -.31, 0); cyl(pv, .08, .08, .015, 10, brass, 0, -.68, 0).rotation.x = PI / 2;
  const hy = .26 + th, hh = .4; bx(g, W + .02, .035, D + .02, wdD, 0, hy + .0175, 0, 3); bx(g, W - .04, hh, D - .02, wd, 0, hy + .035 + hh / 2, 0, 3); bx(g, W + .02, .04, D + .02, wdD, 0, hy + .035 + hh + .02, 0, 3);
  const arch = add(g, new THREE.CylinderGeometry(W / 2 - .02, W / 2 - .02, D - .02, 10, 1, false, -PI / 2, PI), wd, 0, hy + .075 + hh, 0); arch.rotation.x = 0; arch.rotation.z = 0; arch.rotation.y = 0; arch.rotation.x = PI / 2; arch.rotation.z = 0; arch.rotation.order = 'XYZ'; arch.position.y = hy + .075 + hh; arch.scale.set(1, 1, .6); arch.rotation.set(PI / 2, 0, PI / 2); arch.rotation.set(0, 0, 0);
  const R = .15, fc = clockFace('#e6ddc0'), fz = D / 2 - .008; bx(g, W - .1, hh - .08, .01, dark, 0, hy + .035 + hh / 2, fz - .01); plane(g, R * 2, R * 2, M(fc), 0, hy + .035 + hh / 2, fz);
  const hH = grp(g, 0, hy + .035 + hh / 2, fz + .006), hM = grp(g, 0, hy + .035 + hh / 2, fz + .011); bx(hH, .012, R * .6, .003, MT('#101010'), 0, R * .25, 0); bx(hM, .008, R * .85, .003, MT('#101010'), 0, R * .35, 0);
  ud.set = h => { h = ((h % 12) + 12) % 12; hH.rotation.z = -h / 12 * TAU; hM.rotation.z = -(h % 1) * TAU; }; ud.set(o.hours ?? 3.0);
  ud.swing = a => { pv.rotation.z = a; }; ud.update = t => { if (ud.running !== false) pv.rotation.z = Math.sin(t * PI) * .14; }; ud.running = o.running !== false; ud.update(0);
  ud.size = [W + .06, H, D + .04]; return fin(g, o); };

PS1.props.rockingChair = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, wd = MT(wood(o.color || '#6a4426')), R = 1.0, rock = grp(g, 0, R, 0), body = grp(rock, 0, -R, 0); ud.rockR = R;
  for (const sx of [-1, 1]) { for (let i = 0; i < 8; i++) { const a0 = -.42 + i * .12, a1 = a0 + .12, am = (a0 + a1) / 2; const seg = bx(body, .04, .035, .135, wd, sx * .24, R - Math.cos(am) * R + .017, Math.sin(am) * R); seg.rotation.x = -am; } }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(body, .035, .42, .035, wd, sx * .235, .23, sz * .19 + 0, 3);
  bx(body, .5, .04, .46, wd, 0, .44, .0, 3);
  for (const sx of [-1, 1]) { const bp = bx(body, .035, .6, .035, wd, sx * .22, .74, -.22, 3); bp.rotation.x = -.18; bx(body, .035, .035, .46, wd, sx * .235, .62, .03, 3); bx(body, .03, .2, .03, wd, sx * .235, .53, .24, 3); }
  for (const y of [.7, .83, .96]) { const sl = bx(body, .4, .07, .018, wd, 0, y, -.24 - (y - .7) * .18, 3); sl.rotation.x = -.18; }
  ud.rock = a => { rock.rotation.x = a; rock.position.z = a * R; }; ud.rocking = false; ud.amp = .1; ud.update = t => { if (ud.rocking) ud.rock(Math.sin(t * 2.2) * ud.amp); };
  ud.seatY = .46; ud.size = [.56, 1.1, .8]; return fin(g, o); };

PS1.props.crib = (o = {}) => {
  const g = new THREE.Group(), ud = g.userData, wd = MT(wood(o.color || '#cfc4a8')), w = .7, L = 1.3, h = 1.0, mat = MT(fabric('#e8e4d4', 'stripe'));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, .05, h, .05, wd, sx * (w / 2), h / 2, sz * (L / 2), 3);
  for (const sx of [-1, 1]) { bx(g, .04, .05, L, wd, sx * w / 2, h - .06, 0, 3); bx(g, .04, .05, L, wd, sx * w / 2, .5, 0, 3); }
  for (const sz of [-1, 1]) { bx(g, w, .05, .04, wd, 0, h - .06, sz * L / 2, 3); bx(g, w, .05, .04, wd, 0, .5, sz * L / 2, 3); bx(g, w, .35, .03, wd, 0, .68, sz * L / 2, 3); }
  for (const sx of [-1, 1]) for (let i = 0; i < 13; i++) bx(g, .016, .46, .016, wd, sx * w / 2, .75, -L / 2 + .08 + i * (L - .16) / 12);
  bx(g, w - .04, .02, L - .04, wd, 0, .4, 0, 3); bx(g, w - .06, .1, L - .08, mat, 0, .46, 0, 3); ud.mattressTop = .51;
  if (o.blanket !== false) bx(g, w - .1, .03, L * .5, MT(fabric(o.blanket || '#8aa8c0', 'plaid')), 0, .525, .2, 3);
  ud.size = [w + .06, h, L + .06]; return fin(g, o); };

// ---------- helpers other modules / episodes can reuse ----------
PS1.furn = { liveScreen, staticNoise, colorBars, crtFx, darkGlass, seg7, num35, digit35, glowMat, fabric, wood, paint, plastic, metal, hash, bgeo };

//==END==
})();
