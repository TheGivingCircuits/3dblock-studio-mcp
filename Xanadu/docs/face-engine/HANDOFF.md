# Face engine: handoff (2026-10-26)

Paste this whole file into the other assistant.

## Project
- Folder: `~/Desktop/Shorts Studio` (Mac). It makes vertical PS1-style horror and conspiracy shorts. Read `CLAUDE.md` in that folder first for the hard rules.
- Node is not on PATH. Run scripts with `.tools/node/bin/node` from the project folder.
- Characters come from the cast library:
  - `studio/lib/cast/looks.js`: textures. `L.face` paints a 24x28 face.
  - `studio/lib/cast/cast.js`: `CAST.make` builds a character.
  - `studio/lib/cast/motion.js`: timelines. `C.act` and `C.walkPath` call `P.setFace` and `P.animateFace`.
- The older rig is `studio/lib/ps1-props/people.js` (`drawFace`, `setExpression`). It has no blink or talk frames. Do not change it.

## Done so far (phase 1: faces and blinks)
- **Backup:** the cast folder from before the change is in `studio/lib/cast.backup-2026-10-26/`.
- **looks.js:**
  - `L.face(o, expr, frame, mouth)`.
  - New expressions: `sad` (inner ends of the brows up, lower lids, mouth corners down) and `surprised` (wide eyes, high brows, a small O mouth).
  - New optional mouth frames: `'shut' | 'mid' | 'open'`. `shut` is the expression's own resting mouth. `screaming` and `dead` ignore it.
  - Frames `open`, `blink` and `talk` are unchanged.
- **cast.js:**
  - `faceTex(e, frame, mouth)`.
  - `setFace` accepts `sad` and `surprised`.
  - `P.animateFace(t, { mouth })` takes a frame name or a level from 0 to 1 (below .2 is shut, below .55 is mid, otherwise open). Blinking keeps running while it is set.
  - Without `mouth`, the old sine-wave talk (`{ talk: true }`) runs unchanged.
- **Verified:**
  - All 75 old face textures and 45 rendered stills are byte-identical to the backup.
  - Proofs in `docs/face-engine/`: the contact sheet PNG, the silent MP4 and the before/after PNG.
- **The slit mask** (`L.MASKS.slit`, used by the killer in `episodes/the-caller`) is a fixed texture. It ignores expression, blink and mouth.

## Not done yet (the next phases, only if Chria says go)
1. **Audio-driven mouth.**
   - For each spoken line, measure loudness from the cached audio in `~/Desktop/Studio/Support/eleven-cache/` (keyed by hash; `notebook/eleven.mjs` reads it).
   - Write the envelope to a small JSON file per episode.
   - Pass `mouth: level` into `animateFace` from `C.act` (motion.js line ~77) instead of `talk: true`.
   - Test on `episodes/the-caller`, the only episode with `talk: true`.
2. Optional: mouth shapes (A/E/O/M/F) picked from the line's words. `render.mjs --voice` prints each line's words.
3. Optional: a reaction for the slit mask (eye slits narrow or the head tilts).

## Rules to keep
- Back up before editing.
- Keep old outputs byte-identical unless a new option is set.
- Never put a `//` comment mid-line before more code.
- Never print or ask for the ElevenLabs key (`~/.config/elevenlabs.key`).
- Do not change episodes, specs or `people.js` without asking.
- Open every finished video on the Mac (`open "<path>"`).
