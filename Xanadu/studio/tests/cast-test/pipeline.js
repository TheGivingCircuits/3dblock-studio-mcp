// HITCHHIKER PIPELINE TEST (Studio Tests #3). Runs a copy of the finished "The Hitchhiker" scene through the cinema camera, the lighting engine,
// raw plates and post, without rebuilding it: the geometry, the blocking, the blood and the detail pass are the episode's own (scene.js is a
// copy of studio/episodes/the-hitchhiker/scene.js with three changes: LIGHTS.use(), CAM.episode(HH.adapt(...)) and the lights/camera files).
// This adapter: (1) keeps the episode's hand-built camera path (its keyframes, drift and shake, the overhead case shot) as the position and look
// of every shot, and reads the film side of each shot from shots.json (body, lens, the exact focal length, stop, ISO, focus); (2) lights the
// world from lights.json through lib/lights.js (the old per-place ambient and 3 point lights still run but drive nothing); (3) carries the old
// engine's fades and white flashes into the plates. Load order: three, lib.js, ps1.js, lights.js, camera.js, pipeline.js, scene.js.
(function () {
const HH = window.HH = {}, { P, lerp, eio, clamp, T: TR, st, en } = PS1, V = (x, y, z) => new THREE.Vector3(x, y, z);
const load = f => { const x = new XMLHttpRequest(); x.open('GET', f, false); x.send(); return x.status === 200 ? JSON.parse(x.responseText) : null; };
HH.SHOTS = load('shots.json'); HH.LIGHTS = load('lights.json');
const refT = (r, S) => r == null ? null : r === 'cutBack' ? S.cutBack : typeof r === 'number' ? r : TR(r);
// the scene's own camera: its keyframe chain exactly as ps1.js blends it (each keyframe eases from the last over its duration), plus the
// same gentle drift and hit-shake, plus the overhead shot of the case at both ends (the loop seam)
const fovOf = f => typeof f === 'string' ? PS1.lens(parseFloat(f)) : (f ?? 58);
let CACHE = { t: null };
function oldCam(t, S) { if (CACHE.t === t) return CACHE; const SH = S.OLD; let cp = SH[0][2].clone(), cl = SH[0][3].clone(), fov = fovOf(SH[0][4]), focus = (SH[0][5] || {}).focus ?? 3;
  for (const [t0, d, p, l, f, o = {}] of SH) { const k = (o.ease === 'linear' ? clamp : eio)(P(t, t0, d)); if (k <= 0) break; cp.lerp(p, k); cl.lerp(l, k); fov = lerp(fov, f == null ? fov : fovOf(f), k); focus = lerp(focus, o.focus ?? focus, k); }
  const hh = (a, b) => Math.sin(t * a) * .5 + Math.sin(t * b + 1.3) * .5, ep = S.EP, shake = (ep.shake ? ep.shake(t, S) : 0) + S.hits.reduce((s, h) => s + (t > h && t < h + .45 ? Math.exp(-(t - h) * 10) * .02 : 0), 0);
  cp.add(V(hh(1.3, 2.9) * .022 * .35 + Math.sin(t * 47) * shake, hh(1.7, 3.3) * .018 * .35 + Math.cos(t * 39) * shake, 0)); cl.add(V(hh(1.1, 2.3) * .028 * .35, hh(1.9, 2.7) * .022 * .35, 0));
  const cs = S.caseCam, w = clamp(1 - eio(P(t, S.open - .45, 1.1)) + (t >= S.cutBack ? 1 : 0));
  CACHE = { t, pos: cp.lerp(cs[0], w), look: cl.lerp(cs[1], w), fov: lerp(fov, cs[2], w), up: V(0, 1 - w, -w).normalize(), w, focus }; return CACHE; }
// the phase (place + time of day) at t, from lights.json
HH.phaseAt = (t, S) => { const place = where(t, S); let best = null; for (const ph of HH.LIGHTS.phases) { if (ph.place !== place) continue; const a = refT(ph.from, S), b = refT(ph.to, S);
    if ((a == null || t >= a) && (b == null || t < b)) { best = ph; break; } } return best || HH.LIGHTS.phases.find(p => p.place === place) || HH.LIGHTS.phases[0]; };
// default film choices for a converted keyframe (what the DP would pick for that shot); shots.json overrides any of them
const LENS_EQ = ['14mm', '18mm', '24mm', '28mm', '35mm', '50mm', '85mm', '135mm', '200mm'];
HH.defaults = (k, i, S) => { const [t0, d, p, l, f, o = {}] = k, body = HH.LIGHTS.body || '16mm', B = CAM.BODIES[body], fov = fovOf(f), focal = +(B.w / (2 * Math.tan(fov * Math.PI / 360))).toFixed(2);
  const s35 = 24.9 / (2 * Math.tan(fov * Math.PI / 360)), lens = LENS_EQ.reduce((a, b) => Math.abs(parseFloat(b) - s35) < Math.abs(parseFloat(a) - s35) ? b : a);
  const ph = HH.phaseAt(t0 + Math.min(d, .05) + .001, S), night = /night/.test(ph.name), inside = !!ph.interior, blur = o.blur ?? 0;
  const stop = blur >= .5 ? 'f/2' : blur >= .3 ? 'f/2.8' : blur >= .2 ? 'f/4' : night || inside ? 'f/2.8' : 'f/5.6', N = parseFloat(stop.slice(2));
  return { id: `S${String(i + 1).padStart(2, '0')}`, body, lens, focal, stop, iso: Math.round(800 * (N / 4) ** 2), focus: o.focus != null ? 'chain' : 'look', move: d <= .05 ? 'cut' : p.distanceTo(i ? S.OLD[i - 1][2] : p) < .3 ? 'pan' : 'track', exposure: 0, phase: ph.name }; };
HH.adapt = ep => ({
  fonts: ep.fonts, capY: ep.capY, capColor: ep.capColor, hud: ep.hud,
  build(S) { S.EP = ep; ep.build(S); S.U = PS1.U;   // the episode's own lighting code writes to the old engine's uniforms, which no material reads any more
    const O = S.O, C = HH.LIGHTS;
    for (const k of ['sun0', 'sun1', 'sun2', 'sun3']) if (O[k]) O[k].material.uniforms.glow.value = C.sunGlow ?? 2.4;   // the painted suns become real highlights (bloom, halation)
    // the pump globes are unlit lamps; at the pumps they sat in front of the lens and bloomed into a hot blob: half as bright
    O.g.station.traverse(o => { if (o.isMesh && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - .16) < 1e-3 && o.material.uniforms) o.material.uniforms.tint.value.multiplyScalar(.5); });
    // marks for lights that move with things: the flashlight and its beam target, the pickup's headlights
    const child = (parent, x, y, z) => { const g = new THREE.Object3D(); g.position.set(x, y, z); parent.add(g); return g; };
    LIGHTS.mark('torch', child(O.torch, 0, 0, .12)); LIGHTS.mark('torchAim', child(O.torch, 0, 0, 3)); LIGHTS.mark('pickL', child(O.pick, -.62, .85, -3.1)); LIGHTS.mark('pickR', child(O.pick, .62, .85, -3.1));
    LIGHTS.mark('pickAimL', child(O.pick, -.5, .3, -14)); LIGHTS.mark('pickAimR', child(O.pick, .5, .3, -14));
    // the sky, sun and haze follow the phase; the lights come from lights.json, each switched on by its phases (and an optional narration window)
    const ph = t => HH.phaseAt(t, S), num = (v, d) => v ?? d;
    LIGHTS.sky({ date: C.date, place: C.place, time: t => ph(t).time, weather: t => ph(t).weather || 'clear', sun: { azimuth: t => ph(t).sun.azimuth, elevation: t => ph(t).sun.elevation, kelvin: t => ph(t).sun.kelvin, stops: t => num(ph(t).sun.stops, 0) },
      skylight: t => num(ph(t).skylight, -2.2), interior: t => ph(t).interior || 0, moonAz: t => (ph(t).moon || {}).azimuth ?? 140, moonEl: t => (ph(t).moon || {}).elevation ?? 35, shadowSize: C.shadowSize || 14, ground: C.ground });
    LIGHTS.atmosphere({ haze: t => ph(t).haze, color: t => ph(t).fog, beams: C.beams ?? 12 });
    for (const l of C.lights) { const phases = new Set(l.phases), win = l.on; const o = { ...l, when: t => phases.has(ph(t).name) && (!win || (t >= refT(win[0], S) && t < (refT(win[1], S) ?? 1e9))) };
      delete o.on; delete o.phases; if (l.glowMesh) o.glowMesh = O[l.glowMesh]; LIGHTS[l.kind === 'practical' ? 'practical' : 'light'](o); }
  },
  prepare(S) { const ids = Object.keys(NB.TL.lines), last = ids[ids.length - 1]; S.last = last; S.open = TR(ep.open || ['L1', 'this', .1]); S.closeUp = en(last) - .05; S.lidOpen = S.open - .75;
    S.cutBack = S.closeUp + .3; S.lidShut = S.closeUp + 1.3; S.hits = []; ep.prepare && ep.prepare(S); S.OLD = ep.shots(S); CACHE = { t: null }; },
  // every keyframe of the old camera becomes a shot: its position and look come from the old chain, its film side from shots.json
  shots(S) { const J = HH.SHOTS || [], cam = t => oldCam(t, S); HH.used = [];
    return S.OLD.map((k, i) => { const def = HH.defaults(k, i, S), j = { ...def, ...(J[i] || {}) }; HH.used.push(j); const look = t => cam(t).look.clone(), focusOld = t => cam(t).focus;
      return { id: j.id, at: k[0], body: j.body, lens: j.lens, focal: t => (j.body ? CAM.BODIES[j.body] : CAM.BODIES.super35).w / (2 * Math.tan(cam(t).fov * Math.PI / 360)), stop: j.stop, iso: j.iso, exposure: j.exposure, nd: j.nd || 0,
        pos: t => cam(t).pos.clone(), look, up: t => cam(t).up.clone(), subject: look, focus: j.focus === 'chain' ? focusOld : typeof j.focus === 'number' ? j.focus : undefined, scene: j.phase, note: j.note || '', expose: j.expose || 'key' }; })
      // the cut back to the case is not a keyframe of its own in the old list: give it the opening shot's camera settings and focus on the case
      .concat([{ ...((s0, j0) => ({ body: j0.body, lens: j0.lens, stop: j0.stop, iso: j0.iso, exposure: j0.exposure, nd: j0.nd || 0 }))(S.OLD[0], HH.used[0]), id: 'CASE', at: S.cutBack - .02,
        focal: t => CAM.BODIES[HH.used[0].body].w / (2 * Math.tan(cam(t).fov * Math.PI / 360)), pos: t => cam(t).pos.clone(), look: t => cam(t).look.clone(), up: t => cam(t).up.clone(), subject: t => cam(t).look.clone(), scene: 'station-day', note: 'back to the case: the loop seam', expose: 'key' }]); },
  update(t, S, sh) { S.U = PS1.U; S.flares = []; ep.update(t, S); const c = S.case; if (c) c.open(eio(P(t, S.lidOpen, .6)) * (1 - Math.pow(P(t, S.lidShut, .45), 2))); },
  // the old engine's dip to black at the cut back to the case, the episode's own fades, and its white flashes
  gain: (t, S) => (ep.fade ? ep.fade(t, S) : 1) * clamp(Math.abs(t - S.cutBack) / .22),
  add: (t, S) => ep.flash ? ep.flash(t, S) * 1.0 : 0,
  shadowCenter: t => oldCam(t, CAM.S).look,
});
HH.exportShots = () => JSON.stringify(HH.used, null, 1);
})();
