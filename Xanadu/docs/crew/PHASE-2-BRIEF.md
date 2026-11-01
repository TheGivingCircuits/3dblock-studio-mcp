# Phase 2 brief: the cinema camera, the lighting engine and the shoot/post split

From the approved plan (Claude Doc "TikTok Video Machine: Production Suite Plan", 2026-10-24). Read `docs/crew/HOUSE-RULES.md` first, then `studio/lib/ps1.js` and `studio/episodes/the-cursed-tape-ps1/scene.js` for the idiom. Do not change any existing episode. New code goes in new files; existing episodes must still render exactly as before.

## Deliverables
1. `studio/lib/camera.js` (loads after ps1.js, exposes `window.CAM`).
2. `studio/lib/lights.js` (loads after ps1.js, exposes `window.LIGHTS`).
3. `studio/lib/post.js` plus `studio/lib/post/grades/*.json`: the post stack working on raw plates.
4. `studio/render.mjs` gains `--shoot` (raw plates) and `--post` (plates to take). `--final` still works for old episodes.
5. Two test episodes under `studio/tests/`: `lens-test` and `light-test`, rendered as takes, opened on Chria's screen.
6. `docs/crew/phase-2-report.md`: what was built, what the tests showed, render times, plate sizes, anything that did not work.

## 1. Camera (`lib/camera.js`)
- Shots in film terms. A shot object: `{ id, at, dur, body, lens, stop, shutter, size, subject, focus, pull, move, handheld, exposure, ease, note }`.
  - `at`: `['L3', 'word', offset]` like today's `T()` or a time in seconds. `dur` in seconds.
  - `body`: `large-format` (36 x 24 mm), `super35` (24.9 x 18.7), `16mm` (10.3 x 7.5), `super8` (5.8 x 4.0, 18 fps cadence, rounded gate), `camcorder` (1/3 in, Strange History only). The body sets the sensor size, the default grain stock and gate look.
  - `lens`: `'14mm'`, `'18mm'`, `'24mm'`, `'28mm'`, `'35mm'`, `'50mm'`, `'85mm'`, `'135mm'`, `'200mm'`, `'100mm-macro'`, `'40mm-anamorphic'`, `'vintage-zoom'`. Each lens is a profile: focal length, barrel distortion, vignette, bokeh shape (round, oval for anamorphic, cat-eye at the edges), flare style, minimum focus. Vertical field of view comes from focal length and sensor height (replace `PS.lens`, keep it as an alias).
  - `stop`: `'f/1.4'` to `'f/16'`. Depth of field from the real circle-of-confusion formula: coc = |D - S| / D * f² / (N * (S - f)), with the body's acceptable coc. The post stage turns it into blur per pixel from the depth plate. Replace the hand-tuned `blur` number; keep it working for old scenes.
  - `shutter`: shutter angle, 180 by default. Motion blur by averaging sub-frames (4 at 180 degrees, 8 for fast moves); the motion plate records per-pixel velocity so post can blur instead, whichever is faster at 1080p. Measure both and pick.
  - `size`: `ECU`, `CU`, `MCU`, `MS`, `WS`, `EWS` works out the camera distance from the lens and the subject's height. `subject`: a named object or a character part (`sally.eyes`, `hitch.hand`). `focus`: a target; `pull: ['target', t]` eases focus to a second target.
  - `move`: `static`, `pan`, `tilt`, `dolly`, `truck`, `crane`, `orbit`, `steadicam`, `whip-pan`, `crash-zoom`, `push-in`, `drone`, `pov:<character>` (mounted on the head bone, shakes with the walk or run cycle). `handheld`: `calm`, `nervous`, `running` (layered noise, not random jitter).
  - `exposure`: stops relative to the gaffer's key for the scene. The camera applies it before the raw plate is written.
  - Helpers: `CAM.ots(a, b)`, `CAM.two(a, b)`, `CAM.line(scene, [p1, p2])` with a 180-degree check that warns.
  - Safety: before a shoot, `CAM.check()` casts a ray from the camera to the subject and flags geometry in between, and flags a camera inside any mesh's bounding box.
- Each shot renders as its own clip (a folder of frames plus a 480p preview), named by shot id, so one shot can be re-shot alone.

