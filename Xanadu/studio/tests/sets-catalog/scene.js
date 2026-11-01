// STUDIO TEST: THE SETS CATALOG. Rooms (open front wall, seen from the doorway side), vehicles (normal and wrecked), buildings, a country road.
const { V } = PS1; LIGHTS.use(); const M = LIGHTS.mat;
const ROOMS = SETS.ROOMS, VEH = ['van', 'pickup', 'sedan', 'wagon', 'police', 'bus', 'motorbike'], BLD = SETS.BUILDINGS, LIST = [];
CAM.episode({
  hud(t, S, q) { const it = LIST[Math.min(LIST.length - 1, Math.floor(t))]; if (!it) return; q.save(); q.font = 'bold 16px Arial'; q.textAlign = 'center'; q.lineWidth = 4; q.strokeStyle = '#000'; q.fillStyle = '#ffd23a'; q.strokeText(it.label, 180, 40); q.fillText(it.label, 180, 40); q.restore(); },
  build(S) { PS1.add(PS1.plane(900, 900, 60, 60, 4), M(SETS.T.grass), 0, -.01, 0).rotation.x = -Math.PI / 2;
    ROOMS.forEach((k, i) => { const x = i * 20, R = SETS.room(k, { at: [x, 0, 0], open: 'front', lights: false }); SETS.dress(R, [], [{ pos: [x, 1.6, R.d / 2 + 3], look: [x, 1, 0] }], 7);
      LIST.push({ label: `ROOM: ${k}`, pos: [x + R.w * .15, 1.65, R.d / 2 + (k === 'diner' ? 4.5 : 3.2)], look: [x, .9, -R.d * .15], lens: '18mm' }); });
    VEH.forEach((k, i) => { for (const w of [0, 1]) { const x = i * 14, z = 60 + w * 10; SETS.vehicle(k, { at: [x, 0, z], ry: .6, wrecked: w ? 3 : 0 }); LIST.push({ label: `VEHICLE: ${k}${w ? ' (wrecked)' : ''}`, pos: [x - (k === 'bus' ? 9 : 5), 1.5, z - (k === 'bus' ? 8 : 4.5)], look: [x, .8, z], lens: '28mm' }); } });
    BLD.forEach((k, i) => { const x = i * 40, z = 140; SETS.building(k, { at: [x, 0, z] }); LIST.push({ label: `BUILDING: ${k}`, pos: [x + 9, 2.2, z + (k === 'motel' ? 32 : 22)], look: [x, 3, z], lens: '24mm' }); });
    SETS.countryRoad({ x: 0, z: -150, len: 120, farm: true, woods: 30 }); LIST.push({ label: 'COUNTRY ROAD (with a farm)', pos: [2.5, 1.7, -110], look: [-2, 1.5, -150], lens: '24mm' });
    SETS.corn(PS1.scene, [30, 50, -170, -140], 3); LIST.push({ label: 'CORNFIELD', pos: [40.4, 1.7, -136], look: [40.4, 1.2, -160], lens: '24mm' });
    LIGHTS.sky({ time: '16:30', date: '1973-08-18', place: 'texas', skylight: -1.2, shadowSize: 30 }); LIGHTS.atmosphere({ haze: .004, color: '#d0b892' }); },
  shots: S => LIST.map((it, i) => ({ id: `C${String(i + 1).padStart(2, '0')}`, at: i, dur: 1, lens: it.lens, stop: 'f/5.6', pos: it.pos, look: it.look, subject: it.look })),
  update(t, S) { SETS.tick(t, S); },
});
