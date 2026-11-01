// WORLD: LIGHT FIXTURES you can see and place. Each is a model plus a real LIGHTS.practical (Kelvin, stops, flicker), so placing one lights the
// scene, and each can be switched (WORLD.switch). WORLD.light(kind, o) → fx = { fixture, G, light, power, on(t), bulb }
//   kinds: bulb (a bare bulb hanging on its cord; with o.W the cord is a physics cord and the bulb swings, its light swinging with it),
//          porch-light (a wall lantern), ceiling-lamp (a flush dome), string-lights (bulbs along a sagging cord from o.from to o.to),
//          streetlight (a pole with a cobra head over the road, sodium orange), lamp-post (an iron post with a glass globe), flood-light
//          (a security light on a wall), lantern (a hanging oil lantern that flickers)
//   o: { at: [x, y, z] (the mounting point: ceiling, wall or ground), ry, parent, switch (a WORLD.switch that powers it), lit (false = off until a
//        switch is wired; a function of t; a switch), stops, kelvin, flicker ('old-bulb', 'candle', ...), W (physics world), len (cord), color }
(function () {
const S = SETS, W = WORLD, { V } = PS1, add = PS1.add, grp = PS1.group, b = W.b;
// a glowing part: its own material, lit (unlit, warm) while the fixture is on, dull glass while off; flicker dims it with the light
const glowPart = (fx, mesh, col) => { const m = PS1.mat(PS1.color('#ffffff'), {}); mesh.material = m; mesh.userData.fx = 'glow'; const on = new THREE.Color(col || '#fff0c8'), off = new THREE.Color('#6a6a64');
  fx.glows.push(t => { const v = fx.on(t), f = v ? fx.level(t) : 0; m.uniforms.unlit.value = v ? 1 : 0; m.uniforms.tint.value.copy(v ? on.clone().multiplyScalar(.55 + .45 * Math.min(1, f)) : off); }); return mesh; };
const KIND = {
  bulb: { fixture: 'bulb', stops: -.5, kelvin: 2700 }, 'porch-light': { fixture: 'bulb', stops: -1.2, kelvin: 2700 }, 'ceiling-lamp': { fixture: 'ceiling-lamp', stops: -.5 }, 'string-lights': { fixture: 'bulb', stops: -1.6, kelvin: 2400 },
  streetlight: { fixture: 'bulb', stops: .3, kelvin: 2000 }, 'lamp-post': { fixture: 'bulb', stops: -.5, kelvin: 2700 }, 'flood-light': { fixture: 'bulb', stops: .4, kelvin: 4300 }, lantern: { fixture: 'lantern', stops: -1, kelvin: 2000, flicker: 'candle' } };
const BUILD = {
  bulb(fx, g, o) { const len = o.len ?? .6; b(g, .1, .03, .1, W.col('#e8e4dc'), 0, -.015, 0);
    if (o.W && W.rope) { const bulb = grp(0, 0, 0, PS1.scene), sock = W.c(bulb, .022, .022, .05, 6, W.col('#2a2826'), 0, -.025, 0), gl = W.c(bulb, .035, .025, .07, 6, null, 0, -.08, 0); glowPart(fx, gl, o.color);
      g.updateMatrixWorld(true); const rp = W.rope(o.W, { from: g.localToWorld(V(0, -.03, 0)).toArray(), length: len, kind: 'cord', segments: 8, end: { mesh: bulb, def: { name: fx.name, mass: .08, shape: { type: 'cylinder', r: .035, h: .12 }, center: [0, -.06, 0], foley: 'glass' }, hang: 0 }, name: fx.name + '.cord' });
      fx.cord = rp; fx.bulbItem = rp.endItem; fx.bulb = bulb; return { lightAt: gl }; }
    const cord = W.c(g, .006, .006, len, 4, W.col('#1e1c1a'), 0, -len / 2, 0); cord.userData.noCheck = true; W.c(g, .022, .022, .05, 6, W.col('#2a2826'), 0, -len - .025, 0); const gl = W.c(g, .035, .025, .07, 6, null, 0, -len - .08, 0); glowPart(fx, gl, o.color); fx.bulb = gl;
    // a still bulb can still sway (o.sway: amplitude in radians), as one stiff pendulum
    if (o.sway) { const p0 = g.rotation.z; S.fx.push(t => { g.rotation.z = p0 + o.sway * Math.sin(t * 2.2); g.rotation.x = o.sway * .4 * Math.sin(t * 1.7 + 1); }); } return { lightAt: gl }; },
  'porch-light'(fx, g, o) { b(g, .12, .2, .03, W.col('#1e1e1e'), 0, 0, .015); const arm = b(g, .03, .03, .1, W.col('#1e1e1e'), 0, .02, .07), cage = grp(0, -.04, .14, g); b(cage, .14, .02, .14, W.col('#1e1e1e'), 0, .12, 0); b(cage, .1, .02, .1, W.col('#1e1e1e'), 0, -.1, 0);
    for (const [x, z] of [[-.06, -.06], [.06, -.06], [-.06, .06], [.06, .06]]) b(cage, .015, .2, .015, W.col('#1e1e1e'), x, 0, z); const gl = b(cage, .1, .18, .1, null, 0, 0, 0); glowPart(fx, gl, '#ffe8b0'); return { lightAt: gl, lightOff: [0, 0, .25] }; },
  'ceiling-lamp'(fx, g, o) { W.c(g, .16, .16, .02, 8, W.col('#d8d4cc'), 0, -.01, 0); const gl = W.c(g, .18, .1, .1, 8, null, 0, -.07, 0); glowPart(fx, gl, '#fff4dc'); return { lightAt: gl, lightOff: [0, -.15, 0] }; },
  streetlight(fx, g, o) { const h = o.h || 7, pole = W.col('#7a7c7e'); W.c(g, .1, .14, h, 6, pole, 0, h / 2, 0); W.c(g, .22, .22, .3, 6, W.col('#5a5c5e'), 0, .15, 0); const arm = W.span(g, V(0, h - .3, 0), V(0, h, 1.8), .07, pole);
    const head = grp(0, h, 2.1, g); b(head, .32, .14, .7, W.col('#8a8c8e')); const gl = b(head, .26, .03, .55, null, 0, -.08, 0); glowPart(fx, gl, '#ffb050'); fx.foot = g.localToWorld(V(0, 0, 0)); return { lightAt: gl, lightOff: [0, -.25, 0] }; },
  'lamp-post'(fx, g, o) { const h = o.h || 3.4, iron = W.col('#1a1c1e'); W.c(g, .05, .07, h, 6, iron, 0, h / 2, 0); W.c(g, .14, .18, .4, 6, iron, 0, .2, 0); W.c(g, .1, .06, .1, 6, iron, 0, h + .02, 0);
    const gl = add(new THREE.SphereGeometry(.2, 8, 6), null, 0, h + .25, 0, g); glowPart(fx, gl, '#fff0d0'); W.c(g, .08, .05, .08, 6, iron, 0, h + .47, 0); return { lightAt: gl }; },
  'flood-light'(fx, g, o) { b(g, .08, .08, .05, W.col('#3a3a3a'), 0, 0, .025); const hd = grp(0, 0, .12, g); hd.rotation.x = .5; b(hd, .2, .14, .1, W.col('#3a3a3a')); const gl = b(hd, .17, .11, .02, null, 0, 0, .05); glowPart(fx, gl, '#f0f4ff'); return { lightAt: gl, lightOff: [0, -.2, .4] }; },
  lantern(fx, g, o) { const len = o.len ?? .25, iron = W.col('#2a2622'); W.c(g, .004, .004, len, 4, iron, 0, -len / 2, 0); const L = grp(0, -len, 0, g); W.c(L, .06, .08, .04, 6, iron, 0, -.02, 0); const gl = W.c(L, .05, .05, .12, 6, null, 0, -.1, 0); glowPart(fx, gl, '#ffc070'); W.c(L, .07, .07, .03, 6, iron, 0, -.17, 0);
    if (o.sway !== 0) S.fx.push(t => { g.rotation.z = (o.sway ?? .04) * Math.sin(t * 1.9); }); return { lightAt: gl }; },
  'string-lights'(fx, g, o) { const a = V(...(o.from || [-2, 2.4, 0])), c = V(...(o.to || [2, 2.4, 0])), n = o.n || 12, cols = o.colors || ['#ffd8a0'];
    const rp = W.rope(o.W || null, { from: a.toArray(), to: c.toArray(), kind: 'cord', slack: o.slack ?? .05, segments: Math.max(8, n), name: fx.name + '.cord' }), bulbs = [];
    for (let i = 0; i < n; i++) { const m = add(new THREE.SphereGeometry(.035, 5, 4), null, 0, -99, 0, PS1.scene); glowPart(fx, m, cols[i % cols.length]); bulbs.push({ m, u: (i + .5) / n }); }
    const at = u => { const P = rp.points(), f = u * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)); return P[i].clone().lerp(P[i + 1], f - i); };
    S.fx.push(t => { for (const q of bulbs) q.m.position.copy(at(q.u)).add(V(0, -.05, 0)); }); fx.cord = rp; return { lightAt: { getWorldPosition: v => v.copy(at(.5)).add(V(0, -.2, 0)) } }; } };