## 2. Lighting (`lib/lights.js`)
- Today's shader has 3 point lights, a flat ambient and fog. Replace that with a light list of up to 8 lights per shot (pick the 8 strongest at the subject per shot, fade between sets), still per-vertex and chunky, plus a sun direction, a sky colour and a ground bounce colour.
- `LIGHTS.sky({ time, date, place, weather, sun: { freeze, azimuth, elevation, kelvin, stops }, skylight })`: computes the sun's position from time, date and place, its kelvin and strength, and the skylight and bounce colours. Weather: `clear`, `haze`, `overcast`, `storm`, `fog`, `night`, `moon`. Any value can be overridden by hand. `LIGHTS.sun.ease(from, to, t0, dur)` moves it across a scene.
- `LIGHTS.light({ name, fixture, kelvin, stops, at, aim, soft, gel, beam })`. Fixtures: `fresnel`, `softbox`, `panel`, `hmi-window`, `bounce`, `neg-fill` (a negative light that darkens one side). Inverse-square falloff in metres, beam angle for spots, softness as a light radius.
- `LIGHTS.practical({ fixture, in, kelvin, stops, flicker, seen })`. Fixtures: `table-lamp`, `ceiling-lamp`, `tube`, `bulb`, `tv`, `candle`, `fire`, `flashlight`, `headlights`, `dash`, `police`, `neon`, `lightning`. Flicker profiles: `old-bulb`, `candle`, `crt`, `tube-start`, `lightning`, `swing` (the light moves). `seen: true` adds a glowing emissive mesh so it is a bright source in the raw plate (and a bokeh ball when out of focus).
- `LIGHTS.setup(name, anchors)`: `three-point`, `rembrandt`, `window`, `moonlight`, `underlit`, `backlit`, `car-night`, `campfire`, placed relative to the named actor or set point so they move with the blocking.
- Shadows: a low-resolution shadow map for the sun or the key (hard for the sun, softer for big sources), and a contact shadow blob under feet and props. They must look PS1, not smooth.
- Atmosphere: haze density per scene, god rays and flashlight beams from the haze, dust particles in sunbeams.
- Everything in stops: a light's `stops` is relative to a scene reference (0 = the key). `LIGHTS.keyStops(scene)` is what the camera's `exposure` reads. Define this scale once here.

## 3. Shoot, plates and post
- `--shoot <slug>` renders every shot in the shot list at 1080 x 1920 as raw plates: a linear colour plate (16-bit PNG or EXR if ffmpeg can read it, else 8-bit with a log curve), a depth plate and a motion plate, into `/Volumes/T7 footage/plates/<slug>/take-NN/<shot>/`. No grade, grain, letterbox or HUD. Captions and the title card are a separate overlay plate so post can place them.
- `--post <slug>` reads the plates, `edit.json` (for now: the shot order and timings from the shot list), `grade.json` and `mix.json` (for now: today's spec audio path), and writes the take exactly where `--final` writes it today, with the same checks (length, LUFS, loop seam SSIM) and opens it.
- `lib/post.js`: depth-of-field from the depth plate using the shot's lens and stop (bokeh shape from the lens profile, cat-eye at the edges), motion blur from the motion plate if chosen, distortion, chromatic fringe, vignette, flares; the film layer: halation (red-orange glow around highlights above a threshold), bloom and highlight roll-off, grain by stock (`large-format`, `super35`, `16mm`, `super8`) stronger in shadows, gate weave, flicker, dust and scratches, light leaks, the Super 8 rounded gate and frame-line bleed; the grade: lift, gamma, gain, saturation, contrast, temperature, per-shot blocks, a print curve, a vibrancy ceiling; letterbox only if asked. Power grades in `lib/post/grades/`: `70s-texas-sun`, `blue-night`, `vhs-90s`, `2002-cyan`, `super8-home-movie`, `bleach-bypass`, `teal-orange`, with today's `PS.GRADES` values as the starting point.
- Post must run in seconds per shot, not minutes: do it on the GPU in the browser (a second three.js pass over the plates) or with ffmpeg filters, whichever is faster. Measure.

## 4. The tests
- `lens-test`: one dressed set (a simple room with a box person at 2 m, a lamp at 1 m and a window at 6 m), shot on every lens at f/1.4, f/4 and f/11, 1.5 s each, with a focus pull on the 85 mm. One take, about 60 s.
- `light-test`: the same set outdoors in front of a cabin, the sky run from 05:30 to 22:00 over 40 s with a frozen camera, then 20 s of practicals: a lantern swinging, a TV in a dark room, headlights sweeping, lightning.
- Render both as takes, open them on Chria's screen, send the 720p previews, mirror to the T7. Record render times per stage and plate sizes in the report.

## Hard limits
- The PS1 look stays (tiny textures, chunky shading, box people). No smooth shadows, no PBR.
- Existing episodes render unchanged. Run The Cursed Tape PS1 `--stills` before and after and compare.
- No new npm dependencies without a note in the report. Node is `.tools/node/bin/node`.
- Never touch `studio/episodes/the-hitchhiker/`.
