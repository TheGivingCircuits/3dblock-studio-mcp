> Superseded 2026-10-24 by the approved Claude Doc plan (https://claude.ai/artifact/2TgLZGbUQMyZGapFD8kpy2). The crew briefs are in .claude/agents/ and docs/crew/. Do not work from this file.
> SUPERSEDED: the current plan is the Claude Doc https://claude.ai/artifact/2TgLZGbUQMyZGapFD8kpy2. Do not work from this copy.

# Plan: the Studio Kit (cinema camera, raw + post, cast and wardrobe, sets and props)

Status: plan only. Nothing here is built yet. Written 2026-10-24 for Chria's review.

## Where we are today
- Every episode is a one-off `scene.js` of about 500 lines. People, cars, houses, trees and grass are rebuilt by hand each time.
- The camera is a list of positions plus `fov`, `focus` and `blur` numbers. Depth of field, bloom, grain, letterbox and the grade are all baked in during the render. To change the grade, you have to re-render the whole episode.
- The proven parts: the PS1 engine (`lib/ps1.js`, about 180 lines), the depth-buffer DOF, the colour grades, and the Hitchhiker detail pass (grass in the wind, wires, windmill, cattle, clouds, birds). The detail pass becomes the first set of reusable pieces.

## The goal
Faster episodes that look better. An episode should be about 150 lines: a cast sheet, a set list, blocking and a shot list. All the heavy lifting lives in shared libraries that get better with every episode.

---

## 1. The cinema camera (`lib/camera.js`)
A camera that works like a real one. Shots are written in film terms, and the rig works out the physics.

```js
shot({ at: 'L3.snaps', dur: 1.2, body: 'large-format', lens: '50mm', stop: 'f/1.4',
       subject: 'sally.head', size: 'CU', move: 'dolly-in 0.4m', focus: 'sally.eyes', pull: 'hitch.hand@0.6' })
```

**Bodies** (sensor size sets the field of view and the depth of field). These are named by format, not brand. Each body also carries its default grain and gate look:
- **large format:** Venice / Alexa LF class.
- **super 35:** the classic cinema format.
- **16mm**
- **super 8:** small, soft and gritty.
- **camcorder:** the Cursed Tape look.

**Lenses** (each is a profile: focal length, distortion, vignette, bokeh shape, flare style, minimum focus):
- **ultra wide:** 14mm and 18mm.
- **wide:** 24mm and 28mm.
- **normal:** 35mm and 50mm.
- **portrait:** 85mm.
- **tele:** 135mm and 200mm.
- **macro:** 100mm, with paper-thin focus for close-ups of eyes, keys and blood drops.
- **anamorphic set:** oval bokeh and horizontal streak flares.
- **vintage zoom:** for 70s crash zooms.

**Exposure:**
- **f-stop:** drives the blur through a real circle-of-confusion formula, replacing today's hand-tuned blur numbers.
- **Shutter angle:** 180° gives true motion blur by averaging sub-frames, so fast moves smear like film.

**Focus:** the focus distance follows a named target (an actor's eyes, a prop). It also supports rack focus and focus pulls with an easing curve, like a 1st AC pulling focus.

**Moves:**
- static, pan, tilt, dolly, truck, crane or jib, orbit
- Steadicam (smooth float), handheld (layered shake profiles: calm, nervous, running)
- whip pan, crash zoom, push-in, and drone or aerial
- POV mounted on a character's head, so first-person shots shake with the walk or run cycle.

**Coverage helpers:**
- Shot sizes (`ECU`, `CU`, `MCU`, `MS`, `WS`, `EWS`) work out the camera distance from the lens and the subject.
- `ots('sally', 'hitch')` sets up an over-the-shoulder shot.
- `two('a', 'b')` sets up a two-shot.
- A 180° line check keeps every cut on the same side of the action.

**Safety:** before rendering, a checker flags any camera that is inside geometry or has a wall in front of the subject. Today I find those by eye in stills.

## 2. Shoot raw, then post (`render.mjs` split into **shoot** and **post**)
- **Shoot:** renders clean frames with no grade, grain or letterbox, plus a depth pass and a motion pass. These raw plates are saved per episode, like camera originals.
- **Post:** a separate stage that only works on the plates, so it takes seconds per change instead of a full re-render:
  - **Lens:** DOF from depth, bokeh shape, distortion, chromatic aberration, vignette, flares.
  - **Film:** halation (the red glow around highlights), bloom, grain by stock (35mm fine, 16mm, Super 8 heavy), gate weave, flicker, dust and scratches, light leaks.
  - Super 8 also gets its rounded gate and frame-line bleed.
  - **Grade:**
    - lift, gamma and gain, saturation and contrast, temperature
    - per-shot grades, plus a film print curve (a warm, contrasty, 2383-style look)
  - **Power grades:** saved, named recipes (`70s-texas-sun`, `blue-night`, `vhs-90s`, `bleach-bypass`) we can reuse across episodes.
- **The colourist agent:** a separate AI step that reads the episode's notes on the film's look and the raw plates. It writes `grade.json` (a power grade plus per-shot tweaks), checks it on stills, and hands it to post. Changing the look never touches the 3D.

## 3. Cast and wardrobe (`lib/cast/`)
Characters are built from parts, never redrawn from scratch.

- **Bodies:**
  - **Types:** man, woman, teen, child, big (Leatherface size), elderly, frail.
  - **Proportions:** height, build and shoulder width as sliders.
  - **Skeleton:** a real one (hips, spine, neck, head, shoulders, elbows, hands, hips, knees, feet).
  - Everything worn on the head is attached to the head bone, which is today's hair fix built in from the start.
- **Heads and faces:**
  - skin tones
  - face textures with an expression set (neutral, scared, screaming, smiling, dead)
  - blinking and mouth movement on lines.
- **Hair library:**
  - **Styles:** short, shag, long, ponytail, 70s feathered, bald, grey.
  - **Extras:** beards and moustaches.
  - **Colour:** any style can take any colour.
- **Wardrobe library:**
  - **Clothes:** tops, bottoms, shoes, jackets.
  - **Uniforms:** police, nurse, butcher's apron, coveralls.
  - **Period pieces:** 70s, 80s, 90s, 2000s.
  - **Masks and headwear:** skin mask, hockey mask, white mask, ghost mask, hats and caps.
- **Character sheet per episode:**
  - `cast.make({ name: 'sally', body: 'woman', hair: 'long-70s', hairColor: '#5a3a24', outfit: ['tank-pink', 'flares-denim'], face: 'sally' })`
  - The AI picks parts from the library to match the film, then reuses the result in every scene.
- **Motion library:**
  - **Locomotion and poses:** walk, run, sneak, sit, drive, climb, fall, crawl, struggle.
  - **Actions:** grab, swing, point, phone call, look-around, plus the ragdoll for hits.
  - **Blending:** motions blend into each other.
  - **Contact:** feet stay planted on the ground.

## 4. Sets, vehicles and props (`lib/sets/`)
All of it is hand-built in our PS1 style, the look you approved. It replaces the old `ps1-props` look, which we dropped.
- **Vehicles:**
  - **Fleet:** 70s van, pickup, sedan, station wagon, police cruiser, school bus, motorbike.
  - **Wear:** a wrecked version of each.
  - **Behaviour:** wheels that roll, opening doors, headlights, dust trails, body roll.
- **Interiors (room kits):** kitchen, living room, bedroom, bathroom, diner, gas station, hospital room, basement, attic. Each comes with furniture, appliances, lamps (with flicker), clutter, wall grime, windows and doors that open or break.
- **Exteriors:** farmhouse, suburban house, cabin, motel, church, barn, road kits (asphalt with cracks, gravel, lines), fields, woods, fences, poles and wires, a windmill, signs.
- **Nature and life:** wind-blown grass and flowers, trees with moving leaves, clouds, birds and vultures, cattle, bugs at lights, pollen in the light, rain, fog, snow, fire.
- **The set dresser:** you give it a room or a yard plus the actors' paths and the camera positions. It fills the space with clutter, but never in a walkway or a camera's line of sight. This builds in the keep-out zones I worked out by hand on the Hitchhiker.

## 5. The episode format and the factory line
1. **Research and script:** this stays the same.
2. **Cast sheet:** the AI dresses characters from the library.
3. **Sets:** pick kits and let the dresser fill them.
4. **Blocking:** who stands and moves where, on which words.
5. **Shot list:** in film language, through the camera.
6. **Checks:** clipping, cameras inside walls, the 180° line, framing.
7. **Shoot raw**
8. **Colourist agent:** writes the grade.
9. **Post**
10. **Final:** open it, send the preview, report.

## 6. Rollout (one step at a time, each checked on a real shot before moving on)
- **Phase 1, camera and post split:**
  - **What:** lenses, bodies, f-stop DOF, focus pulls, moves and handheld; raw plates; the post stack (halation, grain stocks, Super 8, power grades).
  - **Proof:** re-shoot a few Hitchhiker scenes with it.
- **Phase 2, cast system:**
  - **What:** bodies, the head bone, hair, wardrobe, the motion library.
  - **Proof:** rebuild the Hitchhiker cast from the library and compare.
- **Phase 3, sets library:**
  - **What:** move the Hitchhiker detail pass in, then add vehicles, room kits and the set dresser.
- **Phase 4, colourist agent:** the separate grading agent and the power-grade presets.
- **Phase 5, first full episode on the kit:** a new movie, built and timed end to end.

The approved PS1 look stays unless you say otherwise: hand-built low-poly, cinematic camera, the grade matched to each film, Minecraft-style blood, no clipping.

## Questions for Chria
1. **Look:**
   - Should the kit keep the PS1 low-poly style, now with a real cinema camera and film post?
   - Or should it move toward more detailed, higher-poly models? The second is slower to build and render.
2. **Grading agent:** should it be a separate Claude session we hand plates to? Or a step inside the same pipeline that runs automatically?
3. **Your message cut off at "a slash plan to further…".** What was the rest?
