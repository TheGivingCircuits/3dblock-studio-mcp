// WORLD: BIOME LAYOUTS. Pure functions (no three.js, no page): seed + options → a layout, the plain JSON list of what goes where. They run in a
// scene page (WORLD.biome) and in node (save-world.mjs writes a layout to worlds/<name>.json so it never has to be generated again).
// Biomes: suburb (a street of houses, lawns, driveways, fences, trees, streetlights), city (a four-lane street lined with apartments, row
// houses and a corner store, a traffic-light crossing, parked cars, street furniture), woods (a cabin in a clearing, a dirt track, a forest
// ring, a tyre swing, a fire pit), countryside (the sets country road with a farm, a trailer and its fences).
// Every entry has a uid ('house-3', 'tree-12'...) so a scene can find it (world.get('house-3')) or change it (WORLD.load(name, { edit })).
(function (root) {
const rng = seed => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, list) => list[Math.floor(r() * list.length)], wpick = (r, pairs) => { let s = pairs.reduce((a, p) => a + p[1], 0), u = r() * s; for (const [v, w] of pairs) { if ((u -= w) <= 0) return v; } return pairs[0][0]; };
const R2 = v => Math.round(v * 100) / 100;
// footprints of the house presets (w × d, porch depth, garage side and width): kept in step with houses.js
const FOOT = { 'small-house': { w: 7, d: 6, porch: 1.6 }, ranch: { w: 11, d: 7.5, porch: 0, garage: 1, gw: 3.6 }, 'two-story': { w: 9, d: 7.5, porch: 2.2 }, 'big-house': { w: 14, d: 9, porch: 2.2, garage: -1, gw: 6.2 },
  cabin: { w: 6.5, d: 5.5, porch: 1.8 }, 'a-frame': { w: 6, d: 7, porch: 0 }, trailer: { w: 14, d: 4.2, porch: 0 }, 'row-house': { w: 5.6, d: 11, porch: 0 }, apartments: { w: 16, d: 12, porch: 0 }, 'corner-store': { w: 10, d: 10, porch: 0 }, shed: { w: 3, d: 2.4, porch: 0 } };
const PAINTS = ['white', 'cream', 'sage', 'sky', 'butter', 'mint', 'pink', 'tan', 'slate', 'charcoal', 'olive', 'teal'];
const L = {};
L.FOOT = FOOT;
// ---- SUBURB: one street along x, lots on both sides (north side faces +z, south side faces -z)
L.suburb = (seed = 1, o = {}) => { const r = rng(seed), n = o.lots || 5, lotW = o.lotW || 19, len = n * lotW + 24, P = [], E = 3.7 + .16 + 1.2 + 1.5, add = (type, e) => { const uid = `${e.uidBase || type}-${P.filter(p => p.type === type).length + 1}`; delete e.uidBase; P.push({ uid, type, ...e }); return uid; };
  add('ground', { rect: [-len / 2 - 20, len / 2 + 20, -75, 75], tex: 'lawn' }); add('street', { kind: 'suburb', from: [-len / 2 - 10, 0], to: [len / 2 + 10, 0], seed });
  const pool = o.houses || [['ranch', 3], ['two-story', 3], ['small-house', 2], ['big-house', o.rich ? 4 : 1.5]];
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const preset = wpick(r, pool), F = FOOT[preset], cx = -len / 2 + 12 + lotW * (i + .5) + (s > 0 ? lotW * .35 : 0), set = (o.setback || 7) + r() * 2, front = E + set + F.porch, cz = s * (front + F.d / 2), ry = s > 0 ? Math.PI : 0;
    const paint = o.paint || pick(r, PAINTS), hs = Math.floor(r() * 1e6), xs = s > 0 ? -1 : 1;
    const huid = add('house', { preset, at: [R2(cx), 0, R2(cz)], ry, paint, seed: hs, garageO: F.garage ? { drive: R2(front - 3.96), w: F.gw } : undefined });
    // the walk to the front door (houses with no garage), the mailbox at the curb, bins on bin day
    const gx = F.garage ? cx + xs * F.garage * (F.w / 2 + F.gw / 2) : cx; if (!F.garage) add('driveway', { from: [R2(cx), R2(s * (E - .2))], to: [R2(cx), R2(s * (front - .1))], width: 1.2 });
    add('item', { id: 'mailbox', at: [R2(gx + xs * (F.garage ? 2.2 : 1.4)), 0, R2(s * (3.86 + .5))], ry: s > 0 ? Math.PI : 0 });
    if (F.garage && r() < .6) add('item', { id: r() < .7 ? 'trash-bin' : 'recycling-bin', at: [R2(gx - xs * 1.3), 0, R2(s * (E + .8))], ry: ry + (r() - .5) * .3, physics: false });
    // trees: the front lawn and the back yard
    const ft = 1 + (r() < .5 ? 1 : 0); for (let k = 0; k < ft; k++) add('tree', { kind: r() < .8 ? 'live' : 'pine', at: [R2(cx - xs * (F.w / 2 - 1 - k * 4) * (F.garage ? -1 : 1) + (r() - .5) * 2), R2(s * (E + 3 + r() * 2))], h: R2(5 + r() * 3), seed: hs + k });
    const back = s * (front + F.d + 2), rear = s * (front + F.d + 14); for (let k = 0; k < 2 + (r() < .5 ? 1 : 0); k++) add('tree', { kind: r() < .7 ? 'live' : 'pine', at: [R2(cx + (r() - .5) * (lotW - 4)), R2(rear - s * (1.5 + r() * 2))], h: R2(6 + r() * 4), seed: hs + 10 + k });
    // the back fence: sides from mid-house to the rear line, and the rear line, a gate on one side
    const fk = wpick(r, [['privacy', 5], ['chainlink', 2], ['picket', 2]]), x0 = cx - lotW / 2 + .3, x1 = cx + lotW / 2 - .3, zm = s * (front + F.d * .5);
    add('fence', { fence: fk, path: [[R2(x0), R2(zm)], [R2(x0), R2(rear)], [R2(x1), R2(rear)], [R2(x1), R2(zm)]], gate: { run: 0, u: .2, w: 1.0 }, seed: hs });
    // yard life: some of each, from the seed
    if (r() < .4) add('swing-set', { at: [R2(cx + (r() - .5) * 5), 0, R2(back + s * 4)], ry: r() * .6 });
    if (r() < .5) add('item', { id: 'grill', at: [R2(cx + F.w * .3), 0, R2(back - s * .3)], ry: r() * 6 });
    if (r() < .5) for (let k = 0; k < 2; k++) add('item', { id: 'lawn-chair', at: [R2(cx - 1 + k * 1.1), 0, R2(back + s * 1.4)], ry: ry + Math.PI + (r() - .5) * .6, color: pick(r, ['#2a7a5a', '#c84a3a', '#3a5a9a']) });
    if (r() < .3) add('item', { id: 'doghouse', at: [R2(x1 - 1.5), 0, R2(rear - s * 2)], ry: ry + Math.PI, color: pick(r, ['#8a2a1e', '#5a6a8a', '#7a5a3a']) });
    if (r() < .25) add('clothesline', { from: [R2(cx - 3), 1.9, R2(back + s * 6)], to: [R2(cx + 3), 1.9, R2(back + s * 6)] });
    if (r() < .5) add('item', { id: r() < .5 ? 'planter' : 'garden-gnome', at: [R2(cx + xs * 2.2), 0, R2(s * (front - F.porch - 1.4))], ry });
    if (F.garage && r() < .35) add('item', { id: 'basketball-hoop', at: [R2(gx + xs * (F.gw / 2 + .4)), 0, R2(s * (front - F.porch - 2))], ry: ry + Math.PI });
    if (r() < .25) add('item', { id: 'tricycle', at: [R2(gx - xs * .6), 0, R2(s * (front - F.porch - 3))], ry: r() * 6, physics: false });
    add('item', { id: 'hose-reel', at: [R2(cx - xs * (F.w / 2 - .6)), 0, R2(s * (front - F.porch - .5))], ry: ry + Math.PI }); }
  // streetlights in the grass strip, alternating sides; the corner gets a stop sign by the sets kit if the scene adds an intersection
  for (let x = -len / 2 + 8, k = 0; x < len / 2; x += o.lightEvery || 34, k++) { const s = k % 2 ? 1 : -1; add('light', { kind: 'streetlight', at: [R2(x), 0, R2(s * (3.7 + .16 + .6))], ry: s > 0 ? Math.PI : 0 }); }
  return { name: o.name || 'suburb', biome: 'suburb', seed, size: [len, 150], sky: { time: '17:40', date: '1984-10-12', place: 'illinois', weather: 'clear' }, atmosphere: { haze: .004, color: '#c8c0b0' }, pieces: P }; };
