// PS1 VEHICLES: low-poly old cars and trucks for the PS1 horror shorts. Load after lib/ps1.js (uses PS1.mat/tex/color/noise/limb).
// Units are metres, y up, everything sits on y = 0, vehicles FACE -z (front/headlights at -z). Every builder is
//   PS1.props.<name>(opts) -> THREE.Group at the origin (not added to any scene; you parent it).
// Each vehicle is under ~2k triangles (+ people), built from shared cached materials. Hollow cabins, open windows (windshields
// have only a few alpha-tested reflection streaks, so nobody is hidden), real floors/dash/seats/steering wheels.
//
// Common userData on every vehicle:
//   wheels[]        wheel groups; spin by rotation.x (turning forward = negative x rotation). Car/pickup/van order: FL, FR, RL, RR
//   roll(d)         sets all wheel rotations for d metres travelled forward (toward -z)
//   doors[]         { side: -1|1, group, k, open(k) } front doors (hinged at the front edge), k 0..1 (left = -1 = driver side)
//   lights          { head:[mesh], tail:[mesh], all:[mesh] } unlit meshes; setLights(head=true, tail=true) dims/brightens them
//   seats[]         { pos: Vector3, rotY, legs:[L,R], drive } person-group anchors in vehicle-local coords (pos is where a PS1.person's
//                   group origin goes, so y is negative-ish: hips sit on the cushion); rotY = PI so people face -z.
//                   car: [driver FL, FR, rear L, rear R]; others: [driver, passenger]. Driver is on the left (-x).
//   steering        local position of the steering wheel rim centre; steeringInfo = { pos, up, R, tilt }
//   floorY, seatTop, dims { length, width, height, wheelRadius }
//
// PS1.props.car({ color, style, era, rust, seat, doorColor, plate, whitewall })
//   ~4.9 m old sedan (4 seats). color '#hex' body paint (default red 60s / blue 90s); style 'sedan' | 'wagon'; era '60s' (chrome bumpers,
//   fins on sedans, whitewalls, bench front seat, big round headlights) | '90s' (plastic bumpers, rect headlights, bucket seats + console,
//   fatter pillars, steel wheels); rust 0..1 (or true) rusty paint; seat '#hex' upholstery; doorColor '#hex' (two-tone doors);
//   plate 'TEXT' (default 'HX 4416'); whitewall false -> plain chrome hubcaps (60s).
//   extra userData: hood { group, open(k) } (hinged at the cowl, shows the engine), trunk { group, open(k) } (sedan only, null on wagons;
//   has a floor + spare), so a body can be hidden in it.
// PS1.props.policeCar(opts)   car() in black with white doors reading POLICE, a roof light bar, push bar. Takes the car opts (era '60s' default).
//   extra userData: update(t, S) flashes the bar (red x3 then blue x3; call it each frame, the prop viewer does) and flash(t) -> { red, blue }
//   0..1 so a scene can drive its own PS1.light() slot; lights.red[] / lights.blue[] are the lamp meshes.
// PS1.props.cabOverTruck({ rust, color, plate })
//   1940s cab-over delivery truck (~6.8 m, 3.4 m tall): flat-fronted hollow cab (open windows, dark glass streaks, doghouse, bench seat, wheel) sitting over
//   the engine, tall chrome grille, round fender headlights, amber cab roof markers, ribbed box body with rear doors, dual rear wheels (6 wheels:
//   front pair then rear four), plate drawn on canvas front + rear (default 'BEATNGU'). rust true/1 (default) heavy rust, 0/false clean faded paint in
//   'color' (default brown rust / faded green). doors = [] (cab doors are painted-on). seats = [driver, passenger] sit high (y ~1.3).
// PS1.props.pickup({ color, rust, plate })
//   1950s pickup (~5.1 m) with a real open bed (wood floor, wheel wells, rails). extra userData: hood { open(k) }, tailgate { group, open(k) } (k 1 = flat).
// PS1.props.van({ color, rust, seat, plate })
//   old forward-control panel van (~4.9 m): hollow cab with two buckets, hollow cargo bay (plank floor, wheel houses, dark walls) and barn doors.
//   extra userData: rearDoors[] { side, group, open(k) } (k 1 = swung wide open, bay visible from behind). The rear plate rides on the right door.
// PS1.props.seat(person, vehicle, i = 0, { hands: true })
//   parents a PS1.person (from PS1.person({...})) into seat i of any vehicle above, seated with legs bent and feet on the floor, facing forward.
//   Seat 0 puts both hands on the wheel at ten and two; other seats rest hands on the lap. Returns the person. After seating you can still turn
//   person.head.rotation.y, or call person.pose(...) yourself (seat.legs holds the sitting leg points in person-local space).
//
// Gotchas: lamps (headlights/taillights/light bar) use their own unlit materials so setLights/flash never affect other vehicles;
// body/glass/tire materials are cached and shared between vehicles of the same colour. Glass is alpha-tested streaks, never opaque.
(function () {
'use strict';
const V = PS1.V, PI = Math.PI, ZERO = new THREE.Vector3();

// ---------- caches + small helpers ----------
const cache = {};
const memo = (k, f) => (k in cache ? cache[k] : (cache[k] = f()));
const srt = (a, b) => (a < b ? [a, b] : [b, a]);
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const flat = (hex, o) => memo('f' + hex + (o ? JSON.stringify(o) : ''), () => PS1.mat(PS1.color(hex), o));
const tmat = (key, w, h, draw, o) => memo('t' + key + (o ? JSON.stringify(o) : ''), () => PS1.mat(PS1.tex(w, h, draw), o));
const circ = (q, x, y, r, col) => { q.fillStyle = col; q.beginPath(); q.arc(x, y, r, 0, 6.283); q.fill(); };

// a box from min/max extents, with uvs in metres (so textures keep one texel density on every box)
function boxUV(g, w, h, d, t) {
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  dims.forEach(([a, b], f) => { for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * a / t, uv.getY(k) * b / t); } });
}
function bx(parent, m, X, Y, Z, o = {}) {
  const [x0, x1] = srt(X[0], X[1]), [y0, y1] = srt(Y[0], Y[1]), [z0, z1] = srt(Z[0], Z[1]);
  const w = x1 - x0, h = y1 - y0, d = z1 - z0, g = new THREE.BoxGeometry(w, h, d);
  if (!o.raw) boxUV(g, w, h, d, o.tile || 1);
  const e = new THREE.Mesh(g, m), off = parent.userData.off || ZERO;
  e.position.set((x0 + x1) / 2 - off.x, (y0 + y1) / 2 - off.y, (z0 + z1) / 2 - off.z); parent.add(e); return e;
}
// a box between two points (pillars, struts), thickness tx (across x) by tz
function strut(parent, m, a, b, tx, tz) {
  const off = parent.userData.off || ZERO, e = new THREE.Mesh(new THREE.BoxGeometry(tx, 1, tz), m);
  PS1.limb(e, V(...a).sub(off), V(...b).sub(off)); parent.add(e); return e;
}
function quad(parent, m, p0, p1, p2, p3, rx = 1, ry = 1) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2, ...p3], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, rx, 0, rx, ry, 0, ry], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
  const e = new THREE.Mesh(g, m); parent.add(e); return e;
}
function hinge(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.off = new THREE.Vector3(x, y, z); parent.add(g); return g; }
function put(parent, geo, m, x, y, z) { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); parent.add(e); return e; }
// an arch (wheel cut-out) along a bottom edge, from the front to the rear of the wheel
const arch = (zc, R, wy, yb, n = 7) => { const p = [[zc - R, yb], [zc - R, wy]]; for (let i = 1; i < n; i++) { const a = PI - PI * i / n; p.push([zc + R * Math.cos(a), wy + R * Math.sin(a)]); } p.push([zc + R, wy], [zc + R, yb]); return p; };
// a side profile (z, y) extruded across x, centred on x = 0
function sidePanel(pts, thick) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 1 }); g.rotateY(-PI / 2); g.translate(thick / 2, 0, 0); return g;
}
// a front profile (x, y) extruded along z, centred on z = 0
function frontPanel(pts, depth) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -depth / 2); return g;
}

