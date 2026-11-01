// SETS: VEHICLES. SETS.vehicle(kind, o) → a Group facing -z (front) with userData:
//   wheels [meshes], doors { FL, FR, RL, RR, back... } (pivot groups: SETS.openDoor(v, 'FL', k)), lights { head: [meshes], tail: [meshes] },
//   seats [{ at: [x, y, z] local hip point, ry, seat }] for CAST 'sit' / 'drive', wheel (steering-wheel local point), len, width, wheelR
// kinds: 'van' (the 70s panel van, hollow), 'pickup', 'sedan', 'wagon', 'police', 'bus' (school bus, hollow, bench seats), 'motorbike'
// o: { at: [x, y, z], ry, paint (a texture key or '#hex'), wrecked: true | seed, lights: true (adds headlight practicals), parent }
// Cars are hollow: hood, trunk, floor, doors, pillars, roof and seats, so people can sit in them and the camera can ride inside. Side windows are
// rolled down; the windshield and back glass are dark glass with a glint. Wrecks: rust, a dropped wheel, a popped hood, a hanging door, a
// cracked windshield and a lean. SETS.drive(v, t, path, o) moves one along a path with wheel spin, steering, suspension and dust.
(function () {
const S = SETS, T = S.T, { V, rng } = PS1, M = (t, o) => PS1.mat(t, o), add = PS1.add, box = PS1.box, cyl = PS1.cyl, grp = PS1.group, DS = S.DS;
const paintOf = p => !p ? null : p[0] === '#' ? PS1.color(p) : T[p];
T.crackGlass = PS1.tex(16, 16, (q, w, h, r) => { q.fillStyle = '#26303a'; q.fillRect(0, 0, w, h); q.fillStyle = '#b8c8d0'; for (let k = 0; k < 6; k++) { let x = 8, y = 7; const a = k * 1.05 + r() * .4; for (let i = 0; i < 8; i++) { q.fillRect(x | 0, y | 0, 1, 1); x += Math.cos(a) * 1.1; y += Math.sin(a) * 1.1; } } });
T.rustPaint = PS1.tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a4a32'; q.fillRect(0, 0, w, h); PS1.noise(q, w, h, r, '#3e2416', 90, .9); PS1.noise(q, w, h, r, '#9a6a3a', 60, .7); PS1.noise(q, w, h, r, '#5a6a5a', 20, .6); });
T.glint = PS1.tex(16, 16, q => { q.fillStyle = '#ffffff'; for (let i = 2; i < 12; i++) q.fillRect(i, 15 - i, 1, 1); });
const wheelsAt = (G, pts, r, w = .22) => pts.map(([x, z]) => { const p = grp(x, r, z, G), t = add(cyl(r, r, w, 8), M(T.tyre), 0, 0, 0, p); t.rotation.z = Math.PI / 2; add(cyl(r * .5, r * .5, w + .01, 6), M(T.chrome), 0, 0, 0, p).rotation.z = Math.PI / 2; p.userData.r = r; return p; });
// a door: a pivot group on the hinge (front edge), the panel hanging back from it; open with SETS.openDoor
const door = (G, side, z0, len, y0, h, mat, x, winH = 0, frame) => { const pv = grp(x, 0, z0, G), s = side; add(box(.05, h, len), mat, 0, y0 + h / 2, len / 2, pv);
  if (winH) { add(box(.04, .05, len), frame || mat, 0, y0 + h + winH, len / 2, pv); add(box(.04, winH, .05), frame || mat, 0, y0 + h + winH / 2, len - .03, pv); }
  add(box(.03, .03, .1), M(T.chrome), s * .03, y0 + h * .8, len - .18, pv); pv.userData = { side: s, open: 0 }; return pv; };
S.openDoor = (v, name, k) => { const d = v.userData.doors[name]; if (!d) return; const s = d.userData.side, back = d.userData.back; d.rotation.y = back ? -s * k * 1.9 : s * k * 1.15; d.userData.open = k; };

// the generic hollow car: hood, cabin, trunk; spec in metres along z (front at -L/2)
function car(o, spec) { const G = grp(...(o.at || [0, 0, 0]), o.parent), r = spec.wheelR || .36, L = spec.L, W = spec.W, y0 = r * .9, bh = spec.bodyH || .55, wr = o.wreck;
  const P = M(wr ? T.rustPaint : paintOf(o.paint) || T[spec.paint]), P2 = spec.paint2 ? M(T[spec.paint2]) : P, C = M(T.chrome), K = M(T.black), zF = spec.zF, zB = spec.zB, ch = spec.cabinH || .5, top = y0 + bh;
  // hood and trunk (solid), floor, firewall, rear seat back, roof, pillars
  const hood = grp(0, top, zF, G); add(box(W, spec.hoodH || .12, -L / 2 - zF + .05), P, 0, -(spec.hoodH || .12) / 2 + .02, (-L / 2 - zF) / 2, hood); hood.userData.hinge = true;
  add(box(W, bh - .1, -L / 2 - zF), P, 0, y0 + (bh - .1) / 2, (-L / 2 + zF) / 2, G); if (spec.trunk !== false) add(box(W, bh, L / 2 - zB), P2, 0, y0 + bh / 2, (L / 2 + zB) / 2, G);
  add(box(W - .1, .06, zB - zF), M(T.seat), 0, y0 + .05, (zF + zB) / 2, G); add(box(W - .1, .06, .06), K, 0, top - .02, zF + .04, G);
  add(box(W * .96, .05, zB - zF + (spec.roofExtra || 0)), P, 0, top + ch, (zF + zB + (spec.roofExtra || 0)) / 2 + .05, G);
  for (const s of [-1, 1]) { const a = add(box(.06, ch + .05, .08), P, s * W * .47, top + ch / 2, zF + .12, G); a.rotation.x = -.35; add(box(.06, ch, .08), P, s * W * .47, top + ch / 2, zB - .04, G); if (spec.doors === 4) add(box(.06, ch, .08), P, s * W * .47, top + ch / 2, (zF + zB) / 2 + .1, G); }
  // windshield and back glass: dark, a glint; cracked on a wreck
  const ws = add(new THREE.PlaneGeometry(W * .92, ch * 1.08), M(wr ? T.crackGlass : T.glass, DS), 0, top + ch / 2, zF + .12, G); ws.rotation.x = -.35; const gl = add(new THREE.PlaneGeometry(W * .4, ch * .5), M(T.glint, { unlit: true, side: THREE.DoubleSide, tint: '#9a9282' }), -.2, top + ch / 2, zF + .1, G); gl.rotation.x = -.35; gl.userData.fx = 'glint';
  add(new THREE.PlaneGeometry(W * .92, ch), M(T.glass, DS), 0, top + ch / 2, zB - .03, G);
  // dash and steering wheel, seats
  add(box(W - .12, .18, .25), K, 0, top - .08, zF + .2, G); const sw = add(new THREE.TorusGeometry(.17, .022, 4, 10), K, -W * .23, top + .02, zF + .48, G); sw.rotation.x = -.5;
  const seats = [], seatRow = (z, bench) => { for (const s of bench ? [0] : [-1, 1]) { const x = bench ? 0 : s * W * .23, w = bench ? W - .2 : W * .38; add(box(w, .14, .5), M(T.seat), x, y0 + .3, z, G); add(box(w, .55, .1), M(T.seat), x, y0 + .58, z + .27, G); } };
  seatRow(zF + .95, spec.bench); seats.push({ at: [-W * .23, y0 + .37, zF + .92], ry: Math.PI, seat: y0 + .37, driver: true }, { at: [W * .23, y0 + .37, zF + .92], ry: Math.PI, seat: y0 + .37 });
  if (spec.doors === 4 || spec.rearSeat) { seatRow(zF + 1.95, true); seats.push({ at: [-W * .25, y0 + .37, zF + 1.92], ry: Math.PI, seat: y0 + .37 }, { at: [W * .25, y0 + .37, zF + 1.92], ry: Math.PI, seat: y0 + .37 }); }
  // doors
  const doors = {}, dl = spec.doors === 4 ? (zB - zF) / 2 - .05 : Math.min(1.25, zB - zF - .2);
  for (const s of [-1, 1]) { const n = s < 0 ? 'L' : 'R'; doors['F' + n] = door(G, s, zF + .12, dl, y0 + .12, bh - .14, P, s * W / 2, ch * .9); if (spec.doors === 4) doors['R' + n] = door(G, s, zF + .17 + dl, dl, y0 + .12, bh - .14, P, s * W / 2, ch * .9);
    else add(box(.05, bh - .14, zB - zF - dl - .12), P, s * W / 2, y0 + .12 + (bh - .14) / 2, zF + .12 + dl + (zB - zF - dl - .12) / 2, G); }
  // bumpers, lights, grille
  add(box(W + .04, .14, .1), C, 0, y0 + .08, -L / 2 - .03, G); add(box(W + .04, .14, .1), C, 0, y0 + .08, L / 2 + .03, G); add(box(W * .5, bh * .45, .02), M(T.chrome), 0, y0 + bh * .5, -L / 2 - .005, G);
  const head = [-1, 1].map(s => add(box(.22, .14, .04), M(T.headlight, { unlit: !wr }), s * W * .36, y0 + bh * .55, -L / 2 - .01, G)), tail = [-1, 1].map(s => add(box(.18, .1, .03), M(T.tail, { unlit: !wr }), s * W * .4, y0 + bh * .6, L / 2 + .01, G));
  const wl = L / 2 - (spec.axle || .8), wheels = wheelsAt(G, [[-W / 2 + .08, -wl], [W / 2 - .08, -wl], [-W / 2 + .08, wl], [W / 2 - .08, wl]], r);
  G.userData = { kind: o.kind, wheels, front: wheels.slice(0, 2), doors, hood, lights: { head, tail }, seats, wheel: [-W * .23, top + .02, zF + .48], len: L, width: W, wheelR: r, body: G, y0, top };
  return G; }

const BUILD = {
  sedan: o => car(o, { L: 5.2, W: 1.95, zF: -.75, zB: 1.25, doors: 4, paint: 'maroon', axle: .95, cabinH: .5 }),
  wagon: o => { const G = car(o, { L: 5.4, W: 1.98, zF: -.85, zB: 2.35, doors: 4, paint: 'cream', axle: .95, rearSeat: true, trunk: false, cabinH: .52 });
    for (const s of [-1, 1]) add(box(.02, .3, 4.0), M(T.wagonWood), s * 1.0, G.userData.y0 + .3, .65, G); add(box(1.9, .55, .06), M(T.wagonWood), 0, G.userData.y0 + .3, 2.68, G); add(box(1.8, .04, 2.6), M(T.chrome), 0, G.userData.top + .58, 1.0, G); return G; },
  police: o => { const G = car(o, { L: 5.2, W: 1.95, zF: -.75, zB: 1.25, doors: 4, paint: 'copBlack', axle: .95 }), d = G.userData;
    for (const n of ['FL', 'FR', 'RL', 'RR']) d.doors[n].children[0].material = M(T.copWhite); const bar = grp(0, d.top + .55, .2, G); add(box(1.2, .12, .25), M(T.chrome), 0, 0, 0, bar);
    d.lights.bar = [-1, 1].map(s => add(box(.5, .12, .22), M(PS1.color(s < 0 ? '#e02020' : '#2050e0'), { unlit: true }), s * .32, .1, 0, bar)); add(box(.6, .2, .3), M(T.black), 0, d.y0 + .3, -2.55, G); return G; },
  pickup: o => { const r = .38, G = grp(...(o.at || [0, 0, 0]), o.parent), wr = o.wreck, B = M(wr ? T.rustPaint : paintOf(o.paint) || T.blue), y0 = r * .9;
    add(box(1.8, .7, 1.6), B, 0, y0 + .4, -1.9, G); add(box(1.8, .75, 1.2), B, 0, y0 + .4, -.6, G); add(box(1.75, .6, 1.25), B, 0, y0 + 1.07, -.55, G); add(box(1.72, .45, .02), M(wr ? T.crackGlass : T.glass), 0, y0 + 1.07, -1.19, G); add(box(1.72, .4, .02), M(T.glass), 0, y0 + 1.1, .09, G);
    add(box(1.8, .1, 2.6), M(T.boards), 0, y0 + .32, 1.4, G); for (const s of [-1, 1]) add(box(.08, .5, 2.6), B, s * .88, y0 + .6, 1.4, G); const gate = grp(0, y0 + .35, 2.7, G); add(box(1.8, .5, .08), B, 0, .25, 0, gate); gate.userData = { side: 1, back: true };
    add(box(1.84, .14, .1), M(T.chrome), 0, y0 + .15, -2.72, G); const head = [-1, 1].map(s => add(box(.2, .14, .04), M(T.headlight, { unlit: !wr }), s * .62, y0 + .5, -2.71, G)), tail = [-1, 1].map(s => add(box(.12, .18, .03), M(T.tail, { unlit: !wr }), s * .84, y0 + .6, 2.75, G));
    const doors = {}; for (const s of [-1, 1]) doors[s < 0 ? 'FL' : 'FR'] = door(G, s, -1.15, 1.05, y0 + .05, .72, B, s * .91, .5); doors.gate = gate;
    add(box(1.6, .14, .5), M(T.seat), 0, y0 + .32, -.45, G); add(box(1.6, .5, .1), M(T.seat), 0, y0 + .6, -.15, G); add(box(1.6, .18, .25), M(T.black), 0, y0 + .75, -1.05, G); const sw = add(new THREE.TorusGeometry(.17, .022, 4, 10), M(T.black), -.42, y0 + .85, -.8, G); sw.rotation.x = -.5;
    const wheels = wheelsAt(G, [[-.85, -2.0], [.85, -2.0], [-.85, 1.6], [.85, 1.6]], r);
    G.userData = { kind: 'pickup', wheels, front: wheels.slice(0, 2), doors, lights: { head, tail }, seats: [{ at: [-.42, y0 + .39, -.48], ry: Math.PI, seat: y0 + .39, driver: true }, { at: [.42, y0 + .39, -.48], ry: Math.PI, seat: y0 + .39 }, { at: [0, y0 + .37, 1.6], ry: 0, seat: y0 + .37, bed: true }],
      wheel: [-.42, y0 + .85, -.8], len: 5.5, width: 1.8, wheelR: r, y0, top: y0 + .75 }; return G; },
  // the 70s panel van, hollow like the Hitchhiker's: a long box with front seats, crates in the back, rear double doors
  van: o => { const G = grp(...(o.at || [0, 0, 0]), o.parent), wr = o.wreck, B = M(wr ? T.rustPaint : paintOf(o.paint) || T.olive, DS), r = .36, y0 = .45;
    S.plane(1.9, 4.6, M(T.boards, DS), 0, y0, 0, -Math.PI / 2, 0, G); S.plane(1.9, 4.6, B, 0, 2.05, 0, -Math.PI / 2, 0, G); for (const s of [-1, 1]) { S.plane(3.4, 1.6, B, s * .95, 1.25, .6, 0, s * Math.PI / 2, G); add(box(.04, .06, 1.2), B, s * .95, 2.02, -1.7, G); }
    S.plane(1.9, .8, B, 0, .85, -2.3, 0, 0, G); S.plane(1.9, .8, M(wr ? T.crackGlass : T.glass, DS), 0, 1.65, -2.3, 0, 0, G); const gl = S.plane(.9, .6, M(T.glint, { unlit: true, side: THREE.DoubleSide, tint: '#9a9282' }), -.35, 1.65, -2.33, 0, 0, G); gl.userData.fx = 'glint';
    add(box(1.92, .3, .1), M(T.chrome), 0, .45, -2.35, G); const head = [-1, 1].map(s => add(box(.22, .16, .04), M(T.headlight, { unlit: !wr }), s * .65, .75, -2.33, G)), tail = [-1, 1].map(s => add(box(.1, .25, .03), M(T.tail, { unlit: !wr }), s * .85, .9, 2.31, G));
    const doors = {}; for (const s of [-1, 1]) { const pv = grp(s * .95, 0, -2.3, G); S.plane(1.2, 1.6, B, 0, 1.25, .6, 0, s * Math.PI / 2, pv); pv.userData = { side: s }; doors[s < 0 ? 'FL' : 'FR'] = pv; }
    for (const s of [-1, 1]) { const pv = grp(s * .95, 0, 2.3, G); S.plane(.95, 1.6, B, -s * .475, 1.25, 0, 0, 0, pv); pv.userData = { side: -s, back: true }; doors[s < 0 ? 'BL' : 'BR'] = pv; }
    for (const s of [-1, 1]) { add(box(.5, .14, .5), M(T.seat), s * .45, .76, -1.45, G); add(box(.5, .55, .1), M(T.seat), s * .45, 1.05, -1.18, G); }
    add(box(1.8, .18, .3), M(T.black), 0, 1.15, -2.1, G); const sw = add(new THREE.TorusGeometry(.17, .022, 4, 10), M(T.black), -.45, 1.22, -1.85, G); sw.rotation.x = -.5;
    if (!o.empty) for (const [cx, cz] of [[.6, .2], [-.6, .2], [.6, 1.15], [-.6, 1.15]]) add(box(.42, .45, .5), M(T.wood), cx, .675, cz, G);
    const wheels = wheelsAt(G, [[-.9, -1.5], [.9, -1.5], [-.9, 1.6], [.9, 1.6]], r);
    G.userData = { kind: 'van', wheels, front: wheels.slice(0, 2), doors, lights: { head, tail }, seats: [{ at: [-.45, .83, -1.48], ry: Math.PI, seat: .83, driver: true }, { at: [.45, .83, -1.48], ry: Math.PI, seat: .83 }, { at: [.6, .9, .2], ry: -Math.PI / 2, seat: .9, crate: true }, { at: [-.6, .9, 1.15], ry: Math.PI / 2, seat: .9, crate: true }],
      wheel: [-.45, 1.22, -1.85], len: 4.7, width: 1.9, wheelR: r, y0, top: 2.05 }; return G; },
  // the school bus: hollow, a row of windows each side, bench seats down an aisle, a folding front door
  bus: o => { const G = grp(...(o.at || [0, 0, 0]), o.parent), wr = o.wreck, Y = M(wr ? T.rustPaint : T.busYellow, DS), K = M(T.black, DS), r = .5, y0 = .75, L = 10, W = 2.4, H = 2.0;
    S.plane(W, L, M(T.lino, DS), 0, y0, 0, -Math.PI / 2, 0, G); S.plane(W, L, Y, 0, y0 + H, 0, Math.PI / 2, 0, G);
    for (const s of [-1, 1]) { S.plane(L, .95, Y, s * W / 2, y0 + .48, 0, 0, s * Math.PI / 2, G); S.plane(L, .45, Y, s * W / 2, y0 + H - .22, 0, 0, s * Math.PI / 2, G); for (let z = -L / 2 + 1.6; z <= L / 2 - .3; z += .82) add(box(.06, .65, .1), Y, s * W / 2, y0 + 1.3, z, G);
      add(box(.02, .08, L), K, s * (W / 2 + .01), y0 + .95, 0, G); add(box(.02, .08, L), K, s * (W / 2 + .01), y0 + .55, 0, G); }
    S.plane(W, H, Y, 0, y0 + H / 2, L / 2, 0, Math.PI, G); add(box(W, 1.0, 1.4), Y, 0, y0 + .2, -L / 2 - .7, G); S.plane(W * .92, .8, M(wr ? T.crackGlass : T.glass, DS), 0, y0 + 1.4, -L / 2 + .02, 0, 0, G); S.plane(W, .55, Y, 0, y0 + .5, -L / 2, 0, 0, G);
    const head = [-1, 1].map(s => add(box(.22, .22, .04), M(T.headlight, { unlit: !wr }), s * .9, y0 + .35, -L / 2 - 1.41, G)), tail = [-1, 1].map(s => add(box(.18, .18, .03), M(T.tail, { unlit: !wr }), s * 1.0, y0 + 1.6, L / 2 + .01, G));
    add(box(W + .06, .2, .12), K, 0, y0 - .25, -L / 2 - 1.42, G); add(box(W + .06, .2, .12), K, 0, y0 - .25, L / 2 + .06, G); add(new THREE.PlaneGeometry(1.4, .22), M(PS1.tex(32, 6, q => { q.fillStyle = '#e8a820'; q.fillRect(0, 0, 32, 6); q.fillStyle = '#111'; q.font = 'bold 5px Arial'; q.textAlign = 'center'; q.fillText('SCHOOL BUS', 16, 5); })), 0, y0 + H - .15, -L / 2 - .01, G).rotation.y = Math.PI;
    const doors = {}; const dv = grp(W / 2, 0, -L / 2 + .3, G); add(box(.05, 1.8, .7), M(T.glass), 0, y0 + .9, .35, dv); dv.userData = { side: 1 }; doors.FR = dv;
    const seats = []; for (let z = -L / 2 + 1.8; z < L / 2 - .5; z += .82) for (const s of [-1, 1]) { add(box(.95, .12, .42), M(T.seat), s * .68, y0 + .42, z, G); add(box(.95, .5, .08), M(T.seat), s * .68, y0 + .7, z + .22, G); seats.push({ at: [s * .68, y0 + .49, z - .03], ry: Math.PI, seat: y0 + .49 }); }
    add(box(.5, .14, .5), M(T.seat), -.7, y0 + .42, -L / 2 + .9, G); seats.unshift({ at: [-.7, y0 + .49, -L / 2 + .87], ry: Math.PI, seat: y0 + .49, driver: true }); const sw = add(new THREE.TorusGeometry(.22, .025, 4, 10), K, -.7, y0 + .95, -L / 2 + .45, G); sw.rotation.x = -1.0;
    const wheels = wheelsAt(G, [[-1.1, -L / 2 + .2], [1.1, -L / 2 + .2], [-1.1, L / 2 - 1.6], [1.1, L / 2 - 1.6]], r, .3);
    G.userData = { kind: 'bus', wheels, front: wheels.slice(0, 2), doors, lights: { head, tail }, seats, wheel: [-.7, y0 + .95, -L / 2 + .45], len: L + 1.4, width: W, wheelR: r, y0, top: y0 + H }; return G; },
  motorbike: o => { const G = grp(...(o.at || [0, 0, 0]), o.parent), wr = o.wreck, P = M(wr ? T.rustPaint : paintOf(o.paint) || PS1.color('#2a2a2c')), C = M(T.chrome), K = M(T.black), r = .32, lean = grp(0, 0, 0, G);
    const wheels = wheelsAt(lean, [[0, -.72], [0, .72]], r, .12); add(box(.08, .08, 1.3), C, 0, .5, 0, lean); add(box(.26, .2, .5), P, 0, .78, -.2, lean); add(box(.24, .1, .6), K, 0, .78, .3, lean);
    add(box(.3, .3, .35), C, 0, .45, -.05, lean); const fork = add(box(.05, .7, .05), C, 0, .65, -.62, lean); fork.rotation.x = .35; add(box(.7, .04, .04), C, 0, 1.0, -.5, lean); const head = [add(cyl(.08, .08, .05, 8), M(T.headlight, { unlit: !wr }), 0, .9, -.68, lean)]; head[0].rotation.x = Math.PI / 2;
    const tail = [add(box(.1, .06, .03), M(T.tail, { unlit: !wr }), 0, .8, .65, lean)]; add(box(.04, .04, .5), C, .14, .35, .35, lean);
    if (wr) { lean.rotation.z = Math.PI / 2 - .12; lean.position.y = .12; }
    G.userData = { kind: 'motorbike', wheels, front: wheels.slice(0, 1), doors: {}, lights: { head, tail }, seats: [{ at: [0, .82, .25], ry: Math.PI, seat: .82, driver: true, straddle: true }], wheel: [0, 1.0, -.5], len: 2.1, width: .7, wheelR: r, y0: .3, top: 1.0, lean }; return G; },
};
// the wreck pass: a wheel gone (the corner dropped), the hood popped, a door hanging, a lean, junk inside. Deterministic from the seed
const wreck = (G, seed) => { const r = rng(seed), d = G.userData; if (d.kind === 'motorbike') return G; const i = r() * d.wheels.length | 0, w = d.wheels[i]; w.visible = false; const dropFront = i < 2, dropLeft = w.position.x < 0;
  G.userData.tilt = [dropFront ? -.06 : .06, 0, dropLeft ? .05 : -.05]; G.rotation.x = G.userData.tilt[0]; G.rotation.z = G.userData.tilt[2]; G.position.y -= .08;
  if (d.hood) d.hood.rotation.x = -.5 - r() * .3; const dn = Object.keys(d.doors).filter(k => k !== 'gate'); if (dn.length) S.openDoor(G, dn[r() * dn.length | 0], .3 + r() * .4);
  for (const w2 of d.wheels) if (w2 !== w) w2.rotation.x = (r() - .5) * .3; return G; };
S.vehicle = (kind, o = {}) => { const b = BUILD[kind]; if (!b) throw new Error(`SETS.vehicle: no kind "${kind}" (${Object.keys(BUILD).join(', ')})`); const G = b({ ...o, kind, wreck: !!o.wrecked });
  if (o.ry) G.rotation.y = o.ry; if (o.wrecked) wreck(G, typeof o.wrecked === 'number' ? o.wrecked : 7); G.userData.kind = kind; G.name = kind; S.vehicles.push(G); for (const [n, d] of Object.entries(G.userData.doors)) S.swings.push({ kind: kind === 'bus' ? 'busDoor' : 'carDoor', obj: d, ref: G });
  if (o.lights) for (const h of G.userData.lights.head) LIGHTS.practical({ name: `${kind}.headlight`, fixture: 'headlights', in: () => h.getWorldPosition(V(0, 0, 0)), aim: () => h.getWorldPosition(V(0, 0, 0)).add(V(0, -.3, -6).applyQuaternion(G.quaternion)), stops: o.lightStops ?? -1 });
  if (o.lights && G.userData.lights.bar) G.userData.lights.bar.forEach((b, i) => LIGHTS.practical({ name: `police.bar${i}`, fixture: 'police', phase: i, in: () => b.getWorldPosition(V(0, 0, 0)), gel: i ? 'blue' : 'red', stops: o.lightStops ?? -1.5 }));
  // the body as a static solid for physics (props bounce off a parked car), unless it drives
  if (o.solid) S.solids.push(...G.children.filter(c => c.isMesh && c.geometry.type === 'BoxGeometry').slice(0, 2)); return G; };
// SETS.drive(v, t, path, o): place a vehicle on path(t) (a function of t → Vector3 on the ground), facing along it, wheels spinning by distance,
// front wheels steering into the turn, the body pitching and rolling on its suspension (PHYS.suspension) and a little road buzz. o.dust adds a
// dust trail once (call every frame; it remembers). Returns { speed, heading }
S.drive = (v, t, path, o = {}) => { const d = v.userData, p = path(t), q = path(t + .05), b = path(t - .05), dir = q.clone().sub(p), spd = q.distanceTo(b) / .1;
  v.position.copy(p); v.position.y += (d.tilt ? -.08 : 0); if (dir.lengthSq() > 1e-7) d.heading = Math.atan2(-dir.x, -dir.z); v.rotation.y = (d.heading || 0) + (o.ry || 0);
  const dist = (() => { let s = 0, last = path(0); const n = Math.max(1, Math.round(t * 20)); for (let i = 1; i <= n; i++) { const c = path(t * i / n); s += c.distanceTo(last); last = c; } return s; })();
  // the wheel pivots spin about the axle (x) and steer about y outside the spin
  for (const w of d.wheels) { w.rotation.order = 'YXZ'; w.rotation.x = -dist / d.wheelR; }
  const ahead = path(t + .4), turn = (() => { const a = Math.atan2(-(ahead.x - q.x), -(ahead.z - q.z)) - (d.heading || 0); return Math.atan2(Math.sin(a), Math.cos(a)); })();
  for (const w of d.front || []) w.rotation.y = Math.max(-.5, Math.min(.5, turn * 1.5));
  d.susp = d.susp || (window.PHYS ? PHYS.suspension(path, { rough: o.rough }) : () => ({ pitch: 0, roll: 0, bounce: 0 })); const s = d.susp(t);
  const tilt = d.tilt || [0, 0, 0]; if (d.lean) { d.lean.rotation.z = -turn * 1.4; } else { v.rotation.x = tilt[0] + s.pitch; v.rotation.z = tilt[2] + s.roll; v.position.y += s.bounce * Math.min(1, spd / 4); }
  if (o.dust && !d.dusted) { d.dusted = true; S.dustTrail(o.parent || PS1.scene, o.dust === true ? 18 : o.dust, (ts) => { const pp = path(ts), qq = path(ts + .05); if (pp.distanceTo(qq) < .02) return null; const back = V(0, 0, d.len / 2).applyAxisAngle(V(0, 1, 0), Math.atan2(-(qq.x - pp.x), -(qq.z - pp.z))); return { x: pp.x + back.x, z: pp.z + back.z, half: d.width / 2 - .2 }; }, o.dustColor); }
  return { speed: spd, heading: d.heading }; };
})();