// ---- CITY: a four-lane street along x, buildings wall to wall on both sides, a traffic-light crossing at the east end
L.city = (seed = 1, o = {}) => { const r = rng(seed), len = o.len || 96, P = [], hw = 6, E = hw + .16 + 3.2, add = (type, e) => { const uid = `${type}-${P.filter(p => p.type === type).length + 1}`; P.push({ uid, type, ...e }); return uid; };
  add('ground', { rect: [-len / 2 - 40, len / 2 + 60, -80, 80], tex: 'concrete' }); add('street', { kind: 'city', from: [-len / 2 - 10, 0], to: [len / 2, 0], seed });
  const ix = len / 2 + 6; add('intersection', { kind: 'city', at: [ix, 0], control: 'light' }); add('street', { kind: 'city', from: [ix + 6, 0], to: [ix + 40, 0], seed: seed + 1 });
  for (const s of [-1, 1]) add('street', { kind: 'city', from: [ix, s * 6], to: [ix, s * 46], seed: seed + 2 + s });
  for (const s of [-1, 1]) { let x = -len / 2 - 8; const ry = s > 0 ? Math.PI : 0, row = [];
    // the block: a corner store at the crossing end, apartment blocks, runs of row houses, now and then an alley with a dumpster
    while (x < len / 2 - 2) { const left = len / 2 - x; let preset = left < 14 ? 'corner-store' : wpick(r, [['apartments', 3], ['row-house', 4], ['alley', 1]]);
      if (preset === 'alley') { add('item', { id: 'dumpster', at: [R2(x + 2.2), 0, R2(s * (E + 4))], ry: ry + Math.PI / 2, color: pick(r, ['#2a5a3a', '#2a4a7a', '#5a5a5a']) }); x += 4.4; continue; }
      if (preset === 'row-house') { const k = 3 + Math.floor(r() * 3); for (let j = 0; j < k && x < len / 2 - 14; j++) { const F = FOOT['row-house']; add('house', { preset: 'row-house', at: [R2(s > 0 ? x + F.w / 2 : x + F.w / 2), 0, R2(s * (E + .3 + F.d / 2))], ry, paint: pick(r, ['brownstone', 'brick', 'charcoal', 'stucco']), seed: Math.floor(r() * 1e6), stories: 3 + (r() < .3 ? 1 : 0) }); x += F.w; } continue; }
      const F = FOOT[preset]; add('house', { preset, at: [R2(x + F.w / 2), 0, R2(s * (E + .3 + F.d / 2))], ry, paint: pick(r, ['brick', 'brownstone', 'slate', 'tan']), seed: Math.floor(r() * 1e6), stories: preset === 'apartments' ? 4 + Math.floor(r() * 3) : 3 }); x += F.w; }
    // street furniture along the sidewalk
    for (let xx = -len / 2 + 4, k = 0; xx < len / 2 - 4; xx += 16, k++) add('light', { kind: 'lamp-post', at: [R2(xx + (s > 0 ? 8 : 0)), .16, R2(s * (hw + .8))], ry });
    const furn = ['hydrant', 'newspaper-box', 'trash-bin', 'mailbox-cluster', 'bench', 'hydrant', 'phone-booth', 'bus-stop'];
    for (let k = 0; k < (o.furniture || 6); k++) { const id = furn[(k + (s > 0 ? 3 : 0)) % furn.length], xx = -len / 2 + 6 + k * (len - 12) / (o.furniture || 6) + r() * 4; add('item', { id, at: [R2(xx), .16, R2(s * (hw + (id === 'bench' || id === 'phone-booth' ? 2.4 : .7)))], ry: id === 'bench' || id === 'bus-stop' ? ry + Math.PI : ry, physics: false }); }
    // parked cars in the parking lane
    for (let xx = -len / 2 + 5; xx < len / 2 - 6; xx += 6 + r() * 7) if (r() < .55) add('vehicle', { kind: wpick(r, [['sedan', 4], ['wagon', 2], ['pickup', 1], ['van', 1]]), at: [R2(xx), 0, R2(s * (hw - 1.15))], ry: s > 0 ? Math.PI / 2 : -Math.PI / 2, paint: pick(r, ['#6a1e22', '#2a3a5a', '#c8c4b8', '#3a4a3a', '#8a6a2a', '#1a1a1a']) }); }
  for (let xx = -len / 2 + 10; xx < len / 2; xx += 27) add('item', { id: 'manhole', at: [R2(xx), 0, R2((r() - .5) * 4)] });
  return { name: o.name || 'city', biome: 'city', seed, size: [len + 100, 160], sky: { time: '20:40', date: '1988-11-04', place: 'illinois', weather: 'clear' }, atmosphere: { haze: .006, color: '#9a9aa8' }, pieces: P }; };
