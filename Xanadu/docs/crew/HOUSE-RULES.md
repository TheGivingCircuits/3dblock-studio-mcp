# House rules for the crew

Every crew agent reads this file first. The plan these rules come from is the Claude Doc "TikTok Video Machine: Production Suite Plan" (https://claude.ai/artifact/2TgLZGbUQMyZGapFD8kpy2). Chria approved it on 2026-10-24.

## The look (non-negotiable)
- Hand-built PS1 low-poly, the way `studio/episodes/the-cursed-tape-ps1/scene.js` and The Hitchhiker are built: box people, tiny 8–32 px painted textures, chunky per-vertex shading, fog.
- On top of that look: the cinema camera (real lenses, f-stop depth of field, motion blur), the lighting engine, and a colour grade matched to the real film. HDR punch and vibrancy are welcome, neon is not.
- Never the old `lib/ps1-props` library look. Chria rejected it twice. New library pieces come from scenes Chria already approved.
- No camcorder/REC overlay on Guess The Horror. The Camcorder body is for Strange History only.
- Blood is allowed, Minecraft-style (a red flash plus chunky red pixel particles). No gore.
- Zero tolerance for clipping, floating hair, cameras inside walls, or props passing through bodies.
- Everything renders at full 1080 x 1920, 30 fps, perfect loop.

## Guess The Horror rules
- Plot retellings only, with original art, music and voices. No stills, posters, clips, theme music or trademark character designs.
- Never name the movie: not in narration, on screen, in the caption, in tags, or in the first-hour replies.
- Research the film before writing a word: Wikipedia plot plus the film's fan wiki. Plot details come from the film itself.
- Playbook (see memory `tiktok-growth-playbook`): 61–75 s long, motion plus the burned-in title card in the first 2 s, a clue ladder from obscure to obvious with the giveaway right before the loop, exactly one unnarrated hidden visual clue, a short end tail that loops to frame 1, at most 5 hashtags.
- Made-up brands only: Midnight Pictures, Midnight Video, The Midnight Gazette.

## Working rules
- Each role owns one file and hands it on. Nobody edits another role's file; send notes to the director instead.
- The episode folder is `studio/episodes/<slug>/`. Role files live there: `treatment.md`, `spec.js` (script and sound), `cast.json`, `set.json`, `lights.json`, `shots.json`, `checks.md`, `edit.json`, `mix.json`, `grade.json`, `Post kit.md`.
- Narration always stays on top of the mix. Spoken lines are cached by hash, so do not change line text without a reason.
- The ElevenLabs key lives at `~/.config/elevenlabs.key`. Never read it, print it, or ask for it.
- Downloads need permission first (filename, source, size). Never save posters; view them in the browser only.
- Takes, not finals. Every render is `takes/<Title> - Take NN.mp4`; only Chria picks a FINAL. Open every finished take on Chria's screen and back it up to the T7.
- The Mac is the master copy of the kit. Mirror to the T7 after each phase.
- Raw plates are shot to the Mac's internal SSD first, never straight to the T7: `~/Desktop/Studio/Support/plates/<slug>/take-NN/` (the one constant is `PLATE_ROOT` in `studio/lib/shoot.mjs`). After `--post`, the take's plates are copied to `/Volumes/T7 footage/plates/` with rsync and the sizes checked; the SSD copy is deleted only when the SSD has under 40 GB free. Every shoot prints the free SSD space before and after.
- Chria approves three things: the script, the cast sheet (lookbook), and the final take. The director signs off everything else.
