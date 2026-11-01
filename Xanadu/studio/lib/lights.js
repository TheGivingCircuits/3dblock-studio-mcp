// The lighting engine (Phase 2 of the production suite). Load after ps1.js; exposes window.LIGHTS. Old episodes never load it.
// It replaces ps1.js's 3 point lights + flat ambient with: up to 8 lights per frame (the 8 strongest at the shot's subject), a sun
// worked out from time, date and place, a sky and a ground-bounce colour, film fixtures, practicals with flicker profiles, setups
// placed on the blocking, a low-res shadow map for the sun or the key, contact-shadow blobs, haze with beams and dust.
// Shading stays per-vertex and chunky (the PS1 look); only the shadow lookup is per-pixel, from a 256 px map, so shadows are blocky.
// THE STOP SCALE (defined once, here): a light's `stops` is its level AT ITS TARGET (aim / anchor) relative to the scene reference,
// 0 = the key. A grey card lit by a 0-stop light alone reads as the texture's own colour in the raw plate; +1 is twice that.
// LIGHTS.keyStops(scene) is what the camera's `exposure` is relative to. Plates are written in this linear scale.
(function () {
const PS = window.PS1, { clamp, lerp, rng } = PS, V = (x, y, z) => new THREE.Vector3(x, y, z);
const L = window.LIGHTS = {}, MAX = 8;

// ---------- colour temperature ----------
// Tanner Helland's blackbody fit, normalised so 5600 K (daylight film balance) is white
const kraw = k => { k /= 100; const r = k <= 66 ? 255 : 329.7 * Math.pow(k - 60, -.1332), g = k <= 66 ? 99.47 * Math.log(k) - 161.1 : 288.1 * Math.pow(k - 60, -.0755), b = k >= 66 ? 255 : k <= 19 ? 0 : 138.5 * Math.log(k - 10) - 305;
  return [r, g, b].map(v => clamp(v, 0, 255) / 255); };
const K0 = kraw(5600);
L.kelvin = k => { const c = kraw(k); return c.map((v, i) => v / K0[i]); };
const GELS = { none: [1, 1, 1], cto: [1, .78, .55], ctb: [.7, .85, 1.2], green: [.6, 1.1, .6], magenta: [1.15, .55, 1.05], red: [1.3, .2, .15], blue: [.25, .45, 1.4], amber: [1.2, .8, .3], cyan: [.4, 1.05, 1.15] };

// ---------- the material: per-vertex lights, sun with a shadow map, sky/ground ambient, haze; pass 1 writes depth + motion ----------
const LU = L.U = { snap: PS.U.snap, lPos: { value: Array.from({ length: MAX }, () => V(0, -99, 0)) }, lCol: { value: Array.from({ length: MAX }, () => V(0, 0, 0)) },
  lAim: { value: Array.from({ length: MAX }, () => V(0, -1, 0)) }, lPar: { value: Array.from({ length: MAX }, () => new THREE.Vector4(.01, -2, -2, 0)) },
  sunDir: { value: V(0, 1, 0) }, sunCol: { value: V(0, 0, 0) }, skyCol: { value: V(.1, .1, .12) }, gndCol: { value: V(.05, .05, .05) },
  fogCol: { value: V(0, 0, 0) }, fogDen: { value: 0 }, keyIdx: { value: -1 }, shadowOn: { value: 0 }, shadowSoft: { value: 0 }, shadowVP: { value: new THREE.Matrix4() }, shadowMap: { value: null },
  pass: { value: 0 }, prevVP: { value: new THREE.Matrix4() }, plateRes: { value: new THREE.Vector2(540, 960) }, time: { value: 0 } };
const VS = `uniform vec2 snap, plateRes; uniform vec3 lPos[${MAX}], lCol[${MAX}], lAim[${MAX}]; uniform vec4 lPar[${MAX}]; uniform vec3 sunDir, sunCol, skyCol, gndCol;
uniform float unlit, fogDen, wind; uniform int keyIdx, pass; uniform mat4 shadowVP, prevVP, prevModel; uniform float time;
varying vec2 vUvW; varying float vW; varying vec3 vLight, vKey, vCol, vVD; varying float vFog; varying vec4 vSh;
void main() { vec3 pos = position; if (wind > 0.0) pos.x += sin(time * 2.3 + modelMatrix[3].x * 1.7 + position.y * 3.0) * wind * max(position.y, 0.0);
  vec4 wp = modelMatrix * vec4(pos, 1.0); vec3 n = normalize(mat3(modelMatrix) * normal);
  vec3 acc = skyCol * (0.5 + 0.5 * n.y) + gndCol * (0.5 - 0.5 * n.y), key = vec3(0.0); vec3 sun = sunCol * max(dot(n, sunDir), 0.0); if (keyIdx < 0) key += sun; else acc += sun;
  for (int i = 0; i < ${MAX}; i++) { vec3 d = lPos[i] - wp.xyz; float dd = max(dot(d, d), 1e-4); vec3 l = d * inversesqrt(dd); float w = lPar[i].w;
    float lam = max((dot(n, l) + w) / (1.0 + w), 0.0), att = 1.0 / (dd + lPar[i].x), sp = lPar[i].y < -1.5 ? 1.0 : smoothstep(lPar[i].y, lPar[i].z, dot(-l, lAim[i]));
    vec3 c = lCol[i] * lam * att * sp; if (i == keyIdx) key += c; else acc += c; }
  vLight = acc; vKey = key; if (unlit > 0.5) { vLight = vec3(1.0); vKey = vec3(0.0); }
#ifdef USE_COLOR
  vCol = color;
#else
  vCol = vec3(1.0);
#endif
  vec4 mv = viewMatrix * wp; vec4 p = projectionMatrix * mv; vec4 pc = p; vec2 s = p.xy / p.w; s = floor(s * snap + 0.5) / snap; p.xy = s * p.w;
  vec4 pp = prevVP * prevModel * vec4(pos, 1.0); vVD = vec3((pc.xy / pc.w - pp.xy / pp.w) * 0.5 * plateRes, -mv.z);
  gl_Position = p; vUvW = uv * p.w; vW = p.w; vFog = 1.0 - exp(-fogDen * length(mv.xyz)); vSh = shadowVP * wp; }`;
const FS = `uniform sampler2D map, shadowMap; uniform vec2 uvOff; uniform vec3 tint, fogCol; uniform float noFog, glow, shadowOn, shadowSoft, recv; uniform int pass;
varying vec2 vUvW; varying float vW; varying vec3 vLight, vKey, vCol, vVD; varying float vFog; varying vec4 vSh;
float shad(vec2 uv, float z) { return texture2D(shadowMap, uv).r < z - 0.0012 ? 0.0 : 1.0; }
void main() { vec4 c = texture2D(map, vUvW / vW + uvOff); if (c.a < 0.5) discard;
  if (pass == 1) { gl_FragColor = vec4(vVD.z, vVD.x, vVD.y, 1.0); return; }
  float sh = 1.0; if (shadowOn > 0.5 && recv > 0.5) { vec3 q = vSh.xyz / vSh.w * 0.5 + 0.5;
    if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0 && q.z < 1.0) { float o = (1.0 + shadowSoft * 1.5) / 1024.0; sh = 0.0; for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) sh += shad(q.xy + vec2(float(i), float(j)) * o, q.z); sh /= 9.0; } }
  vec3 light = max(vLight + vKey * sh, 0.0), col = c.rgb * tint * vCol * light * exp2(glow);
  gl_FragColor = vec4(mix(col, fogCol, vFog * (1.0 - noFog)), 1.0); }`;
L.mat = (map, o = {}) => { const m = new THREE.ShaderMaterial({ uniforms: { ...LU, map: { value: map }, uvOff: { value: new THREE.Vector2() }, tint: { value: new THREE.Color(o.tint || '#ffffff') },
    unlit: { value: o.unlit ? 1 : 0 }, noFog: { value: o.noFog ? 1 : 0 }, glow: { value: o.glow || 0 }, recv: { value: o.noShadow ? 0 : 1 }, wind: { value: o.wind || 0 }, prevModel: { value: new THREE.Matrix4() } },
  vertexShader: VS, fragmentShader: FS, side: o.side || THREE.FrontSide, vertexColors: !!o.vcol }); m.userData.lit = true; return m; };
// scenes built for the cinema camera call LIGHTS.use() first, so PS1.person / PS1.add helpers build with the new material
L.use = () => { PS.mat = L.mat; return L; };

// ---------- the sun: position from time, date and place (NOAA approximation), kelvin and strength from elevation ----------
L.PLACES = { texas: { lat: 30.27, lon: -97.74, tz: -5 }, seattle: { lat: 47.6, lon: -122.33, tz: -7 }, maine: { lat: 44.3, lon: -69.8, tz: -4 }, maryland: { lat: 39.6, lon: -77.4, tz: -4 }, illinois: { lat: 41.9, lon: -88.3, tz: -5 }, london: { lat: 51.5, lon: -.12, tz: 1 }, california: { lat: 37.95, lon: -122.55, tz: -7 } };
const hm = s => typeof s === 'number' ? s : (([h, m]) => +h + (+m || 0) / 60)(String(s).split(':'));
L.solar = (time, date = '2026-06-21', place = 'texas') => { const P0 = typeof place === 'string' ? L.PLACES[place] : place, d = new Date(date + 'T00:00:00Z');
  const doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5), g = 2 * Math.PI / 365 * (doy - 1 + (hm(time) - 12) / 24);
  const eot = 229.18 * (7.5e-5 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g));
  const decl = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
  const tst = hm(time) * 60 + eot + 4 * P0.lon - 60 * P0.tz, ha = (tst / 4 - 180) * Math.PI / 180, lat = P0.lat * Math.PI / 180;
  const cz = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha), zen = Math.acos(clamp(cz, -1, 1)), el = 90 - zen * 180 / Math.PI;
  let az = Math.acos(clamp((Math.sin(lat) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(lat) * Math.sin(zen)), -1, 1)) * 180 / Math.PI; az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { azimuth: az, elevation: el }; };
