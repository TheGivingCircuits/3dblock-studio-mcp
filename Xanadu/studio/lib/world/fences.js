// WORLD: FENCES AND WALLS along any path, as placeable pieces: picket, privacy, chain-link, split rail, wrought iron, hedge, barbed wire,
// stone wall. WORLD.fence(kind, path, o) → { G, kind, gates: [pivot], anchors }
//   path: [[x, z], [x, z], ...] in the world (or in o.parent's frame); every straight run is a solid for the physics and the set dresser
//   o: { height, color, parent, seed, gate: { run: index of the run, u: 0..1 along it, w: width } | [gates], posts: spacing }
// A gate is a hinge pivot (userData.slab + hinge), so PHYS.door swings it, switch.wire(gate) opens it, or set gate.rotation.y by hand.
(function () {
const S = SETS, W = WORLD, { V } = PS1, add = PS1.add, grp = PS1.group, b = W.b;
W.T.chain = PS1.tex(8, 8, q => { q.clearRect(0, 0, 8, 8); q.fillStyle = '#a8acb0'; for (let i = 0; i < 8; i++) { q.fillRect(i, i, 1, 1); q.fillRect(7 - i, i, 1, 1); } });
const KIND = { picket: { h: .95, color: '#ece8e0', post: 2.4 }, privacy: { h: 1.8, color: '#8a6a4a', post: 2.4 }, chainlink: { h: 1.5, color: '#8a8e92', post: 3 }, rail: { h: 1.2, color: '#7a5a3a', post: 2.4 },
  iron: { h: 1.6, color: '#1a1c1e', post: 2.4 }, hedge: { h: 1.3, color: '#3e5a26', post: 99 }, barbed: { h: 1.15, color: '#6a5a44', post: 3 }, stone: { h: .7, color: '#8a8478', post: 99 } };
// one straight run from 0 to L along local x (the group sits on the start, turned to the end); `gap` = [u0, u1] metres left open for a gate
const RUN = {
  picket(g, L, K, gap, r) { const m = W.col(K.color), dk = W.col(W.shade(K.color, -.15)); for (let x = .05; x < L; x += .16) { if (gap && x > gap[0] - .04 && x < gap[1] + .04) continue; b(g, .08, K.h - .06, .022, m, x, (K.h - .06) / 2, 0); const tip = b(g, .055, .055, .022, m, x, K.h - .05, 0); tip.rotation.z = Math.PI / 4; }
    for (const y of [.22, K.h - .25]) rails(g, L, gap, y, .03, .06, dk, -.035); posts(g, L, K, gap, .09, m); },
  privacy(g, L, K, gap, r) { const m = W.paintMat('board', K.color, W.DS); for (const [a, c] of spans(L, gap)) { const p = add(PS1.plane(c - a, K.h, (c - a) / .8, K.h / .8, 1), m, (a + c) / 2, K.h / 2 + .05, 0, g); }
    for (const y of [.35, K.h - .2]) rails(g, L, gap, y, .08, .04, W.col(W.shade(K.color, -.2)), -.04); for (const [a, c] of spans(L, gap)) b(g, c - a, .04, .1, W.col(W.shade(K.color, -.1)), (a + c) / 2, K.h + .07, 0); posts(g, L, K, gap, .1, W.col(W.shade(K.color, -.15))); },
  chainlink(g, L, K, gap, r) { const m = W.mat(W.T.chain, { side: THREE.DoubleSide }); for (const [a, c] of spans(L, gap)) { const p = add(PS1.plane(c - a, K.h, (c - a) / .1, K.h / .1, 1), m, (a + c) / 2, K.h / 2 + .03, 0, g); p.userData.noCheck = true; }
    rails(g, L, gap, K.h + .03, .045, .045, W.col(K.color), 0, true); posts(g, L, K, gap, .065, W.col(K.color), true); },
  rail(g, L, K, gap, r) { const m = W.mat('wood'); for (const y of [.45, .95]) for (const [a, c] of spans(L, gap)) { const rr = b(g, c - a, .09, .09, m, (a + c) / 2, y, 0); rr.rotation.x = r() * .1; } posts(g, L, K, gap, .13, m); },
  iron(g, L, K, gap, r) { const m = W.col(K.color); for (let x = .06; x < L; x += .13) { if (gap && x > gap[0] - .04 && x < gap[1] + .04) continue; b(g, .025, K.h, .025, m, x, K.h / 2, 0); const sp = add(new THREE.ConeGeometry(.03, .1, 4), m, x, K.h + .05, 0, g); }
    for (const y of [.12, K.h - .12]) rails(g, L, gap, y, .03, .05, m, 0); posts(g, L, K, gap, .1, m, false, .12); },
  hedge(g, L, K, gap, r) { const m = W.mat(S.T.leafDark || 'lawn'), m2 = W.mat(S.T.leaf || 'lawn'); for (let x = .35; x < L; x += .6) { if (gap && x > gap[0] - .3 && x < gap[1] + .3) continue; const s = .75 + r() * .2; const bx = b(g, .8 * s, K.h * (.9 + r() * .15), .85, r() < .5 ? m : m2, x, K.h * .48, (r() - .5) * .08); bx.rotation.y = (r() - .5) * .3; } },
  barbed(g, L, K, gap, r) { const pm = W.mat('wood'), wm = W.col('#2a2826'); for (let x = 0; x <= L + .01; x += K.post) { const p = b(g, .09, K.h, .09, pm, Math.min(x, L), K.h / 2 - .05, 0); p.rotation.z = Math.sin(x * 3.1) * .05; }
    for (const y of [.45, .75, 1.0]) for (let x = 0; x + .01 < L; x += K.post) { const x2 = Math.min(L, x + K.post); if (S.wireSpan) S.wireSpan(V(x, y, 0), V(x2, y, 0), g, .05, wm, 3); for (const u of [.33, .66]) b(g, .05, .05, .02, wm, x + (x2 - x) * u, y - .04, 0).rotation.z = .8; } },
  stone(g, L, K, gap, r) { const m = W.mat('stone'); for (const [a, c] of spans(L, gap)) { const s = add(PS1.rep(PS1.box(c - a, K.h, .45), (c - a) / .8, 1), m, (a + c) / 2, K.h / 2, 0, g); b(g, c - a + .05, .08, .5, W.col('#7a7468'), (a + c) / 2, K.h + .04, 0); } } };
const spans = (L, gap) => gap ? [[0, gap[0]], [gap[1], L]].filter(([a, c]) => c - a > .02) : [[0, L]];
const rails = (g, L, gap, y, h, d, m, z = 0, round) => { for (const [a, c] of spans(L, gap)) { const r = round ? W.c(g, h / 2, h / 2, c - a, 5, m, (a + c) / 2, y, z) : b(g, c - a, h, d, m, (a + c) / 2, y, z); if (round) r.rotation.z = Math.PI / 2; } };
const posts = (g, L, K, gap, s, m, round, cap) => { const n = Math.max(1, Math.ceil(L / K.post)), xs = [...Array(n + 1)].map((_, i) => i * L / n); if (gap) xs.push(gap[0], gap[1]);
  for (const x of xs) { if (gap && x > gap[0] + .01 && x < gap[1] - .01) continue; const h = K.h + .08; const p = round ? W.c(g, s / 2, s / 2, h, 6, m, x, h / 2, 0) : b(g, s, h, s, m, x, h / 2, 0); if (cap) b(g, s + .06, .06, s + .06, m, x, h + .03, 0); } };
let nF = 0;
W.fence = (kind, path, o = {}) => { const K = { ...KIND[kind], ...(o.height ? { h: o.height } : {}), ...(o.color ? { color: o.color } : {}), ...(o.posts ? { post: o.posts } : {}) }; if (!KIND[kind]) throw new Error(`WORLD.fence: no kind "${kind}" (${Object.keys(KIND).join(', ')})`);
  const G = grp(0, 0, 0, o.parent || PS1.scene); G.name = o.name || `${kind}-fence-${++nF}`; G.updateMatrixWorld(true); const r = PS1.rng(o.seed || nF * 13), gates = [].concat(o.gate || []), out = { G, kind: 'fence', fence: kind, gates: [], anchors: {}, windows: [], doors: {}, lights: [] };
  for (let i = 0; i + 1 < path.length; i++) { const A = V(path[i][0], 0, path[i][1]), B = V(path[i + 1][0], 0, path[i + 1][1]), L = A.distanceTo(B), g = grp(A.x, 0, A.z, G); g.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x); g.updateMatrixWorld(true);
    const gt = gates.find(q => (q.run ?? 0) === i), gw = gt ? (gt.w || 1.0) : 0, gu = gt ? Math.max(.1, Math.min(L - gw - .1, (gt.u ?? .5) * L - gw / 2)) : 0, gap = gt ? [gu, gu + gw] : null;
    RUN[kind](g, L, K, gap, r);
    // the run as a solid (in world space), with the gate left open
    for (const [a, c] of spans(L, gap)) { if (c - a < .05) continue; const m = g.localToWorld(V((a + c) / 2, K.h / 2, 0)); S.solids.push({ size: [c - a, K.h, kind === 'hedge' ? .8 : kind === 'stone' ? .45 : .12], at: [m.x, m.y, m.z], ry: g.rotation.y + G.rotation.y, fence: kind }); }
    if (gt) { const pv = grp(gu, 0, 0, g), gm = kind === 'privacy' ? W.paintMat('board', K.color) : W.col(K.color), gh = Math.min(K.h, kind === 'hedge' || kind === 'stone' ? 1.1 : K.h);
      const slab = b(pv, gw - .04, gh - .1, .04, kind === 'chainlink' ? W.mat(W.T.chain, { side: THREE.DoubleSide }) : gm, gw / 2, gh / 2 + .05, 0);
      if (kind === 'picket' || kind === 'iron' || kind === 'chainlink' || kind === 'hedge' || kind === 'stone') { b(pv, gw - .04, .06, .05, W.col(K.color === '#3e5a26' ? '#5a4030' : K.color), gw / 2, gh * .3, .02); b(pv, gw - .04, .06, .05, W.col(K.color === '#3e5a26' ? '#5a4030' : K.color), gw / 2, gh * .8, .02); }
      if (kind === 'picket') { slab.visible = false; for (let x = .05; x < gw - .04; x += .16) b(pv, .08, gh - .1, .022, W.col(K.color), x, (gh - .1) / 2, 0); }
      pv.userData = { slab, side: 1, hinge: () => pv.getWorldPosition(V(0, 0, 0)) }; out.gates.push(pv); out.anchors['gate' + (out.gates.length - 1)] = g.localToWorld(V(gu + gw / 2, 0, 0)); if (gt.open) pv.rotation.y = gt.open; } }
  W.placed.push(out); return out; };
W.FENCES = Object.keys(KIND);
W.PLACE.fence = (e, c) => { const P = e.path.map(xz => W.lp(c, xz)); return W.fence(e.fence, P, { ...e, parent: PS1.scene, name: e.uid }); };
})();
