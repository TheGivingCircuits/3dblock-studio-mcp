# Post Test QC (script supervisor)

Takes checked: `Post Test - Three Grades - Take 01.mp4` and `Post Test - Mixed Scene - Take 01.mp4` (both in `Videos/Studio Tests/06 - Post Test/takes/`).
Evidence and stills: `/private/tmp/claude-501/qc-post/`. Nothing was fixed; the owning roles fix.

## Verdicts

- **Three Grades, Take 01: FAIL.** Sync, labels, audio and picture integrity pass, but the Kodachrome and bleach bypass grades do not meet the brief.
- **Mixed Scene, Take 01: FAIL (minor, fixable).** Loudness, both rings and a bed of ambience are there, but the ambience drops to digital silence mid-scene, the ending does not fade cleanly, and narration is not provably on top during ring 2.

## Take 1: Three Grades (70.43 s, 1080x1920, 30 fps)

Sampled 10 times (3, 10, 17, 24, 31, 38, 45, 52, 59, 67 s) plus a 20-point contact sheet, covering dawn/day (open, 59-67 s), dusk (16-17 s, 52 s), and night (24-31 s, 45 s).

PASS
- Sync of columns: same picture, same subtitle word and same cut in all three columns in every sampled frame and across the contact sheet. No drift seen.
- Labels: "70s TEXAS SUN (ours)" / "KODACHROME 70s" / "BLEACH BYPASS" sit over the correct columns, left to right, for the whole take.
- Audio: decoded audio is bit-identical (same MD5) to `03 - Hitchhiker Pipeline Test/takes/Hitchhiker Pipeline Test - Take 04.mp4`, and the duration matches (70.43 s), so the original mix is untouched and in step with the picture timeline. Integrated loudness -14.3 LUFS, LRA 2.4 LU.
- No broken frames: no scene-cut glitches or tearing found. Subtitle text is readable in all grades except the two noted below.

FAIL / WATCH
1. **Kodachrome is not deeper or more saturated than "ours".** Mean saturation of the picture band (SATAVG), ours / Kodachrome / bleach: 66/43/19 at 3 s, 50/30/13 at 10 s, 65/42/18 at 24 s, 49/41/18 at 52 s. Kodachrome is about 60-85% of ours in every sample, and it reads flatter and olive-green in the shadows (21-24 s razor and night shots) rather than rich and deep. Brief expects the opposite. Owner: colour/post.
2. **Bleach bypass is desaturated (about 25-40% of ours, correct) but not contrasty.** Mean luma is within a few points of the other two columns (e.g. 126/124/127 at 3 s; 109/106/109 at 10 s) and the highlights are lifted and milky (dawn/day shots 3, 10, 59, 67 s read cream and hazy; blacks at 38 s lifted). Reads as a washed-out desaturation, not the crushed-contrast bleach bypass look.
3. **Crushed blacks, entire plates.** Fully black plates at **34.57-34.90 s** (0.33 s, caption "hammer.") and **45.83-46.77 s** (0.93 s, caption "of them."). In the Kodachrome column the plate is pure black; ours and bleach show only faint noise. These may be motivated (cut-to-black on the kill), but they are not graded identically: Kodachrome goes to nothing while the others keep detail. Confirm intent with the director.
4. Subtitle contrast on bright plates: "So two of" (about 31-32 s house at dusk) and "But the old" (about 38 s) are low-contrast against the bright wall in all three columns, worst in bleach bypass. Minor.
5. Blown highlights: sun discs clip to 255 in all columns (10, 17, 52 s). Motivated (sun in frame). Kodachrome and bleach both bloom beyond ours at 52 s; acceptable.
6. Layout note: the actual picture band is only about 560 px tall in the middle of the 1920 px frame with large empty dark areas above and below. Not a defect for a test, but each column is 360 px wide, which is small for judging grade.

## Take 2: Mixed Scene (23.10 s)

Measured by ffmpeg only (not listened to): `ebur128`, `astats` in 0.5 s and 0.1 s windows, band-limited RMS, spectrogram, silence/black/freeze detect, scene detect, and stills.

