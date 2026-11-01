// DOLL v2: the studio's character builder. ES module for three.js (r149+). Real-time, no per-episode setup.
//
//   import { createDoll, PRESETS, EMOTIONS, POSES } from './doll.js';
//   const d = createDoll({ ...PRESETS.knight });  scene.add(d.group);
//   d.setPose('walk'); d.setEmotion('scared'); d.talk(true); d.lookAt(new THREE.Vector3(0, 1.6, 3));
//   each frame:  d.update(dt)
//
// WHY IT LOOKS DIFFERENT FROM THE OLD BOX PEOPLE
//  * Every limb is ONE continuous tapered tube that bends through shoulder -> elbow -> wrist (no stacked boxes, no gaps).
//  * Clothes and armor are SHELLS: the same path with a slightly bigger radius over part of the limb (sleeve, bracer, greave),
//    so nothing floats, clips or leaves a seam when the limb bends.
//  * Heads are faceted low-poly skulls (narrow jaw, ears, nose) with a hand-drawn, chunky-pixel face that animates:
//    blinks, eye gaze, eyebrows, 11 emotions and a mouth that talks.
//  * Everything is parametric (height, build, shoulders, hips, skin, hair, outfit, armor) so each doll is unique.
//
// Conventions: y up, the doll faces +z, metres. Side -1 = the doll's left hand (-x), +1 = right (+x).
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ss = x => x * x * (3 - 2 * x);
const table = (keys, vals) => u => { u = clamp(u, 0, 1); for (let i = 1; i < keys.length; i++) if (u <= keys[i]) { const k = (u - keys[i - 1]) / (keys[i] - keys[i - 1]); return lerp(vals[i - 1], vals[i], ss(k)); } return vals[vals.length - 1]; };

const matCache = new Map();
const mat = (c, o = {}) => { const key = c + JSON.stringify(o); if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color: new THREE.Color(c), flatShading: true, side: THREE.DoubleSide, ...o })); return matCache.get(key); };
const metal = (c) => new THREE.MeshStandardMaterial({ color: new THREE.Color(c), flatShading: true, metalness: .55, roughness: .38, side: THREE.DoubleSide });

// ---------------------------------------------------------------- Tube: a bendable, tapered, closed tube along a curve
class Tube {
  // o: { sides, rings, t0, t1, radius: t => [rx, rz] (absolute t on the curve), grow, material, ref }
  constructor(o) {
    this.o = { sides: 7, rings: 8, t0: 0, t1: 1, grow: 0, ref: V(0, 0, 1), ...o };
    const { sides, rings } = this.o, nV = (rings + 1) * sides + 2;
    this.pos = new Float32Array(nV * 3); const idx = [];
    for (let r = 0; r < rings; r++) for (let s = 0; s < sides; s++) { const a = r * sides + s, b = r * sides + (s + 1) % sides, c = (r + 1) * sides + s, d = (r + 1) * sides + (s + 1) % sides; idx.push(a, c, b, b, c, d); }
    const c0 = (rings + 1) * sides, c1 = c0 + 1;
    for (let s = 0; s < sides; s++) { idx.push(c0, s, (s + 1) % sides); idx.push(c1, rings * sides + (s + 1) % sides, rings * sides + s); }
    this.geo = new THREE.BufferGeometry(); this.geo.setIndex(idx);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(this.geo, this.o.material); this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    this._n = V(); this._b = V(); this._p = V(); this._t = V();
  }
  update(curve) {
    const { sides, rings, t0, t1, radius, grow, ref } = this.o, P = this.pos, n = this._n, b = this._b, p = this._p, tan = this._t;
    for (let r = 0; r <= rings; r++) {
      const t = lerp(t0, t1, r / rings); curve.getPoint(t, p); curve.getTangent(Math.min(.999, Math.max(.001, t)), tan).normalize();
      if (r === 0) { n.copy(ref); if (Math.abs(n.dot(tan)) > .9) n.set(1, 0, 0); } n.addScaledVector(tan, -n.dot(tan)).normalize();
      b.crossVectors(tan, n);
      let [rx, rz] = radius(t); if (this.o.round) { const u = r / rings, e = .16, a0 = this.o.round !== 'end' ? Math.max(.12, Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, u / e), 2)))) : 1, a1 = this.o.round !== 'start' ? Math.max(.12, Math.sqrt(Math.max(0, 1 - Math.pow(1 - Math.min(1, (1 - u) / e), 2)))) : 1; rx *= Math.min(a0, a1); rz *= Math.min(a0, a1); }
      for (let s = 0; s < sides; s++) { const a = s / sides * Math.PI * 2, cx = Math.cos(a) * (rx + grow), cz = Math.sin(a) * (rz + grow), i = (r * sides + s) * 3;
        P[i] = p.x + n.x * cx + b.x * cz; P[i + 1] = p.y + n.y * cx + b.y * cz; P[i + 2] = p.z + n.z * cx + b.z * cz; }
      if (r === 0 || r === rings) { const i = ((rings + 1) * sides + (r === 0 ? 0 : 1)) * 3; P[i] = p.x; P[i + 1] = p.y; P[i + 2] = p.z; }
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- 2-bone IK (shoulder/hip, target, hint = which way the elbow/knee points)
function ik(root, target, l1, l2, hint, out) {
  const d0 = target.clone().sub(root), dist = clamp(d0.length(), .05, l1 + l2 - .002), dir = d0.normalize();
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const hv = hint.clone().addScaledVector(dir, -hint.dot(dir)); if (hv.lengthSq() < 1e-6) hv.set(0, 0, 1); hv.normalize();
  out.mid.copy(root).addScaledVector(dir, a).addScaledVector(hv, h); out.end.copy(root).addScaledVector(dir, dist); return out;
}

