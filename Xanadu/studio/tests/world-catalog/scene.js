// STUDIO TEST: THE WORLD LIBRARY (lib/world, 2026-10-26), a live demo of every kit working. Silent: no voice, no music, no sound.
// houses (each preset, repainted mid-shot) · the six saved worlds · fences (gates on one lever) · items (fans on a wall switch) · streets
// (a working traffic light) · ropes on the physics (a pendulum, a ball on a slack rope, a cut rope, a tow rope, swings, a clothesline)
// · night: a swinging bulb on a pull chain, every light fixture switched on, Maple Street's breaker and lit windows, a garage remote, downtown
const { V, clamp } = PS1; LIGHTS.use(); const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const SEG = [], LABELS = [], O = {}; let T = 0, NIGHT = 1e9;
// one beat of the demo: a label, a duration, and its shot (a function of the beat's start time)
const beat = (label, dur, shot) => { const t0 = T; LABELS.push([t0, t0 + dur, label]); SEG.push(shot(t0, dur)); T += dur; return t0; };
const sh = (t0, dur, o) => ({ id: `S${String(SEG.length + 1).padStart(2, '0')}`, at: t0, dur, lens: '18mm', stop: t0 >= NIGHT ? 'f/2.8' : 'f/5.6', ...o, subject: o.subject || o.look });
const PRESETS = ['small-house', 'ranch', 'two-story', 'big-house', 'cabin', 'a-frame', 'shed', 'trailer', 'row-house', 'apartments', 'corner-store'];
const PROP_IDS = ['trash-bin', 'recycling-bin', 'grill', 'lawn-chair', 'cooler', 'planter', 'garden-gnome', 'watering-can', 'hose-reel', 'wheelbarrow', 'tricycle', 'traffic-cone', 'lawn-mower', 'box-fan', 'floor-fan', 'laundry-basket', 'paint-can', 'gas-cylinder'];
const PIECE_IDS = ['mailbox', 'hydrant', 'manhole', 'storm-drain', 'bench', 'doghouse', 'birdbath', 'picnic-table', 'bus-stop', 'newspaper-box', 'dumpster', 'utility-pole', 'basketball-hoop', 'satellite-dish', 'phone-booth', 'mailbox-cluster'];
const FX_KINDS = ['bulb', 'porch-light', 'ceiling-lamp', 'string-lights', 'streetlight', 'lamp-post', 'flood-light', 'lantern'];
const WORLD_NAMES = ['maple-street', 'oak-hill', 'downtown', 'cabin-in-the-woods', 'aframe-lake', 'county-road'];
const HZ = -1000, FZ = -1300, IZ = -1400, SZ = -1600, PX = -600, LX = 600, WZ = n => 400 + n * 300;
let Wp;

