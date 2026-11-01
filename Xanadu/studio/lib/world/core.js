// THE WORLD LIBRARY (world-building assets, 2026-10-26). Placeable, recolourable pieces on top of lib/sets, lib/props, lib/physics.js and
// lib/lights.js, so a scene places a house, a street, a fence, a light, a rope or a switch by name instead of building it by hand, and loads a
// whole saved world (a biome) by name instead of generating it each time. Nothing in sets/, props/ or physics.js is changed: pages that never
// load lib/world/all.js render exactly as before. Load order: three, ps1, lights, camera, cast, cannon, physics, props/all, sets/all, world/all.
// core.js: the registry (WORLD.def / WORLD.put), paint palettes and paint-able textures, shared materials, saved worlds (WORLD.load / WORLD.save).
// Kits: houses.js, streets.js, fences.js, fixtures.js (lights), items.js (outdoor and household props), ropes.js, switches.js, biomes.js.
// Conventions as in sets/: metres, +y up, a piece faces +z (its front), its origin is the ground centre of its footprint, tiny 8-16 px textures.
(function () {
const S = SETS, { V, rng } = PS1, tex = PS1.tex, noise = PS1.noise;
const W = window.WORLD = { defs: {}, placed: [], T: {}, PALETTES: {}, WORLDS: {}, LAYOUTS: {}, fx: S.fx };
// ---- colours: darker / lighter versions of a #hex for line work, grime and highlights
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
W.shade = (c, k) => '#' + hex(c).map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))).map(v => v.toString(16).padStart(2, '0')).join('');
// ---- paint palettes: body, trim, roof, door, shutters, accent. A piece's `paint` is a palette name, a partial override object, or both
// ({ base: 'sage', door: '#8a1e1e' }), or 'pick' (a palette chosen from the seed, the same every time)
const P = (body, trim, roof, door, shutters, accent) => ({ body, trim, roof, door, shutters, accent: accent || trim });
Object.assign(W.PALETTES, {
  white: P('#e4e0d6', '#f4f2ec', '#3a3634', '#7a2a1e', '#2a3a2a'), cream: P('#e0d4b4', '#f2ecdc', '#4a3a30', '#2a4a5a', '#5a3a24'),
  sage: P('#9aa88a', '#ece8dc', '#3e3c38', '#7a3a24', '#3a4a34'), sky: P('#8aa0b0', '#ece8e0', '#38383a', '#8a2a1e', '#ece8e0'),
  butter: P('#d8c48a', '#f0ece0', '#5a4434', '#3a5a3a', '#6a5a3a'), mint: P('#a8c4b0', '#f2f0e8', '#4a4a48', '#c8a84a', '#f2f0e8'),
  pink: P('#d8a8a0', '#f4ece4', '#5a4a4a', '#5a7a8a', '#f4ece4'), tan: P('#b89c78', '#e8dcc4', '#4a3428', '#3a2a1e', '#5a4030'),
  slate: P('#6a7078', '#d8d8d4', '#2a2a2c', '#a82a1e', '#2a2a2c'), charcoal: P('#4a4846', '#c8c4bc', '#242424', '#c8a050', '#242424'),
  barn: P('#8a2a1e', '#ece8e0', '#4a4a4a', '#ece8e0', '#ece8e0'), olive: P('#7a7a4a', '#e0dcc4', '#3a3628', '#5a2a1a', '#3a3628'),
  brick: P('#8a4a36', '#e0d8c8', '#2e2a28', '#2a3a2a', '#2a3a2a'), brownstone: P('#6a4434', '#c8b8a0', '#2a2622', '#3a2418', '#2a2622'),
  stucco: P('#d8c8a8', '#a86a3a', '#8a4a2e', '#5a3a24', '#5a3a24'), logs: P('#6a4a2e', '#4a3420', '#3a3634', '#3a2618', '#3a2618'),
  weathered: P('#8a8478', '#a8a296', '#4a4844', '#4a3a2e', '#3a3632', '#6a5a4a'), teal: P('#4a7a7a', '#e8e4dc', '#2e3436', '#c84a2a', '#e8e4dc') });
W.PAINT_NAMES = Object.keys(W.PALETTES);
W.paint = (p, seed = 1, fallback = 'white') => { if (p === 'pick') p = W.PAINT_NAMES[Math.floor(rng(seed * 7 + 3)() * 12)];
  if (!p) return { ...W.PALETTES[fallback] }; if (typeof p === 'string') return { ...(W.PALETTES[p] || W.PALETTES[fallback]), ...(p[0] === '#' ? { body: p } : {}) };
  return { ...W.PALETTES[p.base || fallback], ...p }; };
