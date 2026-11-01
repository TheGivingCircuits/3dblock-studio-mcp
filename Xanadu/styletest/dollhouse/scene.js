// STYLE TEST — Haunted Dollhouse: a real 3D miniature. A narrow three-storey Victorian dollhouse with the front cut away, sitting
// in a moonlit attic; a porcelain peg doll with a painted face and yarn hair; warm lamp light with real shadows, a glowing TV;
// a tilt-shift blur (sharp band, blurred top and bottom) so it reads as tiny; stop-motion movement at 12 fps.
(function () {
const { P, lerp, eio, eo, clamp, rng, at, st, en } = NB;
const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); (document.body || document.documentElement).appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType) });   // 24-bit depth: a 16-bit buffer z-fights the thin walls into stripes
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, W / H, .12, 120); scene.background = new THREE.Color('#020203'); scene.fog = new THREE.Fog('#050507', 22, 60);

// ---------- textures ----------
function ctex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h, rng(w + h * 3)); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const specks = (g, w, h, r, col, n, a) => { for (let i = 0; i < n; i++) { g.globalAlpha = a * r(); g.fillStyle = col; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } g.globalAlpha = 1; };
const TX = {
  planks: (base, rep) => ctex(256, 256, (g, w, h, r) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(0,0,0,${.15 + r() * .2})`; g.fillRect(0, y, w, 2); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(255,220,170,${r() * .06})`; g.fillRect(0, y + 4 + r() * 24, w, 1); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(r() * w, y, 2, 32); } specks(g, w, h, r, '#000', 400, .2); }, rep),
  damask: (base, ink, rep) => ctex(256, 256, (g, w, h, r) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = ink; for (const [x, y] of [[64, 64], [192, 192], [192, -64], [-64, 192], [192, 64 + 128], [64, 192]]) { g.save(); g.translate(x, y); g.globalAlpha = .55;
      for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.ellipse(0, -22, 9, 24, 0, 0, 6.283); g.fill(); } g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill(); g.restore(); }
    g.globalAlpha = 1; for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h, rr = 20 + r() * 50, gr = g.createRadialGradient(x, y, 2, x, y, rr); gr.addColorStop(0, 'rgba(90,60,20,.35)'); gr.addColorStop(1, 'rgba(90,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } specks(g, w, h, r, '#2a1a0a', 300, .25); }, rep),
  plain: col => ctex(4, 4, (g) => { g.fillStyle = col; g.fillRect(0, 0, 4, 4); }),
  velvet: ctex(128, 128, (g, w, h, r) => { g.fillStyle = '#5c1820'; g.fillRect(0, 0, w, h); specks(g, w, h, r, '#2a060a', 900, .5); specks(g, w, h, r, '#8a3038', 300, .4); }, [2, 2]),
  shingle: ctex(256, 256, (g, w, h, r) => { g.fillStyle = '#2c2a30'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 28) for (let x = (y / 28 % 2) * 20; x < w; x += 40) { g.fillStyle = `rgb(${48 + r() * 20},${46 + r() * 18},${54 + r() * 18})`; g.beginPath(); g.roundRect(x + 1, y + 1, 38, 26, [0, 0, 8, 8]); g.fill(); } }, [3, 3]),
  rug: ctex(512, 512, (g, w, h) => { g.fillStyle = '#6a1c1c'; g.fillRect(0, 0, w, h); for (const [rr, c] of [[240, '#c9963a'], [220, '#3a1a3a'], [190, '#8a2a24'], [120, '#c9963a'], [100, '#5a1a1a'], [40, '#c9963a']]) { g.fillStyle = c; g.beginPath(); g.arc(256, 256, rr, 0, 6.283); g.fill(); } }),
  calendar: ctex(128, 160, (g) => { g.fillStyle = '#f1ead8'; g.fillRect(0, 0, 128, 160); g.fillStyle = '#a8241c'; g.fillRect(0, 0, 128, 34); g.fillStyle = '#fff'; g.font = 'bold 20px Georgia'; g.textAlign = 'center'; g.fillText('OCTOBER', 64, 24);
    g.fillStyle = '#222'; g.font = '16px Georgia'; for (let d = 1; d <= 16; d++) { const x = 16 + ((d - 1) % 4) * 32, y = 58 + Math.floor((d - 1) / 4) * 26; g.fillText(String(d), x, y); if (d >= 9 && d <= 15) { g.strokeStyle = '#a8241c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 8, y - 12); g.lineTo(x + 8, y + 2); g.stroke(); } } g.strokeStyle = '#a8241c'; g.lineWidth = 3; g.beginPath(); g.arc(112, 136, 12, 0, 6.283); g.stroke(); }),
  horse: ctex(128, 96, (g) => { g.fillStyle = '#9a7a3a'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#d8cfb6'; g.fillRect(10, 10, 108, 76); g.fillStyle = '#2a1e16'; g.beginPath(); g.moveTo(30, 70); g.lineTo(36, 46); g.lineTo(74, 42); g.lineTo(92, 26); g.lineTo(100, 30); g.lineTo(90, 48); g.lineTo(94, 70); g.lineTo(88, 70); g.lineTo(84, 54); g.lineTo(46, 56); g.lineTo(40, 72); g.closePath(); g.fill(); }),
};
const std = (o) => new THREE.MeshStandardMaterial({ roughness: .8, metalness: 0, ...o });
const MAT = { floor: std({ map: TX.planks('#6a4428', [2, 2]) }), wood: std({ map: TX.planks('#4a2e1a', [1, 1]), roughness: .7 }), wall1: std({ map: TX.damask('#56634c', '#3c4834', [3, 2]) }), wall2: std({ map: TX.damask('#7a5c62', '#5c4048', [3, 2]) }),
  wall3: std({ map: TX.damask('#5a5a6a', '#40404e', [3, 2]) }), siding: std({ color: '#cfc3a8', roughness: .85 }), trim: std({ color: '#efe6d2', roughness: .6 }), roof: std({ map: TX.shingle, roughness: .9 }), attic: std({ map: TX.planks('#2e2218', [8, 8]), roughness: .95 }),
  velvet: std({ map: TX.velvet, roughness: 1 }), plastic: std({ color: '#26242a', roughness: .38 }), cream: std({ color: '#e6dcc4', roughness: .45 }), rug: std({ map: TX.rug, roughness: 1 }), brass: std({ color: '#a8823a', roughness: .35, metalness: .8 }),
  shade: std({ color: '#e8cf9a', roughness: .9, side: THREE.DoubleSide, emissive: new THREE.Color('#ff9a40'), emissiveIntensity: .55 }), glass: std({ color: '#0b1630', roughness: .1, emissive: new THREE.Color('#3a5a9a'), emissiveIntensity: .35 }),
  curtain: std({ color: '#6a2a2a', roughness: 1 }), blanket: std({ color: '#a86a7a', roughness: 1 }), linen: std({ color: '#efe8da', roughness: 1 }) };

// ---------- builders ----------
const add = (geo, mat, x, y, z, parent = scene, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function rbox(w, h, d, r = .04) { const s = new THREE.Shape(), a = w / 2 - r, b = h / 2 - r, q = Math.min(a, b) * .3; s.moveTo(-a + q, -b); s.lineTo(a - q, -b); s.quadraticCurveTo(a, -b, a, -b + q); s.lineTo(a, b - q); s.quadraticCurveTo(a, b, a - q, b); s.lineTo(-a + q, b); s.quadraticCurveTo(-a, b, -a, b - q); s.lineTo(-a, -b + q); s.quadraticCurveTo(-a, -b, -a + q, -b);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 6 }); g.center(); return g; }
const cyl = (r1, r2, h, n = 24, open = false) => new THREE.CylinderGeometry(r1, r2, h, n, 1, open);

// ---------- the dollhouse: 3 floors, 4.6 wide, front cut away ----------
const HW = 2.3, HD = 2.0, FL = [0, 2.5, 5.0], FH = 2.35;
add(box(5.4, .6, 4.8), MAT.wood, 0, -.3, .1);                                                     // the base
FL.forEach((y, i) => { add(box(2 * HW + .4, .15, 2 * HD + .3), i ? MAT.trim : MAT.trim, 0, y - .075, .05); add(box(2 * HW, .02, 2 * HD), MAT.floor, 0, y + .01, 0);   // floor slab + boards
  const wm = [MAT.wall1, MAT.wall2, MAT.wall3][i]; add(box(2 * HW, FH, .02), wm, 0, y + FH / 2, -HD + .01); for (const s of [-1, 1]) add(box(.02, FH, 2 * HD), wm, s * (HW - .01), y + FH / 2, 0);
  add(box(2 * HW + .4, FH, .2), MAT.siding, 0, y + FH / 2, -HD - .1); for (const s of [-1, 1]) add(box(.2, FH, 2 * HD + .3), MAT.siding, s * (HW + .1), y + FH / 2, .05);
  for (const s of [-1, 1]) add(box(.24, FH, .06), MAT.trim, s * (HW + .1), y + FH / 2, HD + .18);                                         // the cut front edges
  add(box(2 * HW, .1, .04), MAT.wood, 0, y + .05, -HD + .03); });                                                                          // skirting
add(box(2 * HW + .4, .15, 2 * HD + .3), MAT.trim, 0, 7.42, .05);
for (const s of [-1, 1]) { const r = add(box(3.1, .14, 2 * HD + .6), MAT.roof, s * 1.38, 8.35, .05); r.rotation.z = -s * .72; }   // gable roof
add(box(.5, 1.4, .5), MAT.siding, 1.3, 8.7, -.8);                                                                                       // chimney
// ---------- ground floor: the living room ----------
add(new THREE.CylinderGeometry(1.25, 1.25, .02, 48), MAT.rug, .1, .03, .1).scale.z = .75;
add(rbox(1.3, .62, .62, .04), MAT.wood, 1.15, .32, -1.6); for (let k = 0; k < 3; k++) add(box(.22, .32, .04), MAT.plastic, .78 + k * .28, .32, -1.28);
const tv = add(rbox(1.0, .8, .72, .08), MAT.plastic, 1.15, 1.03, -1.58);
const scrC = document.createElement('canvas'); scrC.width = 256; scrC.height = 192; const sq = scrC.getContext('2d'); const scrT = new THREE.CanvasTexture(scrC); scrT.encoding = THREE.sRGBEncoding;
const screen = add(new THREE.PlaneGeometry(.66, .5), new THREE.MeshBasicMaterial({ map: scrT, toneMapped: false }), 1.1, 1.06, -1.215, scene, false);
for (const s of [-1, 1]) { const a = add(cyl(.008, .008, .5, 6), MAT.brass, 1.15 + s * .12, 1.62, -1.6); a.rotation.z = -s * .5; }
add(cyl(.06, .09, .82, 16), MAT.wood, -1.35, .41, -1.5); add(cyl(.42, .42, .05, 32), MAT.wood, -1.35, .84, -1.5);
const phoneBase = add(rbox(.32, .09, .22, .03), MAT.cream, -1.35, .91, -1.48); const handset = add(rbox(.09, .3, .07, .03), MAT.cream, -1.4, 1.08, -1.5); handset.rotation.z = .1;
const led = add(new THREE.SphereGeometry(.014, 8, 8), new THREE.MeshBasicMaterial({ color: '#4cff70', toneMapped: false }), -1.24, .95, -1.37, scene, false);
add(cyl(.025, .025, 1.9, 8), MAT.brass, -1.95, .95, -1.6); add(cyl(.12, .2, .05, 16), MAT.brass, -1.95, .03, -1.6); const shade = add(cyl(.18, .32, .36, 24, true), MAT.shade, -1.95, 1.9, -1.6);
add(new THREE.PlaneGeometry(.9, 1.0), MAT.glass, -.2, 1.45, -1.97, scene, false); for (const [w, h, x, y] of [[.96, .05, -.2, 1.95], [.96, .05, -.2, .95], [.05, 1.0, -.66, 1.45], [.05, 1.0, .26, 1.45], [.9, .03, -.2, 1.45], [.03, 1.0, -.2, 1.45]]) add(box(w, h, .04), MAT.trim, x, y, -1.95);
for (const s of [-1, 1]) add(box(.22, 1.3, .03), MAT.curtain, -.2 + s * .56, 1.4, -1.92);
add(new THREE.PlaneGeometry(.42, .32), std({ map: TX.horse }), 1.15, 1.95, -1.97, scene, false);
add(new THREE.PlaneGeometry(.34, .42), std({ map: TX.calendar }), -2.27, 1.5, -.4, scene, false).rotation.y = Math.PI / 2;
add(rbox(.5, .45, 1.5, .08), MAT.velvet, -1.9, .3, .55); add(rbox(.16, .6, 1.5, .07), MAT.velvet, -2.12, .6, .55);   // an armchair-settee against the wall
// ---------- upstairs: a bedroom, and a nursery under the roof (dim, just life in the windows) ----------
add(rbox(1.5, .4, 2.2, .06), MAT.wood, -1.2, 2.72, -.7); add(rbox(1.45, .14, 2.0, .06), MAT.blanket, -1.2, 2.98, -.55); add(rbox(1.2, .16, .38, .07), MAT.linen, -1.2, 3.02, -1.55); add(rbox(.5, .5, .4, .04), MAT.wood, .2, 2.75, -1.7);
add(new THREE.PlaneGeometry(.8, .9), MAT.glass, 1.2, 3.85, -1.97, scene, false);
const horse = new THREE.Group(); horse.position.set(-.8, 5.0, -.6); scene.add(horse); add(box(.9, .32, .26), MAT.cream, 0, .75, 0, horse); add(box(.24, .5, .24), MAT.cream, .42, 1.05, 0, horse); for (const x of [-.35, .3]) for (const z of [-.08, .08]) add(cyl(.035, .035, .45, 8), MAT.cream, x, .45, z, horse);
add(box(1.4, .07, .26), MAT.wood, 0, .2, 0, horse).scale.y = 1;   // a rocking horse (a hint)
add(rbox(1.0, .9, .6, .05), MAT.wood, 1.3, 5.45, -1.5);
// ---------- the attic around it ----------
add(new THREE.PlaneGeometry(80, 80), MAT.attic, 0, -.6, 0, scene, false).rotation.x = -Math.PI / 2;
const moonWin = add(new THREE.CircleGeometry(3.2, 48), new THREE.MeshBasicMaterial({ color: '#9fb8ff', toneMapped: false }), 9, 12, -38, scene, false);
const beam = add(new THREE.CylinderGeometry(2.6, 6.5, 44, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#6f88c8', transparent: true, opacity: .05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 4.5, 6, -16, scene, false); beam.lookAt(9, 12, -38); beam.rotateX(Math.PI / 2);
const dust = (() => { const n = 900, pos = new Float32Array(n * 3), r = rng(5); for (let i = 0; i < n; i++) { pos[i * 3] = -6 + r() * 14; pos[i * 3 + 1] = r() * 12; pos[i * 3 + 2] = -14 + r() * 22; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#c8d4ff', size: .035, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(p); return p; })();

// ---------- the doll: porcelain head, painted peg body, yarn hair, pipe-cleaner arms ----------
const doll = new THREE.Group(); scene.add(doll);
const bodyTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#2b2f3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#34486e'; g.fillRect(0, h * .62, w, h * .38); g.fillStyle = '#e8dcc4'; for (const x of [6, w - 6]) for (let y = 30; y < 140; y += 26) { g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); } g.fillStyle = '#1a1c24'; g.fillRect(0, h * .58, w, 6); });
const prof = [[0, 0], [.2, 0], [.23, .04], [.22, .5], [.19, .8], [.16, .98], [.2, 1.06], [.17, 1.13], [.08, 1.17], [0, 1.18]].map(([x, y]) => new THREE.Vector2(x, y));
add(new THREE.LatheGeometry(prof, 32), std({ map: bodyTex, roughness: .5 }), 0, 0, 0, doll);
const porcelain = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .32, clearcoat: 1, clearcoatRoughness: .12 });
add(cyl(.06, .07, .1, 16), porcelain, 0, 1.2, 0, doll);
const faceTex = ctex(1024, 512, (g, w, h) => { g.fillStyle = '#f3e4d8'; g.fillRect(0, 0, w, h); const cx = w * .25, cy = h * .5;
  for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * 70, cy + 40, 2, cx + s * 70, cy + 40, 46); gr.addColorStop(0, 'rgba(226,120,120,.55)'); gr.addColorStop(1, 'rgba(226,120,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // cheeks
    g.fillStyle = '#0c0a0c'; g.beginPath(); g.ellipse(cx + s * 52, cy - 14, 22, 27, 0, 0, 6.283); g.fill(); g.fillStyle = '#f8f8ff'; g.beginPath(); g.arc(cx + s * 52 - 7, cy - 24, 6, 0, 6.283); g.fill(); g.beginPath(); g.arc(cx + s * 52 + 8, cy - 6, 2.5, 0, 6.283); g.fill();   // painted glossy eyes
    g.strokeStyle = '#5a3a28'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + s * 30, cy - 58); g.quadraticCurveTo(cx + s * 52, cy - 70, cx + s * 78, cy - 60); g.stroke(); g.strokeStyle = '#1a1214'; g.lineWidth = 2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(cx + s * (52 + k * 14), cy - 42); g.lineTo(cx + s * (54 + k * 18), cy - 50); g.stroke(); } }
  g.fillStyle = '#b8302e'; g.beginPath(); g.ellipse(cx, cy + 62, 10, 8, 0, 0, 6.283); g.fill(); g.fillStyle = '#5a1012'; g.beginPath(); g.ellipse(cx, cy + 63, 5, 4, 0, 0, 6.283); g.fill();   // a little "o"
  g.strokeStyle = 'rgba(70,50,40,.75)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx + 30, cy - 110); g.lineTo(cx + 22, cy - 80); g.lineTo(cx + 34, cy - 66); g.lineTo(cx + 26, cy - 40); g.moveTo(cx + 22, cy - 80); g.lineTo(cx + 8, cy - 72); g.stroke(); });   // a hairline crack
porcelain.map = faceTex; const head = add(new THREE.SphereGeometry(.2, 48, 32), porcelain, 0, 1.43, 0, doll);
const yarn = std({ color: '#e0b448', roughness: 1 });
add(new THREE.SphereGeometry(.212, 32, 16, Math.PI / 2 + .95, Math.PI * 2 - 1.9, 0, 1.75), yarn, 0, 1.43, 0, doll);
add(new THREE.SphereGeometry(.214, 32, 8, 0, Math.PI * 2, 0, .62), yarn, 0, 1.43, 0, doll);
{ const r = rng(12); for (let i = 0; i < 26; i++) { const a = Math.PI + (r() - .5) * 2.8, len = .38 + r() * .2, s = add(new THREE.CapsuleGeometry(.024, len, 4, 8), yarn, Math.sin(a) * .17, 1.43 - len / 2 + .02, Math.cos(a) * .17, doll); s.rotation.z = Math.sin(a) * .18; s.rotation.x = -Math.cos(a) * .18; } }
const pipe = std({ color: '#2b2f3c', roughness: .9 }), handMat = porcelain.clone(); handMat.map = null;
const limb = () => ({ up: add(new THREE.CapsuleGeometry(.04, 1, 4, 8), pipe, 0, 0, 0, doll), fore: add(new THREE.CapsuleGeometry(.036, 1, 4, 8), pipe, 0, 0, 0, doll), hand: add(new THREE.SphereGeometry(.05, 16, 12), handMat, 0, 0, 0, doll) });
const seg = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, .5); m.scale.y = Math.max(.01, d.length() - .08); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
const V = (x, y, z) => new THREE.Vector3(x, y, z), poseArm = (A, S, E, Hd) => { seg(A.up, S, E); seg(A.fore, E, Hd); A.hand.position.copy(Hd); };
const armL = limb(), armR = limb(); const held = add(rbox(.075, .26, .06, .025), MAT.cream, 0, 0, 0, doll);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight('#2a3450', '#120a06', .45));
const lamp = new THREE.PointLight('#ffb070', 3.2, 6.5, 2); lamp.position.set(-1.95, 1.86, -1.6); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -.002; lamp.shadow.normalBias = .02; lamp.shadow.camera.near = .04; lamp.shadow.camera.far = 8; lamp.shadow.radius = 4; scene.add(lamp);
const tvLight = new THREE.PointLight('#a8c4ff', 2.2, 5.5, 2); tvLight.position.set(1.1, 1.1, -.95); scene.add(tvLight);
const night = new THREE.PointLight('#ff9a5a', .9, 3.5, 2); night.position.set(.3, 3.4, -1.0); scene.add(night);
const moon = new THREE.DirectionalLight('#8aa4ff', .3); moon.position.set(-6, 12, 9); moon.castShadow = false; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 10, bottom: -2, near: 1, far: 40 }); moon.shadow.bias = -.0005; moon.shadow.normalBias = .06; scene.add(moon);

// ---------- post: tilt-shift blur in linear light, ACES, film grain, vignette, captions ----------
const cap = document.createElement('canvas'); cap.width = W; cap.height = H; const cq = cap.getContext('2d'); const capT = new THREE.CanvasTexture(cap);
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: rt.texture }, cap: { value: capT }, res: { value: new THREE.Vector2(W, H) }, focus: { value: .4 }, band: { value: .1 }, amt: { value: 20 }, time: { value: 0 }, expo: { value: 1.25 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse, cap; uniform vec2 res; uniform float focus, band, amt, time, expo; varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() { float r = amt * smoothstep(band, band + 0.3, abs(vUv.y - focus)); vec3 acc = vec3(0.0); float rot = hash(gl_FragCoord.xy) * 6.283;
      for (int i = 0; i < 40; i++) { float a = float(i) * 2.39996 + rot, rr = sqrt((float(i) + 0.5) / 40.0) * r; acc += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rr / res).rgb; }
      vec3 c = aces(acc / 40.0 * expo); c = pow(c, vec3(1.0 / 2.2)); c = mix(c, c * vec3(1.06, 0.98, 0.9), 0.5);
      vec2 q = vUv - 0.5; c *= 1.0 - dot(q * vec2(1.0, 0.7), q * vec2(1.0, 0.7)) * 1.6; c += (hash(gl_FragCoord.xy + time) - 0.5) * 0.035;
      vec4 k = texture2D(cap, vUv); gl_FragColor = vec4(mix(c, k.rgb, k.a), 1.0); }` }));
const postScene = new THREE.Scene(); postScene.add(post); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function captions(t) { cq.clearRect(0, 0, W, H); const id = ['L3', 'L3b', 'L4'].find(k => { const l = NB.TL.lines[k]; return l && t >= l.start - .1 && t < l.start + l.dur + .5; }); if (!id) { capT.needsUpdate = true; return; }
  const l = NB.TL.lines[id]; cq.font = 'italic 64px Baskerville, "Times New Roman", serif'; cq.textBaseline = 'middle'; const lines = []; let cur = []; for (const w of l.words) { cur.push(w); if (cq.measureText(cur.map(x => x.w).join(' ')).width > W - 180) { cur.pop(); lines.push(cur); cur = [w]; } } if (cur.length) lines.push(cur);
  lines.forEach((ws, i) => { const tw = cq.measureText(ws.map(x => x.w).join(' ')).width; let x = (W - tw) / 2; const y = 1530 + (i - (lines.length - 1) / 2) * 78;
    for (const w of ws) { const now = t >= l.start + w.s && t < l.start + w.e + .12; cq.shadowColor = 'rgba(0,0,0,.85)'; cq.shadowBlur = 18; cq.fillStyle = id === 'L3b' ? '#d6e2ff' : now ? '#f2c46b' : '#f4efe6'; cq.fillText(w.w, x, y); x += cq.measureText(w.w + ' ').width; } cq.shadowBlur = 0; }); capT.needsUpdate = true; }

// ---------- staging (stop-motion: the doll and the phone move on 12 fps) ----------
function drawScreen(kind, t) { const r = rng(Math.floor(t * 12)); sq.fillStyle = '#05070a'; sq.fillRect(0, 0, 256, 192);
  if (kind === 'ring') { const gr = sq.createRadialGradient(128, 96, 30, 128, 96, 90); gr.addColorStop(0, 'rgba(200,220,255,0)'); gr.addColorStop(.5, 'rgba(200,220,255,.5)'); gr.addColorStop(1, 'rgba(200,220,255,0)'); sq.fillStyle = gr; sq.fillRect(0, 0, 256, 192); sq.strokeStyle = '#f4f8ff'; sq.lineWidth = 9; sq.beginPath(); sq.arc(128, 96, 52, 0, 6.283); sq.stroke(); }
  else for (let i = 0; i < 2600; i++) { const v = r() * 255 | 0; sq.fillStyle = `rgb(${v},${v},${v})`; sq.fillRect(r() * 256 | 0, r() * 192 | 0, 3, 2); }
  for (let y = 0; y < 192; y += 3) { sq.fillStyle = 'rgba(0,0,0,.3)'; sq.fillRect(0, y, 256, 1); } scrT.needsUpdate = true; }
const SHOTS = () => [   // [t0, dur, camera, look, fov, focus, band, blur]
  [0, 1, V(.2, 4.3, 17.5), V(0, 3.9, 0), 31, .34, .09, 22],
  [st('L3') + .2, 2.2, V(.1, 3.2, 13.5), V(0, 2.4, 0), 31, .3, .09, 22],
  [at('L3', 'phone') - .25, .35, V(-.55, 1.42, 1.25), V(-1.35, .98, -1.5), 30, .5, .07, 26],
  [st('L3b') - .25, .4, V(-.36, 1.45, .95), V(-.8, 1.3, -.82), 30, .52, .12, 20],
  [st('L4') + .1, 3.0, V(2.8, .25, 12.5), V(0, 3.2, 0), 34, .4, .12, 24],
];
window.seek = t => {
  const tq = Math.floor(t * 12) / 12, ends = at('L3', 'ends'), ring = at('L3', 'phone') - .1, pick = st('L3b') - .45, r = rng(Math.floor(t * 12) + 5);
  drawScreen(t < ends + .1 ? 'ring' : 'static', t); const fl = t < ends + .1 ? 1 : .7 + .6 * r(); tvLight.intensity = 2.2 * fl; lamp.intensity = 3.2 * (.93 + .07 * Math.sin(tq * 23) + (r() < .08 ? -.5 : 0));
  if (t < pick) { doll.position.set(.25, 0, .25); doll.rotation.y = 2.7 + (r() - .5) * .02; held.visible = false; handset.visible = true;
    poseArm(armL, V(-.18, 1.08, 0), V(-.24, .82, .02), V(-.26, .58, .05)); poseArm(armR, V(.18, 1.08, 0), V(.24, .82, .02), V(.26, .58, .05)); }
  else { doll.position.set(-.86, 0, -.82); doll.rotation.y = .32 + (r() - .5) * .02; held.visible = true; handset.visible = false;
    poseArm(armL, V(-.18, 1.08, 0), V(-.24, .82, .04), V(-.25, .58, .08)); poseArm(armR, V(.18, 1.08, 0), V(.27, .9, .14), V(.17, 1.36, .07)); held.position.set(.19, 1.42, .05); held.rotation.set(.15, 0, .35); }
  head.rotation.set(t > pick ? .06 : 0, 0, t > pick ? -.08 : 0);
  const ringing = t > ring && t < pick; led.visible = ringing && Math.floor(t * 8) % 2 === 0; handset.rotation.z = .1 + (ringing ? (r() - .5) * .14 : 0); handset.position.y = 1.08 + (ringing ? r() * .012 : 0); phoneBase.position.x = -1.35 + (ringing ? (r() - .5) * .01 : 0);
  dust.rotation.y = t * .01; dust.position.y = -t * .03;
  let s0 = SHOTS()[0], cp = s0[2].clone(), cl = s0[3].clone(), fov = s0[4], fo = s0[5], bd = s0[6], bl = s0[7];
  for (const [t0, d, p, l, f, f2, b2, bb] of SHOTS()) { const k = eio(P(t, t0, d)); if (k <= 0) break; cp.lerp(p, k); cl.lerp(l, k); fov = lerp(fov, f, k); fo = lerp(fo, f2, k); bd = lerp(bd, b2, k); bl = lerp(bl, bb, k); }
  camera.fov = fov; camera.updateProjectionMatrix(); camera.position.copy(cp); camera.lookAt(cl);
  const U = post.material.uniforms; U.focus.value = fo; U.band.value = bd; U.amt.value = bl; U.time.value = t; captions(t);
  renderer.setRenderTarget(rt); renderer.setClearColor('#020203'); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); return true; };
window.setTL = tl => { NB.TL = tl; return true; }; window.DBG = { MAT, scene, beam, dust };
document.fonts.load('italic 64px Baskerville').then(() => { window.ready = true; });
})();
