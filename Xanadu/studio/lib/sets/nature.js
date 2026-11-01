// SETS: NATURE AND LIFE, moved in from the Hitchhiker detail pass (tests/hitchhiker-pipeline/scene.js, which keeps its own copy so its takes stay
// comparable). Grass fields that sway in rolling gusts, live and dead trees, clouds, birds and vultures, pollen, bugs at lights, laundry, cows,
// windmills, bales, an armadillo, dust trails, and the road kit: asphalt with dashes, gravel shoulders, cracks and patches, poles and sagging
// wires, barbed wire and rail fences, road signs. Every animated thing pushes a function of t onto fx (SETS.fx unless one is passed).
(function () {
const S = SETS, T = S.T, { V, rng } = PS1, tex = PS1.tex, noise = PS1.noise, M = (t, o) => PS1.mat(t, o), add = PS1.add, box = PS1.box, cyl = PS1.cyl, grp = PS1.group, DS = S.DS;
Object.assign(T, {
  blade: [0, '#e8d040', '#5a6ad0', '#f0ece0'].map((fl, k) => PS1.mip(tex(16, 16, (q, w, h, r) => { for (let i = 0; i < 9; i++) { const x = (i * 1.8 + r() * 1.2) | 0, bh = 7 + (r() * 9 | 0); q.fillStyle = ['#5e8228', '#7a9a34', '#a8a050', '#4a6e20', '#8eaa3e'][i % 5]; q.fillRect(x, h - bh, 2, bh); q.fillRect(x + (r() < .5 ? -1 : 1), h - bh + 2, 1, 2); }
    if (fl) for (let i = 0; i < 4; i++) { const x = 1 + (r() * 13 | 0), y = 1 + (r() * 6 | 0); q.fillStyle = fl; q.fillRect(x, y, 2, 2); q.fillStyle = k === 1 ? '#b07020' : '#f0e8a0'; q.fillRect(x, y, 1, 1); } }, 40 + k))),
  gravel: PS1.mip(tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7a5e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5e5444', 90, .9); noise(q, w, h, r, '#b8a888', 60, .8); })),
  crack: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#221e1a'; let x = 1, y = 8; for (let i = 0; i < 15; i++) { q.fillRect(x, y, 1, 1); x++; y += r() < .5 ? -1 : r() < .5 ? 1 : 0; if (r() < .15) q.fillRect(x, y + 1, 1, 2); } }),
  patch: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#34302c'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#24201c', 20, .8); }),
  hide: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a4a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e2d8c4'; q.fillRect(1, 2, 3, 2); q.fillRect(5, 5, 2, 2); noise(q, w, h, r, '#4a2a18', 10, .6); }),
  straw: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#c8a858'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#9a7a3a', 24, .8); noise(q, w, h, r, '#e8d088', 12, .7); }),
  leaf: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#5a6a2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a4a1a', 24, .9); noise(q, w, h, r, '#8a9a44', 12, .8); }),
  leafDark: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#2e4a22'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1a2e14', 24, .9); noise(q, w, h, r, '#4a6a2e', 12, .8); }),
  cloud: tex(32, 12, (q, w, h, r) => { q.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { const cw = 6 + (r() * 10 | 0), ch = 3 + (r() * 4 | 0); q.fillRect(3 + (r() * (w - 6 - cw) | 0), h - 2 - ch - (r() * 3 | 0), cw, ch); } q.fillRect(4, h - 4, w - 8, 3); }),
  signRust: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#9a5a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a3018', 70, .9); q.fillStyle = '#e8dcc0'; q.fillRect(2, 4, 12, 2); q.fillRect(3, 8, 10, 2); noise(q, w, h, r, '#7a3a1a', 30, .9); }) });
const clumpGeo = (() => { const P = [], UV = []; for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(.9, .62).toNonIndexed(); g.translate(0, .31, 0); g.rotateY(k * Math.PI / 3); P.push(...g.attributes.position.array); UV.push(...g.attributes.uv.array); }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); G.setAttribute('normal', new THREE.Float32BufferAttribute(P.map((_, i) => i % 3 === 1 ? 1 : 0), 3)); return G; })();
// a wind wave rolling across the land
const gust = S.gust = (x, z, t) => .5 + .5 * Math.sin(t * 1.15 - x * .13 - z * .09);
// a field of dry grass clumps (some flowering) wherever keep(x, z, r) allows (and outside SETS.keepOuts)
S.field = (parent, n, seed, [x0, x1, z0, z1], keep = () => true, fx = S.fx) => { const r = rng(seed), mats = T.blade.map(b => M(b, DS)), L = [];
  for (let i = 0, k = 0; i < n && k < n * 10; k++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (!keep(x, z, r) || S.kept(x, z)) continue; i++;
    const c = add(clumpGeo, mats[r() < .14 ? 1 + (r() * 3 | 0) : 0], x, 0, z, parent), s = .8 + r() * .9; c.scale.set(s, s * (.75 + r() * .5), s); c.rotation.order = 'ZXY'; c.rotation.y = r() * 6.28; c.userData.ph = r() * 6.28; c.userData.noCheck = true; L.push(c); }
  fx.push(t => { for (const c of L) { const g = gust(c.position.x, c.position.z, t); c.rotation.z = -(.06 + .16 * g) + .05 * Math.sin(t * 2.3 + c.userData.ph) * (.4 + g); c.rotation.x = .05 * g * Math.sin(t * 1.7 + c.userData.ph * 1.3); } }); return L; };
S.kept = (x, z) => S.keepOuts.some(({ r }) => x > r[0] && x < r[1] && z > r[2] && z < r[3]);
// a footprint of radius rad against the keep-outs
S.keptR = (x, z, rad = 0) => S.keepOuts.some(({ r }) => x + rad > r[0] && x - rad < r[1] && z + rad > r[2] && z - rad < r[3]);
S.deadTree = (x, z, h, parent, seed = 1) => { const r = rng(seed), G = grp(x, 0, z, parent); add(cyl(.12, .2, h, 5), M(T.pine), 0, h / 2, 0, G); for (let k = 0; k < 4; k++) { const b = add(box(.08, h * .35, .08), M(T.pine), 0, h * (.55 + k * .1), 0, G); b.rotation.set((r() - .5) * 1.4, r() * 6, (r() < .5 ? -1 : 1) * (.6 + r() * .5)); } return G; };
S.liveTree = (x, z, h, parent, seed = 1, fx = S.fx, o = {}) => { const r = rng(seed), G = grp(x, 0, z, parent), top = grp(0, h * .62, 0, G), lm = M(o.dark ? T.leafDark : T.leaf); add(cyl(.14, .24, h * .7, 6), M(T.pine), 0, h * .35, 0, G);
  for (let k = 0; k < 6; k++) { const a = k * 1.05 + r(), d = .6 + r() * .9, s = 1.0 + r() * .9, b = add(box(s, s * .55, s), lm, Math.cos(a) * d, .4 + r() * 1.3, Math.sin(a) * d, top); b.rotation.y = r() * 3; b.userData.ph = r() * 6; }
  fx.push(t => { const g = gust(x, z, t); top.rotation.z = -(.015 + .03 * g) + Math.sin(t * 2.1 + seed) * .012; top.rotation.x = Math.sin(t * 1.6 + seed) * .012 * g; top.children.forEach(b => b.rotation.x = Math.sin(t * 3.3 + b.userData.ph) * .05 * g); }); return G; };
// a pine (stacked cones as boxes, the PS1 way) for woods
S.pineTree = (x, z, h, parent, seed = 1, fx = S.fx) => { const r = rng(seed), G = grp(x, 0, z, parent), m = M(T.leafDark); add(cyl(.1, .18, h * .4, 5), M(T.pine), 0, h * .2, 0, G);
  const tiers = [...Array(4)].map((_, k) => { const s = (1 - k * .22) * h * .32, b = add(new THREE.ConeGeometry(s, h * .32, 6), m, 0, h * (.3 + k * .17), 0, G); b.rotation.y = r() * 2; return b; });
  fx.push(t => { const g = gust(x, z, t); tiers.forEach((b, k) => b.rotation.z = -(.01 + .02 * g) * (k + 1) * .5); }); return G; };
S.bush = (x, z, s, parent, seed = 1) => { const r = rng(seed), G = grp(x, 0, z, parent), m = M(T.leaf); for (let k = 0; k < 4; k++) { const b = add(box(s * (.6 + r() * .4), s * (.4 + r() * .3), s * (.6 + r() * .4)), m, (r() - .5) * s * .6, s * .25, (r() - .5) * s * .6, G); b.rotation.y = r() * 3; } return G; };
S.rock = (x, z, s, parent, seed = 1) => { const r = rng(seed), b = add(new THREE.DodecahedronGeometry(s, 0), M(T.stone), x, s * .4, z, parent); b.rotation.set(r(), r() * 6, r()); b.scale.y = .6; return b; };
S.clouds = (cx, cz, parent, seed = 1, rad = 82, fx = S.fx) => { const r = rng(seed), ring = grp(cx, 0, cz, parent), mats = [];
  for (let i = 0; i < 10; i++) { const a = i * .628 + r() * .3, m = M(T.cloud, { unlit: true, noFog: true, side: THREE.DoubleSide }); mats.push(m); const c = add(new THREE.PlaneGeometry(26 + r() * 14, 9 + r() * 4), m, Math.cos(a) * rad, 24 + r() * 14, Math.sin(a) * rad, ring); c.lookAt(cx, 30, cz); c.userData.sky = true; }
  fx.push((t, C) => { ring.rotation.y = t * .006; if (!C || !C.U) return; const u = C.U.fogColor || C.U.skyCol; if (!u) return; const v = u.value, c = v.isColor ? v.clone() : (() => { const k = Math.max(v.x, v.y, v.z, 1e-3); return new THREE.Color(v.x / k, v.y / k, v.z / k); })(); c.lerp(new THREE.Color('#fff8ec'), .55); for (const m of mats) m.uniforms.tint.value.copy(c); }); return ring; };
// a bird circling (a vulture: big, slow) or crossing
S.bird = (parent, c, rad, w, ph, size = 1, flap = 2.2, fx = S.fx) => { const G = grp(0, 0, 0, parent), m = M(T.black); add(box(.14 * size, .08 * size, .5 * size), m, 0, 0, 0, G); G.userData.noCheck = true;
  const wings = [-1, 1].map(s => { const p = grp(0, 0, 0, G); add(box(.9 * size, .03, .28 * size), m, s * .45 * size, 0, 0, p); return p; });
  fx.push(t => { const a = t * w + ph; G.position.set(c.x + Math.cos(a) * rad, c.y + Math.sin(t * .7 + ph) * .6, c.z + Math.sin(a) * rad); G.rotation.set(0, -a + (w > 0 ? 0 : Math.PI), -.25 * Math.sign(w)); wings.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * (.12 + Math.sin(t * flap + ph) * .18)); }); return G; };
S.motes = (parent, n, [x0, x1, y0, y1, z0, z1], seed, col = '#fff0c0', fx = S.fx) => { const r = rng(seed), m = M(PS1.color(col), { unlit: true }), L = [];
  for (let i = 0; i < n; i++) { const o = add(box(.018, .018, .018), m, 0, -99, 0, parent); o.userData = { b: V(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), z0 + r() * (z1 - z0)), ph: r() * 6.28, s: .25 + r() * .4, fx: 'mote' }; L.push(o); }
  const G = { visible: true }; fx.push(t => L.forEach(o => { const u = o.userData; o.visible = G.visible; o.position.set(u.b.x + Math.sin(t * u.s + u.ph) * .45 + Math.sin(t * .2) * .3, u.b.y + Math.sin(t * u.s * 1.3 + u.ph * 2) * .3, u.b.z + Math.cos(t * u.s * .8 + u.ph) * .45); })); return G; };
S.bugs = (parent, p, n = 6, fx = S.fx) => { const m = M(PS1.color('#2a2620'), { unlit: true }), L = [...Array(n)].map(() => { const b = add(box(.02, .02, .02), m, 0, -99, 0, parent); b.userData.fx = 'bug'; return b; });
  const G = { visible: true }; fx.push(t => L.forEach((b, i) => { b.visible = G.visible; const a = t * (6 + i * 1.7) + i * 2.1; b.position.set(p.x + Math.cos(a) * (.12 + .06 * Math.sin(t * 3 + i)), p.y + Math.sin(t * (4 + i) + i) * .1, p.z + Math.sin(a * 1.3) * (.12 + .05 * Math.cos(t * 2 + i))); })); return G; };
S.laundry = (x, y, z, w, h, mat, parent, ph = 0, fx = S.fx) => { const n = 4, L = []; for (let i = 0; i < n; i++) { const p = grp(x - w / 2 + (i + .5) * w / n, y, z, parent); add(box(w / n + .005, h, .01), mat, 0, -h / 2, 0, p); L.push(p); }
  fx.push(t => L.forEach((p, i) => { const g = gust(x, z, t); p.rotation.x = .1 + .3 * g + Math.sin(t * 3.4 + i * .7 + ph) * .1 * (.5 + g); p.rotation.z = Math.sin(t * 2.2 + i + ph) * .03; })); };
S.dustTrail = (parent, n, state, col = '#c8a878', fx = S.fx) => { const m = M(PS1.color(col), { unlit: true }), L = [...Array(n)].map(() => { const d = add(box(.13, .13, .13), m, 0, -99, 0, parent); d.userData.fx = 'dust'; return d; });
  fx.push(t => L.forEach((d, i) => { const cyc = .9, age = (t + i * cyc / n) % cyc, ts = t - age, s = state(ts, t); if (!s) { d.position.y = -99; return; } const side = i % 2 ? 1 : -1, sp = Math.sin(i * 12.9898) * .5;
    d.position.set(s.x + side * (s.half + age * (.4 + sp * .3)), .1 + age * .9 * (1 - age * .45), s.z + age * (.5 + sp)); d.scale.setScalar(.5 + age * 3); d.rotation.set(age * 3, i, age * 2); })); };
S.windmill = (x, z, ry, parent, fx = S.fx) => { const G = grp(x, 0, z, parent), R = M(T.rust), W = M(T.tin), h = 7; G.rotation.y = ry;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(box(.08, h, .08), R, sx * .34, h / 2, sz * .34, G); l.rotation.set(-sz * .06, 0, sx * .06); }
  for (let k = 1; k < 4; k++) { const wd = .68 - k * .21 * (h / 7) * .5; for (const s of [-1, 1]) { add(box(wd * 2, .05, .05), R, 0, h * k / 4, s * (.34 - k * .1), G); add(box(.05, .05, wd * 2), R, s * (.34 - k * .1), h * k / 4, 0, G); } }
  add(box(.5, .06, .5), R, 0, h, 0, G); const hub = grp(0, h + .2, 0, G); add(box(.16, .16, .5), W, 0, 0, 0, hub); add(box(.04, .55, 1.0), W, 0, .05, -.85, hub);
  const rot = grp(0, 0, .3, hub); add(box(.12, .12, .1), W, 0, 0, 0, rot); for (let i = 0; i < 12; i++) { const arm = grp(0, 0, 0, rot); arm.rotation.z = i * Math.PI / 6; const b = add(box(.17, .85, .02), W, 0, .62, 0, arm); b.rotation.y = .45; }
  fx.push(t => { rot.rotation.z = -t * 1.4; hub.rotation.y = Math.sin(t * .3) * .08; }); return G; };
