// PS1 prop library: PEOPLE. Load after ps1.js. Low-poly "late-90s PlayStation horror" humans plus a few generic monster archetypes.
// Conventions: metres, y up, feet on y=0, the character faces +z. Character LEFT = +x, character RIGHT = -x (so for a camera at +z looking
// back at the character, their left hand is on the viewer's right). Every builder returns an object H; H.G is a THREE.Group at the origin
// (NOT added to any scene - add it yourself). Everything uses PS1.mat (wobble, per-vertex light, fog); textures and materials are cached
// and shared between people. About 1.3k-1.5k triangles per character. Do not rely on H.G being a single mesh: it is a rig of groups/meshes.
//
//   const H = PS1.props.human({ build: 'adult', sex: 'f', hair: 'long', top: 'tank', expression: 'scared' });
//   scene.add(H.G); H.G.position.set(x, 0, z);
//   every frame:  H.pose('walk', (t * 0.9) % 1);  H.lookAt(camera.position);        (pose() is cheap; call it as often as you like)
//
// human(o) options (all optional)
//   build       'adult' (default) | 'teen' | 'child' | 'tall' | 'heavy'      adult m 1.78 m / f 1.66 m, teen ~1.65, child 1.2, tall ~1.9, heavy 1.74
//   sex         'm' (default) | 'f'
//   skin        '#d6a084'  any hex colour
//   hair        'short' | 'long' | 'ponytail' | 'bob' | 'bald' | 'curly' | 'buzz' | 'messy'      (default: short for m, long for f)
//   hairColor   '#3a2a1e'
//   beard       true | 'stubble' | 'full' | 'goatee' | 'mustache'   (painted onto the face)
//   top         'tee' | 'tank' | 'hoodie' | 'jacket' | 'coat' | 'dress' | 'uniform' | 'suit' | 'nightgown' | 'sweater' | 'coveralls'
//   topColor    hex (every top has its own default)
//   bottom      'jeans' | 'skirt' | 'slacks' | 'shorts'     (ignored by dress / nightgown / coat / coveralls)
//   bottomColor hex
//   shoes       hex colour of the shoes, or 'bare' for bare feet          gloves  hex colour (optional)         eyes  iris colour hex
//   expression  'calm' (default) | 'scared' | 'scream' | 'smile' | 'blank' | 'angry' | 'dead'
//   pose, phase optional starting pose (see below)
//   size tweaks height (metres), wide, thick, armScale, legScale, headScale, handScale, neckScale (all multipliers except height)
//
// H methods
//   H.pose(name, phase = 0)         poses the whole body instantly (IK for arms/legs). Returns H. Pose names:
//        stand          relaxed, slight weight shift             walk (phase 0..1 = one full stride, left foot contact at 0)
//        run (phase 0..1 = one full stride)                      sit (hips at y~0.47 on a seat, thighs level, feet on the floor, back at z~-0.06)
//        sitDrive       sit + hands forward on a wheel (about 0.3 m ahead of the chest, chest height), right foot forward on a pedal
//        crouch         deep squat                               kneel (both knees down, sitting upright)
//        crawl (phase 0..1 = one crawl cycle, all fours, hair/head hang)      lie (on the back, head toward -z, hips at y~0.11)
//        scream         hands pressed to the face/head           armsUp (surrender / terror)           reach (both arms forward)
//        reachR (right arm only)                                 point (right arm points forward, index out)
//        phone          right hand at the ear (H.hand('R') is the grip)       hold (two hands forward, palms facing)
//        cower          curled up low, forearms over the head    wave (phase = wave cycle, right hand)     shamble (phase; zombie walk)
//        Long skirts / coats / gowns shorten the stride automatically; dresses and skirts swing forward with the thighs when you sit.
//   H.blend(nameA, phaseA, nameB, phaseB, k)    pose between two poses (k 0..1): use it to ease from one pose to another over time.
//   H.setExpression(name)           swaps the face texture (names above).
//   H.lookAt(vec3 | null)           turns the head toward a WORLD point (clamped to about 57 deg yaw); null clears it. Survives pose() calls.
//   H.hand('L' | 'R')               a THREE.Group at the palm centre: local +y = along the fingers, -z = the palm side, +z = back of the hand.
//                                   Parent a handset / flashlight / knife to it. H.wrist(side) is the same frame at the wrist.
//   H.setHandCurl(side, curl, indexCurl, thumbCurl)   manual finger curl 0..1 (poses set it for you, call it after pose() to override).
//   H.G  H.root (pelvis)  H.chest  H.head  H.skull  the rig groups.      H.sp  the body spec (lengths in metres: legL, thighL, shinL, upL, loL ...).
//
// Monsters (generic archetypes; each returns an H-like object with all of the above):
//   PS1.props.ghostGirl(o)      pale girl (1.32 m), grimy nightgown, long black hair hanging over the face with one eye showing, bare feet.
//                               stand / walk / crawl have her stooped, head tilted; hair always hangs straight down. o: { height, hairColor }.
//   PS1.props.tallFigure(o)     very tall (2.4 m) gaunt figure, long coat, wide-brim hat, face in shadow. o: { coat: '#hex', hat: true | '#hex' | false,
//                               wings: false, height }. With wings:true: H.setWings(k), k 0 = folded down the back .. 1 = fully spread (bat-like).
//   PS1.props.maskedKiller(o)   big man in dark coveralls, plain white featureless mask, gloves, boots. Slow heavy stand / walk.
//   PS1.props.zombie(o)         shambling corpse in torn clothes (o: any human option). Pose 'shamble' (or walk) and 'reach' suit it.
//   PS1.props.shadowMan(o)      pure black unlit silhouette (2.05 m) with two faint eyes. o: { hat: false, noFog: false, height }.
// Every builder X also has PS1.props.XView(o) returning just the Group (used by conspiracy/props-test/view.mjs); humanView takes o.pose / o.phase,
// tallFigureView takes o.wingK. PS1.people exposes a few internals (spec, POSES, loft ...) for the other prop files.
(function () {
const PS = window.PS1;
if (!PS || !PS.props) throw new Error('ps1-props/people.js: load lib/ps1.js first');
const M = PS.mat, TAU = Math.PI * 2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, fract = v => v - Math.floor(v);
const sstep = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

// ---------- colour + cache helpers ----------
const hx = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgb = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => { const A = hx(a), B = hx(b); return rgb(A.map((v, i) => v + (B[i] - v) * k)); };
const lum = (c, k) => k < 0 ? mix(c, '#000000', -k) : mix(c, '#ffffff', k);
const hashSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 99991 + 1; };
const TC = {}, MC = {};
const cache = (S, k, f) => S[k] || (S[k] = f());
const texC = (key, w, h, draw) => cache(TC, key, () => PS.tex(w, h, draw, hashSeed(key)));
const solidTex = c => cache(TC, 'c' + c, () => PS.color(c));
const matC = (key, t, o = {}) => cache(MC, key + (o.unlit ? '|u' : '') + (o.side ? '|s' : '') + (o.noFog ? '|f' : '') + (o.tint ? '|' + o.tint : ''), () => M(t, o));
const solid = (c, o = {}) => matC('S' + c, solidTex(c), o);
const mk = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
const gp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// a box that narrows toward its bottom (hair strands, locks, bangs)
const strand = (w, h, d, bot = .3) => { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) { p.setX(i, p.getX(i) * bot); p.setZ(i, p.getZ(i) * (.5 + .5 * bot)); } g.computeVertexNormals(); return g; };
const ico = r => { const g = new THREE.IcosahedronGeometry(r, 0).toNonIndexed(), p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { const l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1; n.setXYZ(i, p.getX(i) / l, p.getY(i) / l, p.getZ(i) / l); } return g; };

// ---------- geometry: lathe-like lofts of elliptical rings, built as indexed grids ----------
// grid(rows, cols, P(i,j) -> [x,y,z], U(i,j,p) -> [u,v]): rows ascending in y give outward normals (opts.flip reverses the winding).
function grid(R, N, P, U, o = {}) {
  const b = { pos: [], uv: [], idx: [[], []], N, R, wrap: o.wrap !== false }, w = N + 1;
  for (let i = 0; i < R; i++) for (let j = 0; j <= N; j++) { const p = P(i, j), t = U(i, j, p); b.pos.push(p[0], p[1], p[2]); b.uv.push(t[0], t[1]); }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < N; j++) { const a = i * w + j, c = a + w, g = o.split && j >= N / 2 ? 1 : 0; if (o.flip) b.idx[g].push(a, c, a + 1, a + 1, c, c + 1); else b.idx[g].push(a, a + 1, c, a + 1, c + 1, c); }
  return b;
}
function done(b, o = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  const groups = o.split ? b.idx : [b.idx[0].concat(b.idx[1])]; let all = [], start = 0;
  groups.forEach((ix, k) => { g.addGroup(start, ix.length, k); all = all.concat(ix); start += ix.length; });
  g.setIndex(all); g.computeVertexNormals();
  if (b.wrap) { const n = g.attributes.normal, w = b.N + 1; for (let i = 0; i < b.R; i++) { const a = i * w, c = a + b.N, x = n.getX(a) + n.getX(c), y = n.getY(a) + n.getY(c), z = n.getZ(a) + n.getZ(c), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(c, x / l, y / l, z / l); } }
  return g;
}
function cap(b, r, top, o) {
  const N = b.N, base = b.pos.length / 3, g = o.split ? 1 : 0, cuv = o.capUV || [.5, .5];
  b.pos.push(r.cx || 0, r.y, r.cz || 0); b.uv.push(cuv[0], cuv[1]);
  for (let j = 0; j <= N; j++) { const th = TAU * j / N; b.pos.push((r.cx || 0) - r.rx * Math.cos(th), r.y, (r.cz || 0) + r.rz * Math.sin(th)); b.uv.push(cuv[0], cuv[1]); }
  for (let j = 0; j < N; j++) { if (top) b.idx[g].push(base, base + 1 + j, base + 2 + j); else b.idx[g].push(base, base + 2 + j, base + 1 + j); }
}
// rings: [{ y, rx, rz, cx, cz }]; ring j=0 sits on the character's right (x<0), j=N/4 front (+z), j=N/2 left. uv: 'wrap' | 'atlas' (front half u 0..0.5, back half 0.5..1) | 'front' (planar)
function loft(rings, o = {}) {
  const N = o.n || 8, R = rings.length, ys = rings.map(r => r.y), y0 = Math.min(...ys), y1 = Math.max(...ys), asc = rings[R - 1].y >= rings[0].y;
  const b = grid(R, N, (i, j) => { const r = rings[i], th = TAU * j / N; return [(r.cx || 0) - r.rx * Math.cos(th), r.y, (r.cz || 0) + r.rz * Math.sin(th)]; },
    (i, j, p) => { const r = rings[i], c = -Math.cos(TAU * j / N), v = (r.y - y0) / (y1 - y0 || 1); return [o.uv === 'atlas' ? (j <= N / 2 ? (c + 1) / 4 : .5 + (1 - c) / 4) : o.uv === 'front' ? clamp(.5 + p[0] / (2 * o.fw), 0, 1) : j / N, v]; },
    { split: o.split, flip: !asc });
  const hi = asc ? rings[R - 1] : rings[0], lo = asc ? rings[0] : rings[R - 1];
  if (o.capTop) cap(b, hi, true, o); if (o.capBot) cap(b, lo, false, o);
  return done(b, o);
}
// a nose: a box whose top-front edge is pulled back so it reads as a wedge from the side
function wedge(w, h, d) { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0 && p.getZ(i) > 0) p.setZ(i, p.getZ(i) * .1); if (p.getY(i) < 0 && p.getZ(i) > 0) p.setX(i, p.getX(i) * .7); } g.computeVertexNormals(); return g; }

