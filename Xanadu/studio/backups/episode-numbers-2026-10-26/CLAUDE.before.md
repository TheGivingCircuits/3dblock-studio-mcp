# Shorts Studio

Makes the user's short vertical videos (1080×1920, 30 fps, perfect loops) and one 16:9 long-form line. It was split out of the AZ-104 course folder on 2026-10-23. The course ("Cloud Shift", AZ-104) is **not** here; it stays in `~/Desktop/Azure 104`.

## Accounts (the user's plan, 2026-10-23)
| Account | Series | Notes |
|---|---|---|
| Countdown to Strange | Conspiracy Theories, Sketchy History | The user likes this name. It is also the 16:9 YouTube long-form line in `countdown/` (narrator Graves). |
| @GuessThatMovie_Horror | Guess The Horror | Handle picked by the user, checked free on TikTok, YouTube and Instagram. Profile picture and kit are done. |
| Tech | Tech (PS3 first) | Handle ideas are in its Channel kit. |

The user creates accounts, picks passwords and buys any domain. Never do those. The email idea: one custom domain with forwarding, one address per account, a password manager and an authenticator app. No Business TikTok account, because Business accounts only get the Commercial Music Library.

## Where things go
Videos are **not** in this folder. They go to `~/Desktop/Videos/<channel>/<series>/<NN - Title>/`:
- `takes/<Title> - Take NN.mp4` for every render, `<Title> - Thumbnail.jpg`, and a `Post kit (…).md`.
- There is no `- FINAL.mp4` until the user picks a take: `studio/render.mjs <slug> --pick=N`.
- Each channel folder has a `Channel kit.md` (handle, bio, posting plan).
- **Desktop organization (2026-10-26, user requested):** the Desktop shows `Studio` and the `Up Next` shortcut. Actual folders are `~/Desktop/Studio/{Project,Support,Videos}`. Videos contains `01 - Ready to Upload`, `02 - Episode Library`, `03 - Tests`, and `04 - Other Projects and Older Copies`; the active top-level `Countdown to Strange` folder remains in place. The library is grouped into `Channel 1 - Countdown to Strange`, `Channel 2 - Guess The Horror`, and `Channel 3 - Tech`. **Hidden compatibility symlinks retain all previous Desktop, channel, cache, and upload paths. Keep those links:** render scripts and the T7 archive still use them. No channel-folder migration is pending. The previous `Ready to Post` copies are in `04 - Other Projects and Older Copies/Previous upload copies`; use `Up Next` for current uploads. Move details: `~/Desktop/Studio/Support/organization/2026-10-26/moves.json`.

## How to run
Node is not on PATH. Run everything from this folder with `.tools/node/bin/node`.
```bash
.tools/node/bin/node studio/new-episode.mjs <slug> "<Title>" <year> [--series="Guess The Horror"]
.tools/node/bin/node studio/render.mjs <slug> --voice          # narration + sound effects, prints each line's words
.tools/node/bin/node studio/render.mjs <slug> --stills[=auto|t,t]
.tools/node/bin/node studio/render.mjs <slug> --final          # next take, thumbnail, length/LUFS/loop check
.tools/node/bin/node studio/render.mjs <slug> --pick=N         # only when the user chooses
```
Skills: `/conspiracy` (woodcut engine, house style) and `/guess-the-movie` (the template; PS1 cut; prop library). They hold the workflow, so read them before building an episode.

## Layout
- `studio/lib/woodcut.js` woodcut engine (broadsheet, newspaper, and the DVD-case cover that opens).
- `studio/lib/ps1.js` PS1 low-poly 3D engine with lenses, depth of field, bloom, grades, flares.
- `studio/lib/ps1-props/{vehicles,places,furniture,people,halloween-things,halloween-places,halloween-people}.js` the prop library. Preview any builder with `studio/props-test/view.mjs` (modules join with `+`).
- `studio/episodes/<slug>/{spec.js, scene.js, index.html}` one folder per episode. `scene.vN.js` files are the old backups.
- `notebook/make.mjs` shared renderer (spec + HTML → MP4). `eleven.mjs` ElevenLabs client with a hash cache (see Support folder).
- `countdown/` 16:9 long-form. `shorts/` Sketchy History. `tech/` Tech (PS3 specs and photos).
- `tools/organize-takes.py` reorganizes old finals into takes and makes thumbnails. `styletest/` the art-style samples. `guess-profile/` the TikTok avatar.

