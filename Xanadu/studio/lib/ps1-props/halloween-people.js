// PS1 prop library: HALLOWEEN PEOPLE. Load after ps1.js AND people.js:  viewer module string  people+halloween-people
// Costumes, masks, hats and a few asylum / suburbia extras for a 1970s-autumn slasher retelling. Non-graphic: nothing here is bloody.
// Conventions are the same as people.js: metres, y up, feet on y=0, the character faces +z, character LEFT = +x. Character builders return an
// H-like object (H.G group, H.pose(name, phase), H.blend(...), H.setExpression(e), H.lookAt(vec3|null), H.hand('L'|'R'), H.sp, H.head, H.skull ...)
// so a scene can treat them exactly like PS1.props.human. Everything is deterministic (o.seed), textures/materials are cached and shared.
// Every character builder X also has PS1.props.XView(o) returning just the Group (used by props-test/view.mjs); the views take o.pose / o.phase.
//
// ACCESSORIES (take a human-like H, attach to H.head so they follow every pose; kids' heads are smaller, sizes are read from H.sp)
//   PS1.props.addHat(H, kind, color)      kind 'fedora' | 'wide' | 'witch' | 'cap' | 'cowboy' | 'clown' | 'nurse' | 'pirate'   (aliases: party = clown,
//                                         tricorn / bicorn = pirate). color = hex (every kind has its own default). Returns the hat Group
//                                         (already a child of H.head, in skull space). A second addHat replaces the first.
//                                         hat.userData = { kind, tilt (inner group, tip it with tilt.rotation), remove() }
//   PS1.props.addGlasses(H, { color:'#222', shape:'round' | 'square' })   thin-framed see-through lenses (+ bridge + temple arms). Returns the Group.
//                                         userData = { remove() }.
//   PS1.props.wearMask(H, kind, o)        rubber Halloween mask on H's face + an elastic strap behind the ears. kind 'blank' (default: pale yellowed
//                                         expressionless oval, dark eye holes, nose ridge, flat mouth slit, rubber sheen, a little dirt) | 'clown' |
//                                         'skull' | 'witch', plus the costume-shop kinds 'ghost' | 'devil' | 'pirate' | 'robot' | 'cat'.
//                                         o: { dirt: 1 (0..1.5 how grubby the plastic is) }.  Returns the mask Group (child of H.head, replaces any
//                                         earlier mask). userData = { kind, remove(), shell, strap }.
//   PS1.props.whiteMask(o)                the blank mask as a free-standing prop for hardware-store shelves: face forward (+z), hanging by its
//                                         elastic over a little peg hook. Origin: the chin of the mask at y = 0, x = 0, z = the mask's rim plane
//                                         (the peg and its wall tab are behind it, at z = -0.05 / -0.11).
//                                         o: { kind:'blank' (any wearMask kind), dirt:1, hook:true, tilt:0 (radians, swings it on the hook) }.
//                                         userData = { size:[w,h,d], hang (the swinging group), kind, hook (local Vector3 of the peg: set g.position.y = shelfHookY - hook.y) }.
//
// CHARACTERS (every one accepts every human() option from people.js on top of its own; its own defaults are listed)
//   PS1.props.clownChild(o)               a six-year-old boy (build 'child', 1.2 m) in a 1960s store-bought clown costume: baggy satin polka-dot
//                                         jumpsuit, big pom-pom buttons, a ruffled collar ring, white greasepaint face, red nose, a little hair,
//                                         red wig tufts over the ears, floppy shoes, white gloves. Baggy comes from wide 1.38 / thick 1.42 (override them).
//        o: { suit:'#d8d2b0', trim:'#b8322e' (dots, collar, cuffs, shoes), pom:'#2a2226' (pom-poms), hat:false | true | '#hex' (pointed party hat),
//             tufts:true, hair:'short', hairColor:'#8a6a3e', expression:'calm', mask: undefined | 'worn' | 'held' (start state), seed }
//        H.userData.mask = the clown rubber mask Group (NOT worn: a hand-sized prop, free-standing, parent it where you like)
//        H.wearMask(on = true, hold = 'R')   on: puts the mask on the face; off (false): takes it off and, by default, holds it by the elastic in the
//                                         right hand ('L' = left hand, null = just detach it so you place it yourself). The held mask stays upright and
//                                         faces forward in the character's space while the arm moves. H.userData.masked tells you the state.
//   PS1.props.sheetGhost(o)               a person under a plain white bedsheet. The sheet is one deforming mesh: dome over the head, shoulders, a flared
//                                         scalloped hem just above the floor, soft folds, two black eyeholes, arms hidden under the cloth.
//        o: { height:1.78, kid:false (true: small child, 1.12 m), glasses:false (true: a pair of glasses over the eyeholes), glassColor:'#222',
//             glassShape:'round' | 'square', sheet:'#ebe8de', dirt:1, seed }
//        poses: stand, walk (phase 0..1, sheet swings and ripples; 'run' is a bigger walk), reach (two arm bumps forward), armsUp (arms up and
//        out, cloth hangs off them), point (right arm), crouch / cower (squashed down), anything else = stand.  H.blend(a, pa, b, pb, k) works.
//        H.lookAt(v) turns the head part of the sheet (and the glasses) about 55 deg. H.hand(side) is a dummy Group that follows the hidden hand
//        (palm frame is not meaningful). H.setExpression is a no-op. H.sp is a minimal spec ({ H, k, kid }). H.head is the head-centre group.
//        userData = { sheet (mesh), glasses (group | null), arms: { L, R } }
//   PS1.props.trickOrTreater(kind, o)     a child (build 'child') in a cheap 1970s store-bought costume (plastic mask on the face, printed smock,
//                                         cape / hat / tail / horns as fits). kind 'ghost' | 'witch' | 'devil' | 'pirate' | 'skeleton' | 'robot' | 'cat'
//                                         (also callable as trickOrTreater({ kind, ... })).
//        o: { mask:true (false = no plastic mask; the devil's horns and the cat's ears belong to the mask), bag:false (true: a pillowcase of candy in the right hand, it stays plumb and
//             sways when walking), sex ('m' / 'f': witch + cat default 'f'), skin, hair, hairColor, seed } + any human() option. 'robot' = a cardboard
//             box on the chest + a box helmet, 'skeleton' = bones printed on a black jumpsuit, 'pirate' = striped shirt + sash + eyepatch mask.
//        H.userData = { kind, mask (Group or null), bag (Group or null), tail (Group or null), cape (Group or null), hat (Group or null) }
//        H.wearMask(on) puts the plastic mask on / off the face (off = detached, in userData.mask). Walk / stand look right; the tail and cape swing.
//   PS1.props.patient(o)                  escaped sanitarium patient: grey-white knee-length hospital gown, bare feet, pale skin, wild messy hair,
//                                         dark rings under the eyes, ID wristband. o: { expression:'blank' ('scared' works), hairColor:'#5c554c',
//                                         gown:'#c6cbc6', sex:'m', seed } + human options.
//   PS1.props.nurse(o)                    1970s nurse: white button-up dress below the knee, white stockings + shoes, small white nurse's cap
//                                         (addHat 'nurse'), red lipstick, watch badge. o: { uniform:'#e8e8e2', cap:true, hairColor:'#3a2a1e', seed }.
//   PS1.props.doctorInCoat(o)             middle-aged man (1.78 m), grey at the temples and stubble, long beige trench coat (belt, buttons, collar flaps;
//                                         the hem swings forward when he walks; the thighs are coat-lining coloured so a stride pushing through the
//                                         coat reads as the coat opening), dark fedora, leather gloves, serious face.
//        o: { coat:'#a8946e', hat:true | '#hex' | false, gloves:'#2a2420', expression:'calm', seed }
//   Known rig limit (inherited from people.js): skirts / gowns / dresses tilt oddly in the deep 'crouch' / 'cower' poses.
//   Internals for other prop files: PS1.halloween = { buildMask, reskin, paintMat, faceMod, poseHook, MASKS }.
//   Views: clownChildView, sheetGhostView, trickOrTreaterView (o.kind), patientView, nurseView, doctorInCoatView, addHatView (o: { kind, color,
//        build, sex ... human options }), addGlassesView, wearMaskView (o: { kind, build ... }).  whiteMask is itself a Group builder.
// Every H also gets H.userData (an object) and H.G.userData.H = H.
(function () {
const PS = window.PS1;
if (!PS || !PS.props || !PS.props.human || !PS.people) throw new Error('halloween-people.js: load lib/ps1.js and ps1-props/people.js first');
const PP = PS.people, TAU = Math.PI * 2, DS = THREE.DoubleSide;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const { loft, grid, done, solid, matC, texC, mix, lum, hashSeed } = PP;
const hx = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };

// ---------- small helpers ----------
const mk = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
const gp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ico = r => { const g = new THREE.IcosahedronGeometry(r, 0).toNonIndexed(), p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { const l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1; n.setXYZ(i, p.getX(i) / l, p.getY(i) / l, p.getZ(i) / l); } return g; };
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
const ell = (q, c, cx, cy, rx, ry) => { q.fillStyle = c; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (Math.pow((x + .5 - cx) / rx, 2) + Math.pow((y + .5 - cy) / ry, 2) <= 1) q.fillRect(x, y, 1, 1); };
const dia = (q, c, cx, cy, rr) => { for (let y = -rr; y <= rr; y++) { const hw = rr - Math.abs(y); px(q, c, cx - hw, cy + y, hw * 2 + 1, 1); } };
const pickSkin = r => ['#d6a084', '#e2b79c', '#c48c6a', '#a4704e', '#e8c4a8'][Math.floor(r() * 5) % 5];
// a thin cylinder-less limb: a unit box between two points (PS.limb scales its y)
const limb = (geo, mat, parent, a, b) => { const m = mk(geo, mat, parent); PS.limb(m, a, b); return m; };

// cached cloth textures / materials (double sided so brims, capes and folds read from both sides)
const fabTex = (c, o = {}) => { const w = o.w || 16, h = o.h || 16; return texC('hw:fab|' + [c, o.sheen ? 1 : 0, o.stripe || '', w, h].join('|'), w, h, (q, ww, hh, r) => {
  px(q, c, 0, 0, ww, hh); PS.noise(q, ww, hh, r, lum(c, -.22), ww * hh / 4, .45); PS.noise(q, ww, hh, r, lum(c, .16), ww * hh / 8, .3);
  if (o.sheen) { q.globalAlpha = .35; for (let x = 1; x < ww; x += 4) px(q, lum(c, .22), x, 0, 1, hh); q.globalAlpha = 1; }
  if (o.stripe) for (let x = 0; x < ww; x += 4) px(q, o.stripe, x, 0, 2, hh); }); };
const fm = (c, o = {}) => matC('hw:fm|' + [c, o.sheen ? 1 : 0, o.stripe || '', o.w || 16, o.h || 16].join('|'), fabTex(c, o), { side: DS });

// head profile (copy of people.js headProf: skull space, y from the chin up) + helpers
const headProf = sp => { const w = sp.headW / 2, d = sp.headD / 2, h = sp.headH;
  return [[0, .27 * w, .30 * d, .62 * d], [.10, .62 * w, .58 * d, .36 * d], [.28, .92 * w, .88 * d, .10 * d], [.50, w, d, 0], [.72, .98 * w, d, 0], [.88, .82 * w, .88 * d, 0], [.96, .62 * w, .72 * d, 0], [1, .30 * w, .42 * d, 0]]
    .map(([t, rx, rz, cz]) => ({ y: t * h, rx, rz, cx: 0, cz })); };
const profAt = (R, t) => { const y = t * R[R.length - 1].y; for (let i = 1; i < R.length; i++) if (y <= R[i].y) { const a = R[i - 1], b = R[i], k = (y - a.y) / (b.y - a.y || 1); return { y, rx: lerp(a.rx, b.rx, k), rz: lerp(a.rz, b.rz, k), cz: lerp(a.cz, b.cz, k) }; } return Object.assign({}, R[R.length - 1]); };
// a group in SKULL space (origin at the chin) parented to H.head, which is how hats / masks / glasses follow every pose
const skullGroup = H => { const g = new THREE.Group(); g.position.set(0, -H.sp.pv, H.sp.fz); H.head.add(g); return g; };
const slot = H => H._hw || (H._hw = {});
// recompute the normals of an edited loft and re-weld the wrap seam (columns 0 and N of every ring share a normal)
function renormal(geo, R, N) { geo.computeVertexNormals(); const n = geo.attributes.normal, w = N + 1;
  for (let i = 0; i < R; i++) { const a = i * w, c = a + N, x = n.getX(a) + n.getX(c), y = n.getY(a) + n.getY(c), z = n.getZ(a) + n.getZ(c), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(c, x / l, y / l, z / l); }
  n.needsUpdate = true; return geo; }
// swap materials on a built person: map = { K key: material }. K keys: torso pelvis upA loA thigh shin skirt cloth hair, and shoulder / elbow / knee (swapped per mesh: in people.js
// they can share ONE cached material with the skin, so a material-identity swap would repaint the hands and neck too)
function reskin(H, map) { const P = H._parts, K = P.K, rep = new Map(), direct = { shoulder: 1, elbow: 1, knee: 1 };
  for (const key of Object.keys(map)) if (K[key] && !direct[key] && key !== 'skin' && key !== 'neck' && key !== 'hand') rep.set(K[key], map[key]);
  H.G.traverse(m => { if (!m.isMesh) return; if (Array.isArray(m.material)) m.material = m.material.map(x => rep.get(x) || x); else if (rep.has(m.material)) m.material = rep.get(m.material); });
  for (const sd of [1, -1]) { if (map.shoulder) P.arms[sd].shoulder.material = map.shoulder; if (map.elbow) P.arms[sd].elbow.material = map.elbow; if (map.knee) P.legs[sd].knee.material = map.knee; } }
// a new material made of a copy of an existing material's canvas with `paint` drawn over it (key must say what differs); side: DS for skirts
function paintMat(key, base, paint, o) { const c0 = base.uniforms.map.value.canvas;
  return matC('hw:ov|' + key, texC('hw:ovt|' + key, c0.width, c0.height, (q, w, h, r) => { q.drawImage(c0, 0, 0); paint(q, w, h, r); }), o || {}); }
// repaint the face texture of a built person after the base face is drawn (and after every setExpression): painter(q, w, h, r, expr, fdesc)
function faceMod(H, key, painter) { const o = H.opts, sp = H.sp;
  const fd = e => ({ skin: o.skin || '#d6a084', hairC: o.hairColor || '#3a2a1e', hair: o.hair || (sp.f ? 'long' : 'short'), expr: e, sex: o.sex || 'm', beard: o.beard || 0, kid: sp.kid, style: o._face || '', iris: o.eyes || '', eyeSide: o._eyeSide || '' });
  const make = e => { const f = fd(e), base = PP.faceTex(f); return texC('hw:face|' + key + '|' + JSON.stringify(f), 32, 32, (q, w, h, r) => { q.drawImage(base.canvas, 0, 0); painter(q, w, h, r, e, f); }); };
  H._parts.faceM.uniforms.map.value = make(H.expr);
  H.setExpression = e => { H.expr = e; H._parts.faceM.uniforms.map.value = make(e); return H; }; }
// hooks that run after every pose() / blend() (tails, capes, held props ...). fn(H, name, phase)
function poseHook(H, fn) { const pose = H.pose, blend = H.blend; (H._hooks || (H._hooks = [])).push(fn);
  if (!H._hooked) { H._hooked = true; const run = (n, p) => { for (const f of H._hooks) f(H, n, p); };
    H.pose = (n, p = 0) => { pose(n, p); run(n, p); return H; };
    H.blend = (a, pa, b, pb, k) => { blend(a, pa, b, pb, k); run(k < .5 ? a : b, k < .5 ? pa : pb); return H; }; } }
const finish = (H, o) => { H.userData = H.userData || {}; H.G.userData.H = H; if (o && o.pose) H.pose(o.pose, o.phase || 0); return H; };

// ---------- hats ----------
// a brimmed hat: crown + brim + band, built as lofts around the headband ellipse. o: brim (m beyond the band), crown (m), top (crown top scale), edge / mid (brim y),
// dip (front brim droops / back lifts), curl (sides turn up), band (m high), flat (crown top scale in z)
function brimHat(sp, parent, mat, bandMat, o) {
  const k = sp.k, hh = sp.headH, ix = sp.headW / 2 * 1.3 + .004 * k, iz = sp.headD / 2 * 1.26 + .004 * k, bw = o.brim * k, ch = Math.max(o.crown * k, hh * .28 + .03 * k), tp = o.top, tz = o.flat || tp;
  const rings = [{ y: o.edge * k, rx: ix + bw, rz: iz + bw }, { y: (o.mid || 0) * k, rx: ix + bw * .5, rz: iz + bw * .5 }, { y: .006 * k, rx: ix * 1.02, rz: iz * 1.02 },
    { y: ch * .55, rx: ix * lerp(1, tp, .35), rz: iz * lerp(1, tz, .35) }, { y: ch, rx: ix * tp, rz: iz * tz }], N = 10, geo = loft(rings, { n: N, capTop: true }), p = geo.attributes.position;
  if (o.dip || o.curl) { for (let i = 0; i < 2 * (N + 1); i++) { const wgt = i < N + 1 ? 1 : .5, x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) + wgt * ((o.dip ? -z / (iz + bw) * o.dip * k : 0) + (o.curl ? Math.pow(x / (ix + bw), 2) * o.curl * k : 0))); } renormal(geo, rings.length, N); }
  mk(geo, mat, parent);
  mk(loft([{ y: .006 * k, rx: ix * 1.015, rz: iz * 1.015 }, { y: .006 * k + (o.band || .035) * k, rx: ix * lerp(1, tp, .08) * 1.015, rz: iz * lerp(1, tz, .08) * 1.015 }], { n: N }), bandMat, parent);
  return { ix, iz, ch, bw };
}
const HAT_DEFAULT = { fedora: '#2e2925', wide: '#3a342c', witch: '#16141a', cap: '#3a4a5a', cowboy: '#7a5a38', clown: '#c0463a', nurse: '#ecebe4', pirate: '#17151a' };
const HAT_KIND = { party: 'clown', tricorn: 'pirate', bicorn: 'pirate' };
const HATS = {
  fedora(sp, c, root) { const k = sp.k, t = gp(root, 0, sp.headH * .72, 0); t.rotation.x = .09;
    const G = brimHat(sp, t, fm(c), fm(mix(c, '#000000', .55)), { brim: .052, crown: .108, top: .78, flat: .92, edge: -.004, mid: -.003, dip: .016, band: .034 });
    mk(box(.008 * k, .006 * k, G.iz * 1.5), fm(mix(c, '#000000', .35)), t, 0, G.ch + .001 * k, 0); return t; },
  wide(sp, c, root) { const t = gp(root, 0, 0, 0), hp = PP.hatParts(sp, fm(c), fm(mix(c, '#000000', .5)), .2); hp.position.y = sp.headH * .72; t.add(hp); return t; },
  cowboy(sp, c, root) { const k = sp.k, t = gp(root, 0, sp.headH * .72, 0);
    const G = brimHat(sp, t, fm(c), fm(mix(c, '#000000', .45)), { brim: .085, crown: .115, top: .86, flat: .9, edge: .004, mid: -.002, dip: .006, curl: .055, band: .03 });
    mk(box(.012 * k, .008 * k, G.iz * 1.6), fm(mix(c, '#000000', .3)), t, 0, G.ch + .001 * k, 0); return t; },
  witch(sp, c, root) { const k = sp.k, hh = sp.headH, t = gp(root, 0, hh * .7, 0), ix = sp.headW / 2 * 1.28 + .004 * k, iz = sp.headD / 2 * 1.24 + .004 * k, bw = .085 * k, cH = Math.max(.3 * k, hh * .3 + .1 * k), N = 10, q = iz / ix;
    t.rotation.set(.04, 0, .05);
    mk(loft([{ y: -.008 * k, rx: ix + bw, rz: iz + bw }, { y: -.002 * k, rx: ix + bw * .5, rz: iz + bw * .5 }, { y: .012 * k, rx: ix * 1.02, rz: iz * 1.02 }, { y: cH * .3, rx: ix * .86, rz: iz * .86, cz: -.004 * k },
      { y: cH * .62, rx: ix * .56, rz: iz * .56, cz: -.02 * k }, { y: cH * .88, rx: ix * .26, rz: iz * .26, cz: -.055 * k }, { y: cH * 1.05, rx: ix * .03, rz: iz * .03 * q, cz: -.09 * k }], { n: N, capTop: true }), fm(c), t);
    mk(loft([{ y: .01 * k, rx: ix * 1.03, rz: iz * 1.03 }, { y: .05 * k, rx: ix * .98, rz: iz * .98 }], { n: N }), fm('#6a3a7a'), t);
    mk(box(.036 * k, .034 * k, .008 * k), fm('#c8a840'), t, 0, .03 * k, iz * 1.0 + .004 * k); return t; },
  cap(sp, c, root) { const k = sp.k, hh = sp.headH, t = gp(root, 0, hh * .64, 0), ix = sp.headW / 2 * 1.2 + .012 * k, iz = sp.headD / 2 * 1.2 + .012 * k, ch = hh * .36 + .03 * k;
    mk(loft([{ y: 0, rx: ix, rz: iz }, { y: ch * .3, rx: ix * 1.02, rz: iz * 1.02 }, { y: ch * .75, rx: ix * .86, rz: iz * .86 }, { y: ch, rx: ix * .4, rz: iz * .4 }], { n: 10, capTop: true }), fm(c), t);
    const v = mk(box(ix * 1.6, .006 * k, .08 * k), fm(mix(c, '#000000', .25)), t, 0, .002 * k, iz + .035 * k); v.rotation.x = .16;
    mk(box(.012 * k, .008 * k, .012 * k), fm(mix(c, '#ffffff', .2)), t, 0, ch + .002 * k, 0); return t; },
  nurse(sp, c, root) { const k = sp.k, hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2, t = gp(root, 0, hh * .955, d2 * .12), m = fm(c);
    t.rotation.x = -.1;
    mk(box(w2 * 1.7, .046 * k, d2 * 1.25), m, t, 0, .02 * k, 0);
    mk(box(w2 * 1.3, .05 * k, .016 * k), m, t, 0, .04 * k, -d2 * .66).rotation.x = -.34;
    mk(box(w2 * 1.72, .01 * k, d2 * 1.27), fm('#26262c'), t, 0, .028 * k, 0);
    mk(box(.014 * k, .02 * k, .006 * k), fm('#b8302a'), t, 0, .034 * k, d2 * .64); return t; },
  clown(sp, c, root) { const k = sp.k, hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2, t = gp(root, 0, hh * .78, 0), cH = Math.max(.3 * k, hh * .22 + .17 * k);
    t.rotation.set(-.06, 0, .13);
    mk(loft([{ y: 0, rx: w2 * 1.16, rz: d2 * 1.12 }, { y: cH * .5, rx: w2 * .66, rz: d2 * .63, cz: -.004 * k }, { y: cH, rx: w2 * .03, rz: d2 * .03, cz: -.012 * k }], { n: 10, capTop: true }), fm(c, { stripe: lum(c, -.25) }), t);
    mk(ico(.026 * k), fm(mix(c, '#ffffff', .55)), t, 0, cH, -.012 * k);
    const se = solid('#161214'), pts = [V(-w2 * 1.12, hh * .78, 0), V(-w2 * 1.07, hh * .32, .02 * d2), V(-w2 * .5, -.012 * k, .4 * d2), V(w2 * .5, -.012 * k, .4 * d2), V(w2 * 1.07, hh * .32, .02 * d2), V(w2 * 1.12, hh * .78, 0)];
    for (let i = 0; i < pts.length - 1; i++) limb(box(.003, 1, .003), se, root, pts[i], pts[i + 1]);
    return t; },
  pirate(sp, c, root) { const k = sp.k, hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2, t = gp(root, 0, hh * .72, 0), ix = w2 * 1.3 + .004 * k, iz = d2 * 1.26 + .004 * k, ch = Math.max(.075 * k, hh * .28 + .03 * k), N = 10;
    t.rotation.x = .05;
    const rings = [{ y: 0, rx: ix + .12 * k, rz: iz + .03 * k }, { y: .004 * k, rx: ix + .06 * k, rz: iz + .015 * k }, { y: .01 * k, rx: ix * 1.02, rz: iz * 1.02 }, { y: ch * .6, rx: ix * .98, rz: iz * .98 }, { y: ch, rx: ix * .8, rz: iz * .86 }], geo = loft(rings, { n: N, capTop: true }), p = geo.attributes.position;
    for (let i = 0; i < 2 * (N + 1); i++) { const x = p.getX(i); p.setY(i, p.getY(i) + Math.pow(x / (ix + .12 * k), 2) * .05 * k + (i < N + 1 ? .01 * k : 0)); } renormal(geo, rings.length, N);
    mk(geo, fm(c), t); mk(loft([{ y: .01 * k, rx: ix * 1.015, rz: iz * 1.015 }, { y: .045 * k, rx: ix * 1.0, rz: iz * 1.0 }], { n: N }), fm(mix(c, '#c8b060', .35)), t);
    const sk = matC('hw:skullemblem', texC('hw:skullemblem', 8, 8, (q) => { px(q, '#e6e2d4', 2, 1, 4, 3); px(q, '#e6e2d4', 3, 4, 2, 1); px(q, '#16141a', 2, 2, 1, 1); px(q, '#16141a', 5, 2, 1, 1); px(q, '#16141a', 3, 4, 1, 1); px(q, '#e6e2d4', 0, 6, 8, 1); px(q, '#e6e2d4', 1, 5, 1, 1); px(q, '#e6e2d4', 6, 5, 1, 1); }), { side: DS });
    mk(new THREE.PlaneGeometry(.05 * k, .05 * k), sk, t, 0, ch * .55, iz * .985 + .004 * k); return t; }
};
function addHat(H, kind, color) {
  kind = HAT_KIND[kind] || kind || 'fedora'; const fn = HATS[kind] || HATS.fedora, S = slot(H); if (S.hat && S.hat.userData.remove) S.hat.userData.remove();
  const g = skullGroup(H); g.name = 'hat-' + kind; const tilt = fn(H.sp, color || HAT_DEFAULT[kind] || '#2e2925', g);
  g.userData = { kind, tilt, remove() { if (g.parent) g.parent.remove(g); if (S.hat === g) S.hat = null; } }; S.hat = g; return g;
}