// world axes: -z is north, +x is east, +y up. Azimuth is clockwise from north
const dirOf = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return V(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };
const ramp = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, a] = pts[i - 1], [x1, b] = pts[i], k = (x - x0) / (x1 - x0); return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k); } return pts.at(-1)[1]; };
const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
// sky colours by sun elevation: [zenith, horizon] in display terms, and the skylight level in stops
const SKY = [[-18, ['#03050c', '#070a16']], [-12, ['#060a1c', '#0e1430']], [-6, ['#13204a', '#3a3462']], [-2, ['#24366e', '#b0605a']], [2, ['#3a5a98', '#f0a066']], [8, ['#4a72b4', '#f2c48a']], [20, ['#4f7fc6', '#b8cde4']], [60, ['#3d6fc0', '#a8c4e6']]].map(([e, c]) => [e, c.map(hex).flat()]);
const WEATHER = { clear: { sun: 0, sky: 0, haze: .004, grey: 0 }, haze: { sun: -.6, sky: .3, haze: .02, grey: .35 }, overcast: { sun: -4, sky: .6, haze: .015, grey: .85 }, storm: { sun: -6, sky: -1.6, haze: .03, grey: .9 },
  fog: { sun: -3, sky: .2, haze: .12, grey: .9 }, night: { sun: -99, sky: 0, haze: .01, grey: 0 }, moon: { sun: -99, sky: 0, haze: .008, grey: 0, moon: true } };

