// GUESS THE HORROR #2 v3 — "The Rusted Truck" (Jeepers Creepers, 2001; never named). Rebuilt 2026-10-24 to the TikTok playbook in the
// approved look: hand-built PS1 (the Cursed Tape idiom: boxes, tiny textures, PS1.person box people), the cinematic camera (DOF, moves,
// letterbox, bloom), res 1.5, grades matched to the film, Minecraft-hit blood. v1–v6 (the prop-library builds) are kept as scene.v*.js.
// Research (Wikipedia + the film's wiki, re-checked 2026-10-24): siblings Trish and Darry drive home from college for spring break through the
// countryside, guessing what vanity plates mean; a rusty old truck (plate BEATNGU) tailgates them, honks, then passes; Darry guesses "beating
// you". At an abandoned church they see a man in a long coat and hat slide bodies wrapped in sheets down a big pipe; Darry goes back, falls
// down the pipe into a cellar where hundreds of bodies are sewn into the walls and ceiling. At a diner the phone rings: a psychic warns him
// and says to run when the old song plays. The creature hides as a scarecrow, spreads its wings; it wakes every 23rd spring for 23 days to
// eat, choosing by the smell of fear. At the police station it sniffs them, picks Darry and flies off with him. Released August 31, 2001,
// rated R; DVD January 2002. Hidden clue (first 10 s): a scarecrow standing in the field as they drive past.
// Places (one world, far apart): the hood with the case (x=0) · the road (x=200) · the church and its pipe (x=400) · the cellar (x=600) ·
// the diner (x=700) · the moonlit field (x=800) · the station (x=900) · the night sky (x=1000).
const { P, lerp, eio, eo, clamp, rng, at, st, en, back, V } = PS1;
const M = PS1.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, rep = PS1.rep, grp = PS1.group;
const DS = { side: THREE.DoubleSide };