PASS
- Loudness: integrated **-14.3 LUFS** (target about -14), LRA 4.0 LU, short-term -14 to -16 LUFS through the scene, true peak **-2.1 dBFS**, sample peak -2.2 dB. No clipping.
- Phone rings at the start: a ring tone (about 1.9-2.1 kHz with 3.8/4.3 kHz harmonics, warbling) from about **0.1 to 1.6 s**.
- Phone rings again at pick-up: same ring tone from about **7.7 to 8.85 s**, ending on the picture cut to the girl at **8.87 s**. Matches "about 9 s".
- Ambience: a wideband low-level bed (about -26 to -32 dB RMS) is present in the gaps between lines (e.g. 2.0-3.0 s, 15.8-16.4 s), plus a steady tone around 1.25 kHz from about 19.5 to 21.6 s (the late sting or bed).
- Picture: no tearing or seams or black frames except the ending. Scene cuts at 6.57, 8.87, 19.37, 21.2 and 22.5 s all land on caption changes.

FAIL / WATCH
1. **Ambience drops to digital silence.** At about **10.23-10.60 s** (0.38 s) all bands fall to about -100 dB (silencedetect confirms), and again at **13.58-13.73 s** (0.15 s). The bed should be continuous; these look like the mixer's gate or duck cutting everything, not just ambience. Audible as a hole after "rings." / "The caller wants". Owner: audio.
2. **Ending does not fade cleanly.** Audio falls from about -15 dB at 21.9 s to -45 dB RMS in the final 0.1 s, so it is cut short rather than fading to silence, and it is not smooth: levels go -22, -31, -27, then back up to -15, -15, -15 (21.0-21.5 s) before the tail. Picture is a **hard cut at 22.5 s** (mean luma 88 to 16.6 in one frame, not a fade) to a black frame holding "go out." until the end (freeze 22.5-23.03 s). Picture and sound do not fade together.
3. **Narration vs ring at 7.7-8.85 s.** In this window the ring band (1.2-2.4 kHz) is about -17 dB RMS and the voice band about -16 dB, i.e. the ring is as loud as the speech, the loudest 1.5 s of the scene (full mix -14 to -15 dB). At the first ring (0.1-1.6 s) the ring band is about -22 dB against voice at about -18 dB, which is fine. Because stems are not separable, I can't prove the narration is masked, but the mixer is not ducking the ring under speech at ring 2. Needs a listen. Also the caption "rings." appears at about 9.0 s and "and the phone" at about 9.5 s, so the on-screen word comes about 1 s after the ring sound; check that the narrator line is meant to follow the ring.
4. Narration level otherwise holds: voice band stays around -18 to -23 dB RMS and is the dominant energy in most windows. No other section looked buried.

## Blockers for the director
- Three Grades: regrade Kodachrome (more saturation and depth than ours) and bleach bypass (higher contrast, lower black point) before this is used as the grade comparison. Confirm whether the black plates at 34.6 s and 45.8 s are intended.
- Mixed Scene: fix the ambience dropouts at 10.2 s and 13.6 s, add a proper joint fade-out at the end, and confirm narration priority at the 7.7-8.85 s ring by listening.

---

# Take 02 re-QC

Takes checked: `Post Test - Three Grades - Take 02.mp4` (70.43 s, 1080x1920, 30 fps) and `Post Test - Mixed Scene - Take 02.mp4` (22.40 s, 1080x1920, 30 fps). Evidence and stills: `/private/tmp/claude-501/qc-post2/`. Nothing was fixed.

## Verdicts (Take 02)

- **Three Grades, Take 02: CONDITIONAL PASS.** Bleach bypass is fixed (clearly more contrasty, denser blacks, strongly desaturated). Kodachrome is now at parity with ours on saturation overall (about 0.99x) and has more contrast, but it is still less saturated than ours on the bright daytime plates (66-90% at 3, 10, 17, 24 s), so "at least as saturated" holds on average and not shot by shot. Sync, labels, audio and the black plates pass.
- **Mixed Scene, Take 02: FAIL (minor, fixable).** Ending fade, loudness and both rings pass, and there is no digital silence. But the night bed is still not continuous. It collapses by about 25 dB into near-silence at the same spots as Take 01 (10.1-10.7 s, 13.4-13.7 s, plus 15.65-15.8 s).