// ---------- scene state ----------
let SKYCFG = null, ATM = { haze: null, color: null, dust: 0 }; const LIST = [], FX = [], FADES = { t: null, w: null };
L.reset = () => { SKYCFG = null; ATM = { haze: null, color: null, dust: 0 }; LIST.length = 0; };
const fnv = (v, t) => typeof v === 'function' ? v(t) : v;
// LIGHTS.sky({ time, date, place, weather, sun: { freeze, azimuth, elevation, kelvin, stops }, skylight, interior }) — any value may be a function of t
L.sky = cfg => { SKYCFG = { date: '2026-06-21', place: 'texas', weather: 'clear', time: '12:00', ...cfg }; return L; };
// the sun moving across a scene: time eases from one clock time to another between t0 and t0 + dur (returns a function of t)
L.sun = { ease: (from, to, t0, dur, ease = x => x) => t => { const a = hm(from), b = hm(to), k = ease(clamp((t - t0) / dur)); return a + (b - a) * k; } };
L.atmosphere = o => { Object.assign(ATM, o); return L; };

// ---------- fixtures and practicals ----------
const FIXTURES = { fresnel: { kelvin: 3200, soft: .05, wrap: 0, beam: 40 }, softbox: { kelvin: 5600, soft: 1, wrap: .5, beam: 150 }, panel: { kelvin: 5600, soft: .4, wrap: .3, beam: 120 },
  'hmi-window': { kelvin: 5600, soft: .6, wrap: .25, beam: 75 }, bounce: { kelvin: 5600, soft: 1.5, wrap: .7 }, 'neg-fill': { kelvin: 5600, soft: 1, wrap: .5, neg: true },
  'table-lamp': { kelvin: 2700, soft: .15, wrap: .1, glowAt: 3 }, 'ceiling-lamp': { kelvin: 3000, soft: .2, wrap: .1, glowAt: 3 }, tube: { kelvin: 4000, soft: .3, wrap: .2, gel: 'green', glowAt: 2.5 },
  bulb: { kelvin: 2700, soft: .05, glowAt: 4 }, tv: { kelvin: 9000, soft: .2, wrap: .1, flicker: 'crt', beam: 150 }, candle: { kelvin: 1900, soft: .05, flicker: 'candle', glowAt: 3 }, fire: { kelvin: 1800, soft: .3, wrap: .2, flicker: 'fire', glowAt: 3 },
  flashlight: { kelvin: 4300, soft: .02, beam: 24, glowAt: 4 }, headlights: { kelvin: 4100, soft: .05, beam: 46, glowAt: 4.5 }, dash: { kelvin: 2400, soft: .05, gel: 'cyan', glowAt: 1.5 }, police: { kelvin: 6000, soft: .1, flicker: 'police', glowAt: 4 },
  neon: { kelvin: 5600, soft: .3, wrap: .2, gel: 'magenta', glowAt: 3 }, lightning: { kelvin: 8000, soft: 6, wrap: .4, flicker: 'lightning' }, lantern: { kelvin: 2000, soft: .08, wrap: .1, flicker: 'candle', glowAt: 3 } };
const h1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const n1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(h1(i), h1(i + 1), u); };   // smooth value noise
// flicker profiles: multipliers on a light's level, pure functions of t (cue them with `on` / `strikes` / `t0`, never random)
L.FLICKER = { none: () => 1, 'old-bulb': t => h1(Math.floor(t * 7)) > .9 ? .35 + .3 * h1(Math.floor(t * 31)) : .96 + .04 * n1(t * 20), candle: t => .8 + .12 * n1(t * 7) + .08 * n1(t * 19),
  fire: t => .7 + .2 * n1(t * 5) + .1 * n1(t * 17), crt: t => .72 + .2 * n1(t * 4) + .08 * Math.sin(t * 377), swing: () => 1,
  'tube-start': (t, o) => { const u = t - (o.t0 ?? 0); return u < 0 ? 0 : u < 1.4 ? (h1(Math.floor(u * 9)) > .55 ? 1 : .04) : .97 + .03 * Math.sin(t * 754); },
  lightning: (t, o) => { let v = 0; for (const s of (o.strikes || [])) { const u = t - s; if (u >= 0 && u < .9) v = Math.max(v, (u < .06 ? 1 : u < .11 ? .25 : u < .2 ? .85 : Math.exp(-(u - .2) * 9) * .6)); } return v; },
  police: (t, o) => { const k = Math.floor(t * 6) % 4; return (o.phase ? k >= 2 : k < 2) ? (k % 2 ? 1 : .15) : 0; } };
