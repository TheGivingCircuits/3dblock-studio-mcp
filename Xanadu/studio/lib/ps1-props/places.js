// PS1 PLACES  --  rooms, terrain, skies, buildings, trees and outdoor props for the PS1 low-poly engine (lib/ps1.js).
// Load after ps1.js:  <script src="lib/ps1-props/places.js">.  Every builder is  PS1.props.<name>(opts) -> THREE.Group  at the origin (not added to a scene),
// metres, y up, things sit on y=0, building fronts / doors face +z.  Materials come from PS1.mat; textures are tiny canvases shared through module caches.
// Almost everything is merged into a few meshes per material (a house is ~30 draw calls, a 300-tree forest 23). Parts that move are left separate (userData.keep).
// Big surfaces are subdivided and mip-mapped (PS1 affine texturing swims on big quads). Handles live in group.userData.
//
// ---------------------------------------------------------------------------------------------------------------------------------------------------
// INTERIORS
//  room({ w=5, d=4.5, h=2.6, wall:'wallpaper'|'wood'|'tile'|'brick'|'plaster'|'concrete', wallColor:'#hex', floor:'wood'|'carpet'|'tile'|'checker'|'concrete', floorColor,
//         ceiling=true, ceilingColor, trim=true, trimColor, crown=true, wainscot:true|'#hex' (wood band under the wall finish), roof=true (flat slab on top),
//         cutaway:'front'|'back'|'left'|'right'|'top'|null  (that wall/ceiling is left out so a camera can look in; the other walls keep an outer skin),
//         outer:'siding'|'brick'|'concrete' (outside finish),
//         windows:[{ wall:'back'|'left'|'right'|'front', x (along the wall seen from INSIDE, 0 = middle, + = right), y (CENTRE height, default 1.5), w=1.1, h=1.3,
//                    view:'night'|'day'|'dusk' (picture behind the glass), curtains:'#hex' }],
//         doors:[{ wall, x, w=.95, h=2.1, void:'dark'|'light'|'none' (what's behind the opening), leaf:false|true|'ajar'|'open' (hinged door leaf), leafColor }] })
//   The room is centred on the origin, walls at x=+-w/2 and z=+-d/2, floor y=0. Front wall = +z. Walls are real, 16 cm thick shells with proper openings.
//   userData: size{w,d,h}, bounds{x0,x1,z0,z1}, ceilingY, ceilingLight (V3 just under the ceiling), center, inside(x,z), wallColor,
//             windows[{ wall, pos (V3 centre on the inner face, room coords), normal (V3 into the room), w, h, view, index }]   <- put PS1.light()s at pos + normal*0.8
//             doors[{ wall, pos (V3 floor-centre of the opening), normal, w, h, leaf (hinge Group|null), setOpen(k) (k 0..1, only if leaf) }]
//
// TERRAIN, ROADS, SKY
//  ground({ type:'grass'|'dead grass'|'dirt'|'asphalt'|'gravel'|'snow'|'sand', size=120, seg, hills=0 (amplitude in m), flat=14 (flat radius around origin), tint, y })
//   userData: mesh, heightAt(x,z) (use it to stand things on the hills), type, size.
//  road({ length=60, width=6.5, lines=true, center:'double'|'dashed'|'none', edge=true, shoulder=true })  along z, centred, surface y=0.02. userData: length,width,surfaceY.
//  sidewalk({ length=20, width=1.8, height=.14, curb=true })  along z, centred; the kerb face is on the -x edge. userData: length,width,topY.
//  skyDome({ preset:'noon'|'golden'|'dusk'|'night'|'overcast'|'storm', radius=95 (max 100), stars:false|true|count, moon:true|false|{az,el,size,phase}, sun:false|{az,el,size},
//            treeline=true (jagged pine silhouette on the horizon), follow=true, lightning=true (storm), ground:'#hex' (colour under the horizon) })
//   Unlit, unfogged, BackSide sphere; textures are painted per pixel (gradient + clouds + sun/moon + stars), 512x256 (1024x512 with stars/moon).
//   az 0 = straight ahead (-z), 90 = +x; el = degrees above the horizon.
//   userData: update(t,S) (call it each frame: re-centres the dome on S.camera and drives storm lightning), flash(t) (0..1 lightning intensity, deterministic in t),
//             horizonColor / zenithColor / groundColor ('#hex': good fog + clear colours), sunDir (V3|null), mesh, material.
//
// BUILDINGS (exteriors; windows are glass planes: dark by default, lit = unlit warm glow with curtains/lamp silhouettes)
//  house({ style:'suburban'|'farmhouse'|'victorian', color (siding), trimColor, roofColor, doorColor, porch=true, garage=true (suburban), lit:[window indices]|true,
//          porchLight, flicker })    suburban 9x7 m two storeys + garage + driveway; farmhouse 8x6 with wrap porch, tin roof, lean-to wing; victorian with tower, bay, fish-scale gable.
//   userData: windows[{ pos (V3 outside face), normal, w, h, lit, wall, floor, index }] (index order = build order), door{ pos, normal, w, h }, windowLights[{ pos, color:[r,g,b], range }]
//             (ready-made PS1.light() feeds for the lit windows), porchLight (V3|undefined), chimneyTop (V3), roofY, size{w,d,h}, bounds, style, litMats[] (3 shared glow materials of
//             THIS house), update(t) (only does something with flicker:true).
//  cabin({ number=12, lit, color (log tint), roofColor, porch=true, shutters, flicker })  real notched-corner log cabin 4.6x5.6 m, stone chimney, number plate over the door.
//   userData: door{pos,normal,w,h}, plate (V3), number, windows[...], windowLights, porchLight, chimneyTop, size, bounds, update(t).
//  church({ boarded=true, lit:[window indices], color, roofColor })  small wooden church 5.4x8.6 nave, tower+belfry+spire at the front (+z), 6 lancet side windows, round window, rear apse.
//   userData: door{pos,normal,w,h}, windows[...] (0 = round window above the door, then the lancets), bell (V3), steepleTop (V3), windowLights, size, bounds.
//  shack({ lit, door:'closed'|'ajar'|'open', color, roofColor, boarded })  3.4x2.8 m plank shed, tin roof, stovepipe, firewood.
//   userData: door{pos,normal,w,h,leaf (hinge Group),setOpen(k)}, windows[...], windowLights, chimneyTop, size.
//
// TREES
//  pine({ h=9, seed, snow, tint })   deadTree({ h=7, seed })     single trees, trunk base at y=0.
//  forest({ radius=40, count=140, seed=1, kind:'pine'|'dead'|'mixed'|'leafy', inner=0 (hole in the middle), clearing: radius | [{x,z,r}], minH, maxH, spacing=2.6, snow,
//           undergrowth=true (bushes, rocks, fallen logs), heightAt(x,z) (terrain height fn, e.g. ground.userData.heightAt), tint })
//   userData: trees[{x,z,h,kind}], radius, count.
//
// OUTDOOR PROPS
//  fence({ length=8, style:'picket'|'wire'|'wood', height, broken=0..1 (missing/leaning pickets, sagging rails), color, seed })  centred on x, runs along x, pickets face +z.
//  streetLamp({ lit=true, height=5.2, color })   arm + lamp head reach toward +x.  userData: lightPos (V3 under the lamp), lightColor [r,g,b], lightRange, lit, height.
//  mailbox({ flag, number, color })   userData: flag (Group, rotate .z), setFlag(k 0..1).
//  gravestone({ text:'LINE1\nLINE2', shape:'round'|'slab'|'cross'|'obelisk', lean (rad about z), tilt (rad about x), tint })   engraved text; face toward +z; origin at the base centre.
//  well({ open:false })   stone well with a timber frame, roof, rope + bucket. open:true = lid slid off, dark shaft (inward normals) visible. userData: setLid(k 0 closed..1 off),
//         lid (Group), shaftTop (V3 rim centre), shaftBottom (V3), radius, depth, height.
//  pipe({ diameter=1.3, tilt=35 (deg from vertical, leans toward +x), kind:'concrete'|'steel', visible=2.5 (m above ground) })   big culvert pipe sticking out of a dirt mound, inside fades to
//         black.  userData: mouth (V3 centre of the opening), axis (V3 pointing out of it), radius, tilt.
//
// KIT (for other prop files):  PS1.placesKit = { tbox, pln, decal, tri, holeWall, merge, bake, gableRoof, shedRoof, winUnit, doorUnit, chimney, xf, TX, MT, SOLID }.
// GOTCHAS: building windows glow (unlit) but do not light anything -- use userData.windowLights / porchLight / streetLamp.lightPos with PS1.light(). Sky domes need
// userData.update(t,S) called each frame to follow the camera (or place the dome yourself and pass follow:false).
(function () {
const PS = window.PS1, M = PS.mat, rng = PS.rng, add = PS.add;
const TAU = Math.PI * 2, PI = Math.PI;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// ---------- caches: textures and materials are shared across every builder ----------
const CACHE = {};
const memo = (k, f) => CACHE[k] || (CACHE[k] = f());
// TX(name, w, h, draw, {mip, seed}) : a cached nearest-filtered canvas texture. Sizes are powers of two.
const TX = (k, w, h, draw, o = {}) => memo('t:' + k, () => { const t = PS.tex(w, h, draw, o.seed ?? hash(k)); return o.mip ? PS.mip(t) : t; });
// MT(tex, opts) : a cached PS1 material per texture + options
const MT = (t, o = {}) => memo('m:' + t.uuid + ':' + JSON.stringify(o), () => M(t, o));
const SOLID = (c, o) => MT(TX('solid' + c, 4, 4, q => { q.fillStyle = c; q.fillRect(0, 0, 4, 4); }), o);
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
const fillAll = (q, c, w, h) => px(q, c, 0, 0, w, h);
const spk = PS.noise;
// a wobbly line of 1px steps (cracks, stains)
const crack = (q, c, x, y, len, r, dx = 0, dy = 1) => { q.fillStyle = c; for (let i = 0; i < len; i++) { q.fillRect(x | 0, y | 0, 1, 1); x += dx + (r() - .5) * 1.4; y += dy + (r() - .5) * 1.4; } };

// ---------- geometry helpers ----------
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
// xf(geo, [x,y,z], [rx,ry,rz], [sx,sy,sz]) : bake a transform into a geometry (returns it)
const xf = (g, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => g.applyMatrix4(_m4.compose(_p.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), _s.set(s[0], s[1], s[2])));
const inward = g => { const n = g.attributes.normal; for (let i = 0; i < n.array.length; i++) n.array[i] *= -1; return g; };
// merge geometries into one non-indexed geometry (position, normal, uv)
const merge = geos => { const gs = geos.map(g => g.index ? g.toNonIndexed() : g); let n = 0; for (const g of gs) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of gs) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return m; };
// bake(group): merge every mesh in the group into one mesh per material (draw calls!). Meshes/groups with userData.keep are left alone.
const bake = root => { root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), by = new Map(), kill = [];
  root.traverse(o => { if (!o.isMesh || o === root) return; for (let p = o; p && p !== root; p = p.parent) if (p.userData.keep) return;
    const g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(g); kill.push(o); });
  for (const o of kill) o.parent.remove(o);
  for (const [mat, gs] of by) { const m = new THREE.Mesh(merge(gs), mat); m.frustumCulled = false; root.add(m); } return root; };
// tbox(w,h,d,{seg,su,sv}) : a box whose UVs are in metres * (su,sv) per face and which is subdivided every `seg` metres (PS1 affine texturing warps big quads)
const tbox = (w, h, d, o = {}) => { const sg = o.seg ?? 1.5, su = o.su ?? 1, sv = o.sv ?? su, nx = Math.max(1, Math.round(w / sg)), ny = Math.max(1, Math.round(h / sg)), nz = Math.max(1, Math.round(d / sg));
  const g = new THREE.BoxGeometry(w, h, d, nx, ny, nz), uv = g.attributes.uv; let i = 0;
  const face = (cnt, du, dv) => { for (let k = 0; k < cnt; k++, i++) uv.setXY(i, uv.getX(i) * du * su, uv.getY(i) * dv * sv); };
  face((nz + 1) * (ny + 1), d, h); face((nz + 1) * (ny + 1), d, h); face((nx + 1) * (nz + 1), w, d); face((nx + 1) * (nz + 1), w, d); face((nx + 1) * (ny + 1), w, h); face((nx + 1) * (ny + 1), w, h); return g; };
// pln(w,h,su,sv,seg) : subdivided plane, UVs in metres * (su,sv)
const pln = (w, h, su = 1, sv = su, seg = 1.5) => PS.plane(w, h, w * su, h * sv, seg);
// decal(w,h,seg) : a plane whose UVs run 0..1 exactly once (for text plates, windows with a picture, view planes)
const decal = (w, h, seg = 1.5) => PS.plane(w, h, 1, 1, seg);
// tri(w,h,su,sv,seg) : a subdivided isosceles triangle (base w at y=0, apex at y=h, centred on x=0, facing +z), UVs in metres*scale
const tri = (w, h, su = 1, sv = su, seg = 1) => { const ny = Math.max(1, Math.round(h / seg)), nx = Math.max(1, Math.round(w / seg)), P = [], U = [];
  const vert = (i, j) => { const y = j / ny * h, ww = w * (1 - j / ny), x = (i / nx - .5) * ww; return [x, y]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1); for (const t of [[a, b, c], [a, c, d]]) for (const v of t) { P.push(v[0], v[1], 0); U.push(v[0] * su, v[1] * sv); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
  const n = new Float32Array(P.length / 3 * 3); for (let i = 0; i < n.length; i += 3) n[i + 2] = 1; g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); return g; };
// holeWall(W, y0, y1, holes, {su,sv,seg}) : a subdivided wall quad facing +z spanning x -W/2..W/2, y y0..y1, with rectangular openings [{x0,x1,y0,y1}] cut out
const holeWall = (W, y0, y1, holes, o = {}) => { const sg = o.seg ?? 1.2, su = o.su ?? 1, sv = o.sv ?? su, xs = new Set([-W / 2, W / 2]), ys = new Set([y0, y1]);
  for (const h of holes) { xs.add(h.x0); xs.add(h.x1); if (h.y0 > y0 && h.y0 < y1) ys.add(h.y0); if (h.y1 > y0 && h.y1 < y1) ys.add(h.y1); }
  const fillGrid = (set, a, b) => { const arr = [...set].filter(v => v >= a - 1e-6 && v <= b + 1e-6).sort((p, q) => p - q), out = [arr[0]]; for (let i = 1; i < arr.length; i++) { const n = Math.max(1, Math.round((arr[i] - arr[i - 1]) / sg)); for (let k = 1; k <= n; k++) out.push(arr[i - 1] + (arr[i] - arr[i - 1]) * k / n); } return out; };
  const gx = fillGrid(xs, -W / 2, W / 2), gy = fillGrid(ys, y0, y1), P = [], U = [];
  for (let j = 0; j < gy.length - 1; j++) for (let i = 0; i < gx.length - 1; i++) { const cx = (gx[i] + gx[i + 1]) / 2, cy = (gy[j] + gy[j + 1]) / 2; if (holes.some(h => cx > h.x0 && cx < h.x1 && cy > h.y0 && cy < h.y1)) continue;
    const a = [gx[i], gy[j]], b = [gx[i + 1], gy[j]], c = [gx[i + 1], gy[j + 1]], d = [gx[i], gy[j + 1]]; for (const t of [[a, b, c], [a, c, d]]) for (const v of t) { P.push(v[0], v[1], 0); U.push(v[0] * su, v[1] * sv); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
  const n = new Float32Array(P.length); for (let i = 2; i < n.length; i += 3) n[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); return g; };
// a mesh helper that also sets rotation: mesh(geo, mat, [x,y,z], [rx,ry,rz], parent)
const mesh = (g, m, p, r, parent) => { const o = add(g, m, p[0], p[1], p[2], parent); if (r) o.rotation.set(r[0], r[1], r[2]); return o; };
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };
const lerpCol = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const col3 = c => new THREE.Color(c);

PS.props = PS.props || {};
const P = PS.props;

// =====================================================================================================================
// GROUND, ROAD, SIDEWALK
// =====================================================================================================================
const GT = {
  grass(q, w, h, r) { fillAll(q, '#3f5629', w, h); spk(q, w, h, r, '#2a3e1c', 300, .9); spk(q, w, h, r, '#587236', 200, .8); for (let i = 0; i < 46; i++) px(q, r() < .5 ? '#6e8a42' : '#2c4220', r() * w | 0, r() * h | 0, 1, 2); spk(q, w, h, r, '#6a5a30', 10, .8); },
  'dead grass'(q, w, h, r) { fillAll(q, '#6e6034', w, h); spk(q, w, h, r, '#524624', 260, .9); spk(q, w, h, r, '#8a7a48', 170, .8); for (let i = 0; i < 50; i++) px(q, pick(r, ['#a08c52', '#8a7a46', '#4a3e22']), r() * w | 0, r() * h | 0, 1, 2 + (r() * 2 | 0)); for (let i = 0; i < 6; i++) px(q, '#4a3a24', r() * w | 0, r() * h | 0, 2, 2); },
  dirt(q, w, h, r) { fillAll(q, '#5a4630', w, h); spk(q, w, h, r, '#40301e', 240, .9); spk(q, w, h, r, '#745c40', 160, .8); for (let i = 0; i < 12; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, '#8a7a62', x, y, 2, 1); px(q, '#32261a', x, y + 1, 2, 1); } crack(q, '#2e2216', r() * w, r() * h, 10, r, 1, .3); },
  asphalt(q, w, h, r) { fillAll(q, '#3a3a3e', w, h); spk(q, w, h, r, '#2a2a2e', 280, .9); spk(q, w, h, r, '#54545a', 130, .8); crack(q, '#1e1e22', r() * w, 0, 20, r, .2, 1); },
  gravel(q, w, h, r) { fillAll(q, '#5e5c58', w, h); for (let i = 0; i < 110; i++) { const x = r() * w | 0, y = r() * h | 0, s = 1 + (r() * 2 | 0), v = 90 + r() * 90 | 0; px(q, `rgb(${v},${v - 4},${v - 10})`, x, y, s + 1, s); px(q, 'rgba(20,20,20,.6)', x, y + s, s + 1, 1); } },
  snow(q, w, h, r) { fillAll(q, '#c6d0e0', w, h); spk(q, w, h, r, '#a8b6ce', 140, .8); spk(q, w, h, r, '#f2f6fc', 130, .9); for (let i = 0; i < 8; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, '#9aaac6', x, y, 2, 1); px(q, '#e8eef8', x, y - 1, 2, 1); } },
  sand(q, w, h, r) { fillAll(q, '#c2a870', w, h); spk(q, w, h, r, '#a89058', 170, .8); spk(q, w, h, r, '#dcc48a', 150, .8); for (let y = 3; y < h; y += 8) for (let x = 0; x < w; x++) if (r() < .7) px(q, 'rgba(150,120,70,.45)', x, y + (Math.sin(x * .6) * 1.2 | 0), 1, 1); }
};
const groundTex = type => TX('ground:' + type, 32, 32, (q, w, h, r) => (GT[type] || GT.grass)(q, w, h, r), { mip: true });
const GSCALE = { grass: 2.4, 'dead grass': 2.4, dirt: 2, asphalt: 2, gravel: 1.6, snow: 3, sand: 3 };
const hv = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const vn2 = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf_ = x - xi, zf = z - zi, u = xf_ * xf_ * (3 - 2 * xf_), v = zf * zf * (3 - 2 * zf); return lerp(lerp(hv(xi, zi), hv(xi + 1, zi), u), lerp(hv(xi, zi + 1), hv(xi + 1, zi + 1), u), v); };