// ---------- materials ----------
// body paint, optionally rusted
const paint = (hex, rust = 0) => tmat('paint' + hex + rust, 16, 16, (q, w, h, r) => {
  q.fillStyle = hex; q.fillRect(0, 0, w, h); PS1.noise(q, w, h, r, shade(hex, .82), 40, .7); PS1.noise(q, w, h, r, shade(hex, 1.18), 22, .5);
  if (rust) { PS1.noise(q, w, h, r, '#7a4a26', 70 * rust | 0, .85); PS1.noise(q, w, h, r, '#4a2c18', 30 * rust | 0, .8); q.fillStyle = 'rgba(96,52,24,.7)'; for (let i = 0; i < 7 * rust; i++) q.fillRect(r() * w | 0, h * .45 + r() * h * .55 | 0, 2 + (r() * 3 | 0), 1 + (r() * 3 | 0)); }
});
const vinylM = hex => tmat('vinyl' + hex, 8, 8, (q, w, h, r) => { q.fillStyle = hex; q.fillRect(0, 0, w, h); q.fillStyle = shade(hex, .7); q.fillRect(0, 0, w, 1); q.fillRect(0, 0, 1, h); PS1.noise(q, w, h, r, shade(hex, 1.25), 6, .5); });
// glass that you can see through: mostly transparent with a few reflection streaks (alpha-tested, so it never hides anyone)
const glassM = (dark) => tmat('glass' + (dark ? 'D' : ''), 16, 16, (q) => {
  q.fillStyle = dark ? '#6c8090' : '#b4ccd8'; for (let y = 0; y < 16; y++) q.fillRect((y + 2) % 16, y, dark ? 1 : 2, 1);
}, { unlit: true, side: THREE.DoubleSide });
const plateM = (text) => tmat('plate' + text, 64, 32, (q, w, h) => {
  q.fillStyle = '#e6e2d2'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a3a5a'; q.fillRect(0, 0, w, 3); q.fillRect(0, h - 1, w, 1); q.fillRect(0, 0, 1, h); q.fillRect(w - 1, 0, 1, h);
  const size = Math.min(15, Math.floor(58 / (Math.max(3, text.length) * .62)));
  q.font = `bold ${size}px "Courier New", monospace`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = '#1c2c4c'; q.fillText(text, w / 2, h / 2 + 3);
}, { tint: '#d8d4c8' });
const tireM = () => tmat('tread', 4, 4, (q) => { q.fillStyle = '#161618'; q.fillRect(0, 0, 4, 4); q.fillStyle = '#2c2c30'; q.fillRect(0, 0, 2, 4); });
const hubM = (kind) => tmat('hub' + kind, 16, 16, (q, w, h) => {
  circ(q, 8, 8, 8, '#131315');
  if (kind === 'white') { circ(q, 8, 8, 7.4, '#d8d4c2'); circ(q, 8, 8, 5.6, '#131315'); }
  circ(q, 8, 8, 5.2, kind === 'steel' ? '#5c5a50' : '#9ea4a8'); circ(q, 8, 8, 3.6, kind === 'steel' ? '#76705e' : '#d4d8dc'); circ(q, 8, 8, 1.1, '#26262a');
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 + .3; q.fillStyle = '#3a3a3e'; q.fillRect(8 + Math.cos(a) * 2.5 - .5 | 0, 8 + Math.sin(a) * 2.5 - .5 | 0, 1, 1); }
});
const lampM = hex => PS1.mat(PS1.color(hex), { unlit: true });
function lamp(parent, hex, geo, x, y, z) { const m = new THREE.Mesh(geo, lampM(hex)); m.position.set(x, y, z); parent.add(m); return m; }
const setLamp = (list, k) => list.forEach(m => m.material.uniforms.tint.value.setScalar(k));

// a wheel group (spins by rotation.x). R radius, wd width. kind: 'white' | 'chrome' | 'steel'
function wheel(R, wd, kind) {
  const g = new THREE.Group(), geo = PS1.cyl(R, R, wd, 10), uv = geo.attributes.uv;
  for (let i = 0; i < 22; i++) uv.setX(i, uv.getX(i) * 10);
  const hub = hubM(kind), tire = new THREE.Mesh(geo, [tireM(), hub, hub]); tire.rotation.z = -PI / 2; g.add(tire); g.userData.R = R; return g;
}
function addWheels(parent, list, R, wd, kind) {
  return list.map(([x, z]) => { const w = wheel(R, wd, kind); w.position.set(x, R, z); parent.add(w); return w; });
}

// steering wheel + column. c = rim centre, dy/dz = column direction, R = rim radius
function steering(parent, c, base, R, thick, hex) {
  const col = flat(hex), g = new THREE.Group(); g.position.set(...c); parent.add(g);
  const dir = V(c[0] - base[0], c[1] - base[1], c[2] - base[2]).normalize(), tilt = Math.atan2(dir.y, dir.z);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, thick, 5, 10), col); rim.rotation.x = -tilt; g.add(rim);
  const sp = new THREE.Mesh(new THREE.BoxGeometry(R * 1.9, .022, .022), col); sp.rotation.x = -tilt; g.add(sp);
  const hubm = new THREE.Mesh(PS1.cyl(.035, .035, .05, 6), flat('#b4b8bc')); hubm.rotation.x = PI / 2 - tilt; g.add(hubm);
  strut(parent, flat('#2a2a2c'), base, c, .04, .04);
  const up = V(0, Math.cos(tilt), -Math.sin(tilt));
  return { pos: V(...c), up, R, tilt };
}

// a seat anchor: the person's group origin sits below the cushion so the hips land on it; feet go on the floor
function seatDef(x, hipZ, cushY, floorY, kneeZ = .46, ankleZ = .72, drive = false) {
  const oy = cushY - .73, ay = floorY + .34 - oy;
  return { pos: V(x, oy, hipZ), rotY: PI, drive, legs: [-1, 1].map(s => [V(s * .1, .8, .02), V(s * .1, ay + .25, kneeZ), V(s * .1, ay, ankleZ)]) };
}

