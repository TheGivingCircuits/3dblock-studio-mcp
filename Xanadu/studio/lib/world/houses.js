// WORLD: HOUSES. One parametric house builder and its presets, all placed with WORLD.put(preset, o) and all repaintable with o.paint:
//   small-house, ranch (suburban one storey with a garage), two-story, big-house (colonial, hip roof, double garage, dormers), cabin (logs,
//   stone chimney), a-frame, row-house (city brownstone with a stoop, sits wall to wall), apartments (city block, fire escape, rooftop),
//   corner-store (apartments over a shop front), trailer (a mobile home on blocks)
// o (any preset): { at, ry, paint, seed, lit, wall ('siding' | 'board' | 'brick' | 'stucco' | 'logs' | 'shingleWall'), stories, w, d, roof ('gable' |
//   'hip' | 'flat' | 'aframe'), ridge ('x' along the front | 'z' front gable), pitch, porch, garage ('left' | 'right'), chimney, shutters, life }
// A piece returns { G, anchors: { front, door, porch, garage, driveway, back, roof, window0.. }, doors: { front, back, garage }, windows, solids }.
// Doors are hinge pivots (userData.slab + hinge) for PHYS.door; WORLD.openDoor(p, 'front', k) swings one by hand, WORLD.openGarage(p, k) rolls it up.
// Inside is a dark box, so an open door or a broken window shows a dark house, never the sky through the back wall.
(function () {
const S = SETS, W = WORLD, { V } = PS1, add = PS1.add, grp = PS1.group, b = W.b, TILE = .8;
// a flat polygon (3+ points, counter-clockwise seen from outside) with UVs in metres / TILE, so textures keep their scale on any shape
const poly = (pts, ds = true) => { const g = new THREE.BufferGeometry(), p0 = pts[0], e1 = pts[1].clone().sub(p0).normalize(), n = pts[1].clone().sub(p0).cross(pts[2].clone().sub(p0)).normalize(), e2 = n.clone().cross(e1);
  const pos = [], uv = []; for (let i = 1; i + 1 < pts.length; i++) for (const q of [p0, pts[i], pts[i + 1]]) { pos.push(q.x, q.y, q.z); const d = q.clone().sub(p0); uv.push(d.dot(e1) / TILE, d.dot(e2) / TILE); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; };
W.poly = poly;
const wallPlane = (G, len, h, m, x, y, z, ry) => { const o = add(PS1.plane(len, h, len / TILE, h / TILE, 2), m, x, y, z, G); o.rotation.y = ry; return o; };
// a face of the house: a group on the wall, local +z pointing out, x along the wall (front: x right; back: x left; right side: x back...)
const FACE = (w, d) => ({ front: [0, d / 2, 0, w], back: [0, -d / 2, Math.PI, w], right: [w / 2, 0, Math.PI / 2, d], left: [-w / 2, 0, -Math.PI / 2, d] });
const face = (H, name, y0 = 0) => { const [x, z, ry, len] = FACE(H.w, H.d)[name], g = grp(H.ox + (name === 'front' || name === 'back' ? 0 : x), y0, H.oz + (name === 'front' || name === 'back' ? z : 0), H.G); g.rotation.y = ry; g.userData.len = len; return g; };
// ---- windows: frame, sill, cross muntins, dark glass and a lit pane on top (swapped by WORLD.lightWindows), optional shutters and a blind
function windowAt(H, F, u, y, ww = .9, wh = 1.2, o = {}) { const P = H.paint, g = grp(u, y, 0, F), trim = W.col(P.trim), dk = add(new THREE.PlaneGeometry(ww, wh), W.mat(W.T.winDark), 0, 0, .02, g);
  const lt = add(new THREE.PlaneGeometry(ww, wh), W.mat(o.blind ? W.T.winBlind : W.T.winLit, { unlit: true }), 0, 0, .024, g); lt.visible = false; lt.userData.fx = 'glow';
  b(g, ww + .14, .07, .06, trim, 0, wh / 2 + .02, .04); b(g, ww + .2, .06, .14, trim, 0, -wh / 2 - .03, .07); for (const s of [-1, 1]) b(g, .07, wh, .06, trim, s * (ww / 2 + .02), 0, .04);
  if (o.muntins !== false) { b(g, .035, wh, .03, trim, 0, 0, .035); b(g, ww, .035, .03, trim, 0, o.split ?? 0, .035); }
  if (o.shutters) for (const s of [-1, 1]) { const sh = b(g, ww * .42, wh + .04, .04, W.paintMat('board', P.shutters), s * (ww * .74 + .03), 0, .05); sh.userData.noCheck = true; }
  if (o.ac) { b(g, ww * .7, .38, .5, W.col('#c8c4b8'), 0, -wh / 2 + .2, .25); b(g, ww * .6, .26, .02, W.col('#5a5a58'), 0, -wh / 2 + .2, .51); }
  const win = { d: dk, l: lt, g, at: g.getWorldPosition ? null : null }; H.windows.push(win); return win; }
// the windows of one wall: evenly spaced, every floor, skipping the spans in o.skip ([[u0, u1, floor]])
function windowsOn(H, name, o = {}) { const F = face(H, name), len = F.userData.len, sp = o.spacing || 2.3, n = Math.max(1, Math.floor((len - .8) / sp)), out = [];
  for (let f = 0; f < H.stories; f++) { const y = H.found + f * H.sh + (o.sill ?? 1.45), us = o.cols || [...Array(n)].map((_, i) => (i - (n - 1) / 2) * (len - .8) / n);
    for (const u of us) { if ((o.skip || []).some(([a, c, fl]) => (fl == null || fl === f) && u > a && u < c)) continue; out.push(windowAt(H, F, u, y, o.ww || .9, o.wh || 1.2, { shutters: o.shutters, blind: H.r() < .3, ac: o.ac && H.r() < .25, muntins: o.muntins })); } }
  return out; }
// ---- a door on the front face (or any face): frame, a hinged slab (panel texture, knob), a transom, a step stack down to the ground
function doorOn(H, name, u, o = {}) { const F = face(H, name), P = H.paint, dw = o.w || .95, dh = o.h || 2.1, y0 = o.y ?? H.found, trim = W.col(P.trim), g = grp(u, y0, 0, F);
  b(g, dw + .2, dh + .12, .08, trim, 0, (dh + .12) / 2, .02); add(new THREE.PlaneGeometry(dw, dh), W.col('#14100c'), 0, dh / 2, .065, g);
  const pv = grp(-dw / 2, 0, .1, g), slab = b(pv, dw - .02, dh - .02, .05, W.paintMat('door', o.color || P.door), dw / 2, dh / 2, 0); W.c(pv, .03, .03, .07, 6, W.col('#c8b070'), dw - .14, 1.0, .04).rotation.x = Math.PI / 2;
  if (o.glass) add(new THREE.PlaneGeometry(dw * .5, .35), W.mat(W.T.winDark), dw / 2, dh - .35, .03, pv);
  pv.userData = { slab, side: 1, hinge: () => pv.getWorldPosition(V(0, 0, 0)) }; H.doors[o.name || name] = pv;
  if (o.transom !== false) b(g, dw, .22, .03, W.mat(W.T.winDark), 0, dh + .2, .03);
  if (o.number) { b(g, .26, .12, .02, W.col('#2a2622'), dw / 2 + .3, dh - .2, .04); }
  // steps down from the floor to the ground, as solids (people climb them; props land on them)
  const n = Math.round(y0 / .18); for (let i = 0; i < n; i++) { const st = W.solid(F, dw + .5, y0 - i * .18, .32, W.col(o.stepCol || '#9a948a'), u, (y0 - i * .18) / 2, .16 + i * .32 + (o.stepZ || 0)); st.userData.step = true; }
  if (o.mat !== false) add(new THREE.PlaneGeometry(.8, .45), W.col('#5a4a32'), 0, .006, .4, g).rotation.x = -Math.PI / 2;
  F.updateMatrixWorld(true); H.anchors[(o.name || name) === 'front' ? 'door' : (o.name || name)] = F.localToWorld(V(u, y0, .55)); if ((o.name || name) === 'front') H.anchors.front = F.localToWorld(V(u, 0, .4 + n * .32 + .6)); return pv; }
// ---- roofs over a w × d body whose top is at y = top. pitch = rise per metre; over = eave overhang
function roof(H, kind, top, o = {}) { const { w, d } = H, G = H.G, pitch = o.pitch ?? .5, over = o.over ?? .4, rm = W.paintMat(o.roofTex || 'shingle', H.paint.roof, W.DS), gm = H.wallMat, X = H.ox, Z = H.oz, out = { kind };
  const trim = W.col(H.paint.trim), ridgeX = (o.ridge || 'x') === 'x', A = ridgeX ? w : d, Bd = ridgeX ? d : w, R = (a, bb, y) => ridgeX ? V(X + a, y, Z + bb) : V(X + bb, y, Z + a);
  if (kind === 'flat') { const t = b(G, w + .2, .25, d + .2, W.paintMat('tar', '#3a3836'), X, top + .12, Z); S.solids.push(t); if (o.parapet !== false) for (const [sx, sz, lw, ld] of [[0, 1, w + .3, .2], [0, -1, w + .3, .2], [1, 0, .2, d + .3], [-1, 0, .2, d + .3]]) b(G, lw, .6, ld, gm, X + sx * (w / 2 + .05), top + .3, Z + sz * (d / 2 + .05));
    if (o.parapet !== false) b(G, w + .5, .14, d + .5, trim, X, top + .66, Z); else b(G, w + .3, .12, d + .3, trim, X, top + .2, Z); out.peak = top + .7; return out; }
  const half = Bd / 2, rise = pitch * half, yR = top + rise, eY = top - pitch * over;
  if (kind === 'aframe' || kind === 'gable') { const e = half + over;
    for (const s of [-1, 1]) { const pts = [R(-A / 2 - over, s * e, eY), R(A / 2 + over, s * e, eY), R(A / 2 + over, 0, yR), R(-A / 2 - over, 0, yR)]; if (s < 0 !== !ridgeX) pts.reverse(); add(poly(pts), rm, 0, .02, 0, G);
      // fascia board along the eave, a gutter, and the edge thickness
      const f = W.span(G, R(-A / 2 - over, s * e, eY - .02), R(A / 2 + over, s * e, eY - .02), .09, trim); f.userData.noCheck = true; if (o.gutters !== false) W.span(G, R(-A / 2 - over, s * (e + .05), eY - .1), R(A / 2 + over, s * (e + .05), eY - .1), .08, W.col(W.shade(H.paint.trim, -.15))); }
    W.span(G, R(-A / 2 - over, 0, yR + .06), R(A / 2 + over, 0, yR + .06), .12, W.paintMat('shingle', W.shade(H.paint.roof, -.2)));
    // the gable ends: wall triangles (or the whole A-frame face)
    for (const s of [-1, 1]) { const tri = kind === 'aframe' ? [R(s * A / 2, -half, top), R(s * A / 2, half, top), R(s * A / 2, 0, yR)] : [R(s * A / 2, -half, top), R(s * A / 2, half, top), R(s * A / 2, 0, yR)]; if ((s > 0) === ridgeX) tri.reverse(); add(poly(tri), gm, 0, 0, 0, G);
      if (o.vent !== false && kind === 'gable') { const v = R(s * (A / 2 + .03), 0, top + rise * .45); const vg = grp(v.x, v.y, v.z, G); vg.rotation.y = ridgeX ? s * Math.PI / 2 : (s > 0 ? 0 : Math.PI); b(vg, .5, .4, .04, trim); for (let i = 0; i < 4; i++) b(vg, .42, .03, .05, W.col(W.shade(H.paint.trim, -.35)), 0, -.13 + i * .09, .01); }
      for (const k of [-1, 1]) W.span(G, R(s * (A / 2 + over), k * (half + over), eY), R(s * (A / 2 + over), 0, yR + .02), .1, trim); }
    out.peak = yR; out.rise = rise; return out; }
  if (kind === 'hip') { const e = half + over, rl = Math.max(0, A / 2 - half), ex = A / 2 + over, Ry = (a) => R(a, 0, yR);
    const faces = [[R(-ex, e, eY), R(ex, e, eY), Ry(rl), Ry(-rl)], [R(ex, -e, eY), R(-ex, -e, eY), Ry(-rl), Ry(rl)], [R(ex, e, eY), R(ex, -e, eY), Ry(rl)], [R(-ex, -e, eY), R(-ex, e, eY), Ry(-rl)]];
    for (const f of faces) add(poly(ridgeX ? f : f.reverse()), rm, 0, .02, 0, G);
    for (const [p, q] of [[R(-ex, e, eY), R(ex, e, eY)], [R(ex, e, eY), R(ex, -e, eY)], [R(ex, -e, eY), R(-ex, -e, eY)], [R(-ex, -e, eY), R(-ex, e, eY)]]) W.span(G, p.add(V(0, -.03, 0)), q.add(V(0, -.03, 0)), .1, trim);
    if (rl > 0) W.span(G, Ry(-rl).add(V(0, .05, 0)), Ry(rl).add(V(0, .05, 0)), .12, W.paintMat('shingle', W.shade(H.paint.roof, -.2)));
    // the soffit under the overhang (seen from below)
    b(G, w + 2 * over, .02, d + 2 * over, W.col(W.shade(H.paint.trim, -.1)), X, eY - .01, Z); out.peak = yR; out.rise = rise; return out; }
  return out; }
// a dormer on the roof slope: a small box with its own gable and a window
function dormer(H, u, top, rise) { const G = H.G, g = grp(H.ox + u, top + rise * .25, H.oz + H.d / 2 - .9, G), m = H.wallMat; b(g, 1.3, 1.2, 1.4, m, 0, .6, 0);
  const tri = [V(-.75, 1.2, .72), V(.75, 1.2, .72), V(0, 1.75, .72)]; add(poly(tri), m, 0, 0, 0, g); for (const s of [-1, 1]) { const sl = b(g, .9, .06, 1.6, W.paintMat('shingle', H.paint.roof), s * .38, 1.48, -.05); sl.rotation.z = -s * .65; }
  const F = grp(0, 0, .71, g); F.userData.len = 1.3; windowAt(H, F, 0, .62, .6, .75, {}); }
// ---- the shell: foundation, four walls (textured planes, so siding keeps its scale), a dark inside, the collider, a sill band, corner boards
function shell(H) { const { w, d, G } = H, top = H.found + H.stories * H.sh, m = H.wallMat, X = H.ox, Z = H.oz;
  b(G, w + .06, H.found + .02, d + .06, W.mat(H.o.foundTex || 'concrete'), X, H.found / 2, Z);
  for (const [nm, [x, z, ry, len]] of Object.entries(FACE(w, d))) { if (H.o.noWall === nm) continue; wallPlane(G, len, top - H.found, m, X + x * 1.0, (top + H.found) / 2, Z + z * 1.0, ry); }
  const inside = b(G, w - .12, top - H.found - .04, d - .12, W.col('#14110e', { side: THREE.BackSide }), X, (top + H.found) / 2, Z); inside.userData.noCheck = true;
  if (H.o.corners !== false && H.o.wall !== 'brick' && H.o.wall !== 'logs') for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b(G, .12, top - H.found, .12, W.col(H.paint.trim), X + sx * (w / 2 + .01), (top + H.found) / 2, Z + sz * (d / 2 + .01));
  if (H.stories > 1 && H.o.band !== false) for (let f = 1; f < H.stories; f++) for (const [x, z, ln, ry] of [[0, d / 2 + .02, w, 0], [0, -d / 2 - .02, w, 0], [w / 2 + .02, 0, d, Math.PI / 2], [-w / 2 - .02, 0, d, Math.PI / 2]]) { const bd = b(G, ln + .08, .12, .04, W.col(H.paint.trim), X + x, H.found + f * H.sh, Z + z); bd.rotation.y = ry; }
  // the collider: the whole body as one solid (in world space, for PHYS and the set dresser)
  G.updateMatrixWorld(true); const c = G.localToWorld(V(X, top / 2, Z)); S.solids.push({ size: [w, top, d], at: [c.x, c.y, c.z], ry: new THREE.Euler().setFromQuaternion(G.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y, house: true }); return top; }
// logs instead of flat walls: stacked round logs with crossed corners (the cabin)
function logWalls(H, top) { const { w, d, G } = H, m = W.paintMat('logs', H.paint.body), end = W.col(W.shade(H.paint.body, .25));
  for (let y = H.found + .15, i = 0; y < top; y += .28, i++) for (const s of [-1, 1]) { const l = W.c(G, .15, .15, w + .5, 6, m, H.ox, y, H.oz + s * d / 2); l.rotation.z = Math.PI / 2; const k = W.c(G, .15, .15, d + .5, 6, m, H.ox + s * w / 2, y + .14, H.oz); k.rotation.x = Math.PI / 2; for (const t of [-1, 1]) { const e = W.c(G, .15, .15, .02, 6, end, H.ox + t * (w / 2 + .25), y, H.oz + s * d / 2); e.rotation.z = Math.PI / 2; } } }
// a porch across (part of) the front: deck (solid), posts, railing, its own shed roof, steps
function porch(H, o) { const G = H.G, P = H.paint, pw = o.w || H.w, pd = o.d || 2.2, x = H.ox + (o.x || 0), z = H.oz + H.d / 2 + pd / 2, y = H.found, trim = W.col(P.trim), deck = W.mat('plank');
  W.solid(G, pw, y, pd, deck, x, y / 2, z); const ph = o.h || 2.6, rz = z + pd / 2 - .12, posts = Math.max(2, Math.round(pw / 2.3) + 1);
  for (let i = 0; i < posts; i++) { const px = x - pw / 2 + .12 + i * (pw - .24) / (posts - 1); b(G, .14, ph, .14, trim, px, y + ph / 2, rz); }
  const sl = b(G, pw + .3, .08, pd + .35, W.paintMat('shingle', P.roof), x, y + ph + .1, z + .1); sl.rotation.x = .12; b(G, pw + .3, .16, .1, trim, x, y + ph - .02, rz + .1);
  if (o.rail !== false) for (const s of [-1, 1]) { const a = x + s * pw / 2 - s * .12, c = x + s * .9; W.span(G, V(Math.min(a, c), y + .85, rz), V(Math.max(a, c), y + .85, rz), .07, trim); for (let px = Math.min(a, c) + .12; px < Math.max(a, c); px += .14) b(G, .035, .75, .035, trim, px, y + .45, rz); }
  H.anchors.porch = W.at(H, x, y, z); H.porchTop = y + ph; return { x, z, pd }; }
// an attached garage beside the house: its own box, a low roof, a roll-up door that can open
function garage(H, side, o = {}) { const G = H.G, P = H.paint, gw = o.w || 3.6, gd = o.d || H.d - .4, gh = 2.7, s = side === 'left' ? -1 : 1, x = H.ox + s * (H.w / 2 + gw / 2), z = H.oz + (H.d - gd) / 2;
  const sub = { ...H, w: gw, d: gd, ox: x, oz: z, stories: 1, sh: gh - .1, found: .1, windows: H.windows, doors: H.doors, anchors: {}, o: { ...H.o, noWall: null, band: false } }; shell(sub);
  roof(sub, o.roof || 'gable', .1 + gh - .1, { pitch: .35, ridge: 'x', over: .3 }); const F = grp(x, 0, z + gd / 2 + .02, G), trim = W.col(P.trim);
  b(F, 2.6, 2.2, .06, trim, 0, 1.1, 0); add(new THREE.PlaneGeometry(2.4, 2.1), W.col('#100c0a'), 0, 1.05, .035, F); const gd0 = grp(0, 2.15, .07, F);
  for (let i = 0; i < 5; i++) { b(gd0, 2.4, .41, .04, W.col(W.shade(P.trim, -.04)), 0, -.21 - i * .42, 0); b(gd0, 2.3, .03, .05, W.col(W.shade(P.trim, -.2)), 0, -.42 - i * .42, 0); }
  for (let i = 0; i < 4; i++) b(gd0, .4, .22, .02, W.mat(W.T.winDark), -.9 + i * .6, -.3, .03); gd0.userData = { kind: 'overhead', h: 2.1 }; H.doors.garage = gd0;
  // the driveway in front of it
  S.ground(gw - .2, o.drive ?? 6, W.mat('concrete'), x, .012, z + gd / 2 + (o.drive ?? 6) / 2, G); H.anchors.garage = W.at(H, x, 0, z + gd / 2 + .6); H.anchors.driveway = W.at(H, x, 0, z + gd / 2 + (o.drive ?? 6) - 1); return { x, gw }; }
// a chimney: brick from the ground up past the roof (side) or out of the ridge (centre)
function chimney(H, where, peak) { const G = H.G, m = W.paintMat('brick', H.o.chimneyCol || '#7a3e2c'); if (where === 'center') { b(G, .7, 1.4, .7, m, H.ox + H.w * .2, peak + .2, H.oz - .3); b(G, .8, .1, .8, W.col('#5a5450'), H.ox + H.w * .2, peak + .92, H.oz - .3); H.anchors.chimney = W.at(H, H.ox + H.w * .2, peak + 1, H.oz - .3); return; }
  const s = where === 'left' ? -1 : 1, x = H.ox + s * (H.w / 2 + .35), h = peak + .9; W.solid(G, .7, h, 1.0, m, x, h / 2, H.oz); b(G, .8, .1, 1.1, W.col('#5a5450'), x, h + .05, H.oz); H.anchors.chimney = W.at(H, x, h + .1, H.oz); }
// small life on the outside: bushes under the front windows, a downspout at each front corner, a meter, an outside tap, an AC unit
function details(H, top, o = {}) { const G = H.G, X = H.ox, Z = H.oz, dk = W.col(W.shade(H.paint.trim, -.15));
  for (const s of [-1, 1]) b(G, .08, top - .1, .08, dk, X + s * (H.w / 2 - .1), top / 2, Z + H.d / 2 + .12);
  b(G, .2, .3, .12, W.col('#8a8c8e'), X + H.w / 2 - .8, 1.3, Z - H.d / 2 - .06); W.c(G, .03, .03, .1, 6, W.col('#a8884a'), X - H.w / 2 + 1, .5, Z + H.d / 2 + .05).rotation.x = Math.PI / 2;
  if (o.ac !== false) { const ac = W.solid(G, .75, .7, .75, W.col('#b8b8b0'), X + H.w / 2 + .55, .35, Z - H.d / 4); b(G, .6, .02, .6, W.col('#3a3a38'), X + H.w / 2 + .55, .71, Z - H.d / 4); ac.userData.hum = true; }
  if (o.life !== false && window.SETS && S.bush) { const n = Math.max(2, Math.floor(H.w / 3)); for (let i = 0; i < n; i++) { const u = -H.w / 2 + .8 + i * (H.w - 1.6) / Math.max(1, n - 1); if (Math.abs(u - (H.doorU || 0)) < 1.1) continue; S.bush(X + u, Z + H.d / 2 + .55, .7 + H.r() * .3, G, H.seed + i); } } }

// ---- the builder. Returns the piece fields for WORLD.put
function house(G, o, p) { const H = Object.assign(p, { G, w: o.w, d: o.d, stories: o.stories, sh: o.storyH || 2.8, found: o.found ?? .45, ox: 0, oz: 0, o, doorU: o.doorU ?? 0 });
  H.wallMat = W.paintMat(o.wall || 'siding', H.paint.body); if (o.wall === 'logs') H.wallMat = W.paintMat('board', W.shade(H.paint.body, -.15));
  const top = o.wall === 'logs' ? (shell(H), H.found + H.stories * H.sh) : shell(H); if (o.wall === 'logs') logWalls(H, top);
  if (o.porch) porch(H, o.porch === true ? {} : o.porch); if (o.garage) garage(H, o.garage, o.garageO || {});
  const skipDoor = [H.doorU - .9, H.doorU + .9, 0], sides = o.sideWindows ?? true;
  windowsOn(H, 'front', { skip: [skipDoor, ...(o.skipFront || [])], shutters: o.shutters, spacing: o.spacing, cols: o.frontCols, ww: o.ww, wh: o.wh, ac: o.ac });
  if (sides) { windowsOn(H, 'left', { spacing: 3, ww: .8, wh: 1.1 }); windowsOn(H, 'right', { spacing: 3, ww: .8, wh: 1.1, skip: o.garage === 'right' ? [[-99, 99, 0]] : [] }); }
  if (o.backWindows !== false) windowsOn(H, 'back', { spacing: 2.8, ww: .8, wh: 1.0, skip: [[-.7, .7, 0]] });
  doorOn(H, 'front', H.doorU, { glass: o.doorGlass, number: true, stepZ: o.porch ? (o.porch.d || 2.2) : 0, y: H.found });
  if (o.backDoor !== false) doorOn(H, 'back', 0, { name: 'back', transom: false, mat: false });
  const R = roof(H, o.roof || 'gable', top, { pitch: o.pitch, ridge: o.ridge, over: o.over, roofTex: o.roofTex, parapet: o.parapet }); H.anchors.roof = W.at(H, 0, R.peak, 0);
  for (let i = 0; i < (o.dormers || 0); i++) dormer(H, (i - (o.dormers - 1) / 2) * 3, top, R.rise || 1);
  if (o.chimney) chimney(H, o.chimney, R.peak); details(H, top, o);
  H.anchors.back = W.at(H, 0, 0, -H.d / 2 - 2); H.anchors.yard = W.at(H, 0, 0, -H.d / 2 - 6); H.anchors.lawn = W.at(H, H.w * .3, 0, H.d / 2 + 4);
  // porch light beside the front door (a WORLD fixture: lit with the house, or by its own switch)
  if (o.porchLight !== false && W.light) { const pl = W.light('porch-light', { at: W.at(H, H.doorU + .75, H.found + 1.9, H.d / 2 + .05).toArray(), ry: G.rotation.y, switch: o.porchSwitch, lit: o.lit ?? false }); H.lights.push(pl); H.porchLight = pl; }
  G.updateMatrixWorld(true); H.windows.forEach((w, i) => H.anchors['window' + i] = w.g.getWorldPosition(V(0, 0, 0))); H.top = top; return {}; }
W.house = house;

// ---- presets. Every number here is a default; a scene overrides any of them in WORLD.put(preset, { ... })
const def = (id, name, params, paint, tags = []) => W.def(id, { kind: 'house', name, params, paint, tags, build: house });
def('small-house', 'Small one-storey house', { w: 7, d: 6, stories: 1, roof: 'gable', ridge: 'z', pitch: .75, porch: { w: 2.6, d: 1.6 }, shutters: true, doorU: -1.2, frontCols: [1.5], ww: 1.1, wh: 1.2 }, 'butter', ['suburb', 'small', 'rural']);
def('ranch', 'Suburban ranch house with a garage', { w: 11, d: 7.5, stories: 1, roof: 'gable', ridge: 'x', pitch: .42, garage: 'right', shutters: true, doorU: -.6, frontCols: [-4.1, -2.3, 1.4, 3.6], ww: 1.1, wh: 1.1, chimney: 'center' }, 'sky', ['suburb']);
def('two-story', 'Two-storey house with a front porch', { w: 9, d: 7.5, stories: 2, roof: 'gable', ridge: 'x', pitch: .6, porch: true, shutters: true, chimney: 'left', frontCols: [-2.9, 0, 2.9], doorU: 0 }, 'sage', ['suburb', 'big']);
def('big-house', 'Big colonial house, hip roof, double garage', { w: 14, d: 9, stories: 2, roof: 'hip', pitch: .45, garage: 'left', garageO: { w: 6.2 }, porch: { w: 4.2, d: 2.2 }, shutters: true, dormers: 0, chimney: 'right', frontCols: [-5.5, -3.3, 3.3, 5.5], doorU: 0, doorGlass: true, wh: 1.4 }, 'white', ['suburb', 'big', 'rich']);
def('cabin', 'Log cabin with a stone chimney', { w: 6.5, d: 5.5, stories: 1, wall: 'logs', roof: 'gable', ridge: 'x', pitch: .9, found: .3, porch: { d: 1.8, h: 2.2 }, chimney: 'left', chimneyCol: '#7a7468', corners: false, frontCols: [1.8], ww: .8, wh: .8, ac: false, life: false, doorU: -.8 }, 'logs', ['woods', 'rural', 'small']);
def('a-frame', 'A-frame cabin', { w: 6, d: 7, stories: 1, storyH: .9, wall: 'board', roof: 'aframe', ridge: 'z', pitch: 1.9, over: .25, found: .5, frontCols: [], sideWindows: false, ac: false, life: false, porchLight: true, doorU: 0 }, 'tan', ['woods', 'small']);
def('shed', 'Garden shed', { w: 3, d: 2.4, stories: 1, storyH: 2.1, wall: 'board', roof: 'gable', ridge: 'z', pitch: .55, found: .12, frontCols: [], sideWindows: false, backWindows: false, backDoor: false, porchLight: false, ac: false, life: false, doorU: 0 }, 'barn', ['yard', 'rural', 'woods']);
def('trailer', 'Mobile home on blocks', { w: 14, d: 4.2, stories: 1, storyH: 2.4, wall: 'board', roof: 'flat', found: .7, frontCols: [-4.5, -2.3, 2.5, 4.6], ww: 1.0, wh: .8, doorU: .6, ac: false, porchLight: true, corners: true, parapet: false, foundTex: 'tin' }, 'cream', ['rural', 'small']);
W.def('row-house', { kind: 'house', name: 'City row house with a stoop', paint: 'brownstone', tags: ['city'], params: { w: 5.6, d: 11, stories: 3, wall: 'brick', roof: 'flat', found: 1.4, frontCols: [-1.4, 1.4], sideWindows: false, doorU: -1.4, ww: .95, wh: 1.6, ac: true, life: false, corners: false, band: true },
  build(G, o, p) { house(G, { ...o, skipFront: [[-2.3, -.5, 0]] }, p); const P = p.paint, trim = W.col(P.trim);
    // a cornice across the top and iron stoop rails
    b(G, o.w + .3, .35, .5, trim, 0, p.top + .5, o.d / 2 + .15); for (let i = 0; i < 8; i++) b(G, .12, .22, .3, trim, -o.w / 2 + .35 + i * (o.w - .7) / 7, p.top + .22, o.d / 2 + .1);
    for (const s of [-1, 1]) W.span(G, V(-1.4 + s * .7, o.found + 1.0, o.d / 2 + .1), V(-1.4 + s * .7, 1.0, o.d / 2 + .1 + Math.round(o.found / .18) * .32), .05, W.col('#1a1a1a')); return {}; } });
// apartments: a brick block of `stories` floors and `bays` windows across, a flat roof with a water tank, a fire escape, a canopy over the door
W.def('apartments', { kind: 'house', name: 'City apartment block', paint: 'brick', tags: ['city', 'big'], params: { w: 16, d: 12, stories: 5, storyH: 3, wall: 'brick', roof: 'flat', found: .3, spacing: 2.0, ww: 1.0, wh: 1.5, sideWindows: true, doorU: 0, ac: true, life: false, corners: false, porchLight: false },
  build(G, o, p) { house(G, o, p); const P = p.paint, iron = W.col('#1e1e20'), trim = W.col(P.trim), z = o.d / 2;
    const cn = grp(0, 0, z + .02, G); b(cn, 2.4, .12, 1.6, W.col(P.door), 0, o.found + 2.6, .8); for (const s of [-1, 1]) W.span(cn, V(s * 1.1, o.found + 2.6, 1.55), V(s * 1.1, o.found + 3.4, .05), .04, iron);
    // the fire escape: a landing per floor above the first, zig-zag ladders between them
    const fx = o.w / 2 - 3; for (let f = 1; f < o.stories; f++) { const y = o.found + f * o.storyH; b(G, 3.2, .06, 1.1, iron, fx, y, z + .6); for (const s of [-1, 1]) W.span(G, V(fx + s * 1.6, y + .9, z + 1.15), V(fx + s * 1.6, y, z + 1.15), .03, iron); W.span(G, V(fx - 1.6, y + .9, z + 1.15), V(fx + 1.6, y + .9, z + 1.15), .03, iron);
      if (f + 1 < o.stories) { const a = V(fx - 1.2 + (f % 2) * 2.4, y + .05, z + .6), c = V(fx + 1.2 - (f % 2) * 2.4, y + o.storyH, z + .6); W.span(G, a.clone().add(V(0, 0, -.3)), c.clone().add(V(0, 0, -.3)), .04, iron); W.span(G, a.clone().add(V(0, 0, .3)), c.clone().add(V(0, 0, .3)), .04, iron);
        for (let k = 1; k < 9; k++) { const q = a.clone().lerp(c, k / 9); W.span(G, q.clone().add(V(0, 0, -.3)), q.clone().add(V(0, 0, .3)), .03, iron); } } }
    // the roof: a water tank on legs, vents, an AC box
    const rt = p.top + .25, tk = grp(-o.w / 4, rt, -o.d / 5, G); for (const [a, c] of [[-.7, -.7], [.7, -.7], [-.7, .7], [.7, .7]]) b(tk, .1, 1.6, .1, iron, a, .8, c); W.c(tk, 1.0, 1.0, 1.8, 10, W.paintMat('board', '#6a4a30'), 0, 2.5, 0); const cone = add(new THREE.ConeGeometry(1.1, .7, 10), W.col('#3a3836'), 0, 3.75, 0, tk);
    b(G, 1.6, .9, 1.2, W.col('#a8a8a0'), o.w / 4, rt + .45, o.d / 5); for (let i = 0; i < 3; i++) W.c(G, .12, .12, .6, 6, W.col('#8a8a88'), -o.w / 2 + 2 + i * 2.5, rt + .3, o.d / 3); p.anchors.rooftop = W.at(p, 0, rt, 0); return {}; } });
// a corner store: the apartment block with a shop front (big glass, an awning, a made-up sign) on the ground floor
W.def('corner-store', { kind: 'house', name: 'Corner store with flats above', paint: 'brick', tags: ['city'], params: { w: 10, d: 10, stories: 3, storyH: 3, wall: 'brick', roof: 'flat', found: .15, spacing: 2.2, ww: 1, wh: 1.4, doorU: 2.8, ac: true, life: false, corners: false, porchLight: false, sign: 'CORNER MART' },
  build(G, o, p) { house(G, { ...o, skipFront: [[-99, 99, 0]] }, p); const P = p.paint, z = o.d / 2;
    const glass = add(new THREE.PlaneGeometry(6, 2.0), W.mat(W.T.winDark), -1.4, 1.35, z + .03, G), lit = add(new THREE.PlaneGeometry(6, 2.0), W.mat(PS1.tex(16, 8, q => { q.fillStyle = '#f0e0b0'; q.fillRect(0, 0, 16, 8); q.fillStyle = '#c84a3a'; q.fillRect(1, 5, 4, 3); q.fillStyle = '#3a6a9a'; q.fillRect(6, 4, 3, 4); q.fillStyle = '#e8c040'; q.fillRect(11, 5, 4, 3); }), { unlit: true }), -1.4, 1.35, z + .034, G);
    lit.visible = false; p.windows.push({ d: glass, l: lit, g: glass }); b(G, 6.2, .1, .1, W.col(P.trim), -1.4, 2.4, z + .06); b(G, 6.2, .1, .1, W.col(P.trim), -1.4, .3, z + .06);
    // the awning: striped cloth sloping out over the sidewalk
    const aw = b(G, 7, .05, 1.4, W.mat(PS1.tex(16, 8, q => { for (let x = 0; x < 16; x += 4) { q.fillStyle = '#2a6a3a'; q.fillRect(x, 0, 2, 8); q.fillStyle = '#ece8dc'; q.fillRect(x + 2, 0, 2, 8); } })), -.9, 2.85, z + .7); aw.rotation.x = .35;
    const sign = add(new THREE.PlaneGeometry(4.6, .6), W.mat(PS1.tex(48, 8, q => { q.fillStyle = '#1a2a3a'; q.fillRect(0, 0, 48, 8); q.fillStyle = '#f0d070'; q.font = 'bold 7px Arial'; q.textAlign = 'center'; q.fillText(o.sign, 24, 7); }), { unlit: true }), -1.2, 3.5, z + .04, G); sign.userData.fx = 'glow';
    p.anchors.shop = W.at(p, -1.4, 0, z + 1.5); return {}; } });
// placing a house from a saved world: { type: 'house', preset, at, ry, paint, seed, ...overrides }
W.PLACE.house = (e, c) => W.put(e.preset, { ...e, parent: c.parent, lit: e.lit ?? (c.lit && c.lit.each ? c.lit.each() : c.lit), name: e.uid });
// open a door by hand (0 shut .. 1 open, inward), or roll up a garage door (0..1)
W.openDoor = (p, name, k) => { const d = p.doors[name]; if (d) d.rotation.y = -k * 1.55; };
// the overhead door swings up on its top edge and back into the garage, ending flat under the ceiling
W.openGarage = (p, k) => { const g = p.doors.garage; if (!g) return; g.position.y = 2.15; g.rotation.x = k * 1.5; };
})();