// ---------- glasses ----------
const lensTex = (c, sq) => texC('hw:lens|' + c + '|' + (sq ? 'sq' : 'rd'), 16, 16, q => {
  if (sq) { px(q, c, 1, 3, 14, 10); q.clearRect(3, 5, 10, 6); q.clearRect(1, 3, 1, 1); q.clearRect(14, 3, 1, 1); q.clearRect(1, 12, 1, 1); q.clearRect(14, 12, 1, 1); px(q, '#dfe6ea', 4, 6, 3, 1); px(q, '#dfe6ea', 4, 7, 1, 1); }
  else { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x + .5 - 8, y + .5 - 8); if (d < 7.8 && d >= 5.5) px(q, c, x, y); } px(q, '#dfe6ea', 4, 5, 3, 1); px(q, '#dfe6ea', 4, 6, 1, 1); } });
// P: { ex (lens centre x), y, z (lens plane at the lens centre), r (lens half size), earX, earY, earZ, tilt (outer edge swings back), arm (temple thickness) }
function glassesGroup(parent, P, c, shape) {
  const g = gp(parent), sq = shape === 'square', lm = matC('hw:lensm|' + c + '|' + (sq ? 'sq' : 'rd'), lensTex(c, sq), { side: DS }), fr = solid(c);
  for (const s of [-1, 1]) { const l = mk(new THREE.PlaneGeometry(P.r * 2, P.r * 2), lm, g, s * P.ex, P.y, P.z); l.rotation.y = s * P.tilt;
    const fx = s * (P.ex + P.r * Math.cos(P.tilt) * .92), fz = P.z - Math.sin(P.tilt) * P.r * .92;
    limb(box(P.arm, 1, P.arm), fr, g, V(fx, P.y + P.r * .25, fz), V(s * P.earX, P.earY, P.earZ)); }
  mk(box(P.ex * 2 - P.r * 2 * Math.cos(P.tilt) + P.arm * 2, P.arm * 1.3, P.arm * 1.3), fr, g, 0, P.y + P.r * .3, P.z + .001);
  return g; }