// ground({ type, size, seg, hills, flat, tint, y }) : a big subdivided, mip-mapped ground plane centred on the origin.
P.ground = (o = {}) => { const type = o.type || 'grass', size = o.size ?? 120, seg = o.seg ?? clamp(size / 40, 2.4, 8), tile = GSCALE[type] ?? 2.4, g = grp();
  const geo = PS.plane(size, size, size / tile, size / tile, seg).rotateX(-PI / 2), amp = o.hills ?? 0, flat = o.flat ?? 14;
  const height = (x, z) => amp ? amp * clamp((Math.hypot(x, z) - flat) / 25) * (vn2(x * .045, z * .045) * 1.4 + vn2(x * .13, z * .13) * .5 - .9) : 0;
  if (amp) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i))); geo.computeVertexNormals(); }
  const m = add(geo, MT(groundTex(type), o.tint ? { tint: o.tint } : {}), 0, o.y ?? 0, 0, g); g.userData = { type, size, mesh: m, heightAt: height }; return g; };

// road({ length, width, lines, center, edge, shoulder, wear }) : a two-lane asphalt road along the z axis (centred), surface at y=0.02.
// lines:true draws markings; center: 'double'|'dashed'|'none'; edge: white edge lines; shoulder: gravel strips either side.
P.road = (o = {}) => { const L = o.length ?? 60, W = o.width ?? 6.5, g = grp(), lines = o.lines !== false;
  const road = TX('road', 64, 64, (q, w, h, r) => { fillAll(q, '#34343a', w, h); spk(q, w, h, r, '#26262a', 500, .9); spk(q, w, h, r, '#50505a', 220, .8);
    for (const cx of [18, 46]) { for (let i = 0; i < 380; i++) px(q, 'rgba(14,14,18,.35)', cx - 5 + r() * 10 | 0, r() * h | 0); }
    for (let i = 0; i < 3; i++) crack(q, '#1c1c20', r() * w, r() * h, 26, r, (r() - .5) * .8, 1); for (let i = 0; i < 4; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, '#1a1a1c', x, y, 3, 2); px(q, '#242428', x + 1, y - 1, 2, 1); } px(q, '#5a5a60', 0, 0, 2, h); px(q, '#5a5a60', w - 2, 0, 2, h); }, { mip: true });
  const surf = add(PS.plane(W, L, 1, L / 8, 2).rotateX(-PI / 2), MT(road), 0, .02, 0, g);
  if (o.shoulder !== false) { const sw = o.shoulderWidth ?? 1.2; for (const s of [-1, 1]) add(PS.plane(sw, L, sw / 1.6, L / 1.6, 2).rotateX(-PI / 2), MT(groundTex('gravel')), s * (W / 2 + sw / 2), .01, 0, g); }
  const paint = (c, hole) => MT(TX('paint' + c, 4, 16, (q, w, h, r) => { fillAll(q, c, w, h); for (let i = 0; i < 9; i++) q.clearRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1 + (r() * 3 | 0)); }));
  if (lines) { const yel = paint('#d2aa28'), whi = paint('#cfcfc6'), center = o.center || 'double', parts = { y: [], w: [] };
    const strip = (x, len, z0, wd) => xf(PS.plane(wd, len, 1, len / 4, 2).rotateX(-PI / 2), [x, .04, z0]);
    if (center === 'double') { parts.y.push(strip(-.1, L, 0, .1), strip(.1, L, 0, .1)); } else if (center === 'dashed') { for (let z = -L / 2 + 2; z < L / 2 - 2; z += 9) parts.y.push(strip(0, 3, z + 1.5, .12)); }
    if (o.edge !== false) for (const s of [-1, 1]) parts.w.push(strip(s * (W / 2 - .3), L, 0, .1));
    if (parts.y.length) add(merge(parts.y), yel, 0, 0, 0, g); if (parts.w.length) add(merge(parts.w), whi, 0, 0, 0, g); }
  g.userData = { length: L, width: W, surfaceY: .02 }; return bake(g); };

const CONC = () => TX('sidewalk', 32, 32, (q, w, h, r) => { fillAll(q, '#8c8c86', w, h); spk(q, w, h, r, '#74746e', 200, .8); spk(q, w, h, r, '#a4a49c', 140, .8); px(q, '#5e5e5a', 0, 0, w, 1); px(q, '#5e5e5a', 0, 0, 1, h); crack(q, '#52524e', r() * w, r() * h, 12, r, (r() - .5), 1); for (let i = 0; i < 4; i++) px(q, '#4c5a38', r() * w | 0, r() * h | 0, 2, 1); }, { mip: true });
// sidewalk({ length, width, curb, dirty }) : a raised concrete walk along z (centred). The kerb face is on the -x edge (rotate it to face the road).
P.sidewalk = (o = {}) => { const L = o.length ?? 20, W = o.width ?? 1.8, H = o.height ?? .14, g = grp();
  const conc = CONC();
  add(tbox(W, H, L, { su: .5, sv: .5, seg: 2 }), MT(conc), 0, H / 2, 0, g);
  if (o.curb !== false) add(tbox(.18, H + .03, L, { su: .5, sv: .5, seg: 2 }), MT(conc, { tint: '#d8d8d0' }), -W / 2 - .09 + .05, (H + .03) / 2 - .015, 0, g);
  g.userData = { length: L, width: W, topY: H }; return bake(g); };

// =====================================================================================================================
// SKY DOMES  (equirectangular canvas painted per pixel: gradient + fbm clouds + sun/moon + stars + treeline silhouette)
// =====================================================================================================================
// az/el in degrees; az 0 = straight ahead (-z), 90 = +x. Returns a unit vector.
const dirOf = (az, el) => { const a = az * PI / 180, e = el * PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; };
const fbm2 = (x, z) => vn2(x, z) * .5 + vn2(x * 2.1 + 7, z * 2.1 + 3) * .27 + vn2(x * 4.3 + 1, z * 4.3 + 9) * .15 + vn2(x * 8.7 + 4, z * 8.7 + 2) * .08;
const SKYS = {
  noon: { stops: [[-90, '#8aa4b8'], [0, '#c4d8ec'], [10, '#a4c4ec'], [40, '#5a8ee0'], [90, '#2c5cc0']], clouds: { th: .52, soft: .22, hi: '#ffffff', lo: '#aeb8cc', freq: 2.6, steps: 5 }, sun: { az: 25, el: 58, size: 2.6, col: '#fffbe0', glow: '#fff4c0', glowR: 14 }, ground: '#2a3c26', stars: 0 },
  golden: { stops: [[-90, '#6a4a30'], [0, '#f8c070'], [6, '#f2b070'], [18, '#d89a80'], [45, '#7a8ec8'], [90, '#3c5aa8']], clouds: { th: .5, soft: .2, hi: '#ffd8a0', lo: '#a86a5c', freq: 2.2, steps: 5 }, sun: { az: 18, el: 9, size: 3.6, col: '#fff0c0', glow: '#ff9a40', glowR: 40 }, ground: '#2c2216', stars: 0 },
  dusk: { stops: [[-90, '#1a1020'], [0, '#f0a060'], [5, '#e07a58'], [16, '#a85a78'], [40, '#4a3a78'], [90, '#161842']], clouds: { th: .55, soft: .18, hi: '#f08a68', lo: '#3a2a52', freq: 2.0, steps: 4 }, sun: { az: 30, el: -1, size: 3, col: '#ffc070', glow: '#ff6a38', glowR: 44 }, ground: '#120c16', stars: 160 },
  night: { stops: [[-90, '#04060c'], [0, '#1c2c4c'], [8, '#101e3c'], [35, '#0a1430'], [90, '#02040c']], clouds: null, ground: '#04060a', stars: 650, moon: { az: 22, el: 36 } },
  overcast: { stops: [[-90, '#6c7478'], [0, '#c4cacc'], [15, '#aeb4b8'], [90, '#7c848a']], clouds: { th: .0, soft: .75, hi: '#c8ced0', lo: '#7a8288', freq: 2.4, steps: 5, full: true }, ground: '#3c4640', stars: 0 },
  storm: { stops: [[-90, '#161c1a'], [0, '#566258'], [12, '#38443e'], [90, '#161e1c']], clouds: { th: .0, soft: .6, hi: '#6a7a70', lo: '#1c2622', freq: 3.0, steps: 5, full: true, dark: true }, ground: '#0e1410', stars: 0, lightning: true }
};
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const gradAt = (stops, el) => { for (let i = 0; i < stops.length - 1; i++) if (el <= stops[i + 1][0]) return lerpCol(stops[i][2], stops[i + 1][2], (el - stops[i][0]) / (stops[i + 1][0] - stops[i][0])); return stops[stops.length - 1][2]; };

const paintSky = (cfg, o) => { const big = (cfg.stars || o.stars) || o.moon, W = big ? 1024 : 512, H = W / 2, c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d'), img = q.createImageData(W, H), d = img.data;
  const stops = cfg.stops.map(s => [s[0], s[1], hex(s[1])]), cl = cfg.clouds, ground = hex(o.ground || cfg.ground), r = rng(hash(JSON.stringify(o)) + 5);
  const sun = o.sun === false ? null : (cfg.sun ? { ...cfg.sun, ...(typeof o.sun === 'object' ? o.sun : {}) } : null), sunV = sun && dirOf(sun.az, sun.el), sunC = sun && hex(sun.col), glowC = sun && hex(sun.glow);
  const moon = o.moon ? { ...(cfg.moon || { az: 22, el: 36 }), ...(typeof o.moon === 'object' ? o.moon : {}) } : (o.moon === false ? null : cfg.moon), moonV = moon && dirOf(moon.az, moon.el);
  let mr = [0, 0, 0], mu = [0, 1, 0]; if (moon) { const up = [0, 1, 0], cr = [up[1] * moonV[2] - up[2] * moonV[1], up[2] * moonV[0] - up[0] * moonV[2], up[0] * moonV[1] - up[1] * moonV[0]], l = Math.hypot(...cr); mr = cr.map(v => v / l); mu = [moonV[1] * mr[2] - moonV[2] * mr[1], moonV[2] * mr[0] - moonV[0] * mr[2], moonV[0] * mr[1] - moonV[1] * mr[0]]; }
  const mR = (moon && moon.size || 3.4) * PI / 180, phase = moon && moon.phase !== undefined ? moon.phase : 1, craters = Array.from({ length: 9 }, () => [(r() - .5) * 1.5, (r() - .5) * 1.5, .12 + r() * .24]);
  const tl = o.treeline ?? cfg.treeline ?? true, trees = new Float32Array(W).fill(-9);
  if (tl) { for (let x = 0; x < W; x++) trees[x] = .9 + .5 * Math.sin(x / W * TAU * 6 + 1) + .4 * Math.sin(x / W * TAU * 15); const rr = rng(77);
    for (let i = 0; i < 190; i++) { const x0 = rr() * W, wd = (.45 + rr() * 1.0) * W / 360, hh = 1.4 + rr() * 3.2 + (rr() < .12 ? 2.4 : 0); for (let x = Math.floor(x0 - wd); x <= x0 + wd; x++) { const k = (x + W) % W, h2 = Math.round((.9 + hh * (1 - Math.abs(x - x0) / wd)) * 4) / 4; if (h2 > trees[k]) trees[k] = h2; } } }
  for (let y = 0; y < H; y++) { const th = (y + .5) / H * PI, st = Math.sin(th), ct = Math.cos(th), el = 90 - th * 180 / PI;
    for (let x = 0; x < W; x++) { const ph = (x + .5) / W * TAU, dx = -Math.cos(ph) * st, dy = ct, dz = Math.sin(ph) * st; let c3;
      if (el < 0) c3 = ground; else {
        c3 = gradAt(stops, el);
        if (sun) { const ang = Math.acos(clamp(dx * sunV[0] + dy * sunV[1] + dz * sunV[2], -1, 1)) * 180 / PI; const g = Math.exp(-(ang * ang) / (sun.glowR * sun.glowR * .35)); c3 = lerpCol(c3, glowC, g * .85); if (ang < sun.size) c3 = lerpCol(c3, sunC, smooth(sun.size, sun.size * .8, ang)); }
        if (cl && el > 1.5) { const k = 1 / (dy + .22), u = dx * k * cl.freq * .6, v = dz * k * cl.freq * .6, f = fbm2(u, v); let dn = cl.full ? smooth(.2, .2 + cl.soft, f) : smooth(cl.th, cl.th + cl.soft, f);
          dn = Math.round(dn * cl.steps) / cl.steps; dn *= smooth(1.5, 9, el); if (dn > 0) { const sh = clamp((f - fbm2(u + .12, v + .1)) * 5 + .5), cc = lerpCol(hex(cl.lo), hex(cl.hi), sh); c3 = lerpCol(c3, cc, cl.full ? clamp(dn * (cl.dark ? .92 : .8)) : clamp(dn * .96)); } }
        if (moon) { const ex = dx * mr[0] + dy * mr[1] + dz * mr[2], ey = dx * mu[0] + dy * mu[1] + dz * mu[2], fw = dx * moonV[0] + dy * moonV[1] + dz * moonV[2];
          if (fw > 0) { const rr = Math.hypot(ex, ey), glow = Math.exp(-(rr * rr) / (mR * mR * 22)); c3 = lerpCol(c3, [150, 170, 210], glow * .32);
            if (rr < mR) { const lx = ex / mR, ly = ey / mR; let lit = phase >= .99 ? 1 : (Math.hypot(lx - (1 - phase) * 1.6, ly) > 1 ? 1 : 0); if (lit) { let cc = [238, 234, 212]; for (const k of craters) if (Math.hypot(lx - k[0], ly - k[1]) < k[2]) cc = [188, 186, 170]; if (hv(Math.floor(lx * 9), Math.floor(ly * 9)) > .93) cc = [214, 212, 194]; c3 = cc; } else c3 = lerpCol(c3, [30, 38, 60], .5); } } }
        if (el < trees[x]) c3 = ground; }
      const i = (y * W + x) * 4; d[i] = c3[0]; d[i + 1] = c3[1]; d[i + 2] = c3[2]; d[i + 3] = 255; } }
  q.putImageData(img, 0, 0);
  const ns = o.stars === false ? 0 : (typeof o.stars === 'number' ? o.stars : (o.stars === true ? Math.max(cfg.stars, 500) : cfg.stars));
  for (let i = 0; i < ns; i++) { const el = Math.asin(r() * .96 + .04) * 180 / PI, az = r() * 360; if (cfg === SKYS.dusk && r() > smooth(24, 70, el)) continue; const th = (90 - el) / 180 * H, x = az / 360 * W, wide = Math.min(6, 1 / Math.max(.2, Math.cos(el * PI / 180))), b = r(), big = b > .93;
    q.fillStyle = `rgba(${big ? '255,250,230' : '215,225,255'},${.35 + b * .65})`; q.fillRect(x - wide / 2 | 0, th | 0, Math.max(1, Math.round(wide)) * (big ? 1 : 1), big ? 2 : 1); if (big) { q.fillStyle = 'rgba(200,215,255,.45)'; q.fillRect(x - wide / 2 - 1 | 0, th | 0, Math.round(wide) + 2, 1); } }
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.canvas = c; return t; };

// skyDome({ preset, radius, stars, moon, sun, treeline, follow, ground }) : an unlit, unfogged inside-out sphere. Presets: noon golden dusk night overcast storm.
// moon / sun can be true|false or { az, el, size, phase }; az 0 = ahead (-z), 90 = +x. stars: false | true | count.
P.skyDome = (o = {}) => { const preset = o.preset || 'night', cfg = SKYS[preset] || SKYS.night, radius = Math.min(o.radius ?? 95, 100), g = grp();
  const key = 'sky:' + preset + JSON.stringify({ s: o.stars, m: o.moon, su: o.sun, t: o.treeline, g: o.ground, f: o.flatten }), tex = memo(key, () => paintSky(cfg, o));
  const mat = M(tex, { unlit: true, noFog: true, side: THREE.BackSide }), dome = add(new THREE.SphereGeometry(radius, 32, 20), mat, 0, 0, 0, g); dome.renderOrder = -10; dome.frustumCulled = false;
  const hz = hex(cfg.stops.find(s => s[0] >= 0)[1]);
  const flash = t => { if (!(cfg.lightning && o.lightning !== false)) return 0; const k = t * .31, ph = k - Math.floor(k), n = Math.floor(k); const o2 = hv(n, 5) * .5; const p = ph - o2; return p > 0 && p < .06 ? 1 : (p > .09 && p < .16 ? .55 * (1 - (p - .09) / .07) : 0); };
  g.userData = { preset, radius, mesh: dome, material: mat, horizonColor: '#' + hz.map(v => ('0' + (v | 0).toString(16)).slice(-2)).join(''), zenithColor: cfg.stops[cfg.stops.length - 1][1], groundColor: cfg.ground, sunDir: cfg.sun ? V3(...dirOf((typeof o.sun === 'object' && o.sun.az) ?? cfg.sun.az, (typeof o.sun === 'object' && o.sun.el) ?? cfg.sun.el)) : null, flash,
    update(t, S) { if (o.follow !== false && S && S.camera) g.position.copy(S.camera.position); const f = flash(t); mat.uniforms.tint.value.setRGB(1 + f * 1.6, 1 + f * 1.6, 1 + f * 1.8); } }; return g; };