// ---------- the head: profile rings (y from the chin up), hair shells that follow it ----------
function headProf(sp) {
  const w = sp.headW / 2, d = sp.headD / 2, h = sp.headH;
  return [[0, .27 * w, .30 * d, .62 * d], [.10, .62 * w, .58 * d, .36 * d], [.28, .92 * w, .88 * d, .10 * d], [.50, w, d, 0], [.72, .98 * w, d, 0], [.88, .82 * w, .88 * d, 0], [.96, .62 * w, .72 * d, 0], [1, .30 * w, .42 * d, 0]]
    .map(([t, rx, rz, cz]) => ({ y: t * h, rx, rz, cx: 0, cz }));
}
const profAt = (R, t) => { const y = t * R[R.length - 1].y; for (let i = 1; i < R.length; i++) if (y <= R[i].y) { const a = R[i - 1], b = R[i], k = (y - a.y) / (b.y - a.y || 1); return { y, rx: lerp(a.rx, b.rx, k), rz: lerp(a.rz, b.rz, k), cz: lerp(a.cz, b.cz, k) }; } return Object.assign({}, R[R.length - 1]); };
// hair cap: o.hl hairline height at the front, o.side above the ears, o.back at the nape (all as t = 0..1 of the head height); o.off stand-off in metres
function shellGeo(sp, o) {
  const R = headProf(sp), N = 8, rows = o.rows || [0, .3, .6, .82, .95, 1], h = sp.headH, last = rows.length - 1;
  const tb = th => { const f = Math.sin(th); return f >= 0 ? lerp(o.side, o.hl, Math.pow(f, 1.4)) : lerp(o.side, o.back, Math.pow(-f, .8)); };
  const b = grid(rows.length, N, (i, j) => { const th = TAU * j / N, s = rows[i];
      if (i === last) return [0, h + o.off * .8, 0];
      const p = profAt(R, lerp(tb(th), 1, s)), off = o.off + (o.flare || 0) * Math.pow(1 - s, 2);
      return [-(p.rx + off) * Math.cos(th), p.y, p.cz + (p.rz + off) * Math.sin(th)]; },
    (i, j) => [j / N, rows[i]]);
  return done(b);
}

// ---------- face textures (32x32, the whole front of the head: x = left..right, y = crown..chin) ----------
function drawFace(q, f, r) {
  const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
  const st = f.style, hc = f.hairC || '#3a2a1e';
  if (st === 'mask') {
    px(f.skin, 0, 0, 32, 32); px(hc, 0, 0, 32, 9); const mc = '#dedbd0', ed = '#aba79b';
    for (let y = 5; y < 32; y++) { const hw = y < 9 ? 8 + (y - 5) * 1.5 : y < 22 ? 14 : Math.max(6, 14 - (y - 22) * .9); px(y < 7 || y > 29 ? ed : mc, Math.round(16 - hw), y, Math.round(hw * 2), 1); px(ed, Math.round(16 - hw), y, 1, 1); px(ed, Math.round(16 + hw) - 1, y, 1, 1); }
    PS.noise(q, 32, 32, r, '#b8b4a8', 30, .25); px('#cbc8bc', 6, 11, 20, 1); px('#b4b0a3', 5, 13, 7, 3); px('#b4b0a3', 20, 13, 7, 3); px('#a39f93', 6, 14, 5, 1); px('#a39f93', 21, 14, 5, 1);
    px('#c0bdb1', 14, 15, 1, 7); px('#c0bdb1', 17, 15, 1, 7); px('#aaa699', 14, 22, 4, 1); px('#c9c6ba', 4, 20, 3, 5); px('#c9c6ba', 25, 20, 3, 5); return;
  }
  if (st === 'shadow' || st === 'void') {
    const bg = st === 'void' ? '#000000' : '#0a0908'; px(bg, 0, 0, 32, 32);
    if (st === 'void') { const e = '#9aa4ac'; px(e, 8, 15, 3, 1); px(e, 21, 15, 3, 1); px('#4a5258', 9, 16, 1, 1); px('#4a5258', 22, 16, 1, 1); }
    else { px('#1c1814', 5, 22, 22, 10); px('#2a2520', 10, 20, 12, 8); px('#6a6048', 8, 15, 3, 1); px('#6a6048', 21, 15, 3, 1); px('#2a2620', 10, 26, 12, 1); px('#5a5444', 11, 27, 10, 1); } return;
  }
  const kid = f.kid, fem = f.sex === 'f', ex = f.expr, hs = f.hair;
  let sk = f.skin; if (ex === 'dead' || st === 'ghost') sk = mix(sk, '#8c9a96', st === 'ghost' ? .12 : .5);
  if (st === 'zombie') sk = mix(sk, '#6f8a60', .45);
  const dk = lum(sk, -.14), dd = lum(sk, -.32), hi = lum(sk, .1), sd = lum(sk, -.1), ink = '#241812';
  px(sk, 0, 0, 32, 32); PS.noise(q, 32, 32, r, dk, 28, .3);
  px(sd, 0, 0, 2, 32); px(sd, 30, 0, 2, 32); px(sd, 0, 22, 5, 10); px(sd, 27, 22, 5, 10); px(lum(sk, -.06), 5, 29, 22, 3);
  if (hs && hs !== 'bald') {
    if (hs === 'buzz') { for (let y = 0; y < 8; y++) for (let x = 0; x < 32; x++) if (r() < (y < 4 ? .95 : .62 - (y - 4) * .14)) px(mix(hc, sk, y > 4 ? .35 : .1), x, y); }
    else { px(hc, 0, 0, 32, 7); px(hc, 0, 7, 3, 8); px(hc, 29, 7, 3, 8);
      if (hs === 'long' || hs === 'bob') { px(hc, 0, 7, 4, 23); px(hc, 28, 7, 4, 23); px(hc, 0, 7, 10, 1); px(hc, 22, 7, 10, 1); }
      if (hs === 'messy' || hs === 'curly') { px(hc, 5, 7, 4, 1); px(hc, 12, 7, 3, 2); px(hc, 20, 7, 5, 1); }
      if (hs === 'short' || hs === 'ponytail') px(hc, 0, 7, 11, 1); }
  }
  const ey = kid ? 16 : 14, mY = kid ? 26 : 25, ny = ey + 8;
  px(lum(sk, -.06), 14, ey + 1, 1, 7); px(lum(sk, -.06), 17, ey + 1, 1, 7); px(hi, 15, ey + 1, 2, 6); px(dd, 14, ny, 1, 1); px(dd, 17, ny, 1, 1); px(dk, 14, ny + 1, 4, 1);
  if (fem || ex === 'smile') { const bl = mix(sk, '#e0707a', .28); px(bl, 4, ey + 4, 4, 2); px(bl, 24, ey + 4, 4, 2); }
  const bc = mix(hc, '#000000', .3), lipC = fem ? mix(sk, '#b8404e', .6) : mix(sk, '#80403a', .5), lipD = lum(lipC, -.3), inner = '#2a0f0e', teeth = '#ece8dc';
  const bd = f.beard; if (bd) { const b = bd === true ? 'full' : bd, col = mix(hc, '#000000', .1);
    if (b === 'stubble') { for (let y = 19; y < 32; y++) for (let x = 3; x < 29; x++) if (r() < .3) px(mix(col, sk, .62), x, y); }
    else if (b === 'full') { px(col, 2, 17, 28, 15); px(sk, 8, 17, 16, 3); px(mix(col, sk, .3), 2, 17, 4, 3); px(mix(col, sk, .3), 26, 17, 4, 3); }
    else if (b === 'goatee') { px(col, 11, 21, 10, 2); px(col, 12, 26, 8, 6); }
    else if (b === 'mustache') { px(col, 9, 21, 14, 3); }
    px(mix(col, '#000000', .2), 0, 0, 0, 0); }
  const E = { calm: [3, 0, 0], smile: [2, 0, -1], scared: [5, 1, -2], scream: [5, 2, -1], blank: [3, -1, 0], angry: [2, 0, 2], dead: [2, 0, -1] }[ex] || [3, 0, 0], eh = E[0], y0 = eh >= 5 ? ey - 1 : ey;
  if (st === 'ghost' || st === 'zombie') {
    const sock = '#2a2626'; for (const x0 of [6, 20]) { px(sock, x0 - 1, y0 - 2, 8, eh + 4); px(mix(sock, sk, .35), x0 - 1, y0 + eh + 1, 8, 1); }
  }
  const eye = (x0, left, vis) => {
    if (!vis) return;
    if (st !== 'ghost' && st !== 'zombie') px(ink, x0 - 1, y0 - 1, 8, 1);
    if (fem && st !== 'ghost' && st !== 'zombie') px(ink, left ? x0 - 1 : x0 + 6, y0, 1, 1);
    if (ex === 'dead' || st === 'ghost' || st === 'zombie') { px(st === 'zombie' ? '#c8c8a0' : '#d8dcd6', x0, y0, 6, eh); px(st === 'zombie' ? '#7a7a58' : '#3a3a40', x0 + 2, y0, 2, eh); if (st === 'ghost') px('#000', x0 + 2, y0 + 1, 1, 1); }
    else { px('#f2f0ea', x0, y0, 6, eh);
      const ih = eh >= 5 ? 2 : Math.min(eh, 2), iy = y0 + (eh >= 5 ? 1 : eh > 2 ? 0 : 0) + (eh === 3 ? 1 : 0), ix = x0 + 2;
      px(f.iris || '#4a3220', ix, iy, 2, ih); px('#0c0806', ix + (left ? 1 : 0), iy, 1, ih);
      if (ex === 'blank') px(lum(sk, -.18), x0, y0, 6, 1);
      if (ex === 'angry') px(ink, left ? x0 + 3 : x0, y0, 3, 1);
      if (ex === 'smile') px(lum(sk, -.04), x0, y0 + 1, 6, 1); }
    px(dk, x0, y0 + eh, 6, 1);
  };
  eye(6, true, st !== 'ghost' || f.eyeSide === 'R'); eye(20, false, st !== 'ghost' || f.eyeSide !== 'R');
  if (st !== 'ghost') for (const [x0, left] of [[6, true], [20, false]]) for (let k = 0; k < 7; k++) { const inner2 = left ? k / 6 : 1 - k / 6, yy = ey - 4 - E[1] + Math.round(E[2] * inner2); px(bc, x0 - 1 + k, yy - (fem ? 0 : 1), 1, fem ? 1 : 2); }
  if (st === 'ghost') { px(mix(sk, '#000000', .55), 10, mY, 12, 1); return; }
  switch (ex) {
    case 'smile': px(lipC, 11, mY - 1, 1, 1); px(lipC, 20, mY - 1, 1, 1); px(inner, 12, mY, 8, 2); px(teeth, 13, mY, 6, 1); px(lipC, 12, mY + 2, 8, 1); break;
    case 'scared': px(inner, 12, mY - 1, 8, 3); px(teeth, 13, mY - 1, 6, 1); px(lipC, 11, mY, 1, 1); px(lipC, 20, mY, 1, 1); px(lipC, 12, mY + 2, 8, 1); break;
    case 'scream': px(lipC, 11, mY - 2, 10, 1); px(inner, 11, mY - 1, 10, 6); px(inner, 12, mY + 5, 8, 1); px(teeth, 12, mY - 1, 8, 2); px('#a8453f', 13, mY + 3, 6, 2); px(lipC, 10, mY, 1, 4); px(lipC, 21, mY, 1, 4); px(lipC, 12, mY + 6, 8, 1); break;
    case 'angry': px(lipD, 12, mY, 8, 1); px(teeth, 13, mY + 1, 6, 1); px(dd, 15, mY + 1, 1, 1); px(dd, 17, mY + 1, 1, 1); px(lipC, 11, mY + 2, 1, 1); px(lipC, 20, mY + 2, 1, 1); px(lipC, 12, mY + 2, 8, 1); break;
    case 'blank': px(lipD, 12, mY, 8, 1); px(inner, 14, mY + 1, 4, 1); px(lipC, 12, mY + 1, 2, 1); px(lipC, 18, mY + 1, 2, 1); break;
    case 'dead': px(mix(sk, '#5a6a7a', .6), 12, mY - 1, 8, 1); px(inner, 13, mY, 6, 3); px(mix(sk, '#5a6a7a', .5), 12, mY + 3, 8, 1); break;
    default: px(lipD, 12, mY, 8, 1); px(lipC, 12, mY + 1, 8, fem ? 2 : 1);
  }
  if (st === 'zombie') { px(dk, 5, 6, 4, 3); px('#4a3a2a', 22, 8, 3, 2); px('#3c4a34', 8, 22, 4, 3); px('#4a2a22', 21, 25, 5, 2); px(teeth, 13, mY, 6, 1); }
  if (ex === 'dead') { px(mix(sk, '#2a2a3a', .35), 5, y0 + eh + 1, 9, 1); px(mix(sk, '#2a2a3a', .35), 18, y0 + eh + 1, 9, 1); }
}
const faceTex = f => { const key = 'face|' + JSON.stringify(f); return cache(TC, key, () => PS.tex(32, 32, (q, w, h, r) => drawFace(q, f, r), hashSeed(key))); };

