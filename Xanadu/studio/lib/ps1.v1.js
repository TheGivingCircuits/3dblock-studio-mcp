// PS1 low-poly found-footage engine (Guess The Horror's "PS1 cut"). Load after three.min.js and /notebook/lib.js; an episode's
// scene.js calls PS1.episode({...}). A real 3D world rendered at 360x640 and blown up into chunky pixels: PS1 vertex wobble,
// affine (warping) textures, per-vertex lighting from 3 point lights, fog, 15-bit colour with ordered dithering, chroma bleed,
// scanlines, tape wobble, chunky subtitles — plus, with ep.camcorder: true, a found-footage overlay (REC, timestamp, viewfinder).
// Without it (the default) the camera drifts gently instead of shaking and the end cut back to the case is a quick dip to black.
// Loop contract (same as the woodcut engine): t=0 and t=END are the same frame — the movie case lying closed on a table, seen from
// above. It swings open on the first line while the camcorder starts recording and cranes up into the scene; after the last line a
// tracking glitch cuts back to the case, which snaps shut. Everything is a pure function of t (window.seek).
(function () {
const PS = window.PS1 = {}; PS.props = {};   // PS.props: the shared low-poly prop library (lib/ps1-props/*.js)
const { P, lerp, eio, eo, clamp, rng, st, en, back } = NB;
const W = 1080, H = 1920, LW = 360, LH = 640;
const MISSING = window.MISSING = new Set(), norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '');
// at() that remembers words it couldn't find (render.mjs prints them) — a typo would otherwise silently fire at the line start
const at = (id, word, nth = 0) => { const l = NB.TL && NB.TL.lines[id]; if (!l) MISSING.add(id); else if (!l.words.some(w => norm(w.w).startsWith(norm(word)))) MISSING.add(`${id}:${word}`); return NB.at(id, word, nth); };
const T = ([l, w, off = 0]) => (w === '$end' ? en(l) : w ? at(l, w) : st(l)) + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
Object.assign(PS, { P, lerp, eio, eo, clamp, rng, st, en, back, at, T, V, W, H, LW, LH });

// ---------- renderer + the PS1 material ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); (document.body || document.documentElement).appendChild(renderer.domElement);
const rt = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(LW, LH, THREE.UnsignedIntType) });   // 24-bit depth: 16-bit z-fights (flickers) anything close together
const scene = PS.scene = new THREE.Scene(), camera = PS.camera = new THREE.PerspectiveCamera(58, LW / LH, .06, 120);
const VS = `uniform vec2 snap; uniform vec3 l1Pos, l1Col, l2Pos, l2Col, l3Pos, l3Col, amb; uniform float l1Rng, l2Rng, l3Rng, fogNear, fogFar, unlit;
varying vec2 vUvW; varying float vW; varying vec3 vLight; varying float vFog;
vec3 pl(vec3 p, vec3 c, float r, vec3 wp, vec3 n) { vec3 d = p - wp; float a = max(0.0, 1.0 - length(d) / r); return c * max(dot(n, normalize(d)), 0.0) * a; }
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vec3 n = normalize(mat3(modelMatrix) * normal);
  vLight = mix(amb + pl(l1Pos, l1Col, l1Rng, wp.xyz, n) + pl(l2Pos, l2Col, l2Rng, wp.xyz, n) + pl(l3Pos, l3Col, l3Rng, wp.xyz, n), vec3(1.0), unlit);
  vec4 mv = viewMatrix * wp; vec4 p = projectionMatrix * mv; vec2 s = p.xy / p.w; s = floor(s * snap + 0.5) / snap; p.xy = s * p.w;
  gl_Position = p; vUvW = uv * p.w; vW = p.w; vFog = clamp((-mv.z - fogNear) / (fogFar - fogNear), 0.0, 1.0) * (1.0 - unlit * 0.0); }`;