// ---- WOODS: a clearing with a cabin (or an A-frame), a dirt track out, the forest all round, a tyre swing, a fire pit, a shed
L.woods = (seed = 1, o = {}) => { const r = rng(seed), P = [], add = (type, e) => { const uid = `${type}-${P.filter(p => p.type === type).length + 1}`; P.push({ uid, type, ...e }); return uid; }, R = o.clearing || 17;
  add('ground', { rect: [-90, 90, -90, 90], tex: 'mud' }); add('ground', { rect: [-R, R, -R, R + 4], tex: 'grass', y: .004 });
  const preset = o.house || (r() < .65 ? 'cabin' : 'a-frame'); add('house', { preset, at: [0, 0, 0], ry: 0, paint: preset === 'cabin' ? 'logs' : pick(r, ['tan', 'olive', 'weathered']), seed: Math.floor(r() * 1e6) });
  add('street', { kind: 'dirt', from: [-.5, 6.5], to: [R2(-4 + r() * 3), 70], seed });
  // the forest ring (the sets woods kit, which leaves the track's keep-out alone)
  for (const rect of [[-90, 90, -90, -R], [-90, 90, R + 4, 90], [-90, -R, -R, R + 4], [R, 90, -R, R + 4]]) add('sets', { fn: 'woods', rect, n: Math.round((rect[1] - rect[0]) * (rect[3] - rect[2]) / 70), seed: seed + rect[0] + rect[2] });
  add('tree', { kind: 'live', at: [9, 5], h: 9, seed: seed + 5 }); add('tire-swing', { at: [9.8, 4.1, 5.2] });
  add('firepit', { at: [-6, 7] }); for (let k = 0; k < 3; k++) add('item', { id: 'lawn-chair', at: [R2(-6 + Math.cos(k * 2.1) * 1.8), 0, R2(7 + Math.sin(k * 2.1) * 1.8)], ry: -k * 2.1 - Math.PI / 2, color: pick(r, ['#2a7a5a', '#c84a3a', '#3a5a9a']) });
  add('house', { preset: 'shed', at: [-8, 0, -6], ry: .4, paint: 'barn', seed: seed + 9 }); add('item', { id: 'picnic-table', at: [6, 0, -5], ry: .3 });
  add('light', { kind: 'lantern', at: [preset === 'cabin' ? -2.2 : 1.4, preset === 'cabin' ? 2.45 : 2.3, preset === 'cabin' ? 4.3 : 3.7], ry: 0 });
  add('clothesline', { from: [7, 1.9, -9], to: [12, 1.9, -7] });
  for (let k = 0; k < 7; k++) add('tree', { kind: 'rock', at: [R2((r() - .5) * R * 1.6), R2((r() - .5) * R * 1.6)], h: R2(.3 + r() * .5), seed: seed + 40 + k });
  return { name: o.name || 'woods', biome: 'woods', seed, size: [180, 180], sky: { time: '19:50', date: '1980-06-13', place: 'maine', weather: 'clear' }, atmosphere: { haze: .012, color: '#8a9a8a' }, pieces: P }; };
