// PS1 HALLOWEEN PLACES -- sets for a 1970s suburban autumn-night slasher retelling (stairs, balcony, closet, workshop wall, sanitarium, cemetery).
// Load after ps1.js AND places.js:  <script src="lib/ps1-props/places.js"></script><script src="lib/ps1-props/halloween-places.js"></script>
// (props viewer: places+halloween-places).  Same conventions as places.js: PS1.props.<name>(opts) -> THREE.Group at the origin (not added to a scene),
// metres, y up, things sit on y=0, fronts face +z, deterministic (opts.seed), static geometry merged into one mesh per material, movable parts
// (doors) are separate groups listed in userData. Textures are tiny cached canvases with muted dirty PS1 palettes; big surfaces are subdivided.
//
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// STAIRS
//  stairs({ steps=13, rise=.18, run=.27, width=1, banister:'left'|'right'|'both'|false ('left'), wallSide:'left'|'right'|false ('right'), carpet=true,
//           landing=1.2 (depth of the top landing), woodColor, carpetColor, wallColor })
//   A straight indoor flight rising toward -z. Origin = floor level at the FRONT of the first riser, centred on x (bottom front of step 1). "left"/"right" are
//   seen from the bottom looking up the flight (left = -x). Solid closed stringers, carpet runner, newel posts + spindles + handrail (continues over the landing),
//   optional tall wallpapered wall panel with sloped skirting and a gallery of framed pictures climbing it.
//   userData: bottom (V3 floor 0.55 m in front of the first riser), top (V3 middle of the top landing), angle (slope, rad), at(k 0..1) (V3 on the tread centres: k=0 first
//             tread, k=1 on the landing; at k = i/(steps-1) it is exactly on tread i, in between it follows the pitch line), stepPos(i), steps, rise, run, width,
//             height (top landing y), landing, bounds { x0,x1,z0,z1,y0,y1 }.
//
// BALCONY
//  balcony({ width=3.2, depth=1.3, floorY=2.9, railH=1, rail:'wood'|'iron', gapAt:null|0..1, lit=true (the bedroom window glows), doorOpen=0, color, trimColor })
//   A closed 6 x 3 m two-storey slice of a clapboard house (front faces +z): second-storey French door + a (lit) window beside it, a balcony platform of `width` x `depth` projecting
//   toward +z on two posts with knee braces, back door + windows downstairs, patio slab and an autumn lawn. Origin = ground level at the wall base centre.
//   gapAt = fraction of the platform width (0 left .. 1 right, seen from +z) where the front railing is missing: the post there leans out, a snapped rail dangles, a baluster lies on the deck.
//   userData: floor (V3 centre of the deck), doorway (V3 threshold of the French door), railTop (array of V3 along the top rail, gap excluded), gap (V3|null), groundBelow (V3 where a
//             fall lands, beyond the patio slab), setDoor(k 0..1) (the two leaves swing outward), doorLeaves[], windows[], windowLights[{pos,color,range}] (the lit bedroom window),
//             floorY, railHeight, size { w,d,h }, bounds.
//
// CLOSET
//  closet({ width=1.5, depth=.65, height=2.3, door:'bifold'|'hinged'|'none', open=0, clothes:'mixed'|'coats'|'empty', wallColor })
//   A built-in closet: wallpapered shell with painted liners, plank floor, rod + shelf, hanging garments (coats, jackets, shirts, a dress, a robe; hangers face the front edge-on),
//   shoe boxes + shoes on the floor, hat boxes / blankets / a suitcase on the shelf. 'bifold' = four louvred panels (the slats have see-through gaps), 'hinged' = two panelled leaves.
//   Opening faces +z. Origin = floor, middle of the footprint (back wall at z = -depth/2, opening plane at z = +depth/2).
//   userData: setOpen(k 0 shut .. 1 open), inside (V3 centre of the hanging clothes), rodY, shelfY, hangers[] (V3 hook positions on the rod), standSpot (V3 free floor at the end of the rod
//             where a person fits), frontNormal (V3), doors[] (door groups), openK, garments, size, bounds.
//
// WORKSHOP
//  pegboard({ w=2.4, h=1.6, items:'tools'|'masks'|'mixed', seed, missing=1 (0 = no empty outline) })
//   Perforated hardboard on furring strips; hooks hold hand tools, rope coils and rubber masks on elastic (blank white, clown, skull, green witch). Painted marker outlines sit behind the
//   tools and ONE tool is missing, leaving its empty outline (slot.missing = true). Wall panel: origin = bottom centre of the board, the wall at z = 0, tools stick out toward +z
//   (mount it with position.y = mounting height of the bottom edge).
//   userData: slots[] ({ name, pos:V3 hook-front, kind:'tool'|'mask', missing? }), maskSlots[] ({ name:'blank'|'clown'|'skull'|'witch', pos:V3 centre of the mask }), size, boardZ, missing[].
//  shelfUnit({ w=2.4, h=2, d=.5, stock:'tools'|'paint'|'boxes'|'rope', seed })   steel shelving (floor, middle of footprint, front +z) stocked per shelf. userData: shelfY[] (tops of the shelf boards), size.
//  coverallsOnHook({ name='WALT', hookY=1.85, color })   a dark blue-grey work coverall hung by the collar on a peg rail (name patch, zip, pockets); legs hang free to ~0.25 m above the floor.
//   Origin = floor at the wall (wall at z = 0, garment faces +z). userData: hook (V3), hookY, name, hemY (y of the hem), size.
//
// SANITARIUM
//  sanitarium({ wings=2 (total, split left/right), floors=3, color (brick tint), fence=true, gateOpen=0, lit=.14 (fraction of windows lit), lawn=true, sign='STATE SANITARIUM' })
//   ~40 m wide dark-brick 1950s institution: projecting central block with a columned portico, steps, double doors and lanterns; symmetrical flat-roofed wings (wings=4 steps
//   them back), string courses, cornice + parapet, ~100 small barred windows (a few lit), a boiler chimney, a lawn, a loop drive with a grass island, a 18 m-forward iron
//   fence with returns and a two-leaf gate between brick piers with lamps. Origin = ground at the front centre of the central block (portico/steps reach z = +5.6); front faces +z.
//   userData: gate { pos:V3, setOpen(k 0..1), leaves[], width }, door { pos, normal, w, h }, windows[] ({ pos, normal, w, h, lit, floor, wall:'front'|'back'|'left'|'right', index }),
//             windowLights[] ({ pos, color, range } for lit front/side windows), lamps[] (same format: door lanterns + gate lamps), bounds { x0,x1,z0,z1 }, fenceZ (=18), driveStart (V3
//             outside the gate at the road), size { w,d,h }, floors, steps (V3 foot of the entrance steps).
//
// CEMETERY
//  cemetery({ rows=3, cols=6, spacing=2.2, gaps:[[row,col],...], fence=true, gateOpen=0, seed })
//   A fenced plot of graves (earth mounds, PS1.props.gravestone in mixed shapes/texts/leans), gravel path, bare dead-grass ground, autumn leaf litter, iron fence on brick piers and an arched
//   iron gate at +z. Row 0 is nearest the gate (z = 0), row r at z = -r*spacing; col 0 is at -x. Stones face +z. A `gaps` entry leaves that plot with NO stone: only a small low base slab
//   with two snapped dowel stubs and a patch of turned earth with drag marks toward the path. Origin = centre of plot (row 0, middle column) on the ground.
//   userData: plot(row,col) (V3 stone base), gapPlots[] (V3), gate (V3 centre of the gate on the fence line), setGate(k 0..1), gateLeaves[], stones[] ({ row, col, group, shape, text }),
//             bounds { x0,x1,z0,z1 } (inside the fence), rows, cols, spacing, size.
//
// KIT NOTE: builders call PS1.placesKit (tbox, pln, holeWall, gableRoof, winUnit, doorUnit, bake, bM, ...) and PS1.props.gravestone from places.js, so load places.js first.
// GOTCHAS: unlit parts (lit windows, lanterns, the dim room behind the balcony door) glow but light nothing: feed userData.windowLights / lamps to PS1.light(). Alpha textures (iron fence/gate, leaves,
// louvres) are not mip-mapped on purpose (mips would erase the thin bars), so they shimmer a little at long range.
(function () {
const PS = window.PS1;
if (!PS || !PS.props) throw new Error('halloween-places.js: load lib/ps1.js first');
const K = PS.placesKit;
if (!K || !PS.props.gravestone) throw new Error('halloween-places.js: load lib/ps1-props/places.js before this file (places+halloween-places)');
const { tbox, pln, decal, merge, xf, TX, MT, SOLID, bM, bctx, winUnit, doorUnit, bake, tri } = K;
const P = PS.props;
const PI = Math.PI, TAU = PI * 2, DS = THREE.DoubleSide;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
const fill = (q, c, w, h) => px(q, c, 0, 0, w, h);
const spk = PS.noise;
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };
const put = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
const rotY = (g, a) => g.rotateY(a);

// a "bag" of geometry grouped by material; flush() merges each material into one mesh
const bag = () => {
  const map = new Map();
  const b = {
    put(mat, g) { let a = map.get(mat); if (!a) map.set(mat, a = []); a.push(g); return g; },
    box(mat, w, h, d, x, y, z, rot, tile = 1) { return b.put(mat, xf(tbox(w, h, d, { su: 1 / tile, sv: 1 / tile, seg: 4 }), [x, y, z], rot || [0, 0, 0])); },
    bigBox(mat, w, h, d, x, y, z, tile = 1, seg = 3) { return b.put(mat, xf(tbox(w, h, d, { su: 1 / tile, sv: 1 / tile, seg }), [x, y, z])); },
    geo(mat, g, x = 0, y = 0, z = 0, rot, scale) { return b.put(mat, xf(g, [x, y, z], rot || [0, 0, 0], scale || [1, 1, 1])); },
    cyl(mat, rt, rb, h, n, x, y, z, rot, open) { return b.put(mat, xf(new THREE.CylinderGeometry(rt, rb, h, n, 1, !!open), [x, y, z], rot || [0, 0, 0])); },
    seg(mat, a, c, t) { const len = a.distanceTo(c), g = new THREE.BoxGeometry(t, len, t), q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), c.clone().sub(a).normalize()); g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(.5), q, V3(1, 1, 1))); return b.put(mat, g); },
    flush(parent) { for (const [mat, gs] of map) put(merge(gs), mat, 0, 0, 0, parent); map.clear(); return parent; }
  };
  return b;
};
const triCount = root => { let n = 0; root.traverse(m => { if (m.isMesh) { const g = m.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return n; };
// flat, subdivided plane lying on the ground (normal +y), UVs in metres * s
const floorPlane = (w, d, s, seg = 2) => pln(w, d, s, s, seg).rotateX(-PI / 2);
// planes standing on a wall: facing +z already; faceTo(g, dir) turns them to face +x / -x / -z
const faceX = (g, s) => g.rotateY(s * PI / 2);

// =====================================================================================================================
// TEXTURES (all cached through TX; tint them with MT(tex, { tint }))
// =====================================================================================================================
const T = {};
T.wood = () => TX('hp:wood', 16, 16, (q, w, h, r) => {
  for (let y = 0; y < h; y++) { const v = 112 + (r() * 22 | 0); px(q, `rgb(${v},${v - 36},${v - 68})`, 0, y, w, 1); }
  for (let i = 0; i < 10; i++) px(q, pick(r, ['#4a3020', '#5a3c26', '#86603e']), r() * w | 0, r() * h | 0, 2 + (r() * 6 | 0), 1);
  px(q, '#33200f', 0, 7, w, 1); px(q, '#33200f', 0, 15, w, 1); px(q, '#33200f', r() * w | 0, 0, 1, 7); px(q, '#33200f', r() * w | 0, 8, 1, 7);
}, { mip: true });
T.paint = () => TX('hp:paint', 8, 8, (q, w, h, r) => { fill(q, '#d6cfbc', w, h); spk(q, w, h, r, '#b8b09a', 10, .6); spk(q, w, h, r, '#ece6d4', 6, .6); px(q, '#a49c86', 0, 7, w, 1); }, { mip: true });
T.wallpaper = () => TX('hp:wallpaper', 16, 16, (q, w, h, r) => {
  fill(q, '#cdbb8e', w, h);
  for (const x of [0, 8]) { px(q, '#b9a572', x, 0, 2, h); px(q, '#dccaa0', x + 2, 0, 1, h); }
  for (const [x, y] of [[5, 3], [13, 11], [5, 11], [13, 3]]) { px(q, '#8a7048', x, y, 1, 1); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px(q, '#a88a58', x + dx, y + dy, 1, 1); }
  spk(q, w, h, r, '#8a7a58', 30, .5);
}, { mip: true });
T.panel = () => TX('hp:panelwood', 16, 16, (q, w, h, r) => {
  for (let x = 0; x < w; x += 4) { const v = 118 + (r() * 20 | 0); px(q, `rgb(${v},${v - 34},${v - 62})`, x, 0, 3, h); px(q, '#2e1c10', x + 3, 0, 1, h); for (let k = 0; k < 3; k++) px(q, 'rgba(60,34,18,.5)', x + (r() * 3 | 0), r() * h | 0, 1, 2 + (r() * 4 | 0)); }
}, { mip: true });
T.runner = () => TX('hp:runner', 16, 16, (q, w, h, r) => {
  fill(q, '#6c2a2a', w, h); px(q, '#2c1010', 0, 0, 1, h); px(q, '#2c1010', w - 1, 0, 1, h); px(q, '#a8883e', 1, 0, 1, h); px(q, '#a8883e', w - 2, 0, 1, h);
  for (let y = 0; y < h; y += 8) { px(q, '#8c4444', 7, y + 2, 2, 4); px(q, '#8c4444', 6, y + 3, 4, 2); px(q, '#3a1414', 3, y + 1, 1, 1); px(q, '#3a1414', 12, y + 5, 1, 1); }
  spk(q, w, h, r, '#3a1414', 40, .6); spk(q, w, h, r, '#8a4a4a', 20, .5);
}, { mip: true });
T.art = k => TX('hp:art' + k, 16, 20, (q, w, h, r) => {
  fill(q, '#c8b890', w, h);
  if (k === 0) { px(q, '#7a6a50', 4, 5, 8, 10); px(q, '#a89070', 5, 4, 6, 3); px(q, '#d0b090', 6, 6, 4, 5); px(q, '#2a2018', 6, 6, 1, 1); px(q, '#2a2018', 9, 6, 1, 1); px(q, '#4a3a2c', 4, 14, 8, 5); }
  else if (k === 1) { px(q, '#a0b0a0', 0, 0, w, 9); px(q, '#6a7a52', 0, 9, w, 11); px(q, '#4a4a3a', 3, 5, 5, 6); px(q, '#6a3a30', 3, 4, 5, 2); px(q, '#d8d8c8', 10, 2, 4, 2); }
  else { px(q, '#5a4a3a', 2, 4, 5, 11); px(q, '#4a4a58', 9, 5, 5, 10); px(q, '#d0b090', 3, 2, 3, 3); px(q, '#d0b090', 10, 3, 3, 3); }
  spk(q, w, h, r, '#8a7a5a', 18, .6); px(q, '#6a5a3c', 0, 0, w, 1); px(q, '#6a5a3c', 0, h - 1, w, 1);
});

T.glass = () => TX('hp:glass', 8, 8, (q, w, h, r) => { fill(q, '#10161e', w, h); px(q, '#222c38', 1, 5, 2, 1); px(q, '#222c38', 2, 4, 2, 1); px(q, '#222c38', 3, 3, 2, 1); px(q, '#2e3a48', 4, 2, 1, 1); });
T.french = () => TX('hp:french', 16, 32, (q, w, h, r) => {
  fill(q, '#d4cebb', w, h);
  for (let c = 0; c < 2; c++) for (let k = 0; k < 5; k++) { const x = 2 + c * 7, y = 2 + k * 5; px(q, '#10161e', x, y, 5, 4); px(q, '#232e3a', x + 1, y + 1, 2, 1); px(q, '#1a232e', x + 3, y + 2, 1, 1); px(q, '#a8a290', x, y + 4, 5, 1); }
  px(q, '#a8a290', 0, 0, 1, h); px(q, '#a8a290', w - 1, 0, 1, h); px(q, '#a8a290', 0, 27, w, 1); px(q, '#bcb6a2', 3, 29, 10, 1); spk(q, w, h, r, '#8a8472', 26, .6);
});
T.roomDark = () => TX('hp:roomdark', 16, 16, (q, w, h, r) => { fill(q, '#2e2620', w, h); for (const x of [0, 8]) px(q, '#382e26', x, 0, 2, h); for (const [x, y] of [[5, 3], [13, 11], [5, 11], [13, 3]]) px(q, '#241c18', x, y, 1, 1); spk(q, w, h, r, '#1c1612', 20, .6); }, { mip: true });
T.roomFloor = () => TX('hp:roomfloor', 16, 16, (q, w, h, r) => { fill(q, '#201810', w, h); for (let y = 0; y < h; y += 4) px(q, '#150f09', 0, y, w, 1); spk(q, w, h, r, '#2c2218', 20, .6); }, { mip: true });
T.concrete = () => TX('hp:concrete', 16, 16, (q, w, h, r) => { fill(q, '#8c8a82', w, h); spk(q, w, h, r, '#767470', 90, .8); spk(q, w, h, r, '#a09e94', 60, .8); px(q, '#5e5c58', 0, 0, w, 1); px(q, '#5e5c58', 0, 0, 1, h); for (let i = 0; i < 4; i++) px(q, '#4e5a38', r() * w | 0, r() * h | 0, 2, 1); }, { mip: true });
T.grass = () => TX('hp:grass', 32, 32, (q, w, h, r) => {
  fill(q, '#5a5230', w, h); spk(q, w, h, r, '#3e3a20', 260, .9); spk(q, w, h, r, '#7a6e3c', 160, .8);
  for (let i = 0; i < 40; i++) px(q, pick(r, ['#8a7a44', '#6a6030', '#4a4624', '#98804a']), r() * w | 0, r() * h | 0, 1, 2 + (r() * 2 | 0));
  for (let i = 0; i < 6; i++) px(q, '#3e2c1c', r() * w | 0, r() * h | 0, 2, 2);
}, { mip: true });
T.leaf = () => TX('hp:leaf', 8, 8, (q, w, h) => {
  q.clearRect(0, 0, w, h); px(q, '#e0e0e0', 3, 1, 2, 5); px(q, '#e0e0e0', 2, 2, 4, 3); px(q, '#c8c8c8', 1, 3, 6, 1); px(q, '#9a9a9a', 3, 2, 1, 4); px(q, '#9a9a9a', 3, 6, 1, 1);
});
const LEAFC = ['#b8662a', '#a8782c', '#8a4a22', '#c8a040', '#7a5a2a', '#9a3a20'];
const leafMat = c => MT(T.leaf(), { tint: c, side: DS });
// scatter n autumn leaves on y = y0 inside the box x:[x0,x1] z:[z0,z1] into bag B
const scatterLeaves = (B, r, n, x0, x1, z0, z1, y0) => { for (let i = 0; i < n; i++) { const s = .17 + r() * .13; B.geo(leafMat(pick(r, LEAFC)), new THREE.PlaneGeometry(s, s * .8).rotateX(-PI / 2), lerp(x0, x1, r()), y0 + r() * .012, lerp(z0, z1, r()), [0, r() * TAU, 0]); } };

T.louver = () => TX('hp:louver', 16, 128, (q, w, h, r) => {
  q.clearRect(0, 0, w, h);
  px(q, '#d8d2be', 0, 0, 2, h); px(q, '#d8d2be', w - 2, 0, 2, h); px(q, '#a8a290', 1, 0, 1, h); px(q, '#a8a290', w - 1, 0, 1, h);
  px(q, '#d8d2be', 0, 0, w, 5); px(q, '#a8a290', 0, 4, w, 1); px(q, '#d8d2be', 0, h - 5, w, 5); px(q, '#a8a290', 0, h - 5, w, 1);
  px(q, '#d8d2be', 0, h / 2 - 2, w, 4); px(q, '#a8a290', 0, h / 2 + 1, w, 1);
  for (let y = 6; y < h - 6; y += 4) { if (Math.abs(y - h / 2) < 4) continue; px(q, '#efe9d6', 2, y, w - 4, 1); px(q, '#d6d0bc', 2, y + 1, w - 4, 1); px(q, '#9a9480', 2, y + 2, w - 4, 1); }
  spk(q, w, h, r, '#8a8470', 30, .5);
});
T.panelDoor = () => TX('hp:paneldoor', 16, 32, (q, w, h, r) => {
  fill(q, '#d8d2c0', w, h); spk(q, w, h, r, '#b8b09a', 26, .6);
  for (const [x, y, ww, hh] of [[3, 3, 4, 10], [9, 3, 4, 10], [3, 17, 4, 11], [9, 17, 4, 11]]) { px(q, '#a49c86', x - 1, y - 1, ww + 2, hh + 2); px(q, '#e6e0cc', x, y, ww, hh); px(q, '#f2ecda', x, y, ww, 1); px(q, '#b8b09a', x, y + hh - 1, ww, 1); }
  px(q, '#8a7a4a', 0, 0, 1, h); px(q, '#a8a290', w - 1, 0, 1, h);
});
T.cloth = () => TX('hp:cloth', 8, 8, (q, w, h, r) => { fill(q, '#d4d4d0', w, h); for (let y = 0; y < h; y += 2) px(q, '#bdbdb8', 0, y, w, 1); spk(q, w, h, r, '#9a9a96', 14, .6); spk(q, w, h, r, '#ececea', 8, .6); px(q, '#a0a09a', 0, 0, 1, h); });
T.floral = () => TX('hp:floral', 8, 8, (q, w, h, r) => { fill(q, '#d8cfc0', w, h); for (const [x, y] of [[1, 1], [5, 5]]) { px(q, '#b05a5a', x, y, 2, 2); px(q, '#6a7a4a', x + 2, y + 1, 1, 1); } for (const [x, y] of [[5, 1], [1, 5]]) { px(q, '#8a6a9a', x, y, 1, 2); px(q, '#6a7a4a', x + 1, y, 1, 1); } });
T.shoebox = () => TX('hp:shoebox', 16, 8, (q, w, h, r) => { fill(q, '#d8c8a0', w, h); px(q, '#a83a2a', 0, 0, w, 2); px(q, '#a83a2a', 0, 6, w, 2); px(q, '#2a2a2a', 4, 3, 8, 2); px(q, '#e8dcb8', 5, 3, 3, 1); spk(q, w, h, r, '#8a7a5a', 10, .6); });
T.cardboard = () => TX('hp:cardboard', 16, 16, (q, w, h, r) => { fill(q, '#b08c5c', w, h); spk(q, w, h, r, '#8a6a40', 40, .7); spk(q, w, h, r, '#c8a470', 30, .7); px(q, '#d8c490', 0, 7, w, 2); px(q, '#8a6a40', 0, 6, w, 1); px(q, '#8a6a40', 0, 9, w, 1); px(q, '#e8e0cc', 10, 11, 4, 3); px(q, '#4a3a2a', 11, 12, 2, 1); });

T.pegboard = () => TX('hp:pegboard', 16, 16, (q, w, h, r) => {
  fill(q, '#8c704e', w, h); spk(q, w, h, r, '#6e5438', 40, .7); spk(q, w, h, r, '#a48862', 30, .7);
  for (const [x, y] of [[4, 4], [12, 4], [4, 12], [12, 12]]) { px(q, '#1a110a', x - 1, y - 1, 2, 2); px(q, '#a88c68', x - 1, y + 1, 2, 1); }
}, { mip: true });
T.steel = () => TX('hp:steel', 8, 8, (q, w, h, r) => { fill(q, '#7a8088', w, h); for (let x = 0; x < w; x += 4) px(q, '#8e949c', x, 0, 1, h); spk(q, w, h, r, '#5a6068', 12, .7); spk(q, w, h, r, '#8a5a36', 3, .7); px(q, '#4a5058', 0, 7, w, 1); }, { mip: true });
T.rope = () => TX('hp:rope', 8, 8, (q, w, h, r) => { fill(q, '#c0a878', w, h); for (let y = 0; y < h; y += 2) px(q, '#8e7a50', 0, y, w, 1); for (let x = 0; x < w; x += 4) px(q, '#d8c490', x, 0, 1, h); });
T.can = () => TX('hp:can', 16, 16, (q, w, h, r) => { fill(q, '#a8a8a2', w, h); px(q, '#e4dcc0', 0, 4, w, 8); px(q, '#6a6a66', 0, 3, w, 1); px(q, '#6a6a66', 0, 12, w, 1); px(q, '#3a3a3a', 3, 6, 5, 2); px(q, '#9a2a22', 9, 6, 4, 4); px(q, '#3a3a3a', 3, 9, 4, 1); spk(q, w, h, r, '#7a7a76', 14, .6); });
T.tape = () => TX('hp:tape', 8, 8, (q, w, h, r) => { fill(q, '#c8a838', w, h); px(q, '#1a1a1a', 1, 2, 6, 1); px(q, '#a88820', 0, 6, w, 2); });
T.maskFace = kind => TX('hp:mask:' + kind, 32, 40, (q, w, h, r) => {
  const ell = (cx, cy, rx, ry, c) => { q.fillStyle = c; for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) q.fillRect(cx + x, cy + y, 1, 1); };
  const rim = (c, c2) => { fill(q, c2, w, h); ell(16, 20, 14, 19, c); };
  if (kind === 'blank') {
    rim('#e6e2d2', '#bcb6a2'); ell(16, 20, 11, 16, '#ece8da'); spk(q, w, h, r, '#cfc9b6', 24, .5);
    px(q, '#cdc7b4', 7, 12, 6, 1); px(q, '#cdc7b4', 19, 12, 6, 1);
    ell(10, 17, 3, 2, '#0e0c0a'); ell(22, 17, 3, 2, '#0e0c0a'); px(q, '#cdc7b4', 15, 19, 2, 8); px(q, '#a8a290', 14, 27, 1, 1); px(q, '#a8a290', 17, 27, 1, 1); px(q, '#bdb7a4', 12, 32, 8, 1);
  } else if (kind === 'clown') {
    rim('#eee6d8', '#c4bba6'); px(q, '#161412', 7, 11, 6, 1); px(q, '#161412', 6, 12, 2, 1); px(q, '#161412', 19, 11, 6, 1); px(q, '#161412', 24, 12, 2, 1);
    for (const x of [10, 22]) { px(q, '#2a4aa0', x - 1, 14, 2, 1); px(q, '#2a4aa0', x - 2, 15, 4, 1); px(q, '#2a4aa0', x - 3, 16, 6, 2); px(q, '#2a4aa0', x - 2, 18, 4, 1); px(q, '#2a4aa0', x - 1, 19, 2, 1); px(q, '#0e0e14', x - 1, 16, 2, 2); }
    ell(16, 24, 3, 3, '#c0301e'); px(q, '#e86a50', 15, 23, 1, 1);
    for (let x = 9; x <= 23; x++) { const y = 30 + (Math.abs(x - 16) < 4 ? 1 : 0); px(q, '#b81e18', x, y, 1, 2); } px(q, '#b81e18', 8, 29, 2, 1); px(q, '#b81e18', 22, 29, 2, 1); px(q, '#b81e18', 7, 28, 1, 1); px(q, '#b81e18', 24, 28, 1, 1);
  } else if (kind === 'skull') {
    rim('#d8d0b4', '#9a9278'); spk(q, w, h, r, '#b8b098', 30, .6); ell(9, 16, 4, 5, '#0c0a08'); ell(23, 16, 4, 5, '#0c0a08');
    px(q, '#0c0a08', 15, 22, 2, 1); px(q, '#0c0a08', 14, 23, 4, 3); px(q, '#b0a88c', 6, 23, 4, 2); px(q, '#b0a88c', 22, 23, 4, 2);
    for (let x = 9; x <= 23; x += 2) px(q, '#1e1a12', x, 30, 1, 6); px(q, '#1e1a12', 9, 33, 15, 1); px(q, '#1e1a12', 9, 29, 15, 1);
  } else {
    rim('#6e9048', '#3e5628'); spk(q, w, h, r, '#547036', 40, .6); spk(q, w, h, r, '#88ac5a', 24, .6);
    px(q, '#10140c', 6, 11, 7, 1); px(q, '#10140c', 19, 11, 7, 1); px(q, '#10140c', 12, 10, 1, 1); px(q, '#10140c', 19, 10, 1, 1);
    ell(10, 16, 3, 2, '#10140c'); ell(22, 16, 3, 2, '#10140c'); px(q, '#e0d040', 10, 16, 1, 1); px(q, '#e0d040', 22, 16, 1, 1);
    px(q, '#8aae5c', 15, 18, 1, 8); px(q, '#3e5428', 16, 18, 1, 9); px(q, '#3e5428', 14, 26, 4, 1); px(q, '#3e5428', 13, 27, 2, 1); px(q, '#4a3a24', 21, 23, 2, 2);
    px(q, '#5a1a1c', 10, 31, 12, 2); px(q, '#2a0c0c', 11, 32, 10, 1); px(q, '#d8d0a0', 13, 32, 1, 1); px(q, '#d8d0a0', 18, 32, 1, 1);
  }
});
T.coverall = () => TX('hp:coverall', 16, 16, (q, w, h, r) => { fill(q, '#46505c', w, h); for (let y = 0; y < h; y += 2) px(q, '#3e4854', 0, y, w, 1); spk(q, w, h, r, '#323c48', 30, .6); spk(q, w, h, r, '#5a6674', 20, .5); });
T.coverFront = name => TX('hp:coverfront:' + name, 32, 32, (q, w, h, r) => {
  fill(q, '#46505c', w, h); for (let y = 0; y < h; y += 2) px(q, '#3e4854', 0, y, w, 1); spk(q, w, h, r, '#323c48', 50, .6); spk(q, w, h, r, '#5a6674', 30, .5);
  px(q, '#8a8c90', 15, 0, 2, h); for (let y = 1; y < h; y += 2) px(q, '#aeb0b4', 15, y, 2, 1);
  for (const x of [3, 19]) { px(q, '#38424e', x, 7, 10, 8); px(q, '#2c343e', x, 14, 10, 1); px(q, '#5a6674', x, 7, 10, 1); px(q, '#6a7684', x + 4, 8, 2, 1); }
  px(q, '#e8e2cc', 18, 17, 11, 6); px(q, '#a83228', 18, 17, 11, 1); px(q, '#a83228', 18, 22, 11, 1); px(q, '#a83228', 18, 17, 1, 6); px(q, '#a83228', 28, 17, 1, 6);
  q.fillStyle = '#1c2a52'; q.font = 'bold 5px "Courier New", monospace'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(name, 23.5, 20.5);
  px(q, '#2c343e', 0, 24, w, 1); px(q, '#6a7684', 4, 25, 4, 2); px(q, '#6a7684', 24, 25, 4, 2);
});

T.brick = () => TX('hp:brick', 16, 16, (q, w, h, r) => {
  fill(q, '#625a50', w, h);
  for (let y = 0; y < 4; y++) for (let k = 0; k < 2; k++) { const x = (y % 2) * 4 + k * 8, c = pick(r, ['#5a362e', '#4c2e28', '#66403a', '#442824', '#583430']); px(q, c, x % 16, y * 4, 7, 3); if (x + 7 > 16) px(q, c, 0, y * 4, x + 7 - 16, 3); px(q, 'rgba(0,0,0,.25)', x % 16, y * 4 + 2, 7, 1); }
  spk(q, w, h, r, '#1c1412', 40, .55); spk(q, w, h, r, '#74483c', 12, .5);
}, { mip: true });
T.limestone = () => TX('hp:limestone', 16, 16, (q, w, h, r) => { fill(q, '#a09c90', w, h); spk(q, w, h, r, '#84807a', 70, .7); spk(q, w, h, r, '#b8b4a6', 40, .7); px(q, '#6e6a62', 0, 7, w, 1); px(q, '#6e6a62', 0, 15, w, 1); px(q, '#6e6a62', 5, 0, 1, 7); px(q, '#6e6a62', 11, 8, 1, 7); for (let i = 0; i < 3; i++) { const x = r() * w | 0; for (let y = 0; y < 5 + r() * 6; y++) px(q, 'rgba(40,36,30,.3)', x, y, 1, 1); } }, { mip: true });
T.column = () => TX('hp:column', 16, 8, (q, w, h, r) => { fill(q, '#aaa69a', w, h); for (let x = 0; x < w; x += 2) { px(q, '#8c887c', x, 0, 1, h); } for (let x = 1; x < w; x += 4) px(q, '#bcb8ac', x, 0, 1, h); spk(q, w, h, r, '#706c64', 10, .6); }, { mip: true });
T.tar = () => TX('hp:tar', 16, 16, (q, w, h, r) => { fill(q, '#2c2c2e', w, h); spk(q, w, h, r, '#1a1a1c', 80, .8); spk(q, w, h, r, '#4a4a4c', 50, .7); px(q, '#232325', 0, 8, w, 1); }, { mip: true });
T.asphalt = () => TX('hp:asphalt', 16, 16, (q, w, h, r) => { fill(q, '#3a3a3c', w, h); spk(q, w, h, r, '#2a2a2c', 70, .8); spk(q, w, h, r, '#58585a', 40, .8); crack(q, '#1e1e20', r() * w, 0, 16, r, .2, 1); }, { mip: true });
const crack = (q, c, x, y, len, r, dx = 0, dy = 1) => { q.fillStyle = c; for (let i = 0; i < len; i++) { q.fillRect(x | 0, y | 0, 1, 1); x += dx + (r() - .5) * 1.4; y += dy + (r() - .5) * 1.4; } };
T.gravel = () => TX('hp:gravel', 16, 16, (q, w, h, r) => { fill(q, '#6a6558', w, h); for (let i = 0; i < 40; i++) { const x = r() * w | 0, y = r() * h | 0, v = 100 + r() * 70 | 0; px(q, `rgb(${v},${v - 6},${v - 16})`, x, y, 2, 1); px(q, 'rgba(20,20,20,.5)', x, y + 1, 2, 1); } }, { mip: true });
T.soil = () => TX('hp:soil', 16, 16, (q, w, h, r) => { fill(q, '#3c2c1e', w, h); spk(q, w, h, r, '#241a10', 80, .8); spk(q, w, h, r, '#5a4430', 60, .8); for (let i = 0; i < 8; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, '#5e4a36', x, y, 2, 2); px(q, '#1c1208', x, y + 2, 2, 1); } for (let i = 0; i < 4; i++) px(q, '#8a7a64', r() * w | 0, r() * h | 0, 1, 1); }, { mip: true });
T.cemGround = () => TX('hp:cemground', 32, 32, (q, w, h, r) => {
  fill(q, '#544a2c', w, h); spk(q, w, h, r, '#3a3220', 200, .9); spk(q, w, h, r, '#74683c', 130, .8);
  for (let i = 0; i < 7; i++) { const x = r() * w | 0, y = r() * h | 0, s = 3 + (r() * 5 | 0); px(q, '#4a3a28', x, y, s, s - 1); px(q, '#3c2e20', x + 1, y + 1, s - 2, s - 3); }
  for (let i = 0; i < 40; i++) px(q, pick(r, ['#8a7a44', '#6a5c30', '#4a4224', '#9a8450']), r() * w | 0, r() * h | 0, 1, 2 + (r() * 2 | 0));
}, { mip: true });
T.sanWin = v => TX('hp:sanwin' + v, 16, 24, (q, w, h, r) => {
  fill(q, '#8e8a7e', w, h); px(q, '#0c0e12', 1, 1, 14, 22);
  if (v === 0) { px(q, '#161c26', 2, 2, 12, 20); px(q, '#242e3a', 3, 15, 2, 1); px(q, '#242e3a', 4, 14, 2, 1); px(q, '#242e3a', 5, 13, 2, 1); px(q, '#1c2430', 9, 6, 2, 1); }
  else { for (let y = 2; y < 22; y++) px(q, y < 12 ? '#f0c878' : '#d89a50', 2, y, 12, 1); if (v === 2) { px(q, '#c8b070', 2, 2, 12, 8); px(q, '#a89050', 2, 10, 12, 1); } else { px(q, '#fff0b8', 5, 13, 6, 4); px(q, '#3a2818', 6, 16, 4, 6); } }
  px(q, '#2a2a28', 2, 11, 12, 1); for (const x of [5, 8, 11]) px(q, '#050506', x, 2, 1, 20); px(q, '#a8a498', 0, 23, w, 1); px(q, '#6a665c', 0, 0, w, 1);
});
T.transom = () => TX('hp:transom', 16, 8, (q, w, h) => { fill(q, '#14161a', w, h); px(q, '#1e242e', 1, 1, w - 2, h - 2); for (let x = 2; x < w; x += 3) px(q, '#050506', x, 0, 1, h); px(q, '#8e8a7e', 0, 0, w, 1); px(q, '#8e8a7e', 0, h - 1, w, 1); });
T.sign = text => TX('hp:sign:' + text, 128, 16, (q, w, h, r) => {
  fill(q, '#98948a', w, h); spk(q, w, h, r, '#7c786e', 60, .6); px(q, '#6e6a62', 0, 0, w, 1); px(q, '#6e6a62', 0, h - 1, w, 1);
  let fs = 11; q.font = `bold ${fs}px "Times New Roman", serif`; while (q.measureText(text).width > w - 8 && fs > 5) { fs--; q.font = `bold ${fs}px "Times New Roman", serif`; }
  q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = '#e6e2d4'; q.fillText(text, w / 2 + .5, h / 2 + 1); q.fillStyle = '#3a362e'; q.fillText(text, w / 2, h / 2);
});
T.iron = () => TX('hp:iron', 32, 64, (q, w, h) => {
  q.clearRect(0, 0, w, h); const iron = '#1c1e22';
  for (let x = 0; x < w; x += 8) { px(q, iron, x + 3, 6, 2, h - 6); px(q, '#3c4048', x + 3, 8, 1, h - 12); px(q, iron, x + 3, 0, 2, 3); px(q, iron, x + 2, 3, 4, 3); }
  px(q, iron, 0, 14, w, 2); px(q, iron, 0, h - 14, w, 2); px(q, iron, 0, h - 3, w, 3);
});
T.gate = n => TX('hp:gate' + n, 128, 128, (q, w, h) => {
  q.clearRect(0, 0, w, h); const iron = '#1c1e22', top = 22;
  for (let i = 0; i <= n; i++) { const x = Math.round(i * (w - 3) / n); px(q, iron, x, top, 3, h - top); px(q, '#3c4048', x, top + 2, 1, h - top - 6); px(q, iron, x, top - 10, 3, 10); px(q, iron, x - 2, top - 5, 7, 5); px(q, iron, x - 1, top - 14, 5, 5); px(q, iron, x, top - 20, 3, 6); }
  px(q, iron, 0, top + 6, w, 4); px(q, iron, 0, h - 16, w, 4); px(q, iron, 0, h - 5, w, 5);
  q.strokeStyle = iron; q.lineWidth = 3; q.beginPath(); q.arc(w / 2, 78, 15, 0, TAU); q.stroke(); q.beginPath(); q.arc(w / 2, 78, 6, 0, TAU); q.stroke();
});

// =====================================================================================================================
// STAIRS
// =====================================================================================================================
P.stairs = (o = {}) => {
  const n = Math.max(3, Math.round(o.steps ?? 13)), rise = o.rise ?? .18, run = o.run ?? .27, W = o.width ?? 1;
  const ban = o.banister === undefined ? 'left' : o.banister, wallSide = o.wallSide === undefined ? 'right' : o.wallSide, carpet = o.carpet !== false;
  const Ld = o.landing ?? 1.2, H = n * rise, wallTop = H + 2.45, g = new THREE.Group(), B = bag(), r = PS.rng(hash('stairs' + (o.seed ?? 1)));
  const slope = rise / run, zf = i => -i * run, zEnd = zf(n - 1) - Ld, yr = z => rise + (-z) * slope + .9;
  const treadM = MT(T.wood(), { tint: o.woodColor || '#a8845e' }), riserM = MT(T.paint(), { tint: '#f0e8d4' }), postM = MT(T.wood(), { tint: '#6a4a34' }), sideM = MT(T.paint(), { tint: '#cfc4aa' });
  const runnerM = MT(T.runner(), { tint: o.carpetColor || '#ffffff' }), wallM = MT(T.wallpaper(), { tint: o.wallColor || '#d8c6a0' });
  const dirs = side => (side === 'left' ? [-1] : side === 'right' ? [1] : side === 'both' ? [-1, 1] : []);
  const wallS = dirs(wallSide)[0] || 0;
  // treads (thin boards with a 3.5 cm nosing), risers, the top landing
  for (let i = 0; i < n - 1; i++) B.box(treadM, W, .04, run + .035, 0, (i + 1) * rise - .02, zf(i) - run / 2 + .0175, null, .5);
  B.box(treadM, W, .04, Ld + .035, 0, H - .02, zf(n - 1) - Ld / 2 + .0175, null, .5);
  for (let i = 0; i < n; i++) B.geo(riserM, pln(W, rise - .04, 1, 1, 3), 0, i * rise + (rise - .04) / 2, zf(i));
  // closed stringers (stepped columns) on the open sides, plus the solid back under the landing
  for (const s of [-1, 1]) {
    if (s === wallS) continue;
    for (let i = 0; i < n; i++) { const len = i < n - 1 ? run : Ld, h = (i + 1) * rise - .04, z0 = i < n - 1 ? zf(i) - run / 2 : zf(n - 1) - Ld / 2; B.geo(sideM, faceX(pln(len, h, 1, 1, 3), s), s * W / 2, h / 2, z0); }
    const L = Math.hypot((n - 1) * run, (n - 1) * rise);
    B.box(postM, .028, .16, L, s * (W / 2 + .014), (n * rise + rise) / 2 - .09, zf(n - 1) / 2 + .02, [Math.atan(slope), 0, 0], 1);
  }
  B.geo(sideM, rotY(pln(W, H - .04, 1, 1, 3), PI), 0, (H - .04) / 2, zEnd);
  // carpet runner over treads and risers
  if (carpet) {
    const cw = Math.max(.4, W - .22);
    for (let i = 0; i < n; i++) {
      B.geo(runnerM, PS.plane(cw, rise - .04, 1, (rise - .04) / .5, 3), 0, i * rise + (rise - .04) / 2, zf(i) + .008);
      if (i < n - 1) B.geo(runnerM, PS.plane(cw, run + .03, 1, (run + .03) / .5, 3).rotateX(-PI / 2), 0, (i + 1) * rise + .004, zf(i) - run / 2 + .015);
    }
  }
  // banisters
  const spindleM = MT(T.paint(), { tint: '#e8e0c8' });
  const zb = .07, zl = zf(n - 1) - .05, zt = zEnd + .06, yb = yr(zb), yl = yr(zl);
  const heights = [];
  for (const s of dirs(ban)) {
    const x = s * (W / 2 - .05);
    for (const [z, y0, top] of [[zb, 0, yb + .1], [zl, H, yl + .1], [zt, H, yl + .1]]) {
      B.box(postM, .09, top - y0, .09, x, (y0 + top) / 2, z, null, .5); B.box(postM, .125, .04, .125, x, top + .02, z, null, .5);
      B.geo(postM, new THREE.SphereGeometry(.05, 6, 4), x, top + .08, z);
    }
    const a = Math.atan2(yl - yb, zb - zl), L = Math.hypot(zb - zl, yl - yb);
    B.box(postM, .065, .055, L, x, (yb + yl) / 2, (zb + zl) / 2, [a, 0, 0], .5);
    B.box(postM, .065, .055, zl - zt, x, yl, (zl + zt) / 2, null, .5);
    B.box(postM, .05, .04, zl - zt, x, H + .06, (zl + zt) / 2, null, .5);
    for (let i = 0; i < n - 1; i++) { const z = zf(i) - run * .5, ytop = yr(z) - .028, ybase = (i + 1) * rise, len = ytop - ybase; B.cyl(spindleM, .017, .017, len, 4, x, ybase + len / 2, z, [0, PI / 4, 0], true); }
    for (let z = zl - .13; z > zt + .05; z -= .13) { const len = yl - .028 - H; B.cyl(spindleM, .017, .017, len, 4, x, H + len / 2, z, [0, PI / 4, 0], true); }
    heights.push(x);
  }
  // the wall panel: wallpaper, sloped skirting, and a staircase gallery of framed pictures
  let wallLen = 0;
  if (wallS) {
    const z0 = .6, z1 = zEnd - .02, wx = wallS * (W / 2 + .05); wallLen = z0 - z1;
    B.bigBox(wallM, .1, wallTop, wallLen, wx, wallTop / 2, (z0 + z1) / 2, .8, 1.5);
    const sx = wallS * (W / 2 - .012), skirtM = postM;
    B.box(skirtM, .026, .13, z0, sx, .065, z0 / 2, null, .5);
    const a = Math.atan(slope), L = Math.hypot((n - 1) * run, (n - 1) * rise);
    B.box(skirtM, .026, .13, L, sx, (n * rise + rise) / 2 + .02, zf(n - 1) / 2, [a, 0, 0], .5);
    B.box(skirtM, .026, .13, Ld, sx, H + .065, zf(n - 1) - Ld / 2, null, .5);
    for (let k = 0; k < 5; k++) {
      const z = -.35 - k * ((n - 2) * run - .5) / 4, y = yr(z) - .9 + 1.55, fw = .3, fh = k % 2 ? .24 : .38, fx = wallS * (W / 2 - .015);
      B.box(postM, .03, fh + .05, fw + .05, fx, y, z, null, .5);
      B.geo(MT(T.art(k % 3), { tint: '#e8e0d0' }), faceX(pln(fw, fh, 1, 1, 3), -wallS), fx - wallS * .02, y, z);
    }
  }
  // underside: nothing visible (solid). Group together
  B.flush(g);
  const p = i => V3(0, (i + 1) * rise, -(i + .5) * run);
  const at = k => { const a = p(0), b = p(n - 1); return a.lerp(b, clamp(k)); };
  const xs = [-W / 2 - (wallS === -1 ? .1 : .06), W / 2 + (wallS === 1 ? .1 : .06)];
  g.userData = {
    steps: n, rise, run, width: W, height: H, angle: Math.atan2(rise, run), landing: Ld, wallSide, banister: ban,
    bottom: V3(0, 0, .55), top: V3(0, H, zf(n - 1) - Ld * .55), at, stepPos: i => p(clamp(i, 0, n - 1)),
    bounds: { x0: xs[0], x1: xs[1], z0: zEnd, z1: .62, y0: 0, y1: wallS ? wallTop : H + 1.2 }
  };
  return g;
};

// =====================================================================================================================
// BALCONY
// =====================================================================================================================
P.balcony = (o = {}) => {
  const bw = o.width ?? 3.2, bd = o.depth ?? 1.3, fy = o.floorY ?? 2.9, rh = o.railH ?? 1, kind = o.rail === 'iron' ? 'iron' : 'wood', gapAt = o.gapAt ?? null, lit = o.lit !== false;
  const WW = 6, DEP = 3, wallTop = fy + 2.75, r = PS.rng(hash('balcony' + (o.seed ?? 1))), g = new THREE.Group(), B = bag(), BC = bctx({ trimColor: o.trimColor || '#dcd6c4' });
  const siding = bM('siding', o.color || '#a9a99c'), trimM = BC.trim, boardsM = bM('boards', '#7a6c5a'), stone = bM('stone', '#8a867a'), roofM = bM('shingle', '#4e4a46');
  const dX = bw * .15, dw = 1.5, x0 = dX - dw / 2, x1 = dX + dw / 2, dh = 2.1, wx = dX - 1.45;
  // the wall: siding with the French-door opening, side/back skins, roof cap, plinth, corner boards, belt board
  B.geo(siding, holeWall6(WW, wallTop, [{ x0, x1, y0: fy, y1: fy + dh }]));
  B.geo(siding, rotY(pln(WW, wallTop, 1 / .64, 1 / .64, 1.5), PI), 0, wallTop / 2, -DEP);
  for (const s of [-1, 1]) B.geo(siding, faceX(pln(DEP, wallTop, 1 / .64, 1 / .64, 1.5), s), s * WW / 2, wallTop / 2, -DEP / 2);
  B.box(roofM, WW + .6, .14, DEP + .6, 0, wallTop + .07, (.45 - DEP - .15) / 2, null, .7);
  B.box(trimM, WW + .6, .2, .05, 0, wallTop - .02, .47, null, 1);
  const plW = (a, b) => { if (b - a > .05) B.box(stone, b - a, .45, DEP + .2, (a + b) / 2, .225, .1 - (DEP + .2) / 2, null, .8); };
  plW(-WW / 2 - .06, dX - .55); plW(dX + .55, WW / 2 + .06);
  for (const sx of [-1, 1]) for (const sz of [0, -DEP]) B.box(trimM, .13, wallTop - .45, .13, sx * (WW / 2), .45 + (wallTop - .45) / 2, sz, null, 1);
  B.box(trimM, WW + .1, .18, .06, 0, fy - .24, .03, null, 1);
  // interior behind the upper openings (unlit, dim)
  const dimW = MT(T.roomDark(), { unlit: true }), dimF = MT(T.roomFloor(), { unlit: true }), ih = 2.6;
  B.geo(dimW, pln(WW, ih, 1 / .8, 1 / .8, 1.5), 0, fy + ih / 2, -DEP + .02);
  for (const s of [-1, 1]) B.geo(dimW, faceX(pln(DEP, ih, 1 / .8, 1 / .8, 1.5), -s), s * (WW / 2 - .02), fy + ih / 2, -DEP / 2);
  B.geo(dimF, floorPlane(WW, DEP, 1 / .6), 0, fy + .004, -DEP / 2);
  B.geo(dimW, floorPlane(WW, DEP, 1 / .8).rotateX(PI), 0, fy + ih, -DEP / 2);
  const voidM = MT(TX('hp:void', 4, 4, q => fill(q, '#06070a', 4, 4)), { unlit: true });
  B.geo(voidM, pln(WW, fy - .25, 1, 1, 3), 0, (fy - .25) / 2 + .1, -.06);
  // windows and the back door (the kit's units)
  const wins = [];
  const win = (x, y, w, h, lt) => { const rec = winUnit(g, { x, y, z: 0, ry: 0, w, h, lit: lt, wall: 'front', floor: y > fy ? 1 : 0, shutters: false }, BC); wins.push(rec); return rec; };
  const litWin = win(wx, fy + 1.45, .85, 1.3, lit);
  for (const sx of [-2.3, 2.3]) { win(sx, fy + 1.45, .9, 1.3, false); win(sx, 1.65, .9, 1.3, false); }
  win(-1.4, 1.65, .9, 1.3, false);
  doorUnit(g, { x: dX, y: 0, z: 0, ry: 0, color: '#5a4636', glass: false, w: .95, h: 2.05 }, BC);
  // French door: casing, threshold, two leaves that swing outward
  B.box(trimM, .08, dh + .08, .06, x0 - .04, fy + dh / 2 + .04, .03, null, 1); B.box(trimM, .08, dh + .08, .06, x1 + .04, fy + dh / 2 + .04, .03, null, 1);
  B.box(trimM, dw + .16, .1, .06, dX, fy + dh + .05, .03, null, 1); B.box(trimM, dw + .1, .05, .26, dX, fy + .0, .1, null, 1);
  const leafM = MT(T.french(), {}), leaves = [];
  for (const s of [-1, 1]) {
    const hinge = grp(g, s < 0 ? x0 + .02 : x1 - .02, fy + .03, -.02), lw = dw / 2 - .02; hinge.userData.keep = true;
    const lf = put(tbox(lw, dh - .04, .045, { su: 1 / lw, sv: 1 / (dh - .04), seg: 3 }), leafM, -s * lw / 2 * -1 * 1, (dh - .04) / 2, 0, hinge); lf.position.x = s < 0 ? lw / 2 : -lw / 2; lf.userData.keep = true;
    const kn = put(new THREE.BoxGeometry(.03, .12, .05), SOLID('#a89050'), s < 0 ? lw - .05 : -lw + .05, 1.0, .03, hinge); kn.userData.keep = true; leaves.push(hinge);
  }
  const setDoor = k => { const a = clamp(k) * 1.75; leaves[0].rotation.y = -a; leaves[1].rotation.y = a; };
  setDoor(o.doorOpen ?? 0);
  // balcony platform, rim, supports, patio slab and lawn
  B.box(boardsM, bw, .14, bd, 0, fy - .07, bd / 2, null, .8);
  B.box(trimM, bw + .1, .24, .06, 0, fy - .12, bd + .03, null, 1);
  for (const s of [-1, 1]) B.box(trimM, .06, .24, bd, s * (bw / 2 + .03), fy - .12, bd / 2, null, 1);
  for (const jx of [-bw / 3, 0, bw / 3]) B.box(boardsM, .08, .18, bd, jx, fy - .23, bd / 2, null, .8);
  const postM = MT(T.paint(), { tint: '#cfc8b2' });
  for (const s of [-1, 1]) {
    const px_ = s * (bw / 2 - .09), pz = bd - .09;
    B.box(stone, .3, .22, .3, px_, .11, pz, null, .5); B.box(postM, .13, fy - .36, .13, px_, .22 + (fy - .36) / 2, pz, null, .6);
    B.box(postM, .17, .06, .17, px_, fy - .2, pz, null, .6);
    B.box(postM, .07, .62, .05, px_ - s * .27, fy - .54, pz, [0, 0, -s * PI / 4], .6);
    B.box(postM, .07, .62, .05, px_, fy - .54, pz - .27, [PI / 4, 0, 0], .6);
  }
  B.box(postM, bw - .2, .12, .08, 0, fy - .27, bd - .09, null, .6);
  B.bigBox(MT(T.concrete()), bw + .8, .07, bd + .15, 0, .035, (bd + .15) / 2 + .02, .8, 2);
  B.geo(MT(T.grass()), floorPlane(9, 6, 1 / 2.4, 2), 0, .012, 3.0);
  // the railing
  const railM = kind === 'iron' ? bM('rustMetal', '#3c3a38') : postM, thick = kind === 'iron' ? .045 : .1, barR = kind === 'iron' ? .011 : .017, pitch = kind === 'iron' ? .12 : .11;
  const gx = gapAt === null ? null : clamp((gapAt - .5) * bw, -bw / 2 + .6, bw / 2 - .6), gw = .85, g0 = gx === null ? 0 : gx - gw / 2, g1 = gx === null ? 0 : gx + gw / 2;
  const runs = [{ ax: 'x', c: bd - .05, a: -bw / 2 + .05, b: bw / 2 - .05, front: true }, { ax: 'z', c: -bw / 2 + .05, a: .08, b: bd - .05 }, { ax: 'z', c: bw / 2 - .05, a: .08, b: bd - .05 }];
  const railTop = [];
  const inGap = (run, t) => run.front && gx !== null && t > g0 - .02 && t < g1 + .02;
  const piece = (run, t0, t1, y, h, tk, mat) => { if (t1 - t0 < .02) return; if (run.ax === 'x') B.box(mat || railM, t1 - t0, h, tk, (t0 + t1) / 2, y, run.c, null, .6); else B.box(mat || railM, tk, h, t1 - t0, run.c, y, (t0 + t1) / 2, null, .6); };
  const posAt = (run, t) => run.ax === 'x' ? [t, run.c] : [run.c, t];
  for (const run of runs) {
    const spans = run.front && gx !== null ? [[run.a, g0], [g1, run.b]] : [[run.a, run.b]];
    for (const [t0, t1] of spans) { piece(run, t0, t1, fy + rh - .03, .06, kind === 'iron' ? .05 : .11); piece(run, t0, t1, fy + .14, .05, kind === 'iron' ? .04 : .07); for (let t = t0 + .02; t < t1 - .01; t += .35) { const [x, z] = posAt(run, t); railTop.push(V3(x, fy + rh, z)); } }
    const posts = [run.a, run.b]; for (let t = run.a + 1.1; t < run.b - .5; t += 1.1) posts.push(t);
    if (run.front && gx !== null) posts.push(g0);
    for (const t of posts) { if (inGap(run, t) && Math.abs(t - g0) > .01) continue; const [x, z] = posAt(run, t);
      B.box(railM, thick + .03, rh + .04, thick + .03, x, fy + (rh + .04) / 2, z, null, .6); if (kind === 'iron') B.geo(railM, new THREE.SphereGeometry(.035, 5, 4), x, fy + rh + .06, z); else B.box(railM, thick + .07, .04, thick + .07, x, fy + rh + .06, z, null, .6); }
    for (let t = run.a + .07; t < run.b - .03; t += pitch) { if (inGap(run, t)) continue; const [x, z] = posAt(run, t), hh = rh - .22, lean = run.front && gx !== null && (Math.abs(t - g0) < pitch * 1.1 || Math.abs(t - g1) < pitch * 1.1) ? (t < gx ? -.12 : .3) : 0;
      B.put(railM, xf(new THREE.CylinderGeometry(barR, barR, hh, 4, 1, true).translate(0, hh / 2, 0), [x, fy + .16, z], [0, PI / 4, lean])); }
  }
  let gapV = null, brokenInfo = null;
  if (gx !== null) {
    gapV = V3(gx, fy, bd - .05);
    const run = runs[0], yTop = fy + rh - .03;
    B.put(railM, xf(new THREE.BoxGeometry(thick + .03, rh + .04, thick + .03).translate(0, (rh + .04) / 2, 0), [g1, fy, run.c], [.5, 0, .12]));
    B.put(railM, xf(new THREE.BoxGeometry(.7, .06, kind === 'iron' ? .05 : .11).translate(-.35, 0, 0), [g1, yTop - .02, run.c + .12], [0, 0, .62]));
    B.put(railM, xf(new THREE.CylinderGeometry(barR, barR, .7, 4, 1, true), [gx + .1, fy + .02 + barR, bd - .45], [PI / 2, .5, 0]));
  }
  scatterLeaves(B, r, 22, -2.8, 2.8, .6, 4.6, .014); scatterLeaves(B, r, 10, -bw / 2 + .1, bw / 2 - .1, .1, bd - .1, fy + .004);
  B.flush(g); bake(g);
  const wl = { pos: V3(litWin.pos.x, fy + 1.45, 1.2), color: [1, .76, .42], range: 6 };
  g.userData = { floor: V3(0, fy, bd / 2), doorway: V3(dX, fy, .06), railTop, gap: gapV, groundBelow: V3(gx ?? 0, .012, bd + .75), setDoor, doorLeaves: leaves, windows: wins, windowLights: lit ? [wl] : [], floorY: fy, railHeight: rh, size: { w: WW, d: DEP + bd, h: wallTop }, bounds: { x0: -WW / 2, x1: WW / 2, z0: -DEP, z1: bd + 1 } };
  return g;
};
// a subdivided +z-facing siding wall W wide, from y=0 to y1, with rectangular holes
const holeWall6 = (W, y1, holes) => K.holeWall(W, 0, y1, holes, { su: 1 / .64, sv: 1 / .64, seg: 1.5 });

// =====================================================================================================================
// CLOSET
// =====================================================================================================================
P.closet = (o = {}) => {
  const W = o.width ?? 1.5, D = o.depth ?? .65, H = o.height ?? 2.3, doorKind = o.door || 'bifold', clothes = o.clothes || 'mixed', open0 = o.open ?? 0;
  const g = new THREE.Group(), B = bag(), r = PS.rng(hash('closet' + (o.seed ?? 3))), T_ = .1;
  const wallpaper = MT(T.wallpaper(), { tint: o.wallColor || '#cdbd96' }), paint = MT(T.paint(), { tint: '#d8d0b0' }), trim = MT(T.paint(), { tint: '#e6e0cc' }), floorM = MT(T.wood(), { tint: '#8a6e50' });
  const rodY = Math.min(1.75, H - .55), shelfY = rodY + .2, zr = -.05, hx = D / 2;
  // shell: wallpapered boxes (outside) + painted liners 4 mm inside, plank floor
  B.bigBox(wallpaper, W + 2 * T_, H + T_, T_, 0, (H + T_) / 2, -hx - T_ / 2, .8, 1.5);
  for (const s of [-1, 1]) B.bigBox(wallpaper, T_, H + T_, D + T_, s * (W / 2 + T_ / 2), (H + T_) / 2, -T_ / 2, .8, 1.5);
  B.bigBox(wallpaper, W + 2 * T_, T_, D + T_, 0, H + T_ / 2, -T_ / 2, .8, 1.5);
  B.geo(paint, pln(W, H, 1 / .8, 1 / .8, 1.2), 0, H / 2, -hx + .004);
  for (const s of [-1, 1]) B.geo(paint, faceX(pln(D, H, 1 / .8, 1 / .8, 1.2), -s), s * (W / 2 - .004), H / 2, 0);
  B.geo(paint, floorPlane(W, D, 1 / .8).rotateX(PI), 0, H - .004, 0);
  B.geo(floorM, floorPlane(W, D, 1 / .5, 1), 0, .004, 0);
  // front trim: casing on the wall edges, head board, baseboard, sill, door track
  for (const s of [-1, 1]) { B.box(trim, .07, H, .03, s * (W / 2 + .035), H / 2, hx + .015, null, 1); B.box(trim, .03, .1, .5, s * (W / 2 - .012), .05, 0, null, 1); }
  B.box(trim, W + .14, .1, .035, 0, H - .05, hx + .017, null, 1); B.box(trim, W, .08, .06, 0, H - .12, hx - .03, null, 1); B.box(trim, W, .04, .1, 0, .02, hx - .0, null, 1);
  // rod, brackets, shelf
  B.cyl(bM('rustMetal', '#b4b0a8'), .0125, .0125, W - .04, 6, 0, rodY, zr, [0, 0, PI / 2]);
  for (const s of [-1, 1]) B.box(trim, .04, .08, .08, s * (W / 2 - .03), rodY + .03, zr, null, 1);
  B.box(paint, W - .01, .03, D - .01, 0, shelfY, 0, null, .8);
  // hanging clothes (garments hang edge-on to the front: their width runs along z)
  const hangerM = MT(T.paint(), { tint: '#7a6a58' }), hooks = [];
  const freeW = .48, freeZone = W - .16 > freeW + .5, span = freeZone ? W - .16 - freeW : W - .16, x0 = -W / 2 + .08;
  const tints = { mixed: ['#5a4030', '#7a8aaa', '#a86a6a', '#6a6a3a', '#b09a6a', '#d0c8b0', '#3a3a44', '#8a5a40', '#5a7a6a', '#c0b090'], coats: ['#3a3a40', '#5a4a3a', '#2e3a30', '#4a3030', '#6a6a60', '#222226', '#4a4048'] };
  const kinds = { mixed: ['coat', 'shirt', 'dress', 'jacket', 'coat', 'shirt', 'robe', 'shirt', 'jacket', 'dress'], coats: ['coat'] };
  const topY = rodY - .12;
  const hanger = (cx, yaw) => {
    const mk = (geo, x, y, z, rot) => B.put(hangerM, xf(xf(geo, [x, y, z], rot || [0, 0, 0]), [cx, 0, zr], [0, yaw, 0]));
    mk(new THREE.BoxGeometry(.008, .12, .008), 0, rodY - .05, 0);
    for (const s of [-1, 1]) mk(new THREE.BoxGeometry(.012, .01, .23), 0, topY, s * .105, [s * .26, 0, 0]);
    hooks.push(V3(cx, rodY, zr));
  };
  const garment = (kind, cx, tint, yaw) => {
    const m = kind === 'dress' ? MT(T.floral(), { tint }) : MT(T.cloth(), { tint }), top = topY;
    const mk = (geo, x, y, z, rot) => B.put(m, xf(xf(geo, [x, y, z], rot || [0, 0, 0]), [cx, 0, zr], [0, yaw, 0]));
    hanger(cx, yaw);
    const dims = { coat: [.3, .35, .98, .13], jacket: [.28, .31, .66, .12], shirt: [.24, .27, .6, .08], robe: [.27, .33, 1.2, .11], dress: [.1, .27, 1.0, .08] }[kind];
    if (kind === 'dress') mk(new THREE.CylinderGeometry(dims[0], dims[1], dims[2], 6, 1).scale(.55, 1, 1), 0, top - dims[2] / 2, 0);
    else mk(new THREE.CylinderGeometry(dims[0], dims[1], dims[2], 4, 1).rotateY(PI / 4).scale(dims[3] / (dims[0] * 1.414), 1, 1), 0, top - dims[2] / 2, 0);
    mk(new THREE.BoxGeometry(dims[3] * .8, .05, .17), 0, top + .015, 0);
    const sl = kind === 'shirt' || kind === 'dress' ? .24 : (kind === 'jacket' ? .5 : .62);
    for (const s of [-1, 1]) mk(new THREE.BoxGeometry(dims[3] * .85, sl, .085), 0, top - sl / 2, s * (dims[0] * .72 + .035), [-s * .07, 0, 0]);
    if (kind === 'robe') mk(new THREE.BoxGeometry(dims[3] * 1.05, .05, dims[0] * 1.5), 0, top - .55, 0);
  };
  let inside = V3(0, rodY - .5, zr), nGar = 0;
  if (clothes !== 'empty') {
    const pitch = clothes === 'coats' ? .125 : .095, n = Math.floor(span / pitch), kl = kinds[clothes] || kinds.mixed, tl = tints[clothes] || tints.mixed;
    for (let i = 0; i < n; i++) { garment(clothes === 'coats' ? (i % 7 === 6 ? 'robe' : 'coat') : kl[i % kl.length], x0 + (i + .5) * pitch, tl[(i * 3 + 1) % tl.length], (r() - .5) * .14); nGar++; }
    inside = V3(x0 + n * pitch / 2, rodY - .55, zr);
  } else {
    for (let i = 0; i < 4; i++) hanger(x0 + .12 + i * .16, (r() - .5) * .3);
    inside = V3(x0 + .3, rodY - .5, zr);
  }
  // shoe boxes + shoes on the floor, things on the shelf
  const sbox = MT(T.shoebox(), {}), leather = SOLID('#2a1e16');
  for (let k = 0; k < 3; k++) B.box(sbox, .32, .12, .2, -W / 2 + .22, .06 + k * .12 + .004, -hx + .13, [0, k * .05 - .04, 0], .3);
  B.box(sbox, .32, .12, .2, -W / 2 + .62, .064, -hx + .14, [0, .1, 0], .3);
  B.box(MT(T.shoebox(), { tint: '#a8b8c8' }), .3, .1, .19, -W / 2 + .2, .054, -hx + .4, [0, -.2, 0], .3);
  for (const s of [-1, 1]) B.box(leather, .1, .07, .27, W / 2 - .25 + s * .07, .039, -.1 + s * .05, [0, s * .15, 0], .3);
  if (W > 1.0) {
    B.cyl(MT(T.paint(), { tint: '#8a6a7a' }), .14, .14, .16, 8, -W / 2 + .22, shelfY + .095, -.02); B.cyl(MT(T.paint(), { tint: '#7a8a6a' }), .12, .12, .13, 8, -W / 2 + .5, shelfY + .08, .0);
    const hard = MT(T.paint(), { tint: '#7a5a3a' }); B.box(hard, .62, .22, .42, W / 2 - .42, shelfY + .13, -.02, null, .5); B.box(SOLID('#3a2a1c'), .05, .24, .43, W / 2 - .56, shelfY + .13, -.02); B.box(SOLID('#3a2a1c'), .05, .24, .43, W / 2 - .28, shelfY + .13, -.02);
    for (let k = 0; k < 3; k++) B.box(MT(T.cloth(), { tint: ['#a85a4a', '#5a6a8a', '#c8b88a'][k] }), .5, .05, .38, 0, shelfY + .04 + k * .05, .02, [0, (r() - .5) * .1, 0], .4);
  }
  // doors
  const doors = [], DOOR_Y = .04, dz = hx - .03;
  let setOpen = () => { };
  if (doorKind === 'bifold') {
    const pw = (W - .04) / 4, ph = H - .18, lm = MT(T.louver(), { side: DS, tint: '#e6e0d0' }), pairs = [];
    for (const d of [1, -1]) {
      const pivot = grp(g, -d * (W / 2 - .02), DOOR_Y, dz), hinge = grp(pivot, d * pw, 0, 0);
      put(new THREE.PlaneGeometry(pw, ph, 1, 8), lm, d * pw / 2, ph / 2, 0, pivot); put(new THREE.PlaneGeometry(pw, ph, 1, 8), lm, d * pw / 2, ph / 2, 0, hinge);
      put(new THREE.BoxGeometry(.03, .06, .025), SOLID('#7a6040'), d * pw * .86, ph * .46, .018, hinge); pairs.push({ d, pivot, hinge }); doors.push(pivot);
    }
    setOpen = k => { const f = clamp(k) * 1.38; for (const p of pairs) { p.pivot.rotation.y = -p.d * f; p.hinge.rotation.y = 2 * p.d * f; } };
    B.box(SOLID('#8a8a86'), W, .03, .04, 0, H - .1, dz, null, 1);
  } else if (doorKind === 'hinged') {
    const lw = W / 2 - .012, lh = H - .16, lm = MT(T.panelDoor(), { tint: '#e0dac6' }), hs = [];
    for (const d of [1, -1]) { const hg = grp(g, -d * (W / 2 - .008), DOOR_Y, dz); put(tbox(lw, lh, .04, { su: 1 / lw, sv: 1 / lh, seg: .8 }), lm, d * lw / 2, lh / 2, 0, hg); put(new THREE.SphereGeometry(.025, 5, 4), SOLID('#b8a060'), d * (lw - .06), lh * .48, .035, hg); doors.push(hg); hs.push({ d, hg }); }
    setOpen = k => { const a = clamp(k) * 1.8; for (const h of hs) h.hg.rotation.y = -h.d * a; };
  }
  B.flush(g);
  const ud = { setOpen: k => { ud.openK = clamp(k); setOpen(k); }, inside, rodY, shelfY, hangers: hooks, standSpot: V3(freeZone && clothes !== 'empty' ? W / 2 - .08 - freeW / 2 : 0, 0, 0), frontNormal: V3(0, 0, 1), doors, size: [W + 2 * T_, H + T_, D + T_], width: W, depth: D, height: H, openK: 0, garments: nGar, bounds: { x0: -W / 2 - T_, x1: W / 2 + T_, z0: -hx - T_, z1: hx } };
  ud.setOpen(open0); g.userData = ud;
  return g;
};

// =====================================================================================================================
// WORKSHOP: pegboard, shelfUnit, coverallsOnHook
// =====================================================================================================================
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CYL = (rt, rb, h, n = 6, open = false) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open);
const ROPEC = ['#b8a070', '#e0c860', '#5a7aa0', '#6a8a5a', '#a85a4a', '#c8c0a8'];
// tool kit: each builds from a hook point (0,0) downward. add(mat, geo, x, y, z, rot). sil = outline rects [cx, cy, w, h] (+ 'c' for a circle of diameter w)
const toolMats = () => ({ steel: MT(T.steel(), { tint: '#c8ccd0' }), dark: MT(T.steel(), { tint: '#50545a' }), wood: MT(T.wood(), { tint: '#b08c64' }), woodD: MT(T.wood(), { tint: '#7a5a40' }), red: SOLID('#a02a22'), yellow: SOLID('#d0a830'), blue: SOLID('#2a4a8a'), black: SOLID('#18181a'), rope: MT(T.rope(), {}), tapeM: MT(T.tape(), {}) });
const TOOLS = {
  hammer: { sil: [[0, -.19, .045, .31], [.01, -.035, .15, .065]], build(a, m) { a(m.wood, BOX(.03, .3, .022), 0, -.19, 0); a(m.steel, BOX(.13, .045, .03), 0, -.04, 0); a(m.steel, BOX(.045, .03, .026), .085, -.05, 0, [0, 0, -.4]); } },
  saw: { sil: [[0, -.055, .06, .11], [0, -.31, .095, .4]], build(a, m) { a(m.steel, BOX(.09, .4, .004), 0, -.31, 0); a(m.dark, BOX(.01, .4, .007), .045, -.31, 0); a(m.woodD, BOX(.055, .11, .03), 0, -.055, 0); } },
  pliers: { sil: [[0, -.11, .075, .22]], build(a, m) { for (const s of [-1, 1]) a(m.red, BOX(.03, .15, .018), s * .014, -.085, 0, [0, 0, s * .1]); a(m.steel, BOX(.06, .075, .02), 0, -.2, 0); } },
  wrench: { sil: [[0, -.04, .085, .085], [0, -.17, .045, .24]], build(a, m) { a(m.steel, BOX(.075, .08, .02), 0, -.04, 0); a(m.dark, BOX(.03, .045, .022), 0, -.02, 0); a(m.steel, BOX(.034, .25, .016), 0, -.18, 0); } },
  drivers: { sil: [[-.05, -.14, .035, .2], [0, -.16, .035, .24], [.05, -.13, .035, .19]], build(a, m) { [[-.05, '#c0302a', .13], [0, '#d8a830', .15], [.05, '#2a5a9a', .12]].forEach(([x, c, L]) => { a(SOLID(c), CYL(.016, .016, .09, 6), x, -.05, 0); a(m.steel, BOX(.008, L, .008), x, -.1 - L / 2, 0); }); } },
  hatchet: { sil: [[0, -.2, .045, .3], [.03, -.06, .14, .08]], build(a, m) { a(m.wood, BOX(.03, .3, .024), 0, -.19, 0); a(m.dark, BOX(.1, .065, .03), .0, -.06, 0); a(m.steel, BOX(.03, .08, .02), .065, -.06, 0); } },
  rope: { sil: [[0, -.13, .26, .26, 'c']], build(a, m) { a(m.rope, new THREE.TorusGeometry(.105, .024, 4, 10), 0, -.13, 0); a(m.rope, new THREE.TorusGeometry(.078, .02, 4, 8), 0, -.13, .018); a(m.rope, BOX(.012, .12, .012), .02, -.27, 0, [0, 0, .2]); } },
  tape: { sil: [[0, -.075, .11, .11, 'c']], build(a, m) { a(m.tapeM, CYL(.05, .05, .04, 8), 0, -.075, 0, [PI / 2, 0, 0]); a(m.black, BOX(.03, .03, .05), .045, -.11, 0); } },
  flashlight: { sil: [[0, -.15, .07, .26]], build(a, m) { a(m.black, CYL(.022, .022, .17, 6), 0, -.1, 0); a(m.steel, CYL(.034, .034, .045, 6), 0, -.215, 0); a(m.red, BOX(.01, .03, .012), 0, -.012, 0); } },
  cutters: { sil: [[0, -.28, .08, .56]], build(a, m) { for (const s of [-1, 1]) a(m.red, BOX(.026, .46, .02), s * .016, -.25, 0, [0, 0, s * .045]); a(m.dark, BOX(.1, .075, .028), 0, -.5, 0); } }
};
// a front hemi-ellipsoid with planar UVs (a rubber mask)
const maskGeo = (w, h, d) => { const g = new THREE.SphereGeometry(1, 10, 8, 0, PI, 0, PI).scale(w / 2, h / 2, d), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / h + .5); return g; };