let nextId = 0;
const fixture = (o, kind) => { const F = { ...(FIXTURES[o.fixture] || {}), ...o }; const l = { id: nextId++, kind, name: o.name || `${o.fixture}-${nextId}`, ...F, stops: F.stops ?? 0, kelvin: F.kelvin ?? 5600, soft: F.soft ?? .05, wrap: F.wrap ?? 0 };
  l.flick = L.FLICKER[o.flicker || F.flicker || 'none'] || L.FLICKER.none; LIST.push(l);
  if (o.seen && kind === 'practical' && !o.mesh) { const s = o.size || .06; l.mesh = PS.add(o.fixture === 'candle' || o.fixture === 'fire' ? new THREE.ConeGeometry(s * .5, s * 1.6, 5) : PS.box(s, s * (o.fixture === 'tube' ? .25 : 1), s * (o.fixture === 'tube' ? 8 : 1)), L.mat(PS.color('#ffffff'), { unlit: true, noFog: true }), 0, -99, 0);
    l.mesh.userData.fx = 'glow'; }
  if (l.beam && o.haze !== false && kind !== 'setup') l.wantsBeam = true; return l; };
// LIGHTS.light({ name, fixture, kelvin, stops, at, aim, soft, gel, beam, shadow, on: [t0, t1] }): a film light. at/aim: [x,y,z], a function of t, or a mark name
L.light = o => fixture(o, 'fixture');
// LIGHTS.practical({ fixture, in, kelvin, stops, flicker, seen, mesh, swing: { len, amp, period }, strikes, on }): a light that is in the world
L.practical = o => fixture({ ...o, at: o.at || o.in }, 'practical');
// marks: named points the lights (and the camera, through CAM.mark) can be placed on; an object, a Vector3 or a function of t
const MARKS = L.marks = {};
L.mark = (name, v) => { MARKS[name] = v; return L; };
const where = (v, t) => { v = fnv(v, t); if (typeof v === 'string') { const m = MARKS[v] ?? (window.CAM && CAM.where(v, t)); return m && m.isVector3 ? m.clone() : m && m.isObject3D ? m.getWorldPosition(V(0, 0, 0)) : V(0, -99, 0); } if (Array.isArray(v)) return V(...v); if (v && v.isObject3D) return v.getWorldPosition(V(0, 0, 0)); return v ? v.clone() : null; };
// setups: saved lighting recipes placed relative to the named actor (or mark) so they move with the blocking. anchors: { subject, facing (deg), stops }
L.setup = (name, A = {}) => { const s = A.subject, f = (A.facing ?? 0) * Math.PI / 180, k = A.stops ?? 0, rel = (r, a, h) => t => { const p = where(s, t) || V(0, 0, 0); return p.add(V(Math.sin(f + a * Math.PI / 180) * r, h, Math.cos(f + a * Math.PI / 180) * r)); }, aim = t => (where(s, t) || V(0, 0, 0)).add(V(0, 1.5, 0));
  const R = { 'three-point': [['softbox', 2.2, 45, 1.9, 0, 5600], ['bounce', 2.5, -50, 1.5, -1.5, 5600], ['fresnel', 2.2, 160, 2.4, -.5, 5600]], rembrandt: [['fresnel', 2.0, 55, 2.3, 0, 3200], ['neg-fill', 1.4, -80, 1.5, -1, 5600], ['bounce', 2.6, -40, 1.3, -3, 3200]],
    window: [['hmi-window', 2.4, 80, 2.0, 0, 5600], ['bounce', 2.4, -70, 1.4, -2.2, 5600]], moonlight: [['fresnel', 6, 140, 6, -1.2, 9000, 'ctb'], ['bounce', 3, -30, 1.2, -4, 7000]],
    underlit: [['fresnel', .9, 10, .35, 0, 3000], ['neg-fill', 1.5, -90, 1.6, -1.5, 5600]], backlit: [['fresnel', 2.5, 175, 2.6, .8, 5600], ['bounce', 2.5, 20, 1.4, -3, 5600]],
    'car-night': [['dash', .6, 0, 1.1, -.5, 2400, 'cyan'], ['fresnel', 4, 110, 3, -2.5, 4000, 'amber'], ['bounce', 3, -60, 1.6, -4.5, 9000, 'ctb']], campfire: [['fire', 1.2, 20, .25, 0, 1800], ['bounce', 4, 200, 2, -4.5, 9000, 'ctb']] }[name];
  if (!R) { console.warn('LIGHTS.setup: no recipe', name); return []; }
  return R.map(([fx, r, a, h, st, kel, gel], i) => fixture({ name: `${name}.${i}`, fixture: fx, kelvin: kel, gel: gel || 'none', stops: k + st, at: rel(r, a, h), aim, setup: name, flicker: FIXTURES[fx].flicker, on: A.on, scene: A.scene }, 'setup')); };
// the light falling on a point with normal n (the shader's sum, on the CPU, without shadows): what auto-exposure meters
L.illum = (p, n) => { const st = L.state, A = st.amb; if (!A) return 1; const e = A.sky.map((v, i) => v * (.5 + .5 * n.y) + A.gnd[i] * (.5 - .5 * n.y) + A.sunCol[i] * Math.max(n.dot(A.sunDir), 0));
  for (const a of st.used || []) { const d = a.p.clone().sub(p), dd = Math.max(d.lengthSq(), 1e-4), l = d.normalize(), lam = Math.max((n.dot(l) + a.wrap) / (1 + a.wrap), 0), att = 1 / (dd + a.soft2 + .0001);
    const x = clamp((-l.dot(a.aimDir) - a.cosO) / Math.max(a.cosI - a.cosO, 1e-4)), sp = a.cosO < -1.5 ? 1 : x * x * (3 - 2 * x); for (let i = 0; i < 3; i++) e[i] += a.col[i] * lam * att * sp; }
  return Math.max(lum(e), 0); };