S.cow = (x, z, ry, parent, ph = 0, fx = S.fx) => { const G = grp(x, 0, z, parent), B = M(T.hide); G.rotation.y = ry; add(box(.6, .55, 1.3), B, 0, .98, 0, G);
  for (const [lx, lz] of [[-.2, .5], [.2, .5], [-.2, -.5], [.2, -.5]]) add(box(.12, .72, .12), B, lx, .36, lz, G);
  const hd = grp(0, 1.08, .66, G); add(box(.3, .3, .46), B, 0, -.02, .22, hd); add(box(.7, .05, .05), M(T.bone), 0, .14, .06, hd); const tl = grp(0, 1.2, -.66, G); add(box(.04, .6, .04), M(T.tyre), 0, -.3, 0, tl);
  fx.push(t => { hd.rotation.x = .75 + Math.sin(t * 1.1 + ph) * .12 + (Math.sin(t * .37 + ph) > .8 ? -.6 : 0); tl.rotation.z = Math.sin(t * 2.6 + ph) * .3; }); return G; };
S.bale = (x, z, ry, parent) => { const b = add(cyl(.7, .7, 1.2, 10), M(T.straw), x, .7, z, parent); b.rotation.set(0, ry, Math.PI / 2); S.solids.push(b); return b; };
S.armadillo = (x, z, parent) => { const G = grp(x, .04, z, parent), B = grp(0, 0, 0, G), band = [M(T.tin, DS), M(T.rust, DS)], skin = M(PS1.color('#c9b8a6')), claw = M(T.tyre);
  for (let i = 0; i < 9; i++) { const zz = -.2 + i * .05, r = .14 * Math.sqrt(1 - Math.pow((zz) / .26, 2)) + .02, c = add(new THREE.CylinderGeometry(r, r, .052, 9, 1, true, Math.PI / 2, Math.PI), band[i % 2], 0, 0, zz, B); c.rotation.x = Math.PI / 2; }
  add(box(.24, .01, .44), skin, 0, 0, 0, B); const hd = grp(0, .03, .25, B); add(box(.08, .07, .09), M(T.tin), 0, 0, 0, hd); const sn = add(new THREE.ConeGeometry(.032, .16, 6), skin, 0, -.01, .12, hd); sn.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const e = add(box(.022, .075, .03), skin, s * .03, .07, -.01, hd); e.rotation.z = s * -.25; } const tl = add(new THREE.ConeGeometry(.035, .36, 6), band[0], 0, .02, -.42, B); tl.rotation.x = -Math.PI / 2;
  const legs = [[-.09, .14], [.09, .14], [-.09, -.12], [.09, -.12]].map(([lx, lz]) => { const L = grp(lx, -.02, lz, B); add(box(.035, .09, .035), skin, 0, -.045, 0, L); add(box(.04, .015, .05), claw, 0, -.09, .01, L); return L; });
  G.rotation.z = Math.PI; G.position.y = .2; G.rotation.y = .6; G.userData = { legs, body: B }; return G; };

