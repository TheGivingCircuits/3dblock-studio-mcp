// PS1 prop library: BACKROADS (load after ps1.js and people.js; viewer module string  people+backroads). Built for Guess The Horror #4
// (a 1970s rural slasher): the tools, the station and the odd things you meet on a hot back road. Non-graphic: nothing here is bloody.
// Conventions as in furniture.js: metres, y up, the prop rests on y = 0 unless noted, fronts face +z, every builder (o = {}) => THREE.Group
// at the origin (not parented), userData.size = [w, h, d]. Anything with userData.update(t) needs it called each frame; pure in t.
//
// TOOLS (held props: place them in the WORLD at wpos(H.hand('R')) each frame and aim them; they are not built to parent into the hand frame)
//   chainsaw({ body:'#8a2a1c', bar:.55 })   1970s chainsaw. ORIGIN = the rear handle grip, the bar points along +z, the top handle is up (+y).
//     userData: update(t, run 0..1) jiggles the body and runs the chain (uv scroll), tip (local V3 of the bar's nose), topGrip (local V3).
//   sledgehammer({ len:.9 })   ORIGIN = the bottom of the handle (where the hands go), the handle along +y, the head at the top, striking face +z.
//     userData: head (local V3 of the head centre).
//   razor({ open:true })   straight razor, ORIGIN = the handle's pivot, blade along +y.   instantCamera()  boxy 1970s instant camera, lens +z;
//     userData.flash(k) lights the flash cube; photo (Group, a white card that can slide out of the front slot: userData.eject(k)).
// WEARABLES (take a human from people.js and attach to its rig so they follow every pose)
//   skinMask(H, { hair:'#4a3424' })   a stitched, tan, homemade-looking leather mask over the face with dark eye holes, a crooked mouth and shaggy
//     hair spilling over the top. Returns the Group (child of H.head).   apron(H, { color:'#d8d0b8' })   a long butcher's apron: a bib on
//     H.chest and a skirt on H.root down to the knees, with neck and waist ties. Returns { bib, skirt }.
// PLACES AND THINGS
//   gasPump({ color:'#c23a2a', globe:'GAS' })   a 1970s gas pump (rolling price digits, lit globe, hose and nozzle on its hook). userData: globe (mesh).
//   gasStation({ sign:'GAS · BAR-B-Q', lit:false })   a small cinderblock roadside station: shop with a big window and a screen door, a flat roof
//     with a hand-painted sign, a canopy over two pumps on an island at +z. Origin = ground at the middle of the shop front.
//     userData: door (V3 floor at the screen door), counter (V3 inside, on the counter top), pumps[] (V3), island (V3), setLit(k), windowLight (V3).
//   steelDoor({ w:1.1, h:2.1 })   a riveted steel sliding door on a top track in its own wall panel (wall 3 m wide, opening at x = 0), front +z.
//     userData: setOpen(k 0 shut .. 1 slid fully left), opening (V3 floor-centre of the doorway).
//   wheelchair({ color:'#8a8e94' })   a 1970s folding wheelchair, front +z. userData: seat (V3 where a sitting person's origin goes), handles (V3).
//   armadillo({ dead:true })   a small banded armadillo; dead = lying on its back, feet up (a roadkill clue, not gory).
//   generator()   a rumbling farm generator on skids with a fuel can. userData.update(t) shakes it.
//   carWreck({ color, seed })   a rusted-out wreck sitting low on flat tyres (a car() with rust, no lights, tilted, half sunk).
// CHARACTERS (human() from people.js plus the wearables above; every human() option overrides the defaults; each has an XView for the viewer)
//   butcher(o)    a huge man (1.95 m, heavy) in a pale blue work shirt and dark slacks, a long stained-looking butcher's apron and the skin mask.
//                 H.userData = { mask, apron }.
//   drifter(o)    a gaunt young hitchhiker: long greasy hair, a rust-brown jacket over a dirty shirt, jeans, a pale face.
//   elder(o)      a tiny, frail, very old man: bald, waxy pale skin, a dark old suit, a blank stare (sitting slumped suits him).
(function () {
const PS = window.PS1, V = (x, y, z) => new THREE.Vector3(x, y, z), M = PS.mat, box = PS.box, cyl = PS.cyl, col = PS.color, add = PS.add, noise = PS.noise;
const cache = {}, C = (k, f) => cache[k] || (cache[k] = f());
const grp = () => new THREE.Group();
const tex = (key, w, h, draw) => C('t' + key, () => PS.tex(w, h, draw));
const mat = (key, w, h, draw, o) => C('m' + key, () => M(tex(key, w, h, draw), o));
const solid = (hex, o) => C('s' + hex + JSON.stringify(o || {}), () => M(col(hex), o));
const lum = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
const dirty = (hex, n = 60) => (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); noise(q, w, h, r, lum(hex, -.15), n, .6); noise(q, w, h, r, lum(hex, .1), n / 2, .4); };

// ---------- tools ----------
PS.props.chainsaw = (o = {}) => { const G = grp(), bodyC = o.body || '#8a2a1c', L = o.bar ?? .55;
  const body = grp(); G.add(body);
  const red = mat('saw' + bodyC, 16, 16, dirty(bodyC, 50)), dark = solid('#2a2624'), steel = mat('sawsteel', 16, 8, dirty('#a8acb0', 30));
  add(box(.13, .19, .3), red, 0, .1, .17, body); add(box(.135, .07, .2), dark, 0, .02, .19, body);             // engine housing + crankcase
  add(box(.1, .05, .06), solid('#c8b030'), .0, .21, .1, body);                                               // fuel cap / filter cover
  for (let i = 0; i < 5; i++) add(box(.137, .012, .012), dark, 0, .07 + i * .025, .32, body);                // cooling fins
  add(box(.03, .03, .16), dark, 0, .06, .0, body); add(box(.03, .1, .03), dark, 0, .1, -.07, body); add(box(.03, .03, .1), dark, 0, .15, -.03, body);   // rear handle loop
  const tg = add(new THREE.TorusGeometry(.085, .013, 4, 10, Math.PI), dark, 0, .2, .2, body); tg.rotation.y = Math.PI / 2;   // the top handle arc
  // the bar and the chain (the chain is its own strip whose texture scrolls)
  add(box(.012, .07, L), steel, 0, .06, .32 + L / 2, body);
  const chainT = PS.tex(32, 4, (q, w, h) => { q.fillStyle = '#3a3836'; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { q.fillStyle = '#9a9a96'; q.fillRect(x, 0, 2, h); } });
  const chainM = M(chainT); for (const y of [.096, .024]) add(PS.rep(box(.016, .012, L + .04), 1, L * 12), chainM, 0, y, .32 + L / 2, body);
  const nose = add(cyl(.036, .036, .016, 8), chainM, 0, .06, .32 + L, body); nose.rotation.z = Math.PI / 2;
  G.userData = { size: [.16, .3, .36 + L], tip: V(0, .06, .32 + L), topGrip: V(0, .28, .2),
    update(t, run = 1) { if (typeof run !== 'number') run = 1; body.position.set(Math.sin(t * 91) * .004 * run, Math.sin(t * 77) * .005 * run, 0); chainM.uniforms.uvOff.value.set(0, -(t * 9 * run) % 1); } };
  return G; };
PS.props.sledgehammer = (o = {}) => { const G = grp(), L = o.len ?? .9;
  add(box(.035, L, .035), mat('hamwood', 8, 16, dirty('#8a6a42', 40)), 0, L / 2, 0, G);
  add(box(.08, .09, .2), mat('hamhead', 8, 8, dirty('#4a4a4c', 30)), 0, L + .02, .03, G);
  G.userData = { size: [.08, L + .07, .2], head: V(0, L + .02, .03) }; return G; };
PS.props.razor = (o = {}) => { const G = grp(); add(box(.012, .1, .02), solid('#1e1a18'), 0, -.05, 0, G);
  const b = add(box(.004, .085, .02), solid('#d8dce0', { unlit: true }), 0, .045, 0, G); if (o.open === false) b.visible = false;
  G.userData = { size: [.02, .19, .02], blade: b }; return G; };
PS.props.instantCamera = () => { const G = grp(); add(box(.15, .1, .1), solid('#2a2826'), 0, .05, 0, G); add(box(.12, .02, .06), solid('#c8c4bc'), 0, .1, .0, G);
  const lens = add(cyl(.028, .028, .03, 10), solid('#141414'), -.025, .05, .06, G); lens.rotation.x = Math.PI / 2;
  const fl = add(box(.04, .03, .02), M(col('#fffbe8'), { unlit: true }), .045, .09, .05, G); fl.visible = false;
  const photo = grp(); G.add(photo); const card = add(box(.088, .004, .1), mat('photo', 8, 8, (q) => { q.fillStyle = '#f4f2ea'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#4a3a2e'; q.fillRect(1, 1, 6, 5); }), 0, .012, .03, photo);
  photo.visible = false;
  photo.userData = { eject(k) { photo.visible = k > 0; photo.position.set(0, .0, .06 * k); } };
  G.userData = { size: [.15, .11, .12], flash(k) { fl.visible = k > .5; }, photo, card }; return G; };

// ---------- wearables ----------
PS.props.skinMask = (H, o = {}) => { const sp = H.sp, w2 = sp.headW / 2, d2 = sp.headD / 2, hh = sp.headH, G = grp(); G.position.set(0, -sp.pv, sp.fz);
  const face = mat('skinmask', 32, 32, (q, w, h, r) => { q.fillStyle = '#b89470'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a6a4a', 140, .7); noise(q, w, h, r, '#d0b08a', 60, .5);
    q.fillStyle = '#5a3e2a'; for (const [x0, y0, x1, y1] of [[3, 9, 14, 7], [18, 7, 29, 10], [15, 2, 16, 30], [6, 22, 26, 23]]) { const n = 10; for (let i = 0; i <= n; i++) q.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); }   // stitched seams
    q.fillStyle = '#120c08'; q.fillRect(8, 12, 5, 3); q.fillRect(19, 12, 5, 3); q.fillRect(8, 15, 4, 1); q.fillRect(20, 15, 4, 1);   // eye holes
    q.fillStyle = '#3a2618'; q.fillRect(13, 15, 6, 4); q.fillStyle = '#1a100a'; q.fillRect(11, 24, 11, 3); q.fillStyle = '#c8b898'; for (let x = 12; x < 22; x += 2) q.fillRect(x, 24, 1, 2);   // nose, crooked mouth, teeth
  });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, hh * .82, 10, 2, true, -1.25, 2.5), face); shell.scale.set(w2 * 1.12, 1, d2 * 1.12); shell.position.set(0, hh * .45, -d2 * .05); G.add(shell);
  const hairM = mat('maskhair' + (o.hair || '#4a3424'), 8, 8, dirty(o.hair || '#4a3424', 30));
  add(box(w2 * 2.35, hh * .16, d2 * 2.2), hairM, 0, hh * .9, -d2 * .1, G);
  for (let i = 0; i < 7; i++) { const s = add(box(.03, hh * (.25 + (i % 3) * .08), .03), hairM, (-w2 + i * w2 / 3) * 1.05, hh * .74, d2 * .85 - Math.abs(i - 3) * .012, G); s.rotation.z = (i - 3) * .06; }   // shaggy fringe
  H.head.add(G); return G; };
PS.props.apron = (H, o = {}) => { const sp = H.sp, k = sp.k || 1, cm = mat('apron' + (o.color || '#d8d0b8'), 8, 16, (q, w, h, r) => { dirty(o.color || '#d8d0b8', 50)(q, w, h, r); noise(q, w, h, r, '#8a7a5a', 25, .5); });
  const bk = (H._parts && H._parts.W && H._parts.W.bulk) || 1, cz = (sp.chestRz || .12) * bk + (sp.belly || 0) * .5 + .03, wz = ((sp.waistRz || .11) * bk + (sp.belly || 0)) + .02, top = (sp.nbL || .45) * .78;
  const bib = add(box(.32 * k, top + .12, .012), cm, 0, top / 2 - .06, cz, H.chest); bib.rotation.x = -.16;
  const tie = solid('#cfc6ae'); add(box(.012, .06, .1 * k), tie, .14 * k, top + .02, cz - .06, H.chest); add(box(.012, .06, .1 * k), tie, -.14 * k, top + .02, cz - .06, H.chest);
  const len = (sp.legL || .9) * .62, skirt = add(box(.42 * k, len, .012), cm, 0, -len / 2 + .12, wz, H.root);
  return { bib, skirt }; };

// ---------- the station ----------
PS.props.gasPump = (o = {}) => { const G = grp(), c = o.color || '#c23a2a';
  add(box(.5, 1.25, .38), mat('pump' + c, 16, 32, dirty(c, 50)), 0, .7, 0, G); add(box(.56, .08, .42), solid('#2a2a2a'), 0, .04, 0, G);
  add(box(.4, .26, .01), mat('pumpface', 16, 8, (q) => { q.fillStyle = '#e8e2d0'; q.fillRect(0, 0, 16, 8); q.fillStyle = '#1a1a1a'; for (const y of [1, 5]) for (let x = 2; x < 14; x += 3) q.fillRect(x, y, 2, 2); }), 0, 1.0, .195, G);
  const globe = add(new THREE.SphereGeometry(.16, 8, 6), M(PS.tex(16, 16, (q) => { q.fillStyle = '#f4ecd0'; q.fillRect(0, 0, 16, 16); q.fillStyle = c; q.fillRect(0, 6, 16, 4); }), { unlit: true }), 0, 1.5, 0, G);
  const hose = solid('#141414'); add(box(.03, .55, .03), hose, .27, .65, .1, G); add(box(.05, .05, .14), solid('#9a9a9a'), .28, .95, .12, G);
  G.userData = { size: [.56, 1.66, .42], globe }; return G; };
PS.props.gasStation = (o = {}) => { const G = grp(), W = 6.4, D = 4.2, Hh = 3.0;
  const block = mat('cinder', 32, 32, (q, w, h, r) => { q.fillStyle = '#c8c0a8'; q.fillRect(0, 0, w, h); q.fillStyle = '#a49c86'; for (let y = 0; y < h; y += 8) { q.fillRect(0, y, w, 1); for (let x = (y / 8 % 2) * 8; x < w; x += 16) q.fillRect(x, y, 1, 8); } noise(q, w, h, r, '#7a705e', 140, .6); });
  const w = (ww, hh, dd, x, y, z) => add(PS.rep(box(ww, hh, dd), Math.max(1, ww / 1.2), Math.max(1, hh / 1.2)), block, x, y, z, G);
  w(W, Hh, .2, 0, Hh / 2, -D);                                 // back
  w(.2, Hh, D, -W / 2, Hh / 2, -D / 2); w(.2, Hh, D, W / 2, Hh / 2, -D / 2);   // sides
  w(1.3, Hh, .2, -W / 2 + .65, Hh / 2, 0); w(1.1, Hh, .2, W / 2 - .55, Hh / 2, 0); w(W - 2.4, .7, .2, -.05, Hh - .35, 0); w(W - 2.4, .9, .2, -.05, .45, 0);   // front with a big window and a door
  const glass = add(box(2.6, 1.3, .03), M(PS.tex(16, 16, (q, ww, hh, r) => { q.fillStyle = '#3a4248'; q.fillRect(0, 0, ww, hh); noise(q, ww, hh, r, '#8a9aa4', 30, .5); q.fillStyle = '#d8d0b0'; q.fillRect(2, 2, 5, 3); q.fillRect(9, 3, 4, 2); })), -.55, 1.55, .0, G);
  const door = add(box(.86, 2.1, .04), mat('screendoor', 8, 16, (q) => { q.fillStyle = '#5a6a4a'; q.fillRect(0, 0, 8, 16); q.fillStyle = '#2a3026'; q.fillRect(1, 1, 6, 6); q.fillRect(1, 9, 6, 6); }), 1.75, 1.05, .05, G);
  add(box(W + .6, .14, D + .6), solid('#5a5448'), 0, Hh + .07, -D / 2, G);                                                        // roof slab
  const sign = add(box(4.4, .8, .06), mat('stationsign' + (o.sign || ''), 64, 16, (q) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, 64, 16); q.fillStyle = '#9a2a1e'; q.font = 'bold 8px Arial'; q.textBaseline = 'middle'; q.textAlign = 'center'; q.fillText(o.sign || 'GAS · BAR-B-Q', 32, 8.5); q.strokeStyle = '#6a5a40'; q.strokeRect(.5, .5, 63, 15); }), 0, Hh + .58, -.3, G);
  // canopy + pump island
  add(box(5.2, .18, 3.4), solid('#e6ded0'), 0, 3.25, 4.2, G); for (const x of [-2.2, 2.2]) add(box(.16, 3.2, .16), solid('#d8d0c0'), x, 1.6, 4.2, G);
  add(box(4.0, .16, .9), solid('#8a8478'), 0, .08, 4.2, G);
  const pumps = [-1.1, 1.1].map(x => { const p = PS.props.gasPump({ color: x < 0 ? '#c23a2a' : '#2a5a9a' }); p.position.set(x, .16, 4.2); G.add(p); return V(x, .16, 4.2); });
  // inside: a counter, shelves, a cooler
  add(box(2.2, .95, .6), mat('counterwood', 16, 16, dirty('#7a5a3a', 50)), .9, .475, -1.4, G); add(box(1.8, 1.8, .4), solid('#6a5a44'), -1.8, .9, -3.7, G); add(box(1.1, 1.0, .6), solid('#b8b4a8'), 2.2, .5, -3.6, G);
  add(PS.rep(box(W - .3, .02, D - .2), 4, 3), mat('stationfloor', 16, 16, dirty('#8a8070', 60)), 0, .01, -D / 2, G);
  const lit = []; const lampM = M(col('#fff2c8'), { unlit: true }); lit.push(add(box(1.2, .05, .2), lampM, 0, Hh - .06, -2, G)); lit.push(add(box(1.0, .05, .2), lampM, 0, 3.15, 4.2, G));
  G.userData = { size: [W, Hh + .9, D + 6], door: V(1.75, 0, .4), counter: V(.9, .95, -1.4), pumps, island: V(0, .16, 4.2), windowLight: V(-.55, 1.6, -.8), glass,
    setLit(k) { for (const m of lit) m.visible = k > .5; } };
  G.userData.setLit(o.lit ? 1 : 0); return G; };

