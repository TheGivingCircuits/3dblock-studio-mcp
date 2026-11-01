// The cast library's looks (Phase 3): faces, skin, hair, wardrobe, masks, headwear and extras, all hand-painted in the PS1 idiom: tiny
// canvases (8–32 px, nearest filtered) on boxes, cylinders and cones. Load after ps1.js; cast.js builds characters from these parts.
// Everything is a recipe value (a name or a colour), so a character is one line and every texture is painted once and cached.
(function () {
const PS = window.PS1, rng = PS.rng, L = window.CASTLOOKS = {};
const cache = new Map(), memo = (k, f) => cache.has(k) ? cache.get(k) : (cache.set(k, f()), cache.get(k));
const tex = (k, w, h, draw) => memo('t:' + k, () => PS.tex(w, h, draw, [...k].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)));
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }, rgb = a => `rgb(${a.map(v => Math.max(0, Math.min(255, v | 0))).join(',')})`;
const shade = (h, k) => rgb(hex(h).map(v => v * k)), mix = (a, b, k) => rgb(hex(a).map((v, i) => v + (hex(b)[i] - v) * k));
L.shade = shade;

// ---------- skin and colour names ----------
L.SKIN = { pale: '#e9cdb6', fair: '#d6a084', olive: '#c49270', tan: '#b07a56', brown: '#8a5a3a', dark: '#5e3c28', grey: '#c8ccc4', sick: '#b8bca0' };
L.HAIR = { black: '#141012', darkBrown: '#3a2416', brown: '#6a4426', auburn: '#8a3a1e', red: '#a8401c', blonde: '#d6b04a', dirtyBlonde: '#a88a52', sandy: '#c0a070', grey: '#9a9a96', white: '#e0e0da', bleach: '#ece2b0' };
L.color = (c, table) => !c ? null : c[0] === '#' ? c : (table && table[c]) || L.SKIN[c] || L.HAIR[c] || c;

