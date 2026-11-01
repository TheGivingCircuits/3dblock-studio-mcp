# Phase 2 report: the cinema camera, the lighting engine, the shoot/post split

Built 2026-10-24 to `docs/crew/PHASE-2-BRIEF.md`. Both test takes rendered at 1080 x 1920, opened on Chria's screen and mirrored to the T7. Existing episodes are unchanged: the before and after Cursed Tape PS1 `--stills` contact sheets are byte-identical (md5 `b445501f18b8c93bac60467f46211369`).

## What was built
1. **`studio/lib/camera.js` (`window.CAM`)**, the cinema camera.
   - Shots are written in film terms: `id, at, dur, body, lens, stop, shutter, size, subject, angle, focus, pull, move, handheld, exposure, ease, note`, with optional `pos`/`look` to place the camera by hand.
   - Bodies: large-format, Super 35, 16mm, Super 8 (18 fps cadence, rounded gate) and camcorder. Each body sets the sensor, the acceptable CoC, the grain stock and the gate.
   - 12 lens profiles: focal length, distortion, vignette, bokeh shape (round, oval for anamorphic), cat-eye, flare style (ghosts, streak, warm), minimum focus and fringe.
   - Field of view comes from focal length and sensor. `PS1.lens` stays as an alias with the old numbers.
   - The real CoC formula is used, plus `CAM.dof()` for near/far limits.
   - Shot sizes ECU to EWS set the camera distance from the lens.
   - Subjects can be people (`man.eyes`, `her.hand`, …), objects or marks. `pull` runs one focus pull or a chain of them.
   - Moves: static, pan, tilt, dolly, push-in, truck, crane, orbit, steadicam, whip-pan, crash-zoom, drone, `pov:<character>`.
   - Handheld calm / nervous / running is layered noise, not jitter. `exposure` is in stops relative to the gaffer's key, or `exposureMode: 'fixed'`.
   - `CAM.ots`, `CAM.two` and `CAM.line` (the 180-degree line).
   - `CAM.check()` runs at three points in every shot: a ray from lens to subject, a camera-inside-a-mesh check, and the 180-degree line.
   - `CAM.episode()` runs a scene: `seek` for quick looks and `--stills`, `plate` for raw plates.
2. **`studio/lib/lights.js` (`window.LIGHTS`)**, the lighting engine.
   - Still per-vertex and chunky.
   - Up to 8 lights per frame: the 8 strongest at the shot's subject.
   - The sun's position comes from time, date and place (NOAA approximation). Its kelvin and strength follow elevation, and the sky and ground-bounce colours follow the sun.
   - Weather: clear, haze, overcast, storm, fog, night, moon.
   - `LIGHTS.sun.ease()` moves the sun through a scene.
   - Film fixtures: fresnel, softbox, panel, HMI window, bounce and negative fill, with inverse-square falloff in metres, beam angle, softness and gels.
   - Practicals with flicker profiles: old bulb, candle, fire, CRT, tube start, lightning, police and swing. A practical can be seen in shot as a glowing mesh.
   - 8 setups placed on the actor or a mark: three-point, Rembrandt, window, moonlight, underlit, backlit, car night, campfire.
   - Shadows come from a 256 px shadow map, from the sun, or from a light with `shadow: true` (the lantern). The lookup is nearest, so shadows stay blocky, PS1-style. There are also contact-shadow blobs.
   - Haze drives the fog, beams for spot lights, sunbeams through windows (`godray`) and dust lit where it crosses a beam.
   - There is a sky dome with sun disc, moon and stars.
   - The stop scale is defined once at the top of the file, and `LIGHTS.keyStops(scene)` returns the key's level.