let nFx = 0;
W.lights = [];
W.light = (kind, o = {}) => { const K = KIND[kind]; if (!K) throw new Error(`WORLD.light: no fixture "${kind}" (${Object.keys(KIND).join(', ')})`);
  const g = grp(...(o.at || [0, 0, 0]), o.parent || PS1.scene); g.rotation.y = o.ry || 0; g.name = o.name || `${kind}-${++nFx}`; g.updateMatrixWorld(true);
  const fx = { fixture: kind, name: g.name, G: g, power: [], glows: [], off: o.lit === false };
  if (o.lit != null && o.lit !== false && o.lit !== true) fx.power.push(t => W.litAt(o.lit, t) > .5);
  fx.on = t => !fx.off && fx.power.every(p => p(t)); const flick = LIGHTS.FLICKER[o.flicker || K.flicker || 'none'] || LIGHTS.FLICKER.none; fx.level = t => flick(t, o);
  const r = BUILD[kind](fx, g, o) || {}, src = r.lightAt, off = V(...(r.lightOff || [0, 0, 0]));
  // the light itself sits at the glowing part (so a swinging bulb swings its light); `seen: false` because the model is the visible part
  const at = src ? (t => { const p = V(0, 0, 0); if (src.updateMatrixWorld) src.updateMatrixWorld(true); src.getWorldPosition(p); return p.add(off.clone().applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()))); }) : g.position.toArray();
  if (o.light !== false) fx.light = LIGHTS.practical({ name: g.name, fixture: K.fixture, in: at, kelvin: o.kelvin ?? K.kelvin, stops: o.stops ?? K.stops, flicker: o.flicker || K.flicker, seen: false, when: t => fx.on(t) });
  S.fx.push(t => { for (const f of fx.glows) f(t); });
  if (o.switch) o.switch.wire(fx); W.lights.push(fx); return fx; };
W.FIXTURES = Object.keys(KIND);
// placing a light from a saved world: { type: 'light', kind, at, ry, ... }
W.PLACE.light = (e, c) => { const p = c.parent; p.updateMatrixWorld(true); const at = p.localToWorld(V(...e.at)); return W.light(e.kind, { ...e, at: at.toArray(), ry: (e.ry || 0) + p.rotation.y, lit: e.lit ?? c.lit ?? false, W: e.physics ? c.W : null }); };
})();