const FS = `uniform sampler2D map; uniform vec2 uvOff; uniform vec3 tint, fogColor; uniform float noFog; varying vec2 vUvW; varying float vW; varying vec3 vLight; varying float vFog;
void main() { vec4 c = texture2D(map, vUvW / vW + uvOff); if (c.a < 0.5) discard; vec3 col = c.rgb * tint * vLight; gl_FragColor = vec4(mix(col, fogColor, vFog * (1.0 - noFog)), 1.0); }`;
const U = PS.U = { snap: { value: new THREE.Vector2(LW, LH) }, amb: { value: new THREE.Color(.16, .16, .2) }, fogColor: { value: new THREE.Color('#04060a') }, fogNear: { value: 2.4 }, fogFar: { value: 9 } };
for (const k of [1, 2, 3]) Object.assign(U, { [`l${k}Pos`]: { value: V(0, -50, 0) }, [`l${k}Col`]: { value: new THREE.Color(0, 0, 0) }, [`l${k}Rng`]: { value: 5 } });
// a light slot: PS.light(1, [x,y,z], [r,g,b], range)
PS.light = (k, p, c, r = 5) => { U[`l${k}Pos`].value.set(...p); U[`l${k}Col`].value.setRGB(...c); U[`l${k}Rng`].value = r; };
PS.mat = (map, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, map: { value: map }, uvOff: { value: new THREE.Vector2() }, tint: { value: new THREE.Color(o.tint || '#ffffff') }, unlit: { value: o.unlit ? 1 : 0 }, noFog: { value: o.noFog ? 1 : 0 } }, vertexShader: VS, fragmentShader: FS, side: o.side || THREE.FrontSide });
PS.tex = (w, h, draw, seed) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); q.imageSmoothingEnabled = false; draw(q, w, h, rng(seed ?? (w * 7 + h))); const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.canvas = c; return t; };
// big tiled surfaces (roads, fields, floors): mipmapped so distant texels don't shimmer and crawl as the camera moves
PS.mip = t => { t.generateMipmaps = true; t.minFilter = THREE.NearestMipmapLinearFilter; t.needsUpdate = true; return t; };
// a subdivided plane: one giant polygon warps its texture badly under the PS1 affine mapping
PS.plane = (w, h, rx = 1, ry = 1, seg = 1) => PS.rep(new THREE.PlaneGeometry(w, h, Math.max(1, Math.round(w / seg)), Math.max(1, Math.round(h / seg))), rx, ry);
PS.color = col => PS.tex(4, 4, q => { q.fillStyle = col; q.fillRect(0, 0, 4, 4); });
PS.noise = (q, w, h, r, col, n, a = .35) => { for (let i = 0; i < n; i++) { q.fillStyle = col; q.globalAlpha = a * r(); q.fillRect(r() * w | 0, r() * h | 0, 1, 1); } q.globalAlpha = 1; };
PS.rep = (geo, rx, ry) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry); return geo; };
PS.add = (geo, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
PS.box = (w, h, d) => new THREE.BoxGeometry(w, h, d); PS.cyl = (r1, r2, h, n = 8, open = false) => new THREE.CylinderGeometry(r1, r2, h, n, 1, open);
PS.group = (x = 0, y = 0, z = 0, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

// ---------- low-poly people: boxes, a face texture, two-segment arms posed by points ----------
PS.limb = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, .5); m.scale.y = Math.max(.01, d.length()); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
PS.person = (o) => { const G = PS.group(), M = PS.mat; const skin = M(o.skin), top = M(o.top), legs = M(o.legs), hair = M(o.hair);
  const P0 = { G, faceMats: [] };
  if (o.dress) { P0.dress = PS.add(PS.cyl(.14, .3, 1.15, 6), top, 0, .62, 0, G); } else { const leg = () => ({ up: PS.add(PS.box(.14, 1, .14), legs, 0, 0, 0, G), fore: PS.add(PS.box(.125, 1, .125), legs, 0, 0, 0, G), foot: PS.add(PS.box(.13, .08, .22), M(PS.color(o.shoes || '#2a2420')), 0, 0, 0, G) }); P0.legL = leg(); P0.legR = leg(); }
  P0.torso = PS.add(PS.box(.4, .64, .25), top, 0, 1.08, 0, G); PS.add(PS.box(.08, .08, .08), skin, 0, 1.42, 0, G);
  const face = M(o.face); P0.faceMat = face; P0.head = PS.add(PS.box(.2, .24, .22), [skin, skin, hair, skin, face, hair], 0, 1.56, 0, G);
  if (o.long) { PS.add(PS.box(.26, o.long, .1), hair, 0, 1.68 - o.long / 2 + .02, -.11, G); for (const s of [-1, 1]) PS.add(PS.box(.04, o.long * .85, .2), hair, s * .12, 1.68 - o.long * .42, -.02, G); }
  if (o.veil) P0.veil = PS.add(PS.box(.22, o.veil, .03), hair, 0, 1.66 - o.veil / 2, .125, G);   // hair hanging over the face
  PS.add(PS.box(.24, .07, .25), hair, 0, 1.69, -.005, G); if (!o.long) PS.add(PS.box(.22, .14, .06), hair, 0, 1.62, -.1, G);
  const arm = () => ({ up: PS.add(PS.box(.1, 1, .11), top, 0, 0, 0, G), fore: PS.add(PS.box(.09, 1, .1), o.bareArms ? skin : top, 0, 0, 0, G), hand: PS.add(PS.box(.08, .1, .08), skin, 0, 0, 0, G) });
  P0.armL = arm(); P0.armR = arm(); P0.held = null;
  P0.pose = (L, R) => { for (const [A, p] of [[P0.armL, L], [P0.armR, R]]) { PS.limb(A.up, p[0], p[1]); PS.limb(A.fore, p[1], p[2]); A.hand.position.copy(p[2]); } };
  // legs posed by points too (hip → knee → ankle), so people can sit, kneel or step
  P0.legs = (L, R) => { if (!P0.legL) return; for (const [A, p] of [[P0.legL, L], [P0.legR, R]]) { PS.limb(A.up, p[0], p[1]); PS.limb(A.fore, p[1], p[2]); A.foot.position.copy(p[2]).add(V(0, -.0, .06)); } };
  P0.pose([V(-.24, 1.36, 0), V(-.27, 1.07, 0), V(-.28, .79, .02)], [V(.24, 1.36, 0), V(.27, 1.07, 0), V(.28, .79, .02)]); P0.legs(...[-1, 1].map(s => PS.LEGS.stand(s))); return P0; };
PS.LEGS = { stand: s => [V(s * .09, .8, 0), V(s * .09, .42, .02), V(s * .09, .05, 0)], sit: s => [V(s * .1, .8, .02), V(s * .1, .78, .44), V(s * .1, .4, .5)] };
PS.ARMS = { down: s => [V(s * .24, 1.36, 0), V(s * .27, 1.07, 0), V(s * .28, .79, .02)], phone: () => [V(.24, 1.36, 0), V(.3, 1.13, .13), V(.15, 1.5, .07)],
  up: s => [V(s * .24, 1.36, 0), V(s * .34, 1.3, .18), V(s * .2, 1.56, .2)], reach: s => [V(s * .24, 1.36, 0), V(s * .22, 1.3, .3), V(s * .2, 1.24, .6)] };

// ---------- the movie case on a table (cover canvas → texture). Spine on the left; the lid swings over to lie open ----------
PS.dvdCase = (cover, disc, x, y, z, rotY = 0) => { const G = PS.group(x, y, z), cw = .135, cd = .19, th = .007, plastic = PS.mat(PS.color('#101114'), { unlit: true });
  G.rotation.y = rotY; PS.add(PS.box(cw, th, cd), plastic, 0, th / 2, 0, G);
  const dm = PS.mat(disc, { unlit: true }); const dk = PS.add(new THREE.CircleGeometry(.058, 20), dm, .006, th + .0012, .004, G); dk.rotation.x = -Math.PI / 2;
  const hinge = PS.group(-cw / 2, th, 0, G), cov = PS.tex(8, 8, () => {}); cov.image = cover; cov.needsUpdate = true;
  const lid = PS.add(PS.box(cw, th, cd), [plastic, plastic, PS.mat(cov, { unlit: true }), PS.mat(PS.color('#17181c'), { unlit: true }), plastic, plastic], cw / 2, th / 2, 0, hinge);
  return { G, hinge, open(k) { hinge.rotation.z = Math.PI * .97 * k; } }; };

// ---------- post: 15-bit colour + 4x4 Bayer dither, chroma bleed, scanlines, grain, tape wobble, fades, then the HUD ----------
const hud = document.createElement('canvas'); hud.width = LW; hud.height = LH; const hq = PS.hq = hud.getContext('2d'); const hudT = new THREE.CanvasTexture(hud); hudT.magFilter = hudT.minFilter = THREE.NearestFilter; hudT.generateMipmaps = false;
const bayer = new THREE.DataTexture(new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].flatMap(v => [v * 16, 0, 0, 255])), 4, 4); bayer.magFilter = bayer.minFilter = THREE.NearestFilter; bayer.wrapS = bayer.wrapT = THREE.RepeatWrapping; bayer.needsUpdate = true;
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { scn: { value: rt.texture }, hud: { value: hudT }, bay: { value: bayer }, res: { value: new THREE.Vector2(LW, LH) }, time: { value: 0 }, wob: { value: 0 }, fade: { value: 1 }, flash: { value: 0 }, gamma: { value: .72 }, still: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D scn, hud, bay; uniform vec2 res; uniform float time, wob, fade, flash, gamma, still; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() { vec2 px = floor(vUv * res); float sh = wob * (hash(vec2(floor(px.y / 6.0), floor(time * 12.0))) - 0.5) * 7.0 + sin(px.y * 0.21 + time * 3.0) * 0.35 * (1.0 - still);
      vec2 uv = (px + vec2(0.5 + sh, 0.5)) / res, o = vec2((1.0 + wob * 2.0) / res.x, 0.0);
      vec3 c = vec3(texture2D(scn, uv + o).r, texture2D(scn, uv).g, texture2D(scn, uv - o).b);
      c = pow(c, vec3(gamma)) * fade + flash; float b = texture2D(bay, px / 4.0).r - 0.5; c = floor(c * 31.0 + b + 0.5) / 31.0;
      c *= mod(px.y, 2.0) < 1.0 ? 1.0 : 0.85; c += (hash(px + floor(time * 30.0) * (1.0 - still)) - 0.5) * (0.03 + wob * 0.12);   // still = the case shots: frozen grain, so the loop's first and last frames match
      vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 1.1;
      vec4 h = texture2D(hud, (px + 0.5) / res); gl_FragColor = vec4(mix(c, h.rgb, h.a), 1.0); }` }));
const postScene = new THREE.Scene(); postScene.add(post); const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- HUD: camcorder overlay + VHS subtitles (word-chunked, current word in yellow) ----------
let CHUNKS = null;
function buildChunks() { CHUNKS = []; for (const [id, l] of Object.entries(NB.TL.lines)) { let cur = []; const ws = l.words.filter(w => !/^\[/.test(w.w)); ws.forEach((w, i) => { cur.push({ ...w, s: l.start + w.s, e: l.start + w.e }); if (/[.,!?…]$/.test(w.w) || cur.length >= 3 || i === ws.length - 1) { cur.id = id; CHUNKS.push(cur); cur = []; } }); }
  CHUNKS.forEach((c, i) => { c.t0 = c[0].s - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].s - .05, c.at(-1).e + .55) : c.at(-1).e + .5; }); }
function drawHud(t, S) { hq.clearRect(0, 0, LW, LH); hq.imageSmoothingEnabled = false; const ep = S.ep, rec = S.rec;
  if (rec > 0 && ep.camcorder) { hq.globalAlpha = rec; const mono = s => `bold ${s}px "Courier New", monospace`; hq.strokeStyle = 'rgba(255,255,255,.9)'; hq.lineWidth = 2;
    for (const [x, y, sx, sy] of [[12, 12, 1, 1], [LW - 12, 12, -1, 1], [12, LH - 12, 1, -1], [LW - 12, LH - 12, -1, -1]]) { hq.beginPath(); hq.moveTo(x, y + sy * 22); hq.lineTo(x, y); hq.lineTo(x + sx * 22, y); hq.stroke(); }
    if (Math.floor(t * 1.6) % 2 === 0) { hq.fillStyle = '#ff2a22'; hq.beginPath(); hq.arc(30, 36, 6, 0, 6.283); hq.fill(); } hq.fillStyle = '#fff'; hq.font = mono(18); hq.textBaseline = 'middle'; hq.fillText('REC', 42, 37);
    hq.font = mono(14); hq.fillText('SP', LW - 76, 37); hq.strokeStyle = '#fff'; hq.lineWidth = 1.5; hq.strokeRect(LW - 50, 31, 24, 12); hq.fillRect(LW - 26, 34, 3, 6); for (let k = 0; k < 3; k++) hq.fillRect(LW - 47 + k * 7, 33, 5, 8);
    const [d, tm] = ep.stamp ? ep.stamp(t, S) : ['OCT.16 2002', '11:58 PM']; hq.font = mono(16); hq.fillText(d, 20, LH - 132); hq.textAlign = 'right'; hq.fillText(tm, LW - 20, LH - 132); hq.textAlign = 'left'; hq.globalAlpha = 1; }
  if (ep.hud) ep.hud(t, S, hq);
  if (!CHUNKS) buildChunks(); const c = CHUNKS.find(c => t >= c.t0 && t < c.t1); if (c) { const a = Math.min(1, (t - c.t0) / .08, (c.t1 - t) / .1); hq.globalAlpha = clamp(a); hq.font = 'bold 26px Arial, Helvetica, sans-serif'; hq.textBaseline = 'middle'; hq.lineJoin = 'round';
    const ws = c.map(w => w.w), wd = ws.map(w => hq.measureText(w).width), gap = 8, tw = wd.reduce((a, b) => a + b, 0) + gap * (ws.length - 1); let x = LW / 2 - tw / 2; const y = ep.capY || 470, col = (ep.capColor || {})[c.id];
    ws.forEach((w, i) => { const now = t >= c[i].s && t < (c[i + 1] ? c[i + 1].s : c.t1); hq.lineWidth = 6; hq.strokeStyle = '#000'; hq.strokeText(w, x, y); hq.fillStyle = now ? '#ffd23a' : (col || '#fff'); hq.fillText(w, x, y); x += wd[i] + gap; }); hq.globalAlpha = 1; }
  hudT.needsUpdate = true; }

// ---------- the timeline ----------
PS.episode = function (ep) {
  const S = PS.S = { ep, V, scene, camera, U, hits: [] }; let SHOTS = null;
  function prepare() { const ids = Object.keys(NB.TL.lines), last = ids[ids.length - 1]; S.END = NB.TL.end; S.last = last; S.open = T(ep.open || ['L1', 'this', .1]);
    S.closeUp = en(last) - .05; S.lidOpen = S.open - .75; S.cutBack = S.closeUp + .3; S.lidShut = S.closeUp + 1.3; ep.prepare && ep.prepare(S); SHOTS = ep.shots(S); }
  window.seek = t => { S.t = t; if (!SHOTS) prepare();
    // where the episode's camera is (shot list + handheld drift) …
    let cp = SHOTS[0][2].clone(), cl = SHOTS[0][3].clone(), fov = SHOTS[0][4] ?? 58; for (const [t0, d, p, l, f] of SHOTS) { const k = eio(P(t, t0, d)); if (k <= 0) break; cp.lerp(p, k); cl.lerp(l, k); fov = lerp(fov, f ?? fov, k); }
    const hh = (a, b) => Math.sin(t * a) * .5 + Math.sin(t * b + 1.3) * .5, shake = (ep.shake ? ep.shake(t, S) : 0) + S.hits.reduce((s, h) => s + (t > h && t < h + .45 ? Math.exp(-(t - h) * 10) * (ep.camcorder ? .06 : .02) : 0), 0);
    const hk = ep.camcorder ? 1 : .35; cp.add(V(hh(1.3, 2.9) * .022 * hk + Math.sin(t * 47) * shake, hh(1.7, 3.3) * .018 * hk + Math.cos(t * 39) * shake, 0)); cl.add(V(hh(1.1, 2.3) * .028 * hk, hh(1.9, 2.7) * .022 * hk, 0));
    // … blended with the overhead shot of the case: up from it after the lid opens; a hard cut back to it at the end
    const cs = S.caseCam || [cp.clone(), cl.clone(), fov], w = S.caseCam ? clamp(1 - eio(P(t, S.open - .45, 1.1)) + (t >= S.cutBack ? 1 : 0)) : 0; S.rec = clamp(1 - w * 1.6);
    camera.fov = lerp(fov, cs[2], w); camera.updateProjectionMatrix(); camera.position.copy(cp.lerp(cs[0], w)); camera.up.set(0, 1 - w, -w).normalize(); camera.lookAt(cl.lerp(cs[1], w)); camera.rotateZ(hh(.9, 2.1) * .015 * (1 - w)); camera.updateMatrixWorld(true);
    S.case && S.case.open(eio(P(t, S.lidOpen, .6)) * (1 - Math.pow(P(t, S.lidShut, .45), 2)));
    ep.update(t, S); scene.updateMatrixWorld(true);
    const PU = post.material.uniforms; PU.time.value = t; PU.still.value = w >= 1 ? 1 : 0; PU.wob.value = Math.max(ep.wob ? ep.wob(t, S) : 0, ep.camcorder && t > S.cutBack - .3 && t < S.cutBack + .05 ? 1 : 0, ep.camcorder && S.hits.some(h => t > h && t < h + .2) ? .6 : 0) * (t < S.cutBack + .05 ? 1 : 0);
    PU.fade.value = (ep.fade ? ep.fade(t, S) : 1) * (ep.camcorder ? 1 : clamp(Math.abs(t - S.cutBack) / .22));   // no camcorder: dip to black for the cut back to the case PU.flash.value = ep.flash ? ep.flash(t, S) : 0;
    drawHud(t, S); renderer.setRenderTarget(rt); renderer.setClearColor(U.fogColor.value); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); return true; };
  window.setTL = tl => { NB.TL = tl; CHUNKS = null; SHOTS = null; return true; };
  Promise.all(['bold 18px "Courier New"', 'bold 26px Arial'].concat(ep.fonts || []).map(f => document.fonts.load(f))).then(() => { ep.build(S); window.ready = true; });
};
})();
