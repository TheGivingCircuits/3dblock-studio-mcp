// The motion library (Phase 3). Load after cast/cast.js; adds to window.CAST. Every motion is a pure function of time that returns a pose in
// base space (a 1.75 m body, G-local, +z forward): hip, pelvis, spine and head angles, hand and foot targets, elbow and knee hints, and a body
// root tilt for falls. The cast solver's IK puts the hands and feet exactly on their targets, so feet that are planted stay planted.
//   CAST.MOTIONS.<name>(t, params) → pose          CAST.blend(a, b, k) → pose          CAST.act(P, t, track) → poses a character on a timeline
//   CAST.walkPath(P, t, pts, o) moves a character along timed points with a walk/run/sneak whose steps match the distance (no sliding)
(function () {
const C = window.CAST, { clamp, lerp } = window.PS1, TAU = Math.PI * 2, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const n1 = x => { const i = Math.floor(x), f = x - i, h = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; return lerp(h(i), h(i + 1), f * f * (3 - 2 * f)) * 2 - 1; };
const P0 = () => C.STAND();
const M = C.MOTIONS = {
  stand: () => P0(),
  // a standing idle: the weight shifts from foot to foot, breathing lifts the chest, small looks around; the feet never move
  idle: (t, p = {}) => { const q = P0(), sh = Math.sin(t * .42 + (p.seed || 0)) * .028, br = Math.sin(t * 1.7);
    q.hip = [sh, .795 + br * .003, 0]; q.pelvis = [0, 0, -sh * 1.6]; q.spine = [.02 + br * .012, n1(t * .2 + 3) * .05, sh * 1.2]; q.head = [n1(t * .3) * .06, n1(t * .17 + 9) * .28, 0];
    q.footL = [-.11, .05, 0]; q.footR = [.11, .05, .02]; q.handL = [-.27, .8 + br * .004, .03]; q.handR = [.27, .8 + br * .004, .03]; return q; },
  // leaning on something (a pump, a counter): weight on one side, that hand resting on the surface, the other on the hip, ankles crossed
  lean: (t, p = {}) => { const q = M.idle(t * .6, p), sd = p.side === 'L' ? -1 : 1, tg = p.target || [sd * .42, 1.1, .05];
    q.hip = [sd * .05, .79, 0]; q.pelvis = [0, 0, -sd * .08]; q.spine = [.03, sd * .1, sd * .1]; q['hand' + (sd > 0 ? 'R' : 'L')] = tg;
    q['hand' + (sd > 0 ? 'L' : 'R')] = [-sd * .17, .92, .1]; q['elbow' + (sd > 0 ? 'L' : 'R')] = [-sd, 0, -.4]; q.footL = [-.04 + sd * .04, .05, .06]; q.footR = [.1 + sd * .04, .05, -.02]; q.footYawL = .2; return q; },
  // talking: open-palm gestures timed to the words, small nods
  talk: (t, p = {}) => { const q = M.idle(t, p), a = Math.sin(t * 3.1), b = Math.sin(t * 2.3 + 1.2);
    q.handL = [-.26 + b * .07, 1.0 + a * .08, .26 + b * .06]; q.handR = [.26 + a * .08, 1.03 + b * .09, .28 + a * .07]; q.elbowL = [-1, -.2, -.6]; q.elbowR = [1, -.2, -.6];
    q.head = [.06 * Math.sin(t * 4.2), q.head[1] * .4, .04 * Math.sin(t * 2.1)]; return q; },
  // waving them off: a dismissive sweep of the hand toward the road, then the arm drops
  wave: (t, p = {}) => { const q = M.idle(t, p), sd = p.side === 'L' ? -1 : 1, sw = Math.sin(t * 5.2), k = ss(t / .35);
    q['hand' + (sd > 0 ? 'R' : 'L')] = [lerp(sd * .27, sd * (.36 + sw * .24), k), lerp(.8, 1.3 + Math.abs(sw) * .08, k), lerp(.03, .34 + Math.cos(t * 5.2) * .12, k)];
    q['elbow' + (sd > 0 ? 'R' : 'L')] = [sd, -.6, -.3]; q.spine = [.02, -sd * .12 * k, sd * .04]; q.head = [-.04, sd * .2, 0]; return q; },
  point: (t, p = {}) => { const q = M.idle(t, p), sd = p.side === 'L' ? -1 : 1, k = ss(t / .3), d = p.dir || [sd * .3, 0, 1], l = Math.hypot(...d);
    q['hand' + (sd > 0 ? 'R' : 'L')] = [lerp(sd * .27, sd * .2 + d[0] / l * .64, k), lerp(.8, 1.36 + d[1] / l * .64, k), lerp(.03, d[2] / l * .64, k)]; q['elbow' + (sd > 0 ? 'R' : 'L')] = [sd, -1, 0]; q.head = [0, Math.atan2(d[0], d[2]) * .6 * k, 0]; return q; },
  phone: (t, p = {}) => { const q = M.idle(t, p), k = ss(t / .35); q.handR = [lerp(.27, .14, k), lerp(.8, 1.54, k), lerp(.03, .02, k)]; q.elbowR = [1, -.3, -.2]; q.head = [.04, -.08, .12 * k]; return q; },
  lookAround: (t, p = {}) => { const q = M.idle(t, p), y = Math.sin(t * .9) * .9, x = Math.sin(t * .55) * .12; q.head = [x, y, 0]; q.spine = [.02, y * .3, 0]; q.pelvis = [0, y * .1, 0]; return q; },
  grab: (t, p = {}) => { const q = M.idle(t, p), sd = p.side === 'L' ? -1 : 1, k = ss(t / (p.dur || .5)), tg = p.target || [sd * .2, 1.0, .5];
    const hk = 'hand' + (sd > 0 ? 'R' : 'L'); q[hk] = [lerp(q[hk][0], tg[0], k), lerp(q[hk][1], tg[1], k), lerp(q[hk][2], tg[2], k)]; q.spine = [.55 * k * clamp((1.15 - tg[1]) * 2.2), 0, 0]; q.hip = [q.hip[0], q.hip[1] - .03 * k * clamp((1.15 - tg[1]) * 2.2), q.hip[2] - .04 * k]; q.head = [.3 * k, 0, 0]; return q; },
  // a two-handed overhead swing (a hammer, an axe): up behind the head, then down through the target
  swing: (t, p = {}) => { const q = M.idle(t, p), d = p.dur || .9, cyc = p.repeat ? d + .7 : Infinity, u = Math.min(1.25, (t % cyc) / d), up = ss(u / .45), dn = ss((u - .45) / .35), k = u < .45 ? up : 1;
    const y = lerp(lerp(1.0, 1.88, up), .85, dn), z = lerp(lerp(.25, -.12, up), .58, dn); q.handR = [.06, y, z]; q.handL = [-.06, y - .04, z - .02]; q.elbowL = [-1, .2, -.5]; q.elbowR = [1, .2, -.5];
    q.spine = [lerp(-.12 * k, .35, dn), 0, 0]; q.hip = [0, .79 - .04 * dn, 0]; return q; },
  struggle: (t, p = {}) => { const q = M.idle(t, p), a = Math.sin(t * 7.3), b = Math.sin(t * 9.1 + 1);
    q.pelvis = [0, a * .18, 0]; q.spine = [.1, a * .3, b * .12]; q.handL = [-.22 + b * .06, 1.15 + a * .1, .32]; q.handR = [.22 - a * .06, 1.1 + b * .1, .34]; q.head = [b * .15, -a * .4, a * .1]; q.footL = [-.14, .05, a * .05]; q.footR = [.14, .05, -a * .05]; return q; },
  // sitting on a seat of a given height (m); the hips land on the seat and the feet on the floor
  // seat: the world height of the surface sat on (SETS.seatAt gives it); the solver rests the underside of the pelvis on it, at any body scale
  sit: (t, p = {}) => { const q = P0(), seat = p.seat ?? .45, br = Math.sin(t * 1.7); q.hip = [0, seat + .07, -.04]; q.seatW = seat; q.spine = [.04 + br * .01, 0, 0]; q.head = [n1(t * .3) * .05, n1(t * .2) * .2, 0];
    q.footL = [-.11, .05, .42]; q.footR = [.11, .05, .44]; q.kneeL = [0, .3, 1]; q.kneeR = [0, .3, 1]; q.handL = [-.18, seat + .24, .3]; q.handR = [.18, seat + .24, .32]; q.elbowL = [-1, -.5, -.4]; q.elbowR = [1, -.5, -.4]; return q; },
  drive: (t, p = {}) => { const q = M.sit(t, p), w = p.wheel || [0, (p.seat ?? .45) + .55, .45], st = Math.sin(t * .8) * .04; q.handL = [w[0] - .16, w[1] + st, w[2]]; q.handR = [w[0] + .16, w[1] - st, w[2]]; q.spine = [.08, 0, 0]; return q; },
  climb: (t, p = {}) => { const q = P0(), ph = t * (p.rate || 1.2) * TAU, a = Math.sin(ph); q.hip = [0, .82, -.05]; q.spine = [.08, 0, 0];
    q.handL = [-.18, 1.62 + a * .14, .36]; q.handR = [.18, 1.62 - a * .14, .36]; q.footL = [-.12, .32 + Math.max(0, -a) * .3, .3]; q.footR = [.12, .32 + Math.max(0, a) * .3, .3]; q.kneeL = q.kneeR = [0, 0, 1]; return q; },
  // falling backwards to the ground: the body root tips over at the heels, the arms fly up, one chunky bounce
  fall: (t, p = {}) => { const q = P0(), d = p.dur || .7, k = clamp(t / d), e = k * k, b = t > d ? Math.max(0, Math.sin((t - d) * 14) * Math.exp(-(t - d) * 8)) * .06 : 0;
    q.root = [0, b * 2, -e * .25, -e * Math.PI / 2 * .98, 0, 0]; q.handL = [-.4, 1.2 + e * .4, -.1]; q.handR = [.4, 1.25 + e * .4, -.1]; q.head = [-.3 * e, 0, 0]; q.footL = [-.12, .05, .1 * e]; q.footR = [.14, .1 + .1 * e, .2 * e]; return q; },
  // the hit: a ragdoll that drops with two chunky bounces and lies still, limbs splayed (deterministic, no physics needed)
  ragdoll: (t, p = {}) => { const q = M.fall(t * 1.3, { dur: .55 }), b = Math.abs(Math.sin(t * 9)) * Math.exp(-t * 4) * .5; q.root[3] += b * .3; q.root[5] = (p.side || 1) * .25 * ss(t / .5);
    q.handL = [-.55, .9, -.05]; q.handR = [.6, .95, .1]; q.footL = [-.2, .05, .05]; q.footR = [.25, .08, .12]; q.head = [-.2, (p.side || 1) * .5, 0]; return q; },
  crawl: (t, p = {}) => { const q = P0(), d = p.d ?? t * .45, ph = d / .5 * TAU, a = Math.sin(ph), c = Math.cos(ph); q.hip = [0, .5, -.25]; q.spine = [1.32, a * .08, 0]; q.head = [-.9, 0, 0];
    q.handL = [-.2, .05, .38 + a * .12]; q.handR = [.2, .05, .38 - a * .12]; q.elbowL = [-1, 0, -.2]; q.elbowR = [1, 0, -.2]; q.footL = [-.14, .07, -.62 - a * .1]; q.footR = [.14, .07, -.62 + a * .1]; q.kneeL = q.kneeR = [0, -1, .2];
    q.handL[1] += Math.max(0, c) * .06; q.handR[1] += Math.max(0, -c) * .06; return q; },
  // walk / run / sneak by distance travelled: each foot is planted for half the cycle while the body passes over it, so it does not slide
  walk: (t, p = {}) => { const q = P0(), run = p.run, sneak = p.sneak, Ls = p.step || (run ? .62 : sneak ? .3 : .42), d = p.d ?? t * (run ? 3.4 : sneak ? .6 : 1.35), ph = d / (2 * Ls);
    const foot = off => { const u = ((ph + off) % 1 + 1) % 1; if (u < .5) return [Ls / 2 - u / .5 * Ls, .05]; const v = (u - .5) / .5; return [-Ls / 2 + ss(v) * Ls, .05 + Math.sin(v * Math.PI) * (run ? .18 : sneak ? .07 : .1)]; };
    const fl = foot(0), fr = foot(.5), bob = Math.abs(Math.cos(ph * TAU)), sw = Math.sin(ph * TAU);
    q.hip = [sw * .015, (run ? .76 : sneak ? .66 : .785) + bob * (run ? .035 : .018), run ? .06 : 0]; q.pelvis = [0, sw * .09, 0]; q.spine = [run ? .26 : sneak ? .38 : .04, -sw * .1, 0];
    q.footL = [-.1, fl[1], fl[0]]; q.footR = [.1, fr[1], fr[0]]; q.kneeL = q.kneeR = [0, 0, 1];
    if (sneak) { q.handL = [-.22, .98, .32]; q.handR = [.22, .96, .3]; q.elbowL = [-1, -.3, -.5]; q.elbowR = [1, -.3, -.5]; q.head = [-.2, n1(t * .4) * .3, 0]; }
    else if (run) { q.handL = [-.24, 1.0 + sw * .1, -sw * .3]; q.handR = [.24, 1.0 - sw * .1, sw * .3]; q.elbowL = [-.4, -.6, -1]; q.elbowR = [.4, -.6, -1]; q.head = [-.15, 0, 0]; }
    else { q.handL = [-.27, .82, -fl[0] * .55]; q.handR = [.27, .82, -fr[0] * .55]; q.head = [.02, n1(t * .3) * .1, 0]; } return q; },
  run: (t, p = {}) => M.walk(t, { ...p, run: true }),
  sneak: (t, p = {}) => M.walk(t, { ...p, sneak: true }),
};
// ---- blending: every field interpolates (angles, points, the root); missing hints fall back to the solver's defaults
const lerpA = (a, b, k) => a && b ? a.map((v, i) => lerp(v, b[i], k)) : (k < .5 ? a : b);
C.blend = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[key], y = b[key];
  // a seat held by only one side blends by weight (seatK), so getting up from a chair never drags the hips to the floor
  if (key === 'seatW') { o.seatW = x ?? y; o.seatK = lerp(x != null ? (a.seatK ?? 1) : 0, y != null ? (b.seatK ?? 1) : 0, k); continue; } if (key === 'seatK') continue;
  o[key] = typeof x === 'number' || typeof y === 'number' ? lerp(x || 0, y || 0, k) : lerpA(x || (key === 'root' ? [0, 0, 0, 0, 0, 0] : null), y || (key === 'root' ? [0, 0, 0, 0, 0, 0] : null), k); } return o; };