// ================================================================================================================
// car
// ================================================================================================================
PS1.props.car = (o = {}) => {
  const is60 = o.era !== '90s', wagon = o.style === 'wagon', hex = o.color || (is60 ? '#8a2a2a' : '#3a5a7a'), rust = o.rust === true ? 1 : (o.rust || 0);
  const car = new THREE.Group(), U = car.userData;
  const body = paint(hex, rust), doorBody = o.doorColor ? paint(o.doorColor, rust) : body;
  const chrome = flat('#b4b8bc'), dark = flat('#1a1a1c'), under = flat('#222224'), glass = glassM(), headliner = flat('#b8ad92');
  const trim = flat(is60 ? '#6a4c3c' : '#4a4c52'), carpet = flat(is60 ? '#4a2c26' : '#34363a'), vinyl = vinylM(o.seat || (is60 ? '#7a3a2a' : '#565a64'));
  const bump = is60 ? chrome : flat('#2e3034');
  const xo = .925, th = .06, xi = xo - th, yb = .26, sh = is60 ? .92 : .88, bel = sh + .05, zF = -2.34, zR = 2.34;
  const AXF = -1.48, AXR = 1.52, WR = .33, ARC = .42, WY = .33;
  const roofTop = 1.52, roofU = roofTop - .05, wsZ = is60 ? -.30 : -.14, cowl = -.90;
  const rrZ = wagon ? 2.20 : (is60 ? 1.40 : 1.36), deckZ = wagon ? 2.22 : (is60 ? 1.72 : 1.70), pw = is60 ? .05 : .085;
  const hipF = .35, hipR = 1.05, floorY = .25, cushY = .43;

  // --- underbody, carpet, firewall, engine bay
  bx(car, under, [-.86, .86], [.17, .22], [zF + .08, zR - .08]);
  bx(car, carpet, [-.80, .80], [.22, floorY], [cowl, wagon ? 2.28 : deckZ]);
  bx(car, carpet, [-.13, .13], [floorY, .34], [-.86, 1.30]);
  bx(car, dark, [-xi, xi], [.22, bel], [-.95, -.89]);
  bx(car, flat('#2a2a2e'), [-.30, .30], [.30, .70], [-1.90, -1.20]);
  bx(car, chrome, [-.20, .20], [.70, .76], [-1.80, -1.30]);
  bx(car, flat('#3a2a22'), [-.5, .5], [.30, .66], [-2.2, -2.0]);

  // --- side panels with wheel arches: front fender, and the rear door/quarter
  const fenderPts = [[zF, yb], ...arch(AXF, ARC, WY, yb), [cowl, yb], [cowl, sh], [zF + .12, sh], [zF, sh - .1]];
  const quarterPts = [[.12, yb], ...arch(AXR, ARC, WY, yb), [zR, yb],
    ...(is60 && !wagon ? [[zR, sh + .13], [zR - .08, sh + .13], [1.85, sh], [.12, sh]] : [[zR, sh - .08], [zR - .1, sh], [.12, sh]])];
  const fenderG = sidePanel(fenderPts, th), quarterG = sidePanel(quarterPts, th);
  for (const s of [-1, 1]) {
    put(car, fenderG, body, s * (xo - th / 2), 0, 0); put(car, quarterG, body, s * (xo - th / 2), 0, 0);
    bx(car, body, [s * xi, s * xo], [yb, .38], [-.88, .12]);
    // wheel-house liners (the wheels sit between these and the outer panel)
    bx(car, dark, [s * .60, s * .71], [.22, .80], [AXF - ARC, AXF + ARC]); bx(car, dark, [s * .60, s * .71], [.22, .80], [AXR - ARC, AXR + ARC]);
  }
  // nose + tail panels
  bx(car, body, [-xi, xi], [yb + .04, sh - .08], [zF, zF + .04]);
  bx(car, body, [-xi, xi], [.26, sh], [zR - .06, zR]);

  // --- hood (hinged at the cowl) and trunk lid (hinged at the deck)
  const hood = hinge(car, 0, sh, cowl - .01), hoodMats = [body, body, body, dark, body, body];
  bx(hood, hoodMats, [-xo, xo], [sh, sh + .05], [zF + .14, cowl - .01]);
  strut(hood, body, [0, sh + .025, zF + .14], [0, sh - .06, zF + .02], xo * 2, .05);
  U.hood = { group: hood, open(k) { hood.rotation.x = k * .95; } };
  if (!wagon) {
    const lid = hinge(car, 0, sh, deckZ + .02);
    bx(lid, [body, body, body, dark, body, body], [-xo, xo], [sh, sh + .05], [deckZ + .02, zR]);
    bx(car, flat('#2c2c2a'), [-.80, .80], [.30, .34], [deckZ + .02, zR - .06]);
    put(car, PS1.cyl(.3, .3, .12, 10), flat('#1c1c1e'), .1, .40, 2.0);
    U.trunk = { group: lid, open(k) { lid.rotation.x = -k * 1.15; } };
  } else {
    U.trunk = null;
    bx(car, carpet, [-.80, .80], [.40, .44], [1.34, 2.26]);
  }

  // --- grille, headlights, bumpers, plates, lamps
  const grM = tmat(is60 ? 'grille60' : 'grille90', 16, 8, (q, w, h) => {
    q.fillStyle = '#1c1c20'; q.fillRect(0, 0, w, h); q.fillStyle = is60 ? '#b4b8bc' : '#34363c';
    if (is60) { for (let x = 1; x < w; x += 2) q.fillRect(x, 0, 1, h); q.fillRect(0, 3, w, 1); } else { for (let y = 1; y < h; y += 3) q.fillRect(0, y, w, 1); }
  });
  bx(car, [chrome, chrome, chrome, chrome, chrome, grM], [-.60, .60], [.46, is60 ? .82 : .70], [zF - .04, zF + .03], { raw: true });
  const heads = [], tails = [];
  for (const s of [-1, 1]) {
    if (is60) {
      put(car, PS1.cyl(.145, .145, .05, 8), chrome, s * .73, .68, zF - .03).rotation.x = PI / 2;
      heads.push(put(car, PS1.cyl(.105, .105, .03, 8), lampM('#f6efc8'), s * .73, .68, zF - .06)); heads[heads.length - 1].rotation.x = PI / 2;
      tails.push(lamp(car, '#c01818', PS1.box(.2, .2, .03), s * .78, .90, zR + .015));
      tails.push(lamp(car, '#c01818', PS1.box(.1, .1, .03), s * .62, .58, zR + .015));
      lamp(car, '#e8e4d0', PS1.box(.08, .06, .03), s * .50, .58, zR + .015);
    } else {
      bx(car, dark, [s * .50, s * .88], [.58, .76], [zF - .02, zF + .02]);
      heads.push(lamp(car, '#f2ecc8', PS1.box(.34, .12, .03), s * .69, .67, zF - .035));
      tails.push(lamp(car, '#b81818', PS1.box(.5, .12, .03), s * .65, .74, zR + .015));
    }
    // side marker / corner trim
    bx(car, is60 ? chrome : dark, [s * .925, s * .955], [is60 ? .60 : .56, is60 ? .64 : .60], [zF + .05, AXF - ARC - .04]);
    bx(car, is60 ? chrome : dark, [s * .925, s * .955], [is60 ? .60 : .56, is60 ? .64 : .60], [AXR + ARC + .04, zR - .05]);
  }
  if (is60) {
    bx(car, bump, [-.95, .95], [.30, .45], [zF - .10, zF - .02]); bx(car, bump, [-.95, .95], [.30, .45], [zR + .02, zR + .10]);
    for (const s of [-1, 1]) {
      bx(car, bump, [s * .78, s * .95], [.30, .45], [zF - .10, zF + .24]); bx(car, bump, [s * .78, s * .95], [.30, .45], [zR - .24, zR + .10]);
      bx(car, bump, [s * .45, s * .50], [.30, .52], [zF - .16, zF - .10]); bx(car, bump, [s * .45, s * .50], [.30, .52], [zR + .10, zR + .16]);
    }
    bx(car, dark, [-xi, xi], [.26, .30], [zF + .0, zF + .3]);
  } else {
    bx(car, bump, [-.93, .93], [.28, .56], [zF - .10, zF - .02]); bx(car, bump, [-.93, .93], [.28, .56], [zR + .02, zR + .10]);
  }
  const plate = o.plate ?? 'HX 4416', pm = plateM(plate);
  bx(car, [dark, dark, dark, dark, dark, pm], [-.2, .2], [is60 ? .50 : .62, is60 ? .70 : .82], [zF - .15, zF - .13], { raw: true });
  bx(car, [dark, dark, dark, dark, pm, dark], [-.2, .2], [.60, .80], [zR + .03, zR + .05], { raw: true });
  put(car, PS1.cyl(.035, .035, .3, 5), dark, .6, .27, zR + .05).rotation.x = PI / 2;

  // --- wheels
  U.wheels = addWheels(car, [[-.82, AXF], [.82, AXF], [-.82, AXR], [.82, AXR]], WR, .2, is60 ? (o.whitewall === false ? 'chrome' : 'white') : 'steel');

  // --- cabin shell: rear door skins, caps, trim cards, pillars, roof, glass
  const policeTex = o.police ? tmat('policeDoor', 64, 32, (q, w, h) => {
    q.fillStyle = '#e6e6e0'; q.fillRect(0, 0, w, h); q.fillStyle = '#16181c'; q.fillRect(0, 22, w, 2); q.fillRect(0, 26, w, 1);
    q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('POLICE', w / 2, 11);
  }) : null;
  const skinMats = s => { const a = Array(6).fill(doorBody); if (policeTex) a[s > 0 ? 0 : 1] = policeTex; return a; };
  for (const s of [-1, 1]) {
    bx(car, skinMats(s), [s * .88, s * .94], [.38, sh], [.14, 1.04], { raw: !!policeTex });
    bx(car, dark, [s * .90, s * .945], [.38, sh], [.115, .14]);
    bx(car, trim, [s * .78, s * .81], [.34, sh], [.14, 1.10]);
    bx(car, trim, [s * .71, s * .81], [.34, sh], [1.10, wagon ? 2.2 : deckZ]);
    bx(car, is60 ? chrome : dark, [s * .78, s * .925], [sh, bel], [.14, wagon ? 2.28 : deckZ]);
    bx(car, trim, [s * .70, s * .78], [.62, .68], [.2, .95]);
    bx(car, chrome, [s * .94, s * .97], [.78, .82], [.62, .80]);
    // pillars: A (windshield), B (between the doors), C (rear)
    strut(car, body, [s * .80, bel, cowl + .03], [s * .75, roofU, wsZ + .02], pw, pw * .9);
    strut(car, body, [s * .83, bel, .13], [s * .78, roofU, .13], pw + .01, pw);
    if (wagon) strut(car, body, [s * .81, bel, deckZ], [s * .78, roofU, rrZ - .02], pw, pw);
    else strut(car, body, [s * .82, bel, deckZ - .02], [s * .76, roofU, rrZ - .02], pw + .02, pw + .02);
    // cowl vent
    bx(car, body, [s * .0, s * .80], [sh, bel], [cowl - .01, cowl + .09]);
  }
  bx(car, [body, body, body, headliner, body, body], [-.80 + (is60 ? 0 : .04), .80 - (is60 ? 0 : .04)], [roofU, roofTop], [wsZ - .05, rrZ + .06]);
  quad(car, glass, [-.79, bel, cowl + .05], [.79, bel, cowl + .05], [.75, roofU, wsZ + .02], [-.75, roofU, wsZ + .02], 1.5, 1);
  if (wagon) quad(car, glass, [.79, bel, deckZ + .0], [-.79, bel, deckZ + .0], [-.77, roofU, rrZ - .02], [.77, roofU, rrZ - .02], 1.5, 1);
  else quad(car, glass, [.80, bel, deckZ - .02], [-.80, bel, deckZ - .02], [-.76, roofU, rrZ - .02], [.76, roofU, rrZ - .02], 1.5, 1);
  // wagon: tailgate + cargo walls
  if (wagon) { bx(car, body, [-xi, xi], [.30, bel], [zR - .1, zR]); bx(car, trim, [-.78, .78], [.44, bel], [2.20, 2.26]); }
  // rear-view mirror, visors
  bx(car, dark, [-.04, .04], [1.33, 1.40], [wsZ + .06, wsZ + .1]); bx(car, dark, [-.012, .012], [1.40, roofU], [wsZ + .07, wsZ + .09]);
  bx(car, trim, [-.74, -.06], [1.41, 1.45], [wsZ + .04, wsZ + .22]); bx(car, trim, [.06, .74], [1.41, 1.45], [wsZ + .04, wsZ + .22]);

  // --- dashboard + steering
  const dashFace = tmat(is60 ? 'dash60' : 'dash90', 32, 16, (q, w, h) => {
    q.fillStyle = is60 ? '#2c2724' : '#26282c'; q.fillRect(0, 0, w, h); q.fillStyle = is60 ? '#8a8478' : '#3c3e44'; q.fillRect(0, 0, w, 1);
    q.fillStyle = is60 ? '#d8d0b0' : '#161618'; q.fillRect(2, 3, 12, 6); q.fillStyle = is60 ? '#a02818' : '#ff9a30'; q.fillRect(8, 4, 1, 4); q.fillRect(4, 6, 3, 1);
    q.fillStyle = is60 ? '#6a5030' : '#18181a'; q.fillRect(15, 4, 7, 6); q.fillStyle = is60 ? '#e0b050' : '#3a8a4a'; q.fillRect(16, 5, 5, 1); q.fillStyle = '#8a8a8a'; q.fillRect(16, 8, 1, 1); q.fillRect(20, 8, 1, 1);
    q.strokeStyle = '#14110f'; q.strokeRect(24.5, 4.5, 6, 8); q.fillStyle = '#b8b0a0'; q.fillRect(27, 7, 2, 1);
  });
  const dside = flat(is60 ? '#2c2724' : '#26282c'), dtop = flat(is60 ? '#34302c' : '#2c2e32');
  bx(car, [dside, dside, dtop, dark, dashFace, dark], [-.84, .84], [.52, .95], [-.89, -.58], { raw: true });
  if (!is60) { bx(car, dtop, [-.66, -.12], [.95, 1.02], [-.74, -.56]); bx(car, flat('#14141a'), [-.64, -.14], [.94, .96], [-.58, -.56]); }
  const steerC = [-.38, .97, -.20], steerB = [-.38, .74, -.585];
  const st = steering(car, steerC, steerB, is60 ? .19 : .17, is60 ? .014 : .02, is60 ? '#d8d0b8' : '#18181a');
  U.steering = st.pos.clone(); U.steeringInfo = st;
  bx(car, dark, [-.46, -.30], [.30, .36], [-.60, -.50]); bx(car, flat('#8a8a8e'), [-.42, -.34], [.36, .38], [-.58, -.52]);
  bx(car, dark, [-.20, -.14], [.25, .32], [-.55, -.45]);
  if (is60) { bx(car, chrome, [-.35, -.33], [.76, .96], [-.585, -.57]); }
  if (!is60) {
    bx(car, flat('#2a2c30'), [-.12, .12], [floorY, .62], [-.50, .55]); bx(car, flat('#4a4c52'), [-.10, .10], [.62, .64], [-.40, .20]);
    bx(car, dark, [-.02, .02], [.64, .86], [-.10, -.06]); bx(car, flat('#8a8a8e'), [-.03, .03], [.86, .92], [-.11, -.05]);
  }

  // --- seats
  if (is60) {
    bx(car, dark, [-.70, .70], [floorY, .34], [-.02, .28]);
    bx(car, vinyl, [-.72, .72], [.33, cushY], [-.07, .51], { tile: .45 });
    bx(car, vinyl, [-.72, .72], [cushY, .98], [.50, .62], { tile: .45 }).rotation.x = .16;
  } else {
    for (const s of [-1, 1]) {
      bx(car, dark, [s * .30, s * .46], [floorY, .34], [-.02, .28]);
      bx(car, vinyl, [s * .13, s * .63], [.33, cushY], [-.07, .51], { tile: .45 });
      bx(car, vinyl, [s * .13, s * .63], [cushY, .98], [.50, .62], { tile: .45 }).rotation.x = .16;
      bx(car, vinyl, [s * .27, s * .49], [1.02, 1.20], [.58, .66], { tile: .45 });
    }
  }
  bx(car, vinyl, [-.62, .62], [floorY, cushY], [.63, 1.21], { tile: .45 });
  bx(car, vinyl, [-.62, .62], [cushY, .98], [1.20, 1.32], { tile: .45 }).rotation.x = .16;
  if (!is60) for (const s of [-1, 0, 1]) bx(car, vinyl, [s * .38 - .11, s * .38 + .11], [1.02, 1.18], [1.28, 1.36], { tile: .45 });
  if (!wagon) { bx(car, dark, [-.78, .78], [.22, .90], [1.32, 1.36]); bx(car, flat('#3a342e'), [-.78, .78], [.90, .94], [1.36, deckZ]); }

  // --- front doors (hinged at the front edge), with trim card, armrest, handle, mirror
  U.doors = [];
  for (const s of [-1, 1]) {
    const g = hinge(car, s * .86, 0, -.88);
    bx(g, skinMats(s), [s * .88, s * .94], [.38, sh], [-.88, .12], { raw: !!policeTex });
    bx(g, is60 ? chrome : dark, [s * .78, s * .94], [sh, bel], [-.88, .12]);
    bx(g, trim, [s * .78, s * .81], [.34, sh], [-.86, .12]);
    bx(g, dark, [s * .78, s * .94], [.34, .38], [-.88, .12]);
    bx(g, trim, [s * .70, s * .78], [.62, .68], [-.55, .05]);
    bx(g, chrome, [s * .94, s * .97], [.78, .82], [-.08, .08]);
    bx(g, chrome, [s * .78, s * .80], [.82, .90], [-.30, -.26]);
    bx(g, is60 ? chrome : dark, [s * .93, s * 1.04], [.98, 1.06], [-.84, -.76]);
    if (is60) bx(g, chrome, [s * .94, s * .965], [.60, .64], [-.86, .10]);
    const d = { side: s, group: g, k: 0, open(k) { d.k = k; g.rotation.y = s * k * 1.15; } };
    U.doors.push(d);
  }

  // --- lights, seats, handles for the caller
  U.lights = { head: heads, tail: tails, all: [...heads, ...tails] };
  U.setLights = (head = true, tail = true) => { setLamp(heads, head ? 1 : .3); setLamp(tails, tail ? 1 : .35); };
  U.roll = d => U.wheels.forEach(w => { w.rotation.x = -d / WR; });
  U.dims = { length: 4.9, width: 1.9, height: roofTop, wheelRadius: WR };
  U.floorY = floorY; U.seatTop = cushY;
  U.seats = [seatDef(-.38, hipF, cushY, floorY, .46, .72, true), seatDef(.38, hipF, cushY, floorY, .46, .72), seatDef(-.38, hipR, cushY, floorY, .42, .66), seatDef(.38, hipR, cushY, floorY, .42, .66)];

  // --- police extras: roof light bar, push bar, spotlight
  if (o.police) {
    const red = [], blue = [];
    bx(car, dark, [-.46, .46], [roofTop, roofTop + .04], [-.02, .30]);
    bx(car, dark, [-.46, .46], [roofTop + .04, roofTop + .16], [.10, .20]);
    for (const x of [-.40, -.20]) red.push(lamp(car, '#ff2a22', PS1.box(.17, .12, .26), x, roofTop + .10, .14));
    for (const x of [.20, .40]) blue.push(lamp(car, '#2a58ff', PS1.box(.17, .12, .26), x, roofTop + .10, .14));
    bx(car, dark, [-.5, .5], [.40, .46], [zF - .22, zF - .14]); bx(car, dark, [-.4, -.36], [.30, .56], [zF - .20, zF - .12]); bx(car, dark, [.36, .4], [.30, .56], [zF - .20, zF - .12]);
    U.lights.red = red; U.lights.blue = blue;
    // flashing: returns the two intensities so a scene can drive its own point lights too
    U.flash = t => { const p = Math.floor(t * 9) % 12; return { red: p < 5 && p % 2 === 0 ? 1 : 0, blue: p >= 6 && p < 11 && p % 2 === 0 ? 1 : 0 }; };
    U.update = (t) => { const f = U.flash(t); setLamp(red, .22 + .78 * f.red); setLamp(blue, .22 + .78 * f.blue); };
    U.update(0);
  }
  return car;
};