// ---- the timeline (laid out before the build, so switches, pushes and cuts know their times)
const TL = {};
TL.houses = PRESETS.map((id, i) => beat(`HOUSES · ${id} · repainted, same model`, 1.6, (t0, d) => sh(t0, d, { pos: () => O.hcam[i].pos, look: () => O.hcam[i].look, move: { type: 'orbit', by: 40 } })));
TL.worlds = WORLD_NAMES.map((n, i) => beat(`SAVED WORLD · ${n} · loaded, not generated`, 1.8, (t0, d) => sh(t0, d, { lens: '24mm', pos: [0, n === 'downtown' ? 55 : 42, WZ(i) + 70], look: [0, 0, WZ(i)], move: { type: 'orbit', by: 30 } })));
TL.fences = beat('FENCES · 8 kinds · every gate on one lever', 5.5, (t0, d) => sh(t0, d, { lens: '20mm', pos: t => [-2 + 44 * ss((t - t0) / d), 2.6, FZ + 10], look: t => [-1 + 44 * ss((t - t0) / d), .8, FZ] }));
TL.props = beat('ITEMS · yard props (physics) · fans on a wall switch', 3.6, (t0, d) => sh(t0, d, { lens: '20mm', pos: t => [-.5 + 27 * ((t - t0) / d), 1.5, IZ + 4], look: t => [.5 + 27 * ((t - t0) / d), .45, IZ] }));
TL.pieces = beat('ITEMS · street and yard pieces', 4, (t0, d) => sh(t0, d, { pos: t => [-1 + 49 * ((t - t0) / d), 2.6, IZ + 3], look: t => [1 + 49 * ((t - t0) / d), 1.1, IZ - 6] }));
TL.cross = beat('STREETS · intersection · working traffic light', 3, (t0, d) => sh(t0, d, { lens: '20mm', pos: [13, 7, SZ + 15], look: [0, 1.5, SZ], move: { type: 'orbit', by: 30 } }));
TL.kinds = beat('STREETS · suburb · city · country · dirt · alley', 2.5, (t0, d) => sh(t0, d, { lens: '20mm', pos: [0, 26, SZ - 75], look: [0, 0, SZ - 102], move: { type: 'crane', by: 6 } }));
TL.pend = beat('ROPES · a pendulum · a ball dropped on a slack rope', 5, (t0, d) => sh(t0, d, { pos: [PX - 1.5, 2.6, 8.5], look: [PX - 1.5, 2.1, 0] }));
TL.cut = beat('ROPES · cut the rope, the crate falls', 3.4, (t0, d) => sh(t0, d, { lens: '20mm', pos: [PX + 13, 2.0, 6.5], look: [PX + 12, 1.6, 0] }));
TL.tow = beat('ROPES · a tow rope: the truck drags the tyre', 5, (t0, d) => sh(t0, d, { lens: '20mm', pos: t => [O.towMid(t) + 1, 3.2, -15], look: t => [O.towMid(t), .6, -25] }));
TL.swing = beat('ROPES · chains and a tyre swing, pushed', 4, (t0, d) => sh(t0, d, { pos: [PX + 31, 2.1, 8], look: [PX + 31, 1.4, 0] }));
TL.line = beat('ROPES · a clothesline in the wind', 3, (t0, d) => sh(t0, d, { lens: '24mm', pos: [PX + 44, 1.7, 6], look: [PX + 44, 1.4, 0] }));
NIGHT = T;
TL.bulb = beat('NIGHT · a bulb on a pull chain · knocked, it swings its light', 5, (t0, d) => sh(t0, d, { lens: '24mm', pos: [PX + 55, 1.9, 6.5], look: [PX + 55, 2.0, 0] }));
TL.fx = beat('LIGHTS · 8 fixtures, each on its own switch', 5, (t0, d) => sh(t0, d, { pos: t => [LX - 12 + 24 * ((t - t0) / d), 2.0, 8.5], look: t => [LX - 12 + 24 * ((t - t0) / d), 1.8, 0] }));
TL.maple = beat('MAPLE STREET · the breaker: streetlights on · windows light up', 4.5, (t0, d) => sh(t0, d, { pos: [-56, 3.2, WZ(0) + 1.5], look: [10, 2.6, WZ(0) - 1], move: { type: 'dolly', by: 6 } }));
TL.garage = beat('SWITCHES · a garage door on a remote', 3.5, (t0, d) => sh(t0, d, { lens: '20mm', pos: () => O.gcam.pos, look: () => O.gcam.look }));
TL.down = beat('DOWNTOWN AT NIGHT', 3, (t0, d) => sh(t0, d, { pos: [-60, 4.5, WZ(2) + 1], look: [20, 3.5, WZ(2)], move: { type: 'dolly', by: 8 } }));
const END = T;