L.keyStops = (scene) => { const ks = LIST.filter(l => l.key && (!scene || !l.scene || l.scene === scene)); return ks.length ? ks[0].stops : 0; };

// ---------- shadows, blobs, beams, dust, the sky dome ----------
const SM = 1024, shadowRT = new THREE.WebGLRenderTarget(SM, SM, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SM, SM, THREE.UnsignedIntType) });
LU.shadowMap.value = shadowRT.depthTexture; const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }), sunCam = new THREE.OrthographicCamera(-8, 8, 8, -8, .5, 160), spotCam = new THREE.PerspectiveCamera(60, 1, .1, 60);
// a contact-shadow blob under feet and props (a tiny 8 px texture, so it stays chunky)
const blobTex = PS.tex(8, 8, (q) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = Math.hypot(x - 3.5, y - 3.5) / 4; q.fillStyle = `rgba(0,0,0,${clamp(1 - d) * .8})`; q.fillRect(x, y, 1, 1); } });
L.blob = (obj, r = .3, strength = .7) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: strength, depthWrite: false, color: '#000' }));
  m.rotation.x = -Math.PI / 2; m.userData.fx = 'blob'; m.userData.follow = obj; m.renderOrder = 1; PS.scene.add(m); FX.push(m); return m; };
const beamMesh = l => { const g = new THREE.CylinderGeometry(.02, 1, 1, 10, 1, true); g.translate(0, -.5, 0); g.rotateX(-Math.PI / 2); const cols = []; const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + p.getZ(i); cols.push(k, k, k); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.userData.fx = 'beam'; PS.scene.add(m); return m; };
// a sunbeam through a window: a prism from the window opening along the sun direction (seen in haze), plus dust motes inside it
L.godray = (o) => { const g = new THREE.BufferGeometry(), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(24), 3)); g.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
  m.userData.fx = 'godray'; m.userData.cfg = { len: 6, strength: 1, ...o }; m.frustumCulled = false; PS.scene.add(m); FX.push(m); return m; };
L.dust = (o) => { const n = o.n || 260, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), r = rng(o.seed || 7), base = []; for (let i = 0; i < n; i++) base.push([r(), r(), r(), r() * 6.283]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const P0 = new THREE.Points(g, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); P0.frustumCulled = false;
  P0.userData.fx = 'dust'; P0.userData.cfg = { min: V(...o.min), max: V(...o.max), base, strength: o.strength ?? 1 }; PS.scene.add(P0); FX.push(P0); return P0; };
let dome = null, sunDisc = null, moonDisc = null, stars = null;
L.dome = () => { if (dome) return dome; const g = new THREE.SphereGeometry(95, 16, 10); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
  dome = PS.add(g, L.mat(PS.color('#ffffff'), { unlit: true, noFog: true, vcol: true, side: THREE.BackSide, noShadow: true }), 0, 0, 0); dome.userData.sky = true;
  sunDisc = PS.add(new THREE.CircleGeometry(3.2, 10), L.mat(PS.color('#ffffff'), { unlit: true, noFog: true }), 0, -99, 0); sunDisc.userData.sky = true;
  moonDisc = PS.add(new THREE.CircleGeometry(2.2, 10), L.mat(PS.color('#dfe6f2'), { unlit: true, noFog: true }), 0, -99, 0); moonDisc.userData.sky = true;
  const sp = new Float32Array(600), r = rng(77); for (let i = 0; i < 200; i++) { const a = r() * 6.283, e = .15 + r() * 1.3; sp.set([Math.cos(a) * Math.cos(e) * 90, Math.sin(e) * 90, Math.sin(a) * Math.cos(e) * 90], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, color: '#ffffff', transparent: true, depthWrite: false })); stars.userData.fx = 'stars'; PS.scene.add(stars); return dome; };