// ---------- clothing: wardrobe + textures ----------
const TOPS = {
  tee: { sl: 'short', c: '#5a7a9a', hem: 10, col: 'crew' }, tank: { sl: 'none', c: '#b84a5a', hem: 10 }, hoodie: { sl: 'long', c: '#4a4a52', hem: 11, bulk: 1.09, col: 'hood' },
  jacket: { sl: 'long', c: '#5a3e2a', hem: 12, bulk: 1.06, col: 'flat' }, coat: { sl: 'long', c: '#2e2a24', hem: 16, bulk: 1.1, col: 'flaps', skirt: 'coat' },
  dress: { sl: 'short', c: '#7a3a4a', hem: 16, skirt: 'dress' }, uniform: { sl: 'long', c: '#2a3a5a', hem: 2, col: 'flat', belt: '#1a1a1a' },
  suit: { sl: 'long', c: '#1c1c22', hem: 12, bulk: 1.05, col: 'flat' }, nightgown: { sl: 'long', c: '#d4d6cc', hem: 16, bulk: 1.03, skirt: 'gown', col: 'crew' },
  sweater: { sl: 'long', c: '#8a5a3a', hem: 11, bulk: 1.07, col: 'roll' }, coveralls: { sl: 'long', c: '#2a2e32', hem: 16, bulk: 1.08, col: 'flat', full: true, belt: '#16181a' }
};
const BOTS = { jeans: { c: '#33456a', leg: 'full' }, slacks: { c: '#2a2a30', leg: 'full' }, shorts: { c: '#5a6a5a', leg: 'short' }, skirt: { c: '#3a3a44', leg: 'skin', skirt: 'skirt' } };
function wardrobe(o) {
  const top = TOPS[o.top] ? o.top : 'tee', T = TOPS[top], bn = BOTS[o.bottom] ? o.bottom : (T.skirt === 'dress' || T.skirt === 'gown' ? 'skirt' : 'jeans'), B = BOTS[bn];
  const W = { top, bn, topC: o.topColor || T.c, botC: o.bottomColor || B.c, sl: T.sl, hem: T.hem, bulk: T.bulk || 1, col: T.col, belt: T.belt, full: !!T.full, skirt: T.skirt || B.skirt || null, leg: B.leg, skin: o.skin || '#d6a084', ragged: !!o._ragged, pat: o._pattern || (top === 'dress' ? 'dots' : null) };
  if (T.skirt === 'dress' || T.skirt === 'gown') { W.leg = 'skin'; W.botC = W.topC; }
  if (top === 'coat') { W.leg = 'full'; W.botC = o.bottomColor || '#26262a'; }
  if (W.full) { W.leg = 'full'; W.botC = W.topC; W.sl = 'long'; W.bn = 'slacks'; }
  if (W.skirt === 'skirt') W.skirtC = W.botC; else if (W.skirt) W.skirtC = W.topC;
  return W;
}
function torsoTex(W) {
  const key = ['T', W.top, W.topC, W.skin, W.ragged ? 1 : 0, W.pat, W.belt].join('|');
  return texC(key, 32, 32, (q, w, h, r) => {
    const px = (c, x, y, ww = 1, hh = 1) => { q.fillStyle = c; q.fillRect(x, y, ww, hh); }, c = W.topC, d = lum(c, -.25), l = lum(c, .2), dd = lum(c, -.45), t = W.top;
    px(c, 0, 0, 32, 32); PS.noise(q, w, h, r, d, 60, .5); PS.noise(q, w, h, r, l, 40, .3);
    for (const x of [0, 15, 16, 31]) px(lum(c, -.1), x, 0, 1, 32);
    px(lum(c, -.15), 0, 30, 32, 2);
    if (t === 'tee') { px(d, 4, 0, 8, 1); px(d, 20, 0, 8, 1); }
    else if (t === 'tank') { px(W.skin, 0, 0, 16, 6); px(W.skin, 16, 0, 16, 5); px(c, 3, 0, 2, 6); px(c, 11, 0, 2, 6); px(c, 19, 0, 2, 5); px(c, 27, 0, 2, 5); px(W.skin, 5, 6, 6, 2); px(W.skin, 6, 8, 4, 1); px(W.skin, 21, 5, 6, 1);
      for (const [x, wd] of [[0, 3], [13, 5], [27, 5]]) px(W.skin, x, 6, wd, 4); px(W.skin, 0, 0, 1, 10); px(W.skin, 31, 0, 1, 10); px(lum(c, -.2), 5, 8, 6, 1); }
    else if (t === 'hoodie') { px(d, 3, 19, 10, 1); px(d, 3, 26, 10, 1); px(d, 3, 19, 1, 8); px(d, 12, 19, 1, 8); px(lum(c, -.08), 4, 20, 8, 6); px(l, 6, 3, 1, 9); px(l, 9, 3, 1, 9); px(l, 6, 12, 1, 1); px(l, 9, 12, 1, 1);
      for (let x = 0; x < 32; x += 2) px(d, x, 28, 1, 4); px(d, 20, 0, 8, 5); }
    else if (t === 'jacket') { px(dd, 7, 2, 1, 29); px('#a0a0a0', 8, 2, 1, 29); px(l, 3, 0, 2, 4); px(l, 11, 0, 2, 4); px(dd, 2, 20, 4, 1); px(dd, 10, 20, 4, 1); px(d, 0, 28, 32, 3); px(d, 23, 0, 1, 31); }
    else if (t === 'coat') { for (let k = 0; k < 9; k++) { px(d, 3 + (k >> 1), k, 1, 1); px(d, 12 - (k >> 1), k, 1, 1); } for (const y of [11, 16, 21]) { px(l, 6, y, 1, 1); px(l, 9, y, 1, 1); } px(dd, 7, 9, 2, 22); px(d, 23, 0, 1, 31); px(d, 0, 29, 32, 2); }
    else if (t === 'dress') { px(lum(c, -.2), 0, 22, 16, 2); px(lum(c, -.2), 16, 22, 16, 2); px(W.skin, 4, 0, 8, 2); px(W.skin, 5, 2, 6, 1); px(W.skin, 20, 0, 8, 1);
      if (W.pat === 'dots') for (let y = 3; y < 30; y += 4) for (let x = (y >> 2) % 2 * 2; x < 32; x += 4) px(l, x, y, 1, 1); }
    else if (t === 'uniform') { px('#e0e0d8', 5, 0, 6, 2); px('#e0e0d8', 6, 2, 4, 1); px(d, 5, 0, 1, 3); px(d, 10, 0, 1, 3); px('#26262c', 7, 2, 2, 16); px(dd, 7, 2, 2, 2); for (let y = 6; y < 30; y += 4) px(l, 12, y, 1, 1);
      for (const x of [2, 10]) { px(d, x, 9, 4, 1); px(d, x, 12, 4, 1); px(d, x, 9, 1, 4); px(d, x + 3, 9, 1, 4); } px('#d8b440', 11, 10, 2, 2); px('#c8a838', 0, 0, 3, 2); px('#c8a838', 13, 0, 3, 2); px(d, 23, 0, 1, 31); }
    else if (t === 'suit') { px('#e8e6e0', 6, 0, 4, 9); px('#e8e6e0', 7, 9, 2, 2); px('#7a1a1e', 7, 3, 2, 14); px(dd, 7, 2, 2, 1); for (let k = 0; k < 12; k++) { px(d, 5 - (k >> 2), k, 1, 1); px(d, 10 + (k >> 2), k, 1, 1); px(l, 4 + (k >> 2) - 2 > 0 ? 3 : 3, k, 0, 0); }
      px(dd, 8, 18, 1, 1); px(dd, 8, 23, 1, 1); px('#e8e6e0', 12, 12, 2, 1); px(d, 23, 0, 1, 31); }
    else if (t === 'nightgown') { px(l, 4, 0, 8, 2); px(l, 20, 0, 8, 2); for (let y = 4; y < 30; y += 5) for (let x = (y % 2) * 2; x < 32; x += 5) px(lum(c, -.12), x, y, 1, 1); }
    else if (t === 'sweater') { for (let y = 0; y < 28; y++) for (let x = 0; x < 32; x++) if ((x + (y & 1)) % 4 === 0) px(d, x, y); for (let x = 2; x < 32; x += 6) px(l, x, 0, 1, 28); for (let x = 0; x < 32; x += 2) px(d, x, 28, 1, 4); }
    else if (t === 'coveralls') { px(dd, 7, 2, 1, 29); px('#9a9a9a', 8, 2, 1, 29); px(d, 2, 10, 5, 1); px(d, 2, 10, 1, 4); px(d, 2, 14, 5, 1); px(d, 6, 10, 1, 5); px(d, 9, 10, 5, 1); px(d, 9, 14, 5, 1); px(d, 13, 10, 1, 5); px('#7a3a2a', 10, 11, 3, 1); px(l, 20, 14, 8, 1); px(d, 23, 0, 1, 31); px(lum(c, -.35), 0, 26, 32, 2); }
    if (W.ragged) { PS.noise(q, w, h, r, '#2a2018', 50, .55); for (const [x, y, ww, hh] of [[3, 12, 4, 5], [10, 20, 3, 4], [21, 8, 5, 4], [26, 22, 4, 5], [6, 4, 2, 3]]) { px(mix(W.skin, '#6a7a60', .5), x, y, ww, hh); px('#3a2a20', x, y + hh, ww, 1); } }
  });
}
function pelvisTex(W) {
  const key = ['P', W.top, W.topC, W.botC, W.bn, W.belt, W.hem, W.ragged ? 1 : 0].join('|');
  return texC(key, 32, 16, (q, w, h, r) => {
    const px = (c, x, y, ww = 1, hh = 1) => { q.fillStyle = c; q.fillRect(x, y, ww, hh); }, sh = W.hem, bc = W.botC;
    px(bc, 0, 0, 32, 16); PS.noise(q, w, h, r, lum(bc, -.22), 40, .5); PS.noise(q, w, h, r, lum(bc, .15), 20, .3);
    if (W.leg === 'full' && sh < 14 && !W.full) {
      const y = sh + 1;
      if (W.bn === 'jeans') { const st = mix(bc, '#c8a050', .4); px(st, 3, y, 4, 1); px(st, 25, y, 4, 1); px(lum(bc, -.3), 7, y, 1, 5); for (const x of [19, 24]) { px(st, x, y + 2, 5, 1); px(st, x, y + 6, 5, 1); px(st, x, y + 2, 1, 5); px(st, x + 4, y + 2, 1, 5); } }
      else { px(lum(bc, -.35), 7, y, 2, 6); px(lum(bc, -.3), 20, y + 2, 4, 1); px(lum(bc, -.3), 26, y + 2, 4, 1); }
    }
    if (sh > 0) { px(W.topC, 0, 0, 32, sh); px(lum(W.topC, -.2), 0, Math.max(0, sh - 1), 32, 1); PS.noise(q, w, h, r, lum(W.topC, -.2), 30, .4); if (sh < 16) PS.noise(q, w, sh, r, lum(W.topC, .15), 12, .3); }
    if (W.belt) { px(W.belt, 0, 1, 32, 2); px('#c8b060', 7, 1, 2, 2); }
    if (W.ragged) { px('#3a2a20', 4, 5, 4, 3); px('#3a2a20', 22, 9, 5, 3); }
  });
}
function armTex(W, kind) {
  const sleeve = W.sl, key = ['A', kind, sleeve, W.topC, W.skin, W.ragged ? 1 : 0].join('|');
  return texC(key, 8, 16, (q, w, h, r) => {
    const px = (c, x, y, ww = 1, hh = 1) => { q.fillStyle = c; q.fillRect(x, y, ww, hh); }, c = W.topC;
    px(W.skin, 0, 0, 8, 16); PS.noise(q, w, h, r, lum(W.skin, -.15), 8, .3);
    const rows = sleeve === 'none' ? 0 : sleeve === 'short' ? (kind === 'up' ? 10 : 0) : 16;
    if (rows) { px(c, 0, 0, 8, rows); PS.noise(q, w, h, r, lum(c, -.22), 16, .5); PS.noise(q, w, h, r, lum(c, .18), 8, .3); px(lum(c, -.2), 0, rows - 1, 8, 1); if (kind === 'lo' && rows === 16) { px(lum(c, -.25), 0, 13, 8, 3); if (W.top === 'sweater' || W.top === 'hoodie') for (let x = 0; x < 8; x += 2) px(lum(c, -.4), x, 13, 1, 3); } }
    if (W.ragged && kind === 'lo') { px(W.skin, 0, 10, 8, 6); px('#3a2a20', 0, 9, 8, 1); }
  });
}
function legTex(W, kind) {
  const key = ['L2', kind, W.leg, W.botC, W.bn, W.skin, W.ragged ? 1 : 0].join('|');
  return texC(key, 16, 16, (q, w, h, r) => {
    const px = (c, x, y, ww = 1, hh = 1) => { q.fillStyle = c; q.fillRect(x, y, ww, hh); }, c = W.botC;
    px(W.skin, 0, 0, 16, 16); PS.noise(q, w, h, r, lum(W.skin, -.15), 14, .3);
    const rows = W.leg === 'full' ? 16 : W.leg === 'short' && kind === 'th' ? 9 : 0;
    if (rows) { px(c, 0, 0, 16, rows); PS.noise(q, w, h, r, lum(c, -.22), 30, .5); PS.noise(q, w, h, r, lum(c, .16), 16, .3);
      if (W.leg === 'full') { const st = W.bn === 'jeans' ? mix(c, '#c8a050', .3) : lum(c, -.25); px(st, 0, 0, 1, 16); px(st, 8, 0, 1, 16); if (W.bn !== 'jeans') { px(lum(c, .12), 12, 0, 1, rows); px(lum(c, .12), 4, 0, 1, rows); } }
      if (rows < 16) px(lum(c, -.25), 0, rows - 1, 16, 1); else if (kind === 'sh') px(lum(c, -.25), 0, 14, 16, 2); }
    if (W.ragged && kind === 'sh') { px(W.skin, 0, 11, 16, 5); px('#3a2a20', 0, 10, 16, 1); }
  });
}
function skirtTex(W) {
  const key = ['K', W.skirt, W.skirtC, W.pat, W.ragged ? 1 : 0, W.dirty ? 1 : 0].join('|');
  return texC(key, 8, 16, (q, w, h, r) => {
    const px = (c, x, y, ww = 1, hh = 1) => { q.fillStyle = c; q.fillRect(x, y, ww, hh); }, c = W.skirtC;
    px(c, 0, 0, 8, 16); PS.noise(q, w, h, r, lum(c, -.22), 16, .5); PS.noise(q, w, h, r, lum(c, .18), 8, .3);
    for (let x = 0; x < 8; x += 2) px(lum(c, -.1), x, 0, 1, 16);
    if (W.pat === 'dots') for (let y = 2; y < 14; y += 4) for (let x = (y >> 2) % 2 * 2; x < 8; x += 4) px(lum(c, .3), x, y, 1, 1);
    px(lum(c, -.3), 0, 15, 8, 1); if (W.skirt === 'gown') { px(lum(c, .18), 0, 13, 8, 2); px(lum(c, -.3), 0, 11, 8, 1); }
    if (W.skirt === 'coat') for (let x = 1; x < 8; x += 3) px(lum(c, -.3), x, 3, 1, 12);
    if (W.ragged || W.skirt === 'gown' && W.dirty) { for (let x = 0; x < 8; x += 2) px(mix(c, '#3a2e22', .55), x, 13 + (x >> 1) % 2, 1, 3 - (x >> 1) % 2); PS.noise(q, w, h, r, mix(c, '#3a3024', .6), 24, .5); }
  });
}
const hairMat = (c, flat) => matC('H' + c, texC('hair', 8, 16, (q, w, h, r) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); for (let x = 0; x < w; x++) { q.fillStyle = r() < .5 ? '#b4b4b4' : '#d8d8d8'; q.fillRect(x, 0, 1, h); } PS.noise(q, w, h, r, '#8a8a8a', 20, .6); q.fillStyle = '#ffffff'; q.fillRect(2, 3, 1, 4); q.fillRect(5, 9, 1, 3); }), { side: THREE.DoubleSide, tint: c });