// ---------------------------------------------------------------- the face: a canvas painted every frame and shown on a head patch
export const EMOTIONS = {
  //            brow tilt (+angry, -sad), brow height, eyes open, smile (+) / frown (-), mouth open, mouth width, blush, pupil size
  neutral:   { tilt: 0,    bh: 0,   eye: 1,   smile: 0,   open: 0,   wide: 1,   blush: 0,  pupil: 1 },
  happy:     { tilt: -.1,  bh: .2,  eye: .82, smile: 1,   open: .18, wide: 1.2, blush: .5, pupil: 1.1 },
  sad:       { tilt: -.9,  bh: .1,  eye: .7,  smile: -.8, open: 0,   wide: .8,  blush: 0,  pupil: 1.15 },
  angry:     { tilt: 1,    bh: -.5, eye: .72, smile: -.5, open: .1,  wide: 1.1, blush: 0,  pupil: .8 },
  scared:    { tilt: -.7,  bh: 1,   eye: 1.3, smile: -.2, open: .5,  wide: .9,  blush: 0,  pupil: .6 },
  surprised: { tilt: 0,    bh: 1,   eye: 1.3, smile: 0,   open: .6,  wide: .55, blush: 0,  pupil: .9 },
  scream:    { tilt: -.5,  bh: 1,   eye: 1.2, smile: -.1, open: 1,   wide: 1,   blush: 0,  pupil: .55 },
  disgust:   { tilt: .5,   bh: -.2, eye: .6,  smile: -.9, open: .15, wide: 1.2, blush: 0,  pupil: .9 },
  sleepy:    { tilt: -.2,  bh: -.3, eye: .35, smile: .1,  open: .05, wide: .9,  blush: 0,  pupil: 1 },
  smirk:     { tilt: .35,  bh: .1,  eye: .8,  smile: .6,  open: 0,   wide: 1,   blush: 0,  pupil: 1, skew: .6 },
  dead:      { tilt: 0,    bh: 0,   eye: 0,   smile: -.1, open: .12, wide: 1,   blush: 0,  pupil: 1, dead: 1 },
};
const FACE_KEYS = ['tilt', 'bh', 'eye', 'smile', 'open', 'wide', 'blush', 'pupil', 'skew', 'dead'];

