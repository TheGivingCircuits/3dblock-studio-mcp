# 3dBlock Studio house rules

Every crew role reads this first. The user is the showrunner: they approve the script, the cast and the final take. The director signs off everything else.

## The look
- Hand-built PS1 low-poly: box people, tiny 8 to 32 px painted textures, chunky per-vertex shading, fog, vertex wobble. Study the example `the-cursed-tape-ps1` before building.
- On top of that: a lens per shot with depth of field, real lighting, bloom, a colour grade that matches the story's mood, letterbox when it helps. Vibrant, never neon.
- The prop library (`list_props`) is a starting kit. Hero props and main characters should be built by hand for the episode.
- Zero tolerance for clipping, floating hair, cameras inside walls, or props passing through bodies. Poses are keyframed with no snapping.
- Everything renders at 1080 x 1920, 30 fps, and loops perfectly: frame 1 and the last frame match.

## Story rules
- Research before writing a word. Plot details come from the source itself.
- Retellings only, with original art, music and voices. Never use stills, posters, clips, theme music, logos or trademark character designs from real films or shows.
- No gore. A stylised red flash with chunky red pixels is the limit.
- Made-up brands only (Midnight Pictures, Midnight Video, The Midnight Gazette). No real studios, stores or newspapers on screen.
- For "guess the movie" formats, never name the answer in narration, on screen, in the caption or in tags.

## Format (short-form playbook)
- 61 to 75 seconds. Motion and a burned-in title card in the first 2 seconds.
- A clue ladder from obscure to obvious, with the giveaway right before the loop. One unnarrated hidden visual clue.
- A short end tail that loops back to frame 1. At most 5 hashtags.

## Working rules
- Each role owns its file in the episode folder and hands it on. Nobody edits another role's file; send notes to the director.
- Narration always sits on top of the mix. Spoken lines are cached by hash, so do not change line text without a reason (it costs credits).
- Never read, print or ask for the ElevenLabs key. The server reads it itself.
- Never download media without the user's permission (filename, source, size).
- Takes, not finals: every render is a numbered take. Only the user picks the FINAL (`pick_take`).
- Look before you sign off: review stills and contact sheets, not just code.
