# Countdown to Strange (16:9 long-form)

The Conspiracy Theories woodcut pop-up look, widened for YouTube long-form: 1920x1080, 30 fps, not looped. Narrated by "Graves" (`gAJKvlfm1lh6EiFbMzuL`, eleven_v4, speed 0.95).

| What | Where |
|---|---|
| Engine | `countdown/lib/woodcut-wide.js`: a copy of `studio/lib/woodcut.js`. The drawers, people, poses and ink tools are the same; the runtime is new. |
| Tools | `countdown/new-episode.mjs`, `countdown/render.mjs`. Both use the shared `notebook/make.mjs` without changes. |
| Templates | `countdown/templates/` |
| Worked example | `countdown/episodes/countdown-test-nuremberg/` |

## What changes compared with the vertical engine
- **Page.** A landscape broadsheet (3200x1800 px = 24x13.5 world units). Title in the header, a wide framed picture, and black-letter columns either side of the countdown card.
- **Sky card.** 19.2 units wide (2560x792 canvas) plus a flap, so the sky fills the 16:9 frame. Skyline cards are 3840x537 (`S.card(canvas, 1188, 2.6)`).
- **Countdown card.** `countdown: { numeral, place, date, up, down, placeAt, dateAt }` puts a printed card on the paper. It folds up on `up`, turns the place red at `placeAt` and the date red at `dateAt`, then lies flat again at `down`.
- **Captions.** In the lower third (`capY` 948, `capWords` 4, `capSize` 60). Keep HUD words around y 150–350.
- **Punch titles.** `S.punch(key, t0, t1, y, rot, x, scale)` makes a Luminari word slam in. `S.show` (wipe-in) still works.
- **No loop.**
  - The fold back to the page starts at `closeAt` (default: 1.2 s after the last word).
  - The page title glows red once the camera is back on the paper.
  - The video fades in from black (`fadeIn` 0.4 s) and fades out at the end (`fadeOut` 1 s). Allow `tail` ≈ 5 s.

## Commands (from the studio folder)
```bash
.tools/node/bin/node countdown/new-episode.mjs <slug> "<Title>" <year> <numeral> "<Place>"
.tools/node/bin/node countdown/render.mjs <slug> --voice
.tools/node/bin/node countdown/render.mjs <slug> --stills
.tools/node/bin/node countdown/render.mjs <slug> --stills=2.4,45,79
.tools/node/bin/node countdown/render.mjs <slug> --final
.tools/node/bin/node countdown/render.mjs <slug> --final --out=/path/file.mp4 --no-open
```
- `--voice` generates the narration and sound effects and prints each line's words.
- `--stills` renders 30 frames to `episodes/<slug>/stills.jpg`; `--stills=2.4,45,79` renders only the seconds you list.
- `--final` renders to `~/Desktop/Studio/Episode Files/Countdown to Strange/<Title> (<year>)/`. It reports length, loudness and render time, and writes a contact sheet next to the video.

## Framing notes
- At the sky, a low camera sees about 14 units of width. Keep sky objects within |x| < 5.6 and the skyline landmarks in canvas x 1300–2800.
- Close shots that look sideways (|look x| > 3) can show the dark desk past the sky card's edge. Check them in the stills.
- The countdown card stands at y ≈ −6.3, 3.9 tall. Frame it from about `[0,-18.3,1.5]` looking at `[0,-6.3,1.4]` so the caption ribbon doesn't cover the date.
