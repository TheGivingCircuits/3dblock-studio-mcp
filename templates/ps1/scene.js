// __SERIES__ #__N__ — "__TITLE__" on the PS1 engine (engine/ps1.js). A small working scene: the movie case opens on a coffee table,
// the camera cranes up to a living room with a TV and a person on the couch, then cuts back to the case at the end (the loop seam).
// Replace it beat by beat. Everything is a pure function of t. Study the example episode the-cursed-tape-ps1 for a full build.
const { P, lerp, eio, eo, clamp, rng, at, st, en, V } = PS1;
const M = PS1.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, rep = PS1.rep;

// ---------- textures (tiny, on purpose) ----------
const T = {
  wall: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4b5a45'; q.fillRect(0, 0, w, h); q.fillStyle = '#58694f'; q.fillRect(0, 0, 3, h); q.fillRect(8, 0, 3, h); noise(q, w, h, r, '#1c241a', 60, .6); }),
  floor: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a3226'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1a12', 90, .8); noise(q, w, h, r, '#6a4a36', 40, .6); }),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  couch: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a1f24'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e0c10', 80, .9); }),
  tv: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2b2a30'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#45444c', 20, .6); }),
  static: tex(32, 24, (q, w, h, r) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 60 + r() * 180 | 0; q.fillStyle = `rgb(${v},${v},${v + 10})`; q.fillRect(x, y, 1, 1); } }),
  skin: PS1.color('#d6a084'), top: PS1.color('#3a5a8a'), jeans: PS1.color('#33456a'), hair: PS1.color('#3a2a1e'),
  face: tex(24, 28, (q) => { q.fillStyle = '#d6a084'; q.fillRect(0, 0, 24, 28); q.fillStyle = '#1a1a1a'; q.fillRect(6, 11, 3, 3); q.fillRect(15, 11, 3, 3); q.fillStyle = '#8a4a3a'; q.fillRect(9, 20, 6, 2); }),
};
// the case cover: an original painting, title withheld
const cover = (() => { const c = document.createElement('canvas'); c.width = 270; c.height = 380; const g = c.getContext('2d'); g.fillStyle = '#0c0d12'; g.fillRect(0, 0, 270, 380);
  g.fillStyle = '#2a3a5a'; g.fillRect(55, 110, 160, 120); g.fillStyle = '#9aa8c8'; for (let i = 0; i < 400; i++) g.fillRect(55 + Math.random() * 160, 110 + Math.random() * 120, 2, 2);
  g.fillStyle = '#e2342a'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText('?', 135, 300); g.fillStyle = '#c8c0a8'; g.font = 'bold 12px Arial'; g.fillText('MIDNIGHT VIDEO', 135, 360); return c; })();
const disc = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#a8adb4'; g.beginPath(); g.arc(32, 32, 31, 0, 6.283); g.fill(); g.fillStyle = '#060808'; g.beginPath(); g.arc(32, 32, 5, 0, 6.283); g.fill(); const t = PS1.tex(8, 8, () => {}); t.image = c; t.needsUpdate = true; return t; })();

PS1.episode({
  camcorder: false,
  open: ['L1', null, .55],   // motion from the first frames: the lid swings, then the camera cranes up
  letterbox: .06, bloom: .35,
  hud(t, S, q) {   // the burned-in title card: first 2.4 s, and back on the closed case at the end (frame 0 = last frame = thumbnail)
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - S.lidShut - .2) / .3))); if (a <= 0) return;
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
    const txt = (s, y, size, fill) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, 180, y); q.fillStyle = fill; q.fillText(s, 180, y); };
    txt('__SERIES_UPPER__', 112, 28, '#f2f0ea'); txt('#__N__', 156, 44, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 198, 17, '#ffd23a'); q.restore(); },
  build(S) { const O = S.O = {};
    add(rep(new THREE.PlaneGeometry(5, 4), 5, 4), M(T.floor), 0, 0, 0).rotation.x = -Math.PI / 2;
    for (const [x, z, ry, w] of [[0, -2, 0, 5], [-2.5, 0, Math.PI / 2, 4], [2.5, 0, -Math.PI / 2, 4]]) add(rep(new THREE.PlaneGeometry(w, 2.6), w, 2.6), M(T.wall), x, 1.3, z).rotation.y = ry;
    add(box(.9, .04, .5), M(T.wood), .4, .39, .25); for (const [x, z] of [[-.02, .05], [.82, .05], [-.02, .45], [.82, .45]]) add(box(.05, .37, .05), M(T.wood), x, .185, z);
    S.case = PS1.dvdCase(cover, disc, .4, .41, .25, 0); S.caseCam = [V(.4, 1.03, .191), V(.4, .41, .19), 40];
    add(box(1.0, .5, .5), M(T.wood), .6, .25, -1.6); add(box(.7, .55, .5), M(T.tv), .6, .78, -1.6); O.screen = add(new THREE.PlaneGeometry(.52, .4), M(T.static, { unlit: true }), .6, .8, -1.34);
    add(box(1.8, .42, .8), M(T.couch), .4, .21, 1.6); add(box(1.8, .5, .2), M(T.couch), .4, .6, 1.95);
    O.her = PS1.person({ skin: T.skin, top: T.top, legs: T.jeans, hair: T.hair, face: T.face, long: .45 }); O.her.G.position.set(.4, .02, 1.45); O.her.G.rotation.y = Math.PI;
    O.her.apply(PS1.POSE('lap', 'sit', [0, 0, 0]));
  },
  prepare(S) { S.hits = [at('L3', 'midnight')]; },
  shots: S => [   // [t0, dur, camera, look, fov|'35mm', {focus, blur, ease}] — the engine adds a gentle handheld drift
    [0, 1, V(.4, 1.3, 1.0), V(.6, .8, -1.6), '35mm'],
    [at('L2', 'television') - .3, .6, V(.6, .95, -.4), V(.6, .8, -1.6), '50mm', { focus: 1.2, blur: .4 }],
    [st('L3') - .2, .02, V(1.3, 1.25, .5), V(.4, 1.0, 1.5), '28mm', { focus: 1.4, blur: .3 }],   // her face in the TV light
    [at('L3', 'static') - .2, 1.6, V(.6, .85, -.9), V(.6, .8, -1.6), '85mm', { focus: .5, blur: .6 }],
    [st('L4') - .2, 1.2, V(-1.6, 1.6, -1.2), V(.5, .8, .6), '24mm'],   // wide: the room, the TV, her
  ],
  update(t, S) { const O = S.O;
    PS1.light(1, [.6, 1.0, -1.1], [.7, .8, 1.1].map(v => v * (.8 + .2 * Math.sin(t * 31))), 4);   // the TV's flicker
    PS1.light(2, [-1.5, 2.2, 1.0], [.5, .4, .3], 5); PS1.light(3, [2, 2.4, -1], [.15, .15, .25], 6);
    S.U.amb.value.setRGB(.12, .12, .16); S.U.fogColor.value.set('#05060a'); S.U.fogNear.value = 3; S.U.fogFar.value = 10;
    O.screen.material.uniforms.uvOff.value.set((t * 7.3) % 1, (t * 3.1) % 1);
    S.grade = PS1.mixGrade(PS1.GRADES.cold, PS1.GRADES.night, P(t, at('L3', 'midnight'), 2));
  },
});