## Take 02: Three Grades

Method as in Take 01, 1 fps over the whole take (70 frames), per column (x offsets 4/364/724, 350 x 540 px picture band): SATAVG, YAVG, YLOW/YHIGH (10th/90th percentile luma) and luma standard deviation (the contrast measure), all against column 1 ("ours").

| Measure (70-frame mean) | ours | Kodachrome | Bleach |
|---|---|---|---|
| Saturation (SATAVG) | 40.4 | 40.0 (0.99x) | 11.5 (0.28x) |
| Luma std (contrast) | 50.4 | 57.0 (1.12x) | 61.5 (1.20x) |
| Black point (YLOW) | 43 | 33 | 28 |
| Highlight (YHIGH) | 147 | 149 | 154 |
| Mean luma | 92.8 | 88.3 | 86.4 |

PASS
- **Bleach bypass.** Saturation is 0.28x ours, every frame is below ours (max ratio 0.68), and the look reads grey/cream. Contrast is +20% over ours on average and higher in nearly every bright shot (e.g. std 55/50/41 at 3 s, 96/87/74 at 10 s, 89/82/69 at 59 s, 79/69/58 at 67 s, bleach/Kodachrome/ours). Blacks are denser (YLOW 28 vs 43) and the milky haze is gone: sky and highlight plates (3, 10, 59 s) are crisper and darker in the shadows, with specular lights (the truck, the sun) hitting near 255. Brief met. "Clearly" is moderate: +20% std and a 15-point black-point drop, readable by eye in the contact sheet but not extreme.
- **Kodachrome contrast.** +12% std, black point 33 vs 43, so it has more density than ours.
- **Sync.** 15 frames at 5 s spacing (tiled) plus the 1 fps stats: same picture, caption word and cut in all three columns. No drift.
- **Labels.** "70s TEXAS SUN (ours)" / "KODACHROME 70s" / "BLEACH BYPASS" are over the correct columns for the whole take (visible on every tile).
- **Audio.** Decoded audio MD5 is identical to Take 01 (9d2155f8...), so the mix is untouched. Integrated -14.3 LUFS, LRA 2.4 LU, duration 70.43 s unchanged.
- **Black plates, 34.57-34.90 s ("hammer.") and 45.83-46.67 s ("of them.").** Not crushed. Measured on the picture area with the caption excluded, all three columns sit on the same dark noise floor (YAVG about 20 / 18 / 20 for ours / Kodachrome / bleach, YMIN 7-13), and when lifted 8x only film-grain noise is visible. These plates are intentional blackouts with no image detail in any column, so there is nothing to crush. Kodachrome's plate is the darkest and tightest (YMAX 25-27 vs 39-41). Take 01 called it "pure black" against noise in the others. This is no longer a grading discrepancy worth blocking on.

WATCH
1. **Kodachrome saturation is parity, not above.** Per-frame ratio to ours: mean 1.00, median 0.91, at or above ours in 48% of frames (range 0.22-2.39). It is lower on the bright daylight and dawn shots (3 s 60 vs 66, 10 s 38 vs 48, 17 s 19 vs 29, 24 s 58 vs 65) and higher on dusk, night and late shots (31, 38, 45, 52, 59, 67 s: 30/22/29/63/42/63 vs 28/17/22/58/32/48). Take 01 was 60-85% everywhere, so this is a large improvement, but if the brief is "at least as saturated as ours" in every shot, a further push on the day plates is needed.
2. **Kodachrome hue shift.** Night plates (24 s razor/chair, 31 s house) now go olive/yellow-green where ours is blue. It reads as a deliberate film-stock look and raises measured saturation, but check with the director that olive night is wanted.
3. Subtitle contrast and blown sun discs from Take 01 are unchanged (minor, motivated).

## Take 02: Mixed Scene (22.40 s)