function addGlasses(H, o) {
  o = o || {}; const sp = H.sp, k = sp.k, w2 = sp.headW / 2, d2 = sp.headD / 2, hh = sp.headH, S = slot(H); if (S.glasses && S.glasses.userData.remove) S.glasses.userData.remove();
  const sq = o.shape === 'square', ey = sp.kid ? 16 : 14, root = skullGroup(H);
  const g = glassesGroup(root, { ex: w2 * .45, y: hh * (1 - (ey + 1.5) / 32), z: d2 * .97 + .012 * k, r: w2 * (sq ? .36 : .33), earX: w2 * 1.0 + .005 * k, earY: hh * .46, earZ: -.012 * k, tilt: .3, arm: .0045 * k + .001 }, o.color || '#222', o.shape || 'round');
  root.name = 'glasses'; root.userData = { remove() { if (root.parent) root.parent.remove(root); if (S.glasses === root) S.glasses = null; } }; S.glasses = root; return root; }

// ---------- rubber masks ----------
// Painters draw the 32x32 face of a mask in the SAME layout as the people.js face texture (eyes at rows ey..ey+2, x 6..11 / 20..25, nose x 14..17, mouth row mY)
const eyeHole = (q, c, x0, ey, wid = 6, up = 1) => { for (let y = 0; y < 5; y++) { const ins = (y === 0 || y === 4) ? 1 : 0; px(q, c, x0 + ins, ey - up + y, wid - ins * 2, 1); } };
const shadeSides = (q, c1, c2) => { px(q, c1, 0, 0, 3, 32); px(q, c1, 29, 0, 3, 32); px(q, c2, 0, 0, 1, 32); px(q, c2, 31, 0, 1, 32); };
const MASKS = {
  blank: { nose: .04, paint(q, r, F, o) { const base = '#dad5b9', s1 = '#c6c0a2', s2 = '#b4ae8f', hi = '#eeead6', dk = '#0b0907', dirt = '#78694a';
      px(q, base, 0, 0, 32, 32); PS.noise(q, 32, 32, r, '#cec8aa', 90, .5); PS.noise(q, 32, 32, r, '#e8e4cd', 50, .5); shadeSides(q, s1, s2); px(q, s1, 3, 25, 4, 7); px(q, s1, 25, 25, 4, 7); px(q, s1, 7, 30, 18, 2);
      q.globalAlpha = .65; px(q, hi, 9, 4, 14, 3); px(q, hi, 11, 7, 10, 2); px(q, hi, 4, F.ey + 5, 5, 3); px(q, hi, 23, F.ey + 5, 5, 3); px(q, hi, 15, F.ey, 2, 7); q.globalAlpha = 1;
      px(q, '#fcf9ea', 12, 5, 3, 1); px(q, '#fcf9ea', 5, F.ey + 6, 1, 1); px(q, '#fcf9ea', 26, F.ey + 6, 1, 1); px(q, '#fcf9ea', 15, F.ey + 3, 1, 1);
      px(q, s2, 5, F.ey - 2, 8, 1); px(q, s2, 19, F.ey - 2, 8, 1); px(q, s1, 5, F.ey + 4, 8, 1); px(q, s1, 19, F.ey + 4, 8, 1); eyeHole(q, dk, 6, F.ey); eyeHole(q, dk, 20, F.ey);
      px(q, s2, 14, F.ny, 1, 1); px(q, s2, 17, F.ny, 1, 1); px(q, s1, 13, F.ny + 1, 6, 1); px(q, hi, 12, F.mY - 1, 8, 1); px(q, dk, 11, F.mY, 10, 1); px(q, s2, 11, F.mY + 1, 10, 1);
      PS.noise(q, 32, 32, r, dirt, 40 * (o.dirt ?? 1), .35); for (let i = 0; i < 3 * (o.dirt ?? 1); i++) { const x = r() * 22 + 5 | 0; q.globalAlpha = .55; px(q, dirt, x, F.ey + 4 + (r() * 5 | 0), 1, 1 + (r() * 2 | 0)); q.globalAlpha = 1; } px(q, '#a39468', 21, 28, 4, 1); px(q, '#968660', 3, 9, 1, 2); } },
  clown: { nose: .036, paint(q, r, F, o) { const w = '#e9e5d6', dk = '#0b0907';
      px(q, w, 0, 0, 32, 32); PS.noise(q, 32, 32, r, '#d4cfbf', 70, .5); shadeSides(q, '#d0cbbb', '#bdb8a8');
      dia(q, '#3a5aa0', 9, F.ey - 4, 3); dia(q, '#3a5aa0', 23, F.ey - 4, 3); dia(q, '#c0302a', 9, F.ey + 7, 2); dia(q, '#c0302a', 23, F.ey + 7, 2);
      ell(q, '#d4655a', 5, F.ey + 6, 2.6, 2.6); ell(q, '#d4655a', 27, F.ey + 6, 2.6, 2.6); eyeHole(q, dk, 6, F.ey); eyeHole(q, dk, 20, F.ey);
      for (let x = 6; x <= 26; x++) { const yy = F.mY - Math.round(2.6 * Math.pow((x - 16) / 10, 2)); px(q, '#c2312b', x, yy, 1, 4); } px(q, dk, 10, F.mY + 1, 12, 1); px(q, '#f4f0e2', 12, F.mY + 2, 8, 1);
      px(q, '#14100e', 5, F.ey - 8, 6, 1); px(q, '#14100e', 21, F.ey - 8, 6, 1); px(q, '#14100e', 9, F.ey + 9, 1, 3);
      PS.noise(q, 32, 32, r, '#8a7a5a', 18 * (o.dirt ?? 1), .3); q.globalAlpha = .5; px(q, '#fffdf2', 10, 5, 12, 2); q.globalAlpha = 1; },
    extra(g, sp, M) { const k = sp.k, hh = sp.headH, d2 = sp.headD / 2, s = hh / .225; mk(ico(.02 * s), solid('#c8282a'), g, 0, hh * (sp.kid ? .37 : .41), d2 + .024 * s); } },
  skull: { nose: .036, paint(q, r, F, o) { const b = '#d2ccb0', dk = '#0a0908', sh = '#aea88c';
      px(q, b, 0, 0, 32, 32); PS.noise(q, 32, 32, r, '#c0baa0', 80, .5); PS.noise(q, 32, 32, r, '#e2dcc4', 40, .5); shadeSides(q, '#bcb69c', sh); px(q, sh, 3, F.ey + 6, 6, 3); px(q, sh, 23, F.ey + 6, 6, 3); px(q, sh, 6, 22, 3, 8); px(q, sh, 23, 22, 3, 8);
      ell(q, dk, 8.5, F.ey + 1.5, 3.6, 3.8); ell(q, dk, 23.5, F.ey + 1.5, 3.6, 3.8); px(q, dk, 14, F.ny - 3, 4, 1); px(q, dk, 14, F.ny - 2, 4, 2); px(q, dk, 15, F.ny, 2, 1); px(q, dk, 13, F.ny - 1, 1, 1); px(q, dk, 18, F.ny - 1, 1, 1);
      px(q, dk, 8, F.mY - 1, 16, 1); px(q, dk, 8, F.mY + 2, 16, 1); for (let x = 9; x < 24; x += 2) { px(q, '#ece8d4', x, F.mY, 1, 2); px(q, dk, x + 1, F.mY, 1, 2); } px(q, dk, 7, F.mY - 1, 1, 4); px(q, dk, 24, F.mY - 1, 1, 4);
      px(q, dk, 12, 5, 1, 2); px(q, dk, 13, 7, 1, 2); px(q, dk, 11, 9, 1, 1); px(q, '#8a8264', 21, 4, 4, 1); PS.noise(q, 32, 32, r, '#6a6040', 30 * (o.dirt ?? 1), .35); } },
  witch: { nose: .07, chin: .03, paint(q, r, F, o) { const g = '#7c9e58', g2 = '#62824a', g3 = '#97b472', dk = '#0b0907';
      px(q, g, 0, 0, 32, 32); PS.noise(q, 32, 32, r, g2, 90, .5); PS.noise(q, 32, 32, r, g3, 40, .4); shadeSides(q, g2, '#506c3a'); px(q, g2, 7, 28, 18, 4);
      for (let i = 0; i < 7; i++) { px(q, '#3e5230', 6 + (r() * 20 | 0), 7 + (r() * 22 | 0), 1, 1); } px(q, '#4a3a2a', 22, F.ny + 2, 2, 2); px(q, '#4a3a2a', 17, 29, 2, 2);
      eyeHole(q, dk, 6, F.ey); eyeHole(q, dk, 20, F.ey); px(q, '#d8c840', 7, F.ey + 4, 4, 1); px(q, '#d8c840', 21, F.ey + 4, 4, 1);
      for (let i = 0; i < 7; i++) { px(q, dk, 5 + i, F.ey - 3 - (i >> 1), 1, 2); px(q, dk, 26 - i, F.ey - 3 - (i >> 1), 1, 2); }
      px(q, g2, 14, F.ny, 1, 1); px(q, g2, 17, F.ny, 1, 1); px(q, '#4a1e3a', 10, F.mY, 12, 1); px(q, '#4a1e3a', 8, F.mY - 1, 2, 1); px(q, '#4a1e3a', 22, F.mY - 1, 2, 1); px(q, '#2a1a22', 11, F.mY + 1, 10, 1); PS.noise(q, 32, 32, r, '#3a3a20', 24 * (o.dirt ?? 1), .35); } },
  ghost: { nose: .036, paint(q, r, F, o) { const w = '#ecebe0', dk = '#0a0a0c';
      px(q, w, 0, 0, 32, 32); PS.noise(q, 32, 32, r, '#d8d8ce', 60, .5); shadeSides(q, '#d4d6d0', '#bcc0bc');
      ell(q, dk, 9, F.ey + 1.5, 3.8, 4.6); ell(q, dk, 23, F.ey + 1.5, 3.8, 4.6); ell(q, dk, 16, F.mY + 1, 3.6, 4.4); px(q, '#fffffa', 9, 5, 14, 2); PS.noise(q, 32, 32, r, '#8a8a78', 14 * (o.dirt ?? 1), .3); } },
  devil: { nose: .04, paint(q, r, F, o) { const rd = '#b4322c', r2 = '#8e2420', dk = '#0b0907';
      px(q, rd, 0, 0, 32, 32); PS.noise(q, 32, 32, r, r2, 90, .5); PS.noise(q, 32, 32, r, '#cc4a40', 40, .4); shadeSides(q, r2, '#6e1a18'); px(q, r2, 3, F.ey + 6, 5, 4); px(q, r2, 24, F.ey + 6, 5, 4);
      eyeHole(q, dk, 6, F.ey); eyeHole(q, dk, 20, F.ey); px(q, '#e8c838', 6, F.ey - 2, 6, 1); px(q, '#e8c838', 20, F.ey - 2, 6, 1);
      for (let i = 0; i < 8; i++) { px(q, dk, 4 + i, F.ey - 3 - (i >> 1) + (i > 4 ? 0 : 0), 1, 2); px(q, dk, 27 - i, F.ey - 3 - (i >> 1), 1, 2); }
      px(q, dk, 9, F.mY - 3, 14, 1); px(q, dk, 7, F.mY - 4, 2, 1); px(q, dk, 23, F.mY - 4, 2, 1); px(q, dk, 12, F.mY - 2, 8, 1);
      px(q, dk, 11, F.mY + 1, 10, 1); px(q, '#f0ecd8', 12, F.mY + 2, 8, 1); px(q, dk, 14, F.mY + 3, 4, 3); px(q, dk, 15, F.mY + 6, 2, 2); PS.noise(q, 32, 32, r, '#4a2a20', 14 * (o.dirt ?? 1), .35); },
    extra(g, sp, M) { const hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2, s = hh / .225, hm = solid('#9a2420');
      for (const sd of [-1, 1]) { const h = mk(new THREE.ConeGeometry(.016 * s, .07 * s, 5), hm, g, sd * w2 * .5, hh * .98, d2 * .1); h.rotation.set(.25, 0, -sd * .38); } } },
  pirate: { nose: .05, paint(q, r, F, o) { const sk = '#dcaa88', s2 = '#c08e6c', dk = '#0b0907';
      px(q, sk, 0, 0, 32, 32); PS.noise(q, 32, 32, r, s2, 80, .5); PS.noise(q, 32, 32, r, '#ecc4a4', 40, .4); shadeSides(q, s2, '#a67a5a'); ell(q, '#d88a78', 5, F.ey + 6, 2.6, 2.4); ell(q, '#d88a78', 27, F.ey + 6, 2.6, 2.4);
      eyeHole(q, dk, 6, F.ey); ell(q, dk, 23, F.ey + 1.5, 4.4, 4.6); for (let i = 0; i < 24; i++) px(q, dk, 22 - i, F.ey - 2 - (i * .25 | 0) * 0 - (i >> 1), 1, 1);
      for (let i = 0; i < 6; i++) px(q, dk, 4 + i, F.ey - 3 - (i >> 2), 1, 2);
      px(q, '#2a1a12', 7, F.mY - 3, 18, 2); px(q, '#2a1a12', 5, F.mY - 4, 3, 1); px(q, '#2a1a12', 24, F.mY - 4, 3, 1); px(q, '#2a1a12', 4, F.mY - 5, 1, 1); px(q, '#2a1a12', 27, F.mY - 5, 1, 1);
      px(q, dk, 11, F.mY, 10, 1); px(q, '#e0b030', 17, F.mY + 1, 1, 1); px(q, '#ede8d6', 12, F.mY + 1, 5, 1); px(q, '#ede8d6', 18, F.mY + 1, 3, 1);
      for (let i = 0; i < 26; i++) px(q, '#8a6a52', 4 + (r() * 24 | 0), F.mY + 2 + (r() * (30 - F.mY - 2) | 0), 1, 1); PS.noise(q, 32, 32, r, '#7a5a3a', 12 * (o.dirt ?? 1), .3); } },
  cat: { nose: .034, paint(q, r, F, o) { const bk = '#202026', b2 = '#2e2e36', dk = '#08080a';
      px(q, bk, 0, 0, 32, 32); PS.noise(q, 32, 32, r, b2, 90, .5); shadeSides(q, '#16161a', '#0e0e12'); ell(q, '#34343c', 16, F.mY - 1, 7, 5);
      eyeHole(q, dk, 6, F.ey); eyeHole(q, dk, 20, F.ey); for (const x0 of [5, 19]) { px(q, '#86c248', x0, F.ey - 2, 8, 1); px(q, '#86c248', x0, F.ey + 4, 8, 1); px(q, '#86c248', x0, F.ey - 1, 1, 5); px(q, '#86c248', x0 + 7, F.ey - 1, 1, 5); }
      px(q, '#d8808a', 14, F.ny - 1, 4, 1); px(q, '#d8808a', 15, F.ny, 2, 1); px(q, dk, 16, F.ny + 1, 1, 2); px(q, '#9a9aa4', 13, F.mY, 3, 1); px(q, '#9a9aa4', 17, F.mY, 3, 1); px(q, '#9a9aa4', 12, F.mY - 1, 1, 1); px(q, '#9a9aa4', 20, F.mY - 1, 1, 1);
      for (let i = 0; i < 3; i++) { px(q, '#c4c4cc', 0, F.ny + i * 2, 8, 1); px(q, '#c4c4cc', 24, F.ny + i * 2, 8, 1); } PS.noise(q, 32, 32, r, '#4a4a54', 20 * (o.dirt ?? 1), .35); },
    extra(g, sp, M) { const hh = sp.headH, w2 = sp.headW / 2, s = hh / .225, em = solid('#1a1a20');
      for (const sd of [-1, 1]) { const e = mk(new THREE.ConeGeometry(.03 * s, .062 * s, 4), em, g, sd * w2 * .6, hh * 1.0, -.004 * s); e.rotation.set(-.1, Math.PI / 4, -sd * .22); } } },
  robot: { box: true, paint(q, r, F, o) { const m = '#a4aab0', m2 = '#868c94', dk = '#101216';
      px(q, m, 0, 0, 32, 32); PS.noise(q, 32, 32, r, m2, 100, .55); PS.noise(q, 32, 32, r, '#c8ced4', 60, .5); px(q, m2, 0, 0, 32, 2); px(q, m2, 0, 30, 32, 2); px(q, m2, 0, 0, 2, 32); px(q, m2, 30, 0, 2, 32);
      px(q, dk, 5, F.ey - 1, 8, 5); px(q, dk, 19, F.ey - 1, 8, 5); px(q, '#e84a2a', 6, F.ey, 6, 3); px(q, '#e84a2a', 20, F.ey, 6, 3); px(q, '#ffb090', 7, F.ey, 2, 1); px(q, '#ffb090', 21, F.ey, 2, 1);
      px(q, dk, 9, F.mY - 1, 14, 6); for (let x = 10; x < 23; x += 2) px(q, '#6a7078', x, F.mY, 1, 4); px(q, '#d8c040', 3, 6, 3, 3); px(q, '#48b848', 8, 6, 3, 3); px(q, '#c8ced4', 15, 5, 2, 5); PS.noise(q, 32, 32, r, '#5a5a4a', 18 * (o.dirt ?? 1), .35); } }
};
const maskFrame = sp => ({ kid: sp.kid, ey: sp.kid ? 16 : 14, mY: sp.kid ? 26 : 25, ny: (sp.kid ? 16 : 14) + 8 });
// the front shell of a mask in skull space (a partial wrap of the head profile, a little proud of the face, rolling over the hairline)
function maskShell(sp, K) {
  const R = headProf(sp), k = sp.k, hh = sp.headH, w2 = sp.headW / 2, RW = 8, N = 8, t0 = .03, t1 = .775, noseD = (K.nose ?? .04) * hh / .225, chinD = (K.chin || 0) * hh / .225;
  const rowT = i => lerp(t0, t1, i / (RW - 1)), phiM = t => clamp(1.42 - .5 * Math.pow(Math.abs(t - .5) * 2.05, 2), 1.0, 1.42), off = t => .005 * k;
  const P = (i, j) => { const t = rowT(i), p = profAt(R, t), phi = lerp(-phiM(t), phiM(t), j / N), of = off(t), x = (p.rx + of) * Math.sin(phi);
    const g = Math.exp(-Math.pow(x / (w2 * .33), 2)), nb = Math.max(0, 1 - Math.abs(t - .38) / .19), cb = Math.max(0, 1 - Math.abs(t - .06) / .09), br = Math.max(0, 1 - Math.abs(t - .6) / .06);
    const z = p.cz + (p.rz + of) * Math.cos(phi) + g * (noseD * nb + chinD * cb) + br * .004 * k * (1 - .6 * g);
    return [x, p.y, z]; };
  const b = grid(RW, N, P, (i, j, p) => [clamp(.5 + p[0] / (2 * w2), .004, .996), clamp(p[1] / hh, .004, .996)], { wrap: false }); return done(b);
}
// the elastic: a thin strip that runs from the mask edge around the back of the head, clear of the ears and the hair
function maskStrap(sp) {
  const R = headProf(sp), k = sp.k, hh = sp.headH, t = .46, p = profAt(R, t), N = 14, a0 = 1.36, a1 = TAU - a0, hy = .005 * k;
  const b = grid(2, N, (i, j) => { const a = lerp(a0, a1, j / N), s = sstep(Math.min(j / N, 1 - j / N) * 3.4), ob = .006 * k + .02 * k * s;
    return [(p.rx + ob) * Math.sin(a), p.y + (i ? hy : -hy), p.cz - .006 * k * s + (p.rz + ob) * Math.cos(a)]; }, (i, j) => [j / N, i], { wrap: false }); return done(b);
}
function buildMask(kind, sp, o) {
  o = o || {}; kind = MASKS[kind] ? kind : 'blank'; const K = MASKS[kind], F = maskFrame(sp), k = sp.k, hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2, g = new THREE.Group(); g.name = 'mask-' + kind;
  const dirt = o.dirt ?? 1, key = ['hw:mask', kind, sp.kid ? 1 : 0, dirt].join('|'), mat = matC(key + '|m', texC(key, 32, 32, (q, w, h, r) => K.paint(q, r, F, { dirt })), { side: DS });
  let shell, strap = null;
  if (K.box) { const hw = w2 * 1.22 + .012 * k, hhh = hh * .62 + .004 * k, dd = d2 * 1.12 + .012 * k, side = solid('#9aa0a8'), top = solid('#b8bec4');
    shell = mk(box(hw * 2, hhh * 2, dd * 2), [side, side, top, side, mat, side], g, 0, hh * .56, 0);
    for (const sd of [-1, 1]) mk(new THREE.CylinderGeometry(.012 * k, .012 * k, .03 * k, 6), solid('#3a3e44'), g, sd * (hw + .012 * k), hh * .5, 0).rotation.z = Math.PI / 2;
    mk(new THREE.CylinderGeometry(.004 * k, .004 * k, .08 * k, 4), solid('#3a3e44'), g, w2 * .5, hh * 1.18 + .04 * k, 0); mk(ico(.012 * k), solid('#c8282a'), g, w2 * .5, hh * 1.18 + .09 * k, 0); }
  else { shell = mk(maskShell(sp, K), mat, g); strap = mk(maskStrap(sp), solid(o.strap || '#1a1816', { side: DS }), g); }
  if (K.extra) K.extra(g, sp, mat);
  g.userData = { kind, shell, strap, remove() { if (g.parent) g.parent.remove(g); } }; return g;
}
function wearMask(H, kind, o) {
  const S = slot(H); if (S.mask && S.mask.userData.remove) S.mask.userData.remove();
  const m = buildMask(kind || 'blank', H.sp, o); m.position.set(0, -H.sp.pv, H.sp.fz); H.head.add(m); S.mask = m; return m; }
