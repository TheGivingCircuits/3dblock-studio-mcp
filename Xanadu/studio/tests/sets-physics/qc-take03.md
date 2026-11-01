# QC: Sets and Physics Test, Take 03

**VERDICT: PASS WITH NOTES** (0 blockers, 3 fix soon, 5 notes). All five Take 01 blockers are fixed. The sets library, props library and physics engine now read as proven for this test.

Method: 60.0 s, 1080x1920, 30 fps, h264 + aac stereo. I stepped every section at 4 to 15 fps (frame sheets in `/private/tmp/claude-501/qc-sets3/`). Audio was mapped with ffmpeg `astats` per 0.02 to 0.1 s, left and right separately. I cannot listen, so sound notes say "level and pan show", not "sounds like". The loop-seam score is ignored, as briefed.

## Findings

| Time | Section | Severity | Finding |
|---|---|---|---|
| 0-4 s | Kitchen | note | The knife no longer passes through the toaster. In K01 and in the P-shots the knife lies on its own spot on the table, clear of the toaster and the cup. |
| 4.7, 10.7, 16.7, 22.7, 28.6 | All five pick-ups | note | The hand now leans in and touches each prop before it lifts (cup, phone, knife, flashlight, tape). There is no pop and no gap. The prop rides in the hand from that frame on. |
| 28-31 | Tape (P5a) | fix soon | P5a is no longer blocked. The tape and the hand are visible the whole pick (28.0-29.5). The chair back still fills the lower-left third of the frame and covers her hip, but nothing hides the subject. |
| 31.6-33.9 | Tape landing | fix soon | The tape lands on the counter at the far left frame edge, under the curtain hem (impact at 31.62-31.76 s, left-panned, in sync). Only a dark sliver of it shows at the edge, so the landing and its upright or flat state can't be judged from this camera. It reads as cut off. Frame the landing, or throw it a little to the right. |
| 49-53 | R03 | note | Reframed. The van is in shot on the right with its door opening from about 49.5 s, and the bus enters at 50.5. The first 0.5 s of R03 is still empty road with only the van in the distance, which is fine. |
| 55-57.5 | Motorbike | note | The rider's arms now reach forward and down to the bars, and the wheels sit on the road. The hands are close to the bars; no float visible at phone size. The torso is still a tall slab with no visible legs. |
| 25.3-26.5 | Flashlight rest | note | It lands at 25.73 s, bounces once and rolls to her left shoe, where it stops touching the shoe edge. I saw no penetration. The phone also rests close to her left shoe from 14.5 s. |
| 36.0-37.8 | Bottle | note | The chair seat edge passes over the lying bottle at about 35.9-36.0 s, close enough that I can't rule out a brush against it. The bottle then rolls clearly to the right and tucks behind the far chair leg and table by about 37.5 s, so the end of the roll is half hidden. |
| 43-47 | Wreck | note | The brown wreck block behind the fence is still never framed properly; only a small block shows at 45.6-47 s. |
| 15.2-15.9, 27.2-27.9, 33.2-33.9 | Sound: return steps | note | Hard-right (R about -2 dB, L down to -50 dB) clicks at the end of return walks. They now line up with footsteps leaving frame and there is picture cause. |
| 36.0-36.2 | Sound: chair | fix soon | The chair lands at about 36.0 s (see below), but the door creak is sustained at about -3 dBFS right up to 36.2 s and masks the landing. Only small transients show at 36.00-36.16. A distinct crash level above the creak is not visible. Duck the creak at 35.9, or raise the impact. |
| 36.2-37.5 | Sound: bottle | note | The roll is a steady bed at about -31 dBFS (both channels, no pan), then silence gives way to the road at 37.6 s. It is faint, and not panned to the bottle's right-hand travel. |
| 38-60 | Country road | note | Pan checks out: cruiser pass 47.3-47.9 is left-heavy, the bus comes in right-heavy at 50.5-51.5 and exits left at 53.5, and the van door at 49.3 is right-leaning (the van is at the right). |

## Verdict per prop

- **Cup (4-10 s): PASS.** The hand reaches it at 4.75 s, carries it, and sets it down upright on the counter at about 7.8 s. The impact is at 7.9 s (L -10, R -14), in sync. It stays upright and level (seen at 8.6 s).
- **Phone (10-16 s): PASS.** The hand reaches it, the phone goes to the ear (12.7-14 s) and is dropped. It lands at her feet at about 14.5 s, with the impact at 14.54 s (-3 dBFS), in sync. It lies flat on the floor and stays put.
- **Knife (16-22 s): PASS.** The knife is clear of the toaster. The hand reaches it at 16.75 s. It is set down flat on the counter at about 19.8 s, and a thump lands at 19.84 s (about -17 dBFS, quieter than the cup). The knife sits on the counter, not floating, and does not move afterwards.
- **Flashlight (22-28 s): PASS.** The hand reaches it, carries it, and drops it. It lands at 25.73 s with an impact at 25.72 s, bounces at 25.82 s, and rolls onto its side next to her left shoe. The 0.3 s early sound from Take 01 is gone. A louder event at 25.0 s still exists; it is the release or steps (see the footstep note below) and isn't a landing.
- **VHS tape (28-34 s): PASS WITH NOTES.** The hand reaches it, the throw arc goes over her head, and it lands on the counter at the left frame edge at about 31.6 s with a left-panned impact. It is cut off by the frame (fix soon above).
- **Chair (35.5 s): PASS.** It tips from about 35.6 s, falls, and lies on its side by about 36.0 s. It stays down for the rest of the section (no snap back).
- **Bottle (36.6 s): PASS.** It starts lying on its side in K01, P-shots and the physics section (no longer upright), is moved by the chair fall, and rolls to the right for about 1.5 s, then stops behind the table leg.
- **Door (34.4 s): PASS.** It swings open on its hinge without clipping. The creak builds from 34.4 s (level rises from -12 dBFS there) and runs to about 36.2 s.

## Sound summary

- Impacts at every landing: cup 7.9, phone 14.54, knife 19.84, flashlight 25.72 and 25.82, tape 31.62-31.76, chair about 36.0 (masked).
- Footsteps are now present on all five outbound walks (about 6.3-6.6, 12.5-12.7, 18.3-18.6, 24.5-24.7, 30.5-30.7) and on the return walks (9.0-9.3, 15.2-15.8, 21.0-21.3, 27.2-27.8, 33.2-33.9).
- A 0.5 s sound at 3.9-4.2 s (about -19 dBFS) over the K01 to P1a cut has no picture cause. This is unchanged from Take 01 (note).
- Engines pan with the vehicles (see the country road row).

## Take 01 items

| Item | Status |
|---|---|
| Knife through the toaster | FIXED. No overlap in K01 or the P-shots. |
| Hand not reaching any prop | FIXED for all five props. |
| Chair doesn't tip | FIXED. It tips and stays down. |
| Bottle never moves | FIXED. It lies on its side and rolls. |
| P5a blocked by a chair | FIXED in effect (subject visible), still crowded by the chair back. |
| R03 framing | FIXED. The van and its door are in shot, the bus enters on time. |
| Motorbike rider's hands | FIXED (hands reach the bars). Legs not visible, unchanged. |
| Flashlight drop sound sync | FIXED. Impact at 25.72 s matches the landing. |
| Missing footsteps | FIXED. Steps on every walk. |
