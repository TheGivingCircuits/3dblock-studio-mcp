# Phase 3 report: the cast library (2026-10-25)

## Built
- `studio/lib/cast/` (window.CAST):
  - `cast.js`: `CAST.make(recipe)` builds a real skeleton (hips → chest → neck → head bone, body root at the feet) with two-bone IK arms and legs. It keeps the box-person look and the controls existing scenes use.
    - Bodies: man, woman, teen, child, big, elderly, frail, with height, build and shoulder sliders.
    - Hats, hair and masks hang on the head bone.
    - Props in hand: `hold`, `release`, `reach` on the hand bone.
  - `looks.js`: the looks.
    - Faces: skin tones; expressions neutral, scared, screaming, smiling, dead; blink; mouth movement on spoken lines; beards, moustaches, age, freckles, stubble.
    - Hair: bald, buzz, short, shag, feathered, long, ponytail, bun, afro, waist-length veil, any colour.
    - Wardrobe with era tags, including uniforms (police, nurse, coveralls, gas-station attendant, butcher apron) and a robe.
    - Headwear: cap, trucker, cowboy, fedora, beanie, nurse cap, police hat.
    - Masks: skin, hockey, white, ghost, and the new `slit`, our own design.
    - Extras: glasses and backpacks. Dirt and blood that build up on clothes.
  - `motion.js`: the motion library, every motion a pure function of time. idle, lean, talk, wave, point, phone, look around, grab, swing, struggle, sit (seat-height aware), drive, climb, fall, ragdoll, crawl, walk, run, sneak (feet planted, steps matched to distance travelled). Also `CAST.blend`, `CAST.act` (a timeline of motions with blends, faces and talking) and `CAST.walkPath`.
  - The attendant fix: a standing idle (weight shift, breathing, small looks), lean on the pump, talk with open-palm gestures, wave them off, and a clean blend back to idle.
- Lookbook: 67 turnaround sheets (front, side, back, close-up) in `docs/lookbook/`, mirrored to `/Volumes/T7 footage/Studio Library/lookbook/`.
- `castsheet.mjs`: the cast sheet for an episode, built from its `cast.json`.

## Proof
- `~/Desktop/Videos/Studio Tests/04 - Cast Test/takes/Cast Test - Take 01.mp4`: the whole Hitchhiker pipeline test re-shot with every character from CAST. Same shots and light. 70.43 s, -14.3 LUFS, seam SSIM 0.913 raw / 0.986 grain-free.
- `.../04 - Cast Test/takes/Cast Test - Side by Side - Take 01.mp4`: hand-built (Pipeline Test Take 04) next to the cast library, frame for frame.
- `.../04 - Motion Test/takes/`: one character performing every motion, labelled. Take 01 failed QC because of a solver bug (below). Take 02 is the re-shoot.
- The motion-blur double image at about 37 s is fixed. Sub-frames that would straddle a jump in camera position or direction now collapse to one. Script-supervisor QC stepped it at 10 and 30 fps and saw no ghosting.

## Final takes (after Chria's notes)
- **Cast Test Take 04** and **Side by Side Take 04** (`04 - Cast Test/takes/`), with the hand-built-style wardrobe detail. Explicit check: all 10 characters MATCH or BEAT their hand-built originals (`qc-take04.md`).
- **Motion Test Take 04** (`04 - Motion Test/takes/`): PASS WITH NOTES. Every standing motion is upright. The checker now fails anyone down in a standing or walking motion.
- **Inherited, not ours to change:** the Hitchhiker cover's real 1974 taglines.

## QC (script-supervisor agent)
- **Cast Test Take 01: PASS WITH NOTES** (`studio/tests/cast-test/qc.md`).
  - The attendant now stands right, waves them off and settles without popping. Fix soon: he barely gestures during his first line (19.2–20.7 s).
  - The one blocker is inherited from the original episode: the real film's taglines on the poster in S01 and CASE. It was already reported.
- **Motion Test Take 01: FAIL.**
  - The cause was a solver bug: poses merged into the previous one, and the stand pose had no body root. Once the pre-shoot checks evaluated a fall or ragdoll, its tipped root stuck to every later pose.
  - Fixed in `cast.js`: every new pose now starts from the stand. The quick stills hadn't shown it because they render in time order.
  - Re-shot as Take 02 with a fill light and the `kodachrome-70s` grade.

## Problems and notes
- `.claude/agents` edits needed Chria's explicit OK earlier; done.
- Before delivery, the Hitchhiker cast-test grade and timing match the pipeline take exactly, so the side-by-side compares only the cast.