// =====================================================================================================================
// ROOM  (inward-facing, subdivided walls with real openings, baseboards, window frames + views, door frames, ceiling)
// =====================================================================================================================
const WALLS = {
  wallpaper: { size: 16, tile: .8, tint: '#c9b48a', paint(q, w, h, r) { fillAll(q, '#e8e2d4', w, h); for (const x of [0, 8]) { px(q, '#d6cdb8', x, 0, 2, h); px(q, '#c2b79c', x + 2, 0, 1, h); } for (const [x, y] of [[5, 3], [13, 11], [5, 11], [13, 3]]) { px(q, '#b5a98c', x, y, 1, 1); px(q, '#f4efe4', x - 1, y, 1, 1); px(q, '#f4efe4', x + 1, y, 1, 1); px(q, '#f4efe4', x, y - 1, 1, 1); px(q, '#f4efe4', x, y + 1, 1, 1); } spk(q, w, h, r, '#a89c84', 28, .5); } },
  wood: { size: 16, tile: 1, tint: '#a5805a', paint(q, w, h, r) { for (let i = 0; i < 4; i++) { const x = i * 4, v = 205 + r() * 30 | 0; px(q, `rgb(${v},${v - 18},${v - 48})`, x, 0, 3, h); px(q, '#6a5a48', x + 3, 0, 1, h); for (let k = 0; k < 4; k++) px(q, 'rgba(110,80,50,.5)', x + (r() * 3 | 0), r() * h | 0, 1, 2 + (r() * 3 | 0)); } px(q, '#9a8466', 5, 6, 2, 2); px(q, '#7a6448', 6, 6, 1, 1); px(q, '#9a8466', 13, 12, 2, 2); } },
  tile: { size: 16, tile: .6, tint: '#c8d4cc', paint(q, w, h, r) { fillAll(q, '#a4a6a2', w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 228 + r() * 14 | 0; px(q, `rgb(${v},${v + 2},${v})`, x * 4, y * 4, 3, 3); px(q, '#ffffff', x * 4, y * 4, 1, 1); } spk(q, w, h, r, '#8a8c88', 20, .5); px(q, '#c8c2b0', 9, 5, 2, 1); } },
  brick: { size: 16, tile: .5, tint: '#ffffff', paint(q, w, h, r) { fillAll(q, '#a8a090', w, h); for (let y = 0; y < 4; y++) for (let k = 0; k < 2; k++) { const x = (y % 2) * 4 + k * 8, c = pick(r, ['#b06a52', '#a05a46', '#b87858', '#8e4e3c', '#a8624c']); px(q, c, x % 16, y * 4, 7, 3); if (x + 7 > 16) px(q, c, 0, y * 4, x + 7 - 16, 3); px(q, 'rgba(0,0,0,.18)', x % 16, y * 4 + 2, 7, 1); } spk(q, w, h, r, '#5e3a2a', 24, .5); } },
  plaster: { size: 32, tile: 2, tint: '#d8d0bc', paint(q, w, h, r) { fillAll(q, '#e4dece', w, h); spk(q, w, h, r, '#cfc7b4', 160, .7); spk(q, w, h, r, '#f2ede0', 90, .7); for (let i = 0; i < 3; i++) { const x = r() * w | 0; for (let y = 0; y < 8 + r() * 14; y++) px(q, `rgba(150,130,96,${.35 - y * .012})`, x + (r() < .3 ? 1 : 0), y, 1 + (r() < .3 ? 1 : 0), 1); } px(q, 'rgba(120,104,80,.35)', 18, 20, 6, 4); px(q, 'rgba(120,104,80,.25)', 20, 22, 8, 4); crack(q, '#9a9078', 6, 14, 14, r, .5, 1); } },
  concrete: { size: 32, tile: 2, tint: '#ffffff', paint(q, w, h, r) { fillAll(q, '#908f8a', w, h); spk(q, w, h, r, '#7a7a76', 200, .8); spk(q, w, h, r, '#a8a7a0', 150, .8); px(q, '#5c5c58', 0, 0, w, 1); px(q, '#5c5c58', 0, 0, 1, h); for (const x of [8, 24]) for (const y of [8, 24]) { px(q, '#4a4a48', x, y, 2, 2); px(q, '#a8a79e', x + 2, y, 1, 2); } for (let i = 0; i < 3; i++) { const x = r() * w | 0; for (let y = 6; y < 6 + r() * 20; y++) px(q, 'rgba(60,56,46,.3)', x, y, 1, 1); } for (let i = 0; i < 6; i++) px(q, '#5e5e5a', r() * w | 0, r() * h | 0, 2, 1); } },
  siding: { size: 16, tile: .64, tint: '#9aa090', paint(q, w, h, r) { for (let i = 0; i < 4; i++) { const y = i * 4; px(q, '#e8e6dc', 0, y, w, 4); px(q, '#fffff4', 0, y, w, 1); px(q, '#a09c90', 0, y + 3, w, 1); } spk(q, w, h, r, '#b8b4a6', 40, .6); px(q, '#a8a498', 4, 5, 4, 1); } }
};
const FLOORS = {
  wood: { size: 16, tile: .8, tint: '#b8a088', paint(q, w, h, r) { for (let i = 0; i < 4; i++) { const y = i * 4, c = pick(r, ['#c8a478', '#bd9a6c', '#d0ac80', '#b89468']); px(q, c, 0, y, w, 3); px(q, '#5e4630', 0, y + 3, w, 1); px(q, '#5e4630', r() * w | 0, y, 1, 3); for (let k = 0; k < 4; k++) px(q, 'rgba(90,60,30,.4)', r() * w | 0, y + (r() * 3 | 0), 3 + (r() * 4 | 0), 1); } } },
  carpet: { size: 16, tile: .8, tint: '#8a5050', paint(q, w, h, r) { fillAll(q, '#c8c0b8', w, h); spk(q, w, h, r, '#a8a09a', 140, .8); spk(q, w, h, r, '#e2dad2', 90, .7); px(q, '#8c847c', 6, 9, 3, 2); } },
  tile: { size: 16, tile: 1.2, tint: '#c8c8c0', paint(q, w, h, r) { fillAll(q, '#8a8a84', w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 214 + r() * 22 | 0; px(q, `rgb(${v},${v},${v - 6})`, x * 4, y * 4, 3, 3); } spk(q, w, h, r, '#7a7a74', 20, .5); } },
  checker: { size: 16, tile: .6, tint: '#ffffff', paint(q, w, h, r) { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) px(q, (x + y) % 2 ? '#1c1c1e' : '#e6e2d6', x * 8, y * 8, 8, 8); spk(q, w, h, r, '#8a8a84', 40, .5); spk(q, w, h, r, '#000000', 24, .4); } },
  concrete: { size: 32, tile: 2, tint: '#b0b0aa', paint(q, w, h, r) { fillAll(q, '#8c8c88', w, h); spk(q, w, h, r, '#767672', 200, .8); spk(q, w, h, r, '#a4a4a0', 140, .8); px(q, '#5a5a58', 0, 0, w, 1); px(q, '#5a5a58', 0, 0, 1, h); px(q, 'rgba(30,30,28,.45)', 12, 14, 7, 5); px(q, 'rgba(30,30,28,.3)', 14, 16, 8, 4); crack(q, '#4c4c4a', r() * w, r() * h, 16, r, .8, .6); } }
};
const CEIL = { size: 32, tile: 2, tint: '#d6cfbc', paint(q, w, h, r) { fillAll(q, '#ebe6d8', w, h); spk(q, w, h, r, '#d8d2c0', 120, .7); px(q, 'rgba(140,120,84,.28)', 4, 6, 9, 7); px(q, 'rgba(140,120,84,.28)', 7, 9, 10, 6); px(q, 'rgba(140,120,84,.18)', 21, 20, 7, 6); crack(q, '#a89e86', 22, 4, 12, r, -.3, 1); } };
const surfTex = (kind, def) => TX(kind + def.size + def.tile, def.size, def.size, def.paint, { mip: true, seed: hash(kind + def.tile) });
const wallMat = (type, color) => { const d = WALLS[type] || WALLS.plaster; return MT(surfTex('wall' + type, d), { tint: color || d.tint }); };
const floorMat = (type, color) => { const d = FLOORS[type] || FLOORS.wood; return MT(surfTex('floor' + type, d), { tint: color || d.tint }); };
const trimTex = () => TX('trim', 8, 8, (q, w, h, r) => { fillAll(q, '#e6dfcc', w, h); spk(q, w, h, r, '#c8bea4', 22, .7); px(q, '#b4a98c', 0, 7, 8, 1); px(q, '#f4eedc', 0, 0, 8, 1); });
const trimMat = c => MT(trimTex(), { tint: c || '#d8d0bc' });
const doorTex = () => TX('doorleaf', 16, 32, (q, w, h, r) => { fillAll(q, '#d8d0bc', w, h); spk(q, w, h, r, '#b8ae98', 40, .6); for (const [y0, hh] of [[3, 12], [18, 11]]) { px(q, '#a89e86', 3, y0, 10, hh); px(q, '#e8e2d0', 4, y0 + 1, 8, hh - 2); px(q, '#f4eedc', 4, y0 + 1, 8, 1); } px(q, '#8a7a4a', 13, 16, 1, 2); px(q, '#d8c070', 12, 15, 2, 2); });
const VIEWS = {
  day: (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, h * .72); g.addColorStop(0, '#6f9fe0'); g.addColorStop(1, '#cfe4f4'); q.fillStyle = g; q.fillRect(0, 0, w, h);
    for (const [x, y, s] of [[10, 12, 9], [38, 8, 12], [52, 20, 8]]) { px(q, '#f4f8ff', x, y, s, 3); px(q, '#ffffff', x + 2, y - 1, s - 4, 2); px(q, '#bcc8dc', x, y + 3, s, 1); }
    px(q, '#4e7a3c', 0, h * .72 | 0, w, h); px(q, '#3a622c', 0, h * .72 + 4 | 0, w, h); for (let i = 0; i < 7; i++) { const x = i * 10 + r() * 6 | 0, hh = 8 + r() * 10 | 0; px(q, '#2c4c24', x, h * .72 - hh | 0, 7, hh + 1); px(q, '#3a6230', x + 1, h * .72 - hh - 2 | 0, 5, 3); }
    px(q, '#a07058', 40, h * .72 - 8, 12, 9); px(q, '#6a3a30', 38, h * .72 - 12, 16, 4); px(q, '#e8d070', 44, h * .72 - 5, 2, 2); px(q, '#5a4a3a', 0, h - 6, w, 1); },
  night: (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, h * .75); g.addColorStop(0, '#04081a'); g.addColorStop(1, '#1a2a50'); q.fillStyle = g; q.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) px(q, `rgba(220,230,255,${.4 + r() * .6})`, r() * w | 0, r() * h * .6 | 0); q.fillStyle = 'rgba(160,180,230,.25)'; q.beginPath(); q.arc(47, 13, 8, 0, TAU); q.fill(); q.fillStyle = '#eee8d0'; q.beginPath(); q.arc(47, 13, 5, 0, TAU); q.fill(); px(q, '#c4c0a8', 45, 12, 2, 2); px(q, '#c4c0a8', 49, 15, 2, 1);
    px(q, '#05070c', 0, h * .78 | 0, w, h); for (let i = 0; i < 9; i++) { const x = i * 8 + r() * 4 | 0, hh = 10 + r() * 14 | 0, yb = h * .8 | 0; for (let k = 0; k < hh; k += 2) { const ww = Math.max(1, Math.round((hh - k) * .35)); px(q, '#05070c', x + 3 - ww, yb - k - 2, ww * 2, 2); } }
    px(q, '#0a0c12', 6, h * .7 | 0, 12, 8); px(q, '#e8c060', 9, h * .74 | 0, 2, 2); },
  dusk: (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, h * .76); g.addColorStop(0, '#2a2858'); g.addColorStop(.5, '#a8567a'); g.addColorStop(1, '#f2a064'); q.fillStyle = g; q.fillRect(0, 0, w, h);
    q.fillStyle = '#ffd890'; q.beginPath(); q.arc(20, h * .72, 5, 0, TAU); q.fill(); for (const [x, y, s] of [[34, 14, 14], [8, 24, 10], [48, 30, 12]]) { px(q, 'rgba(70,40,90,.7)', x, y, s, 2); px(q, 'rgba(240,150,120,.6)', x + 1, y + 2, s - 3, 1); }
    px(q, '#120c16', 0, h * .78 | 0, w, h); for (let i = 0; i < 9; i++) { const x = i * 8 + r() * 4 | 0, hh = 8 + r() * 14 | 0, yb = h * .8 | 0; for (let k = 0; k < hh; k += 2) { const ww = Math.max(1, Math.round((hh - k) * .35)); px(q, '#120c16', x + 3 - ww, yb - k - 2, ww * 2, 2); } } px(q, '#1c1220', 40, h * .66 | 0, 14, 10); px(q, '#1c1220', 38, h * .64 | 0, 18, 3); px(q, '#f0c868', 44, h * .72 | 0, 2, 2); }
};
const viewMat = v => MT(TX('view' + v, 64, 64, VIEWS[v] || VIEWS.night), { unlit: true, noFog: true });
const darkVoid = () => MT(TX('void', 4, 4, q => { fillAll(q, '#06070b', 4, 4); }), { unlit: true, noFog: true });
const lightVoid = () => MT(TX('voidlit', 8, 16, (q, w, h) => { const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff0c8'); g.addColorStop(1, '#a88850'); q.fillStyle = g; q.fillRect(0, 0, w, h); }), { unlit: true, noFog: true });

// room({ w, d, h, wall, wallColor, floor, floorColor, ceiling, ceilingColor, trim, trimColor, wainscot, crown, cutaway, windows, doors, outer })
// wall: wallpaper|wood|tile|brick|plaster|concrete  floor: wood|carpet|tile|checker|concrete  cutaway: 'front'|'back'|'left'|'right'|'top'|null (that wall is left out so a camera can look in)
// windows: [{ wall:'back'|'left'|'right'|'front', x (along the wall as seen from inside, 0 = centre), y (centre height), w, h, view:'night'|'day'|'dusk', curtains:'#hex' }]
// doors: [{ wall, x, w, h, void:'dark'|'light'|'none', leaf:false|true, leafColor }]
// walls run on x=±w/2 and z=±d/2, the floor is y=0, the room is centred on the origin. The front wall is +z (where a camera usually looks from).
P.room = (o = {}) => { const w = o.w ?? 5, d = o.d ?? 4.5, h = o.h ?? 2.6, T = .16, wallType = o.wall || 'wallpaper', R = grp(), ud = R.userData = { size: { w, d, h }, windows: [], doors: [], wallThickness: T, ceilingY: h, bounds: { x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2 } };
  const cut = o.cutaway || null, hasCeil = o.ceiling !== false && cut !== 'top', trimC = o.trimColor || (wallType === 'wood' ? '#5a4030' : '#d8d0bc'), tm = trimMat(trimC), wm = wallMat(wallType, o.wallColor), outerType = o.outer || (wallType === 'brick' ? 'brick' : wallType === 'concrete' ? 'concrete' : 'siding');
  const wain = o.wainscot ? (o.wainscot === true ? '#8a6444' : o.wainscot) : null, wainH = .95, om = wallMat(outerType, o.outerColor);
  const defs = { back: { pos: [0, 0, -d / 2], ry: 0, L: w }, front: { pos: [0, 0, d / 2], ry: PI, L: w }, left: { pos: [-w / 2, 0, 0], ry: PI / 2, L: d }, right: { pos: [w / 2, 0, 0], ry: -PI / 2, L: d } };
  const wins = (o.windows || []).map(k => ({ w: 1.1, h: 1.3, y: 1.5, x: 0, view: 'night', wall: 'back', ...k })), doors = (o.doors || []).map(k => ({ w: .95, h: 2.1, x: 0, wall: 'back', void: 'dark', ...k }));
  for (const [name, def] of Object.entries(defs)) { const L = def.L, wg = grp(R, ...def.pos); wg.rotation.y = def.ry; wg.updateMatrix(); const nrm = V3(Math.sin(def.ry), 0, Math.cos(def.ry));
    const holes = [], hw = wins.filter(k => k.wall === name), hd = doors.filter(k => k.wall === name);
    for (const k of hw) holes.push({ x0: k.x - k.w / 2, x1: k.x + k.w / 2, y0: k.y - k.h / 2, y1: k.y + k.h / 2 }); for (const k of hd) holes.push({ x0: k.x - k.w / 2, x1: k.x + k.w / 2, y0: 0, y1: k.h });
    const toRoom = (lx, ly, lz) => V3(lx, ly, lz).applyMatrix4(wg.matrix);
    // register windows and doors (even when the wall itself is the cutaway)
    for (const k of hw) ud.windows.push({ wall: name, w: k.w, h: k.h, view: k.view, pos: toRoom(k.x, k.y, 0), normal: nrm.clone(), index: ud.windows.length });
    for (const k of hd) { const rec = { wall: name, w: k.w, h: k.h, pos: toRoom(k.x, 0, 0), normal: nrm.clone(), index: ud.doors.length, leaf: null, setOpen() { } }; k.rec = rec; ud.doors.push(rec); }
    if (cut === name) continue;
    // inner skin (optionally with a wainscot band below)
    if (wain) { const wgeo = holeWall(L, 0, wainH, holes, { su: 1 / WALLS.wood.tile, sv: 1 / WALLS.wood.tile }); add(wgeo, wallMat('wood', wain), 0, 0, 0, wg); add(holeWall(L, wainH, h, holes, { su: 1 / WALLS[wallType].tile, sv: 1 / WALLS[wallType].tile }), wm, 0, 0, 0, wg); add(tbox(L, .06, .05, { seg: 3 }), tm, 0, wainH, .025 + .003, wg); }
    else add(holeWall(L, 0, h, holes, { su: 1 / (WALLS[wallType] || WALLS.plaster).tile, sv: 1 / (WALLS[wallType] || WALLS.plaster).tile }), wm, 0, 0, 0, wg);
    // outer skin (mirrored holes because it faces the other way)
    const ot = WALLS[outerType] || WALLS.siding, oL = L + 2 * T; add(holeWall(oL, 0, h, holes.map(k => ({ x0: -k.x1, x1: -k.x0, y0: k.y0, y1: k.y1 })), { su: 1 / ot.tile, sv: 1 / ot.tile }), om, 0, 0, -T, wg).rotation.y = PI;
    // baseboard (skips door openings) + crown
    if (o.trim !== false) { const cuts = hd.map(k => [k.x - k.w / 2 - .07, k.x + k.w / 2 + .07]).sort((a, b) => a[0] - b[0]); let a = -L / 2; const segs = []; for (const c of cuts) { if (c[0] > a) segs.push([a, c[0]]); a = Math.max(a, c[1]); } if (a < L / 2) segs.push([a, L / 2]);
      for (const [s0, s1] of segs) add(tbox(s1 - s0, .13, .03, { seg: 3 }), tm, (s0 + s1) / 2, .065, .015 + .003, wg);
      if (o.crown !== false && wallType !== 'concrete' && wallType !== 'tile') add(tbox(L, .08, .07, { seg: 3 }), tm, 0, h - .04, .035 + .002, wg); }
    // windows
    for (const k of hw) { const x0 = k.x - k.w / 2, x1 = k.x + k.w / 2, y0 = k.y - k.h / 2, y1 = k.y + k.h / 2, c = .07;
      for (const [bw, bh, bx, by] of [[k.w, .03, k.x, y0 + .015], [k.w, .03, k.x, y1 - .015], [.03, k.h, x0 + .015, k.y], [.03, k.h, x1 - .015, k.y]]) add(tbox(bw, bh, T, { seg: 3 }), tm, bx, by, -T / 2, wg);
      add(tbox(c, k.h + c * 2, .03, { seg: 3 }), tm, x0 - c / 2, k.y, .015 + .003, wg); add(tbox(c, k.h + c * 2, .03, { seg: 3 }), tm, x1 + c / 2, k.y, .015 + .003, wg); add(tbox(k.w, c, .03, { seg: 3 }), tm, k.x, y1 + c / 2, .015 + .003, wg);
      add(tbox(k.w + c * 2 + .08, .04, .13, { seg: 3 }), tm, k.x, y0 - .02 + .004, .065 + .003, wg);
      for (const [bw, bh, bx, by] of [[.04, k.h, k.x, k.y], [k.w, .04, k.x, k.y + k.h * .12], [.05, k.h, x0 + .025, k.y], [.05, k.h, x1 - .025, k.y], [k.w, .05, k.x, y0 + .025], [k.w, .05, k.x, y1 - .025]]) add(tbox(bw, bh, .03, { seg: 3 }), tm, bx, by, -.03, wg);
      add(decal(k.w + .6, k.h + .6, 3), viewMat(k.view), k.x, k.y, -T * .7, wg);
      if (k.curtains) { const cm = MT(TX('curtain', 8, 8, (q, ww, hh, r) => { fillAll(q, '#d8d0d0', ww, hh); for (let i = 0; i < ww; i += 2) px(q, '#a89c9c', i, 0, 1, hh); spk(q, ww, hh, r, '#988c8c', 14, .5); }), { tint: k.curtains });
        for (const s of [-1, 1]) add(tbox(.24, k.h + .5, .07, { seg: 3 }), cm, k.x + s * (k.w / 2 + .02), y1 + .05 - (k.h + .5) / 2 + .2, .06, wg).rotation.z = s * .03; add(tbox(k.w + .8, .03, .03, { seg: 3 }), tm, k.x, y1 + .3, .07, wg); } }
    // doors
    for (const k of hd) { const x0 = k.x - k.w / 2, x1 = k.x + k.w / 2, c = .08;
      add(tbox(k.w, .03, T, { seg: 3 }), tm, k.x, k.h - .015, -T / 2, wg); add(tbox(.03, k.h, T, { seg: 3 }), tm, x0 + .015, k.h / 2, -T / 2, wg); add(tbox(.03, k.h, T, { seg: 3 }), tm, x1 - .015, k.h / 2, -T / 2, wg); add(tbox(k.w, .02, T, { seg: 3 }), tm, k.x, .01, -T / 2, wg);
      add(tbox(c, k.h + c, .03, { seg: 3 }), tm, x0 - c / 2, (k.h + c) / 2, .015 + .003, wg); add(tbox(c, k.h + c, .03, { seg: 3 }), tm, x1 + c / 2, (k.h + c) / 2, .015 + .003, wg); add(tbox(k.w + c * 2, c, .03, { seg: 3 }), tm, k.x, k.h + c / 2, .015 + .003, wg);
      if (k.void !== 'none') add(decal(k.w + .3, k.h + .2, 3), k.void === 'light' ? lightVoid() : darkVoid(), k.x, (k.h + .2) / 2 - .1, -T * .9, wg);
      if (k.leaf) { const hinge = grp(wg, x0 + .02, 0, -.03); hinge.userData.keep = true; const lf = add(tbox(k.w - .05, k.h - .04, .045, { seg: 4, su: 1.2, sv: 1.2 }), MT(doorTex(), { tint: k.leafColor || '#b8a07a' }), (k.w - .05) / 2, (k.h - .04) / 2 + .02, 0, hinge); lf.userData.keep = true;
        add(new THREE.SphereGeometry(.035, 5, 4), SOLID('#c8a850'), k.w - .12, k.h * .47, .045, hinge).userData.keep = true; add(new THREE.SphereGeometry(.035, 5, 4), SOLID('#c8a850'), k.w - .12, k.h * .47, -.045, hinge).userData.keep = true;
        k.rec.leaf = hinge; k.rec.setOpen = a => { hinge.rotation.y = -a * 1.75; }; if (k.leaf === 'open') k.rec.setOpen(.9); else if (k.leaf === 'ajar') k.rec.setOpen(.18); } }
    // wall-top cap
    const cp = pln(T, L + 2 * T, 1, 1, 3).rotateX(-PI / 2).rotateY(PI / 2); add(cp, om, 0, h, -T / 2, wg);
  }
  // floor, ceiling, roof slab
  const fl = FLOORS[o.floor || 'wood'] || FLOORS.wood; add(PS.plane(w, d, w / fl.tile, d / fl.tile, 1).rotateX(-PI / 2), floorMat(o.floor || 'wood', o.floorColor), 0, 0, 0, R);
  if (hasCeil) { const cm = MT(surfTex('ceil', CEIL), { tint: o.ceilingColor || CEIL.tint }); add(PS.plane(w, d, w / CEIL.tile, d / CEIL.tile, 1.5).rotateX(PI / 2), cm, 0, h, 0, R); if (o.roof !== false) add(tbox(w + 2 * T, .1, d + 2 * T, { su: .5, seg: 3 }), SOLID('#4a4a48'), 0, h + .05, 0, R); }
  ud.ceilingLight = V3(0, h - .25, 0); ud.center = V3(0, h / 2, 0); ud.inside = (x, z) => Math.abs(x) < w / 2 && Math.abs(z) < d / 2; ud.wallColor = o.wallColor || (WALLS[wallType] || {}).tint;
  return bake(R); };

// =====================================================================================================================
// BUILDING KIT  (textures + roofs + windows + doors + chimneys shared by house / cabin / church / shack)
// =====================================================================================================================
const BT = {
  siding: () => surfTex('wallsiding', WALLS.siding),
  shingle: () => TX('shingle', 16, 16, (q, w, h, r) => { fillAll(q, '#aaa69e', w, h); for (let y = 0; y < 4; y++) { const off = (y % 2) * 4; for (let x = off; x < w + off; x += 8) { px(q, '#4c4842', x % 16, y * 4, 1, 3); px(q, 'rgba(255,255,255,.12)', (x + 1) % 16, y * 4, 3, 1); } px(q, '#3e3a34', 0, y * 4 + 3, w, 1); } spk(q, w, h, r, '#6e6a62', 60, .8); spk(q, w, h, r, '#c4c0b6', 30, .6); }, { mip: true }),
  tin: () => TX('tin', 8, 8, (q, w, h, r) => { for (let x = 0; x < w; x++) px(q, ['#d0ccc4', '#b8b4ac', '#8e8a84', '#b8b4ac'][x % 4], x, 0, 1, h); spk(q, w, h, r, '#8a5a3a', 7, .7); spk(q, w, h, r, '#5a3a2a', 3, .7); for (let i = 0; i < 2; i++) px(q, 'rgba(90,50,30,.4)', r() * w | 0, r() * h | 0, 1, 3 + (r() * 4 | 0)); }, { mip: true }),
  boards: () => TX('boards', 16, 16, (q, w, h, r) => { for (let i = 0; i < 4; i++) { const x = i * 4, v = 205 + r() * 20 | 0; px(q, `rgb(${v},${v - 6},${v - 18})`, x, 0, 3, h); px(q, '#4a4236', x + 3, 0, 1, h); for (let k = 0; k < 3; k++) px(q, 'rgba(110,100,80,.5)', x + (r() * 3 | 0), r() * h | 0, 1, 2 + (r() * 4 | 0)); if (r() < .6) px(q, 'rgba(130,120,98,.7)', x, r() * 12 | 0, 3, 2 + (r() * 2 | 0)); } spk(q, w, h, r, '#3a342a', 14, .7); for (let i = 0; i < 4; i++) px(q, '#8a8478', i * 4 + 1, 8, 1, 1); }, { mip: true }),
  bark: () => TX('bark', 8, 16, (q, w, h, r) => { for (let x = 0; x < w; x++) px(q, pick(r, ['#6a4a2e', '#7a5636', '#5a3c24', '#684830']), x, 0, 1, h); for (let i = 0; i < 26; i++) px(q, pick(r, ['#2e1e12', '#8a6a46', '#3e2a1a']), r() * w | 0, r() * h | 0, 1, 1 + (r() * 3 | 0)); }),
  grayBark: () => TX('graybark', 8, 16, (q, w, h, r) => { for (let x = 0; x < w; x++) px(q, pick(r, ['#5c5852', '#6c6860', '#4a4640', '#625e56']), x, 0, 1, h); for (let i = 0; i < 24; i++) px(q, pick(r, ['#2a2824', '#8a867a', '#3a3834']), r() * w | 0, r() * h | 0, 1, 1 + (r() * 4 | 0)); }),
  endgrain: () => TX('endgrain', 8, 8, (q, w, h, r) => { fillAll(q, '#b08a58', w, h); q.strokeStyle = '#8a6a3e'; q.lineWidth = 1; q.strokeRect(1.5, 1.5, 5, 5); px(q, '#6a4a2a', 3, 3, 2, 2); }),
  stone: () => TX('stone', 16, 16, (q, w, h, r) => { fillAll(q, '#5e5a52', w, h); for (const [y, hh] of [[0, 5], [5, 5], [10, 6]]) { let x = r() * 4 | 0; while (x < w + 6) { const ww = 4 + (r() * 5 | 0), v = 110 + r() * 50 | 0; for (const xx of [x, x - w]) { px(q, `rgb(${v},${v - 4},${v - 12})`, xx, y, ww - 1, hh - 1); px(q, 'rgba(255,255,255,.22)', xx, y, ww - 1, 1); px(q, 'rgba(0,0,0,.25)', xx, y + hh - 2, ww - 1, 1); } x += ww; } } spk(q, w, h, r, '#3a382e', 14, .7); }, { mip: true }),
  scales: () => TX('scales', 16, 16, (q, w, h, r) => { fillAll(q, '#4a4238', w, h); for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) { const cx = k * 8 + (row % 2) * 4, cy = row * 4 + 2; for (const xx of [cx, cx - 16]) { q.fillStyle = pick(r, ['#d4cdb8', '#c6bea8', '#dcd5c0']); q.beginPath(); q.arc(xx + .5, cy + .5, 4, 0, PI); q.fill(); q.strokeStyle = '#6a6252'; q.beginPath(); q.arc(xx + .5, cy + .5, 4, 0, PI); q.stroke(); } } }),
  garage: () => TX('garage', 16, 16, (q, w, h, r) => { fillAll(q, '#e0dccf', w, h); for (let y = 0; y < 4; y++) { px(q, '#9a968a', 0, y * 4 + 3, w, 1); px(q, '#f4f0e4', 0, y * 4, w, 1); } for (let x = 1; x < 16; x += 4) px(q, '#4a5058', x, 1, 3, 1); spk(q, w, h, r, '#b8b4a6', 30, .6); px(q, '#8a867a', 0, 0, 1, h); px(q, '#8a867a', 15, 0, 1, h); }),
  louver: () => TX('louver', 8, 8, (q, w, h, r) => { fillAll(q, '#d8d4c8', w, h); for (let y = 0; y < 8; y += 2) { px(q, '#f0ecdc', 0, y, w, 1); px(q, '#6a665a', 0, y + 1, w, 1); } }),
  glass: () => TX('glass', 8, 8, (q, w, h) => { fillAll(q, '#18202a', w, h); px(q, '#2e3c4c', 1, 5, 2, 1); px(q, '#2e3c4c', 2, 4, 2, 1); px(q, '#2e3c4c', 3, 3, 2, 1); px(q, '#3a4a5c', 4, 2, 1, 1); px(q, '#0e141c', 5, 6, 3, 2); }),
  grassTuft: () => TX('tuft', 8, 8, (q, w, h, r) => { for (let i = 0; i < 18; i++) px(q, pick(r, ['#3a5a2a', '#4a6a32', '#2c4620']), r() * w | 0, 8 - 2 - (r() * 5 | 0), 1, 2 + (r() * 5 | 0)); }),
  plate: n => TX('num' + n, 32, 16, (q, w, h) => { fillAll(q, '#2a1e12', w, h); q.strokeStyle = '#c8b070'; q.strokeRect(.5, .5, w - 1, h - 1); q.fillStyle = '#e8dcb0'; q.font = 'bold 11px "Courier New", monospace'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(String(n), w / 2, h / 2 + 1); }),
  windowGlow: v => TX('litwin' + v % 3, 16, 16, (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, ['#ffe9a8', '#ffd890', '#fff0c0'][v % 3]); g.addColorStop(1, ['#e8a850', '#d89048', '#f0b860'][v % 3]); q.fillStyle = g; q.fillRect(0, 0, w, h);
    if (v % 3 === 0) { px(q, '#9a5a32', 0, 0, 4, h); px(q, '#9a5a32', w - 4, 0, 4, h); px(q, '#c48048', 3, 0, 1, h); px(q, '#c48048', w - 5, 0, 1, h); } else if (v % 3 === 1) { px(q, '#7a4a3a', 0, 0, w, 3); px(q, '#e8e0c8', 6, 7, 4, 5); px(q, '#4a3a2a', 7, 8, 2, 3); } else { px(q, '#3a2a22', 5, 5, 6, 11); px(q, '#3a2a22', 6, 3, 4, 3); } spk(q, w, h, r, '#fff6d0', 14, .5); })
};
const bT = f => memo('bt:' + f, () => BT[f]());
const bM = (f, tint, extra) => MT(bT(f), { ...(tint ? { tint } : {}), ...(extra || {}) });
// bx(parent, mat, [w,h,d], [x,y,z], tileMetres) : textured box with UVs in metres/tile
const bx = (parent, mat, s, p, tile = 1, rot, seg) => { const m = add(tbox(s[0], s[1], s[2], { su: 1 / tile, sv: 1 / tile, seg: seg ?? 1.6 }), mat, p[0], p[1], p[2], parent); if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0); return m; };
const cylT = (r1, r2, hh, n, tile, open) => PS.rep(new THREE.CylinderGeometry(r1, r2, hh, n, Math.max(1, Math.round(hh / 1.6)), !!open), Math.max(1, Math.round(TAU * Math.max(r1, r2) / tile)), hh / tile);

