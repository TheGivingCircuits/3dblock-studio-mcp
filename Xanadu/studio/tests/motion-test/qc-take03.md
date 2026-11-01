# QC: Motion Test - Take 03

Verdict: FAIL (two blend blockers: point entry floats and clips the table, fall entry snaps from crawl to standing; everything else passes or has notes)

Method: every 3 s segment stepped at 6 fps (20 contact sheets, 18 frames each), plus full-size frames at 28.5, 30.0, 30.2, 30.4, 41.5, 41.9, 49.5, 51.0, 51.4, 52.0 and 55.0 s. I did not run the engine clipping check. Pops shorter than 1/6 s between samples could be missed.

## Overall

Most of the Take 02 problems are fixed. The camera follows the walk, run, sneak and crawl, and the run no longer wraps or goes empty. The climb rises on the ladder, facing it. The grab lifts the cup toward the chest. The point extends sideways. The crawl travels with the hands on the floor. The phone holds a handset and the swing holds an axe and repeats. Faces are readable on the standard camera (idle, talk, wave, phone, look around, back to idle). Two problems remain, both at the start of a motion, where the blend breaks the "feet planted" rule.

## Per-motion table

| Motion | Time | Verdict | Observation |
|---|---|---|---|
| Idle | 0-3 s | ok | Upright, boots planted with contact shadow, face, cap and moustache readable. Small weight shift and breathing. |
| Lean on pump | 3-6 s | ok | Forearm rests on the pump top, body leans to it, boots planted, face lit and readable. The 3.0 s settle from idle is smooth. |
| Talk | 6-9 s | ok | The arm gestures are bigger and the mouth moves. One hand mostly stays on the hip, so the gesture is still modest, but it reads as talking. Face readable, planted. |
| Wave them off | 9-12 s | ok | A big sweep of the right arm across the chest and out, repeated about 3 times. Reads as waving off. Planted, face readable. |
| Walk | 12-15 s | ok | Side-on, centred, the camera follows (set and props scroll past). Foot contact plausible, no sliding seen. The figure is small and in profile, so the face is not readable. |
| Run | 15-18 s | ok | The camera tracks him the whole time. No wrap and no empty frames. Lean, arm swing and motion blur read as running. No float seen. Profile only. |
| Sneak | 18-21 s | ok | Crouched, bent-knee shuffle, centred with the camera following. Reads as sneaking. He passes in front of the table with no overlap seen. Small and in profile. |
| Sit (0.45 m seat) | 21-24 s | ok | Hips on the seat, back to the chair back, thighs level, boots on the floor, face readable. The 21.0 s entry is a short drop-in, smooth over the 0.7 s blend. |
| Drive | 24-27 s | note | Both hands are now on the rim and the pose holds. The wheel floats in the air with no column or dash. The forearms cross in front of the chest. It reads as driving, but the wheel has no support. |
| Climb | 27-30 s | note | He faces the ladder (back to camera) with hands on the rails and the feet stepping up the rungs. He rises about 10% of frame height over the 3 s. It reads as climbing. The figure is small, there is no face, and the lower body overlaps the red pump at the ladder foot. I could not tell from 2D whether it is in front of or inside the pump. |
| Point | 30-33 s | fix | 30.0-30.6 s: the blend from the climb is a hop. The boots are off the floor, the shadow is detached, and the right leg and foot pass through the table top and side. From about 30.7 s the right arm extends sideways and is held, which reads as pointing. The head is turned away, so the face is not readable. |
| Phone call | 33-36 s | ok | The handset (dark block) is held at the ear, with the forearm raised and held. It reads as a phone call. The hand and handset crowd the hair slightly. The face is lit and readable. Planted. |
| Look around | 36-39 s | ok | Clear head turns left and right, with the hair and cap rotating with the head. The raised arm drops at 36.0 s, smoothly. Planted. The face is half in shade at the full turn. |
| Grab | 39-42 s | note | A close side camera. He bends and reaches the table edge, and the hand closes on the cup. At about 41.5 s the arm is at the chest and the cup is not visible: only a thin tan sliver shows under the forearm, so it looks buried in the arm or torso (possible clipping). At 42.0 s the cup is back on the table (swing segment). Planted. |
| Swing | 42-45 s | note | The axe is held with both hands at the front. The arms go overhead, the axe swings across at chest height (motion blur), and the cycle repeats about twice. It reads as a swing. The axe head is hard to see, and the blur covers the face during the downswing. Planted, face readable at rest. |
| Struggle | 45-48 s | ok | The torso twists and the arms thrash. Reads as struggling. Planted, face readable. |
| Crawl | 48-51 s | ok | The drop to all fours is smooth. He then crawls across the set, with the camera following, the hands and knees on the floor with contact shadows, and the head lifted. No overlap with the table or chair seen. The face is partly turned. |
| Fall | 51-54 s | fix | At 51.0 s he is crawling. By 51.2 s he is standing, and 51.4 s shows a hopping, upright pose with the boots slightly off the floor. That is a snap from crawl to standing in about 0.2-0.3 s and not a blend. He then topples backward and lands far from the camera, small and hard to read. A diamond shadow patch stays on the floor where he stood, apart from the body. |
| Ragdoll (a hit) | 54-57 s | note | The body is flung up from the floor, with legs in the air at 54.2 s, then flops, and the limbs rest outstretched. It reads as a hit. It is small and far away. The boots look like large dark blocks, separate from the legs. The diamond shadow patch is still offset from the body. |
| Back to idle | 57-60 s | ok | He rises from the floor over about 1.2 s into an upright idle with the boots planted. The last frames match the first idle. Face readable. |

## Blockers

1. Point entry (30.0-30.6 s). The blend from the climb leaves him airborne for about 0.6 s, with a detached shadow, and the leg passes through the table. This is both floating and clipping. Fix the climb-to-point blend: ground the feet and keep the legs clear of the table, or change the spawn offset.
2. Fall entry (51.0-51.4 s). The crawl pose snaps to a standing hop in about 0.2-0.3 s. This is a broken blend, not a smooth one. Fix the crawl-to-fall transition: a longer blend, or start the fall from the crawl pose.

## Notes (not blockers)

- Grab: the cup is not readable in the carried hand at about 41.5 s, and it is back on the table by 42.0 s. Confirm the cup is parented to the hand, and that it is not clipping into the forearm or torso. Reset the cup on the table at the cut if that is deliberate.
- Fall and ragdoll: the body is small and far from the camera, and the boots read as detached blocks. A floating diamond shadow stays at the old standing spot. Check the shadow blob follows the root.
- Drive: add a wheel column or dash so the wheel does not float.
- Climb: the figure is small and the lower body overlaps the pump. Check the clipping with the engine check.
- Swing: the axe head reads poorly, and the blur hides the face.
- Faces in profile (walk, run, sneak, crawl, point) are not readable by design of the side cameras.

## Not judged

- The engine clipping check was not run. Possible overlaps: point entry (the leg through the table, seen), grab (the cup in the arm), climb (the lower body in the pump).
- Sub-frame pops: only 6 fps was sampled, plus full frames at the points listed above. Foot sliding in the walk, run and sneak under a following camera was judged by eye at 6 fps only.