// ================================================================================================================
// seat(person, vehicle, i): parents a PS1.person into seat i of any vehicle built here, seated and facing forward
// ================================================================================================================
PS1.props.seat = (person, veh, i = 0, o = {}) => {
  const s = veh.userData.seats[i]; if (!s) throw new Error('vehicle has no seat ' + i);
  const G = person.G; veh.add(G); G.position.copy(s.pos); G.rotation.set(0, s.rotY, 0);
  person.legs(s.legs[0], s.legs[1]);
  const st = veh.userData.steeringInfo;
  if (s.drive && st && o.hands !== false) {
    // hands at "ten and two" on the rim: work out the points in the person's own space
    const loc = w => V(s.pos.x - w.x, w.y - s.pos.y, s.pos.z - w.z), pts = [1, -1].map(sg => loc(st.pos.clone().addScaledVector(V(1, 0, 0), sg * st.R * .86).addScaledVector(st.up, st.R * .5)));
    const arms = pts.map(h => { const sg = h.x < 0 ? -1 : 1, sh = V(sg * .24, 1.36, 0), el = sh.clone().lerp(h, .5).add(V(sg * .07, -.12, 0)); return [sh, el, h]; });
    person.pose(arms.find(a => a[0].x < 0), arms.find(a => a[0].x > 0));
  } else {
    const lap = sg => [V(sg * .24, 1.36, 0), V(sg * .28, 1.06, .12), V(sg * .14, .93, .32)];
    person.pose(lap(-1), lap(1));
  }
  return person;
};