// ---- COUNTRYSIDE: the sets country road with its farm, a trailer behind barbed wire, a mailbox, a phone booth at the crossroads
L.countryside = (seed = 1, o = {}) => { const r = rng(seed), P = [], add = (type, e) => { const uid = `${type}-${P.filter(p => p.type === type).length + 1}`; P.push({ uid, type, ...e }); return uid; };
  add('sets', { fn: 'countryRoad', args: { len: o.len || 160, farm: true, woods: 30, seed } });
  add('house', { preset: 'trailer', at: [24, 0, 30], ry: -Math.PI / 2, paint: pick(r, ['cream', 'mint', 'pink', 'weathered']), seed: seed + 3 });
  add('fence', { fence: 'barbed', path: [[16, 18], [34, 18], [34, 42], [16, 42], [16, 32]], seed });
  add('item', { id: 'mailbox', at: [4.4, 0, 30], ry: -Math.PI / 2 }); add('item', { id: 'satellite-dish', at: [30, 0, 22], ry: -2.2 }); add('item', { id: 'gas-cylinder', at: [27, 0, 34], ry: 0 });
  add('house', { preset: 'shed', at: [30, 0, 38], ry: -Math.PI / 2, paint: 'weathered', seed: seed + 4 }); add('item', { id: 'phone-booth', at: [-4.6, 0, -40], ry: Math.PI / 2 });
  add('clothesline', { from: [19, 1.9, 22], to: [19, 1.9, 27] }); add('light', { kind: 'flood-light', at: [21.8, 2.2, 30], ry: Math.PI / 2 });
  return { name: o.name || 'countryside', biome: 'countryside', seed, size: [o.len || 160, 160], sky: { time: '16:30', date: '1973-08-18', place: 'texas', weather: 'clear' }, atmosphere: { haze: .004, color: '#d0b892' }, pieces: P }; };
L.BIOMES = ['suburb', 'city', 'woods', 'countryside'];
root.WORLD_LAYOUTS = L; if (root.WORLD) root.WORLD.LAYOUTS = L;
})(typeof window !== 'undefined' ? window : globalThis);