3. **`studio/lib/post.js` + `lib/post/post.html` + `lib/post/grades/*.json`**, the post stack, on the GPU in the browser.
   - It reads the 16-bit PNG plates with its own small PNG reader.
   - Lens stage: motion blur from the motion plate (optional), barrel distortion, depth of field from the depth plate with the shot's real lens and stop, cat-eye and oval bokeh, and colour fringe.
   - Light effects: halation, bloom, ghost flares, and an anamorphic streak.
   - Grade: highlight roll-off, the house gamma, lift/gamma/gain, contrast, a print curve, saturation, temperature and a vibrancy ceiling.
   - Film layer: vignette, grain by stock (stronger in shadows), gate weave, flicker, dust and scratches, light leaks, the Super 8 rounded gate with frame-line bleed, and letterbox when asked.
   - Then the PS1 output stage (15-bit colour with Bayer dither) and the overlay plate on top.
   - Everything samples on the plate's pixel grid, so the frame stays chunky.
   - Power grades: `70s-texas-sun`, `blue-night`, `vhs-90s`, `2002-cyan`, `super8-home-movie`, `bleach-bypass`, `teal-orange` and `neutral`. Each started from today's `PS.GRADES` values; teal-orange is new.
4. **`studio/render.mjs` gains `--shoot` and `--post`.**
   - `--shoot [--shot=ID --take=N] [--subframes=N] [--strict]` writes raw plates. One shot can be re-shot alone into an existing take.
   - `--post [--take=N] [--mb=post]` writes the next take exactly where `--final` does, runs the same checks (length, LUFS, loop-seam SSIM, thumbnail, contact sheet), writes a 720p preview to `<episode>/previews/`, appends to the take's `production.log`, and opens the take.
   - `--final`, `--stills`, `--voice` and `--pick` behave as before. The checks moved into a shared `verify()`; the code is the same.
   - Test scenes in `studio/tests/<slug>/` are found too.
   - The node side lives in `studio/lib/shoot.mjs` and `studio/lib/post-run.mjs`.
   - Plates go to `/Volumes/T7 footage/plates/<slug>/take-NN/<shot>/` (the T7 was mounted). If it is not mounted, they go to `~/Desktop/Shorts Studio Support/plates/`.
   - Per shot: `color/` holds 16-bit RGB, linear, 0–8 (3 stops of headroom). `depth/` holds 16-bit mm. `motion/` holds 16-bit, px × 256 + 32768. `overlay/` holds 8-bit RGBA captions and title card.
   - Each shot also gets `preview.mp4` (480p dailies) and `shot.json` (lens, body, per-frame focus, timings). Each take gets `take.json` (timeline, shot list, checks, timings, size), plus `edit.json`, `grade.json`, `post.json` and `production.log` once it is posted.
5. **Tests:** `studio/tests/lens-test/` and `studio/tests/light-test/`, each with `spec.js`, `scene.js`, `index.html` and `grade.json`. Their sound is only sound effects already in the ElevenLabs cache, so they cost nothing.
6. **Supporting changes**, all additive. Without the new flags nothing behaves differently.
   - `studio/lib/ps1.js`: one export line at the end (renderer, render target, HUD) for the new modules.
   - `notebook/make.mjs`: `--timeline=<json>` writes the narration timeline and stops; `--video=<silent.mp4>` mixes the sound onto a finished picture.

## File list
New:
- `studio/lib/camera.js`
- `studio/lib/lights.js`
- `studio/lib/post.js`
- `studio/lib/shoot.mjs`
- `studio/lib/post-run.mjs`
- `studio/lib/post/post.html`
- `studio/lib/post/grades/{70s-texas-sun,blue-night,vhs-90s,2002-cyan,super8-home-movie,bleach-bypass,teal-orange,neutral}.json`
- `studio/tests/lens-test/{spec.js,scene.js,index.html,grade.json}`
- `studio/tests/light-test/{spec.js,scene.js,index.html,grade.json}`
- `docs/crew/{HOUSE-RULES.md,PHASE-2-BRIEF.md,dry-run-the-cursed-tape.md}` (from the Phase 1 bundle)
- this report

Changed:
- `studio/lib/ps1.js` (+2 lines)
- `studio/render.mjs`
- `notebook/make.mjs`
- `docs/PLAN - Studio Kit (camera, cast, sets, post).md` (the superseded line added at the top)

Not installed: the 11 `.claude/agents/*.md` crew briefs. The auto-mode classifier blocked writing into `.claude/` as self-modification. They are unpacked and checked (checksum matched) in the session scratchpad; Chria needs to allow that one extraction.