// ================================================================================================================
// cabOverTruck: a 1940s-style cab-over delivery truck (flat-fronted cab over the engine, big box body, fender headlights)
// ================================================================================================================
const rustM = (hex, amt, ribbed) => tmat('rust' + hex + amt + (ribbed ? 'R' : ''), 32, 32, (q, w, h, r) => {
  q.fillStyle = hex; q.fillRect(0, 0, w, h);
  PS1.noise(q, w, h, r, shade(hex, .8), 90, .6); PS1.noise(q, w, h, r, shade(hex, 1.25), 60, .6);
  if (amt) {
    for (let i = 0; i < 16 * amt; i++) { q.fillStyle = i % 3 ? 'rgba(150,80,36,.55)' : 'rgba(58,70,50,.5)'; q.fillRect(r() * w | 0, r() * h | 0, 2 + (r() * 5 | 0), 1 + (r() * 4 | 0)); }
    for (let i = 0; i < 7 * amt; i++) { q.fillStyle = 'rgba(40,20,10,.55)'; q.fillRect(r() * w | 0, r() * h | 0, 1 + (r() * 2 | 0), 1 + (r() * 2 | 0)); }
    for (let i = 0; i < 6 * amt; i++) { q.fillStyle = 'rgba(30,14,6,.35)'; q.fillRect(r() * w | 0, r() * h * .5 | 0, 1, 6 + (r() * 12 | 0)); }
  }
  if (ribbed) { q.fillStyle = 'rgba(14,8,4,.28)'; for (let y = 0; y < h; y += 8) q.fillRect(0, y, w, 1); }
});

PS1.props.cabOverTruck = (o = {}) => {
  const amt = o.rust === false ? 0 : (o.rust === undefined || o.rust === true ? 1 : o.rust);
  const hex = o.color || (amt ? '#6e4c32' : '#4a6a58');
  const T = new THREE.Group(), U = T.userData;
  const body = rustM(hex, amt, false), ribs = rustM(hex, amt, true);
  const dark = flat('#14100e'), frame = flat('#2a2420'), chrome = flat('#8a8678'), glass = glassM(true), seatM = vinylM('#5a4a38'), floorM = flat('#2a2018'), cabIn = flat('#3a3228');
  const cz0 = -2.95, cz1 = -.95, floorTop = 1.04, cushY = 1.26;

  // --- chassis, axles, tank
  bx(T, frame, [-.86, .86], [.60, .78], [-3.0, 3.45]);
  bx(T, dark, [-1.0, 1.0], [.45, .56], [-2.26, -2.14]); bx(T, dark, [-1.0, 1.0], [.45, .58], [1.84, 1.96]);
  put(T, PS1.cyl(.26, .26, 1.1, 8), flat('#3a3630'), .72, .84, .55).rotation.x = PI / 2;
  bx(T, dark, [-1.12, 1.12], [.86, 1.15], [-.75, 3.30]);

  // --- cab shell (hollow): floor, front wall with grille + windshield, side walls with open windows, back wall, roof
  bx(T, floorM, [-1.0, 1.0], [.98, floorTop], [cz0 + .1, cz1]);
  bx(T, body, [-1.05, 1.05], [.65, 1.70], [cz0, cz0 + .1]);
  bx(T, body, [-1.05, 1.05], [2.65, 2.88], [cz0, cz0 + .1]);
  bx(T, dark, [-.03, .03], [1.70, 2.65], [cz0, cz0 + .1]);
  bx(T, [dark, dark, dark, dark, dark, dark], [-1.0, 1.0], [.60, .66], [cz0 + .1, cz0 + .3]);
  quad(T, glass, [-.95, 1.72, cz0 + .02], [-.03, 1.72, cz0 + .02], [-.03, 2.63, cz0 + .02], [-.95, 2.63, cz0 + .02], 1, 1);
  quad(T, glass, [.03, 1.72, cz0 + .02], [.95, 1.72, cz0 + .02], [.95, 2.63, cz0 + .02], [.03, 2.63, cz0 + .02], 1, 1);
  for (const s of [-1, 1]) {
    bx(T, body, [s * .95, s * 1.05], [1.70, 2.65], [cz0, cz0 + .1]);
    bx(T, body, [s * .97, s * 1.05], [1.0, 1.95], [cz0, cz1]);
    bx(T, body, [s * .97, s * 1.05], [1.95, 2.65], [cz0, cz0 + .30]);
    bx(T, body, [s * .97, s * 1.05], [1.95, 2.65], [cz1 - .35, cz1]);
    bx(T, body, [s * .97, s * 1.05], [2.55, 2.88], [cz0, cz1]);
    quad(T, glass, [s * 1.0, 1.95, cz0 + .3], [s * 1.0, 1.95, cz1 - .35], [s * 1.0, 2.55, cz1 - .35], [s * 1.0, 2.55, cz0 + .3], 1, 1);
    // door seams + handle
    bx(T, dark, [s * 1.05, s * 1.07], [1.0, 2.55], [-2.66, -2.64]); bx(T, dark, [s * 1.05, s * 1.07], [1.0, 2.55], [-1.32, -1.30]); bx(T, dark, [s * 1.05, s * 1.07], [1.0, 1.03], [-2.66, -1.30]);
    bx(T, chrome, [s * 1.05, s * 1.09], [1.72, 1.78], [-1.55, -1.42]);
    // cab steps + mirrors
    bx(T, flat('#2e261e'), [s * 1.02, s * 1.32], [.80, .86], [-2.35, -1.15]);
    bx(T, dark, [s * 1.12, s * 1.16], [2.0, 2.45], [-2.58, -2.54]); bx(T, dark, [s * 1.04, s * 1.14], [2.2, 2.24], [-2.58, -2.52]);
  }
  bx(T, cabIn, [-1.0, 1.0], [1.0, 2.82], [cz1 - .08, cz1]);
  bx(T, [body, body, body, dark, body, body], [-1.07, 1.07], [2.82, 2.92], [cz0 - .02, cz1 + .02]);
  strut(T, body, [0, 2.90, cz0 + .15], [0, 2.66, cz0 - .16], 2.14, .06);
  for (const x of [-.34, 0, .34]) lamp(T, '#d8962a', PS1.box(.12, .07, .06), x, 2.98, cz0 + .2);

  // --- cab interior: doghouse, dash, seat, steering
  bx(T, cabIn, [-.28, .28], [floorTop, 1.45], [-2.85, -1.60]);
  bx(T, [cabIn, cabIn, cabIn, cabIn, cabIn, cabIn], [-1.0, 1.0], [floorTop, 1.62], [-2.85, -2.50]);
  bx(T, flat('#6a5a44'), [-.9, .9], [1.60, 1.66], [-2.85, -2.48]);
  bx(T, dark, [-.85, .85], [1.04, 1.28], [-1.75, -1.40]);
  bx(T, seatM, [-.85, .85], [1.26 - .12, 1.26], [-2.02, -1.44], { tile: .45 });
  bx(T, seatM, [-.85, .85], [1.26, 1.86], [-1.45, -1.33], { tile: .45 }).rotation.x = -.12;
  const sc = [-.5, 1.70, -2.10], sb = [-.5, 1.22, -2.52];
  const st = steering(T, sc, sb, .23, .02, '#16120e'); U.steering = st.pos.clone(); U.steeringInfo = st;
  bx(T, dark, [-.62, -.38], [1.0, 1.06], [-2.60, -2.45]);

  // --- fenders, grille shell, headlights, bumper, plates
  const fp = [[-3.15, .62], [-3.15, 1.15], [-3.0, 1.3], [-2.55, 1.38], [-1.95, 1.38], [-1.55, 1.3], [-1.30, 1.05], [-1.25, .62]];
  const archPts = arch(-2.25, .62, .5, .62, 8).reverse();
  const fenderG = sidePanel([...fp, ...archPts], .5);
  for (const s of [-1, 1]) {
    put(T, fenderG, body, s * .93, 0, 0);
    // headlight bucket on the fender top
    put(T, PS1.cyl(.19, .19, .26, 8), chrome, s * .93, 1.52, -2.98).rotation.x = PI / 2;
    const l = put(T, PS1.cyl(.145, .145, .03, 8), lampM('#f4eecc'), s * .93, 1.52, -3.13); l.rotation.x = PI / 2; (U._heads = U._heads || []).push(l);
    bx(T, dark, [s * .9, s * .96], [1.30, 1.40], [-2.95, -2.85]);
    lamp(T, '#c8801c', PS1.box(.10, .06, .05), s * 1.1, 1.18, -3.16);
  }
  const grM = tmat('cabGrille', 24, 16, (q, w, h) => { q.fillStyle = '#16120e'; q.fillRect(0, 0, w, h); q.fillStyle = '#8a8070'; for (let x = 2; x < w; x += 3) q.fillRect(x, 1, 1, h - 2); q.fillRect(0, 0, w, 1); q.fillRect(0, h - 1, w, 1); });
  bx(T, [body, body, body, body, body, grM], [-.60, .60], [.65, 1.45], [-3.10, -2.95], { raw: true });
  bx(T, chrome, [-.62, .62], [.62, .68], [-3.12, -2.95]);
  bx(T, chrome, [-1.18, 1.18], [.58, .76], [-3.30, -3.18]); bx(T, chrome, [-.1, .1], [.50, .86], [-3.34, -3.30]);
  bx(T, dark, [-.5, .5], [.40, .60], [-3.22, -3.14]);
  const plate = o.plate ?? 'BEATNGU', pm = plateM(plate);
  bx(T, [dark, dark, dark, dark, dark, pm], [-.24, .24], [.82, 1.04], [-3.37, -3.35], { raw: true });
  bx(T, [dark, dark, dark, dark, pm, dark], [-.24, .24], [1.30, 1.52], [3.36, 3.38], { raw: true });

  // --- the box body (chamfered roof corners), rear doors, bumper, lamps
  const bodyG = frontPanel([[-1.15, 1.15], [1.15, 1.15], [1.15, 3.20], [1.0, 3.35], [-1.0, 3.35], [-1.15, 3.20]], 4.08);
  put(T, bodyG, [body, ribs], 0, 0, 1.26);
  bx(T, dark, [-1.12, 1.12], [1.12, 1.18], [-.74, 3.28]);
  const rearM = tmat('rearDoors' + hex + amt, 64, 56, (q, w, h, r) => {
    q.fillStyle = hex; q.fillRect(0, 0, w, h); PS1.noise(q, w, h, r, shade(hex, .8), 200, .6); PS1.noise(q, w, h, r, shade(hex, 1.25), 120, .6);
    if (amt) { for (let i = 0; i < 40 * amt; i++) { q.fillStyle = i % 3 ? 'rgba(150,80,36,.55)' : 'rgba(58,70,50,.5)'; q.fillRect(r() * w | 0, r() * h | 0, 2 + (r() * 6 | 0), 1 + (r() * 5 | 0)); } }
    q.fillStyle = '#14100c'; q.fillRect(31, 0, 2, h); q.fillRect(0, 0, w, 1); q.fillRect(0, h - 1, w, 1); q.fillRect(0, 0, 1, h); q.fillRect(w - 1, 0, 1, h);
    q.fillStyle = '#8a8678'; q.fillRect(27, 26, 2, 8); q.fillRect(35, 26, 2, 8); q.fillStyle = '#2a2018'; for (const y of [8, 46]) { q.fillRect(1, y, 8, 2); q.fillRect(55, y, 8, 2); }
  });
  bx(T, [dark, dark, dark, dark, rearM, dark], [-1.12, 1.12], [1.22, 3.16], [3.30, 3.33], { raw: true });
  bx(T, chrome, [-1.18, 1.18], [.80, .96], [3.34, 3.46]);
  const tails = [];
  for (const s of [-1, 1]) {
    tails.push(lamp(T, '#b81c14', PS1.box(.14, .2, .04), s * .98, 1.62, 3.355)); lamp(T, '#c8801c', PS1.box(.14, .08, .04), s * .98, 1.45, 3.355);
    bx(T, dark, [s * .6, s * 1.2], [.55, .95], [2.52, 2.57]);
  }

  // --- wheels
  U.wheels = [...addWheels(T, [[-1.0, -2.25], [1.0, -2.25]], .5, .3, 'steel'), ...addWheels(T, [[-.78, 1.9], [-1.08, 1.9], [.78, 1.9], [1.08, 1.9]], .5, .26, 'steel')];
  U.doors = [];
  U.lights = { head: U._heads, tail: tails, all: [...U._heads, ...tails] };
  U.setLights = (head = true, tail = true) => { setLamp(U._heads, head ? 1 : .3); setLamp(tails, tail ? 1 : .35); };
  U.roll = d => U.wheels.forEach(w => { w.rotation.x = -d / .5; });
  U.dims = { length: 6.8, width: 2.4, height: 3.35, wheelRadius: .5 };
  U.floorY = floorTop; U.seatTop = cushY;
  U.seats = [seatDef(-.5, -1.60, cushY, floorTop, .46, .68, true), seatDef(.5, -1.60, cushY, floorTop, .46, .68)];
  U.plate = plate;
  return T;
};