// gableRoof(parent, { L, B, rise, over, overG, thick, x, y, z, ry, mat, gmat, fascia, tile, gtile }): ridge along local x (length L), span B across z; eave line at y.
// ry = PI/2 turns the ridge to run along z. Gable triangles are drawn at both ends with gmat (siding).
const gableRoof = (g, o) => { const { L, B, rise } = o, over = o.over ?? .45, og = o.overG ?? .3, th = o.thick ?? .12, rg = grp(g, o.x || 0, o.y || 0, o.z || 0); rg.rotation.y = o.ry || 0;
  const ang = Math.atan2(rise, B / 2), cs = Math.cos(ang), sn = Math.sin(ang), S = (B / 2 + over) / cs, Lx = L + 2 * og, tile = o.tile ?? .7;
  for (const s of [1, -1]) { const p = add(tbox(Lx, th, S, { su: 1 / tile, sv: 1 / tile, seg: 1.6 }), o.mat, 0, rise - sn * S / 2 - cs * th / 2, s * (cs * S / 2 - sn * th / 2), rg); p.rotation.x = s * ang;
    if (o.fascia) for (const e of [-1, 1]) { const f = add(tbox(.05, .2, S + .04, { seg: 3 }), o.fascia, e * (Lx / 2 - .01), rise - sn * S / 2 - cs * th / 2 + cs * .06, s * (cs * S / 2 - sn * th / 2 + sn * .06), rg); f.rotation.x = s * ang; } }
  add(tbox(Lx + .06, .13, .13, { seg: 3 }), o.mat, 0, rise + .01, 0, rg).rotation.x = PI / 4;
  if (o.gmat !== null) for (const e of [-1, 1]) { const t = add(tri(B, rise, 1 / (o.gtile ?? .64), 1 / (o.gtile ?? .64), 1.2), o.gmat || o.mat, e * L / 2, 0, 0, rg); t.rotation.y = e * PI / 2; }
  rg.userData = { ang, S }; return rg; };
// shedRoof(parent, { L, B, rise, over, thick, x, y, z, ry, mat, tile }): a single sloping panel from (z=0,y=rise) down to (z=B+over); attach to a wall at z=0
const shedRoof = (g, o) => { const { L, B, rise } = o, over = o.over ?? .4, th = o.thick ?? .1, tile = o.tile ?? .7, ang = Math.atan2(rise, B), cs = Math.cos(ang), sn = Math.sin(ang), S = (B + over) / cs, rg = grp(g, o.x || 0, o.y || 0, o.z || 0); rg.rotation.y = o.ry || 0;
  const p = add(tbox(L + (o.overG ?? .3) * 2, th, S, { su: 1 / tile, sv: 1 / tile, seg: 1.6 }), o.mat, 0, rise - sn * S / 2 - cs * th / 2, cs * S / 2 - sn * th / 2, rg); p.rotation.x = ang; return rg; };
// a window unit hung on a wall at (x,y,z) facing ry (0 = +z, PI = -z, PI/2 = +x, -PI/2 = -x). opts: lit, shutters, boarded, w, h, trim, shutterColor
const dirN = ry => V3(Math.sin(ry), 0, Math.cos(ry));
const winUnit = (g, k, B) => { const w = k.w ?? 1, h = k.h ?? 1.35, wg = grp(g, k.x, k.y, k.z), tm = k.trim || B.trim; wg.rotation.y = k.ry || 0;
  const rec = { pos: V3(k.x, k.y, k.z), normal: dirN(k.ry || 0), w, h, lit: !!k.lit, wall: k.wall || '', floor: k.floor ?? 0, index: B.ud.windows.length }; B.ud.windows.push(rec);
  const gm = k.lit ? B.litMat(rec.index) : (k.boarded ? bM('boards', '#3a3430') : bM('glass'));
  add(decal(w, h, 2), gm, 0, 0, .02, wg);
  for (const [bw, bh, bx_, by] of [[w + .16, .08, 0, h / 2 + .04], [w + .16, .08, 0, -h / 2 - .04], [.08, h, -w / 2 - .04, 0], [.08, h, w / 2 + .04, 0]]) add(tbox(bw, bh, .08, { seg: 3 }), tm, bx_, by, .04, wg);
  if (!k.boarded || k.lit) { add(tbox(.035, h, .03, { seg: 3 }), tm, 0, 0, .035, wg); add(tbox(w, .035, .03, { seg: 3 }), tm, 0, h * .08, .035, wg); }
  add(tbox(w + .28, .05, .14, { seg: 3 }), tm, 0, -h / 2 - .105, .07, wg); if (k.lintel !== false) add(tbox(w + .3, .1, .11, { seg: 3 }), tm, 0, h / 2 + .13, .055, wg);
  if (k.shutters) { const sm = bM('louver', k.shutterColor || '#4a5a4a'); for (const s of [-1, 1]) add(tbox(w / 2 - .01, h + .06, .035, { su: 2, sv: 2, seg: 3 }), sm, s * (w / 2 + .1 + w / 4), 0, .05, wg); }
  if (k.boarded) { const bm = bM('boards', '#8a7e68'), r = rng(hash(k.x + ':' + k.y + ':' + k.z)); for (let i = 0; i < 3; i++) { const p = add(tbox(w + .5, .17, .035, { su: 2, sv: 2, seg: 3 }), bm, (r() - .5) * .12, (i - 1) * h * .34 + (r() - .5) * .08, .1, wg); p.rotation.z = (r() - .5) * .22; } }
  return rec; };