function drawFace(ctx, W, H, f, look, o) {
  ctx.clearRect(0, 0, W, H);
  const ex = [W * .3, W * .7], ey = H * .46, ew = W * .14 * (o.eyeSize || 1), eh = H * .115 * (o.eyeSize || 1);
  const skinDark = o.skinShade, iris = o.iris, brow = o.browColor;
  // blush
  if (f.blush > .02) { ctx.fillStyle = `rgba(230,90,90,${.3 * f.blush})`; for (const x of ex) { ctx.beginPath(); ctx.ellipse(x, H * .62, W * .1, H * .045, 0, 0, 7); ctx.fill(); } }
  for (let i = 0; i < 2; i++) {
    const x = ex[i], side = i === 0 ? -1 : 1, open = clamp(f.eye, 0, 1.35);
    if (f.dead) { ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2.2; const r = ew * .7; ctx.beginPath(); ctx.moveTo(x - r, ey - r); ctx.lineTo(x + r, ey + r); ctx.moveTo(x + r, ey - r); ctx.lineTo(x - r, ey + r); ctx.stroke(); }
    else if (open < .06) { ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - ew, ey + 1); ctx.quadraticCurveTo(x, ey + 3, x + ew, ey + 1); ctx.stroke(); }
    else {
      const h = eh * open; ctx.save(); ctx.beginPath(); ctx.ellipse(x, ey, ew, h, 0, 0, 7); ctx.clip();
      ctx.fillStyle = '#f2eee6'; ctx.fillRect(x - ew, ey - h, ew * 2, h * 2);
      const px = x + look[0] * ew * .55, py = ey + look[1] * h * .5, pr = Math.min(h, ew) * .78 * clamp(f.pupil, .6, 1.2);
      ctx.fillStyle = iris; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill();
      ctx.fillStyle = '#0c0a0a'; ctx.beginPath(); ctx.arc(px, py, pr * .52 * f.pupil, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(px - pr * .45, py - pr * .55, Math.max(1, pr * .3), Math.max(1, pr * .3));
      // lids: tired/angry lids cut across the top
      const lid = clamp(f.tilt, 0, 1) * .55 + clamp(1 - f.eye, 0, 1) * .3; if (lid > .02) { ctx.fillStyle = skinDark; ctx.beginPath(); ctx.moveTo(x - ew - 1, ey - h - 1); ctx.lineTo(x + ew + 1, ey - h - 1); ctx.lineTo(x + ew + 1, ey - h + h * 2 * lid * (side < 0 ? 1.3 : .5)); ctx.lineTo(x - ew - 1, ey - h + h * 2 * lid * (side < 0 ? .5 : 1.3)); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(30,18,14,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, ey, ew, h, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
    // eyebrow: inner end goes down for angry (tilt>0), up for sad (tilt<0)
    const by = ey - eh * 1.9 - f.bh * H * .055, inner = -f.tilt * H * .07, outer = f.tilt * H * .015;
    ctx.strokeStyle = brow; ctx.lineWidth = (o.browThick || 2.6); ctx.lineCap = 'round'; ctx.beginPath();
    const innerX = x + (side < 0 ? ew * 1.0 : -ew * 1.0), outerX = x + (side < 0 ? -ew * 1.15 : ew * 1.15);
    ctx.moveTo(innerX, by + inner); ctx.quadraticCurveTo((innerX + outerX) / 2, by + (inner + outer) / 2 - 1.4, outerX, by + outer); ctx.stroke();
  }
  // mouth
  const mx = W / 2, my = H * .745, mw = W * .15 * f.wide, sm = f.smile, op = f.open * H * .13, skew = f.skew || 0;
  ctx.lineCap = 'round';
  if (op > 1.2) {
    ctx.fillStyle = '#2a0c0c'; ctx.beginPath(); ctx.moveTo(mx - mw, my - sm * 2);
    ctx.quadraticCurveTo(mx, my - sm * 4 - op * .5, mx + mw, my - sm * 2 - skew * 2);
    ctx.quadraticCurveTo(mx, my + op * 1.4 + Math.max(0, sm) * 2, mx - mw, my - sm * 2); ctx.fill();
    if (op > 3) { ctx.fillStyle = '#d9615f'; ctx.beginPath(); ctx.ellipse(mx, my + op * .75, mw * .5, op * .3, 0, 0, 7); ctx.fill(); }
    if (f.smile > .3) { ctx.fillStyle = '#f4f0e6'; ctx.fillRect(mx - mw * .7, my - sm * 3 - op * .35, mw * 1.4, Math.max(1.2, op * .22)); }
  } else { ctx.strokeStyle = '#3a1814'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx - mw, my - sm * 1.5 + (sm < 0 ? 0 : 0)); ctx.quadraticCurveTo(mx, my + sm * 3.2 + 1, mx + mw, my - sm * 1.5 - skew * 2.5); ctx.stroke(); }
}

// ---------------------------------------------------------------- hair
function skull(sx, sy, sz, geo) {   // deform a unit sphere into a skull: narrower jaw
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y < 0) { const k = 1 - .3 * Math.pow(-y, 1.3); x *= k; z *= 1 - .12 * -y; } p.setXYZ(i, x * sx, y * sy, z * sz); }
  geo.computeVertexNormals(); return geo;
}
function hairMeshes(style, color, hd, G) {   // returns meshes in head-local space (head centre = origin)
  const m = mat(color), out = [], [rx, ry, rz] = hd;
  const cap = (th, grow, tilt = -.5, back = 0) => { const g = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * th); const me = new THREE.Mesh(g, m); me.scale.set(rx * grow, ry * grow, rz * grow); me.rotation.x = tilt; me.position.set(0, ry * .02, -back); return me; };
  const add = me => { me.castShadow = true; out.push(me); return me; };
  switch (style) {
    case 'bald': break;
    case 'short': add(cap(.56, 1.07)); break;
    case 'side': { add(cap(.58, 1.07, -.4)); const f = add(new THREE.Mesh(new THREE.BoxGeometry(rx * 1.1, ry * .22, rz * .35), m)); f.position.set(rx * .25, ry * .62, rz * .72); f.rotation.z = -.25; break; }
    case 'long': { add(cap(.6, 1.08)); const back = add(new THREE.Mesh(new THREE.BoxGeometry(rx * 2.05, ry * 2.1, rz * .5), m)); back.position.set(0, -ry * .45, -rz * .72); for (const s of [-1, 1]) { const sd = add(new THREE.Mesh(new THREE.BoxGeometry(rx * .28, ry * 1.8, rz * 1.1), m)); sd.position.set(s * rx * 1.0, -ry * .3, -rz * .12); } break; }
    case 'bob': { add(cap(.6, 1.09)); const back = add(new THREE.Mesh(new THREE.CylinderGeometry(rx * 1.1, rx * 1.18, ry * 1.15, 8, 1, true), m)); back.position.set(0, -ry * .2, -rz * .1); back.scale.z = 1.05; break; }
    case 'ponytail': { add(cap(.56, 1.07)); const t = add(new THREE.Mesh(new THREE.CapsuleGeometry(rx * .22, ry * 1.2, 3, 6), m)); t.position.set(0, -ry * .15, -rz * 1.25); t.rotation.x = .35; break; }
    case 'bun': { add(cap(.56, 1.07)); const b = add(new THREE.Mesh(new THREE.IcosahedronGeometry(rx * .5, 1), m)); b.position.set(0, ry * 1.1, -rz * .35); break; }
    case 'spiky': { add(cap(.5, 1.05)); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, c = add(new THREE.Mesh(new THREE.ConeGeometry(rx * .2, ry * .6, 5), m)); c.position.set(Math.sin(a) * rx * .6, ry * (.9 + (i % 2) * .08), Math.cos(a) * rz * .55); c.rotation.set(Math.cos(a) * .6, 0, -Math.sin(a) * .6); } break; }
    case 'mohawk': { add(cap(.4, 1.04, -.1)); for (let i = 0; i < 7; i++) { const c = add(new THREE.Mesh(new THREE.ConeGeometry(rx * .17, ry * (.75 - Math.abs(i - 3) * .08), 4), m)); const a = (i - 3) / 3 * .9; c.position.set(0, ry * Math.cos(a) * .95, rz * Math.sin(a) * -1 * .85 + 0); c.rotation.x = -a * .9; } break; }
    case 'afro': { const a = add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), m)); a.scale.set(rx * 1.45, ry * 1.3, rz * 1.4); a.position.set(0, ry * .35, -rz * .12); break; }
    case 'curly': { add(cap(.58, 1.1)); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = add(new THREE.Mesh(new THREE.IcosahedronGeometry(rx * .28, 0), m)); c.position.set(Math.sin(a) * rx * 1.05, ry * .35 + Math.sin(i * 2) * ry * .2, Math.cos(a) * rz * 1.0 - rz * .08); } break; }
    case 'wild': { add(cap(.6, 1.1)); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = add(new THREE.Mesh(new THREE.ConeGeometry(rx * .14, ry * .9, 4), m)); c.position.set(Math.sin(a) * rx * 1.05, ry * (.1 + (i % 3) * .2), Math.cos(a) * rz * 1.05); c.rotation.set(Math.cos(a) * 1.2, 0, -Math.sin(a) * 1.2); } break; }
    default: add(cap(.56, 1.07));
  }
  return out;
}