## The Support folder (keeps this project small)
This project is only source, about 230 files, so the app can open it. The heavy pieces live next to it in `~/Desktop/Shorts Studio Support/`. **Do not copy them back into this folder.**
- `node/` the real node runtime. `.tools/node/bin/node` here is a one-line launcher that runs it, so every command in the skills still works.
- `node_modules/` the dependencies (puppeteer-core, ffmpeg-static, three). `node_modules` here is a link to it. Scene pages load three.js through that link.
- `eleven-cache/` every ElevenLabs voice, sound-effect and music file already paid for, keyed by hash. `eleven.mjs` reads it (override with `ELEVEN_CACHE`).
- `archive/tech-ps3-footage/` the raw clips and frames for the PS3 episode (about 2,200 files). To re-render the PS3 short, put it back at `tech/ps3/footage`, render, then move it out again. New tech episodes should keep their footage outside the project too.

## Hard rules
- **ElevenLabs key** lives at `~/.config/elevenlabs.key`. Never ask for it, print it or type it anywhere. Scripts read the file themselves. The audio cache means re-renders cost nothing, so avoid changing spoken lines needlessly.
- **Downloads need permission first,** stating filename, source and size. View movie posters in the browser, never save them. Never rip other creators' YouTube or Twitch uploads.
- **Never change anything in the user's Azure account** without an explicit go-ahead.
- **Guess The Horror look (user, 2026-10-24):** hand-built Cursed Tape PS1 geometry (box people, tiny textures, no prop library, no camcorder) + the cinematic camera (DOF, moves, letterbox, bloom), `res: 1.5`, and a colour grade matched to each film. Stylized Minecraft-hit blood (red flash + red pixel cubes) is allowed; no wounds or gore. Reference: `studio/episodes/the-hitchhiker/`.
- **Guess The Horror copyright:** plot retellings only, with original art, music and voices. No stills, posters, clips or theme music. Iconic characters, masks and costumes may be drawn as fans know them; the user decided that is fair use. No gore. Real songs are never baked in; the post kit gives a timestamp for adding the track from TikTok's library.
- **Made-up brands only:** Midnight Pictures, Midnight Video and The Midnight Gazette are in-video props, never account names. No real newspapers, studios or stores.
- **Research a movie before writing a word:** Wikipedia plot plus the film's fan wiki (fandom blocks WebFetch, so use the built-in browser). The user caught a wrong script on episode 2.
- **Open every finished take** on the Mac right away (`open "<take path>"`) and send the user a pixel-sharp 720p preview (`scale=720:1280:flags=neighbor`, under 30 MB). The user asked for this on 2026-10-24.
- **Takes, not finals.** Never leave several FINAL files around.
- **T7 drive backup:** `rsync -rt --exclude ".DS_Store" ~/Desktop/Videos/ "/Volumes/T7 footage/Desktop Videos/"`, then verify counts and sizes and delete `._*` files. Leave Project Library, Research, DCIM and the top-level "Countdown to Strange" folder (another session's) alone. Use `rm -rf "${VAR:?}"` with shell variables.
- **Never put a `//` comment mid-line before more code in a one-line statement list.** It swallowed code more than five times.

## Quality bar (user feedback)
Polish and no clipping; real interiors and people who sit and walk; a lens per shot with depth of field, grades, flares and letterbox; keyframed poses with no snapping; narration always on top of the mix (`voxGain`, `sfxDuck`); story props are literal (a body is a wrapped, stained bundle, not a box); plot details come from the film itself. For conspiracies, match the era of the clothes and the page. "Be eating you", not "beating you".

## State on 2026-10-23
- Done: Conspiracy #1 Nuremberg 1561, #2 Phoenix Lights 1997. Sketchy History #1 Dancing Plague 1518. Guess The Horror #1 The Cursed Tape (The Ring), woodcut cut and a PS1 cut. #2 The Rusted Truck (Jeepers Creepers), PS1, Take 07 latest. #5 The Babysitter (Halloween 1978, renumbered from #3 on 2026-10-24), PS1, a Halloween-week special. #3 The Black Woods (Blair Witch). #4 The Hitchhiker (Texas Chain Saw Massacre), built to the playbook. Tech #1 PS3 plus a "Take Me Back" cut.
- **No take has been picked as FINAL for any episode.**

## Open work
1. Desktop and video-folder organization is complete; preserve the compatibility links described above.
2. Re-render The Cursed Tape PS1 without the camcorder overlay (`camcorder: false`), so it matches episode 2.
3. Re-probe the song slot in The Rusted Truck's post kit for Take 07. It says 0:37.5 to 0:40.5, computed for an older cut. Use `at('L7','song')`.
4. Once the user picks takes: `--pick=N`, then sync the T7.
5. Next Guess The Horror ideas, built from the prop library: the pale girl in the well, the masked man in coveralls.
6. After the user chooses a domain, add an account registry (address, handle, recovery details, no passwords) to each Channel kit.
7. `~/Desktop/Azure 104/studio` still has its own old copy of these files. This project is the source of truth now. Ask before deleting the old copies.

More detail is in the memory files for this project: `guess-the-horror`, `conspiracy-shorts`, `sketchy-history-shorts`, `tech-shorts` and `video-output-folders`.
