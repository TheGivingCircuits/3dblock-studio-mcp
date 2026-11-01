// SETS: THE HORROR KIT. The held things (chainsaw, knives, cleaver, rope, bones, skull, candles, meat hook) are props in lib/props/horror;
// this is what goes around them. House rule: no gore. Blood is Minecraft-style: the victim blinks red, chunky red pixels pop and fall, and
// blocky splats build up on the floor and on clothes (CAST setWear blood). Never wounds, never anything inside a body.
//   SETS.blood.hit(who, t0, o)      a hit: red blink on who (a CAST person or any Object3D) + a burst of cubes from o.at (default: chest)
//   SETS.blood.splat(parent, x, z, size, seed, t0)   a blocky floor splat that grows in from t0 (static if t0 is null)
//   SETS.blood.drip(parent, p, t0, n)              slow drips from a point (a table edge, a hook)
//   SETS.candles(parent, x, y, z, n, seed, o)      a cluster of pillar candles with flickering flames (and one candle light unless o.light === false)
//   SETS.bonePile(parent, x, z, seed)  SETS.noose(parent, x, y, z, len)  SETS.feathers(parent, rect, n, seed)
//   SETS.runSaw(saw, t, on)                        a chainsaw prop running: the chain crawls, the body shakes, blue-grey exhaust puffs
(function () {
const S = SETS, T = S.T, { V, rng } = PS1, M = (t, o) => PS1.mat(t, o), add = PS1.add, box = PS1.box, cyl = PS1.cyl, grp = PS1.group, DS = S.DS;
const RED = '#c41818', DARK = '#8a0c0c';
const tintsOf = o => { if (o._tints) return o._tints; const L = []; (o.G || o).traverse(x => { if (x.material) for (const m of [].concat(x.material)) if (m.uniforms && m.uniforms.tint && !L.includes(m)) L.push(m); }); return (o._tints = L); };
const blink = (t, t0, dur = .45) => { const u = t - t0; return u < 0 || u > dur ? 0 : (Math.floor(u * 16) % 2 ? .55 : 1) * (1 - u / dur); };
const B = S.blood = { hits: [] };
B.hit = (who, t0, o = {}) => { const parent = o.parent || PS1.scene, n = o.n ?? 16, cubes = [...Array(n)].map((_, i) => { const c = add(box(.05, .05, .05), M(PS1.color(i % 3 ? RED : DARK), { unlit: true }), 0, -99, 0, parent); c.userData.fx = 'blood'; return c; });
  const H = { who, t0, o, cubes }; B.hits.push(H); const dir = o.dir ? V(...o.dir) : V(0, 0, 0);
  S.fx.push(t => { const k = blink(t, t0, o.blink ?? .45); for (const m of tintsOf(who)) if (!m.userData.redBy || m.userData.redBy === H || k > 0) { m.uniforms.tint.value.setRGB(1, 1 - .78 * k, 1 - .78 * k); m.userData.redBy = k > 0 ? H : null; }
    const at = typeof o.at === 'function' ? o.at(t) : o.at ? V(...o.at) : (who.G || who).localToWorld(V(0, 1.25 * ((who.scale) || 1), .1));
    cubes.forEach((b, i) => { const u = t - t0 - (i % 3) * .02; if (u < 0) { b.position.y = -99; return; } const a = i * 2.399, sp = .5 + (i % 5) * .18, land = (o.floor ?? 0) + .025, uu = Math.min(u, 1.4);
      const y = at.y + (1.6 + (i % 4) * .3 - 4.9 * uu) * uu; b.position.set(at.x + (Math.cos(a) * .35 + dir.x) * sp * uu, Math.max(land, y), at.z + (Math.sin(a) * .35 + dir.z) * sp * uu); b.rotation.set(y > land ? uu * 6 : 0, y > land ? uu * 4 : i, 0);
      if (o.stay === false && u > 1.4) b.position.y = -99; }); });
  // blood on the clothes builds up hit by hit (a pure function of t over all of this person's hits)
  if (who.setWear && o.wear !== false) { if (!who._hits) { who._hits = []; S.fx.push(t => { const v = Math.round(Math.min(1, who._hits.reduce((s, h) => s + (t < h.t0 ? 0 : h.amount * Math.min(1, (t - h.t0) / .3)), 0)) * 10) / 10; if (v !== who._bloodNow) { who._bloodNow = v; who.setWear({ blood: v }); } }); } who._hits.push({ t0, amount: o.wearAmount ?? .35 }); }
  return H; };
// a blocky splat: a few pixel squares on the floor, growing from the centre out between t0 and t0 + 1.2 s
T.splat = [0, 1, 2].map(k => PS1.tex(16, 16, (q, w, h, r) => { for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.pow(r(), .7) * 7; q.fillStyle = r() < .3 ? DARK : RED; q.fillRect(8 + Math.cos(a) * d | 0, 8 + Math.sin(a) * d | 0, 2 + (r() * 2 | 0), 2 + (r() * 2 | 0)); } }, 90 + k));
B.splat = (parent, x, z, size = .8, seed = 1, t0 = null, y = .012) => { const p = S.ground(size, size, S.offset(M(T.splat[seed % 3], { unlit: true, tint: '#d8d8d8' }), -3), x, y, z, parent); p.rotation.z = seed * 1.7; p.material.transparent = true; p.userData.fx = 'blood';
  if (t0 != null) S.fx.push(t => { const k = Math.max(0, Math.min(1, (t - t0) / 1.2)); p.visible = k > 0; p.scale.setScalar(Math.max(.01, Math.ceil(k * 4) / 4)); }); return p; };
B.drip = (parent, p, t0 = 0, n = 4) => { const D = [...Array(n)].map(() => add(box(.025, .04, .025), M(PS1.color(RED), { unlit: true }), 0, -99, 0, parent)); const floor = p.floor ?? 0;
  S.fx.push(t => D.forEach((d, i) => { const per = 1.3 + i * .37, u = ((t - t0 - i * .4) % per + per) % per; if (t < t0) { d.position.y = -99; return; } const y = p.y - 4.9 * u * u; d.position.set(p.x, Math.max(floor + .01, y), p.z); d.scale.y = y > floor ? 1.4 : .3; })); return D; };
S.candles = (parent, x, y, z, n = 5, seed = 1, o = {}) => { const r = rng(seed), G = grp(x, y, z, parent), flames = [];
  for (let i = 0; i < n; i++) { const a = i * 2.4 + r(), d = i ? .08 + r() * .14 : 0, h = .6 + r() * .9, c = window.PROPS ? PROPS.make('candle', { parent: G, at: [Math.cos(a) * d, 0, Math.sin(a) * d], height: h, color: o.color }) : null;
    if (c && c.userData.flame) flames.push(c.userData.flame); else { add(cyl(.03, .03, .12 * h, 8), M(PS1.color('#ece4c8')), Math.cos(a) * d, .06 * h, Math.sin(a) * d, G); const f = add(new THREE.ConeGeometry(.01, .03, 5), M(PS1.color('#ffb040'), { unlit: true }), Math.cos(a) * d, .14 * h, Math.sin(a) * d, G); f.userData.fx = 'glow'; flames.push(f); } }
  flames.forEach((f, i) => f.userData.ph = i * 1.7 + seed); S.fx.push(t => flames.forEach(f => { const ph = f.userData.ph, k = 1 + .25 * Math.sin(t * 13 + ph) * Math.sin(t * 7.3 + ph * 2); f.scale.set(1, k, 1); f.rotation.z = .12 * Math.sin(t * 5.1 + ph); }));
  if (o.light !== false) { G.updateMatrixWorld(true); const p = G.localToWorld(V(0, .25, 0)); LIGHTS.practical({ name: 'candles', fixture: 'candle', in: [p.x, p.y, p.z], stops: o.stops ?? -1 }); } return G; };
S.bonePile = (parent, x, z, seed = 1, n = 9) => { const r = rng(seed), G = grp(x, 0, z, parent); for (let i = 0; i < n; i++) { const id = i === 0 ? 'skull' : 'bone'; if (window.PROPS) { const b = PROPS.make(id, { parent: G, at: [(r() - .5) * .6, (i % 3) * .03, (r() - .5) * .6] }); b.rotation.set(id === 'bone' ? (r() - .5) * .4 : 0, r() * 6.28, id === 'bone' ? (r() - .5) * .3 : .3); } } return G; };
S.noose = (parent, x, y, z, len = 1.2) => { const G = grp(x, y, z, parent), m = M(PS1.color('#b89a5a')), seg = 6, P = [...Array(seg)].map((_, i) => { const g = new THREE.Group(); g.position.y = i ? -len / seg : 0; if (!i) G.add(g); return g; });
  for (let i = 1; i < seg; i++) P[i - 1].add(P[i]); P.forEach(p => add(box(.03, len / seg + .01, .03), m, 0, -len / seg / 2, 0, p)); const loop = add(new THREE.TorusGeometry(.13, .02, 3, 8), m, 0, -len / seg - .13, 0, P[seg - 1]); loop.rotation.y = .3;
  S.fx.push(t => P.forEach((p, i) => { p.rotation.z = .04 * Math.sin(t * 1.1 + i * .4); p.rotation.x = .02 * Math.sin(t * .8 + i); })); return G; };
S.feathers = (parent, [x0, x1, z0, z1], n = 12, seed = 1) => { const r = rng(seed), m = M(PS1.color('#ece6da'), DS); for (let i = 0; i < n; i++) { const f = add(new THREE.PlaneGeometry(.06, .12), m, x0 + r() * (x1 - x0), .01, z0 + r() * (z1 - z0), parent); f.rotation.set(-Math.PI / 2 + (r() - .5) * .3, 0, r() * 6.28); } };
// a running chainsaw: the bar's chain texture crawls (uvOff), the saw shakes, exhaust puffs drift off; returns the puff list once
S.runSaw = (saw, t, on = true) => { const u = saw.userData; S.emit('chainsaw', saw, t, on); if (!u.puffs) { u.puffs = [...Array(6)].map(() => { const p = add(box(.06, .06, .06), M(PS1.color('#8a94a0'), { unlit: true }), 0, -99, 0, PS1.scene); p.userData.fx = 'smoke'; return p; }); }
  const bar = u.bar; if (bar && bar.material.uniforms && bar.material.uniforms.uvOff) bar.material.uniforms.uvOff.value.set(on ? (t * 6) % 1 : 0, 0); const sh = on ? .006 : 0; saw.rotation.z = sh * Math.sin(t * 90); saw.rotation.x = sh * Math.sin(t * 77 + 1);
  saw.updateMatrixWorld(true); const ex = saw.localToWorld(V(.08, .12, -.1)); u.puffs.forEach((p, i) => { const age = ((t * 1.4 + i / 6) % 1); if (!on) { p.position.y = -99; return; } p.position.set(ex.x + age * .3, ex.y + age * .5, ex.z - age * .2); p.scale.setScalar(.5 + age * 2.2); }); };
})();