// ---- paint-able textures: drawn once per colour (16 px), cached per page. W.paintTex(kind, colour)
const lines = (base, line, step, vertical, n = 20) => (q, w, h, r) => { q.fillStyle = base; q.fillRect(0, 0, w, h); q.fillStyle = line; for (let i = step - 1; i < (vertical ? w : h); i += step) vertical ? q.fillRect(i, 0, 1, h) : q.fillRect(0, i, w, 1); noise(q, w, h, r, line, n, .4); };
const KINDS = {
  // lap siding: a shadow line under every board, a lighter top edge
  siding: c => (q, w, h, r) => { lines(c, W.shade(c, -.28), 4)(q, w, h, r); q.fillStyle = W.shade(c, .18); for (let y = 0; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, W.shade(c, -.4), 10, .3); },
  board: c => (q, w, h, r) => { lines(c, W.shade(c, -.32), 4, true)(q, w, h, r); q.fillStyle = W.shade(c, .12); for (let x = 1; x < w; x += 4) q.fillRect(x, 0, 1, h); },
  shingleWall: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = W.shade(c, -.3); for (let y = 3; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 2; x < w; x += 4) q.fillRect(x, y - 3, 1, 3); } noise(q, w, h, r, W.shade(c, -.2), 30, .5); },
  brick: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = '#c8b8a0'; for (let y = 3; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 4; x < w; x += 8) q.fillRect(x, y - 3, 1, 3); } noise(q, w, h, r, W.shade(c, -.35), 40, .6); noise(q, w, h, r, W.shade(c, .2), 16, .5); },
  stucco: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); noise(q, w, h, r, W.shade(c, -.15), 70, .7); noise(q, w, h, r, W.shade(c, .15), 40, .6); },
  logs: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { q.fillStyle = W.shade(c, .15); q.fillRect(0, y, w, 1); q.fillStyle = W.shade(c, -.45); q.fillRect(0, y + 3, w, 1); } noise(q, w, h, r, W.shade(c, -.3), 30, .6); },
  shingle: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = W.shade(c, -.35); for (let y = 3; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 3; x < w; x += 6) q.fillRect(x, y - 3, 1, 3); } noise(q, w, h, r, W.shade(c, .2), 30, .6); },
  tin: c => lines(c, W.shade(c, -.3), 3, true, 30), tar: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); noise(q, w, h, r, W.shade(c, .25), 60, .8); noise(q, w, h, r, W.shade(c, -.3), 30, .6); },
  plain: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); noise(q, w, h, r, W.shade(c, -.12), 12, .4); },
  wood: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = W.shade(c, -.3); for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, W.shade(c, .2), 30, .7); },
  // a panelled front door: two raised panels, a darker frame
  door: c => (q, w, h, r) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = W.shade(c, -.3); q.fillRect(1, 1, w - 2, 1); q.fillRect(1, h / 2, w - 2, 1); for (const y of [2, h / 2 + 1]) { q.fillRect(2, y, 1, h / 2 - 3); q.fillRect(w - 3, y, 1, h / 2 - 3); } q.fillStyle = W.shade(c, .15); q.fillRect(3, 3, w - 6, 1); noise(q, w, h, r, W.shade(c, -.2), 8, .4); } };
W.paintTex = (kind, c, mip) => { const k = kind + c; if (W.T[k]) return W.T[k]; const t = tex(kind === 'door' ? 8 : 16, 16, KINDS[kind](c)); if (mip) PS1.mip(t); return (W.T[k] = t); };
// ---- materials: shared per page (one per texture + options), built after the scene's LIGHTS.use()
const MC = {};
W.mat = (t, o) => { const key = (typeof t === 'string' ? t : t.uuid) + JSON.stringify(o || {}); if (MC[key]) return MC[key]; const map = typeof t === 'string' ? (t[0] === '#' ? (W.T['c' + t] || (W.T['c' + t] = PS1.color(t))) : S.T[t] || W.T[t]) : t; return (MC[key] = PS1.mat(map, o)); };
W.col = (c, o) => W.mat(c, o); W.paintMat = (kind, c, o) => W.mat(W.paintTex(kind, c), o);
// geometry helpers (as in sets/), plus a box that is also a physics solid
W.add = PS1.add; W.box = PS1.box; W.cyl = PS1.cyl; W.grp = PS1.group; W.DS = S.DS;
W.b = (g, w, h, d, m, x = 0, y = 0, z = 0) => PS1.add(PS1.box(w, h, d), m, x, y, z, g);
W.c = (g, r1, r2, h, n, m, x = 0, y = 0, z = 0) => PS1.add(PS1.cyl(r1, r2, h, n), m, x, y, z, g);
W.solid = (g, w, h, d, m, x = 0, y = 0, z = 0) => { const o = W.b(g, w, h, d, m, x, y, z); S.solids.push(o); return o; };
// a box between two points (a wire, a rail, a brace): along its length, w × w thick
W.span = (g, a, b, w, m) => { const o = PS1.add(PS1.box(w, w, Math.max(.001, a.distanceTo(b))), m, 0, 0, 0, g); o.position.copy(a).lerp(b, .5); o.lookAt(g.localToWorld ? g.localToWorld(b.clone()) : b); o.userData.noCheck = true; return o; };
// ---- the registry. WORLD.def(id, { kind, name, tags, params, build(G, o, ctx) → extra fields }) and WORLD.put(id, o) → a piece:
//   { id, G, anchors: { name: Vector3 world }, doors: { name: pivot }, windows, lights, solids, footprint: [x0, x1, z0, z1] world, ... }
// o: { at: [x, y, z], ry, parent, paint, seed, lit (true | function of t | a switch), name } plus the def's own params.
W.def = (id, d) => { W.defs[id] = { tags: [], params: {}, ...d, id }; return d; };
W.list = (kind) => Object.values(W.defs).filter(d => !kind || d.kind === kind);
let nPut = 0;
W.put = (id, o = {}) => { const d = W.defs[id]; if (!d) throw new Error(`WORLD: no piece "${id}" (${Object.keys(W.defs).join(', ')})`);
  const G = PS1.group(...(o.at || [0, 0, 0]), o.parent || PS1.scene); G.rotation.y = o.ry || 0; G.name = o.name || `${id}-${++nPut}`; G.updateMatrixWorld(true);
  const p = { id, kind: d.kind, name: G.name, G, anchors: {}, doors: {}, windows: [], lights: [], o: { ...d.params, ...o }, seed: o.seed ?? nPut };
  p.paint = W.paint(o.paint, p.seed, d.paint || 'white'); p.r = rng(p.seed); Object.assign(p, d.build(G, p.o, p) || {}); G.updateMatrixWorld(true);
  p.footprint = p.footprint || (() => { const b = new THREE.Box3().setFromObject(G); return [b.min.x, b.max.x, b.min.z, b.max.z]; })(); G.userData.world = p;
  if (o.lit != null && p.windows.length) W.lightWindows(p, o.lit); W.placed.push(p); return p; };
