// WORLD: ROPES, WIRES, CORDS, CHAINS AND CABLES as real physics objects in the scene's PHYS world (lib/physics.js, cannon-es).
// A rope is a chain of small spheres held at a fixed spacing by distance constraints, so it hangs, sags, swings, drapes over things, falls and
// can be cut. Every node is a PHYS item, so the rope is snapshotted with everything else and stays a pure function of t (stills, motion blur and
// re-renders agree). WORLD.rope(W, o) → rope; W is the scene's PHYS.world() (null draws a still, hanging rope with no physics).
//   o: { from, to, length (m), segments, kind: 'rope' | 'wire' | 'cord' | 'chain' | 'cable', thick (m), color, mass (kg, whole rope), stiff (0..1,
//        resists bending: wire .6, cable .4), cut: t | { t, at: node index }, end: { mass, size, color, shape, mesh, def } (a weight on a free end:
//        a bulb, a tyre, a hook), name, slack }
//   an end (from / to) is one of: [x, y, z] tied to a fixed point · { item, at: [x, y, z] } tied to a PHYS item (W.add result) at a point in the
//        prop's own frame · { mesh, at } following a mesh the scene animates · { fn: t => Vector3 } following anything (a hand) · null: free
// rope.nodes (PHYS items: W.carry(rope.nodes.at(-1), { by: P, ... }) puts the end in a hand), rope.endItem (the weight), rope.points(), rope.G.
// Order in a scene's update(t): W.step(t) first (as always), then SETS.tick(t) draws the ropes where the physics put them.
(function () {
const S = SETS, W = WORLD, C = window.CANNON, { V } = PS1, add = PS1.add, grp = PS1.group, DT = 1 / ((window.PHYS && PHYS.HZ) || 120), ROPE = 4;
const KIND = { rope: { thick: .03, color: '#b89a5a', damp: .25, mass: .12, stiff: 0, tex: 'twist' }, cord: { thick: .012, color: '#1e1c1a', damp: .35, mass: .03, stiff: .15 },
  wire: { thick: .01, color: '#2a2826', damp: .3, mass: .04, stiff: .6 }, cable: { thick: .025, color: '#141414', damp: .35, mass: .25, stiff: .4 }, chain: { thick: .018, color: '#8a8a86', damp: .15, mass: .35, stiff: 0, links: true } };
const T = {}; const twist = c => T[c] || (T[c] = PS1.tex(4, 8, q => { q.fillStyle = c; q.fillRect(0, 0, 4, 8); q.fillStyle = W.shade(c, -.35); for (let i = 0; i < 8; i += 2) q.fillRect((i / 2) % 4, i, 2, 1); }));
const vec = a => a.isVector3 ? a.clone() : V(a[0], a[1], a[2]);
// where an end is at time t (world)
const endAt = (e, t) => !e ? null : Array.isArray(e) || e.isVector3 ? vec(e) : e.fn ? e.fn(t) : e.mesh ? (e.mesh.updateMatrixWorld(true), e.mesh.localToWorld(vec(e.at || [0, 0, 0]))) : e.item ? (e.item.mesh.updateMatrixWorld(true), e.item.mesh.localToWorld(vec(e.at || [0, 0, 0]))) : null;
// points of a rope of length L hanging between A and B (a parabola whose arc length is L; straight when taut), or straight down from A
const hang = (A, B, L, n) => { if (!B) return [...Array(n + 1)].map((_, i) => A.clone().add(V(0, -L * i / n, 0)));
  const d = A.distanceTo(B); let sag = 0; if (L > d * 1.001) { let lo = 0, hi = L; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; let len = 0, p = A; for (let i = 1; i <= 40; i++) { const u = i / 40, q = A.clone().lerp(B, u).add(V(0, -4 * m * u * (1 - u), 0)); len += q.distanceTo(p); p = q; } len > L ? hi = m : lo = m; } sag = lo; }
  // spaced evenly along the curve
  const fine = [...Array(201)].map((_, i) => { const u = i / 200; return A.clone().lerp(B, u).add(V(0, -4 * sag * u * (1 - u), 0)); }), acc = [0]; for (let i = 1; i < fine.length; i++) acc.push(acc[i - 1] + fine[i].distanceTo(fine[i - 1]));
  return [...Array(n + 1)].map((_, i) => { const s = acc.at(-1) * i / n, j = Math.max(1, acc.findIndex(a => a >= s)); const k = (s - acc[j - 1]) / Math.max(1e-6, acc[j] - acc[j - 1]); return fine[j - 1].clone().lerp(fine[j], Math.min(1, k)); }); };
// one per physics world: kinematic pins follow their targets, cuts let go at their time (cannon's preStep runs inside every fixed step)
const hooked = new WeakSet();
const hook = Wp => { if (hooked.has(Wp)) return; hooked.add(Wp); Wp.ropes = []; Wp.w.solver.iterations = Math.max(Wp.w.solver.iterations, 40);
  Wp.w.addEventListener('preStep', () => { const t = Wp.simT ?? 0; for (const r of Wp.ropes) { for (const p of r.pins) { const at = endAt(p.end, t), B = p.it.body; if (!at) continue; B.velocity.set((at.x - B.position.x) / DT, (at.y - B.position.y) / DT, (at.z - B.position.z) / DT); }
      if (r.cut) { const on = t < r.cut.t; if (on !== r.cut.on) { r.cut.on = on; on ? r.cut.c.enable() : r.cut.c.disable(); } } } }); };
let nRope = 0;
W.rope = (Wp, o = {}) => { const K = { ...KIND[o.kind || 'rope'] }, name = o.name || `${o.kind || 'rope'}${++nRope}`, thick = o.thick ?? K.thick, color = o.color || K.color;
  const A = endAt(o.from, 0) || V(0, 2, 0), B = endAt(o.to, 0), L = o.length ?? (B ? A.distanceTo(B) * (1 + (o.slack ?? .08)) : 1.5), n = o.segments || Math.max(6, Math.min(32, Math.round(L / .14))), pts = hang(A, B, L, n);
  const G = grp(0, 0, 0, o.parent || PS1.scene); G.name = name; const r = { name, kind: o.kind || 'rope', G, length: L, n, seg: L / n, pins: [], nodes: [], segs: [], W: Wp };
  // ---- the look: one piece per span (thin cylinders; a chain is alternating flat links), placed between consecutive points every frame
  const mat = K.links ? W.col(color) : K.tex === 'twist' ? W.mat(twist(color)) : W.col(color), geo = K.links ? PS1.box(thick * 1.6, 1, thick * .5) : PS1.cyl(thick / 2, thick / 2, 1, o.kind === 'wire' || o.kind === 'cord' ? 4 : 5);
  const spans = n + 2; for (let i = 0; i < spans; i++) { const m = add(geo, mat, 0, -99, 0, G); m.userData.noCheck = true; m.visible = false; r.segs.push(m); }
  const place = (m, a, c, i) => { const d = c.clone().sub(a), l = d.length(); if (l < 1e-4) { m.visible = false; return; } m.visible = true; m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); if (K.links && i % 2) m.rotateY(Math.PI / 2); };
  r.draw = P => { let k = 0; for (let i = 0; i + 1 < P.length; i++) { if (r.cut && !r.cut.on && i === r.cut.at) { r.segs[k++].visible = false; continue; } place(r.segs[k++], P[i], P[i + 1], i); } for (; k < r.segs.length; k++) r.segs[k].visible = false; };
  if (!Wp) { r.points = () => pts; r.draw(pts); return r; }
  // ---- the physics: nodes, the constraints between them, bending springs, the ends
  hook(Wp); const load = o.end ? (o.end.def ? o.end.def.mass : o.end.mass) ?? .2 : o.to && o.to.item ? o.to.item.body.mass : 0;
  // a heavy weight on light nodes stretches the rope (the solver cannot converge at a 200:1 mass ratio), so nodes are never lighter than load / 6
  const mass = Math.max((o.mass ?? K.mass * L) / (n + 1), load / 6), rad = Math.max(.012, thick / 2 + .006), mask = -1 ^ ROPE;
  // a slack rope laid out on the ground would start under it (the ground throws it, and whatever it is tied to): lift those points onto it
  for (const q of pts) if (q.y < rad) q.y = rad;
  for (let i = 0; i <= n; i++) { const d = new THREE.Object3D(); d.position.copy(pts[i]); PS1.scene.add(d); const it = Wp.add(d, { name, mass, shape: { type: 'sphere', r: rad }, angularDamping: .9, foley: o.kind === 'chain' ? 'metal' : 'soft', bounce: .05, friction: .6 });
    const bd = it.body; bd.linearDamping = o.damping ?? (load > 0 ? .04 : K.damp); bd.collisionFilterGroup = ROPE; bd.collisionFilterMask = o.collide === false ? 0 : mask; it.mask = bd.collisionFilterMask; it.rope = r; it.node = i; if (bd._listeners) bd._listeners.collide = i === 0 || i === n ? bd._listeners.collide : []; r.nodes.push(it); }
  const cons = []; for (let i = 0; i < n; i++) { const c = new C.DistanceConstraint(r.nodes[i].body, r.nodes[i + 1].body, r.seg, 1e6); Wp.w.addConstraint(c); cons.push(c); }
  const stiff = o.stiff ?? K.stiff; if (stiff > 0) for (let i = 0; i + 2 <= n; i++) Wp.w.addConstraint(new C.DistanceConstraint(r.nodes[i].body, r.nodes[i + 2].body, r.seg * 2 * (1 - .02 * (1 - stiff)), 4 + stiff * stiff * 400));
  const tie = (e, node, i) => { if (!e) return null;
    if (Array.isArray(e) || e.isVector3) { const a = new C.Body({ mass: 0 }); a.position.set(...vec(e).toArray()); a.collisionFilterMask = 0; Wp.w.addBody(a); Wp.w.addConstraint(new C.PointToPointConstraint(a, new C.Vec3(0, 0, 0), node.body, new C.Vec3(0, 0, 0))); return { at: () => vec(e) }; }
    if (e.item) { const p = vec(e.at || [0, 0, 0]).sub(e.item.center), c = new C.PointToPointConstraint(e.item.body, new C.Vec3(p.x, p.y, p.z), node.body, new C.Vec3(0, 0, 0)); Wp.w.addConstraint(c); node.body.collisionResponse = false; return { at: () => e.item.mesh.localToWorld(vec(e.at || [0, 0, 0])) }; }
    // a moving end: a kinematic pin (itself a PHYS item, so it is snapshotted), driven to its target inside every step
    const d = new THREE.Object3D(), at0 = endAt(e, 0); d.position.copy(at0); PS1.scene.add(d); const it = Wp.add(d, { name: name + '.pin' + i, mass: 0, shape: { type: 'sphere', r: .01 } }); it.body.type = C.Body.KINEMATIC; it.body.collisionFilterMask = 0; it.mask = 0; it.body.collisionResponse = false;
    Wp.w.addConstraint(new C.PointToPointConstraint(it.body, new C.Vec3(0, 0, 0), node.body, new C.Vec3(0, 0, 0))); r.pins.push({ it, end: e }); return { at: t => endAt(e, t) }; };
  r.tieA = tie(o.from, r.nodes[0], 0); r.tieB = tie(o.to, r.nodes[n], 1);
  // a weight on the free end (a bulb, a bead, a tyre): a PHYS prop hanging from the last node
  if (o.end && !o.to) { const e = o.end, s = e.size || .05, mesh = e.mesh || (() => { const g = grp(0, 0, 0, PS1.scene); W.b(g, s, s, s, W.col(e.color || '#c8c4bc'), 0, -s / 2, 0); return g; })(); mesh.position.copy(pts[n]);
    const def = e.def || { name: name + '.end', mass: e.mass ?? .2, shape: e.shape || { type: 'box', size: [s, s, s] }, center: e.center || [0, -s / 2, 0], foley: e.foley || 'soft' }; const it = Wp.add(mesh, def);
    Wp.w.addConstraint(new C.PointToPointConstraint(it.body, new C.Vec3(0, (e.hang ?? 0) - (def.center ? def.center[1] : 0), 0), r.nodes[n].body, new C.Vec3(0, 0, 0))); r.endItem = it; r.nodes[n].body.collisionResponse = false; }
  else r.endItem = r.nodes[n];
  // a cut: the span `at` lets go at time t (default the middle)
  if (o.cut != null) { const ct = typeof o.cut === 'number' ? { t: o.cut } : o.cut, at = ct.at ?? Math.floor(n / 2); r.cut = { t: ct.t, at, c: cons[at], on: true }; }
  Wp.ropes.push(r);
  r.points = () => { const P = r.nodes.map(it => it.mesh.position.clone()); if (r.tieA) P.unshift(r.tieA.at(Wp.t)); if (r.tieB) P.push(r.tieB.at(Wp.t)); if (r.endItem && r.endItem !== r.nodes[n]) { r.endItem.mesh.updateMatrixWorld(true); P.push(r.endItem.mesh.localToWorld(V(0, e0hang(o), 0))); } return P; };
  S.fx.push(t => { if (Wp.t !== t) Wp.step(t); r.draw(r.points()); }); return r; };
