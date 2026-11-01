// PIPELINE TEST COPY of studio/episodes/the-hitchhiker/scene.js (2026-10-24). Changed: LIGHTS.use() after the PS1 imports, and the episode is
// handed to CAM.episode(HH.adapt(...)) (see pipeline.js). Everything else is the finished episode's own code. Never copy this back.
// The redrawn cover and disc for "The Hitchhiker" (the 1974 one-sheet: a cream stock, the giant black stacked tagline "Who will survive and what
// will be left of them?" down the left, a yellowed wood-plank panel of the big masked man in a butcher's apron swinging the saw out of frame, the
// title in red quote marks underneath and "What happened is true…" below). Our own hand-drawn version: the title is withheld (one "?" per
// letter: "??? / ????? / ???????? ????????"), the studio and the store sticker are ours, and the figure is our low-poly character, not an actor.
// Exposes window.COVER = { cover (270x380 canvas), disc (64x64 canvas) }.
(function () {
  const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const W = 270, H = 380, CON = 'Impact, "Arial Narrow", "Helvetica Neue", sans-serif';
  const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  function cover() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = mulberry(74);
    // aged cream poster stock
    g.fillStyle = '#efe8d6'; g.fillRect(0, 0, W, H); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(120,96,60,${.02 + r() * .05})`; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 2); }
    const age = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 260); age.addColorStop(0, 'rgba(0,0,0,0)'); age.addColorStop(1, 'rgba(110,80,40,.28)'); g.fillStyle = age; g.fillRect(0, 0, W, H);
    // the photo panel: yellowed planks, a dark doorway, the masked man
    const PX = 112, PY = 44, PW = 146, PH = 198; g.save(); g.beginPath(); g.rect(PX, PY, PW, PH); g.clip();
    const wood = g.createLinearGradient(PX, 0, PX + PW, 0); wood.addColorStop(0, '#8a6430'); wood.addColorStop(.5, '#caa060'); wood.addColorStop(1, '#a87c3e'); g.fillStyle = wood; g.fillRect(PX, PY, PW, PH);
    g.strokeStyle = 'rgba(70,44,16,.55)'; g.lineWidth = 1.4; for (let x = PX + 8; x < PX + PW; x += 13 + r() * 4) { g.beginPath(); g.moveTo(x, PY); g.lineTo(x + r() * 2 - 1, PY + PH); g.stroke(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(60,36,12,${.08 + r() * .15})`; g.fillRect(PX + r() * PW, PY + r() * PH, 1, 3 + r() * 6); }
    g.fillStyle = '#1c130a'; g.fillRect(PX + 80, PY, 54, 120); g.fillStyle = '#2e2014'; g.fillRect(PX + 78, PY, 4, 124);   // the doorway behind him
    // the man (three-quarter, facing left): slacks, blue shirt, cream apron, the mask and shaggy hair, one arm up, one swinging the saw
    g.fillStyle = '#2e2a26'; poly(g, [[PX + 54, PY + 150], [PX + 92, PY + 150], [PX + 98, PY + 205], [PX + 82, PY + 205], [PX + 74, PY + 166], [PX + 66, PY + 205], [PX + 48, PY + 205]]); g.fill();
    const shirt = g.createLinearGradient(PX + 40, 0, PX + 110, 0); shirt.addColorStop(0, '#6a84a0'); shirt.addColorStop(1, '#a8bcd2'); g.fillStyle = shirt;
    poly(g, [[PX + 50, PY + 74], [PX + 98, PY + 70], [PX + 104, PY + 152], [PX + 46, PY + 154]]); g.fill();
    g.fillStyle = '#e4dcc4'; poly(g, [[PX + 58, PY + 88], [PX + 90, PY + 86], [PX + 96, PY + 190], [PX + 52, PY + 192]]); g.fill();
    g.strokeStyle = 'rgba(120,100,70,.5)'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(PX + 60 + i * 6, PY + 92); g.lineTo(PX + 56 + i * 7, PY + 188); g.stroke(); }
    g.fillStyle = '#9ab0c8'; poly(g, [[PX + 92, PY + 74], [PX + 104, PY + 70], [PX + 118, PY + 30], [PX + 108, PY + 26]]); g.fill();   // the raised arm
    g.fillStyle = '#d0a07a'; g.beginPath(); g.ellipse(PX + 113, PY + 24, 6, 6, 0, 0, 6.283); g.fill();
    g.fillStyle = '#b48c62'; g.beginPath(); g.ellipse(PX + 72, PY + 56, 15, 18, -.1, 0, 6.283); g.fill();   // the mask
    g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(PX + 74, PY + 42, 18, 9, -.1, 0, 6.283); g.fill(); for (let i = 0; i < 9; i++) { g.fillRect(PX + 58 + i * 3.6, PY + 40, 2, 8 + r() * 6); }
    g.fillStyle = '#1a100a'; g.fillRect(PX + 62, PY + 54, 6, 3); g.fillRect(PX + 74, PY + 53, 6, 3); g.fillRect(PX + 64, PY + 64, 12, 3);
    g.fillStyle = '#7a8ea8'; poly(g, [[PX + 52, PY + 82], [PX + 40, PY + 120], [PX + 22, PY + 140], [PX + 30, PY + 146], [PX + 50, PY + 126], [PX + 62, PY + 92]]); g.fill();   // the saw arm
    g.save(); g.translate(PX + 24, PY + 146); g.rotate(.62);
    g.fillStyle = '#8a2a1c'; g.fillRect(-14, -12, 30, 22); g.fillStyle = '#2a2624'; g.fillRect(-14, 6, 30, 6);
    const bar = g.createLinearGradient(0, -4, 0, 4); bar.addColorStop(0, '#dfe2e4'); bar.addColorStop(1, '#8a8e92'); g.fillStyle = bar; g.fillRect(-92, -4, 80, 8);
    g.fillStyle = '#3a3836'; for (let x = -92; x < -12; x += 5) { g.fillRect(x, -5, 2, 2); g.fillRect(x, 3, 2, 2); } g.restore();
    g.restore(); g.strokeStyle = '#1a1612'; g.lineWidth = 1; g.strokeRect(PX + .5, PY + .5, PW - 1, PH - 1);
    // the saw breaks out of the panel (as on the poster)
    g.save(); g.translate(PX + 24, PY + 146); g.rotate(.62); g.beginPath(); g.rect(-150, -10, 138, 20); g.clip(); const bar2 = g.createLinearGradient(0, -4, 0, 4); bar2.addColorStop(0, '#dfe2e4'); bar2.addColorStop(1, '#8a8e92'); g.fillStyle = bar2; g.fillRect(-92, -4, 80, 8); g.restore();
    g.fillStyle = '#f4efe2'; g.font = `11px ${CON}`; g.textAlign = 'left'; ['America’s most', 'bizarre and', 'brutal crimes!...'].forEach((s, i) => g.fillText(s, PX + 92, PY + 168 + i * 11));
    // the giant stacked tagline
    g.fillStyle = '#121010'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    [['Who will survive', 30, 40], ['and what', 26, 72], ['will be', 26, 100], ['left of', 26, 128], ['them?', 26, 156]].forEach(([s, sz, y], i) => { g.font = `${sz}px ${CON}`; g.fillText(s, 12, y); });
    // the withheld title, in red quote marks
    g.fillStyle = '#c4281c'; g.font = `30px ${CON}`; g.fillText('“???', 12, 272); g.fillText('?????', 18, 302); g.font = `28px ${CON}`; g.fillText('???????? ????????”', 12, 330);
    g.save(); g.translate(196, 284); g.rotate(-.08); g.strokeStyle = '#c4281c'; g.lineWidth = 2.4; g.strokeRect(-48, -10, 96, 20); g.fillStyle = '#c4281c'; g.font = 'bold 11px Rockwell, "Courier New", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TITLE WITHHELD', 0, 1); g.restore();
    g.fillStyle = '#121010'; g.font = `9px ${CON}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('What happened is true. Now the motion picture that’s just as real.', 12, 344);
    g.fillStyle = 'rgba(40,34,28,.75)'; g.font = '5.5px "Avenir Next Condensed", Arial, sans-serif'; ['MIDNIGHT PICTURES PRESENTS A ??? FILM · STARRING ??? · ??? · ??? · ???', 'MUSIC BY ??? · WRITTEN BY ??? · PRODUCED AND DIRECTED BY ???'].forEach((s, i) => g.fillText(s, 12, 355 + i * 7));
    g.strokeStyle = '#121010'; g.lineWidth = 1; g.strokeRect(12, 364, 20, 9); g.font = 'bold 7px Arial'; g.fillStyle = '#121010'; g.fillText('R', 19, 371); g.font = '4px Arial'; g.fillText('RESTRICTED', 35, 371);
    g.save(); g.translate(238, 30); g.rotate(.14); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 21, 0, 6.283); g.fill(); g.strokeStyle = '#c0302a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#c0302a'; g.font = 'bold 5.5px Arial'; g.textAlign = 'center'; g.fillText('MIDNIGHT VIDEO', 0, -7); g.font = 'bold 8px Arial'; g.fillText('HORROR', 0, 2); g.fillText('CLASSIC', 0, 10); g.restore();
    const sh = g.createLinearGradient(0, 0, W, H); sh.addColorStop(0, 'rgba(255,255,255,.1)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
    return c;
  }
  function disc() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#a8adb4'; g.beginPath(); g.arc(32, 32, 31, 0, 6.283); g.fill();
    g.fillStyle = '#efe8d6'; g.beginPath(); g.arc(32, 32, 28, 0, 6.283); g.fill();
    g.fillStyle = '#c4281c'; g.font = '9px Impact, "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.fillText('???', 32, 18); g.fillText('?????', 32, 46); g.font = '5px Impact, sans-serif'; g.fillText('???????? ????????', 32, 53);
    g.fillStyle = '#8a2a1c'; g.fillRect(14, 22, 9, 6); g.fillStyle = '#b8bcc0'; g.fillRect(23, 24, 16, 2);
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(32, 32, 6, 0, 6.283); g.fill(); g.fillStyle = '#0a0605'; g.beginPath(); g.arc(32, 32, 2.4, 0, 6.283); g.fill();
    return c;
  }
  window.COVER = { cover: cover(), disc: disc() };
})();
// GUESS THE HORROR #4 v2 — "The Hitchhiker" (The Texas Chain Saw Massacre, 1974; never named), built by hand on studio/lib/ps1.js in the
// same idiom as The Cursed Tape PS1 (2026-10-24): tiny canvas textures, boxes and cylinders, PS1.person box people with painted faces, plain fov
// numbers, fog + ambient + three point lights only. No prop library, no lenses, no grades, no flares, no letterbox. v1 is scene.v1.js.
// Research (Wikipedia plot + the Texas Chainsaw fan wiki): August 18, 1973. Sally, her brother Franklin (a wheelchair user), Jerry, Kirk and Pam
// drive a van; they pick up a hitchhiker who takes a Polaroid of Franklin, burns it and slashes Franklin's arm with a razor; they throw him out.
// The gas station's owner says the pumps are empty. Kirk and Pam find a farmhouse with wrecked cars and a generator; Kirk goes in to ask for gas,
// a steel sliding door opens, a huge masked man kills him with a hammer and slams the door. Pam, Jerry (at sunset), Franklin (at night) are taken.
// Sally runs to the gas station; the owner is one of the family and brings her back. Dinner with the family and Grandpa, too weak to swing the
// hammer. At dawn she crashes through a window, runs to the road and escapes in the back of a passing pickup while the masked man swings his
// chainsaw in the road at sunrise. Non-graphic: every kill is a cut to black or an empty space.
// Places (one world, far apart, fog hides the rest): the gas station (x=0, golden day and night) · the back road (x=150) · the farm (x=300) ·
// the red hall (x=450) · the dining room (x=600) · the sunrise road (x=750). The case lies on the picnic table outside the station.
const { P, lerp, eio, eo, clamp, rng, at, st, en, back, V } = PS1;
LIGHTS.use();   // PIPELINE TEST: every material below is built on lib/lights.js
const M = PS1.mat, tex = PS1.tex, add = PS1.add, box = PS1.box, cyl = PS1.cyl, noise = PS1.noise, rep = PS1.rep, grp = PS1.group;
const DS = { side: THREE.DoubleSide };

// ---------- textures (tiny, on purpose) ----------
const T = {
  dirt: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a6a44'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a4428', 80, .8); noise(q, w, h, r, '#a88a5a', 40, .6); }),
  grass: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7a44'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a5428', 90, .8); noise(q, w, h, r, '#b0a060', 40, .6); }),
  road: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#3e3a36'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a2624', 80, .8); noise(q, w, h, r, '#5a5650', 40, .6); }),
  dash: PS1.color('#d8b440'),
  cinder: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#c8c0a8'; q.fillRect(0, 0, w, h); q.fillStyle = '#a49c86'; for (let y = 0; y < h; y += 4) { q.fillRect(0, y, w, 1); for (let x = (y / 4 % 2) * 4; x < w; x += 8) q.fillRect(x, y, 1, 4); } noise(q, w, h, r, '#7a705e', 30, .6); }),
  siding: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#d8d0bc'; q.fillRect(0, 0, w, h); q.fillStyle = '#a8a08c'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#8a826e', 30, .6); }),
  tin: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a6a5a'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a4a3e'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#9a5a3a', 30, .6); }),
  wood: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3e2616'; for (let y = 2; y < h; y += 5) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#7a5232', 30, .7); }),
  boards: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#6a4a30'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2618'; for (let y = 3; y < h; y += 4) q.fillRect(0, y, w, 1); noise(q, w, h, r, '#8a6a48', 30, .6); }),
  redwall: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a2a22'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a1a14', 90, .7); noise(q, w, h, r, '#9a4a3a', 40, .5); }),
  steel: tex(16, 32, (q, w, h, r) => { q.fillStyle = '#6e7276'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a4e52', 80, .6); noise(q, w, h, r, '#8a6a4a', 30, .5); q.fillStyle = '#3a3e42'; for (let y = 2; y < h; y += 6) { q.fillRect(1, y, 1, 1); q.fillRect(w - 2, y, 1, 1); } }),
  paper: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#5a4a38'; q.fillRect(0, 0, w, h); q.fillStyle = '#4a3a2a'; for (let x = 1; x < w; x += 4) q.fillRect(x, 0, 1, h); noise(q, w, h, r, '#2e241a', 50, .6); }),
  floor: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a3226'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1a12', 90, .8); noise(q, w, h, r, '#6a4a36', 40, .6); }),
  ceil: PS1.color('#2a2622'), black: PS1.color('#030303'), glass: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#26303a'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a7a88'; q.fillRect(1, 1, 2, 1); q.fillRect(5, 4, 2, 1); }),
  lit: PS1.color('#e8c86a'), day: PS1.color('#f2e2b8'), bone: PS1.color('#e2dccb'), bulb: PS1.color('#fff2c8'), rust: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a4a2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a2a18', 80, .8); noise(q, w, h, r, '#a86a3a', 40, .6); }),
  olive: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#7a8460'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a6040', 60, .7); noise(q, w, h, r, '#8a5a3a', 20, .6); }),
  blue: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#4a6a8a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2e4a62', 50, .7); }),
  tyre: PS1.color('#151515'), chrome: PS1.color('#a8acb0'), red: PS1.color('#9a2a1e'), headlight: PS1.color('#fff4c8'), pumpRed: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#c23a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e8e2d0'; q.fillRect(1, 3, 6, 4); noise(q, w, h, r, '#7a2018', 10, .6); }),
  pumpBlue: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#2a5a9a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e8e2d0'; q.fillRect(1, 3, 6, 4); noise(q, w, h, r, '#1a3a6a', 10, .6); }),
  sign: tex(64, 16, (q) => { q.fillStyle = '#e8dcc0'; q.fillRect(0, 0, 64, 16); q.fillStyle = '#9a2a1e'; q.font = 'bold 8px Arial'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('GAS · BAR-B-Q', 32, 8.5); q.strokeStyle = '#6a5a40'; q.strokeRect(.5, .5, 63, 15); }),
  pine: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#3a3426'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#241e16', 30, .9); }),
  dawnView: tex(32, 40, (q, w, h, r) => { const g = q.createLinearGradient(0, 0, 0, 26); g.addColorStop(0, '#f08a6a'); g.addColorStop(1, '#ffd2a0'); q.fillStyle = g; q.fillRect(0, 0, w, 26);   // the sunrise through the window
    q.fillStyle = '#fff4d0'; q.beginPath(); q.arc(20, 24, 5, 0, 6.283); q.fill(); q.fillStyle = '#6a4a3a'; q.fillRect(0, 26, w, h - 26); noise(q, w, h, r, '#4a3226', 40, .5); q.fillStyle = '#3a2a22'; q.fillRect(7, 12, 1, 15); q.fillRect(5, 13, 5, 1); }),
  sun: PS1.color('#fff0c0'), shard: PS1.color('#cfe0ea'), flame: PS1.color('#ffb040'), photo: PS1.color('#f4f2ea'),
  // the people's clothes
  pink: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#e6c8c8'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#b89898', 12, .7); }),
  jeans: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a5a86'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a3858', 14, .8); }),
  redTee: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#a83a2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#6a2218', 12, .7); }),
  denim: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#5a6e94'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a4a6a', 12, .7); }),
  tank: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#c8a050'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a6a30', 12, .7); }),
  halter: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#b84a3a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#7a2a20', 12, .7); }),
  shorts: tex(8, 8, (q, w, h) => { q.fillStyle = '#d6a084'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a5a4a'; q.fillRect(0, 0, w, 3); }),
  jacket: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a4a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#4a2a18', 14, .8); }),
  grey: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a4a52'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a2a30', 14, .8); }),
  shirt: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#e4ded0'; q.fillRect(0, 0, w, h); q.fillStyle = '#6a3a2a'; q.fillRect(3, 0, 1, 5); noise(q, w, h, r, '#a8a090', 10, .6); }),
  slacks: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#3a3430'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1e1a18', 14, .8); }),
  suit: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#2e2a28'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#1a1816', 14, .8); }),
  work: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#8ea4b8'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2a22'; q.fillRect(3, 0, 2, 6); noise(q, w, h, r, '#5a6a7a', 12, .7); }),
  apron: tex(8, 16, (q, w, h, r) => { q.fillStyle = '#d8d0b8'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#8a7a5a', 30, .7); }),
  khaki: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#8a8a6a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a5a42', 12, .7); }),
  skin: PS1.color('#d6a084'), pale: PS1.color('#c9b8a6'), tan: PS1.color('#b89470'),
  brownHair: tex(8, 16, (q, w, h) => { q.fillStyle = '#5a3a24'; q.fillRect(0, 0, w, h); q.fillStyle = '#3a2416'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  blonde: tex(8, 16, (q, w, h) => { q.fillStyle = '#d8b878'; q.fillRect(0, 0, w, h); q.fillStyle = '#a8884a'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  darkHair: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#2e2620'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#14100c', 20, .8); }),
  sandy: tex(8, 16, (q, w, h) => { q.fillStyle = '#7a5a32'; q.fillRect(0, 0, w, h); q.fillStyle = '#5a3e20'; for (let x = 1; x < w; x += 3) q.fillRect(x, 0, 1, h); }),
  greyHair: PS1.color('#a8a49c'), shag: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#4a3424'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#2a1c12', 24, .9); }),
  face: (kind) => tex(24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    if (kind === 'mask') { px('#b48c62', 0, 0, 24, 28); px('#4a3020', 0, 0, 24, 5); for (let x = 1; x < 24; x += 3) px('#4a3020', x, 5, 1, 3);
      for (const [x0, y0, x1, y1] of [[2, 8, 10, 7], [14, 7, 22, 9], [11, 4, 12, 26], [4, 21, 20, 22]]) for (let i = 0; i <= 8; i++) px('#5a3e2a', Math.round(x0 + (x1 - x0) * i / 8), Math.round(y0 + (y1 - y0) * i / 8));
      px('#120c08', 5, 11, 5, 3); px('#120c08', 14, 11, 5, 3); px('#3a2618', 10, 15, 4, 3); px('#1a100a', 7, 22, 10, 3); for (let x = 8; x < 17; x += 2) px('#d8c8a0', x, 22, 1, 2); return; }
    const S = { sally: ['#d6a084', '#5a3a24', 1], sallyS: ['#d6a084', '#5a3a24', 1], fran: ['#d6a084', '#4a3220', 0], jerry: ['#d6a084', '#2e2620', 0], kirk: ['#d6a084', '#7a5a32', 1], pam: ['#e0b090', '#d8b878', 1],
      hitch: ['#c8a48a', '#2e2620', 1], old: ['#d0a888', '#a8a49c', 0], oldG: ['#d0a888', '#a8a49c', 0], grand: ['#c9b8a6', '#c9b8a6', 0], drv: ['#b07a5a', '#2a2018', 0] }[kind];
    const [sk, hair, long] = S; px(sk, 0, 0, 24, 28); px(hair, 0, 0, 24, kind === 'grand' ? 0 : 5); if (long) { px(hair, 0, 5, 3, 16); px(hair, 21, 5, 3, 16); }
    const scared = kind === 'sallyS'; px('#5a3a22', 5, scared ? 8 : 9, 4, 1); px('#5a3a22', 15, scared ? 8 : 9, 4, 1);
    if (kind === 'grand') { px('#7a6a5a', 4, 10, 6, 4); px('#7a6a5a', 14, 10, 6, 4); px('#1a1410', 7, 12); px('#1a1410', 16, 12); for (const y of [4, 6, 17, 19]) px('#a89888', 4, y, 16, 1); px('#5a3a32', 9, 21, 6, 1); return; }
    px('#f4f2ec', 5, 11, 4, scared ? 3 : 2); px('#f4f2ec', 15, 11, 4, scared ? 3 : 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); px('#b07a62', 11, 15, 2, 3);
    if (scared) { px('#3a1612', 9, 19, 6, 5); px('#7a2a24', 10, 21, 4, 2); } else if (kind === 'oldG' || kind === 'hitch') { px('#3a1a14', 8, 20, 8, 2); px('#e8e0d0', 9, 20, 6, 1); } else px('#8a4a3a', 9, 21, 6, 1);
    if (kind === 'kirk') { px('#7a5a32', 4, 17, 16, 3); px('#7a5a32', 6, 20, 12, 6); px('#8a4a3a', 9, 21, 6, 1); }
    if (kind === 'old' || kind === 'oldG') { px('#8a8680', 7, 18, 10, 2); for (const y of [4, 6]) px('#b08870', 5, y + 1, 14, 1); }
    if (kind === 'hitch') { px('#7a3a3a', 15, 14, 6, 5); px('#9a8070', 3, 15, 3, 6); }   // the birthmark, hollow cheeks
    if (kind === 'fran') { px('#2a2a2a', 4, 10, 7, 4); px('#2a2a2a', 13, 10, 7, 4); px('#f4f2ec', 5, 11, 5, 2); px('#f4f2ec', 14, 11, 5, 2); px('#1a1410', 7, 12); px('#1a1410', 16, 12); } }),
};
for (const k of ['dirt', 'grass', 'road']) PS1.mip(T[k]);   // big tiled ground: mip-mapped so distant texels don't crawl
const diskTex = (() => { const t = new THREE.CanvasTexture(COVER.disc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();

// ---------- builders ----------
const plane = (w, h, mat, x, y, z, rx = 0, ry = 0, parent) => { const m = add(rep(new THREE.PlaneGeometry(w, h, Math.max(1, Math.ceil(w / 2)), Math.max(1, Math.ceil(h / 2))), Math.max(1, w / 1.5), Math.max(1, h / 1.5)), mat, x, y, z, parent); m.rotation.set(rx, ry, 0); return m; };
const ground = (w, d, mat, x, y, z, parent) => plane(w, d, mat, x, y, z, -Math.PI / 2, 0, parent);
const offset = (m, f) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = f * 2; return m; };
function road(x, z, len, along, parent) { const r = ground(along === 'z' ? 6.4 : len, along === 'z' ? len : 6.4, offset(M(T.road), -1), x, .04, z, parent), dm = offset(M(T.dash, { unlit: true, tint: '#b8a060' }), -2);
  for (let k = -len / 2 + 2; k < len / 2; k += 6) ground(along === 'z' ? .14 : 2.4, along === 'z' ? 2.4 : .14, dm, along === 'z' ? x : x + k, .08, along === 'z' ? z + k : z, parent); return r; }
function deadTree(x, z, h, parent, seed = 1) { const r = rng(seed); add(cyl(.12, .2, h, 5), M(T.pine), x, h / 2, z, parent); for (let k = 0; k < 4; k++) { const b = add(box(.08, h * .35, .08), M(T.pine), x, h * (.55 + k * .1), z, parent); b.rotation.set((r() - .5) * 1.4, r() * 6, (r() < .5 ? -1 : 1) * (.6 + r() * .5)); } }
function pole(x, z, parent) { add(box(.2, 7, .2), M(T.wood), x, 3.5, z, parent); add(box(1.6, .12, .12), M(T.wood), x, 6.6, z, parent); }
function wheels(G, xs, zs, r = .36) { const W = []; for (const x of xs) for (const z of zs) { const w = add(cyl(r, r, .22, 8), M(T.tyre), x, r, z, G); w.rotation.z = Math.PI / 2; add(cyl(r * .5, r * .5, .23, 6), M(T.chrome), x, r, z, G).rotation.z = Math.PI / 2; W.push(w); } return W; }
// the van: hollow (double-sided panels) so we can sit inside it; faces -z, rear doors at +z
function van(x, z) { const G = grp(x, 0, z), B = M(T.olive, DS);
  plane(1.9, 4.6, M(T.boards, DS), 0, .45, 0, -Math.PI / 2, 0, G); plane(1.9, 4.6, B, 0, 2.05, 0, -Math.PI / 2, 0, G); for (const s of [-1, 1]) { plane(3.4, 1.6, B, s * .95, 1.25, .6, 0, s * Math.PI / 2, G); plane(1.2, .8, B, s * .95, .85, -1.7, 0, s * Math.PI / 2, G); add(box(.04, .06, 1.2), B, s * .95, 2.02, -1.7, G); }
  plane(1.9, .8, B, 0, .85, -2.3, 0, 0, G); plane(1.9, .8, M(T.glass, DS), 0, 1.65, -2.3, 0, 0, G); const gl = M(T.streak, { unlit: true, side: THREE.DoubleSide, tint: '#9a9282' }); plane(.9, .6, gl, -.35, 1.65, -2.33, 0, 0, G);   // a faint glint on the windshield
  
  add(box(1.92, .3, .1), M(T.chrome), 0, .45, -2.35, G); for (const s of [-1, 1]) add(box(.22, .16, .04), M(T.headlight, { unlit: true }), s * .65, .75, -2.33, G);
  const doors = [-1, 1].map(s => { const pv = grp(s * .95, 0, 2.3, G); plane(.95, 1.6, B, -s * .475, 1.25, 0, 0, 0, pv); return pv; });
  G.userData = { wheels: wheels(G, [-.9, .9], [-1.5, 1.6]), doors };
  for (const s of [-1, 1]) add(box(.5, .5, .5), M(T.slacks), s * .45, .7, -1.45, G);   // the front seats
  for (const [cx, cz] of [[.6, .2], [-.6, .2], [.6, 1.15], [-.6, 1.15]]) add(box(.42, .45, .5), M(T.wood), cx, .675, cz, G);   // crates in the back
  return G; }
function pickup(x, z) { const G = grp(x, 0, z), B = M(T.blue);
  add(box(1.8, .7, 1.6), B, 0, .85, -1.1, G); add(box(1.7, .6, 1.3), B, 0, 1.5, -.95, G); add(box(1.72, .4, .02), M(T.glass), 0, 1.55, -1.61, G); add(box(1.8, .55, 1.3), B, 0, .78, -2.4, G);
  add(box(1.8, .1, 2.6), M(T.boards), 0, .75, .9, G); for (const s of [-1, 1]) add(box(.08, .45, 2.6), B, s * .88, 1.0, .9, G); add(box(1.8, .45, .08), B, 0, 1.0, 2.2, G);
  for (const s of [-1, 1]) add(box(.2, .14, .04), M(T.headlight, { unlit: true }), s * .62, .85, -3.06, G); G.userData = { wheels: wheels(G, [-.85, .85], [-2.2, 1.4], .38) }; return G; }
function wreck(x, z, ry, mat, parent) { const G = grp(x, 0, z, parent); G.rotation.set(.03, ry, .05); add(box(1.8, .6, 4.4), mat, 0, .45, 0, G); add(box(1.6, .5, 2.0), mat, 0, 1.0, .2, G); add(box(1.62, .3, .02), M(T.glass), 0, 1.05, -.81, G);
  for (const [wx, wz] of [[-.9, -1.4], [.9, -1.4], [-.9, 1.4], [.9, 1.4]]) { const w = add(cyl(.3, .3, .2, 7), M(T.tyre), wx, .22, wz, G); w.rotation.z = Math.PI / 2; } return G; }
function pump(x, z, mat, parent) { add(box(.5, 1.25, .38), M(mat), x, .78, z, parent); add(new THREE.SphereGeometry(.16, 6, 4), M(T.headlight, { unlit: true, tint: '#f4ecd0' }), x, 1.55, z, parent).parent || 0; add(box(.04, .55, .04), M(T.tyre), x + .27, .7, z + .1, parent); }
// a doorway in a wall: three panels around an opening, double-sided
function wallWithDoor(w, h, dw, dh, mat, x, y, z, ry, parent) { const G = grp(x, y, z, parent); G.rotation.y = ry; const sw = (w - dw) / 2; plane(sw, h, mat, -(dw + sw) / 2, h / 2, 0, 0, 0, G); plane(sw, h, mat, (dw + sw) / 2, h / 2, 0, 0, 0, G); plane(dw, h - dh, mat, 0, dh + (h - dh) / 2, 0, 0, 0, G); return G; }
// a room seen from inside: floor, ceiling, walls (double-sided); open: 'front' leaves the +z wall out
function room(ox, oz, w, d, h, wallT, floorT, open) { const R = grp(ox, 0, oz), WM = M(wallT, DS);
  ground(w, d, M(floorT), 0, 0, 0, R); plane(w, d, M(T.ceil, DS), 0, h, 0, Math.PI / 2, 0, R); plane(d, h, WM, -w / 2, h / 2, 0, 0, Math.PI / 2, R); plane(d, h, WM, w / 2, h / 2, 0, 0, -Math.PI / 2, R);
  if (open !== 'back') plane(w, h, WM, 0, h / 2, -d / 2, 0, 0, R); if (open !== 'front') plane(w, h, WM, 0, h / 2, d / 2, 0, Math.PI, R); return R; }
// people: a PS1.person plus the walk/run/sit legs this episode needs (all pure in t)
const person = (top, legs, hair, face, o = {}) => { const p = PS1.person(Object.assign({ skin: T.skin, top, legs, hair, face: T.face(face) }, o)); p.faces = {}; p.setFace = k => { p.faceMat.uniforms.map.value = p.faces[k] || (p.faces[k] = T.face(k)); }; return p; };
const ARM = PS1.ARMS, LEG = PS1.LEGS;
function stand(p) { p.legs(LEG.stand(-1), LEG.stand(1)); p.pose(ARM.down(-1), ARM.down(1)); }
function sit(p, arms = 'lap') { p.legs(LEG.sit(-1), LEG.sit(1)); p.pose(ARM[arms](-1), ARM[arms](1)); }
function stride(p, ph, run) { const a = Math.sin(ph * 6.283), A = run ? .48 : .3; p.legs(...[-1, 1].map(s => { const k = s * a; return [V(s * .09, .8, 0), V(s * .09, .43, k * A * .55 + .03), V(s * .09, .05 + Math.max(0, -k) * (run ? .16 : .08), k * A)]; }));
  p.pose(...[-1, 1].map(s => { const k = -s * a; return [V(s * .24, 1.36, 0), V(s * .27, 1.1, k * .14 + (run ? .06 : 0)), V(s * .28, run ? .96 : .82, k * .28 + (run ? .16 : 0))]; })); }
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const path = (t, pts) => { if (t <= pts[0][0]) return pts[0][1].clone(); for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return lerpV(a, b, (t - t0) / (t1 - t0)); } return pts[pts.length - 1][1].clone(); };
function walker(p, t, pts, speed = 1.6, run = false) { const a = path(t, pts), b = path(t + .06, pts), moving = a.distanceTo(b) > .0004; p.G.position.copy(a); if (moving) { p.G.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); stride(p, t * speed, run); } else stand(p); return moving; }
// the roadkill armadillo (the hidden clue): built upright, then flipped onto its back; userData.legs twitch, userData.body rocks
function armadillo(x, z, parent) { const G = grp(x, .04, z, parent), B = grp(0, 0, 0, G), band = [M(T.tin, DS), M(T.rust, DS)], skin = M(T.pale), claw = M(T.tyre);
  for (let i = 0; i < 9; i++) { const zz = -.2 + i * .05, r = .14 * Math.sqrt(1 - Math.pow((zz) / .26, 2)) + .02, c = add(new THREE.CylinderGeometry(r, r, .052, 9, 1, true, Math.PI / 2, Math.PI), band[i % 2], 0, 0, zz, B); c.rotation.x = Math.PI / 2; c.rotation.y = 0; }
  add(box(.24, .01, .44), skin, 0, .0, 0, B);                                                            // the pale belly
  const hd = grp(0, .03, .25, B); add(box(.08, .07, .09), M(T.tin), 0, 0, 0, hd); const sn = add(new THREE.ConeGeometry(.032, .16, 6), skin, 0, -.01, .12, hd); sn.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) { const e = add(box(.022, .075, .03), skin, s * .03, .07, -.01, hd); e.rotation.z = s * -.25; }
  const tl = add(new THREE.ConeGeometry(.035, .36, 6), band[0], 0, .02, -.42, B); tl.rotation.x = -Math.PI / 2;
  const legs = [[-.09, .14], [.09, .14], [-.09, -.12], [.09, -.12]].map(([lx, lz]) => { const L = grp(lx, -.02, lz, B); add(box(.035, .09, .035), skin, 0, -.045, 0, L); add(box(.04, .015, .05), claw, 0, -.09, .01, L); return L; });
  G.rotation.z = Math.PI; G.position.y = .2; G.rotation.y = .6;                                            // on its back, legs up
  G.userData = { legs, body: B }; return G; }
// held things: a chainsaw (bar along +z), a sledgehammer (pivot at the grip, head at +y)
function chainsaw() { const G = grp(); add(box(.14, .2, .32), M(T.red), 0, 0, 0, G); add(box(.15, .06, .2), M(T.tyre), 0, -.1, 0, G); add(box(.03, .1, .03), M(T.tyre), 0, .14, .06, G); add(box(.03, .03, .2), M(T.tyre), 0, .19, .06, G);
  G.userData.bar = add(box(.02, .07, .62), M(T.chrome), 0, -.03, .47, G); return G; }
function hammer(len = .8) { const G = grp(); add(box(.04, len, .04), M(T.wood), 0, len / 2, 0, G); add(box(.09, .1, .22), M(T.grey), 0, len, .04, G); return G; }

// colour grades matched to the film: hot, sun-bleached, saturated 16mm yellow-orange days, dusty amber dusk, deep warm reds in the house,
// crushed blue-black nights, a pink-orange dawn (lift adds, gain multiplies, temp +warm/-cool)
const GR = { day: { lift: [.02, .01, -.02], gain: [1.08, 1.0, .82], sat: 1.18, contrast: 1.12, temp: .3 }, dusk: { lift: [.03, -.01, .02], gain: [1.1, .86, .8], sat: 1.2, contrast: 1.15, temp: .3 },
  night: { lift: [-.03, -.02, .02], gain: [.85, .88, 1.05], sat: 1.0, contrast: 1.3, temp: -.25 }, stnNight: { lift: [-.02, 0, 0], gain: [1.0, 1.0, .86], sat: 1.05, contrast: 1.25, temp: .05 },
  hall: { lift: [.02, -.01, -.02], gain: [1.14, .9, .8], sat: 1.22, contrast: 1.2, temp: .25 }, dinner: { lift: [.02, 0, -.02], gain: [1.1, .96, .78], sat: 1.15, contrast: 1.24, temp: .28 },
  dawn: { lift: [.03, 0, .02], gain: [1.1, .93, .9], sat: 1.2, contrast: 1.1, temp: .22 } };
// stylized blood (a Minecraft hit): the victim blinks red and chunky red pixels pop, never wounds
function hurt(p, k) { if (!p._mats) { p._mats = []; p.G.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (m.uniforms && m.uniforms.tint && !p._mats.includes(m)) p._mats.push(m); }); } for (const m of p._mats) m.uniforms.tint.value.setRGB(1, 1 - .78 * k, 1 - .78 * k); }
const hitK = (t, t0) => { const u = t - t0; return u < 0 || u > .45 ? 0 : (Math.floor(u * 16) % 2 ? .55 : 1) * (1 - u / .45); };
const bloodPool = (parent, n = 14) => [...Array(n)].map((_, i) => add(box(.05, .05, .05), M(PS1.color(i % 3 ? '#c41818' : '#8a0c0c'), { unlit: true }), 0, -99, 0, parent));
function bleed(pool, t, t0, o, dir) { pool.forEach((b, i) => { const k = t - t0 - (i % 3) * .02; if (k < 0 || k > 1.4) { b.position.y = -99; return; } const a = i * 2.399, sp = .5 + (i % 5) * .18;
  b.position.set(o.x + (Math.cos(a) * .35 + dir.x) * sp * k, Math.max(.03, o.y + (1.6 + (i % 4) * .3 - 4.9 * k) * k), o.z + (Math.sin(a) * .35 + dir.z) * sp * k); b.rotation.set(k * 6, k * 4, 0); }); }
const X = { station: 0, road: 150, farm: 300, hall: 450, dining: 600, dawn: 750 };
// the van on the back road: drives up, stops for the hitchhiker (zH); inside, the scenery scrolls past instead; L4: stopped at zS, drives off
const vz = t => t < 9.5 ? 40 - 9 * (t - 2.6) : t < 10.4 ? -22.1 - (9 * (t - 9.5) - 5 * (t - 9.5) * (t - 9.5)) : -26.15;
const zH = -26.15, zS = -60;
const scroll = t => t < 11 ? 0 : t < 11.8 ? 9 * (t - 11) * (t - 11) / 1.6 : 3.6 + 9 * (t - 11.8);
const vzS = t => t < at('L4', 'him') + .45 ? zS : zS - 3 * Math.pow(t - at('L4', 'him') - .45, 2);
function sched(S) { const w = (l, x, d = 0) => at(l, x) + d;
  return [['station', 0, st('L2') - .18], ['road', st('L2') - .18, w('L4', 'At', -.15)], ['station', w('L4', 'At', -.15), st('L5') - .1], ['farm', st('L5') - .1, st('L6') - .1], ['hall', st('L6') - .1, st('L7') - .1],
    ['farm', st('L7') - .1, w('L8', 'station', -.2)], ['station', w('L8', 'station', -.2), st('L9') - .1], ['dining', st('L9') - .1, w('L10', 'crashes', .05)], ['farm', w('L10', 'crashes', .05), st('L11') - .1], ['dawn', st('L11') - .1, S.cutBack]]; }
// the pickup on the sunrise road: comes in, stops for her, then pulls away slowly enough to keep him in sight (shared by shots and update)
function pickZ(t) { const tStop = at('L11', 'pickup') - .35, tGo = at('L11', 'while') - .3; return t < tStop ? lerp(46, 0, eo(clamp((t - st('L11') + .1) / (tStop - st('L11') + .1)))) : t < tGo ? 0 : -(1.8 * (t - tGo) + .15 * Math.pow(t - tGo, 2)); }
const where = (t, S) => { if (t >= S.cutBack) return 'station'; for (const [k, a, b] of sched(S)) if (t >= a && t < b) return k; return 'station'; };

// ---------- the countryside detail pass: grass and wildflowers in the wind, gravel and cracked asphalt, sagging wires, a windmill, cattle, hay bales,
// live trees, clouds, birds and a vulture, pollen in the light, a tumbleweed, laundry, a porch swing, junk tyres, a mailbox, rusty signs, bugs at the
// lights, bones, feathers and a caged chicken indoors, grime on the walls. Everything animates as a pure function of t through O.fx[set]
Object.assign(T, {
  blade: [0, '#e8d040', '#5a6ad0', '#f0ece0'].map((fl, k) => PS1.mip(tex(16, 16, (q, w, h, r) => { for (let i = 0; i < 9; i++) { const x = (i * 1.8 + r() * 1.2) | 0, bh = 7 + (r() * 9 | 0); q.fillStyle = ['#5e8228', '#7a9a34', '#a8a050', '#4a6e20', '#8eaa3e'][i % 5]; q.fillRect(x, h - bh, 2, bh); q.fillRect(x + (r() < .5 ? -1 : 1), h - bh + 2, 1, 2); }
    if (fl) for (let i = 0; i < 4; i++) { const x = 1 + (r() * 13 | 0), y = 1 + (r() * 6 | 0); q.fillStyle = fl; q.fillRect(x, y, 2, 2); q.fillStyle = k === 1 ? '#b07020' : '#f0e8a0'; q.fillRect(x, y, 1, 1); } }, 40 + k))),
  gravel: PS1.mip(tex(16, 16, (q, w, h, r) => { q.fillStyle = '#8a7a5e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5e5444', 90, .9); noise(q, w, h, r, '#b8a888', 60, .8); })),
  crack: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#221e1a'; let x = 1, y = 8; for (let i = 0; i < 15; i++) { q.fillRect(x, y, 1, 1); x++; y += r() < .5 ? -1 : r() < .5 ? 1 : 0; if (r() < .15) q.fillRect(x, y + 1, 1, 2); } }),
  patch: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#34302c'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#24201c', 20, .8); }),
  hide: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#7a4a2a'; q.fillRect(0, 0, w, h); q.fillStyle = '#e2d8c4'; q.fillRect(1, 2, 3, 2); q.fillRect(5, 5, 2, 2); noise(q, w, h, r, '#4a2a18', 10, .6); }),
  straw: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#c8a858'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#9a7a3a', 24, .8); noise(q, w, h, r, '#e8d088', 12, .7); }),
  leaf: tex(8, 8, (q, w, h, r) => { q.fillStyle = '#5a6a2a'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#3a4a1a', 24, .9); noise(q, w, h, r, '#8a9a44', 12, .8); }),
  cloud: tex(32, 12, (q, w, h, r) => { q.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { const cw = 6 + (r() * 10 | 0), ch = 3 + (r() * 4 | 0); q.fillRect(3 + (r() * (w - 6 - cw) | 0), h - 2 - ch - (r() * 3 | 0), cw, ch); } q.fillRect(4, h - 4, w - 8, 3); }),
  streak: tex(16, 16, (q, w) => { q.fillStyle = '#ffffff'; for (let i = 2; i < 12; i++) q.fillRect(i, 15 - i, 1, 1); }),
  sheet: PS1.color('#e8e2d2'), shirt: PS1.color('#5a74a8'), feather: PS1.color('#ece6da'), chick: PS1.color('#f0ece4'), comb: PS1.color('#c42a1a'),
  signRust: tex(16, 16, (q, w, h, r) => { q.fillStyle = '#9a5a2e'; q.fillRect(0, 0, w, h); noise(q, w, h, r, '#5a3018', 70, .9); q.fillStyle = '#e8dcc0'; q.fillRect(2, 4, 12, 2); q.fillRect(3, 8, 10, 2); noise(q, w, h, r, '#7a3a1a', 30, .9); }) });
{ const q = T.paper.canvas.getContext('2d'), r = rng(77); for (let i = 0; i < 6; i++) { q.globalAlpha = .35; q.fillStyle = '#1a120a'; q.fillRect(r() * 16 | 0, 0, 1, 3 + (r() * 9 | 0)); } q.globalAlpha = .3; q.fillRect(0, 13, 16, 3); q.globalAlpha = 1; T.paper.needsUpdate = true; }   // grime: drips from the ceiling, dirt at the skirting
const clumpGeo = (() => { const P = [], UV = []; for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(.9, .62).toNonIndexed(); g.translate(0, .31, 0); g.rotateY(k * Math.PI / 3); P.push(...g.attributes.position.array); UV.push(...g.attributes.uv.array); }
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); G.setAttribute('normal', new THREE.Float32BufferAttribute(P.map((_, i) => i % 3 === 1 ? 1 : 0), 3)); return G; })();   // lit like the ground
const gust = (x, z, t) => .5 + .5 * Math.sin(t * 1.15 - x * .13 - z * .09);   // a wind wave rolling across the field
// a field of dry grass clumps (some flowering: yellow, bluebonnet, white) wherever keep(x, z) allows; returns an fx that sways them
function field(parent, n, seed, [x0, x1, z0, z1], keep) { const r = rng(seed), mats = T.blade.map(b => M(b, DS)), L = [];
  for (let i = 0, k = 0; i < n && k < n * 10; k++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (!keep(x, z, r)) continue; i++;
    const c = add(clumpGeo, mats[r() < .14 ? 1 + (r() * 3 | 0) : 0], x, 0, z, parent), s = .8 + r() * .9; c.scale.set(s, s * (.75 + r() * .5), s); c.rotation.order = 'ZXY'; c.rotation.y = r() * 6.28; c.userData.ph = r() * 6.28; L.push(c); }
  return t => { for (const c of L) { const g = gust(c.position.x, c.position.z, t); c.rotation.z = -(.06 + .16 * g) + .05 * Math.sin(t * 2.3 + c.userData.ph) * (.4 + g); c.rotation.x = .05 * g * Math.sin(t * 1.7 + c.userData.ph * 1.3); } }; }
// gravel shoulders and cracks/patches on a road (same call shape as road())
function roadWear(x, z, len, along, parent, seed) { const r = rng(seed), gm = offset(M(T.gravel), -1), cm = offset(M(T.crack, DS), -2), pm = offset(M(T.patch), -2);
  for (const s of [-1, 1]) ground(along === 'z' ? .8 : len, along === 'z' ? len : .8, gm, along === 'z' ? x + s * 3.6 : x, .025, along === 'z' ? z : z + s * 3.6, parent);
  for (let i = 0; i < len / 5; i++) { const a = (r() - .5) * len, b = (r() - .5) * 5.2, px = along === 'z' ? x + b : x + a, pz = along === 'z' ? z + a : z + b;
    const m = ground(r() < .25 ? 1.2 + r() : .9 + r() * .8, r() < .25 ? .9 + r() : .9 + r() * .8, r() < .25 ? pm : cm, px, .058, pz, parent); m.rotation.z = r() * 6.28; } }
function wireSpan(a, b, parent, sag, mat, n = 6) { const p = u => a.clone().lerp(b, u).add(V(0, -sag * 4 * u * (1 - u), 0));
  for (let k = 0; k < n; k++) { const A = p(k / n), B = p((k + 1) / n), m = add(box(.025, .025, A.distanceTo(B)), mat, 0, 0, 0, parent); m.position.copy(A).lerp(B, .5); m.lookAt(B); } }
// two sagging wires along a line of poles (crossarm along x for a z-road, along z for an x-road)
function poleWires(pts, along, parent) { const mat = M(T.tyre); for (let i = 0; i + 1 < pts.length; i++) for (const s of [-.65, .65]) { const o = along === 'z' ? V(s, 0, 0) : V(0, 0, s); wireSpan(pts[i].clone().add(o), pts[i + 1].clone().add(o), parent, .55, mat); } }
function pole2(x, z, parent) { add(box(.2, 7, .2), M(T.wood), x, 3.5, z, parent); add(box(.12, .12, 1.6), M(T.wood), x, 6.6, z, parent); }
// barbed wire fence: posts, two sagging strands, little barbs
function barbFence(xA, xB, z, parent) { const pm = M(T.wood), wm = M(T.tyre); for (let x = xA; x <= xB + .01; x += 3) { const p = add(box(.09, 1.15, .09), pm, x, .55, z, parent); p.rotation.z = Math.sin(x * 3.1) * .06; }
  for (let x = xA; x + 3 <= xB + .01; x += 3) for (const y of [.62, 1.0]) { wireSpan(V(x, y, z), V(x + 3, y, z), parent, .07, wm, 3); for (const u of [.33, .66]) add(box(.05, .05, .02), wm, x + 3 * u, y - .07 * 4 * u * (1 - u), z, parent).rotation.z = .8; } }
function windmill(x, z, ry, parent, fx) { const G = grp(x, 0, z, parent), R = M(T.rust), W = M(T.tin), h = 7; G.rotation.y = ry;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(box(.08, h, .08), R, sx * .34, h / 2, sz * .34, G); l.rotation.set(-sz * .06, 0, sx * .06); }
  for (let k = 1; k < 4; k++) { const wd = .68 - k * .21 * (h / 7) * .5; for (const s of [-1, 1]) { add(box(wd * 2, .05, .05), R, 0, h * k / 4, s * (.34 - k * .1), G); add(box(.05, .05, wd * 2), R, s * (.34 - k * .1), h * k / 4, 0, G); } }
  add(box(.5, .06, .5), R, 0, h, 0, G); const hub = grp(0, h + .2, 0, G); add(box(.16, .16, .5), W, 0, 0, 0, hub); add(box(.04, .55, 1.0), W, 0, .05, -.85, hub);
  const rot = grp(0, 0, .3, hub); add(box(.12, .12, .1), W, 0, 0, 0, rot); for (let i = 0; i < 12; i++) { const arm = grp(0, 0, 0, rot); arm.rotation.z = i * Math.PI / 6; const b = add(box(.17, .85, .02), W, 0, .62, 0, arm); b.rotation.y = .45; }
  fx.push(t => { rot.rotation.z = -t * 1.4; hub.rotation.y = Math.sin(t * .3) * .08; }); }
function cow(x, z, ry, parent, fx, ph) { const G = grp(x, 0, z, parent), B = M(T.hide); G.rotation.y = ry; add(box(.6, .55, 1.3), B, 0, .98, 0, G);
  for (const [lx, lz] of [[-.2, .5], [.2, .5], [-.2, -.5], [.2, -.5]]) add(box(.12, .72, .12), B, lx, .36, lz, G);
  const hd = grp(0, 1.08, .66, G); add(box(.3, .3, .46), B, 0, -.02, .22, hd); add(box(.7, .05, .05), M(T.bone), 0, .14, .06, hd); const tl = grp(0, 1.2, -.66, G); add(box(.04, .6, .04), M(T.tyre), 0, -.3, 0, tl);
  fx.push(t => { hd.rotation.x = .75 + Math.sin(t * 1.1 + ph) * .12 + (Math.sin(t * .37 + ph) > .8 ? -.6 : 0); tl.rotation.z = Math.sin(t * 2.6 + ph) * .3; }); }
function bale(x, z, ry, parent) { const b = add(cyl(.7, .7, 1.2, 10), M(T.straw), x, .7, z, parent); b.rotation.set(0, ry, Math.PI / 2); }
function liveTree(x, z, h, parent, fx, seed) { const r = rng(seed), G = grp(x, 0, z, parent), top = grp(0, h * .62, 0, G), lm = M(T.leaf); add(cyl(.14, .24, h * .7, 6), M(T.pine), 0, h * .35, 0, G);
  for (let k = 0; k < 6; k++) { const a = k * 1.05 + r(), d = .6 + r() * .9, s = 1.0 + r() * .9, b = add(box(s, s * .55, s), lm, Math.cos(a) * d, .4 + r() * 1.3, Math.sin(a) * d, top); b.rotation.y = r() * 3; b.userData.ph = r() * 6; }
  fx.push(t => { const g = gust(x, z, t); top.rotation.z = -(.015 + .03 * g) + Math.sin(t * 2.1 + seed) * .012; top.rotation.x = Math.sin(t * 1.6 + seed) * .012 * g; top.children.forEach(b => b.rotation.x = Math.sin(t * 3.3 + b.userData.ph) * .05 * g); }); }
// a ring of drifting clouds around a set; tinted toward the sky each frame so they sit in the haze
function clouds(cx, cz, parent, fx, seed, rad = 82) { const r = rng(seed), ring = grp(cx, 0, cz, parent), mats = [];
  for (let i = 0; i < 10; i++) { const a = i * .628 + r() * .3, m = M(T.cloud, { unlit: true, noFog: true, side: THREE.DoubleSide }); mats.push(m); const c = add(new THREE.PlaneGeometry(26 + r() * 14, 9 + r() * 4), m, Math.cos(a) * rad, 24 + r() * 14, Math.sin(a) * rad, ring); c.lookAt(cx, 30, cz); }
  fx.push((t, S) => { ring.rotation.y = t * .006; const sky = S.U.fogColor.value; for (const m of mats) m.uniforms.tint.value.copy(sky).lerp(new THREE.Color('#fff8ec'), .5); }); return ring; }
// a vulture gliding in circles (or a small bird crossing when cross is set)
function bird(parent, fx, c, rad, w, ph, size = 1, flap = 2.2) { const G = grp(0, 0, 0, parent), m = M(T.black); add(box(.14 * size, .08 * size, .5 * size), m, 0, 0, 0, G);
  const wings = [-1, 1].map(s => { const p = grp(0, 0, 0, G); add(box(.9 * size, .03, .28 * size), m, s * .45 * size, 0, 0, p); return p; });
  fx.push(t => { const a = t * w + ph; G.position.set(c.x + Math.cos(a) * rad, c.y + Math.sin(t * .7 + ph) * .6, c.z + Math.sin(a) * rad); G.rotation.set(0, -a + (w > 0 ? 0 : Math.PI), -.25 * Math.sign(w)); wings.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * (.12 + Math.sin(t * flap + ph) * .18)); }); }
function motes(parent, fx, n, [x0, x1, y0, y1, z0, z1], seed, col = '#fff0c0') { const r = rng(seed), m = M(PS1.color(col), { unlit: true }), L = [];
  for (let i = 0; i < n; i++) { const o = add(box(.018, .018, .018), m, 0, -99, 0, parent); o.userData = { b: V(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), z0 + r() * (z1 - z0)), ph: r() * 6.28, s: .25 + r() * .4 }; L.push(o); }
  const G = { visible: true }; fx.push(t => L.forEach(o => { const u = o.userData; o.visible = G.visible; o.position.set(u.b.x + Math.sin(t * u.s + u.ph) * .45 + Math.sin(t * .2) * .3, u.b.y + Math.sin(t * u.s * 1.3 + u.ph * 2) * .3, u.b.z + Math.cos(t * u.s * .8 + u.ph) * .45); })); return G; }
function bugs(parent, fx, p, n = 6) { const m = M(PS1.color('#2a2620'), { unlit: true }), L = [...Array(n)].map(() => add(box(.02, .02, .02), m, 0, -99, 0, parent));
  const G = { visible: true }; fx.push(t => L.forEach((b, i) => { b.visible = G.visible; const a = t * (6 + i * 1.7) + i * 2.1; b.position.set(p.x + Math.cos(a) * (.12 + .06 * Math.sin(t * 3 + i)), p.y + Math.sin(t * (4 + i) + i) * .1, p.z + Math.sin(a * 1.3) * (.12 + .05 * Math.cos(t * 2 + i))); })); return G; }
// a sheet / shirt on the line: hanging strips that flap in the gusts
function laundry(x, y, z, w, h, mat, parent, fx, ph) { const n = 4, L = []; for (let i = 0; i < n; i++) { const p = grp(x - w / 2 + (i + .5) * w / n, y, z, parent); add(box(w / n + .005, h, .01), mat, 0, -h / 2, 0, p); L.push(p); }
  fx.push(t => L.forEach((p, i) => { const g = gust(x, z, t); p.rotation.x = .1 + .3 * g + Math.sin(t * 3.4 + i * .7 + ph) * .1 * (.5 + g); p.rotation.z = Math.sin(t * 2.2 + i + ph) * .03; })); }
function dustTrail(parent, fx, n, state, col = '#c8a878') { const m = M(PS1.color(col), { unlit: true }), L = [...Array(n)].map(() => add(box(.13, .13, .13), m, 0, -99, 0, parent));
  fx.push(t => L.forEach((d, i) => { const cyc = .9, age = (t + i * cyc / n) % cyc, ts = t - age, s = state(ts, t); if (!s) { d.position.y = -99; return; } const side = i % 2 ? 1 : -1, sp = Math.sin(i * 12.9898) * .5;
    d.position.set(s.x + side * (s.half + age * (.4 + sp * .3)), .1 + age * .9 * (1 - age * .45), s.z + age * (.5 + sp)); d.scale.setScalar(.5 + age * 3); d.rotation.set(age * 3, i, age * 2); })); }
function details(S) { const O = S.O, fx = O.fx = { station: [], road: [], farm: [], hall: [], dining: [], dawn: [] }, dk = (x, z, x0, z0, r) => (x - x0) * (x - x0) + (z - z0) * (z - z0) > r * r;
  // ---- the station: weeds past the lot, gravel and cracks, wires out back, a live tree, a vulture, pollen, a tumbleweed, bugs at the tube light
  { const q = O.g.station, F = fx.station; roadWear(0, 9, 120, 'x', q, 5);
    F.push(field(q, 520, 11, [-44, 44, -44, 44], (x, z) => !(z > 5 && z < 13) && !(x > -9.5 && x < 8.5 && z > -12.5 && z < 6.5)));
    const P = [-39, -13, 13, 39].map(x => V(x, 6.6, -19)); P.forEach(p => pole2(p.x, p.z, q)); poleWires(P, 'x', q); liveTree(14, -22, 6, q, F, 3); liveTree(-17, -21, 5.5, q, F, 4);
    clouds(0, -10, q, F, 21); bird(q, F, V(4, 21, -30), 9, .35, 1); const mo = motes(q, F, 30, [3.6, 9, .8, 2.6, -11, -2], 31); bugs(q, F, V(0, 2.82, -8), 6);
    const tw = grp(0, 0, 0, q); for (let k = 0; k < 5; k++) { const b = add(new THREE.IcosahedronGeometry(.32, 0), M(T.pine, DS), 0, 0, 0, tw); b.rotation.set(k, k * 2, k * 3); b.scale.setScalar(.8 + k * .07); }
    F.push(t => { const night = t > st('L5') && t < S.cutBack; mo.visible = !night; const u = clamp(t / 2.6), x = -16 + 22 * u; tw.visible = t < 2.6; tw.position.set(x, .32 + Math.abs(Math.sin(t * 5)) * .25, 1.5); tw.rotation.set(0, 0, -x / .32); }); }
  // ---- the back road (static detail rides the scrolling scenery group): grass, gravel, cracks, wires, a sagging fence, a windmill, cattle, bales, a sign
  { const q = O.g.road, sc = O.scen, F = fx.road, xr = X.road; roadWear(xr, -40, 320, 'z', sc, 6);
    F.push(field(sc, 1600, 12, [xr - 40, xr + 40, -195, 115], (x, z, r) => Math.abs(x - xr) > 3.95 && r() < Math.exp(-(Math.abs(x - xr) - 3.9) / 20) && dk(x, z, xr + 6.5, zH - 7.5, 1.3) && dk(x, z, xr + 5.4, zH - 4.2, 1.3) && dk(x, z, xr + 5.5, zS + 7, 1.3)));
    const P = []; for (let z = 110; z > -190; z -= 26) P.push(V(xr + 5.8, 6.6, z)); poleWires(P, 'z', sc);
    windmill(xr - 24, -58, .3, sc, F); for (const [cx, cz, ry, ph] of [[xr + 22, -72, .4, 0], [xr + 26, -78, 2.1, 2], [xr + 19, -84, -1.0, 4]]) cow(cx, cz, ry, sc, F, ph);
    bale(xr - 18, -22, .3, sc); bale(xr - 20.5, -26, 1.2, sc); bale(xr + 17, 30, .8, sc); liveTree(xr - 15, -95, 6.5, sc, F, 5); liveTree(xr + 16, -130, 6, sc, F, 6); liveTree(xr - 17, 25, 5.5, sc, F, 7);
    { const sg = grp(xr - 4.3, 0, 6, sc); add(box(.08, 1.9, .08), M(T.wood), 0, .95, 0, sg); const pl = add(box(.7, .5, .03), M(T.signRust), 0, 1.75, .05, sg); pl.rotation.z = .08; }
    clouds(xr, -20, q, F, 22); bird(q, F, V(xr + 9, 22, -40), 10, .3, 0); bird(q, F, V(xr - 6, 26, -20), 14, -.22, 2);
    // the van: a little body roll on the road, dust kicked up behind the rear wheels whenever it is moving and we are outside
    const inside = t => t > at('L3', 'He') - .1 && t < st('L4') - .1, vpos = t => t >= st('L4') - .1 ? vzS(t) : vz(t);
    dustTrail(q, F, 26, (ts, t) => { if (inside(t) || inside(ts)) return null; const a = vpos(ts), b = vpos(ts + .05); if (Math.abs(b - a) < .05) return null; return { x: xr + 1.6, z: a + 1.6, half: .9 }; });
    F.push(t => { const v = O.van, mv = inside(t) ? t > 11 : Math.abs(vpos(t + .05) - vpos(t)) > .03; v.rotation.z = mv ? Math.sin(t * 5.3) * .01 + Math.sin(t * 11.7) * .005 : 0; v.position.y = mv ? Math.abs(Math.sin(t * 7.1)) * .012 : 0; }); }
  // ---- the farm: fields, a barbed-wire fence and poles along the road, a windmill, cattle, bales, trees, the mailbox, laundry, a porch swing, tyres, bugs at the porch light
  { const q = O.g.farm, F = fx.farm, xf = X.farm, hz = -12; roadWear(xf, 18, 120, 'x', q, 7);
    const wr = [[-7, -2], [-10, 4], [7.5, 3], [11, -6], [-6, 9]];
    F.push(field(q, 1400, 13, [xf - 44, xf + 44, -44, 44], (x, z) => { const dx = x - xf; if (z > 13.8 && z < 22.3) return false; if (dx > -5.5 && dx < 8.2 && z > -16.5 && z < -6.2) return false; if (dx > -1.8 && dx < 1.8 && z > -7 && z < 16) return false; if (dx > -1.2 && dx < 6 && z > -1.2 && z < 6.2) return false;
      if (dx > 6.8 && dx < 17.8 && z > -19 && z < 11) return false; if (![[1.2, 11, 2.5], [3.2, -3.5, 1.6], [-1.2, 14, 2.5], [2.5, 17, 2.5], [-3.4, 13.5, 3.4], [-4, 16, 3.4]].every(([cx, cz, cr]) => dk(x, z, xf + cx, cz, cr))) return false; if (dx > -11 && dx < -5.5 && z > -9 && z < -6) return false;
      return wr.every(([wx, wz]) => dk(x, z, xf + wx, wz, 3)); }));
    barbFence(xf - 44, xf - 8, 13.4, q); barbFence(xf + 19, xf + 44, 13.4, q); const P = [-39, -13, 13, 39].map(x => V(xf + x, 6.6, 22.6)); P.forEach(p => pole2(p.x, p.z, q)); poleWires(P, 'x', q);
    windmill(xf - 15, -26, .25, q, F); for (const [cx, cz, ry, ph] of [[xf + 26, -28, .6, 1], [xf + 30, -24, 2.4, 3], [xf + 23, -34, -.8, 5]]) cow(cx, cz, ry, q, F, ph);
    bale(xf - 22, 6, .4, q); bale(xf - 24.5, 9.5, 1.3, q); liveTree(xf - 9.5, -23, 6.5, q, F, 8); liveTree(xf + 17, -28, 6, q, F, 9);
    { const mb = grp(xf - 2.8, 0, 14.0, q); add(box(.08, 1.0, .08), M(T.wood), 0, .5, 0, mb); add(box(.22, .24, .45), M(T.tin), 0, 1.1, 0, mb); add(box(.02, .14, .05), M(T.comb), .12, 1.22, -.12, mb); }
    for (const [lx, lz] of [[-10.2, -7.5], [-6.4, -7.5]]) add(box(.08, 1.9, .08), M(T.wood), xf + lx, .95, lz, q); add(box(3.8, .015, .015), M(T.tyre), xf - 8.3, 1.86, -7.5, q);
    laundry(xf - 9.0, 1.85, -7.5, 1.1, 1.0, M(T.sheet, DS), q, F, 0); laundry(xf - 7.3, 1.85, -7.5, .5, .55, M(T.shirt, DS), q, F, 1.3);
    { const sw = grp(xf - 2.8, 2.66, hz + 4.6, q), cm = M(T.tyre), wm = M(T.boards); for (const s of [-1, 1]) add(box(.02, 2.06, .02), cm, s * .52, -1.03, 0, sw); add(box(1.1, .06, .42), wm, 0, -2.08, 0, sw); add(box(1.1, .4, .05), wm, 0, -1.86, -.2, sw);
      F.push(t => sw.rotation.x = Math.sin(t * 1.25) * .07 * (.6 + .4 * gust(xf, hz, t))); }
    for (const [tx, tz, n] of [[9.5, -1, 3], [-12, 2.5, 2], [10.4, -.2, 1]]) for (let k = 0; k < n; k++) { const ty = add(new THREE.TorusGeometry(.3, .11, 4, 9), M(T.tyre), xf + tx + k * .03, .11 + k * .2, tz, q); ty.rotation.x = Math.PI / 2; }
    const bulb = add(new THREE.SphereGeometry(.05, 5, 4), M(T.bulb, { unlit: true }), xf + 1.0, 2.55, hz + 3.4, q), bz = bugs(q, F, V(xf + 1.0, 2.55, hz + 3.5), 7);
    const cl = clouds(xf, -10, q, F, 23); bird(q, F, V(xf + 5, 21, -25), 9, .3, 2); bird(q, F, V(xf - 4, 25, -30), 12, -.24, 4);
    const mo = motes(q, F, 34, [xf - 6.5, xf - 1.2, .6, 3, -8.3, -3.5], 32);
    F.push((t, S) => { const mode = t < st('L6') ? 0 : t < at('L7', 'others') - .15 ? 1 : t < st('L9') ? 2 : 3; mo.visible = mode === 0 || mode === 3; bz.visible = mode === 1 || mode === 2; bulb.visible = mode === 1 || mode === 2; cl.visible = mode !== 2; }); }
  // ---- the sunrise road: fields, gravel and cracks, wires, a windmill on the skyline, cattle, a bale, trees, a rusty sign, pollen in the low sun, birds
  { const q = O.g.dawn, F = fx.dawn, xw = X.dawn; roadWear(xw, -40, 220, 'z', q, 8);
    F.push(field(q, 1500, 14, [xw - 44, xw + 44, -148, 68], (x, z) => Math.abs(x - xw) > 3.95 && !(x - xw > -4 && x - xw < 11.8 && z > -3.5 && z < 16)));
    const P = []; for (let z = 40; z > -150; z -= 26) P.push(V(xw + 5.8, 6.6, z)); poleWires(P, 'z', q);
    windmill(xw - 20, -64, -.3, q, F); cow(xw - 24, -40, 1.0, q, F, 1); cow(xw - 28, -46, -.4, q, F, 3); bale(xw + 18, -30, .5, q); liveTree(xw - 14, -28, 6, q, F, 10); liveTree(xw + 17, -66, 6.5, q, F, 11);
    { const sg = grp(xw + 4.4, 0, -20, q); add(box(.08, 1.9, .08), M(T.wood), 0, .95, 0, sg); const pl = add(box(.7, .5, .03), M(T.signRust), 0, 1.75, .05, sg); pl.rotation.z = -.1; }
    clouds(xw, -20, q, F, 24); bird(q, F, V(xw + 3, 20, -30), 10, .28, 1); for (let i = 0; i < 4; i++) bird(q, F, V(xw - 30 + i * 1.5, 14 + i * .7, -45 - i * 2), 60, .1, i * .08, .45, 9);
    motes(q, F, 36, [xw - 9, xw - 4.5, .5, 2.6, -8, 8], 33, '#ffe0a8'); }
  // ---- the hall: bones and feathers along the walls, out of everyone's way
  { const q = O.g.hall, xh = X.hall, bm = M(T.bone), fm = M(T.feather, DS), r = rng(55);
    for (const [bx, bz, ry] of [[-1.32, .5, .3], [-1.3, 1.25, 1.2], [-1.34, 2.0, -.4], [1.32, 1.65, .8], [1.3, 2.35, -.2]]) { const b = add(box(.05, .05, .32), bm, xh + bx, .03, bz, q); b.rotation.y = ry; add(box(.08, .07, .07), bm, xh + bx + Math.sin(ry) * .16, .035, bz + Math.cos(ry) * .16, q); }
    for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1, f = add(new THREE.PlaneGeometry(.06, .16), fm, xh + s * (1.15 + r() * .3), .012 + i * .0005, .3 + r() * 2.2, q); f.rotation.set(-Math.PI / 2, 0, r() * 6.28); } }
  // ---- dinner: bones on the table, a chicken in a birdcage in the back corner
  { const q = O.g.dining, F = fx.dining, xd = X.dining, bm = M(T.bone);
    for (const [bx, bz, ry] of [[-.35, -.4, .1], [.38, -.38, -.2]]) { const b = add(box(.3, .035, .035), bm, xd + bx, .81, bz, q); b.rotation.y = ry; } add(box(.1, .09, .11), bm, xd + .12, .835, -.5, q);
    const cg = grp(xd - 2.0, 0, -1.85, q), wm = M(T.chrome); add(box(.06, .9, .06), M(T.wood), 0, .45, 0, cg); add(box(.4, .03, .4), wm, 0, .91, 0, cg); add(box(.4, .03, .4), wm, 0, 1.35, 0, cg);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add(box(.012, .44, .012), wm, Math.cos(a) * .19, 1.13, Math.sin(a) * .19, cg); }
    const ck = grp(0, .93, 0, cg), cm = M(T.chick); add(box(.18, .15, .24), cm, 0, .09, 0, ck); const hd = grp(0, .17, .1, ck); add(box(.08, .09, .08), cm, 0, .05, .02, hd); add(box(.02, .05, .06), M(T.comb), 0, .11, .02, hd); add(box(.03, .02, .04), M(T.straw), 0, .04, .07, hd);
    F.push(t => { const pk = Math.sin(t * 2.7) > .6 ? .7 : 0; hd.rotation.x = pk + Math.sin(t * 9) * .05; ck.rotation.y = Math.sin(t * .8) * .6; }); } }
const flick = (t, s) => 1 - .07 * (.5 + .5 * Math.sin(t * 17.3 + s)) * (.5 + .5 * Math.sin(t * 5.1 + s * 3)) - (Math.sin(t * 2.3 + s) > .985 ? .25 : 0);   // a tired bulb: a slow wobble and the odd dip

// ---------- the episode ----------
CAM.episode(HH.adapt({   // PIPELINE TEST: the cinema camera runs this episode through pipeline.js
  camcorder: false, res: 1.5, letterbox: .06, bloom: .36,   // no REC overlay; the cinematic layer: a crisper 540x960 render, bars, bloom
  open: ['L1', null, .55],   // playbook: motion from the first frames
  hud(t, S, q) {   // the burned-in title card: frames 0–2.4 s, and back on the closed case at the end, so frame 0 = the last frame = the cover
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - S.lidShut - .2) / .3))); if (a <= 0) return;
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round'; const LW2 = 180;
    const txt = (s, y, size, fill, ls = 0) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.letterSpacing = ls + 'px'; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, LW2, y); q.fillStyle = fill; q.fillText(s, LW2, y); };
    txt('GUESS THE HORROR', 112, 30, '#f2f0ea', 1); txt('#1', 156, 44, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 198, 17, '#ffd23a', 1);
    q.translate(LW2, 232); q.rotate(-.06); q.letterSpacing = '2px'; q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.fillStyle = 'rgba(0,0,0,.55)'; q.fillRect(-90, -12, 180, 24); q.strokeStyle = '#e2342a'; q.lineWidth = 2.5; q.strokeRect(-90, -12, 180, 24); q.fillStyle = '#e2342a'; q.fillText('DIFFICULTY: MEDIUM', 0, 1);
    q.restore(); },
  build(S) { const O = S.O = {}, g = O.g = {}; for (const k of Object.keys(X)) g[k] = grp(0, 0, 0);
    // ---- the gas station: cinderblock shop (double-sided, we go inside at night), canopy, two pumps, the picnic table with the case, the road
    { const q = g.station, x0 = X.station, CB = M(T.cinder, DS); ground(90, 90, M(T.dirt), x0, 0, 0, q); road(x0, 9, 120, 'x', q);
      const sz = -6; plane(6.4, 3, CB, x0, 1.5, sz - 4.2, 0, 0, q); for (const s of [-1, 1]) plane(4.2, 3, CB, x0 + s * 3.2, 1.5, sz - 2.1, 0, s * Math.PI / 2, q);
      wallWithDoor(6.4, 3, .9, 2.1, CB, x0 + 1.3, 0, sz, 0, q).position.x = x0 + 0; plane(2.4, 1.2, M(T.glass, DS), x0 - 1.3, 1.6, sz + .02, 0, 0, q);
      plane(.88, 2.08, M(T.black, DS), x0, 1.04, sz - .02, 0, 0, q).visible = false; O.doorDark = q.children[q.children.length - 1];
      plane(6.4, 4.2, M(T.ceil, DS), x0, 3, sz - 2.1, Math.PI / 2, 0, q); add(box(6.9, .14, 4.8), M(T.tin), x0, 3.08, sz - 2.1, q); plane(4.4, .8, M(T.sign, { unlit: true, tint: '#d8ccb0' }), x0, 3.6, sz - .2, 0, 0, q);
      add(box(5.2, .18, 3.4), M(T.cinder), x0, 3.25, sz + 4.2, q); for (const s of [-1, 1]) add(box(.16, 3.2, .16), M(T.cinder), x0 + s * 2.2, 1.6, sz + 4.2, q); add(box(4, .16, .9), M(T.grey), x0, .08, sz + 4.2, q);
      pump(x0 - 1.1, sz + 4.2, T.pumpRed, q); pump(x0 + 1.1, sz + 4.2, T.pumpBlue, q);
      add(box(2.2, .95, .6), M(T.wood), x0 + .9, .475, sz - 1.4, q); add(box(1.8, 1.8, .4), M(T.wood), x0 - 1.8, .9, sz - 3.7, q); ground(6.3, 4.1, M(T.floor), x0, .02, sz - 2.1, q);
      O.stnLight = add(box(1.2, .05, .2), M(T.bulb, { unlit: true }), x0, 2.94, sz - 2, q);
      // the picnic table, the smoker, dead trees, a wire fence
      const px = x0 - 4.6, pz = -2.6; add(box(1.5, .06, .8), M(T.wood), px, .76, pz, q); for (const [dx, dz] of [[-.65, -.32], [.65, -.32], [-.65, .32], [.65, .32]]) add(box(.06, .76, .06), M(T.wood), px + dx, .38, pz + dz, q); for (const s of [-1, 1]) add(box(1.5, .05, .25), M(T.wood), px, .45, pz + s * .62, q);
      add(cyl(.32, .32, .9, 8), M(T.grey), x0 - 6.4, .55, -4.4, q).rotation.z = Math.PI / 2; add(box(.08, .7, .08), M(T.grey), x0 - 6.1, 1.2, -4.4, q);
      for (const [dx, dz, h] of [[-9, -4, 6], [7, -15, 7], [12, -5, 5.5], [-14, -12, 7]]) deadTree(x0 + dx, dz, h, q, dx);
      for (let k = 0; k < 8; k++) add(box(.08, 1.1, .08), M(T.wood), x0 - 6 + k * 2, .55, -14, q); add(box(14, .02, .02), M(T.tyre), x0 + 1, .9, -14, q);
      O.vanS = van(x0 + 4.3, .1); q.add(O.vanS); O.vanS.rotation.y = -Math.PI / 2;
      O.sun0 = add(new THREE.CircleGeometry(4, 12), M(T.sun, { unlit: true, noFog: true }), x0 + 30, 9, -48, q); O.sun0.lookAt(x0, 1, 0);
      O.oldS = person(T.shirt, T.slacks, T.greyHair, 'old'); O.salS = person(T.pink, T.jeans, T.brownHair, 'sallyS', { long: .45 }); O.jerS = person(T.denim, T.jeans, T.darkHair, 'jerry'); for (const p of [O.oldS, O.salS, O.jerS]) q.add(p.G);
      S.case = PS1.dvdCase(COVER.cover, diskTex, px, .792, pz + .1, .12); S.caseCam = [V(px, .792 + .62, pz + .04 + .001), V(px, .792, pz + .04), 40]; }
    // ---- the back road (the scenery group scrolls while we're inside the van), the armadillo, the hitchhiker
    { const q = g.road, x0 = X.road, sc = O.scen = grp(0, 0, 0, q); ground(80, 320, M(T.grass), x0, 0, -40, sc); road(x0, -40, 320, 'z', sc);
      for (let z = 110; z > -190; z -= 26) pole(x0 + 5.8, z, sc); for (let i = 0; i < 12; i++) deadTree(x0 + (i % 2 ? -12 - (i % 3) * 4 : 14 + (i % 4) * 3), 90 - i * 24, 5 + (i % 3), sc, i + 3);
      for (let z = 100; z > -180; z -= 4) add(box(.08, 1.0, .08), M(T.wood), x0 - 9, .5, z, sc); add(box(.02, .02, 280), M(T.tyre), x0 - 9, .8, -40, sc);
      O.dillo = armadillo(x0 - 1.3, -9, sc); if (0) { const d = O.dillo, sh = add(new THREE.SphereGeometry(.15, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), M(T.tin, DS), 0, .12, 0, d); sh.rotation.x = Math.PI; sh.scale.set(.8, .8, 1.6);
        add(box(.2, .02, .4), M(T.pale), 0, .125, 0, d); for (const [lx, lz] of [[-.07, .12], [.07, .12], [-.07, -.12], [.07, -.12]]) add(box(.03, .08, .03), M(T.pale), lx, .17, lz, d); add(box(.06, .05, .1), M(T.pale), 0, .06, .26, d); add(box(.03, .03, .22), M(T.tin), 0, .06, -.3, d); d.rotation.y = .6; }
      O.dust = [...Array(16)].map(() => add(box(.07, .07, .07), M(T.dirt, { unlit: true }), 0, -99, 0, sc)); O.flies = [0, 1, 2].map(() => add(box(.025, .025, .025), M(T.black, { unlit: true }), 0, -99, 0, sc));
      O.sun1 = add(new THREE.CircleGeometry(4, 12), M(T.sun, { unlit: true, noFog: true }), x0 - 26, 10, -60, q); O.sun1.lookAt(x0, 1, -20);
      const v = O.van = van(x0 + 1.6, 40); q.add(v);
      const seat = (p, x, z, ry, sy = .9) => { v.add(p.G); p.G.position.set(x, sy - .8, z); p.G.rotation.y = ry; sit(p); return p; };
      O.jer = seat(person(T.denim, T.jeans, T.darkHair, 'jerry'), -.45, -1.45, Math.PI, .95); O.kir = seat(person(T.tank, T.jeans, T.sandy, 'kirk', { long: .25, bareArms: true }), .45, -1.45, Math.PI, .95);
      O.fra = seat(person(T.redTee, T.jeans, T.darkHair, 'fran'), .6, .2, -Math.PI / 2); O.fra.G.scale.x = 1.15; O.hit = seat(person(T.jacket, T.grey, T.darkHair, 'hitch', { long: .3 }), -.6, .2, Math.PI / 2);
      O.sal = seat(person(T.pink, T.jeans, T.brownHair, 'sally', { long: .45 }), .6, 1.15, -Math.PI / 2); O.pam = seat(person(T.halter, T.shorts, T.blonde, 'pam', { long: .45, bareArms: true }), -.6, 1.15, Math.PI / 2);
      O.hitOut = person(T.jacket, T.grey, T.darkHair, 'hitch', { long: .3 }); q.add(O.hitOut.G);
      O.cam = grp(0, 0, 0, q); add(box(.15, .1, .1), M(T.tyre), 0, 0, 0, O.cam); add(box(.12, .02, .06), M(T.photo), 0, .06, 0, O.cam); O.flashCube = add(box(.04, .03, .02), M(T.photo, { unlit: true }), .05, .05, .05, O.cam);
      O.flame = add(box(.04, .08, .04), M(T.flame, { unlit: true }), 0, -99, 0, q); O.burnPhoto = add(box(.09, .004, .1), M(T.photo), 0, -99, 0, q); O.blood = bloodPool(q); O.razor = add(box(.02, .16, .03), M(T.chrome, { unlit: true }), 0, -99, 0, q); }
    // ---- the farm: the farmhouse, the porch, wrecked cars, the generator, the wheelchair, the side window that bursts
    { const q = g.farm, x0 = X.farm, hz = -12; ground(90, 90, M(T.grass), x0, 0, 0, q); road(x0, 18, 120, 'x', q); ground(4, 26, M(T.dirt), x0, .015, 3, q);
      const H = grp(x0, 0, hz, q); add(rep(box(8, 5.4, 6), 5, 4), M(T.siding), 0, 2.7, 0, H); for (const s of [-1, 1]) { const r = add(rep(box(8.6, .14, 3.8), 4, 2), M(T.tin), 0, 6.15, s * 1.55, H); r.rotation.x = s * .62; }
      { const sh = new THREE.Shape(); sh.moveTo(-3, 0); sh.lineTo(3, 0); sh.lineTo(0, 1.95); sh.lineTo(-3, 0); for (const s of [-1, 1]) { const m = add(new THREE.ShapeGeometry(sh), M(T.siding, DS), s * 4.0, 5.4, 0, H); m.rotation.y = Math.PI / 2; } }
      add(box(8.6, .2, 2.2), M(T.boards), 0, .3, 4.1, H); for (const px of [-4, -1.4, 1.4, 4]) add(box(.14, 2.4, .14), M(T.wood), px, 1.5, 5.1, H); const pr = add(box(8.8, .1, 2.4), M(T.tin), 0, 2.75, 4.1, H); pr.rotation.x = .12;
      for (const [wx, wy] of [[-2.6, 1.6], [2.6, 1.6], [-2.6, 4.2], [0, 4.2], [2.6, 4.2]]) plane(1.0, 1.2, M(wy > 3 && wx === 0 ? T.lit : T.glass, { unlit: wy > 3 && wx === 0 }), wx, wy, 3.02, 0, 0, H); plane(.9, 2.0, M(T.black), 0, 1.4, 3.02, 0, 0, H);
      add(rep(box(3, 3.2, 4), 2, 2), M(T.siding), 5.5, 1.6, -.5, H); add(rep(box(3.4, .14, 4.4), 2, 2), M(T.tin), 5.5, 3.3, -.5, H);
      O.win = V(x0 + 7.03, 1.5, hz - .3); plane(1.0, 1.1, M(T.black), 7.012, 1.5, -.3, 0, Math.PI / 2, H); O.winPane = plane(1.0, 1.1, M(T.glass), 7.035, 1.5, -.3, 0, Math.PI / 2, H);
      for (const [fy, fz, fh, fd] of [[2.08, -.3, .08, 1.16], [.92, -.3, .1, 1.2], [1.5, -.86, 1.1, .08], [1.5, .26, 1.1, .08]]) add(box(.07, fh, fd), M(T.wood), 7.03, fy, fz, H);   // the window frame
      [[-7, -2, .4], [-10, 4, -.3], [7.5, 3, 1.2], [11, -6, .2], [-6, 9, 1.7]].forEach(([dx, dz, r], i) => wreck(x0 + dx, dz, r, M(i % 2 ? T.rust : T.olive), q));
      O.gen = grp(x0 + 4.4, 0, -6.5, q); add(box(.9, .6, .55), M(T.olive), 0, .4, 0, O.gen); add(cyl(.18, .18, .5, 7), M(T.tyre), .5, .3, 0, O.gen).rotation.x = Math.PI / 2; add(box(.08, .35, .08), M(T.tyre), -.3, .85, 0, O.gen);
      for (const [dx, dz] of [[-15, -14], [14, -20], [18, 6], [-18, 10], [-24, -2]]) deadTree(x0 + dx, dz, 8, q, dx);
      O.sun2 = add(new THREE.CircleGeometry(4, 12), M(T.sun, { unlit: true, noFog: true }), x0 - 24, 7, -50, q); O.sun2.lookAt(x0, 1, 10);
      O.kirF = person(T.tank, T.jeans, T.sandy, 'kirk', { long: .25, bareArms: true }); O.pamF = person(T.halter, T.shorts, T.blonde, 'pam', { long: .45, bareArms: true }); O.jerF = person(T.denim, T.jeans, T.darkHair, 'jerry');
      O.salF = person(T.pink, T.jeans, T.brownHair, 'sallyS', { long: .45 }); O.fraF = person(T.redTee, T.jeans, T.darkHair, 'fran'); O.fraF.G.scale.x = 1.15; for (const p of [O.kirF, O.pamF, O.jerF, O.salF, O.fraF]) q.add(p.G);
      O.chair = grp(0, 0, 0, q); O.chairBody = grp(0, 0, 0, O.chair); const CB = O.chairBody; add(box(.44, .04, .42), M(T.tyre), 0, .5, 0, CB); add(box(.44, .42, .03), M(T.tyre), 0, .74, -.21, CB);
      O.wheels = []; O.casters = [];
      for (const s of [-1, 1]) { const hub = grp(s * .27, .3, -.05, CB), w = add(new THREE.TorusGeometry(.29, .025, 3, 10), M(T.tyre), 0, 0, 0, hub); w.rotation.y = Math.PI / 2;
        for (const a of [0, Math.PI / 3, -Math.PI / 3]) { const sp = add(box(.012, .56, .012), M(T.chrome), 0, 0, 0, hub); sp.rotation.x = a; } O.wheels.push(hub);   // three spokes so the roll shows
        add(box(.025, .5, .025), M(T.chrome), s * .23, .75, -.23, CB); add(box(.025, .025, .14), M(T.chrome), s * .23, 1.0, -.29, CB); add(box(.025, .3, .025), M(T.chrome), s * .2, .32, .2, CB);
        const cs = grp(s * .2, .07, .24, CB), cw = grp(0, 0, 0, cs); add(new THREE.TorusGeometry(.06, .016, 3, 8), M(T.tyre), 0, 0, 0, cw).rotation.y = Math.PI / 2; add(box(.01, .1, .01), M(T.chrome), 0, 0, 0, cw); O.casters.push([cs, cw]); }
      O.tracks = [-1, 1].map(() => add(box(.045, .008, 1), M(PS1.color('#2e2416')), 0, -99, 0, q));
      O.drops = [[.62, .9], [.75, 1.1], [.5, 1.25], [.9, .7]].map(([dx, dz]) => add(box(.06, .012, .06), M(PS1.color('#7a0c0c')), x0 + dx, .02, dz, q));
      O.torch = grp(0, 0, 0, q); add(cyl(.03, .04, .22, 6), M(T.tyre), 0, 0, 0, O.torch).rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(.035, 6), M(T.bulb, { unlit: true }), 0, 0, .111, O.torch);
      O.shards = [...Array(24)].map((_, i) => add(box(.06 + (i % 3) * .03, .05 + (i % 4) * .03, .01), M(T.shard, { unlit: true }), 0, -99, 0, q)); }
    // ---- the red hall: wood walls, the red back wall with the steel sliding door, cow skulls, daylight in the front doorway
    { const q = g.hall, x0 = X.hall; const R = room(x0, 0, 3, 5.4, 2.7, T.paper, T.floor, 'back'); q.add(R);
      wallWithDoor(3, 2.7, 1.1, 2.1, M(T.redwall, DS), x0, 0, -2.7, 0, q); plane(1.1, 2.1, M(T.black), x0, 1.05, -2.8, 0, 0, q); add(box(2.6, .06, .06), M(T.tyre), x0 - .6, 2.18, -2.62, q);
      O.slab = add(box(1.18, 2.14, .05), M(T.steel), x0, 1.07, -2.6, q); add(box(.04, .18, .06), M(T.tyre), .48, -.07, .04, O.slab);
      for (const s of [-1, 1]) { add(box(.22, .3, .1), M(T.bone), x0 + s * 1.05, 1.95, -2.62, q); add(box(.44, .05, .05), M(T.bone), x0 + s * 1.05, 2.12, -2.6, q); add(box(.05, .06, .11), M(T.black), x0 + s * 1.05 - .05, 1.98, -2.6, q); add(box(.05, .06, .11), M(T.black), x0 + s * 1.05 + .05, 1.98, -2.6, q); }
      plane(.95, 2.1, M(T.day, { unlit: true }), x0, 1.05, 2.68, 0, Math.PI, q); add(box(.02, .5, .02), M(T.tyre), x0, 2.45, -.6, q); add(new THREE.SphereGeometry(.06, 5, 4), M(T.bulb, { unlit: true }), x0, 2.18, -.6, q);
      O.kirH = person(T.tank, T.jeans, T.sandy, 'kirk', { long: .25, bareArms: true }); q.add(O.kirH.G);
      O.bloodH = bloodPool(q); O.butH = person(T.work, T.slacks, T.shag, 'mask'); O.butH.G.scale.set(1.18, 1.14, 1.18); add(box(.36, .95, .02), M(T.apron), 0, .82, .14, O.butH.G); q.add(O.butH.G); O.ham = hammer(); O.butH.G.add(O.ham); }
    // ---- the dining room: the table, the girl tied in the armchair, the family, the grandpa at the head
    { const q = g.dining, x0 = X.dining; const R = room(x0, 0, 4.8, 4.4, 2.6, T.paper, T.floor, 'front'); q.add(R); O.dWin = plane(1.0, 1.2, M(T.glass), x0 + 1.3, 1.5, -2.17, 0, 0, q); O.dDawn = add(new THREE.PlaneGeometry(1.0, 1.2), M(T.dawnView, { unlit: true }), x0 + 1.3, 1.5, -2.19, q);
      for (const [fy, fx, fw, fh] of [[2.12, 0, 1.12, .06], [.88, 0, 1.12, .08], [1.5, -.56, .06, 1.2], [1.5, .56, .06, 1.2]]) add(box(fw, fh, .06), M(T.wood), x0 + 1.3 + fx, fy, -2.15, q);
      O.dShards = [...Array(22)].map((_, i) => add(box(.06 + (i % 3) * .03, .05 + (i % 4) * .03, .01), M(T.shard, { unlit: true }), 0, -99, 0, q));
      add(box(2.2, .06, 1.0), M(T.wood), x0, .76, -.4, q); for (const [dx, dz] of [[-1, -.85], [1, -.85], [-1, .05], [1, .05]]) add(box(.06, .74, .06), M(T.wood), x0 + dx, .37, dz, q);
      for (const dx of [-.7, 0, .7]) for (const dz of [-.7, -.1]) add(cyl(.11, .11, .015, 8), M(T.photo), x0 + dx, .8, dz, q);
      const ac = grp(x0 + 1.5, 0, -.4, q); ac.rotation.y = -Math.PI / 2; add(box(.8, .45, .75), M(T.halter), 0, .225, 0, ac); add(box(.8, .6, .15), M(T.halter), 0, .75, -.32, ac); for (const s of [-1, 1]) add(box(.12, .25, .75), M(T.halter), s * .4, .55, 0, ac);
      for (const [cx, cz, ry] of [[x0 - 1.5, -.4, Math.PI / 2], [x0 - .35, -1.25, 0]]) { const c = grp(cx, 0, cz, q); c.rotation.y = ry; add(box(.45, .05, .45), M(T.wood), 0, .46, 0, c); add(box(.45, .55, .05), M(T.wood), 0, .75, -.21, c); for (const [lx, lz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) add(box(.04, .46, .04), M(T.wood), lx, .23, lz, c); }
      add(box(.02, .6, .02), M(T.tyre), x0, 2.3, -.4, q); add(new THREE.SphereGeometry(.07, 5, 4), M(T.bulb, { unlit: true }), x0, 1.98, -.4, q);
      O.salD = person(T.pink, T.jeans, T.brownHair, 'sallyS', { long: .45 }); O.grand = person(T.suit, T.suit, T.pale, 'grand', { skin: T.pale }); O.grand.G.scale.setScalar(.92);
      O.hitD = person(T.jacket, T.grey, T.darkHair, 'hitch', { long: .3 }); O.oldD = person(T.shirt, T.slacks, T.greyHair, 'oldG'); O.butD = person(T.suit, T.slacks, T.shag, 'mask'); O.butD.G.scale.set(1.18, 1.14, 1.18);
      for (const p of [O.salD, O.grand, O.hitD, O.oldD, O.butD]) q.add(p.G); O.hamD = hammer(.5); O.grand.G.add(O.hamD); }
    // ---- the sunrise road: the pickup, the field, the sun low on the horizon, the man with the saw
    { const q = g.dawn, x0 = X.dawn; ground(90, 220, M(T.grass), x0, 0, -40, q); road(x0, -40, 220, 'z', q); for (let z = 40; z > -150; z -= 26) pole(x0 + 5.8, z, q);
      for (let i = 0; i < 6; i++) deadTree(x0 + (i % 2 ? -16 : 18), 10 - i * 26, 6, q, i + 40);
      O.sun3 = add(new THREE.CircleGeometry(6, 14), M(T.sun, { unlit: true, noFog: true }), x0, 4.5, -58, q);
      O.pick = pickup(x0 - 1.6, 40); q.add(O.pick); const d = person(T.khaki, T.jeans, T.darkHair, 'drv'); O.pick.add(d.G); d.G.position.set(-.4, .15, -1.0); d.G.rotation.y = Math.PI; sit(d, 'drive');
      O.salR = person(T.pink, T.jeans, T.brownHair, 'sallyS', { long: .45 }); q.add(O.salR.G);
      O.butR = person(T.work, T.slacks, T.shag, 'mask'); O.butR.G.scale.set(1.18, 1.14, 1.18); add(box(.36, .95, .02), M(T.apron), 0, .82, .14, O.butR.G); q.add(O.butR.G); O.saw = chainsaw(); O.butR.G.add(O.saw); }
    details(S);
  },
  prepare(S) { S.hits = [at('L6', 'hammer') + .13, at('L10', 'crashes')]; },
  shots: S => { const w = (l, x, o = 0) => at(l, x) + o, xs = X.station, xr = X.road, xf = X.farm, xh = X.hall, xd = X.dining, xw = X.dawn, wp = S.O.win;
    const vI = (lx, ly, lz) => V(xr + 1.6 + lx, ly, zH + lz);
    // a camera riding in the pickup bed (local offset), always looking at the man in the road; short linear segments follow the pickup, with road bumps
    const ride = (t0, t1, off, f0, f1, blurAmt) => { const out = [], him = V(xw + .3, 1.55, 5.2), at2 = t => V(xw - 1.6 + off.x, off.y + Math.sin(t * 23) * .012 + Math.sin(t * 9) * .01, pickZ(t) + off.z), f = t => lerp(f0, f1, clamp((t - t0) / (t1 - t0)));
      const o = t => ({ focus: Math.max(2, him.distanceTo(at2(t))), blur: blurAmt ? .25 : .18, ease: 'linear' }); out.push([t0, .02, at2(t0), him, f(t0), o(t0)]);
      for (let t = t0 + .02; t < t1; t += .2) { const e = Math.min(t1, t + .2); out.push([t, e - t, at2(e), him, f(e), o(e)]); } return out; };   // a point inside the van (it stands at zH while the world scrolls)
    const tr = (t0, t1, off, look, fov) => [[t0, .02, V(xr + 1.6 + off.x, off.y, vz(t0) + off.z), V(xr + 1.6 + look.x, look.y, vz(t0) + look.z), fov], [t0 + .02, t1 - t0 - .02, V(xr + 1.6 + off.x, off.y, vz(t1) + off.z), V(xr + 1.6 + look.x, look.y, vz(t1) + look.z), fov, { ease: 'linear' }]];
    return [   // [t0, dur, camera, look, fov] — the engine adds a gentle drift
    [0, 1.0, V(xs - 7.5, 1.7, 5.5), V(xs - 1.5, 1.7, -5), 60],                                 // up from the case: the station at golden hour
    [1.0, 1.6, V(xs - 6.6, 1.6, 4.4), V(xs - .5, 1.9, -5.5), 58, { ease: 'linear' }],
    ...tr(st('L2') - .18, w('L2', 'Five', -.1), V(14, 9, 18), V(0, .8, -4), 54),                  // the van from above on the long road
    ...tr(w('L2', 'Five', -.1), w('L2', 'van', -.05), V(3.4, 1.65, -1.0), V(0, 1.55, -1.6), 56),        // alongside: the friends inside
    [w('L2', 'van', -.05), .02, V(xr - 1.05, .36, -10.6), V(xr - 1.55, .18, -6.5), 56, { focus: 1.7, blur: .35 }],
    [w('L2', 'van', .05), 1.8, V(xr - .95, .32, -10.35), V(xr - 1.5, .2, -6), 56, { focus: 1.5, blur: .35, ease: 'linear' }],             // CUT: down on the road by the armadillo (hidden clue) as the van roars past
    [w('L2', 'road', .3), .02, V(xr + 6.5, 1.2, zH - 7.5), V(xr + 2.4, 1.3, zH - .5), 48],      // the hitchhiker on the shoulder, the van pulls up
    [w('L3', 'strange', -.1), 1.1, V(xr + 5.4, 1.4, zH - 4.2), V(xr + 3.3, 1.5, zH - 1.4), 38, { focus: 3.0, blur: .5 }],
    [w('L3', 'He', -.1), .02, vI(0, 1.6, 2.2), vI(-.2, 1.15, .1), 66],                          // CUT: inside the van, from the back doors
    [w('L3', 'snaps', -.25), .02, vI(-.02, 1.58, 2.2), vI(-.55, 1.5, .2), 44, { focus: 2.0, blur: .45 }],                  // the photo
    [w('L3', 'burns', -.2), .02, vI(.08, 1.5, 2.15), vI(-.45, 1.35, .25), 36, { focus: 1.95, blur: .5 }],                  // he burns it
    [w('L3', 'and', -.15), .02, vI(-.05, 1.62, 2.25), vI(0, 1.15, .1), 66],                     // the razor
    [w('L3', 'slashes', .3), .5, vI(-.05, 1.55, 1.8), vI(.25, 1.2, .1), 62],
    [st('L4') - .1, .02, V(xr + 5.5, 1.3, zS + 7), V(xr + 1.4, 1.1, zS + 1.6), 56],              // thrown out on the shoulder
    [w('L4', 'At', -.15), .02, V(xs + .4, 1.5, 3.4), V(xs + 1.8, 1.4, -1.8), 56],               // CUT: the station, the old man at the pumps
    [w('L4', 'old', -.1), .02, V(xs - .1, 1.6, 1.3), V(xs + 1.0, 1.6, -.9), 32, { focus: 2.5, blur: .6 }],
    [w('L4', 'pumps', -.2), .9, V(xs + .2, 1.4, 1.9), V(xs + 1.1, 1.2, -1.8), 44],
    [st('L5') - .1, .02, V(xf + 2.5, 1.4, 17), V(xf, 1.6, 4), 60],                                // CUT: the farm, two of them walk up past the wrecks
    [w('L5', 'farmhouse', -.2), 1.4, V(xf + 1.2, 1.3, 11), V(xf, 2.8, -10), 60, { ease: 'linear' }],
    [w('L5', 'hoping', -.15), .02, V(xf + 3.2, 1.5, -3.5), V(xf + .4, 1.5, -7.5), 50],
    [st('L6') - .1, .02, V(xh + .45, 1.6, 2.55), V(xh, 1.3, -2.7), 64],                             // CUT: inside, the red wall, the steel door
    [w('L6', 'steel', -.15), .02, V(xh + .5, 1.3, .4), V(xh, 1.15, -2.7), 44, { focus: 3.1, blur: .3 }],
    [w('L6', 'slides', -.1), 1.2, V(xh + 1.2, 1.35, -.2), V(xh + .05, 1.15, -2.7), 52, { ease: 'linear' }],
    [w('L6', 'huge', -.15), .02, V(xh + 1.0, .55, -1.05), V(xh, 1.95, -2.45), 66, { focus: 1.9, blur: .2 }],                 // low from the right (he is on the left): the huge man in the doorway
    [w('L6', 'man', -.02), .02, V(xh + .3, 1.72, -1.45), V(xh, 1.8, -2.4), 42, { focus: 1.0, blur: .55 }],                    // the mask, face to face
    [w('L6', 'swings', -.2), .02, V(xh + 1.1, .9, -1.0), V(xh, 2.0, -2.3), 72],                  // the hammer
    [w('L6', 'hammer', .5), .02, V(xh + .2, 1.5, 1.8), V(xh, 1.1, -2.7), 58],                    // the door slams shut
    [st('L7') - .1, .02, V(xf - 4, 1.0, 16), V(xf, 2.4, -10), 56],                                // CUT: dusk, one walks up
    [st('L7') + .1, 1.4, V(xf - 3.4, 1.0, 13.5), V(xf, 2.4, -10), 56, { ease: 'linear' }],
    [w('L7', 'others', -.15), .02, V(xf + 4.9, 1.0, 1.9), V(xf + 1.6, .7, 3.4), 50, { focus: 3.4, blur: .2 }],                  // from the side: the chair rolls, bumps, leaves tracks
    [w('L7', 'others', .05), 2.0, V(xf + 4.1, .95, .1), V(xf + .9, .7, 1.8), 50, { focus: 3.4, blur: .2, ease: 'linear' }],             // night: the wheelchair, the flashlight
    [w('L7', 'never', -.15), .02, V(xf + 1.3, .55, 3.0), V(xf + .4, .45, .6), 44, { focus: 2.4, blur: .55 }],               // …empty
    [w('L7', 'come', 0), 1.2, V(xf + 1.0, .7, 3.6), V(xf + .4, .45, .6), 44, { focus: 3, blur: .55, ease: 'linear' }],
    [st('L8') - .1, .02, V(xf - 1.2, 1.1, 14), V(xf, 1.3, 2), 44],                                // she runs
    [w('L8', 'station', -.2), .02, V(xs, 1.6, -2.6), V(xs + .2, 1.5, -8), 64],                                               // CUT: her eyes, running in through the screen door
    [w('L8', 'station', -.18), .72, V(xs + .05, 1.6, -6.15), V(xs + .5, 1.5, -8), 62, { ease: 'linear' }],
    [w('L8', 'station', .54), .4, V(xs + .7, 1.6, -6.7), V(xs + .7, 1.55, -8), 56, { focus: 1.4, blur: .2 }],                  // at the counter: he comes over
    [w('L8', 'help', -.1), .8, V(xs + .7, 1.58, -6.75), V(xs + .7, 1.6, -7.95), 50, { focus: 1.2, blur: .3 }],                 // she explains
    [w('L8', 'But', -.1), 1.0, V(xs + .7, 1.58, -6.8), V(xs + .7, 1.62, -7.95), 40, { focus: 1.15, blur: .45, ease: 'linear' }],// …the smile
    [w('L8', 'one', -.35), .02, V(xs + .75, 1.5, -6.4), V(xs + .7, 1.55, -7.4), 54, { focus: .8, blur: .3 }],                  // he jumps her: into the lens, then BOOM
    [st('L9') - .1, .02, V(xd + 1.38, 1.27, -.4), V(xd - 1.4, 1.1, -.45), 62, { focus: 3, blur: .9 }],                    // CUT: her eyes open: blurry
    [st('L9') + .45, .5, V(xd + 1.38, 1.27, -.4), V(xd - 1.4, 1.12, -.45), 60, { focus: 2.8, blur: .2 }],                    // …it sharpens
    [w('L9', 'tied', -.1), .8, V(xd + 1.36, 1.28, -.45), V(xd + .35, 1.95, -1.75), 62, { focus: 1.5, blur: .2 }],           // she looks around: the masked man standing over her
    [w('L9', 'their', -.1), .9, V(xd + 1.36, 1.28, -.45), V(xd - .65, 1.5, -1.5), 58, { focus: 2.1, blur: .2 }],            // …the old man, the hitchhiker
    [w('L9', 'dinner', .15), 1.3, V(xd + 1.38, 1.27, -.4), V(xd - 1.45, 1.12, -.42), 52, { focus: 2.9, blur: .25 }],        // …down the table
    [w('L9', 'grandpa', -.1), 1.0, V(xd + 1.2, 1.25, -.41), V(xd - 1.45, 1.12, -.42), 30, { focus: 2.6, blur: .3 }],        // …Grandpa, at the head of it
    [w('L9', 'barely', -.05), .02, V(xd + .5, 1.3, -.1), V(xd + 1.45, 1.15, -.42), 48, { focus: 1.0, blur: .5 }],           // CUT: third person: she shakes her head, freaking out
    [en('L9') + .15, .02, V(xd + .15, 1.05, .6), V(xd + 1.45, 1.25, -.7), 58, { focus: 1.5, blur: .2 }],                   // she jumps up out of the chair
    [st('L10') - .05, .02, V(xd + 1.45, 1.6, -.45), V(xd + 1.3, 1.45, -2.2), 70, { focus: 1.8, blur: .1 }],               // CUT: her eyes: running at the window
    [st('L10'), w('L10', 'crashes', -.2) - st('L10'), V(xd + 1.32, 1.56, -1.5), V(xd + 1.3, 1.5, -2.3), 66, { focus: .8, blur: .1, ease: 'linear' }],
    [w('L10', 'crashes', -.2), .25, V(xd + 1.3, 1.48, -1.98), V(xd + 1.3, 1.4, -3.6), 70, { ease: 'linear' }],             // through the glass
    [w('L10', 'crashes', .05), .02, V(wp.x + 5.2, 1.2, wp.z + 4.2), V(wp.x + .6, 1.35, wp.z), 54, { focus: 6.6, blur: .2 }],         // CUT: sunrise, the side window bursts
    [w('L10', 'runs', -.25), .02, V(xf + 12.6, 1.5, -15.5), V(xf + 15, 1.6, 6), 52, { focus: 5, blur: .2 }],                     // behind her: running for the sunrise
    [w('L10', 'runs', -.2), 1.4, V(xf + 13.2, 1.5, -12.5), V(xf + 15.5, 1.6, 8), 52, { focus: 5, blur: .2, ease: 'linear' }],
    [st('L11') - .1, .02, V(xw + 3, 1.4, 11), V(xw + 4, 1.0, 0), 66],                              // CUT: the road, the pickup coming
    [w('L11', 'pickup', -.2), .02, V(xw + 2.6, 1.6, 4.4), V(xw - 1.4, 1.1, -.4), 48],
    ...ride(w('L11', 'while', -.15), en('L11') - .05, V(.32, 1.78, .75), 50, 46, .8),                                       // over her shoulder in the bed: he is back there in the road
    ...ride(en('L11') - .05, S.cutBack - .02, V(.02, 1.5, 1.5), 36, 15, 0)                                                   // her POV, looking back: he spins with the roaring saw at sunrise
  ]; },
  wob: (t, S) => { const cuts = sched(S).map(r => r[1]).slice(1); return Math.max(...cuts.map(c => t > c - .06 && t < c + .1 ? 1 : 0)); },
  flash: t => { const f = (c, d, k) => { const u = t - c; return u > 0 && u < d ? (1 - u / d) * k : 0; }; return Math.max(f(at('L3', 'snaps') + .05, .18, .8), f(at('L10', 'crashes') - .02, .2, .75)); },
  shake: (t, S) => { const a = at('L8', 'station', -.2), b = at('L8', 'one', -.1), r0 = st('L10') - .05, r1 = at('L10', 'crashes', .05); return t > a && t < b ? .004 + (t < a + 1.1 ? .006 : 0) : t > r0 && t < r1 ? .009 : 0; },
  fade: (t, S) => { const h = at('L6', 'hammer') + .13, g = at('L8', 'one') + .12; return Math.min(t < h ? 1 : t < h + .3 ? 0 : clamp((t - h - .3) / .2), t < g ? 1 : t < st('L9') - .12 ? clamp(1 - (t - g) / .06) : t < st('L9') + .9 ? clamp((t - st('L9') + .12) / .5) * (Math.abs(t - st('L9') - .35) < .07 ? .15 : 1) : 1); },
  update(t, S) { const O = S.O, w = (l, x, o = 0) => at(l, x) + o, cur = where(t, S), r = rng(Math.floor(t * 12)); for (const k of Object.keys(X)) O.g[k].visible = k === cur;
    const L = (amb, fog, near, far, l1, l2, l3) => { S.U.amb.value.setRGB(...amb); S.U.fogColor.value.set(fog); S.U.fogNear.value = near; S.U.fogFar.value = far; PS1.light(1, ...(l1 || [[0, -50, 0], [0, 0, 0]])); PS1.light(2, ...(l2 || [[0, -50, 0], [0, 0, 0]])); PS1.light(3, ...(l3 || [[0, -50, 0], [0, 0, 0]])); };
    const SUN = [1.5, 1.2, .8], wpos = o => o.getWorldPosition(new THREE.Vector3());
    // ---- the station: golden day (the case, the old man at the pumps) or night (L8)
    if (cur === 'station') { const night = t > st('L5') && t < S.cutBack, xs = X.station, l4 = t > st('L4') && t < st('L5'); O.sun0.visible = !night; O.stnLight.visible = night; O.vanS.visible = l4; O.jerS.G.visible = l4; O.salS.G.visible = night; S.grade = night ? GR.stnNight : t < 1.6 ? PS1.mixGrade(PS1.GRADES.neutral, GR.day, clamp((t - .5) / 1.0)) : t >= S.cutBack ? PS1.GRADES.neutral : GR.day; if (!night) S.flares.push({ pos: wpos(O.sun0), color: '#ffd890', size: 30, streak: .7 });
      if (!night) { const p = O.oldS; if (l4) { p.G.position.set(xs + 1.0, 0, -.85); p.G.rotation.y = .5; stand(p); if (t > w('L4', 'says', -.1) && t < w('L4', 'empty', .3)) p.pose(ARM.down(-1), [V(.24, 1.36, 0), V(.36, 1.5, .1), V(.3 + Math.sin(t * 14) * .08, 1.8, .14)]); }
        else { p.G.position.set(xs + 2.0, 0, -5.4); p.G.rotation.y = 0; stand(p); } p.setFace('old'); O.jerS.G.position.set(xs + 1.55, 0, .75); O.jerS.G.rotation.y = Math.PI + .7; stand(O.jerS);
        L([.48, .42, .34], '#d0a272', 10, 50, [[xs - 30, 20, 30], SUN, 90], [[xs + 1, 2.4, -1.8], [.4, .36, .3], 8]); }
      else { const tIn = w('L8', 'station', -.2), tGrab = w('L8', 'one', -.1), tC = tIn + 1.0, p = O.oldS; O.salS.G.visible = false;   // all from her eyes
        // he comes from the back of the shop to the counter (around the cooler), then the pantomime: head tilt, hands open ("what's wrong?"), the smile, the jump
        if (t < tC) { walker(p, t, [[tIn, V(xs + 1.2, 0, -9.2)], [tC, V(xs + .7, 0, -7.95)]], 1.8); p.setFace('old'); }
        else { const lg = eio(clamp((t - tGrab + .25) / .35)); p.G.position.set(xs + .7, .1 * lg, -7.95 + .45 * lg); p.G.rotation.set(.38 * lg, 0, 0); stand(p);
          const open = [[V(-.24, 1.36, 0), V(-.38, 1.18, .16), V(-.4, 1.22, .38)], [V(.24, 1.36, 0), V(.38, 1.18, .16), V(.4, 1.22, .38)]], low = [ARM.down(-1), ARM.down(1)], grab = [ARM.reach(-1), ARM.reach(1)];
          p.pose(...PS1.keys(t, [[tC, low], [tC + .15, open], [w('L8', 'But', -.1), low], [tGrab - .25, grab]], .3)); p.head.rotation.z = t < w('L8', 'But') ? Math.sin(clamp((t - tC) / .4) * Math.PI / 2) * .22 : 0;
          p.setFace(t > w('L8', 'But') ? 'oldG' : 'old'); }
        L([.16, .16, .22], '#06080e', 4, 22, [[xs, 2.8, -8], [1.3, 1.2, .85], 7], [[xs, 3.0, -1.8], [.6, .6, .5], 8]); } }
    // ---- the back road and the van
    if (cur === 'road') { const xr = X.road, inside = t > at('L3', 'He') - .1 && t < st('L4') - .1, outL4 = t >= st('L4') - .1, v = O.van; S.grade = GR.day; if (!inside) S.flares.push({ pos: wpos(O.sun1), color: '#ffd890', size: 30, streak: .7 });
      O.scen.position.z = inside ? scroll(t) : 0; v.position.set(xr + 1.6, 0, outL4 ? vzS(t) : inside ? zH : vz(t)); const roll = (inside ? scroll(t) : -v.position.z) / .36; for (const wh of v.userData.wheels) wh.rotation.x = -roll;
      const dk = outL4 ? clamp(Math.min((t - w('L4', 'throw', -.2)) / .3, 1 - (t - w('L4', 'out', .2)) / .3)) : 0; v.userData.doors.forEach((d, i) => d.rotation.y = (i ? -1 : 1) * 1.9 * dk);
      { const D = O.dillo, tp = 8.04, u = t - tp, rock = u > 0 && u < 1.6 ? Math.sin(u * 22) * .35 * Math.exp(-u * 2.5) : 0, tq = Math.floor(t * 10) / 10;   // the van passes it at ~8.0 s
        D.rotation.x = rock; D.userData.legs.forEach((L, i) => L.rotation.x = Math.sin(tq * (9 + i * 2.3) + i) * (.35 + (u > 0 && u < 1.2 ? .5 : 0)));
        O.dust.forEach((d, i) => { const a = i * 2.39, k = u - (i % 4) * .03; if (k < 0 || k > 1.2) { d.position.y = -99; return; } d.position.set(D.position.x + Math.cos(a) * (.2 + k * 1.4), .05 + k * (1.4 - k) * .9, D.position.z + Math.sin(a) * (.2 + k * 1.4) + k * 1.5); d.scale.setScalar(1 + k * 2); });
        O.flies.forEach((f, i) => { const a = t * (5 + i) + i * 2; f.position.set(D.position.x + Math.cos(a) * .25, .3 + Math.sin(t * 7 + i) * .08, D.position.z + Math.sin(a) * .25); }); }
      // PIPELINE TEST FIX: the hitchhiker rides in the van only after they pick him up (before, a copy sat inside while he stood on the shoulder)
      const H = O.hit; H.G.visible = !outL4 && t >= at('L3', 'He') - .1; O.hitOut.G.visible = t < at('L3', 'He') - .1 || outL4;
      if (t < at('L3', 'He') - .1) { const p = O.hitOut; p.G.position.set(xr + 3.4, 0, zH - 1.3); p.G.rotation.y = -Math.PI / 2 + .6; stand(p); p.pose(ARM.down(-1), [V(.24, 1.36, 0), V(.5, 1.3, .1), V(.74, 1.32, .18)]); }
      if (outL4) { const t0 = w('L4', 'throw', -.05), p = O.hitOut, k = clamp((t - t0) / .4); p.G.position.copy(path(t, [[t0, V(xr + 1.6, .45, zS + 2.6)], [t0 + .4, V(xr + 1.8, 0, zS + 3.7)], [t0 + 1.0, V(xr + 2.0, 0, zS + 4.0)]])); p.G.rotation.set(.5 * (1 - k) * (t > t0 ? 1 : 0), Math.PI, 0); stand(p);
        if (t > t0 + 1.1) p.pose(ARM.down(-1), ARM.up(1)); }
      const tSnap = w('L3', 'snaps'), tBurn = w('L3', 'burns', -.1), tSl = w('L3', 'slashes', .05), head = wpos(H.head);
      O.cam.visible = t > tSnap - .5 && t < tBurn - .1; O.cam.position.copy(head).add(V(.2, -.04 - .25 * clamp((tSnap - .2 - t) / .3), 0)); O.cam.rotation.set(0, Math.PI / 2, 0); O.flashCube.visible = t > tSnap && t < tSnap + .15;
      if (t > tSnap - .5 && t < tBurn + 1.1) H.pose([V(-.24, 1.36, 0), V(-.26, 1.3, .25), V(-.06, 1.42, .38)], [V(.24, 1.36, 0), V(.26, 1.3, .25), V(.06, 1.42, .38)]); else sit(H);
      const burning = t > tBurn && t < tBurn + 1.1, bp = head.clone().add(V(.28, -.42, 0)); O.flame.position.copy(burning ? bp.clone().add(V(.02, .07 + Math.sin(t * 40) * .01, 0)) : V(0, -99, 0)); O.flame.scale.setScalar(1 + Math.sin(t * 33) * .3);
      O.burnPhoto.position.copy(burning ? bp : V(0, -99, 0)); O.burnPhoto.scale.set(1, 1, clamp(1 - (t - tBurn) / 1.1) + .05);
      const rk = eio(clamp((t - tSl + .12) / .22)), rv = t > tSl - .6 && t < tSl + .9; O.razor.position.copy(rv ? wpos(H.armR.hand).lerp(wpos(O.fra.torso).add(V(-.12, .1, 0)), rk * (1 - clamp((t - tSl - .3) / .3))) : V(0, -99, 0)); O.razor.rotation.set(0, 0, -1.4 + rk * 2.2);
      { const tb = tSl + .05; hurt(O.fra, hitK(t, tb)); bleed(O.blood, t, tb, wpos(O.fra.torso).add(V(-.18, .18, 0)), V(-.3, 0, 0)); }
      sit(O.fra); O.fra.head.rotation.z = -.35 * clamp((t - tSl) / .12) * (1 - clamp((t - tSl - .8) / .4)); O.fra.setFace(t > tSl ? 'sallyS' : 'fran'); O.fra.faceMat.uniforms.map.value = O.fra.faces[t > tSl ? 'fran' : 'fran'] || O.fra.faceMat.uniforms.map.value;
      O.sal.setFace(t > tSl ? 'sallyS' : 'sally'); O.pam.setFace('pam'); sit(O.jer, 'drive');
      const lf = burning ? [bp.toArray(), [1.6, .9, .4], 2.5] : [[xr + 1.6, 1.85, zH + .9], [.95, .82, .62], 3.2];
      L(inside ? [.28, .25, .22] : [.48, .42, .34], '#d0a272', 12, 60, [[xr - 30, 25, -50], SUN, 120], inside ? lf : null, inside && t > tSnap && t < tSnap + .16 ? [O.cam.position.toArray(), [3, 3, 2.6], 4] : null); }
    // ---- the farm: golden (L5) · dusk (L7) · night (L7, L8) · dawn (L10)
    if (cur === 'farm') { const xf = X.farm, mode = t < st('L6') ? 0 : t < w('L7', 'others', -.15) ? 1 : t < st('L9') ? 2 : 3; O.gen.position.y = Math.abs(Math.sin(t * 47)) * .008; O.sun2.visible = mode === 0 || mode === 3; S.grade = [GR.day, GR.dusk, GR.night, GR.dawn][mode];
      for (const p of [O.kirF, O.pamF, O.jerF, O.salF, O.fraF]) p.G.visible = false; O.chair.visible = false; O.torch.visible = false; O.tracks.forEach(tr => tr.position.y = -99); O.drops.forEach(d => d.visible = mode === 2 && t >= w('L7', 'never', -.15) && t < st('L8') - .1); O.shards.forEach(s => s.position.y = -99); O.winPane.visible = !(mode === 3 && t > w('L10', 'crashes', .12) + .3);
      O.sun2.position.set(mode === 3 ? xf + 24 : xf - 24, mode === 3 ? 4 : 7, mode === 3 ? 50 : -50); O.sun2.lookAt(xf, 1, mode === 3 ? -10 : 10); if (O.sun2.visible) S.flares.push({ pos: wpos(O.sun2), color: '#ffcf8a', size: 30, streak: .7 });
      if (mode === 0) { O.kirF.G.visible = O.pamF.G.visible = true; const t0 = st('L5') - .1, tA = w('L5', 'hoping', 0);
        walker(O.kirF, t, [[t0, V(xf + .6, 0, 14)], [tA, V(xf + .5, 0, -6.5)], [tA + .35, V(xf + .5, 0, -6.6)], [tA + .55, V(xf + .5, .4, -7.0)], [tA + 1.6, V(xf + .5, .4, -8.3)]]); walker(O.pamF, t, [[t0, V(xf - .4, 0, 14.8)], [tA, V(xf - .6, 0, -5.4)]]);
        if (t > tA) { O.pamF.G.rotation.y = Math.PI * .9; stand(O.pamF); }
        L([.5, .42, .34], '#d0a272', 12, 55, [[xf - 30, 20, 30], SUN, 120], [[xf + 4.4, 1.2, -6.5], [.3, .25, .2], 3]); }
      if (mode === 1) { O.jerF.G.visible = true; walker(O.jerF, t, [[st('L7') - .1, V(xf - .5, 0, 9)], [w('L7', 'others', -.15), V(xf - .2, 0, 2.5)]]);
        L([.32, .22, .28], '#7a4a52', 10, 45, [[xf + 30, 8, -40], [1.3, .62, .45], 120], [[xf, 4.2, -8.6], [.6, .45, .25], 6]); }
      if (mode === 2) { const night8 = t >= st('L8') - .1;
        if (!night8) { const tE = w('L7', 'never', -.15), ch = O.chair, A0 = V(xf + 2.2, 0, 4.8), A1 = V(xf + .4, 0, .8), dir = A1.clone().sub(A0), len = dir.length(), u = dir.clone().normalize(), yaw = Math.atan2(u.x, u.z);
          // pushed along the path: the distance travelled turns the wheels and the casters; the dirt makes it bump, tilt and jostle him (a little ragdoll)
          const k = clamp((t - w('L7', 'others', -.15)) / (tE - w('L7', 'others', -.15))), d = len * k, push = t < tE; ch.visible = true; ch.position.copy(push ? A0.clone().addScaledVector(u, d) : A1); ch.rotation.y = yaw + (push ? 0 : .3);
          const bump = Math.sin(d * 7.3) * .5 + Math.sin(d * 12.1 + 1) * .5; O.chairBody.position.y = Math.abs(bump) * .018; O.chairBody.rotation.set(bump * .035, 0, Math.sin(d * 5.1) * .03);
          O.wheels.forEach(h => h.rotation.x = d / .29); O.casters.forEach(([cs, cw]) => { cs.rotation.y = Math.sin(d * 3) * .35; cw.rotation.x = d / .06; });
          O.tracks.forEach((tr, i) => { const s2 = i ? 1 : -1, side = V(u.z, 0, -u.x).multiplyScalar(s2 * .27), dd = Math.max(.01, push ? d : len); tr.position.copy(A0.clone().addScaledVector(u, dd / 2).add(side)); tr.position.y = .012; tr.rotation.y = yaw; tr.scale.z = dd; });
          if (push) { O.fraF.G.visible = O.salF.G.visible = true; const f = O.fraF, s = O.salF; f.G.position.copy(V(0, .52 - .8 + .05 + O.chairBody.position.y, .02).applyEuler(ch.rotation).add(ch.position)); f.G.rotation.set(O.chairBody.rotation.x * 1.5, yaw, O.chairBody.rotation.z * 2); sit(f); f.setFace('fran');
            f.head.rotation.set(Math.sin(d * 7.3 + .6) * .22, Math.sin(t * 2.3) * .2, Math.sin(d * 5.1 + .8) * .18); f.pose([V(-.24, 1.36, 0), V(-.3, 1.06 + bump * .05, .12), V(-.3, .9 + bump * .08, .3)], [V(.24, 1.36, 0), V(.3, 1.08, .14), V(.22, 1.0, .4)]);
            s.G.position.copy(V(0, 0, -.72).applyEuler(ch.rotation).add(ch.position)); s.G.rotation.y = yaw; stride(s, d * .9); s.pose([V(-.24, 1.36, 0), V(-.25, 1.15, .25), V(-.27, 1.0, .42)], [V(.24, 1.36, 0), V(.25, 1.15, .25), V(.27, 1.0, .42)]); s.setFace('sallyS'); }
          O.torch.visible = true; if (t < tE) { O.torch.position.copy(wpos(O.fraF.armR.hand)); O.torch.rotation.set(0, yaw, 0); } else { O.torch.position.set(xf + .9, .05, 1.6); O.torch.rotation.set(0, -.9, 0); }
          const lp = t < tE ? wpos(O.fraF.armR.hand).add(V(0, .1, 1.2).applyEuler(ch.rotation)) : V(xf + .7, .3, 1.2);
          L([.14, .15, .22], '#05070c', 3, 24, [lp.toArray(), [1.4, 1.35, 1.1], 6], [[xf, 4.2, -8.6], [.5, .4, .25], 6], [[xf + 25, 30, 15], [.38, .42, .66], 200]); }
        else { O.salF.G.visible = true; walker(O.salF, t, [[st('L8') - .1, V(xf - .2, 0, 0)], [w('L8', 'station', -.2), V(xf - .6, 0, 9.5)]], 2.6, true); O.salF.setFace('sallyS');
          L([.1, .11, .17], '#05070c', 4, 26, [[xf, 4.2, -8.6], [.6, .45, .3], 8], [[xf - 1, 2, 12], [.25, .28, .45], 12]); } }
      if (mode === 3) { const tC = w('L10', 'crashes', .12), wp = O.win, n = V(1, 0, 0), s = O.salF;
        s.G.visible = t > tC - .4; if (t > tC - .4) { const u = t - tC, fly = clamp(u / .6), p = wp.clone().addScaledVector(n, -.9 + 2.6 * fly); p.y = Math.max(0, 1.12 + .25 * fly - 1.4 * fly * fly);   // inside, behind the dark glass, then a dive out through the frame
          if (u < .85) { s.G.position.copy(p); s.G.rotation.set(u < .6 ? 1.15 * (1 - fly * .6) : 0, Math.PI / 2, 0); stand(s); if (u < .6) s.pose(ARM.up(-1), ARM.up(1)); else s.legs(LEG.sit(-1), LEG.sit(1)); }
          else { s.G.rotation.x = 0; walker(s, t, [[tC + .85, p], [tC + 1.9, V(X.farm + 13.5, 0, -10)], [tC + 2.9, V(X.farm + 14, 0, -2)], [st('L11') - .1, V(X.farm + 14.5, 0, 8)]], 2.6, true); } s.setFace('sallyS'); }
        O.shards.forEach((sd, i) => { const u = t - tC - .3; if (u < 0 || u > 1.8) return; const r1 = Math.sin(i * 12.9898) * .5 + .5, r2 = Math.sin(i * 78.233) * .5 + .5, r3 = Math.sin(i * 39.1) * .5 + .5;
          const p = wp.clone().add(V(0, (r2 - .5) * .9, (r1 - .5) * .9)).addScaledVector(n, u * (1.5 + r3 * 2.5)); p.y = Math.max(.02, p.y + u * (1.2 * r2) - 4.9 * u * u); sd.position.copy(p); sd.rotation.set(u * 9 * r1, u * 7 * r2, u * 5); });
        L([.42, .32, .3], '#d89a7a', 10, 50, [[xf + 20, 4, -40], [1.6, 1.0, .6], 120], [[xf, 3, -8], [.3, .3, .3], 6]); } }
    // ---- the red hall
    if (cur === 'hall') { S.grade = GR.hall; const xh = X.hall, tO = w('L6', 'slides', -.1), tM = w('L6', 'huge', -.2), tSw = w('L6', 'swings', -.2), hit = w('L6', 'hammer', .13), K = O.kirH, B = O.butH;
      const open = t < tO ? 0 : t < hit + .4 ? eio(clamp((t - tO) / .5)) : 1 - eio(clamp((t - hit - .55) / .25)); O.slab.position.x = xh - 1.15 * open;
      K.G.visible = t < hit; walker(K, t, [[st('L6') - .1, V(xh - .45, 0, 1.9)], [w('L6', 'Inside', .5), V(xh - .5, 0, 1.0)], [w('L6', 'steel', 0), V(xh - .55, 0, .1)], [tO + .2, V(xh - .5, 0, -1.4)]], 1.4);
      K.G.rotation.x = t > w('L6', 'Inside', .3) && t < w('L6', 'Inside', .8) ? .45 * Math.sin((t - w('L6', 'Inside', .3)) / .5 * Math.PI) : 0;   // he stumbles on the threshold
      if (t > tO + .2) { K.G.rotation.y = Math.PI; stand(K); if (t > tM + .2) K.pose(ARM.up(-1), ARM.up(1)); } K.setFace(t > tM ? 'sallyS' : 'kirk');
      { const tb = hit - .14; hurt(K, hitK(t, tb)); bleed(O.bloodH, t, tb, wpos(K.head), V(0, 0, .4)); }
      B.G.visible = t > tM - .05 && t < hit + .28; B.G.position.copy(path(t, [[tM - .05, V(xh, 0, -3.3)], [tM + .45, V(xh, 0, -2.45)]])); stand(B);
      const raise = clamp((t - w('L6', 'mask', -.1)) / .3), sw = eio(clamp((t - tSw - .1) / .25));
      if (raise > 0) B.pose([V(-.24, 1.36, 0), V(-.16, 1.6 - .25 * sw, .12 + .2 * sw), V(-.05, 1.85 - .55 * sw, .1 + .4 * sw)], [V(.24, 1.36, 0), V(.16, 1.6 - .25 * sw, .12 + .2 * sw), V(.05, 1.85 - .55 * sw, .1 + .4 * sw)]);
      O.ham.position.set(0, lerp(1.0, 1.85 - .55 * sw, raise), lerp(.25, .1 + .4 * sw, raise)); O.ham.rotation.x = lerp(.3, lerp(-.5, 2.2, sw), raise);
      L([.22, .13, .11], '#0e0604', 3, 14, [[xh, 2.2, -.6], [1.25, .95, .6].map(c => c * flick(t, 1)), 6], [[xh, 1.6, 3.2], [1.3, 1.25, 1.1], 6], [[xh, 1.4, -3.5], [.15, .1, .1], 3]); }
    // ---- dinner
    if (cur === 'dining') { S.grade = GR.dinner; const xd = X.dining, S0 = O.salD, Gp = O.grand;
      const t3 = w('L9', 'barely', -.07), tJ = en('L9') + .15, tR = st('L10') - .05, tX = w('L10', 'crashes'); S0.G.visible = t > t3 && t < tR; S0.setFace('sallyS');   // third person only between her two first-person runs
      if (t < tJ) { S0.G.position.set(xd + 1.45 + Math.sin(t * 37) * .012, -.33, -.4); S0.G.rotation.set(0, -Math.PI / 2, Math.sin(t * 23) * .04); sit(S0); S0.pose([V(-.24, 1.36, 0), V(-.2, 1.08, -.12), V(-.06, .86, -.2)], [V(.24, 1.36, 0), V(.2, 1.08, -.12), V(.06, .86, -.2)]);   // hands tied behind
        S0.head.rotation.set(Math.sin(t * 9) * .12, t > t3 ? Math.sin(t * 26) * .6 : 0, Math.sin(t * 17) * .1); }                                               // shaking her head, frantic
      else { const k = eio(clamp((t - tJ) / .3)); S0.G.position.set(xd + 1.45, lerp(-.33, 0, k) + Math.sin(k * Math.PI) * .18, -.4 - .2 * k); S0.G.rotation.set(0, lerp(-Math.PI / 2, Math.PI, k), 0); stand(S0); if (k < 1) S0.legs(LEG.sit(-1), LEG.sit(1)); S0.pose(ARM.up(-1), ARM.up(1)); S0.head.rotation.set(0, 0, 0); }
      { const dawnIn = t > tR - .3, broke = t > tX - .02; O.dDawn.visible = dawnIn && !broke; O.dWin.visible = !dawnIn; O.dShards.forEach((sd, i) => { const u = t - tX + .02; if (u < 0 || u > 1.4) { sd.position.y = -99; return; } const r1 = Math.sin(i * 12.9898) * .5 + .5, r2 = Math.sin(i * 78.233) * .5 + .5;
          sd.position.set(xd + 1.3 + (r1 - .5) * .9, Math.max(.02, 1.5 + (r2 - .5) * 1.0 + u * (1 - 4.9 * u)), -2.17 - u * (1.2 + r2 * 2) + (i % 4 === 0 ? u * 3 : 0)); sd.rotation.set(u * 9 * r1, u * 7, u * 5 * r2); }); }
      Gp.G.position.set(xd - 1.5, -.36 * .92 + .02, -.4); Gp.G.rotation.y = Math.PI / 2; sit(Gp); const lift = clamp((t - w('L9', 'barely', -.2)) / 1.4); Gp.head.rotation.x = .55 - .5 * eio(lift);
      Gp.pose(ARM.lap(-1), [V(.24, 1.36, 0), V(.27, 1.1, .2 + .1 * lift), V(.22, .95 + .25 * eio(lift), .45)]); O.hamD.position.set(.22, .95 + .25 * eio(lift), .45); O.hamD.rotation.x = 1.5 - .9 * eio(lift) * (1 + Math.sin(t * 9) * .08);
      O.hitD.G.position.set(xd - .35, -.34, -1.25); O.hitD.G.rotation.y = 0; sit(O.hitD); O.hitD.setFace('hitch');
      O.oldD.G.position.set(xd - .95, 0, -1.7); O.oldD.G.rotation.y = .2; stand(O.oldD); O.butD.G.position.set(xd + .35, 0, -1.75); O.butD.G.rotation.y = .35; stand(O.butD);
      const dw = t > st('L10') - .35; if (dw) S.grade = PS1.mixGrade(GR.dinner, GR.dawn, clamp((t - st('L10') + .35) / .6));
      L([.18, .14, .12], '#0a0806', 3, 14, [[xd, 1.9, -.4], [1.35, 1.05, .6].map(c => c * flick(t, 4)), 5], dw ? [[xd + 1.3, 1.5, -1.7], [1.7, 1.05, .8], 6] : [[xd + 2, 1.5, 1.5], [.22, .2, .28], 5]); }
    // ---- the sunrise road: she runs out, the pickup stops, she climbs in the bed, it pulls away; he spins with the saw (the giveaway)
    if (cur === 'dawn') { S.grade = GR.dawn; S.flares.push({ pos: wpos(O.sun3), color: '#ffcf8a', size: 40, streak: .9 }); const xw = X.dawn, tStop = w('L11', 'pickup', -.35), tGo = w('L11', 'while', -.3), pk = O.pick, R = O.butR, Sa = O.salR;
      const pz = pickZ(t); pk.position.set(xw - 1.6, 0, pz); for (const wh of pk.userData.wheels) wh.rotation.x = pz / .38;
      if (t < tStop + .2) { if (Sa.G.parent !== O.g.dawn) O.g.dawn.add(Sa.G); walker(Sa, t, [[st('L11') - .1, V(xw + 9, 0, 1.2)], [tStop + .2, V(xw + .2, 0, .6)]], 2.6, true); }
      else if (t < tStop + .75) { if (Sa.G.parent !== O.g.dawn) O.g.dawn.add(Sa.G); const k = eio((t - tStop - .2) / .55), a = V(xw + .2, 0, .6), b = pk.localToWorld(V(0, .82, 1.4)); Sa.G.position.copy(a.lerp(b, k)); Sa.G.position.y += Math.sin(k * Math.PI) * .35; Sa.G.rotation.y = -Math.PI / 2; stand(Sa); Sa.legs(LEG.sit(-1), LEG.sit(1)); Sa.pose(ARM.reach(-1), ARM.reach(1)); }   // she climbs over the side
      else { if (Sa.G.parent !== pk) pk.add(Sa.G); Sa.G.position.set(0, .82 - .8 + .02, 1.4); Sa.G.rotation.y = 0; sit(Sa); if (t > tGo + .5) Sa.pose(ARM.down(-1), ARM.up(1)); } Sa.setFace('sallyS');
      // the man: runs after her, then spins in the road with the roaring saw over his head (stepped, a little jerky, like a PS1 cutscene)
      const tq = Math.floor(t * 15) / 15, tSp = tGo, rp = path(t, [[st('L11') - .1, V(xw + 7, 0, 12)], [tSp, V(xw + .3, 0, 5.2)]]); R.G.position.copy(rp);
      if (t <= tSp) { R.G.rotation.y = Math.atan2(-6.7, -6.8); stride(R, t * 2.4, true); O.saw.position.set(0, 1.0, .42); O.saw.rotation.set(0, 0, 0); R.pose([V(-.24, 1.36, 0), V(-.22, 1.12, .2), V(-.08, 1.05, .36)], [V(.24, 1.36, 0), V(.22, 1.12, .2), V(.08, 1.05, .36)]); }
      else { const spin = (tq - tSp) * 3.4 + Math.sin((tq - tSp) * 2.2) * .8; R.G.rotation.y = Math.PI + spin; R.legs(...[-1, 1].map(s => [V(s * .09, .8, 0), V(s * .13, .42, .06 * Math.sin(tq * 9 + s)), V(s * .16, .05, .1 * Math.sin(tq * 9 + s))]));
        const up = eio(clamp((t - tSp) / .4)), sway = Math.sin(tq * 6) * .25; R.pose([V(-.24, 1.36, 0), V(-.2, lerp(1.12, 1.7, up), .14), V(-.08, lerp(1.05, 1.98, up), .12)], [V(.24, 1.36, 0), V(.2, lerp(1.12, 1.7, up), .14), V(.08, lerp(1.05, 1.98, up), .12)]);
        O.saw.position.set(0, lerp(1.0, 2.02, up), lerp(.42, .12, up)); O.saw.rotation.set(-1.4 * up + sway * up, 0, Math.sin(tq * 7) * .2 * up); }
      O.saw.position.x = Math.sin(t * 91) * .004; O.saw.userData.bar.position.y = -.03 + Math.sin(t * 77) * .003;
      L([.5, .38, .34], '#e0a070', 18, 105, [[xw, 6, -50], [1.7, 1.15, .7], 120], [[xw + 2, 2, 14], [.35, .3, .35], 30]); }
    { const te = t >= S.cutBack ? 0 : t; for (const f of O.fx[cur]) f(te, S); }   // the detail pass: wind, birds, clouds, motes, swing, laundry, dust
  },
}));