// a local point of a piece in world space
W.at = (p, x, y, z) => { p.G.updateMatrixWorld(true); return p.G.localToWorld(V(x, y, z)); };
W.anchor = (p, name, x, y, z) => (p.anchors[name] = W.at(p, x, y, z));
// ---- glowing windows (dark by day, warm when lit). lit: true, a function of t (0..1 or bool), or a switch (WORLD.switch)
W.T.winDark = tex(8, 8, q => { q.fillStyle = '#1e2630'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#4a5a6a'; q.fillRect(1, 1, 2, 1); q.fillRect(5, 5, 1, 1); });
W.T.winLit = tex(8, 8, q => { q.fillStyle = '#f0c870'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#c89040'; q.fillRect(0, 5, 8, 3); q.fillStyle = '#e8a850'; q.fillRect(1, 1, 2, 2); });
W.T.winBlind = tex(8, 8, q => { q.fillStyle = '#e8dcb8'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#c8b890'; for (let y = 1; y < 8; y += 2) q.fillRect(0, y, 8, 1); });
const litAt = (lit, t) => typeof lit === 'function' ? +lit(t) : lit && lit.on ? +lit.on(t) : lit ? 1 : 0;
W.lightWindows = (p, lit, which) => { const ws = which || p.windows; S.fx.push(t => { const on = litAt(lit, t) > .5; for (const w of ws) { if (w.l) w.l.visible = on && !w.off; if (w.d) w.d.visible = !(on && !w.off); } }); };
W.litAt = litAt;
// ---- saved worlds. A layout is plain JSON: { name, biome, seed, sky, atmosphere, size, pieces: [{ uid, type, ... }] } (see biomes.js for the types).
// WORLD.load(nameOrLayout, { at, ry, parent, lit, W: physics world, edit: { uid: changes | null }, only: [types], skip: [uids] }) builds it and returns
// { G, layout, pieces: { uid: piece }, get(uid), anchors }. The same layout builds the same world every time; edit tweaks it without code.
W.load = (L, o = {}) => { if (typeof L === 'string') { const n = L; L = W.WORLDS[n]; if (!L) throw new Error(`WORLD.load: no saved world "${n}" (${Object.keys(W.WORLDS).join(', ')})`); }
  const G = PS1.group(...(o.at || [0, 0, 0]), o.parent || PS1.scene); G.rotation.y = o.ry || 0; G.name = 'world:' + (L.name || L.biome); G.updateMatrixWorld(true);
  const out = { G, layout: L, pieces: {}, anchors: {}, get: uid => out.pieces[uid] };
  for (const e0 of L.pieces) { const ed = o.edit && o.edit[e0.uid]; if (ed === null || (o.skip || []).includes(e0.uid) || (o.only && !o.only.includes(e0.type))) continue;
    const e = ed ? { ...e0, ...ed } : e0, maker = W.PLACE[e.type]; if (!maker) { console.warn('WORLD.load: no type', e.type); continue; }
    const p = maker(e, { parent: G, lit: o.lit, W: o.W, world: out }); if (p) { out.pieces[e.uid] = p; if (p.anchors) for (const k in p.anchors) out.anchors[`${e.uid}.${k}`] = p.anchors[k]; } }
  G.updateMatrixWorld(true); return out; };
// how each layout entry type is placed (kits add theirs: house, street, fence, light, item, tree, ground...)
W.PLACE = {};
// WORLD.save(layout) → JSON text for lib/world/worlds/<name>.json (node: lib/world/save-world.mjs writes it)
W.save = L => JSON.stringify(L, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v, 1);
})();