const e0hang = o => (o.end && o.end.hang) || 0;
// settle every rope (and every prop) in a world before t = 0, so nothing starts the scene still falling into place. Call once at the end of build
W.settle = (Wp, secs = 2) => { if (Wp.snaps && Wp.snaps.length) { console.warn('WORLD.settle: call it before the first W.step'); return; } Wp.simT = 0; for (let i = 0; i < Math.round(secs / DT); i++) Wp.w.step(DT);
  for (const it of Wp.items) { it.body.velocity.set(0, 0, 0); it.body.angularVelocity.set(0, 0, 0); } return Wp; };
// a rope's world points right now (for a hand to follow, a camera to frame, a check)
W.ropeAt = (r, i) => r.points()[i ?? r.points().length - 1];

// ---- rope set pieces
// a tyre swing (or a plank swing) hanging from a branch point; push it with W.push(sw.seat, t, [x, y, z])
W.tireSwing = (Wp, o = {}) => { const at = vec(o.at || [0, 3.2, 0]), tyre = grp(0, 0, 0, PS1.scene), tm = W.col('#151515'); const t1 = add(new THREE.TorusGeometry(.32, .1, 5, 10), tm, 0, -.32, 0, tyre); t1.rotation.y = o.ry || 0;
  const rp = W.rope(Wp, { from: at.toArray(), length: o.len || 2.0, kind: 'rope', end: { mesh: tyre, def: { name: 'tyre swing', mass: 9, shape: { type: 'cylinder', r: .4, h: .2 }, center: [0, -.32, 0], foley: 'rubber' }, hang: 0 }, name: o.name || 'tyre swing' });
  return { rope: rp, seat: rp.endItem }; };