P.pegboard = (o = {}) => {
  const w = o.w ?? 2.4, h = o.h ?? 1.6, items = o.items || 'mixed', seed = o.seed ?? 11, r = PS.rng(hash('peg' + seed)), g = new THREE.Group(), B = bag(), mats = toolMats();
  const BZ = .034, frameM = MT(T.wood(), { tint: '#7a5a3c' }), hookM = bM('rustMetal', '#c8c8c4');
  // frame strips behind, the board, the layout
  B.box(frameM, .045, h, .026, -w / 2 + .0225, 0, .013, null, .5); B.box(frameM, .045, h, .026, w / 2 - .0225, 0, .013, null, .5);
  B.box(frameM, w, .045, .026, 0, h / 2 - .0225, .013, null, .5); B.box(frameM, w, .045, .026, 0, -h / 2 + .0225, .013, null, .5);
  for (let i = 1; i < Math.round(w / .6); i++) B.box(frameM, .04, h, .026, -w / 2 + i * w / Math.round(w / .6), 0, .013, null, .5);
  B.put(MT(T.pegboard(), {}), xf(tbox(w, h, .008, { su: 1 / .1016, sv: 1 / .1016, seg: 1.6 }), [0, 0, BZ - .004]));
  const margin = .16, plans = [], slots = [], maskSlots = [], kinds = ['blank', 'clown', 'skull', 'witch'];
  if (items !== 'tools') {
    const nm = Math.max(2, Math.min(4, Math.floor((w - .2) / .55 + 1e-6))), rowY = items === 'masks' ? .2 : h / 2 - .13;
    for (let i = 0; i < nm; i++) plans.push({ kind: 'mask', name: kinds[i], x: -w / 2 + margin + (i + .5) * (w - 2 * margin) / nm, y: rowY });
  }
  if (items !== 'masks') {
    const top0 = items === 'mixed' ? h / 2 - .13 - .4 : h / 2 - .12, pitch = .5, rows = Math.max(1, Math.floor((top0 + h / 2 - .3) / pitch) + 1), cols = Math.max(2, Math.floor((w - 2 * margin) / .36));
    const LEN = { hammer: .31, saw: .51, pliers: .22, wrench: .29, drivers: .26, hatchet: .35, rope: .27, tape: .13, flashlight: .28, cutters: .56 };
    const order = Object.keys(TOOLS).slice(), rr = PS.rng(hash('pegorder' + seed)); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let k = 0;
    for (let ro = 0; ro < rows; ro++) for (let c = 0; c < cols; c++) {
      if (rr() < .08) continue; const y = top0 - ro * pitch, avail = y + h / 2 - .04, fit = order.filter(t => LEN[t] <= avail); if (!fit.length) continue;
      const kind = k % 6 === 3 ? 'rope' : fit[k % fit.length]; k++; plans.push({ kind: 'tool', tool: kind, name: kind, x: -w / 2 + margin + (c + .5) * (w - 2 * margin) / cols + (rr() - .5) * .04, y, roll: (rr() - .5) * .06 });
    }
    const pref = plans.filter(p => p.kind === 'tool' && ['hatchet', 'hammer', 'saw', 'cutters', 'wrench'].includes(p.tool)), cand = pref.length ? pref : plans.filter(p => p.kind === 'tool' && p.tool !== 'rope');
    if (cand.length && o.missing !== 0) cand[Math.floor(rr() * cand.length)].missing = true;
  } else {
    for (let ro = 0; ro < 2; ro++) for (let c = 0; c < Math.floor((w - .3) / .3); c++) plans.push({ kind: 'hook', x: -w / 2 + .15 + (c + .5) * (w - .3) / Math.floor((w - .3) / .3), y: -.3 - ro * .26 });
  }
  const sil = [];
  for (const p of plans) {
    const hz = .085;
    B.put(hookM, xf(CYL(.004, .004, .055, 4, true), [p.x, p.y, .06], [PI / 2, 0, 0])); B.put(hookM, xf(CYL(.004, .004, .03, 4, true), [p.x, p.y + .013, hz]));
    if (p.kind === 'hook') continue;
    if (p.kind === 'tool') {
      if (p.missing) { sil.push([p.tool, p.x, p.y]); slots.push({ name: p.name, pos: V3(p.x, p.y, hz), kind: 'tool', missing: true }); continue; }
      sil.push([p.tool, p.x, p.y]); slots.push({ name: p.name, pos: V3(p.x, p.y, hz), kind: 'tool' });
      TOOLS[p.tool].build((m, geo, x, y, z, rot) => B.put(m, xf(xf(geo, [x, y, z], rot || [0, 0, 0]), [p.x, p.y, hz], [0, 0, p.roll || 0])), mats);
    } else {
      const mw = p.name === 'skull' ? .17 : .19, mh = p.name === 'witch' ? .3 : .27, cy = p.y - .035 - mh / 2, m = MT(T.maskFace(p.name), {});
      B.put(m, xf(maskGeo(mw, mh, .075), [p.x, cy, .05], [0, 0, (r() - .5) * .05]));
      for (const sx of [-1, 1]) B.seg(mats.black, V3(p.x + sx * mw * .46, cy + mh * .1, .05), V3(p.x, p.y + .005, hz), .007);
      if (p.name === 'clown') { for (const sx of [-1, 1]) B.put(SOLID('#c8501e'), xf(new THREE.IcosahedronGeometry(.052, 0), [p.x + sx * .1, cy + mh * .22, .075])); B.put(SOLID('#c8501e'), xf(new THREE.IcosahedronGeometry(.045, 0), [p.x, cy + mh * .5, .08])); }
      if (p.name === 'witch') for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) B.put(SOLID('#8a8a92'), xf(BOX(.012, .13 + k * .02, .014), [p.x + sx * (.098 + k * .008), cy - .02 - k * .025, .075], [0, 0, sx * (.05 + k * .05)]));
      const pos = V3(p.x, cy, .095); slots.push({ name: p.name, pos, kind: 'mask' }); maskSlots.push({ name: p.name, pos: pos.clone() });
    }
  }
  // painted marker outlines behind the tools (the missing tool leaves an empty outline)
  const key = 'hp:pegsil:' + [w, h, items, seed, o.missing].join('_'), TW = 256, TH = 128;
  const sTex = TX(key, TW, TH, q => {
    q.clearRect(0, 0, TW, TH); q.strokeStyle = '#1e140c'; q.lineWidth = 1.4;
    for (const [tool, x, y] of sil) for (const e of TOOLS[tool].sil) { const cxp = (x + e[0] + w / 2) / w * TW, cyp = (h / 2 - y - e[1]) / h * TH, ww = e[2] / w * TW, hh = e[3] / h * TH; if (e[4] === 'c') { q.beginPath(); q.ellipse(cxp, cyp, ww / 2, hh / 2, 0, 0, TAU); q.stroke(); } else q.strokeRect(Math.round(cxp - ww / 2) + .5, Math.round(cyp - hh / 2) + .5, Math.round(ww), Math.round(hh)); }
  });
  if (sil.length) B.put(MT(sTex, {}), xf(decal(w, h, 1.2), [0, 0, BZ + .0008]));
  B.flush(g);
  g.children.forEach(c => { c.position.y += h / 2; }); for (const sl of slots) sl.pos.y += h / 2; for (const sl of maskSlots) sl.pos.y += h / 2;
  g.userData = { slots, maskSlots, size: [w, h, .09], boardZ: BZ, width: w, height: h, missing: slots.filter(s => s.missing).map(s => s.name) };
  return g;
};

