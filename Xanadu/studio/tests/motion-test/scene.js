// STUDIO TEST: THE MOTION TEST (Phase 3). One library character (the gas-station attendant) performs every motion in the library, 3 s each,
// on a small forecourt with the props the motions need: a pump to lean on, a chair, a car seat and wheel, a ladder. Labels name the motion.
const { V, clamp } = PS1, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); }; LIGHTS.use(); const M = LIGHTS.mat, add = PS1.add, box = PS1.box, cyl = PS1.cyl;
const SEQ = [['idle', 'IDLE: weight shift, breathing, small looks'], ['lean', 'LEAN ON THE PUMP'], ['talk', 'TALK: open-palm gestures'], ['wave', 'WAVE THEM OFF'], ['walk', 'WALK: feet planted, no sliding'],
  ['run', 'RUN'], ['sneak', 'SNEAK'], ['sit', 'SIT: hips on a 0.45 m seat'], ['drive', 'DRIVE: hands on the wheel'], ['climb', 'CLIMB'], ['point', 'POINT'], ['phone', 'PHONE CALL'],
  ['lookAround', 'LOOK AROUND'], ['grab', 'GRAB: the hand reaches the cup'], ['swing', 'SWING'], ['struggle', 'STRUGGLE'], ['crawl', 'CRAWL'], ['fall', 'FALL'], ['ragdoll', 'RAGDOLL (a hit)'], ['idle', 'BACK TO IDLE']];
