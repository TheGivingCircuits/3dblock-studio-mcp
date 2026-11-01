# Phase 5 report: editor, mixer, colorist (2026-10-25)

## Built
- **`studio/lib/editor.mjs`** (`render.mjs <slug> --edit`) writes `edit.json` from the take's shots, the narration timeline and the sound scan:
  - angle choice where coverage overlaps (shots marked `cover: true` now shoot their full range)
  - cuts moved onto an action (foot plant, impact, door) or a word gap
  - checks for the 2 s hook and title card, the clue ladder (each clue on one shot, in order, the giveaway held longest), the 61–75 s length, and J/L cuts at every change of space
  - a loop note for the seam check, which `render.mjs` now runs raw and grain-blind
- **`studio/lib/sound-scan.js`** walks the scene through time without drawing and lists what makes a sound:
  - foot plants per character and surface; doors, car doors and fridges swinging; vehicles moving; physics impacts; blood hits; emitters such as a chainsaw
  - each event's screen pan, distance and whether the camera sees it
  - the space each event is in, against the camera's space, for reverb and muffling
- **`studio/lib/mixer.mjs`** (`--plan-mix`, `--post --mix`, or automatically when a `mix.json` exists):
  - narration dry and centred, on top
  - footsteps and impacts as grains cut from cached multi-step clips, varied, panned by screen position, distance-scaled, muffled through walls
  - hard impacts (story beats) louder and only lightly ducked
  - engines that follow each vehicle's pan and distance
  - ambience beds per space and time of day, with J/L overlaps
  - Schroeder reverb per room (small, tiled, medium, cellar, wooden, outdoor)
  - music cues from the cache
  - the TikTok song slot as a timestamp in the post kit, never mixed in
  - the loop's tail folded into its head
  - two-pass loudnorm to -14 LUFS and a limiter for true peak under -1 dB
  - **cache only:** nothing is generated at mix time; missing sounds are reported. `lib/sfx-index.json` indexes every cached prompt (135).
- **Colorist** (`.claude/agents/colorist.md`, rewritten):
  - works from `--grade-preview=<grades>` contact sheets (the middle frame of every shot, graded, in 1–3 min)
  - writes `grade.json` with three `why` lines first
  - 10 new power grades (18 in all): 80s-slasher, 90s-teen-horror, kodachrome-70s, sodium-night, fluoro-green, giallo, sepia-flashback, moonlit-silver, 2000s-grime, dawn-pink
- **Briefs:** the editor and sound-engineer briefs point at the new tools. `post-run.mjs` plays an edit, takes grade or edit overrides, and seeds the film layer's loop from the cut's last frame.

## Proof (`~/Desktop/Videos/Studio Tests/06 - Post Test/takes/`)
- `Post Test - Three Grades - Take 02.mp4` (Take 01 failed QC: Kodachrome under-saturated, bleach bypass not contrasty; both grades fixed): the same Hitchhiker plates graded three ways side by side. Ours (70s Texas sun with the per-place blocks), kodachrome-70s, and bleach-bypass.
- `Post Test - Mixed Scene - Take 03.mp4` (the bed dropped out in Takes 01 and 02; fixed with a continuous night bed, crossfaded loops, a gentler indoor muffle and room tone): one scene fully mixed (The Caller's opening, 0–23 s).
  - Narration on top; the cordless phone rings; footsteps on the kitchen floor; the night bed muffled indoors and open outside on the patio.
  - Reverb for the small kitchen; the phone and the line's static cues.
  - -14.3 LUFS, peak -2.1 dB.
- The Sets and Physics Test (Phase 4) and The Caller (Phase 6) were mixed entirely by the mixer from their sound scans.

## Problems found and fixed
- True peak landed at -1.0 dB after AAC encoding. The limiter now aims 1 dB lower.
- The impacts sat under the narration and disappeared. Hard impacts are now louder and only lightly ducked.
- A stale `mix.json` survived a physics change. Re-plan (`--plan-mix`) whenever the scene's physics or blocking changes.
- Scenes that read narration word times need the timeline before scanning. `plan()` now calls `setTL`.
