// STUDIO TEST 2: THE LIGHT TEST, on lib/lights.js + lib/camera.js. The lens test's person, outdoors in front of a log cabin (hand-built,
// PS1 idiom). 0–40 s: a frozen camera while the sky runs from 05:30 to 22:00 on a June day in Texas (the sun's real path: it rises
// behind the camera and sets in frame, shadows sweep, the sky goes from blue hour to gold to night). Then 20 s of practicals:
// a lantern swinging on the porch (its shadows swing with it), a TV in a dark room, headlights sweeping across the cabin, lightning.
const { V, rng, clamp, lerp, eio } = PS1; LIGHTS.use();
const M = LIGHTS.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, plane = PS1.plane, grp = PS1.group;
const T = {
  grass: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a7432'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#7a8e42', 60, .8); noise(q, w, h, r, '#3a5222', 50, .8); }),
  dirt: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7050'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a5236', 70, .8); noise(q, w, h, r, '#a88a62', 30, .6); }),
  logs: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a4a2e'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2a18'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#8a6644', 24, .6); }),
  roof: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a342e'; q.fillRect(0, 0, w, h); q.fillStyle = '#26221e'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); }),
  boards: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a5a3a'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a321e'; for (let x = 3; x < w; x += 4) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#9a7a52', 20, .6); }),
  door: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#4a2e1c'; q.fillRect(0, 0, w, h); q.fillStyle = '#2a1a10'; q.fillRect(1, 1, 6, 6); q.fillRect(1, 9, 6, 6); q.fillStyle = '#c8a040'; q.fillRect(6, 8, 1, 1); }),
  glass: PS1.color('#1a2230'), lit: PS1.color('#f0c070'), bark: PS1.color('#4a3424'), metal: PS1.color('#2a2c30'), red: PS1.color('#8a1e1a'), chrome: PS1.color('#9a9ea4'),
  pine: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#2e5a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1e3a26', 30, .9); noise(q, w, h, r, '#4a7a4a', 14, .8); }),
  skin: PS1.color('#d6a084'), coat: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a3a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a1e18', 14, .8); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#33456a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1f2c48', 14, .8); }),
  hair: tex(8, 16, (q, w, h) => { q.fillStyle = '#3a2416'; q.fillRect(0, 0, w, h); q.fillStyle = '#24160c'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  face: tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); }; px('#d6a084', 0, 0, 24, 28); px('#3a2416', 0, 0, 24, 6); px('#3a2416', 0, 6, 3, 14); px('#3a2416', 21, 6, 3, 14);
    px('#5a3a22', 5, 9, 4, 1); px('#5a3a22', 15, 9, 4, 1); px('#f4f2ec', 5, 11, 4, 2); px('#f4f2ec', 15, 11, 4, 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3); px('#8a4a3a', 9, 21, 6, 1); }),
  wall: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a7060'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a5040', 50, .6); }), carpet: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a2222', 60, .8); }),
  couch: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3a4a5a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#222c38', 70, .9); }), tv: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#2b2a30'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#45444c', 20, .6); }),
};
// the cabin faces south-east toward the camera; the camera looks north-west, where the June sun sets (azimuth ~298°)
const CABIN = V(-5.2, 0, -3), FACE = Math.atan2(5.2, 3);   // cabin front faces the camera
const PORCH = V(CABIN.x + Math.sin(FACE) * 3.55, 0, CABIN.z + Math.cos(FACE) * 3.55), TVR = V(60, 0, 0);
const TIMES = { sky: [0, 40], lantern: [40, 45], tv: [45, 50], headlights: [50, 55], storm: [55, 60] };
const seg = t => Object.entries(TIMES).find(([, [a, b]]) => t >= a && t < b)?.[0] || 'storm';
const STRIKES = [55.6, 57.2, 58.9];
function pine(x, z, h) { add(cyl(.12, .16, h * .3, 5), M(T.bark), x, h * .15, z); for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry(1.2 - k * .3, h * .45, 6), M(T.pine, { wind: .05 }), x, h * (.35 + k * .2), z); }
const clock = t => { const h = t < 40 ? 5.5 + (22 - 5.5) * t / 40 : 22; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor(h % 1 * 60)).padStart(2, '0')}`; };

CAM.episode({
  hud(t, S, q) { q.save(); q.textBaseline = 'middle'; q.lineJoin = 'round'; const txt = (s, x, y, size, fill, align = 'left') => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.textAlign = align; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, x, y); q.fillStyle = fill; q.fillText(s, x, y); };
    const sg = seg(t), st = S.light || {}; txt('LIGHT TEST', 16, 36, 22, '#f2f0ea');
    if (sg === 'sky') { const sun = st.sun || {}; txt(clock(t), 16, 64, 26, '#ffd23a'); txt(`sun ${sun.elevation != null ? sun.elevation.toFixed(1) : '–'}° high · ${sun.kelvin ? Math.round(sun.kelvin) + ' K' : 'down'} · az ${sun.azimuth != null ? Math.round(sun.azimuth) : '–'}°`, 16, 90, 11, '#e8e4dc'); txt('TEXAS · 21 JUNE', 16, 106, 11, '#e8e4dc'); }
    else txt({ lantern: 'PRACTICAL: LANTERN, SWINGING', tv: 'PRACTICAL: TV IN A DARK ROOM', headlights: 'PRACTICAL: HEADLIGHTS', storm: 'PRACTICAL: LIGHTNING' }[sg], 16, 64, 14, '#ffd23a');
    q.restore(); },
  build(S) { const O = S.O;
    add(plane(70, 70, 35, 35, 1), M(T.grass), 0, 0, 0).rotation.x = -Math.PI / 2; LIGHTS.dome();
    add(plane(2.2, 9, 2, 6, .6), M(T.dirt), -2, .01, 1.5).rotation.set(-Math.PI / 2, 0, -.9);   // the drive
    // the cabin: logs, a roof, a porch with posts, a door, two windows (lit from inside at night)
    const C = O.cabin = grp(CABIN.x, 0, CABIN.z); C.rotation.y = FACE; C.name = 'cabin';
    add(box(4.4, 2.6, 3.4), M(T.logs), 0, 1.3, 0, C).name = 'cabin walls'; const roof = add(cyl(2.6, 2.6, 4.9, 3), M(T.roof), 0, 3.25, 0, C); roof.rotation.z = Math.PI / 2; roof.scale.set(.55, 1, 1); roof.name = 'roof';
    add(box(4.6, .14, 1.4), M(T.boards), 0, .32, 2.4, C).name = 'porch'; add(box(4.6, .08, 1.6), M(T.roof), 0, 2.45, 2.45, C).name = 'porch roof';
    for (const x of [-2.15, 2.15]) add(box(.14, 2.15, .14), M(T.logs), x, 1.37, 3.05, C).name = 'porch post';
    add(box(.9, 1.9, .05), M(T.door), .3, 1.3, 1.72, C); O.windows = [-1.4, 1.5].map(x => add(box(.8, .7, .04), M(T.glass), x, 1.5, 1.72, C)); O.winLit = M(T.lit, { unlit: true, glow: 0 }); O.winDark = O.windows[0].material;
    add(box(.6, .5, .5), M(T.boards), -1.6, .6, 2.6, C).name = 'crate';
    // the lantern hangs from the porch roof; a hook, a little box with a glowing flame (the practical swings it)
    O.lantern = add(box(.12, .18, .12), M(T.lit, { unlit: true, glow: 0 }), 0, -99, 0); O.lantern.name = 'lantern'; O.lantern.userData.fx = 'glow'; C.updateMatrixWorld(true); const HOOK = C.localToWorld(V(1.1, 2.4, 3.0));
    const r = rng(11); for (let i = 0; i < 26; i++) { const a = r() * 6.283, d = 13 + r() * 18, x = Math.cos(a) * d, z = Math.sin(a) * d - 6; if (z > 6) continue; pine(x, z, 5 + r() * 5); }
    for (let i = 0; i < 6; i++) add(box(.1, 1, .1), M(T.logs), -9 + i * 1.6, .5, 2.5).name = 'fence';
    // the person on the porch step, facing the camera
    O.man = PS1.person({ skin: T.skin, top: T.coat, legs: T.jeans, hair: T.hair, face: T.face, long: .4 }); O.man.G.position.copy(PORCH); O.man.G.rotation.y = FACE; CAM.mark('man', O.man); LIGHTS.blob(O.man.G, .35);
    // a car for the headlights: a box body, a cabin, two seen lamps
    const car = O.car = grp(0, 0, -99); car.name = 'car'; add(box(1.8, .7, 4.2), M(T.red), 0, .6, 0, car); add(box(1.6, .6, 2), M(T.glass), 0, 1.2, -.2, car); for (const [x, z] of [[-.8, 1.3], [.8, 1.3], [-.8, -1.3], [.8, -1.3]]) add(cyl(.32, .32, .25, 8), M(T.metal), x, .32, z, car).rotation.z = Math.PI / 2;
    add(box(1.7, .12, .1), M(T.chrome), 0, .45, 2.12, car); LIGHTS.blob(car, 1.4, .6);
    // the TV room (far away, sealed): carpet, walls, a couch, the TV whose screen is a practical
    add(plane(5, 5, 6, 6, .3), M(T.carpet), TVR.x, 0, TVR.z).rotation.x = -Math.PI / 2; add(plane(5, 5, 4, 4, .5), M(T.wall), TVR.x, 2.6, TVR.z).rotation.x = Math.PI / 2;
    for (const [x, z, ry] of [[0, -2.5, 0], [0, 2.5, Math.PI], [-2.5, 0, Math.PI / 2], [2.5, 0, -Math.PI / 2]]) add(plane(5, 2.6, 6, 3, .35), M(T.wall), TVR.x + x, 1.3, TVR.z + z).rotation.y = ry;
    add(box(1.1, .5, .5), M(T.boards), TVR.x, .25, TVR.z - 2.1); add(box(.8, .62, .55), M(T.tv), TVR.x, .81, TVR.z - 2.1); O.screen = add(new THREE.PlaneGeometry(.56, .42), M(PS1.color('#9ab4e8'), { unlit: true, glow: 0 }), TVR.x - .04, .83, TVR.z - 1.82);
    add(box(2, .45, .85), M(T.couch), TVR.x, .225, TVR.z + 1.2); add(box(2, .56, .2), M(T.couch), TVR.x, .66, TVR.z + 1.55);   // a 0.45 m seat
    O.viewer = PS1.person({ skin: T.skin, top: T.coat, legs: T.jeans, hair: T.hair, face: T.face, long: .4 }); O.viewer.G.position.set(TVR.x - .2, PS1.seatY(.45), TVR.z + 1.05); O.viewer.G.rotation.y = Math.PI; CAM.mark('viewer', O.viewer);
    // seated: PS1.seatY lowers the body so the hips rest on the 0.45 m seat and the feet on the floor
    O.viewer.apply({ ...PS1.POSE('lap', 'sit'), legL: PS1.LEGS.sit(-1, .45), legR: PS1.LEGS.sit(1, .45) });
    CAM.mark('cabin', V(CABIN.x, 1.4, CABIN.z)); CAM.mark('tv', V(TVR.x, .83, TVR.z - 1.82)); CAM.mark('carmark', car);
    // ---------- light ----------
    LIGHTS.sky({ date: '2026-06-21', place: 'texas', time: t => t < 40 ? 5.5 + 16.5 * t / 40 : 22, weather: t => t >= 55 ? 'storm' : t >= 45 && t < 50 ? 'night' : t >= 40 ? 'moon' : 'clear', moonAz: 150, moonEl: 32, shadowSize: 9, ground: '#6a6a40', interior: t => t >= 45 && t < 50 ? -6 : 0 });
    LIGHTS.atmosphere({ haze: t => t >= 50 && t < 55 ? .03 : null }); LIGHTS.dust({ min: [-6, .2, -2], max: [2, 3, 4], n: 220, strength: .8 });
    LIGHTS.practical({ name: 'lantern', fixture: 'lantern', at: [HOOK.x, HOOK.y, HOOK.z], swing: { len: .42, amp: .55, period: 1.7 }, stops: .3, aim: 'man.chest', shadow: true, mesh: O.lantern, on: TIMES.lantern, glowMesh: O.lantern, glowAt: 2.5 });
    LIGHTS.practical({ name: 'tv', fixture: 'tv', at: [TVR.x, .85, TVR.z - 1.6], aim: 'viewer.face', stops: 0, on: TIMES.tv, glowMesh: O.screen, glowAt: 1, beam: 150, haze: false });
    for (const s of [-1, 1]) LIGHTS.practical({ name: 'headlight' + s, fixture: 'headlights', seen: true, size: .14, stops: -.4, on: TIMES.headlights, at: t => O.car.localToWorld(V(s * .62, .62, 2.15)), aim: t => O.car.localToWorld(V(s * .4, .2, 12)), beamLen: 12 });
    LIGHTS.practical({ name: 'lightning', fixture: 'lightning', at: [8, 25, 6], aim: 'cabin', stops: .2, strikes: STRIKES, on: TIMES.storm });
    LIGHTS.light({ name: 'moon fill', fixture: 'bounce', kelvin: 8000, stops: -4.2, at: [2, 6, 6], aim: 'man.chest', on: [40, 60], scene: 'out' });
  },
  shadowCenter: [-4, 1, -2],
  shots(S) { return [
    { id: 'SKY', at: 0, dur: 40, lens: '18mm', stop: 'f/5.6', pos: [3.4, 1.55, 4.6], look: [-4.6, 1.9, -1.6], subject: 'man', expose: 'auto', meter: 'incident', autoMax: 3, exposure: -.3, scene: 'out', note: 'frozen camera: 05:30 → 22:00, auto-exposed on his face (at most 4 stops of gain at night)' },
    { id: 'LANTERN', at: 40, dur: 5, lens: '24mm', stop: 'f/2', pos: [PORCH.x + Math.sin(FACE) * 3 - Math.cos(FACE) * 1.1, 1.45, PORCH.z + Math.cos(FACE) * 3 + Math.sin(FACE) * 1.1], look: [PORCH.x + Math.cos(FACE) * .5, 1.45, PORCH.z - Math.sin(FACE) * .5], subject: 'man', focus: 'man.eyes', handheld: 'calm', nd: 2, exposure: 0, scene: 'out', note: 'the lantern swings; its shadows swing with it' },
    { id: 'TV', at: 45, dur: 5, lens: '28mm', stop: 'f/2', pos: [TVR.x + 1.5, 1.2, TVR.z - .9], look: [TVR.x - .25, .95, TVR.z + 1.0], subject: 'viewer', focus: 'viewer.face', nd: 2, exposure: -.6, scene: 'tv', note: 'a TV in a dark room' },
    { id: 'HEAD', at: 50, dur: 5, lens: '18mm', stop: 'f/2.8', pos: [3.4, 1.55, 4.6], look: [-4.6, 1.5, -1.6], subject: 'man', nd: 1, exposure: -.6, scene: 'out', note: 'headlights sweep across the cabin' },
    { id: 'STORM', at: 55, dur: 5, lens: '24mm', stop: 'f/4', pos: [2.2, 1.6, 4.4], look: [-4.6, 1.6, -2.2], subject: 'man', exposure: 0, scene: 'out', note: 'lightning' },
  ]; },
  update(t, S, sh) { const O = S.O, sg = seg(t), night = t >= 33;
    O.windows.forEach(w => w.material = night ? O.winLit : O.winDark); O.winLit.uniforms.glow.value = sg === 'storm' ? -1 : -.5;
    O.man.head.rotation.set(Math.sin(t * .7) * .03, Math.sin(t * .45) * .08, 0); O.man.pose(PS1.ARMS.down(-1), PS1.ARMS.down(1));
    // the car: behind the camera, turning in, so only its beams sweep from right to left across the cabin and the man
    const u = eio(clamp((t - 50) / 5)), cx = 6.5 - 3 * u, cz = 10 - 1.5 * u; O.car.position.set(cx, 0, cz); O.car.rotation.y = Math.atan2(CABIN.x - cx, CABIN.z - cz) + lerp(-.42, .42, u); if (sg !== 'headlights') O.car.position.y = -99;
    O.screen.material.uniforms.tint.value.setRGB(...[[.7, .8, 1], [.9, .9, .95], [.5, .7, 1], [1, .85, .7]][((Math.floor(t * 2.5) % 4) + 4) % 4]);
    if (sg !== 'lantern') O.lantern.position.y = -99; },
});