// a clothesline between two points, sheets pegged on it that hang from the rope and move with it (wind: push the middle node now and then)
W.clothesline = (Wp, o = {}) => { const a = vec(o.from || [-2, 1.9, 0]), c = vec(o.to || [2, 1.9, 0]), rp = W.rope(Wp, { from: a.toArray(), to: c.toArray(), kind: 'cord', color: '#d8d4c8', slack: .04, name: o.name || 'clothesline' }), sheets = [];
  const n = o.sheets ?? 3, cols = o.colors || ['#ece8e0', '#c8d4e0', '#e8d0c8', '#d8e0c8']; for (let i = 0; i < n; i++) { const m = add(new THREE.PlaneGeometry(1, 1), W.col(cols[i % cols.length], W.DS), 0, -99, 0, PS1.scene); m.userData.noCheck = true; sheets.push({ m, u: (i + .7) / (n + .4) }); }
  S.fx.push(t => { const P = rp.points(), at = u => { const f = u * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)); return P[i].clone().lerp(P[i + 1], f - i); };
    for (const s of sheets) { const p0 = at(s.u - .07), p1 = at(s.u + .07), w = p0.distanceTo(p1), h = o.drop || .9, g = S.gust ? S.gust(p0.x, p0.z, t) : .5; s.m.position.copy(p0).lerp(p1, .5).add(V(0, -h / 2, 0)); s.m.scale.set(w, h, 1); s.m.lookAt(s.m.position.clone().add(V(0, 0, 1)));
      s.m.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z) - Math.PI / 2; s.m.rotateX(-(.1 + .25 * g) + .06 * Math.sin(t * 3 + s.u * 9)); } });
  if (Wp && o.wind !== false) for (let k = 0; k < (o.gusts || 20); k++) Wp.push(rp.nodes[Math.floor(rp.n / 2)], 1 + k * 2.7, [0, 0, .12 + .05 * Math.sin(k * 1.7)]);
  for (const p of [a, c]) { W.b(PS1.scene, .08, p.y + .2, .08, W.col('#6a5a44'), p.x, (p.y + .2) / 2, p.z); W.b(PS1.scene, .6, .06, .06, W.col('#6a5a44'), p.x, p.y + .05, p.z); }
  return { rope: rp, sheets }; };
