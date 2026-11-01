# Pipeline test: The Hitchhiker on the cinema camera (Studio Tests #3)

24 October 2026. This test took a copy of the finished "The Hitchhiker" through the whole new pipeline: cinema camera, lighting engine, raw plates on the SSD, post (grade, film layer), the existing mix, the take checks, the T7 archive. The real episode was not touched. Its folder and its takes (Take 05–07, last changed 10:48) are as they were.

## Takes
- **Take 02 (current):** `~/Desktop/Videos/Studio Tests/03 - Hitchhiker Pipeline Test/takes/Hitchhiker Pipeline Test - Take 02.mp4`. 70.43 s, −14.3 LUFS, loop seam SSIM 0.90.
- **Take 01:** the first pass, kept. It had blue suns, flare blobs, dark nights and a 0.56 seam; all are fixed in Take 02.
- **720p previews:** `previews/` next to the takes.
- **Raw plates:** `/Volumes/T7 footage/plates/hitchhiker-pipeline/take-01` and `take-02`. The SSD copies were deleted after the copies were verified, because the SSD was under 40 GB free.

## What was converted, and what was kept
- **Kept exactly:** the geometry, the blocking, the blood and the detail pass. `scene.js` is the episode's file with three changes: `LIGHTS.use()` after the imports, the episode handed to `CAM.episode(HH.adapt(...))`, and the lights/camera/adapter scripts in `index.html`. The narration, effects and music are the same lines and prompts, all from the cache, so there was no ElevenLabs cost.
- **Camera (`shots.json`, 98 shots plus the closing CASE shot).** Every keyframe of the old hand-tuned camera became a shot. Position and look come from the episode's own camera path (its keyframes, drift, hit-shake and the overhead case shot), so the framing is the same. The film side of each shot is new:
  - body: 16mm;
  - lens: the profile of the nearest Super 35 equivalent, at the exact focal length that gives the old field of view;
  - stop: f/2 to f/5.6, chosen from how shallow the old shot wanted its focus;
  - ISO to balance the stop;
  - focus: the old focus distance, or the look point;
  - a move label;
  - an exposure offset per phase.