// ---------- body spec ----------
const BUILDS = { adult: { H: [1.66, 1.78], w: 1, t: 1, head: 1 }, teen: { H: [1.6, 1.7], w: .93, t: .9, head: 1.03 }, child: { H: [1.2, 1.2], w: 1.06, t: 1.2, head: 1 }, tall: { H: [1.84, 1.96], w: .84, t: .86, head: .97 }, heavy: { H: [1.64, 1.74], w: 1.3, t: 1.3, head: 1.05 } };
function spec(o) {
  const f = o.sex === 'f', B = BUILDS[o.build] || BUILDS.adult, kid = o.build === 'child', H = o.height || B.H[f ? 0 : 1], k = H / 1.78, wd = B.w * (o.wide || 1), th = B.t * (o.thick || 1);
  const S = { H, k, f, kid, wd, th, belly: o.build === 'heavy' ? .04 * k : (o.belly || 0) * k, bust: f && !kid ? .014 * k : 0 };
  S.headH = H * (kid ? .17 : .1265) * B.head * (o.headScale || 1); S.headW = S.headH * (f ? .66 : .7); S.headD = S.headH * .84; S.pv = S.headH * .28; S.fz = S.headD * .06;
  S.legL = H * (kid ? .465 : .52) * (o.legScale || 1); S.ankleH = H * (kid ? .045 : .043) + .004; S.thighL = (S.legL - S.ankleH) * .49; S.shinL = S.legL - S.ankleH - S.thighL;
  S.waistOff = H * (kid ? .1 : .095) * (o.torsoScale || 1);
  const chin = S.legL + S.waistOff + (H - S.headH - .01 * k - S.legL - S.waistOff), nb = chin - H * (kid ? .02 : .028);
  S.nbL = nb - S.legL - S.waistOff; S.shY = S.nbL - .065 * k * (kid ? .8 : 1); S.neckTop = chin - S.legL - S.waistOff + S.pv; S.neckZ = -.01 * k;
  S.neckR = .056 * k * (f ? .86 : 1) * (.7 + .3 * th) * (o.neckScale || 1);
  S.upL = H * (kid ? .168 : .186) * (o.armScale || 1); S.loL = H * (kid ? .135 : .146) * (o.armScale || 1); S.aL = S.upL + S.loL; S.hs = H * (kid ? .1 : .105) * (o.handScale || 1) / .187;
  S.aR = .051 * k * th; S.lR = .092 * k * Math.pow(th, .85);
  S.shX = (f ? .178 : .2) * k * (.45 + .55 * wd);
  S.hipRx = (f ? .176 : .17) * k * wd; S.hipRz = (f ? .115 : .108) * k * (.6 + .4 * wd);
  S.waistRx = (f ? .128 : .148) * k * wd; S.waistRz = (f ? .092 : .1) * k * (.55 + .45 * wd);
  S.chestRx = (f ? .146 : .165) * k * wd; S.chestRz = (f ? .108 : .115) * k * (.6 + .4 * wd);
  S.hipJ = S.hipRx * .52; S.fs = k * (kid ? 1.05 : 1) * (o.footScale || 1);
  return S;
}

// ---------- hands + shoes ----------
function makeHand(side, hs, mat) {
  const g = new THREE.Group(), s = side, palm = mk(box(.088 * hs, .095 * hs, .034 * hs), mat, g, 0, .0475 * hs, 0);
  const finger = (par, wd, l1, l2, th) => { mk(box(wd, l1, th), mat, par, 0, l1 / 2, 0); const d = gp(par, 0, l1, 0); mk(box(wd * .92, l2, th * .9), mat, d, 0, l2 / 2, 0); return d; };
  const idx = gp(g, s * .033 * hs, .095 * hs, 0), main = gp(g, -s * .012 * hs, .095 * hs, 0), thumb = gp(g, s * .05 * hs, .02 * hs, -.004 * hs);
  const idxD = finger(idx, .018 * hs, .042 * hs, .036 * hs, .022 * hs), mainD = finger(main, .062 * hs, .04 * hs, .034 * hs, .026 * hs);
  mk(box(.022 * hs, .055 * hs, .022 * hs), mat, thumb, 0, .0275 * hs, 0);
  const grip = gp(g, 0, .05 * hs, -.012 * hs);
  const H = { g, grip, setCurl(c, ic, tc) { main.rotation.x = -c * 1.25; mainD.rotation.x = -c * 1.3; idx.rotation.x = -ic * 1.25; idxD.rotation.x = -ic * 1.3; thumb.rotation.z = -s * (.5 - tc * .9); thumb.rotation.x = -tc * .5; } };
  H.setCurl(.3, .3, .2); return H;
}
function shoeParts(sp, bare, shoeC, soleC, skinC) {
  const s = sp.fs, a = sp.ankleH, bot = -a, up = bare ? .012 : .03;
  const rg = (z, rx, top, b2) => { const bt = b2 === undefined ? bot : bot + b2, tp = bare ? Math.min(top, bot + .05 + (top - bot) * .55) : top; return { y: -z * s, rx: rx * s, rz: (tp - bt) / 2 * 1, cz: (tp + bt) / 2 }; };
  const rings = [rg(-.07, .034, bot + .075), rg(-.045, .04, up + .02), rg(-.01, .044, up), rg(.06, .046, bot + .075), rg(.13, .05, bot + .052), rg(.185, .043, bot + .04, .004), rg(.215, .022, bot + .026, .012)];
  const geo = loft(rings, { n: 6, capTop: true, capBot: true }); geo.rotateX(-Math.PI / 2);
  const g = new THREE.Group(); mk(geo, solid(bare ? skinC : shoeC), g);
  if (!bare) mk(box(.098 * s, .016, .27 * s), solid(soleC), g, 0, bot + .008, .065 * s);
  return g;
}

