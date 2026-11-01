// The cinema camera (Phase 2 of the production suite). Load after ps1.js and lights.js; exposes window.CAM. Old episodes never load it.
// Shots are written in film terms: { id, at, dur, body, lens, stop, shutter, size, subject, angle, focus, pull, move, handheld, exposure,
// ease, note }. The camera works out its distance from the lens and the shot size, the field of view from the focal length and the
// body's sensor, and depth of field from the real circle-of-confusion formula (the post stage turns it into blur per pixel from the
// depth plate). CAM.episode(ep) runs a scene: window.seek(t) for quick looks and --stills, window.plate(t, i) for raw plates (--shoot).
(function () {
const PS = window.PS1, LT = window.LIGHTS, { P, lerp, eio, clamp, T } = PS, V = (x, y, z) => new THREE.Vector3(x, y, z), D2R = Math.PI / 180;
const C = window.CAM = {};

// ---------- bodies, lenses, stops, sizes ----------
// sensor in mm (w = the long side, which is vertical in our portrait frame), acceptable circle of confusion, film stock, cadence, gate
C.BODIES = { 'large-format': { w: 36, h: 24, coc: .029, stock: 'large-format' }, super35: { w: 24.9, h: 18.7, coc: .019, stock: 'super35' }, '16mm': { w: 10.3, h: 7.5, coc: .012, stock: '16mm' },
  super8: { w: 5.8, h: 4.0, coc: .006, stock: 'super8', fps: 18, gate: 'round' }, camcorder: { w: 4.8, h: 3.6, coc: .005, stock: 'video' } };
// lens profiles: focal length, barrel distortion (+ barrel, − pincushion), vignette, bokeh shape, cat-eye at the edges, flare style, minimum focus (m), colour fringe
const LP = (f, dist, vig, cat, minFocus, fringe, o = {}) => ({ f, dist, vig, cat, minFocus, fringe, bokeh: 'round', flare: 'ghosts', ...o });
C.LENSES = { '14mm': LP(14, .07, .5, .5, .2, .6), '18mm': LP(18, .05, .42, .45, .25, .5), '24mm': LP(24, .035, .35, .4, .25, .4), '28mm': LP(28, .025, .3, .35, .28, .35), '35mm': LP(35, .015, .26, .3, .3, .3),
  '50mm': LP(50, 0, .22, .3, .45, .25), '85mm': LP(85, -.01, .2, .35, .8, .25), '135mm': LP(135, -.015, .18, .3, 1.2, .3), '200mm': LP(200, -.02, .16, .25, 1.8, .35), '100mm-macro': LP(100, 0, .18, .2, .15, .2),
  '40mm-anamorphic': LP(40, .04, .4, .3, .7, .5, { bokeh: 'oval', squeeze: 1.6, flare: 'streak' }), 'vintage-zoom': LP(50, .03, .38, .45, 1.2, .8, { zoom: [25, 250], flare: 'warm' }) };
C.lens = name => typeof name === 'number' ? LP(name, 0, .25, .3, .3, .3) : C.LENSES[name] || (parseFloat(name) ? LP(parseFloat(name), 0, .25, .3, .3, .3) : C.LENSES['35mm']);
C.stop = s => typeof s === 'number' ? s : parseFloat(String(s || 'f/4').replace(/^f\//i, '')) || 4;
// vertical field of view (degrees) of the portrait frame from focal length and sensor; PS1.lens stays as an alias (large format = the old numbers)
C.fov = (lens, body = 'large-format') => { const f = typeof lens === 'object' ? lens.f : C.lens(lens).f, b = C.BODIES[body] || C.BODIES['large-format']; return 2 * Math.atan(b.w / (2 * f)) / D2R; };
PS.lens = mm => C.fov(mm, 'large-format');
// the blur circle on the sensor (mm) for a point at distance D (m) when focused at S (m): coc = |D − S| / D · f² / (N · (S − f))
C.coc = (D, S, f, N) => { D *= 1000; S *= 1000; return Math.abs(D - S) / D * f * f / (N * Math.max(S - f, 1)); };
C.dof = (S, f, N, coc) => { const H = f * f / (N * coc) + f, s = S * 1000; return { near: s * (H - f) / (H + s - 2 * f) / 1000, far: s >= H ? Infinity : s * (H - f) / (H - s) / 1000, hyperfocal: H / 1000 }; };
// stops of light the camera lets in compared with the reference (f/4, 180 degrees, 30 fps, ISO 800, no ND)
C.cameraStops = sh => 2 * Math.log2(4 / sh.N) + Math.log2((sh.shutter / 360 / (sh.B.fps || 30)) * 60) + Math.log2((sh.iso || 800) / 800) - (sh.nd || 0);
// shot sizes: the frame height (m) at the subject, and which part of a person is framed in the centre
C.SIZES = { ECU: { h: .14, part: 'eyes' }, CU: { h: .36, part: 'head' }, MCU: { h: .62, part: 'chest' }, MS: { h: 1.05, part: 'waist' }, WS: { h: 2.4, part: 'body' }, EWS: { h: 7, part: 'body' } };

// ---------- subjects: cast, props and marks the camera (and the lights) can find ----------
const CAST = C.cast = {};
C.mark = (name, v) => { CAST[name] = v; return C; };
const isPerson = o => o && o.head && o.G;
C.where = (name, t, size) => { if (name == null) return null; if (typeof name === 'function') return C.where(name(t), t, size); if (Array.isArray(name)) return V(...name); if (name.isVector3) return name.clone(); if (name.isObject3D) return name.getWorldPosition(V(0, 0, 0));
  if (typeof name === 'number') return null; const [who, part0] = String(name).split('.'), o = CAST[who]; if (o == null) return LT && LT.marks[who] ? C.where(LT.marks[who], t) : null;
  if (!isPerson(o)) return C.where(o, t); const part = part0 || (C.SIZES[size] || C.SIZES.MS).part, hp = o.head.getWorldPosition(V(0, 0, 0)), base = o.G.getWorldPosition(V(0, 0, 0)), s = o.G.scale.y, fwd = C.facingDir(who);
  return { eyes: hp.clone().add(V(0, .01 * s, 0)).addScaledVector(fwd, .1 * s), head: hp, face: hp.clone().addScaledVector(fwd, .1 * s), chest: hp.clone().add(V(0, -.32 * s, 0)), waist: hp.clone().add(V(0, -.55 * s, 0)), body: base.clone().add(V(0, .85 * s, 0)), feet: base,
    hand: o.armR.hand.getWorldPosition(V(0, 0, 0)), handR: o.armR.hand.getWorldPosition(V(0, 0, 0)), handL: o.armL.hand.getWorldPosition(V(0, 0, 0)), torso: o.torso.getWorldPosition(V(0, 0, 0)) }[part] || hp; };
C.facingDir = who => { const o = CAST[who], g = isPerson(o) ? o.G : o && o.isObject3D ? o : null; if (!g) return V(0, 0, 1); const q = new THREE.Quaternion(); g.getWorldQuaternion(q); return V(0, 0, 1).applyQuaternion(q).setY(0).normalize(); };
const objOf = name => { const o = CAST[String(name || '').split('.')[0]]; return isPerson(o) ? o.G : o && o.isObject3D ? o : null; };

// ---------- handheld: layered noise, not random jitter ----------
const n1 = x => { const i = Math.floor(x), f = x - i, h = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }, u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u) * 2 - 1; };
const fbm = (t, seed) => n1(t + seed) * .6 + n1(t * 2.1 + seed * 3) * .28 + n1(t * 4.3 + seed * 7) * .12;
C.HANDHELD = { calm: { pos: .006, rot: .35, rate: .55 }, nervous: { pos: .014, rot: 1.1, rate: 1.5 }, running: { pos: .03, rot: 2.2, rate: 2.2, bob: .035, step: 2.6 } };

// ---------- moves: functions of k (0..1 eased over the shot) that change position, look and focal length ----------
const rotY = (v, a) => v.clone().applyAxisAngle(V(0, 1, 0), a);
C.MOVES = {
  static: () => {}, pan: (s, k, m) => { const a = (m.by ?? 30) * D2R * (k - .5); s.look = s.pos.clone().add(rotY(s.look.clone().sub(s.pos), -a)); },
  tilt: (s, k, m) => { const d = s.look.clone().sub(s.pos), ax = d.clone().cross(V(0, 1, 0)).normalize(); s.look = s.pos.clone().add(d.applyAxisAngle(ax, (m.by ?? 15) * D2R * (k - .5))); },
  dolly: (s, k, m) => { const d = s.look.clone().sub(s.pos).setY(0).normalize(); s.pos.addScaledVector(d, (m.by ?? .8) * (k - (m.from ?? 0))); },
  'push-in': (s, k, m) => C.MOVES.dolly(s, k, { by: m.by ?? .35 }),
  truck: (s, k, m) => { const d = s.look.clone().sub(s.pos).setY(0).normalize(), side = V(-d.z, 0, d.x); const o = side.multiplyScalar((m.by ?? 1) * (k - .5)); s.pos.add(o); if (!m.keepLook) s.look.add(o); },
  crane: (s, k, m) => { s.pos.y += (m.by ?? 1.2) * (k - (m.from ?? 0)); },
  orbit: (s, k, m) => { const c = s.look.clone(), a = (m.by ?? 40) * D2R * (k - .5); s.pos = c.clone().add(rotY(s.pos.clone().sub(c), a)); },
  steadicam: (s, k, m, t) => { C.MOVES.dolly(s, k, { by: m.by ?? 1.2 }); s.pos.y += fbm(t * .5, 3) * .02; s.pos.x += fbm(t * .4, 9) * .03; },
  'whip-pan': (s, k, m, t, sh) => { const u = clamp((t - sh.t0) / (m.time ?? .28)), a = (m.by ?? 75) * D2R * (1 - eio(u)); s.look = s.pos.clone().add(rotY(s.look.clone().sub(s.pos), a)); },
  'crash-zoom': (s, k, m, t, sh) => { const u = clamp((t - sh.t0 - (m.delay ?? 0)) / (m.time ?? .3)), z = Math.pow(u, .5); s.f = s.f * lerp(1, m.by ?? 3, z); },
  drone: (s, k, m) => { const d = s.look.clone().sub(s.pos).setY(0).normalize(); s.pos.addScaledVector(d, (m.by ?? 4) * k); s.pos.y += (m.rise ?? 3) * k; },
  pov: (s, k, m, t, sh) => { const who = m.who, o = CAST[who]; if (!isPerson(o)) return; const hp = o.head.getWorldPosition(V(0, 0, 0)), q = new THREE.Quaternion(); o.head.getWorldQuaternion(q); const f = V(0, 0, 1).applyQuaternion(q);
    s.pos = hp.clone().addScaledVector(f, .13).add(V(0, .03, 0)); s.look = s.pos.clone().addScaledVector(f, 3); s.ignore = o.G; },
};
const parseMove = m => { if (!m) return { type: 'static' }; if (typeof m === 'string') return m.startsWith('pov:') ? { type: 'pov', who: m.slice(4) } : { type: m }; return { type: 'static', ...m }; };

// ---------- the shot list ----------
C.resolve = (list, S) => { const tOf = a => typeof a === 'number' ? a : Array.isArray(a) ? T(a) : 0, END = S.END;
  const shots = list.map((s, i) => { const lens = C.lens(s.lens || '35mm'), body = s.body || 'super35'; return { i, ...s, body, lensName: s.lens || '35mm', L: lens, N: C.stop(s.stop), B: C.BODIES[body] || C.BODIES.super35,
    shutter: s.shutter ?? 180, size: s.size || 'MS', t0: tOf(s.at), move: parseMove(s.move), ease: s.ease || 'eio', exposure: s.exposure ?? 0 }; }).sort((a, b) => a.t0 - b.t0);
  shots.forEach((s, i) => { s.dur = s.dur ?? ((shots[i + 1] ? shots[i + 1].t0 : END) - s.t0); s.t1 = s.t0 + s.dur; }); return shots; };
// the camera at time t for a shot: { pos, look, fov, f, focus (m), roll, ignore }
C.pose = (sh, t) => { const k0 = clamp((t - sh.t0) / Math.max(sh.moveDur ?? sh.dur, .001)), k = sh.ease === 'linear' ? k0 : sh.ease === 'out' ? 1 - Math.pow(1 - k0, 3) : eio(k0), size = C.SIZES[sh.size] || C.SIZES.MS;
  let f = (typeof sh.focal === 'function' ? sh.focal(t) : sh.focal) || (sh.L.zoom ? (sh.zoom ? lerp(sh.zoom[0], sh.zoom[1], k) : sh.L.f) : sh.L.f); const s = { f };
  const sub = C.where(sh.subject, t, sh.size) || V(0, 1.2, 0);
  if (sh.pos) { s.pos = C.where(sh.pos, t); s.look = C.where(sh.look, t) || sub.clone(); }
  else { const fov0 = 2 * Math.atan(sh.B.w / (2 * f)), dist = sh.dist ?? size.h / (2 * Math.tan(fov0 / 2)), [az, el] = sh.angle || [0, 0], fw = C.facingDir(String(sh.subject || '').split('.')[0]), a = Math.atan2(fw.x, fw.z) + az * D2R;
    s.pos = sub.clone().add(V(Math.sin(a) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(a) * Math.cos(el * D2R)).multiplyScalar(dist)); s.look = sub.clone(); }
  if (sh.offset) s.pos.add(V(...sh.offset));
  const mv = sh.move, fn = C.MOVES[mv.type]; if (fn) fn(s, k, mv, t, sh); else console.warn('CAM: unknown move', mv.type);
  // focus: a target (name, point) or metres; pull: ['target', t (s into the shot), dur] eases to a second target; a list of pulls runs in order
  const fd = x => { if (typeof x === 'function') x = x(t); if (typeof x === 'number') return x; const p = C.where(x ?? sh.subject, t, sh.size) || sub; return Math.max(.05, p.clone().sub(s.pos).dot(s.look.clone().sub(s.pos).normalize())); };
  let focus = fd(sh.focus); for (const [tg, tp = 0, dp = .9] of sh.pull ? (Array.isArray(sh.pull[0]) ? sh.pull : [sh.pull]) : []) { const u = eio(clamp((t - sh.t0 - tp) / dp)); if (u > 0) focus = lerp(focus, fd(tg), u); }
  const minF = sh.L.minFocus; if (focus < minF) { focus = minF; s.focusClamped = true; }
  s.fov = 2 * Math.atan(sh.B.w / (2 * s.f)) / D2R; s.focus = focus; s.roll = 0; if (sh.up) s.up = C.where(sh.up, t);
  const hh = C.HANDHELD[sh.handheld]; if (hh) { const r = hh.rate, seed = sh.i * 13.7; s.hpos = V(fbm(t * r, seed), fbm(t * r, seed + 4), fbm(t * r, seed + 8)).multiplyScalar(hh.pos);
    if (hh.bob) s.hpos.y += Math.abs(Math.sin(t * Math.PI * hh.step)) * hh.bob; s.hrot = [fbm(t * r * 1.3, seed + 2) * hh.rot, fbm(t * r * 1.3, seed + 6) * hh.rot, fbm(t * r, seed + 11) * hh.rot * .6]; }
  return s; };
// framing (Chria, 2026-10-26): the lens never sits inside an actor or right up against one. After the blocking is placed, a camera within the
// margin of a character's bounds (0.4 m; 0.25 m for a CU; 0.12 m for an ECU or INSERT) backs off along its own line of sight, staying inside the
// shot's room, until it is clear. Returns how far it moved and from whom, which the checker reports.
C.MARGIN = { ECU: .12, INSERT: .12, CU: .25 };
C.clear = (cam, sh) => { const m = C.MARGIN[sh.size] ?? .4, boxes = []; PS.scene.traverse(o => { if (!o.userData.isPerson || !o.userData.rig || !o.visible) return; let v = true, p = o.parent; while (p) { if (!p.visible) v = false; p = p.parent; } if (v) boxes.push([o.userData.character || 'a character', new THREE.Box3().setFromObject(o).expandByScalar(m)]); });
  const hit = () => boxes.find(([, b]) => b.containsPoint(cam.position)); let h = hit(); if (!h) return null; const back = cam.getWorldDirection(V(0, 0, 0)).negate(), room = sh.interior && window.SETS ? SETS.spaces.find(s => s.kind === sh.interior) : null, from = cam.position.clone();
  for (let d = 0; d < 2.5 && h; d += .03) { const n = cam.position.clone().addScaledVector(back, .03); if (room && !(n.x > room.rect[0] + .05 && n.x < room.rect[1] - .05 && n.z > room.rect[2] + .05 && n.z < room.rect[3] - .05)) break; cam.position.copy(n); h = hit(); }
  return { who: (hit() || boxes.find(([, b]) => b.containsPoint(from)))[0], moved: cam.position.distanceTo(from), clear: !hit() }; };
C.apply = (cam, s) => { cam.fov = s.fov; cam.updateProjectionMatrix(); cam.position.copy(s.pos); if (s.hpos) cam.position.add(s.hpos); if (s.up) cam.up.copy(s.up); else cam.up.set(0, 1, 0); cam.lookAt(s.look);
  if (s.hrot) { cam.rotateX(s.hrot[0] * D2R); cam.rotateY(s.hrot[1] * D2R); cam.rotateZ(s.hrot[2] * D2R); } cam.updateMatrixWorld(true); };

// ---------- helpers: over the shoulder, two-shot, the 180-degree line ----------
C.ots = (a, b, o = {}) => ({ subject: b + '.head', pos: t => { const pa = C.where(a + '.head', t), pb = C.where(b + '.head', t), d = pb.clone().sub(pa).setY(0).normalize(), side = V(-d.z, 0, d.x).multiplyScalar(o.side ?? .32);
  return pa.clone().addScaledVector(d, -(o.back ?? .75)).add(side).add(V(0, o.up ?? .06, 0)); }, look: b + '.head', ignoreOts: a });
C.two = (a, b, o = {}) => ({ subject: a, pos: t => { const pa = C.where(a + '.chest', t), pb = C.where(b + '.chest', t), mid = pa.clone().add(pb).multiplyScalar(.5), d = pb.clone().sub(pa).setY(0), w = d.length(), n = V(-d.z, 0, d.x).normalize();
  if (o.flip) n.negate(); return mid.addScaledVector(n, Math.max(1.4, w * 1.6) * (o.dist ?? 1)); }, look: t => C.where(a + '.chest', t).add(C.where(b + '.chest', t)).multiplyScalar(.5) });
const LINES = C.lines = {};
C.line = (scene, pts) => { LINES[scene] = pts.map(p => Array.isArray(p) ? V(...p) : p); return C; };
// safety before a shoot: a ray from the camera to the subject must not hit anything in between, the camera must not sit inside a mesh,
// and every shot of a scene must stay on one side of its 180-degree line. Returns a list of { shot, t, problem }
C.check = (ep, S, shots, evaluate) => { const out = [], ray = new THREE.Raycaster(), side = {};
  for (const sh of shots) for (const t of [sh.t0 + .03, sh.t0 + sh.dur / 2, sh.t1 - .03]) { evaluate(t, sh); const cam = S.camera.position.clone(), sub = C.where(sh.subject, t, sh.size); const skip = new Set();
    for (const n of [sh.subject, sh.ignoreOts]) { const o = objOf(n); if (o) o.traverse(x => skip.add(x)); } if (sh.move.type === 'pov') { const o = objOf(sh.move.who); if (o) o.traverse(x => skip.add(x)); }
    const solid = []; PS.scene.traverse(o => { if (o.isMesh && o.visible && !o.userData.fx && !o.userData.sky && !o.userData.noCheck && !skip.has(o)) { let v = true, p = o.parent; while (p) { if (!p.visible) v = false; p = p.parent; } if (v) solid.push(o); } });
    if (sub) { const d = sub.clone().sub(cam), len = d.length(); ray.set(cam, d.normalize()); ray.far = len - .12; const hit = ray.intersectObjects(solid, false)[0]; if (hit) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `geometry between the lens and ${sh.subject}: ${hit.object.name || hit.object.geometry.type} at ${hit.distance.toFixed(2)} m` }); }
    for (const o of solid) { const b = new THREE.Box3().setFromObject(o), sz = b.getSize(V(0, 0, 0)); if (Math.min(sz.x, sz.y, sz.z) > .04 && b.expandByScalar(-.01).containsPoint(cam)) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `camera inside ${o.name || o.geometry.type}` }); }
    if (S.cleared) out.push({ shot: sh.id, t: +t.toFixed(2), problem: S.cleared.clear ? `framing: the camera was too close to ${S.cleared.who} and backed off ${S.cleared.moved.toFixed(2)} m (move the shot's camera back)` : `framing: the camera is inside or against ${S.cleared.who} and cannot back off inside the room`, fatal: !S.cleared.clear });
    // solid furniture: no part of a character may pass more than 2 cm into a solid (a bed, a sofa, a table); bodies are tested by the corners of each limb box
    if (window.SETS && SETS.solids.length) { const sb = SETS.solids.filter(o => { if (!o || !o.isObject3D) return false; let v = o.visible, p = o.parent; while (v && p) { v = p.visible; p = p.parent; } return v; }).map(o => [o, new THREE.Box3().setFromObject(o).expandByScalar(-.02)]);
      PS.scene.traverse(o => { const P = o.userData.isPerson && o.userData.rig; if (!P || !o.visible || o.userData.noSolidCheck) return; let v = true, p = o.parent; while (p) { if (!p.visible) v = false; p = p.parent; } if (!v) return; let bad = null;
        o.traverse(m => { if (bad || !m.isMesh || m.userData.layer === 'hair' || (P.armL && m === P.armL.hand) || (P.armR && m === P.armR.hand) || !m.geometry || !m.geometry.parameters || m.geometry.type !== 'BoxGeometry') return; const g = m.geometry.parameters, pts = [];
          for (const x of [-.5, .5]) for (const y of [-.5, .5]) for (const z of [-.5, .5]) pts.push(m.localToWorld(V(x * g.width, y * g.height, z * g.depth)));
          for (const [so, b] of sb) if (pts.some(q => b.containsPoint(q))) { bad = so; return; } });
        if (bad) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `${P.recipe.name || 'a character'} passes into solid furniture (${bad.parent && bad.parent.parent && bad.parent.parent.name || bad.geometry.type}): seat or place them on its surface (SETS.seatAt)`, fatal: true }); }); }
    // the same character twice in frame (a copy left visible in another place): keyed by the character's name, else by its painted face
    { const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(S.camera.projectionMatrix, S.camera.matrixWorldInverse)), seen = new Map();
      PS.scene.traverse(o => { if (!o.userData.isPerson || !o.visible) return; let v = true, p = o.parent; while (p) { if (!p.visible) v = false; p = p.parent; } if (!v) return;
        const box = new THREE.Box3().setFromObject(o); if (box.isEmpty() || !fr.intersectsBox(box)) return; const tex = o.userData.faceTex;
        const key = o.userData.character || (tex && tex.image && tex.image.toDataURL ? (tex.userData.key = tex.userData.key || tex.image.toDataURL()) : null); if (!key) return;
        if (seen.has(key)) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `doubled character: the same person is visible twice in frame (${o.userData.character || 'same face'})`, fatal: true }); else seen.set(key, o); }); }
    // standing height: a CAST character in a standing or walking motion must be upright (head above 60 percent of its height), never left on the floor
    { const UP = new Set(['stand', 'idle', 'lean', 'talk', 'wave', 'point', 'phone', 'lookAround', 'grab', 'swing', 'walk', 'run', 'struggle']);
      PS.scene.traverse(o => { const P = o.userData.isPerson && o.userData.rig; if (!P || !P.head || !UP.has(P.motion)) return; let v = true, p = o; while (p) { if (!p.visible) v = false; p = p.parent; } if (!v) return;
        const base = o.getWorldPosition(V(0, 0, 0)).y, hy = P.head.getWorldPosition(V(0, 0, 0)).y - base, H = 1.75 * (P.scale || 1); if (hy < .6 * H) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `${P.recipe.name || 'a character'} is down (head at ${(hy / H * 100).toFixed(0)} percent of height) in a ${P.motion} motion`, fatal: true }); }); }
    // clothing: no extra mesh on a CAST body except the second-layer list (Chria, 2026-10-25: clothes are colour on the body itself)
    { const OK = new Set(['belt', 'jacket', 'apron', 'dress', 'skirt', 'robe', 'vest', 'backpack']);
      PS.scene.traverse(o => { const P = o.userData.isPerson && o.userData.rig; if (!P || !P.chest || !o.visible) return;
        for (const m of [...P.chest.children, ...P.hips.children]) if (m.isMesh && m !== P.torso && m !== P.pelvisMesh && !OK.has(m.userData.layer)) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `${P.recipe.name || 'a character'} wears an extra clothing mesh that is not a second layer`, fatal: true }); }); }
    // interiors: a shot that says it is inside a room (interior: '<room kind>') must have its camera inside that room's walls
    if (sh.interior && window.SETS) { const sp = SETS.spaces.find(s => s.kind === sh.interior && cam.x > s.rect[0] && cam.x < s.rect[1] && cam.z > s.rect[2] && cam.z < s.rect[3]); if (!sp) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `camera is not inside the ${sh.interior} the shot is set in`, fatal: true }); }
    // physics: props sunk into each other or into the set (lib/physics.js), only when a scene runs a physics world
    if (window.PHYS && PHYS.active) for (const p of PHYS.checks(t)) out.push({ shot: sh.id, t: +t.toFixed(2), problem: p.problem });
    const ln = LINES[sh.scene]; if (ln) { const a = ln[0], b = ln[1], sgn = Math.sign((b.x - a.x) * (cam.z - a.z) - (b.z - a.z) * (cam.x - a.x)); if (side[sh.scene] == null) side[sh.scene] = sgn; else if (sgn && sgn !== side[sh.scene]) out.push({ shot: sh.id, t: +t.toFixed(2), problem: `crosses the 180-degree line of scene ${sh.scene}` }); } }
  const seen = new Set(); return out.filter(o => { const k = o.shot + o.problem; if (seen.has(k)) return false; seen.add(k); return true; }); };

