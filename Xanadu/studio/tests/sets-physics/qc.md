# QC: Sets and Physics Test, Take 01

**VERDICT: FAIL** (5 blockers, 6 fix soon, 5 notes). Do not call the sets library, props library and physics engine proven yet.

Method: 60.0 s, 1080x1920, 30 fps, h264 + aac stereo. I stepped every section at 2.5 to 10 fps (frame sheets in `/private/tmp/claude-501/qc-sets/`) and cross-checked against `scene.js`. I cannot listen. Audio was judged from the per-0.05 s level and left/right balance of the track and matched against picture times, so the sound notes say "level and pan show", not "sounds like". Loop-seam score ignored, as briefed.

## Findings

| Time | Section | Severity | Finding |
|---|---|---|---|
| 0-4 s (K01), and still true 4-17 s | Dressed kitchen | **blocker** | The knife (x = .4) passes straight through the toaster. The blade sticks out of one side and the handle out of the other (clear at 4.3 s and 10.3 s from the P-shot cameras, and the blade runs into the toaster face in K01). The dresser put the toaster on the prop row, so the keepOut zone `[-.35,1.15,.08,.5]` did not hold. Zero-tolerance clipping. |
| 4.0-5.0 | Cup | **blocker** | The cup does not travel to the hand. At 4.9 s the cup is still on the table and the hand is about 0.3 m short of it, hanging at hip height. At 5.0 s the cup is gone from the table and is in the hand. It teleports. |
| 10.0-10.9 | Phone | **blocker** | The phone is never seen on the table in P2a (10.0-12.8). The toaster hides it from that camera (in K01 it sits just left of the toaster, next to the cup). It is already in the hand at 10.9 s, so the pick-up is invisible and reads as a prop appearing from nowhere. |
| ~17.0, ~23.0, ~29.0 | Knife, flashlight, tape | **blocker** | Same pop. The hand stops about 0.3 to 0.4 m from the prop, then the prop vanishes from the table and is in the hand one or two frames later (knife at 17.0, flashlight at 23.0, tape at 29.0). The brief asks that the hand actually reaches each prop, and it does not for any of the five. |
| 35.5-36.5 | Physics: chair | **blocker** | The chair does not tip over. It rocks back about 60 degrees, swings forward and is standing upright on its original spot by about 36.4-36.5 s. The legs lift off the floor, so it reads as a rocking toy, and the end state is a snap back to upright. |
| 36.6-38.0 | Physics: bottle | **blocker** | The bottle never moves. It stands upright (it is also upright in P5a, 28-31 s, though `scene.js` lays it on its side) and nothing happens after the push at 36.6. The "rolls across the floor" beat is missing. |
| 28.0-30.8 | Hand test: tape (P5a) | fix soon | The camera at x = 2.15 looks over the standing chair. The chair back covers the table, the pick and her hip for the whole shot, and the tape pick happens behind it. Check 2 (nothing between lens and subject). Move the camera or the chair. |
| 36.4 | Sound: chair | fix soon | The only impact-like event lands at 36.4 s, when the chair snaps back upright. There is no fall sound because there is no fall. |
| 25.0 vs 25.3-25.7 | Sound: flashlight | fix soon | The loudest hit of the section is at 25.0 s (peak about -1.5 dBFS), 0.3 s before the hand lets go (release 25.3 s) and 0.7 s before it lands (about 25.7). The real landing has only a weak hit (about -21 dB). The impact sound looks scheduled early. The other four landings are in sync: cup 7.75, phone 14.5, knife 19.85-20.05, tape 31.6-32.0 (left-panned, matching the counter). |
| 12.0-12.8, 23.9-24.8, 29.9-30.8 | Sound: footsteps | fix soon | No footstep events are detected on the carry walks of the phone, flashlight and tape. The cup and knife walks have clear steps (6.4, 6.9; 18.4, 18.9). The footstep layer is inconsistent. |
| 49.5 and 38-58 | Country road | fix soon | R03 (48-53) is empty road for 3 s. The van, the subject of the shot, is cropped at the right frame edge, so the opening door (49.5-50.7) shows as a dark sliver. The bus is only on screen from about 51.1. Reframe so the van and its door are in shot. |
| 55.0-57.5 | Motorbike | fix soon | The rider's raised hands float about 60 px above the handlebars (a hand-to-bar gap of roughly 0.2 m), so he is not gripping them. The torso is a tall slab with no visible legs on pegs. Wheels do sit on the road. |
| 15.75, 27.75, 33.8 | Sound | note | Hard-right-only clicks (left channel silent) at the end of three return walks, with no matching picture event. The same pattern is milder at 9.15 and 21.15-21.65. Probably footsteps panned off the screen position, but they read as stray hits. |
| 3.75-4.3 | Sound | note | A 0.5 s sound (peak about -19 dBFS) over the K01 to P1a cut with no on-screen cause. |
| 25.8-27.5 | Flashlight | note | The flashlight lands next to her left shoe and sits there, touching or nearly touching it. The label says "it rolls", but it barely moves. The phone also comes to rest right against her left shoe (14.5 on). I saw no penetration. |
| 38-43 | Pickup | note | The pickup is a speck at the far end of the road until about 41.5. The dust trail is only readable in the last 1.5 s. Dust puffs in R02 (43-44) are large flat cream boxes in the air near the lens. |
| 43-47 | Police / wreck | note | The cruiser is fine: wheels on the road, bar lit red and blue, no clipping when it passes the camera. The wrecked sedan is only a small brown block behind the fence (about 45.6-46.7, again at 54.7-55.5), never framed. Pan: engine level is centred for the pickup, and the cruiser pans R-heavy then L-heavy across its pass (47.25), although it is on the camera's left throughout. The van door sound at 49.5 is dead centre, although the van is at the far right of the frame. |
| 0-4 | Kitchen | note | The upper cabinet at the left of K01 sits in front of the window curtain (the curtain runs behind it). Check against `set.json` for overlap. The big white dust motes read as floating glowing objects in several close shots (for example beside her face at 22.8 s). |

