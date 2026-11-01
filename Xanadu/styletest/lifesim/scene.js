// STYLE TEST — Life-sim game look (Sims-LIKE, not the real game: no logos, no diamond over heads, our own UI): a bright cutaway
// house at night, walls down, chunky rounded sims with big eyes, a teal selection ring, thought bubbles, a day clock, mood + needs
// bars (with a FEAR bar), an "Unknown Caller" notification, a "Cursed — expires in 7 days" status, then Day 7: a translucent ghost
// at the TV and four little tombstones in the yard.
(function () {
const { P, lerp, eio, eo, clamp, rng, at, st, en, back } = NB;
const W = 1080, H = 1920;
THREE.ColorManagement.legacyMode = false;   // hex colours are sRGB (otherwise every colour washes out to pastel)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const root = document.body || document.documentElement; root.appendChild(renderer.domElement);
const ui = document.createElement('canvas'); ui.width = W; ui.height = H; ui.style.cssText = 'position:absolute;left:0;top:0'; root.appendChild(ui); const u = ui.getContext('2d');
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, W / H, .1, 200); scene.background = new THREE.Color('#0d1626'); scene.fog = new THREE.Fog('#0d1626', 26, 60);

// ---------- helpers ----------
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, rng(w * 3 + h)); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const mat = (o) => new THREE.MeshStandardMaterial({ roughness: .65, ...o });
const add = (geo, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
function rbox(w, h, d, r = .06) { const s = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r, q = Math.min(a, b) * .4; s.moveTo(-a + q, -b); s.lineTo(a - q, -b); s.quadraticCurveTo(a, -b, a, -b + q); s.lineTo(a, b - q); s.quadraticCurveTo(a, b, a - q, b); s.lineTo(-a + q, b); s.quadraticCurveTo(-a, b, -a, b - q); s.lineTo(-a, -b + q); s.quadraticCurveTo(-a, -b, -a + q, -b);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4, curveSegments: 8 }); g.center(); return g; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- textures ----------
const TX = {
  floor: ctex(256, 256, (g, w, h, r) => { g.fillStyle = '#c8955a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(90,50,20,${.15 + r() * .15})`; g.fillRect(0, y, w, 2); g.fillStyle = `rgba(255,230,190,${r() * .12})`; g.fillRect(0, y + 2, w, 30); g.fillStyle = 'rgba(90,50,20,.3)'; g.fillRect((r() * w) | 0, y, 2, 32); } }, [4, 3]),
  wall: ctex(128, 128, (g, w, h) => { g.fillStyle = '#f2dd9a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f8ebc0'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h); g.fillStyle = '#e8a06a'; for (let y = 16; y < h; y += 64) for (let x = 22; x < w; x += 64) { g.beginPath(); g.arc(x, y, 4, 0, 6.283); g.fill(); } }, [5, 2]),
  grass: ctex(256, 256, (g, w, h, r) => { g.fillStyle = '#4f8f3c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = r() < .5 ? 'rgba(30,80,20,.35)' : 'rgba(120,180,80,.25)'; g.fillRect(r() * w, r() * h, 1.5, 4); } }, [14, 14]),
  rug: ctex(256, 256, (g) => { g.fillStyle = '#7a3a8a'; g.fillRect(0, 0, 256, 256); for (const [rr, c] of [[120, '#e8b84a'], [104, '#7a3a8a'], [80, '#e86a8a'], [50, '#7a3a8a'], [24, '#e8b84a']]) { g.fillStyle = c; g.beginPath(); g.arc(128, 128, rr, 0, 6.283); g.fill(); } }),
  window: ctex(128, 160, (g, w, h, r) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#22305a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect(r() * w, r() * h * .7, 1.5, 1.5); g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(90, 40, 14, 0, 6.283); g.fill(); }),
  stone: ctex(128, 160, (g, w, h, r) => { g.fillStyle = '#9a9ca2'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * .15})`; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = '#4a4c52'; g.textAlign = 'center'; g.font = 'bold 26px Georgia'; g.fillText('R.I.P.', w / 2, 62); g.font = 'bold 30px Georgia'; g.fillText('???', w / 2, 104); }),
};
const scrC = document.createElement('canvas'); scrC.width = 256; scrC.height = 192; const sq = scrC.getContext('2d'); const scrT = new THREE.CanvasTexture(scrC); scrT.encoding = THREE.sRGBEncoding;

// ---------- the lot: grass, fence, a tree, a lamp post ----------
add(new THREE.PlaneGeometry(60, 60), mat({ map: TX.grass, roughness: 1 }), 0, -.01, 0).rotation.x = -Math.PI / 2;
for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(.32, .32, .04, 16), mat({ color: '#b8b2a4' }), 4.6 + (i % 2) * .2, .02, 3.6 + i * .6);
const white = mat({ color: '#f4f2ea', roughness: .5 });
for (let x = -6; x <= 7; x += .4) add(rbox(.12, .8, .05, .02), white, x, .4, 7.2); add(box(13.4, .08, .04), white, .5, .62, 7.18); add(box(13.4, .08, .04), white, .5, .28, 7.18);
for (let z = -6; z <= 7; z += .4) add(rbox(.05, .8, .12, .02), white, 7.2, .4, z); add(box(.04, .08, 13.4), white, 7.18, .62, .5); add(box(.04, .08, 13.4), white, 7.18, .28, .5);
add(new THREE.CylinderGeometry(.12, .18, 1.6, 10), mat({ color: '#6a4a2a' }), -5.6, .8, 5.0); for (const [x, y, z, r] of [[-5.6, 2.3, 5.0, 1.1], [-5.1, 1.9, 5.3, .8], [-6.0, 2.0, 4.6, .8]]) add(new THREE.IcosahedronGeometry(r, 1), mat({ color: '#2f6a3a', flatShading: true, roughness: .9 }), x, y, z);
add(new THREE.CylinderGeometry(.05, .06, 2.2, 8), mat({ color: '#2a2a2e', metalness: .5, roughness: .4 }), 5.6, 1.1, 2.9); add(new THREE.SphereGeometry(.16, 16, 12), mat({ color: '#fff4d0', emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 2 }), 5.6, 2.25, 2.9);
const post = new THREE.PointLight('#ffc878', 1.6, 7, 2); post.position.set(5.6, 2.1, 2.9); scene.add(post);
// ---------- the house: floor, two full back walls, two cut-down front walls (walls down) ----------
const HX = 4, HZ = 3, WH = 2.8;
add(box(2 * HX + .3, .2, 2 * HZ + .3), mat({ color: '#d8d0c0' }), 0, -.08, 0); add(new THREE.PlaneGeometry(2 * HX, 2 * HZ), mat({ map: TX.floor, roughness: .5 }), 0, .025, 0).rotation.x = -Math.PI / 2;
const wallM = mat({ map: TX.wall, roughness: .85 }), capM = mat({ color: '#fbf7ee', roughness: .5 }), outM = mat({ color: '#b9c7d8', roughness: .8 });
add(box(2 * HX + .3, WH, .15), [outM, outM, capM, capM, wallM, outM], 0, WH / 2, -HZ - .07); add(box(.15, WH, 2 * HZ), [wallM, outM, capM, capM, outM, outM], -HX - .07, WH / 2, 0);
add(box(2 * HX + .3, .32, .15), [outM, outM, capM, capM, outM, wallM], 0, .16, HZ + .07); add(box(.15, .32, 2 * HZ), [outM, wallM, capM, capM, outM, outM], HX + .07, .16, 0);
for (const [x, z] of [[-HX - .07, -HZ - .07]]) add(box(.2, WH + .05, .2), capM, x, WH / 2, z);
// window with curtains, a picture, a bookshelf, a plant
add(new THREE.PlaneGeometry(1.1, 1.3), mat({ map: TX.window, emissive: new THREE.Color('#1a2a50'), emissiveIntensity: .6 }), -1.3, 1.55, -HZ + .01); for (const [w, h, x, y] of [[1.25, .08, -1.3, 2.24], [1.25, .08, -1.3, .86], [.08, 1.4, -1.92, 1.55], [.08, 1.4, -.68, 1.55]]) add(box(w, h, .08), capM, x, y, -HZ + .04);
for (const s of [-1, 1]) add(rbox(.32, 1.6, .08, .03), mat({ color: '#d0566a' }), -1.3 + s * .78, 1.45, -HZ + .1);
add(new THREE.PlaneGeometry(.7, .5), mat({ map: ctex(128, 96, (g) => { g.fillStyle = '#7a5a2a'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#d8e4c8'; g.fillRect(10, 10, 108, 76); g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(30, 70); g.lineTo(36, 46); g.lineTo(74, 42); g.lineTo(92, 26); g.lineTo(100, 30); g.lineTo(90, 48); g.lineTo(94, 70); g.lineTo(88, 70); g.lineTo(84, 54); g.lineTo(46, 56); g.lineTo(40, 72); g.closePath(); g.fill(); }) }), 1.2, 2.15, -HZ + .01);
add(rbox(.5, 2.0, 1.4, .05), mat({ color: '#8a5a34' }), -HX + .3, 1.0, -.6); for (let k = 0; k < 4; k++) for (let b = 0; b < 6; b++) add(box(.25, .3, .1), mat({ color: ['#c84a4a', '#4a7ac8', '#e8c24a', '#4ab87a'][(k + b) % 4] }), -HX + .32, .38 + k * .45, -1.1 + b * .2);
add(new THREE.CylinderGeometry(.22, .17, .4, 16), mat({ color: '#e07a4a' }), -HX + .45, .2, -HZ + .45); add(new THREE.IcosahedronGeometry(.4, 1), mat({ color: '#3a8a4a', flatShading: true }), -HX + .45, .75, -HZ + .45);
// TV, couch, coffee table, rug, end table + phone, lamp
add(new THREE.CylinderGeometry(1.3, 1.3, .02, 48), mat({ map: TX.rug, roughness: 1 }), 1.2, .04, -.6);
add(rbox(1.7, .55, .55, .05), mat({ color: '#7a4a2a' }), 1.2, .28, -HZ + .35); add(rbox(1.25, .92, .7, .1), mat({ color: '#3a3a44', roughness: .35 }), 1.2, 1.02, -HZ + .42);
add(new THREE.PlaneGeometry(.92, .66), new THREE.MeshBasicMaterial({ map: scrT }), 1.15, 1.04, -HZ + .78);
const couchM = mat({ color: '#38a3a0', roughness: .9 }); add(rbox(2.5, .45, 1.0, .12), couchM, 1.2, .3, 1.15); add(rbox(2.5, .7, .28, .12), couchM, 1.2, .72, 1.58); for (const s of [-1, 1]) add(rbox(.28, .6, 1.0, .1), couchM, 1.2 + s * 1.25, .42, 1.15);
for (let k = 0; k < 3; k++) add(rbox(.78, .14, .9, .06), mat({ color: '#45b8b4', roughness: .9 }), .4 + k * .8, .58, 1.12);
add(rbox(1.2, .1, .6, .04), mat({ color: '#a8743e' }), 1.2, .42, -.55); for (const [x, z] of [[.7, -.8], [1.7, -.8], [.7, -.3], [1.7, -.3]]) add(new THREE.CylinderGeometry(.04, .04, .38, 8), mat({ color: '#7a4a2a' }), x, .2, z);
add(new THREE.CylinderGeometry(.35, .35, .06, 24), mat({ color: '#a8743e' }), -1.7, .75, -2.4); add(new THREE.CylinderGeometry(.06, .08, .72, 10), mat({ color: '#7a4a2a' }), -1.7, .37, -2.4);
const phoneBase = add(rbox(.36, .1, .26, .03), mat({ color: '#e8e0cc', roughness: .4 }), -1.7, .83, -2.38); const handset = add(rbox(.1, .32, .08, .03), mat({ color: '#f0e8d4', roughness: .4 }), -1.76, 1.0, -2.4); handset.rotation.z = .1;
add(new THREE.CylinderGeometry(.03, .03, 1.7, 8), mat({ color: '#c8a050', metalness: .6, roughness: .3 }), -3.3, .85, -2.5); add(new THREE.CylinderGeometry(.2, .32, .38, 20, 1, true), mat({ color: '#f4dca8', side: THREE.DoubleSide, emissive: new THREE.Color('#ffb060'), emissiveIntensity: .7 }), -3.3, 1.75, -2.5);
// tombstones (Day 7)
const stones = [0, 1, 2, 3].map(i => { const s = new THREE.Shape(); s.moveTo(-.35, 0); s.lineTo(-.35, .6); s.absarc(0, .6, .35, Math.PI, 0, true); s.lineTo(.35, 0); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: .14, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 });
  g.computeBoundingBox(); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (uv.getX(k) + .4) / .8, uv.getY(k) / 1.0); const m = add(g, mat({ map: TX.stone, roughness: .9 }), 1.9 + i * 1.15, 0, 4.9); return m; });

// ---------- sims: rounded bodies, big eyes, FK limbs ----------
function face(scared, ghost) { return ctex(1024, 512, (g, w, h) => { g.fillStyle = ghost ? '#cfe6ee' : '#f2c9a6'; g.fillRect(0, 0, w, h); const cx = 256, cy = 250;
  for (const s of [-1, 1]) { const ch = g.createRadialGradient(cx + s * 78, cy + 50, 2, cx + s * 78, cy + 50, 40); ch.addColorStop(0, 'rgba(240,120,120,.35)'); ch.addColorStop(1, 'rgba(240,120,120,0)'); g.fillStyle = ch; g.fillRect(0, 0, w, h);
    const ex = cx + s * 58, ey = cy - 6; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, 30, scared ? 28 : 22, 0, 0, 6.283); g.fill(); g.fillStyle = ghost ? '#111' : '#3a7fc4'; g.beginPath(); g.arc(ex + (scared ? 0 : s * -2), ey + 2, scared ? 11 : 16, 0, 6.283); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(ex, ey + 2, scared ? 5 : 8, 0, 6.283); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 6, ey - 5, 4, 0, 6.283); g.fill();
    g.strokeStyle = '#3a2416'; g.lineWidth = 5; g.beginPath(); g.ellipse(ex, ey, 31, scared ? 29 : 23, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = 7; g.strokeStyle = '#8a5a2a'; g.beginPath(); if (scared) { g.moveTo(ex - 26 * s, ey - 46); g.quadraticCurveTo(ex, ey - 64, ex + 24 * s, ey - 56); } else { g.moveTo(ex - 28, ey - 40); g.quadraticCurveTo(ex, ey - 50, ex + 28, ey - 40); } g.stroke(); }
  g.fillStyle = 'rgba(180,110,80,.45)'; g.beginPath(); g.ellipse(cx, cy + 40, 9, 6, 0, 0, 6.283); g.fill();
  if (scared) { g.fillStyle = '#5a1a1a'; g.beginPath(); g.ellipse(cx, cy + 86, 18, 22, 0, 0, 6.283); g.fill(); g.fillStyle = '#c84a4a'; g.beginPath(); g.ellipse(cx, cy + 96, 10, 8, 0, 0, 6.283); g.fill(); }
  else { g.strokeStyle = '#a84a4a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy + 66, 22, .35, Math.PI - .35); g.stroke(); } }); }
function sim(o) { const G = new THREE.Group(); scene.add(G); const ghost = !!o.ghost;
  const M = c => mat(ghost ? { color: c, transparent: true, opacity: .8, emissive: new THREE.Color('#9fe0ff'), emissiveIntensity: .9, roughness: .4, depthWrite: false } : { color: c });
  const skin = M(ghost ? '#cfe6ee' : '#f2c9a6'), top = M(o.top), pants = M(o.pants), hairM = M(o.hair), shoe = M(o.shoes || '#f4f4f4');
  const cap = (r, l, m) => add(new THREE.CapsuleGeometry(r, l, 6, 14), m, 0, 0, 0, G);
  const S = { G, upper: {}, lower: {}, faces: [face(false, ghost), face(true, ghost)] };
  for (const s of ['L', 'R']) { S.upper[s] = [cap(.058, .2, top), cap(.052, .19, top), add(new THREE.SphereGeometry(.075, 16, 12), skin, 0, 0, 0, G)]; S.lower[s] = [cap(.078, .26, pants), cap(.068, .26, pants), add(rbox(.16, .1, .3, .04), shoe, 0, 0, 0, G)]; }
  if (o.dress) { const d = add(new THREE.ConeGeometry(.42, 1.25, 28, 1, true), top, 0, .78, 0, G); d.material.side = THREE.DoubleSide; } else add(rbox(.42, .26, .3, .1), pants, 0, .84, 0, G);
  const torso = add(new THREE.CapsuleGeometry(.21, .36, 8, 18), top, 0, 1.13, 0, G); torso.scale.set(.95, 1, .72); add(new THREE.CylinderGeometry(.065, .07, .14, 12), skin, 0, 1.5, 0, G);
  S.headMat = M('#ffffff'); S.headMat.map = S.faces[0]; S.head = add(new THREE.SphereGeometry(.2, 40, 28), S.headMat, 0, 1.73, 0, G); S.head.scale.set(1, 1.08, .98);
  add(new THREE.SphereGeometry(.214, 32, 16, Math.PI / 2 + .78, Math.PI * 2 - 1.56, 0, 1.95), hairM, 0, 1.74, 0, G); add(new THREE.SphereGeometry(.218, 32, 10, 0, Math.PI * 2, 0, .72), hairM, 0, 1.74, 0, G);
  add(rbox(.42, ghost ? .8 : .58, .12, .05), hairM, 0, ghost ? 1.42 : 1.52, -.13, G); for (const s of [-1, 1]) add(new THREE.CapsuleGeometry(.065, ghost ? .6 : .34, 6, 10), hairM, s * .19, ghost ? 1.42 : 1.55, .02, G);
  if (ghost) add(rbox(.34, .66, .06, .03), hairM, 0, 1.55, .2, G);   // hair hanging over her face
  return S; }
// forward kinematics: joint chains with fixed bone lengths, aimed at targets
function chain(parts, a, tgtB, tgtC, l1, l2) { const d1 = tgtB.clone().sub(a).normalize(), b = a.clone().addScaledVector(d1, l1), d2 = tgtC.clone().sub(b).normalize(), c = b.clone().addScaledVector(d2, l2);
  for (const [m, p, q, d, l] of [[parts[0], a, b, d1, l1], [parts[1], b, c, d2, l2]]) { m.position.copy(p).addScaledVector(d, l / 2); m.quaternion.setFromUnitVectors(V(0, 1, 0), d); } parts[2].position.copy(c); return c; }
const POSE = {
  stand: { arm: s => [V(s * .29, 1.1, .02), V(s * .3, .84, .06)], leg: s => [V(s * .1, .45, .02), V(s * .1, .08, 0)] },
  sit: { arm: s => [V(s * .27, 1.12, .14), V(s * .15, .9, .36)], leg: s => [V(s * .11, .55, .42), V(s * .11, .1, .48)] },
  scared: { arm: s => [V(s * .34, 1.3, .2), V(s * .17, 1.62, .22)], leg: s => [V(s * .13, .45, .04), V(s * .15, .08, 0)] },
};
function pose(S, p, phone) { for (const s of [-1, 1]) { const k = s < 0 ? 'L' : 'R'; const arm = phone && s > 0 ? [V(.3, 1.2, .16), V(.16, 1.7, .08)] : POSE[p].arm(s), leg = POSE[p].leg(s);
  chain(S.upper[k], V(s * .25, 1.4, 0), arm[0], arm[1], .27, .26); const f = chain(S.lower[k], V(s * .1, .84, 0), leg[0], leg[1], .38, .38); S.lower[k][2].position.set(f.x, f.y - .02, f.z + .06); } }
const her = sim({ top: '#5b7fc8', pants: '#33476e', hair: '#e9c35e', shoes: '#f4f4f4' }), held = add(rbox(.09, .3, .07, .03), mat({ color: '#f0e8d4' }), 0, 0, 0, her.G);
const ghost = sim({ top: '#e8f4f8', pants: '#e8f4f8', hair: '#0c0c10', ghost: true, dress: true }); pose(ghost, 'stand');
const ringSel = new THREE.Mesh(new THREE.RingGeometry(.42, .52, 48), new THREE.MeshBasicMaterial({ color: '#3ee0c8', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); ringSel.rotation.x = -Math.PI / 2; scene.add(ringSel);

// ---------- lights: a night outside, warm lamps inside, the TV's glow ----------
scene.add(new THREE.HemisphereLight('#5a6aa8', '#2a2018', .42));
const moon = new THREE.DirectionalLight('#a8b8ff', .55); moon.position.set(8, 14, 10); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 }); moon.shadow.bias = -.0005; moon.shadow.normalBias = .03; scene.add(moon);
const lamp = new THREE.PointLight('#ffc480', 3.4, 11, 2); lamp.position.set(-3.3, 1.7, -2.4); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.camera.near = .05; lamp.shadow.normalBias = .03; scene.add(lamp);
const tvL = new THREE.PointLight('#a8c8ff', 2, 7, 2); tvL.position.set(1.15, 1.1, -1.9); scene.add(tvL);
const ghostL = new THREE.PointLight('#9fe0ff', 0, 5, 2); scene.add(ghostL);

// ---------- the game UI ----------
const UIF = '"Avenir Next", Helvetica, sans-serif';
const panel = (x, y, w, h) => { u.save(); u.shadowColor = 'rgba(0,0,0,.4)'; u.shadowBlur = 18; u.beginPath(); u.roundRect(x, y, w, h, 26); u.fillStyle = 'rgba(18,44,66,.86)'; u.fill(); u.restore(); u.lineWidth = 3; u.strokeStyle = 'rgba(120,230,215,.7)'; u.beginPath(); u.roundRect(x, y, w, h, 26); u.stroke(); };
function avatar(x, y, r, scared) { u.save(); u.beginPath(); u.arc(x, y, r, 0, 6.283); u.fillStyle = '#9fd8e8'; u.fill(); u.clip(); u.fillStyle = '#e9c35e'; u.beginPath(); u.ellipse(x, y + 4, r * .62, r * .7, 0, 0, 6.283); u.fill(); u.fillRect(x - r * .62, y, r * 1.24, r);
  u.fillStyle = '#f2c9a6'; u.beginPath(); u.ellipse(x, y + 8, r * .44, r * .52, 0, 0, 6.283); u.fill(); u.fillStyle = '#5b7fc8'; u.beginPath(); u.ellipse(x, y + r * 1.05, r * .7, r * .45, 0, 0, 6.283); u.fill();
  for (const s of [-1, 1]) { u.fillStyle = '#fff'; u.beginPath(); u.ellipse(x + s * r * .18, y + 2, r * .11, r * (scared ? .12 : .09), 0, 0, 6.283); u.fill(); u.fillStyle = '#222'; u.beginPath(); u.arc(x + s * r * .18, y + 3, r * .05, 0, 6.283); u.fill(); }
  u.fillStyle = scared ? '#5a1a1a' : 'transparent'; if (scared) { u.beginPath(); u.ellipse(x, y + r * .3, r * .08, r * .1, 0, 0, 6.283); u.fill(); } u.restore(); u.lineWidth = 5; u.strokeStyle = '#3ee0c8'; u.beginPath(); u.arc(x, y, r, 0, 6.283); u.stroke(); }
function bubble(p, draw, a = 1) { if (!p || a <= 0) return; const [x, y] = p; u.save(); u.globalAlpha = a; u.fillStyle = '#fff'; u.shadowColor = 'rgba(0,0,0,.35)'; u.shadowBlur = 14;
  u.beginPath(); u.ellipse(x, y - 120, 82, 66, 0, 0, 6.283); u.fill(); u.beginPath(); u.arc(x - 18, y - 40, 14, 0, 6.283); u.fill(); u.beginPath(); u.arc(x - 6, y - 14, 8, 0, 6.283); u.fill(); u.shadowBlur = 0; u.translate(x, y - 120); draw(); u.restore(); }
const icons = {
  tv: () => { u.fillStyle = '#3a3a44'; u.beginPath(); u.roundRect(-44, -32, 88, 64, 10); u.fill(); u.fillStyle = '#0a0a10'; u.beginPath(); u.roundRect(-34, -24, 68, 46, 6); u.fill(); u.strokeStyle = '#fff'; u.lineWidth = 5; u.beginPath(); u.arc(0, -1, 13, 0, 6.283); u.stroke(); },
  phone: () => { u.save(); u.rotate(Math.sin(performance.now()) * 0); u.fillStyle = '#d4c8ae'; u.beginPath(); u.roundRect(-14, -34, 28, 68, 9); u.fill(); u.fillStyle = '#333'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) u.fillRect(-8 + j * 6, -10 + i * 7, 4, 4); u.restore(); u.fillStyle = '#e8402a'; u.font = `900 46px ${UIF}`; u.textAlign = 'center'; u.textBaseline = 'middle'; u.fillText('!', 38, -8); },
  seven: () => { u.fillStyle = '#d0302a'; u.font = `900 96px ${UIF}`; u.textAlign = 'center'; u.textBaseline = 'middle'; u.fillText('7', 0, 4); },
  ghost: () => { u.fillStyle = '#cfe6ee'; u.beginPath(); u.moveTo(-30, 34); u.lineTo(-30, -6); u.arc(0, -6, 30, Math.PI, 0); u.lineTo(30, 34); for (let k = 0; k < 4; k++) u.lineTo(30 - (k + .5) * 15, k % 2 ? 34 : 24); u.closePath(); u.fill(); u.fillStyle = '#111'; u.beginPath(); u.arc(-10, -6, 6, 0, 6.283); u.arc(10, -6, 6, 0, 6.283); u.fill(); },
};
const proj = v => { const p = v.clone().project(camera); return p.z > 1 ? null : [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
function drawUI(t) { u.clearRect(0, 0, W, H); const ph = at('L3', 'phone') - .1, l3b = st('L3b'), l4 = st('L4'), scared = t > l3b - .1;
  // who: portrait, mood, needs
  panel(36, 60, 500, 380); avatar(122, 160, 64, scared); u.fillStyle = '#fff'; u.font = `700 34px ${UIF}`; u.textBaseline = 'middle'; u.fillText('???', 210, 112);
  const mood = t < at('L3', 'ends') ? ['Focused', '#5ee06a'] : t < l3b - .1 ? ['Uneasy', '#f2c84a'] : ['Terrified', '#ff4a3a']; u.font = `600 26px ${UIF}`; u.fillStyle = '#bfe8e2'; u.fillText('Mood:', 210, 156); u.fillStyle = mood[1]; u.font = `800 28px ${UIF}`; u.fillText(mood[0], 292, 156);
  const fear = clamp(.1 + P(t, at('L3', 'ends'), 1.5) * .3 + P(t, ph, .6) * .2 + P(t, l3b, .6) * .45);
  [['Energy', .62 - P(t, l4, 3) * .4], ['Fun', .7 - P(t, at('L3', 'ends'), .8) * .45], ['Social', .5], ['Fear', fear]].forEach(([n, v], i) => { const y = 268 + i * 40; u.fillStyle = '#bfe8e2'; u.font = `600 24px ${UIF}`; u.fillText(n, 70, y);
    u.fillStyle = 'rgba(255,255,255,.15)'; u.beginPath(); u.roundRect(170, y - 11, 330, 22, 11); u.fill(); const col = n === 'Fear' ? (v > .7 ? '#ff4a3a' : '#f2a03a') : v > .5 ? '#5ee06a' : v > .3 ? '#f2c84a' : '#ff6a3a';
    u.fillStyle = col; u.beginPath(); u.roundRect(170, y - 11, Math.max(22, 330 * clamp(v)), 22, 11); u.fill(); });
  // clock: the days fast-forward to 7 during the last line
  const day = t < l4 + .3 ? 1 : Math.min(7, 1 + Math.floor(P(t, l4 + .3, 2.2) * 6.99)), ff = t > l4 + .3 && day < 7;
  panel(W - 400, 60, 364, 150); u.fillStyle = day === 7 ? '#ff5a4a' : '#fff'; u.font = `800 52px ${UIF}`; u.textAlign = 'left'; u.fillText(`DAY ${day}`, W - 372, 112); u.fillStyle = '#bfe8e2'; u.font = `600 30px ${UIF}`; u.fillText(day === 7 ? '11:59 PM' : '11:58 PM', W - 196, 114);
  ['‖', '▶', '▶▶', '▶▶▶'].forEach((s, i) => { const x = W - 372 + i * 82, on = ff ? i === 3 : i === 1; u.fillStyle = on ? '#3ee0c8' : 'rgba(255,255,255,.12)'; u.beginPath(); u.roundRect(x, 146, 70, 46, 12); u.fill(); u.fillStyle = on ? '#0e2a36' : '#fff'; u.font = `800 22px ${UIF}`; u.textAlign = 'center'; u.fillText(s, x + 35, 170); }); u.textAlign = 'left';
  // notifications
  if (t > ph && t < l3b) { const k = eo(clamp((t - ph) / .25)); panel(W - 520 + (1 - k) * 300, 236, 484, 170); u.save(); u.translate(W - 450 + (1 - k) * 300, 320); u.rotate(Math.sin(t * 40) * .15); icons.phone(); u.restore();
    u.fillStyle = '#fff'; u.font = `700 30px ${UIF}`; u.fillText('Unknown Caller', W - 380 + (1 - k) * 300, 282); u.fillStyle = '#bfe8e2'; u.font = `500 24px ${UIF}`; u.fillText('is calling…', W - 380 + (1 - k) * 300, 318);
    for (const [s, x, c] of [['Answer', W - 380, '#3ee0c8'], ['Ignore', W - 210, 'rgba(255,255,255,.18)']]) { u.fillStyle = c; u.beginPath(); u.roundRect(x + (1 - k) * 300, 342, 150, 46, 14); u.fill(); u.fillStyle = s === 'Answer' ? '#0e2a36' : '#fff'; u.font = `700 22px ${UIF}`; u.textAlign = 'center'; u.fillText(s, x + 75 + (1 - k) * 300, 366); u.textAlign = 'left'; } }
  if (t > l3b) { const k = eo(clamp((t - l3b) / .3)); panel(W - 520, 236 + (1 - k) * -80, 484, 150); u.globalAlpha = k; u.fillStyle = '#ff5a4a'; u.font = `900 44px ${UIF}`; u.fillText('⚠', W - 492, 300); u.fillStyle = '#fff'; u.font = `800 32px ${UIF}`; u.fillText('Cursed', W - 432, 288);
    const left = Math.max(0, 7 * 24 * 60 - (day - 1) * 24 * 60 - Math.floor((t - l3b) * 60)), dd = Math.floor(left / 1440), hh = Math.floor(left % 1440 / 60), mm = left % 60; u.fillStyle = '#ffb0a8'; u.font = `600 26px ${UIF}`; u.fillText(`expires in ${dd}d ${hh}h ${String(mm).padStart(2, '0')}m`, W - 432, 332); u.globalAlpha = 1; }
  // thought bubbles over her head; ring lines over the phone
  const hp = proj(her.G.localToWorld(V(0, 2.05, 0))); if (t < ph) bubble(hp, icons.tv, eo(P(t, .4, .3)) * (1 - P(t, at('L3', 'ends') + .6, .3))); else if (t < l3b) bubble(hp, icons.phone, eo(P(t, ph + .3, .3))); else if (t < l4) bubble(hp, icons.seven, eo(P(t, l3b + .05, .25))); else bubble(hp, icons.ghost, eo(P(t, at('L4', 'gone'), .3)));
  if (t > ph && t < l3b - .45) { const pp = proj(V(-1.7, 1.2, -2.4)); if (pp) { u.strokeStyle = '#fff'; u.lineWidth = 6; u.lineCap = 'round'; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { u.beginPath(); u.arc(pp[0], pp[1], 34 + k * 20, s < 0 ? 2.6 : -.5, s < 0 ? 3.7 : .5); u.stroke(); } } }
  // captions
  const id = ['L3', 'L3b', 'L4'].find(k => { const l = NB.TL.lines[k]; return l && t >= l.start - .1 && t < l.start + l.dur + .5; }); if (id) { const l = NB.TL.lines[id]; u.font = `800 54px ${UIF}`; u.textBaseline = 'middle'; u.lineJoin = 'round';
    const lines = []; let cur = []; for (const w of l.words) { cur.push(w); if (u.measureText(cur.map(x => x.w).join(' ')).width > W - 160) { cur.pop(); lines.push(cur); cur = [w]; } } if (cur.length) lines.push(cur);
    lines.forEach((ws, i) => { const tw = u.measureText(ws.map(x => x.w).join(' ')).width; let x = (W - tw) / 2; const y = 1480 + (i - (lines.length - 1) / 2) * 66;
      for (const w of ws) { const now = t >= l.start + w.s && t < l.start + w.e + .12; u.lineWidth = 12; u.strokeStyle = '#0e2a36'; u.strokeText(w.w, x, y); u.fillStyle = id === 'L3b' ? '#ff8a7a' : now ? '#5ef0d8' : '#fff'; u.fillText(w.w, x, y); x += u.measureText(w.w + ' ').width; } }); } }

// ---------- staging ----------
const SHOTS = () => [   // [t0, dur, target, dist, yaw, pitch, fov]
  [0, 1, V(.6, .9, -.5), 12.5, .78, .6, 30], [.3, 2.2, V(.6, .9, -.7), 11.2, .74, .57, 30],
  [at('L3', 'phone') - .25, .5, V(-1.4, .95, -1.9), 7.2, 1.05, .5, 30], [st('L3b') - .2, .5, V(-1.2, 1.5, -1.6), 4.4, .62, .32, 30],
  [st('L4') + .1, 1.5, V(1.7, .5, 2.0), 16.5, .8, .7, 32]];
window.seek = t => {
  const ends = at('L3', 'ends'), ph = at('L3', 'phone') - .1, l3b = st('L3b'), l4 = st('L4'), r = rng(Math.floor(t * 15));
  // the TV: the ring, then static
  sq.fillStyle = '#05070a'; sq.fillRect(0, 0, 256, 192); if (t < ends) { const gr = sq.createRadialGradient(128, 96, 30, 128, 96, 90); gr.addColorStop(0, 'rgba(210,225,255,0)'); gr.addColorStop(.5, 'rgba(210,225,255,.55)'); gr.addColorStop(1, 'rgba(210,225,255,0)'); sq.fillStyle = gr; sq.fillRect(0, 0, 256, 192); sq.strokeStyle = '#fff'; sq.lineWidth = 10; sq.beginPath(); sq.arc(128, 96, 50, 0, 6.283); sq.stroke(); }
  else for (let i = 0; i < 2600; i++) { const v = r() * 255 | 0; sq.fillStyle = `rgb(${v},${v},${v})`; sq.fillRect(r() * 256 | 0, r() * 192 | 0, 3, 2); } scrT.needsUpdate = true; tvL.intensity = t < ends ? 2.2 : 1.4 + r() * 1.2;
  // her
  const scared = t > l3b - .1; her.headMat.map = her.faces[scared ? 1 : 0];
  if (t < ph) { her.G.position.set(1.2, -.28, 1.05); her.G.rotation.y = Math.PI; pose(her, 'sit'); held.visible = false; handset.visible = true; }
  else if (t < l3b - .45) { her.G.position.set(-.85, 0, -1.25); her.G.rotation.y = -2.45; pose(her, 'stand'); held.visible = false; handset.visible = true; }
  else if (t < l4 + .1) { her.G.position.set(-1.2, 0, -1.75); her.G.rotation.y = .72; pose(her, 'stand', true); held.position.set(.21, 1.7, .13); held.rotation.set(.25, .3, .35); held.visible = true; handset.visible = false; }
  else { her.G.position.set(-.7, 0, .25); her.G.rotation.y = 2.45; pose(her, 'scared'); held.visible = false; handset.visible = true; }
  handset.rotation.z = .1 + (t > ph && t < l3b - .45 ? Math.sin(t * 80) * .08 : 0);
  ringSel.position.set(her.G.position.x, .05, her.G.position.z); ringSel.rotation.z = t * 1.5; ringSel.material.opacity = .6 + .3 * Math.sin(t * 5);
  // Day 7: the ghost at the TV, tombstones in the yard
  const gk = clamp((t - at('L4', 'gone') + .3) / .6); ghost.G.visible = gk > 0; ghost.G.position.set(1.15, .05 + Math.sin(t * 2) * .05, -1.85); ghost.G.rotation.y = .75; ghost.G.scale.setScalar(1.08); ghost.G.traverse(m => { if (m.material && m.material.transparent) m.material.opacity = .8 * gk; }); ghostL.intensity = 4 * gk; ghostL.position.set(1.15, 1.4, -1.4);
  stones.forEach((s, i) => { const k = back(clamp((t - at('L4', 'gone') - i * .18) / .35)); s.visible = k > 0; s.scale.set(1, Math.max(.001, k), 1); });
  // camera
  let c = SHOTS()[0], tg = c[2].clone(), d = c[3], yw = c[4], pt = c[5], fv = c[6]; for (const [t0, du, tt, dd, yy, pp, ff] of SHOTS()) { const k = eio(P(t, t0, du)); if (k <= 0) break; tg.lerp(tt, k); d = lerp(d, dd, k); yw = lerp(yw, yy, k); pt = lerp(pt, pp, k); fv = lerp(fv, ff, k); }
  camera.fov = fv; camera.updateProjectionMatrix(); camera.position.set(tg.x + d * Math.sin(yw) * Math.cos(pt), tg.y + d * Math.sin(pt), tg.z + d * Math.cos(yw) * Math.cos(pt)); camera.lookAt(tg); camera.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  renderer.render(scene, camera); drawUI(t); return true; };
window.setTL = tl => { NB.TL = tl; return true; };
Promise.all([`800 54px "Avenir Next"`, `600 26px "Avenir Next"`].map(f => document.fonts.load(f))).then(() => { window.ready = true; });
})();