P.shelfUnit = (o = {}) => {
  const w = o.w ?? 2.4, h = o.h ?? 2, d = o.d ?? .5, stock = o.stock || 'tools', r = PS.rng(hash('shelf' + (o.seed ?? 5) + stock)), g = new THREE.Group(), B = bag(), mats = toolMats();
  const frame = MT(T.steel(), { tint: '#7a8aa0' }), board = MT(T.steel(), { tint: '#a8acb0' }), n = clamp(Math.round(h / .45), 3, 6), ys = Array.from({ length: n }, (_, i) => .16 + i * (h - .2) / (n - 1));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(frame, .045, h, .045, sx * (w / 2 - .0225), h / 2, sz * (d / 2 - .0225), null, .4);
  for (const y of ys) { B.box(board, w - .04, .025, d - .02, 0, y, 0, null, .4); B.box(frame, w - .04, .05, .016, 0, y + .012, d / 2 - .008, null, .4); }
  const ang = Math.atan2(h - .2, w - .1), L = Math.hypot(h - .2, w - .1);
  for (const s of [-1, 1]) B.box(frame, .03, L, .012, 0, h / 2, -d / 2 + .02, [0, 0, s * (PI / 2 - ang)], .4);
  const cardM = t => MT(T.cardboard(), { tint: t }), can = t => MT(T.can(), { tint: t });
  const pal = ['#9a4a3c', '#4a6a8a', '#e0d8b8', '#5a8a4a', '#d8b040', '#6a6a6a', '#e8e8e0'], slotsOut = [];
  const fillShelf = (y0, head) => {
    let x = -w / 2 + .08; const zmax = d / 2 - .07, xEnd = w / 2 - .07, put2 = (mat, geo, px_, py, pz, rot) => B.put(mat, xf(geo, [px_, py, pz], rot || [0, 0, 0]));
    const place = (iw, fn) => { if (x + iw > xEnd) { x = Infinity; return; } fn(x); x += iw; };
    while (x < xEnd - .1) {
      if (r() < (stock === 'tools' ? .05 : .12)) { x += .12 + r() * .2; continue; }
      if (stock === 'paint') {
        const kind = r();
        if (kind < .15) { const rb = .12, hb = Math.min(.28, head); place(rb * 2 + .05, x0 => put2(can(pick(r, pal)), CYL(rb, rb * .9, hb, 7), x0 + rb, y0 + hb / 2, 0)); continue; }
        const rc = kind < .35 ? .055 : .085, hc = kind < .35 ? .12 : .2, c = pick(r, pal), two = hc * 2 + .05 < head;
        place(rc * 2 + .04, x0 => { for (const z of [zmax - rc, -zmax + rc]) { if (r() < .2) continue; put2(can(c), CYL(rc, rc, hc, 7), x0 + rc, y0 + hc / 2, z * (r() < .3 ? .8 : 1)); if (two && r() < .35) put2(can(pick(r, pal)), CYL(rc, rc, hc, 7), x0 + rc, y0 + hc * 1.5, z); } });
      } else if (stock === 'boxes') {
        const bw = .22 + r() * .24, bd = Math.min(d - .08, .2 + r() * .22), bh = Math.min(head - .02, .16 + r() * .2), t = pick(r, ['#ffffff', '#e8d8c0', '#d0b890']), jz = (r() - .5) * (d - .1 - bd), jr = (r() - .5) * .12, two = head - bh > .22 && r() < .5, b2 = Math.min(head - bh - .02, .14 + r() * .12);
        place(bw + .03, x0 => { put2(cardM(t), BOX(bw, bh, bd), x0 + bw / 2, y0 + bh / 2, jz, [0, jr, 0]); if (two) put2(cardM(t), BOX(bw * .9, b2, bd * .9), x0 + bw / 2, y0 + bh + b2 / 2, 0); });
      } else if (stock === 'tools') {
        const k = r();
        if (k < .22) place(.49, x0 => { put2(SOLID('#a02a22'), BOX(.44, .2, .2), x0 + .22, y0 + .1, 0); put2(mats.dark, BOX(.2, .03, .04), x0 + .22, y0 + .215, 0); });
        else if (k < .38) place(.55, x0 => { put2(SOLID('#2a4a7a'), BOX(.5, .15, .34), x0 + .25, y0 + .075, 0); put2(mats.steel, BOX(.06, .03, .02), x0 + .25, y0 + .12, .17); });
        else if (k < .55) place(.36, x0 => { for (let j = 0; j < 3; j++) put2(MT(T.glass(), { tint: '#a8b4a8' }), CYL(.05, .05, .13, 6), x0 + .06 + j * .11, y0 + .065, (j - 1) * .08); });
        else if (k < .68) place(.17, x0 => { put2(SOLID('#b8b0a0'), CYL(.05, .055, .2, 6), x0 + .06, y0 + .1, .05); put2(mats.steel, CYL(.01, .01, .1, 4), x0 + .12, y0 + .22, .05, [0, 0, 1.2]); });
        else if (k < .8) place(.27, x0 => put2(SOLID('#c86a1a'), new THREE.TorusGeometry(.11, .028, 4, 8).rotateX(PI / 2), x0 + .12, y0 + .03, .02));
        else if (k < .9) place(.39, x0 => put2(mats.yellow, BOX(.34, .13, .22), x0 + .17, y0 + .065, 0));
        else place(.6, x0 => { put2(mats.wood, BOX(.55, .03, .035), x0 + .28, y0 + .02, .08); put2(mats.steel, BOX(.1, .045, .04), x0 + .06, y0 + .025, -.06); });
      } else {
        const rc = .15 + r() * .04, layers = head > .3 ? 1 + (r() * 2 | 0) : 1, cm = MT(T.rope(), { tint: pick(r, ROPEC) });
        if (r() < .22) place(.27, x0 => { put2(cm, CYL(.06, .06, .3, 7), x0 + .06, y0 + .15, 0); put2(mats.woodD, CYL(.12, .12, .02, 7), x0 + .06, y0 + .31, 0); put2(mats.woodD, CYL(.12, .12, .02, 7), x0 + .06, y0 + .01, 0); });
        else place(rc * 2 + .1, x0 => { for (let l = 0; l < layers; l++) put2(cm, new THREE.TorusGeometry(rc, .03, 4, 8).rotateX(PI / 2), x0 + rc + .02, y0 + .03 + l * .062, (r() - .5) * .04); });
      }
    }
  };
  ys.forEach((y, i) => { if (i < n - 1) fillShelf(y + .0125, ys[i + 1] - y - .04); slotsOut.push(y + .0125); });
  B.flush(g);
  g.userData = { shelfY: slotsOut, size: [w, h, d], stock, width: w, height: h, depth: d };
  return g;
};

