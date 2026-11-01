// PHYSICS (Phase 4): props that fall, roll, tip, swing, get picked up, carried, set down, thrown and dropped, on cannon-es (window.CANNON,
// loaded from lib/vendor/cannon.js). Shapes stay stylised like the props: boxes, spheres, cylinders.
// Everything is a pure function of scene time t. The world is snapshotted every SNAP seconds along one canonical run (restore snapshot k-1, step
// SNAP seconds, save k), and the state at any t is "restore the snapshot before t, step to t". So stills, motion-blur sub-frames and re-renders
// all agree whatever order frames are drawn in.
// Order in a scene's update(t): W.step(t) first (it may pose a character at a release time to find its hand), then pose the characters.
// Exposes window.PHYS = { world, shapeOf, suspension }.
(function () {
const C = window.CANNON, V = (x, y, z) => new THREE.Vector3(x, y, z), HZ = 120, DT = 1 / HZ, SNAP = .25;
const PH = window.PHYS = { HZ, SNAP };
const v3 = a => new C.Vec3(a[0], a[1], a[2]);
// a prop's collision shape from its definition: { type: 'box', size: [w, h, d] } | { type: 'sphere', r } | { type: 'cylinder', r, h } (upright along y)
PH.shapeOf = s => s.type === 'sphere' ? new C.Sphere(s.r) : s.type === 'cylinder' ? new C.Cylinder(s.r, s.r, s.h, 8) : new C.Box(new C.Vec3(s.size[0] / 2, s.size[1] / 2, s.size[2] / 2));
// a mesh's bounds as a box shape (for static set pieces and doors): its own geometry box, scaled, centred where it is in the world
const boxOf = o => { o.updateMatrixWorld(true); const b = new THREE.Box3(); o.traverse(m => { if (m.isMesh) { m.geometry.computeBoundingBox(); const g = m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().copy(o.matrixWorld).invert().multiply(m.matrixWorld)); b.union(g); } });
  const c = b.getCenter(V(0, 0, 0)), sz = b.getSize(V(0, 0, 0)).multiply(o.getWorldScale(V(0, 0, 0))), q = o.getWorldQuaternion(new THREE.Quaternion()), p = c.multiply(o.getWorldScale(V(0, 0, 0))).applyQuaternion(q).add(o.getWorldPosition(V(0, 0, 0)));
  return { size: [Math.max(sz.x, .02), Math.max(sz.y, .02), Math.max(sz.z, .02)], pos: p, quat: q }; };

PH.world = (o = {}) => {
  const w = new C.World({ gravity: new C.Vec3(0, o.gravity ?? -9.81, 0) }); w.allowSleep = false; w.broadphase = new C.NaiveBroadphase(); w.solver.iterations = o.iterations || 14;
  w.defaultContactMaterial.friction = o.friction ?? .45; w.defaultContactMaterial.restitution = o.bounce ?? .2; w.defaultContactMaterial.contactEquationStiffness = 1e7;
  const W = { w, items: [], carries: [], pushes: [], targets: [], doors: [], snaps: [], impacts: [], hits: {}, memo: {}, built: 0, t: -1 };
  // ---- bodies
  // W.add(mesh, def, o): a dynamic prop. def = { mass, shape, center: [x,y,z] (shape centre in the mesh's frame), bounce, friction, name }
  W.add = (mesh, def, x = {}) => { mesh.updateMatrixWorld(true); const b = new C.Body({ mass: def.mass ?? 1, linearDamping: .05, angularDamping: def.angularDamping ?? .12 }), c = def.center || [0, 0, 0];
    // the body's origin (its centre of mass) is the shape's centre, not the prop's base: a lying bottle stays lying, a pushed chair tips
    b.addShape(PH.shapeOf(def.shape)); const q = mesh.getWorldQuaternion(new THREE.Quaternion()), p = mesh.getWorldPosition(V(0, 0, 0)).add(V(...c).applyQuaternion(q));
    b.position.set(p.x, p.y, p.z); b.quaternion.set(q.x, q.y, q.z, q.w); if (def.bounce != null || def.friction != null) b.material = new C.Material({ friction: def.friction ?? .45, restitution: def.bounce ?? .2 });
    if (x.velocity) b.velocity.set(...x.velocity); w.addBody(b); const it = { mesh, body: b, def, center: V(...c), name: def.id || def.name || mesh.name || `body${W.items.length}`, mask: b.collisionFilterMask };
    b.addEventListener('collide', e => { const s = Math.abs(e.contact.getImpactVelocityAlongNormal()); if (s > .6 && W.recording) W.impacts.push({ t: +W.simT.toFixed(3), name: it.name, kind: def.foley || def.name || 'thud', speed: +s.toFixed(2), with: (W.items.find(i => i.body === e.body) || {}).name || 'set', pos: [b.position.x, b.position.y, b.position.z].map(v => +v.toFixed(2)) }); });
    W.items.push(it); return it; };
  // W.solid(mesh | { size, at, ry }): something static props collide with (a table top, a counter, a wall). Meshes use their bounds
  W.solid = s => { const d = s.isObject3D ? boxOf(s) : { size: s.size, pos: V(...s.at), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.ry || 0, 0)) }, b = new C.Body({ mass: 0 });
    b.addShape(new C.Box(new C.Vec3(d.size[0] / 2, d.size[1] / 2, d.size[2] / 2))); b.position.set(d.pos.x, d.pos.y, d.pos.z); b.quaternion.set(d.quat.x, d.quat.y, d.quat.z, d.quat.w); w.addBody(b); return b; };
  W.ground = (y = 0) => { const b = new C.Body({ mass: 0 }); b.addShape(new C.Plane()); b.quaternion.setFromEuler(-Math.PI / 2, 0, 0); b.position.set(0, y, 0); w.addBody(b); return b; };
  // every solid a set kit registered (SETS.solids): tables, counters, beds, shelves, walls
  W.fromSets = (list = (window.SETS && SETS.solids) || []) => { for (const s of list) W.solid(s); return W; };
  // ---- doors: a slab on a hinge, swung by pushes (W.push) or a character walking through; limits in radians from closed
  W.door = (mesh, o = {}) => { const d = boxOf(mesh), it = W.add(mesh, { name: o.name || 'door', mass: o.mass ?? 14, shape: { type: 'box', size: d.size }, angularDamping: o.damping ?? .5, foley: 'door' });
    const hinge = v3(o.hinge), anchor = new C.Body({ mass: 0 }); anchor.position.copy(hinge); w.addBody(anchor);
    const local = hinge.vsub(it.body.position); it.body.quaternion.conjugate().vmult(local, local);
    w.addConstraint(new C.HingeConstraint(anchor, it.body, { pivotA: new C.Vec3(0, 0, 0), axisA: v3(o.axis || [0, 1, 0]), pivotB: local, axisB: it.body.quaternion.conjugate().vmult(v3(o.axis || [0, 1, 0])) }));
    it.door = { q0: it.body.quaternion.clone(), axis: v3(o.axis || [0, 1, 0]), lim: o.limits || [-1.9, 1.9] }; W.doors.push(it); return it; };
  // W.push(item, at, impulse [x,y,z], point [x,y,z] offset from its centre): a shove, a kick, a hit, a gust
  W.push = (it, at, imp, pt = [0, 0, 0]) => { W.pushes.push({ it, at, imp, pt }); W.pushes.sort((a, b) => a.at - b.at); return W; };
  // ---- hands: W.carry(item, { by, side, from, to, pose, end: 'drop' | 'set' | 'throw', vel, spin, grip })
  // From `from` to `to` the prop rides the character's hand bone (P.hold); at `to` it is let go where the hand is, with the hand's own velocity
  // (plus `vel` for a throw). pose(t) must pose the character for time t (e.g. t => CAST.act(P, t, track)); it is called once per release.
  W.carry = (it, o) => { const c = { it, side: 'R', end: 'drop', ...o }; W.carries.push(c); return c; };
  // ---- hits: a named target (a function of t giving a point, e.g. a character's chest) that flying props can hit; W.hitAt(name) = when
  W.target = (name, at, r = .3) => { W.targets.push({ name, at, r }); return W; };

  const held = (it, t) => W.carries.find(c => c.it === it && t >= c.from && t < c.to);
  const gripOf = c => { const g = c.grip || (c.it.def.grip ? [-c.it.def.grip[0], -c.it.def.grip[1] - .07, -c.it.def.grip[2] + .03] : [0, -.07, .03]); return g; };
  // the prop's world pose in the hand at time t (memoised per carry and t: poses the character, so call before the scene poses for this frame)
  const handPose = (c, t) => { const k = `${W.carries.indexOf(c)}@${t.toFixed(4)}`; if (W.memo[k]) return W.memo[k]; c.pose(t); const h = c.by['arm' + c.side].hand; c.by.G.updateMatrixWorld(true);
    const g = gripOf(c), m = h.matrixWorld.clone().multiply(new THREE.Matrix4().compose(V(...g), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(c.rot || [0, 0, 0]))), V(1, 1, 1)));
    const p = V(0, 0, 0), q = new THREE.Quaternion(), s = V(0, 0, 0); m.decompose(p, q, s); W.posed = true; return (W.memo[k] = { p, q }); };
  // the hand is read just before the let-go (at exactly `to` a scene's pose may already have moved on)
  const release = c => { const a0 = handPose(c, c.to - .001), b = handPose(c, c.to - .001 - 1 / 30),
    // a set-down lands upright: only the prop's heading is kept from the hand
    a = c.end === 'set' ? { p: a0.p, q: (() => { const e = new THREE.Euler().setFromQuaternion(a0.q, 'YXZ'); return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, e.y, 0, 'YXZ')); })() } : a0, v = a.p.clone().sub(b.p).multiplyScalar(30), B = c.it.body;
    const cp = a.p.clone().add(c.it.center.clone().applyQuaternion(a.q)); B.position.set(cp.x, cp.y, cp.z); B.quaternion.set(a.q.x, a.q.y, a.q.z, a.q.w);
    if (c.end === 'set') v.set(0, 0, 0); if (c.vel) v.add(V(...c.vel)); B.velocity.set(v.x, v.y, v.z); B.angularVelocity.set(...(c.spin || (c.end === 'throw' ? [4, 1, 2] : [0, 0, 0]))); };
  // one fixed step at sim time T → T + DT: pickups, releases, pushes, door limits, hits
  const step1 = T => { for (const it of W.items) { const h = held(it, T + DT); const was = it.parked;
      if (h && !was) { it.body.type = C.Body.KINEMATIC; it.body.collisionFilterMask = 0; it.body.velocity.set(0, 0, 0); it.body.angularVelocity.set(0, 0, 0); it.parked = true; }
      if (!h && was) { it.body.type = C.Body.DYNAMIC; it.body.collisionFilterMask = it.mask; it.parked = false; } }
    for (const c of W.carries) if (c.to > T && c.to <= T + DT) release(c);
    for (const p of W.pushes) if (p.at > T && p.at <= T + DT) p.it.body.applyImpulse(v3(p.imp), p.it.body.quaternion.vmult(v3(p.pt)));
    W.simT = T + DT; w.step(DT);
    for (const d of W.doors) { const rel = d.door.q0.conjugate().mult(d.body.quaternion), ang = 2 * Math.atan2(new C.Vec3(rel.x, rel.y, rel.z).dot(d.door.axis), rel.w), [lo, hi] = d.door.lim;
      if (ang < lo || ang > hi) { const av = d.body.angularVelocity.dot(d.door.axis); if ((ang > hi && av > 0) || (ang < lo && av < 0)) d.body.angularVelocity.vsub(d.door.axis.scale(av * 1.35), d.body.angularVelocity); } }
    for (const g of W.targets) if (W.hits[g.name] == null) { const at = g.at(T + DT); for (const it of W.items) { if (it.parked || it.body.velocity.length() < 2) continue; const p = it.body.position;
      if (V(p.x, p.y, p.z).distanceTo(at) < g.r) { W.hits[g.name] = +(T + DT).toFixed(3); W.impacts.push({ t: W.hits[g.name], name: it.name, kind: 'hit', speed: +it.body.velocity.length().toFixed(2), with: g.name }); break; } } } };
  const save = () => ({ b: W.items.map(it => ({ p: it.body.position.clone(), q: it.body.quaternion.clone(), v: it.body.velocity.clone(), a: it.body.angularVelocity.clone(), type: it.body.type, parked: !!it.parked })), hits: { ...W.hits } });
  const load = s => { s.b.forEach((x, i) => { const B = W.items[i].body; B.position.copy(x.p); B.quaternion.copy(x.q); B.velocity.copy(x.v); B.angularVelocity.copy(x.a); B.previousPosition.copy(x.p); B.interpolatedPosition.copy(x.p);
    B.type = x.type; W.items[i].parked = x.parked; B.collisionFilterMask = x.parked ? 0 : W.items[i].mask; B.force.set(0, 0, 0); B.torque.set(0, 0, 0);
    B.previousQuaternion.copy(x.q); B.interpolatedQuaternion.copy(x.q); B.aabbNeedsUpdate = true; B.updateInertiaWorld(true); }); W.hits = { ...s.hits }; };
  // W.step(t): the world at time t, synced onto the meshes (held props ride the hand; the rest follow their bodies)
  W.step = t => { t = Math.max(0, t); W.posed = false; const N = Math.round(SNAP * HZ);
    if (!W.snaps.length) { W.t0 = 0; W.snaps.push(save()); }
    const k = Math.floor(t / SNAP + 1e-9);
    while (W.snaps.length <= k) { const j = W.snaps.length; load(W.snaps[j - 1]); W.recording = true; for (let i = 0; i < N; i++) step1((j - 1) * SNAP + i * DT); W.recording = false; W.snaps.push(save()); }
    load(W.snaps[k]); const n = Math.round((t - k * SNAP) * HZ); for (let i = 0; i < n; i++) step1(k * SNAP + i * DT); W.t = t;
    for (const it of W.items) { const c = held(it, t); if (c) { if (c.by.held[c.side] !== it.mesh) c.by.hold(it.mesh, c.side, gripOf(c), c.rot); continue; }
      for (const s of ['L', 'R']) for (const P of W.carries.map(c => c.by)) if (P.held[s] === it.mesh) P.release(s);
      if (it.mesh.parent !== PS1.scene) PS1.scene.add(it.mesh); const B = it.body; it.mesh.quaternion.set(B.quaternion.x, B.quaternion.y, B.quaternion.z, B.quaternion.w); it.mesh.position.set(B.position.x, B.position.y, B.position.z).sub(it.center.clone().applyQuaternion(it.mesh.quaternion)); }
    return W; };
  W.hitAt = name => { W.step(Math.max(W.t, 0)); return W.hits[name]; };
  // when something will hit a target, by simulating ahead (deterministic; use it to cue a ragdoll): returns a time or null
  W.firstHit = (name, until) => { for (let k = 0; k * SNAP <= until; k++) { W.step(k * SNAP); if (W.hits[name] != null) return W.hits[name]; } return null; };
  // every impact on the canonical run up to t (for foley: { t, name, kind, speed, with }), sorted and de-duplicated
  W.impactLog = (until) => { W.step(until); const seen = new Set(); return W.impacts.filter(i => i.t <= until).sort((a, b) => a.t - b.t).filter(i => { const k = `${i.name}|${i.with}|${Math.round(i.t * 20)}`; if (seen.has(k)) return false; seen.add(k); return true; }); };
  // clipping: dynamic props sunk more than 2 cm into anything at time t (fed to CAM.check through PHYS.checks)
  W.clipping = t => { W.step(t); const out = []; for (const c of w.contacts) { const bi = c.bi, bj = c.bj, pi = bi.position.vadd(c.ri), pj = bj.position.vadd(c.rj), d = pj.vsub(pi).dot(c.ni);
      if (d < -.02) { const a = W.items.find(i => i.body === bi), b = W.items.find(i => i.body === bj); out.push(`${(a || {}).name || 'set'} sunk ${(-d * 100).toFixed(0)} cm into ${(b || {}).name || 'set'}`); } } return [...new Set(out)]; };
  PH.active = W; return W; };
