// WORLD: STREETS. Straight street pieces with curbs, sidewalks, a grass strip and centre lines, four-way intersections with crosswalks, stop
// signs or a traffic light, driveways and alleys. Built on the sets road kit (SETS.road for the asphalt, its wear and cracks).
//   WORLD.street({ from: [x, z], to: [x, z], kind: 'suburb' | 'city' | 'country' | 'dirt' | 'alley', width, sidewalk, strip, curb, lines, parking, seed })
//     → { G, len, width, anchors: { start, end, mid }, at(u, lane) world point on a lane (u 0..1 from `from`; lane -1 = right of travel, +1 left),
//         walk(u, side) a point on a sidewalk (side +1 left of from→to, -1 right), edge }   (keep-outs: the road and the sidewalks)
//   WORLD.intersection({ at: [x, z], width, kind, control: 'stop' | 'light' | 'none', crosswalks }) → { G, anchors: { n, s, e, w, center } }
//   WORLD.driveway({ from: [x, z], to: [x, z], width })
(function () {
const S = SETS, W = WORLD, { V, rng } = PS1, add = PS1.add, grp = PS1.group, b = W.b;
W.T.walk = PS1.mip(PS1.tex(16, 16, (q, w, h, r) => { q.fillStyle = '#a8a49c'; q.fillRect(0, 0, w, h); PS1.noise(q, w, h, r, '#8a8680', 60, .6); PS1.noise(q, w, h, r, '#bcb8b0', 30, .5); q.fillStyle = '#7a7670'; q.fillRect(0, 15, w, 1); q.fillRect(15, 0, 1, h); }));
W.T.asphaltCity = PS1.mip(PS1.tex(16, 16, (q, w, h, r) => { q.fillStyle = '#34322f'; q.fillRect(0, 0, w, h); PS1.noise(q, w, h, r, '#24221f', 80, .8); PS1.noise(q, w, h, r, '#4a4844', 40, .6); }));
W.T.stripe = PS1.color('#e8e4d8'); W.T.yellow = PS1.color('#d8b440');
const KIND = { suburb: { width: 7.4, sidewalk: 1.5, strip: 1.2, curb: .15, lines: 'none' }, city: { width: 12, sidewalk: 3.2, strip: 0, curb: .16, lines: 'double', parking: true }, country: { width: 6.4, sidewalk: 0, strip: 0, curb: 0, lines: 'dashed' },
  dirt: { width: 4, sidewalk: 0, strip: 0, curb: 0, lines: 'none', dirt: true }, alley: { width: 4.5, sidewalk: 0, strip: 0, curb: .1, lines: 'none' } };
// a flat strip on the ground in a street's local frame (x across, z along)
const strip = (g, w, l, m, x, y, z, off = -1) => { const p = S.ground(w, l, m, x, y, z, g); S.offset(p.material, off); return p; };
let nSt = 0;
W.street = (o = {}) => { const K = { ...KIND[o.kind || 'suburb'], ...o }, a = V(o.from[0], 0, o.from[1]), c = V(o.to[0], 0, o.to[1]), len = a.distanceTo(c), dir = c.clone().sub(a).normalize(), ry = Math.atan2(dir.x, dir.z);
  const G = grp(...a.clone().lerp(c, .5).toArray(), o.parent || PS1.scene); G.rotation.y = ry; G.name = o.name || `street-${++nSt}`; G.updateMatrixWorld(true); const hw = K.width / 2, seed = o.seed || nSt * 7;
  // the asphalt (the sets road kit: wear, cracks, patches, gravel shoulders on country roads) or a dirt track
  if (K.kind === 'city' || o.kind === 'city' || o.kind === 'alley') { strip(G, K.width, len, W.mat(W.T.asphaltCity), 0, .04, 0); }
  else S.road(0, 0, len, 'z', G, { width: K.width, seed, dirt: K.dirt, dashes: K.lines === 'dashed', wear: o.wear });
  const ym = W.mat(W.T.yellow, { unlit: true, tint: '#b8a060' }), wm = W.mat(W.T.stripe, { unlit: true, tint: '#c8c4b8' });
  if (K.lines === 'double') for (const s of [-1, 1]) strip(G, .1, len, ym, s * .1, .075, 0, -2);
  if (K.lines === 'dashed-white') for (let z = -len / 2 + 1.5; z < len / 2; z += 6) strip(G, .12, 3, wm, 0, .075, z, -2);
  if (K.parking) for (const s of [-1, 1]) { strip(G, .1, len, wm, s * (hw - 2.4), .075, 0, -2); for (let z = -len / 2 + 3; z < len / 2; z += 6) strip(G, 2.2, .1, wm, s * (hw - 1.2), .075, z, -2); }
  // curbs (solid), the grass strip, the sidewalk (raised to the curb), its seams
  const sides = []; if (K.curb > 0) for (const s of [-1, 1]) { const x = s * (hw + .08); W.solid(G, .16, K.curb + .04, len, W.mat('concrete'), x, (K.curb + .04) / 2, 0); let off = hw + .16;
    if (K.strip) { strip(G, K.strip, len, W.mat('lawn'), s * (off + K.strip / 2), K.curb - .005, 0, -1); b(G, K.strip, K.curb, len, W.col('#4a4844'), s * (off + K.strip / 2), K.curb / 2 - .01, 0); off += K.strip; }
    if (K.sidewalk) { const sw = W.mat(W.T.walk); const p = S.ground(K.sidewalk, len, sw, s * (off + K.sidewalk / 2), K.curb + .002, 0, G); PS1.rep(p.geometry, K.sidewalk / 1.5, len / 1.5); b(G, K.sidewalk, K.curb, len, W.col('#8a8680'), s * (off + K.sidewalk / 2), K.curb / 2 - .01, 0); sides.push({ s, x: s * (off + K.sidewalk / 2) }); off += K.sidewalk; }
    if (K.storm !== false && W.defs['storm-drain']) for (let z = -len / 2 + 9; z < len / 2 - 3; z += 30) W.put('storm-drain', { at: G.localToWorld(V(s * (hw - .3), 0, z)).toArray(), ry: ry + s * Math.PI / 2 }); }
  // keep-outs: the dresser and the biome never put a tree or a bin on the road
  const outer = hw + (K.curb > 0 ? .16 + (K.strip || 0) + (K.sidewalk || 0) : 1); const corners = [V(-outer, 0, -len / 2), V(outer, 0, len / 2)].map(p => G.localToWorld(p));
  S.keepOut([Math.min(corners[0].x, corners[1].x), Math.max(corners[0].x, corners[1].x), Math.min(corners[0].z, corners[1].z), Math.max(corners[0].z, corners[1].z)], `${G.name}: the road and its sidewalks`);
  const p = { G, kind: 'street', name: G.name, len, width: K.width, edge: outer, ry, dir, anchors: { start: a.clone(), end: c.clone(), mid: a.clone().lerp(c, .5) }, windows: [], doors: {}, lights: [] };
  p.at = (u, lane = -1) => G.localToWorld(V(lane * hw / 2, 0, -len / 2 + u * len)); p.walk = (u, side = 1) => { const sd = sides.find(q => Math.sign(q.x) === side) || sides[0]; return G.localToWorld(V(sd ? sd.x : side * (hw + 1), K.curb || 0, -len / 2 + u * len)); };
  p.side = (u, side, out = 0) => G.localToWorld(V(side * (outer + out), 0, -len / 2 + u * len)); W.placed.push(p); return p; };
// a four-way intersection: asphalt square, curb corners, crosswalk stripes, stop signs or a working traffic light (glows, cycles with t)
W.intersection = (o = {}) => { const K = { ...KIND[o.kind || 'suburb'], ...o }, w = K.width, G = grp(o.at[0], 0, o.at[1], o.parent || PS1.scene), hw = w / 2; G.rotation.y = o.ry || 0; G.updateMatrixWorld(true);
  strip(G, w, w, W.mat(o.kind === 'city' ? W.T.asphaltCity : 'road'), 0, .041, 0); const wm = W.mat(W.T.stripe, { unlit: true, tint: '#c8c4b8' }), out = hw + .16 + (K.strip || 0) + (K.sidewalk || 0);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (K.curb > 0) { const cw = out - hw; const c = b(G, cw, K.curb, cw, W.col('#8a8680'), sx * (hw + cw / 2), K.curb / 2, sz * (hw + cw / 2)); const top = S.ground(cw, cw, W.mat(W.T.walk), sx * (hw + cw / 2), K.curb + .002, sz * (hw + cw / 2), G); S.solids.push(c); }
  if (o.crosswalks !== false) for (let k = 0; k < 4; k++) { const cg = grp(0, 0, 0, G); cg.rotation.y = k * Math.PI / 2; for (let x = -hw + .5; x < hw - .3; x += .9) strip(cg, .5, 2.4, wm, x, .076, hw - 1.4, -2); strip(cg, w, .3, wm, 0, .076, hw - 2.9, -2); }
  const A = {}; for (const [n, x, z] of [['n', 0, -hw - 2], ['s', 0, hw + 2], ['e', hw + 2, 0], ['w', -hw - 2, 0], ['center', 0, 0]]) A[n] = G.localToWorld(V(x, 0, z));
  if ((o.control || 'stop') === 'stop') for (let k = 0; k < 4; k++) { const cg = grp(0, 0, 0, G); cg.rotation.y = k * Math.PI / 2; S.sign(hw + .5, hw + .5, 0, cg, 'stop'); }
  if (o.control === 'light') { const pole = grp(hw + .6, 0, hw + .6, G), m = W.col('#3a3c3e'); W.c(pole, .1, .12, 5.4, 6, m, 0, 2.7, 0); W.span(pole, V(0, 5.3, 0), V(-hw, 5.3, 0), .1, m);
    for (const [k, ax] of [[0, -hw * .5], [1, -hw * .9]]) { const hd = grp(ax, 4.8, 0, pole); b(hd, .35, 1.0, .3, W.col('#c8a020')); const lamps = ['#e8301e', '#e8b020', '#30c860'].map((c, i) => { const m2 = PS1.mat(PS1.color('#ffffff'), {}); const l = W.c(hd, .1, .1, .05, 8, m2, 0, .3 - i * .3, .16); l.rotation.x = Math.PI / 2; return { m: m2, c: new THREE.Color(c) }; });
      // red 0-14 s, green 14-26, amber 26-30 (offset per head so cross streets alternate)
      S.fx.push(t => { const u = ((t + (o.phase || 0) + k * 15) % 30), on = u < 14 ? 0 : u < 26 ? 2 : 1; lamps.forEach((L, i) => { L.m.uniforms.unlit.value = i === on ? 1 : 0; L.m.uniforms.tint.value.copy(i === on ? L.c : L.c.clone().multiplyScalar(.25)); }); }); } }
  S.keepOut([o.at[0] - out, o.at[0] + out, o.at[1] - out, o.at[1] + out], 'intersection'); return { G, kind: 'intersection', anchors: A, windows: [], doors: {}, lights: [] }; };
// a driveway or a path: a concrete strip between two ground points
W.driveway = (o = {}) => { const a = V(o.from[0], 0, o.from[1]), c = V(o.to[0], 0, o.to[1]), len = a.distanceTo(c), G = grp(...a.clone().lerp(c, .5).toArray(), o.parent || PS1.scene); G.rotation.y = Math.atan2(c.x - a.x, c.z - a.z);
  strip(G, o.width || 3, len, W.mat(o.mat || 'concrete'), 0, o.y ?? .02, 0); return { G, kind: 'driveway', anchors: {} }; };
W.PLACE.street = (e, c) => W.street({ ...e, from: lp(c, e.from), to: lp(c, e.to), parent: PS1.scene, name: e.uid });
W.PLACE.intersection = (e, c) => W.intersection({ ...e, at: lp(c, e.at), ry: (e.ry || 0) + c.parent.rotation.y, parent: PS1.scene });
W.PLACE.driveway = (e, c) => W.driveway({ ...e, from: lp(c, e.from), to: lp(c, e.to), parent: PS1.scene });
// a layout's [x, z] in the world (layouts are placed under a group that may be moved and turned)
const lp = (c, xz) => { c.parent.updateMatrixWorld(true); const p = c.parent.localToWorld(V(xz[0], 0, xz[1])); return [p.x, p.z]; }; W.lp = lp;
})();
