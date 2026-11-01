# QC: Motion Test - Take 02

Verdict: FAIL

Method: every 3 s segment stepped at 6 fps (20 contact sheets, 18 frames each, so every boundary is seen at 6 fps), plus a 7-frame strip across the grab/swing boundary (40.0-44.5 s). I did not run the engine clipping check. A one-frame pop between 6 fps samples could be missed.

## Overall

The solver fix works: in every standing motion the torso is upright and the boots are attached to the legs and planted. The fill light and grade help. The uniform now reads blue-grey, and the cap and moustache read in the lean, sit, drive and swing frames. The take still fails on props and framing. Climb does not climb, grab does not carry the cup, point does not point, and the crawl body overlaps the table. Run and walk leave the frame, and run is empty for about 1.5 s. Faces are dark and flat on the standard camera in idle, talk, wave, point, look around and back to idle.

## Per-motion table

| Motion | Time | Verdict | Observation |
|---|---|---|---|
| Idle | 0-3 s | ok | Upright, shoulders level, boots planted with a contact shadow, no sliding. Cap, face and moustache are visible but dark. Motion is small (weight shift, breathing), so it reads as a calm standing idle. The "weird" pose is fixed. |
| Lean on pump | 3-6 s | ok | The right forearm and hand rest on the top of the red pump, and the body leans toward it. Boots are planted and the face is well lit and readable. The first frame (3.0 s) is a quick settle from idle with no visible pop. No clipping seen. |
| Talk | 6-9 s | note | Upright and planted, with a head bob and a mouth that opens. The hands are fists or flat on the hip, not open palms. The left hand sits near the hip/cup area. Face is dark. Reads as talking, but the gesture is weak. |
| Wave them off | 9-12 s | note | The right arm is held out at chest height, bent. The forearm moves only a little, so it reads as an arm held out more than a wave-off. Body upright and feet planted. |
| Walk | 12-15 s | note | Side-on walk cycle from left to right, upright, with foot contact reading plausibly. The character starts partly off the left edge and exits the right edge in the last 0.5 s. He is small and the face is not readable (profile). No clear sliding at 6 fps. |
| Run | 15-18 s | fix | Reads as a run (lean, arm swing, motion blur), but he exits right at about 16.2 s. The frame is then empty (set only) for about 1.5 s. At about 17.5 s he re-enters from the left and repeats the run. The shot is mostly out of frame or empty. |
| Sneak | 18-21 s | note | A crouched, bent-knee shuffle from the left edge toward the table. It reads as sneaking. He starts cut by the left edge. By about 20.5 s his torso overlaps the table and chair edge (possible clipping, camera angle unclear). He is small, and the face is dark. |
| Sit (0.45 m seat) | 21-24 s | ok | Hips on the seat, back to the chair back, thighs level, boots on the floor. The cap and face are readable. The first frame (21.0 s) shows him dropping in, tilted, with the hips forward of the seat. A one-frame pop at the boundary and a tilted landing, and then he is steady. No clipping seen. |
| Drive | 24-27 s | note | Seated. The wheel floats in the air to the left of the torso, with no dash or column. One hand is on the rim. The other forearm crosses the chest, so the pose reads close to folded arms. Hand contact on the wheel is partial. |
| Climb | 27-30 s | fix | He is small and sits against the red pump or the ladder foot, behind the ladder rails, with an arm raised. There is no vertical travel over 3 s, with no hand-over-hand and no foot on a rung. It does not read as climbing, and the body appears to overlap the pump. |
| Point | 30-33 s | fix | The first frame (30.0 s) is a leap or hop with the arm blurred up and one leg raised. The shadow is detached from him, so he is airborne, which is a pop from climb. Then the right forearm is bent up at the chest and held, with no arm extension toward a target. It is the same pose as the wave. Does not read as pointing. Face is dark. |
| Phone call | 33-36 s | note | The right hand goes up behind the head and stays. The hand is hidden by the head and there is no phone prop. It reads more as scratching the neck or a salute than a phone call. Upright and planted, and the face is readable and lit. |
| Look around | 36-39 s | note | The head turns to a full profile and back, with the hair block and cap rotating with the head. This reads clearly. The torso and face go dark in this stretch. The first frame (36.0 s) carries over the raised arm from the phone call, which is a quick drop. |
| Grab | 39-42 s | fix | The close side camera cuts in. The reaching arm extends to the table edge, but the table and cup are at the left edge of frame. The cup is visible at 39-40 s and then leaves frame or is hidden. I cannot see a hand closing on the cup or a cup in the hand. At 42.4 s (swing) the cup is back on the table. So there is no pick-up and no carry-over. The standing pose and planted feet are fine. |
| Swing | 42-45 s | note | The arms go over the head and then swipe across (motion-blurred), but the head and arms overlap. Then he holds a static pose with the arms crossed and hands clasped in front for about 2 s. It does not read as a swing. Upright, planted, and the face is dark. |
| Struggle | 45-48 s | ok | Torso twists and the arms thrash at chest height, with head tilts. It reads as struggling. Upright and planted. The face is dark and the movement is slightly small. |
| Crawl | 48-51 s | fix | He drops from standing, blurred, into a hunched all-fours pose next to the table. He stays in place for about 2.5 s with no travel, and the torso overlaps the table side. The hands look to hover above the floor, with an offset shadow patch beneath them. It does not read as crawling. |
| Fall | 51-54 s | note | The first frame (51.0 s) pops from the crawl pose to standing, then he topples backward and lands as a small, distant heap behind or beside the table. It reads as a fall, but the landing is small and hard to read. A floating square shadow patch on the floor is offset from the body. |
| Ragdoll (a hit) | 54-57 s | note | From the prone heap, he snaps to a standing stagger (about 54.2 s), which is a pop. Then he flops to the floor, arms outstretched. It reads as a hit. The body is small and boots look like detached dark blocks. |
| Back to idle | 57-60 s | ok | He rises from the floor over about 1 s into an upright idle. Boots connected and planted. The pose matches the first idle. Face and cap readable but dark. |

## Blockers

1. Climb (27-30 s). No climbing action and no contact with the rungs. The body overlaps the pump. Fix.
2. Grab (39-42 s). The cup is not shown being picked up or staying in the hand, and it is back on the table by 42.4 s. The cup is at the edge of frame. Fix.
3. Point (30-33 s). No extended arm. The hop at 30.0 s is a pop. Fix.
4. Crawl (48-51 s). No travel, the body overlaps the table, and the hands look to hover. Fix.
5. Run (15-18 s). The character is out of frame, with about 1.5 s of an empty shot. Fix the camera or the path. Walk and sneak also start or end partly off frame.
6. Face readability. Standing poses on the standard camera have dark faces, with the best light in the lean, sit, phone call and swing segments.

## Not judged

- Engine clipping check not run. Possible overlaps are listed above (sneak at table, climb at pump, crawl at table).
- Sub-frame pops: only 6 fps was sampled. Boundary pops seen: sit (21.0 s), point (30.0 s), fall (51.0 s), ragdoll (54.2 s).