## Takes
- Lens Test, Take 02 (current): `~/Desktop/Videos/Studio Tests/01 - Lens Test/takes/Lens Test - Take 02.mp4`. 60.00 s, −14.0 LUFS, 156 MB.
- Lens Test, Take 01: the same with the first, mis-framed focus pull. Kept, because takes are never deleted.
- Light Test, Take 01: `~/Desktop/Videos/Studio Tests/02 - Light Test/takes/Light Test - Take 01.mp4`. 60.00 s, −14.3 LUFS, 170 MB.
- 720p previews (3.5–6.5 MB) are in each test's `previews/` folder. Everything is mirrored to `/Volumes/T7 footage/Desktop Videos/Studio Tests/` (8 files, sizes verified, `._*` removed).

## What the lens test showed
- The setup: one Super 35 camera position, a box person at 2 m, a table lamp at 1 m, a window at 6 m with afternoon sun through it. Every lens at f/1.4, f/4 and f/11, 1.5 s each, then an 85 mm pull. The on-screen slate gives the lens, stop, focus distance, sharp zone and field of view.
- The focal lengths behave like real ones. The 14 mm (83° vertical) holds the whole room, the lamp in the foreground and the sun patches on the floor. The 50 mm (28°) is a medium close-up. The 85 mm (16.7°) is a close-up. The 200 mm (7.1°) is an extreme close-up of the eyes. The 100 mm macro and the anamorphic land where expected.
- The depth of field follows the formula. On the 85 mm at f/1.4 the sharp zone is 1.87–1.94 m: the face is sharp, and the window and back wall go to soft bokeh. The 14 mm at f/11 is sharp from 0.63 m to infinity.
- The focus pull racks window (6.6 m) → eyes (2.6 m) → the lamp's distance (1.7 m). She goes soft, then sharp, then soft again.
- The PS1 look survives. Shading stays per-vertex, textures stay 8–16 px with nearest filtering, the blur is built from the plate's chunky pixels, and the 15-bit dither is on.
- Weak spots:
  - At f/4 and f/11 on the shorter lenses the DOF difference is subtle, because the set is shallow.
  - The 85 mm can't hold lamp, face and window in one frame, so the pull goes past the lamp's distance rather than to a visible lamp.
  - The lamp shade reads as a flat, very bright blob in the wide lenses.
  - The loop seam scores 0.84, because the head and end frames differ in grain, dust and the person's breathing. These are tests, not episodes, so I didn't chase it.

## What the light test showed
- 0–40 s, one frozen 18 mm frame: the sky runs 05:30 → 22:00 on 21 June in Texas. Sunrise is at azimuth ≈ 61°, noon reaches 83° high, and the sun sets in frame at ≈ 298°, with a lens flare and halation on the sun disc. Shadows sweep around the yard and lengthen at gold hour. The colour runs from blue hour to gold to night, and the cabin windows light up after dusk.
- The exposure is fixed, so dawn and dusk stay very dark (true to a fixed-exposure camera, but 06:00 is nearly black on a phone). A ramped exposure would look better in an episode.
- 40–45 s: the lantern swings on the porch, and its perspective shadow map makes the man's and the posts' shadows swing with it.
- 45–50 s: a CRT practical flickers on a seated viewer in a dark room.
- 50–55 s: headlights from a car behind the camera sweep right to left across the cabin and the man. The haze beams are faint.
- 55–60 s: three lightning strikes flash the whole scene and the sky, and it falls back to near black between them.
- Loop seam 0.75; the test doesn't loop by design.
- Problems found and fixed along the way:
  - A seated person floats about 0.4 m above a normal 0.42 m seat with `PS1.LEGS.sit`, because that pose puts the hips at 0.8 m. I lowered the body 0.36 m in the test. A proper sit pose belongs to the motion library.
  - My own mid-line `//` comment swallowed a `CAM.mark` call once. This is the `CLAUDE.md` warning; caught and fixed.