// a swing set: an A-frame of pipe, two seats each on two chains (push a seat: W.push(set.seats[0], t, [0, 0, 6]))
W.swingSet = (Wp, o = {}) => { const g = grp(...(o.at || [0, 0, 0]), o.parent || PS1.scene); g.rotation.y = o.ry || 0; g.updateMatrixWorld(true); const pipe = W.col(o.color || '#3a6a8a'), H = 2.3, Lw = 3.2;
  for (const s of [-1, 1]) for (const k of [-1, 1]) W.span(g, V(s * Lw / 2, H, 0), V(s * (Lw / 2 + .15), 0, k * .9), .06, pipe); W.span(g, V(-Lw / 2 - .1, H, 0), V(Lw / 2 + .1, H, 0), .07, pipe);
  const seats = []; for (const x of [-.75, .75]) { const top = [-.22, .22].map(dx => g.localToWorld(V(x + dx, H, 0))), seat = grp(0, 0, 0, PS1.scene); W.b(seat, .5, .03, .2, W.col('#1a1a1a'), 0, 0, 0); seat.position.copy(top[0]).lerp(top[1], .5).add(V(0, -1.75, 0)); seat.rotation.y = o.ry || 0;
    const it = Wp.add(seat, { name: 'swing seat', mass: 2, shape: { type: 'box', size: [.5, .03, .2] }, center: [0, 0, 0], foley: 'rubber' }); for (const [i, tp] of top.entries()) W.rope(Wp, { from: tp.toArray(), to: { item: it, at: [i ? .22 : -.22, 0, 0] }, length: 1.75, kind: 'chain', slack: 0, name: 'swing chain' }); seats.push(it); }
  return { G: g, seats }; };
// a power line between poles: wires that sag (and swing in wind with physics, or hang still without)
W.powerLine = (Wp, a, c, o = {}) => [-.6, 0, .6].slice(0, o.wires || 3).map(off => W.rope(o.physics ? Wp : null, { from: vec(a).add(V(0, 0, off)).toArray(), to: vec(c).add(V(0, 0, off)).toArray(), kind: 'wire', slack: o.slack ?? .02, segments: 12, name: 'power line' }));
})();