P.coverallsOnHook = (o = {}) => {
  const hookY = o.hookY ?? 1.85, name = String(o.name ?? 'WALT').toUpperCase().slice(0, 7), g = new THREE.Group(), B = bag();
  const cloth = MT(T.coverall(), { tint: o.color || '#ffffff' }), front = MT(T.coverFront(name), { tint: o.color || '#ffffff' }), wood = MT(T.wood(), { tint: '#7a5a40' }), peg = bM('rustMetal', '#b0aca4');
  B.box(wood, .8, .1, .03, 0, hookY, .015, null, .5);
  for (const x of [-.27, 0, .27]) { B.put(peg, xf(CYL(.014, .014, .09, 6), [x, hookY - .005, .075], [PI / 2, 0, 0])); B.put(peg, xf(new THREE.SphereGeometry(.026, 5, 4), [x, hookY - .005, .122])); }
  const zc = .125, top = hookY - .02;
  B.box(cloth, .2, .08, .13, 0, top - .04, zc, null, .4);
  B.box(cloth, .06, .1, .03, 0, hookY + .035, .075, null, .4);
  B.box(cloth, .48, .58, .14, 0, top - .08 - .29, zc, null, .4);
  B.put(front, xf(new THREE.PlaneGeometry(.48, .58), [0, top - .08 - .29, zc + .0705]));
  B.box(cloth, .46, .14, .15, 0, top - .66 - .07, zc, null, .4);
  for (const s of [-1, 1]) {
    B.box(cloth, .11, .64, .11, s * .295, top - .4, zc - .005, [0, 0, s * .05], .4); B.box(cloth, .125, .06, .125, s * .31, top - .73, zc, [0, 0, s * .05], .4);
    B.box(cloth, .215, .76, .135, s * .113, top - .8 - .38, zc - .005, [0, 0, -s * .02], .4); B.box(cloth, .23, .07, .145, s * .125, top - 1.56, zc + .01, [0, 0, -s * .02], .4);
  }
  B.flush(g);
  g.userData = { hook: V3(0, hookY, .075), hookY, name, size: [.8, 1.7, .22], hemY: top - 1.6, bounds: { x0: -.4, x1: .4, z0: 0, z1: .25 } };
  return g;
};

