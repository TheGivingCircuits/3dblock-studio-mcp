# Phase 4 report: sets, props and physics (2026-10-25)

## Physics library: cannon-es 0.20.0 (MIT)
Installed with Chria's OK: `npm install --save-exact cannon-es@0.20.0`, about 0.8 MB unpacked. I chose it over Rapier for four reasons:
- It is plain JavaScript and runs inside the headless Chrome pages with no WASM loading.
- Its stepping can be made fully deterministic. Rapier's WASM build can be too, but it needs the async init in every scene.
- Our shapes are stylised boxes, spheres and cylinders, which it handles well.
- It is small.

`studio/lib/vendor/build-cannon.mjs` wraps it as a classic script (`lib/vendor/cannon.js`, `window.CANNON`).

## Built
- **`studio/lib/physics.js`** (window.PHYS):
  - Every result is a pure function of time. The world is snapshotted every 0.25 s along one canonical run and stepped from the nearest snapshot, so stills, motion-blur sub-frames and re-renders all agree whatever order frames are drawn in.
  - Uses the naive broadphase, because the sweep-and-prune one keeps a sort order between steps. Derived body state is refreshed on every restore.
  - Pick up, carry, set down, throw and drop ride the hand bone. A release is read from the character's pose just before the let-go.
  - Doors swing on hinges with limits. Pushes can tip a chair or roll a bottle. Hit targets cue a ragdoll.
  - `PHYS.suspension` gives vehicles body pitch, roll and road buzz.
  - Impacts are logged with position, speed and material for foley.
  - Clipping (more than 2 cm of penetration) is reported to `CAM.check` as a shot problem.
- **`studio/lib/props/`** (window.PROPS): 55 props, one file each, in `<room>/<id>.js`.
  - Rooms: kitchen, living, bedroom, garage, horror, misc.
  - Each prop has era tags, mass, collision shape and centre, grip point, and foley material.
  - `build.mjs` bundles them into `all.js`. `sheet.mjs` makes a preview sheet per prop (hero, side and top views, collision shape in green, grip in red) in `docs/props/`, plus `contact-sheet.png`.
- **`studio/lib/sets/`** (window.SETS), bundled by `build.mjs` into `all.js`:
  - `core.js`: shared tiny textures and registries: life `fx`, `solids` for physics, `keepOuts`, `spaces`, `vehicles`, `swings`, `emits`.
  - `nature.js`: the Hitchhiker detail pass, moved in.
    - Life: grass fields in rolling gusts, live, dead and pine trees, bushes, rocks, clouds, birds and vultures, pollen motes, bugs at lights, laundry, cows, windmills, bales, the armadillo, dust trails.
    - The road kit: asphalt with dashes, gravel shoulders, cracks and patches, poles with sagging wires, barbed-wire, rail and picket fences, road signs.
    - The pipeline test keeps its own copy so its takes stay comparable.
  - `vehicles.js`: 70s panel van, pickup, sedan, station wagon, police cruiser (bar lights), school bus, motorbike, each with a wrecked variant.
    - Hollow cabins with seats, wheel positions and seat anchors for CAST.
    - Working doors and headlights, practical lights on request.
    - `SETS.drive` handles wheel spin, steering, suspension and dust.
  - `rooms.js`: kitchen, living room, bedroom, bathroom, diner, gas station (with forecourt), hospital room, basement, attic.
    - Real door and window openings, hinged doors, thick wall colliders, solid furniture.
    - Surfaces and free floor are handed to the dresser. Era palettes run from the 50s to the 00s.
  - `exteriors.js`: farmhouse, suburban ranch house, cabin, motel, church, barn (gambrel roof, silo).
    - Windows can glow at night.
    - Also woods, a cornfield and `SETS.countryRoad` (a whole dressed road).
  - `horror.js`: Minecraft-style blood (hit blink, pixel cubes, growing splats, drips, blood that builds up on clothes), candle clusters with light, bone piles, a swaying noose, feathers, a running chainsaw. No gore.
  - `dress.js`: `SETS.dress(space, paths, cameras, seed)`, the deterministic set dresser.
    - Room- and era-matched pools.
    - Keeps out of SETS.keepOuts, walking paths and lines of sight to the camera.
    - No overlaps, nothing inside furniture, nothing hanging over an edge.
    - Can turn every dressed prop into a physics body.
- Library mirror: `/Volumes/T7 footage/Studio Library/` (cast, props library and sheets, sets, grades, physics.js, the sound index).

## Proof
`~/Desktop/Videos/Studio Tests/05 - Sets and Physics Test/takes/Sets and Physics Test - Take 03.mp4` (60 s, -13.9 LUFS, true peak -1.4 dBTP, mixed by the Phase 5 mixer from the sound scan). Script-supervisor QC: **PASS WITH NOTES**, no blockers (`studio/tests/sets-physics/qc-take03.md`). Take 01 failed QC; Take 02 had the old sound plan.

What the take shows:
- **0–4 s:** a 70s kitchen from `SETS.room`, dressed by `SETS.dress` with seed 7.
- **4–34 s:** one character picks up, carries and lets go of five props:
  - the cup, set down on the counter
  - the phone, held to her ear, then dropped
  - the knife, set down
  - the flashlight, dropped
  - the VHS tape, thrown onto the counter
- **34–38 s:** the door swings on its hinge, a chair tips, a bottle rolls.
- **38–60 s:** a dressed country road with a farm: a pickup throwing dust, a police cruiser with its bar lit, a school bus, a parked van with its door opening, a wreck in the weeds, and a motorbike leaning around it.

## Problems found and fixed on the way
- The flashlight's collision cylinder stood upright while the model lies flat, so it started buried in the table. It's a box now.
- The props generator had written era and tags as strings. All 55 files are fixed.
- The dresser put a trash can inside a counter, because the cabinet bodies weren't registered as solid. They are now, and the dresser checks every solid.
- The thrown tape went through the back wall, because walls had no colliders. Rooms now add thick colliders just outside each wall.
- The first release velocity read the pose after the let-go, which threw the flashlight 3 m. It's now read from the pose just before.

- The centre of mass was at each prop's base, so lying bottles stood up and pushed chairs swung back. It's now at the shape centre.
- Set-downs land upright.
- The dresser kept only item centres out of keep-outs, which let a toaster overlap the test props. It now checks the whole footprint.
- The grab leans in at the spine.

## Notes left for later
- The thrown tape lands at the frame edge.
- The chair crash is partly masked by the door creak.
- The wreck is never properly framed.
- The rider shows no legs.