## Motion blur: measured, then chosen
On the swinging-lantern shot with a calm handheld camera:
- **Sub-frame averaging in the shoot:** the page's render time went from 7.5 ms per frame (1 sub-frame) to 9.6 ms (4 sub-frames).
- **Blur from the motion plate in post:** under 1 ms of GPU per frame.

Both are effectively free. The sub-frames are the default because they also blur what a velocity plate can't: a moving light's illumination and its shadow, and occlusion edges. The default is 4 sub-frames at 180°, 8 for whip-pans, crash-zooms and running handheld. Sub-frames never cross a cut, because the shutter is clamped inside the shot. The motion plate is still written, and `--post --mb=post` uses it instead.

## Render time per stage (Apple M4, 24 GB)
- **Lens test (39 shots, 1,800 frames):**
  - Shoot: 775 s (about 0.43 s per frame).
  - Post: 253 s (0.14 s per frame: plate load 59 ms, texture upload 20 ms, GPU 4 ms, frame grab 54 ms).
  - Mix: 2.6 s.
  - Re-shooting the PULL shot alone took 45 s.
- **Light test (5 shots, 1,800 frames):**
  - Shoot: 878 s.
  - Post: 303 s.
  - Mix: 2.9 s.
- **For comparison:** `--stills` on either test takes about 3 s.

Where the shoot time goes: the page's own work is about 70 ms per frame (render 6–10 ms, depth and motion pass 7 ms, readback, conversion and upload 55 ms). About 290 ms per frame is lost in the Puppeteer round trip and plate I/O. That is the next thing to speed up: batch several frames per `evaluate`, and write plates to the Mac's SSD and move them to the T7 afterwards. The T7 writes at only about 40 MB/s.

## Plate size per take
- Lens test take-02: 2.4 GB on the T7 (7,200 PNGs).
- Light test take-01: 1.4 GB.

Real data is about 0.5 MB per frame: colour 0.42 MB, depth 15 KB, motion 39 KB, overlay 19 KB. On disk it is about 1.3 MB, because the T7 is exFAT with 128 KB clusters, so every small PNG takes at least 128 KB. Packing depth, motion and overlay into one file per frame, or reformatting a plates partition with small clusters, would cut that by about 60 percent. The plates should be deleted when a final is picked, as the producer brief says.

## What did not work, or was cut
- **Plate resolution.** Plates are written at the PS1 render grid, 540 x 960 (`res: 1.5`, the Cursed Tape PS1 setting), not 1080 x 1920. Each plate pixel is a 2 x 2 block of the final frame, and post outputs 1080 x 1920. Rendering the 3D at 1080 x 1920 would smooth the polygon edges and lose the PS1 look, and it would quadruple plate size for no new detail.
- **Linear colour.** The colour plate is linear light × texture colour (texture values are used as painted, like the old engine), stored as 16-bit PNG with 3 stops of headroom. EXR was skipped: ffmpeg 6 can write it, but the browser-side reader would have been far more work than PNG.
- **Light sets.** The 8-light set is picked per frame, not faded between sets. Each test frame had at most 7 lights, so it never mattered; a scene with more than 8 lights near the subject could pop.
- **Lightning and the sky.** Lightning brightens the sky dome by a fixed amount, not by a physical model.
- **Exposure across stops.** The f-stop changes depth of field but not brightness. The lens test assumes ND or ISO compensation, as a real lens test would.
- **The lens test's exterior.** The sun through the window is a hand-set direction, not a clock time.
- **Interface for the crew.** `edit.json` and `mix.json` are the "for now" versions from the brief: the shot-list order, and the spec's own audio path. `grade.json` is fully read: a power grade, then overrides, then per-shot blocks. The tests use `neutral` to judge light and lenses, not a look.
- **New dependencies:** none.
- **Git:** the studio folder isn't a git repository, so there are no commits. Backups of the three changed files are in this session's scratchpad.
- **Not touched:** `studio/episodes/the-hitchhiker/`, and every existing episode's output. The Cursed Tape `stills.jpg` was regenerated by the requested before/after runs; it is byte-identical to the pre-work render.