// =====================================================================================================================
// SANITARIUM
// =====================================================================================================================
// a flat annulus (or disc) on the ground, stretched in z, UVs in metres/tile
const ringFlat = (ri, ro, zs, tile, segs = 28) => { const g = ri > 0 ? new THREE.RingGeometry(ri, ro, segs, 2) : new THREE.CircleGeometry(ro, segs), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tile, p.getY(i) * zs / tile); g.rotateX(-PI / 2); g.scale(1, 1, zs); return g; };
// an iron fence run along x at z (alpha bars), from xa to xb, bottom at y0
const ironRun = (B, mat, xa, xb, z, y0, hgt, ax = 'x') => { const L = Math.abs(xb - xa); const geo = PS.plane(L, hgt, L / .6, hgt / 2, 2.4); if (ax === 'x') B.geo(mat, geo, (xa + xb) / 2, y0 + hgt / 2, z); else B.geo(mat, faceX(geo, 1), z, y0 + hgt / 2, (xa + xb) / 2); };

P.sanitarium = (o = {}) => {
  const f = clamp(Math.round(o.floors ?? 3), 1, 6), wingsN = Math.max(0, Math.round(o.wings ?? 2)), nPer = Math.ceil(wingsN / 2), fenceOn = o.fence !== false, litChance = o.lit ?? .14, lawn = o.lawn !== false, signText = o.sign ?? 'STATE SANITARIUM';
  const r = PS.rng(hash('san' + (o.seed ?? 1))), g = new THREE.Group(), B = bag();
  const FH = 3.6, BASE = 1.1, Hb = BASE + f * FH, CW = 14, CD = 16, WD = 12, wingW = nPer ? 13 / nPer : 0, Hc = Hb + .9, FZ = 18, PY = .9;
  const brick = MT(T.brick(), { tint: o.color || '#ffffff' }), lime = MT(T.limestone(), {}), limeD = MT(T.limestone(), { tint: '#7e7a72' }), tar = MT(T.tar(), {}), slate = bM('shingle', '#46464a');
  const winDark = MT(T.sanWin(0), {}), winLit = [MT(T.sanWin(1), { unlit: true }), MT(T.sanWin(2), { unlit: true })], warm = SOLID('#ffd890', { unlit: true });
  const blocks = [{ x0: -CW / 2, x1: CW / 2, z0: -CD, z1: 0, H: Hc, c: true }];
  for (const s of [-1, 1]) for (let j = 0; j < nPer; j++) { const a = s * (CW / 2 + j * wingW), b = s * (CW / 2 + (j + 1) * wingW), z1 = -3 - j * 2.5; blocks.push({ x0: Math.min(a, b), x1: Math.max(a, b), z0: z1 - WD, z1, H: Hb, side: s, j }); }
  const windows = [], windowLights = [], lamps = [];
  const addWin = (face, a, bz, k, sill) => {
    const y = BASE + k * FH + 1.95, ry = { front: 0, back: PI, left: -PI / 2, right: PI / 2 }[face], n = V3(Math.sin(ry), 0, Math.cos(ry)), fb = face === 'front' || face === 'back';
    const pos = fb ? V3(a, y, bz) : V3(bz, y, a), lit = r() < litChance, mat = lit ? pick(r, winLit) : winDark;
    B.geo(mat, new THREE.PlaneGeometry(.8, 1.3), pos.x + n.x * .03, y, pos.z + n.z * .03, [0, ry, 0]);
    if (sill) B.box(lime, fb ? 1.1 : .22, .12, fb ? .22 : 1.1, pos.x + n.x * .1, y - .71, pos.z + n.z * .1, null, .6);
    const rec = { pos: pos.clone().addScaledVector(n, .05), normal: n, w: .8, h: 1.3, lit, floor: k, wall: face, index: windows.length }; windows.push(rec);
    if (lit && (face === 'front' || face === 'left' || face === 'right')) windowLights.push({ pos: pos.clone().addScaledVector(n, 1.6), color: [1, .74, .4], range: 8 });
  };
  const bays = (w, sp) => { const n = Math.max(1, Math.floor((w - 1.6) / sp) + 1); return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * sp); };
  for (const b of blocks) {
    const W = b.x1 - b.x0, D = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, H = b.H;
    B.geo(brick, pln(W, H, 1 / .6, 1 / .6, 2.4), cx, H / 2, b.z1); B.geo(brick, rotY(pln(W, H, 1 / .6, 1 / .6, 2.4), PI), cx, H / 2, b.z0);
    B.geo(brick, faceX(pln(D, H, 1 / .6, 1 / .6, 2.4), -1), b.x0, H / 2, cz); B.geo(brick, faceX(pln(D, H, 1 / .6, 1 / .6, 2.4), 1), b.x1, H / 2, cz);
    B.bigBox(limeD, W + .3, BASE, D + .3, cx, BASE / 2, cz, .8, 6);
    for (let k = 1; k < f; k++) B.bigBox(lime, W + .14, .22, D + .14, cx, BASE + k * FH, cz, .8, 8);
    B.bigBox(lime, W + .5, .4, D + .5, cx, H - .2, cz, .8, 8);
    B.bigBox(brick, W + .4, .8, .4, cx, H + .4, b.z1, .6, 8); B.bigBox(brick, W + .4, .8, .4, cx, H + .4, b.z0, .6, 8); B.bigBox(brick, .4, .8, D, b.x0, H + .4, cz, .6, 8); B.bigBox(brick, .4, .8, D, b.x1, H + .4, cz, .6, 8);
    B.bigBox(lime, W + .7, .12, .55, cx, H + .86, b.z1, .6, 8); B.bigBox(lime, W + .7, .12, .55, cx, H + .86, b.z0, .6, 8); B.bigBox(lime, .55, .12, D, b.x0, H + .86, cz, .6, 8); B.bigBox(lime, .55, .12, D, b.x1, H + .86, cz, .6, 8);
    B.geo(tar, floorPlane(W, D, 1 / .8, 3), cx, H + .003, cz);
    // windows
    const fr = b.c ? [] : bays(W, 3.3).map(u => cx + u);
    for (let k = 0; k < f; k++) {
      if (b.c) { for (const u of [-6.2, 6.2]) addWin('front', u, b.z1, k, true); if (k === 1) for (const u of [-2.8, 0, 2.8]) addWin('front', u, b.z1, k, true); for (const z of [-1.5]) { addWin('left', z, b.x0, k, true); addWin('right', z, b.x1, k, true); } }
      else { for (const u of fr) addWin('front', u, b.z1, k, true); }
      for (const u of (b.c ? bays(W, 3.3) : bays(W, 3.3)).map(u => cx + u)) addWin('back', u, b.z0, k, false);
      if (!b.c && (b.j === nPer - 1)) for (const u of bays(D, 3.4)) addWin(b.side < 0 ? 'left' : 'right', cz + u, b.side < 0 ? b.x0 : b.x1, k, true);
    }
  }
  // portico: platform, steps, cheeks, columns, entablature, pediment
  const colX = [-4.2, -1.4, 1.4, 4.2], colH = 7.0, pz = 3.0;
  B.bigBox(lime, 10.6, PY, 3.8, 0, PY / 2, 1.9, .8, 3);
  for (let j = 1; j <= 4; j++) { const top = PY - j * .18; B.bigBox(lime, 9.6, top, .45, 0, top / 2, 3.8 + (j - .5) * .45, .8, 4); }
  for (const s of [-1, 1]) { B.box(limeD, .6, PY + .35, 3.8, s * 5.0, (PY + .35) / 2, 1.9, null, .8); for (let j = 1; j <= 4; j++) { const hh = PY - j * .18 + .35; B.box(limeD, .6, hh, .45, s * 5.0, hh / 2, 3.8 + (j - .5) * .45, null, .8); } }
  const colM = MT(T.column(), {});
  for (const x of colX) { B.box(limeD, 1.3, .25, 1.3, x, PY + .125, pz, null, .8); B.geo(colM, PS.rep(new THREE.CylinderGeometry(.46, .52, colH - .55, 10, 1, true), 5, 3), x, PY + .25 + (colH - .55) / 2, pz); B.box(limeD, 1.3, .3, 1.3, x, PY + colH - .15, pz, null, .8); }
  B.box(lime, 11.2, 1.1, 3.7, 0, PY + colH + .55, 1.85, null, .8);
  B.geo(MT(T.sign(signText), {}), new THREE.PlaneGeometry(9.6, .62), 0, PY + colH + .55, 3.713);
  K.gableRoof(g, { L: 3.7, B: 11.4, rise: 1.8, over: 0, overG: 0, thick: .14, y: PY + colH + 1.1, z: 1.85, ry: PI / 2, mat: slate, gmat: limeD, gtile: .9, fascia: lime });
  // the doors, transom, surround and lanterns
  B.box(MT(T.panel(), { tint: '#6a4a38' }), 3.0, 3.4, .12, 0, PY + 1.7, .06, null, .8); B.box(SOLID('#161412'), .04, 3.4, .13, 0, PY + 1.7, .07, null, 1);
  for (const s of [-1, 1]) B.box(SOLID('#b8a060'), .05, .35, .05, s * .25, PY + 1.6, .15);
  B.geo(MT(T.transom(), {}), new THREE.PlaneGeometry(3.0, .75), 0, PY + 3.85, .08);
  for (const s of [-1, 1]) B.box(lime, .35, 4.35, .3, s * 1.77, PY + 2.17, .1, null, .8); B.box(lime, 3.9, .45, .34, 0, PY + 4.45, .12, null, .8);
  for (const s of [-1, 1]) { B.box(SOLID('#1c1c1e'), .24, .4, .24, s * 2.5, PY + 2.7, .2); B.geo(warm, new THREE.BoxGeometry(.18, .3, .18), s * 2.5, PY + 2.7, .2); B.box(SOLID('#1c1c1e'), .3, .06, .3, s * 2.5, PY + 2.93, .2); lamps.push({ pos: V3(s * 2.5, PY + 2.7, 1.1), color: [1, .78, .45], range: 8 }); }
  // roof clutter: chimney stack and vents
  B.bigBox(brick, 2.4, 7, 2.4, -(CW / 2 + 5), Hb + 3.5, -10, .6, 4); B.box(lime, 2.8, .3, 2.8, -(CW / 2 + 5), Hb + 7.15, -10, null, .8);
  for (const [x, z] of [[CW / 2 + 4, -8], [CW / 2 + 8, -6], [3, -12]]) { const base = x === 3 ? Hc : Hb; B.box(limeD, 1, .9, 1, x, base + .45, z, null, .6); B.box(SOLID('#1c1c1e'), 1.2, .15, 1.2, x, base + .98, z); }
  // lawn, driveway loop, island
  const asph = MT(T.asphalt(), {}), cx0 = 0, cz0 = 12;
  if (lawn) B.geo(MT(T.grass(), { tint: '#9a9a80' }), floorPlane(60, 46, 1 / 2.4, 4), 0, .012, 2);
  B.geo(asph, ringFlat(3.0, 6.0, .75, 3), cx0, .03, cz0); B.geo(MT(T.grass(), { tint: '#8a8a70' }), ringFlat(0, 2.9, .75, 2.4), cx0, .02, cz0);
  B.geo(asph, PS.plane(3.4, FZ + 10 - (cz0 + 4.4), 3.4 / 3, (FZ + 10 - (cz0 + 4.4)) / 3, 3).rotateX(-PI / 2), 0, .03, (FZ + 10 + cz0 + 4.4) / 2);
  B.geo(asph, PS.plane(6.0, 3.0, 2, 1, 3).rotateX(-PI / 2), 0, .03, 4.6);
  const ud = { windows, windowLights, lamps, litCount: windows.filter(w => w.lit).length };
  // the iron fence, piers and lamps
  const fx = 24, gate = { pos: V3(0, 0, FZ), leaves: [], width: 4.4, setOpen() { } };
  if (fenceOn) {
    const ironM = MT(T.iron(), { side: DS }), pier = (x, z) => { B.box(brick, 1.0, 3.2, 1.0, x, 1.6, z, null, .6); B.box(lime, 1.3, .25, 1.3, x, 3.3, z, null, .8); B.box(limeD, 1.1, .3, 1.1, x, .15, z, null, .8); B.geo(lime, new THREE.ConeGeometry(.5, .45, 4).rotateY(PI / 4), x, 3.62, z); };
    ironRun(B, ironM, -fx, -2.8, FZ, .5, 2.0); ironRun(B, ironM, 2.8, fx, FZ, .5, 2.0); ironRun(B, ironM, FZ, 2, -fx, .5, 2.0, 'z'); ironRun(B, ironM, FZ, 2, fx, .5, 2.0, 'z');
    for (const [xa, xb] of [[-fx, -2.8], [2.8, fx]]) B.bigBox(limeD, xb - xa, .5, .3, (xa + xb) / 2, .25, FZ, .8, 6);
    for (const sx of [-1, 1]) B.bigBox(limeD, .3, .5, FZ - 2, sx * fx, .25, (FZ + 2) / 2, .8, 6);
    for (const sx of [-1, 1]) for (const z of [FZ, 2]) { const x = sx * fx; B.box(brick, .5, 2.7, .5, x, 1.35, z, null, .6); B.box(lime, .65, .15, .65, x, 2.78, z, null, .8); }
    for (let x = -fx + 6; x < -3; x += 6) for (const sx of [-1, 1]) B.box(SOLID('#26282c'), .12, 2.5, .12, sx * -x, 1.25, FZ);
    for (const sx of [-1, 1]) { pier(sx * 2.8, FZ); const lx = sx * 2.8, ly = 4.0; B.box(SOLID('#1c1c1e'), .46, .1, .46, lx, 3.82, FZ); B.geo(warm, new THREE.BoxGeometry(.36, .45, .36), lx, ly - .02, FZ); B.box(SOLID('#1c1c1e'), .5, .08, .5, lx, ly + .24, FZ); B.geo(SOLID('#1c1c1e'), new THREE.ConeGeometry(.3, .3, 4).rotateY(PI / 4), lx, ly + .42, FZ); lamps.push({ pos: V3(lx, ly - .3, FZ + .6), color: [1, .8, .48], range: 10 }); }
  }
  B.flush(g); K.bake(g);
  if (fenceOn) {
    const gm = MT(T.gate(14), { side: DS }), lw = 2.1, hinges = [];
    for (const s of [-1, 1]) { const hg = grp(g, s * 2.25, .12, FZ); hg.userData.keep = true; const m = put(new THREE.PlaneGeometry(lw, 2.5), gm, -s * lw / 2, 1.25 + .0, 0, hg); m.userData.keep = true; for (const [bw, bh, bx, by] of [[.08, 2.5, 0, 1.25], [.08, 2.5, -s * lw, 1.25], [lw, .08, -s * lw / 2, .04], [lw, .06, -s * lw / 2, 2.0]]) { const b2 = put(new THREE.BoxGeometry(bw, bh, .06), SOLID('#1c1e22'), bx, by, 0, hg); b2.userData.keep = true; } hinges.push(hg); }
    gate.leaves = hinges; gate.setOpen = k => { const a = clamp(k) * 1.5; hinges[0].rotation.y = a; hinges[1].rotation.y = -a; gate.openK = clamp(k); }; gate.setOpen(o.gateOpen ?? 0);
  }
  const wMax = Math.max(...blocks.map(b => b.x1)), door = { pos: V3(0, PY, .12), normal: V3(0, 0, 1), w: 3.0, h: 3.4 };
  Object.assign(ud, { gate, door, fenceZ: FZ, driveStart: V3(0, 0, FZ + 10), size: { w: wMax * 2, d: CD, h: Hc }, floors: f, steps: V3(0, 0, 5.6), bounds: { x0: -(fenceOn ? fx : wMax), x1: fenceOn ? fx : wMax, z0: -CD, z1: FZ + 10 } });
  g.userData = ud;
  return g;
};