// ---------- faces: 24 x 28, expressions neutral | scared | screaming | smiling | dead, with blink and talk frames ----------
// opts: { skin, hair (colour or null for bald), eyes ('#3a2a1a'), brows, beard, moustache, age (0..1 lines), lips, lashes, freckles }
L.face = (o = {}, expr = 'neutral', frame = 'open') => { const key = 'face:' + JSON.stringify(o) + expr + frame;
  return tex(key, 24, 28, (q) => { const px = (c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
    const skin = L.color(o.skin || 'fair'), dk = shade(skin, .78), hair = o.hair ? L.color(o.hair) : null, eyes = o.eyes || '#2a1c12', brow = o.brows ? L.color(o.brows) : (hair ? shade(hair, .8) : shade(skin, .6));
    px(skin, 0, 0, 24, 28); if (hair) { px(hair, 0, 0, 24, o.fringe ? 8 : 5); if (o.sides !== false && o.long) { px(hair, 0, 5, 3, 15); px(hair, 21, 5, 3, 15); } }
    if (o.age) { px(dk, 5, 7, 4, 1); px(dk, 15, 7, 4, 1); if (o.age > .5) { px(dk, 3, 16, 1, 4); px(dk, 20, 16, 1, 4); px(dk, 9, 25, 6, 1); } }
    if (o.freckles) for (const [x, y] of [[6, 15], [8, 16], [16, 15], [18, 16], [7, 17]]) px(shade(skin, .85), x, y);
    const closed = frame === 'blink' || expr === 'dead', wide = expr === 'scared' || expr === 'screaming';
    // brows
    if (expr === 'scared' || expr === 'screaming') { px(brow, 5, 8, 4, 1); px(brow, 15, 8, 4, 1); px(brow, 4, 9); px(brow, 19, 9); }
    else if (expr === 'smiling') { px(brow, 5, 9, 4, 1); px(brow, 15, 9, 4, 1); }
    else px(brow, 5, 9, 4, 1), px(brow, 15, 9, 4, 1);
    // eyes
    if (closed) { px(shade(skin, .62), 5, 12, 4, 1); px(shade(skin, .62), 15, 12, 4, 1); }
    else { px('#f2efe8', 5, 11, 4, wide ? 3 : 2); px('#f2efe8', 15, 11, 4, wide ? 3 : 2); px(eyes, 7, 12); px(eyes, 16, 12); if (o.lashes) { px('#1a1210', 5, 10, 4, 1); px('#1a1210', 15, 10, 4, 1); } }
    // nose
    // glasses painted on the face, as the hand-built Franklin: one-pixel dark frames, pale lenses, the eyes showing through
    if (o.glasses) { const fr = '#22201e'; for (const x0 of [4, 13]) { px(fr, x0, 10, 7, 1); px(fr, x0, 13, 7, 1); px(fr, x0, 10, 1, 4); px(fr, x0 + 6, 10, 1, 4); px(closed ? shade(skin, .9) : '#e6ecee', x0 + 1, 11, 5, 2); } px(fr, 11, 11, 2, 1); if (!closed) { px(eyes, 7, 12); px(eyes, 16, 12); } else { px(shade(skin, .62), 5, 12, 5, 1); px(shade(skin, .62), 14, 12, 5, 1); } }
    px(shade(skin, .82), 11, 14, 2, 4);
    // mouth: by expression, and open when talking
    const lip = o.lips ? L.color(o.lips) : shade(skin, .6), m = '#2a1210';
    if (expr === 'screaming') { px(m, 9, 19, 6, 5); px('#7a2a24', 10, 22, 4, 1); }
    else if (frame === 'talk') { px(m, 10, 20, 4, 2); px(lip, 9, 19, 6, 1); }
    else if (expr === 'smiling') { px(lip, 8, 20, 8, 1); px(lip, 7, 19); px(lip, 16, 19); px('#f2efe8', 9, 21, 6, 1); }
    else if (expr === 'scared') { px(m, 10, 20, 4, 3); }
    else if (expr === 'dead') { px(lip, 9, 21, 6, 1); px(m, 11, 22, 2, 1); }
    else px(lip, 9, 21, 6, 1);
    // facial hair
    if (o.moustache) { px(shade(L.color(o.moustache), .78), 7, 18, 10, 2); px(L.color(o.moustache), 8, 18, 8, 1); }
    if (o.beard) { const b = L.color(o.beard); px(b, 3, 18, 18, 8); px(b, 2, 15, 2, 6); px(b, 20, 15, 2, 6); if (frame === 'talk') px(m, 10, 20, 4, 2); else px(shade(b, .8), 9, 21, 6, 1); }
    if (o.stubble) PS.noise(q, 24, 28, rng(3), shade(skin, .7), 26, .5);
  }); };

// ---------- cloth: 8 x 16 painted swatches by weave; colours are names or hex ----------
const WEAVE = {
  plain: (q, w, h, r, c) => { q.fillStyle = c; q.fillRect(0, 0, w, h); PS.noise(q, w, h, r, shade(c, .72), 26, .85); PS.noise(q, w, h, r, shade(c, 1.18), 10, .6); },
  denim: (q, w, h, r, c) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = shade(c, .78); for (let x = 1; x < w; x += 2) q.fillRect(x, 0, 1, h); PS.noise(q, w, h, r, shade(c, 1.25), 10, .6); },
  stripe: (q, w, h, r, c, c2) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = c2 || '#e8e4dc'; for (let y = 1; y < h; y += 3) q.fillRect(0, y, w, 1); },
  plaid: (q, w, h, r, c, c2) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = c2 || shade(c, .55); for (let y = 0; y < h; y += 4) q.fillRect(0, y, w, 1); for (let x = 0; x < w; x += 4) q.fillRect(x, 0, 1, h); },
  knit: (q, w, h, r, c) => { q.fillStyle = c; q.fillRect(0, 0, w, h); q.fillStyle = shade(c, .82); for (let y = 0; y < h; y += 2) for (let x = (y / 2) % 2; x < w; x += 2) q.fillRect(x, y, 1, 1); },
  leather: (q, w, h, r, c) => { q.fillStyle = c; q.fillRect(0, 0, w, h); PS.noise(q, w, h, r, shade(c, 1.4), 8, .5); PS.noise(q, w, h, r, shade(c, .6), 10, .6); },
  stain: (q, w, h, r, c) => { q.fillStyle = c; q.fillRect(0, 0, w, h); PS.noise(q, w, h, r, '#6a3a1e', 20, .8); PS.noise(q, w, h, r, '#5a1010', 8, .9); },
};
// garment detail, painted over the weave at the hand-built density (the Hitchhiker's 8 px clothes: plackets, buttons, belts, seams, pockets)
const px = (q, c, x, y, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(x, y, w, h); };
const DETAIL = {
  tee: (q, w, h, r, c) => { px(q, shade(c, .66), 0, 0, w, 1); px(q, shade(c, .8), 0, h - 1, w, 1); px(q, shade(c, .85), 2, 1, 4, 1); },
  shirt: (q, w, h, r, c) => { px(q, shade(c, 1.15), 0, 0, w, 2); px(q, shade(c, .62), 3, 1, 1, h - 1); for (const y of [4, 8, 12]) px(q, shade(c, 1.35), 4, y); px(q, shade(c, .7), 5, 4, 2, 1); px(q, shade(c, .7), 5, 4, 1, 3); px(q, shade(c, .78), 0, h - 1, w, 1); },
  knit: (q, w, h, r, c) => { px(q, shade(c, .7), 0, 0, w, 1); for (let x = 0; x < w; x += 2) px(q, shade(c, .68), x, h - 3, 1, 3); },
  hoodie: (q, w, h, r, c) => { px(q, shade(c, .7), 0, 0, w, 1); px(q, shade(c, .74), 1, 9, 6, 1); px(q, shade(c, .74), 1, 9, 1, 4); px(q, shade(c, .74), 6, 9, 1, 4); px(q, shade(c, 1.3), 3, 1, 1, 4); px(q, shade(c, 1.3), 5, 1, 1, 4); },
  jeans: (q, w, h, r, c) => { px(q, shade(c, .6), 0, 0, w, 2); px(q, '#a88a4a', 3, 0, 2, 2); px(q, shade(c, .7), 4, 2, 1, h - 2); px(q, '#c08a3a', 1, 3); px(q, '#c08a3a', 6, 3); px(q, shade(c, .72), 0, 3, 2, 1); px(q, shade(c, .72), 6, 3, 2, 1); px(q, shade(c, 1.2), 0, h - 1, w, 1); },
  slacks: (q, w, h, r, c) => { px(q, '#1e1812', 0, 0, w, 2); px(q, '#a8a090', 3, 0, 2, 2); px(q, shade(c, 1.22), 2, 2, 1, h - 2); px(q, shade(c, 1.22), 6, 2, 1, h - 2); px(q, shade(c, .7), 0, 3, 2, 1); },
  skirt: (q, w, h, r, c) => { px(q, shade(c, .62), 0, 0, w, 2); for (let x = 1; x < w; x += 3) px(q, shade(c, .78), x, 2, 1, h - 2); px(q, shade(c, .7), 0, h - 1, w, 1); },
  dress: (q, w, h, r, c) => { px(q, shade(c, .74), 0, 0, w, 1); px(q, shade(c, .66), 0, 6, w, 1); for (let x = 1; x < w; x += 3) px(q, shade(c, .82), x, 7, 1, h - 7); },
  jacket: (q, w, h, r, c) => { px(q, shade(c, .6), 3, 0, 2, h); px(q, shade(c, 1.25), 1, 0, 1, 5); px(q, shade(c, 1.25), 6, 0, 1, 5); px(q, shade(c, .7), 0, 6, 3, 1); px(q, shade(c, .7), 5, 6, 3, 1); px(q, shade(c, 1.4), 4, 3); px(q, shade(c, 1.4), 4, 7); px(q, shade(c, .66), 0, h - 2, w, 2); },
  varsity: (q, w, h, r, c, c2) => { px(q, '#e8e4dc', 0, 0, w, 1); px(q, '#e8e4dc', 0, h - 2, w, 1); px(q, shade(c, .6), 4, 0, 1, h); for (const y of [3, 6, 9, 12]) px(q, c2 || '#e8e4dc', 3, y); px(q, c2 || '#e8e4dc', 5, 3, 2, 3); },
  suit: (q, w, h, r, c) => { px(q, shade(c, 1.35), 2, 0, 1, 6); px(q, shade(c, 1.35), 5, 0, 1, 6); px(q, '#e8e4dc', 3, 0, 2, 3); px(q, '#7a1e1e', 3, 3, 2, 4); px(q, shade(c, .66), 0, 8, 2, 1); px(q, shade(c, .66), 6, 8, 2, 1); px(q, shade(c, 1.4), 4, 9); px(q, shade(c, 1.4), 4, 12); },
  uniform: (q, w, h, r, c) => { px(q, shade(c, .66), 3, 0, 1, h); for (const y of [3, 6, 9]) px(q, shade(c, 1.4), 4, y); px(q, shade(c, .7), 0, 3, 3, 1); px(q, shade(c, .7), 0, 3, 1, 3); px(q, shade(c, .7), 5, 3, 3, 1); px(q, shade(c, .7), 7, 3, 1, 3); px(q, '#1e1a16', 0, 10, w, 1); px(q, '#a8a090', 3, 10, 2, 1); },
  // the Hitchhiker's work shirt: dark suspenders down the front
  work: (q, w, h, r, c) => { px(q, '#3a2a22', 2, 0, 1, 8); px(q, '#3a2a22', 5, 0, 1, 8); px(q, shade(c, 1.15), 0, 0, w, 1); px(q, shade(c, .7), 0, h - 1, w, 1); },
  // the dress shirt with a tie, as the old man's
  tie: (q, w, h, r, c) => { px(q, shade(c, 1.1), 0, 0, w, 2); px(q, '#6a3a2a', 3, 1, 2, 9); px(q, '#4a2a1e', 3, 1, 2, 1); px(q, shade(c, .74), 1, 4, 1, 2); },
  robe: (q, w, h, r, c) => { PS.noise(q, w, h, r, '#2a2a30', 12, .7); px(q, '#1a1a20', 3, 0, 2, h); },
  apron: () => {},
  // a trouser leg: the denim wash and one outer seam, nothing else (the belt and pockets live on the pelvis only)
  leg: (q, w, h, r, c) => { px(q, shade(c, .74), w - 1, 0, 1, h); PS.noise(q, w, h, r, shade(c, 1.22), 8, .5); },
  police: (q, w, h, r, c) => { DETAIL.uniform(q, w, h, r, c); px(q, '#c8a83a', 1, 3, 2, 2); },
  badgePatch: (q, w, h, r, c) => { DETAIL.uniform(q, w, h, r, c); px(q, '#e8e4dc', 5, 4, 3, 1); px(q, '#a02a2a', 6, 4, 1, 1); },
  zip: (q, w, h, r, c) => { DETAIL.uniform(q, w, h, r, c); px(q, '#a8a8a8', 4, 0, 1, h); },
};
L.DETAIL = DETAIL;
// wear: dirt and blood build up over a scene (levels 0..4, painted on top, so the same swatch is reused at each level)
L.cloth = (c, weave = 'plain', c2, wear = {}, detail = null) => { const col = L.color(c) || '#808080', dl = Math.round((wear.dirt || 0) * 4), bl = Math.round((wear.blood || 0) * 4);
  return tex(`cloth:${col}:${weave}:${c2 || ''}:${dl}:${bl}:${detail || ''}`, 8, 16, (q, w, h, r) => { (WEAVE[weave] || WEAVE.plain)(q, w, h, r, col, c2 && L.color(c2)); if (detail && DETAIL[detail]) DETAIL[detail](q, w, h, r, col, c2 && L.color(c2));
    if (dl) PS.noise(q, w, h, r, '#3a2a1a', dl * 10, .7); if (bl) { PS.noise(q, w, h, r, '#8a0c0c', bl * 6, .95); PS.noise(q, w, h, r, '#c41818', bl * 3, .9); } }); };
