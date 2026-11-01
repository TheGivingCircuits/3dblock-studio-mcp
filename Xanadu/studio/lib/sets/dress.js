// SETS: THE SET DRESSER. SETS.dress(space, paths, cameras, seed, o) fills a set with the props that belong in it, the same way every time
// for the same seed: small things on its surfaces (counters, tables, shelves), bigger things on its free floor, matched to the room and the era.
//   space   a room from SETS.room (its surfaces, floor and kind) or { kind, floor: [x0, x1, z0, z1], surfaces: [{ rect, y }] }
//   paths   walks that must stay clear: [[[x, z], [x, z], ...], ...] (each a polyline, 0.9 m wide unless o.pathWidth)
//   cameras where the lenses are: [{ pos: [x, y, z], look: [x, y, z] }] or CAM shots; nothing tall goes between a lens and what it looks at
//   seed    the dressing's seed (change it for a different but equally tidy arrangement)
//   o       { era, horror: true (adds bones, candles, hooks), density 0..1, physics: W (each prop becomes a PHYS body), only: [...ids], skip: [...ids] }
// Keep-outs: SETS.keepOuts (doorways, roads, hatches), the paths and the camera lines. Props never overlap each other and never hang over an edge.
// Returns [{ id, mesh, at: Vector3, on: 'surface' | 'floor' }].
(function () {
const S = SETS, { V, rng } = PS1;
const POOLS = {
  kitchen: { surface: ['cup', 'mug', 'plate', 'bottle', 'can', 'cereal-box', 'milk-jug', 'toaster', 'kettle', 'knife', 'pan'], floor: ['bucket', 'trash-can'] },
  living: { surface: ['ashtray', 'remote', 'book', 'tape', 'cassette', 'photo', 'rotary-phone', 'phone', 'cup', 'can', 'radio', 'newspaper'], floor: ['newspaper', 'ball', 'book'] },
  bedroom: { surface: ['alarm-clock', 'book', 'diary', 'photo', 'cup', 'teddy-bear'], floor: ['suitcase', 'teddy-bear', 'book', 'pillow'] },
  bathroom: { surface: ['cup', 'bottle'], floor: ['bucket'] },
  diner: { surface: ['mug', 'plate', 'cup', 'ashtray', 'newspaper', 'can'], floor: [] },
  gasStation: { surface: ['can', 'bottle', 'cereal-box', 'milk-jug', 'cassette', 'map', 'duct-tape', 'flashlight', 'can', 'bottle'], floor: ['crate', 'tire', 'gas-can'] },
  hospital: { surface: ['cup', 'book', 'photo'], floor: [] },
  basement: { surface: ['bottle', 'can', 'duct-tape', 'flashlight', 'hammer', 'rope', 'bucket'], floor: ['crate', 'barrel', 'tire', 'toolbox', 'bucket', 'gas-can'] },
  attic: { surface: ['book', 'photo', 'teddy-bear', 'diary', 'candle', 'radio'], floor: ['crate', 'suitcase', 'teddy-bear', 'book'] },
  outdoor: { surface: ['can', 'bottle'], floor: ['tire', 'barrel', 'crate', 'bucket', 'gas-can', 'trash-can'] },
  horror: { surface: ['skull', 'bone', 'candle', 'cleaver', 'butcher-knife'], floor: ['bone', 'skull', 'rope', 'bucket'] } };
S.DRESS = POOLS;
const dims = d => { const s = d.shape; return s.type === 'box' ? { r: Math.hypot(s.size[0], s.size[2]) / 2, h: s.size[1] } : s.type === 'cylinder' ? { r: s.r, h: s.h } : { r: s.r, h: s.r * 2 }; };
// distance from p to a segment ab in the ground plane
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, k = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0; return Math.hypot(px - ax - dx * k, pz - az - dz * k); };
S.dress = (space, paths = [], cameras = [], seed = 1, o = {}) => { if (!window.PROPS) throw new Error('SETS.dress needs lib/props/all.js'); const r = rng(seed), kind = POOLS[space.kind] ? space.kind : 'outdoor', era = o.era || space.eraName || '70s';
  const usable = id => { const d = PROPS.defs[id]; return d && (d.era.includes('any') || d.era.includes(era)) && (!o.only || o.only.includes(id)) && !(o.skip || []).includes(id); };
  const pool = which => [...POOLS[kind][which], ...(o.horror ? POOLS.horror[which] : [])].filter(usable), placed = [], out = [], pw = (o.pathWidth || .9) / 2;
  const cams = cameras.map(c => c.pos ? { p: c.pos.isVector3 ? c.pos : V(...c.pos), l: c.look ? (c.look.isVector3 ? c.look : V(...c.look)) : null } : null).filter(Boolean);
  // the set's solid furniture in plan (world boxes): nothing is dressed into a cabinet, a fridge or under a shelf it would not fit under
  const SOL = S.solids.map(m => m.isObject3D ? new THREE.Box3().setFromObject(m) : (() => { const q = Math.abs(Math.sin(m.ry || 0)) > .5, hx = (q ? m.size[2] : m.size[0]) / 2, hz = (q ? m.size[0] : m.size[2]) / 2; return new THREE.Box3(V(m.at[0] - hx, m.at[1] - m.size[1] / 2, m.at[2] - hz), V(m.at[0] + hx, m.at[1] + m.size[1] / 2, m.at[2] + hz)); })()), hitsSolid = (x, z, rad, y0, y1) => SOL.some(b => x + rad > b.min.x && x - rad < b.max.x && z + rad > b.min.z && z - rad < b.max.z && b.min.y < y1 && b.max.y > y0 + .015);
  const blocked = (x, z, rad, h, floor, y0 = 0) => { if (S.keptR(x, z, rad)) return true; if (hitsSolid(x, z, rad, y0, y0 + h)) return true; for (const pth of paths) for (let i = 0; i + 1 < pth.length; i++) if (segD(x, z, pth[i][0], pth[i][1], pth[i + 1][0], pth[i + 1][1]) < pw + rad) return true;
    for (const c of cams) { if (Math.hypot(x - c.p.x, z - c.p.z) < .45 + rad) return true; if (c.l && h > .45 && segD(x, z, c.p.x, c.p.z, c.l.x, c.l.z) < .4 + rad) return true; }
    for (const q of placed) if (Math.hypot(x - q.x, z - q.z) < rad + q.r + .03 && Math.abs((floor ? 0 : 1) - q.f) < 1) return true; return false; };
  const put = (id, x, y, z, on, surf) => { const d = PROPS.defs[id], g = PROPS.make(id, { at: [x, y, z], ry: r() * 6.283, color: o.colors && o.colors[id], seed: seed + out.length }); g.userData.dressed = true;
    placed.push({ x, z, r: dims(d).r, f: on === 'floor' ? 0 : 1, y }); out.push({ id, mesh: g, at: V(x, y, z), on, surf }); if (o.physics) o.physics.add(g, d); };
  const density = o.density ?? .6;
  // surfaces: a share of each top, small things only, nothing taller than the shelf allows, nothing over the edge
  for (const sf of space.surfaces || []) { const [x0, x1, z0, z1] = sf.rect, area = (x1 - x0) * (z1 - z0), want = Math.max(sf.shelf ? 2 : 1, Math.round(area * 6 * density)), ids = pool('surface');
    for (let k = 0, n = 0; k < want * 6 && n < want && ids.length; k++) { const id = ids[r() * ids.length | 0], d = PROPS.defs[id], m = dims(d); if (sf.maxH && m.h > sf.maxH) continue; if (m.r * 2 > Math.min(x1 - x0, z1 - z0)) continue;
      const x = x0 + m.r + r() * (x1 - x0 - 2 * m.r), z = z0 + m.r + r() * (z1 - z0 - 2 * m.r); if (blocked(x, z, m.r, m.h, false, sf.y) || placed.some(q => q.f && Math.abs(q.y - sf.y) < .05 && Math.hypot(x - q.x, z - q.z) < m.r + q.r + .03)) continue; put(id, x, sf.y, z, 'surface', sf); n++; } }
  // the free floor: a few bigger things, kept near the walls (the middle of a room is where people walk)
  if (space.floor) { const [x0, x1, z0, z1] = space.floor, area = (x1 - x0) * (z1 - z0), want = Math.round(area * .08 * density), ids = pool('floor'), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (let k = 0, n = 0; k < want * 10 && n < want && ids.length; k++) { const id = ids[r() * ids.length | 0], m = dims(PROPS.defs[id]), x = x0 + m.r + r() * (x1 - x0 - 2 * m.r), z = z0 + m.r + r() * (z1 - z0 - 2 * m.r);
      const edge = Math.min(x - x0, x1 - x, z - z0, z1 - z); if (o.edges !== false && edge > Math.max(.9, Math.min(x1 - x0, z1 - z0) * .22)) continue; if (blocked(x, z, m.r, m.h, true)) continue; put(id, x, 0 + (space.floorY || 0), z, 'floor'); n++; } }
  return out; };
})();