// a door unit: casing + panelled leaf + knob + step
const doorUnit = (g, k, B) => { const w = k.w ?? .95, h = k.h ?? 2.1, dg = grp(g, k.x, k.y ?? 0, k.z), tm = k.trim || B.trim; dg.rotation.y = k.ry || 0;
  add(tbox(w, h, .05, { su: 1.2, sv: 1.2, seg: 3 }), MT(doorTex(), { tint: k.color || '#6a4a3a' }), 0, h / 2, .03, dg);
  for (const s of [-1, 1]) add(tbox(.09, h + .09, .08, { seg: 3 }), tm, s * (w / 2 + .045), (h + .09) / 2, .04, dg); add(tbox(w + .18, .1, .08, { seg: 3 }), tm, 0, h + .05, .04, dg);
  if (k.step !== false) add(tbox(w + .5, .08, .5, { su: 1.2, sv: 1.2, seg: 3 }), bM('stone', '#b8b4a8'), 0, .04, .25, dg);
  add(new THREE.SphereGeometry(.04, 5, 4), SOLID('#c8a850'), w / 2 - .1, h * .47, .075, dg);
  if (k.glass) add(decal(.5, .6, 2), k.lit ? B.litMat(77) : bM('glass'), 0, h * .68, .06, dg);
  const rec = { pos: V3(k.x, k.y ?? 0, k.z), normal: dirN(k.ry || 0), w, h }; return rec; };
// a brick/stone chimney from y0 to y1
const chimney = (g, x, z, y0, y1, o = {}) => { const w = o.w ?? .9, d = o.d ?? .75, m = o.stone ? bM('stone', o.tint || '#c8c0b0') : MT(surfTex('wallbrick', WALLS.brick), { tint: o.tint || '#d8c8b8' }), tl = o.stone ? .8 : .5;
  bx(g, m, [w, y1 - y0, d], [x, (y0 + y1) / 2, z], tl); bx(g, m, [w + .16, .14, d + .16], [x, y1 + .02, z], tl); for (const s of [-1, 1]) add(cylT(.1, .1, .35, 6, .5), SOLID('#4a3a32'), x + s * .2, y1 + .26, z, g); return { top: V3(x, y1 + .4, z) }; };
// a building context: shared handles and a per-building lit-window material set (so a building's windows can flicker without touching the others)
const bctx = o => { const ud = { windows: [] }, lm = []; ud.litMats = lm; return { ud, lm, trim: MT(trimTex(), { tint: o.trimColor || '#dcd6c4' }), litMat: i => lm[i % 3] || (lm[i % 3] = M(BT.windowGlow(i % 3), { unlit: true })) }; };
const litList = (lit, n) => lit === true ? Array.from({ length: n }, (_, i) => i) : Array.isArray(lit) ? lit : [];

// =====================================================================================================================
// HOUSE  (suburban / farmhouse / victorian)
// =====================================================================================================================
const shellBody = (g, B, W, H, D, x, z, sm, o = {}) => { const y0 = o.y0 ?? 0, tm = B.trim, st = bM('stone', o.foundTint || '#a8a49a');
  bx(g, sm, [W, H - y0 - .3, D], [x, y0 + .3 + (H - y0 - .3) / 2, z], .64); bx(g, st, [W + .12, .42, D + .12], [x, y0 + .21, z], .8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, tm, [.13, H - y0 - .3, .13], [x + sx * (W / 2 + .005), y0 + .3 + (H - y0 - .3) / 2, z + sz * (D / 2 + .005)], 1);
  if (o.belt) bx(g, tm, [W + .08, .14, D + .08], [x, o.belt, z], 1); };
const houseColors = { suburban: { siding: '#a9a99c', trim: '#e4e0d2', roof: '#5e5650', door: '#5a3a30' }, farmhouse: { siding: '#c9c5b4', trim: '#dcd8c8', roof: '#a0705a', door: '#3a5a4a' }, victorian: { siding: '#7f8f84', trim: '#e8dcc0', roof: '#4e4658', door: '#7a2a2a' } };

// house({ style:'suburban'|'farmhouse'|'victorian', color, trimColor, roofColor, doorColor, porch, garage, lit:[window indices]|true, porchLight, flicker })
// front door faces +z, origin at the middle of the main footprint on the ground. userData: windows[{pos,normal,w,h,lit,wall,floor}], door{pos,normal}, windowLights[{pos,color}], size, roofY, chimneyTop
P.house = (o = {}) => { const style = o.style || 'suburban', C = houseColors[style] || houseColors.suburban, G = grp(), B = bctx({ trimColor: o.trimColor || C.trim }), ud = B.ud, tm = B.trim;
  const sm = bM('siding', o.color || C.siding), roofKey = style === 'farmhouse' ? 'tin' : 'shingle', roofM = bM(roofKey, o.roofColor || C.roof), deck = floorMat('wood', '#8a7a64'), stone = bM('stone', '#b0aca0');
  let lit = o.lit === true ? 'all' : new Set(Array.isArray(o.lit) ? o.lit : []); const isLit = i => lit === 'all' || lit.has(i);
  const win = k => winUnit(G, { ...k, lit: isLit(ud.windows.length) }, B);
  let W, D, H, door;
  const rail = (x0, x1, z, y, skip) => { const L = x1 - x0; bx(G, tm, [L, .08, .08], [(x0 + x1) / 2, y + .95, z], 1); bx(G, tm, [L, .06, .06], [(x0 + x1) / 2, y + .15, z], 1); for (let x = x0 + .1; x < x1; x += .22) if (!skip || x < skip[0] || x > skip[1]) bx(G, tm, [.04, .8, .04], [x, y + .55, z], 1); };
  if (style === 'suburban') { W = 9; D = 7; H = 5.2; const Hz = D / 2;
    shellBody(G, B, W, H, D, 0, 0, sm, { belt: 2.78 }); gableRoof(G, { L: W, B: D, rise: 2.1, over: .5, overG: .3, y: H, mat: roofM, gmat: sm, fascia: tm });
    for (const x of [-2.6, 2.6]) win({ x, y: 1.55, z: Hz, ry: 0, wall: 'front', floor: 0, shutters: true, shutterColor: '#4a5a58' }); for (const x of [-2.6, 0, 2.6]) win({ x, y: 4.15, z: Hz, ry: 0, wall: 'front', floor: 1, shutters: x !== 0, shutterColor: '#4a5a58' });
    for (const x of [-2.2, 2.2]) win({ x, y: 1.55, z: -Hz, ry: PI, wall: 'back', floor: 0 }); for (const x of [-2.6, 0, 2.6]) win({ x, y: 4.15, z: -Hz, ry: PI, wall: 'back', floor: 1 });
    for (const z of [.4]) win({ x: W / 2, y: 1.55, z, ry: PI / 2, wall: 'right', floor: 0 }); for (const z of [1.4, -1.6]) win({ x: W / 2, y: 4.15, z, ry: PI / 2, wall: 'right', floor: 1 }); win({ x: -W / 2, y: 4.15, z: -.5, ry: -PI / 2, wall: 'left', floor: 1 });
    door = doorUnit(G, { x: 0, y: .0, z: Hz, ry: 0, color: o.doorColor || C.door, glass: false }, B);
    if (o.porch !== false) { bx(G, deck, [3.2, .22, 1.9], [0, .11, Hz + .95], .8); bx(G, stone, [2.0, .14, .5], [0, .07, Hz + 2.15], .8); for (const s of [-1, 1]) bx(G, tm, [.16, 2.35, .16], [s * 1.4, .22 + 1.175, Hz + 1.75], 1);
      gableRoof(G, { L: 2.1, B: 3.4, rise: .62, over: .15, overG: .35, y: 2.57, x: 0, z: Hz + .95, ry: PI / 2, mat: roofM, gmat: sm, fascia: tm, tile: .7 }); rail(-1.6, -.62, Hz + 1.75, .22); rail(.62, 1.6, Hz + 1.75, .22); }
    if (o.garage !== false) { const gx = -6.2, gw = 3.5, gd = 6.0, gz = -.1, gh = 2.9; bx(G, sm, [gw, gh - .3, gd], [gx, .3 + (gh - .3) / 2, gz], .64); bx(G, stone, [gw + .12, .42, gd + .12], [gx, .21, gz], .8);
      gableRoof(G, { L: gd, B: gw, rise: 1.0, over: .4, overG: .3, y: gh, x: gx, z: gz, ry: PI / 2, mat: roofM, gmat: sm, fascia: tm });
      bx(G, bM('garage', '#d8d4c6'), [2.9, 2.1, .06], [gx, 1.05 + .05, gz + gd / 2 + .03], 1.2); bx(G, tm, [3.1, .12, .08], [gx, 2.2, gz + gd / 2 + .04], 1); for (const s of [-1, 1]) bx(G, tm, [.1, 2.2, .08], [gx + s * 1.5, 1.1, gz + gd / 2 + .04], 1);
      bx(G, MT(CONC(), { tint: '#b4b4ac' }), [3.3, .05, 9], [gx, .025, gz + gd / 2 + 4.5], .6); }
    ud.chimneyTop = chimney(G, W / 2 + .45, -.6, 0, H + 2.5, { w: .85, d: .7, tint: '#b09484' }).top; ud.roofY = H + 2.1;
  } else if (style === 'farmhouse') { W = 8; D = 6; H = 5.0; const Hz = D / 2;
    shellBody(G, B, W, H, D, 0, 0, sm, { belt: 2.6 }); gableRoof(G, { L: W, B: D, rise: 2.5, over: .55, overG: .35, y: H, mat: roofM, gmat: sm, fascia: tm, tile: .55 });
    for (const x of [-2.6, 2.6]) win({ x, y: 1.95, z: Hz, ry: 0, wall: 'front', floor: 0, h: 1.5, shutters: true, shutterColor: '#4a5a4a' }); for (const x of [-2.6, 0, 2.6]) win({ x, y: 4.1, z: Hz, ry: 0, wall: 'front', floor: 1, shutters: true, shutterColor: '#4a5a4a' });
    for (const z of [-1.2, 1.2]) { win({ x: W / 2, y: 1.6, z, ry: PI / 2, wall: 'right', floor: 0 }); win({ x: -W / 2, y: 1.6, z, ry: -PI / 2, wall: 'left', floor: 0 }); } win({ x: W / 2, y: 4.1, z: 0, ry: PI / 2, wall: 'right', floor: 1, h: 1.1 }); win({ x: -W / 2, y: 4.1, z: 0, ry: -PI / 2, wall: 'left', floor: 1, h: 1.1 });
    for (const x of [-2, 2]) { win({ x, y: 1.6, z: -Hz, ry: PI, wall: 'back', floor: 0 }); win({ x, y: 4.1, z: -Hz, ry: PI, wall: 'back', floor: 1 }); }
    door = doorUnit(G, { x: 0, y: .25, z: Hz, ry: 0, color: o.doorColor || C.door, glass: true, step: false }, B);
    if (o.porch !== false) { bx(G, deck, [W + .8, .25, 2.3], [0, .125, Hz + 1.15], .8); bx(G, stone, [2.2, .14, .5], [0, .07, Hz + 2.55], .8); const py = .25;
      for (const x of [-4.1, -2.0, 2.0, 4.1]) bx(G, tm, [.17, 2.6, .17], [x, py + 1.3, Hz + 2.15], 1);
      shedRoof(G, { L: W + .8, B: 2.3, rise: .6, over: .35, overG: .3, y: 2.85, z: Hz, mat: bM('tin', '#8a7a6a') }); rail(-4.1, -.9, Hz + 2.15, py); rail(.9, 4.1, Hz + 2.15, py);
      for (const s of [-1, 1]) { bx(G, tm, [.06, .08, 2.15], [s * 4.1, py + 1.2, Hz + 1.1], 1); }
    }
    // rear lean-to kitchen wing on the right side
    { const wx = W / 2 + 1.55, wz = -.6, wh = 3.2; bx(G, sm, [3.2, wh - .3, 3.6], [wx, .3 + (wh - .3) / 2, wz], .64); bx(G, bM('stone', '#a8a49a'), [3.32, .42, 3.72], [wx, .21, wz], .8);
      shedRoof(G, { L: 3.6, B: 3.0, rise: .9, over: .4, overG: .3, y: wh + .1, x: W / 2 - .3, z: wz, ry: PI / 2, mat: bM('tin', '#8a7a6a') }); win({ x: wx, y: 1.6, z: wz + 1.8, ry: 0, wall: 'wing', floor: 0 }); win({ x: wx + 1.6, y: 1.6, z: wz, ry: PI / 2, wall: 'wing', floor: 0 }); }
    ud.chimneyTop = chimney(G, -1.5, 0, H + .6, H + 2.5 + 1.1, { w: .95, d: .75, tint: '#b09484' }).top; ud.roofY = H + 2.5;
  } else { W = 7.5; D = 6.5; H = 6.2; const Hz = D / 2, tx = -3.1, tz = 3.05, tr = 1.45, th = H + 1.1;
    shellBody(G, B, W, H, D, 0, 0, sm, { belt: 3.2 }); gableRoof(G, { L: W, B: D, rise: 2.9, over: .5, overG: .35, y: H, mat: roofM, gmat: sm, fascia: tm, tile: .6 });
    // front cross-gable with fish-scale shingles
    gableRoof(G, { L: Hz + .05, B: 3.6, rise: 2.5, over: .4, overG: .45, y: H - .02, x: .6, z: Hz / 2, ry: PI / 2, mat: roofM, gmat: bM('scales', '#c0b8a4'), gtile: .5, fascia: tm, tile: .6 });
    win({ x: .6, y: H + 1.0, z: Hz + .04, ry: 0, wall: 'front', floor: 2, w: .7, h: .9, lintel: false });
    // octagonal corner tower
    add(cylT(tr, tr, th - .3, 8, .64), sm, tx, .3 + (th - .3) / 2, tz, G); add(cylT(tr + .08, tr + .08, .42, 8, .8), stone, tx, .21, tz, G); add(cylT(tr + .06, tr + .06, .14, 8, 1), tm, tx, 3.2, tz, G); add(cylT(tr + .06, tr + .06, .14, 8, 1), tm, tx, th - .1, tz, G);
    add(PS.rep(new THREE.ConeGeometry(tr + .5, 3.4, 8), 5, 3), roofM, tx, th + 1.7, tz, G); add(new THREE.CylinderGeometry(.04, .04, .9, 4), SOLID('#2a2428'), tx, th + 3.8, tz, G); add(new THREE.SphereGeometry(.1, 5, 4), SOLID('#2a2428'), tx, th + 4.3, tz, G);
    for (const [a, y, fl] of [[-22.5, 1.55, 0], [22.5, 1.55, 0], [-22.5, 4.35, 1], [22.5, 4.35, 1], [-67.5, 4.35, 1], [67.5, 4.35, 1]]) { const ar = a * PI / 180, ap = tr * Math.cos(PI / 8); win({ x: tx + Math.sin(ar) * ap, y, z: tz + Math.cos(ar) * ap, ry: ar, wall: 'tower', floor: fl, w: .55, h: 1.25 }); }
    // front bay + windows
    bx(G, sm, [2.6, 3.0, .8], [2.3, 1.5 + .15, Hz + .4], .64); bx(G, tm, [2.8, .2, 1.0], [2.3, 3.2, Hz + .5], 1); bx(G, stone, [2.72, .42, .92], [2.3, .21, Hz + .46], .8);
    win({ x: 2.3, y: 1.7, z: Hz + .8, ry: 0, wall: 'front', floor: 0, w: 1.1, h: 1.4 }); for (const s of [-1, 1]) win({ x: 2.3 + s * 1.3, y: 1.7, z: Hz + .4, ry: s * PI / 2, wall: 'bay', floor: 0, w: .5, h: 1.2 });
    win({ x: 2.3, y: 4.5, z: Hz, ry: 0, wall: 'front', floor: 1, h: 1.5 }); win({ x: -.3, y: 4.5, z: Hz, ry: 0, wall: 'front', floor: 1, h: 1.5 });
    for (const x of [-2, 0, 2]) { win({ x, y: 1.8, z: -Hz, ry: PI, wall: 'back', floor: 0 }); win({ x, y: 4.5, z: -Hz, ry: PI, wall: 'back', floor: 1 }); }
    for (const z of [-1.4, 1.2]) { win({ x: W / 2, y: 1.8, z, ry: PI / 2, wall: 'right', floor: 0 }); win({ x: W / 2, y: 4.5, z, ry: PI / 2, wall: 'right', floor: 1 }); } win({ x: -W / 2, y: 1.8, z: -1, ry: -PI / 2, wall: 'left', floor: 0 });
    door = doorUnit(G, { x: -.3, y: .22, z: Hz, ry: 0, color: o.doorColor || C.door, glass: true, h: 2.2, w: 1.0, step: false }, B);
    if (o.porch !== false) { const px0 = -1.45, px1 = 1.0, pw = px1 - px0, pcx = (px0 + px1) / 2; bx(G, deck, [pw + .3, .22, 1.7], [pcx, .11, Hz + .85], .8); bx(G, stone, [1.6, .14, .5], [-.3, .07, Hz + 1.95], .8);
      for (const x of [px0 + .05, px1 - .05]) { bx(G, tm, [.15, 2.55, .15], [x, .22 + 1.275, Hz + 1.55], 1); bx(G, tm, [.4, .1, .4], [x, 2.7, Hz + 1.55], 1); }
      shedRoof(G, { L: pw + .5, B: 1.7, rise: .5, over: .3, overG: .25, y: 2.75, x: pcx, z: Hz, mat: roofM }); rail(px0 + .1, -.85, Hz + 1.55, .22); rail(.25, px1 - .1, Hz + 1.55, .22); bx(G, tm, [pw, .35, .06], [pcx, 2.5, Hz + 1.58], 1); }
    ud.chimneyTop = chimney(G, -2.2, -1.8, H + .8, H + 4.4, { w: .85, d: .75, tint: '#a88c80' }).top; ud.roofY = H + 2.9; }
  if (o.porchLight || (o.lit && o.porchLight !== false)) { const px_ = door.pos.x + .85, py_ = door.pos.y + 2.05, pz_ = door.pos.z + .12; add(new THREE.SphereGeometry(.08, 5, 4), SOLID('#ffd890', { unlit: true }), px_, py_, pz_, G); bx(G, SOLID('#2a2a2a'), [.12, .2, .06], [px_, py_ + .05, pz_ - .05], 1); ud.porchLight = V3(px_, py_, pz_ + .3); }
  ud.door = door; ud.size = { w: W, d: D, h: H }; ud.style = style; ud.windowLights = ud.windows.filter(k => k.lit).map(k => ({ pos: k.pos.clone().addScaledVector(k.normal, 1.2), color: [1, .78, .45], range: 7 })); ud.bounds = { x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2 + 2 };
  ud.update = (t) => { if (!o.flicker) return; ud.litMats.forEach((m, i) => { const f = .85 + .15 * Math.sin(t * (7 + i * 3) + i) * Math.sin(t * 2.3 + i * 5); m.uniforms.tint.value.setRGB(f, f * .97, f * .9); }); };
  G.userData = ud; return bake(G); };