function whiteMask(o) {
  o = o || {}; const sp = PP.spec({ build: 'adult', sex: 'm' }), kind = o.kind || 'blank', m = buildMask(kind, sp, o), G = new THREE.Group(), hh = sp.headH, w2 = sp.headW / 2, d2 = sp.headD / 2; G.name = 'white-mask';
  const hy = hh * .745 + .09, hz = -.05, pivot = gp(G, 0, hy, hz); pivot.rotation.z = o.tilt || 0;
  m.position.set(0, -hh * .03 - hy, -d2 * .2 - hz); pivot.add(m); if (m.userData.strap) m.remove(m.userData.strap);
  if (o.hook !== false) { const el = solid('#1a1816', { side: DS });
    for (const s of [-1, 1]) limb(box(.004, 1, .003), el, pivot, V(s * w2 * 1.03, hh * .42 - hy, -hz - .004), V(s * .002, 0, -.004));
    mk(new THREE.CylinderGeometry(.005, .005, .1, 6), solid('#7a7e82'), G, 0, hy, hz - .01).rotation.x = Math.PI / 2; mk(box(.05, .05, .008), solid('#7a7e82'), G, 0, hy, hz - .06); }
  G.userData = { size: [sp.headW * 1.1, hy + .03, .13], hang: pivot, kind, hook: V(0, hy, hz) }; return G; }