// ---------------------------------------------------------------- presets: a lineup of unique people
export const PRESETS = {
  drifter: { name: 'Drifter', height: 1.82, build: 'lean', skin: '#c79a78', hair: { style: 'wild', color: '#2a1d16' }, beard: 'stubble', top: '#5c5a4a', sleeves: 'long', bottom: '#2f3640', shoes: '#1e1a18', iris: '#4a3a2a', eyeSize: .9 },
  nurse: { name: 'Nurse', height: 1.66, build: 'average', sex: 'f', skin: '#e4b896', hair: { style: 'bun', color: '#5a3a24' }, top: '#9fd0d8', sleeves: 'short', bottom: '#8fc0c8', shoes: '#f0f0f0', iris: '#3d6e8c', eyeSize: 1.1 },
  kid: { name: 'Kid', height: 1.18, build: 'child', skin: '#e0b08a', hair: { style: 'spiky', color: '#c9a042' }, top: '#d04a3a', sleeves: 'short', bottom: '#3a4f8c', shoes: '#eeeeee', iris: '#4a7a3a', eyeSize: 1.25 },
  knight: { name: 'Knight', height: 1.88, build: 'broad', skin: '#b98a68', hair: { style: 'short', color: '#4a3020' }, beard: 'full', top: '#7a2f2f', sleeves: 'long', bottom: '#3b3b44', shoes: '#2a2420', iris: '#5a4a2a', armor: { color: '#aab2bc', trim: '#c9a24a', pieces: ['helmet', 'chest', 'pauldrons', 'bracers', 'gauntlets', 'greaves', 'knees', 'belt'] } },
  runner: { name: 'Runner', height: 1.74, build: 'average', sex: 'f', skin: '#8a5a3c', hair: { style: 'ponytail', color: '#150e0c' }, top: '#e8e04a', sleeves: 'none', bottom: '#2a2a30', bottomStyle: 'shorts', shoes: '#f4f4f4', iris: '#2a1a10', eyeSize: 1.05 },
  elder: { name: 'Elder', height: 1.68, build: 'frail', skin: '#d8b8a0', hair: { style: 'side', color: '#cfcfcf' }, beard: 'moustache', top: '#6d7a64', sleeves: 'long', bottom: '#4a4038', shoes: '#3a2f28', iris: '#6a8a9a', eyeSize: .85 },
  guard: { name: 'Guard', height: 1.8, build: 'heavy', skin: '#d0a07c', hair: { style: 'bald', color: '#000' }, beard: 'moustache', top: '#2b3a55', sleeves: 'short', bottom: '#222a38', shoes: '#111', iris: '#3a2a1a', armor: { color: '#4a5260', trim: '#8a8f99', pieces: ['chest', 'pauldrons', 'knees', 'belt'] } },
};
const BUILDS = { // [torso width, depth, limb thickness, belly, shoulder width, head scale]
  child: [.72, .8, .8, 0, .78, 1.38], lean: [.9, .88, .86, 0, .98, 1], average: [1, 1, 1, 0, 1, 1], broad: [1.12, 1.08, 1.18, 0, 1.15, 1], heavy: [1.18, 1.22, 1.22, .06, 1.08, 1.02], frail: [.9, .85, .8, 0, .92, 1],
};

// ---------------------------------------------------------------- poses (side-aware targets, metres at height 1.75)
// each returns { hips (height of the hip joint), lean, twist, head:[rx, ry, rz], hand:{-1:[x,y,z],1:[...]}, foot:{...}, lift:{-1,1} }
function rest(side) { return { hand: [side * .27, .88, .03], foot: [side * .1, .07, 0], lift: 0 }; }
export const POSES = {
  stand: () => ({ hips: .9, lean: 0, twist: 0, head: [0, 0, 0], L: rest(-1), R: rest(1) }),
  relax: () => ({ hips: .895, lean: .02, twist: .1, head: [.05, .15, .06], L: { hand: [-.25, .84, .08], foot: [-.12, .07, 0], lift: 0 }, R: { hand: [.2, .95, .14], foot: [.12, .07, .08], lift: 0 } }),
  walk: (t, sp = 1) => { const ph = t * 5.2 * sp, f = side => { const q = ph + (side < 0 ? 0 : Math.PI); return { hand: [side * .26, .88 + Math.max(0, Math.sin(q + 1.6)) * .02, -Math.sin(q) * .17], foot: [side * .1, .07 + Math.max(0, Math.cos(q)) * .1, Math.sin(q) * .24], lift: 0 }; };
    return { hips: .9 - Math.abs(Math.sin(ph)) * .022, lean: .03, twist: Math.sin(ph) * .12, head: [0, 0, Math.sin(ph) * .015], L: f(-1), R: f(1) }; },
  run: (t, sp = 1) => { const ph = t * 9.5 * sp, f = side => { const q = ph + (side < 0 ? 0 : Math.PI); return { hand: [side * .22, 1.02 + Math.max(0, Math.sin(q + 1.6)) * .1, -Math.sin(q) * .3 + .1], foot: [side * .1, .07 + Math.max(0, Math.cos(q)) * .27, Math.sin(q) * .4], lift: 0 }; };
    return { hips: .84 - Math.abs(Math.sin(ph)) * .05, lean: .2, twist: Math.sin(ph) * .2, head: [-.12, 0, 0], L: f(-1), R: f(1) }; },
  wave: (t) => ({ hips: .9, lean: 0, twist: -.1, head: [0, .1, .05], L: rest(-1), R: { hand: [.34 + Math.sin(t * 8) * .09, 1.8, .08], foot: [.1, .07, 0], lift: 0 } }),
  point: () => ({ hips: .9, lean: .02, twist: -.25, head: [0, -.25, 0], L: rest(-1), R: { hand: [.2, 1.4, .62], foot: [.1, .07, 0], lift: 0 } }),
  sit: () => ({ hips: .5, lean: -.04, twist: 0, head: [0, 0, 0], L: { hand: [-.2, .66, .3], foot: [-.1, .07, .5], lift: 0 }, R: { hand: [.2, .66, .3], foot: [.1, .07, .5], lift: 0 } }),
  scared: (t) => ({ hips: .82, lean: .12, twist: 0, head: [-.1, 0, 0], L: { hand: [-.1, 1.46 + Math.sin(t * 22) * .006, .26], foot: [-.12, .07, 0], lift: 0 }, R: { hand: [.1, 1.46 + Math.sin(t * 22 + 1) * .006, .26], foot: [.12, .07, .08], lift: 0 } }),
  cower: () => ({ hips: .58, lean: .3, twist: 0, head: [.25, 0, 0], L: { hand: [-.12, 1.2, .3], foot: [-.14, .07, .04], lift: 0 }, R: { hand: [.12, 1.2, .3], foot: [.14, .07, .1], lift: 0 } }),
  handsup: () => ({ hips: .9, lean: -.03, twist: 0, head: [-.05, 0, 0], L: { hand: [-.3, 1.88, .1], foot: [-.1, .07, 0], lift: 0 }, R: { hand: [.3, 1.88, .1], foot: [.1, .07, 0], lift: 0 } }),
  aim: () => ({ hips: .88, lean: .04, twist: .25, head: [0, -.2, 0], L: { hand: [-.1, 1.34, .5], foot: [-.15, .07, -.05], lift: 0 }, R: { hand: [.17, 1.38, .6], foot: [.12, .07, .14], lift: 0 } }),
  reach: () => ({ hips: .88, lean: .22, twist: 0, head: [0, 0, 0], L: { hand: [-.2, 1.2, .65], foot: [-.1, .07, -.06], lift: 0 }, R: { hand: [.2, 1.2, .65], foot: [.1, .07, .14], lift: 0 } }),
  crouch: () => ({ hips: .5, lean: .22, twist: 0, head: [-.2, 0, 0], L: { hand: [-.25, .6, .35], foot: [-.12, .07, .12], lift: 0 }, R: { hand: [.25, .6, .35], foot: [.12, .07, .12], lift: 0 } }),
};
export const HAIR_STYLES = ['bald', 'short', 'side', 'long', 'bob', 'ponytail', 'bun', 'spiky', 'mohawk', 'afro', 'curly', 'wild'];
export const BUILD_NAMES = Object.keys(BUILDS);
export const ARMOR_PIECES = ['helmet', 'chest', 'pauldrons', 'bracers', 'gauntlets', 'greaves', 'knees', 'belt'];
export const ANIMATED = new Set(['walk', 'run', 'wave', 'scared']);