// ---------- poses: functions of (spec, phase) returning overrides of the standing base ----------
const base = sp => {
  const arm = () => ({ t: [.1, -.97, .04], pole: [.4, -.2, -1], g: 0, f: null, n: null, fo: null, curl: .35, ic: .3, tc: .25 });
  const ft = s => ({ p: [s * sp.hipJ * 1.25, 0, 0], pitch: 0, yaw: s * .1, pole: [s * .2, 0, 1] });
  return { root: [0, sp.legL * .985, 0], rot: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], hang: 1, L: arm(), R: arm(), fL: ft(1), fR: ft(-1) };
};
const both = o => ({ L: o, R: Object.assign({}, o) });
const feet = fn => ({ fL: fn(1), fR: fn(-1) });
function gait(sp, ph, run) {
  const k = sp.k, zs = (run ? .4 : .27) * k * (sp.legL / (.52 * sp.H)), lift = (run ? .24 : .07) * k, st = run ? .36 : .56, bob = (run ? .045 : .02) * k, po = run ? .19 : 0;
  const foot = (s, q) => { let z, y = 0, pitch;
    if (q < st) { const u = q / st; z = zs * (1 - 2 * u); pitch = u < .6 ? -.18 * (1 - u / .6) : .6 * Math.pow((u - .6) / .4, 2); y = Math.max(0, pitch) * .06; }
    else { const v = (q - st) / (1 - st); z = -zs + 2 * zs * sstep(v); y = lift * Math.pow(Math.sin(Math.PI * v), .8); pitch = lerp(.6, -.18, sstep(v * 1.1)); if (run) pitch = lerp(.8, -.1, v); }
    return { p: [s * sp.hipJ * (run ? 1.1 : 1.2), y, z], pitch, yaw: 0, pole: [s * .1, 0, 1] }; };
  const a = Math.cos(TAU * ph), swing = (run ? .62 : .3);
  const armP = s => { const ang = -s * a * swing * (run ? 1.1 : 1), fwd = Math.sin(ang);
    return run ? { t: [.1, -.3 - .25 * (1 - fwd) / 2 + (fwd > 0 ? .1 : 0), .2 + .9 * Math.sin(ang) * .9 + .15], pole: [.5, -.5, -1], curl: .9, ic: .9, tc: .6 }
      : { t: [.07, -Math.cos(ang) * .96 + (fwd > 0 ? .0 : 0), Math.sin(ang) * .96 + .02], pole: [.4, -.3, -1] }; };
  return { root: [Math.sin(TAU * ph) * .018 * k, sp.legL * (run ? .94 : .975) - bob * Math.cos(TAU * 2 * (ph - po)) - (run ? 0 : 0), 0], rot: [run ? .18 : .04, -.07 * Math.cos(TAU * ph) * (run ? 1.6 : 1), Math.sin(TAU * ph) * .02],
    spine: [run ? .1 : .02, .1 * Math.cos(TAU * ph) * (run ? 1.6 : 1), 0], head: [run ? -.28 : -.04, 0, 0], L: armP(1), R: armP(-1), fL: foot(1, fract(ph)), fR: foot(-1, fract(ph + .5)) };
}
const POSES = {
  stand: sp => ({ rot: [0, .04, .022], spine: [.01, -.05, -.02], head: [.02, .03, .03], root: [-.006 * sp.k, sp.legL * .982, 0], fL: { p: [sp.hipJ * 1.3, 0, .04 * sp.k], pitch: 0, yaw: .14, pole: [.2, 0, 1] }, fR: { p: [-sp.hipJ * 1.2, 0, -.03 * sp.k], pitch: 0, yaw: -.1, pole: [-.2, 0, 1] } }),
  walk: (sp, ph) => gait(sp, ph, 0),
  run: (sp, ph) => gait(sp, ph, 1),
  sit: sp => ({ root: [0, Math.min(.47, sp.legL * .96), -.06], spine: [-.02, 0, 0], head: [0, 0, 0], ...both({ t: [.14, -.8, .55], pole: [.5, -.3, -1], curl: .4 }), ...feet(s => ({ p: [s * sp.hipJ * 1.15, 0, -.06 + sp.thighL * .98 + .03], pitch: 0, yaw: s * .06, pole: [s * .1, 0, 1] })) }),
  sitDrive: sp => ({ root: [0, Math.min(.47, sp.legL * .96), -.06], spine: [-.1, 0, 0], head: [.02, 0, 0], ...both({ t: [-.05, -.1, .66], pole: [.5, -1, -.2], curl: .8, ic: .8, tc: .6, fo: [0, .1, .6] }),
    ...feet(s => ({ p: [s * sp.hipJ * 1.15, s < 0 ? .02 : 0, -.06 + sp.thighL * .98 + (s < 0 ? .13 : .03)], pitch: s < 0 ? .25 : 0, yaw: s * .06, pole: [s * .1, 0, 1] })) }),
  crouch: sp => ({ root: [0, sp.legL * .56, -.1 * sp.k], rot: [0, 0, 0], spine: [.42, 0, 0], head: [-.3, 0, 0], ...both({ t: [.2, -.5, .55], pole: [.6, -.3, -.4], curl: .5 }), ...feet(s => ({ p: [s * sp.hipJ * 1.7, 0, .06 * sp.k], pitch: -.1, yaw: s * .25, pole: [s * .5, 0, 1] })) }),
  kneel: sp => ({ root: [0, sp.thighL + .075 * sp.k, 0], spine: [.05, 0, 0], head: [-.05, 0, 0], ...both({ t: [.12, -.7, .45], pole: [.5, -.3, -1], curl: .4 }),
    ...feet(s => ({ p: [s * sp.hipJ * 1.15, .045 - sp.ankleH + .0, -sp.shinL * .95], pitch: 3.0, yaw: 0, pole: [s * .1, 0, 1] })) }),
  crawl: (sp, ph) => { const k = sp.k, a = Math.sin(TAU * ph), b = Math.sin(TAU * (ph + .5)), lift = v => Math.max(0, Math.cos(TAU * v)) * .09 * k, hy = sp.legL * .5, hz = -.42 * k;
    const hand = (s, z, ly) => ({ g: 1, t: [s * sp.shX * 1.1, .035 + ly, hz + .5 * k + z], pole: [s * .4, 0, -.2], curl: .5, ic: .5, tc: .3, n: [0, 0, 0] });
    return { root: [0, hy, hz], rot: [Math.PI / 2 - .05, 0, 0], spine: [.0, 0, 0], head: [-1.2, 0, 0], hang: 1, L: Object.assign(hand(1, .13 * a, lift(ph)), { n: [0, -1, 0] }), R: Object.assign(hand(-1, .13 * b, lift(ph + .5)), { n: [0, -1, 0] }),
      ...feet(s => ({ p: [s * sp.hipJ * 1.1, .045 - sp.ankleH + (s > 0 ? lift(ph + .5) : lift(ph)) * .8, hz - sp.thighL * .0 - sp.shinL * .95 + (s > 0 ? .1 * b : .1 * a) * k], pitch: 3.0, yaw: 0, pole: [s * .1, 0, 1] })) }; },
  lie: sp => ({ root: [0, .115 * sp.k, 0], rot: [-Math.PI / 2, 0, 0], spine: [0, 0, 0], head: [-.08, .15, 0], hang: 0, ...both({ t: [.15, -.96, .0], pole: [.5, 0, -1], curl: .3 }),
    ...feet(s => ({ p: [s * sp.hipJ * 1.25, 0, sp.legL * .96], pitch: -1.2, yaw: 0, pole: [0, 1, 0] })) }),
  scream: sp => ({ root: [0, sp.legL * .95, 0], spine: [-.1, 0, 0], head: [-.28, 0, 0], ...both({ t: [-.2, .24, .2], pole: [.6, -.9, .4], f: [-.05, 1, -.1], fo: [0, .52, 0], curl: .45, ic: .5, tc: .3 }), ...feet(s => ({ p: [s * sp.hipJ * 1.4, 0, .02], pitch: 0, yaw: s * .15, pole: [s * .2, 0, 1] })) }),
  armsUp: sp => ({ root: [0, sp.legL * .975, 0], spine: [-.1, 0, 0], head: [-.12, 0, 0], ...both({ t: [.22, .92, .3], pole: [.8, 0, 0], f: [.1, 1, .25], n: [0, .2, 1], curl: .1, ic: .05, tc: .05 }) }),
  reach: () => ({ spine: [.06, 0, 0], head: [.04, 0, 0], ...both({ t: [.1, .08, .98], pole: [.4, -1, 0], f: [0, .05, 1], n: [-.2, -1, 0], curl: .1, ic: .1, tc: .1 }) }),
  reachR: () => ({ spine: [.04, -.12, 0], head: [.04, .1, 0], R: { t: [.1, .1, .98], pole: [.4, -1, 0], f: [0, .05, 1], n: [-.2, -1, 0], curl: .1, ic: .1, tc: .1 } }),
  point: () => ({ spine: [0, .1, 0], head: [0, .12, 0], R: { t: [.06, .12, .98], pole: [.4, -1, 0], f: [0, .05, 1], n: [-.2, -.2, 0], curl: 1, ic: 0, tc: .6 } }),
  phone: sp => ({ spine: [0, .05, -.04], head: [.02, -.12, .24], R: { t: [-.14, .22, .08], pole: [.2, -.8, 1], f: [-.15, 1, -.25], fo: [0, .52, 0], curl: .5, ic: .45, tc: .1 }, L: { t: [.1, -.97, .1], pole: [.4, -.2, -1] } }),
  hold: () => ({ spine: [.04, 0, 0], head: [.08, 0, 0], ...both({ t: [-.22, -.32, .66], pole: [.5, -1, -.1], f: [0, .1, 1], fo: [0, -.2, .65], curl: .5, ic: .5, tc: .4 }) }),
  cower: sp => ({ root: [0, sp.legL * .43, -.08 * sp.k], spine: [.85, 0, 0], head: [.45, 0, 0], ...both({ t: [-.12, .5, .12], pole: [.3, -.4, .9], f: [-.3, .8, -.4], fo: [0, .52, 0], curl: .8, ic: .8, tc: .5 }), ...feet(s => ({ p: [s * sp.hipJ * 1.3, 0, .08 * sp.k], pitch: -.15, yaw: s * .2, pole: [s * .4, 0, 1] })) }),
  wave: (sp, ph) => ({ spine: [0, .06, 0], head: [0, -.1, .05], R: { t: [.2 + .12 * Math.sin(TAU * ph * 2), .55, .45], pole: [.6, .2, -.4], f: [0, 1, .15], n: [0, 0, 1], curl: 0, ic: 0, tc: 0 } }),
  shamble: (sp, ph) => { const g = gait(sp, ph, 0), a = Math.sin(TAU * ph); g.root[1] -= .04 * sp.k; g.root[2] = .0; g.spine = [.22, .06 * a, .05]; g.head = [.15, .0, .22]; g.rot[0] = .12;
    g.L = { t: [.1, -.25, .9], pole: [.5, -1, 0], f: [0, -.3, 1], n: [-1, 0, 0], curl: .5, ic: .4, tc: .3 }; g.R = { t: [.1, -.5 + .1 * a, .72], pole: [.5, -1, 0], f: [0, -.4, 1], n: [-1, 0, 0], curl: .6, ic: .5, tc: .3 };
    g.fL.p[2] *= .6; g.fR.p[2] *= .6; g.fL.p[1] *= .6; g.fR.p[1] *= .6; return g; }
};
const resolve = (name, sp, ph, lib) => { const B = base(sp), fn = (lib && lib[name]) || POSES[name] || POSES.stand, ov = fn(sp, ph || 0); for (const k of Object.keys(ov)) { if (k === 'L' || k === 'R' || k === 'fL' || k === 'fR') B[k] = Object.assign(B[k], ov[k]); else B[k] = ov[k]; } return B; };
const blendP = (a, b, k) => { if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => blendP(v, b[i], k)); if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k); if (a && b && typeof a === 'object' && typeof b === 'object') { const o = {}; for (const key of Object.keys(a)) o[key] = blendP(a[key], b[key], k); return o; } return k < .5 ? a : b; };

// ---------- IK + orientation helpers ----------
function ik2(A, T, l1, l2, pole, E, Wr) {
  const dir = T.clone().sub(A); let d = dir.length(); if (d < 1e-5) { dir.set(0, -1, 0); d = 1e-5; } else dir.divideScalar(d);
  d = clamp(d, Math.abs(l1 - l2) + .005, (l1 + l2) * .9995);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a)), pp = pole.clone().addScaledVector(dir, -pole.dot(dir));
  if (pp.lengthSq() < 1e-6) { pp.set(0, 0, 1).addScaledVector(dir, -dir.z); if (pp.lengthSq() < 1e-6) pp.set(1, 0, 0); } pp.normalize();
  E.copy(A).addScaledVector(dir, a).addScaledVector(pp, hh); Wr.copy(A).addScaledVector(dir, d);
}
const _m = new THREE.Matrix4(), _x = V(), _y = V(), _z = V(), _t = V(), _dn = V(0, -1, 0);
function orient(obj, f, n) {
  _y.copy(f).normalize(); _z.copy(n).multiplyScalar(-1); _z.addScaledVector(_y, -_z.dot(_y)); if (_z.lengthSq() < 1e-6) { _z.set(0, 0, 1); _z.addScaledVector(_y, -_z.dot(_y)); if (_z.lengthSq() < 1e-6) _z.set(1, 0, 0); } _z.normalize(); _x.crossVectors(_y, _z);
  _m.makeBasis(_x, _y, _z); obj.quaternion.setFromRotationMatrix(_m);
}
function seg(m, a, b) { const d = _t.copy(b).sub(a), l = Math.max(d.length(), 1e-4); m.position.copy(a); m.quaternion.setFromUnitVectors(_dn, d.divideScalar(l)); m.scale.set(1, l, 1); }