// ---- a timeline: [{ at, motion, p, blend }] — each motion starts at `at` and blends in from the one before over `blend` seconds (default 0.35)
C.act = (P, t, track) => { let i = 0; while (i < track.length - 1 && t >= track[i + 1].at) i++; const cur = track[i], ev = (s, tt) => (M[s.motion] || M.stand)(Math.max(0, tt - s.at), s.p || {});
  P.motion = cur.motion; let q = ev(cur, t); if (i > 0) { const k = ss((t - cur.at) / (cur.blend ?? .35)); if (k < 1) q = C.blend(ev(track[i - 1], t), q, k); }
  if (cur.face) P.setFace(cur.face); P.solve(q); if (P.animateFace) P.animateFace(t, { talk: !!(cur.talk || (cur.p && cur.p.talk)) }); return q; };
// ---- moving along timed points [[t, Vector3], …]: position, facing and a gait whose steps match the distance covered
const at = (t, pts) => { if (t <= pts[0][0]) return pts[0][1].clone(); for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return a.clone().lerp(b, (t - t0) / (t1 - t0)); } return pts.at(-1)[1].clone(); };
C.distanceAt = (t, pts) => { let d = 0; for (let i = 1; i < pts.length; i++) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; if (t <= t0) break; d += a.distanceTo(b) * clamp((t - t0) / (t1 - t0)); } return d; };
C.walkPath = (P, t, pts, o = {}) => { const a = at(t, pts), b = at(t + .08, pts), moving = a.distanceTo(b) > .002; P.G.position.copy(a); if (moving) P.G.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
  const d = C.distanceAt(t, pts) / P.scale, q = moving ? M.walk(t, { d, run: o.run, sneak: o.sneak, step: o.step }) : M.idle(t, o); P.motion = moving ? (o.run ? 'run' : o.sneak ? 'sneak' : 'walk') : 'idle'; P.solve(q); if (P.animateFace) P.animateFace(t, o); return moving; };
})();
