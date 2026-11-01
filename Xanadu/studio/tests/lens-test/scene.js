// STUDIO TEST 1: THE LENS TEST, on lib/camera.js + lib/lights.js. One dressed room, hand-built in the PS1 idiom (tiny textures, boxes,
// a box person): the person stands 2 m from the camera, a table lamp 1 m away, the window 6 m away with afternoon sun coming through it.
// Every lens at f/1.4, f/4 and f/11 from the same camera position, 1.5 s each, focused on the person's eyes; then a focus pull on the
// 85 mm (window → person → the lamp's distance) and back to the opening frame. The slate on screen names the lens, the stop and the depth of field.
const { V, rng, clamp, lerp, eio } = PS1; LIGHTS.use();
const M = LIGHTS.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, plane = PS1.plane;
const T = {
  wall: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a8270'; q.fillRect(0, 0, w, h); q.fillStyle = '#958d7a'; q.fillRect(0, 0, w, 2); q.fillRect(0, 8, w, 2); noise(q, w, h, r, '#5e5848', 50, .6); }),
  floor: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a4a32'; q.fillRect(0, 0, w, h); q.fillStyle = '#4e3422'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#8a6446', 40, .6); }),
  ceil: PS1.color('#5a564e'), wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  frame: PS1.color('#d8d2c2'), shade: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#e8d6a8'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#c8b080', 10, .7); }), brass: PS1.color('#a8823a'),
  skin: PS1.color('#d6a084'), coat: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a3a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a1e18', 14, .8); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#33456a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1f2c48', 14, .8); }),
  hair: tex(8, 16, (q, w, h) => { q.fillStyle = '#3a2416'; q.fillRect(0, 0, w, h); q.fillStyle = '#24160c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  face: tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); }; px('#d6a084', 0, 0, 24, 28); px('#3a2416', 0, 0, 24, 6); px('#3a2416', 0, 6, 3, 14); px('#3a2416', 21, 6, 3, 14);
    px('#5a3a22', 5, 9, 4, 1); px('#5a3a22', 15, 9, 4, 1); px('#f4f2ec', 5, 11, 4, 2); px('#f4f2ec', 15, 11, 4, 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3); px('#8a4a3a', 9, 21, 6, 1); }),
  grass: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a6a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a8a3e', 60, .8); noise(q, w, h, r, '#2e4a1e', 50, .8); }),
  pine: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#2e5a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1e3a26', 30, .9); noise(q, w, h, r, '#4a7a4a', 14, .8); }), bark: PS1.color('#4a3424'),
  chart: tex(16, 16, (q) => { for (let y = 0; y < 16; y += 2) for (let x = 0; x < 16; x += 2) { q.fillStyle = (x + y) % 4 ? '#f0ece0' : '#1a1a1a'; q.fillRect(x, y, 2, 2); } }),
};
const LENSES = ['14mm', '18mm', '24mm', '28mm', '35mm', '50mm', '85mm', '135mm', '200mm', '100mm-macro', '40mm-anamorphic', 'vintage-zoom'], STOPS = ['f/1.4', 'f/4', 'f/11'];
const CAMPOS = [0, 1.52, 0], LAMP = V(.24, .92, -1), WIN = V(-.6, 1.5, -6);
function pine(x, z, h) { add(cyl(.1, .14, h * .3, 5), M(T.bark), x, h * .15, z); for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry(1.1 - k * .28, h * .45, 6), M(T.pine, { wind: .03 }), x, h * (.35 + k * .2), z); }