L.flat = c => tex('flat:' + L.color(c), 4, 4, (q) => { q.fillStyle = L.color(c); q.fillRect(0, 0, 4, 4); });

// ---------- wardrobe: every piece has a slot, a weave, default colours, era tags, and extra geometry if it needs some ----------
// slots: top, bottom, shoes, jacket, full (a one-piece that is top and bottom), apron. cast.js reads: weave, color, c2, bareArms, shorts, skirt, dress, sleeves
L.WARDROBE = {
  tee: { slot: 'top', weave: 'plain', color: '#c03a2a', era: ['70s', '80s', '90s', '2000s'] }, stripedTee: { slot: 'top', weave: 'stripe', color: '#2a4a8a', era: ['70s', '80s', '90s'] },
  shirt: { slot: 'top', weave: 'plain', color: '#c8c0a8', collar: true, era: ['70s', '80s', '90s', '2000s'] }, plaidShirt: { slot: 'top', weave: 'plaid', color: '#8a2a1e', collar: true, era: ['70s', '80s', '90s'] },
  sweater: { slot: 'top', weave: 'knit', color: '#4a5a3a', era: ['70s', '80s', '90s'] }, turtleneck: { slot: 'top', weave: 'knit', color: '#1e1e22', era: ['70s', '90s'], neck: true },
  tank: { slot: 'top', weave: 'plain', color: '#e8e4dc', bareArms: true, era: ['70s', '80s', '90s'] }, halter: { slot: 'top', weave: 'plain', color: '#d06a2a', bareArms: true, era: ['70s'] },
  hoodie: { slot: 'top', weave: 'plain', color: '#5a5e66', hood: true, era: ['90s', '2000s'] }, blouse: { slot: 'top', weave: 'plain', color: '#e8c8d0', collar: true, era: ['70s', '80s', '90s'] },
  jeans: { slot: 'bottom', weave: 'denim', color: '#33456a', era: ['70s', '80s', '90s', '2000s'] }, slacks: { slot: 'bottom', weave: 'plain', color: '#4a4036', era: ['70s', '80s', '90s'] },
  shorts: { slot: 'bottom', weave: 'denim', color: '#5a7aa8', shorts: true, era: ['70s', '80s'] }, skirt: { slot: 'bottom', weave: 'plain', color: '#6a2a3a', skirt: true, era: ['70s', '80s', '90s'] },
  dress: { slot: 'full', weave: 'plain', color: '#d4d6cc', dress: true, era: ['70s', '80s', '90s', '2000s'] }, nightgown: { slot: 'full', weave: 'plain', color: '#e4e6de', dress: true, long: true, bareArms: true, era: ['2000s'] },
  sneakers: { slot: 'shoes', color: '#e8e4dc', era: ['70s', '80s', '90s', '2000s'] }, boots: { slot: 'shoes', color: '#3a2618', era: ['70s', '80s', '90s'] }, shoes: { slot: 'shoes', color: '#1e1814' }, bare: { slot: 'shoes', color: 'skin' },
  denimJacket: { slot: 'jacket', weave: 'denim', color: '#4a6a9a', era: ['70s', '80s', '90s'] }, leatherJacket: { slot: 'jacket', weave: 'leather', color: '#1e1814', era: ['70s', '80s', '90s'] },
  varsity: { slot: 'jacket', weave: 'plain', color: '#7a1e1e', c2: '#e8e4dc', era: ['80s', '90s'] }, suitJacket: { slot: 'jacket', weave: 'plain', color: '#2a2a30', tie: '#7a1e1e', era: ['70s', '80s', '90s', '2000s'] }, woolCoat: { slot: 'jacket', weave: 'knit', color: '#5e6066', era: ['80s', '90s', '2000s'] },
  // uniforms
  police: { slot: 'full', weave: 'plain', color: '#22304a', c2: '#1a1a1e', badge: true, belt: true, hat: 'policeHat', era: ['70s', '80s', '90s', '2000s'] },
  nurse: { slot: 'full', weave: 'plain', color: '#eceee8', dress: true, hat: 'nurseCap', era: ['70s', '80s'] },
  robe: { slot: 'full', weave: 'plain', color: '#0c0c0e', dress: true, long: true, era: ['70s', '80s', '90s', '2000s'] },
  workShirt: { slot: 'top', weave: 'plain', color: '#8ea4b8', collar: true, detail: 'work', era: ['60s', '70s', '80s'] }, dressShirt: { slot: 'top', weave: 'plain', color: '#e4ded0', collar: true, detail: 'tie', era: ['60s', '70s', '80s', '90s'] },
  coveralls: { slot: 'full', weave: 'plain', color: '#2a3a4a', zip: true, era: ['70s', '80s', '90s'] },
  attendant: { slot: 'full', weave: 'plain', color: '#7a8aa0', c2: '#3a3a40', patch: true, hat: 'cap', era: ['70s', '80s'] },
  butcherApron: { slot: 'apron', weave: 'stain', color: '#d8d4c4', era: ['70s', '80s', '90s'] },
};