CAM.episode({ res: [540, 960],
  hud(t, S, q) { const L = LABELS.find(([a, b]) => t >= a && t < b) || LABELS.at(-1), parts = L[2].split(' · '), l1 = parts.slice(0, 2).join(' · '), l2 = parts.slice(2).join(' · ');
    q.save(); q.textAlign = 'center'; q.lineJoin = 'round'; q.lineWidth = 4; q.strokeStyle = '#000'; q.font = 'bold 13px Arial, Helvetica, sans-serif';
    q.fillStyle = '#f2f0ea'; q.strokeText('WORLD LIBRARY · LIVE DEMO', 180, 34); q.fillText('WORLD LIBRARY · LIVE DEMO', 180, 34);
    q.fillStyle = '#ffd23a'; q.strokeText(l1, 180, 56); q.fillText(l1, 180, 56); if (l2) { q.strokeText(l2, 180, 74); q.fillText(l2, 180, 74); } q.restore(); },
  build(S) { const t0 = performance.now(), sc = PS1.scene, night = t => t >= NIGHT;
    Wp = PHYS.world(); Wp.w.broadphase = new CANNON.SAPBroadphase(Wp.w); Wp.ground(0);

    // ---- houses: every preset, two paints each (the second shown from mid-shot)
    SETS.ground(PRESETS.length * 45 + 60, 90, WORLD.mat('lawn'), (PRESETS.length - 1) * 22.5, -.01, HZ);
    O.hcam = PRESETS.map((id, i) => { const x = i * 45, N = WORLD.PAINT_NAMES, pa = N[(i * 5) % N.length], pb = N[(i * 5 + 7) % N.length];
      const A = WORLD.put(id, { at: [x, 0, HZ], paint: pa, seed: 30 + i }), B = WORLD.put(id, { at: [x, 0, HZ], paint: pb, seed: 30 + i }), mid = TL.houses[i] + .8;
      SETS.fx.push(t => { const second = t >= mid && t < TL.houses[i] + 1.6; A.G.visible = !second; B.G.visible = second; });
      const [x0, x1, z0, z1] = A.footprint, size = Math.max(x1 - x0, z1 - z0), h = ['apartments', 'corner-store', 'row-house'].includes(id) ? 8 : 3.5, dist = size * 1.15 + 6;
      return { pos: [x + dist * .45, h * .55 + 1.5, HZ + dist], look: [x, h * .45, HZ] }; });

    // ---- the saved worlds (Maple Street's streetlights on a breaker and its windows with nightfall; the rest lit at night)
    O.breaker = WORLD.switch({ kind: 'hidden', name: 'maple breaker', flips: [TL.maple + 1.2] });
    O.worlds = {}; WORLD_NAMES.forEach((n, i) => { const L = WORLD.WORLDS[n], edit = {};
      if (n === 'maple-street') for (const e of L.pieces) if (e.type === 'light') edit[e.uid] = { lit: O.breaker };
      O.worlds[n] = WORLD.load(n, { at: [0, 0, WZ(i)], lit: n === 'maple-street' ? WORLD.nightfall(TL.maple + .4, 3.2) : night, edit }); });
    // the garage remote on Maple Street's first house
    const H1 = O.worlds['maple-street'].get('house-1'); WORLD.switch({ kind: 'remote', name: 'garage remote', flips: [TL.garage + .6] }).wire(H1, { garage: true, dur: 2.2 });
    const gp = H1.doors.garage.getWorldPosition(V(0, 0, 0)); O.gcam = { pos: [gp.x + 5, 2.2, gp.z + 11], look: [gp.x, 1.5, gp.z] };

    // ---- fences: 8 kinds in a row, five with gates, every gate on one lever
    SETS.ground(70, 24, WORLD.mat('lawn'), 22, -.01, FZ);
    const lever = WORLD.switch({ kind: 'lever', name: 'gate lever', at: [-1.1, 1.0, FZ + .9], flips: [TL.fences + .6] }); WORLD.b(sc, .12, 1.0, .12, WORLD.col('#5a5e60'), -1.1, .5, FZ + .85);
    WORLD.FENCES.forEach((k, i) => { const x = i * 6, f = WORLD.fence(k, [[x, FZ], [x + 5, FZ]], { gate: ['picket', 'privacy', 'chainlink', 'iron', 'rail'].includes(k) ? { run: 0, u: .5, w: 1.1 } : null, seed: 5 + i });
      for (const g of f.gates) lever.wire(g, { angle: -1.3, dur: 1.4 }); });

    // ---- items: the props row and the pieces row; both fans on one wall switch
    SETS.ground(70, 24, WORLD.mat('concrete'), 24, -.01, IZ - 3);
    const fanSw = WORLD.switch({ kind: 'wall', name: 'fan switch', at: [13 * 1.5 + .75, 1.1, IZ - .55], flips: [TL.props + 1.9] }); WORLD.b(sc, .5, 1.3, .1, WORLD.col('#d8d0c0'), 13 * 1.5 + .75, .65, IZ - .62);
    PROP_IDS.forEach((id, i) => { const g = PROPS.make(id, { at: [i * 1.5, 0, IZ], ry: .25 }); if (g.userData.spin) fanSw.wire(g); });
    PIECE_IDS.forEach((id, i) => WORLD.put(id, { at: [i * 3.2, 0, IZ - 6], ry: 0 }));

    // ---- streets: a four-way with a traffic light, and one of each kind
    SETS.ground(160, 160, WORLD.mat('lawn'), 0, -.02, SZ - 40);
    WORLD.intersection({ at: [0, SZ], kind: 'suburb', control: 'light' }); const hw = 7.4 / 2;
    for (const [a, c] of [[[0, SZ + hw], [0, SZ + 40]], [[0, SZ - hw], [0, SZ - 40]], [[hw, SZ], [40, SZ]], [[-hw, SZ], [-40, SZ]]]) WORLD.street({ from: a, to: c, kind: 'suburb', seed: 3 });
    ['suburb', 'city', 'country', 'dirt', 'alley'].forEach((k, i) => WORLD.street({ from: [(i - 2) * 20, SZ - 85], to: [(i - 2) * 20, SZ - 120], kind: k, seed: 7 + i }));

    // ---- the physics yard: ropes, cords and chains, all real
    SETS.ground(110, 70, WORLD.mat('lawn'), PX + 25, -.01, -12);
    const post = (x, z, h, c = '#6a5a44') => WORLD.b(sc, .14, h, .14, WORLD.col(c), x, h / 2, z), beam = (x0, x1, y, z, c = '#6a5a44') => WORLD.b(sc, x1 - x0 + .2, .16, .16, WORLD.col(c), (x0 + x1) / 2, y, z);
    // a pendulum: a 4 kg weight on 2.6 m of rope, knocked sideways
    { const x = PX - 4; post(x - 1.6, 0, 4.3); post(x + 1.6, 0, 4.3); beam(x - 1.6, x + 1.6, 4.25, 0);
      const r = WORLD.rope(Wp, { from: [x, 4.17, 0], length: 2.6, segments: 10, kind: 'rope', end: { mass: 4, size: .34, color: '#8a3a2a' }, name: 'pendulum' }); Wp.push(r.endItem, TL.pend + .4, [16, 0, 3]); }
    // a slack rope between two posts, a ball rolled off a shelf onto it
    { const x = PX + 1; post(x - 2.1, 0, 1.9); post(x + 2.1, 0, 1.9); WORLD.rope(Wp, { from: [x - 2, 1.8, 0], to: [x + 2, 1.8, 0], kind: 'rope', slack: .1, mass: 6, name: 'slack rope' });
      post(x - 1.5, 0, 4.25, '#5a5e60'); WORLD.b(sc, 1.0, .1, .6, WORLD.col('#5a5e60'), x - 1.15, 4.3, 0); Wp.solid({ size: [1.0, .1, .6], at: [x - 1.15, 4.3, 0] });
      const ball = PS1.add(new THREE.SphereGeometry(.22, 8, 6), WORLD.col('#c8402a'), x - 1.0, 4.57, 0, sc), bi = Wp.add(ball, { name: 'ball', mass: 3, shape: { type: 'sphere', r: .22 }, bounce: .3, foley: 'rubber' }); Wp.push(bi, TL.pend + 1.0, [5, 0, 0]); }
    // a crate on a rope over a traffic cone; the rope is cut
    { const x = PX + 12; post(x - 1.6, 0, 4.3); post(x + 1.6, 0, 4.3); beam(x - 1.6, x + 1.6, 4.25, 0);
      WORLD.rope(Wp, { from: [x, 4.17, 0], length: 1.6, kind: 'rope', end: { mass: 12, size: .55, color: '#9a7a4a' }, cut: { t: TL.cut + 1.0, at: 4 }, name: 'cut rope' });
      const cone = PROPS.make('traffic-cone', { at: [x + .1, 0, 0] }); Wp.add(cone, cone.userData.prop); }
    // a tow: a pickup drags a tyre on 4 m of rope, the rope's front end follows the hitch
    { const z = -25, x0 = PX - 6, go = t => x0 + 26 * ss((t - TL.tow - .5) / 4.2); O.truck = SETS.vehicle('pickup', {}); O.truckX = go; O.truck.rotation.y = Math.PI / 2;
      const hitch = t => V(go(t) - 2.75, .55, z), tyre = PS1.group(x0 - 2.75 - 3.6, .1, z, sc), tm = PS1.add(new THREE.TorusGeometry(.32, .1, 5, 10), WORLD.col('#151515'), 0, 0, 0, tyre); tm.rotation.x = Math.PI / 2;
      const ti = Wp.add(tyre, { name: 'tow tyre', mass: 9, shape: { type: 'cylinder', r: .42, h: .2 }, friction: .5, foley: 'rubber' });
      WORLD.rope(Wp, { from: { fn: hitch }, to: { item: ti, at: [.42, 0, 0] }, length: 4, kind: 'rope', thick: .035, name: 'tow rope' });
      O.towMid = t => (go(t) - 2.75 + ti.mesh.position.x) / 2; }
    // a swing set (chains) and a tyre swing, pushed
    { const sw = WORLD.swingSet(Wp, { at: [PX + 29, 0, 0] }); Wp.push(sw.seats[0], TL.swing + .3, [0, 0, 4]); Wp.push(sw.seats[1], TL.swing + .9, [0, 0, -3]);
      const x = PX + 34; post(x, -.1, 3.6, '#4a3a2a'); WORLD.b(sc, 1.4, .18, .18, WORLD.col('#4a3a2a'), x - .6, 3.5, -.1);
      const ts = WORLD.tireSwing(Wp, { at: [x - .9, 3.4, -.1], len: 2 }); Wp.push(ts.seat, TL.swing + .6, [12, 0, 10]); }
    // a clothesline with sheets in the wind
    WORLD.clothesline(Wp, { from: [PX + 41.5, 1.9, 0], to: [PX + 46.5, 1.9, 0] });
    // night: a bare bulb on a physics cord under a porch beam, a pull chain beside it; knocked, it swings its light across the wall
    { const x = PX + 55; WORLD.put('small-house', { at: [x, 0, -6.2], paint: 'cream', seed: 12 }); post(x - 2, 1.2, 3.1); post(x + 2, 1.2, 3.1); beam(x - 2, x + 2, 3.05, 1.2);
      const chain = WORLD.switch({ kind: 'pull-chain', name: 'pull chain', at: [x + .45, 2.96, 1.2], W: Wp, len: .45, flips: [TL.bulb + .8, TL.bulb + 3.6, TL.bulb + 4.1] });
      const bulb = WORLD.light('bulb', { at: [x, 2.96, 1.2], W: Wp, len: .8, lit: false, stops: .8, switch: chain }); Wp.push(bulb.bulbItem, TL.bulb + 1.9, [.12, 0, .05]); }

    // ---- the light fixtures lineup, each on its own switch, coming on as the camera passes
    { SETS.ground(40, 20, WORLD.mat('concrete'), LX, -.01, 4); WORLD.b(sc, 30, 3.4, .3, WORLD.col('#5e5248'), LX, 1.7, -1);
      FX_KINDS.forEach((k, i) => { const x = LX - 11.9 + i * 3.4, o = { lit: false, stops: k === 'streetlight' || k === 'flood-light' ? 1 : .6 };
        if (k === 'bulb' || k === 'lantern') { WORLD.b(sc, .1, .1, 1.35, WORLD.col('#2a2622'), x, 3.0, -.2); Object.assign(o, { at: [x, 2.95, .3], len: .55 }); }
        if (k === 'porch-light' || k === 'flood-light') Object.assign(o, { at: [x, k === 'flood-light' ? 2.8 : 2.1, -.85] });
        if (k === 'ceiling-lamp') { WORLD.b(sc, 2.2, .1, 1.9, WORLD.col('#d8d0c0'), x, 2.85, .1); Object.assign(o, { at: [x, 2.8, .3] }); }
        if (k === 'string-lights') { post(x - 1.5, .8, 2.7); post(x + 1.5, .8, 2.7); Object.assign(o, { from: [x - 1.5, 2.62, .8], to: [x + 1.5, 2.62, .8], n: 10, colors: ['#ffd8a0', '#ff8a6a', '#a8d8ff', '#b8ffa0'], at: [x, 0, 0] }); }
        if (k === 'streetlight') Object.assign(o, { at: [x, 0, -.5], h: 4.6 });
        if (k === 'lamp-post') Object.assign(o, { at: [x, 0, .8], h: 2.8 });
        const f = WORLD.light(k, o); WORLD.switch({ kind: 'hidden', name: k + ' switch', flips: [TL.fx + .35 + i * .58] }).wire(f); }); }

    // ---- sky: late afternoon, then night for the lights (the haze follows)
    LIGHTS.sky({ time: t => t < NIGHT ? '16:20' : '23:50', date: '1985-08-18', place: 'illinois', skylight: t => t < NIGHT ? -1.1 : -4.5, shadowSize: 34 });
    LIGHTS.atmosphere({ haze: t => t < NIGHT ? .002 : .006, color: t => t < NIGHT ? '#d0c8b8' : '#1a2030' });
    WORLD.settle(Wp, 2.5); window.DEMO = { END, NIGHT, TL, LABELS, Wp }; window.BUILD_MS = performance.now() - t0; console.log('build', window.BUILD_MS | 0, 'ms, bodies', Wp.w.bodies.length); },
  shots: S => SEG,
  update(t, S) { Wp.step(t); O.truck.position.set(O.truckX(t), 0, -25); SETS.tick(t, S); },
});