// ---------- views for the scene-less viewer ----------
PS.props.addHatView = o => { o = o || {}; const H = PS.props.human(Object.assign({ build: 'adult' }, o)); addHat(H, o.kind || 'fedora', o.color); return H.G; };
PS.props.addGlassesView = o => { o = o || {}; const H = PS.props.human(Object.assign({ build: 'adult' }, o)); addGlasses(H, o); return H.G; };
PS.props.wearMaskView = o => { o = o || {}; const H = PS.props.human(Object.assign({ build: 'adult' }, o)); wearMask(H, o.kind || 'blank', o); return H.G; };

// ---------- the clown child ----------
// front z of the chest loft at chest-space height y (people.js ring formulas, bulk + belly included)
function chestFront(H, y) {
  const sp = H.sp, W = H._parts.W, bk = W.bulk, bz = sp.belly, bs = sp.bust, Hh = sp.H, nR = sp.neckR;
  const R = [[-.03 * Hh, sp.waistRz * bk * .985 + bz, bz], [0, sp.waistRz * bk + bz, bz], [.05 * Hh, lerp(sp.waistRz, sp.chestRz, .7) * bk + bz * .4, bz * .5 + bs * .4], [.115 * Hh, (sp.chestRz + bs) * bk, bs * .5],
    [.165 * Hh, sp.chestRz * .78 * bk, 0], [sp.nbL - .035 * sp.k, lerp(sp.chestRz * .78 * bk, nR * 1.35, .55), -.003], [sp.nbL, nR * 1.35, -.005]];
  for (let i = 1; i < R.length; i++) if (y <= R[i][0]) { const a = R[i - 1], b = R[i], t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1); return lerp(a[2] + a[1], b[2] + b[1], t); }
  return R[R.length - 1][2] + R[R.length - 1][1];
}
// the ruffled collar ring: three rings of a flared frill whose outer edge zig-zags (n must be even)
function ruffleGeo(sp, y, scale) {
  const k = sp.k, nR = sp.neckR, N = 12, z = sp.neckZ, geo = loft([{ y: y + .024 * k, rx: nR * 1.45, rz: nR * 1.4, cz: z }, { y: y + .006 * k, rx: nR * 2.5 * scale, rz: nR * 2.2 * scale, cz: z }, { y: y - .012 * k, rx: nR * 3.5 * scale, rz: nR * 3.0 * scale, cz: z }], { n: N }), p = geo.attributes.position;
  for (let j = 0; j <= N; j++) { const i = 2 * (N + 1) + j - (N + 1), odd = j % 2 === 1, c = new THREE.Vector3(0, p.getY(i), z); const dx = p.getX(i), dz = p.getZ(i) - z, f = odd ? .78 : 1.05; p.setXYZ(i, dx * f, p.getY(i) + (odd ? .016 * k : -.006 * k), z + dz * f); }
  return renormal(geo, 3, N);
}
function clownPaint(q, w, h, r, e, f) {
  const ey = 16, mY = 26, id = q.getImageData(0, 0, 32, 32), d = id.data, sk = hx(f.skin), paint = new Uint8Array(1024), Wt = [238, 233, 222];
  for (let y = 7; y < 32; y++) for (let x = 1; x < 31; x++) { const i = (y * 32 + x) * 4; if (Math.max(Math.abs(d[i] - sk[0]), Math.abs(d[i + 1] - sk[1]), Math.abs(d[i + 2] - sk[2])) < 42) { for (let c = 0; c < 3; c++) d[i + c] = clamp(Wt[c] + (d[i + c] - sk[c]) * .45, 0, 255); paint[y * 32 + x] = 1; } }
  q.putImageData(id, 0, 0);
  const pp = (c, x, y, ww = 1, hh = 1) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) if (xx >= 0 && xx < 32 && yy >= 0 && yy < 32 && paint[yy * 32 + xx]) px(q, c, xx, yy); };
  const ppEll = (c, cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (Math.pow((x + .5 - cx) / rx, 2) + Math.pow((y + .5 - cy) / ry, 2) <= 1) pp(c, x, y); };
  const ppDia = (c, cx, cy, rr) => { for (let y = -rr; y <= rr; y++) { const hw = rr - Math.abs(y); pp(c, cx - hw, cy + y, hw * 2 + 1, 1); } };
  ppDia('#3a5aa0', 9, ey - 6, 2); ppDia('#3a5aa0', 23, ey - 6, 2); ppEll('#d86a62', 5, ey + 5, 2.4, 2.2); ppEll('#d86a62', 27, ey + 5, 2.4, 2.2);
  for (let x = 8; x <= 24; x++) { const yy = mY - 1 - Math.round(2 * Math.pow((x - 16) / 8.5, 2)); pp('#c2312b', x, yy, 1, 3); }
  pp('#b02820', 5, ey - 5, 6, 1); pp('#b02820', 21, ey - 5, 6, 1); pp('#2a3a8a', 22, ey + 5, 1, 3); pp('#2a3a8a', 9, ey + 5, 1, 2); PS.noise(q, 32, 32, r, '#8a7a5a', 10, .3);
}
const SUIT_PAINT = {
  torso: (suit, trim, pom) => (q, w, h, r) => { px(q, suit, 0, 0, w, h); PS.noise(q, w, h, r, lum(suit, -.2), 90, .45); PS.noise(q, w, h, r, lum(suit, .14), 50, .3);
    q.globalAlpha = .4; for (const x of [2, 5, 11, 14, 18, 22, 27, 30]) px(q, lum(suit, .22), x, 0, 1, h); q.globalAlpha = .3; for (const x of [3, 9, 20, 25]) px(q, lum(suit, -.25), x, 0, 1, h); q.globalAlpha = 1;
    for (let y = 2; y < 30; y += 7) for (let x = ((y / 7 | 0) % 2) * 3; x < 32; x += 6) { q.globalAlpha = .85; px(q, trim, x, y, 2, 3); q.globalAlpha = 1; }
    for (const y of [1, 7, 13, 19]) px(q, lum(pom, .1), 7, y + 4, 2, 2); },
  pelvis: (suit, trim) => (q, w, h, r) => { px(q, suit, 0, 0, w, h); PS.noise(q, w, h, r, lum(suit, -.2), 50, .45); PS.noise(q, w, h, r, lum(suit, .14), 30, .3);
    q.globalAlpha = .4; for (const x of [2, 6, 12, 18, 22, 28]) px(q, lum(suit, .2), x, 0, 1, h); q.globalAlpha = .85; for (let y = 2; y < 14; y += 7) for (let x = ((y / 7 | 0) % 2) * 3; x < 32; x += 6) px(q, trim, x, y, 2, 3); q.globalAlpha = 1; },
  arm: (suit, trim, lo) => (q, w, h, r) => { px(q, suit, 0, 0, w, h); PS.noise(q, w, h, r, lum(suit, -.2), 22, .45); q.globalAlpha = .4; px(q, lum(suit, .22), 2, 0, 1, h); px(q, lum(suit, .22), 6, 0, 1, h); q.globalAlpha = .85; for (let y = 2; y < (lo ? 12 : 15); y += 5) px(q, trim, ((y / 5 | 0) % 2) * 3 + 1, y, 1, 2); q.globalAlpha = 1; if (lo) { px(q, trim, 0, 13, 8, 3); px(q, lum(trim, .3), 0, 13, 8, 1); } },
  leg: (suit, trim, sh) => (q, w, h, r) => { px(q, suit, 0, 0, w, h); PS.noise(q, w, h, r, lum(suit, -.2), 40, .45); q.globalAlpha = .4; px(q, lum(suit, .22), 3, 0, 1, h); px(q, lum(suit, .22), 11, 0, 1, h); q.globalAlpha = .85; for (let y = 2; y < (sh ? 12 : 15); y += 5) for (let x = ((y / 5 | 0) % 2) * 4 + 1; x < 16; x += 8) px(q, trim, x, y, 1, 2); q.globalAlpha = 1; if (sh) { px(q, trim, 0, 13, 16, 3); px(q, lum(trim, .3), 0, 13, 16, 1); } }
};
function clownChild(o) {
  o = Object.assign({}, o); const seed = o.seed ?? 6, r = PS.rng(seed * 17 + 3), suit = o.suit || '#d8d2b0', trim = o.trim || '#b8322e', pom = o.pom || '#26222a', skin = o.skin || '#e2b79c';
  const H = PS.props.human(Object.assign({ build: 'child', sex: 'm', height: 1.2, skin, hair: 'short', hairColor: '#8a6a3e', top: 'coveralls', topColor: suit, wide: 1.38, thick: 1.42, shoes: trim, footScale: 1.35, gloves: '#e8e6dc', expression: 'calm' }, o));
  const sp = H.sp, k = sp.k, key = [suit, trim].join('|'), K = H._parts.K, SM = (n, painter, w, h) => matC('hw:cl|' + n + '|' + key, texC('hw:cl|' + n + '|' + key, w, h, painter));
  reskin(H, { torso: SM('torso', SUIT_PAINT.torso(suit, trim, pom), 32, 32), pelvis: SM('pelvis', SUIT_PAINT.pelvis(suit, trim), 32, 16), upA: SM('upA', SUIT_PAINT.arm(suit, trim, false), 8, 16), loA: SM('loA', SUIT_PAINT.arm(suit, trim, true), 8, 16),
    thigh: SM('thigh', SUIT_PAINT.leg(suit, trim, false), 16, 16), shin: SM('shin', SUIT_PAINT.leg(suit, trim, true), 16, 16), shoulder: solid(suit), elbow: solid(suit), knee: solid(suit) });
  faceMod(H, 'clown', clownPaint);
  const pm = solid(pom), bz = chestFront(H, 0);
  for (const y of [.205, .14, .075, .01]) mk(ico(.021 * (sp.H / 1.2)), pm, H.chest, 0, y * (sp.H / 1.2), chestFront(H, y * (sp.H / 1.2)) + .006 * k);
  mk(ruffleGeo(sp, sp.nbL, 1.12), fm(trim, { stripe: lum(trim, .4) }), H.chest);
  mk(ico(.021 * (sp.H / 1.2)), solid('#c8282a'), H.skull, 0, sp.headH * .38, sp.headD / 2 + .024 * sp.headH / .225);
  if (o.tufts !== false) { const tm = solid('#c8481c'); for (const sd of [-1, 1]) for (const [dx, dy, dz, rr] of [[0, .62, -.008, .036], [.004, .72, -.014, .03], [-.002, .53, .004, .028]]) { const t = mk(new THREE.OctahedronGeometry(rr * k * 1.1, 0), tm, H.skull, sd * (sp.headW / 2 + .018 * k + dx * k), sp.headH * dy, dz * k); t.rotation.set(r() * 3, r() * 3, 0); } }
  if (o.hat) addHat(H, 'clown', typeof o.hat === 'string' ? o.hat : trim);
  const mask = buildMask('clown', sp, { dirt: .6 }); let held = null;
  const OFF = V(0, -sp.headH * .8, 0), qh = new THREE.Quaternion(), qg = new THREE.Quaternion();
  const placeHeld = () => { if (!held || !mask.parent) return; const grip = H.hand(held); grip.updateWorldMatrix(true, false); grip.getWorldQuaternion(qh); H.G.getWorldQuaternion(qg); mask.quaternion.copy(qh).invert().multiply(qg); mask.position.copy(OFF).applyQuaternion(mask.quaternion); };
  H.userData = { mask, masked: false };
  H.wearMask = (on = true, hold = 'R') => { if (mask.parent) mask.parent.remove(mask); on = on !== false; held = null;
    if (on) { mask.position.set(0, -sp.pv, sp.fz); mask.quaternion.identity(); H.head.add(mask); } else if (hold) { held = hold === 'L' || hold === 1 ? 'L' : 'R'; H.hand(held).add(mask); placeHeld(); }
    H.userData.masked = on; return H; };
  poseHook(H, placeHeld); if (o.mask === 'worn') H.wearMask(true); else if (o.mask === 'held') H.wearMask(false);
  return finish(H, o);
}
PS.props.clownChildView = o => clownChild(o).G;