// ---------------------------------------------------------------- the builder
export function createDoll(opts = {}) {
  const o = { height: 1.75, build: 'average', sex: 'm', skin: '#c9a07c', hair: { style: 'short', color: '#4a3020' }, top: '#5a6b86', sleeves: 'long', bottom: '#35363d', bottomStyle: 'pants', shoes: '#2a2420', iris: '#4a5a6a', ...opts };
  const B = BUILDS[o.build] || BUILDS.average, [bw, bd, bt, belly, bs, hs] = B, S = o.height / 1.75, f = o.sex === 'f';
  const G = new THREE.Group(); G.name = o.name || 'doll'; const body = new THREE.Group(); G.add(body);
  const skinM = mat(o.skin), topM = mat(o.top), botM = mat(o.bottom), shoeM = mat(o.shoes);
  const arm = o.armor, has = n => arm && arm.pieces.includes(n), aM = arm ? metal(arm.color) : null, tM = arm ? metal(arm.trim || arm.color) : null;
  const skinShade = '#' + new THREE.Color(o.skin).multiplyScalar(.82).getHexString();

  // -- spine/torso
  const spine = new THREE.CatmullRomCurve3([V(), V(), V(), V()], false, 'centripetal');
  const w = table([0, .12, .35, .68, .88, 1], [f ? .165 : .15, f ? .15 : .14, f ? .11 : .135, f ? .15 : .175, (f ? .165 : .19) * bs, .06].map(x => x * bw * S));
  const dp = table([0, .2, .45, .75, 1], [.1, .1, .09 + belly, .105, .06].map(x => x * bd * S + (x > .09 ? belly * S * .3 : 0)));
  const hipW = table([0, .12], [f ? 1.08 : 1, 1]);
  const torsoR = t => [w(t) * hipW(t), dp(t)];
  const sleeveLen = { long: 1, short: .42, none: 0 }[o.sleeves] ?? 1, shortsy = o.bottomStyle === 'shorts', skirt = o.bottomStyle === 'skirt';
  const torso = new Tube({ sides: 10, rings: 12, radius: torsoR, material: topM, ref: V(1, 0, 0) });
  const pants = new Tube({ sides: 10, rings: 4, t1: .22, radius: torsoR, grow: .006 * S, material: botM, ref: V(1, 0, 0) });
  const belt = new Tube({ sides: 10, rings: 2, t0: .19, t1: .25, radius: torsoR, grow: .012 * S, material: has('belt') ? tM : mat('#2a2018'), ref: V(1, 0, 0) });
  const neckCurve = new THREE.LineCurve3(V(), V(0, 1, 0)), neck = new Tube({ sides: 7, rings: 2, radius: () => [.042 * S * (bt > 1 ? 1.1 : 1), .042 * S], material: skinM });
  const collar = new Tube({ sides: 9, rings: 2, radius: () => [.07 * S, .06 * S], material: topM });
  const chest = has('chest') ? new Tube({ sides: 10, rings: 8, t0: .3, t1: .9, radius: torsoR, grow: .016 * S, material: aM, ref: V(1, 0, 0) }) : null;
  const trimT = has('chest') ? new Tube({ sides: 10, rings: 2, t0: .86, t1: .9, radius: torsoR, grow: .022 * S, material: tM, ref: V(1, 0, 0) }) : null;
  const tubes = [torso, pants, belt, neck, collar, chest, trimT].filter(Boolean); for (const t of tubes) body.add(t.mesh);

  // -- limbs: one tube each, shells on top
  const lim = {}; const armLen = [.3 * S, .28 * S], legLen = [.43 * S, .42 * S];
  const armR = table([0, .5, 1], [.062, .044, .034].map(x => x * bt * S)), legR = table([0, .5, 1], [.082, .056, .042].map(x => x * bt * S * (f ? .95 : 1)));
  const mk = (kind, side) => {
    const isArm = kind === 'arm', R = isArm ? armR : legR, rad = t => [R(t), R(t)], L = { side, curve: new THREE.CatmullRomCurve3([V(), V(), V()], false, 'centripetal'), tubes: [], ik: { mid: V(), end: V() }, kind };
    const add = t => { body.add(t.mesh); L.tubes.push(t); return t; };
    add(new Tube({ sides: 7, rings: 10, radius: rad, material: skinM, ref: V(0, 0, 1), round: isArm ? 'start' : 'start' }));
    if (isArm) { if (sleeveLen > 0) add(new Tube({ sides: 7, rings: sleeveLen > .6 ? 9 : 4, t1: sleeveLen, radius: rad, grow: .007 * S, material: topM, round: 'start' })); if (has('bracers')) add(new Tube({ sides: 7, rings: 3, t0: .6, t1: .94, radius: rad, grow: .013 * S, material: aM })); if (has('bracers')) add(new Tube({ sides: 7, rings: 1, t0: .56, t1: .6, radius: rad, grow: .018 * S, material: tM })); }
    else { if (!skirt) add(new Tube({ sides: 7, rings: shortsy ? 4 : 9, t1: shortsy ? .45 : .97, radius: rad, grow: .007 * S, material: botM, round: 'start' })); if (has('greaves')) { add(new Tube({ sides: 7, rings: 4, t0: .56, t1: .96, radius: rad, grow: .014 * S, material: aM })); add(new Tube({ sides: 7, rings: 1, t0: .52, t1: .56, radius: rad, grow: .019 * S, material: tM })); } }
    // hand / foot
    if (isArm) { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), has('gauntlets') ? aM : skinM); h.scale.set(.04 * S * bt, .055 * S, .03 * S * bt); h.castShadow = true; body.add(h); L.hand = h; if (has('gauntlets')) { const c = new Tube({ sides: 7, rings: 1, t0: .88, t1: 1, radius: rad, grow: .016 * S, material: aM }); body.add(c.mesh); L.tubes.push(c); }
      const th = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), has('gauntlets') ? aM : skinM); th.scale.set(.013 * S, .03 * S, .014 * S); th.castShadow = true; body.add(th); L.thumb = th; }
    else { const geo = new THREE.BoxGeometry(.095 * S * bt, .08 * S, .24 * S); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0) { p.setY(i, p.getY(i) * (p.getY(i) > 0 ? .55 : 1)); p.setX(i, p.getX(i) * .78); } geo.computeVertexNormals();
      const ft = new THREE.Mesh(geo, has('greaves') ? aM : shoeM); ft.castShadow = true; body.add(ft); L.foot = ft;
      const sole = new THREE.Mesh(new THREE.BoxGeometry(.1 * S * bt, .016 * S, .25 * S), mat('#d8d2c4')); body.add(sole); L.sole = sole; }
    if (has('knees') && !isArm) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(.062 * S * bt, 1), tM); k.scale.z = .8; k.castShadow = true; body.add(k); L.cap = k; }
    if (has('bracers') && isArm) { const k = new THREE.Mesh(new THREE.IcosahedronGeometry(.045 * S * bt, 1), tM); k.castShadow = true; body.add(k); L.cap = k; }
    return L;
  };
  for (const s of [-1, 1]) { lim['arm' + s] = mk('arm', s); lim['leg' + s] = mk('leg', s); }
  if (skirt) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(.13 * S * bw, .24 * S * bw, .5 * S, 10, 1, true), botM); sk.castShadow = true; body.add(sk); G.userData.skirt = sk; }
  // pauldrons
  const pauld = [];
  if (has('pauldrons')) for (const s of [-1, 1]) { const g = new THREE.Group(), d = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI * .55), aM); d.scale.set(.105 * S * bt, .08 * S, .11 * S * bt); d.castShadow = true; g.add(d);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.088 * S * bt, .008 * S, 4, 12), tM); rim.rotation.x = Math.PI / 2; rim.position.y = .028 * S; g.add(rim); g.userData.side = s; body.add(g); pauld.push(g); }

  // -- head
  const head = new THREE.Group(); body.add(head);
  const hd = [.108 * S * hs, .13 * S * hs, .118 * S * hs];
  const hg = skull(hd[0] / 1, hd[1], hd[2], new THREE.SphereGeometry(1, 16, 10)); const hm = new THREE.Mesh(hg, skinM); hm.castShadow = true; head.add(hm);
  const fg = skull(hd[0] * 1.004, hd[1] * 1.004, hd[2] * 1.004, new THREE.SphereGeometry(1, 16, 10, Math.PI / 8 * 1, Math.PI / 8 * 6, Math.PI * .2, Math.PI * .6));
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 80; const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = true;
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.encoding = THREE.sRGBEncoding;
  const fm = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: tex, transparent: true, flatShading: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); head.add(fm);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.02 * S * hs, .045 * S * hs * (o.noseSize || 1), 4), skinM); nose.rotation.x = Math.PI / 2 - .25; nose.position.set(0, -hd[1] * .1, hd[2] * .98); nose.scale.z = .8; head.add(nose);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(.026 * S * hs * (o.ear || 1), 0), skinM); e.scale.set(.5, 1.1, .8); e.position.set(s * hd[0] * 1.0, -hd[1] * .02, -hd[2] * .05); head.add(e); }
  const hairColor = o.hair.color; for (const m of hairMeshes(o.hair.style, hairColor, hd)) head.add(m);
  const hm2 = mat(hairColor);
  if (o.beard === 'full') { const bg = skull(hd[0] * 1.02, hd[1] * 1.02, hd[2] * 1.02, new THREE.SphereGeometry(1, 16, 10, Math.PI / 8, Math.PI / 8 * 6, Math.PI * .56, Math.PI * .3)); const b = new THREE.Mesh(bg, hm2); b.castShadow = true; head.add(b); }
  if (o.beard === 'stubble') { const bg = skull(hd[0] * 1.01, hd[1] * 1.01, hd[2] * 1.01, new THREE.SphereGeometry(1, 16, 10, Math.PI / 8, Math.PI / 8 * 6, Math.PI * .62, Math.PI * .25)); const b = new THREE.Mesh(bg, mat(new THREE.Color(o.skin).multiplyScalar(.55).getStyle())); head.add(b); }
  if (o.beard === 'moustache') { const m = new THREE.Mesh(new THREE.BoxGeometry(.075 * S * hs, .016 * S, .02 * S), hm2); m.position.set(0, -hd[1] * .3, hd[2] * .94); head.add(m); }
  if (has('helmet')) {
    const hel = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * .47), aM); hel.scale.set(hd[0] * 1.12, hd[1] * 1.1, hd[2] * 1.12); hel.rotation.x = -.15; hel.castShadow = true; head.add(hel);
    const back = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, Math.PI * 1.08, Math.PI * .84, Math.PI * .42, Math.PI * .3), aM); back.scale.set(hd[0] * 1.1, hd[1] * 1.1, hd[2] * 1.12); head.add(back);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(hd[0] * 1.02, .008 * S, 4, 18), tM); rim.rotation.x = Math.PI / 2 - .15; rim.position.y = hd[1] * .45; rim.scale.y = 1.1; head.add(rim);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(.016 * S, hd[1] * .9, .012 * S), tM); guard.position.set(0, -hd[1] * .02, hd[2] * 1.06); head.add(guard);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(.012 * S, .035 * S, hd[2] * 1.8), tM); crest.position.set(0, hd[1] * 1.08, -hd[2] * .1); head.add(crest);
  }

  // -- state
  const st = { // smoothed pose state
    hips: .9, lean: 0, twist: 0, head: [0, 0, 0], tg: { hand: { '-1': V(), '1': V() }, foot: { '-1': V(), '1': V() } }, init: false,
  };
  const face = Object.fromEntries(FACE_KEYS.map(k => [k, EMOTIONS.neutral[k] ?? 0])); let faceTarget = { ...EMOTIONS.neutral }, blinkT = 1.5 + Math.random() * 3, blinkK = 0, talking = false, mouthLevel = null, poseName = 'stand', poseT = 0, time = Math.random() * 10, gaze = [0, 0], lookTarget = null, emo = 'neutral';
  const D = { group: G, body, head, opts: o, params: { speed: 1 }, face, tubes };
  D.setPose = (n, speed = 1) => { poseName = n; D.params.speed = speed; };
  D.setEmotion = n => { emo = n; faceTarget = { skew: 0, dead: 0, ...(EMOTIONS[n] || EMOTIONS.neutral) }; };
  D.emotion = () => emo; D.pose = () => poseName;
  D.talk = on => { talking = on; mouthLevel = null; };
  D.setMouth = lvl => { mouthLevel = lvl; };   // 0..1 from an audio envelope; overrides talk()
  D.lookAt = v => { lookTarget = v ? v.clone() : null; };
  D.blink = () => { blinkK = 1; };

  const tmp = { a: V(), b: V(), c: V(), d: V(), e: V() };
  function targets(dt) {
    const fn = POSES[poseName] || POSES.stand, P = fn(time, D.params.speed), k = 1 - Math.exp(-dt * 11);
    const sc = v => V(v[0] * S, v[1] * S, v[2] * S);
    if (!st.init) { st.hips = P.hips; st.lean = P.lean; st.twist = P.twist; st.head = [...P.head]; for (const s of [-1, 1]) { st.tg.hand[s].copy(sc(P.L && s < 0 ? P.L.hand : P.R.hand)); st.tg.foot[s].copy(sc(s < 0 ? P.L.foot : P.R.foot)); } st.init = true; }
    // walking/running feet must not be smoothed (they would slide), blend the rest
    const kk = ANIMATED.has(poseName) ? 1 - Math.exp(-dt * 30) : k;
    st.hips = lerp(st.hips, P.hips, k); st.lean = lerp(st.lean, P.lean, k); st.twist = lerp(st.twist, P.twist, k); for (let i = 0; i < 3; i++) st.head[i] = lerp(st.head[i], P.head[i], k);
    for (const s of [-1, 1]) { const Q = s < 0 ? P.L : P.R; st.tg.hand[s].lerp(sc(Q.hand), kk); st.tg.foot[s].lerp(sc(Q.foot), kk); }
  }

  D.update = (dt = 1 / 60) => {
    dt = Math.min(dt, .1); time += dt; targets(dt);
    // spine
    const hipY = st.hips * S, lean = st.lean, tw = st.twist, breath = Math.sin(time * 1.9) * .006 * S;
    const topY = hipY + .56 * S + breath, sh = Math.sin(lean), spl = spine.points;
    spl[0].set(0, hipY - .03 * S, 0); spl[1].set(0, hipY + .16 * S, sh * .07 * S); spl[2].set(0, hipY + .38 * S, sh * .22 * S); spl[3].set(0, topY, sh * .3 * S + Math.sin(-lean) * 0);
    body.rotation.y = 0; torso.mesh.parent.rotation.y = 0;
    // twist: rotate upper points around the y axis through the hips
    const rotY = (v, a) => { const c = Math.cos(a), s2 = Math.sin(a), x = v.x, z = v.z; v.x = x * c + z * s2; v.z = -x * s2 + z * c; };
    rotY(spl[1], tw * .25); rotY(spl[2], tw * .6); rotY(spl[3], tw);
    for (const t of [torso, pants, belt, chest, trimT]) if (t) t.update(spine);
    const neckBase = spl[3].clone(), headC = neckBase.clone().add(V(Math.sin(tw) * 0, .115 * S * hs + .02 * S, .01 * S));
    // gaze / head
    let gx = 0, gy = 0, hy = st.head[1], hxr = st.head[0];
    if (lookTarget) { const lp = G.worldToLocal(lookTarget.clone()).sub(headC), yaw = Math.atan2(lp.x, lp.z), pit = -Math.atan2(lp.y, Math.hypot(lp.x, lp.z)); const yy = clamp(yaw, -1.2, 1.2), pp = clamp(pit, -.6, .6); hy += yy * .6; hxr += pp * .5; gx = clamp((yy * .4) / .5, -1, 1); gy = clamp(pp * .5 / .4, -1, 1); }
    gaze[0] = lerp(gaze[0], gx, 1 - Math.exp(-dt * 14)); gaze[1] = lerp(gaze[1], gy, 1 - Math.exp(-dt * 14));
    head.position.copy(headC); head.rotation.set(hxr, hy + tw * .4, st.head[2]); head.rotation.order = 'YXZ';
    neckCurve.v1.copy(neckBase).add(V(0, -.02 * S, 0)); neckCurve.v2.copy(headC).add(V(0, -.03 * S, 0)); neck.update(neckCurve); collar.update(new THREE.LineCurve3(neckBase.clone().add(V(0, -.07 * S, 0)), neckBase.clone().add(V(0, .005 * S, 0))));
    // shoulders / hips
    const sTop = new THREE.CatmullRomCurve3(spl).getPoint(.9); // a point just below the neck
    for (const s of [-1, 1]) {
      const A = lim['arm' + s], Lg = lim['leg' + s];
      const shoulder = sTop.clone().add(V(s * w(.9) * .86, -.02 * S, 0).applyAxisAngle(V(0, 1, 0), tw));
      tmp.a.copy(st.tg.hand[s]); ik(shoulder, tmp.a, armLen[0], armLen[1], V(s * .45, -.25, -1), A.ik);
      A.curve.points[0].copy(shoulder); A.curve.points[1].copy(A.ik.mid); A.curve.points[2].copy(A.ik.end); for (const t of A.tubes) t.update(A.curve);
      A.hand.position.copy(A.ik.end); const dir = A.ik.end.clone().sub(A.ik.mid).normalize(); A.hand.quaternion.setFromUnitVectors(V(0, -1, 0), dir.clone().negate()); A.hand.position.addScaledVector(dir, .02 * S);
      A.thumb.position.copy(A.ik.end).addScaledVector(dir, .015 * S).add(V(-s * .03 * S, 0, .025 * S)); A.thumb.quaternion.copy(A.hand.quaternion);
      if (A.cap) A.cap.position.copy(A.ik.mid);
      const hip = V(s * .09 * S * bw, hipY - .0, 0).applyAxisAngle(V(0, 1, 0), tw * .1);
      const fp = st.tg.foot[s].clone(); fp.y = Math.max(fp.y, .07 * S); ik(hip, fp, legLen[0], legLen[1], V(s * .08, .12, 1), Lg.ik);
      Lg.curve.points[0].copy(hip); Lg.curve.points[1].copy(Lg.ik.mid); Lg.curve.points[2].copy(Lg.ik.end); for (const t of Lg.tubes) t.update(Lg.curve);
      Lg.foot.position.set(Lg.ik.end.x, Lg.ik.end.y - .03 * S, Lg.ik.end.z + .06 * S); Lg.sole.position.set(Lg.ik.end.x, Lg.ik.end.y - .076 * S, Lg.ik.end.z + .06 * S);
      const fl = Lg.ik.end.y - .07 * S; Lg.foot.rotation.x = -clamp(fl * 2.5, 0, .6); Lg.sole.rotation.x = Lg.foot.rotation.x;
      if (Lg.cap) Lg.cap.position.copy(Lg.ik.mid).add(V(0, 0, .035 * S));
    }
    if (G.userData.skirt) G.userData.skirt.position.set(0, hipY - .22 * S, 0);
    for (const g of pauld) { const s = g.userData.side, A = lim['arm' + s]; g.position.copy(A.curve.points[0]).add(V(s * .03 * S, .035 * S, 0)); g.rotation.z = -s * .35; }
    // --- face
    blinkT -= dt; if (blinkT <= 0) { blinkK = 1; blinkT = 2 + Math.random() * 4; if (Math.random() < .2) blinkT = .25; }
    blinkK = Math.max(0, blinkK - dt * 7);
    for (const k of FACE_KEYS) face[k] = lerp(face[k], faceTarget[k] ?? 0, 1 - Math.exp(-dt * 12));
    const fo = { ...face }; fo.eye = face.eye * (1 - Math.sin(Math.min(1, blinkK) * Math.PI) * (face.dead ? 0 : 1));
    if (mouthLevel != null) fo.open = Math.max(fo.open * .4, mouthLevel); else if (talking) { const q = Math.abs(Math.sin(time * 11.3) * Math.sin(time * 6.1 + 1)) ; fo.open = Math.max(fo.open, .1 + q * .7); fo.wide = fo.wide * (.85 + Math.sin(time * 7.3) * .2); }
    drawFace(cx, cv.width, cv.height, fo, [gaze[0], gaze[1]], { skinShade, iris: o.iris, browColor: o.hair.style === 'bald' && !o.beard ? '#3a2a20' : (o.hair.color.toLowerCase() === '#cfcfcf' ? '#aaa' : o.hair.color), eyeSize: o.eyeSize, browThick: o.build === 'child' ? 2.2 : 2.8 });
    tex.needsUpdate = true;
  };
  D.dispose = () => { G.traverse(m => { if (m.geometry) m.geometry.dispose(); }); tex.dispose(); };
  D.update(1 / 60); D.update(1 / 60);
  return D;
}