// =====================================================================================================================
// CEMETERY
// =====================================================================================================================
const SURN = ['WALKER', 'HOLLIS', 'BRENNER', 'COLE', 'MARSH', 'TILLMAN', 'OAKES', 'PRESCOTT', 'WEBB', 'HAYES', 'LINDQUIST', 'AMES', 'DOUGLAS', 'PIKE'];
const FIRST = ['ELIZA M.', 'HENRY J.', 'RUTH A.', 'CHARLES', 'MARY E.', 'ARTHUR', 'GRACE', 'JOHN T.', 'ANNA B.', 'FRANK', 'LOUISE', 'ELMER', 'DORA', 'SAMUEL'];
P.cemetery = (o = {}) => {
  const rows = Math.max(1, Math.round(o.rows ?? 3)), cols = Math.max(1, Math.round(o.cols ?? 6)), sp = o.spacing ?? 2.2, gaps = o.gaps || [], fenceOn = o.fence !== false;
  const r = PS.rng(hash('cem' + (o.seed ?? 7))), g = new THREE.Group(), B = bag();
  const hx = (cols - 1) / 2 * sp + 2.4, zF = 4.4, zB = -(rows - 1) * sp - 2.6, plotX = c => (c - (cols - 1) / 2) * sp, plotZ = rr => -rr * sp, isGap = (rr, cc) => gaps.some(a => a[0] === rr && a[1] === cc);
  const moundM = MT(T.grass(), { tint: '#8a7a5c' }), soil = MT(T.soil(), {}), granite = bM('granite', '#a8a8a0'), graniteD = bM('granite', '#6a6a66');
  B.geo(MT(T.cemGround(), {}), floorPlane(2 * hx + 14, zF - zB + 14, 1 / 2.4, 3), 0, .012, (zF + zB) / 2);
  B.geo(MT(T.gravel(), { tint: '#8c887c' }), floorPlane(1.8, zF + 3 - 1.2, 1 / 1.2, 2), 0, .02, (zF + 3 + 1.2) / 2);
  const stones = [], gapPlots = [], plots = {}, shapes = ['round', 'round', 'slab', 'slab', 'cross', 'obelisk'], tints = ['#c4c4bc', '#b0b0a8', '#d4ccbc', '#9ca49c', '#bcb8b0'];
  const Lm = Math.min(1.7, sp * .74);
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = plotX(col) + (r() - .5) * .12, z = plotZ(row) + (r() - .5) * .12, gap = isGap(row, col);
    plots[row + ',' + col] = V3(plotX(col), 0, plotZ(row));
    B.geo(moundM, new THREE.SphereGeometry(1, 7, 4).scale(.42, .13, Lm / 2), x, 0, z + .28 + Lm / 2);
    if (gap) {
      gapPlots.push(V3(plotX(col), 0, plotZ(row)));
      B.put(granite, xf(tbox(.85, .1, .42, { su: 1 / .6, sv: 1 / .6, seg: 3 }), [x, .05, z], [0, (r() - .5) * .12, 0]));
      for (const sx of [-1, 1]) B.put(graniteD, xf(new THREE.BoxGeometry(.05, .08, .05), [x + sx * .16, .13, z - .02], [(r() - .5) * .4, 0, (r() - .5) * .4]));
      B.geo(soil, ringFlat(0, .62, 1.15, .5, 9), x, .036, z + .05);
      for (let k = 0; k < 8; k++) { const s2 = .06 + r() * .09, a = r() * TAU, rad = .25 + r() * .45; B.put(soil, xf(new THREE.IcosahedronGeometry(s2, 0).scale(1.3, .55, 1), [x + Math.cos(a) * rad, .04 + s2 * .2, z + .05 + Math.sin(a) * rad * 1.1], [0, r() * TAU, 0])); }
      for (const sx of [-1, 1]) B.geo(soil, new THREE.PlaneGeometry(.14, 1.7).rotateX(-PI / 2), x + sx * .22 + .08, .037, z + 1.2, [0, sx * .06, 0]);
      for (let k = 0; k < 5; k++) { const s2 = .04 + r() * .05; B.put(soil, xf(new THREE.IcosahedronGeometry(s2, 0).scale(1.2, .5, 1), [x + (r() - .5) * .5, .04, z + .7 + r() * 1.1], [0, r() * TAU, 0])); }
    } else {
      const shape = pick(r, shapes), b0 = 1862 + (r() * 70 | 0), d0 = Math.min(1976, b0 + 18 + (r() * 62 | 0));
      const text = shape === 'cross' ? 'R.I.P.\n' + pick(r, SURN) : pick(r, FIRST) + '\n' + pick(r, SURN) + '\n' + b0 + '-' + d0;
      const st = P.gravestone({ shape, text, lean: r() < .35 ? (r() - .5) * .14 : 0, tilt: r() < .3 ? (r() - .5) * .08 : 0, tint: pick(r, tints) });
      st.position.set(x, r() < .2 ? -.04 : 0, z); st.rotation.y = (r() - .5) * .18; g.add(st); stones.push({ row, col, group: st, shape, text });
    }
  }
  // leaf litter
  scatterLeaves(B, r, 150, -hx + .3, hx - .3, zB + .3, zF - .3, .016); scatterLeaves(B, r, 36, -hx + .3, hx - .3, zF - 1.4, zF - .2, .016);
  // fence, piers, arched gate
  const gate = { pos: V3(0, 0, zF), leaves: [], setOpen() { } };
  if (fenceOn) {
    const ironM = MT(T.iron(), { side: DS }), pierM = bM('stone', '#8a867c'), capM = bM('stone', '#a8a49a');
    ironRun(B, ironM, -hx, -1.45, zF, 0, 1.9); ironRun(B, ironM, 1.45, hx, zF, 0, 1.9); ironRun(B, ironM, -hx, hx, zB, 0, 1.9); ironRun(B, ironM, zB, zF, -hx, 0, 1.9, 'z'); ironRun(B, ironM, zB, zF, hx, 0, 1.9, 'z');
    const pier = (x, z, h) => { B.box(pierM, .34, h, .34, x, h / 2, z, null, .8); B.box(capM, .46, .1, .46, x, h + .05, z, null, .8); B.geo(capM, new THREE.SphereGeometry(.14, 6, 4), x, h + .22, z); };
    for (const x of [-hx, hx]) for (const z of [zB, zF]) pier(x, z, 2.1);
    for (let x = -hx + 5; x < hx - 2; x += 5) if (Math.abs(x) > 2.4) pier(x, zB, 2.0);
    for (let z = zB + 5; z < zF - 2; z += 5) { pier(-hx, z, 2.0); pier(hx, z, 2.0); }
    for (const s of [-1, 1]) pier(s * 1.62, zF, 2.5);
    B.geo(SOLID('#1c1e22'), new THREE.TorusGeometry(1.45, .04, 4, 16, PI), 0, 2.5, zF);
    B.geo(SOLID('#1c1e22'), new THREE.TorusGeometry(1.2, .025, 4, 14, PI), 0, 2.5, zF);
    const sh = new THREE.Shape(); sh.moveTo(-1.42, 0); sh.absarc(0, 0, 1.42, PI, 0, true); sh.lineTo(-1.42, 0); const tym = new THREE.ShapeGeometry(sh, 10), tp = tym.attributes.position, tu = tym.attributes.uv; for (let i = 0; i < tp.count; i++) tu.setXY(i, tp.getX(i) / .6, 1 - tp.getY(i) / 1.5);
    B.geo(ironM, tym, 0, 2.5, zF);
    B.box(SOLID('#1c1e22'), .06, .5, .06, 0, 4.15, zF); B.box(SOLID('#1c1e22'), .3, .06, .06, 0, 4.22, zF);
    const gm = MT(T.gate(8), { side: DS }), lw = 1.4, hinges = [];
    for (const s of [-1, 1]) { const hg = grp(g, s * 1.45, .04, zF); hg.userData.keep = true; const m = put(new THREE.PlaneGeometry(lw, 2.3), gm, -s * lw / 2, 1.15, 0, hg); m.userData.keep = true; for (const [bw, bh, bx, by] of [[.06, 2.3, 0, 1.15], [.06, 2.3, -s * lw, 1.15], [lw, .06, -s * lw / 2, .03], [lw, .05, -s * lw / 2, 1.78]]) { const b2 = put(new THREE.BoxGeometry(bw, bh, .05), SOLID('#1c1e22'), bx, by, 0, hg); b2.userData.keep = true; } hinges.push(hg); }
    gate.leaves = hinges; gate.setOpen = k => { const a = clamp(k) * 1.5; hinges[0].rotation.y = a; hinges[1].rotation.y = -a; gate.openK = clamp(k); }; gate.setOpen(o.gateOpen ?? 0);
  }
  B.flush(g);
  g.userData = { plot: (row, col) => (plots[row + ',' + col] || V3(plotX(col), 0, plotZ(row))).clone(), gapPlots, gate: gate.pos, setGate: gate.setOpen, gateLeaves: gate.leaves, stones, rows, cols, spacing: sp, bounds: { x0: -hx, x1: hx, z0: zB, z1: zF }, size: { w: 2 * hx, d: zF - zB } };
  return g;
};

// __END__
})();