// ---------- the house of the killer: a steel sliding door ----------
PS.props.steelDoor = (o = {}) => { const G = grp(), w = o.w ?? 1.1, h = o.h ?? 2.1, WW = 3.0, WH = 2.7;
  const wallM = mat('reddoorwall', 16, 16, (q, ww, hh, r) => { q.fillStyle = '#7a2a22'; q.fillRect(0, 0, ww, hh); noise(q, ww, hh, r, '#4a1a14', 120, .6); noise(q, ww, hh, r, '#9a4a3a', 50, .5); });
  add(box((WW - w) / 2, WH, .14), wallM, -(WW + w) / 4, WH / 2, 0, G); add(box((WW - w) / 2, WH, .14), wallM, (WW + w) / 4, WH / 2, 0, G); add(box(w, WH - h, .14), wallM, 0, h + (WH - h) / 2, 0, G);
  add(box(w + 1.5, .06, .06), solid('#3a3634'), -.6, h + .08, .12, G);   // the track
  const slab = grp(); G.add(slab);
  add(box(w + .08, h + .04, .05), mat('steelplate', 16, 32, (q, ww, hh, r) => { q.fillStyle = '#6e7276'; q.fillRect(0, 0, ww, hh); noise(q, ww, hh, r, '#4a4e52', 90, .6); noise(q, ww, hh, r, '#8a6a4a', 40, .5); q.fillStyle = '#3a3e42'; for (let y = 2; y < hh; y += 7) for (const x of [1, ww - 2]) q.fillRect(x, y, 1, 1); }), 0, h / 2, .1, slab);
  add(box(.04, .18, .06), solid('#2a2a2a'), w / 2 - .12, 1.0, .15, slab);
  const dark = add(box(w, h, .02), solid('#050404', { unlit: true }), 0, h / 2, -.02, G);
  G.userData = { size: [WW, WH, .3], opening: V(0, 0, .2), setOpen(k) { slab.position.x = -(w + .05) * Math.max(0, Math.min(1, k)); }, slab };
  return G; };