// =====================================================================================================================
// CABIN, CHURCH, SHACK
// =====================================================================================================================
// log helpers: a horizontal log of length len along 'x' or 'z' centred at (x,y,z); sides and end caps are collected and merged later
const logsOut = () => ({ side: [], cap: [] });
const addLog = (L, len, axis, x, y, z, r = .135, n = 8) => { const s = new THREE.CylinderGeometry(r, r, len, n, 1, true); PS.rep(s, 1, len / 1.4); if (axis === 'x') s.rotateZ(PI / 2); else s.rotateX(PI / 2); L.side.push(s.translate(x, y, z));
  for (const e of [-1, 1]) { const c = new THREE.CircleGeometry(r, n); if (axis === 'x') c.rotateY(e * PI / 2); else c.rotateY(e > 0 ? 0 : PI); const off = axis === 'x' ? [e * len / 2, 0, 0] : [0, 0, e * len / 2]; L.cap.push(c.translate(x + off[0], y + off[1], z + off[2])); } };
const flushLogs = (g, L, tint) => { if (L.side.length) add(merge(L.side), bM('bark', tint), 0, 0, 0, g); if (L.cap.length) add(merge(L.cap), bM('endgrain', tint), 0, 0, 0, g); };
// span [a,b] of a log at height yc minus the openings that cut it (ops: [{c0,c1,ya,yb}])
const spansCut = (a, b, yc, ops) => { let s = [[a, b]]; for (const op of ops) if (yc > op.ya && yc < op.yb) s = s.flatMap(([p, q]) => op.c1 <= p || op.c0 >= q ? [[p, q]] : [[p, Math.min(q, op.c0)], [Math.max(p, op.c1), q]].filter(t => t[1] - t[0] > .04)); return s; };

// cabin({ number, lit, color, roofColor, porch, shutters, flicker }) : a small log cabin with real notched-corner logs; gable end and door face +z.
// userData: door{pos,normal}, windows[{pos,normal,w,h,lit,wall}], plate (V3 centre of the number plate), windowLights, chimneyTop, size, update
P.cabin = (o = {}) => { const G = grp(), B = bctx({ trimColor: o.trimColor || '#4a3626' }), ud = B.ud, W = 4.6, D = 5.6, y0 = .3, r = .135, st = .27, tint = o.color || '#b09478', tm = B.trim, rise = 1.7, eaveY = y0 + 9 * st + .135;
  const lit = o.lit === true ? 'all' : new Set(Array.isArray(o.lit) ? o.lit : []), isLit = i => lit === 'all' || lit.has(i), L = logsOut();
  const rF = (k0, k1) => [y0 + k0 * st, y0 + k1 * st], rS = (j0, j1) => [y0 + (j0 - .5) * st, y0 + (j1 - .5) * st];
  const OPS = { front: [], back: [], left: [], right: [] }, wins = [];
  const addOp = (wall, c0, c1, ya, yb, kind) => { const op = { wall, c0, c1, ya, yb, kind }; OPS[wall].push(op); if (kind !== 'door') wins.push(op); };
  addOp('front', -.48, .48, ...rF(0, 8), 'door'); addOp('front', -1.7, -.9, ...rF(3, 6), 'win'); addOp('front', .9, 1.7, ...rF(3, 6), 'win'); addOp('right', -1.5, -.6, ...rS(3, 6), 'win'); addOp('right', .4, 1.3, ...rS(3, 6), 'win'); addOp('left', -.45, .45, ...rS(3, 6), 'win'); addOp('back', -.4, .4, ...rF(3, 6), 'win');
  // interior filler (dark chinking) + stone base
  add(new THREE.BoxGeometry(W - .1, 2.5, D - .1), SOLID('#2c1e14'), 0, y0 + 1.25, 0, G); bx(G, bM('stone', '#9a948a'), [W + .5, y0 + .06, D + .5], [0, (y0 + .06) / 2, 0], .8);
  for (let k = 0; k < 9; k++) { const y = y0 + r + k * st; for (const [wall, z] of [['front', D / 2], ['back', -D / 2]]) for (const [a, b] of spansCut(-W / 2 - .3, W / 2 + .3, y, OPS[wall])) addLog(L, b - a, 'x', (a + b) / 2, y, z); }
  for (let j = 0; j < 10; j++) { const y = y0 + j * st; for (const [wall, x] of [['right', W / 2], ['left', -W / 2]]) for (const [a, b] of spansCut(-D / 2 - .3, D / 2 + .3, y, OPS[wall])) addLog(L, b - a, 'z', x, y, (a + b) / 2); }
  for (let k = 9; ; k++) { const y = y0 + r + k * st, h = y - eaveY, len = (W + .1) * (1 - (h + .25) / rise); if (len < .4) break; for (const z of [D / 2, -D / 2]) addLog(L, len, 'x', 0, y, z); }
  flushLogs(G, L, tint);
  gableRoof(G, { L: D, B: W, rise, over: .55, overG: .6, y: eaveY, ry: PI / 2, mat: bM('shingle', o.roofColor || '#5a4a40'), gmat: SOLID('#2a1c12'), fascia: tm, tile: .6 });
  // door
  { const dg = grp(G, 0, 0, D / 2), h = 8 * st, dm = MT(doorTex(), { tint: '#4e3222' }); for (const s of [-1, 1]) bx(dg, tm, [.1, h + .1, 2 * r + .1], [s * (.48 + .05), y0 + h / 2 + .05, 0], 1); bx(dg, tm, [1.16, .12, 2 * r + .1], [0, y0 + h + .06, 0], 1);
    bx(dg, dm, [.92, h - .02, .05], [0, y0 + h / 2, -.05], 1.2); add(new THREE.SphereGeometry(.035, 5, 4), SOLID('#b8a060'), .36, y0 + 1.0, -.01, dg); add(pln(1, h, 1, 1, 2), SOLID('#120c08'), 0, y0 + h / 2, -.1, dg);
    ud.door = { pos: V3(0, y0, D / 2 + r), normal: V3(0, 0, 1), w: .96, h }; ud.plate = V3(0, y0 + 9 * st - .0 + .0, D / 2 + r + .03);
    add(decal(.5, .25, 2), MT(BT.plate(o.number ?? 12), { unlit: true, tint: '#c8c0a8' }), 0, y0 + 2.5, D / 2 + r + .045, G); bx(G, tm, [.6, .33, .03], [0, y0 + 2.5, D / 2 + r + .022], 1); }
  // windows
  for (const op of wins) { const k = wins.indexOf(op), wd = op.c1 - op.c0, hh = op.yb - op.ya, yc = (op.ya + op.yb) / 2, c = (op.c0 + op.c1) / 2, ry = { front: 0, back: PI, right: PI / 2, left: -PI / 2 }[op.wall];
    const pos = op.wall === 'front' ? [c, yc, D / 2] : op.wall === 'back' ? [c, yc, -D / 2] : op.wall === 'right' ? [W / 2, yc, c] : [-W / 2, yc, c], wg = grp(G, pos[0], pos[1], pos[2]); wg.rotation.y = ry; const lt = isLit(ud.windows.length);
    for (const s of [-1, 1]) bx(wg, tm, [.09, hh + .18, 2 * r + .1], [s * (wd / 2 + .045), 0, 0], 1); for (const s of [-1, 1]) bx(wg, tm, [wd + .18, .09, 2 * r + .1], [0, s * (hh / 2 + .045), 0], 1);
    add(decal(wd, hh, 2), lt ? B.litMat(ud.windows.length) : bM('glass'), 0, 0, -.03, wg); bx(wg, tm, [.03, hh, .03], [0, 0, .0], 1); bx(wg, tm, [wd, .03, .03], [0, hh * .08, .0], 1); bx(wg, tm, [wd + .26, .05, .17], [0, -hh / 2 - .1, r + .06], 1);
    if (o.shutters) for (const s of [-1, 1]) bx(wg, bM('louver', '#3a2a1c'), [wd / 2, hh + .1, .035], [s * (wd * .75 + .09), 0, r + .045], .5);
    ud.windows.push({ pos: V3(...pos).addScaledVector(dirN(ry), r + .05), normal: dirN(ry), w: wd, h: hh, lit: lt, wall: op.wall, index: ud.windows.length }); }
  // porch: deck, two log posts, a lean-to roof and a lantern
  if (o.porch !== false) { bx(G, bM('boards', '#8a7a66'), [W + .5, .3, 1.7], [0, .15, D / 2 + .25 + .85 + .0], .8); bx(G, bM('stone', '#a8a49a'), [1.5, .15, .5], [0, .075, D / 2 + 2.25], .8); const pl = logsOut();
    for (const s of [-1, 1]) { const px_ = s * (W / 2 - .05), pg = new THREE.CylinderGeometry(.09, .1, 2.3, 7); PS.rep(pg, 1, 1.6); add(pg, bM('bark', tint), px_, y0 + 1.15, D / 2 + 1.75, G); }
    shedRoof(G, { L: W + .5, B: 1.7, rise: .55, over: .35, overG: .3, y: y0 + 2.4, z: D / 2 + .3, mat: bM('shingle', o.roofColor || '#5a4a40') });
    if (lit !== undefined && (o.lit)) { add(new THREE.SphereGeometry(.07, 5, 4), SOLID('#ffc060', { unlit: true }), 1.5, y0 + 1.9, D / 2 + 1.7, G); ud.porchLight = V3(1.5, y0 + 1.9, D / 2 + 1.9); } }
  ud.chimneyTop = chimney(G, -W / 2 - .62, 0, 0, eaveY + rise + .35, { w: .85, d: 1.05, stone: true, tint: '#8a8478' }).top;
  ud.size = { w: W, d: D, h: eaveY + rise }; ud.number = o.number ?? 12; ud.windowLights = ud.windows.filter(k => k.lit).map(k => ({ pos: k.pos.clone().addScaledVector(k.normal, 1.0), color: [1, .78, .42], range: 6 })); ud.bounds = { x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2 + 2.3 };
  ud.update = t => { if (!o.flicker) return; ud.litMats.forEach((m, i) => { const f = .8 + .2 * Math.sin(t * (9 + i * 4) + i) * Math.sin(t * 3.1 + i * 2); m.uniforms.tint.value.setRGB(f, f * .96, f * .88); }); };
  G.userData = ud; return bake(G); };

