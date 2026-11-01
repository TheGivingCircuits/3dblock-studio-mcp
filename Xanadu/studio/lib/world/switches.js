// WORLD: SWITCHES. A switch is a state over time that can be attached to almost anything. WORLD.switch(o) → sw
//   o: { kind: 'wall' | 'double' | 'pull-chain' | 'lever' | 'button' | 'breaker' | 'remote' | 'hidden', at: [x, y, z], ry, parent,
//        start: false, flips: [t, ...] (each flip toggles), press: [[t0, t1], ...] (a button is on only while held), follows: sw | [sw] (a breaker
//        or a master: this one is only live when those are on), W (a physics world: the pull chain becomes a real chain that swings), name }
//   sw.on(t) → bool, pure in t. sw.k(t, dur) → 0..1 eased since the last change (for doors, fans, dimmers). sw.flip(t) / sw.press(t0, t1) add cues.
//   sw.wire(target, o) attaches what it drives: a LIGHTS light, a WORLD light fixture, a house or any piece with windows, a door pivot, a garage,
//        a mesh (shown while on), a TV prop (screen on), a fan (spins), or a function (t, on, k) for anything else. Returns sw (chainable).
//   sw.reach: the world point a hand goes to (CAST grab target); sw.clicks(): [{ t, on }] every change, for sound cues (WORLD.clicks() for all).
// Everything is a pure function of t, like the physics and the lights, so stills, motion blur and re-renders agree.
(function () {
const S = SETS, W = WORLD, { V } = PS1, add = PS1.add, grp = PS1.group, b = W.b, ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
W.switches = [];
W.switch = (o = {}) => { const sw = { kind: o.kind || 'wall', name: o.name || `switch${W.switches.length + 1}`, start: !!o.start, flips: [...(o.flips || [])].sort((a, c) => a - c), presses: [...(o.press || [])], ups: [].concat(o.follows || []), targets: [] };
  // own state: a toggle counts flips up to t; a button is on inside a press
  sw.self = t => sw.kind === 'button' ? sw.presses.some(([a, c]) => t >= a && t < c) : (sw.flips.filter(f => f <= t).length % 2 === 1) !== sw.start;
  sw.on = t => sw.self(t) && sw.ups.every(u => u.on(t));
  // when it last changed at or before t (its own flips and the switches it follows)
  sw.changes = () => { const own = sw.kind === 'button' ? sw.presses.flat() : sw.flips; return [...own, ...sw.ups.flatMap(u => u.changes())].sort((a, c) => a - c); };
  sw.k = (t, dur = .6) => { const on = sw.on(t), last = sw.changes().filter(c => c <= t).pop(); if (last == null) return on ? 1 : 0; const u = ease((t - last) / dur); return on ? u : 1 - u; };
  sw.flip = t => { sw.flips.push(t); sw.flips.sort((a, c) => a - c); return sw; }; sw.press = (a, c) => { sw.presses.push([a, c]); return sw; };
  sw.clicks = () => (sw.kind === 'button' ? sw.presses.flat() : sw.flips).map(t => ({ t, on: sw.on(t + 1e-4), name: sw.name, kind: sw.kind }));
  sw.wire = (x, wo = {}) => { sw.targets.push(W.wireTarget(sw, x, wo)); return sw; };
  if (o.at && sw.kind !== 'hidden' && sw.kind !== 'remote') W.switchMesh(sw, o); W.switches.push(sw); return sw; };
W.clicks = () => W.switches.flatMap(s => s.clicks()).sort((a, c) => a.t - c.t);
// ---- what a switch can drive. Each returns a function of t run every frame (SETS.fx) unless the target reads the switch itself
W.wireTarget = (sw, x, wo) => { const inv = wo.invert ? (t => !sw.on(t)) : (t => sw.on(t));
  // a LIGHTS light (film light or practical): gate it, keeping any gate it had
  if (x && x.kind && x.flick) { const prev = x.when; x.when = t => inv(t) && (!prev || prev(t)); return x; }
  // a WORLD fixture: its power follows the switch (fixtures.js reads fx.power)
  if (x && x.fixture && x.power) { x.off = false; x.power.push(inv); return x; }
  // a garage on a piece: rolls up while on
  if (x && x.doors && x.doors.garage && wo.garage) { S.fx.push(t => W.openGarage(x, wo.invert ? 1 - sw.k(t, wo.dur || 2.5) : sw.k(t, wo.dur || 2.5))); return x; }
  // a piece with windows (a house, an apartment block): the windows glow while on
  if (x && x.windows && x.G) { W.lightWindows(x, { on: inv }, wo.windows); if (x.porchLight && wo.porch !== false) { x.porchLight.off = false; x.porchLight.power.push(inv); } return x; }
  // a door pivot (house door, gate, a room door): swings open while on
  if (x && x.isObject3D && x.userData && x.userData.slab) { const a = wo.angle ?? -1.4; S.fx.push(t => { x.rotation.y = a * (wo.invert ? 1 - sw.k(t, wo.dur || 1.2) : sw.k(t, wo.dur || 1.2)); }); return x; }
  // a TV prop (PROPS 'tv'): the screen lights and flickers while on; a fan or anything with userData.spin: turns while on, spinning up and down
  if (x && x.isObject3D && x.userData && x.userData.spin) { const sp = x.userData.spin; S.fx.push(t => { let a = 0; for (let k = 0; k < 40; k++) a += sw.k(t * k / 40, wo.dur || 1.5) * t / 40; sp.obj.rotation[sp.axis || 'y'] = a * (wo.speed || 14); }); return x; }
  if (x && x.isObject3D && x.name === 'tv') { const screens = []; x.traverse(m => { if (m.isMesh && m.material && m.material.uniforms && m.material.uniforms.unlit && m.material.uniforms.unlit.value) screens.push(m); });
    const off = W.col('#101214'); for (const m of screens) { const onM = m.material; S.fx.push(t => { m.material = inv(t) ? onM : off; }); } return x; }
  // any mesh or group: shown while on
  if (x && x.isObject3D) { S.fx.push(t => { x.visible = inv(t); }); return x; }
  if (typeof x === 'function') { S.fx.push(t => x(t, inv(t), sw.k(t, wo.dur || .6))); return x; }
  console.warn('WORLD switch.wire: unknown target', x); return x; };
// ---- the switch you see: a plate and a toggle, a lever, a button, a breaker box, a pull chain
W.switchMesh = (sw, o) => { const g = grp(...o.at, o.parent || PS1.scene); g.rotation.y = o.ry || 0; g.name = sw.name; sw.G = g; g.updateMatrixWorld(true); const plate = W.col(o.color || '#ece4d0'), dark = W.col('#2a2826');
  const anim = (obj, axis, a0, a1, dur = .07) => S.fx.push(t => { const on = sw.self(t), last = (sw.kind === 'button' ? sw.presses.flat() : sw.flips).filter(c => c <= t).pop(), u = last == null ? 1 : ease((t - last) / dur); obj.rotation[axis] = on ? a0 + (a1 - a0) * u : a1 + (a0 - a1) * u; });
  if (sw.kind === 'wall' || sw.kind === 'double') { b(g, sw.kind === 'double' ? .13 : .08, .12, .012, plate, 0, 0, .006); for (const x of sw.kind === 'double' ? [-.025, .025] : [0]) { const p = grp(x, 0, .012, g); b(p, .014, .035, .016, plate, 0, .012, .008); anim(p, 'x', .45, -.45); }
    sw.reach = g.localToWorld(V(0, 0, .12)); }
  else if (sw.kind === 'lever') { b(g, .16, .3, .1, W.col('#5a5e60'), 0, 0, .05); const p = grp(0, 0, .1, g); b(p, .03, .26, .03, W.col('#9a9c9e'), 0, .13, .015); b(p, .1, .04, .04, W.col('#b8221a'), 0, .26, .015); anim(p, 'x', .7, -.7, .25); sw.reach = g.localToWorld(V(0, .2, .2)); }
  else if (sw.kind === 'button') { b(g, .09, .09, .012, plate, 0, 0, .006); const btn = W.c(g, .018, .018, .02, 8, W.col('#c8a44a'), 0, 0, .02); btn.rotation.x = Math.PI / 2; S.fx.push(t => { btn.position.z = sw.self(t) ? .014 : .022; }); sw.reach = g.localToWorld(V(0, 0, .1)); }
  else if (sw.kind === 'breaker') { b(g, .4, .55, .1, W.col('#8a8e90'), 0, 0, .05); for (let i = 0; i < 8; i++) b(g, .06, .03, .02, dark, (i % 2 ? .07 : -.07), .18 - Math.floor(i / 2) * .08, .11); const p = grp(.15, -.2, .11, g); b(p, .04, .1, .03, W.col('#b8221a'), 0, .04, .015); anim(p, 'x', .5, -.5, .15);
    const door = grp(-.2, 0, .105, g); b(door, .4, .55, .01, W.col('#9a9ea0'), .2, 0, 0); door.rotation.y = -1.9; sw.reach = g.localToWorld(V(.15, -.2, .2)); }
  else if (sw.kind === 'pull-chain') { const len = o.len || .35; if (o.W && W.rope) { sw.chain = W.rope(o.W, { from: g.localToWorld(V(0, 0, 0)).toArray(), length: len, segments: 6, kind: 'chain', end: { mass: .03, size: .025, color: '#c8a44a' }, name: sw.name + '.chain' });
      // every pull yanks the chain down and lets it swing back
      for (const f of sw.flips) o.W.push(sw.chain.endItem, f, [0, -.05, .012]); }
    else { const p = grp(0, 0, 0, g); for (let i = 0; i < 8; i++) b(p, .008, len / 8 * .8, .008, W.col('#a89a6a'), 0, -len / 8 * (i + .5), 0); b(p, .02, .03, .02, W.col('#c8a44a'), 0, -len - .02, 0);
      S.fx.push(t => { const last = sw.flips.filter(c => c <= t).pop(), u = last == null ? 1 : (t - last); p.position.y = u < .15 ? -.06 * Math.sin(u / .15 * Math.PI) : 0; p.rotation.z = u < 2 ? .15 * Math.sin(u * 6) * Math.exp(-u * 2) : 0; }); }
    sw.reach = g.localToWorld(V(0, -len, 0)); }
  return g; };
// a switch on a wall of a piece (house, room): WORLD.switchOn(piece, 'front' | 'door' | world point, o)
W.switchOn = (at, o = {}) => W.switch({ ...o, at: Array.isArray(at) ? at : at.toArray(), kind: o.kind || 'wall' });
})();
