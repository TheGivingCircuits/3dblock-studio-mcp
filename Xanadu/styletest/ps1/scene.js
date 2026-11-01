// STYLE TEST — PS1 low-poly horror + found footage: a real 3D room rendered at 270x480 and blown up into chunky pixels, with
// PS1 vertex wobble, warped (affine) textures, 15-bit colour + ordered dithering, fog, vertex lighting from the TV, and a
// camcorder overlay (REC, timestamp, viewfinder corners).
(function () {
const { P, lerp, eio, eo, clamp, rng, at, st, en } = NB;
const W = 1080, H = 1920, LW = 270, LH = 480;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); (document.body || document.documentElement).appendChild(renderer.domElement);
const rt = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, LW / LH, .05, 40);

// ---------- the PS1 material: snapped vertices, affine UVs, per-vertex light, fog ----------
const VS = `uniform vec2 snap; uniform vec3 l1Pos, l1Col, l2Pos, l2Col, amb; uniform float l1Rng, l2Rng, fogNear, fogFar, unlit;
varying vec2 vUvW; varying float vW; varying vec3 vLight; varying float vFog;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vec3 n = normalize(mat3(modelMatrix) * normal);
  vec3 d1 = l1Pos - wp.xyz, d2 = l2Pos - wp.xyz; float a1 = max(0.0, 1.0 - length(d1) / l1Rng), a2 = max(0.0, 1.0 - length(d2) / l2Rng);
  vec3 L = amb + l1Col * max(dot(n, normalize(d1)), 0.0) * a1 + l2Col * max(dot(n, normalize(d2)), 0.0) * a2; vLight = mix(L, vec3(1.0), unlit);
  vec4 mv = viewMatrix * wp; vec4 p = projectionMatrix * mv; vec2 s = p.xy / p.w; s = floor(s * snap + 0.5) / snap; p.xy = s * p.w;
  gl_Position = p; vUvW = uv * p.w; vW = p.w; vFog = clamp((-mv.z - fogNear) / (fogFar - fogNear), 0.0, 1.0); }`;
const FS = `uniform sampler2D map; uniform vec3 tint, fogColor; varying vec2 vUvW; varying float vW; varying vec3 vLight; varying float vFog;
void main() { vec4 c = texture2D(map, vUvW / vW); if (c.a < 0.5) discard; vec3 col = c.rgb * tint * vLight; gl_FragColor = vec4(mix(col, fogColor, vFog), 1.0); }`;
const SH = { snap: { value: new THREE.Vector2(LW * .5, LH * .5) }, l1Pos: { value: new THREE.Vector3(.6, .9, -1.0) }, l1Col: { value: new THREE.Color(.6, .7, 1) }, l1Rng: { value: 5.5 },
  l2Pos: { value: new THREE.Vector3(2.3, 2.0, 1.6) }, l2Col: { value: new THREE.Color(.75, .52, .3) }, l2Rng: { value: 6.5 }, amb: { value: new THREE.Color(.16, .16, .2) },
  fogColor: { value: new THREE.Color('#04060a') }, fogNear: { value: 2.2 }, fogFar: { value: 8.5 } };