// ---------- odds and ends ----------
PS.props.wheelchair = (o = {}) => { const G = grp(), c = o.color || '#8a8e94', frame = solid(c), seatM = solid('#2a2a2e'), tyre = solid('#161616');
  add(box(.44, .04, .42), seatM, 0, .5, 0, G); add(box(.44, .42, .03), seatM, 0, .74, -.21, G);
  for (const s of [-1, 1]) { const wh = add(new THREE.TorusGeometry(.29, .02, 4, 14), tyre, s * .27, .3, -.05, G); wh.rotation.y = Math.PI / 2; const hub = add(new THREE.TorusGeometry(.24, .008, 3, 12), frame, s * .29, .3, -.05, G); hub.rotation.y = Math.PI / 2;
    add(box(.025, .5, .025), frame, s * .23, .75, -.23, G); add(box(.025, .025, .14), frame, s * .23, 1.0, -.29, G); add(box(.025, .025, .42), frame, s * .23, .66, 0, G);
    add(box(.025, .38, .025), frame, s * .2, .3, .2, G); const cs = add(new THREE.TorusGeometry(.06, .015, 3, 8), tyre, s * .2, .07, .24, G); cs.rotation.y = Math.PI / 2; add(box(.1, .015, .12), frame, s * .1, .14, .28, G); }
  G.userData = { size: [.62, 1.0, .7], seat: V(0, .52 - .47, .02), handles: V(0, 1.0, -.36) }; return G; };