// which detail each piece wears
{ const D = { tee: 'tee', stripedTee: 'tee', tank: 'tee', halter: 'tee', shirt: 'shirt', blouse: 'shirt', plaidShirt: 'shirt', sweater: 'knit', turtleneck: 'knit', hoodie: 'hoodie', jeans: 'jeans', shorts: 'jeans', slacks: 'slacks', skirt: 'skirt',
    dress: 'dress', nightgown: 'dress', nurse: 'dress', denimJacket: 'jacket', leatherJacket: 'jacket', varsity: 'varsity', suitJacket: 'suit', woolCoat: 'jacket', police: 'police', coveralls: 'zip', attendant: 'badgePatch', robe: 'robe', butcherApron: 'apron' };
  for (const [k, d] of Object.entries(D)) if (L.WARDROBE[k]) L.WARDROBE[k].detail = d; }

// ---------- headwear and masks: geometry locked to the head bone (head-local units: the head box is 0.2 x 0.24 x 0.22, centred) ----------
L.HEADWEAR = {
  cap: (add, M, c) => { add(PS.box(.23, .07, .24), M(L.flat(c || '#2a3a6a')), 0, .14, -.005); add(PS.box(.2, .02, .12), M(L.flat(c || '#2a3a6a')), 0, .11, .16); },
  trucker: (add, M, c) => { add(PS.box(.23, .08, .24), M(L.flat('#e8e4dc')), 0, .145, -.005); add(PS.box(.232, .07, .1), M(L.flat(c || '#2a5a2a')), 0, .14, .07); add(PS.box(.2, .02, .12), M(L.flat(c || '#2a5a2a')), 0, .11, .16); },
  cowboy: (add, M, c) => { add(PS.cyl(.2, .2, .02, 10), M(L.flat(c || '#6a4a2a')), 0, .13, 0); add(PS.box(.18, .1, .18), M(L.flat(c || '#6a4a2a')), 0, .19, 0); },
  fedora: (add, M, c) => { add(PS.cyl(.17, .17, .02, 10), M(L.flat(c || '#3a3430')), 0, .13, 0); add(PS.box(.17, .09, .17), M(L.flat(c || '#3a3430')), 0, .18, 0); },
  beanie: (add, M, c) => add(PS.box(.225, .09, .235), M(L.cloth(c || '#7a1e1e', 'knit')), 0, .14, -.005),
  nurseCap: (add, M) => add(PS.box(.16, .05, .08), M(L.flat('#f4f4f0')), 0, .15, .04),
  policeHat: (add, M) => { add(PS.box(.24, .08, .25), M(L.flat('#1a2236')), 0, .155, -.005); add(PS.box(.2, .02, .1), M(L.flat('#0e0e12')), 0, .115, .16); add(PS.box(.05, .03, .01), M(L.flat('#c8a83a')), 0, .16, .125); },
};
// masks cover the face (+z) and the hair hides where it would; a mask texture is 24 x 28 like a face
L.MASKS = {
  skin: () => tex('mask:skin', 24, 28, (q, w, h, r) => { q.fillStyle = '#c8a888'; q.fillRect(0, 0, w, h); PS.noise(q, w, h, r, '#8a6a4a', 50, .7); q.fillStyle = '#5a3a2a';
    for (let y = 4; y < 26; y += 6) q.fillRect(2, y, 20, 1); q.fillRect(11, 2, 1, 24); q.fillStyle = '#100808'; q.fillRect(5, 10, 4, 3); q.fillRect(15, 10, 4, 3); q.fillRect(8, 19, 8, 3); q.fillStyle = '#e8e0c8'; for (let x = 9; x < 16; x += 2) q.fillRect(x, 19, 1, 2); }),
  hockey: () => tex('mask:hockey', 24, 28, (q) => { q.fillStyle = '#ecece4'; q.fillRect(0, 0, 24, 28); q.fillStyle = '#141414'; for (const [x, y] of [[5, 10], [15, 10]]) q.fillRect(x, y, 4, 3);
    for (const [x, y] of [[4, 4], [8, 3], [12, 3], [16, 4], [7, 16], [11, 17], [15, 16], [9, 22], [13, 22]]) q.fillRect(x, y, 2, 2); q.fillStyle = '#c41818'; for (const [x, y] of [[3, 7], [19, 7], [11, 6]]) q.fillRect(x, y, 2, 3); }),
  white: () => tex('mask:white', 24, 28, (q) => { q.fillStyle = '#e6e8e4'; q.fillRect(0, 0, 24, 28); q.fillStyle = '#2a2a2e'; q.fillRect(0, 0, 24, 5); q.fillStyle = '#101012'; q.fillRect(5, 11, 4, 2); q.fillRect(15, 11, 4, 2);
    q.fillStyle = '#c8cac4'; q.fillRect(11, 13, 2, 5); q.fillRect(9, 21, 6, 1); }),
  // the slit mask: our own design for a hooded killer, bone-white and smooth, two thin eye slits, no mouth, a hairline crack (never a real costume's face)
  slit: () => tex('mask:slit', 24, 28, (q, w, h, r) => { q.fillStyle = '#0c0c0e'; q.fillRect(0, 0, 24, 28); q.fillStyle = '#e4dfd2'; q.fillRect(4, 3, 16, 24); q.fillRect(3, 6, 18, 17); q.fillStyle = '#cfc8b8'; q.fillRect(4, 22, 16, 5);
    q.fillStyle = '#050506'; q.fillRect(6, 12, 5, 1); q.fillRect(13, 12, 5, 1); q.fillStyle = '#9a9488'; q.fillRect(16, 4, 1, 3); q.fillRect(17, 7, 1, 2); q.fillRect(16, 9, 1, 2); }),
  ghost: () => tex('mask:ghost', 24, 28, (q) => { q.fillStyle = '#0c0c0e'; q.fillRect(0, 0, 24, 28); q.fillStyle = '#f0f0ec'; q.fillRect(3, 3, 18, 25); q.fillStyle = '#0c0c0e';
    q.fillRect(5, 8, 5, 7); q.fillRect(14, 8, 5, 7); q.fillRect(9, 17, 6, 10); q.fillRect(4, 7, 1, 2); q.fillRect(19, 7, 1, 2); }),
};