// CAM.check calls this per checked time (camera.js): physics clipping as shot problems
PH.checks = t => PH.active ? PH.active.clipping(t).map(p => ({ problem: `physics: ${p}` })) : [];

// vehicle suspension: body pitch and roll from the path's acceleration and turning, a damped spring integrated from t=0 (pure in t, cached).
// path(t) → Vector3 (ground point). Returns t → { pitch, roll, bounce } in radians / metres
PH.suspension = (path, o = {}) => { const k = o.stiffness ?? 38, c = o.damping ?? 7, gain = o.gain ?? .012, cache = [{ p: 0, r: 0, vp: 0, vr: 0 }];
  const acc = t => { const h = .05, a = path(t - h), b = path(t), d = path(t + h), v1 = b.clone().sub(a).divideScalar(h), v2 = d.clone().sub(b).divideScalar(h), A = v2.clone().sub(v1).divideScalar(h), f = v2.lengthSq() > 1e-6 ? v2.clone().normalize() : V(0, 0, 1);
    const side = V(f.z, 0, -f.x); return { fwd: A.dot(f), lat: A.dot(side) }; };
  return t => { const n = Math.max(0, Math.round(t * HZ)); for (let i = cache.length; i <= n; i++) { const s = cache[i - 1], a = acc((i - 1) * DT);
      const vp = s.vp + (-k * s.p - c * s.vp - a.fwd * gain * k) * DT, vr = s.vr + (-k * s.r - c * s.vr - a.lat * gain * k) * DT; cache.push({ p: s.p + vp * DT, r: s.r + vr * DT, vp, vr }); }
    const s = cache[n]; return { pitch: s.p, roll: s.r, bounce: (o.rough ?? .006) * Math.sin(t * 23.7) * Math.sin(t * 7.1) }; }; };
})();