const DUR = 3, SPOT = { lean: [1.6, 0, -2.55], sit: [-2.2, 0, -.6], drive: [-2.2, 0, -.6], climb: [3.2, 0, -1.38], grab: [-.9, 0, -1.0], crawl: [-.9, 0, .9] };
const at = (i) => i * DUR;
CAM.episode({
  hud(t, S, q) { const i = Math.min(SEQ.length - 1, Math.floor(t / DUR)), a = clamp(Math.min((t - at(i)) / .25, (at(i) + DUR - t) / .25)); q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.lineJoin = 'round';
    q.font = 'bold 14px Arial, Helvetica, sans-serif'; q.lineWidth = 4; q.strokeStyle = '#000'; q.fillStyle = '#f2f0ea'; q.strokeText('MOTION TEST', 180, 34); q.fillText('MOTION TEST', 180, 34);
    q.font = 'bold 17px Arial, Helvetica, sans-serif'; q.fillStyle = '#ffd23a'; q.strokeText(SEQ[i][1], 180, 58); q.fillText(SEQ[i][1], 180, 58); q.restore(); },
  build(S) { const O = S.O; add(PS1.plane(24, 24, 12, 12, .5), M(PS1.color('#8a7050')), 0, 0, 0).rotation.x = -Math.PI / 2; add(PS1.plane(24, 8, 6, 3, .8), M(PS1.color('#9a8f80')), 0, 4, -6);
    // the pump, the chair, the car seat and wheel, the ladder, the table with the cup
    add(box(.5, 1.25, .38), M(PS1.color('#b0322a')), 2.0, .62, -2.6); add(new THREE.SphereGeometry(.16, 6, 4), M(PS1.color('#f4ecd0'), { unlit: true }), 2.0, 1.42, -2.6);
    const chair = PS1.group(-2.2, 0, -.75); add(box(.48, .05, .46), M(PS1.color('#5a3a24')), 0, .43, 0, chair); add(box(.48, .5, .05), M(PS1.color('#5a3a24')), 0, .7, -.22, chair); for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) add(box(.04, .43, .04), M(PS1.color('#3a2614')), x, .215, z, chair);
    O.wheel = add(new THREE.TorusGeometry(.16, .02, 4, 10), M(PS1.color('#1a1a1a')), -2.2, 1.0, -.15); O.wheel.visible = false;
    for (const s of [-1, 1]) add(box(.05, 2.4, .05), M(PS1.color('#7a5a3a')), 3.2 + s * .22, 1.2, -1.05); for (let y = .3; y < 2.4; y += .3) add(box(.44, .04, .04), M(PS1.color('#7a5a3a')), 3.2, y, -1.05);
    add(box(.6, .75, .45), M(PS1.color('#5a3a24')), -.9, .375, -.3); O.cup = add(cyl(.04, .035, .1, 8), M(PS1.color('#e8e4dc')), -.9, .8, -.45);
    O.phone = PROPS.make('phone', { at: [0, -50, 0] }); O.axe = PROPS.make('axe', { at: [0, -50, 0] }); O.who = CAST.make({ name: 'attendant', ...{ body: 'man', height: 1.72, hair: 'short', hairColor: 'grey', moustache: 'grey', age: .8, outfit: { full: 'attendant', shoes: 'boots' } } }); CAM.mark('who', O.who); LIGHTS.blob(O.who.G, .32);
    LIGHTS.sky({ time: '18:30', date: '1973-08-18', place: 'texas', sun: { azimuth: 235, elevation: 22, kelvin: 4200 }, skylight: -1.6, ground: '#8a7050', shadowSize: 7 }); LIGHTS.atmosphere({ haze: .01, color: '#d0a272' }); LIGHTS.setup('three-point', { subject: 'who', facing: 20, stops: -.7 }); },
  shots: S => SEQ.map(([m], i) => { const p = SPOT[m] || [0, 0, 0], wide = ['walk', 'run', 'sneak', 'climb'].includes(m), low = ['crawl', 'fall', 'ragdoll'].includes(m), side = m === 'grab';
    const off = low ? [2.2, .9, 2.6] : wide ? [3.6, 1.35, 4.2] : side ? [2.6, 1.35, 1.2] : m === 'lean' ? [-2.0, 1.35, 2.6] : [2.4, 1.35, 3.0];
    return { id: `M${String(i + 1).padStart(2, '0')}`, at: at(i), dur: DUR, lens: wide || low ? '24mm' : '35mm', stop: 'f/4', pos: wide && m !== 'climb' ? [.4, 1.45, 6.4] : [p[0] + off[0], off[1], p[2] + off[2]], look: wide && m !== 'climb' ? (t => S.O.who.G.position.clone().add(V(0, .95, 0))) : m === 'crawl' ? (t => S.O.who.G.position.clone().add(V(0, .35, 0))) : [p[0], low ? .35 : .95, p[2]], subject: 'who', note: m }; }),
  update(t, S) { const O = S.O, P = O.who, i = Math.min(SEQ.length - 1, Math.floor(t / DUR)), m = SEQ[i][0], u = t - at(i), p = SPOT[m] || [0, 0, 0];
    P.G.position.set(p[0], 0, p[2]); P.G.rotation.y = m === 'lean' ? -Math.PI / 2 + .3 : m === 'climb' ? 0 : m === 'crawl' ? Math.PI / 2 : m === 'sit' || m === 'drive' ? 0 : .35; if (m === 'point') P.G.rotation.y = 0; O.wheel.visible = m === 'drive';
    if (m === 'walk' || m === 'run' || m === 'sneak') { const sp = m === 'run' ? 2.4 : m === 'sneak' ? .55 : 1.2, d = u * sp, a = (m === 'run' ? -3.6 : -1.8) + d; P.G.position.set(a, 0, .8); P.G.rotation.y = Math.PI / 2; P.solve(CAST.MOTIONS[m](u, { d })); P.animateFace(t); return; }
    const params = { lean: { side: 'R', target: [.5, 1.2, .1] }, sit: { seat: .45 }, drive: { seat: .45, wheel: [0, 1.0, .45] }, grab: { side: 'R', target: [.0, .8, .52], dur: 1.1 }, point: { dir: [-1, .12, .25] }, swing: { dur: .9, repeat: true } }[m] || {};
    if (m === 'climb') P.G.position.y = .32 * ss(u / 2.6);
    if (m === 'crawl') P.G.position.x = p[0] + u * .45;
    if (m === 'grab') P.G.rotation.y = 0;
    const big = ['sit', 'point', 'fall', 'ragdoll', 'crawl', 'climb'].includes(m) || ['climb', 'crawl', 'ragdoll', 'drive'].includes(SEQ[i - 1] && SEQ[i - 1][0]);
    // a new spot is a new shot: no blend across the jump (a blend there would float him between two places)
    const prevM = i ? SEQ[i - 1][0] : 'idle', moved = JSON.stringify(SPOT[prevM] || [0, 0, 0]) !== JSON.stringify(SPOT[m] || [0, 0, 0]) || ['walk', 'run', 'sneak'].includes(prevM);
    const q = CAST.act(P, t, [{ at: at(i - 1), motion: i ? SEQ[i - 1][0] : 'idle' }, { at: at(i), motion: m, p: params, blend: moved ? 0 : i === SEQ.length - 1 ? 1.2 : big ? .7 : .3, talk: m === 'talk' }]);
    // the grab lifts the cup to the chest once the hand has it
    if (m === 'grab' && u > 1.5) { const k = Math.min(1, (u - 1.5) / .6), r = q.handR; q.handR = [r[0] + (.2 - r[0]) * k, r[1] + (1.05 - r[1]) * k, r[2] + (.3 - r[2]) * k]; P.solve(q); }
    // props in hand that make the motion read: the phone, the axe
    O.phone.visible = m === 'phone'; if (m === 'phone' && P.held.L !== O.phone) P.hold(O.phone, 'R', [0, -.05, .06]); O.axe.visible = m === 'swing'; if (m === 'swing' && !P.held.L) P.hold(O.axe, 'L', [0, -.06, .02], [Math.PI / 2, 0, 0]);
    if (m === 'grab' && u > 1.3 && !P.held.R) P.hold(O.cup, 'R', [0, -.08, .03]); if (m !== 'grab' && P.held.R === O.cup) { const c = P.release('R'); c.position.set(-.9, .8, -.45); c.rotation.set(0, 0, 0); }
    if (m !== 'phone' && P.held.R === O.phone) { P.release('R'); O.phone.position.set(0, -50, 0); } if (m !== 'swing' && P.held.L === O.axe) { P.release('L'); O.axe.position.set(0, -50, 0); } },
});