// ================================================================================================================
// pickup: a 1950s-style pickup truck with an open bed (doors + hood + tailgate open)
// ================================================================================================================
PS1.props.pickup = (o = {}) => {
  const hex = o.color || '#6a7a4a', rust = o.rust === true ? 1 : (o.rust || 0);
  const P = new THREE.Group(), U = P.userData;
  const body = paint(hex, rust), chrome = flat('#b4b8bc'), dark = flat('#1a1a1c'), under = flat('#222224'), glass = glassM(), headliner = flat('#b8ad92');
  const trim = flat('#5a4c3c'), carpet = flat('#3a2c26'), vinyl = vinylM('#6a4a30');
  const wood = tmat('wood', 16, 16, (q, w, h, r) => { q.fillStyle = '#7a5a3a'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a4026'; for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 1, h); PS1.noise(q, w, h, r, '#3a2a18', 24, .6); });
  const xo = .925, th = .06, xi = xo - th, yb = .26, sh = .94, bel = sh + .05, zF = -2.5, zR = 2.5, AXF = -1.55, AXR = 1.5, WR = .36, ARC = .44, WY = .36;
  const cowl = -.90, cabBack = .76, roofTop = 1.58, roofU = 1.53, wsZ = -.30, floorY = .25, cushY = .43, hip = .35, bedZ0 = .80;

  bx(P, under, [-.86, .86], [.17, .22], [zF + .08, zR - .08]); bx(P, carpet, [-.80, .80], [.22, floorY], [cowl, cabBack - .08]);
  bx(P, dark, [-xi, xi], [.22, bel], [-.95, -.89]); bx(P, dark, [-.8, .8], [.22, .60], [bedZ0, zR - .06]);
  bx(P, flat('#2a2a2e'), [-.30, .30], [.30, .70], [-2.0, -1.3]); bx(P, chrome, [-.20, .20], [.70, .76], [-1.9, -1.4]);
  const fenderG = sidePanel([[zF, yb], ...arch(AXF, ARC, WY, yb), [cowl, yb], [cowl, sh], [zF + .16, sh], [zF, sh - .16]], th);
  const bedG = sidePanel([[bedZ0 - .04, yb], ...arch(AXR, ARC, WY, yb), [zR, yb], [zR, 1.02], [bedZ0 - .04, 1.02]], th);
  for (const s of [-1, 1]) {
    put(P, fenderG, body, s * (xo - th / 2), 0, 0); put(P, bedG, body, s * (xo - th / 2), 0, 0);
    bx(P, dark, [s * .60, s * .71], [.22, .82], [AXF - ARC, AXF + ARC]);
    bx(P, body, [s * xi, s * xo], [yb, .38], [-.88, cabBack - .04]);
    bx(P, body, [s * xi, s * .94], [.38, sh], [.20, cabBack - .04]);
    bx(P, chrome, [s * .78, s * .94], [sh, bel], [.20, cabBack - .04]);
    bx(P, trim, [s * .78, s * .81], [.34, sh], [.20, cabBack - .08]);
    bx(P, trim, [s * .70, s * .78], [.62, .68], [.28, .62]);
    // bed: inner liner, rail, wheel well
    bx(P, flat('#3a3630'), [s * .80, s * .865], [.60, 1.02], [bedZ0, zR - .06]); bx(P, chrome, [s * .78, s * .93], [1.02, 1.06], [bedZ0 - .04, zR]);
    bx(P, dark, [s * .55, s * .80], [.66, .84], [AXR - .46, AXR + .46]);
    // cab pillars + posts
    strut(P, body, [s * .80, bel, cowl + .03], [s * .75, roofU, wsZ + .02], .05, .045);
    bx(P, body, [s * .72, s * .84], [bel, roofU], [cabBack - .10, cabBack]);
    // lamps on the bed end
    P.userData['t' + s] = lamp(P, '#c01818', PS1.box(.07, .16, .03), s * .89, .86, zR + .015);
  }
  bx(P, body, [-xi, xi], [.30, bel], [cabBack - .08, cabBack]);
  quad(P, glass, [.72, 1.02, cabBack - .06], [-.72, 1.02, cabBack - .06], [-.72, roofU, cabBack - .06], [.72, roofU, cabBack - .06], 1.5, 1);
  bx(P, [body, body, body, headliner, body, body], [-.80, .80], [roofU, roofTop], [wsZ - .05, cabBack + .04]);
  quad(P, glass, [-.79, bel, cowl + .05], [.79, bel, cowl + .05], [.75, roofU, wsZ + .02], [-.75, roofU, wsZ + .02], 1.5, 1);
  bx(P, dark, [-.04, .04], [1.33, 1.40], [wsZ + .06, wsZ + .1]);
  bx(P, trim, [-.74, -.06], [1.45, 1.49], [wsZ + .04, wsZ + .22]);
  // hood
  const hood = hinge(P, 0, sh, cowl - .01);
  bx(hood, [body, body, body, dark, body, body], [-xo, xo], [sh, sh + .05], [zF + .16, cowl - .01]);
  strut(hood, body, [0, sh + .025, zF + .16], [0, sh - .09, zF + .02], xo * 2, .05);
  U.hood = { group: hood, open(k) { hood.rotation.x = k * .95; } };
  // nose, grille, headlights, bumpers, plates
  bx(P, body, [-xi, xi], [yb + .04, sh - .1], [zF, zF + .04]);
  const grM = tmat('grillePU', 16, 8, (q, w, h) => { q.fillStyle = '#1c1c20'; q.fillRect(0, 0, w, h); q.fillStyle = '#b4b8bc'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); q.fillRect(0, 4, w, 1); });
  bx(P, [chrome, chrome, chrome, chrome, chrome, grM], [-.58, .58], [.46, .80], [zF - .04, zF + .03], { raw: true });
  const heads = [];
  for (const s of [-1, 1]) {
    put(P, PS1.cyl(.15, .15, .05, 8), chrome, s * .72, .74, zF - .03).rotation.x = PI / 2;
    const l = put(P, PS1.cyl(.11, .11, .03, 8), lampM('#f6efc8'), s * .72, .74, zF - .06); l.rotation.x = PI / 2; heads.push(l);
    bx(P, chrome, [s * .925, s * .955], [.60, .64], [zF + .05, AXF - ARC - .04]);
  }
  bx(P, chrome, [-.95, .95], [.30, .45], [zF - .10, zF - .02]); bx(P, chrome, [-.95, .95], [.30, .45], [zR + .02, zR + .10]);
  for (const s of [-1, 1]) { bx(P, chrome, [s * .78, s * .95], [.30, .45], [zF - .10, zF + .24]); bx(P, chrome, [s * .78, s * .95], [.30, .45], [zR - .24, zR + .10]); }
  const plate = o.plate ?? 'PU 2750', pm = plateM(plate);
  bx(P, [dark, dark, dark, dark, dark, pm], [-.2, .2], [.50, .70], [zF - .15, zF - .13], { raw: true });
  bx(P, [dark, dark, dark, dark, pm, dark], [-.2, .2], [.50, .70], [zR + .12, zR + .14], { raw: true });
  // bed floor, headboard, tailgate
  bx(P, wood, [-.80, .80], [.60, .66], [bedZ0, zR - .06]);
  bx(P, body, [-xi, xi], [.66, 1.20], [bedZ0 - .04, bedZ0 + .02]);
  const tg = hinge(P, 0, .62, zR - .04);
  bx(tg, [body, body, body, body, body, wood], [-xi, xi], [.62, 1.02], [zR - .08, zR - .02]);
  bx(tg, chrome, [-.2, .2], [.80, .84], [zR - .02, zR + .01]);
  U.tailgate = { group: tg, open(k) { tg.rotation.x = k * 1.5; } };
  // wheels
  U.wheels = addWheels(P, [[-.82, AXF], [.82, AXF], [-.82, AXR], [.82, AXR]], WR, .22, 'chrome');
  // doors (hinged at the front edge)
  U.doors = [];
  for (const s of [-1, 1]) {
    const g = hinge(P, s * .86, 0, -.88);
    bx(g, body, [s * .88, s * .94], [.38, sh], [-.88, .20]); bx(g, chrome, [s * .78, s * .94], [sh, bel], [-.88, .20]);
    bx(g, trim, [s * .78, s * .81], [.34, sh], [-.86, .20]); bx(g, dark, [s * .78, s * .94], [.34, .38], [-.88, .20]);
    bx(g, trim, [s * .70, s * .78], [.62, .68], [-.55, .12]); bx(g, chrome, [s * .94, s * .97], [.78, .82], [.0, .16]);
    bx(g, chrome, [s * .93, s * 1.04], [.98, 1.06], [-.84, -.76]);
    const d = { side: s, group: g, k: 0, open(k) { d.k = k; g.rotation.y = s * k * 1.15; } }; U.doors.push(d);
  }
  // dash, steering, seat
  const dashFace = tmat('dashPU', 32, 16, (q, w, h) => {
    q.fillStyle = '#2c2724'; q.fillRect(0, 0, w, h); q.fillStyle = '#8a8478'; q.fillRect(0, 0, w, 1); q.fillStyle = '#d8d0b0'; q.fillRect(2, 3, 12, 6); q.fillStyle = '#a02818'; q.fillRect(8, 4, 1, 4);
    q.fillStyle = '#6a5030'; q.fillRect(15, 4, 7, 6); q.fillStyle = '#e0b050'; q.fillRect(16, 5, 5, 1); q.strokeStyle = '#14110f'; q.strokeRect(24.5, 4.5, 6, 8);
  });
  const dside = flat('#2c2724'), dtop = flat('#34302c');
  bx(P, [dside, dside, dtop, dark, dashFace, dark], [-.84, .84], [.52, .95], [-.89, -.58], { raw: true });
  const st = steering(P, [-.38, .97, -.20], [-.38, .74, -.585], .20, .015, '#d8d0b8'); U.steering = st.pos.clone(); U.steeringInfo = st;
  bx(P, dark, [-.46, -.30], [.30, .36], [-.60, -.50]); bx(P, dark, [-.20, -.14], [.25, .32], [-.55, -.45]);
  bx(P, dark, [-.70, .70], [floorY, .34], [-.02, .28]);
  bx(P, vinyl, [-.72, .72], [.33, cushY], [-.07, .51], { tile: .45 });
  bx(P, vinyl, [-.72, .72], [cushY, .98], [.50, .62], { tile: .45 }).rotation.x = .16;
  U.lights = { head: heads, tail: [U.t1, U['t-1']], all: [...heads, U.t1, U['t-1']] };
  U.setLights = (head = true, tail = true) => { setLamp(heads, head ? 1 : .3); setLamp([U.t1, U['t-1']], tail ? 1 : .35); };
  U.roll = d => U.wheels.forEach(w => { w.rotation.x = -d / WR; });
  U.dims = { length: 5.2, width: 1.9, height: roofTop, wheelRadius: WR };
  U.floorY = floorY; U.seatTop = cushY;
  U.seats = [seatDef(-.38, hip, cushY, floorY, .46, .72, true), seatDef(.38, hip, cushY, floorY, .46, .72)];
  return P;
};

// ================================================================================================================
// van: an old forward-control panel van with a hollow cargo bay and barn rear doors
// ================================================================================================================
PS1.props.van = (o = {}) => {
  const hex = o.color || '#c9bfa5', rust = o.rust === true ? 1 : (o.rust || 0);
  const Vn = new THREE.Group(), U = Vn.userData;
  const body = paint(hex, rust), chrome = flat('#b4b8bc'), dark = flat('#1a1a1c'), under = flat('#222224'), glass = glassM(), headliner = flat('#a89e86');
  const trim = flat('#4a4c52'), carpet = flat('#34363a'), vinyl = vinylM(o.seat || '#4a5a6a'), cargo = flat('#6a6050');
  const wood = tmat('woodV', 16, 16, (q, w, h, r) => { q.fillStyle = '#8a6a44'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a4e30'; for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 1, h); PS1.noise(q, w, h, r, '#4a3820', 24, .6); });
  const xo = .975, th = .06, xi = xo - th, yb = .30, bel = 1.0, zF = -2.35, zR = 2.35, AXF = -1.62, AXR = 1.35, WR = .35, ARC = .44, WY = .35;
  const roofTop = 2.04, roofU = 1.98, floorTop = .40, cushY = .60, hip = -.60;

  bx(Vn, under, [-.9, .9], [.22, .34], [zF + .08, zR - .08]);
  bx(Vn, carpet, [-.88, .88], [.34, floorTop], [-2.28, -.14]); bx(Vn, wood, [-.88, .88], [.34, floorTop], [-.12, 2.30]);
  bx(Vn, dark, [-xi, xi], [.40, 1.98], [-.14, -.10]);
  const frontG = sidePanel([[zF, yb], ...arch(AXF, ARC, WY, yb), [-1.17, yb], [-1.17, bel], [zF + .12, bel], [zF, bel - .1]], th);
  const rearG = sidePanel([[-.10, yb], ...arch(AXR, ARC, WY, yb), [zR, yb], [zR, roofU], [-.10, roofU]], th);
  for (const s of [-1, 1]) {
    put(Vn, frontG, body, s * (xo - th / 2), 0, 0); put(Vn, rearG, body, s * (xo - th / 2), 0, 0);
    bx(Vn, body, [s * xi, s * xo], [yb, .45], [-1.15, -.10]);
    bx(Vn, dark, [s * .64, s * .89], [.30, .85], [AXF - ARC, AXF + ARC]); bx(Vn, dark, [s * .64, s * .89], [.30, .85], [AXR - ARC, AXR + ARC]);
    bx(Vn, cargo, [s * .885, s * .915], [.40, 1.95], [-.08, AXR - ARC]); bx(Vn, cargo, [s * .885, s * .915], [.40, 1.95], [AXR + ARC, zR - .04]);
    bx(Vn, cargo, [s * .885, s * .915], [.80, 1.95], [AXR - ARC, AXR + ARC]);
    strut(Vn, body, [s * .93, bel, zF + .05], [s * .93, 1.94, zF + .22], .09, .08);
    bx(Vn, trim, [s * .84, s * .87], [.42, bel], [-1.13, -.10]);
    bx(Vn, [chrome, chrome, chrome, chrome, chrome, chrome], [s * .96, s * .99], [.60, .66], [zF + .05, AXF - ARC - .04]);
    // wheelhouse + dash side trims inside the cab
    bx(Vn, trim, [s * .64, s * .84], [.40, .85], [-2.05, -1.17]);
  }
  // roof, header, windshield
  bx(Vn, [body, body, body, headliner, body, body], [-xo, xo], [roofU, roofTop], [-2.10, zR]);
  bx(Vn, body, [-xo, xo], [1.90, roofTop], [-2.24, -2.10]);
  quad(Vn, glass, [-.92, bel, zF + .06], [.92, bel, zF + .06], [.92, 1.90, -2.16], [-.92, 1.90, -2.16], 2, 1);
  bx(Vn, body, [-xi, xi], [.40, bel - .1], [zF, zF + .05]);
  // nose: grille, headlights, bumper, plate
  const grM = tmat('grilleV', 16, 8, (q, w, h) => { q.fillStyle = '#1c1c20'; q.fillRect(0, 0, w, h); q.fillStyle = '#b4b8bc'; for (let y = 1; y < h; y += 2) q.fillRect(0, y, w, 1); });
  bx(Vn, [chrome, chrome, chrome, chrome, chrome, grM], [-.50, .50], [.52, .84], [zF - .04, zF + .03], { raw: true });
  const heads = [], tails = [];
  for (const s of [-1, 1]) {
    put(Vn, PS1.cyl(.15, .15, .05, 8), chrome, s * .72, .70, zF - .02).rotation.x = PI / 2;
    const l = put(Vn, PS1.cyl(.11, .11, .03, 8), lampM('#f6efc8'), s * .72, .70, zF - .05); l.rotation.x = PI / 2; heads.push(l);
  }
  bx(Vn, chrome, [-1.0, 1.0], [.38, .52], [zF - .10, zF - .01]);
  const plate = o.plate ?? 'VN 3309', pm = plateM(plate);
  bx(Vn, [dark, dark, dark, dark, dark, pm], [-.2, .2], [.56, .76], [zF - .13, zF - .11], { raw: true });
  // front doors: lower skin, frame stiles + top rail (open window), trim card
  U.doors = [];
  for (const s of [-1, 1]) {
    const g = hinge(Vn, s * .91, 0, -1.15);
    bx(g, body, [s * .93, s * .99], [.45, bel], [-1.15, -.10]);
    bx(g, body, [s * .93, s * .99], [bel, 1.98], [-1.15, -1.07]); bx(g, body, [s * .93, s * .99], [bel, 1.98], [-.18, -.10]); bx(g, body, [s * .93, s * .99], [1.84, 1.98], [-1.15, -.10]);
    bx(g, chrome, [s * .84, s * .99], [bel, bel + .04], [-1.15, -.10]);
    bx(g, trim, [s * .84, s * .87], [.42, bel], [-1.13, -.10]);
    bx(g, dark, [s * .84, s * .99], [.41, .45], [-1.15, -.10]);
    bx(g, chrome, [s * .99, s * 1.02], [.78, .82], [-.34, -.18]);
    bx(g, dark, [s * .98, s * 1.08], [1.30, 1.50], [-1.12, -1.08]);
    const d = { side: s, group: g, k: 0, open(k) { d.k = k; g.rotation.y = s * k * 1.15; } }; U.doors.push(d);
  }
  // rear barn doors
  U.rearDoors = [];
  for (const s of [-1, 1]) {
    const g = hinge(Vn, s * .955, 0, zR);
    bx(g, [body, body, body, body, body, trim], [s * .0, s * .90], [.45, 1.95], [zR - .06, zR]);
    bx(g, chrome, [s * .08, s * .16], [1.0, 1.2], [zR, zR + .03]);
    tails.push(lamp(g, '#c01818', PS1.box(.1, .26, .03), s * .8, 1.25, zR + .015));
    bx(g, dark, [s * .0, s * .9], [.44, .50], [zR - .06, zR]);
    if (s > 0) bx(g, [dark, dark, dark, dark, pm, dark], [s * .25, s * .65], [.62, .82], [zR + .03, zR + .05], { raw: true });
    const d = { side: s, group: g, k: 0, open(k) { d.k = k; g.rotation.y = s * k * 1.8; } }; U.rearDoors.push(d);
  }
  bx(Vn, chrome, [-1.0, 1.0], [.38, .52], [zR + .02, zR + .10]);
  U.wheels = addWheels(Vn, [[-.86, AXF], [.86, AXF], [-.86, AXR], [.86, AXR]], WR, .22, 'chrome');
  // cab interior: dash, steering, buckets, engine hump
  const dashFace = tmat('dashV', 32, 16, (q, w, h) => {
    q.fillStyle = '#26282c'; q.fillRect(0, 0, w, h); q.fillStyle = '#3c3e44'; q.fillRect(0, 0, w, 1); q.fillStyle = '#161618'; q.fillRect(2, 3, 12, 6); q.fillStyle = '#ff9a30'; q.fillRect(8, 4, 1, 4);
    q.fillStyle = '#18181a'; q.fillRect(15, 4, 7, 6); q.fillStyle = '#3a8a4a'; q.fillRect(16, 5, 5, 1); q.strokeStyle = '#101012'; q.strokeRect(24.5, 4.5, 6, 8);
  });
  const dside = flat('#26282c'), dtop = flat('#2c2e32');
  bx(Vn, [dside, dside, dtop, dark, dashFace, dark], [-.84, .84], [.52, 1.0], [-2.28, -1.53], { raw: true });
  const st = steering(Vn, [-.38, 1.08, -1.12], [-.38, .80, -1.535], .21, .02, '#18181a'); U.steering = st.pos.clone(); U.steeringInfo = st;
  bx(Vn, flat('#2a2c30'), [-.12, .12], [floorTop, .78], [-1.5, -.30]);
  for (const s of [-1, 1]) {
    bx(Vn, dark, [s * .30, s * .46], [floorTop, .46], [-.90, -.50]);
    bx(Vn, vinyl, [s * .13, s * .63], [.46, cushY], [hip - .42, hip + .16], { tile: .45 });
    bx(Vn, vinyl, [s * .13, s * .63], [cushY, 1.15], [hip + .15, hip + .27], { tile: .45 }).rotation.x = .16;
    bx(Vn, vinyl, [s * .27, s * .49], [1.19, 1.37], [hip + .23, hip + .31], { tile: .45 });
  }
  U.lights = { head: heads, tail: tails, all: [...heads, ...tails] };
  U.setLights = (head = true, tail = true) => { setLamp(heads, head ? 1 : .3); setLamp(tails, tail ? 1 : .35); };
  U.roll = d => U.wheels.forEach(w => { w.rotation.x = -d / WR; });
  U.dims = { length: 4.9, width: 2.0, height: roofTop, wheelRadius: WR };
  U.floorY = floorTop; U.seatTop = cushY;
  U.seats = [seatDef(-.38, hip, cushY, floorTop, .46, .72, true), seatDef(.38, hip, cushY, floorTop, .46, .72)];
  return Vn;
};

// ================================================================================================================
// policeCar: generic black-and-white sedan with a roof light bar that flashes red/blue (just says POLICE)
// ================================================================================================================
PS1.props.policeCar = (o = {}) => PS1.props.car({ era: '60s', color: '#15171b', doorColor: '#e6e6e0', whitewall: false, plate: 'P 0231', ...o, police: true });

})();