// ---------- hair: styles built from boxes around the head box (head-local; the head is centred at 0) ----------
// each returns nothing; add(geo, mat, x, y, z) parents to the head bone, so hair turns, nods and shakes with the head
L.HAIRSTYLES = {
  bald: () => {},
  buzz: (add, H) => add(PS.box(.21, .03, .23), H, 0, .125, 0),
  short: (add, H) => { add(PS.box(.22, .06, .235), H, 0, .13, -.005); add(PS.box(.21, .13, .05), H, 0, .06, -.095); for (const s of [-1, 1]) add(PS.box(.02, .07, .14), H, s * .105, .08, -.03); },
  shag: (add, H) => { add(PS.box(.25, .08, .25), H, 0, .13, -.005); add(PS.box(.25, .2, .07), H, 0, .02, -.1); for (const s of [-1, 1]) add(PS.box(.04, .18, .17), H, s * .12, .03, -.03); add(PS.box(.2, .04, .03), H, 0, .1, .115); },
  feathered: (add, H) => { add(PS.box(.25, .08, .25), H, 0, .135, -.005); add(PS.box(.26, .2, .07), H, 0, .02, -.1); for (const s of [-1, 1]) { const w = add(PS.box(.05, .16, .17), H, s * .125, .05, -.02); w.rotation.z = s * .18; } },
  long: (add, H, len = .45) => { add(PS.box(.24, .07, .25), H, 0, .13, -.005); add(PS.box(.26, len, .1), H, 0, .12 - len / 2 + .02, -.11); for (const s of [-1, 1]) add(PS.box(.04, len * .85, .2), H, s * .12, .12 - len * .42, -.02); },
  ponytail: (add, H) => { add(PS.box(.225, .06, .24), H, 0, .13, -.005); add(PS.box(.21, .12, .05), H, 0, .06, -.095); const t = add(PS.box(.06, .3, .06), H, 0, -.06, -.15); t.rotation.x = .25; add(PS.box(.05, .04, .04), H, 0, .07, -.13); },
  bun: (add, H) => { add(PS.box(.225, .06, .24), H, 0, .13, -.005); add(PS.box(.21, .14, .05), H, 0, .06, -.095); add(PS.box(.1, .09, .09), H, 0, .1, -.14); },
  afro: (add, H) => { add(PS.box(.32, .18, .32), H, 0, .12, -.02); for (const s of [-1, 1]) add(PS.box(.06, .16, .24), H, s * .15, .02, -.03); },
  // waist-length hair hanging over the face (the girl from the well)
  veil: (add, H, len = .62) => { L.HAIRSTYLES.long(add, H, len); add(PS.box(.22, .42, .03), H, 0, .1 - .21, .125); },
};
})();