// ---------- the sheet ghost ----------
const sheetTex = (c, dirt, seed, holes = true) => texC('hw:sheet|' + [c, dirt, seed, holes ? 1 : 0].join('|'), 64, 64, (q, w, h, r) => {
  px(q, c, 0, 0, w, h); PS.noise(q, w, h, r, lum(c, -.1), 260, .35); PS.noise(q, w, h, r, lum(c, .06), 120, .3);
  q.globalAlpha = .26; for (let i = 0; i < 11; i++) px(q, lum(c, -.24), r() * w | 0, 22 + (r() * 24 | 0), 1, 8 + (r() * 30 | 0)); for (const x of [3, 9, 22, 27, 35, 43, 51, 58]) px(q, lum(c, -.14), x, 26, 2, 38); q.globalAlpha = 1;
  q.globalAlpha = .5 * dirt; for (let x = 0; x < w; x++) { px(q, '#a89a78', x, 60 + (r() * 2 | 0), 1, 4); px(q, '#9c8e70', x, 63, 1, 1); } q.globalAlpha = .2 * dirt; ell(q, '#8a7c5c', 44, 46, 5, 4); ell(q, '#968868', 10, 54, 3.5, 3); q.globalAlpha = 1;
  const hole = x0 => [[1, 2], [0, 4], [0, 4], [0, 4], [0, 4], [1, 2]].forEach(([a, n], i) => px(q, '#050506', x0 + a, 11 + i, n, 1));
  if (holes) { hole(11); hole(17); } });
function sheetGhost(o) {
  o = Object.assign({}, o); const kid = !!o.kid, Ht = o.height || (kid ? 1.12 : 1.78), seed = o.seed ?? 4, r = PS.rng(seed * 29 + 5), bs = kid ? .72 : clamp(Ht / 1.78, .85, 1.12), hs = kid ? .9 : clamp(Ht / 1.78, .92, 1.08), hr = .098 * hs, sheetC = o.sheet || '#ebe8de', dirt = o.dirt ?? 1;
  const G = new THREE.Group(); G.name = 'ps1-sheet-ghost'; const ysh = Ht - (kid ? .26 : .30 * clamp(Ht / 1.78, .9, 1.1)), hemY = kid ? .05 : .06, yChin = Ht - .235 * hs, N = 20;
  const shR = .27 * bs, fr = f => lerp(ysh, hemY, f);
  const ROWS = [
    { y: Ht + .006, rx: .004, rz: .004, v: 1, fold: 0, hw: 1 }, { y: Ht - .011 * hs, rx: hr * .56, rz: hr * .56, v: .95, fold: 0, hw: 1 }, { y: Ht - .043 * hs, rx: hr * .87, rz: hr * .87, v: .9, fold: 0, hw: 1 }, { y: Ht - .075 * hs, rx: hr * .985, rz: hr * .985, v: .85, fold: 0, hw: 1 },
    { y: Ht - .12 * hs, rx: hr, rz: hr, v: .78, fold: 0, hw: 1 }, { y: Ht - .175 * hs, rx: hr * .97, rz: hr * .97, v: .69, fold: 0, hw: 1 }, { y: yChin, rx: hr * .94, rz: hr * .94, v: .61, fold: .004, hw: 1 },
    { y: lerp(yChin, ysh, .55), rx: lerp(hr * .94, shR, .5), rz: lerp(hr * .94, shR * .78, .5), cz: -.004, v: .52, fold: .018, hw: .55 }, { y: ysh, rx: shR, rz: shR * .8, cz: -.008, v: .44, fold: .03, hw: .15 },
    { y: fr(.12), rx: .295 * bs, rz: .295 * bs * .8, cz: -.01, v: .36, fold: .05, hw: 0 }, { y: fr(.38), rx: .31 * bs, rz: .31 * bs * .8, cz: -.01, v: .26, fold: .07, hw: 0 }, { y: fr(.68), rx: .34 * bs, rz: .34 * bs * .82, cz: -.008, v: .16, fold: .09, hw: 0 },
    { y: fr(.88), rx: .385 * bs, rz: .385 * bs * .85, cz: -.005, v: .07, fold: .105, hw: 0 }, { y: hemY, rx: .44 * bs, rz: .44 * bs * .88, cz: 0, v: 0, fold: .125, hw: 0 }];
  const RN = ROWS.length, f1 = r() * TAU, f2 = r() * TAU, f3 = r() * TAU, scal = []; for (let j = 0; j <= N; j++) scal.push(j === N ? scal[0] : (r() - .5) * .05 * bs + (j % 2 ? .012 : 0));
  const pos = new Float32Array(RN * (N + 1) * 3), uv = [], idx = [], w1 = N + 1;
  for (let i = 0; i < RN; i++) for (let j = 0; j <= N; j++) uv.push(j / N, ROWS[i].v);
  for (let i = 0; i < RN - 1; i++) for (let j = 0; j < N; j++) { const a = i * w1 + j, c = a + w1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const sm = matC('hw:sheetm|' + [sheetC, dirt, seed].join('|'), sheetTex(sheetC, dirt, seed), { side: DS }), sheet = mk(geo, sm, G), sm2 = matC('hw:sheetm2|' + [sheetC, dirt, seed].join('|'), sheetTex(sheetC, dirt, seed, false), { side: DS }); sheet.frustumCulled = false; sheet.name = 'sheet';
  // arms: cloth-covered tubes (hidden inside the sheet unless raised) with a hanging flap of cloth under each
  const La = kid ? .46 : .62 * clamp(Ht / 1.78, .9, 1.1), sx = .185 * bs, arms = {}, flapM = sm2;
  for (const s of [1, -1]) { const tube = mk(new THREE.CylinderGeometry(.046 * bs, .05 * bs, 1, 7), sm2, G), fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute([0, .5, .1, .15, .33, .5, .33, .2, .66, .5, .66, .25, 1, .5, 1, .32], 2)); fg.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 4, 6, 5, 5, 6, 7]);
    const flap = mk(fg, flapM, G); flap.frustumCulled = false; tube.frustumCulled = false; arms[s] = { tube, flap, fg, hand: new THREE.Group() }; G.add(arms[s].hand); mk(ico(.054 * bs), sm2, arms[s].hand); }
  const head = gp(G, 0, Ht - .12 * hs, 0); let glasses = null;
  if (o.glasses) glasses = glassesGroup(head, { ex: hr * .32, y: 0, z: hr * .94 + .008, r: .036 * hs, earX: hr * 1.0, earY: -.03, earZ: -.03, tilt: .31, arm: .0045 }, o.glassColor || '#222', o.glassShape || 'round');
  const look = { yaw: 0 }, V3 = new THREE.Vector3();
  const POSEP = (name, ph) => { const D = { lean: 0, bob: 0, sway: 0, swing: 0, rip: .006, rph: 0, sq: 1, L: [.04, -1, .02], R: [.04, -1, .02] }, a = Math.sin(TAU * ph);
    if (name === 'walk' || name === 'run') { const g = name === 'run' ? 1.7 : 1; D.lean = .035 * g; D.bob = .016 * g * (.5 + .5 * Math.cos(TAU * 2 * ph)); D.sway = .02 * g * a; D.swing = .075 * g * Math.sin(TAU * 2 * ph + .6); D.rip = .065 * g; D.rph = TAU * 2 * ph; D.L = [.04, -1, .18 * g * a]; D.R = [.04, -1, -.18 * g * a]; }
    else if (name === 'reach') { D.lean = .03; D.L = [-.04, .02, 1]; D.R = [-.04, .02, 1]; }
    else if (name === 'reachR' || name === 'point') { D.lean = .02; D.R = [-.03, .06, 1]; }
    else if (name === 'armsUp' || name === 'scream') { D.lean = -.01; D.L = [.42, .9, .12]; D.R = [.42, .9, .12]; D.rip = .02; }
    else if (name === 'crouch' || name === 'cower' || name === 'kneel') { D.sq = name === 'kneel' ? .62 : .58; D.lean = .06; D.L = [.1, -1, .3]; D.R = [.1, -1, .3]; }
    else { D.sway = .004 * a; D.bob = .004 * (.5 + .5 * a); D.rip = .006 * (1 + a * .5); D.rph = TAU * ph; }
    return D; };
  const mixP = (A, B, k) => { const o2 = {}; for (const key of Object.keys(A)) o2[key] = Array.isArray(A[key]) ? A[key].map((v, i) => lerp(v, B[key][i], k)) : lerp(A[key], B[key], k); return o2; };
  let cur = POSEP('stand', 0), posName = 'stand';
  function apply() { const p = cur, pa = geo.attributes.position, ys = [];
    for (let i = 0; i < RN; i++) { const row = ROWS[i], hf = clamp((row.y - hemY) / (Ht + .012 - hemY), 0, 1), y = hemY + (row.y - hemY) * p.sq - p.bob * hf, wide = 1 + (1 - p.sq) * .55 * (1 - Math.abs(hf - .35)) , a = look.yaw * row.hw, ca = Math.cos(a), sa = Math.sin(a); ys.push(y);
      for (let j = 0; j <= N; j++) { const th = TAU * j / N, fold = 1 + row.fold * (Math.sin(4 * th + f1) * .5 + Math.sin(6 * th + f2) * .35 + Math.sin(2 * th + f3) * .4) + p.rip * Math.pow(1 - hf, 2) * Math.sin(3 * th + p.rph) * (i === RN - 1 ? 1.4 : 1);
        let x = -row.rx * Math.cos(th) * fold * wide, z = (row.cz || 0) + row.rz * Math.sin(th) * fold * wide; if (row.hw > 0) { const xr = x * ca + z * sa, zr = -x * sa + z * ca; x = xr; z = zr; }
        x += p.sway * (1 - hf * .6); z += p.lean * Math.pow(hf, 1.6) + p.swing * Math.pow(1 - hf, 2) * (1 + .4 * Math.cos(th)); const yy = y + (i === RN - 1 ? scal[j] * (p.sq > .9 ? 1 : .5) : 0);
        pa.setXYZ(i * w1 + j, x, yy, z); } }
    pa.needsUpdate = true; geo.computeVertexNormals(); const na = geo.attributes.normal;
    for (let i = 0; i < RN; i++) { const a = i * w1, c = a + N, x = na.getX(a) + na.getX(c), y = na.getY(a) + na.getY(c), z = na.getZ(a) + na.getZ(c), l = Math.hypot(x, y, z) || 1; na.setXYZ(a, x / l, y / l, z / l); na.setXYZ(c, x / l, y / l, z / l); }
    na.needsUpdate = true; head.position.y = ys[4]; head.rotation.y = look.yaw;
    const yS = ys[8];
    for (const s of [1, -1]) { const A = arms[s], d = (s > 0 ? p.L : p.R), S = V(s * sx, yS - .02, 0).add(V(p.sway, 0, p.lean * .5)), dir = V(s * d[0], d[1], d[2]).normalize().multiplyScalar(La), T = S.clone().add(dir);
      PS.limb(A.tube, S, T); A.tube.scale.x = A.tube.scale.z = 1; A.hand.position.copy(T);
      const raise = (d[1] + 1) / 2, drop = La * .55 * clamp((raise - .22) * 2.2, 0, 1), fa = A.fg.attributes.position; A.flap.visible = drop > .02;
      if (A.flap.visible) { for (let u = 0; u < 4; u++) { const t = u / 3, top = S.clone().lerp(T, t).add(V(0, -.012, 0)), bot = top.clone().add(V(s * .05 * (1 - t * .5), -drop * (1 - .75 * t), 0)); fa.setXYZ(u * 2, top.x, top.y, top.z); fa.setXYZ(u * 2 + 1, bot.x, bot.y, bot.z); } fa.needsUpdate = true; A.fg.computeVertexNormals(); } } }
  const H = { G, root: G, chest: G, head, skull: head, sheet, sp: { H: Ht, k: Ht / 1.78, kid, f: false, headH: .225 * hs, headW: hr * 2, headD: hr * 2 }, opts: o, poseName: 'stand', expr: 'calm' };
  H.pose = (name, ph = 0) => { cur = POSEP(name, ph); H.poseName = name; apply(); return H; };
  H.blend = (a, pa, b, pb, kk) => { cur = mixP(POSEP(a, pa), POSEP(b, pb), clamp(kk, 0, 1)); apply(); return H; };
  H.setExpression = () => H; H.setHandCurl = () => H; H.hand = side => arms[side === 'R' || side === -1 ? -1 : 1].hand; H.wrist = H.hand;
  H.lookAt = v => { if (!v) { look.yaw = 0; apply(); return H; } G.updateWorldMatrix(true, false); const d = G.worldToLocal(v.clone()); look.yaw = clamp(Math.atan2(d.x, d.z - 0), -.95, .95); apply(); return H; };
  H.userData = { sheet, glasses, arms: { L: arms[1].tube, R: arms[-1].tube } }; apply();
  return finish(H, o);
}
PS.props.sheetGhostView = o => sheetGhost(o).G;

