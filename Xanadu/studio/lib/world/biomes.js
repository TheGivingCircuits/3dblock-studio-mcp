// WORLD: BIOMES. A biome is a layout generator (layouts.js) plus the placers for its entry types. Two ways to use one:
//   WORLD.load('maple-street', o)        a SAVED world (worlds/maple-street.json, bundled into all.js): the same street every time, nothing generated
//   WORLD.biome('suburb', { seed, ... }) a fresh one from the generator (save the ones you like: node studio/lib/world/save-world.mjs)
// Both take { at, ry, lit (windows, porch lights, streetlights: true, a function of t or a switch), W (the scene's PHYS world: swings, ropes and
// props become physics), edit: { uid: { changes } | null }, skip, only } and return { G, layout, pieces, get(uid), anchors }.
// WORLD.sky(world, overrides) applies the layout's suggested sky and haze (LIGHTS.sky / LIGHTS.atmosphere). Saved worlds: WORLD.saved().
(function () {
const S = SETS, W = WORLD, { V } = PS1, add = PS1.add, grp = PS1.group;
const GROUND = { lawn: 'lawn', grass: 'grass', mud: 'mud', snow: 'snow', dirt: 'dirt', concrete: 'concrete', road: 'road' };
W.PLACE.ground = (e, c) => { const [x0, x1, z0, z1] = e.rect, g = S.ground(x1 - x0, z1 - z0, W.mat(GROUND[e.tex] || e.tex || 'lawn'), (x0 + x1) / 2, e.y ?? -.005, (z0 + z1) / 2, c.parent); g.userData.noCheck = true; return { G: g, anchors: {} }; };
W.PLACE.tree = (e, c) => { const [x, z] = e.at, P = c.parent, h = e.h || 6, s = e.seed || 1;
  const g = e.kind === 'pine' ? S.pineTree(x, z, h, P, s) : e.kind === 'dead' ? S.deadTree(x, z, h, P, s) : e.kind === 'bush' ? S.bush(x, z, h, P, s) : e.kind === 'rock' ? S.rock(x, z, h, P, s) : S.liveTree(x, z, h, P, s);
  // trunks are solid (props and ropes hit them), leaves are not
  if (e.kind !== 'bush' && e.kind !== 'rock') { P.updateMatrixWorld(true); const w = P.localToWorld(V(x, h * .3, z)); S.solids.push({ size: [.35, h * .6, .35], at: [w.x, w.y, w.z], ry: 0, tree: true }); }
  return { G: g, anchors: { base: P.localToWorld(V(x, 0, z)) } }; };
// the sets kits, called with the world group as parent: woods, corn, field, countryRoad, building (farmhouse, motel, church, barn...)
W.PLACE.sets = (e, c) => { const P = c.parent, a = e.args || {};
  if (e.fn === 'woods') return { G: S.woods(P, e.rect, e.n || 30, e.seed || 31, a), anchors: {} };
  if (e.fn === 'corn') return { G: S.corn(P, e.rect, e.seed || 41, a), anchors: {} };
  if (e.fn === 'field') return { G: S.field(P, e.n || 400, e.seed || 1, e.rect), anchors: {} };
  if (e.fn === 'countryRoad') { const r = S.countryRoad({ ...a, parent: P }); return { G: r.G, anchors: {} }; }
  if (e.fn === 'building') { const B = S.building(a.kind, { ...a, parent: P, lit: a.lit ?? c.lit }); return { G: B.G, anchors: B.anchors, doors: B.doors, windows: B.windows }; }
  console.warn('WORLD: no sets fn', e.fn); return null; };
W.PLACE.vehicle = (e, c) => { const P = c.parent; P.updateMatrixWorld(true); const at = P.localToWorld(V(...e.at)); const g = S.vehicle(e.kind, { ...e, at: at.toArray(), ry: (e.ry || 0) + P.rotation.y });
  // parked cars are solid
  S.solids.push({ size: [(g.userData.width || 1.9), 1.3, (g.userData.len || 4.6)], at: [at.x, .65, at.z], ry: (e.ry || 0) + P.rotation.y, car: true }); return { G: g, anchors: {} }; };
// a fire pit: a ring of stones, logs, flames that flicker, and a real fire light
W.PLACE.firepit = (e, c) => { const P = c.parent, g = grp(e.at[0], 0, e.at[1], P), st = W.mat('stone'); for (let k = 0; k < 9; k++) { const a = k * .7; const s = W.b(g, .28, .2, .22, st, Math.cos(a) * .6, .1, Math.sin(a) * .6); s.rotation.y = -a; }
  for (let k = 0; k < 3; k++) { const l = W.c(g, .06, .06, .7, 6, W.mat('wood'), 0, .12, 0); l.rotation.set(Math.PI / 2, k * 1.05, .3); }
  const flames = [0, 1, 2].map(k => { const f = add(new THREE.ConeGeometry(.16 - k * .03, .5, 5), W.col(['#ff8a2a', '#ffc040', '#ff5a1a'][k], { unlit: true }), (k - 1) * .1, .4, (k % 2) * .08, g); f.userData.fx = 'glow'; return f; });
  const on = t => !e.lit || W.litAt(e.lit, t) > .5; S.fx.push(t => flames.forEach((f, k) => { f.visible = on(t); f.scale.y = .8 + .35 * Math.sin(t * (9 + k * 3) + k) * Math.sin(t * 3.3 + k); f.rotation.y = t * (1 + k); }));
  P.updateMatrixWorld(true); const p = P.localToWorld(V(e.at[0], .5, e.at[1])); if (e.light !== false) LIGHTS.practical({ name: e.uid || 'firepit', fixture: 'fire', in: p.toArray(), stops: e.stops ?? -.3, when: on }); return { G: g, anchors: { fire: p } }; };
// rope pieces: physics when the world has a PHYS world, hanging still when it does not
const W3 = (c, a) => { c.parent.updateMatrixWorld(true); return c.parent.localToWorld(V(...a)).toArray(); };
W.PLACE['swing-set'] = (e, c) => { if (c.W) return W.swingSet(c.W, { at: W3(c, e.at), ry: (e.ry || 0) + c.parent.rotation.y });
  // still: frame and seats hanging straight
  const g = grp(...W3(c, e.at), PS1.scene); g.rotation.y = (e.ry || 0) + c.parent.rotation.y; g.updateMatrixWorld(true); const pipe = W.col('#3a6a8a'); for (const s of [-1, 1]) for (const k of [-1, 1]) W.span(g, V(s * 1.6, 2.3, 0), V(s * 1.75, 0, k * .9), .06, pipe); W.span(g, V(-1.7, 2.3, 0), V(1.7, 2.3, 0), .07, pipe);
  for (const x of [-.75, .75]) { for (const dx of [-.22, .22]) W.rope(null, { from: g.localToWorld(V(x + dx, 2.3, 0)).toArray(), to: g.localToWorld(V(x + dx, .55, 0)).toArray(), kind: 'chain', slack: 0 }); W.b(g, .5, .03, .2, W.col('#1a1a1a'), x, .55, 0); } return { G: g, anchors: {} }; };
W.PLACE['tire-swing'] = (e, c) => { if (c.W) return W.tireSwing(c.W, { at: W3(c, e.at), len: e.len }); const top = V(...W3(c, e.at)), len = e.len || 2.0; W.rope(null, { from: top.toArray(), length: len, kind: 'rope' });
  const t = add(new THREE.TorusGeometry(.32, .1, 5, 10), W.col('#151515'), top.x, top.y - len - .32, top.z, PS1.scene); return { G: t, anchors: {} }; };
W.PLACE.clothesline = (e, c) => W.clothesline(c.W || null, { from: W3(c, e.from), to: W3(c, e.to), wind: !!c.W });
// ---- generate or load
W.biome = (name, o = {}) => { const gen = W.LAYOUTS[name]; if (!gen || !W.LAYOUTS.BIOMES.includes(name)) throw new Error(`WORLD.biome: no biome "${name}" (${W.LAYOUTS.BIOMES.join(', ')})`); return W.load(gen(o.seed ?? 1, o), o); };
W.saved = () => Object.keys(W.WORLDS);
W.sky = (world, over = {}) => { const L = world.layout || world; if (L.sky) LIGHTS.sky({ ...L.sky, ...over }); if (L.atmosphere) LIGHTS.atmosphere({ ...L.atmosphere, ...(over.atmosphere || {}) }); return world; };
// night falls: a function of t for `lit` that turns the lights on at t0; passed to WORLD.load, each house comes on a little later than the last
W.nightfall = (t0, spread = 6) => { let k = 0; const f = t => t >= t0; f.each = () => { const d = (k++ * 2.17) % spread; return t => t >= t0 + d; }; return f; };
})();
