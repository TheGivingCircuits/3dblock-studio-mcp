// THE SETS LIBRARY (Phase 4): reusable PS1 sets. core.js holds the shared tiny textures, the builders' helpers and the registries every kit
// writes to: SETS.fx (life that animates as a pure function of t: grass, trees, birds, dust), SETS.solids (what props collide with, for
// lib/physics.js), SETS.keepOuts (floor areas the set dresser must leave clear). Kits: nature.js (moved in from the Hitchhiker detail pass),
// vehicles.js, rooms.js, exteriors.js, horror.js, dress.js. Pages load lib/sets/all.js (build.mjs bundles them in that order).
// Nature and life are on by default: every kit adds its own (pass life: false to leave it out).
(function () {
// spaces (rooms and their acoustics), vehicles, swinging things and noise emitters are registered for the sound scan (lib/sound-scan.js)
const S = window.SETS = { fx: [], solids: [], keepOuts: [], anchors: {}, spaces: [], vehicles: [], swings: [], emits: [] };
S.emit = (kind, obj, t, on = true) => { if (on) S.emits.push({ kind, obj, t }); };
const { V, rng } = PS1, tex = PS1.tex, noise = PS1.noise;
S.V = V; S.rng = rng; S.DS = { side: THREE.DoubleSide };
S.M = (t, o) => PS1.mat(t, o); S.add = PS1.add; S.box = PS1.box; S.cyl = PS1.cyl; S.grp = PS1.group;
S.offset = (m, f) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = f * 2; return m; };
S.plane = (w, h, mat, x, y, z, rx = 0, ry = 0, parent) => { const m = PS1.add(PS1.rep(new THREE.PlaneGeometry(w, h, Math.max(1, Math.ceil(w / 2)), Math.max(1, Math.ceil(h / 2))), Math.max(1, w / 1.5), Math.max(1, h / 1.5)), mat, x, y, z, parent); m.rotation.set(rx, ry, 0); return m; };
S.ground = (w, d, mat, x, y, z, parent) => S.plane(w, d, mat, x, y, z, -Math.PI / 2, 0, parent);
// a solid box in a set: drawn, and registered for physics and the dresser (ry about y). Returns the mesh
S.solid = (w, h, d, mat, x, y, z, parent, ry = 0) => { const m = PS1.add(PS1.box(w, h, d), mat, x, y, z, parent); m.rotation.y = ry; S.solids.push(m); return m; };
// a floor area to keep clear: a rect [x0, x1, z0, z1] in world space
S.keepOut = (r, why = '') => { S.keepOuts.push({ r, why }); return r; };
// animate every kit's life: call SETS.tick(t, S) from the scene's update
S.tick = (t, ctx) => { for (const f of S.fx) f(t, ctx); };
// the height of whatever solid is under a point (a seat, a bed, a crate): sit and lie poses rest on it, so nobody sinks into furniture
S.seatAt = (x, z, below = 1.6) => { PS1.scene.updateMatrixWorld(true); let top = 0; for (const o of S.solids) { if (!o || !o.isObject3D) continue; const b = new THREE.Box3().setFromObject(o); if (x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z && b.max.y <= below) top = Math.max(top, b.max.y); } return top; };
S.reset = () => { S.fx.length = 0; S.solids.length = 0; S.keepOuts.length = 0; S.spaces.length = 0; S.vehicles.length = 0; S.swings.length = 0; S.emits.length = 0; for (const k in S.anchors) delete S.anchors[k]; };
const solid = c => PS1.color(c), stripes = (base, line, step, vertical) => (q, w, h, r) => { q.fillStyle = base; q.fillRect(0, 0, w, h); q.fillStyle = line; for (let i = step - 1; i < (vertical ? w : h); i += step) vertical ? q.fillRect(i, 0, 1, h) : q.fillRect(0, i, w, 1); noise(q, w, h, r, line, 20, .4); };
const speck = (base, a, b, n1 = 80, n2 = 40) => (q, w, h, r) => { q.fillStyle = base; q.fillRect(0, 0, w, h); noise(q, w, h, r, a, n1, .8); noise(q, w, h, r, b, n2, .6); };
// ---- the shared textures (tiny, on purpose). The Hitchhiker's own palette first, then the room kits'
const T = S.T = {
  dirt: tex(16, 16, speck('#8a6a44', '#5a4428', '#a88a5a')), grass: tex(16, 16, speck('#8a7a44', '#5a5428', '#b0a060', 90)), road: tex(16, 16, speck('#3e3a36', '#2a2624', '#5a5650')),
  lawn: tex(16, 16, speck('#4a6a2a', '#2e4a1a', '#6a8a3a', 90)), mud: tex(16, 16, speck('#4a3a2a', '#2a2018', '#6a5440')), snow: tex(16, 16, speck('#e8eef2', '#c4ccd4', '#ffffff')),
  dash: solid('#d8b440'), white: solid('#ece8e0'), black: solid('#060606'), tyre: solid('#151515'), chrome: solid('#a8acb0'), glass: tex(8, 8, (q) => { q.fillStyle = '#26303a'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#6a7a88'; q.fillRect(1, 1, 2, 1); q.fillRect(5, 4, 2, 1); }),
  headlight: solid('#fff4c8'), tail: solid('#c41a12'), lit: solid('#e8c86a'), bone: solid('#e2dccb'), ceil: solid('#2a2622'),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  boards: tex(16, 16, stripes('#6a4a30', '#3a2618', 4)), pine: tex(8, 16, speck('#3a3426', '#241e16', '#4a4232', 30, 10)),
  siding: tex(16, 16, stripes('#d8d0bc', '#a8a08c', 4)), sidingBlue: tex(16, 16, stripes('#8aa0b0', '#647a8a', 4)), sidingYellow: tex(16, 16, stripes('#d8c48a', '#a8945a', 4)), barnRed: tex(16, 16, stripes('#8a2a1e', '#5a1a12', 3, true)),
  brick: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a4a36'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8b8a0'; for (let y = 3; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 4; x < w; x += 8) q.fillRect(x, y - 3, 1, 3); } noise(q, w, h, r, '#5a2a1e', 40, .6); }),
  cinder: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#c8c0a8'; q.fillRect(0, 0, w, h); q.fillStyle = '#a49c86'; for (let y = 0; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 4; x < w; x += 8) q.fillRect(x, y, 1, 4); } noise(q, w, h, r, '#8a8270', 30, .6); }),
  stone: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a8478'; q.fillRect(0, 0, w, h); q.fillStyle = '#5e5a52'; for (let y = 4; y < h; y += 5) q.fillRect(0, y, w, 1); for (let i = 0; i < 6; i++) q.fillRect(r() * w | 0, (r() * 3 | 0) * 5, 1, 4); noise(q, w, h, r, '#a8a296', 40, .6); }),
  tin: tex(16, 16, stripes('#7a6a5a', '#5a4a3e', 3, true)), rust: tex(16, 16, speck('#7a4a2a', '#4a2a18', '#a86a3a')), shingle: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a3634'; q.fillRect(0, 0, w, h); q.fillStyle = '#242020'; for (let y = 3; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 3; x < w; x += 6) q.fillRect(x, y - 3, 1, 3); } noise(q, w, h, r, '#4e4844', 30, .6); }),
  // floors and walls inside
  lino: tex(16, 16, (q) => { for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x += 4) { q.fillStyle = (x + y) / 4 % 2 ? '#e8e2d2' : '#2a2a2c'; q.fillRect(x, y, 4, 4); } }), linoGreen: tex(16, 16, (q) => { for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x += 4) { q.fillStyle = (x + y) / 4 % 2 ? '#d8dcc8' : '#6a8a6a'; q.fillRect(x, y, 4, 4); } }),
  tile: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#e8ece8'; q.fillRect(0, 0, w, h); q.fillStyle = '#b8c0bc'; for (let i = 3; i < 16; i += 4) { q.fillRect(0, i, w, 1); q.fillRect(i, 0, 1, h); } noise(q, w, h, r, '#a8b0aa', 20, .4); }),
  carpet: tex(16, 16, speck('#7a5a3a', '#5a3e26', '#9a7a52', 90)), shag: tex(16, 16, speck('#a8783a', '#7a5226', '#c8984a', 120)), plank: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a6440'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a4026'; for (let x = 3; x < w; x += 4) q.fillRect(x, 0, 1, h); for (let i = 0; i < 4; i++) q.fillRect(i * 4 + 1, r() * 16 | 0, 3, 1); noise(q, w, h, r, '#a07a50', 30, .6); }),
  concrete: tex(16, 16, speck('#8a8884', '#6a6864', '#a6a4a0')), paneling: tex(16, 16, stripes('#6a4a2e', '#3e2a1a', 4, true)), wallpaper: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#d8c8a0'; q.fillRect(0, 0, w, h); q.fillStyle = '#a88a5a'; for (let y = 2; y < h; y += 8) for (let x = (y / 8 % 2) * 4 + 1; x < w; x += 8) { q.fillRect(x, y, 2, 1); q.fillRect(x + 1, y + 1, 1, 2); } }),
  wallpaperGreen: tex(16, 16, (q) => { q.fillStyle = '#9aa87a'; q.fillRect(0, 0, 16, 16); q.fillStyle = '#7a8a5a'; for (let x = 1; x < 16; x += 4) q.fillRect(x, 0, 2, 16); }), plaster: tex(16, 16, speck('#d8d2c4', '#bab4a6', '#e8e4da', 40, 20)),
  hospital: tex(16, 16, speck('#c8d8d0', '#aabcb4', '#dce8e2', 30, 20)), diner: tex(16, 16, stripes('#e8e2d2', '#c84a3a', 8)), grime: tex(16, 16, (q, w, h, r) => { for (let i = 0; i < 8; i++) { q.globalAlpha = .35; q.fillStyle = '#1a120a'; q.fillRect(r() * 16 | 0, 0, 1, 3 + (r() * 9 | 0)); } q.globalAlpha = 1; }),
  formica: tex(8, 8, speck('#e8dcc0', '#c8b898', '#f4ecd8', 10, 6)), steel: tex(16, 16, speck('#6e7276', '#4a4e52', '#8a6a4a', 60, 20)), curtain: tex(8, 16, stripes('#8a3a2a', '#6a2a1e', 2, true)), sheet: solid('#e8e4da'), quilt: tex(8, 8, (q) => { const c = ['#b84a3a', '#e8d8b0', '#4a6a8a', '#d8a84a']; for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2) { q.fillStyle = c[(x + y * 3) / 2 % 4]; q.fillRect(x, y, 2, 2); } }),
  // cloth and paint for vehicles
  olive: tex(16, 16, speck('#7a8460', '#5a6040', '#8a5a3a', 60, 20)), blue: tex(16, 16, speck('#4a6a8a', '#2e4a62', '#5a7a9a', 50, 10)), cream: tex(16, 16, speck('#e0d4b4', '#c4b898', '#f0e6cc', 40, 10)), wagonWood: tex(16, 16, stripes('#7a5230', '#4a3018', 3)),
  busYellow: tex(16, 16, speck('#e8a820', '#b07a10', '#f4c040', 40, 10)), copBlack: solid('#141418'), copWhite: solid('#e8e8e4'), maroon: tex(16, 16, speck('#6a1e22', '#4a1216', '#8a2a2e', 40, 10)), seat: tex(8, 8, stripes('#6a4a32', '#4a3020', 2, true)),
};
for (const k of ['dirt', 'grass', 'road', 'lawn', 'mud', 'snow', 'carpet', 'concrete', 'plank', 'lino', 'tile']) PS1.mip(T[k]);
})();