// ---------- per frame ----------
const lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
L.state = {};
// LIGHTS.update(t, { subject: Vector3, camera, scene: id }) evaluates everything at t and writes the shader uniforms. Returns the state
L.update = (t, ctx = {}) => { const st = L.state = { t, lights: [] }; LU.time.value = t;
  // the sky: sun and moon direction, kelvin, stops; skylight and bounce colours; haze
  let sunDir = V(0, -1, 0), sunCol = [0, 0, 0], sky = [.004, .004, .008], gnd = [.002, .002, .002], zen = [0, 0, 0], hor = [0, 0, 0], el = -90, fogCol = [0, 0, 0], haze = fnv(ATM.haze, t) ?? 0;
  if (SKYCFG) { const C = SKYCFG, W0 = WEATHER[fnv(C.weather, t)] || WEATHER.clear, so = C.sun || {}, time = fnv(C.time, t);
    const pos = so.azimuth != null ? { azimuth: fnv(so.azimuth, t), elevation: fnv(so.elevation, t) } : L.solar(time, C.date, C.place); el = W0.sun < -50 ? -30 : pos.elevation; st.sun = { ...pos, time };
    sunDir = dirOf(pos.azimuth, pos.elevation); const air = 1 / Math.max(Math.sin(Math.max(el, .5) * Math.PI / 180), .02), sunStops = (so.stops != null ? fnv(so.stops, t) : -.12 * (air - 1)) + W0.sun;
    const kel = so.kelvin ? fnv(so.kelvin, t) : ramp(el, [[0, 2000], [3, 2700], [8, 3600], [20, 4800], [40, 5600]]), up = clamp(el / 2 + .5);   // the sun fades as it touches the horizon
    sunCol = L.kelvin(kel).map(v => v * Math.pow(2, sunStops) * up * (el > -1 ? 1 : 0)); st.sun.kelvin = kel; st.sun.stops = sunStops;
    const sc = ramp(el, SKY); zen = sc.slice(0, 3); hor = sc.slice(3, 6); const grey = W0.grey; if (grey) { const gl = lum(hor) * .9 + .05; zen = zen.map(v => lerp(v, gl * .8, grey)); hor = hor.map(v => lerp(v, gl, grey)); }
    const skyStops = (C.skylight != null ? fnv(C.skylight, t) : ramp(el, [[-16, -9], [-10, -5.6], [-4, -3.9], [2, -3.0], [12, -2.2], [40, -1.8]])) + W0.sky;
    const skyK = Math.pow(2, skyStops); sky = zen.map((v, i) => (v * .6 + hor[i] * .4) / Math.max(lum(zen) * .6 + lum(hor) * .4, .01) * skyK * .5);
    const g0 = lum(sunCol) * Math.max(sunDir.y, 0) * .25 + skyK * .15; gnd = (C.ground ? hex(C.ground) : [.45, .38, .3]).map(v => v * g0);
    if (W0.moon || C.moon) { const md = dirOf(((fnv(C.moonAz, t) ?? 140)), fnv(C.moonEl, t) ?? 35); if (el < -4) { sunDir = md; sunCol = L.kelvin(9500).map(v => v * Math.pow(2, -5.5)); st.moon = true; } }
    haze = fnv(ATM.haze, t) ?? W0.haze; const sk = Math.pow(2, ramp(el, [[-14, -9], [-6, -6], [0, -3], [10, -1], [30, -.5]]) + W0.sky * .5); fogCol = hor.map(v => v * sk * 1.2);
    const intr = fnv(C.interior, t); if (intr) { const k = Math.pow(2, intr === true ? -3 : intr); sky = sky.map(v => v * k); gnd = gnd.map(v => v * k); }
    // the dome: zenith → horizon gradient, a glow round the sun, darker below the horizon
    if (dome) { const p = dome.geometry.attributes.position, c = dome.geometry.attributes.color, sd = dirOf(pos.azimuth, pos.elevation), dk = Math.pow(2, ramp(el, [[-16, -6.5], [-10, -3.9], [-1, -2.2], [6, -1.1], [20, -.4], [50, 0]]) + W0.sky * .5);
      for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)).normalize(), h = clamp(v.y * 1.6), gl = Math.pow(Math.max(v.dot(sd), 0), 6) * clamp(1 - grey) * clamp(el / 6 + .8);
        const col = zen.map((z, j) => (lerp(hor[j], z, Math.sqrt(h)) * (v.y < 0 ? .45 : 1) + [1, .55, .25][j] * gl * clamp(1 - el / 30)) * dk); c.setXYZ(i, ...col); }
      c.needsUpdate = true; dome.position.copy(ctx.camera ? ctx.camera.position : V(0, 0, 0)); dome.position.y = 0;
      const sv = el > -2 && W0.sun > -50; sunDisc.visible = sv && grey < .7; sunDisc.position.copy(dome.position).addScaledVector(dirOf(pos.azimuth, pos.elevation), 88); sunDisc.lookAt(dome.position); sunDisc.material.uniforms.glow.value = 3.5 + clamp(el / 10) * 2;
      sunDisc.material.uniforms.tint.value.setRGB(...L.kelvin(Math.max(kel, 2400)).map(v => Math.min(v, 1.4)));
      moonDisc.visible = !!st.moon; if (st.moon) { moonDisc.position.copy(dome.position).addScaledVector(sunDir, 85); moonDisc.lookAt(dome.position); moonDisc.material.uniforms.glow.value = -2.5; }
      stars.visible = el < -6 && grey < .5; stars.position.copy(dome.position); stars.material.opacity = clamp((-el - 6) / 6) * .8; }
  }
  // the lights: position, aim, level (stops at its target × flicker), colour; then the 8 strongest at the subject go to the shader
  const subj = ctx.subject || V(0, 1.2, 0), act = [];
  const evalL = (l, tt) => { const on = (!l.on || (tt >= l.on[0] && tt < l.on[1])) && (!l.scene || !ctx.scene || l.scene === ctx.scene) && (!l.when || l.when(tt)); if (!on) return null;
    let p = where(l.at, tt); if (!p) return null; if (l.swing) { const a = l.swing.amp * Math.sin(2 * Math.PI * tt / (l.swing.period || 1.6)), len = l.swing.len || .4; p = p.add(V(Math.sin(a) * len, -Math.cos(a) * len, 0)); }
    const target = where(l.aim, tt), dRef = target ? Math.max(target.distanceTo(p), .3) : (l.dist || 1), fl = l.flick(tt, l), stops = fnv(l.stops, tt);
    const col = L.kelvin(fnv(l.kelvin, tt)).map((v, i) => v * (GELS[l.gel || 'none'] || GELS.none)[i]), soft2 = l.soft * l.soft, P0 = Math.pow(2, stops) * (dRef * dRef + soft2) * fl * (l.neg ? -1 : 1);
    return { p, target, fl, stops, col, soft2, P0, score: Math.abs(P0) / (p.distanceToSquared(subj) + soft2) * lum(col) }; };
  // fades: the shader has 8 slots. A light that drops out of the strongest 8 keeps its slot while it fades to 0 over FADE seconds; a newcomer takes
  // a slot only when one is free, then fades in. So at most 8 lights are ever lit and none pops. The weights carry from frame to frame (a shoot
  // runs in order); a jump in time (a still, a new shot) starts fresh with the strongest 8 fully on
  const live = LIST.filter(l => evalL(l, t)), sc = new Map(live.map(l => [l, evalL(l, t).score])), want = new Set([...live].sort((x, y) => sc.get(y) - sc.get(x)).slice(0, MAX)), fade = new Map();
  const dt = t - (FADES.t ?? -1e9), FADE = .3;
  if (live.length <= MAX) { for (const l of live) fade.set(l, 1); FADES.w = new Map(fade); }
  // a cut snaps the set of lights: the fade only smooths a light swapping in or out within one shot
  else if (!(dt >= -.1 && dt <= .2) || !FADES.w || (ctx.shot != null && ctx.shot !== FADES.shot)) { for (const l of want) fade.set(l, 1); FADES.w = new Map(fade); }
  else { const w = new Map([...FADES.w].filter(([l]) => sc.has(l))), step = Math.max(dt, 0) / FADE;
    for (const [l, v] of w) w.set(l, want.has(l) ? Math.min(1, v + step) : Math.max(0, v - step));
    for (const [l, v] of w) if (v <= 0 && !want.has(l)) w.delete(l);
    for (const l of [...want].filter(l => !w.has(l))) if (w.size < MAX) w.set(l, Math.min(1, step));
    if (dt > 0) FADES.w = new Map(w); for (const [l, v] of w) fade.set(l, v * v * (3 - 2 * v)); }
  if (dt > 0 || !(dt >= -.1)) FADES.t = t;
  FADES.shot = ctx.shot;
  for (const l of LIST) { if (l.mesh) l.mesh.visible = false; if (l.beamMesh) l.beamMesh.visible = false; const w = fade.get(l) || 0, e = w > 0 ? evalL(l, t) : null; if (!e) continue;
    const { p, target, fl, stops, col, soft2, P0 } = e;
    const aimDir = target ? target.clone().sub(p).normalize() : V(0, -1, 0), cosO = l.beam ? Math.cos(l.beam / 2 * Math.PI / 180) : -2, cosI = l.beam ? Math.cos(l.beam / 2 * .7 * Math.PI / 180) : -2;
    act.push({ l, p, col: col.map(v => v * P0 * w), aimDir, soft2, cosO, cosI, wrap: l.wrap, score: e.score * w, level: fl * Math.pow(2, stops) * w, w });
    if (l.mesh) { l.mesh.visible = fl > .02; l.mesh.position.copy(p); l.mesh.material.uniforms.glow.value = (l.glowAt ?? 2.5) + stops + Math.log2(Math.max(fl, .01)); l.mesh.material.uniforms.tint.value.setRGB(...col.map(v => Math.min(v, 1.5))); }
    if (l.glowMesh) { const mats = [].concat(l.glowMesh.material); for (const m of mats) if (m.uniforms && m.uniforms.glow) m.uniforms.glow.value = (l.glowAt ?? 1) + Math.log2(Math.max(fl, .01)); } }
  act.sort((a, b) => (b.w - a.w) || (b.score - a.score)); const use = act.slice(0, MAX); st.dropped = act.slice(MAX).map(a => a.l.name);
  let keyIdx = -1; const shadowL = use.findIndex(a => a.l.shadow); for (let i = 0; i < MAX; i++) { const a = use[i];
    if (!a) { LU.lCol.value[i].set(0, 0, 0); LU.lPos.value[i].set(0, -99, 0); continue; } LU.lPos.value[i].copy(a.p); LU.lCol.value[i].set(...a.col); LU.lAim.value[i].copy(a.aimDir); LU.lPar.value[i].set(a.soft2 + .0001, a.cosO, a.cosI, a.wrap);
    st.lights.push({ name: a.l.name, fixture: a.l.fixture, level: +a.level.toFixed(3), fade: +a.w.toFixed(2) }); }
  st.used = use;
  // shadows: from the sun (orthographic) unless a light in the set has shadow: true (perspective from that light)
  const sunUp = lum(sunCol) > .002 && sunDir.y > 0.01; LU.shadowOn.value = 0;
  if (shadowL >= 0) { keyIdx = shadowL; const a = use[shadowL]; spotCam.position.copy(a.p); spotCam.fov = Math.min(150, (a.l.beam || 120) * 1.15); spotCam.updateProjectionMatrix(); spotCam.lookAt(a.p.clone().add(a.aimDir)); renderShadow(spotCam); LU.shadowSoft.value = a.l.soft > .3 ? 1 : 0; }
  else if (sunUp && SKYCFG && SKYCFG.shadows !== false) { const c = ctx.shadowCenter || subj, size = SKYCFG.shadowSize || 9; sunCam.left = -size; sunCam.right = size; sunCam.top = size; sunCam.bottom = -size; sunCam.updateProjectionMatrix();
    sunCam.position.copy(c).addScaledVector(sunDir, 60); sunCam.lookAt(c); renderShadow(sunCam); LU.shadowSoft.value = (WEATHER[fnv(SKYCFG.weather, t)] || {}).grey > .3 ? 1 : 0; }
  st.amb = { sky, gnd, sunCol, sunDir: sunDir.clone() };
  LU.keyIdx.value = keyIdx; LU.sunDir.value.copy(sunDir); LU.sunCol.value.set(...sunCol); LU.skyCol.value.set(...sky); LU.gndCol.value.set(...gnd);
  // lightning lights the whole sky too
  const flash = act.filter(a => a.l.fixture === 'lightning').reduce((s, a) => s + a.level, 0); if (flash > 0 && dome) { const c = dome.geometry.attributes.color; for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) + flash * .1, c.getY(i) + flash * .11, c.getZ(i) + flash * .16); c.needsUpdate = true; }
  const atmC = fnv(ATM.color, t); LU.fogCol.value.set(...(atmC ? hex(atmC).map(v => v * (ATM.colorStops != null ? Math.pow(2, ATM.colorStops) : 1)) : fogCol).map(v => v + flash * .05)); LU.fogDen.value = haze;
  st.haze = haze; st.sky = { zen, hor, el };
  // the visible atmosphere: beams for spot lights in haze, the sunbeam through a window, dust lit where it crosses a beam
  const hz = clamp(haze * (ATM.beams ?? 12));
  for (const a of use) { if (!a.l.wantsBeam || hz <= 0) continue; const b = a.l.beamMesh || (a.l.beamMesh = beamMesh(a.l)), len = a.l.beamLen || 7, rad = Math.tan((a.l.beam || 40) / 2 * Math.PI / 180) * len;
    b.visible = true; b.position.copy(a.p); b.lookAt(a.p.clone().add(a.aimDir)); b.scale.set(rad, rad, len); b.material.color.setRGB(...a.col.map(v => clamp(v / Math.max(Math.abs(a.col[0]), Math.abs(a.col[1]), Math.abs(a.col[2]), .001) * a.level * hz * .05, 0, 2))); }
  for (const m of FX) { const u = m.userData; if (u.fx === 'blob') { const p = where(u.follow, t); m.position.set(p.x, .012, p.z); }
    if (u.fx === 'godray') { const c = u.cfg, ctr = V(...c.at), hw = c.w / 2, hh = c.h / 2, nrm = V(...c.normal).normalize(), side = V(0, 1, 0).cross(nrm).normalize(), up = nrm.clone().cross(side).normalize(), into = sunDir.clone().negate(), vis = clamp(-into.dot(nrm) * 3) * (sunUp ? 1 : 0);
      const P = m.geometry.attributes.position, C2 = m.geometry.attributes.color, k = vis * hz * c.strength * lum(sunCol) * .25, sc = sunCol.map(v => v / Math.max(lum(sunCol), .001));
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], i) => { const q = ctr.clone().addScaledVector(side, a * hw).addScaledVector(up, b * hh); P.setXYZ(i, q.x, q.y, q.z); const q2 = q.clone().addScaledVector(into, c.len); P.setXYZ(i + 4, q2.x, q2.y, q2.z);
        C2.setXYZ(i, ...sc.map(v => v * k)); C2.setXYZ(i + 4, 0, 0, 0); }); P.needsUpdate = C2.needsUpdate = true; m.geometry.computeBoundingSphere(); u.into = into; u.k = k; m.visible = k > .001; }
    if (u.fx === 'dust') { const c = u.cfg, P = m.geometry.attributes.position, C2 = m.geometry.attributes.color, rays = FX.filter(f => f.userData.fx === 'godray' && f.visible);
      c.base.forEach(([x, y, z, ph], i) => { const p = V(lerp(c.min.x, c.max.x, (x + Math.sin(t * .13 + ph) * .03 + 1) % 1), lerp(c.min.y, c.max.y, (y + t * .006 + Math.sin(t * .4 + ph) * .01) % 1), lerp(c.min.z, c.max.z, (z + Math.cos(t * .11 + ph) * .03 + 1) % 1)); P.setXYZ(i, p.x, p.y, p.z);
        let lit = 0; for (const a of use) if (a.l.beam && a.cosO > -1.5) { const d = p.clone().sub(a.p), dl = d.length(); if (d.normalize().dot(a.aimDir) > a.cosO) lit += a.level * hz * 1.5 / (1 + dl * .3); }
        for (const r of rays) { const cfg = r.userData.cfg, ctr = V(...cfg.at), back = p.clone().sub(ctr), s = back.dot(r.userData.into); if (s > 0 && s < cfg.len) { const q = back.addScaledVector(r.userData.into, -s); if (Math.abs(q.y) < cfg.h / 2 + .05 && Math.abs(q.x * cfg.normal[2] - q.z * cfg.normal[0]) < cfg.w / 2 + .05) lit += r.userData.k * 6; } }
        const tw = .6 + .4 * Math.sin(t * 3 + ph * 5); C2.setXYZ(i, lit * tw * c.strength, lit * tw * c.strength * .92, lit * tw * c.strength * .8); }); P.needsUpdate = C2.needsUpdate = true; } }
  return st; };
function renderShadow(cam) { const R = PS.renderer, hidden = []; PS.scene.traverse(o => { if (o.visible && (o.userData.fx || o.userData.sky || o.isPoints || o.isLine)) { o.visible = false; hidden.push(o); } });
  PS.scene.overrideMaterial = depthMat; R.setRenderTarget(shadowRT); R.clear(); R.render(PS.scene, cam); PS.scene.overrideMaterial = null; R.setRenderTarget(null); hidden.forEach(o => o.visible = true);
  cam.updateMatrixWorld(); LU.shadowVP.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); LU.shadowOn.value = 1; }
})();