// ---------- hats ----------
// a wide-brim hat sitting on the skull group (skull origin = the chin, y up); brim radius in metres
function hatParts(sp, mat, bandMat, brim = .27) {
  const k = sp.k, g = new THREE.Group(), bR = brim * sp.k, w2 = sp.headW / 2, d2 = sp.headD / 2, ch = sp.headH * .3 + .05 * k, y0 = sp.headH * .72;
  const rings = [{ y: -.016 * k, rx: bR, rz: bR }, { y: -.006 * k, rx: bR * .72, rz: bR * .72 }, { y: .004 * k, rx: w2 * 1.55, rz: d2 * 1.5 }, { y: .016 * k, rx: w2 * 1.24, rz: d2 * 1.2 }, { y: ch, rx: w2 * 1.16, rz: d2 * 1.12 }, { y: ch + .01 * k, rx: w2 * .8, rz: d2 * .8 }];
  mk(loft(rings, { n: 12, capTop: true }), mat, g);
  mk(loft([{ y: .014 * k, rx: w2 * 1.26, rz: d2 * 1.22 }, { y: .05 * k, rx: w2 * 1.22, rz: d2 * 1.18 }], { n: 12 }), bandMat, g);
  g.position.y = y0; return g;
}

// ---------- wings (bat-like; membranes rebuilt from joint positions every setWings) ----------
// J = folded joint positions, S1 = spread ones (shoulder, elbow, wrist, 4 finger tips, body attach), in metres at scale 1, x outward.
function buildWings(parent, mat, boneMat, sc, base) {
  const J = [[.12, .28, -.12], [.2, -.1, -.22], [.22, .4, -.26], [.24, -1.0, -.3], [.2, -1.15, -.28], [.16, -1.25, -.26], [.12, -1.3, -.22], [.1, -.55, -.12]];
  const S1 = [[.12, .28, -.12], [.6, .7, -.3], [1.2, 1.05, -.22], [2.0, .65, -.3], [1.85, -.05, -.42], [1.45, -.62, -.5], [.85, -1.1, -.45], [.1, -.55, -.12]];
  const tris = [[0, 1, 2], [0, 2, 7], [2, 3, 8], [2, 8, 4], [2, 4, 9], [2, 9, 5], [2, 5, 10], [2, 10, 6], [2, 6, 11], [2, 11, 7]], bones = [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [2, 6]];
  const scal = P => { const o = P.slice(); for (const [a, b] of [[3, 4], [4, 5], [5, 6], [6, 7]]) o.push(P[a].map((v, i) => (v + P[b][i]) / 2 + (P[2][i] - (v + P[b][i]) / 2) * .16)); return o; }, SS = scal(S1);
  const sides = [1, -1].map(s => {
    const verts = [], map = {}, idx = [], uv = [], vid = ids => { const key = ids.slice().sort().join('_'); if (!(key in map)) { map[key] = verts.length; verts.push(ids); } return map[key]; };
    for (const [a, b, c] of tris) { const A = [a], B = [b], C = [c], AB = [a, b], AC = [a, c], BC = [b, c]; for (const t of [[A, AB, AC], [AB, B, BC], [AC, BC, C], [AB, BC, AC]]) t.forEach(q => idx.push(vid(q))); }
    for (const ids of verts) { const pt = ids.reduce((acc, id) => [acc[0] + SS[id][0], acc[1] + SS[id][1]], [0, 0]).map(v => v / ids.length); uv.push(pt[0] / 2.2 + .1, pt[1] / 2.4 + .55); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts.length * 3), 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const mesh = mk(geo, mat, parent); mesh.frustumCulled = false;
    const bm = bones.map(() => mk(loft([{ y: 0, rx: .018 * sc, rz: .018 * sc }, { y: -1, rx: .011 * sc, rz: .011 * sc }], { n: 5 }), boneMat, parent));
    return { s, verts, geo, mesh, bm };
  });
  const r0 = V(...J[0]);
  const set = k => {
    const e = sstep(k);
    for (const Wg of sides) { const mixed = scal(J.map((a, i) => a.map((v, c) => lerp(v, S1[i][c], e)))), pts = mixed.map(a => { const p = V(a[0], a[1], a[2]).sub(r0); p.x *= Wg.s; p.multiplyScalar(sc); p.x += base.x * Wg.s; p.y += base.y; p.z += base.z; return p; });
      const pa = Wg.geo.attributes.position;
      Wg.verts.forEach((ids, i) => { const p = V(); ids.forEach(id => p.add(pts[id])); p.divideScalar(ids.length); pa.setXYZ(i, p.x, p.y, p.z); }); pa.needsUpdate = true; Wg.geo.computeVertexNormals(); Wg.geo.computeBoundingSphere();
      bones.forEach(([a, b], i) => seg(Wg.bm[i], pts[a], pts[b])); }
  };
  set(0); return { set };
}

