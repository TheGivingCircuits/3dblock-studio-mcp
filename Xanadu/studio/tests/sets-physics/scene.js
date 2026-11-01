// STUDIO TEST: SETS AND PHYSICS (Phase 4 proof).
// 0-4 s    the 70s kitchen from lib/sets (SETS.room) dressed by SETS.dress (seed 7), with a path and the camera lines kept clear
// 4-34 s   the hand test: one character picks up, carries and lets go of five props from lib/props (cup set down, phone to the ear then
//          dropped, knife set down, flashlight dropped and rolling, VHS tape thrown). The props ride the hand bone; the releases are physics.
// 34-38 s  physics beats: the door swings open on its hinge, a chair tips over, a bottle rolls across the floor
// 38-60 s  the country road (SETS.countryRoad + a farm): a pickup throws dust, a police cruiser with its bar lit, a school bus, a van parked
//          on the shoulder with its door opening, a wrecked sedan in the weeds and a motorbike leaning around it
const { V, clamp, lerp } = PS1; LIGHTS.use(); const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const T0 = 4, SEG = 6, XS = [.0, .2, .4, .6, .8], PROPZ = .3, AZ = -.12, BZ = -1.2, CTR = { y: .9, z: -1.52 };
const TEST = [{ id: 'cup', end: 'set', label: 'CUP: pick up, carry, set down' }, { id: 'phone', end: 'drop', label: 'PHONE: answer it, then drop it' }, { id: 'knife', end: 'set', label: 'KNIFE: pick up, carry, set down' },
  { id: 'flashlight', end: 'drop', label: 'FLASHLIGHT: carry, drop, it rolls' }, { id: 'tape', end: 'throw', label: 'VHS TAPE: carry, throw' }];
const RX = 300, LANE = 1.6;
const LABELS = [[0, 4, 'SET: THE KITCHEN · dressed by SETS.dress (seed 7)'], ...TEST.map((p, i) => [T0 + i * SEG, T0 + (i + 1) * SEG, 'PROPS · ' + p.label]), [34, 38, 'PHYSICS: a door swings, a chair tips, a bottle rolls'],
  [38, 43, 'SET: THE COUNTRY ROAD · a pickup throws dust'], [43, 48, 'POLICE CRUISER · the bar lit · a wreck in the weeds'], [48, 53, 'SCHOOL BUS · a parked van, its door opening'], [53, 58, 'MOTORBIKE · leaning around the wreck'], [58, 60, 'THE FARM']];
let W, P, PR = {}, CAR = {};
// the character's whole performance as a pure function of t (PHYS.carry calls it to find the hand at each release)
const segs = i => { const A = V(XS[i], 0, AZ), B = V(XS[i], 0, TEST[i].end === 'set' ? BZ : -.7), An = V(XS[Math.min(4, i + 1)], 0, AZ), p = TEST[i], d = PROPS.defs[p.id], rest = V(XS[i], .75, PROPZ);
  const grip = V(...d.grip), pick = rest.clone().add(grip).add(V(0, .07, 0)), put = V(XS[i] - .05, CTR.y, -1.62).add(grip).add(V(0, .08, 0));
  return [[0, 1.2, A, 0, 'grab', { side: 'R', target: pick, dur: 1.0 }], [1.2, 1.9, A, [0, Math.PI], 'idle', {}], [1.9, 2.8, [A, B], Math.PI, 'walk', {}],
    p.end === 'set' ? [2.8, 4.1, B, Math.PI, 'grab', { side: 'R', target: put, dur: .8 }] : p.end === 'throw' ? [2.8, 4.1, B, Math.PI, 'swing', { dur: .9 }] : p.id === 'phone' ? [2.8, 4.1, B, Math.PI, 'phone', {}] : [2.8, 4.1, B, Math.PI, 'idle', {}],
    [4.1, 4.6, B, [Math.PI, 0], 'idle', {}], [4.6, 5.6, [B, An], 0, 'walk', {}], [5.6, 6.01, An, 0, 'idle', {}]]; };
const qOf = (s, u, i) => { const [a, b, pos, ry, m, prm] = s, k = (u - a) / (b - a), at = Array.isArray(pos) ? pos[0].clone().lerp(pos[1], ss(k)) : pos.clone(), r = Array.isArray(ry) ? lerp(ry[0], ry[1], ss(k)) : ry;
  P.G.position.copy(at); P.G.rotation.y = r; P.G.updateMatrixWorld(true); const pr = { ...prm };
  if (prm.target) { const l = P.G.worldToLocal(prm.target.clone()); pr.target = [l.x / P.scale, l.y / P.scale, l.z / P.scale]; }
  const q = m === 'walk' ? CAST.MOTIONS.walk(u - a, { d: pos[0].distanceTo(pos[1]) * ss(k) / P.scale }) : CAST.MOTIONS[m](u - a, pr);
  // carrying: the right hand holds the prop in front of the chest while walking or turning
  const end = [3.7, 4.0, 3.7, 3.3, 3.25][i], w = u < 1.0 ? 0 : u < end ? 1 : 1 - ss((u - end) / .35);
  if (w > 0 && (m === 'walk' || m === 'idle')) { q.handR = [lerp(q.handR[0], .2, w), lerp(q.handR[1], 1.02, w), lerp(q.handR[2], .3, w)]; q.elbowR = [1, -.5, -.3]; } return q; };