// ---- the road kit
S.road = (x, z, len, along, parent, o = {}) => { const w = o.width || 6.4, r = S.ground(along === 'z' ? w : len, along === 'z' ? len : w, S.offset(M(o.dirt ? T.dirt : T.road), -1), x, .04, z, parent);
  if (!o.dirt && o.dashes !== false) { const dm = S.offset(M(T.dash, { unlit: true, tint: '#b8a060' }), -2); for (let k = -len / 2 + 2; k < len / 2; k += 6) S.ground(along === 'z' ? .14 : 2.4, along === 'z' ? 2.4 : .14, dm, along === 'z' ? x : x + k, .08, along === 'z' ? z + k : z, parent); }
  if (o.wear !== false && !o.dirt) S.roadWear(x, z, len, along, parent, o.seed || 7, w); return r; };
S.roadWear = (x, z, len, along, parent, seed, w = 6.4) => { const r = rng(seed), gm = S.offset(M(T.gravel), -1), cm = S.offset(M(T.crack, DS), -2), pm = S.offset(M(T.patch), -2);
  for (const s of [-1, 1]) S.ground(along === 'z' ? .8 : len, along === 'z' ? len : .8, gm, along === 'z' ? x + s * (w / 2 + .4) : x, .025, along === 'z' ? z : z + s * (w / 2 + .4), parent);
  for (let i = 0; i < len / 5; i++) { const a = (r() - .5) * len, b = (r() - .5) * (w - 1.2), px = along === 'z' ? x + b : x + a, pz = along === 'z' ? z + a : z + b;
    const m = S.ground(r() < .25 ? 1.2 + r() : .9 + r() * .8, r() < .25 ? .9 + r() : .9 + r() * .8, r() < .25 ? pm : cm, px, .058, pz, parent); m.rotation.z = r() * 6.28; } };