// ---------- the person ----------
function buildPerson(o0) {
  const o = Object.assign({}, o0), sp = spec(o), W = wardrobe(o), skin = o.skin || '#d6a084', fem = sp.f;
  const hairStyle = o.hair || (fem ? 'long' : 'short'), hairC = o.hairColor || '#3a2a1e', bare = o.shoes === 'bare', shoeC = bare ? skin : (o.shoes || (sp.kid || o.build === 'teen' ? '#d8d4cc' : '#2a2420'));
  W.dirty = !!o._dirty;
  const K = {
    skin: solid(skin), torso: matC('T' + [W.top, W.topC, W.skin, W.ragged, W.pat, W.belt].join('|'), torsoTex(W)), pelvis: matC('P' + [W.top, W.topC, W.botC, W.bn, W.belt, W.hem, W.ragged].join('|'), pelvisTex(W)),
    upA: matC('A' + ['up', W.sl, W.topC, W.skin, W.ragged].join('|'), armTex(W, 'up')), loA: matC('A' + ['lo', W.sl, W.topC, W.skin, W.ragged].join('|'), armTex(W, 'lo')),
    thigh: matC('L2' + ['th', W.leg, W.botC, W.bn, W.skin, W.ragged].join('|'), legTex(W, 'th')), shin: matC('L2' + ['sh', W.leg, W.botC, W.bn, W.skin, W.ragged].join('|'), legTex(W, 'sh')),
    shoulder: W.sl === 'none' ? solid(skin) : solid(W.topC), elbow: W.sl === 'long' ? solid(W.topC) : solid(skin), knee: W.leg === 'full' ? solid(W.botC) : solid(skin),
    hand: o.gloves ? solid(o.gloves) : solid(skin), hair: hairMat(hairC), cloth: solid(W.topC, { side: THREE.DoubleSide }), neck: solid(skin)
  };
  if (W.skirt) K.skirt = matC('K' + [W.skirt, W.skirtC, W.pat, W.ragged, W.dirty].join('|'), skirtTex(W), { side: THREE.DoubleSide });
  if (o._flat) for (const key of Object.keys(K)) K[key] = solid(o._flat, { unlit: true, noFog: !!o._noFog, side: THREE.DoubleSide });
  const fdesc = e => ({ skin, hairC, hair: hairStyle, expr: e, sex: o.sex || 'm', beard: o.beard || 0, kid: sp.kid, style: o._face || '', iris: o.eyes || '', eyeSide: o._eyeSide || '' });
  const faceM = M(faceTex(fdesc(o.expression || 'calm')), { unlit: !!o._flat, noFog: !!o._noFog });

  const G = new THREE.Group(); G.name = 'ps1-human';
  const root = gp(G, 0, sp.legL, 0), chest = gp(root, 0, sp.waistOff, 0), head = gp(chest, 0, sp.neckTop, sp.neckZ), skull = gp(head, 0, -sp.pv, sp.fz), hang = gp(head);
  root.rotation.order = chest.rotation.order = head.rotation.order = 'YXZ';
  const H = sp.H, k = sp.k, bk = W.bulk, bz = sp.belly, bs = sp.bust;
  // torso: a pelvis loft (root) and a chest loft (chest), both with a front/back texture atlas
  const pelv = [{ y: -.05 * H, rx: sp.hipRx * .8, rz: sp.hipRz * .75, cz: -.004 }, { y: -.02 * H, rx: sp.hipRx * .98 * bk, rz: sp.hipRz * .98 * bk }, { y: .015 * H, rx: sp.hipRx * bk, rz: sp.hipRz * bk },
    { y: .055 * H, rx: lerp(sp.hipRx, sp.waistRx, .6) * bk, rz: lerp(sp.hipRz, sp.waistRz, .6) * bk + bz * .5, cz: bz * .5 }, { y: sp.waistOff + .02 * H, rx: sp.waistRx * bk * .99, rz: sp.waistRz * bk * .99 + bz, cz: bz }];
  { const y0 = pelv[0].y, y1 = pelv[pelv.length - 1].y, sh = W.hem;
    if (sh > 0 && sh < 16) { const at = y => { for (let i = 1; i < pelv.length; i++) if (y <= pelv[i].y) { const a = pelv[i - 1], b = pelv[i], t = (y - a.y) / (b.y - a.y); return { y, rx: lerp(a.rx, b.rx, t), rz: lerp(a.rz, b.rz, t), cx: 0, cz: lerp(a.cz || 0, b.cz || 0, t) }; } return pelv[pelv.length - 1]; };
      const yt = y0 + (1 - (sh - .5) / 16) * (y1 - y0), yb = y0 + (1 - (sh + .5) / 16) * (y1 - y0); pelv.push(at(yt), at(yb)); pelv.sort((a, b) => a.y - b.y); } }
  mk(loft(pelv, { n: 8, uv: 'atlas', capBot: true }), K.pelvis, root);
  const shRx = sp.chestRx * .98 * bk, nR = sp.neckR;
  const ch = [{ y: -.03 * H, rx: sp.waistRx * bk * .985, rz: sp.waistRz * bk * .985 + bz, cz: bz }, { y: 0, rx: sp.waistRx * bk, rz: sp.waistRz * bk + bz, cz: bz },
    { y: .05 * H, rx: lerp(sp.waistRx, sp.chestRx, .65) * bk, rz: lerp(sp.waistRz, sp.chestRz, .7) * bk + bz * .4, cz: bz * .5 + bs * .4 }, { y: .115 * H, rx: sp.chestRx * bk, rz: (sp.chestRz + bs) * bk, cz: bs * .5 },
    { y: .165 * H, rx: shRx, rz: sp.chestRz * .78 * bk }, { y: sp.nbL - .035 * k, rx: lerp(shRx, nR * 1.5, .55), rz: lerp(sp.chestRz * .78 * bk, nR * 1.35, .55), cz: -.003 }, { y: sp.nbL, rx: nR * 1.5, rz: nR * 1.35, cz: -.005 }];
  mk(loft(ch, { n: 8, uv: 'atlas', capTop: true, capUV: [.25, .98] }), K.torso, chest);
  // neck + collar
  const nk = sp.neckTop - sp.nbL;
  mk(loft([{ y: sp.nbL - .03 * k, rx: nR * 1.08, rz: nR * 1.0, cz: sp.neckZ }, { y: sp.nbL + nk * .5, rx: nR * .9, rz: nR * .85, cz: sp.neckZ }, { y: sp.neckTop + .02 * k, rx: nR * .86, rz: nR * .84, cz: sp.neckZ }], { n: 8 }), K.neck, chest);
  if (W.col === 'roll') mk(loft([{ y: sp.nbL - .01 * k, rx: nR * 1.35, rz: nR * 1.3, cz: sp.neckZ }, { y: sp.nbL + .06 * k, rx: nR * 1.28, rz: nR * 1.24, cz: sp.neckZ }], { n: 8, capTop: false }), K.cloth, chest);
  else if (W.col === 'hood') mk(loft([{ y: sp.nbL - .02 * k, rx: nR * 1.5, rz: nR * 1.5, cz: -.015 * k }, { y: sp.nbL + .035 * k, rx: nR * 2.0, rz: nR * 2.0, cz: -.04 * k }, { y: sp.nbL + .09 * k, rx: nR * 1.5, rz: nR * 1.7, cz: -.045 * k }], { n: 8 }), K.cloth, chest);
  else if (W.col === 'flaps') mk(loft([{ y: sp.nbL - .01 * k, rx: nR * 1.3, rz: nR * 1.25, cz: sp.neckZ }, { y: sp.nbL + .07 * k, rx: nR * 1.75, rz: nR * 1.6, cz: sp.neckZ - .005 }], { n: 8 }), K.cloth, chest);
  else if (W.col) mk(loft([{ y: sp.nbL - .01 * k, rx: nR * 1.2, rz: nR * 1.15, cz: sp.neckZ }, { y: sp.nbL + .028 * k, rx: nR * 1.18, rz: nR * 1.12, cz: sp.neckZ }], { n: 8 }), K.cloth, chest);
  // head: planar-mapped face on the front half, plain skin on the back
  const hp = headProf(sp), w2 = sp.headW / 2, d2 = sp.headD / 2, hh = sp.headH;
  const faceMesh = mk(loft(hp, { n: 8, uv: 'front', fw: w2, split: true, capTop: true, capBot: true }), [faceM, K.skin], skull);
  mk(wedge(.026 * k * (sp.headW / .155 / k), .05 * (sp.headH / .225), .03 * (sp.headD / .19)), o._face === 'mask' ? solid('#d6d3c8') : K.skin, skull, 0, hh * .42, d2 * .98 + .006 * k);
  if (!o._flat) for (const s of [-1, 1]) mk(box(.014 * k, .045 * (sp.headH / .225), .028 * k), K.skin, skull, s * (w2 * .99 + .004 * k), hh * .45, -.012 * k);
  // hair
  const hairR = ((seed) => NB.rng(seed))(hashSeed(hairStyle + hairC));
  const cap2 = c => mk(shellGeo(sp, c), K.hair, skull);
  if (hairStyle === 'short') cap2({ off: .016 * k, flare: .006 * k, hl: .79, side: .6, back: .36 });
  else if (hairStyle === 'buzz') cap2({ off: .006 * k, hl: .82, side: .66, back: .5 });
  else if (hairStyle === 'bob') { cap2({ off: .014 * k, flare: .03 * k, hl: .77, side: .14, back: .1 }); const q = mk(box(w2 * 1.55, .05 * k, .018 * k), K.hair, skull, 0, hh * .8, d2 + .018 * k); q.rotation.x = .1; }
  else if (hairStyle === 'long') { cap2({ off: .014 * k, flare: .008 * k, hl: .78, side: .3, back: .18 });
    const q = mk(box(w2 * 1.2, .05 * k, .02 * k), K.hair, skull, w2 * .3, hh * .8, d2 + .02 * k); q.rotation.set(.1, 0, -.25);
    const HO = V(0, -sp.pv, sp.fz); mk(loft([{ y: -.0 * k + HO.y + hh * .5, rx: w2 * 1.15 + .015 * k, rz: d2 * .95, cz: HO.z - d2 * .25 }, { y: HO.y + hh * .3 - .12 * k, rx: w2 * 1.2 + .02 * k, rz: .085 * k, cz: -.07 * k }, { y: -.34 * k, rx: .105 * k * (sp.headW / .155 / k), rz: .075 * k, cz: -.075 * k }, { y: -.5 * k - (sp.kid ? 0 : .03), rx: .08 * k, rz: .05 * k, cz: -.075 * k }], { n: 8, capBot: true }), K.hair, hang);
    for (const s of [-1, 1]) { const l = mk(strand(.056 * k, .4 * k, .02 * k, .3), K.hair, hang, s * (w2 + .02 * k), -.27 * k, .05 * k); l.rotation.set(.08, 0, s * .05); } }
  else if (hairStyle === 'ponytail') { cap2({ off: .012 * k, hl: .8, side: .6, back: .42 }); const tie = V(0, hh * .66 - sp.pv, sp.fz - d2 * .98);
    mk(box(.04 * k, .035 * k, .04 * k), solid('#8a2a3a'), hang, tie.x, tie.y, tie.z - .008 * k);
    mk(loft([{ y: 0, rx: .035 * k, rz: .035 * k }, { y: -.1 * k, rx: .045 * k, rz: .04 * k }, { y: -.25 * k, rx: .036 * k, rz: .03 * k }, { y: -.34 * k, rx: .012 * k, rz: .01 * k }], { n: 6, capTop: true }), K.hair, hang, tie.x, tie.y - .015 * k, tie.z - .035 * k); }
  else if (hairStyle === 'curly') { cap2({ off: .008 * k, hl: .8, side: .55, back: .35 });
    for (let i = 0; i < 16; i++) { const th = TAU * (i % 8) / 8 + hairR() * .4, s = i < 8 ? .52 + hairR() * .15 : .85 + hairR() * .1, p = profAt(hp, lerp(.35, 1, s)), off = .03 * k;
      const hz = Math.sin(th) > .5 && s > .6 ? 0 : 1; if (!hz && Math.sin(th) > .5 && s < .7) continue;
      const bl = mk(new THREE.OctahedronGeometry((.04 + hairR() * .015) * k, 0), K.hair, skull, -(p.rx + off) * Math.cos(th), p.y, p.cz + (p.rz + off) * Math.sin(th)); bl.rotation.set(hairR() * 3, hairR() * 3, 0); } }
  else if (hairStyle === 'messy') { cap2({ off: .012 * k, hl: .77, side: .58, back: .38 });
    for (let i = 0; i < 8; i++) { const th = TAU * i / 8 + hairR() * .5, p = profAt(hp, .86 + hairR() * .1), t2 = mk(new THREE.ConeGeometry(.026 * k, (.07 + hairR() * .05) * k, 4), K.hair, skull, -(p.rx * .75) * Math.cos(th), p.y + .02 * k, p.cz + p.rz * .75 * Math.sin(th)); t2.rotation.set(Math.sin(th) * .8, 0, Math.cos(th) * .8 * (hairR() > .5 ? 1 : -1)); }
    for (const [x, len] of [[-.04, .045], [.0, .065], [.045, .04]]) { const f = mk(box(.035 * k, len * k, .018 * k), K.hair, skull, x * k * 1.1, hh * .8 - len * k * .25, d2 + .02 * k); f.rotation.set(.18, 0, x * 4); } }
  // arms, legs, hands, feet: parented to G, posed in G space
  const aR = sp.aR, lR = sp.lR, arms = {}, legs = {};
  const upG = loft([{ y: 0, rx: aR, rz: aR }, { y: -.45, rx: aR * .97, rz: aR * .97 }, { y: -1, rx: aR * .8, rz: aR * .8 }], { n: 8, capBot: true }), loG = loft([{ y: 0, rx: aR * .78, rz: aR * .78 }, { y: -.3, rx: aR * .8, rz: aR * .8 }, { y: -1, rx: aR * .5, rz: aR * .5 }], { n: 8, capBot: true });
  const thG = loft([{ y: 0, rx: lR, rz: lR }, { y: -.4, rx: lR * .93, rz: lR * .97 }, { y: -1, rx: lR * .62, rz: lR * .62 }], { n: 8, capBot: true }), shG = loft([{ y: 0, rx: lR * .6, rz: lR * .6 }, { y: -.28, rx: lR * .64, rz: lR * .68 }, { y: -1, rx: lR * .4, rz: lR * .4 }], { n: 8, capBot: true });
  const bigShoe = shoeParts(sp, bare, shoeC, lum(shoeC, -.45), skin);
  for (const s of [1, -1]) {
    const hand = makeHand(s, sp.hs, K.hand); G.add(hand.g);
    arms[s] = { up: mk(upG, K.upA, G), lo: mk(loG, K.loA, G), shoulder: mk(ico(aR * 1.04), K.shoulder, G), elbow: mk(ico(aR * .84), K.elbow, G), hand };
    const foot = bigShoe.clone(); foot.traverse(m => { if (m.isMesh && o._flat) m.material = K.skin; }); G.add(foot);
    legs[s] = { th: mk(thG, K.thigh, G), sh: mk(shG, K.shin, G), knee: mk(ico(lR * .66), K.knee, G), foot };
  }
  if (o._flat) for (const s of [1, -1]) { legs[s].foot.traverse(m => { if (m.isMesh) m.material = K.skin; }); }
  // skirt / long coat hem: a cone hung from the pelvis that swings forward with the thighs
  let skirt = null, skFollow = .85, skMax = 1.3, strideK = 1;
  if (W.skirt) { if (W.skirt === 'gown' || W.skirt === 'coat') { skFollow = .5; skMax = .8; strideK = W.skirt === 'gown' ? .7 : .78; } else strideK = .88; const len = { skirt: sp.thighL * .8, dress: sp.thighL + .1 * k, gown: sp.thighL + sp.shinL * .75, coat: sp.thighL + sp.shinL * .55 }[W.skirt] * (o._skirtLen || 1), flare = { skirt: 1.5, dress: 1.55, gown: 1.62, coat: 1.5 }[W.skirt] * (o._skirtFlare || 1);
    skirt = mk(loft([{ y: .03 * H, rx: sp.hipRx * 1.02 * bk, rz: sp.hipRz * 1.02 * bk, cz: bz * .4 }, { y: -.02 * H, rx: sp.hipRx * 1.12 * bk, rz: sp.hipRz * 1.1 * bk }, { y: -len * .5, rx: sp.hipRx * lerp(1.12, flare, .45), rz: sp.hipRz * lerp(1.1, flare * .95, .45) }, { y: -len, rx: sp.hipRx * flare, rz: sp.hipRz * flare * .95 }], { n: 10, capTop: false }), K.skirt, root); }
  if (W.top === 'hoodie' || W.top === 'jacket') { /* body already bulked */ }
  // ----- pose machinery -----
  const Hh = { G, sp, root, chest, head, skull, opts: o, poses: Object.keys(Object.assign({}, POSES, o._poses || {})), faceMat: faceM, expr: o.expression || 'calm' };
  const look = { yaw: 0, pitch: 0 }, ONE = V(1, 1, 1), rootM = new THREE.Matrix4(), chestM = new THREE.Matrix4(), cl = new THREE.Matrix4(), headRestInv = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const lib = o._poses || null; let cur = resolve('stand', sp, 0, lib);
  Hh.extra = {};
  function apply() {
    const p = cur;
    root.position.set(...p.root); root.rotation.set(p.rot[0], p.rot[1], p.rot[2]); chest.rotation.set(p.spine[0], p.spine[1], p.spine[2]); head.rotation.set(clamp(p.head[0] + look.pitch, -1.9, 1.2), clamp(p.head[1] + look.yaw, -1.2, 1.2), p.head[2]);
    rootM.compose(root.position, root.quaternion, ONE); cl.compose(chest.position, chest.quaternion, ONE); chestM.multiplyMatrices(rootM, cl);
    const invChest = chestM.clone().invert();
    for (const s of [1, -1]) {
      const P = s > 0 ? p.L : p.R, A = arms[s], mir = v => V(v[0] * s, v[1], v[2]);
      const Sg = V(s * sp.shX, sp.shY, 0).applyMatrix4(chestM), Tg = P.g ? V(...P.t) : V(s * sp.shX + P.t[0] * s * sp.aL, sp.shY + P.t[1] * sp.aL, P.t[2] * sp.aL).applyMatrix4(chestM);
      const pole = mir(P.pole).transformDirection(chestM), E = V(), Wr = V(); ik2(Sg, Tg, sp.upL, sp.loL, pole, E, Wr);
      seg(A.up, Sg, E); seg(A.lo, E, Wr); A.shoulder.position.copy(Sg); A.elbow.position.copy(E); A.hand.g.position.copy(Wr);
      const f = P.f ? mir(P.f).transformDirection(chestM) : Wr.clone().sub(E).normalize();
      const wl = Wr.clone().applyMatrix4(invChest), foc = (P.fo ? mir(P.fo) : V(0, wl.y, wl.z)).applyMatrix4(chestM).sub(Wr);
      let n = P.n && (P.n[0] || P.n[1] || P.n[2]) ? mir(P.n).transformDirection(chestM) : foc; if (n.lengthSq() < 1e-6) n = V(-s, 0, 0).transformDirection(chestM);
      orient(A.hand.g, f, n); A.hand.setCurl(P.curl, P.ic, P.tc);
    }
    let pitchSum = 0;
    for (const s of [1, -1]) {
      const P = s > 0 ? p.fL : p.fR, Lg = legs[s], hip = V(s * sp.hipJ, 0, 0).applyMatrix4(rootM), T = V(P.p[0], sp.ankleH + P.p[1], P.p[2]), pole = V(...P.pole).transformDirection(rootM), E = V(), Wr = V();
      ik2(hip, T, sp.thighL, sp.shinL, pole, E, Wr); seg(Lg.th, hip, E); seg(Lg.sh, E, Wr); Lg.knee.position.copy(E);
      Lg.foot.position.copy(Wr); Lg.foot.rotation.order = 'YXZ'; Lg.foot.rotation.set(P.pitch, P.yaw, 0);
      const dl = E.clone().sub(hip).applyQuaternion(root.quaternion.clone().invert()); pitchSum += Math.atan2(dl.z, -dl.y);
    }
    if (skirt) skirt.rotation.x = -clamp(pitchSum / 2 * skFollow, 0, skMax);
    // hanging hair stays vertical (hang 1) or follows the body (hang 0)
    Q.copy(root.quaternion).multiply(chest.quaternion).multiply(head.quaternion); hang.quaternion.identity().slerp(Q.invert(), clamp(p.hang === undefined ? 1 : p.hang, 0, 1));
    G.updateMatrix(); const hm = new THREE.Matrix4(); const hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(p.head[0], p.head[1], p.head[2], 'YXZ'));
    hm.compose(head.position, hq, ONE); headRestInv.copy(chestM).multiply(hm).invert();
    Hh._chestM = chestM; if (Hh.onApply) Hh.onApply(p);
  }
  Hh.apply = apply;
  Hh.pose = (name, ph = 0) => { cur = resolve(name, sp, ph, lib); if (strideK !== 1 && (name === 'walk' || name === 'run' || name === 'shamble')) { cur.fL.p[2] *= strideK; cur.fR.p[2] *= strideK; } Hh.poseName = name; apply(); return Hh; };
  Hh.blend = (a, pa, b, pb, kk) => { cur = blendP(resolve(a, sp, pa, lib), resolve(b, sp, pb, lib), clamp(kk, 0, 1)); apply(); return Hh; };
  Hh.setExpression = e => { Hh.expr = e; faceM.uniforms.map.value = faceTex(fdesc(e)); return Hh; };
  Hh.hand = side => arms[side === 'R' || side === -1 ? -1 : 1].hand.grip;
  Hh.wrist = side => arms[side === 'R' || side === -1 ? -1 : 1].hand.g;
  Hh.setHandCurl = (side, c, ic = c, tc = c) => arms[side === 'R' ? -1 : 1].hand.setCurl(c, ic, tc);
  Hh.lookAt = v => { if (!v) { look.yaw = look.pitch = 0; apply(); return Hh; } G.updateWorldMatrix(true, false); const d = G.worldToLocal(v.clone()).applyMatrix4(headRestInv);
    look.yaw = clamp(Math.atan2(d.x, d.z), -1.0, 1.0); look.pitch = clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)), -.55, .6); apply(); return Hh; };
  Hh.pose('stand', 0); if (o.pose) Hh.pose(o.pose, o.phase || 0);
  Hh._parts = { K, faceM, sp, W, skirt, arms, legs, faceMesh, hang, skull };
  return Hh;
}