// ---------- textures (tiny, on purpose) ----------
const T = {
  road: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3e3c3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a2826', 80, .8); noise(q, w, h, r, '#5a5652', 30, .6); }),
  field: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a5a2a', 90, .8); noise(q, w, h, r, '#b0a058', 40, .6); }),
  dirt: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a6448'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a4430', 80, .8); }),
  dash: PS1.color('#d8b440'), black: PS1.color('#030303'), ceil: PS1.color('#2a2622'),
  paint: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a8aa8'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a6a88', 30, .6); }),   // their pale blue 60s sedan
  rust: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a3e24'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a2214', 90, .8); noise(q, w, h, r, '#9a5a2a', 50, .6); noise(q, w, h, r, '#4a5a3a', 20, .6); }),
  chrome: PS1.color('#b4b8bc'), tyre: PS1.color('#151515'), glass: tex(8, 8, (q, w, h) => { q.fillStyle = '#26303a'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a7a88'; q.fillRect(1, 1, 2, 1); }), headlight: PS1.color('#fff4c8'),
  plate: tex(32, 16, (q) => { q.fillStyle = '#e8e4d4'; q.fillRect(0, 0, 32, 16); q.strokeStyle = '#2a2a2a'; q.strokeRect(.5, .5, 31, 15); q.fillStyle = '#1a3a7a'; q.font = 'bold 7px Arial'; q.textAlign = 'center'; q.fillText('BEATNGU', 16, 11); }),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a4632'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2a1c'; for (let x = 1; x < w; x += 4) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#7a6448', 30, .6); }),
  boards: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7a64'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a4a3a'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#6a5a48', 30, .6); }),
  pipe: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a6460'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a5a3a', 60, .7); noise(q, w, h, r, '#3a3430', 50, .8); q.fillStyle = '#4a4440'; q.fillRect(0, 7, w, 2); }),
  sheet: tex(16, 32, (q, w, h, r) => { q.fillStyle = '#d8d2c4'; q.fillRect(0, 0, w, h); q.fillStyle = '#b8b2a4'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); q.fillStyle = '#8a1a14'; q.fillRect(4, 8, 4, 3); q.fillRect(9, 20, 3, 4); q.fillStyle = '#5a3a2a'; for (let y = 1; y < h; y += 3) q.fillRect(7, y, 2, 1); }),
  cellar: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a3a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a2a20', 80, .8); noise(q, w, h, r, '#4a4a3a', 30, .6); }),
  tile: tex(16, 16, (q, w, h) => { for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { q.fillStyle = (x + y) / 4 % 2 ? '#e8e4d8' : '#2a2a2a'; q.fillRect(x, y, 4, 4); } }),
  diner: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#c8b898'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a7a7a'; q.fillRect(0, 10, w, 6); noise(q, w, h, r, '#a89878', 20, .5); }),
  station: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#9aa0a0'; q.fillRect(0, 0, w, h); q.fillStyle = '#7a8080'; q.fillRect(0, 10, w, 6); noise(q, w, h, r, '#8a9090', 20, .5); }),
  bars: tex(16, 16, (q) => { q.clearRect(0, 0, 16, 16); q.fillStyle = '#3a3a3a'; for (let x = 1; x < 16; x += 4) q.fillRect(x, 0, 2, 16); }),
  dial: tex(16, 8, (q) => { q.fillStyle = '#ffb040'; q.fillRect(0, 0, 16, 8); q.fillStyle = '#5a2a0a'; for (let x = 2; x < 16; x += 3) q.fillRect(x, 2, 1, 4); q.fillStyle = '#d0181c'; q.fillRect(9, 0, 1, 8); }),
  moon: tex(32, 32, (q) => { q.fillStyle = '#f2ecd0'; q.beginPath(); q.arc(16, 16, 15, 0, 6.283); q.fill(); q.fillStyle = '#d8d0b0'; for (const [x, y, rr] of [[11, 12, 3], [20, 19, 4], [18, 9, 2]]) { q.beginPath(); q.arc(x, y, rr, 0, 6.283); q.fill(); } }),
  straw: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#c8a858'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a6a28', 20, .8); }), sack: PS1.color('#b8a07a'),
  coat: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#2e2a24'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1a1814', 20, .8); }), hat: PS1.color('#22201c'),
  wing: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a2e26'; q.fillRect(0, 0, w, h); q.fillStyle = '#1e1814'; for (let x = 0; x < w; x += 5) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#5a4a3a', 30, .6); }),
  shard: PS1.color('#cfe0ea'), bulb: PS1.color('#fff2c8'), neon: PS1.color('#ff5a7a'), steel: PS1.color('#6a7076'),
  // people
  plaid: tex(8, 8, (q, w, h) => { q.fillStyle = '#7a2a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a1a1a'; q.fillRect(0, 3, w, 1); q.fillRect(3, 0, 1, h); }), jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#3a4a6a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#24304a', 14, .8); }),
  tee: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#d8d0c0'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#b8b0a0', 10, .6); }), denim: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#5a6e94'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a4a6a', 12, .7); }),
  apron: tex(8, 8, (q) => { q.fillStyle = '#e8b8c8'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#ffffff'; q.fillRect(2, 2, 4, 6); }), uniform: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a5a6a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a3a4a', 12, .7); }),
  skin: PS1.color('#d6a084'), brown: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a3020'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1a10', 20, .8); }),
  darkHair: tex(8, 16, (q, w, h) => { q.fillStyle = '#2a1e16'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2e22'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }), grey: PS1.color('#8a8680'),
  face: (kind) => tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    if (kind === 'creep') { px('#0a0806', 0, 0, 24, 28); px('#f0c040', 6, 12, 3, 2); px('#f0c040', 15, 12, 3, 2); for (let x = 6; x < 18; x += 2) px('#d8d0b8', x, 19, 1, 3); return; }   // the face in shadow: two glints, a row of teeth
    if (kind === 'scare') { px('#c8a858', 0, 0, 24, 28); px('#8a6a28', 0, 0, 24, 4); px('#2a1a0a', 6, 11, 4, 3); px('#2a1a0a', 14, 11, 4, 3); px('#2a1a0a', 8, 19, 8, 2); for (let x = 9; x < 16; x += 2) px('#c8a858', x, 19, 1, 2); return; }   // the sack face of the scarecrow
    const S = { darry: ['#d6a084', '#4a3020', 0], trish: ['#e0b090', '#2a1e16', 1], darryS: ['#d6a084', '#4a3020', 0], trishS: ['#e0b090', '#2a1e16', 1], old: ['#d0a888', '#8a8680', 0], cop: ['#c89878', '#2a1e16', 0] }[kind];
    const [sk, hair, long] = S; px(sk, 0, 0, 24, 28); px(hair, 0, 0, 24, 5); if (long) { px(hair, 0, 5, 3, 16); px(hair, 21, 5, 3, 16); }
    const scared = kind.endsWith('S'); px('#3a2a1a', 5, scared ? 8 : 9, 4, 1); px('#3a2a1a', 15, scared ? 8 : 9, 4, 1); px('#f4f2ec', 5, 11, 4, scared ? 3 : 2); px('#f4f2ec', 15, 11, 4, scared ? 3 : 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3);
    if (scared) { px('#3a1612', 9, 19, 6, 4); px('#7a2a24', 10, 20, 4, 2); } else if (kind === 'darry') { px('#3a1a14', 7, 20, 10, 2); px('#f4f2ea', 8, 20, 8, 1); } else px('#8a4a3a', 9, 21, 6, 1); }),
  cover: (() => { const c = document.createElement('canvas'); c.width = 270; c.height = 380; const g = c.getContext('2d'), r = rng(77);
    const bg = g.createRadialGradient(135, 170, 20, 135, 190, 260); bg.addColorStop(0, '#b8925a'); bg.addColorStop(.6, '#7a5a32'); bg.addColorStop(1, '#2a1a0c'); g.fillStyle = bg; g.fillRect(0, 0, 270, 380);
    for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(40,24,10,${.15 + r() * .3})`; g.lineWidth = .5 + r(); g.beginPath(); let x = r() * 270, y = r() * 300; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 18; y += (r() - .5) * 18; g.lineTo(x, y); } g.stroke(); }
    const tear = [[150, 70], [128, 118], [144, 150], [112, 200], [126, 236], [100, 290], [150, 250], [160, 210], [176, 170], [160, 132], [178, 96]]; g.fillStyle = '#120c08'; g.beginPath(); tear.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    g.save(); g.beginPath(); tear.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); g.fillStyle = '#5a4436'; g.beginPath(); g.ellipse(140, 200, 30, 16, -.25, 0, 6.283); g.fill();
    g.fillStyle = '#e8e2d8'; g.beginPath(); g.ellipse(140, 200, 20, 10, -.25, 0, 6.283); g.fill(); g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(140, 200, 7.5, 0, 6.283); g.fill(); g.fillStyle = '#050403'; g.beginPath(); g.arc(140, 200, 3.5, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(137, 197, 1.6, 0, 6.283); g.fill(); g.strokeStyle = '#1a120c'; g.lineWidth = 2; g.beginPath(); g.ellipse(140, 197, 22, 12, -.25, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore();
    g.strokeStyle = 'rgba(30,18,8,.8)'; g.lineWidth = 2; g.beginPath(); tear.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
    for (const [x1, y1, x2, y2] of [[118, 92, 170, 120], [168, 92, 120, 134], [110, 160, 176, 186], [180, 150, 118, 210], [108, 238, 166, 226], [120, 262, 168, 270]]) { for (const [lw, c2] of [[4.5, '#3a2814'], [3, '#c8a868']]) { g.strokeStyle = c2; g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 6, x2, y2); g.stroke(); }
      for (const [x, y] of [[x1, y1], [x2, y2]]) { g.fillStyle = '#1a1008'; g.beginPath(); g.arc(x, y, 3, 0, 6.283); g.fill(); g.strokeStyle = '#c8a868'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 16, y + 4 + r() * 10); g.stroke(); } } }
    const scrawl = (s2, x, y, size, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.font = `bold ${size}px "Chalkduster", "Marker Felt", cursive`; g.fillStyle = '#f2ece0'; g.textAlign = 'center'; g.fillText(s2, 0, 0); g.restore(); };
    scrawl('WHAT\'S EATING YOU?', 112, 54, 17, -.12); scrawl('???????  ????????', 135, 314, 19, -.02);
    g.save(); g.translate(135, 334); g.rotate(-.05); g.strokeStyle = '#d23a2a'; g.lineWidth = 2.5; g.strokeRect(-64, -11, 128, 22); g.fillStyle = '#d23a2a'; g.font = 'bold 13px Rockwell, "Courier New", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TITLE WITHHELD', 0, 1); g.restore();
    g.fillStyle = 'rgba(232,226,214,.8)'; g.font = '500 7px "Avenir Next Condensed", sans-serif'; g.textAlign = 'center'; ['MIDNIGHT PICTURES PRESENTS A ??? FILM', 'STARRING ??? · ??? · ??? · ???', 'WRITTEN AND DIRECTED BY ???'].forEach((s2, i) => g.fillText(s2, 135, 352 + i * 9));
    g.strokeStyle = '#e8e2d6'; g.lineWidth = 1; g.strokeRect(12, 344, 26, 26); g.fillStyle = '#e8e2d6'; g.font = 'bold 15px Helvetica'; g.fillText('?', 25, 363);
    g.save(); g.translate(236, 40); g.rotate(.14); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 24, 0, 6.283); g.fill(); g.strokeStyle = '#c0302a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#c0302a'; g.font = 'bold 5px Arial'; g.textAlign = 'center'; g.fillText('MIDNIGHT VIDEO', 0, -9); g.fillStyle = '#111'; g.font = 'bold 8px Helvetica'; g.fillText('NEW RELEASE', 0, 2); g.font = 'bold 5px Arial'; g.fillText('2 NIGHTS · $3.99', 0, 11); g.restore();
    const sh = g.createLinearGradient(0, 0, 270, 380); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, 270, 380); return c; })(),
  disc: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#a8adb4'; g.beginPath(); g.arc(32, 32, 31, 0, 6.283); g.fill(); g.fillStyle = '#7a5a32'; g.beginPath(); g.arc(32, 32, 28, 0, 6.283); g.fill();
    g.fillStyle = '#e8e2d8'; g.beginPath(); g.ellipse(32, 20, 9, 4.5, 0, 0, 6.283); g.fill(); g.fillStyle = '#2a1a0c'; g.beginPath(); g.arc(32, 20, 3, 0, 6.283); g.fill(); g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(32, 32, 6, 0, 6.283); g.fill(); g.fillStyle = '#101114'; g.beginPath(); g.arc(32, 32, 2.5, 0, 6.283); g.fill(); return c; })(),
};
const diskTex = (() => { const t = new THREE.CanvasTexture(T.disc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();
for (const k of ['road', 'field', 'dirt']) PS1.mip(T[k]);

const plane = (w, h, mat, x, y, z, rx = 0, ry = 0, parent) => { const m = add(rep(new THREE.PlaneGeometry(w, h, Math.max(1, Math.ceil(w / 2)), Math.max(1, Math.ceil(h / 2))), Math.max(1, w / 1.5), Math.max(1, h / 1.5)), mat, x, y, z, parent); m.rotation.set(rx, ry, 0); return m; };
const ground = (w, d, mat, x, y, z, parent) => plane(w, d, mat, x, y, z, -Math.PI / 2, 0, parent);
const offsetM = (m, f) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = f * 2; return m; };
function wallWithDoor(w, h, dw, dh, mat, x, y, z, ry, parent) { const G = grp(x, y, z, parent); G.rotation.y = ry; const sw = (w - dw) / 2; plane(sw, h, mat, -(dw + sw) / 2, h / 2, 0, 0, 0, G); plane(sw, h, mat, (dw + sw) / 2, h / 2, 0, 0, 0, G); plane(dw, h - dh, mat, 0, dh + (h - dh) / 2, 0, 0, 0, G); return G; }
// a room seen from inside: floor, ceiling, walls (double-sided); open: 'front' leaves the +z wall out
function room(ox, oz, w, d, h, wallT, floorT, open) { const R = grp(ox, 0, oz), WM = M(wallT, DS);
  ground(w, d, M(floorT), 0, 0, 0, R); plane(w, d, M(T.ceil, DS), 0, h, 0, Math.PI / 2, 0, R); plane(d, h, WM, -w / 2, h / 2, 0, 0, Math.PI / 2, R); plane(d, h, WM, w / 2, h / 2, 0, 0, -Math.PI / 2, R);
  if (open !== 'back') plane(w, h, WM, 0, h / 2, -d / 2, 0, 0, R); if (open !== 'front') plane(w, h, WM, 0, h / 2, d / 2, 0, Math.PI, R); return R; }
// people: a PS1.person plus the walk/run/sit legs this episode needs (all pure in t)
const person = (top, legs, hair, face, o = {}) => { const p = PS1.person(Object.assign({ skin: T.skin, top, legs, hair, face: T.face(face) }, o)); p.faces = {}; p.setFace = k => { p.faceMat.uniforms.map.value = p.faces[k] || (p.faces[k] = T.face(k)); }; return p; };
const ARM = PS1.ARMS, LEG = PS1.LEGS;
function stand(p) { p.legs(LEG.stand(-1), LEG.stand(1)); p.pose(ARM.down(-1), ARM.down(1)); }
function sit(p, arms = 'lap') { p.legs(LEG.sit(-1), LEG.sit(1)); p.pose(ARM[arms](-1), ARM[arms](1)); }
function stride(p, ph, run) { const a = Math.sin(ph * 6.283), A = run ? .48 : .3; p.legs(...[-1, 1].map(s => { const k = s * a; return [V(s * .09, .8, 0), V(s * .09, .43, k * A * .55 + .03), V(s * .09, .05 + Math.max(0, -k) * (run ? .16 : .08), k * A)]; }));
  p.pose(...[-1, 1].map(s => { const k = -s * a; return [V(s * .24, 1.36, 0), V(s * .27, 1.1, k * .14 + (run ? .06 : 0)), V(s * .28, run ? .96 : .82, k * .28 + (run ? .16 : 0))]; })); }
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const path = (t, pts) => { if (t <= pts[0][0]) return pts[0][1].clone(); for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return lerpV(a, b, (t - t0) / (t1 - t0)); } return pts[pts.length - 1][1].clone(); };
function walker(p, t, pts, speed = 1.6, run = false) { const a = path(t, pts), b = path(t + .06, pts), moving = a.distanceTo(b) > .0004; p.G.position.copy(a); if (moving) { p.G.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); stride(p, t * speed, run); } else stand(p); return moving; }
// the roadkill armadillo (the hidden clue): built upright, then flipped onto its back; userData.legs twitch, userData.body rocks

// ---------- builders ----------
function wheel(G, x, y, z, r = .36) { const w = add(cyl(r, r, .22, 8), M(T.tyre), x, y, z, G); w.rotation.z = Math.PI / 2; add(cyl(r * .55, r * .55, .23, 6), M(T.chrome), x, y, z, G).rotation.z = Math.PI / 2; return w; }
// their 1960s sedan, faces -z; open cabin (pillars + roof) so the two of them show; userData.wheels
function sedan() { const G = grp(), B = M(T.paint); add(box(1.9, .55, 5.0), B, 0, .62, 0, G); add(box(1.86, .12, 1.6), B, 0, .96, -1.75, G); add(box(1.86, .12, 1.3), B, 0, .96, 1.85, G);
  for (const s of [-1, 1]) { add(box(.12, .25, .5), B, s * .9, 1.0, 2.35, G); add(box(.06, .5, .06), B, s * .88, 1.24, -.75, G); add(box(.06, .5, .06), B, s * .88, 1.24, .95, G); }   // fins, pillars
  add(box(1.8, .06, 1.8), B, 0, 1.5, .1, G); add(box(1.95, .14, .12), M(T.chrome), 0, .45, -2.52, G); add(box(1.95, .14, .12), M(T.chrome), 0, .45, 2.52, G);
  for (const s of [-1, 1]) { add(cyl(.11, .11, .04, 8), M(T.headlight, { unlit: true }), s * .66, .72, -2.52, G).rotation.x = Math.PI / 2; add(box(.14, .1, .04), M(PS1.color('#d0181c'), { unlit: true }), s * .7, .78, 2.52, G); }
  for (const s of [-1, 1]) add(box(.75, .45, .55), M(T.tee), s * .42, .75, -.1, G); add(box(1.7, .3, .1), M(T.tyre), 0, 1.0, -.95, G);   // seats, dash
  G.userData.wheels = [wheel(G, -.92, .36, -1.6), wheel(G, .92, .36, -1.6), wheel(G, -.92, .36, 1.6), wheel(G, .92, .36, 1.6)]; return G; }
// the rusted cab-over truck, faces -z; plate on the back doors and the front bumper
function rustTruck() { const G = grp(), R = M(T.rust); add(box(2.3, 1.05, 1.9), R, 0, 1.225, -2.9, G); add(box(2.3, .1, 1.9), R, 0, 2.75, -2.9, G); add(box(2.3, 1.0, .1), R, 0, 2.25, -1.95, G); for (const s of [-1, 1]) add(box(.08, 1.0, 1.9), R, s * 1.11, 2.25, -2.9, G);   // a hollow cab add(box(2.28, .08, .06), M(T.rust), 0, 2.62, -3.86, G); for (const s of [-1, 1]) add(box(.08, .8, .06), M(T.rust), s * 1.1, 2.25, -3.86, G);   // an open windscreen frame: you can see the driver add(box(1.6, .9, .1), M(T.chrome), 0, 1.0, -3.87, G);
  for (const s of [-1, 1]) add(cyl(.16, .16, .05, 8), M(T.headlight, { unlit: true }), s * .85, 1.05, -3.88, G).rotation.x = Math.PI / 2;
  add(box(2.5, 2.6, 4.6), R, 0, 2.0, .5, G); add(box(2.52, .1, 4.62), M(PS1.color('#3a2416')), 0, 3.3, .5, G); add(box(.5, .25, .02), M(T.plate, { unlit: true, tint: '#c8c4b4' }), 0, .95, 2.82, G); add(box(.5, .25, .02), M(T.plate, { unlit: true, tint: '#c8c4b4' }), .6, .62, -3.95, G);
  add(box(2.6, .14, .14), M(T.chrome), 0, .7, -3.95, G); add(box(2.0, .5, .5), M(T.tyre), 0, .5, 1.2, G);
  G.userData.wheels = [wheel(G, -1.05, .5, -2.6, .5), wheel(G, 1.05, .5, -2.6, .5), wheel(G, -1.12, .5, 1.6, .5), wheel(G, 1.12, .5, 1.6, .5), wheel(G, -1.12, .5, .5, .5), wheel(G, 1.12, .5, .5, .5)]; return G; }
// the creature: very tall, long coat, wide hat, face in shadow, leathery wings that fold down its back (setWings(k))
function creature() { const p = PS1.person({ skin: PS1.color('#3a2e24'), top: T.coat, legs: T.coat, hair: T.hat, face: T.face('creep'), dress: true }); p.G.scale.setScalar(1.32);
  add(box(.62, .04, .62), M(T.hat), 0, 1.71, 0, p.G); add(box(.28, .16, .26), M(T.hat), 0, 1.79, 0, p.G);
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.5, .4); sh.lineTo(1.7, -.1); sh.lineTo(1.3, -.5); sh.lineTo(1.0, -.25); sh.lineTo(.7, -.7); sh.lineTo(.45, -.35); sh.lineTo(0, -.6); sh.lineTo(0, 0);
  p.wings = [-1, 1].map(s => { const pv = grp(s * .12, 1.3, -.15, p.G), m = add(new THREE.ShapeGeometry(sh), M(T.wing, DS), 0, 0, 0, pv); m.scale.x = s; return pv; });
  p.setWings = k => p.wings.forEach((pv, i) => { const s = i ? 1 : -1; pv.visible = k > .03; pv.rotation.set(-.2, s * lerp(-1.45, -.15, k), s * lerp(-1.2, .15, k)); }); p.setWings(0); return p; }
function scarecrow() { const p = PS1.person({ skin: T.sack, top: T.plaid, legs: T.jeans, hair: T.straw, face: T.face('scare') }); add(box(.5, .04, .5), M(T.straw), 0, 1.7, 0, p.G); p.post = add(box(.12, 2.6, .12), M(T.wood), 0, 1.0, -.2, p.G); add(box(1.6, .1, .1), M(T.wood), 0, 1.36, -.18, p.G); return p; }
function pole(x, z, parent) { add(box(.2, 7, .2), M(T.wood), x, 3.5, z, parent); add(box(1.6, .12, .12), M(T.wood), x, 6.6, z, parent); }
function deadTree(x, z, h, parent, seed = 1) { const r = rng(seed); add(cyl(.12, .2, h, 5), M(T.wood), x, h / 2, z, parent); for (let k = 0; k < 4; k++) { const b = add(box(.08, h * .35, .08), M(T.wood), x, h * (.55 + k * .1), z, parent); b.rotation.set((r() - .5) * 1.4, r() * 6, (r() < .5 ? -1 : 1) * (.6 + r() * .5)); } }
function bundle(parent) { const G = grp(0, 0, 0, parent); const b = add(cyl(.22, .26, 1.7, 7), M(T.sheet), 0, 0, 0, G); b.rotation.z = Math.PI / 2; for (const x of [-.55, 0, .55]) { const r = add(cyl(.27, .27, .05, 7), M(PS1.color('#9a8a62')), x, 0, 0, G); r.rotation.z = Math.PI / 2; } return G; }
function stitched(x, y, z, ry, parent, seed) { const G = grp(x, y, z, parent); G.rotation.y = ry; add(box(.5, 1.6, .2), M(T.sheet), 0, 0, 0, G); add(box(.3, .3, .2), M(T.sheet), 0, .9, 0, G); const r = rng(seed); G.rotation.z = (r() - .5) * .3; return G; }

const X = { hood: 0, road: 200, church: 400, cellar: 600, diner: 700, farm: 800, station: 900, sky: 1000 };
const GR = { road: { lift: [.03, .01, -.02], gain: [1.12, 1.0, .78], sat: 1.22, contrast: 1.12, temp: .35 }, church: { lift: [.03, 0, -.02], gain: [1.1, .9, .74], sat: 1.15, contrast: 1.18, temp: .35 },
  cellar: { lift: [-.01, .02, 0], gain: [.9, 1.0, .82], sat: .8, contrast: 1.25, temp: -.05 }, diner: { lift: [0, .02, .02], gain: [.95, 1.05, 1.0], sat: 1.05, contrast: 1.1, temp: -.1 },
  night: { lift: [-.02, -.01, .03], gain: [.86, .9, 1.1], sat: .95, contrast: 1.22, temp: -.3 }, station: { lift: [-.01, .01, .02], gain: [.9, 1.0, 1.04], sat: .85, contrast: 1.2, temp: -.15 } };
function hurt(p, k) { if (!p._mats) { p._mats = []; p.G.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (m.uniforms && m.uniforms.tint && !p._mats.includes(m)) p._mats.push(m); }); } for (const m of p._mats) m.uniforms.tint.value.setRGB(1, 1 - .78 * k, 1 - .78 * k); }
const hitK = (t, t0) => { const u = t - t0; return u < 0 || u > .45 ? 0 : (Math.floor(u * 16) % 2 ? .55 : 1) * (1 - u / .45); };
const bloodPool = (parent, n = 12) => [...Array(n)].map((_, i) => add(box(.05, .05, .05), M(PS1.color(i % 3 ? '#c41818' : '#8a0c0c'), { unlit: true }), 0, -99, 0, parent));
function bleed(pool, t, t0, o, dir) { pool.forEach((b, i) => { const k = t - t0 - (i % 3) * .02; if (k < 0 || k > 1.4) { b.position.y = -99; return; } const a = i * 2.399, sp = .5 + (i % 5) * .18;
  b.position.set(o.x + (Math.cos(a) * .35 + dir.x) * sp * k, Math.max(.03, o.y + (1.6 + (i % 4) * .3 - 4.9 * k) * k), o.z + (Math.sin(a) * .35 + dir.z) * sp * k); b.rotation.set(k * 6, k * 4, 0); }); }

// the drive: the car runs down the road at 9 m/s from z=40; the truck closes in behind, tailgates, passes on the left and pulls ahead
const carZ = t => 40 - 9 * (t - 2.6);
const truckOff = t => t < at('L3', 'rusted') ? 30 : t < at('L3', 'roars') ? lerp(30, 6.2, eio((t - at('L3', 'rusted')) / (at('L3', 'roars') - at('L3', 'rusted')))) : t < st('L3b') ? 6.2 : lerp(6.2, -9, eio(clamp((t - st('L3b')) / 1.1)));
const truckX = t => t < st('L3b') - .3 ? 1.6 : -1.6;   // it passes in the left lane and stays there, ahead of them
function sched(S) { const w = (l, x, d = 0) => at(l, x) + d;
  return [['hood', 0, st('L2') - .18], ['road', st('L2') - .18, st('L4') - .1], ['church', st('L4') - .1, w('L6', 'Beneath', .55)], ['cellar', w('L6', 'Beneath', .55), st('L7') - .1], ['diner', st('L7') - .1, st('L8') - .1],
    ['farm', st('L8') - .1, st('L9') - .1], ['station', st('L9') - .1, en('L9') + .55], ['sky', en('L9') + .55, S.cutBack]]; }
const where = (t, S) => { if (t >= S.cutBack) return 'hood'; for (const [k, a, b] of sched(S)) if (t >= a && t < b) return k; return 'hood'; };

// ---------- the episode ----------
PS1.episode({
  camcorder: false, res: 1.5, letterbox: .06, bloom: .36,
  open: ['L1', null, .55],
  capColor: { L3c: '#ffb0a0' },
  hud(t, S, q) {   // the burned-in title card: frames 0–2.4 s, and back on the closed case at the end, so frame 0 = the last frame = the cover
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - S.lidShut - .2) / .3))); if (a <= 0) return;
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round'; const LW2 = 180;
    const txt = (s, y, size, fill, ls = 0) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.letterSpacing = ls + 'px'; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, LW2, y); q.fillStyle = fill; q.fillText(s, LW2, y); };
    txt('GUESS THE HORROR', 112, 30, '#f2f0ea', 1); txt('#2', 156, 44, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 198, 17, '#ffd23a', 1);
    q.translate(LW2, 232); q.rotate(-.06); q.letterSpacing = '2px'; q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.fillStyle = 'rgba(0,0,0,.55)'; q.fillRect(-90, -12, 180, 24); q.strokeStyle = '#e2342a'; q.lineWidth = 2.5; q.strokeRect(-90, -12, 180, 24); q.fillStyle = '#e2342a'; q.fillText('DIFFICULTY: MEDIUM', 0, 1);
    q.restore(); },
  build(S) { const O = S.O = {}, g = O.g = {}; for (const k of Object.keys(X)) g[k] = grp(0, 0, 0);
    // ---- the hood: the parked car on the shoulder at golden hour, a road map and the case on its hood
    { const q = g.hood, x0 = X.hood; ground(80, 80, M(T.field), x0, 0, 0, q); ground(6.4, 80, M(T.road), x0 + 4, .03, 0, q); const c = sedan(); c.position.set(x0, 0, 0); q.add(c);
      add(box(.8, .005, .6), M(PS1.color('#e8dcc0')), x0, 1.025, -1.75, q); for (let i = 0; i < 6; i++) pole(x0 + 8.5, 30 - i * 26, q); deadTree(x0 - 8, -12, 7, q, 3);
      O.sun0 = add(new THREE.CircleGeometry(4, 12), M(PS1.color('#fff0c0'), { unlit: true, noFog: true }), x0 + 30, 8, -50, q); O.sun0.lookAt(x0, 1, 0);
      S.case = PS1.dvdCase(T.cover, diskTex, x0, 1.03, -1.72, .1); S.caseCam = [V(x0, 1.03 + .62, -1.78 + .001), V(x0, 1.03, -1.78), 40]; }
    // ---- the road: fields, poles, the scarecrow (hidden clue), the car and the truck
    { const q = g.road, x0 = X.road; ground(90, 320, M(T.field), x0, 0, -60, q); ground(6.4, 320, offsetM(M(T.road), -1), x0, .04, -60, q); for (let k = -210; k < 100; k += 6) ground(.14, 2.4, offsetM(M(T.dash, { unlit: true, tint: '#b8a060' }), -2), x0, .08, k, q);
      for (let z = 100; z > -220; z -= 26) pole(x0 + 6, z, q); for (let i = 0; i < 10; i++) deadTree(x0 + (i % 2 ? -14 - i : 15 + i), 80 - i * 30, 6 + i % 3, q, i + 7);
      O.scare = scarecrow(); O.scare.G.position.set(x0 - 9, 0, carZ(6.6) - 4); O.scare.G.rotation.y = .5; q.add(O.scare.G); O.scare.pose([V(-.24, 1.36, 0), V(-.5, 1.36, 0), V(-.78, 1.36, 0)], [V(.24, 1.36, 0), V(.5, 1.36, 0), V(.78, 1.36, 0)]);
      O.car = sedan(); q.add(O.car); O.truck = rustTruck(); q.add(O.truck);
      O.dar = person(T.plaid, T.jeans, T.brown, 'darry'); O.tri = person(T.tee, T.jeans, T.darkHair, 'trish', { long: .4 }); for (const [p, x] of [[O.dar, -.42], [O.tri, .42]]) { O.car.add(p.G); p.G.position.set(x, .97 - .8, -.1); p.G.rotation.y = Math.PI; sit(p, x < 0 ? 'drive' : 'lap'); }
      O.driver = PS1.person({ skin: PS1.color('#3a2e24'), top: T.coat, legs: T.coat, hair: T.hat, face: T.face('creep') }); O.truck.add(O.driver.G); O.driver.G.position.set(-.5, 1.25 - .8, -2.9); O.driver.G.rotation.y = Math.PI; sit(O.driver, 'drive');
      O.sun1 = add(new THREE.CircleGeometry(4, 12), M(PS1.color('#fff0c0'), { unlit: true, noFog: true }), x0 - 30, 9, -60, q); O.sun1.lookAt(x0, 1, -20); }
    // ---- the church at dusk: the steeple, the big pipe out of the ground, the parked truck, the man in the coat, the bundle; the siblings
    { const q = g.church, x0 = X.church; ground(80, 80, M(T.dirt), x0, 0, 0, q); const C = grp(x0, 0, -8, q); add(rep(box(6, 4.5, 9), 3, 2), M(T.boards), 0, 2.25, 0, C);
      for (const s of [-1, 1]) { const r = add(rep(box(6.6, .14, 5.4), 3, 2), M(T.wood), 0, 5.6, s * 0, C); r.rotation.z = s * .6; r.position.x = s * 1.55; r.scale.x = .55; r.position.y = 5.35; }
      add(box(1.6, 3.5, 1.6), M(T.boards), 0, 6.5, 3.6, C); add(new THREE.ConeGeometry(1.2, 2.6, 4), M(T.wood), 0, 9.5, 3.6, C).rotation.y = Math.PI / 4; add(box(1.4, 2.2, .05), M(T.black), 0, 1.1, 4.53, C);
      for (const wx of [-1.6, 1.6]) add(box(.7, 1.2, .05), M(T.black), wx, 2.4, 4.53, C);
      O.pipeG = grp(x0 + 4.2, 0, -2, q); const pm = add(cyl(.62, .62, 3.4, 10, true), M(T.pipe, DS), 0, .9, 0, O.pipeG); O.pipeG.rotation.z = -.55; add(new THREE.CircleGeometry(.6, 10), M(T.black), 0, -.75, 0, O.pipeG).rotation.x = -Math.PI / 2;
      O.pipeMouth = V(x0 + 4.2 + Math.sin(.55) * 2.6, Math.cos(.55) * 2.6 - .1, -2);
      add(new THREE.CylinderGeometry(1.4, 2.0, .6, 9, 1, true), M(T.dirt, DS), x0 + 4.2, .3, -2, q); add(new THREE.RingGeometry(.64, 1.4, 9), M(T.dirt, DS), x0 + 4.2, .6, -2, q).rotation.x = -Math.PI / 2;
      O.truckC = rustTruck(); O.truckC.position.set(x0 + 13, 0, -7); O.truckC.rotation.y = .5; q.add(O.truckC);
      O.man = creature(); q.add(O.man.G); O.bun = bundle(q);
      O.carC = sedan(); O.carC.position.set(x0 - 6, 0, 14); O.carC.rotation.y = Math.PI / 2; q.add(O.carC); ground(6.4, 80, M(T.road), x0 - 3, .03, 16, q).rotation.z = Math.PI / 2;
      O.darC = person(T.plaid, T.jeans, T.brown, 'darry'); O.triC = person(T.tee, T.jeans, T.darkHair, 'trish', { long: .4 }); q.add(O.darC.G); q.add(O.triC.G);
      for (const [dx, dz] of [[-14, -16], [16, -12], [-18, 6]]) deadTree(x0 + dx, dz, 9, q, dx);
      O.sun2 = add(new THREE.CircleGeometry(5, 12), M(PS1.color('#ffb070'), { unlit: true, noFog: true }), x0 - 20, 3, -50, q); O.sun2.lookAt(x0, 1, 0); }
    // ---- the cellar: the "house" under the church — walls and ceiling covered with stitched, wrapped bodies; a single light
    { const q = g.cellar, x0 = X.cellar; const R = grp(x0, 0, 0, q), WM = M(T.cellar, DS); ground(8, 8, M(T.cellar), 0, 0, 0, R); plane(8, 8, M(T.ceil, DS), 0, 3.4, 0, Math.PI / 2, 0, R);
      for (const [x, z, ry, w] of [[0, -4, 0, 8], [-4, 0, Math.PI / 2, 8], [4, 0, -Math.PI / 2, 8], [0, 4, Math.PI, 8]]) plane(w, 3.4, WM, x, 1.7, z, 0, ry, R);
      let n = 0; for (const [wall, ry] of [[-3.88, 0], [-3.88, Math.PI / 2], [3.88, -Math.PI / 2]]) for (let i = -3; i <= 3; i++) for (const y of [.95, 2.6]) { n++; const p = wall === -3.88 && ry === 0 ? [x0 + i * 1.0, y, -3.85] : [x0 + wall, y, i * 1.0]; stitched(p[0], p[1], p[2], ry, q, n); }
      for (let i = -3; i <= 3; i++) { const b = stitched(x0 + i * 1.0, 3.25, -1 + (i % 2), 0, q, 50 + i); b.rotation.x = Math.PI / 2; }
      add(new THREE.CircleGeometry(.6, 10), M(PS1.color('#2a2620')), x0 + 2.5, 3.39, 2.5, q).rotation.x = Math.PI / 2;
      O.darK = person(T.plaid, T.jeans, T.brown, 'darryS'); q.add(O.darK.G); O.torch = grp(0, 0, 0, q); add(cyl(.03, .04, .22, 6), M(T.tyre), 0, 0, 0, O.torch).rotation.x = Math.PI / 2; O.dripK = bloodPool(q, 6); }
    // ---- the diner: counter, stools, the wall payphone, the old radio, a neon sign through the window
    { const q = g.diner, x0 = X.diner; const R = grp(x0, 0, 0, q), WM = M(T.diner, DS); ground(8, 6, M(T.tile), 0, 0, 0, R); plane(8, 6, M(T.ceil, DS), 0, 2.8, 0, Math.PI / 2, 0, R);
      for (const [x, z, ry, w] of [[0, -3, 0, 8], [-4, 0, Math.PI / 2, 6], [4, 0, -Math.PI / 2, 6], [0, 3, Math.PI, 8]]) plane(w, 2.8, WM, x, 1.4, z, 0, ry, R);
      add(box(4.5, 1.0, .7), M(T.diner), x0 - .8, .5, -1.6, q); add(box(4.6, .06, .8), M(T.chrome), x0 - .8, 1.03, -1.6, q); for (let i = 0; i < 5; i++) { add(cyl(.03, .03, .7, 5), M(T.chrome), x0 - 2.6 + i * .9, .35, -.9, q); add(cyl(.2, .2, .08, 8), M(PS1.color('#c41818')), x0 - 2.6 + i * .9, .74, -.9, q); }
      add(box(.3, .55, .2), M(PS1.color('#2a2a2a')), x0 + 3.85, 1.55, 1.2, q); O.handset = add(box(.08, .24, .08), M(PS1.color('#1a1a1a')), x0 + 3.72, 1.62, 1.2, q);
      add(box(.5, .35, .25), M(T.wood), x0 - 2.6, 1.23, -1.75, q); O.dial = add(new THREE.PlaneGeometry(.3, .1), M(T.dial, { unlit: true }), x0 - 2.6, 1.28, -1.62, q);
      add(new THREE.PlaneGeometry(2.0, 1.0), M(PS1.color('#0a0c14'), { unlit: true }), x0 + .5, 1.6, 2.97, q).rotation.y = Math.PI; add(new THREE.PlaneGeometry(.9, .2), M(T.neon, { unlit: true }), x0 + .5, 1.8, 2.95, q).rotation.y = Math.PI;
      O.darD = person(T.plaid, T.jeans, T.brown, 'darry'); O.triD = person(T.tee, T.jeans, T.darkHair, 'trish', { long: .4 }); O.wait = person(T.apron, T.jeans, T.grey, 'old', { dress: true }); for (const p of [O.darD, O.triD, O.wait]) q.add(p.G); }
    // ---- the moonlit field: the scarecrow on its post, which turns its head, steps down, and spreads its wings against the moon
    { const q = g.farm, x0 = X.farm; ground(90, 90, M(T.field), x0, 0, 0, q); add(box(30, .9, .12), M(T.wood), x0, .45, -6, q); O.moon = add(new THREE.CircleGeometry(9, 18), M(T.moon, { unlit: true, noFog: true }), x0, 9, -55, q);
      for (const [dx, dz] of [[-12, -10], [14, -14], [-20, 4]]) deadTree(x0 + dx, dz, 8, q, dx + 3); O.creF = creature(); q.add(O.creF.G); O.postF = add(box(.14, 2.4, .14), M(T.wood), x0, 1.2, -.3, q); add(box(1.6, .1, .1), M(T.wood), x0, 2.1, -.28, q); }
    // ---- the police station: a holding room, a barred window, the two of them; it comes in, sniffs, picks him
    { const q = g.station, x0 = X.station; const R = grp(x0, 0, 0, q), WM = M(T.station, DS); ground(7, 6, M(T.tile), 0, 0, 0, R); plane(7, 6, M(T.ceil, DS), 0, 2.9, 0, Math.PI / 2, 0, R);
      for (const [x, z, ry, w] of [[-3.5, 0, Math.PI / 2, 6], [3.5, 0, -Math.PI / 2, 6], [0, 3, Math.PI, 7]]) plane(w, 2.9, WM, x, 1.45, z, 0, ry, R);
      plane(2.5, 2.9, WM, -2.25, 1.45, -3, 0, 0, R); plane(2.5, 2.9, WM, 2.25, 1.45, -3, 0, 0, R); plane(2, .9, WM, 0, .45, -3, 0, 0, R); plane(2, .5, WM, 0, 2.65, -3, 0, 0, R);   // the window in the back wall
      O.winS = add(new THREE.PlaneGeometry(2, 1.5), M(PS1.color('#1a2436'), { unlit: true }), x0, 1.65, -3.02, q); O.night = add(new THREE.PlaneGeometry(2, 1.5), M(PS1.color('#0a0e18'), { unlit: true }), x0, 1.65, -3.2, q);
      add(box(.8, .75, .5), M(T.steel), x0 + 2.4, .375, 1.2, q); add(new THREE.SphereGeometry(.08, 5, 4), M(T.bulb, { unlit: true }), x0, 2.6, 0, q);
      O.darS = person(T.plaid, T.jeans, T.brown, 'darry'); O.triS = person(T.tee, T.jeans, T.darkHair, 'trish', { long: .4 }); O.creS = creature(); for (const p of [O.darS, O.triS, O.creS]) q.add(p.G);
      O.shards = [...Array(20)].map((_, i) => add(box(.06 + (i % 3) * .03, .05 + (i % 4) * .03, .01), M(T.shard, { unlit: true }), 0, -99, 0, q)); O.bloodS = bloodPool(q); }
    // ---- the night sky: the huge moon, it flies across with him
    { const q = g.sky, x0 = X.sky; O.moon2 = add(new THREE.CircleGeometry(12, 20), M(T.moon, { unlit: true, noFog: true }), x0, 10, -60, q); ground(100, 100, M(T.field), x0, 0, -20, q); for (const [dx, dz] of [[-15, -25], [12, -30]]) deadTree(x0 + dx, dz, 9, q, dx);
      O.creK = creature(); q.add(O.creK.G); O.darK2 = person(T.plaid, T.jeans, T.brown, 'darryS'); q.add(O.darK2.G); }
  },
  prepare(S) { S.hits = [at('L3', 'roars'), at('L9', 'chooses', .3)]; },
  shots: S => { const w = (l, x, o = 0) => at(l, x) + o, xr = X.road, xc = X.church, xk = X.cellar, xd = X.diner, xf = X.farm, xs = X.station, xy = X.sky, pm = S.O.pipeMouth;
    const tr = (t0, t1, off, look, fov, o = {}) => [[t0, .02, V(xr + 1.6 + off.x, off.y, carZ(t0) + off.z), V(xr + 1.6 + look.x, look.y, carZ(t0) + look.z), fov, o], [t0 + .02, t1 - t0 - .02, V(xr + 1.6 + off.x, off.y, carZ(t1) + off.z), V(xr + 1.6 + look.x, look.y, carZ(t1) + look.z), fov, { ...o, ease: 'linear' }]];
    return [
    [0, 1.0, V(1.5, 1.6, 2.0), V(-.2, 1.0, -2.5), 56],                                                           // up from the case on the hood: the empty road at golden hour
    [1.0, 1.6, V(2.2, 1.7, 1.2), V(4, 1.2, -20), 50, { ease: 'linear' }],
    ...tr(st('L2') - .18, w('L2', 'sister', -.1), V(10, 7, 16), V(0, .8, -3), 52),                                  // the car alone on the long road
    ...tr(w('L2', 'sister', -.1), w('L2', 'guessing', -.15), V(-.6, 1.45, -3.6), V(0, 1.2, -.1), 50, { focus: 3.4, blur: .3 }),   // through the windshield: brother and sister
    [w('L2', 'guessing', -.15), .02, V(xr - 10.5, 1.0, carZ(6.6) - 7.5), V(xr - 6, 1.3, carZ(6.6) + 2), 46, { focus: 3.5, blur: .3 }],   // the field: a scarecrow (hidden clue) as they pass
    ...tr(w('L3', 'Then', -.1), w('L3', 'roars', -.1), V(.6, 1.5, 3.2), V(-.2, 1.6, 12), 46, { focus: 6, blur: .25 }),          // out the back window: a rusted truck closing in
    ...tr(w('L3', 'roars', -.1), st('L3b') - .1, V(5.5, 1.6, .6), V(0, 1.3, 3.6), 56, { focus: 6, blur: .2 }),            // alongside: it's right on their bumper
    ...tr(st('L3b') + .9, w('L3b', 'beating', -.3), V(-.4, 1.4, -1.4), V(-3.2, .95, -6.2), 40, { focus: 5.6, blur: .3 }),          // it passes; the plate on its back doors
    ...tr(w('L3b', 'beating', -.3), st('L3c') - .1, V(-.2, 1.42, -1.45), V(-.42, 1.5, -.1), 46, { focus: 1.3, blur: .45 }),    // his grin
    ...tr(st('L3c') - .1, en('L3c') + .4, V(-3.7, 2.15, -14.0), V(-3.7, 2.0, -11.9), 40, { focus: 2, blur: .4 }),                   // what it really means: the dark cab, two glints
    [st('L4') - .1, .02, V(xc - 9, 1.6, 16), V(xc + 2, 2.5, -4), 54],                                              // the church at dusk: the truck, the man in the coat
    [w('L4', 'man', -.2), .02, V(xc + 12.5, 1.8, 6.5), V(xc + 6.0, 1.7, -1.2), 42, { focus: 9.5, blur: .25 }],
    [w('L4', 'slides', -.2), 1.6, V(xc + 9.8, 1.6, 3.6), V(pm.x, pm.y - .2, pm.z), 40, { focus: 6.4, blur: .3, ease: 'linear' }],     // the bundle into the pipe
    [st('L5') - .1, .02, V(xc + 9.6, 1.5, 3.2), V(pm.x + .3, 1.6, -1.6), 46, { focus: 5.5, blur: .2 }],                            // he has to look
    [w('L5', 'down', -.25), .02, V(xc + 8.2, 2.0, 1.8), V(pm.x, pm.y - .3, pm.z), 50, { focus: 4.5, blur: .25 }],                 // he slips, and slides down into the pipe
    [w('L6', 'Beneath', .55), .02, V(xk + .3, 1.6, 2.6), V(xk, 1.4, -2), 58],                                       // the cellar
    [w('L6', 'hundreds', -.2), 1.5, V(xk + .3, 1.65, 2.1), V(xk - 1.5, 1.9, -3.8), 60, { ease: 'linear' }],         // the walls: bodies everywhere
    [w('L6', 'stitched', -.2), .02, V(xk - 2.6, 1.0, -2.6), V(xk - 3.85, 1.0, -2.8), 42, { focus: 1.3, blur: .5 }],  // stitched in
    [st('L7') - .1, .02, V(xd + 2.0, 1.6, -.2), V(xd + 3.85, 1.55, 1.2), 48, { focus: 2.2, blur: .3 }],                // the payphone rings
    [w('L7', 'diner', -.1), .02, V(xd + 2.4, 1.6, .2), V(xd + 3.5, 1.6, 1.2), 44, { focus: 1.4, blur: .4 }],           // he answers
    [w('L7', 'song', -.2), .02, V(xd - 2.3, 1.35, -1.1), V(xd - 2.6, 1.28, -1.62), 40, { focus: .6, blur: .55 }],      // the old radio: that song
    [w('L7', 'run', -.25), .02, V(xd + 3.78, 1.64, .45), V(xd + 3.25, 1.6, 1.2), 52, { focus: .9, blur: .4 }],            // "run"
    [st('L8') - .1, .02, V(xf + .6, 1.1, 12), V(xf, 3.5, -30), 50],                                                  // night: a scarecrow under the moon
    [w('L8', 'days', -.2), 2.0, V(xf + .3, 1.4, 7), V(xf, 2.5, -20), 46, { ease: 'linear' }],
    [w('L8', 'something', -.15), .02, V(xf + .5, 2.3, 3.6), V(xf, 2.3, 0), 44, { focus: 3.6, blur: .4 }],           // its head turns
    [w('L8', 'wakes', -.1), 1.2, V(xf + .3, .6, 6), V(xf, 3.0, -2), 54, { ease: 'linear' }],                           // it steps down; the wings
    [st('L9') - .1, .02, V(xs + 2.2, 1.5, 2.2), V(xs - .5, 1.6, -1), 56],                                            // the station: it's in the room
    [w('L9', 'smells', -.1), .02, V(xs - 1.6, 1.75, .9), V(xs - .7, 1.85, -.3), 44, { focus: 1.4, blur: .45 }],        // it sniffs her
    [w('L9', 'fear', -.1), .02, V(xs - .7, 1.55, 1.2), V(xs - 1.2, 1.55, -.3), 40, { focus: 1.5, blur: .5 }],          // her fear
    [w('L9', 'spreads', -.15), .02, V(xs + .4, 1.0, 2.6), V(xs - .3, 2.2, -1.2), 64],                                   // the wings, filling the room
    [w('L9', 'chooses', -.15), .02, V(xs + 1.8, 1.6, 1.4), V(xs + .5, 1.5, -.5), 50, { focus: 2.2, blur: .3 }],         // it chooses him
    [en('L9') + .55, .02, V(xy, 1.5, 10), V(xy, 9, -60), 46],                                                        // out through the window and across the moon
    [st('L10'), 2.0, V(xy, 1.6, 12), V(xy, 9.5, -60), 40, { ease: 'linear' }],
  ]; },
  wob: (t, S) => { const cuts = sched(S).map(r => r[1]).slice(1); return Math.max(...cuts.map(c => t > c - .04 && t < c + .06 ? .6 : 0)); },
  flash: t => { const f = (c, d, k) => { const u = t - c; return u > 0 && u < d ? (1 - u / d) * k : 0; }; return Math.max(f(at('L3c', 'eating') - .05, .15, .35), f(en('L9') + .5, .15, .5)); },
  update(t, S) { if (t >= S.cutBack) t = 0;   // the closing case shot is frame 0 (the loop seam)
    const O = S.O, w = (l, x, o = 0) => at(l, x) + o, cur = where(t, S); for (const k of Object.keys(X)) O.g[k].visible = k === cur;
    const L = (amb, fog, near, far, l1, l2, l3) => { S.U.amb.value.setRGB(...amb); S.U.fogColor.value.set(fog); S.U.fogNear.value = near; S.U.fogFar.value = far; PS1.light(1, ...(l1 || [[0, -50, 0], [0, 0, 0]])); PS1.light(2, ...(l2 || [[0, -50, 0], [0, 0, 0]])); PS1.light(3, ...(l3 || [[0, -50, 0], [0, 0, 0]])); };
    const wpos = o => o.getWorldPosition(new THREE.Vector3()), tq = Math.floor(t * 12) / 12, SUN = [1.5, 1.2, .8];
    if (cur === 'hood') { S.grade = t < 1.6 ? PS1.mixGrade(PS1.GRADES.neutral, GR.road, clamp((t - .5) / 1.0)) : GR.road; L([.48, .42, .34], '#d0a272', 12, 60, [[-30, 20, 30], SUN, 120], [[0, 3, 2], [.4, .36, .3], 6]); }
    if (cur === 'road') { const xr = X.road, cz = carZ(t); S.grade = GR.road; S.flares.push({ pos: wpos(O.sun1), color: '#ffd890', size: 30, streak: .7 });
      O.car.position.set(xr + 1.6, 0, cz); O.car.userData.wheels.forEach(wh => wh.rotation.x = -cz / .36 * -1); O.truck.position.set(xr + truckX(t), 0, cz + truckOff(t)); O.truck.userData.wheels.forEach(wh => wh.rotation.x = (cz + truckOff(t)) / .5);
      O.dar.setFace(t > st('L3') ? (t > w('L3b', 'beating', -.3) && t < st('L3c') ? 'darry' : 'darryS') : 'darry'); O.tri.setFace(t > st('L3') ? 'trishS' : 'trish');
      if (t > w('L3b', 'beating', -.3) && t < st('L3c')) O.dar.head.rotation.y = .4; else O.dar.head.rotation.y = 0; O.scare.head.rotation.y = t > w('L2', 'plates') ? .5 : 0;
      L([.5, .44, .36], '#d0a272', 12, 70, [[xr - 30, 25, cz - 40], SUN, 150], [[xr + 1.6, 1.4, cz - 1], [.3, .28, .24], 3]); }
    if (cur === 'church') { const xc = X.church, pm = O.pipeMouth; S.grade = GR.church; S.flares.push({ pos: wpos(O.sun2), color: '#ffb070', size: 34, streak: .7 });
      const M0 = O.man, tS = w('L4', 'slides', -.2), k = clamp((t - tS) / 1.4); M0.G.position.set(pm.x + .9, 0, pm.z + 1.1); M0.G.rotation.y = -2.3; stand(M0); M0.pose(ARM.reach(-1), ARM.reach(1)); M0.setWings(0);
      M0.G.visible = t < st('L5') + .2; O.bun.visible = t < tS + 1.5; O.bun.position.copy(V(pm.x + .4, 1.25, pm.z + .6).lerp(V(pm.x - .1, pm.y - .3, pm.z), eio(k))); O.bun.rotation.set(0, -.6, -.55 + k * .3); if (k >= 1) O.bun.position.y -= 2 * (t - tS - 1.4);
      const dc = O.darC, tc = O.triC; dc.G.visible = tc.G.visible = t > st('L5') - .1; dc.G.position.set(pm.x + .5, 0, pm.z + .9); dc.G.rotation.y = -2.0; stand(dc); dc.pose(ARM.reach(-1), ARM.reach(1)); dc.setFace('darryS');
      const sl = clamp((t - w('L5', 'down', -.1)) / .8); if (sl > 0) { dc.G.position.set(pm.x + .5 - 1.0 * sl, lerp(0, pm.y - .4, Math.sin(Math.min(sl, .5) * Math.PI)), pm.z + .9 - .9 * sl); dc.G.rotation.set(-.9 * sl, -2.0, 0); dc.pose(ARM.up(-1), ARM.up(1)); dc.G.visible = sl < .95; }
      tc.G.position.set(pm.x + 1.3, 0, pm.z + 1.6); tc.G.rotation.y = -2.2; stand(tc); tc.pose(ARM.reach(-1), ARM.reach(1)); tc.setFace('trishS');
      L([.36, .26, .24], '#a8603a', 10, 55, [[xc - 20, 6, -40], [1.5, .9, .55], 120], [[xc + 4, 2, 2], [.4, .3, .25], 8]); }
    if (cur === 'cellar') { const xk = X.cellar, d = O.darK; S.grade = GR.cellar; d.G.position.set(xk + .5, 0, 1.4); d.G.rotation.y = Math.PI + .3 + Math.sin(t * .8) * .4; stand(d); d.pose(ARM.down(-1), ARM.reach(1)); d.setFace('darryS');
      O.torch.position.copy(wpos(d.armR.hand)); O.torch.rotation.set(0, d.G.rotation.y, 0); const tp = wpos(d.armR.hand).add(V(Math.sin(d.G.rotation.y) * 2.5, 0, Math.cos(d.G.rotation.y) * 2.5)); bleed(O.dripK, t % 1.5 + 100, 100, V(xk - 1.5, 3.2, -3.6), V(0, 0, 0));
      L([.07, .08, .06], '#040504', 3, 16, [tp.toArray(), [1.5, 1.45, 1.1], 5], [[xk + 2.5, 3.2, 2.5], [.35, .4, .3], 6]); }
    if (cur === 'diner') { const xd = X.diner; S.grade = GR.diner; const ring = t > w('L7', 'calls', -.3) && t < w('L7', 'diner', -.1); O.handset.position.set(xd + 3.72 + (ring ? Math.sin(t * 80) * .01 : 0), 1.62, 1.2);
      const d = O.darD; d.G.position.set(xd + 3.25, 0, 1.2); d.G.rotation.y = Math.PI / 2; stand(d); if (t > w('L7', 'diner', -.1)) { d.pose(ARM.down(-1), ARM.phone()); O.handset.position.copy(wpos(d.armR.hand)); } d.setFace(t > w('L7', 'run', -.3) ? 'darryS' : 'darry');
      O.triD.G.position.set(xd + 1.6, 0, .4); O.triD.G.rotation.y = 1.2; stand(O.triD); O.triD.setFace(t > w('L7', 'run', -.3) ? 'trishS' : 'trish'); O.wait.G.position.set(xd - 1.6, 0, -2.3); O.wait.G.rotation.y = 0; stand(O.wait);
      O.dial.material.uniforms.tint.value.setScalar(t > w('L7', 'song', -.3) ? .8 + .2 * Math.sin(t * 9) : .5);
      L([.3, .32, .3], '#1a2020', 5, 22, [[xd, 2.6, 0], [1.1, 1.1, 1.0], 8], [[xd + .5, 1.8, 2.6], [1.2, .3, .45], 4], [[xd - 2.6, 1.3, -1.4], [.6, .4, .2], 2.5]); }
    if (cur === 'farm') { const xf = X.farm, C0 = O.creF, k = eio(clamp((t - w('L8', 'wakes', -.1)) / .9)); S.grade = GR.night; S.flares.push({ pos: wpos(O.moon), color: '#e8ecff', size: 26, streak: .3 });
      C0.G.position.set(xf, lerp(.35, 0, k), lerp(0, .9, k)); C0.G.rotation.y = 0; stand(C0); C0.pose(k < .5 ? [V(-.24, 1.36, 0), V(-.5, 1.36, 0), V(-.78, 1.36, 0)] : ARM.reach(-1), k < .5 ? [V(.24, 1.36, 0), V(.5, 1.36, 0), V(.78, 1.36, 0)] : ARM.reach(1));
      C0.head.rotation.y = t > w('L8', 'something', -.1) ? Math.sin(clamp((t - w('L8', 'something', -.1)) / .6) * Math.PI / 2) * .7 : 0; C0.setWings(eio(clamp((t - w('L8', 'wakes')) / .9))); O.postF.visible = true;
      L([.1, .11, .17], '#06080e', 8, 60, [[xf, 10, -40], [.8, .85, 1.1], 80], [[xf, 1.5, 3], [.35, .35, .5], 8]); }
    if (cur === 'station') { const xs = X.station, C0 = O.creS, tC = w('L9', 'chooses', .3), d = O.darS, s = O.triS; S.grade = GR.station;
      s.G.position.set(xs - 1.2, 0, -.3); s.G.rotation.y = .9; stand(s); s.setFace('trishS'); d.G.position.set(xs + .9, 0, .6); d.G.rotation.y = -2.4; stand(d); d.setFace('darryS');
      C0.G.position.set(xs - .6 + (t > w('L9', 'spreads') ? .8 * eio(clamp((t - w('L9', 'spreads')) / .8)) : 0), 0, -.9); C0.G.rotation.y = t > w('L9', 'spreads') ? .4 : -.6; stand(C0); C0.head.rotation.x = t < w('L9', 'spreads') ? .45 : 0; C0.head.rotation.y = Math.sin(t * 3) * .2;
      C0.setWings(eio(clamp((t - w('L9', 'spreads', -.1)) / .7))); if (t > tC - .3) { C0.pose(ARM.reach(-1), ARM.reach(1)); d.pose(ARM.up(-1), ARM.up(1)); }
      hurt(d, hitK(t, tC)); bleed(O.bloodS, t, tC, wpos(d.head), V(-.3, 0, 0)); const brk = t > en('L9') + .2; O.winS.visible = !brk;
      O.shards.forEach((sd, i) => { const u = t - en('L9') - .2; if (u < 0 || u > 1.2) { sd.position.y = -99; return; } const r1 = Math.sin(i * 12.98) * .5 + .5, r2 = Math.sin(i * 78.2) * .5 + .5; sd.position.set(xs + (r1 - .5) * 1.8, Math.max(.02, 1.65 + (r2 - .5) * 1.2 + u * (1 - 4.9 * u)), -3.02 - u * (1 + r2 * 3)); sd.rotation.set(u * 9, u * 7 * r1, u * 5); });
      if (t > en('L9') + .1) { C0.G.position.set(xs, lerp(0, .8, clamp((t - en('L9') - .1) / .4)), lerp(-.9, -3.4, clamp((t - en('L9') - .1) / .4))); d.G.position.copy(C0.G.position).add(V(.2, .3, .3)); d.G.rotation.y = Math.PI; }
      L([.14, .15, .17], '#0a0c10', 4, 18, [[xs, 2.5, 0], [1.2, 1.2, 1.05], 6], [[xs, 1.6, -3.4], [.3, .35, .55], 5]); }
    if (cur === 'sky') { const xy = X.sky, k = clamp((t - en('L9') - .55) / 6), C0 = O.creK, d = O.darK2; S.grade = GR.night; S.flares.push({ pos: wpos(O.moon2), color: '#e8ecff', size: 30, streak: .3 });
      C0.G.position.set(xy - 9 + 18 * k, 8 + Math.sin(k * 3) * .8, -44); C0.G.rotation.set(.6, Math.PI / 2, 0); stand(C0); C0.setWings(.75 + .25 * Math.sin(t * 9)); C0.pose(ARM.reach(-1), ARM.reach(1));
      d.G.position.copy(C0.G.position).add(V(.3, -.6, .4)); d.G.rotation.set(.9, Math.PI / 2, 0); stand(d); d.pose(ARM.up(-1), ARM.up(1));
      L([.1, .11, .16], '#06080e', 10, 90, [[xy, 12, -40], [.9, .9, 1.1], 60]); }
  },
});