CAM.episode({
  hud(t, S, q) { const sh = S.shot; if (!sh) return; q.save(); q.textBaseline = 'middle'; q.lineJoin = 'round';
    const txt = (s, x, y, size, fill, align = 'left') => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.textAlign = align; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, x, y); q.fillStyle = fill; q.fillText(s, x, y); };
    if (sh.id === 'HEAD' || sh.id === 'END') { txt('LENS TEST', 180, 92, 34, '#f2f0ea', 'center'); txt('SUPER 35 · 12 LENSES · 3 STOPS', 180, 128, 14, '#ffd23a', 'center'); txt('person 2 m · lamp 1 m · window 6 m', 180, 150, 13, '#e8e4dc', 'center'); }
    else { const p = S.pose, N = sh.N, d = CAM.dof(p.focus, p.f, N, sh.B.coc); txt(sh.lensName.toUpperCase(), 16, 40, 24, '#f2f0ea'); txt(`f/${N}`, 16, 66, 20, '#ffd23a');
      txt(`focus ${p.focus.toFixed(2)} m · sharp ${d.near.toFixed(2)}–${isFinite(d.far) ? d.far.toFixed(2) + ' m' : '∞'}`, 16, 88, 11, '#e8e4dc'); txt(`${p.fov.toFixed(1)}° vertical`, 16, 104, 11, '#e8e4dc'); }
    q.restore(); },
  build(S) { const O = S.O;
    // the room: 5 m wide, 8 m deep, 2.8 m high; the back wall (z = −6) has a window 1.2 x 1.4 m, outside is a sunny meadow
    add(plane(5, 8.5, 6, 10, .3), M(T.floor), 0, 0, -1.75).rotation.x = -Math.PI / 2; add(plane(5, 8.5, 5, 9, .5), M(T.ceil), 0, 2.8, -1.75).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) add(plane(8.5, 2.8, 8, 3, .35), M(T.wall), s * 2.5, 1.4, -1.75).rotation.y = -s * Math.PI / 2;
    add(plane(5, 2.8, 5, 3, .35), M(T.wall), 0, 1.4, 2.5).rotation.y = Math.PI;
    for (const [x0, x1, y0, y1] of [[-2.5, -1.2, 0, 2.8], [0, 2.5, 0, 2.8], [-1.2, 0, 0, .8], [-1.2, 0, 2.2, 2.8]]) add(plane(x1 - x0, y1 - y0, (x1 - x0) * 1.2, (y1 - y0) * 1.2, .35), M(T.wall), (x0 + x1) / 2, (y0 + y1) / 2, -6);
    for (const [x, y, w, h] of [[-1.2, 1.5, .06, 1.46], [0, 1.5, .06, 1.46], [-.6, .8, 1.26, .06], [-.6, 2.2, 1.26, .06], [-.6, 1.5, .04, 1.4], [-.6, 1.5, 1.2, .04]]) add(box(w, h, .1), M(T.frame), x, y, -6).name = 'window frame';
    for (const [x, z, w, d] of [[0, 2.48, 5, .04], [-2.48, -1.75, .04, 8.5], [2.48, -1.75, .04, 8.5]]) add(box(w, .12, d), M(T.wood), x, .06, z);
    add(plane(.5, .5, 1, 1, .5), M(T.chart), 1.6, 1.5, -5.98).name = 'chart';   // a focus chart on the back wall
    add(box(.9, .75, .45), M(T.wood), 1.7, .375, -5.6).name = 'sideboard';
    // outside: a meadow, a fence, pines, the sky
    add(plane(60, 40, 30, 20, 2), M(T.grass), 0, -.01, -26.5).rotation.x = -Math.PI / 2; for (let i = 0; i < 9; i++) add(box(.08, 1, .08), M(T.wood), -4 + i, .5, -10);
    add(box(9, .07, .05), M(T.wood), 0, .8, -10); const r = rng(5); for (let i = 0; i < 9; i++) pine(-12 + i * 3 + r() * 1.5, -16 - r() * 8, 5 + r() * 3); LIGHTS.dome();
    // the lamp at 1 m: a stool, a stem, a shade with a bulb inside (a practical, seen)
    add(cyl(.18, .18, .05, 8), M(T.wood), LAMP.x, .44, LAMP.z); for (const [dx, dz] of [[-.11, -.11], [.11, -.11], [-.11, .11], [.11, .11]]) add(box(.04, .42, .04), M(T.wood), LAMP.x + dx, .21, LAMP.z + dz);
    add(cyl(.07, .09, .05, 6), M(T.brass), LAMP.x, .49, LAMP.z); add(cyl(.015, .015, .32, 4), M(T.brass), LAMP.x, .67, LAMP.z); O.shade = add(cyl(.1, .17, .2, 7, true), M(T.shade, { side: THREE.DoubleSide, glow: .2, unlit: true }), LAMP.x, .92, LAMP.z); O.shade.name = 'lamp shade';
    // the person at 2 m, facing the camera
    O.her = PS1.person({ skin: T.skin, top: T.coat, legs: T.jeans, hair: T.hair, face: T.face, long: .4 }); O.her.G.position.set(0, 0, -2); CAM.mark('her', O.her); LIGHTS.blob(O.her.G, .35);
    CAM.mark('lamp', LAMP); CAM.mark('window', WIN); CAM.mark('chart', V(1.6, 1.5, -5.98));
    // light: afternoon sun through the window (with a shadow map, so it only lands where the window lets it), a Rembrandt key on her,
    // the lamp as a seen practical, a little haze so the sunbeam and the dust in it show
    LIGHTS.sky({ time: '16:00', weather: 'clear', sun: { azimuth: 8, elevation: 30 }, interior: -1.2, shadowSize: 5 });
    LIGHTS.atmosphere({ haze: .022 }); LIGHTS.godray({ at: [-.6, 1.5, -6], w: 1.2, h: 1.4, normal: [0, 0, 1], len: 6, strength: 1 }); LIGHTS.dust({ min: [-1.6, .1, -6], max: [.6, 2.4, -2.4], n: 320 });
    LIGHTS.setup('rembrandt', { subject: 'her', facing: 0, stops: 0 }); LIGHTS.light({ name: 'room bounce', fixture: 'bounce', kelvin: 5200, stops: -1.8, at: [0, 2.4, -3], aim: [0, 0, -3] });
    LIGHTS.practical({ name: 'lamp', fixture: 'table-lamp', at: [LAMP.x, .92, LAMP.z], stops: -.5, aim: 'her.chest', glowMesh: O.shade, glowAt: .2 });
  },
  shadowCenter: [0, 1, -3.5],
  shots(S) { const look = 'her.eyes', list = [{ id: 'HEAD', at: 0, dur: 1.5, lens: '24mm', stop: 'f/4', pos: CAMPOS, look, subject: 'her', focus: 'her.eyes', note: 'the room on a 24 mm' }]; let t = 1.5;
    LENSES.forEach((l, i) => STOPS.forEach((s, j) => { list.push({ id: `L${String(i + 1).padStart(2, '0')}${'abc'[j]}`, at: t, dur: 1.5, lens: l, stop: s, pos: CAMPOS, look, subject: 'her', focus: 'her.eyes', note: `${l} at ${s}` }); t += 1.5; }));
    // the pull: the window behind her, her eyes, then the lamp's distance (she goes soft); the 85 mm can't hold the lamp in frame too
    list.push({ id: 'PULL', at: t, dur: 3.5, lens: '85mm', stop: 'f/1.4', pos: [.5, 1.3, .7], look: [-.36, 1.52, -3.9], subject: 'her', focus: 'window', pull: [['her.eyes', .6, .8], ['lamp', 2.1, .9]], note: 'the focus pull: window (6 m) → eyes (2 m) → the lamp distance (1 m)' }); t += 3.5;
    list.push({ id: 'END', at: t, dur: 60 - t, lens: '24mm', stop: 'f/4', pos: CAMPOS, look, subject: 'her', focus: 'her.eyes', note: 'back to the opening frame (the loop)' }); return list; },
  update(t, S) { const H = S.O.her; H.head.rotation.set(Math.sin(t * .7) * .03, Math.sin(t * .45) * .06, 0); H.torso.scale.y = 1 + Math.sin(t * 1.6) * .006;
    H.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1)); },
});