// ---------- monsters (generic archetypes built on the same skeleton) ----------
const mod = (fn, ...mods) => (sp, ph) => { const g = fn(sp, ph); for (const m of mods) m(g, sp, ph); return g; };
const hang = (sp, g) => { for (const a of [g.L, g.R]) { a.t = [.08, -.95, .05]; a.pole = [.4, -.2, -1]; a.curl = .5; a.ic = .5; } };

function ghostGirl(o) {
  o = o || {};
  const lib = {
    stand: () => ({ spine: [.12, 0, .04], head: [.32, .05, .3], ...both({ t: [.08, -.94, .06], pole: [.4, -.2, -1], curl: .5, ic: .5, tc: .3 }) }),
    walk: mod(POSES.walk, (g, sp) => { g.spine = [.1, 0, .05]; g.head = [.3, 0, .3]; for (const a of [g.L, g.R]) { a.t = [.08, -.94, a.t[2] * .35]; a.curl = .5; } g.root[1] -= .01; }),
    crawl: mod(POSES.crawl, g => { g.head = [-1.0, .05, .32]; g.rot[0] += .05; })
  };
  const H = buildPerson(Object.assign({ build: 'child', sex: 'f', height: 1.32, skin: '#c6cbc4', hair: 'long', hairColor: '#07070a', top: 'nightgown', topColor: '#b0b2a8', shoes: 'bare', expression: 'blank', _face: 'ghost', _eyeSide: 'L', _dirty: true, _poses: lib }, o));
  const sp = H.sp, k = sp.k, hm = H._parts.K.hair, hg = H._parts.hang, w2 = sp.headW / 2, d2 = sp.headD / 2, HO = V(0, -sp.pv, sp.fz);
  // the veil: strands hang from the hairline across the face, leaving a gap over her left eye
  const top = HO.y + sp.headH * .84, r = NB.rng(9);
  for (let i = 0; i < 7; i++) { if (i === 4) continue; const x = (-.078 + i * .026) * (sp.headW / .148) + (i === 5 ? .012 : 0), len = (.3 + r() * .14) * k * 1.15;
    const st = mk(strand(.034 * k * 1.1, len, .008 * k, .2 + r() * .3), hm, hg, x, top - len / 2, HO.z + d2 + .022 * k + r() * .006); st.rotation.set(.07 + r() * .05, 0, (r() - .5) * .06); }
  return H;
}

function tallFigure(o) {
  o = o || {};
  const coatC = typeof o.coat === 'string' ? o.coat : '#26231f', hatC = typeof o.hat === 'string' ? o.hat : '#1a1714', wantHat = o.hat !== false, height = o.height || 2.4;
  const lib = {
    stand: () => ({ spine: [.06, 0, 0], head: [.12, 0, 0], ...both({ t: [.06, -.96, .04], pole: [.3, -.1, -1], curl: .55, ic: .5, tc: .3 }) }),
    walk: mod(POSES.walk, (g, sp) => { g.spine[0] = .08; for (const a of [g.L, g.R]) { a.t[2] *= .5; a.curl = .55; } g.fL.p[2] *= .9; g.fR.p[2] *= .9; })
  };
  const H = buildPerson(Object.assign({ build: 'tall', sex: 'm', height, wide: .74, thick: .62, armScale: 1.16, legScale: 1.03, headScale: .8, neckScale: .8, handScale: 1.3, skin: '#7b8172', hair: 'bald', top: 'coat', topColor: coatC, bottomColor: '#121110', shoes: '#0d0c0b', gloves: '#6c7164', expression: 'blank', _face: 'shadow', _skirtLen: 1.2, _skirtFlare: .8, _poses: lib }, o));
  const sp = H.sp, P = H._parts;
  if (wantHat) { const hat = hatParts(sp, solid(hatC, { side: THREE.DoubleSide }), solid(lum(hatC, -.4)), .27 * (height / 2.4)); H.skull.add(hat); H.hat = hat; }
  if (o.wings) { const wm = matC('wing', texC('wing', 32, 32, (q, w, h, r) => { q.fillStyle = '#2c2622'; q.fillRect(0, 0, w, h); PS.noise(q, w, h, r, '#443a30', 90, .6); PS.noise(q, w, h, r, '#171310', 60, .7); q.fillStyle = '#1a1512'; for (let x = 3; x < w; x += 6) q.fillRect(x, 0, 1, h); q.fillStyle = '#3a312a'; for (let y = 5; y < h; y += 9) q.fillRect(0, y, w, 1); }), { side: THREE.DoubleSide, tint: '#d0c0b0' });
    const wings = buildWings(H.chest, wm, solid('#17130f'), height / 2.4 * .85, V(sp.chestRx * .55, sp.shY - .03 * sp.k, -(sp.chestRz * 1.1 + .03 * sp.k)));
    H.setWings = k => { wings.set(clamp(k, 0, 1)); return H; }; H.wings = wings; }
  else H.setWings = () => H;
  return H;
}

function maskedKiller(o) {
  o = o || {};
  const lib = {
    stand: () => ({ spine: [.1, 0, 0], head: [.2, 0, 0], ...both({ t: [.2, -.93, .08], pole: [.5, -.2, -1], curl: .8, ic: .75, tc: .5 }) }),
    walk: mod(POSES.walk, (g, sp) => { g.spine[0] = .12; g.head[0] = .2; for (const a of [g.L, g.R]) { a.t[2] *= .5; a.t[0] = .2; a.curl = .8; a.ic = .75; } g.root[1] -= .01 * sp.k; })
  };
  return buildPerson(Object.assign({ build: 'heavy', sex: 'm', height: 1.95, wide: 1.06, thick: 1.12, skin: '#c89a80', hair: 'short', hairColor: '#17120e', top: 'coveralls', topColor: '#272b30', shoes: '#14110f', gloves: '#1a1816', expression: 'calm', _face: 'mask', _poses: lib }, o));
}

function zombie(o) {
  o = o || {};
  const lib = {
    stand: () => ({ spine: [.2, 0, .05], head: [.16, .0, .26], ...{ L: { t: [.1, -.82, .3], pole: [.5, -.5, -1], curl: .5, ic: .4, tc: .3 }, R: { t: [.1, -.9, .12], pole: [.5, -.5, -1], curl: .5, ic: .4, tc: .3 } } }),
    walk: POSES.shamble
  };
  return buildPerson(Object.assign({ build: 'adult', sex: 'm', skin: '#98a888', hair: 'messy', hairColor: '#2a2620', top: 'tee', topColor: '#6a6a58', bottom: 'jeans', bottomColor: '#3a3a42', shoes: '#2a2420', expression: 'dead', _face: 'zombie', _ragged: true, _dirty: true, _poses: lib }, o));
}

function shadowMan(o) {
  o = o || {};
  const lib = {
    stand: () => ({ spine: [.03, 0, 0], head: [.05, 0, 0], ...both({ t: [.06, -.96, .04], pole: [.3, -.1, -1], curl: .3, ic: .3, tc: .2 }) })
  };
  const H = buildPerson(Object.assign({ build: 'tall', sex: 'm', height: 2.05, wide: .8, thick: .72, armScale: 1.06, skin: '#000000', hair: 'bald', top: 'jacket', topColor: '#000000', bottomColor: '#000000', shoes: '#000000', expression: 'blank', _flat: '#000000', _noFog: !!o.noFog, _face: 'void', _poses: lib }, o));
  if (o.hat) H.skull.add(hatParts(H.sp, H._parts.K.cloth, H._parts.K.cloth, .22));
  return H;
}

Object.assign(PS.props, { ghostGirl, tallFigure, maskedKiller, zombie, shadowMan });
for (const n of ['ghostGirl', 'tallFigure', 'maskedKiller', 'zombie', 'shadowMan']) PS.props[n + 'View'] = o => { const H = PS.props[n](o); if (o && o.wingK !== undefined && H.setWings) H.setWings(o.wingK); return H.G; };

PS.props.human = o => buildPerson(o || {});
PS.props.humanView = o => { const H = PS.props.human(o); return H.G; };
PS.people = { spec, POSES, buildPerson, loft, grid, done, hatParts, buildWings, solid, matC, texC, faceTex, mix, lum, hashSeed, resolve };
})();