- **Light (`lights.json`).** Central Texas, 18 August 1973, in 11 phases across the six places:
  - golden afternoon at the station, on the road and at the farm;
  - dusk and moonlit night at the farm;
  - the red hall by day;
  - the station at night;
  - the dinner at night, then dawn;
  - dawn at the farm and on the road.

  The sun's direction follows the episode's old key light, so the faces are lit the same way; its colour and strength follow the time of day. There are 18 lights, including all the practicals asked for:
  - the farmhouse bulbs;
  - the generator lamp;
  - the flashlight (it follows Franklin's hand and has a visible beam in the night haze);
  - the dinner-table bulb (old-bulb flicker);
  - the hall bulb;
  - the gas-station tube;
  - the pickup's headlights;
  - a moon key and window fills for night and dawn.

  The haze uses the episode's own fog colours.
- **Grade (`grade.json`).** The 70s-texas-sun power grade, with a 16mm film layer: grain, strong halation, weave, flicker and light dust. The episode's own per-place grades (scene.js `GR`) are used as the base and as per-shot blocks, so the comparison is about camera and light, not colour. Letterbox is 6%, as in the episode.

## Times, sizes and the SSD

| | Take 01 | Take 02 |
| --- | --- | --- |
| Shoot (2,113 frames, native 1080 x 1920, 4 sub-frames) | 789 s | 848 s |
| Post | 563 s | 668 s (the Mac was also busy) |
| Mix | 3.0 s | 3.7 s |
| Plates | 7.6 GB | 8.2 GB |
| SSD free before → after the shoot | 19.3 → 13.3 GB | 20.1 → 11.2 GB |
| SSD free after the T7 archive | 20.1 GB | 19.6 GB |
| Files archived to the T7 (sizes matched) | 8,652 | 8,654 |

- Shoot cost is about 0.4 s a frame, about 4 MB of plates a frame (the detailed sets compress poorly), and about 12 minutes per 70 s episode.
- Post cost is about 0.3 s a frame: plate load and decode 140–165 ms, texture upload 55–66 ms, GPU 15–19 ms, frame grab 55–60 ms.

## What looked better than the hand-tuned version
- **Real depth of field.** A per-pixel blur from the depth plate, with the 16mm body's deeper focus. Close-ups through the van and at the dinner table soften the background the way a lens does. The old engine blurred everything beyond one distance.
- **Motivated, changing light.**
  - The flashlight is a real spot with a beam in the haze; it swings with Franklin and lights the wheelchair and the grass.
  - The dinner bulb flickers and lights the faces from above.
  - The station tube lights the counter.
  - Night is moonlit blue with the house bulbs warm in the windows.
  - The sunrise sun is at the horizon behind the man in the road.
- **The film layer.** 16mm grain, halation around the suns and bulbs, a soft highlight roll-off, gate weave and a light print curve. It reads more like 1974 film than the clean PS1 frame did, and the PS1 look survives: tiny textures, per-vertex shading and box people all hold at 1080.
- **Native 1080 x 1920.** Polygon edges and small text (the pump signs, the BAR-B-Q sign) are crisper while the pixel textures stay chunky.
- **Motion blur from 4 sub-frames.** The van passing, the hammer swing and the chainsaw spin all smear.

## What looked worse
- **The saturated, poster-orange days of the original are calmer.** The episode's grades were tuned for its old lighting. The new sun and haze are more naturalistic, so even with the same grade values the days read dustier and softer. A colorist pass per place would close the gap; I did not chase it in a test.
- **The original's grades blended inside a shot (the dinner fading to dawn).** In the new post, grades are per shot, so a blend inside a shot became a cut at the next shot.
- **The old engine's VHS tape glitch on scene changes was dropped.** It doesn't belong on a 16mm look, but it was part of the episode's rhythm.
- **Night exposure is not physical.** The episode lit its nights brighter than a real stop would. To match it I added +0.9 to +1.8 stops per night phase. Without that (Take 01) the farm at night and the dinner were nearly black.
- **The loop seam is 0.90, not 0.95.** The first and last frames are the same shot on the case with the same film-layer seed. What is left is the case lid and a residual difference in the closing fade.

## Every glitch seen (zero tolerance; times are in Take 02 unless marked)
1. **Blue suns, Take 01 only (3–5 s, 21–25 s, 56–59 s).** The post's print curve flipped sign above white, so the brightest orange came out blue. Fixed in `lib/post.js` (clamp before the curve).
2. **White flare blobs, Take 01 only (23–25 s, 56–59 s).** These were mirrored ghost flares of over-bright suns. Fixed: lower sun glow, flares toned down to 0.25.
3. **Night nearly black, Take 01 only (37–42 s, 46–52 s).** Fixed with per-phase exposure (above).
4. **Station at night tinted green, Take 01 only (43–45 s).** The tube's default green gel; removed.
5. **Last seconds dark and blurred, Take 01 only (68–70 s).** The cut back to the case used the last ride shot's focus (about 10 m) and grade. Fixed with an explicit CASE shot.
6. **21–22 s: a very bright pump globe in the foreground.** It is the episode's own pump lamp (an unlit sphere) close to the lens, out of focus and now blooming. It reads as a hot blob. **Unfixed.**
7. **56–57 s: a thin vertical film scratch line.** This is the dust layer's intended scratch (dust 0.25); it may read as a glitch on a phone. **Unfixed, by choice; set film.dust to 0 to remove it.**
8. **54 s: the sunrise window frame blows to pale pink-white.** The dawn window light on a mostly white view. **Unfixed.**
9. **39 s: the flashlight's haze beam is a large flat bright cone across the frame.** It's plausible, but strong. **Unfixed; lower the haze beam level.**
10. **The safety check flagged the camera inside a box (61–68 s, shots S74–S98).** This is the episode's own POV in the pickup bed: the lens sits inside Sally's head box. It's invisible because box faces point outward, but it is a real "camera inside geometry". It's the same in the finished episode. **Unfixed (blocking was not to be changed).**
11. **The safety check also flagged "geometry between the lens and the subject" 150+ times.** These are not visible errors. The converted shots aim at the old look points, which often sit behind the actor or a set wall, so the ray hits the actor or the wall first. A real shot list with named subjects would make the check meaningful.
12. **No clipping seen at 1 frame/s.** No bodies through props, no floating hair. A frame-by-frame pass was not done.

## What this test proves
The pipeline runs a full 70 s episode end to end: SSD plates, verified T7 archive, a graded and mixed take that passes length and loudness. Converting an old hand-built episode keeps its blocking. The work left to make it production-ready:
- a per-place colorist pass;
- named subjects in shot lists, so the safety check is meaningful;
- the remaining highlight issues (items 6–9 above).