const M = (map, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...SH, map: { value: map }, tint: { value: new THREE.Color(o.tint || '#ffffff') }, unlit: { value: o.unlit ? 1 : 0 } }, vertexShader: VS, fragmentShader: FS, side: o.side || THREE.FrontSide });
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); q.imageSmoothingEnabled = false; draw(q, w, h, rng(w * 7 + h)); const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const noise = (q, w, h, r, col, n, a = .35) => { for (let i = 0; i < n; i++) { q.fillStyle = col; q.globalAlpha = a * r(); q.fillRect(r() * w | 0, r() * h | 0, 1, 1); } q.globalAlpha = 1; };
const rep = (geo, rx, ry) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry); return geo; };
const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ---------- textures (tiny, on purpose) ----------
const T = {
  wall: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4b5a45'; q.fillRect(0, 0, w, h); q.fillStyle = '#58694f'; q.fillRect(0, 0, 3, h); q.fillRect(8, 0, 3, h); noise(q, w, h, r, '#1c241a', 60, .6); }),
  floor: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a3226'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1a12', 90, .8); noise(q, w, h, r, '#6a4a36', 40, .6); }),
  ceil: tex(8, 8, (q, w, h) => { q.fillStyle = '#2a2826'; q.fillRect(0, 0, w, h); }),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  tv: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2b2a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#1a191e'; for (let y = 3; y < h; y += 3) q.fillRect(2, y, 5, 1); noise(q, w, h, r, '#45444c', 20, .6); }),
  couch: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a1f24'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e0c10', 80, .9); noise(q, w, h, r, '#7a3036', 30, .7); }),
  coat: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#30333a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1c1e22', 14, .8); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#33456a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1f2c48', 14, .8); }),
  skin: tex(4, 4, q => { q.fillStyle = '#d6a084'; q.fillRect(0, 0, 4, 4); }),
  hair: tex(8, 16, (q, w, h) => { q.fillStyle = '#d6b04a'; q.fillRect(0, 0, w, h); q.fillStyle = '#a8842c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  face: tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    px('#d6a084', 0, 0, 24, 28); px('#d6b04a', 0, 0, 24, 6); px('#d6b04a', 0, 6, 3, 14); px('#d6b04a', 21, 6, 3, 14); px('#b8923a', 4, 5, 3, 2); px('#b8923a', 15, 5, 4, 2);
    px('#5a3a22', 5, 8, 4, 1); px('#5a3a22', 4, 9, 1, 1); px('#5a3a22', 15, 8, 4, 1); px('#5a3a22', 19, 9, 1, 1);       // brows, raised
    px('#f4f2ec', 5, 11, 4, 3); px('#f4f2ec', 15, 11, 4, 3); px('#1a1410', 7, 12); px('#1a1410', 16, 12);                 // wide eyes, tiny pupils
    px('#b07a62', 11, 15, 2, 3); px('#c08870', 4, 16, 3, 2); px('#c08870', 17, 16, 3, 2);
    px('#3a1612', 10, 20, 4, 3); px('#7a2a24', 11, 21, 2, 1); }),                                                         // a scream
  phone: tex(8, 16, (q, w, h) => { q.fillStyle = '#d8d0bc'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a2a2a'; for (let y = 6; y < 14; y += 2) for (let x = 1; x < 7; x += 2) q.fillRect(x, y, 1, 1); q.fillStyle = '#6a7a6a'; q.fillRect(2, 1, 4, 3); }),
  window: tex(16, 20, (q, w, h, r) => { q.fillStyle = '#0c1a33'; q.fillRect(0, 0, w, h); q.fillStyle = '#c8d4f0'; q.fillRect(10, 3, 3, 3); q.fillStyle = '#7a8ab0'; for (let i = 0; i < 10; i++) q.fillRect(r() * w | 0, r() * h | 0, 1, 2); q.fillStyle = '#c9c2b0'; q.fillRect(7, 0, 2, h); q.fillRect(0, 9, w, 2); }),
  picture: tex(16, 12, (q) => { q.fillStyle = '#8a6a2a'; q.fillRect(0, 0, 16, 12); q.fillStyle = '#c8c0a8'; q.fillRect(2, 2, 12, 8); q.fillStyle = '#2a1e16'; q.fillRect(4, 5, 7, 2); q.fillRect(10, 4, 2, 2); q.fillRect(4, 7, 1, 2); q.fillRect(9, 7, 1, 2); }),
  black: tex(4, 4, q => { q.fillStyle = '#020203'; q.fillRect(0, 0, 4, 4); }),
  shade: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#8a7a5a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a4a32', 10, .8); }),
  led: tex(2, 2, q => { q.fillStyle = '#4cff6a'; q.fillRect(0, 0, 2, 2); }),
};
// the TV picture: a tiny live canvas
const scrC = document.createElement('canvas'); scrC.width = 64; scrC.height = 48; const sq = scrC.getContext('2d'); const scrT = new THREE.CanvasTexture(scrC); scrT.magFilter = scrT.minFilter = THREE.NearestFilter; scrT.generateMipmaps = false;
function drawScreen(kind, t) { const r = rng(Math.floor(t * 15)); sq.fillStyle = '#050608'; sq.fillRect(0, 0, 64, 48);
  if (kind === 'ring') { sq.strokeStyle = '#eef4ff'; sq.lineWidth = 3; sq.beginPath(); sq.arc(32, 24, 13, 0, 6.283); sq.stroke(); sq.strokeStyle = 'rgba(200,215,255,.4)'; sq.lineWidth = 7; sq.stroke(); }
  else if (kind === 'static') { for (let i = 0; i < 900; i++) { const v = r() * 255 | 0; sq.fillStyle = `rgb(${v},${v},${v})`; sq.fillRect(r() * 64 | 0, r() * 48 | 0, 2, 1); } }
  else if (kind === 'well') { sq.fillStyle = '#3a3e44'; sq.fillRect(0, 0, 64, 26); sq.fillStyle = '#6a6e74'; sq.fillRect(0, 26, 64, 22); sq.fillStyle = '#a8acb2'; sq.fillRect(24, 22, 16, 10); sq.fillStyle = '#050608'; sq.fillRect(26, 21, 12, 2); }
  for (let y = 0; y < 48; y += 2) { sq.fillStyle = 'rgba(0,0,0,.25)'; sq.fillRect(0, y, 64, 1); } scrT.needsUpdate = true; }

// ---------- the room ----------
add(rep(new THREE.PlaneGeometry(5, 4.5), 5, 4.5), M(T.floor), 0, 0, .25).rotation.x = -Math.PI / 2;
add(rep(new THREE.PlaneGeometry(5, 2.6), 6, 3), M(T.wall), 0, 1.3, -2);
add(rep(new THREE.PlaneGeometry(4.5, 2.6), 5.5, 3), M(T.wall), -2.5, 1.3, .25).rotation.y = Math.PI / 2;
add(rep(new THREE.PlaneGeometry(4.5, 2.6), 5.5, 3), M(T.wall), 2.5, 1.3, .25).rotation.y = -Math.PI / 2;
add(new THREE.PlaneGeometry(5, 4.5), M(T.ceil), 0, 2.6, .25).rotation.x = Math.PI / 2;
for (const [x, z, w, d] of [[0, -1.98, 5, .04], [-2.48, .25, .04, 4.5], [2.48, .25, .04, 4.5]]) add(box(w, .14, d), M(T.wood), x, .07, z);
add(new THREE.PlaneGeometry(1.0, 1.25), M(T.window, { unlit: true, tint: '#8a96b8' }), -2.48, 1.45, -.5).rotation.y = Math.PI / 2;
add(new THREE.PlaneGeometry(.9, 2.0), M(T.black), 2.48, 1.0, 1.3).rotation.y = -Math.PI / 2;      // a dark doorway
add(new THREE.PlaneGeometry(.5, .38), M(T.picture), -1.1, 1.62, -1.98);
// TV on its stand
add(box(1.3, .5, .5), M(T.wood), .6, .25, -1.7); for (let k = 0; k < 4; k++) add(box(.1, .2, .02), M(T.black), .15 + k * .16, .25, -1.44);
add(box(.84, .66, .6), M(T.tv), .6, .83, -1.68); const screen = add(new THREE.PlaneGeometry(.6, .45), M(scrT, { unlit: true }), .54, .85, -1.375);
for (const s of [-1, 1]) { const a = add(box(.015, .42, .015), M(T.tv), .6 + s * .12, 1.3, -1.7); a.rotation.z = -s * .45; }
// couch
add(box(1.9, .42, .85), M(T.couch), .3, .21, .95); add(box(1.9, .56, .22), M(T.couch), .3, .63, 1.3); for (const x of [-.65, 1.25]) add(box(.22, .58, .85), M(T.couch), x, .29, .95);
// side table, the phone, a lamp
add(new THREE.CylinderGeometry(.08, .1, .62, 6), M(T.wood), -1.4, .31, -1.3); add(new THREE.CylinderGeometry(.38, .38, .05, 7), M(T.wood), -1.4, .645, -1.3);
const phoneBase = add(box(.24, .07, .17), M(T.phone), -1.4, .705, -1.3); const handset = add(box(.07, .23, .06), M(T.phone), -1.46, .83, -1.33); handset.rotation.z = .12;
const led = add(box(.025, .012, .012), M(T.led, { unlit: true }), -1.33, .745, -1.215);
add(new THREE.CylinderGeometry(.02, .02, 1.5, 4), M(T.tv), -2.1, .75, -1.7); add(new THREE.CylinderGeometry(.14, .28, .3, 6, 1, true), M(T.shade, { side: THREE.DoubleSide }), -2.1, 1.6, -1.7);

// ---------- her: a low-poly woman ----------
const her = new THREE.Group(); scene.add(her);
for (const x of [-.09, .09]) add(box(.13, .78, .13), M(T.jeans), x, .39, 0, her);
add(box(.4, .64, .25), M(T.coat), 0, 1.08, 0, her); add(box(.08, .08, .08), M(T.skin), 0, 1.42, 0, her);
add(box(.2, .24, .22), [M(T.skin), M(T.skin), M(T.hair), M(T.skin), M(T.face), M(T.hair)], 0, 1.56, 0, her);
add(box(.26, .5, .1), M(T.hair), 0, 1.4, -.11, her); add(box(.24, .07, .25), M(T.hair), 0, 1.69, -.005, her); for (const s of [-1, 1]) add(box(.04, .42, .2), M(T.hair), s * .12, 1.45, -.02, her);
// two-segment arms posed by points (shoulder → elbow → hand), so she can bring the receiver to her ear
const arm = () => ({ up: add(box(.1, 1, .11), M(T.coat), 0, 0, 0, her), fore: add(box(.09, 1, .1), M(T.coat), 0, 0, 0, her), hand: add(box(.08, .1, .08), M(T.skin), 0, 0, 0, her) });
const limb = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, .5); m.scale.y = d.length(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
const poseArm = (A, S, E, Hd) => { limb(A.up, S, E); limb(A.fore, E, Hd); A.hand.position.copy(Hd); };
const armL = arm(), armR = arm();
const heldSet = add(box(.06, .22, .055), M(T.phone), 0, 0, 0, her);

// ---------- the post pass: 15-bit colour + 4x4 Bayer dither, chroma bleed, scanlines, grain, tape wobble, then the camcorder HUD ----------
const hud = document.createElement('canvas'); hud.width = LW; hud.height = LH; const hq = hud.getContext('2d'); const hudT = new THREE.CanvasTexture(hud); hudT.magFilter = hudT.minFilter = THREE.NearestFilter; hudT.generateMipmaps = false;
const bayer = new THREE.DataTexture(new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].flatMap(v => [v * 16, 0, 0, 255])), 4, 4); bayer.magFilter = bayer.minFilter = THREE.NearestFilter; bayer.wrapS = bayer.wrapT = THREE.RepeatWrapping; bayer.needsUpdate = true;
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { scn: { value: rt.texture }, hud: { value: hudT }, bay: { value: bayer }, res: { value: new THREE.Vector2(LW, LH) }, time: { value: 0 }, wob: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D scn, hud, bay; uniform vec2 res; uniform float time, wob; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() { vec2 px = floor(vUv * res); float sh = wob * (hash(vec2(floor(px.y / 6.0), floor(time * 12.0))) - 0.5) * 3.0 + sin(px.y * 0.21 + time * 3.0) * 0.35;
      vec2 uv = (px + vec2(0.5 + sh, 0.5)) / res, o = vec2(1.0 / res.x, 0.0);
      vec3 c = vec3(texture2D(scn, uv + o).r, texture2D(scn, uv).g, texture2D(scn, uv - o).b);
      float b = texture2D(bay, px / 4.0).r - 0.5; c = pow(c, vec3(0.8)); c = floor(c * 31.0 + b + 0.5) / 31.0;
      c *= mod(px.y, 2.0) < 1.0 ? 1.0 : 0.84; c += (hash(px + floor(time * 30.0)) - 0.5) * 0.06;
      vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 1.1;
      vec4 h = texture2D(hud, (px + 0.5) / res); gl_FragColor = vec4(mix(c, h.rgb, h.a), 1.0); }` }));
const postScene = new THREE.Scene(); postScene.add(post); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function drawHud(t) { hq.clearRect(0, 0, LW, LH); hq.imageSmoothingEnabled = false; const font = s => `bold ${s}px "Courier New", monospace`;
  hq.strokeStyle = 'rgba(255,255,255,.85)'; hq.lineWidth = 2; for (const [x, y, sx, sy] of [[10, 10, 1, 1], [LW - 10, 10, -1, 1], [10, LH - 10, 1, -1], [LW - 10, LH - 10, -1, -1]]) { hq.beginPath(); hq.moveTo(x, y + sy * 18); hq.lineTo(x, y); hq.lineTo(x + sx * 18, y); hq.stroke(); }
  if (Math.floor(t * 1.6) % 2 === 0) { hq.fillStyle = '#ff2a22'; hq.beginPath(); hq.arc(24, 27, 5, 0, 6.283); hq.fill(); } hq.fillStyle = '#ffffff'; hq.font = font(15); hq.fillText('REC', 33, 32);
  hq.font = font(12); hq.fillText('SP', LW - 62, 31); hq.strokeStyle = '#fff'; hq.lineWidth = 1.5; hq.strokeRect(LW - 40, 22, 20, 10); hq.fillRect(LW - 20, 25, 2, 4); for (let k = 0; k < (t % 4 < 3.4 ? 3 : 1); k++) hq.fillRect(LW - 38 + k * 6, 24, 4, 6);
  const sec = 3 + Math.floor(t); hq.font = font(13); hq.fillText('OCT.16 2002', 16, LH - 20); hq.textAlign = 'right'; hq.fillText(`11:58:${String(sec).padStart(2, '0')} PM`, LW - 16, LH - 20); hq.textAlign = 'left';
  // subtitles, DVD style: the current line, the word being spoken in yellow
  const id = ['L3', 'L3b', 'L4'].find(k => { const l = NB.TL.lines[k]; return l && t >= l.start - .1 && t < l.start + l.dur + .5; }); if (id) { const l = NB.TL.lines[id]; hq.font = `bold 15px Arial, sans-serif`;
    const lines = []; let cur = []; for (const w of l.words) { cur.push(w); if (hq.measureText(cur.map(x => x.w).join(' ')).width > LW - 50) { cur.pop(); lines.push(cur); cur = [w]; } } if (cur.length) lines.push(cur);
    lines.forEach((ws, i) => { const tw = hq.measureText(ws.map(x => x.w).join(' ')).width; let x = (LW - tw) / 2; const y = LH - 74 + (i - lines.length + 1) * 19;
      for (const w of ws) { const now = t >= l.start + w.s && t < l.start + w.e + .15; hq.fillStyle = '#000'; hq.fillText(w.w, x + 1, y + 1); hq.fillStyle = id === 'L3b' ? '#cfe0ff' : now ? '#ffe14d' : '#ffffff'; hq.fillText(w.w, x, y); x += hq.measureText(w.w + ' ').width; } }); }
  hudT.needsUpdate = true; }

// ---------- staging over time: the TV, her, the handheld camcorder ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = () => [   // [t0, dur, camera position, look-at, fov]
  [0, 1, V(.5, 1.72, 1.95), V(.42, 1.0, -1.6), 58],
  [at('L3', 'phone') - .2, .22, V(-.45, 1.3, -.15), V(-1.42, .76, -1.3), 42],   // whip-pan to the phone
  [st('L3b') - .25, .35, V(-.42, 1.5, .62), V(-1.0, 1.36, -.72), 50],             // her face, the receiver at her ear
  [st('L4') + .2, 2.6, V(1.75, 1.75, 2.15), V(-.4, .95, -1.1), 62],                // backing out through the doorway
];
window.seek = t => {
  const ends = at('L3', 'ends'), ring = at('L3', 'phone') - .1, pick = st('L3b') - .45;
  drawScreen(t < ends + .1 ? 'ring' : t < st('L4') + 1.5 ? 'static' : Math.floor(t * 3) % 5 ? 'well' : 'static', t);
  const flick = t < ends + .1 ? .9 + .1 * Math.sin(t * 7) : .8 + .4 * rng(Math.floor(t * 15))(); SH.l1Col.value.setRGB(1.0 * flick, 1.15 * flick, 1.6 * flick);
  // her: watching the TV with her back to us, then at the phone, the receiver at her ear
  if (t < pick) { her.position.set(.02, 0, -.55); her.rotation.y = Math.PI + .3; poseArm(armR, V(.24, 1.36, 0), V(.27, 1.07, 0), V(.28, .79, .02)); heldSet.visible = false; handset.visible = true; }
  else { her.position.set(-1.02, 0, -.72); her.rotation.y = .42; poseArm(armR, V(.24, 1.36, 0), V(.3, 1.13, .13), V(.15, 1.5, .07)); heldSet.position.set(.13, 1.52, .06); heldSet.rotation.set(.2, 0, .5); heldSet.visible = true; handset.visible = false; }
  poseArm(armL, V(-.24, 1.36, 0), V(-.27, 1.07, 0), V(-.28, .79, .02)); led.visible = t > ring && t < pick && Math.floor(t * 8) % 2 === 0;
  phoneBase.position.x = -1.4 + (t > ring && t < pick ? Math.sin(t * 90) * .006 : 0);
  if (t > ring && t < pick) handset.rotation.z = .12 + Math.sin(t * 80) * .06;
  // the camcorder: shots + handheld drift
  let cp = SHOTS()[0][2].clone(), cl = SHOTS()[0][3].clone(), fov = SHOTS()[0][4]; for (const [t0, d, p, l, f] of SHOTS()) { const k = eio(P(t, t0, d)); if (k <= 0) break; cp.lerp(p, k); cl.lerp(l, k); fov = lerp(fov, f, k); }
  const hh = (a, b) => Math.sin(t * a) * .5 + Math.sin(t * b + 1.3) * .5; cp.add(V(hh(1.3, 2.9) * .025, hh(1.7, 3.3) * .02, 0)); cl.add(V(hh(1.1, 2.3) * .03, hh(1.9, 2.7) * .025, 0));
  camera.fov = fov; camera.updateProjectionMatrix(); camera.position.copy(cp); camera.lookAt(cl); camera.rotateZ(hh(.9, 2.1) * .02);
  drawHud(t); post.material.uniforms.time.value = t; post.material.uniforms.wob.value = (t > ring && t < ring + .4) || (t > st('L3b') - .3 && t < st('L3b')) ? 1 : .15;
  renderer.setRenderTarget(rt); renderer.setClearColor('#04060a'); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); return true; };
window.setTL = tl => { NB.TL = tl; return true; };
document.fonts.load('bold 15px "Courier New"').then(() => { window.ready = true; });
})();