Measured by ffmpeg only (not listened to): `silencedetect` at -40/-50/-60/-70 dB, `ebur128`, `astats` in 0.1 s windows, band-limited RMS, spectrogram, black/freeze detect, and stills at 21.7/22.1/22.36 s.

PASS
- **Loudness.** Integrated **-14.3 LUFS**, LRA 4.0 LU, true peak **-2.2 dBFS**, sample peak -2.3 dB. No clipping.
- **Both phone rings present.** Ring 1 at about **0.1-1.6 s**. Ring 2 at about **7.4-8.85 s**, ending at the cut at 8.87 s. Both are the same warbling tone near 1.9-2.1 kHz with 3.8/4.3 kHz harmonics, seen clearly in the spectrogram.
- **No digital silence.** `silencedetect` at -50 dB and -60 dB finds nothing except the first 0.05 s (the file's fade-in), and nothing at -70 dB either. The lowest 0.1 s RMS in the programme is -55.7 dB (excluding the last second), against -111 dB (true digital zero) in Take 01.
- **Clean ending.** Picture fade: luma starts falling at about 21.95 s (88 at 21.87) and reaches near-black by 22.37 s (YAVG 20.8, YMAX 32; the last frames are black in limited range). That matches the 0.5 s picture fade. Audio fades from about 21.6 s: 0.1 s RMS is about -16 dB at 21.6 s, -19 at 21.9 s, -24 at 22.05 s, -33 at 22.2 s, -45 at 22.3 s and -55 to -59 dB in the last 0.1 s, so it is effectively silent and ends at the same moment as the picture. Caption "go out." fades with the picture. The old hard cut and the 0.5 s black hold are gone. Narration "...and the lights go out." finishes under the fade, so the last word is already attenuated (about -18 to -22 dB when it is spoken).
- **Picture.** Black/freeze detection finds nothing. No glitches; the clip ends at the fade.

FAIL / WATCH
1. **Ambience bed still collapses at the same spots.** At 0.1 s RMS the bed sits at about -27 to -32 dB in the lulls (e.g. 2.1-2.8 s, 4.5-5.2 s, 19.0-19.5 s) but drops about 25 dB to about **-53 dB** at **10.1-10.7 s** (about 0.6 s, after "rings."), **13.4-13.7 s** (about 0.3 s) and **15.65-15.8 s** (about 0.15 s). `silencedetect` at -40 dB flags these windows, and the spectrogram shows them as deep voids. Band check: 10.2-10.7 s is -69 dB below 300 Hz and -54 dB above 2 kHz, against -28 dB above 2 kHz at 2.3 s. The old gaps at 10.23-10.60 s and 13.58-13.73 s are therefore still audible as holes, now filled with a very low noise floor instead of digital zero. It is not "a continuous bed". Owner: audio (the bed is being gated or ducked hard in those gaps; hold it at the -28 dB level through them). Needs a listen to confirm how audible it is, but a 25 dB dip in a quiet scene is likely to read.
2. **Ring 2 is loud against the narration.** In 7.4-8.7 s the 1.2-2.4 kHz ring band is about -19 dB (peaks -15) against the 300-1200 Hz voice band at about -22 to -26 dB, so the ring is roughly 3-7 dB above speech, and the voice band is about 4-8 dB lower than the surrounding narration (-16 to -20). Voice is still visible in the spectrogram under the ring. Needs a listen to confirm the narration is intelligible, and a duck on the ring if not. Ring 1 (0.1-1.6 s) is fine (ring about -24 to -21 dB, voice -16 to -20 dB).
3. Minor: the file opens with 0.05 s below -60 dB (fade-in); harmless.

## Blockers for the director (Take 02)
- Three Grades: none hard. Decide whether Kodachrome at parity (and lower on daylight plates) with an olive night look is acceptable, or ask colour for a bit more saturation on the bright shots.
- Mixed Scene: audio must keep the night bed up through the gaps at about 10.1-10.7 s, 13.4-13.7 s and 15.65-15.8 s. Confirm by ear that narration holds up over ring 2 (7.4-8.85 s).