S.wireSpan = (a, b, parent, sag, mat, n = 6) => { const p = u => a.clone().lerp(b, u).add(V(0, -sag * 4 * u * (1 - u), 0));
  for (let k = 0; k < n; k++) { const A = p(k / n), B = p((k + 1) / n), m = add(box(.025, .025, A.distanceTo(B)), mat, 0, 0, 0, parent); m.position.copy(A).lerp(B, .5); m.lookAt(B); m.userData.noCheck = true; } };
// a line of telephone poles along a road with two sagging wires
S.poles = (pts, along, parent) => { const wm = M(T.wood), mat = M(T.tyre); for (const p of pts) { add(box(.2, 7, .2), wm, p.x, 3.5, p.z, parent); add(along === 'z' ? box(1.6, .12, .12) : box(.12, .12, 1.6), wm, p.x, 6.6, p.z, parent); }
  for (let i = 0; i + 1 < pts.length; i++) for (const s of [-.65, .65]) { const o = along === 'z' ? V(s, 6.66, 0) : V(0, 6.66, s); S.wireSpan(pts[i].clone().add(o), pts[i + 1].clone().add(o), parent, .55, mat); } };
S.barbFence = (xA, xB, z, parent) => { const pm = M(T.wood), wm = M(T.tyre); for (let x = xA; x <= xB + .01; x += 3) { const p = add(box(.09, 1.15, .09), pm, x, .55, z, parent); p.rotation.z = Math.sin(x * 3.1) * .06; }
  for (let x = xA; x + 3 <= xB + .01; x += 3) for (const y of [.62, 1.0]) { S.wireSpan(V(x, y, z), V(x + 3, y, z), parent, .07, wm, 3); for (const u of [.33, .66]) add(box(.05, .05, .02), wm, x + 3 * u, y - .07 * 4 * u * (1 - u), z, parent).rotation.z = .8; } };