// ---------- trick-or-treaters ----------
// a cape hanging from the shoulders (parented to the chest; the pose hook swings it); a tail of tapered segments hanging from the pelvis (parented to the root)
function capeMesh(H, color, o) {
  o = o || {}; const sp = H.sp, bk = H._parts.W.bulk, w = sp.chestRx * 2 * 1.2, len = (o.len || .56) * sp.k * 1.4, g = new THREE.PlaneGeometry(w, len, 3, 3), p = g.attributes.position; g.translate(0, -len / 2, 0);
  for (let i = 0; i < p.count; i++) { const t = -p.getY(i) / len; p.setX(i, p.getX(i) * (1 + .4 * t)); p.setZ(i, -.05 * t * t * len); } g.computeVertexNormals();
  const m = mk(g, fm(color, { sheen: true }), H.chest, 0, sp.shY + .02 * sp.k, -(sp.chestRz * .78 * bk) - .012 * sp.k); m.rotation.x = .17; m.name = 'cape';
  mk(box(w * .46, .018 * sp.k, .02 * sp.k), fm(o.trim || '#e8c840'), H.chest, 0, sp.shY + .022 * sp.k, -(sp.chestRz * .78 * bk) - .004 * sp.k).name = 'cape-tie'; return m; }
function tailMesh(H, color, pts, rad, tip) {
  const sp = H.sp, s = sp.H / 1.2, g = gp(H.root), m = fm(color), P = pts.map(a => V(a[0] * s, a[1] * s, a[2] * s));
  for (let i = 0; i < P.length - 1; i++) { const r0 = lerp(rad[0], rad[1], i / (P.length - 1)) * s, r1 = lerp(rad[0], rad[1], (i + 1) / (P.length - 1)) * s; limb(new THREE.CylinderGeometry(r1, r0, 1, 5, 1, true), m, g, P[i], P[i + 1]); }
  if (tip) { const a = P[P.length - 1], d = a.clone().sub(P[P.length - 2]).normalize(); limb(new THREE.ConeGeometry(.032 * s, 1, 4), fm(color), g, a.clone().addScaledVector(d, -.01 * s), a.clone().addScaledVector(d, .08 * s)); }
  g.name = 'tail'; return g; }
function pillowcase(r, s) {
  const N = 6, rings = [{ y: .07 * s, rx: .035 * s, rz: .035 * s }, { y: 0, rx: .012 * s, rz: .012 * s }, { y: -.05 * s, rx: .055 * s, rz: .055 * s }, { y: -.15 * s, rx: .1 * s, rz: .082 * s }, { y: -.26 * s, rx: .095 * s, rz: .08 * s }, { y: -.33 * s, rx: .035 * s, rz: .03 * s }];
  const geo = loft(rings, { n: N, capBot: true }), p = geo.attributes.position;
  for (let i = 2 * (N + 1); i < p.count; i++) { const f = .9 + r() * .22; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } renormal(geo, rings.length, N);
  const g = new THREE.Group(); g.name = 'pillowcase';
  const tex = texC('hw:pillow', 16, 16, (q, w, h, rr) => { px(q, '#e4dfcf', 0, 0, w, h); PS.noise(q, w, h, rr, '#c8c2ae', 50, .4); PS.noise(q, w, h, rr, '#f2eee2', 30, .3); px(q, '#c8b898', 0, 2, w, 1); px(q, '#c8b898', 0, 4, w, 1); px(q, '#d89a40', 5, 9, 3, 3); px(q, '#8a5a2a', 6, 8, 1, 1); px(q, '#a8a290', 10, 13, 5, 2); });
  mk(geo, matC('hw:pillowm', tex, { side: DS }), g); return g; }
const ghostPrint = (q, w, h, r) => { ell(q, '#2a2a30', 8, 13, 4.8, 6.6); ell(q, '#f2f0e8', 8, 13, 3.9, 5.7); px(q, '#1a1a1e', 6, 11, 1, 2); px(q, '#1a1a1e', 9, 11, 1, 2); px(q, '#1a1a1e', 7, 15, 2, 1); px(q, '#2a2a30', 4, 19, 8, 1); };
const BONE = '#dcd8c4';
const skelTorso = (q) => { px(q, BONE, 7, 2, 2, 22); px(q, BONE, 2, 1, 12, 1); for (const y of [5, 9, 13, 17, 21]) { px(q, BONE, 3, y, 4, 1); px(q, BONE, 2, y + 1, 1, 1); px(q, BONE, 9, y, 4, 1); px(q, BONE, 13, y + 1, 1, 1); } px(q, BONE, 23, 0, 2, 32); for (const y of [5, 9, 13, 17, 21]) { px(q, BONE, 18, y, 4, 1); px(q, BONE, 26, y, 4, 1); } };
const skelPelvis = (q) => { px(q, BONE, 1, 1, 6, 2); px(q, BONE, 2, 3, 5, 3); px(q, BONE, 9, 1, 6, 2); px(q, BONE, 9, 3, 5, 3); px(q, BONE, 6, 4, 4, 6); px(q, '#16161a', 7, 6, 2, 3); px(q, BONE, 20, 2, 8, 5); px(q, BONE, 23, 7, 2, 4); };
const skelArm = lo => q => { px(q, BONE, 1, 0, 2, 16); px(q, BONE, 5, 0, 1, 16); px(q, BONE, 0, lo ? 0 : 14, 4, 2); if (!lo) px(q, BONE, 0, 0, 4, 2); };
const skelLeg = sh => q => { px(q, BONE, 3, 0, 3, 16); px(q, BONE, 11, 0, 2, 16); px(q, BONE, 2, sh ? 0 : 14, 5, 2); if (!sh) px(q, BONE, 2, 0, 5, 2); else px(q, BONE, 2, 14, 5, 2); };
const stripeLeg = (c1, c2) => (q, w, h) => { for (let y = 0; y < h; y += 4) { px(q, c1, 0, y, w, 2); px(q, c2, 0, y + 2, w, 2); } };
const COSTUMES = {
  ghost: { sex: 'm', human: { top: 'nightgown', topColor: '#e6e4d8', shoes: '#d8d4cc' }, mask: 'ghost', paint: { torso: ghostPrint } },
  witch: { sex: 'f', human: { top: 'dress', topColor: '#1e1c26', _pattern: 'none', hair: 'bob', hairColor: '#34343a', shoes: '#16141a', _skirtLen: 1.2 }, mask: 'witch', hat: 'witch', cape: '#1e1c26',
    paint: { upA: (q, w, h) => px(q, '#1e1c26', 0, 0, w, h), loA: (q, w, h) => px(q, '#1e1c26', 0, 0, w, h), thigh: stripeLeg('#16141a', '#d8802a'), shin: stripeLeg('#16141a', '#d8802a') } },
  devil: { sex: 'm', human: { top: 'coveralls', topColor: '#a8302a', gloves: '#a8302a', shoes: '#2a1a18' }, mask: 'devil', cape: '#8a1e1a', tail: [[[0, -.03, -.07], [0, -.07, -.13], [0, -.15, -.17], [0, -.25, -.15], [0, -.31, -.08], [0, -.32, -.02]], [.018, .01], '#a8302a', true] },
  pirate: { sex: 'm', human: { top: 'sweater', topColor: '#cbc4b2', bottom: 'slacks', bottomColor: '#1c1c20', shoes: '#16120e' }, mask: 'pirate', hat: 'pirate',
    paint: { torso: (q, w, h) => { for (let y = 1; y < h; y += 6) { q.globalAlpha = .82; px(q, '#a82a2a', 0, y, w, 3); } q.globalAlpha = 1; }, upA: (q, w, h) => { for (let y = 1; y < h; y += 6) { q.globalAlpha = .82; px(q, '#a82a2a', 0, y, w, 3); } q.globalAlpha = 1; },
      loA: (q, w, h) => { for (let y = 1; y < h; y += 6) { q.globalAlpha = .82; px(q, '#a82a2a', 0, y, w, 3); } q.globalAlpha = 1; }, pelvis: (q, w, h) => { px(q, '#b8342c', 0, 0, w, 5); px(q, '#8a2420', 0, 4, w, 1); px(q, '#c84a40', 3, 1, 1, 3); } } },
  skeleton: { sex: 'm', human: { top: 'jacket', topColor: '#16161a', bottom: 'slacks', bottomColor: '#16161a', gloves: '#1c1c20', shoes: '#16161a' }, mask: 'skull',
    paint: { torso: skelTorso, pelvis: skelPelvis, upA: skelArm(false), loA: skelArm(true), thigh: skelLeg(false), shin: skelLeg(true) } },
  robot: { sex: 'm', human: { top: 'jacket', topColor: '#8c9298', bottom: 'slacks', bottomColor: '#7e848a', gloves: '#b4b8bc', shoes: '#4a4e54' }, mask: 'robot' },
  cat: { sex: 'f', human: { top: 'sweater', topColor: '#18181c', bottom: 'slacks', bottomColor: '#18181c', gloves: '#18181c', shoes: '#18181c' }, mask: 'cat', tail: [[[0, -.02, -.07], [0, -.05, -.15], [0, -.03, -.23], [0, .06, -.27], [0, .17, -.25], [0, .25, -.2]], [.024, .012], '#18181c', false] }
};
function robotBox(H) {
  const sp = H.sp, bk = H._parts.W.bulk, w = sp.chestRx * 2 * 1.28, hh = (sp.nbL + .03 * sp.H) * .86, d = sp.chestRz * 2 * 1.55, fr = texC('hw:robotbox', 32, 32, (q, W, Hh, r) => { const m = '#a4aab0', m2 = '#868c94', dk = '#14161a';
    px(q, m, 0, 0, 32, 32); PS.noise(q, 32, 32, r, m2, 120, .5); PS.noise(q, 32, 32, r, '#ccd2d8', 70, .5); px(q, m2, 0, 0, 32, 1); px(q, m2, 0, 31, 32, 1); px(q, m2, 0, 0, 1, 32); px(q, m2, 31, 0, 1, 32);
    ell(q, dk, 9, 9, 4.5, 4.5); ell(q, '#d8d4c0', 9, 9, 3.4, 3.4); px(q, dk, 9, 6, 1, 4); ell(q, dk, 23, 9, 4.5, 4.5); ell(q, '#d8d4c0', 23, 9, 3.4, 3.4); px(q, dk, 24, 7, 1, 3);
    px(q, '#d8c040', 5, 18, 4, 3); px(q, '#48b848', 11, 18, 4, 3); px(q, '#d83a30', 17, 18, 4, 3); px(q, '#3a78d8', 23, 18, 4, 3); px(q, dk, 7, 24, 18, 5); for (let x = 8; x < 25; x += 2) px(q, '#70767e', x, 25, 1, 3); });
  const side = solid('#94999f'), top = solid('#b4bac0'), m = mk(box(w, hh, d), [side, side, top, side, matC('hw:robotboxm', fr), side], H.chest, 0, -.03 * sp.H + hh / 2 + .004, .004); m.name = 'robot-box'; return m; }
