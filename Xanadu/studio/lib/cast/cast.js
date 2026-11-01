// The cast system (Phase 3): characters built from parts, never drawn from scratch. Load after ps1.js and cast/looks.js; exposes window.CAST.
//   CAST.make({ name, body, height, build, shoulders, skin, face, expression, hair, hairColor, beard, moustache, outfit, colors, mask, headwear,
//               extras, era }) → a character
// A character keeps the box-person look and the controls existing scenes use (G, head, torso, armL/armR {up, fore, hand}, legL/legR {up, fore,
// foot}, pose(L, R), legs(L, R), apply(p), setFace(k), faceMat), so it can stand in for a PS1.person. Underneath it has a real skeleton: hips →
// spine → chest → neck → head (a bone chain under a body root at the feet: hair, hats and masks hang on the head bone), shoulders and hip joints on that chain, and two-bone
// IK for arms and legs, so hands reach their targets and feet stay where they are planted. Poses are written in "base space" (a 1.75 m body)
// and scaled to the body, so one motion fits a child and a giant. cast/motion.js holds the motion library.
(function () {
const PS = window.PS1, LK = window.CASTLOOKS, V = (x, y, z) => new THREE.Vector3(x, y, z), { clamp, lerp } = PS, C = window.CAST = {};
// bodies: height (m), build (girth), shoulders (width), head (relative size), stoop (a resting spine bend)
C.BODIES = { man: { h: 1.75, build: 1, sh: 1 }, woman: { h: 1.66, build: .9, sh: .9, woman: true }, teen: { h: 1.62, build: .85, sh: .9 }, child: { h: 1.22, build: .85, sh: .9, head: 1.18 },
  big: { h: 1.96, build: 1.38, sh: 1.18 }, elderly: { h: 1.68, build: .95, sh: .95, stoop: .2 }, frail: { h: 1.72, build: .72, sh: .92 } };
// the base skeleton (1.75 m): hip joint height, thigh, shin, ankle height, torso length, shoulder spacing and drop, upper arm, forearm
const B = C.BASE = { hipY: .8, hipX: .09, thigh: .38, shin: .37, ankle: .05, pelvisUp: .06, torso: .56, shX: .24, shDrop: .04, upper: .29, fore: .28, neck: .06 };
C.STAND = () => ({ hip: [0, B.hipY, 0], pelvis: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], handL: [-.28, .79, .02], handR: [.28, .79, .02], footL: [-.09, .05, 0], footR: [.09, .05, 0],
  elbowL: null, elbowR: null, kneeL: null, kneeR: null, footYawL: 0, footYawR: 0, root: [0, 0, 0, 0, 0, 0] });

// two-bone IK: from root a to target t with lengths l1, l2, bending toward the pole direction; returns [joint, end]
function ik(a, t, l1, l2, pole) { const d = t.clone().sub(a); let len = d.length(); const max = (l1 + l2) * .999, min = Math.abs(l1 - l2) * 1.001 + 1e-4;
  if (len > max) { d.setLength(max); len = max; } else if (len < min) { d.setLength(min); len = min; } const end = a.clone().add(d), dir = d.clone().normalize();
  const x = (l1 * l1 - l2 * l2 + len * len) / (2 * len), h = Math.sqrt(Math.max(0, l1 * l1 - x * x)); let p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if (p.lengthSq() < 1e-8) p = V(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z)); p.normalize(); return [a.clone().addScaledVector(dir, x).addScaledVector(p, h), end]; }
const limb = (m, a, b) => PS.limb(m, a, b);
const toV = a => a && (a.isVector3 ? a.clone() : V(a[0], a[1], a[2]));