## Verdict per prop

- **Cup (4-10 s): FAIL.** Pops from the table into the hand at 5.0 s. It then stays in the hand and is set on the counter at about 7.7-7.9 s with a matching impact at 7.75 s. The set-down is clean and sits on the counter; the pick-up is not.
- **Phone (10-16 s): FAIL.** The phone is hidden by the toaster, appears in the hand at 10.9 s, goes to the ear (13-14 s) and is dropped at 14.0 s. It lands beside her foot at 14.5 s with a matching impact. The release and landing are plausible; the pick-up is not.
- **Knife (16-22 s): FAIL.** It clips through the toaster from the start, and the hand stops short and the knife pops at about 17.0 s. It is set down at about 19.8 s, on the sink slab at the counter edge rather than the open counter (acceptable but worth a note), with an impact at 19.85-20.05 s.
- **Flashlight (22-28 s): FAIL (sound), PASS WITH NOTES (picture).** The hand stops short and the prop pops at about 23.0 s. It is carried, released at 25.3 s and lands at her feet at about 25.7 s, with no passing through the floor. The drop sound is 0.3 s early and the "rolls" beat is not visible.
- **VHS tape (28-34 s): FAIL (framing), PASS (throw).** The pick-up is hidden behind the chair and pops at about 29.0 s. The throw from over her head (31.0 s) is a believable arc, landing on the counter at the left frame edge at about 31.75 s with a left-panned impact. It lands partly cut off by the frame edge.
- **Chair (35.5 s): FAIL.** It rocks and snaps back upright.
- **Bottle (36.6 s): FAIL.** It never moves.
- **Door (34.4 s): PASS.** It swings open on its hinge to about 80 degrees without clipping. A sustained creak runs from 34.0 to about 36.4 s (it starts 0.4 s before the push), panned slightly left.

## What passed

- Vehicle wheels sit on the road with no floating or sinking (pickup, cruiser, bus, motorbike), and the motion is sensible. The cruiser's bar is lit.
- The bus pan is correct: it comes in from the right at 50.5-51.5 and passes the camera at about 53.25 on the left.
- The kitchen has no furniture sinking or floating beyond the knife and toaster overlap, and the camera is never inside geometry in any shot I stepped.
- The farm closer (58-60 s) is clean.