// rail fence (split rails) or a white picket fence along x from xA to xB at z
S.fence = (xA, xB, z, parent, kind = 'rail') => { const m = M(kind === 'picket' ? T.white : T.wood);
  if (kind === 'picket') { for (let x = xA; x <= xB; x += .16) { add(box(.08, .9, .025), m, x, .45, z, parent); } for (const y of [.25, .7]) add(box(xB - xA, .06, .03), m, (xA + xB) / 2, y, z - .03, parent); return; }
  for (let x = xA; x <= xB + .01; x += 2.4) add(box(.12, 1.2, .12), m, x, .6, z, parent); for (const y of [.45, .95]) for (let x = xA; x + 2.4 <= xB + .01; x += 2.4) { const r = add(box(2.5, .08, .08), m, x + 1.2, y, z, parent); r.rotation.z = Math.sin(x) * .03; } };
// a road sign on a post: kind 'stop' | 'speed' | 'curve' | 'rail' | 'rusty' | 'town' (text is ours, never a real place) ; faces +z unless ry
S.sign = (x, z, ry, parent, kind = 'rusty', text = '') => { const G = grp(x, 0, z, parent); G.rotation.y = ry; add(box(.07, 2.3, .07), M(T.chrome), 0, 1.15, 0, G);
  const face = { stop: () => tex(16, 16, q => { q.fillStyle = '#b81e18'; q.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 4; q.lineTo(8 + Math.cos(a) * 7.5, 8 + Math.sin(a) * 7.5); } q.fill(); q.fillStyle = '#f0ece0'; q.fillRect(3, 7, 10, 2); }),
    speed: () => tex(12, 16, q => { q.fillStyle = '#ece8e0'; q.fillRect(0, 0, 12, 16); q.fillStyle = '#1a1a1a'; q.fillRect(2, 2, 8, 1); q.font = 'bold 7px Arial'; q.textAlign = 'center'; q.fillText(text || '55', 6, 13); }),
    curve: () => tex(16, 16, q => { q.fillStyle = '#e8b820'; q.beginPath(); q.moveTo(8, 0); q.lineTo(16, 8); q.lineTo(8, 16); q.lineTo(0, 8); q.fill(); q.fillStyle = '#1a1a1a'; q.fillRect(6, 5, 2, 7); q.fillRect(8, 4, 2, 2); }),
    rail: () => tex(16, 16, q => { q.fillStyle = '#ece8e0'; q.fillRect(0, 0, 16, 16); q.fillStyle = '#1a1a1a'; for (let i = 0; i < 16; i++) { q.fillRect(i, i, 2, 1); q.fillRect(15 - i, i, 2, 1); } }),
    town: () => tex(24, 12, q => { q.fillStyle = '#2a6a3a'; q.fillRect(0, 0, 24, 12); q.fillStyle = '#ece8e0'; q.font = 'bold 6px Arial'; q.textAlign = 'center'; q.fillText(text || 'POP. 212', 12, 8); }),
    rusty: () => T.signRust }[kind]();
  const w = kind === 'town' ? 1.2 : .7, h = kind === 'town' ? .6 : kind === 'speed' ? .9 : .7, p = add(new THREE.PlaneGeometry(w, h), M(face, DS), 0, 2.0, .05, G); if (kind === 'curve' || kind === 'stop') p.rotation.z = 0; return G; };
})();