C.make = (r = {}) => {
  const body = C.BODIES[r.body || 'man'] || C.BODIES.man, s = (r.height || body.h) / 1.75, bw = (r.build || 1) * body.build, sh = (r.shoulders || 1) * body.sh, hs = (body.head || 1) * (r.headSize || 1);
  const M = (t, o) => PS.mat(t, o), G = PS.group(), P = { G, recipe: r, scale: s, faceMats: [], faces: {}, held: { L: null, R: null } };
  G.userData.isPerson = true; G.userData.character = r.name || null; G.userData.rig = P;
  // ---- materials from the wardrobe
  const W = LK.WARDROBE, of = r.outfit || {}, col = (k, d) => (r.colors || {})[k] || d, skinC = LK.color(r.skin || 'fair'), skin = M(LK.flat(skinC));
  const full = of.full && W[of.full], top = W[of.top || (full ? null : 'tee')], bottom = W[of.bottom || (full ? null : 'jeans')], jacket = of.jacket && W[of.jacket], apron = of.apron && W[of.apron];
  const piece = (p, k) => p ? LK.cloth(col(k, p.color), p.weave || 'plain', col(k + '2', p.c2), {}, p.detail) : null, wear = { dirt: 0, blood: 0 };
  const topT = piece(full || top, full ? 'full' : 'top'), botT = full && !full.dress ? piece(full, 'full') : piece(bottom, 'bottom'), jackT = piece(jacket, 'jacket');
  // clothes are colour and texture on the body's own boxes (Chria, 2026-10-25): the torso and pelvis carry the garment's painted detail, the limbs
  // wear the plain fabric of the same piece, so a belt or a pocket never repeats down a leg or an arm. Only second-layer items get their own mesh.
  const plain = (p, k) => p ? LK.cloth(col(k, p.color), p.weave || 'plain', col(k + '2', p.c2), {}, p.weave === 'denim' ? 'leg' : null) : null;
  const sleeveP = jacket || full || top, sleeveK = jacket ? 'jacket' : full ? 'full' : 'top', legP = full && !full.dress ? full : bottom, legK = full && !full.dress ? 'full' : 'bottom';
  P.mats = { top: M(topT), bottom: M(botT || topT), sleeve: M(plain(sleeveP, sleeveK) || topT), legs: M(plain(legP, legK) || botT || topT), jacket: jackT ? M(jackT) : null, skin };
  P.paint = { top: [full || top, full ? 'full' : 'top', true], bottom: [legP, legK, true], sleeve: [sleeveP, sleeveK, false], legs: [legP, legK, false] };
  const bareArms = !jacket && (full || top || {}).bareArms, shoeP = W[of.shoes || 'sneakers'] || W.sneakers, shoeM = shoeP.color === 'skin' ? skin : M(LK.flat(col('shoes', shoeP.color)));
  const dress = full && full.dress, skirt = bottom && bottom.skirt, shorts = bottom && bottom.shorts;
  // ---- the bone chain: hips → chest (spine) → head pivot (neck) → head
  // the body root: a pivot at the feet that falls, crawls and ragdolls tilt, so the scene's own placement of G is never touched
  const RT = P.root = PS.group(0, 0, 0, G);
  const hips = P.hips = PS.group(0, B.hipY * s, 0, RT), chest = P.chest = PS.group(0, B.pelvisUp * s, 0, hips), torsoLen = B.torso * s;
  P.pelvisMesh = PS.add(PS.box(.36 * bw * sh, .2 * s, .23 * bw), dress ? P.mats.top : P.mats.bottom, 0, -.03 * s, 0, hips);
  P.torso = PS.add(PS.box(.4 * bw * sh, torsoLen, .25 * bw), P.mats.top, 0, torsoLen / 2, 0, chest);
  if (jacket) { P.jacket = PS.add(PS.box(.42 * bw * sh, torsoLen * .98, .27 * bw), P.mats.jacket, 0, torsoLen / 2 + .005, -.005, chest); P.jacket.userData.layer = 'jacket'; const o = PS.add(PS.box(.12 * bw, torsoLen * .9, .02), P.mats.top, 0, torsoLen / 2, .13 * bw, chest); o.userData.layer = 'jacket'; }
  const neckP = P.neck = PS.group(0, torsoLen, 0, chest); PS.add(PS.box(.08 * bw, B.neck * s + .02, .08 * bw), (full || top || {}).neck ? P.mats.top : skin, 0, B.neck * s / 2, 0, neckP);
  const headP = P.headPivot = PS.group(0, B.neck * s, 0, neckP), HD = .12 * s * hs;
  // the face: legacy keys (from a converted scene) map to expressions through r.faces; otherwise the key is an expression
  const faceOpts = { glasses: (r.extras || []).includes('glasses'), skin: skinC, hair: r.hair === 'bald' || r.hair === 'buzz' ? null : (r.hairColor || 'darkBrown'), long: ['long', 'veil', 'shag', 'feathered'].includes(r.hair), eyes: r.eyes, brows: r.brows,
    beard: r.beard, moustache: r.moustache, age: r.age ?? (r.body === 'elderly' ? .8 : 0), lips: r.lips, lashes: r.lashes ?? body.woman, freckles: r.freckles, stubble: r.stubble, ...(r.face || {}) };
  const faceTex = (e, frame, mouth) => r.mask && LK.MASKS[r.mask] ? LK.MASKS[r.mask]() : LK.face(faceOpts, e, frame, mouth);
  const hairC = LK.color(r.hairColor || 'darkBrown'), hairM = M(r.hair === 'bald' ? LK.flat(skinC) : LK.cloth(hairC, 'denim'));
  P.faceMat = M(faceTex(r.expression || 'neutral', 'open')); P.faceMats.push(P.faceMat);
  P.head = PS.add(PS.box(.2 * hs * s, .24 * hs * s, .22 * hs * s), [skin, skin, r.hair === 'bald' ? skin : hairM, skin, P.faceMat, r.hair === 'bald' ? skin : hairM], 0, HD, 0, headP);
  P.headScale = hs * s;
  // hair, beard depth, headwear, mask shell: all children of the head bone (head-local units are scaled with the head)
  const hadd = (geo, m, x, y, z) => { const o = PS.add(geo, m, x, y, z, P.head); return o; }, HG = PS.group(0, 0, 0, P.head); HG.scale.setScalar(hs * s);
  const hg = (geo, m, x, y, z) => PS.add(geo, m, x, y, z, HG);
  (LK.HAIRSTYLES[r.mask === 'ghost' || r.mask === 'slit' ? 'bald' : (r.hair || 'short')] || LK.HAIRSTYLES.short)(hg, hairM, r.hairLength);   // the ghost hood covers the hair
  if (r.beard) hg(PS.box(.2, .1, .04), M(LK.flat(LK.color(r.beard))), 0, -.09, .1);
  const hatK = r.headwear || (full && full.hat); if (hatK && LK.HEADWEAR[hatK]) LK.HEADWEAR[hatK](hg, M, r.hatColor);
  if (r.mask === 'ghost' || r.mask === 'slit') { hg(PS.box(.24, .26, .1), M(LK.flat('#0c0c0e')), 0, -.01, -.08); const hood = hg(PS.box(.26, .34, .26), M(LK.flat('#0c0c0e')), 0, -.02, -.02); hood.scale.z = .98; }
  if (r.mask === 'skin') hg(PS.box(.21, .2, .01), M(LK.MASKS.skin()), 0, -.01, .113);
  // extras on the head and chest
  const ex = new Set(r.extras || []);
  // glasses are painted into the face texture (looks.js), like the hand-built ones; a thin bridge only in 3D for the profile
  if (ex.has('glasses')) hg(PS.box(.004, .006, .03), M(LK.flat('#22201e')), .101, .02, .1);
  if (ex.has('backpack')) PS.add(PS.box(.3 * bw, .38 * s, .14), M(LK.cloth(col('backpack', '#3a5a3a'), 'plain')), 0, torsoLen * .55, -.2 * bw, chest).userData.layer = 'backpack';
  const piecesOn = p => p || {}; const tp = piecesOn(full || top);
  // second-layer items only (each tagged userData.layer for the checker): belts, jackets, aprons, robes and dresses, hats, masks, glasses, backpacks
  if (tp.belt) PS.add(PS.box(.42 * bw * sh, .05, .27 * bw), M(LK.flat('#141414')), 0, .02, 0, chest).userData.layer = 'belt';
  if (jacket && jacket.tie) PS.add(PS.box(.04, torsoLen * .6, .01), M(LK.flat(jacket.tie)), 0, torsoLen * .62, .14 * bw, chest).userData.layer = 'jacket';
  if (apron) { P.apron = PS.add(PS.box(.36 * bw * sh, .95 * s, .02), M(LK.cloth(col('apron', apron.color), apron.weave)), 0, torsoLen * .62 - .44 * s, .14 * bw, chest); P.apron.userData.layer = 'apron'; }
  if (dress) { const len = (full.long ? .75 : .45) * s, d = P.dress = PS.add(PS.cyl(.15 * bw, .3 * bw, len, 6), P.mats.top, 0, -len / 2 + .04 * s, 0, hips); d.userData.layer = 'dress'; P.pelvisMesh.visible = false; }
  if (skirt) PS.add(PS.cyl(.18 * bw, .28 * bw, .32 * s, 6), P.mats.bottom, 0, -.14 * s, 0, hips).userData.layer = 'skirt';
  // ---- limbs (drawn between solved joint points, G-local)
  const legM = dress || skirt ? skin : P.mats.legs, shinM = dress || skirt || shorts ? skin : P.mats.legs;
  const leg = () => ({ up: PS.add(PS.box(.14 * bw, 1, .14 * bw), legM, 0, 0, 0, RT), fore: PS.add(PS.box(.125 * bw, 1, .125 * bw), shinM, 0, 0, 0, RT), foot: PS.add(PS.box(.13 * bw, .08 * s, .22 * s), shoeM, 0, 0, 0, RT) });
  const sleeveFore = bareArms || (r.sleeves !== 'long' && (full || top || {}).slot === 'top' && ['tee', 'stripedTee', 'tank', 'halter'].includes(of.top) && !jacket) ? skin : P.mats.sleeve;
  const arm = () => ({ up: PS.add(PS.box(.1 * bw, 1, .11 * bw), bareArms ? skin : P.mats.sleeve, 0, 0, 0, RT), fore: PS.add(PS.box(.09 * bw, 1, .1 * bw), sleeveFore, 0, 0, 0, RT), hand: PS.add(PS.box(.08 * bw, .1 * s, .08 * bw), skin, 0, 0, 0, RT) });
  P.legL = leg(); P.legR = leg(); P.armL = arm(); P.armR = arm();
  // ---- the solver: base-space pose → skeleton (G-local)
  const cur = P.cur = C.STAND(), sc = v => V(v[0] * s, v[1] * s, v[2] * s);
  // a new pose starts from the stand, so nothing (a fall's tipped root, a crawl's knees) leaks in from whatever was evaluated before;
  // solve() with no argument re-solves the current pose (P.reach, the legacy pose/legs controls)
  P.solve = (p = cur) => { if (p !== cur) Object.assign(cur, C.STAND(), p); const q = cur;
    hips.position.copy(sc(q.hip)); if (q.seatW != null) hips.position.y = lerp(hips.position.y, q.seatW + .13 * s, q.seatK ?? 1); hips.rotation.set(q.pelvis[0], q.pelvis[1], q.pelvis[2]); chest.rotation.set(q.spine[0] + (body.stoop || 0), q.spine[1], q.spine[2]); headP.rotation.set(q.head[0] - (body.stoop || 0) * .6, q.head[1], q.head[2]);
    const rt = q.root || [0, 0, 0, 0, 0, 0]; RT.position.set(rt[0] * s, rt[1] * s, rt[2] * s); RT.rotation.set(rt[3], rt[4], rt[5]);
    G.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(RT.matrixWorld).invert(), loc = (o, x, y, z) => o.localToWorld(V(x, y, z)).applyMatrix4(inv);
    for (const [k, sx] of [['L', -1], ['R', 1]]) { const S = loc(chest, sx * (B.shX * s * sh * (.92 + .08 * bw)), torsoLen - B.shDrop * s, 0), A = P['arm' + k], tgt = sc(q['hand' + k]);
      const pole = q['elbow' + k] ? toV(q['elbow' + k]).normalize() : V(sx * .35, -.4, -1).normalize(); const [E, Hn] = ik(S, tgt, B.upper * s, B.fore * s, pole);
      limb(A.up, S, E); limb(A.fore, E, Hn); A.hand.position.copy(Hn); A.hand.quaternion.copy(A.fore.quaternion); A.shoulder = S; A.elbow = E; A.wrist = Hn;
      const Hp = loc(hips, sx * B.hipX * s * (.9 + .1 * bw), 0, 0), Lg = P['leg' + k], ft = sc(q['foot' + k]), kp = q['knee' + k] ? toV(q['knee' + k]).normalize() : V(0, 0, 1);
      const [K, An] = ik(Hp, ft, B.thigh * s, B.shin * s, kp); limb(Lg.up, Hp, K); limb(Lg.fore, K, An); Lg.foot.position.copy(An).add(V(0, -.0, .06 * s));
      Lg.foot.rotation.set(0, q.pelvis[1] * .6 + (q['footYaw' + k] || 0), 0); Lg.hip = Hp; Lg.knee = K; Lg.ankle = An; }
    return P; };
  // ---- the old controls, so a converted scene can drive a library character unchanged (points are base-space, G-local)
  const unS = v => [v.x, v.y, v.z];
  P.pose = (L, R) => { cur.handL = unS(L[2]); cur.handR = unS(R[2]); const mid = (a, b) => a.clone().add(b).multiplyScalar(.5); cur.elbowL = unS(L[1].clone().sub(mid(L[0], L[2]))); cur.elbowR = unS(R[1].clone().sub(mid(R[0], R[2]))); return P.solve(); };
  P.legs = (L, R) => { const h = L[0].y; cur.hip = [(L[0].x + R[0].x) / 2, h, (L[0].z + R[0].z) / 2]; cur.footL = unS(L[2]); cur.footR = unS(R[2]); cur.kneeL = unS(L[1].clone().sub(L[0].clone().add(L[2]).multiplyScalar(.5)));
    cur.kneeR = unS(R[1].clone().sub(R[0].clone().add(R[2]).multiplyScalar(.5))); return P.solve(); };
  P.apply = p => { if (p.L) P.pose(p.L, p.R); if (p.legL) P.legs(p.legL, p.legR); if (p.head) P.head.rotation.set(p.head[0], p.head[1], p.head[2]); return P; };
  // ---- the face: expressions (neutral, scared, screaming, smiling, dead, sad, surprised), blinking, mouth on lines
  P.expr = r.expression || 'neutral';
  P.setFace = k => { const e = (r.faces && r.faces[k]) || (['neutral', 'scared', 'screaming', 'smiling', 'dead', 'sad', 'surprised'].includes(k) ? k : P.expr); P.expr = e; P.faceMat.uniforms.map.value = faceTex(e, 'open'); return P; };
  P.setExpression = P.setFace;
  const seed = [...(r.name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0);
  P.animateFace = (t, o = {}) => { const cyc = 3.1 + (seed % 7) * .37, u = (t + seed * .13) % cyc, blink = u < .12 && P.expr !== 'dead';
    // o.mouth ('shut' | 'mid' | 'open', or a level 0..1) sets the mouth directly and keeps the eyes blinking; without it, the old sine talk
    if (o.mouth != null) { const m = typeof o.mouth === 'number' ? (o.mouth < .2 ? 'shut' : o.mouth < .55 ? 'mid' : 'open') : o.mouth; P.faceMat.uniforms.map.value = faceTex(P.expr, blink ? 'blink' : 'open', m); return P; }
    const talk = o.talk && Math.sin(t * 17.3 + seed) + Math.sin(t * 11.1) > .3; P.faceMat.uniforms.map.value = faceTex(P.expr, blink ? 'blink' : talk ? 'talk' : 'open'); return P; };
  // ---- dirt and blood that build up over a scene (0..1 each, painted in 5 steps)
  P.setWear = (w = {}) => { Object.assign(wear, w); for (const [k, [pc, ck]] of Object.entries(P.paint)) if (pc && P.mats[k]) P.mats[k].uniforms.map.value = LK.cloth(col(ck, pc.color), pc.weave || 'plain', col(ck + '2', pc.c2), wear, P.paint[k][2] ? pc.detail : (pc.weave === 'denim' ? 'leg' : null)); return P; };
  // ---- props in hand: held on the hand bone at a grip offset; released back into the world where it is
  P.hold = (obj, side = 'R', grip = [0, -.07, .03], rot) => { const h = P['arm' + side].hand; h.updateMatrixWorld(true); h.add(obj); obj.position.set(grip[0], grip[1], grip[2]); if (rot) obj.rotation.set(rot[0], rot[1], rot[2]); P.held[side] = obj; return obj; };
  P.release = (side = 'R') => { const o = P.held[side]; if (!o) return null; o.updateMatrixWorld(true); const m = o.matrixWorld.clone(); PS.scene.add(o); m.decompose(o.position, o.quaternion, o.scale); P.held[side] = null; return o; };
  P.reach = (side, worldPoint, k = 1) => { G.updateMatrixWorld(true); const l = RT.worldToLocal(worldPoint.clone()).multiplyScalar(1 / s), h = cur['hand' + side]; cur['hand' + side] = [lerp(h[0], l.x, k), lerp(h[1], l.y, k), lerp(h[2], l.z, k)]; return P.solve(); };
  // compatibility names some scenes read
  P.armL.hand.userData.bone = 'handL'; P.armR.hand.userData.bone = 'handR'; P.head.userData.bone = 'head';
  return P.solve();
};
})();
