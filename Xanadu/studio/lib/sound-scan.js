// THE SOUND SCAN (Phase 5): injected into a scene page by lib/mixer.mjs. window.SOUNDSCAN(t0, t1, fps) walks the scene through time without
// drawing (window.evalAt) and lists what makes a sound, each with where it is on screen (pan -1..1), how far (m), whether the camera can see it,
// and which space it is in versus the camera's (for reverb and muffling):
//   step      a foot plant of any CAST character (its surface from the space: tile, carpet, wood, concrete, gravel, grass, road)
//   door      a door, car door or fridge starting to swing (SETS registries, physics doors)
//   engine    a vehicle moving: one sample per frame with its speed (the mixer makes a bed that follows it)
//   impact    a physics impact (lib/physics.js impactLog: prop, speed, what it hit)
//   hit       a blood hit (SETS.blood.hits)
//   emit      anything a kit reports with SETS.emit (a running chainsaw)
// plus shots: [{ t, shot, space }] the camera's space over time. Everything is a pure function of the scene, like the picture.
(function () {
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const spaceAt = p => { const L = (window.SETS && SETS.spaces) || []; for (const s of L) if (p.x >= s.rect[0] && p.x <= s.rect[1] && p.z >= s.rect[2] && p.z <= s.rect[3] && p.y >= s.y0 - .5 && p.y <= s.y1 + .5) return s; return null; };
const surfaceAt = p => { const s = spaceAt(p); if (s) return s.floor; const R = (window.SETS && SETS.keepOuts || []).find(k => /road/.test(k.why) && p.x > k.r[0] && p.x < k.r[1] && p.z > k.r[2] && p.z < k.r[3]); return R ? 'road' : 'grass'; };
window.SOUNDSCAN = (t0, t1, fps = 60) => { const cam = PS1.camera, out = { events: [], shots: [], engines: {} }, people = [], dt = 1 / fps;
  PS1.scene.traverse(o => { if (o.userData.isPerson && o.userData.rig && o.userData.rig.legL) people.push(o.userData.rig); });
  const view = p => { const v = p.clone().project(cam), local = p.clone().applyMatrix4(cam.matrixWorldInverse), behind = local.z > 0; return { pan: Math.max(-1, Math.min(1, behind ? Math.sign(local.x) * .8 : v.x)), dist: +p.distanceTo(cam.getWorldPosition(V(0, 0, 0))).toFixed(2), seen: !behind && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 }; };
  const feet = new Map(), swing = new Map(), hitsDone = new Set(); let lastShot = null, lastSpace = null;
  for (let t = t0; t <= t1 + 1e-6; t += dt) { const shot = window.evalAt(t), cp = cam.getWorldPosition(V(0, 0, 0)), cs = spaceAt(cp), csn = cs ? cs.kind : 'outdoor';
    if (shot !== lastShot || csn !== lastSpace) { out.shots.push({ t: +t.toFixed(3), shot, space: csn, reverb: cs ? cs.reverb : 'outdoor' }); lastShot = shot; lastSpace = csn; }
    const ev = (kind, p, extra) => { const s = spaceAt(p), sn = s ? s.kind : 'outdoor'; out.events.push({ t: +t.toFixed(3), kind, pos: p.toArray().map(v => +v.toFixed(2)), ...view(p), space: sn, muffle: sn !== csn, ...extra }); };
    // foot plants: the foot comes down to the floor after being lifted (world height above the character's floor)
    for (const P of people) { if (!P.G.visible) continue; let vis = true, q = P.G.parent; while (q) { if (!q.visible) vis = false; q = q.parent; } if (!vis) continue; const base = P.G.getWorldPosition(V(0, 0, 0)).y;
      for (const k of ['L', 'R']) { const f = P['leg' + k].foot, p = f.getWorldPosition(V(0, 0, 0)), h = p.y - base, key = P.recipe.name + k, st = feet.get(key) || { up: false, last: -9, p };
        if (h > .09) st.up = true; else if (st.up && h < .068 && t - st.last > .18) { st.up = false; st.last = t; const speed = p.distanceTo(st.p) / dt; ev('step', p, { who: P.recipe.name || 'someone', foot: k, surface: surfaceAt(p), weight: P.scale || 1, run: speed > 2.5 }); } st.p = p; feet.set(key, st); } }
    // doors and lids swinging: the angle from the closed position starts to change
    // measured against the room or vehicle it belongs to, so a turning car does not 'open' its doors
    for (const s of (window.SETS && SETS.swings) || []) { const o = s.obj, q = (s.ref ? s.ref.getWorldQuaternion(new THREE.Quaternion()).invert() : new THREE.Quaternion()).multiply(o.getWorldQuaternion(new THREE.Quaternion())), st = swing.get(o) || { q0: q.clone(), moving: false, last: -9 }, ang = 2 * Math.acos(Math.min(1, Math.abs(st.q0.dot(q)))), d = Math.abs(ang - (st.ang ?? ang));
      if (!st.moving && d > .006 && t - st.last > .6) { st.moving = true; st.last = t; ev(s.kind, o.getWorldPosition(V(0, 0, 0)), { opening: ang > (st.ang ?? 0) }); } if (st.moving && d < .001) st.moving = false; st.ang = ang; swing.set(o, st); }
    // vehicles: a sample per frame while moving
    for (const v of (window.SETS && SETS.vehicles) || []) { const p = v.getWorldPosition(V(0, 0, 0)), st = out.engines[v.uuid] || (out.engines[v.uuid] = { kind: v.userData.kind, samples: [], last: p }); const spd = p.distanceTo(st.last) / dt; st.last = p;
      if (spd > .5 && spd < 80 && p.y > -5) { const s = spaceAt(p); st.samples.push({ t: +t.toFixed(3), speed: +spd.toFixed(1), ...view(p.clone().add(V(0, .8, 0))), muffle: (s ? s.kind : 'outdoor') !== csn }); } }
    for (const h of (window.SETS && SETS.blood && SETS.blood.hits) || []) if (!hitsDone.has(h) && t >= h.t0) { hitsDone.add(h); ev('hit', (h.who.G || h.who).getWorldPosition(V(0, 1.2, 0)), { who: (h.who.recipe && h.who.recipe.name) || '' }); } }
  // impacts from the physics run, placed and panned at their own times
  if (window.PHYS && PHYS.active) for (const i of PHYS.active.impactLog(t1)) { if (i.t < t0 || !i.pos) continue; window.evalAt(i.t); const p = V(...i.pos), s = spaceAt(p), cs = spaceAt(cam.getWorldPosition(V(0, 0, 0)));
    out.events.push({ t: i.t, kind: 'impact', pos: i.pos, ...view(p), space: s ? s.kind : 'outdoor', muffle: (s ? s.kind : 'outdoor') !== (cs ? cs.kind : 'outdoor'), what: i.name, material: i.kind, speed: i.speed, with: i.with }); }
  // emitters (a chainsaw): one span per object, from its first to last report
  const em = new Map(); for (const e of (window.SETS && SETS.emits) || []) { const k = e.obj.uuid + e.kind, s = em.get(k) || { kind: e.kind, from: e.t, to: e.t, obj: e.obj }; s.from = Math.min(s.from, e.t); s.to = Math.max(s.to, e.t); em.set(k, s); }
  out.emits = [...em.values()].filter(s => s.to > t0 && s.from < t1).map(s => ({ kind: s.kind, from: +s.from.toFixed(2), to: +s.to.toFixed(2) }));
  out.events.sort((a, b) => a.t - b.t); return out; };
})();