// church({ boarded, lit, color, roofColor }) : a small weathered wooden church: nave, front tower with belfry and spire, lancet windows, boarded by default.
// userData: door{pos,normal}, windows[], bell (V3), steepleTop (V3), size, windowLights
P.church = (o = {}) => { const G = grp(), B = bctx({ trimColor: o.trimColor || '#d6d2c0' }), ud = B.ud, W = 5.4, D = 8.6, y0 = .5, H = 3.6, tm = B.trim, rise = 2.4, wallM = bM('boards', o.color || '#b8b4a2'), roofM = bM('shingle', o.roofColor || '#46423e'), stone = bM('stone', '#9a968c'), boarded = o.boarded !== false;
  const lit = o.lit === true ? 'all' : new Set(Array.isArray(o.lit) ? o.lit : []), isLit = i => lit === 'all' || lit.has(i);
  bx(G, wallM, [W, H, D], [0, y0 + H / 2, 0], .8); bx(G, stone, [W + .2, y0 + .02, D + .2], [0, (y0 + .02) / 2, 0], .8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(G, tm, [.14, H, .14], [sx * (W / 2 + .005), y0 + H / 2, sz * (D / 2 + .005)], 1); bx(G, tm, [W + .1, .14, D + .1], [0, y0 + H - .07, 0], 1);
  gableRoof(G, { L: D, B: W, rise, over: .5, overG: .35, y: y0 + H, ry: PI / 2, mat: roofM, gmat: wallM, gtile: .8, fascia: tm, tile: .6 });
  // tower
  const tz = D / 2 + .9, th = 7.0;
  bx(G, wallM, [2.4, th - y0, 2.4], [0, y0 + (th - y0) / 2, tz], .8); bx(G, stone, [2.6, y0 + .02, 2.6], [0, (y0 + .02) / 2, tz], .8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(G, tm, [.14, th - y0, .14], [sx * 1.205, y0 + (th - y0) / 2, tz + sz * 1.205], 1); bx(G, tm, [2.6, .16, 2.6], [0, th, tz], 1);
  bx(G, wallM, [2.1, 1.7, 2.1], [0, th + .08 + .85, tz], .8); bx(G, tm, [2.3, .12, 2.3], [0, th + 1.8, tz], 1);
  const bellM = SOLID('#6a5430'); add(new THREE.CylinderGeometry(.1, .3, .5, 8), bellM, 0, th + 1.15, tz, G); bx(G, SOLID('#2a1c12'), [.1, .1, 1.4], [0, th + 1.5, tz], 1);
  for (const [dx, dz, ry] of [[0, 1.06, 0], [0, -1.06, PI], [1.06, 0, PI / 2], [-1.06, 0, -PI / 2]]) { const og = grp(G, dx, th + 1.0, tz + dz); og.rotation.y = ry; add(decal(.8, 1.1, 2), SOLID('#080605', { unlit: true }), 0, 0, .01, og); for (const s of [-1, 1]) bx(og, tm, [.08, 1.2, .08], [s * .44, 0, .04], 1); bx(og, tm, [.96, .08, .08], [0, .6, .04], 1); bx(og, tm, [.96, .08, .08], [0, -.6, .04], 1); for (let i = 0; i < 4; i++) bx(og, bM('louver', '#4a4034'), [.78, .06, .02], [0, -.35 + i * .22, .02], .5, [.4, 0, 0]); }
  add(PS.rep(new THREE.ConeGeometry(1.62, 3.6, 4), 4, 3).rotateY(PI / 4), roofM, 0, th + 1.8 + 1.8 + .0, tz, G); bx(G, tm, [.07, 1.0, .07], [0, th + 3.6 + .5 + 1.5 - .0, tz], 1); bx(G, tm, [.5, .07, .07], [0, th + 3.6 + 1.2 + .5, tz], 1);
  ud.steepleTop = V3(0, th + 3.6 + 1.5 + 1.0, tz); ud.bell = V3(0, th + 1.15, tz);
  // front doors, steps, round window
  { const fz = tz + 1.2, dg = grp(G, 0, y0 - .04, fz); for (const s of [-1, 1]) bx(dg, MT(doorTex(), { tint: '#4a3228' }), [.74, 2.5, .06], [s * .38, 1.25, .0], 1.2); for (const s of [-1, 1]) bx(dg, tm, [.12, 2.6, .1], [s * .86, 1.3, .03], 1); bx(dg, tm, [1.84, .14, .1], [0, 2.57, .03], 1);
    add(tri(1.84, .7, 1, 1, 1), SOLID('#1e1814'), 0, 2.64, .005, dg); for (const s of [-1, 1]) add(new THREE.SphereGeometry(.04, 5, 4), SOLID('#b8a060'), s * .1, 1.2, .07, dg);
    for (let i = 0; i < 3; i++) bx(G, stone, [2.7 - i * .15, .17, .55], [0, .085 + i * .0 + (2 - i) * 0 + (2 - i) * .0 - .0 + 0, fz + .3 + i * .5 - 0], .8);
    ud.door = { pos: V3(0, 0, fz + .3), normal: V3(0, 0, 1), w: 1.5, h: 2.5 }; }
  { const wg = grp(G, 0, 4.9, tz + 1.2); add(new THREE.CircleGeometry(.42, 10), boarded && !isLit(0) ? bM('boards', '#3a342c') : (isLit(0) ? B.litMat(0) : bM('glass')), 0, 0, .02, wg); add(new THREE.RingGeometry(.42, .55, 10), tm, 0, 0, .025, wg); for (const a of [0, PI / 2]) bx(wg, tm, [.06, .84, .04], [0, 0, .04], 1, [0, 0, a]); ud.windows.push({ pos: V3(0, 4.9, tz + 1.25), normal: V3(0, 0, 1), w: .84, h: .84, lit: isLit(0), wall: 'front', round: true, index: 0 }); }
  // lancet windows on the nave sides
  const lancet = (x, z, ry) => { const wwd = .95, hh = 1.8, yc = 2.45, idx = ud.windows.length, lt = isLit(idx); const rec = winUnit(G, { x, y: yc, z, ry, w: wwd, h: hh, lit: lt, boarded: boarded && !lt, lintel: false, wall: ry > 0 ? 'right' : 'left' }, B); const wg = grp(G, x, yc + hh / 2, z); wg.rotation.y = ry;
    add(tri(wwd, .55, 1, 1, .6), lt ? B.litMat(idx + 1) : (boarded ? bM('boards', '#3a342c') : bM('glass')), 0, 0, .02, wg); const sl = Math.hypot(wwd / 2, .55), an = Math.atan2(.55, wwd / 2); for (const s of [-1, 1]) bx(wg, tm, [sl + .04, .08, .08], [s * wwd / 4, .275 + .02, .04], 1, [0, 0, -s * an]); rec.h = hh + .55; };
  for (const z of [-2.6, -.2, 2.2]) { lancet(W / 2, z, PI / 2); lancet(-W / 2, z, -PI / 2); }
  // rear apse
  bx(G, wallM, [2.8, 3.0, 1.9], [0, y0 + 1.5, -D / 2 - .85], .8); bx(G, stone, [3.0, y0 + .02, 2.1], [0, (y0 + .02) / 2, -D / 2 - .85], .8); gableRoof(G, { L: 1.9, B: 2.8, rise: 1.2, over: .4, overG: .3, y: y0 + 3.0, z: -D / 2 - .85, ry: PI / 2, mat: roofM, gmat: wallM, gtile: .8, fascia: tm });
  ud.size = { w: W, d: D + 2.4, h: th + 3.6 }; ud.windowLights = ud.windows.filter(k => k.lit).map(k => ({ pos: k.pos.clone().addScaledVector(k.normal, 1.2), color: [1, .78, .45], range: 6 })); ud.bounds = { x0: -W / 2, x1: W / 2, z0: -D / 2 - 1.8, z1: D / 2 + 2.9 };
  G.userData = ud; return bake(G); };

// shack({ lit, door:'closed'|'ajar', color, roofColor, boarded }) : a leaning-looking plank shack with a tin roof, stovepipe, firewood and a door you can open.
// userData: door{pos,normal,leaf,setOpen(k)}, windows[], size, windowLights, chimneyTop
P.shack = (o = {}) => { const G = grp(), B = bctx({ trimColor: o.trimColor || '#a89a84' }), ud = B.ud, W = 3.4, D = 2.8, H = 2.15, y0 = .22, tm = B.trim, wallM = bM('boards', o.color || '#8e8068'), roofM = bM('tin', o.roofColor || '#8a6a54');
  const lit = o.lit === true || (Array.isArray(o.lit) && o.lit.includes(0));
  bx(G, wallM, [W, H, D], [0, y0 + H / 2, 0], .8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { bx(G, bM('stone', '#8a867c'), [.35, y0 + .06, .35], [sx * (W / 2 - .1), (y0 + .06) / 2, sz * (D / 2 - .1)], .5); bx(G, tm, [.1, H, .1], [sx * (W / 2 + .005), y0 + H / 2, sz * (D / 2 + .005)], 1); }
  gableRoof(G, { L: W, B: D, rise: .85, over: .35, overG: .3, y: y0 + H, mat: roofM, gmat: wallM, gtile: .8, tile: .9 });
  // door (front, left of centre) as a hinged group
  const hg = grp(G, -1.15, y0, D / 2 + .005); hg.userData.keep = true; const dm = bM('boards', '#6a5a46'), lf = add(tbox(.85, 1.85, .05, { su: 1.2, sv: 1.2, seg: 2 }), dm, .425, .925, .04, hg); lf.userData.keep = true; for (const [yy, rz] of [[.3, 0], [1.55, 0]]) { const br = add(tbox(.85, .1, .03, { seg: 2 }), SOLID('#4a3e30'), .425, yy, .075, hg); br.userData.keep = true; }
  const dg = add(tbox(.07, 1.85, .03), SOLID('#4a3e30'), .1, .925, .08, hg); dg.userData.keep = true; for (const s of [-1, 1]) bx(G, tm, [.08, 1.95, .08], [-1.15 + (s < 0 ? -.03 : .88), y0 + .975, D / 2 + .04], 1); bx(G, tm, [1.0, .08, .08], [-1.15 + .425, y0 + 1.94, D / 2 + .04], 1); add(pln(.9, 1.9, 1, 1, 2), SOLID('#0a0806'), -1.15 + .425, y0 + .95, D / 2 - .02, G);
  ud.door = { pos: V3(-.72, 0, D / 2 + .3), normal: V3(0, 0, 1), w: .85, h: 1.85, leaf: hg, setOpen: k => { hg.rotation.y = -k * 1.5; } }; if (o.door === 'ajar') ud.door.setOpen(.28); else if (o.door === 'open') ud.door.setOpen(.8);
  // window
  winUnit(G, { x: .85, y: y0 + 1.35, z: D / 2 + .005, ry: 0, w: .7, h: .75, lit, boarded: o.boarded === true, lintel: false, wall: 'front', shutters: false }, B);
  // stovepipe, firewood and a leaning plank
  add(new THREE.CylinderGeometry(.08, .08, 1.3, 6), SOLID('#4a443e'), .9, y0 + H + .85 + .2, -.4, G); add(new THREE.CylinderGeometry(.15, .08, .12, 6), SOLID('#3a3630'), .9, y0 + H + 1.55 + .2, -.4, G);
  { const r2 = rng(5); for (let i = 0; i < 12; i++) { const row = i % 4, lay = i / 4 | 0; add(new THREE.CylinderGeometry(.085, .085, .45, 6), bM('bark', '#a08868'), W / 2 + .3 + lay * .0, .09 + lay * .17, -1.0 + row * .19 + (lay % 2) * .09, G).rotation.z = PI / 2 + (r2() - .5) * .1; } }
  ud.size = { w: W, d: D, h: y0 + H + .85 }; ud.windowLights = ud.windows.filter(k => k.lit).map(k => ({ pos: k.pos.clone().addScaledVector(k.normal, 1.0), color: [1, .75, .4], range: 5 })); ud.chimneyTop = V3(.9, y0 + H + 1.9, -.4);
  G.userData = ud; return bake(G); };

// =====================================================================================================================
// TREES AND FORESTS
// =====================================================================================================================
BT.pine = () => TX('pine', 16, 16, (q, w, h, r) => { fillAll(q, '#1a3222', w, h); spk(q, w, h, r, '#0f2016', 100, .9); spk(q, w, h, r, '#27472f', 70, .8); for (let i = 0; i < 16; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, '#34593c', x, y, 1, 1); px(q, '#34593c', x + 1, y + 1, 1, 1); px(q, '#0b1810', x + 1, y, 1, 1); } }, { mip: true });
BT.pineSnow = () => TX('pinesnow', 16, 16, (q, w, h, r) => { fillAll(q, '#1a3222', w, h); spk(q, w, h, r, '#0f2016', 60, .9); spk(q, w, h, r, '#27472f', 40, .8); for (let i = 0; i < 40; i++) { const x = r() * w | 0, y = r() * h | 0; px(q, pick(r, ['#e8eef4', '#cdd8e4', '#f6f8fc']), x, y, 2 + (r() * 3 | 0), 1 + (r() * 2 | 0)); } }, { mip: true });
BT.leafy = () => TX('leafy', 16, 16, (q, w, h, r) => { fillAll(q, '#2c4423', w, h); spk(q, w, h, r, '#1c3017', 100, .9); spk(q, w, h, r, '#44603122'.slice(0,7), 80, .8); for (let i = 0; i < 12; i++) px(q, '#58763a', r() * w | 0, r() * h | 0, 2, 1); }, { mip: true });
const _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _mid = new THREE.Vector3(), _qq = new THREE.Quaternion(), _mm = new THREE.Matrix4(), _one = new THREE.Vector3(1, 1, 1);
// a cylinder segment from point a to point b (THREE.Vector3), radii r0 at a and r1 at b
const segGeo = (a, b, r0, r1, n = 5, cap = true) => { _d.subVectors(b, a); const len = _d.length(); const g = new THREE.CylinderGeometry(r1, r0, len, n, 1, !cap); PS.rep(g, 1, Math.max(.3, len / 1.4)); _mid.addVectors(a, b).multiplyScalar(.5); _qq.setFromUnitVectors(_up, _d.normalize()); return g.applyMatrix4(_mm.compose(_mid, _qq, _one)); };
const pineGeo = (h, r, o = {}) => { const fol = [], bark = [], tiers = o.tiers ?? Math.max(4, Math.round(h / 1.7)), r0 = o.R ?? Math.max(1.3, h * .21), yc = h * (o.clear ?? .14), tr = Math.max(.12, h * .02), n = o.sides ?? 7;
  const tk = new THREE.CylinderGeometry(tr * .3, tr, h * .92, 6); PS.rep(tk, 1, h * .92 / 1.4); bark.push(tk.translate(0, h * .46, 0));
  for (let i = 0; i < tiers; i++) { const t = i / tiers, yb = yc + (h - yc) * t * .9, ht = (h - yc) / tiers * 2.3, R = r0 * Math.pow(1 - t, .85) + .22, jit = Array.from({ length: n }, () => .8 + r() * .4);
    const g = new THREE.CylinderGeometry(R * .08, R, ht, n, 1, false), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), z = p.getZ(k), rr = Math.hypot(x, z); if (rr > 1e-4) { const ai = (Math.round(Math.atan2(x, z) / (TAU / n)) + n * 4) % n, f = p.getY(k) < 0 ? jit[ai] : 1; p.setX(k, x * f); p.setZ(k, z * f); if (p.getY(k) < 0) p.setY(k, p.getY(k) + (jit[ai] - 1) * ht * .5); } }
    PS.rep(g, Math.max(2, Math.round(R * TAU / 1.8)), Math.max(1, Math.hypot(ht, R) / 1.8)); g.rotateY(r() * TAU).translate(0, yb + ht / 2, 0); fol.push(g); }
  return { fol, bark }; };
const deadGeo = (h, r, o = {}) => { const bark = [], V = (x, y, z) => new THREE.Vector3(x, y, z), rb = Math.max(.1, h * .03), lean = (r() - .5) * h * .12;
  const pts = [V(0, 0, 0), V(lean * .3, h * .3, (r() - .5) * .3), V(lean * .8, h * .6, (r() - .5) * .5), V(lean, h * .92, (r() - .5) * .5)];
  bark.push(new THREE.CylinderGeometry(rb * 1.02, rb * 1.55, .45, 6).translate(0, .22, 0)); for (let i = 0; i < 3; i++) bark.push(segGeo(pts[i], pts[i + 1], rb * (1 - i * .27), rb * (1 - (i + 1) * .27), 6));
  const limb = (a, dir, len, rad, depth) => { const mid = a.clone().addScaledVector(dir, len * .55).add(V((r() - .5) * len * .25, (r() - .2) * len * .2, (r() - .5) * len * .25)), end = mid.clone().addScaledVector(dir.clone().add(V((r() - .5) * .6, (r() - .3) * .5, (r() - .5) * .6)).normalize(), len * .5); bark.push(segGeo(a, mid, rad, rad * .7, 4), segGeo(mid, end, rad * .7, rad * .25, 4));
    if (depth > 0) for (let k = 0; k < 2; k++) limb(mid.clone(), dir.clone().applyAxisAngle(_up, (k ? 1 : -1) * (.7 + r() * .6)).add(V(0, .25, 0)).normalize(), len * .55, rad * .5, depth - 1); };
  const nb = o.branches ?? 7; for (let i = 0; i < nb; i++) { const t = .35 + .6 * (i / nb), y = h * t, a = i * 2.4 + r() * 1.2, el = .55 + r() * .8, dir = V(Math.sin(a) * Math.sin(el), Math.cos(el) * .8 + .15, Math.cos(a) * Math.sin(el)).normalize(), p = V(lean * t, y, 0);
    limb(p, dir, h * (.3 - t * .12) * (.8 + r() * .5), rb * .42 * (1.1 - t * .5), 1); }
  limb(pts[3].clone(), V(.15, 1, .05).normalize(), h * .14, rb * .3, 0); return { fol: [], bark }; };
const treeMats = o => ({ fol: bM(o.snow ? 'pineSnow' : (o.kind === 'leafy' ? 'leafy' : 'pine'), o.tint), bark: bM(o.kind === 'dead' ? 'grayBark' : 'bark', o.kind === 'dead' ? '#d8d4cc' : '#c8b8a8') });
// pine({ h, seed, snow, tint }) / deadTree({ h, seed }) : single trees (pines are ~9 m by default)
P.pine = (o = {}) => { const h = o.h ?? 9, r = rng(o.seed ?? 3), g = grp(), t = pineGeo(h, r, o), m = treeMats({ ...o, kind: 'pine' }); add(merge(t.bark), m.bark, 0, 0, 0, g); add(merge(t.fol), m.fol, 0, 0, 0, g); g.userData = { height: h }; return g; };
P.deadTree = (o = {}) => { const h = o.h ?? 7, r = rng(o.seed ?? 5), g = grp(), t = deadGeo(h, r, o), m = treeMats({ kind: 'dead' }); add(merge(t.bark), m.bark, 0, 0, 0, g); g.userData = { height: h }; return g; };

// forest({ radius, count, seed, kind:'pine'|'dead'|'mixed'|'leafy', clearing, minH, maxH, snow, undergrowth, spacing, heightAt })
// Trees scattered between the clearing and the radius; geometry is merged into a handful of meshes. clearing: number (radius around the origin) or [{x,z,r}].
// userData.trees = [{x,z,h,kind}] so scenes can hide things behind trunks; userData.update(t) is not needed (static).
P.forest = (o = {}) => { const R = o.radius ?? 40, N = o.count ?? 140, seed = o.seed ?? 1, kind = o.kind || 'pine', r = rng(seed), g = grp(), hAt = o.heightAt || (() => 0);
  const clears = Array.isArray(o.clearing) ? o.clearing : (o.clearing ? [{ x: 0, z: 0, r: o.clearing }] : []), spacing = o.spacing ?? 2.6, placed = [], vars = { pine: [], dead: [], leafy: [] };
  const variant = (k, hh) => { const list = vars[k], i = Math.floor(r() * 5); if (!list[i]) { const rr = rng(seed * 31 + i * 7 + hash(k)); list[i] = k === 'dead' ? deadGeo(6.5, rr) : k === 'leafy' ? (() => { const t = pineGeo(7, rr, { tiers: 3, sides: 6, R: 2.6, clear: .3 }); return t; })() : pineGeo(8, rr, { tiers: 5 + (i % 3) }); list[i].h0 = k === 'dead' ? 6.5 : k === 'leafy' ? 7 : 8; } return list[i]; };
  const out = { fol: { pine: [], leafy: [] }, bark: { pine: [], dead: [] } }, trees = [], mx = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), ax = new THREE.Vector3(0, 1, 0);
  let tries = 0; while (trees.length < N && tries < N * 30) { tries++; const a = r() * TAU, rr = Math.sqrt(lerp((o.inner ?? 0) ** 2, R * R, r())), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (clears.some(c => Math.hypot(x - c.x, z - c.z) < c.r)) continue; if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < spacing)) continue;
    const k = kind === 'mixed' ? (r() < .35 ? 'dead' : 'pine') : kind, hh = k === 'dead' ? (o.minH ?? 5) + r() * ((o.maxH ?? 9) - (o.minH ?? 5)) : (o.minH ?? 7) + r() * ((o.maxH ?? 13) - (o.minH ?? 7)), v = variant(k, hh), s = hh / v.h0, y = hAt(x, z);
    mx.compose(ps.set(x, y - .05, z), q4.setFromAxisAngle(ax, r() * TAU), sc.set(s * (.85 + r() * .3), s, s * (.85 + r() * .3)));
    for (const b of v.bark) out.bark[k === 'dead' ? 'dead' : 'pine'].push(b.clone().applyMatrix4(mx)); for (const f of v.fol) out.fol[k === 'leafy' ? 'leafy' : 'pine'].push(f.clone().applyMatrix4(mx)); placed.push([x, z]); trees.push({ x, z, h: hh, kind: k }); }
  const mp = treeMats({ snow: o.snow, kind: 'pine', tint: o.tint }), md = treeMats({ kind: 'dead' }), ml = treeMats({ kind: 'leafy', tint: o.tint });
  if (out.bark.pine.length) add(merge(out.bark.pine), mp.bark, 0, 0, 0, g); if (out.bark.dead.length) add(merge(out.bark.dead), md.bark, 0, 0, 0, g); if (out.fol.pine.length) add(merge(out.fol.pine), mp.fol, 0, 0, 0, g); if (out.fol.leafy.length) add(merge(out.fol.leafy), ml.fol, 0, 0, 0, g);
  // undergrowth: bushes, rocks, fallen logs
  if (o.undergrowth !== false) { const bu = [], ro = [], lg = [], u = rng(seed + 99), nU = Math.round(N * .7); for (let i = 0; i < nU; i++) { const a = u() * TAU, rr = Math.sqrt(lerp(0, R * R, u())), x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (clears.some(c => Math.hypot(x - c.x, z - c.z) < c.r * .8)) continue; const y = hAt(x, z), t = u();
      if (t < .5) { const s = .5 + u() * .9, b = new THREE.IcosahedronGeometry(s, 0); PS.rep(b, 1, 1); b.scale(1, .7, 1).rotateY(u() * TAU).translate(x, y + s * .35, z); bu.push(b); }
      else if (t < .8) { const s = .25 + u() * .5, b = new THREE.IcosahedronGeometry(s, 0); b.scale(1.2, .6, 1).rotateY(u() * TAU).translate(x, y + s * .25, z); PS.rep(b, 1, 1); ro.push(b); }
      else { const len = 1.6 + u() * 2.4, c = new THREE.CylinderGeometry(.14, .17, len, 6); PS.rep(c, 1, len / 1.4); c.rotateZ(PI / 2 + (u() - .5) * .1).rotateY(u() * TAU).translate(x, y + .15, z); lg.push(c); } }
    if (bu.length) add(merge(bu), kind === 'dead' ? bM('leafy', '#a8946a') : bM(o.snow ? 'pineSnow' : 'leafy', '#88a078'), 0, 0, 0, g); if (ro.length) add(merge(ro), bM('stone', '#8a867c'), 0, 0, 0, g); if (lg.length) add(merge(lg), bM('bark', '#8a7a68'), 0, 0, 0, g); }
  g.userData = { trees, radius: R, count: trees.length }; g.children.forEach(c => c.frustumCulled = false); return g; };

