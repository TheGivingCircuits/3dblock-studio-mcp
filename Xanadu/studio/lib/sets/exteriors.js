// SETS: EXTERIORS. SETS.building(kind, o) → { G, kind, anchors, doors, windows } facing +z (the front door side)
// kinds: farmhouse, suburban (a ranch house with a garage, lawn, picket fence, mailbox), cabin, motel (a row of numbered rooms, an office, a
// pole sign), church (clapboard, steeple, steps), barn (gambrel roof, sliding doors, hayloft, silo)
// o: { at, ry, lit: false | true | function of t (warm windows at night), paint, seed, life (birds, laundry, a dog bowl...) }
// And the land: SETS.woods(parent, rect, n, seed), SETS.corn(parent, rect, seed), SETS.countryRoad(o) (a whole road set: road, shoulders,
// poles and wires, fences, fields, trees, a sign, clouds and birds, with the keep-outs for its traffic lane).
(function () {
const S = SETS, T = S.T, { V, rng } = PS1, M = (t, o) => PS1.mat(t, o), add = PS1.add, box = PS1.box, cyl = PS1.cyl, grp = PS1.group, DS = S.DS;
const lit = (o, t) => typeof o.lit === 'function' ? o.lit(t) : o.lit ? 1 : 0;
T.winDark = PS1.tex(8, 8, q => { q.fillStyle = '#1e2630'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#4a5a6a'; q.fillRect(1, 1, 2, 1); q.fillStyle = '#e8e4d8'; q.fillRect(3, 0, 1, 8); q.fillRect(0, 3, 8, 1); });
T.winLit = PS1.tex(8, 8, q => { q.fillStyle = '#f0c870'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#c89040'; q.fillRect(0, 5, 8, 3); q.fillStyle = '#5a4a3a'; q.fillRect(3, 0, 1, 8); q.fillRect(0, 3, 8, 1); });
// a window that can glow: two stacked planes (dark by day, warm when lit), swapped by visibility each frame
const win = (B, x, y, z, w, h, ry = 0, o = {}) => { const g = grp(x, y, z, B.G); g.rotation.y = ry; const d = add(new THREE.PlaneGeometry(w, h), M(T.winDark), 0, 0, .02, g), l = add(new THREE.PlaneGeometry(w, h), M(T.winLit, { unlit: true }), 0, 0, .021, g); l.visible = false; l.userData.fx = 'glow';
  add(box(w + .12, .08, .08), M(T[o.trim || 'white']), 0, -h / 2 - .02, .04, g); add(box(w + .1, .06, .06), M(T[o.trim || 'white']), 0, h / 2, .03, g); if (o.shutters) for (const s of [-1, 1]) add(box(w * .45, h, .03), M(PS1.color(o.shutters)), s * (w * .75), 0, .03, g);
  B.windows.push({ d, l }); return g; };
// a gable roof over a w × d box from height h, ridge along x; pitch = rise / half-depth
const gable = (B, w, d, h, pitch, mat, over = .35, gableMat) => { const half = d / 2 + over, rise = pitch * (d / 2), len = Math.hypot(half, rise), ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) { const r = add(box(w + over * 2, .08, len), mat, 0, h + rise / 2 + .04, s * half / 2, B.G); r.rotation.x = s * ang; }
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rise); sh.lineTo(-d / 2, 0); for (const s of [-1, 1]) { const g = add(new THREE.ShapeGeometry(sh), gableMat, s * w / 2, h, 0, B.G); g.rotation.y = Math.PI / 2; g.material.side = THREE.DoubleSide; }
  return rise; };
const front = (B, w, h, mat, d) => { add(box(w, h, d), mat, 0, h / 2, 0, B.G); S.solids.push(B.G.children.at(-1)); };
// a front door on a hinge (pivot group), swung by SETS.openDoor-style rotation: B.doors[name].rotation.y
const door = (B, x, z, name = 'front', o = {}) => { const dw = o.w || .95, dh = o.h || 2.1, P = grp(x, o.y || 0, z, B.G); add(box(dw + .16, dh + .1, .06), M(T.white), 0, (dh + .1) / 2, .01, P); const pv = grp(-dw / 2, 0, .06, P);
  add(box(dw, dh, .05), M(PS1.color(o.color || '#5a3a24')), dw / 2, dh / 2, 0, pv); add(cyl(.03, .03, .06, 6), M(T.chrome), dw - .12, 1.0, .04, pv).rotation.x = Math.PI / 2; pv.userData = { side: 1 }; B.doors[name] = pv; B.anchors[name] = P.localToWorld(V(0, 0, .8)); return pv; };
const porch = (B, w, d, z, h = .4, roofH = 2.6, mat = T.white) => { S.solids.push(add(box(w, h, d), M(T.plank), 0, h / 2, z, B.G)); for (let i = 0; i < 3; i++) add(box(1.4, h / 3, .3), M(T.plank), 0, h / 3 * (i + .5), z + d / 2 + .15 + (2 - i) * .3, B.G);
  add(box(w + .2, .1, d + .2), M(T.shingle), 0, h + roofH, z, B.G); for (let x = -w / 2 + .1; x <= w / 2 - .1 + .01; x += (w - .2) / Math.max(1, Math.round(w / 2.2))) add(box(.12, roofH, .12), M(mat), x, h + roofH / 2, z + d / 2 - .1, B.G);
  for (const s of [-1, 1]) add(box(w / 2 - .7, .06, .06), M(mat), s * (w / 4 + .35), h + .85, z + d / 2 - .1, B.G); B.anchors.porch = B.G.localToWorld(V(0, h, z)); return h; };
const B0 = (kind, o) => { const G = grp(...(o.at || [0, 0, 0]), o.parent); G.rotation.y = o.ry || 0; G.updateMatrixWorld(true); return { G, kind, anchors: {}, doors: {}, windows: [], r: rng(o.seed || 21), o }; };
const BUILD = {
  farmhouse(o) { const B = B0('farmhouse', o), W = 8, D = 6.5, H = 5.6, m = M(T[o.paint || 'siding']); front(B, W, H, m, D); gable(B, W, D, H, .8, M(T.tin), .4, m); add(box(.7, 2.0, .7), M(T.brick), 2.4, H + 1.6, -.8, B.G);
    for (const x of [-2.6, 2.6]) { win(B, x, 1.5, D / 2, .9, 1.3, 0, { shutters: '#2a3a2a' }); win(B, x, 4.1, D / 2, .9, 1.3, 0, { shutters: '#2a3a2a' }); } win(B, 0, 4.1, D / 2, .9, 1.3, 0, { shutters: '#2a3a2a' }); for (const z of [-1.5, 1.5]) for (const y of [1.5, 4.1]) { win(B, W / 2, y, z, .9, 1.3, Math.PI / 2); win(B, -W / 2, y, z, .9, 1.3, -Math.PI / 2); }
    const ph = porch(B, W, 2.4, D / 2 + 1.2); door(B, 0, D / 2, 'front', { y: ph }); if (o.life !== false) { S.laundry(5.5, 1.9, D / 2 + 3, 2.4, .9, M(T.sheet, DS), B.G, 1); add(box(.04, 2, .04), M(T.wood), 4.3, 1, D / 2 + 3, B.G); add(box(.04, 2, .04), M(T.wood), 6.7, 1, D / 2 + 3, B.G); }
    if (window.PROPS) { const ch = PROPS.make('chair', { at: B.G.localToWorld(V(-2.4, ph, D / 2 + 1.0)).toArray(), ry: (o.ry || 0) + Math.PI, parent: PS1.scene }); } return B; },
  suburban(o) { const B = B0('suburban', o), W = 11, D = 7, H = 2.8, m = M(T[o.paint || 'sidingBlue']); front(B, W, H, m, D); gable(B, W, D, H, .45, M(T.shingle), .5, m); add(box(.8, 1.4, .8), M(T.brick), -3, H + 1.2, 0, B.G);
    for (const x of [-4.2, -1.8, 1.2]) win(B, x, 1.5, D / 2, 1.1, 1.0, 0, { shutters: '#ece8e0' }); door(B, -.2 - .1, D / 2, 'front', { color: '#8a2a1e' });
    const gd = grp(4.0, 0, D / 2 + .01, B.G); add(box(2.6, 2.2, .05), M(T.white), 0, 1.1, 0, gd); for (let y = .45; y < 2.2; y += .45) add(box(2.6, .02, .06), M(PS1.color('#c8c4bc')), 0, y, 0, gd); B.doors.garage = gd;
    S.ground(14, 6, M(T.lawn), 0, .01, D / 2 + 3, B.G); S.ground(3, 6, M(T.concrete), 4.0, .015, D / 2 + 3, B.G); S.ground(1.2, 5, M(T.concrete), -.3, .016, D / 2 + 2.5, B.G); S.fence(-7, -1.2, D / 2 + 5.8, B.G, 'picket'); S.fence(.6, 2.5, D / 2 + 5.8, B.G, 'picket');
    const mb = grp(-1.6, 0, D / 2 + 6.2, B.G); add(box(.08, 1.1, .08), M(T.wood), 0, .55, 0, mb); add(box(.22, .22, .45), M(PS1.color('#3a3a3c')), 0, 1.2, 0, mb); add(box(.03, .15, .03), M(PS1.color('#c42a1a')), .13, 1.3, .1, mb); B.anchors.mailbox = mb.localToWorld(V(0, 1.2, .3));
    if (o.life !== false) { S.bush(-5.5, D / 2 + .6, 1.0, B.G, 3); S.bush(2.2, D / 2 + .6, .9, B.G, 4); S.liveTree(-5.5, D / 2 + 4, 5.5, B.G, 9); } return B; },
  cabin(o) { const B = B0('cabin', o), W = 6, D = 5, H = 2.6, G = B.G, logs = M(T.wood); for (let y = .15; y < H; y += .3) { for (const s of [-1, 1]) { const l = add(cyl(.15, .15, W + .3, 6), logs, 0, y, s * D / 2, G); l.rotation.z = Math.PI / 2; const k = add(cyl(.15, .15, D + .3, 6), logs, s * W / 2, y, 0, G); k.rotation.x = Math.PI / 2; } }
    S.solids.push(add(box(W - .2, H, D - .2), M(T.boards), 0, H / 2, 0, G)); gable(B, W, D, H, .9, M(T.shingle), .5, logs); add(box(.9, H + 2.6, .9), M(T.stone), -W / 2 - .3, (H + 2.6) / 2, 0, G);
    win(B, 1.6, 1.4, D / 2 + .16, .8, .8, 0); win(B, W / 2 + .16, 1.4, 0, .8, .8, Math.PI / 2); const ph = porch(B, W, 1.8, D / 2 + .9, .3, 2.2, T.wood); door(B, -.8, D / 2 + .16, 'front', { y: ph, color: '#3a2618' });
    if (o.life !== false) { S.bugs(G, V(-.8, 2.4, D / 2 + .5), 5); const wp = grp(3.5, 0, 2.5, G); for (let i = 0; i < 6; i++) { const l = add(cyl(.12, .12, .5, 6), logs, (i % 3) * .26, .12 + Math.floor(i / 3) * .22, 0, wp); l.rotation.x = Math.PI / 2; } add(box(.3, .3, .3), M(T.wood), 4.5, .15, 3.2, G); } return B; },
  motel(o) { const B = B0('motel', o), n = o.rooms || 8, RW = 3.6, W = n * RW + 4, D = 6, H = 2.8, G = B.G, m = M(T[o.paint || 'cinder']);
    front(B, W, H, m, D); add(box(W + .6, .2, D + 2.2), M(T.shingle), 0, H + .1, .9, G); for (let i = 0; i <= n; i++) add(box(.12, H, .12), M(T.white), -W / 2 + 4 + i * RW - .1, H / 2, D / 2 + 1.8, G);
    S.ground(W, 1.8, M(T.concrete), 0, .12, D / 2 + .9, G); add(box(W, .12, 1.8), M(T.concrete), 0, .06, D / 2 + .9, G);
    for (let i = 0; i < n; i++) { const x = -W / 2 + 4 + i * RW + RW / 2, P = grp(x - .8, 0, D / 2, G); door({ ...B, G: P }, 0, 0, 'room' + (i + 1), { y: .12, color: o.doorColor || '#2a5a6a' });
      add(new THREE.PlaneGeometry(.22, .16), M(PS1.tex(8, 6, q => { q.fillStyle = '#c8a84a'; q.fillRect(0, 0, 8, 6); q.fillStyle = '#1a1a1a'; q.font = 'bold 6px Arial'; q.textAlign = 'center'; q.fillText(String(i + 1), 4, 5.5); })), 0, 2.25, .1, P); win(B, x + .8, 1.5, D / 2, 1.2, .9, 0); }
    win(B, -W / 2 + 2, 1.5, D / 2, 2.4, 1.2, 0); door(B, -W / 2 + 2, D / 2 + .01, 'office', { y: .12, color: '#e8e4d8' }); B.anchors.office = B.G.localToWorld(V(-W / 2 + 2, 0, D / 2 + 1));
    S.ground(W, 9, M(T.road), 0, .02, D / 2 + 6.3, G); for (let i = 0; i <= n; i++) S.ground(.1, 4, M(T.white, { tint: '#d8d4c8' }), -W / 2 + 4 + i * RW, .03, D / 2 + 4.5, G);
    const sg = grp(-W / 2 - 1.5, 0, D / 2 + 9, G); add(box(.25, 6.5, .25), M(T.chrome), 0, 3.25, 0, sg); add(box(2.6, 1.2, .3), M(PS1.tex(24, 10, q => { q.fillStyle = '#1e3a5a'; q.fillRect(0, 0, 24, 10); q.fillStyle = '#f0e0a0'; q.font = 'bold 7px Arial'; q.textAlign = 'center'; q.fillText('MOTEL', 12, 8); })), 0, 6.5, 0, sg);
    const vac = add(new THREE.PlaneGeometry(1.6, .35), M(PS1.tex(24, 6, q => { q.fillStyle = '#000'; q.fillRect(0, 0, 24, 6); q.fillStyle = '#ff3a3a'; q.font = 'bold 5px Arial'; q.textAlign = 'center'; q.fillText(o.vacancy === false ? 'NO VACANCY' : 'VACANCY', 12, 5); }), { unlit: true }), 0, 5.6, .16, sg); vac.userData.fx = 'glow'; B.vacancy = vac;
    if (o.life !== false) for (let i = 0; i < 3; i++) S.bugs(G, V(-W / 2 + 4 + i * RW * 2.5 + 1, 2.4, D / 2 + .6), 4); return B; },
  church(o) { const B = B0('church', o), W = 7, D = 12, H = 4.5, G = B.G, m = M(T[o.paint || 'siding']); front(B, W, H, m, D);
    // the roof's ridge runs front to back: build the gable in a group turned a quarter
    const rf = grp(0, 0, 0, G); rf.rotation.y = Math.PI / 2; gable({ ...B, G: rf }, D, W, H, 1.1, M(T.shingle), .3, m);
    const tw = grp(0, 0, D / 2 - 1.2, G); add(box(2.4, H + 3, 2.4), m, 0, (H + 3) / 2, 0, tw); add(new THREE.ConeGeometry(1.6, 4.5, 4), M(T.shingle), 0, H + 3 + 2.25, 0, tw).rotation.y = Math.PI / 4; add(box(.12, 1.2, .12), M(T.white), 0, H + 3 + 4.9, 0, tw); add(box(.6, .12, .12), M(T.white), 0, H + 3 + 5.1, 0, tw);
    for (const s of [-1, 1]) for (const z of [-3.6, -1.2, 1.2, 3.6]) win(B, s * (W / 2), 2.4, z, .9, 2.4, s * Math.PI / 2); win(B, 0, H + 1.6, D / 2 + 1.21, .7, .9, 0);
    door(B, -.5, D / 2 + .01, 'front', { w: 1.0, h: 2.6, y: .6, color: '#7a2a1e' }); door(B, .5, D / 2 + .01, 'front2', { w: 1.0, h: 2.6, y: .6, color: '#7a2a1e' }); B.doors.front2.rotation.y = 0; for (let i = 0; i < 3; i++) add(box(3.2, .2, .4), M(T.stone), 0, .1 + i * .2, D / 2 + 1.0 - i * .35, G);
    if (o.life !== false) { for (let i = 0; i < 5; i++) { const st = add(box(.5, .7, .12), M(T.stone), -6 + (i % 3) * 1.3, .35, 2 + Math.floor(i / 3) * 1.6 + (i % 2) * .3, G); st.rotation.y = (i - 2) * .06; } S.bird(G, V(0, H + 10, 0), 6, .25, 1, 1.4, 1.2); } return B; },
  barn(o) { const B = B0('barn', o), W = 9, D = 12, H = 4.2, G = B.G, m = M(T[o.paint || 'barnRed']); front(B, W, H, m, D);
    // a gambrel roof: steep lower slopes, shallow upper ones (ridge along z)
    for (const s of [-1, 1]) { const lo = add(box(.1, 2.4, D + .6), M(T.tin), s * (W / 2 - .45), H + 1.0, 0, G); lo.rotation.z = s * .38; const up = add(box(.1, 3.0, D + .6), M(T.tin), s * (W / 4 - .25), H + 2.75, 0, G); up.rotation.z = s * 1.12; }
    for (const z of [-D / 2, D / 2]) { const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2 - .9, 2.2); sh.lineTo(0, 3.6); sh.lineTo(-W / 2 + .9, 2.2); sh.lineTo(-W / 2, 0); const g = add(new THREE.ShapeGeometry(sh), m, 0, H, z, G); g.material.side = THREE.DoubleSide; }
    const dl = grp(-1.6, 0, D / 2 + .05, G), dr = grp(1.6, 0, D / 2 + .05, G); for (const [g, s] of [[dl, 1], [dr, -1]]) { add(box(1.6, 3.2, .08), m, s * .8, 1.6, 0, g); for (const [a, b] of [[0, 0], [1, 1]]) { const x = add(box(.1, 3.4, .06), M(T.white), s * .8, 1.6, .05, g); x.rotation.z = s * (b ? .45 : -.45); } add(box(1.6, .1, .06), M(T.white), s * .8, 3.15, .05, g); g.userData = { slide: s }; }
    B.doors.left = dl; B.doors.right = dr; add(box(1.4, 1.2, .08), m, 0, H + 1.4, D / 2 + .05, G); B.anchors.hayloft = G.localToWorld(V(0, H + 1.4, D / 2 + .3)); add(box(.12, .12, 1.4), M(T.rust), 0, H + 2.6, D / 2 + .7, G);
    const si = grp(W / 2 + 2.6, 0, -2, G); add(cyl(2.0, 2.0, 11, 10), M(T.tin), 0, 5.5, 0, si); add(new THREE.SphereGeometry(2.0, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), M(T.tin), 0, 11, 0, si);
    if (o.life !== false) { S.bale(-6, 4, .4, G); S.bale(-6.4, 6.5, 1.2, G); S.bird(G, V(0, H + 5, 0), 4, .4, 2, .7, 3.0); } B.anchors.inside = G.localToWorld(V(0, 0, D / 2 - 2)); return B; },
};
S.BUILDINGS = Object.keys(BUILD);
S.building = (kind, o = {}) => { const b = BUILD[kind]; if (!b) throw new Error(`SETS.building: no kind "${kind}" (${S.BUILDINGS.join(', ')})`); const B = b(o); B.G.name = kind;
  // windows glow when lit (o.lit: true, or a function of t such as night falling)
  if (o.lit != null) S.fx.push(t => { const on = lit(o, t) > .5; for (const w of B.windows) { w.l.visible = on; w.d.visible = !on; } }); return B; };
// ---- the land
S.woods = (parent, [x0, x1, z0, z1], n, seed = 31, o = {}) => { const r = rng(seed), L = []; for (let i = 0, k = 0; i < n && k < n * 8; k++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (S.kept(x, z) || (o.keep && !o.keep(x, z))) continue; i++;
    const kind = r(), h = 5 + r() * 6; L.push(kind < (o.pines ?? .55) ? S.pineTree(x, z, h, parent, seed + i) : kind < .9 ? S.liveTree(x, z, h * .8, parent, seed + i, S.fx, { dark: true }) : S.deadTree(x, z, h * .7, parent, seed + i)); if (r() < .4) S.bush(x + 1.5, z + .5, .7 + r() * .6, parent, seed + i); if (r() < .15) S.rock(x - 1, z + 1, .4 + r() * .5, parent, seed + i); }
  if (o.floor !== false) S.ground(x1 - x0, z1 - z0, M(T.mud), (x0 + x1) / 2, .005, (z0 + z1) / 2, parent); return L; };
// a cornfield: rows of tall stalks that sway, a row gap every few rows (the classic chase)
T.corn = PS1.mip(PS1.tex(8, 32, (q, w, h, r) => { q.fillStyle = '#5a7a2a'; q.fillRect(3, 0, 2, h); for (let y = 4; y < h; y += 5) { q.fillStyle = r() < .5 ? '#7a9a3a' : '#a8a050'; q.fillRect(r() < .5 ? 0 : 5, y, 3, 2); } q.fillStyle = '#c8b050'; q.fillRect(2, 0, 4, 3); }));
S.corn = (parent, [x0, x1, z0, z1], seed = 41, o = {}) => { const r = rng(seed), m = M(T.corn, DS), L = [], gap = o.gapEvery || 6; for (let x = x0, row = 0; x <= x1; x += .8, row++) { if (row % gap === gap - 1) continue; for (let z = z0; z <= z1; z += .55) { if (S.kept(x, z)) continue;
    const s = add(new THREE.PlaneGeometry(.7, 2.4), m, x + (r() - .5) * .2, 1.2, z, parent); s.rotation.y = r() * 3; s.userData.ph = r() * 6; s.userData.noCheck = true; L.push(s); } }
  S.fx.push(t => { for (const s of L) { const g = S.gust(s.position.x, s.position.z, t); s.rotation.z = -(.03 + .08 * g) + .03 * Math.sin(t * 2.4 + s.userData.ph); } }); if (o.floor !== false) S.ground(x1 - x0 + 1, z1 - z0 + 1, M(T.mud), (x0 + x1) / 2, .005, (z0 + z1) / 2, parent); return L; };
// a whole country road set along z through (x, z): o = { len, x, z, seed, poles, fence, sign, woods, fields, farm, clouds, birds, dirt }
S.countryRoad = (o = {}) => { const G = grp(o.x || 0, 0, o.z || 0, o.parent), len = o.len || 120, seed = o.seed || 51, r = rng(seed), half = (o.width || 6.4) / 2;
  S.ground(len * 1.6, len, M(T.grass), 0, 0, 0, G); S.road(0, 0, len, 'z', G, { seed, dirt: o.dirt, width: o.width }); G.updateMatrixWorld(true);
  const lane = [G.localToWorld(V(-half - 1, 0, -len / 2)), G.localToWorld(V(half + 1, 0, len / 2))]; S.keepOut([lane[0].x, lane[1].x, lane[0].z, lane[1].z], 'the road and its shoulders');
  if (o.poles !== false) S.poles([...Array(Math.floor(len / 30))].map((_, i) => V(half + 3.2, 0, -len / 2 + 15 + i * 30)), 'z', G);
  if (o.fence !== false) for (const s of [-1, 1]) for (let z = -len / 2 + 4; z < len / 2 - 4; z += 30) { const f = grp(s * (half + 6.5), 0, z + 13, G); f.rotation.y = Math.PI / 2; S.barbFence(-13, 13, 0, f); }
  if (o.fields !== false) for (const s of [-1, 1]) S.field(G, o.grass || 700, seed + (s > 0 ? 1 : 2), s < 0 ? [-len * .7, -half - 1.4, -len / 2, len / 2] : [half + 1.4, len * .7, -len / 2, len / 2], (x, z) => Math.abs(x) > half + 1.2);
  if (o.sign !== false) S.sign(-half - 1.6, len * .2, 0, G, o.sign || 'curve');
  if (o.woods) S.woods(G, [-len * .7, -half - 14, -len / 2, len / 2], o.woods, seed + 3, { floor: false });
  for (let i = 0; i < (o.trees ?? 6); i++) { const s = r() < .5 ? -1 : 1, x = s * (half + 9 + r() * 30), z = (r() - .5) * len * .9; r() < .3 ? S.deadTree(x, z, 4 + r() * 3, G, seed + i) : S.liveTree(x, z, 5 + r() * 4, G, seed + i); }
  if (o.farm) { const f = S.building(o.farm === true ? 'farmhouse' : o.farm, { at: G.localToWorld(V(-half - 30, 0, -len * .1)).toArray(), ry: Math.PI / 2, lit: o.lit }); S.windmill(-half - 22, -len * .1 - 14, .6, G); S.cow(-half - 18, len * .1, 1.2, G, 0); S.cow(-half - 21, len * .12, 2.3, G, 2); }
  if (o.clouds !== false) S.clouds(0, 0, G, seed);
  if (o.birds !== false) { S.bird(G, V(-20, 22, 10), 14, .18, 0, 1.5, 1.4); S.bird(G, V(25, 26, -15), 18, -.15, 2, 1.5, 1.4); }
  return { G, len, half, lane }; };
})();