function trickOrTreater(kind, o) {
  if (kind && typeof kind === 'object') { o = kind; kind = o.kind; }
  o = Object.assign({}, o); kind = COSTUMES[kind] ? kind : 'ghost'; const C = COSTUMES[kind], seed = o.seed ?? 5, r = PS.rng(seed * 31 + hashSeed(kind)), sex = o.sex || C.sex;
  const H = PS.props.human(Object.assign({ build: 'child', sex, skin: pickSkin(r), hair: sex === 'f' ? 'ponytail' : 'short', hairColor: ['#3a2a1e', '#6a4a2a', '#a8803e', '#1a1410'][(r() * 4) | 0], shoes: '#d8d4cc', expression: 'calm' }, C.human, o));
  const sp = H.sp, K = H._parts.K, ho = H.opts, pk = JSON.stringify([ho.top, ho.topColor, ho.bottom, ho.bottomColor, ho.skin]), map = {};
  for (const part of Object.keys(C.paint || {})) map[part] = paintMat([kind, part, pk].join('|'), K[part], C.paint[part], {});
  if (kind === 'witch') { map.shoulder = solid('#1e1c26'); map.elbow = solid('#1e1c26'); map.knee = solid('#16141a'); }
  reskin(H, map);
  const ud = H.userData = { kind, mask: null, bag: null, tail: null, cape: null, hat: null }, hooks = [];
  if (C.cape) { ud.cape = capeMesh(H, C.cape, { trim: kind === 'witch' ? '#d8802a' : '#e8c840' }); hooks.push((n, ph) => { const w = n === 'walk' || n === 'run' ? Math.abs(Math.sin(TAU * ph)) : 0; ud.cape.rotation.x = .17 + .2 * w; }); }
  if (C.tail) { ud.tail = tailMesh(H, C.tail[2], C.tail[0], C.tail[1], C.tail[3]); hooks.push((n, ph) => { const w = n === 'walk' || n === 'run' ? 1 : 0; ud.tail.rotation.y = w * .35 * Math.sin(TAU * ph); ud.tail.rotation.x = w * .08 * Math.sin(TAU * ph * 2); }); }
  if (C.hat) ud.hat = addHat(H, C.hat);
  if (kind === 'pirate') mk(box(.034 * sp.k, .06 * sp.k, .02 * sp.k), solid('#b8342c'), H.root, sp.hipRx * .8, 0, sp.hipRz * .78).rotation.z = .25;
  if (kind === 'robot') robotBox(H);
  if (o.mask !== false) { const mk2 = buildMask(C.mask, sp, { dirt: .8, strap: '#cfc7b0' }); mk2.position.set(0, -sp.pv, sp.fz); H.head.add(mk2); ud.mask = mk2; }
  H.wearMask = (on = true) => { const m = ud.mask || (ud.mask = buildMask(C.mask, sp, { dirt: .8, strap: '#cfc7b0' })); if (m.parent) m.parent.remove(m); if (on !== false) { m.position.set(0, -sp.pv, sp.fz); H.head.add(m); } return H; };
  if (o.bag) { const bag = pillowcase(r, sp.H / 1.2); H.hand('R').add(bag); ud.bag = bag; const qh = new THREE.Quaternion(), qg = new THREE.Quaternion(), qy = new THREE.Quaternion(), qs = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), ax = V(1, 0, 0), up = V(0, 1, 0);
    hooks.push((n, ph) => { const grip = H.hand('R'); grip.updateWorldMatrix(true, false); grip.getWorldQuaternion(qh); H.G.getWorldQuaternion(qg); e.setFromQuaternion(qg, 'YXZ'); qy.setFromAxisAngle(up, e.y);
      const sw = n === 'walk' || n === 'run' ? .2 * Math.sin(TAU * ph + .8) : .03; qs.setFromAxisAngle(ax, sw); bag.quaternion.copy(qh).invert().multiply(qy).multiply(qs); }); }
  if (hooks.length) poseHook(H, (HH, n, ph) => { for (const f of hooks) f(n, ph); });
  H.pose('stand', 0); return finish(H, o);
}
PS.props.trickOrTreaterView = o => trickOrTreater(o).G;

// ---------- patient, nurse, doctor ----------
const both = o => ({ L: o, R: Object.assign({}, o) });
function spikes(H, r, n, color) {
  const sp = H.sp, k = sp.k, R = headProf(sp), hm = color ? solid(color) : H._parts.K.hair;
  for (let i = 0; i < n; i++) { const th = TAU * i / n + r() * .5, p = profAt(R, .8 + r() * .16), len = (.07 + r() * .06) * k, t = mk(new THREE.ConeGeometry(.024 * k, len, 4), hm, H.skull, -(p.rx * .85) * Math.cos(th), p.y + .015 * k, p.cz + p.rz * .85 * Math.sin(th));
    t.rotation.set(Math.sin(th) * (.7 + r() * .5), 0, Math.cos(th) * (.7 + r() * .5)); } }
function patient(o) {
  o = Object.assign({}, o); const seed = o.seed ?? 3, r = PS.rng(seed * 13 + 7), gown = o.gown || '#c6cbc6';
  const lib = { stand: () => ({ spine: [.1, 0, .03], head: [.16, .04, .1], ...both({ t: [.08, -.95, .06], pole: [.4, -.2, -1], curl: .5, ic: .5, tc: .3 }) }) };
  const H = PS.props.human(Object.assign({ build: 'adult', sex: 'm', skin: '#cdb8a8', hair: 'messy', hairColor: '#5c554c', top: 'dress', topColor: gown, _pattern: 'none', shoes: 'bare', expression: 'blank', _skirtLen: 1.12, _poses: lib }, o));
  const K = H._parts.K, k = H.sp.k, ho = H.opts, key = [gown, ho.skin].join('|');
  reskin(H, { torso: paintMat('pat|torso|' + key, K.torso, (q, w, h, rr) => { for (let y = 3; y < 30; y += 5) for (let x = (y / 5 | 0) % 2 * 3; x < 32; x += 6) { q.globalAlpha = .38; px(q, '#7c8c9a', x, y, 1, 1); } q.globalAlpha = 1; px(q, '#8a8a82', 3, 0, 1, 4); px(q, '#8a8a82', 12, 0, 1, 4); PS.noise(q, w, h, rr, '#6a6050', 14, .25); }),
    skirt: paintMat('pat|skirt|' + key, K.skirt, (q, w, h, rr) => { q.globalAlpha = .4; px(q, '#7a6a52', 0, 14, 8, 2); q.globalAlpha = .22; px(q, '#6a5a42', 1, 11, 1, 2); px(q, '#6a5a42', 5, 9, 1, 1); q.globalAlpha = 1; }, { side: DS }) });
  faceMod(H, 'patient', (q, w, h, rr, e, f) => { const ey = 14; q.globalAlpha = .45; px(q, '#5e4e5e', 5, ey + 5, 8, 2); px(q, '#5e4e5e', 19, ey + 5, 8, 2); q.globalAlpha = .22; px(q, '#6a4a48', 3, 20, 3, 5); px(q, '#6a4a48', 26, 20, 3, 5); q.globalAlpha = 1; PS.noise(q, 32, 32, rr, '#5a4a40', 16, .3); });
  spikes(H, r, 8); mk(new THREE.CylinderGeometry(.034 * k, .034 * k, .026 * k, 8, 1, true), fm('#ece8dc'), H.wrist('L'), 0, -.02 * k, 0);
  H.userData = {}; return finish(H, o);
}
PS.props.patientView = o => patient(o).G;
function nurse(o) {
  o = Object.assign({}, o); const white = o.uniform || '#e8e8e2';
  const H = PS.props.human(Object.assign({ build: 'adult', sex: 'f', top: 'dress', topColor: white, _pattern: 'none', shoes: '#ecebe4', hair: 'bob', hairColor: o.hairColor || '#3a2a1e', expression: 'calm', _skirtLen: 1.12 }, o));
  const K = H._parts.K, key = [white, H.opts.skin].join('|'), st = '#e6e2da';
  reskin(H, { thigh: solid(st), shin: solid(st), knee: solid(st),
    torso: paintMat('nur|torso|' + key, K.torso, q => { px(q, lum(white, -.12), 6, 0, 1, 7); px(q, lum(white, -.12), 9, 0, 1, 7); px(q, lum(white, -.06), 7, 0, 2, 5); for (let y = 8; y < 30; y += 5) px(q, '#a8a8a0', 8, y, 1, 1); px(q, lum(white, -.14), 10, 14, 5, 1); px(q, lum(white, -.14), 10, 14, 1, 5); px(q, lum(white, -.14), 14, 14, 1, 5); px(q, '#7a8a9a', 11, 16, 3, 1); px(q, '#b83a40', 3, 9, 2, 2); px(q, '#d8d4c8', 3, 9, 1, 1); }),
    skirt: paintMat('nur|skirt|' + key, K.skirt, q => { px(q, lum(white, -.14), 2, 0, 1, 16); px(q, lum(white, -.2), 0, 14, 8, 2); }, { side: DS }) });
  faceMod(H, 'nurse', (q, w, h, rr) => { const mY = 25; px(q, '#b03a44', 12, mY, 8, 1); px(q, '#c04a52', 12, mY + 1, 8, 2); });
  if (o.cap !== false) addHat(H, 'nurse', white);
  H.userData = {}; return finish(H, o);
}
PS.props.nurseView = o => nurse(o).G;
function doctorInCoat(o) {
  o = Object.assign({}, o); const coat = o.coat || '#a8946e', hairC = '#5a554e';
  const lib = { stand: () => ({ spine: [.03, 0, 0], head: [.04, 0, 0], ...both({ t: [.1, -.96, .05], pole: [.4, -.2, -1], curl: .6, ic: .55, tc: .4 }) }) };
  const H = PS.props.human(Object.assign({ build: 'adult', sex: 'm', skin: '#d0a688', hair: 'short', hairColor: hairC, beard: 'stubble', top: 'coat', topColor: coat, bottomColor: '#2c2a30', shoes: '#1a1614', gloves: o.gloves || '#2a2420', expression: 'calm', _skirtFlare: 1.2, _skirtLen: 1.08, _poses: lib }, o));
  const K = H._parts.K, sp = H.sp, k = sp.k, key = [coat, H.opts.skin].join('|');
  reskin(H, { thigh: solid(lum(coat, -.28)), knee: solid(lum(coat, -.28)), torso: paintMat('doc|torso|' + key, K.torso, q => { const dk = lum(coat, -.45);
      for (const y of [5, 10, 15, 20]) { px(q, dk, 5, y, 2, 2); px(q, dk, 9, y, 2, 2); } px(q, lum(coat, -.3), 7, 2, 2, 27); px(q, lum(coat, -.2), 0, 26, 32, 3); px(q, '#c8b070', 7, 26, 2, 3); px(q, '#8a7650', 1, 0, 4, 3); px(q, '#8a7650', 11, 0, 4, 3); px(q, dk, 3, 0, 1, 3); px(q, dk, 12, 0, 1, 3); }) });
  faceMod(H, 'doctor', (q, w, h, rr, e, f) => { q.globalAlpha = .8; px(q, '#908e8a', 0, 8, 3, 6); px(q, '#908e8a', 29, 8, 3, 6); q.globalAlpha = .5; px(q, '#a4a29e', 3, 7, 4, 2); px(q, '#a4a29e', 25, 7, 4, 2); q.globalAlpha = .26; px(q, '#6a4a3a', 9, 19, 1, 6); px(q, '#6a4a3a', 22, 19, 1, 6); px(q, '#6a4a3a', 10, 9, 4, 1); px(q, '#6a4a3a', 18, 9, 4, 1); px(q, '#5a4a52', 5, 19, 8, 1); px(q, '#5a4a52', 19, 19, 8, 1); q.globalAlpha = 1; });
  if (o.hat !== false) addHat(H, 'fedora', typeof o.hat === 'string' ? o.hat : '#2a2622');
  H.userData = {}; return finish(H, o);
}
PS.props.doctorInCoatView = o => doctorInCoat(o).G;

// @@NEXT@@

Object.assign(PS.props, { addHat, addGlasses, wearMask, whiteMask, clownChild, sheetGhost, trickOrTreater, patient, nurse, doctorInCoat });
PS.halloween = { buildMask, reskin, paintMat, faceMod, poseHook, MASKS };
})();