function perform(t) { if (t < T0 || t >= T0 + 5 * SEG) { const done = t >= T0 + 5 * SEG; if (done) { P.G.position.set(-1.5, 0, .9); P.G.rotation.y = 1.9; } else { P.G.position.set(XS[0], 0, AZ); P.G.rotation.y = 0; } P.solve(CAST.MOTIONS.idle(t, { seed: 2 })); P.animateFace(t); return; }
  const i = Math.floor((t - T0) / SEG), u = t - T0 - i * SEG, S = segs(i), k = S.findIndex(s => u >= s[0] && u < s[1]), s = S[Math.max(0, k)];
  let q = qOf(s, u, i); if (k > 0 && u - s[0] < .25) { const pos = P.G.position.clone(), ry = P.G.rotation.y, prev = qOf(S[k - 1], S[k - 1][1] - .001, i); P.G.position.copy(pos); P.G.rotation.y = ry; q = CAST.blend(prev, q, ss((u - s[0]) / .25)); }
  P.solve(q); P.animateFace(t, { talk: TEST[i].id === 'phone' && u > 3.0 && u < 3.9 }); }
CAM.episode({
  hud(t, S, q) { const L = LABELS.find(([a, b]) => t >= a && t < b) || LABELS.at(-1), a = clamp(Math.min((t - L[0]) / .25, (L[1] - t) / .25)); q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.lineJoin = 'round';
    q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.lineWidth = 4; q.strokeStyle = '#000'; q.fillStyle = '#f2f0ea'; q.strokeText('SETS AND PHYSICS TEST', 180, 34); q.fillText('SETS AND PHYSICS TEST', 180, 34);
    q.font = 'bold 14px Arial, Helvetica, sans-serif'; q.fillStyle = '#ffd23a'; q.strokeText(L[2], 180, 56); q.fillText(L[2], 180, 56); q.restore(); },
  build(S) { const O = S.O;
    // ---- the kitchen
    const R = O.kitchen = SETS.room('kitchen', { era: '70s', seed: 7, lights: true, lightStops: -.6 });
    SETS.keepOut([-.35, 1.15, .08, .5], 'the five test props'); SETS.keepOut([-.4, 1.2, -2.0, -1.3], 'where the props are set down'); SETS.keepOut([1.0, 2.4, -1.2, .4], 'the chair and the bottle');
    W = PHYS.world(); W.ground(0); W.fromSets();
    SETS.dress(R, [[[2.3, .9], [.4, -.3], [-.2, -1.0]]], [{ pos: [-1.9, 1.6, 1.6], look: [.6, .8, -.6] }, { pos: [1.9, 1.3, 1.4], look: [.4, 1.0, -.3] }], 7, { physics: W, era: '70s' });
    P = O.who = CAST.make({ name: 'tester', body: 'woman', hair: 'feathered', hairColor: 'auburn', outfit: { top: 'plaidShirt', bottom: 'jeans', shoes: 'sneakers' }, era: '70s' }); CAM.mark('who', P); LIGHTS.blob(P.G, .3);
    TEST.forEach((p, i) => { const g = PR[p.id] = PROPS.make(p.id, { at: [XS[i], .75, PROPZ], ry: 0 }), it = W.add(g, g.userData.prop);
      W.carry(it, { by: P, side: 'R', from: T0 + i * SEG + 1.0, to: T0 + i * SEG + [3.7, 4.0, 3.7, 3.3, 3.25][i], end: p.end, pose: perform, vel: p.end === 'throw' ? [0, 1.6, -2.8] : null, spin: p.end === 'throw' ? [6, 2, 1] : null, rot: null }); });
    // the physics beats: the door, a chair, a bottle on its side
    const slab = R.doors.door.userData.slab, hinge = R.doors.door.getWorldPosition(V(0, 0, 0)); O.door = W.door(slab, { hinge: [hinge.x, hinge.y, hinge.z], limits: [-1.7, 1.7] });
    W.push(O.door, 34.4, [-14, 0, 0], [0, 0, 0]); O.chair = PROPS.make('chair', { at: [1.7, 0, -.45], ry: -Math.PI / 2 }); const ch = W.add(O.chair, O.chair.userData.prop); W.push(ch, 35.5, [-8, 0, 0], [0, .42, 0]);
    O.bottle = PROPS.make('bottle', { at: [1.3, .035, .1] }); O.bottle.rotation.z = Math.PI / 2; O.bottle.position.y = .035; const bt = W.add(O.bottle, { ...O.bottle.userData.prop, center: [0, .13, 0] }); W.push(bt, 36.6, [-.5, 0, .8], [0, 0, 0]);
    LIGHTS.setup('window', { subject: 'who', facing: 200, stops: -.8, on: [0, 38] });
    // ---- the country road at x = 300
    const road = O.road = SETS.countryRoad({ x: RX, z: 0, len: 170, seed: 23, farm: true, woods: 0, sign: 'curve', lit: false });
    CAR.wreck = SETS.vehicle('sedan', { at: [RX - 6.2, 0, -14], ry: .5, wrecked: 4, solid: true }); CAR.van = SETS.vehicle('van', { at: [RX + 5.0, 0, 9], ry: 0, paint: 'olive' });
    CAR.pickup = SETS.vehicle('pickup', {}); CAR.police = SETS.vehicle('police', { lights: true, lightStops: -1.2 }); CAR.bus = SETS.vehicle('bus', {}); CAR.bike = SETS.vehicle('motorbike', { paint: '#7a1a1a' });
    O.rider = CAST.make({ name: 'rider', body: 'man', hair: 'long', hairColor: 'black', outfit: { top: 'tee', jacket: 'leatherJacket', bottom: 'jeans', shoes: 'boots' }, extras: ['glasses'], era: '70s' }); CAR.bike.userData.lean.add(O.rider.G); O.rider.G.position.set(0, .82 - .8 + .3, .25); O.rider.G.rotation.y = Math.PI;
    for (const k of ['pickup', 'police', 'bus', 'bike']) CAM.mark(k, t => CAR[k].position.clone().add(V(0, 1.1, 0))); CAM.mark('vanDoor', CAR.van.userData.doors.FL);
    LIGHTS.sky({ time: '15:30', date: '1973-08-18', place: 'texas', skylight: -1.0, shadowSize: 40 }); window.TESTW = W; LIGHTS.atmosphere({ haze: t => t < 38 ? 0 : .006, color: '#d6b48a' }); },
  shots: S => [
    { id: 'K01', at: 0, dur: 4, lens: '18mm', stop: 'f/4', pos: [-1.9, 1.6, 1.6], look: [.6, .8, -.6], subject: [.4, .8, -.2] },
    ...TEST.flatMap((p, i) => { const t0 = T0 + i * SEG, x = XS[i]; return [{ id: `P${i + 1}a`, at: t0, dur: 2.8, lens: '24mm', stop: 'f/4', pos: [Math.min(x + 1.5, 2.15), 1.75, 1.7], look: [x, .9, -.3], subject: 'who' },
      { id: `P${i + 1}b`, at: t0 + 2.8, dur: 3.2, lens: '20mm', stop: 'f/4', pos: [Math.max(x - 1.7, -1.6), 1.5, .45], look: [x + .1, .8, -1.3], subject: 'who' }]; }),
    { id: 'K02', at: 34, dur: 4, lens: '18mm', stop: 'f/4', pos: [-.3, 1.7, -1.0], look: [1.9, .5, .2], subject: [1.7, .5, -.2] },
    { id: 'R01', at: 38, dur: 5, lens: '24mm', stop: 'f/4', pos: [RX + 3.4, 1.7, -8], look: t => CAR.pickup.position.clone().add(V(0, 1, 0)), subject: 'pickup' },
    { id: 'R02', at: 43, dur: 5, lens: '24mm', stop: 'f/4', pos: [RX + 3.4, 1.1, 4], look: t => CAR.police.position.clone().add(V(-1.2, 1.0, 0)), subject: 'police' },
    { id: 'R03', at: 48, dur: 5, lens: '24mm', stop: 'f/4', pos: [RX - 4.2, 2.2, 22], look: [RX + 4.2, 1.2, 7], subject: [RX + 4.5, 1.2, 8] },
    { id: 'R04', at: 53, dur: 5, lens: '28mm', stop: 'f/4', pos: [RX + 3.4, 1.6, -3], look: t => CAR.bike.position.clone().add(V(0, 1, 0)), subject: 'bike' },
    { id: 'R05', at: 58, dur: 2, lens: '24mm', stop: 'f/4', pos: [RX + 2, 3.2, 30], look: [RX - 25, 3, -16], subject: [RX - 30, 3, -17] }],
  update(t, S) { const O = S.O; SETS.tick(t, S); W.step(t); perform(t);
    // traffic: each vehicle has its window; outside it the vehicle waits far down the road
    const lane = (s, z0, v, t0) => tt => V(RX + s * LANE, 0, z0 + s * -v * (tt - t0)); const park = V(RX + 40, -20, 0);
    const go = (car, path, a, b, o = {}) => { if (t < a - .5 || t > b + 3) { car.position.copy(park); return; } SETS.drive(car, t, path, o); };
    go(CAR.pickup, lane(1, 70, 17, 38), 38, 43, { dust: 20 }); go(CAR.police, lane(-1, -60, 15, 43), 43, 48); go(CAR.bus, lane(1, 60, 12, 48), 48, 53);
    go(CAR.bike, tt => V(RX - LANE - 1.8 * Math.max(0, Math.sin(clamp((tt - 54.2) / 2.4) * Math.PI)), 0, -45 + 13 * (tt - 53)), 53, 58);
    SETS.openDoor(CAR.van, 'FL', ss((t - 49.5) / 1.2)); O.rider.solve(CAST.MOTIONS.drive(t, { seat: .42, wheel: [0, .72, .62] })); },
});