// =====================================================================================================================
// SMALL OUTDOOR PROPS: fence, streetLamp, mailbox, gravestone, well, pipe
// =====================================================================================================================
BT.wire = () => TX('wire', 16, 16, (q, w, h) => { q.clearRect(0, 0, w, h); for (let i = -h; i < w + h; i += 8) { for (let k = 0; k < h; k++) { px(q, '#b4b8b8', (i + k) % w < 0 ? 0 : (i + k) % w, k, 1, 1); px(q, '#b4b8b8', ((i - k) % w + w) % w, k, 1, 1); } } });
BT.rustMetal = () => TX('rustmetal', 8, 8, (q, w, h, r) => { fillAll(q, '#6a5a4c', w, h); spk(q, w, h, r, '#8a5a36', 24, .8); spk(q, w, h, r, '#3a3430', 14, .8); for (let i = 0; i < 2; i++) px(q, '#5a3a24', r() * w | 0, r() * h | 0, 1, 3); }, { mip: true });
BT.pipeConcrete = () => TX('pipeconc', 16, 16, (q, w, h, r) => { fillAll(q, '#8e8c84', w, h); spk(q, w, h, r, '#74726a', 90, .8); spk(q, w, h, r, '#a8a69c', 60, .7); px(q, '#6a665e', 0, 7, w, 1); for (let i = 0; i < 3; i++) { const x = r() * w | 0; for (let y = 0; y < 5 + r() * 9; y++) px(q, 'rgba(100,70,40,.4)', x, y, 1, 1); } for (let i = 0; i < 5; i++) px(q, '#4c5a38', r() * w | 0, r() * h | 0, 2, 1); }, { mip: true });
BT.pipeInside = () => TX('pipein', 8, 32, (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a5048'); g.addColorStop(.07, '#2e2824'); g.addColorStop(.2, '#0c0a09'); g.addColorStop(1, '#000000'); q.fillStyle = g; q.fillRect(0, 0, w, h); spk(q, w, 6, r, '#8a7a6a', 6, .4); });
BT.wellShaft = () => TX('wellshaft', 16, 32, (q, w, h, r) => { for (let y = 0; y < 32; y += 5) for (let x = (y / 5 % 2) * 4; x < w + 4; x += 8) { const v = 100 + r() * 40 | 0; px(q, `rgb(${v},${v - 4},${v - 10})`, x, y, 7, 4); } px(q, '#2a2822', 0, 0, 1, 1); const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(0,0,0,.55)'); g.addColorStop(.85, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,1)'); q.fillStyle = g; q.fillRect(0, 0, w, h); });
BT.granite = () => TX('granite', 16, 16, (q, w, h, r) => { fillAll(q, '#7e7e7a', w, h); spk(q, w, h, r, '#6a6a66', 80, .8); spk(q, w, h, r, '#9a9a94', 60, .8); spk(q, w, h, r, '#3a3a38', 14, .8); for (let i = 0; i < 7; i++) px(q, '#56663e', r() * w | 0, 11 + r() * 5 | 0, 1 + (r() * 2 | 0), 1); }, { mip: true });
const stoneText = (text, shape) => TX('gtext' + shape + text, 64, 96, (q, w, h) => { q.clearRect(0, 0, w, h); const lines = String(text).split('\n'); q.fillStyle = '#26262a'; q.textAlign = 'center'; q.textBaseline = 'middle'; let y = shape === 'round' ? 44 : 30;
  lines.forEach((ln, i) => { let fs = i === 0 ? 14 : 11; q.font = `bold ${fs}px "Times New Roman", serif`; while (q.measureText(ln).width > 54 && fs > 5) { fs--; q.font = `bold ${fs}px "Times New Roman", serif`; } q.fillText(ln, w / 2 + .5, y); q.fillStyle = 'rgba(255,255,255,.25)'; q.fillText(ln, w / 2 - .5, y - 1); q.fillStyle = '#26262a'; y += fs + 5; });
  px(q, '#26262a', 31, 10, 2, 10); px(q, '#26262a', 28, 13, 8, 2); });

// fence({ length, style:'picket'|'wire'|'wood', height, broken(0-1), color }) : a fence centred on x, running along x, picket side facing +z
P.fence = (o = {}) => { const L = o.length ?? 8, style = o.style || 'picket', g = grp(), r = rng(o.seed ?? 9), brk = o.broken ?? 0, parts = {};
  const part = (mat, geo) => (parts[mat.uuid] = parts[mat.uuid] || { mat, geos: [] }).geos.push(geo);
  const box = (m, w, h, d, x, y, z, rot, tile = .5) => { const b = tbox(w, h, d, { su: 1 / tile, sv: 1 / tile, seg: 3 }); if (rot) xf(b, [x, y, z], rot); else b.translate(x, y, z); part(m, b); };
  if (style === 'picket') { const H = o.height ?? 1.05, wm = bM('boards', o.color || '#d4d0c0'), n = Math.round(L / 2.4), step = L / n;
    for (let i = 0; i <= n; i++) box(wm, .11, H + .25, .11, -L / 2 + i * step, (H + .25) / 2, 0, null, .36); for (const y of [.28, H - .22]) box(wm, L, .08, .04, 0, y, -.075, null, .36);
    for (let x = -L / 2 + .12; x < L / 2 - .05; x += .17) { if (r() < brk * .35) continue; const lean = (r() - .5) * brk * .5, hh = H * (r() < brk * .3 ? .7 : 1); box(wm, .09, hh, .025, x, hh / 2 + .02, .04, [0, 0, lean], .36); const tp = new THREE.ConeGeometry(.065, .1, 4); xf(tp, [x - Math.sin(lean) * hh / 2 * 0 + Math.sin(-lean) * hh / 2, hh + .07, .04], [0, PI / 4, lean]); PS.rep(tp, 1, 1); part(wm, tp); } }
  else if (style === 'wire') { const H = o.height ?? 1.8, mm = bM('rustMetal', o.color || '#b8b8b0'), n = Math.max(1, Math.round(L / 3)), step = L / n;
    for (let i = 0; i <= n; i++) { const p = new THREE.CylinderGeometry(.04, .045, H + .2, 6).translate(-L / 2 + i * step, (H + .2) / 2, 0); part(mm, p); } part(mm, new THREE.CylinderGeometry(.03, .03, L, 5).rotateZ(PI / 2).translate(0, H + .02, 0)); part(mm, new THREE.CylinderGeometry(.02, .02, L, 5).rotateZ(PI / 2).translate(0, .12, 0));
    for (let k = 0; k < 3; k++) part(mm, new THREE.CylinderGeometry(.008, .008, L, 3).rotateZ(PI / 2).translate(0, H + .25 + k * .1, 0));
    const mesh = add(PS.rep(new THREE.PlaneGeometry(L, H, Math.max(1, Math.round(L / 1.5)), 1), L / 1.0, H / 1.0), MT(bT('wire'), { side: THREE.DoubleSide }), 0, H / 2 + .1, 0, g); mesh.userData.keep = true; if (brk > 0) { const hole = new THREE.Mesh(new THREE.PlaneGeometry(.001, .001), mesh.material); void hole; } }
  else { const H = o.height ?? 1.3, wm = bM('boards', o.color || '#8e8472'), n = Math.round(L / 2.6), step = L / n;
    for (let i = 0; i <= n; i++) { box(wm, .14, H, .14, -L / 2 + i * step, H / 2, 0, [0, 0, (r() - .5) * brk * .3], .4); }
    for (let i = 0; i < n; i++) for (const y of [H * .4, H * .72, H * .96]) { if (r() < brk * .4) continue; const sag = (r() - .5) * brk * .15; box(wm, step + .1, .1, .05, -L / 2 + (i + .5) * step, y, .09, [0, 0, sag], .4); } }
  for (const k of Object.values(parts)) add(merge(k.geos), k.mat, 0, 0, 0, g); g.userData = { length: L, style }; return g; };

// streetLamp({ lit, height, color }) : a metal pole with a curved arm and lamp head reaching toward +x. userData.lightPos is where to put a PS1.light().
P.streetLamp = (o = {}) => { const g = grp(), H = o.height ?? 5.2, mm = bM('rustMetal', o.color || '#6a7068'), lit = o.lit !== false;
  add(new THREE.CylinderGeometry(.16, .2, .5, 8), mm, 0, .25, 0, g); add(new THREE.CylinderGeometry(.06, .1, H, 8), mm, 0, H / 2, 0, g); add(new THREE.CylinderGeometry(.11, .11, .14, 8), mm, 0, 1.2, 0, g);
  const a = V3(0, H, 0), b = V3(.5, H + .35, 0), c = V3(1.35, H + .28, 0); add(segGeo(a, b, .055, .045, 6), mm, 0, 0, 0, g); add(segGeo(b, c, .045, .04, 6), mm, 0, 0, 0, g);
  const hx = 1.45; add(tbox(.62, .1, .34, { seg: 3 }), mm, hx, H + .26, 0, g); add(PS.rep(new THREE.ConeGeometry(.34, .16, 4), 1, 1).rotateY(PI / 4), mm, hx, H + .39, 0, g);
  add(decal(.5, .26, 1).rotateX(PI / 2), lit ? SOLID('#ffd98a', { unlit: true }) : bM('glass'), hx, H + .205, 0, g); for (const s of [-1, 1]) add(tbox(.03, .12, .3, { seg: 3 }), mm, hx + s * .27, H + .18, 0, g);
  g.userData = { lit, height: H, lightPos: V3(hx, H - .15, 0), lightColor: [1, .82, .5], lightRange: 9 }; return bake(g); };

// mailbox({ flag, number, color }) : a post with an arched rural mailbox. userData.flag is the red flag group (rotate z to raise it).
P.mailbox = (o = {}) => { const g = grp(), wm = bM('boards', '#8a7e6a'), mm = SOLID(o.color || '#3c4650'), flagM = SOLID('#a83228');
  bx(g, wm, [.1, 1.2, .1], [0, .6, 0], .36); bx(g, wm, [.1, .08, .42], [0, 1.1, .16], .36);
  bx(g, mm, [.24, .12, .52], [0, 1.22, .24], 1); const arch = new THREE.CylinderGeometry(.12, .12, .52, 8); PS.rep(arch, 1, 1); arch.rotateX(PI / 2).scale(1, 1, 1); add(arch, mm, 0, 1.28, .24, g); add(new THREE.CircleGeometry(.12, 8), SOLID('#1a1c20'), 0, 1.28, .5, g);
  const fg = grp(g, .13, 1.27, .08); bx(fg, mm, [.02, .02, .06], [0, 0, 0], 1); const fl = bx(fg, flagM, [.02, .14, .06], [0, .07, -.02], 1); fg.rotation.z = o.flag ? 0 : -PI / 2 + .0; fg.rotation.z = o.flag ? 0 : -1.5; fg.userData.keep = true; fl.userData.keep = true;
  if (o.number !== undefined) add(decal(.2, .1, 1), MT(BT.plate(o.number), { tint: '#d8d0b8' }), .126, 1.25, .3, g).rotation.y = PI / 2;
  g.userData = { flag: fg, setFlag(k) { fg.rotation.z = -1.5 * (1 - k); } }; return bake(g); };

// gravestone({ text, shape:'round'|'slab'|'cross'|'obelisk', lean, mossy }) : text uses \n for lines. Origin at the base centre, face toward +z.
P.gravestone = (o = {}) => { const g = grp(), shape = o.shape || 'round', text = o.text ?? 'REST IN PEACE', gm = bM('granite', o.tint), tex = stoneText(text, shape), tm = MT(tex, { tint: '#ffffff' });
  const body = grp(g, 0, 0, 0); body.rotation.z = o.lean ?? 0; body.rotation.x = o.tilt ?? 0; bx(body, gm, [.85, .14, .42], [0, .07, 0], .6);
  if (shape === 'round') { bx(body, gm, [.62, .62, .13], [0, .14 + .31, 0], .6); const cp = new THREE.CylinderGeometry(.31, .31, .13, 10); PS.rep(cp, 1, 1); cp.rotateX(PI / 2); add(cp, gm, 0, .76, 0, body); add(decal(.54, .81, 2), tm, 0, .55, .068, body); }
  else if (shape === 'slab') { bx(body, gm, [.66, .95, .12], [0, .14 + .475, 0], .6); add(decal(.54, .81, 2), tm, 0, .58, .062, body); }
  else if (shape === 'cross') { bx(body, gm, [.2, 1.05, .14], [0, .14 + .525, 0], .6); bx(body, gm, [.6, .2, .14], [0, .14 + .78, 0], .6); add(decal(.2, .5, 1), tm, 0, .5, .072, body); }
  else { const ob = new THREE.CylinderGeometry(.14, .3, 1.5, 4); PS.rep(ob, 2, 2); ob.rotateY(PI / 4); add(ob, gm, 0, .14 + .75, 0, body); bx(body, gm, [.42, .1, .42], [0, .19, 0], .6); add(decal(.3, .4, 1), tm, 0, .45, .26, body); }
  g.userData = { shape, text }; return bake(g); };

// well({ open, lid }) : a stone well with a timber frame, roof, rope and bucket. open:true = lid off, dark shaft visible. userData.setLid(k): 0 = closed .. 1 = off; userData.shaftTop / shaftBottom anchors.
P.well = (o = {}) => { const g = grp(), stone = bM('stone', '#a8a49a'), wood = bM('boards', '#6e6250'), R = .78, Hh = .95, shaftD = 4.2;
  add(PS.rep(new THREE.CylinderGeometry(R + .06, R + .06, Hh, 10, 1, true), 3, 1.4), stone, 0, Hh / 2, 0, g); add(PS.rep(new THREE.CylinderGeometry(R + .35, R + .4, .1, 10), 4, 1), bM('stone', '#8a867a'), 0, .05, 0, g);
  add(new THREE.RingGeometry(.58, R + .06, 10).rotateX(-PI / 2), stone, 0, Hh + .001, 0, g); const sh = inward(PS.rep(new THREE.CylinderGeometry(.58, .58, shaftD, 10, 6, true), 3, 5)); add(sh, MT(bT('wellShaft'), { side: THREE.BackSide }), 0, Hh - shaftD / 2, 0, g);
  add(new THREE.CircleGeometry(.58, 10).rotateX(-PI / 2), SOLID('#06090f', { unlit: true }), 0, Hh - shaftD + .1, 0, g); add(new THREE.CircleGeometry(.3, 6).rotateX(-PI / 2), SOLID('#1a2a3a', { unlit: true }), .08, Hh - shaftD + .105, 0, g);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .15; bx(g, stone, [.3, .1, .22], [Math.sin(a) * (R - .02), Hh + .05, Math.cos(a) * (R - .02)], .6, [0, a, 0]); }
  // frame, crossbeam with crank, tiny roof
  for (const s of [-1, 1]) bx(g, wood, [.12, 2.1, .12], [s * (R + .15), Hh + 1.05 - .0, 0], .36); bx(g, wood, [R * 2 + .5, .12, .12], [0, Hh + 1.9, 0], .36); bx(g, wood, [R * 2 + .1, .08, .08], [0, Hh + 1.2, 0], .36, [0, 0, 0]);
  const crank = new THREE.CylinderGeometry(.07, .07, R * 2 - .1, 6); crank.rotateZ(PI / 2); add(crank, wood, 0, Hh + 1.55, 0, g); bx(g, wood, [.06, .06, .35], [R + .2, Hh + 1.55, .15], .3);
  const roof = gableRoof(g, { L: 1.4, B: R * 2 + .9, rise: .5, over: .2, overG: .2, y: Hh + 1.98, ry: 0, mat: bM('shingle', '#4e463e'), gmat: null, tile: .5 }); roof.rotation.y = PI / 2 * 0;
  const rope = add(new THREE.CylinderGeometry(.015, .015, 1.0, 4), SOLID('#8a7a5a'), 0, Hh + 1.05, 0, g); const bucket = add(new THREE.CylinderGeometry(.17, .13, .24, 8, 1, false), wood, 0, Hh + .45, 0, g); bucket.userData.keep = true; rope.userData.keep = true;
  const lid = grp(g, 0, Hh + .05, 0); lid.userData.keep = true; const ld = add(PS.rep(new THREE.CylinderGeometry(R + .03, R + .03, .07, 10), 2, .5), wood, 0, 0, 0, lid), bat = add(tbox(R * 2 + .1, .05, .16, { seg: 3 }), SOLID('#4a4034'), 0, .06, 0, lid); ld.userData.keep = true; bat.userData.keep = true;
  const setLid = k => { lid.position.set(k * 1.5, Hh + .05 - k * (Hh - .45), k * .25); lid.rotation.set(0, k * .5, k * 1.2); rope.visible = bucket.visible = k > .5; };
  setLid(o.open ? 1 : (o.lid ?? 0));
  g.userData = { setLid, lid, shaftTop: V3(0, Hh, 0), shaftBottom: V3(0, Hh - shaftD, 0), radius: .58, depth: shaftD, height: Hh }; return bake(g); };

// pipe({ diameter, tilt, kind:'concrete'|'steel', visible }) : a big culvert pipe sticking out of a dirt mound, leaning toward +x. userData.mouth is the centre of the opening, userData.axis points out of it.
P.pipe = (o = {}) => { const g = grp(), d = o.diameter ?? 1.3, R = d / 2, tilt = (o.tilt ?? 35) * PI / 180, Lv = o.visible ?? 2.5, Lb = 2.2, len = Lv + Lb, steel = o.kind === 'steel', axis = V3(Math.sin(tilt), Math.cos(tilt), 0), outer = steel ? bM('rustMetal', '#a89888') : bM('pipeConcrete', '#c8c4b8');
  const pg = grp(g, 0, 0, 0); pg.position.copy(axis.clone().multiplyScalar((Lv - Lb) / 2)); pg.rotation.z = -tilt;
  const o1 = PS.rep(new THREE.CylinderGeometry(R, R, len, 12, 5, true), 3, len / 1.6), i1 = inward(PS.rep(new THREE.CylinderGeometry(R - .1, R - .1, len, 12, 5, true), 1, 1)); add(o1, outer, 0, 0, 0, pg); add(i1, MT(bT('pipeInside'), { side: THREE.BackSide, unlit: false }), 0, 0, 0, pg);
  add(new THREE.RingGeometry(R - .1, R, 12).rotateX(-PI / 2), outer, 0, len / 2 + .001, 0, pg); add(new THREE.CircleGeometry(R - .09, 12).rotateX(-PI / 2), SOLID('#000000', { unlit: true }), 0, 1.25 - (Lv - Lb) / 2, 0, pg);
  if (steel) for (let y = -len / 2 + .3; y < len / 2; y += .3) add(new THREE.TorusGeometry(R + .005, .03, 4, 12).rotateX(PI / 2), outer, 0, y, 0, pg); else { for (const y of [len / 2 - .12, len / 2 - 1.2]) add(new THREE.CylinderGeometry(R + .05, R + .05, .12, 12, 1, true), outer, 0, y, 0, pg); }
  // dirt mound + rubble
  add(PS.rep(new THREE.CylinderGeometry(R * .9, R * 2.9, .7, 9, 2, true), 3, 1), bM('stone', '#6a5a44'), -.15, .3, 0, g); const gm = groundTex('dirt'); add(PS.rep(new THREE.CylinderGeometry(R * 2.2, R * 3.4, .2, 9, 1, true), 3, 1), MT(gm, { tint: '#8a7a68' }), -.15, .1, 0, g); add(PS.rep(new THREE.RingGeometry(R * 1.75, R * 2.3, 9), 2, 2).rotateX(-PI / 2), MT(gm, { tint: '#8a7a68' }), -.15, .205, 0, g);
  { const rr = rng(21); for (let i = 0; i < 7; i++) { const a = rr() * TAU, rad = R * (1.6 + rr() * 1.7), s = .15 + rr() * .3, b = new THREE.IcosahedronGeometry(s, 0); add(b.scale(1.2, .65, 1), bM('stone', '#8a867a'), Math.cos(a) * rad - .1, s * .3, Math.sin(a) * rad, g); } }
  g.userData = { mouth: axis.clone().multiplyScalar(Lv), axis, radius: R - .1, tilt }; return bake(g); };

PS.placesKit = { tbox, pln, decal, tri, holeWall, merge, bake, gableRoof, shedRoof, winUnit, doorUnit, chimney, xf, TX, MT, SOLID, bM, bx, bctx };

// __END__
})();