PS.props.armadillo = (o = {}) => { const G = grp(), shellM = mat('dillo', 16, 8, (q, w, h, r) => { q.fillStyle = '#8a7a64'; q.fillRect(0, 0, w, h); q.fillStyle = '#5e5242'; for (let x = 1; x < w; x += 2) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#b4a488', 20, .5); }), skin = solid('#b49a84');
  const body = grp(); G.add(body); const sh = add(new THREE.SphereGeometry(.13, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), C('dilloDS', () => M(tex('dillo', 16, 8, () => {}), { side: THREE.DoubleSide })), 0, 0, 0, body); sh.scale.set(.75, .8, 1.5); const belly = add(new THREE.CircleGeometry(.13, 10), skin, 0, -.002, 0, body); belly.rotation.x = Math.PI / 2; belly.scale.set(.75, 1.5, 1);
  add(box(.06, .05, .1), skin, 0, .03, .22, body); add(box(.02, .03, .03), skin, -.02, .07, .24, body); add(box(.02, .03, .03), skin, .02, .07, .24, body);   // head + ears
  const tail = add(box(.03, .03, .2), shellM, 0, .02, -.26, body); tail.rotation.x = .15;
  for (const [x, z] of [[-.07, .11], [.07, .11], [-.07, -.11], [.07, -.11]]) add(box(.03, .06, .03), skin, x, -.03, z, body);
  if (o.dead !== false) { body.rotation.z = Math.PI; body.position.y = .1; } else body.position.y = .06;
  G.userData = { size: [.22, .2, .6] }; return G; };
PS.props.generator = () => { const G = grp(), b = grp(); G.add(b); add(box(1.4, .1, .7), solid('#4a3a2a'), 0, .05, 0, G);
  add(box(.9, .6, .55), mat('gen', 16, 16, dirty('#5a6a3a', 60)), -.1, .42, 0, b); add(cyl(.18, .18, .5, 8), solid('#2a2a2a'), .45, .32, 0, b).rotation.x = Math.PI / 2; add(box(.08, .35, .08), solid('#1e1e1e'), -.3, .9, 0, b);
  const can = add(box(.22, .32, .14), solid('#a8321e'), .55, .16, .5, G);
  G.userData = { size: [1.4, 1.1, .8], update(t) { b.position.set(Math.sin(t * 60) * .006, Math.abs(Math.sin(t * 47)) * .006, 0); } }; return G; };
PS.props.carWreck = (o = {}) => { const G = grp(), car = PS.props.car({ color: o.color || '#7a5a3a', era: '60s', rust: 1, whitewall: false }); car.userData.setLights(false, false);
  car.position.y = -.12; car.rotation.z = ((o.seed || 1) % 2 ? .05 : -.04); car.rotation.x = .03; G.add(car); G.userData = { size: car.userData.dims ? [2, 1.4, 4.9] : [2, 1.4, 4.9], car }; return G; };
// ---------- characters ----------
PS.props.butcher = (o = {}) => { const H = PS.props.human(Object.assign({ build: 'heavy', height: 1.95, top: 'uniform', topColor: '#8ea4b8', bottom: 'slacks', bottomColor: '#3a3430', hair: 'messy', hairColor: '#4a3424', shoes: '#2a2018', wide: 1.12 }, o));
  H.userData = H.userData || {}; H.userData.mask = PS.props.skinMask(H, o); H.userData.apron = PS.props.apron(H, o); return H; };
PS.props.drifter = (o = {}) => PS.props.human(Object.assign({ build: 'adult', height: 1.8, wide: .82, hair: 'long', hairColor: '#2e2620', skin: '#c8a48a', top: 'jacket', topColor: '#7a4a2e', bottom: 'jeans', bottomColor: '#4a4a52', expression: 'smile' }, o));
PS.props.elder = (o = {}) => PS.props.human(Object.assign({ build: 'adult', height: 1.58, wide: .78, thick: .8, hair: 'bald', skin: '#c9b8a6', top: 'suit', topColor: '#3a3632', bottom: 'slacks', bottomColor: '#2e2a26', expression: 'blank' }, o));
for (const k of ['butcher', 'drifter', 'elder']) PS.props[k + 'View'] = o => { o = o || {}; const H = PS.props[k](o); H.pose(o.pose || 'stand', o.phase || 0); return H.G; };
})();