// ---------- the runner ----------
C.episode = function (ep) {
  // ep.res: the 3D render size, native vertical 1080x1920 unless a scene asks otherwise ([w, h], or a multiple of 360x640 like the old engine).
  // ep.snap: the PS1 vertex-snapping grid, kept coarse (540x960) so the wobble still shows at full resolution
  const res = Array.isArray(ep.res) ? ep.res : typeof ep.res === 'number' ? [PS.LW * ep.res, PS.LH * ep.res] : [1080, 1920], PW = Math.round(res[0]), PH = Math.round(res[1]), R = PS.renderer, scene = PS.scene, camera = PS.camera;
  const S = PS.S = C.S = { ep, V, scene, camera, U: LT.U, O: {}, hits: [], flares: [], rec: 0, PW, PH }; let SHOTS = null;
  PS.U.snap.value.set(...(ep.snap || [540, 960])); LT.U.plateRes.value.set(PW, PH);
  const frt = () => new THREE.WebGLRenderTarget(PW, PH, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const rtC = frt(), rtAcc = frt(), rtD = frt(); rtAcc.depthBuffer = false; C.rts = { rtC, rtAcc, rtD };
  const quad = (fs, u) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: fs, depthTest: false, depthWrite: false });
    const sc = new THREE.Scene(); sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m)); return { m, sc }; };
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const acc = quad('uniform sampler2D src; uniform float w, add; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(src, vUv).rgb * w + add, 1.0); }', { src: { value: rtC.texture }, w: { value: 1 }, add: { value: 0 } }); acc.m.blending = THREE.AdditiveBlending; acc.m.transparent = true;
  // the quick-look display (stills, dailies): a plain roll-off and the house gamma, the HUD on top; the real look is the post stage's job
  const disp = quad(`uniform sampler2D src, hud; uniform vec2 res; varying vec2 vUv; void main(){ vec2 px = floor(vUv * res); vec3 c = texture2D(src, (px + 0.5) / res).rgb; c = c / (1.0 + max(c - 0.8, 0.0)); c = pow(max(c, 0.0), vec3(0.72));
    vec4 h = texture2D(hud, vUv); gl_FragColor = vec4(mix(c, h.rgb, h.a), 1.0); }`, { src: { value: rtAcc.texture }, hud: { value: PS.hudT }, res: { value: new THREE.Vector2(PW, PH) } });
  const shotAt = t => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.t0 - 1e-6) s = x; return s; };
  function prepare() { S.END = NB.TL.end; ep.prepare && ep.prepare(S); SHOTS = C.resolve(ep.shots(S), S); S.shots = SHOTS; }
  // evaluate the world at t through a shot (pure in t): the camera, the episode's own animation, then the lights
  function evaluate(t, sh) { sh = sh || shotAt(t); const cad = sh.B.fps, tq = cad ? sh.t0 + Math.floor((t - sh.t0) * cad + 1e-6) / cad : t; S.t = tq; S.shot = sh;
    const pose = C.pose(sh, tq); C.apply(camera, pose); S.pose = pose; ep.update(tq, S, sh); scene.updateMatrixWorld(true); S.cleared = C.clear(camera, sh); camera.updateMatrixWorld(true);
    S.light = LT.update(tq, { subject: C.where(sh.subject, tq, sh.size), camera, scene: sh.scene, shot: sh.id, shadowCenter: ep.shadowCenter ? C.where(ep.shadowCenter, tq) : null }); return pose; }
  // exposure, like a real camera: f/4 at a 180-degree shutter and 30 fps is the reference; every stop of aperture or shutter halves or doubles the
  // light (iso and nd too). expose: 'key' (default) exposes for the gaffer's key; 'fixed' ignores the key; 'auto' meters the subject's face like an
  // auto-ISO (the aperture stays where the DP set it for depth of field), within autoMin/autoMax stops. A shot's 'exposure' offsets all three
  // meter: 'face' (default) reads the light on the face toward the lens; 'incident' averages that with the light from the sky above and from the
  // sun (a dome meter's view), so a backlit subject at sunset does not open the camera up until the sky burns out
  const gainOf = sh => { const mode = sh.expose || (sh.exposureMode === 'fixed' ? 'fixed' : 'key'); let stops = sh.exposure;
    if (mode === 'auto') { const who = String(sh.subject || ''), p = (CAST[who.split('.')[0]] && isPerson(CAST[who.split('.')[0]]) ? C.where(who.includes('.') ? who : who + '.face', S.t) : null) || C.where(sh.subject, S.t, sh.size) || V(0, 1.5, 0);
      const n = camera.position.clone().sub(p).normalize(), E = sh.meter === 'incident' ? (LT.illum(p, n) + LT.illum(p, V(0, 1, 0)) + LT.illum(p, LT.state.amb ? LT.state.amb.sunDir.clone() : V(0, 1, 0))) / 3 : LT.illum(p, n); S.meter = E; stops += clamp(-Math.log2(Math.max(E, 1e-6)) - .3, -(sh.autoMin ?? 4), sh.autoMax ?? 6); }
    else stops += C.cameraStops(sh) - (mode === 'key' ? LT.keyStops(sh.scene) : 0);
    return Math.pow(2, stops); };
  // sub-frames sample the shutter interval but never cross the cut (clamped to the shot's start)
  // a jump inside the shutter (a cut keyframe, a whip faster than the eye) would show two pictures: then the frame takes a single sub-frame
  const jumps = (sh, t0, t1) => { const a = C.pose(sh, t0), b = C.pose(sh, t1); if (a.pos.distanceTo(b.pos) > .25) return true; return a.look.clone().sub(a.pos).angleTo(b.look.clone().sub(b.pos)) > .17; };
  function renderColour(t, sh, sub) { const open = (sh.shutter / 360) / (sh.B.fps || 30); if (sub > 1 && jumps(sh, Math.max(sh.t0, t - open / 2), t + open / 2)) sub = 1; R.setRenderTarget(rtAcc); R.setClearColor(0x000000); R.clear(); let pose;
    for (let k = 0; k < sub; k++) { const tk = sub > 1 ? Math.max(sh.t0, t - open / 2 + (k + .5) / sub * open) : t; pose = evaluate(tk, sh); LT.U.pass.value = 0;
      R.setRenderTarget(rtC); R.setClearColor(new THREE.Color(...LT.U.fogCol.value.toArray())); R.clear(); R.render(scene, camera);
      // ep.gain(t, S): a fade (1 = no change); ep.add(t, S): a white flash, both part of the picture, so they go into the plate
      acc.m.uniforms.w.value = gainOf(sh) * (ep.gain ? ep.gain(tk, S) : 1) / sub; acc.m.uniforms.add.value = (ep.add ? ep.add(tk, S) : 0) / sub; R.setRenderTarget(rtAcc); R.autoClear = false; R.render(acc.sc, ortho); R.autoClear = true; }   // no auto-clear: the sub-frames add up
    if (sub > 1) pose = evaluate(t, sh); R.setRenderTarget(null); return pose; }
  // pass 1: linear depth (m) and screen velocity (plate px per frame-interval) from each object's matrix at t − 1/fps and at t
  function renderDepth(t, sh) { const dt = 1 / (sh.B.fps || 30); evaluate(Math.max(sh.t0, t - dt), sh); const prevVP = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse), prev = new Map();
    scene.traverse(o => { if (o.isMesh) prev.set(o, o.matrixWorld.clone()); }); evaluate(t, sh); LT.U.prevVP.value.copy(prevVP); LT.U.pass.value = 1;
    const hidden = []; scene.traverse(o => { if (o.visible && (o.userData.fx || o.isPoints || o.isLine || (o.material && !o.material.userData?.lit && o.isMesh && !Array.isArray(o.material)))) { o.visible = false; hidden.push(o); }
      if (o.isMesh) o.onBeforeRender = (r, s, c, g, mat) => { if (mat && mat.uniforms && mat.uniforms.prevModel) { mat.uniforms.prevModel.value.copy(prev.get(o) || o.matrixWorld); mat.uniformsNeedUpdate = true; } }; });
    R.setRenderTarget(rtD); R.setClearColor(new THREE.Color(1000, 0, 0), 1); R.clear(); R.render(scene, camera); R.setRenderTarget(null); hidden.forEach(o => o.visible = true); LT.U.pass.value = 0; R.setClearColor(0x000000, 1); }
  window.seek = t => { if (!SHOTS) prepare(); const sh = shotAt(t); renderColour(t, sh, 1); PS.drawHud(t, S); R.setRenderTarget(null); R.render(disp.sc, ortho); return true; };
  window.setTL = tl => { NB.TL = tl; PS.resetChunks(); SHOTS = null; return true; };
  window.shotList = () => { if (!SHOTS) prepare(); return SHOTS.map(s => ({ id: s.id, i: s.i, cover: !!s.cover, interior: s.interior || null, note: s.note || '', scene: s.scene ?? null, t0: s.t0, dur: s.dur, body: s.body, lens: s.lensName, f: s.L.f, stop: s.N, shutter: s.shutter, size: s.size, subject: String(s.subject ?? ''),
    move: s.move.type, handheld: s.handheld || null, exposure: s.exposure, scene: s.scene || null, note: s.note || '', fps: s.B.fps || 30, sensor: [s.B.w, s.B.h], coc: s.B.coc, stock: s.B.stock, gate: s.B.gate || null,
    profile: { dist: s.L.dist, vig: s.L.vig, cat: s.L.cat, bokeh: s.L.bokeh, squeeze: s.L.squeeze || 1, flare: s.L.flare, fringe: s.L.fringe, minFocus: s.L.minFocus } })); };
  // the world at t through its shot, without drawing (the sound scan and other tools that only need positions)
  window.evalAt = t => { if (!SHOTS) prepare(); const sh = shotAt(t); evaluate(t, sh); camera.updateMatrixWorld(true); return sh.id; };
  window.checkShots = () => { if (!SHOTS) prepare(); return C.check(ep, S, SHOTS, evaluate); };
  // a raw plate frame. HEAD: the colour plate stores 0..HEAD linear in 16 bits (3 stops of headroom over the key's white)
  const INFLIGHT = [], HEAD = C.HEAD = 8, fbuf = new Float32Array(PW * PH * 4);
  // uploads: over the shoot's WebSocket when there is one (window.plateSocket), else an HTTP POST
  let WS = null, wsId = 0; const ACK = new Map();
  window.plateSocket = port => new Promise(res => { WS = new WebSocket('ws://localhost:' + port); WS.binaryType = 'arraybuffer'; WS.onopen = () => res(true);
    WS.onmessage = m => { const a = JSON.parse(m.data), p = ACK.get(a.id); ACK.delete(a.id); if (p) a.error ? p[1](new Error(a.error)) : p[0](); }; });
  const post = (url, body) => WS ? new Promise((res, rej) => { const id = ++wsId; ACK.set(id, [res, rej]); WS.send(JSON.stringify({ id, url })); WS.send(body); })
    : fetch(url, { method: 'POST', body }).then(r => { if (!r.ok) throw new Error('plate upload failed ' + url); });
  window.plate = async (t, i, base, o = {}) => { if (!SHOTS) prepare(); const sh = SHOTS[i], sub = o.subframes ?? sh.subframes ?? C.subframesFor(sh), t0 = performance.now();
    const pose = renderColour(t, sh, sub); R.readRenderTargetPixels(rtAcc, 0, 0, PW, PH, fbuf); const t1 = performance.now();
    const col = new Uint16Array(PW * PH * 3), sc = 65535 / HEAD; for (let y = 0; y < PH; y++) { const src = (PH - 1 - y) * PW * 4, dst = y * PW * 3; for (let x = 0; x < PW; x++) { const s = src + x * 4, d = dst + x * 3;
      col[d] = Math.min(65535, Math.max(0, fbuf[s] * sc + .5)); col[d + 1] = Math.min(65535, Math.max(0, fbuf[s + 1] * sc + .5)); col[d + 2] = Math.min(65535, Math.max(0, fbuf[s + 2] * sc + .5)); } }
    let dep = null, mot = null; if (o.depth !== false) { renderDepth(t, sh); R.readRenderTargetPixels(rtD, 0, 0, PW, PH, fbuf); dep = new Uint16Array(PW * PH); mot = new Uint16Array(PW * PH * 3);
      for (let y = 0; y < PH; y++) { const src = (PH - 1 - y) * PW * 4, dst = y * PW; for (let x = 0; x < PW; x++) { const s = src + x * 4, d = dst + x; dep[d] = Math.min(65535, Math.max(0, fbuf[s] * 1000));   // depth in mm (sky = 65.535 m)
        mot[d * 3] = Math.min(65535, Math.max(0, fbuf[s + 1] * 256 + 32768)); mot[d * 3 + 1] = Math.min(65535, Math.max(0, -fbuf[s + 2] * 256 + 32768)); mot[d * 3 + 2] = 32768; } } }   // motion: x right, y down, px × 256 + 32768
    const t2 = performance.now(); PS.drawHud(t, S); const ov = await new Promise(r => PS.hud.toBlob(r, 'image/png'));
    // uploads overlap the next frames' rendering (the encoders are the slow part); at most 2 frames in flight, flushed at the end of a shot
    if (!o.dry) INFLIGHT.push(Promise.all([post(`${base}/color`, col.buffer), dep && post(`${base}/depth`, dep.buffer), mot && post(`${base}/motion`, mot.buffer), post(`${base}/overlay`, ov)])); while (INFLIGHT.length > 2) await INFLIGHT.shift();
    return { t, focus: +S.pose.focus.toFixed(4), f: +S.pose.f.toFixed(3), fov: +S.pose.fov.toFixed(4), gain: gainOf(sh), clamped: !!S.pose.focusClamped, lights: S.light.lights.length, dropped: S.light.dropped,
      ms: { render: +(t1 - t0).toFixed(1), depth: +(t2 - t1).toFixed(1), upload: +(performance.now() - t2).toFixed(1) } }; };
  window.flushPlates = async () => { while (INFLIGHT.length) await INFLIGHT.shift(); return true; };
  // motion blur by averaging sub-frames across the shutter: 4 at 180 degrees, 8 for fast moves (measured in Phase 2: ~2 ms a frame, so it is the default;
  // the motion plate stays, and --post --mb=post blurs from it instead)
  C.subframesFor = sh => /whip-pan|crash-zoom/.test(sh.move.type) || sh.handheld === 'running' ? 8 : sh.shutter <= 45 ? 1 : 4;
  window.plateInfo = () => ({ w: PW, h: PH, head: HEAD, hud: [PS.LW, PS.LH] });
  LT.reset(); Promise.all(['bold 18px "Courier New"', 'bold 26px Arial'].concat(ep.fonts || []).map(f => document.fonts.load(f))).then(() => { ep.build(S); window.ready = true; });
};
})();
