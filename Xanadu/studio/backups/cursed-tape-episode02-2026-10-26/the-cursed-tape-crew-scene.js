// GUESS THE HORROR #1 — "THE CURSED TAPE", CREW REMAKE (2026-10-26). The PS1 v2 script and sounds, re-shot by the crew on the libraries:
// sets from lib/sets (SETS), people from lib/cast (CAST), props from lib/props (PROPS), the cinema camera (CAM) and the lighting engine (LIGHTS).
// The plan is docs/crew/dry-run-the-cursed-tape.md. The cover art and the TV pictures come over from the PS1 scene (cover.js, screen.js).
// Places (one world, far apart, fog hides the rest): her living room (x=0) · his apartment (x=60) · the woods and the cabins (x=120)
// · inside Cabin 12 (x=200) · down the well (x=240) · the well years ago (x=280).
// Frame 1 is the closed case on her coffee table under the title card; it opens at once and the camera cranes up to the TV. The end dips
// to black, cuts back to the case, it snaps shut and the card returns, so the last frame is frame 1 (the loop seam and the cover).
// No gore: the girl is never seen hurt; the mother only stands at the well. The girl is our own figure (veil hair, white nightgown).
const { V, clamp, lerp, eio } = PS1; LIGHTS.use(); const M = (t, o) => LIGHTS.mat(t, o), add = PS1.add, box = PS1.box, cyl = PS1.cyl, grp = PS1.group, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const T = SETS.T, X = { home: 0, apt: 60, woods: 120, cabin: 200, well: 240, past: 280 };
// the narration's word times (pure in t: NB.TL is set before the first frame)
const W_ = (line, word, d = 0) => { const L = NB.TL.lines[line]; if (!L) return 0; if (word == null) return L.start + d; const w = L.words.find(w => w.w.toLowerCase().replace(/[^a-z']/g, '') === word); return L.start + (w ? w.s : 0) + d; };
const EN = (line, d = 0) => { const L = NB.TL.lines[line]; return L ? L.start + L.words.at(-1).e + d : 0; };
const END = () => NB.TL.end;
// the casting director's cast.json, read once (a synchronous fetch: the page is local)
const CAST_ = (() => { const x = new XMLHttpRequest(); x.open('GET', 'cast.json', false); x.send(); return JSON.parse(x.responseText).cast; })();
let C = {}, R = {}, SH = {};
const show = (p, on) => { p.G.visible = on; };
// a person placed by time windows: [[t0, t1, x, z, ry, track]] where track is a CAST.act track (or a function (P, t, t0) for special moves)
const BLOCK = {};
function perform(name, t) { const p = C[name], win = (BLOCK[name] || []).find(([a, b]) => t >= a && t < b); if (!win) { show(p, false); return; } const [a, , x, z, ry, track] = win; show(p, true);
  p.G.position.set(x, 0, z); p.G.rotation.set(0, ry, 0); if (typeof track === 'function') { p.motion = null; track(p, t, a); } else CAST.act(p, t, track); }
// props in hand for time windows (no physics): [[t0, t1, prop, person, side, grip, rot]]
const HOLD = [];
function holds(t) { for (const h of HOLD) { const [a, b, o, P_, side, grip, rot] = h, on = t >= a && t < b && P_.G.visible; if (on && P_.held[side] !== o) P_.hold(o, side, grip, rot); if (!on && P_.held[side] === o) { P_.release(side); if (o.userData.home) { o.position.copy(o.userData.home.p); o.rotation.copy(o.userData.home.r); } else o.position.set(0, -50, 0); } } }
// sitting, with the phone to the ear when asked (the hand rides the sitting body, about 0.4 m below the standing phone pose)
const sitQ = (t, o = {}) => { const q = CAST.MOTIONS.sit(t, { seat: o.seat ?? SH.sofa }); if (o.phone) { q.handL = [-.1, 1.32, .0]; q.elbowL = [1, .3, .2]; q.head = [.05, .1, -.18]; } if (o.head) q.head = o.head; return q; };
const sitTrack = o => (p, t) => { p.solve(sitQ(t, o)); p.setFace(o.face || 'neutral'); p.animateFace(t); };
// the case's camera: straight down on the closed case, the case in the lower half (the title card owns the top, inside the 3:4 profile crop)
const CASE = V(.5, .425, -.62), CASE_POS = V(CASE.x, CASE.y + .4, CASE.z - .042 + .001), CASE_LOOK = V(CASE.x, CASE.y, CASE.z - .042);

CAM.episode({
  hud(t, S, q) { const end = END(), shut = EN('L10', 1.25);
    // the dip to black before the case
    const blk = t >= EN('L10', -.05) && t < EN('L10', .3); if (blk) { q.fillStyle = '#000'; q.globalAlpha = clamp((t - EN('L10', -.05)) / .12); q.fillRect(0, 0, 360, 640); q.globalAlpha = 1; }
    // the burned-in title card: frames 0–2.4 s, and back on the closed case at the end, so frame 0 = the last frame = the cover
    const a = Math.min(1, Math.max(t < 2.4 ? 1 : clamp(1 - (t - 2.4) / .4), clamp((t - shut - .2) / .3))); if (a <= 0) return;
    // the baseline and spacing are set explicitly: the engine's captions leave them changed, which would move the card between frame 1 and the tail
    q.save(); q.globalAlpha = a; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round';
    const txt = (s, y, size, fill, ls = 0) => { q.font = `bold ${size}px Arial, Helvetica, sans-serif`; q.letterSpacing = ls + 'px'; q.lineWidth = size / 4; q.strokeStyle = '#000'; q.strokeText(s, 180, y); q.fillStyle = fill; q.fillText(s, 180, y); };
    txt('GUESS THE HORROR', 72, 30, '#f2f0ea', 1); txt('#1', 114, 42, '#e2342a'); txt('CAN YOU NAME THIS MOVIE?', 154, 17, '#ffd23a', 1);
    q.translate(180, 186); q.rotate(-.06); q.letterSpacing = '2px'; q.font = 'bold 13px Arial, Helvetica, sans-serif'; q.fillStyle = 'rgba(0,0,0,.55)'; q.fillRect(-74, -12, 148, 24); q.strokeStyle = '#e2342a'; q.lineWidth = 2.5; q.strokeRect(-74, -12, 148, 24); q.fillStyle = '#e2342a'; q.fillText('DIFFICULTY: EASY', 0, 1);
    q.restore(); q.letterSpacing = '0px'; },
  build(S) { S.O = S.O || {}; const O = S.O;
    const diskTex = (() => { const t = new THREE.CanvasTexture(COVER.disc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();
    const screenOn = (tv, name) => { tv.updateMatrixWorld(true); const s = add(new THREE.PlaneGeometry(.44, .32), M(SCREEN.tex, { unlit: true }), 0, 0, 0, tv); s.position.set(-.05, .27, .262); s.userData.fx = 'glow'; s.userData.noCheck = true; return s; };
    // ---- her living room (x=0): 2002 rental, rain on the window; the case on the coffee table, the VCR on the TV, the cordless phone on the sofa arm
    R.home = SETS.room('living', { at: [X.home, 0, 0], era: '00s', seed: 1, lightStops: -1.8, tvOn: true, life: false, sofa: '#5a2a2c', sky: '#0a1220', ground: '#0c1210', tint: '#6a7a8a' });
    SETS.dress(R.home, [[[-.2, -1.2], [.35, 1.4]], [[.5, -.9], [.5, -.3]]], [{ pos: [.9, 1.5, -2.3], look: [.3, .85, 1.9] }], 5, { era: '90s', skip: ['phone', 'cell-phone', 'tape', 'remote', 'photo', 'cassette', 'ashtray'] });
    O.screenH = screenOn(R.home.tv, 'home');
    O.vcr = grp(X.home + .3, 1.0, 1.86); add(box(.42, .08, .24), M(PS1.color('#1e1e22')), 0, .04, 0, O.vcr); add(box(.2, .02, .005), M(PS1.color('#050506')), -.06, .045, -.121, O.vcr); O.vcrLed = add(box(.05, .015, .005), M(PS1.color('#3cff7a'), { unlit: true }), .13, .045, -.122, O.vcr); O.vcrLed.userData.fx = 'glow';
    O.tape = grp(X.home + .82, .425, -.55); add(box(.1, .025, .19), M(PS1.color('#2e2e34')), 0, .0125, 0, O.tape); for (const s of [-1, 1]) add(cyl(.016, .016, .003, 8), M(PS1.color('#c8c8c0')), s * .024, .0265, -.05, O.tape);
    { const print = PS1.tex(96, 96, q => { q.fillStyle = '#2e2e34'; q.fillRect(0, 0, 96, 96); q.fillStyle = '#ecebe6'; q.textAlign = 'center'; q.font = 'bold 30px Arial'; q.fillText('BLANK', 48, 46); q.font = 'bold 7px Arial'; q.fillText('VIDEO CASSETTE T-120', 48, 68); });
      const pl = add(new THREE.PlaneGeometry(.09, .09), M(print), 0, .0262, .045, O.tape); pl.rotation.set(-Math.PI / 2, 0, Math.PI / 2); } O.tape.userData.noCheck = true;
    S.case = PS1.dvdCase(COVER.cover, diskTex, CASE.x, CASE.y, CASE.z, 0);
    O.phone = PROPS.make('phone', { at: [X.home - .82, .63, -1.72], color: '#d8d0bc', ry: Math.PI / 2 }); O.phone.userData.home = { p: O.phone.position.clone(), r: O.phone.rotation.clone() };
    O.phoneLed = add(box(.02, .012, .012), M(PS1.color('#4cff6a'), { unlit: true }), X.home - .76, .7, -1.66); O.phoneLed.userData.fx = 'glow';
    // ---- his apartment (x=60): a bare bedroom; the TV on the dresser, the wall of crossed-out faces, the calendar, the clock
    R.apt = SETS.room('bedroom', { at: [X.apt, 0, 0], era: '00s', seed: 2, lightStops: -1.7, life: false, sky: '#0a1220', ground: '#0c1210', tint: '#5a6a80' });
    R.aptTv = PROPS.make('tv', { at: [X.apt + 1.0, .9, 1.68], ry: Math.PI, on: true }); O.screenA = screenOn(R.aptTv, 'apt');
    { const cork = PS1.tex(48, 36, (q, w, h, r) => { q.fillStyle = '#6b4a32'; q.fillRect(0, 0, w, h); q.fillStyle = '#b9875a'; q.fillRect(2, 2, w - 4, h - 4); PS1.noise(q, w, h, r, '#7a4a22', 120, .6);
        for (const [x, y] of [[5, 4], [17, 3], [29, 5], [10, 19], [23, 19], [36, 18]]) { q.fillStyle = '#f4f1e8'; q.fillRect(x, y, 9, 11); q.fillStyle = '#5a6270'; q.fillRect(x + 1, y + 1, 7, 7); q.fillStyle = '#c9b8a0'; q.fillRect(x + 3, y + 2, 3, 3); q.fillStyle = '#c4161c'; for (let k = 0; k < 7; k++) { q.fillRect(x + 1 + k, y + 1 + k, 1, 1); q.fillRect(x + 7 - k, y + 1 + k, 1, 1); } } });
      const b = add(new THREE.PlaneGeometry(1.2, .9), M(cork), X.apt - 2.23, 1.5, -.9); b.rotation.y = Math.PI / 2;
      O.cal = PS1.tex(24, 30, (q) => { q.fillStyle = '#f1ead8'; q.fillRect(0, 0, 24, 30); q.fillStyle = '#a8241c'; q.fillRect(0, 0, 24, 7); q.fillStyle = '#fff'; q.font = 'bold 6px Arial'; q.fillText('OCT', 7, 6);
        for (let d = 1; d <= 12; d++) { const x = 2 + ((d - 1) % 4) * 6, y = 9 + Math.floor((d - 1) / 4) * 7; q.fillStyle = '#222'; q.fillRect(x, y, 3, 4); if (d < 7) { q.fillStyle = '#a8241c'; q.fillRect(x - 1, y + 1, 5, 1); } if (d === 7) { q.strokeStyle = '#c4161c'; q.lineWidth = 1; q.strokeRect(x - 1.5, y - 1.5, 6, 7); } } });
      const c = add(new THREE.PlaneGeometry(.42, .52), M(O.cal), X.apt - 2.23, 1.5, .15); c.rotation.y = Math.PI / 2;
      const face = PS1.tex(32, 32, (q) => { q.fillStyle = '#efe6d0'; q.beginPath(); q.arc(16, 16, 15, 0, 6.283); q.fill(); q.fillStyle = '#222'; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; q.fillRect(16 + Math.cos(a) * 12 - 1, 16 + Math.sin(a) * 12 - 1, 2, 2); } });
      const ck = grp(X.apt + 2.22, 1.95, .9); ck.rotation.y = -Math.PI / 2; add(cyl(.18, .18, .04, 12), M(PS1.color('#2a2a2e')), 0, 0, -.02, ck).rotation.x = Math.PI / 2; add(new THREE.CircleGeometry(.16, 12), M(face), 0, 0, .002, ck);
      O.hands = [grp(0, 0, .006, ck), grp(0, 0, .008, ck)]; add(box(.012, .1, .004), M(T.black), 0, .05, 0, O.hands[0]); add(box(.008, .14, .004), M(T.black), 0, .07, 0, O.hands[1]); }
    // ---- the woods (x=120): pines in the rain, four cabins, number 12 lit
    { const keep = (x, z) => !(Math.abs(x - X.woods) < 6.5 && z > -9 && z < 10) && !(z < -6 && z > -17 && x > X.woods - 13 && x < X.woods + 13);
      SETS.woods(PS1.scene, [X.woods - 22, X.woods + 22, -26, 14], 70, 41, { keep, pines: .8 });
      [[-14, -10.5, .35, 10], [-7, -12, .15, 11], [1, -12.5, 0, 12], [9, -11.5, -.25, 13]].forEach(([dx, z, ry, n]) => { const B = SETS.building('cabin', { at: [X.woods + dx, 0, z], ry, life: false }), G = B.G;
        const plate = add(new THREE.PlaneGeometry(.34, .22), M(PS1.tex(16, 10, q => { q.fillStyle = '#e8e3d6'; q.fillRect(0, 0, 16, 10); q.fillStyle = '#1a1a1a'; q.font = 'bold 8px Arial'; q.fillText(String(n), n > 9 ? 3 : 5, 8); }), { unlit: true, tint: '#b8b4a8' }), .2, 1.8, 2.67, G);
        if (n === 12) { const w = add(new THREE.PlaneGeometry(.78, .78), M(PS1.color('#e8c86a'), { unlit: true }), 1.6, 1.4, 2.665, G); w.userData.fx = 'glow'; R.c12 = G; } }); }
    O.rain = grp(X.woods, 0, -2); { const m = M(PS1.color('#9aa8c4'), { unlit: true }), r = PS1.rng(9); for (let i = 0; i < 520; i++) add(box(.008, .42, .008), m, (r() - .5) * 18, r() * 7, (r() - .5) * 22, O.rain).userData.noCheck = true; }
    O.rain2 = O.rain.clone(); PS1.scene.add(O.rain2);
    // ---- inside Cabin 12 (x=200): plank floor round a square hole, two floor doors, the well beneath with its stone lid, a lantern
    { const cx = X.cabin, wm = M(T.wood, SETS.DS), bm = M(T.boards, SETS.DS);
      for (const [x, z, w, d] of [[-1.3, 0, 1.4, 4], [1.3, 0, 1.4, 4], [0, -1.35, 1.2, 1.3], [0, 1.35, 1.2, 1.3]]) SETS.plane(w, d, bm, cx + x, 0, z, -Math.PI / 2, 0);
      SETS.plane(4, 2.4, wm, cx, 1.2, -2, 0, 0); SETS.plane(4, 2.4, wm, cx, 1.2, 2, 0, Math.PI); for (const s of [-1, 1]) SETS.plane(4, 2.4, wm, cx + s * 2, 1.2, 0, 0, -s * Math.PI / 2); SETS.plane(4, 4, M(T.ceil, SETS.DS), cx, 2.4, 0, Math.PI / 2, 0);
      const win = add(new THREE.PlaneGeometry(.7, .5), M(PS1.color('#1a2436'), { unlit: true }), cx - 1.99, 1.5, -.6); win.rotation.y = Math.PI / 2;
      O.doors = [-1, 1].map(s => { const pv = grp(cx + s * .6, 0, 0); add(box(.6, .04, 1.2), bm, -s * .3, .02, 0, pv); return { pv, s }; });
      add(cyl(.62, .62, 1.2, 8, true), M(T.stone, { side: THREE.DoubleSide }), cx, -.6, 0); add(new THREE.CircleGeometry(.6, 8), M(T.black), cx, -.9, 0).rotation.x = -Math.PI / 2;
      add(new THREE.RingGeometry(.56, .7, 8), M(T.stone), cx, -.02, 0).rotation.x = -Math.PI / 2; O.lid = add(cyl(.66, .66, .08, 8), M(T.stone), cx, .0, 0);
      O.hand = grp(cx - .5, -.01, .22); { const pm = M(PS1.color('#c8ccc4')); add(box(.11, .03, .13), pm, 0, 0, 0, O.hand); for (let k = 0; k < 4; k++) add(box(.022, .022, .1), pm, -.036 + k * .024, .008, .11, O.hand); O.hand.rotation.y = .9; O.hand.userData.noCheck = true; }
      O.lantern = grp(cx - .9, 1.95, -.7); add(box(.14, .2, .14), M(PS1.color('#3a3022')), 0, -.12, 0, O.lantern); const gl = add(box(.09, .12, .09), M(PS1.color('#ffc070'), { unlit: true }), 0, -.12, 0, O.lantern); gl.userData.fx = 'glow'; add(box(.01, .3, .01), M(T.black), 0, .1, 0, O.lantern);
      SETS.spaces.push({ kind: 'cabin', rect: [cx - 2, cx + 2, -2, 2], y0: 0, y1: 2.4, reverb: 'wooden', floor: 'wood' }); }
    // ---- down the well (x=240): the stone throat, the muddy bottom, the ring of light at the top
    { const g = cyl(.62, .62, 7, 8, true), n = g.attributes.normal; for (let i = 0; i < n.array.length; i++) n.array[i] *= -1; add(g, M(T.stone, { side: THREE.BackSide }), X.well, 3.5, 0);
      add(new THREE.CircleGeometry(.62, 8), M(T.mud), X.well, .01, 0).rotation.x = -Math.PI / 2;
      O.ring = add(new THREE.CircleGeometry(.6, 24), M(PS1.color('#f4f8ff'), { unlit: true, side: THREE.DoubleSide }), X.well, 6.9, 0); O.ring.rotation.x = Math.PI / 2; O.ring.userData.fx = 'glow';
      add(new THREE.CircleGeometry(.62, 24), M(T.black, { side: THREE.DoubleSide }), X.well + .32, 6.85, .1).rotation.x = Math.PI / 2;   // the lid, pushed most of the way over: a crescent of light
      SETS.spaces.push({ kind: 'well', rect: [X.well - .62, X.well + .62, -.62, .62], y0: 0, y1: 7, reverb: 'cellar', floor: 'concrete' }); }
    // ---- the well years ago (x=280): a stone well in a clearing at dusk
    { SETS.ground(40, 40, M(T.grass), X.past, .005, 0); add(cyl(.72, .78, .8, 8, true), M(T.stone, { side: THREE.DoubleSide }), X.past, .4, 0); add(new THREE.CircleGeometry(.66, 8), M(T.black), X.past, .3, 0).rotation.x = -Math.PI / 2;
      for (const [dx, dz, h, sd] of [[-6, -8, 8, 3], [5, -9, 9, 4], [-9, -2, 7, 5], [8, -3, 7.5, 6], [-3, -13, 10, 7]]) SETS.pineTree(X.past + dx, dz, h, PS1.scene, sd); }
    // ---- the people
    for (const [k, r] of Object.entries(CAST_)) { C[k] = CAST.make({ ...r, name: r.name }); LIGHTS.blob(C[k].G, .3); C[k].G.visible = false; }
    for (const k of Object.keys(CAST_)) CAM.mark(k, C[k]);
    O.torch = PROPS.make('flashlight', { at: [0, -50, 0] }); O.handset = PROPS.make('phone', { at: [0, -50, 0], color: '#d8d0bc' });
  },
  // everything that hangs on the narration's word times is set up here, once the timeline is loaded (the runner calls prepare after setTL)
  prepare(S) { if (S.prepared) return; S.prepared = true; const L = W_, H = X.home, A = X.apt, WD = X.woods, CB = X.cabin, e9 = EN('L9'), e10 = EN('L10');
    SH.pick = L('L3', 'someone', -.35); SH.dawn = [L('L8', 'thinks', -.25), L('L9', 'then', -.05)]; SH.tvOn = L('L9', 'tv', -.1); SH.out = e9 + .45; SH.drop = SH.out + .9; SH.floor = SH.out + 1.6; SH.rise = EN('L9b', -.2);
    // the reporter: on the sofa facing the TV; the call; in the woods and the cabin; at the window at dawn; back on the sofa for the loop
    const sofa = [H + 1.0, -1.45, 0]; SH.sofa = SETS.seatAt(H + 1.0, -1.6); SH.bed = SETS.seatAt(A - .5, -.3);
    SH.insert = L('L2', 'label', .2);
    BLOCK.reporter = [[-1, L('L2', 'videotape', -.3), ...sofa, sitTrack({})], [L('L2', 'videotape', -.3), L('L2', 'strange', -.2), H + .3, 1.18, 0, [{ at: 0, motion: 'idle', p: { seed: 4 }, face: 'neutral' }]],
      [L('L2', 'strange', -.2), SH.pick, ...sofa, sitTrack({})], [SH.pick, L('L5', null), ...sofa, sitTrack({ phone: true, face: 'scared' })],
      [L('L5', null), L('L5', 'exhusband', -.25), ...sofa, sitTrack({ face: 'neutral' })],
      [L('L6', 'clues', -.2), L('L6', 'floor', -.35), WD - .2, 2, Math.PI, (p, t, a) => { CAST.walkPath(p, t, [[a, V(WD - .2, 0, 2.2)], [L('L6', 'floor', -.35), V(WD - .1, 0, -6.6)]]); p.setFace('scared'); }],
      [L('L6', 'floor', -.35), L('L8', null), CB + .1, -1.35, 0, (p, t) => { const q = CAST.MOTIONS.idle(t, { seed: 3 }); q.head = [.45, .1 * Math.sin(t * .7), 0]; p.solve(q); p.setFace('scared'); p.animateFace(t); }],
      [SH.dawn[0], SH.dawn[1], H - 2.42, -.6, -Math.PI / 2, [{ at: 0, motion: 'idle', p: { seed: 5 }, face: 'neutral' }]],
      [e10 + .3, 1e9, ...sofa, (p, t) => { p.solve(sitQ(t - END())); p.setFace('neutral'); p.animateFace(t - END()); }]];
    BLOCK.ex = [[L('L5', 'exhusband', -.25), L('L5', 'clocks', -.2), A - .5, .0, .3, sitTrack({ seat: SH.bed })],
      [L('L9', 'then', -.05), SH.out, A - .5, .0, .3, (p, t) => { p.solve(sitQ(t, { seat: SH.bed })); p.setFace(t < SH.tvOn ? 'neutral' : 'scared'); p.animateFace(t); }],
      [SH.out, e10 + .3, A + .1, .5, .81, (p, t) => { const q = CAST.MOTIONS.idle(t, { seed: 2 }); q.handL = [-.2, 1.35, .22]; q.handR = [.2, 1.35, .22]; q.head = [-.1, 0, 0]; p.solve(q); p.setFace('screaming'); p.animateFace(t); }]];
    BLOCK.boy = [[W_('L5b', null, -.25), L('L6', 'clues', -.2), H + .3, .95, 0, sitTrack({ seat: SETS.seatAt(H + .3, .95), head: [-.1, 0, 0] })]];
    BLOCK.mother = [[W_('L7b', null, -.1), L('L7b', 'by', -.15), X.past, 1.0, Math.PI, (p, t) => { const q = CAST.MOTIONS.idle(t, { seed: 6 }); q.head = [.6, 0, 0]; q.spine = [.2, 0, 0]; p.solve(q); p.setFace('dead'); p.animateFace(t); }]];
    // the girl: at the bottom of the well years ago, looking up; then out of his TV, down to the floor, crawling, rising with the hair over her face
    BLOCK.girl = [[L('L7b', 'by', -.15), L('L8', null, -.15), X.well, 0, .4, (p, t) => { const q = CAST.MOTIONS.idle(t * .5, { seed: 8 }); q.head = [-.7, 0, 0]; p.solve(q); }],
      [SH.out, e10 + .3, A + 1.05, 1.0, Math.PI, (p, t) => { const G = p.G; G.rotation.order = 'YXZ'; G.userData.noSolidCheck = t < SH.floor;   // coming out of the screen she passes through the set on purpose
        const tq = Math.floor(t * 10) / 10, stand = CAST.MOTIONS.idle(t, { seed: 9 });
        stand.handL = [-.2, .55, .35]; stand.handR = [.2, .55, .35]; stand.head = [.3, 0, 0]; const crawlT = Math.max(0, tq - SH.floor), up = ss((t - SH.rise) / .9);
        if (tq < SH.drop) { const k = ss((tq - SH.out) / (SH.drop - SH.out)); G.position.set(A + 1.05, 1.02, lerp(3.45, 2.6, k)); G.rotation.x = 1.45; p.solve(stand); }
        else if (tq < SH.floor) { const k = ss((tq - SH.drop) / (SH.floor - SH.drop)); G.position.set(A + 1.05, lerp(1.02, 0, k), lerp(2.6, .95, k)); G.rotation.x = lerp(1.45, 0, k); p.solve(CAST.blend(stand, CAST.MOTIONS.crawl(0, {}), k)); }
        else { G.position.set(A + 1.05, 0, Math.max(.3, .95 - crawlT * .45)); G.rotation.x = 0; const s = CAST.MOTIONS.idle(t, { seed: 9 }); s.head = [.55, 0, 0]; s.handL = [-.22, .7, .12]; s.handR = [.22, .7, .12]; const c = CAST.MOTIONS.crawl(Math.min(crawlT, 1.56), {}); p.solve(up > 0 ? CAST.blend(c, s, up) : c); }
        p.setFace('dead'); }]];
    HOLD.push([L('L6', 'clues', -.2), L('L8', null), S.O.torch, C.reporter, 'R', [0, -.04, .06], [-Math.PI / 2, 0, 0]], [SH.pick, L('L5', null), S.O.handset, C.reporter, 'L', [0, -.05, .06], null]);
    // ---- light: a wet October night in the Pacific Northwest; one grey dawn; one dusk years ago
    const inDawn = t => t >= SH.dawn[0] && t < SH.dawn[1], inPast = t => t >= W_('L7b', null, -.1) && t < L('L7b', 'by', -.15);
    LIGHTS.sky({ time: t => inDawn(t) ? '07:10' : inPast(t) ? '19:20' : '23:58', date: '2002-10-18', place: 'seattle', weather: t => inPast(t) ? 'haze' : t >= L('L9', 'then', -.05) && t < e10 + .3 ? 'storm' : 'overcast', skylight: t => inDawn(t) ? -.6 : inPast(t) ? -.8 : -2.6, shadowSize: 30 });
    LIGHTS.atmosphere({ haze: t => t >= L('L6', 'clues', -.2) && t < L('L6', 'floor', -.35) ? .05 : inPast(t) ? .02 : .015, color: t => inDawn(t) ? '#a8a49a' : inPast(t) ? '#b89a7a' : '#0c1220' });
    // the TVs: her CRT's flicker, steady on frame 1 and in the tail so the loop's two ends match; his is dark until it turns itself on
    const tvAt = (tv, d) => { tv.updateMatrixWorld(true); return tv.localToWorld(V(-.05, .3, .6 + d)).toArray(); };
    LIGHTS.practical({ name: 'tv.home', fixture: 'tv', in: tvAt(R.home.tv, 0), stops: -.3, flicker: 'crt', on: [.6, SH.dawn[0]] });
    LIGHTS.practical({ name: 'tv.home.still', fixture: 'tv', in: tvAt(R.home.tv, 0), stops: -.3, on: [-1, .6] }); LIGHTS.practical({ name: 'tv.home.tail', fixture: 'tv', in: tvAt(R.home.tv, 0), stops: -.3, on: [e10 + .3, END() + 1] });
    LIGHTS.practical({ name: 'tv.apt', fixture: 'tv', in: tvAt(R.aptTv, 0), stops: .4, flicker: 'crt', on: [SH.tvOn + .05, e10 + .3] }); LIGHTS.practical({ name: 'tv.apt.watch', fixture: 'tv', in: tvAt(R.aptTv, 0), stops: .5, flicker: 'crt', on: [L('L5', 'exhusband', -.25), L('L5', 'clocks', -.2)] });
    LIGHTS.setup('moonlight', { subject: 'ex', facing: 60, stops: -.8, on: [SH.dawn[1], e10 + .3] });
    // Act 1 reads: a desk lamp on the wall of faces and the calendar, a key on him as he watches, a small light on the VCR as the tape goes in
    LIGHTS.practical({ name: 'desk.lamp', fixture: 'bulb', kelvin: 3200, in: [A - 1.55, 1.75, -.35], stops: .8, on: [L('L4', null, -.1), L('L5', null)] });
    LIGHTS.setup('rembrandt', { subject: 'ex', facing: 44, stops: -.6, on: [L('L5', 'exhusband', -.25), L('L5', 'clocks', -.2)] });
    LIGHTS.practical({ name: 'vcr.light', fixture: 'bulb', kelvin: 4500, in: [H + .15, 1.35, 1.35], stops: -1.2, on: [L('L2', 'videotape', -.3), L('L2', 'strange', -.2)] });
    LIGHTS.practical({ name: 'lightning', fixture: 'bulb', kelvin: 8000, in: [A + 3.4, 1.9, -.4], stops: 2.2, flicker: 'lightning', on: [L('L9', 'then', -.1), L('L9', 'tv', -.2)] });
    LIGHTS.practical({ name: 'street', fixture: 'bulb', kelvin: 2200, in: [A + 3.2, 2.2, -.4], stops: -.2, on: [L('L4', null), L('L5b', null)] });
    LIGHTS.practical({ name: 'dawn.window', fixture: 'softbox', kelvin: 5600, in: [H - 3.4, 1.5, -.6], stops: .2, on: SH.dawn });
    LIGHTS.practical({ name: 'cabin12', fixture: 'bulb', kelvin: 2400, in: [WD + 1.6, 1.4, -9.3], stops: .4, on: [L('L6', 'clues', -.3), L('L6', 'floor', -.35)] });
    LIGHTS.practical({ name: 'torch', fixture: 'bulb', kelvin: 4300, in: () => S.O.torch.getWorldPosition(V(0, 0, 0)).add(V(0, .1, -.4)), stops: -.8, on: [L('L6', 'clues', -.2), L('L8', null)] });
    LIGHTS.practical({ name: 'lantern', fixture: 'bulb', kelvin: 2400, in: () => S.O.lantern.localToWorld(V(0, -.12, 0)), stops: -.2, flicker: 'candle', on: [L('L6', 'floor', -.4), L('L8', 'thinks', -.25)] });
    LIGHTS.practical({ name: 'well.top', fixture: 'bulb', kelvin: 7000, in: [X.well, 6.5, 0], stops: -1.2, on: [W_('L7', null, -.2), L('L8', null, -.1)] });
    LIGHTS.setup('rembrandt', { subject: 'reporter', facing: 0, stops: -1.4, on: [SH.pick, L('L5', null)] });
    LIGHTS.setup('underlit', { subject: 'girl', facing: 180, stops: 0, on: [SH.out, e10 + .3] });
    LIGHTS.practical({ name: 'girl.fill', fixture: 'bulb', kelvin: 7500, in: [A + 1.0, .45, -1.0], stops: -.4, on: [SH.out, e10 + .3] });
    LIGHTS.setup('moonlight', { subject: 'mother', facing: 180, stops: -1.0, on: [W_('L7b', null, -.1), L('L7b', 'by', -.15)] });
  },
  shots: S => { const L = W_, H = X.home, A = X.apt, WD = X.woods, CB = X.cabin, WL = X.well, e = END(), e9 = EN('L9'), e10 = EN('L10');
    const at = (a, b) => ({ at: a, dur: Math.max(.2, b - a) }), dolly = (A_, B_, a, b, f = eio) => t => A_.clone().lerp(B_, f(clamp((t - a) / (b - a))));
    // the crane goes up over her head, then back (a curve through C1 in S01)
    const WIDE = V(H + 2.5, 1.75, -2.2), WIDE_LOOK = V(H + .4, .85, 1.2), crane = [.45, 2.2];
    return [
      { id: 'S01', ...at(0, L('L2', 'videotape', -.25)), lens: '35mm', stop: 'f/4', pos: t => { const k = eio(clamp((t - crane[0]) / (crane[1] - crane[0]))), u = 1 - k, C1 = V(H + .7, 2.15, -1.15); return CASE_POS.clone().multiplyScalar(u * u).add(C1.clone().multiplyScalar(2 * u * k)).add(WIDE.clone().multiplyScalar(k * k)); }, look: dolly(CASE_LOOK, WIDE_LOOK, ...crane), subject: t => t < 1.0 ? CASE.clone() : V(H + 1.0, 1.15, -1.45), size: 'INSERT', interior: 'living', ease: 'linear', note: 'the hook: the case opens under the title card, the crane up to the TV and her on the sofa' },
      { id: 'S02a', ...at(L('L2', 'videotape', -.25), SH.insert - .6), lens: '50mm', stop: 'f/4', pos: [H + .9, 1.5, 1.5], look: [H + .27, .99, 1.47], subject: [H + .27, .99, 1.43], size: 'INSERT', interior: 'living', note: 'the cassette in her hand: BLANK' },
      { id: 'S02', ...at(SH.insert - .6, L('L2', 'strange', -.2)), lens: '28mm', stop: 'f/4', pos: [H - 1.75, 1.55, .15], look: [H + .35, 1.05, 1.5], subject: 'reporter', size: 'MS', interior: 'living', note: 'she pushes a tape with no label slides into the VCR' },
      { id: 'S03', ...at(L('L2', 'strange', -.2), L('L3', 'phone', -.2)), lens: '50mm', stop: 'f/2.8', pos: dolly(V(H + .35, .77, .55), V(H + .35, .77, .78), L('L2', 'strange', -.2), L('L3', 'phone', -.2), x => x), look: [H + .35, .77, 1.65], subject: [H + .35, .77, 1.65], size: 'INSERT', interior: 'living', note: 'the pictures: a ladder, a fly, a burning tree, then the ring of light, unnarrated (the hidden clue)' },
      { id: 'S04', ...at(L('L3', 'phone', -.2), SH.pick), lens: '50mm', stop: 'f/2', pos: [H - 1.45, 1.0, -1.05], look: [H - .82, .66, -1.72], subject: [H - .82, .66, -1.72], size: 'INSERT', interior: 'living', note: 'the phone rings on the sofa arm' },
      { id: 'S05', ...at(SH.pick, L('L4', null)), stop: 'f/2', lens: '28mm', pos: [H - .45, 1.35, -.2], look: [H + 1.0, 1.1, -1.45], subject: 'reporter.head', size: 'MCU', interior: 'living', note: 'she listens, three-quarter, the phone at her ear: two words, held back' },
      { id: 'S06', ...at(L('L4', null), L('L4', 'week', -.3)), lens: '18mm', stop: 'f/4', pos: dolly(V(A + .2, .9, .9), V(A - .6, 1.05, .1), L('L4', null), L('L4', 'week', -.3), x => x), look: [A - 2.23, 1.45, -.9], subject: [A - 2.23, 1.5, -.9], size: 'WS', interior: 'bedroom', note: 'the wall of crossed-out faces' },
      { id: 'S07', ...at(L('L4', 'week', -.3), L('L5', null)), lens: '35mm', stop: 'f/4', pos: [A - 1.05, 1.5, .15], look: [A - 2.23, 1.5, .15], subject: [A - 2.23, 1.5, .15], size: 'INSERT', interior: 'bedroom', note: 'the calendar: day 7 circled' },
      { id: 'S08', ...at(L('L5', null), L('L5', 'exhusband', -.25)), lens: '28mm', stop: 'f/2.8', pos: [H + 2.45, 1.35, -.35], look: [H + 1.0, 1.0, -1.45], subject: 'reporter', size: 'MS', interior: 'living', note: 'she watches it, from behind' },
      { id: 'S09', ...at(L('L5', 'exhusband', -.25), L('L5', 'clocks', -.2)), lens: '28mm', stop: 'f/2.8', pos: [A + 1.45, 1.5, 1.45], look: [A - .5, 1.05, .0], subject: 'ex.face', size: 'MS', interior: 'bedroom', note: 'and so does he' },
      { id: 'S10', ...at(L('L5', 'clocks', -.2), W_('L5b', null, -.25)), lens: '50mm', stop: 'f/4', pos: [A + 1.0, 1.95, .9], look: [A + 2.22, 1.95, .9], subject: [A + 2.22, 1.95, .9], size: 'INSERT', interior: 'bedroom', note: 'the clock hand jumping' },
      { id: 'S11', ...at(W_('L5b', null, -.25), L('L5b', 'watches', -.2)), lens: '24mm', stop: 'f/2.8', pos: [H - 1.0, .95, -1.05], look: [H + .35, .6, 1.65], subject: 'boy', size: 'WS', interior: 'living', note: 'the boy alone at the TV' },
      { id: 'S12', ...at(L('L5b', 'watches', -.2), L('L6', 'clues', -.2)), lens: '35mm', stop: 'f/2.8', exposure: -.5, pos: dolly(V(H - 1.3, 1.0, 1.65), V(H - 1.15, .98, 1.6), L('L5b', 'watches', -.2), L('L6', 'clues', -.2), x => x), look: [H + .35, .7, 1.05], subject: 'boy.head', size: 'MS', handheld: 'calm', interior: 'living', note: 'over his shoulder: the pictures again' },
      { id: 'S13', ...at(L('L6', 'clues', -.2), L('L6', 'cabin', -.25)), lens: '24mm', stop: 'f/2.8', pos: dolly(V(WD + 1.1, 2.0, 4.6), V(WD + 1.2, 2.0, -3.6), L('L6', 'clues', -.2), L('L6', 'floor', -.35), x => x), look: dolly(V(WD - .3, 1.1, -.8), V(WD - .1, 1.1, -9), L('L6', 'clues', -.2), L('L6', 'floor', -.35), x => x), subject: 'reporter', size: 'WS', note: 'the woods in the rain, her torch' },
      { id: 'S14', ...at(L('L6', 'cabin', -.25), L('L6', 'floor', -.35)), lens: '35mm', stop: 'f/2.8', pos: [WD + 1.6, 1.6, -2.4], look: [WD + 1, 1.5, -9.3], subject: [WD + 1, 1.5, -9.3], size: 'WS', note: 'Cabin 12, its window lit' },
      { id: 'S15', ...at(L('L6', 'floor', -.35), L('L6', 'well', -.1)), lens: '35mm', stop: 'f/2.8', pos: [CB + .9, 1.6, 1.6], look: [CB, .5, -.6], subject: [CB, 0, 0], size: 'MS', interior: 'cabin', note: 'the floorboards come up' },
      { id: 'S16', ...at(L('L6', 'well', -.1), W_('L7', null, -.1)), lens: '35mm', stop: 'f/2.8', pos: [CB + .5, 1.35, 1.05], look: [CB, .1, -.5], subject: [CB, 0, 0], size: 'MCU', interior: 'cabin', note: 'the stone lid of an old well' },
      { id: 'S17', ...at(W_('L7', null, -.1), L('L7', 'long', -.35)), lens: '14mm', stop: 'f/5.6', pos: dolly(V(WL, .35, .02), V(WL, 1.2, .02), W_('L7', null, -.1), L('L7', 'long', -.35), x => x), look: [WL, 6.5, 0], subject: [WL, 6.9, 0], size: 'EWS', interior: 'well', note: 'down the well, the ring of light above' },
      { id: 'S18', ...at(L('L7', 'long', -.35), W_('L7b', null, -.1)), lens: '50mm', stop: 'f/2.8', pos: [CB - .05, .5, .78], look: [CB - .5, 0, .2], subject: [CB - .5, 0, .2], size: 'INSERT', interior: 'cabin', note: 'a small hand on the rim' },
      { id: 'S19', ...at(W_('L7b', null, -.1), L('L7b', 'by', -.15)), body: 'super8', lens: '8mm', stop: 'f/4', pos: [X.past + 1.6, 1.5, 3.4], look: [X.past, .9, .4], subject: 'mother', size: 'MS', handheld: 'nervous', note: 'years ago: the mother at the well (flashback)' },
      { id: 'S20', ...at(L('L7b', 'by', -.15), W_('L8', null, -.15)), lens: '24mm', stop: 'f/2.8', pos: dolly(V(WL + .1, 4.4, .14), V(WL + .1, 3.0, .12), L('L7b', 'by', -.15), W_('L8', null, -.15), x => x), look: [WL, .8, 0], subject: 'girl.head', size: 'WS', interior: 'well', note: 'the girl at the bottom, looking up' },
      { id: 'S21', ...at(W_('L8', null, -.15), SH.dawn[0]), lens: '28mm', stop: 'f/2.8', pos: [CB + 1.1, 1.2, 1.2], look: [CB, 0, 0], subject: [CB, 0, 0], size: 'MS', interior: 'cabin', note: 'the lid slams back on' },
      { id: 'S22', ...at(SH.dawn[0], SH.dawn[1]), lens: '35mm', stop: 'f/4', pos: [H - .9, 1.55, .9], look: [H - 2.45, 1.4, -.6], subject: 'reporter', size: 'MS', interior: 'living', note: 'dawn: she thinks it is over' },
      { id: 'S23', ...at(SH.dawn[1], SH.tvOn), lens: '24mm', stop: 'f/2.8', pos: [A - 1.9, 1.7, 1.4], look: [A + .3, .9, -.5], subject: 'ex', size: 'WS', interior: 'bedroom', note: 'his seventh night, the storm' },
      { id: 'S24', ...at(SH.tvOn, SH.out - .15), lens: '24mm', stop: 'f/2.8', pos: [A - 1.2, 1.6, -1.7], look: [A + 1.0, 1.1, 1.5], subject: [A + 1.05, 1.17, 1.42], size: 'MS', interior: 'bedroom', note: 'the TV turns itself on' },
      { id: 'S25', ...at(SH.out - .15, W_('L9b', null, .2)), lens: '18mm', stop: 'f/2', pos: [A + .95, .32, -1.25], look: [A + .85, .6, 1.3], subject: 'girl.head', size: 'MS', handheld: 'nervous', interior: 'bedroom', note: 'she comes out of the screen and crawls at the lens' },
      { id: 'S26', ...at(W_('L9b', null, .2), W_('L10', null, -.05)), lens: '24mm', stop: 'f/2', pos: [A + 1.95, .6, -.55], look: [A + 1.0, .35, .75], subject: 'girl.head', size: 'MCU', handheld: 'nervous', interior: 'bedroom', note: 'the giveaway: she crawls at the lens, hair over her face, through "Seven days."' },
      { id: 'S27', ...at(W_('L10', null, -.05), e10 + .3), lens: '24mm', stop: 'f/2.8', pos: [A - 1.7, 1.75, -1.7], look: [A + 1.0, .8, .6], subject: 'girl', size: 'WS', interior: 'bedroom', note: 'the room, her standing, him against the wall' },
      { id: 'S28', ...at(e10 + .3, e), lens: '35mm', stop: 'f/4', pos: CASE_POS.clone(), look: CASE_LOOK.clone(), subject: CASE.clone(), size: 'INSERT', interior: 'living', note: 'back to frame 1: the case snaps shut, the title card returns' },
    ]; },
  update(t, S) { const O = S.O, e10 = EN('L10'), tail = t >= e10 + .3, tl = tail ? t - END() : t, H = X.home;
    // the loop: from the cut back to the case the set's life runs on t - END, so the last frame matches frame 1
    SETS.tick(tl, S);
    for (const k of Object.keys(C)) if (C[k].recipe) { if (BLOCK[k]) perform(k, t); else C[k].G.visible = false; }
    holds(t);
    // the case: opens at once, shuts after the dip to black
    S.case.open(tail ? 1 - Math.pow(clamp((t - EN('L10', 1.25)) / .45), 2) : eio(clamp((t - .15) / .6)));
    // the TV picture
    const ends = W_('L3', 'ends'), pic = W_('L2', 'strange', -.1), tape = W_('L2', 'videotape', -.1), tvOn = SH.tvOn, out = SH.out;
    let kind = 'static', prog = 0; if (t >= SH.insert + .35 && t < pic) kind = 'blue'; else if (t >= pic && t < ends) { for (const [k, w] of [['ladder', 'ladder'], ['fly', 'fly'], ['tree', 'burning']]) if (t >= W_('L2', w, -.08)) kind = k; if (t >= EN('L2', -.1)) kind = t < EN('L2', .45) ? 'ring' : 'static'; }
    else if (t >= W_('L5', 'watches', -.1) && t < EN('L5', .1)) kind = ['fly', 'ladder', 'tree', 'static'][Math.floor((t - W_('L5', 'watches')) * 2.5) % 4];
    else if (t >= W_('L5b', 'watches', -.1) && t < W_('L6', 'clues', -.2)) kind = ['ladder', 'fly', 'tree', 'static'][Math.floor((t - W_('L5b', 'watches')) * 2.2) % 4];
    const his = t >= SH.dawn[1] && !tail; if (t >= SH.dawn[0] && t < SH.dawn[1]) kind = 'off'; if (his) { if (t < tvOn) kind = 'off'; else { const u = t - tvOn; kind = u < .3 ? 'flash' : t < out - .1 ? 'well' : t < out + .9 ? 'climb' : 'static'; prog = u < .3 ? u / .3 : (t - out + .1) / 1.0; } }
    SCREEN.draw(kind, tail ? 0 : t, prog); O.screenA.visible = his || (t >= W_('L5', 'exhusband', -.25) && t < W_('L5', 'clocks', -.2)); O.screenH.visible = !his || tail;
    // the tape slides into the VCR; the VCR's light
    // the cassette on a scripted path: on the table, then in front of her at chest height, up to the slot, slid in; her right hand rides its back end
    { const t0 = W_('L2', 'videotape', -.3), up = SH.insert - .5, tape = O.tape; tape.rotation.set(0, 0, 0);
      if (t < t0 || tail) { tape.position.set(X.home + .82, .425, -.55); tape.visible = true; }
      else { const a = eio(clamp((t - up) / .5)), k = eio(clamp((t - SH.insert) / .45)); tape.position.set(X.home + .27, lerp(.98, 1.045, a), t < SH.insert ? lerp(1.42, 1.56, a) : lerp(1.56, 1.8, k)); tape.visible = k < 1;
        if (t < SH.insert + .3 && C.reporter.G.visible) C.reporter.reach('R', tape.localToWorld(V(0, .02, -.1)), t < SH.insert ? 1 : 1 - clamp((t - SH.insert) / .3)); } }
    // the phone rings on the sofa arm
    const ring = W_('L3', 'phone', -.1), ringing = t > ring && t < SH.pick; O.phoneLed.visible = ringing && Math.floor(t * 8) % 2 === 0; O.phone.visible = !(t >= SH.pick && t < W_('L5', null));
    O.phone.rotation.z = ringing ? Math.sin(t * 80) * .03 : 0;
    // his clock: the second hand jumps
    O.hands[0].rotation.z = -(t * .05) - 1; O.hands[1].rotation.z = -Math.floor(t * 2) * (Math.PI / 30) * 6;
    // the rain over the woods: two sheets falling and wrapping
    const y = -((t * 7) % 7); O.rain.position.y = y; O.rain2.position.set(X.woods, y + 7, -2);
    // Cabin 12: the floor doors swing up, the lid scrapes aside; a hand on the rim; the lid slams back
    { const open = eio(clamp((t - W_('L6', 'floor', -.25)) / .6)); O.doors.forEach(d => d.pv.rotation.z = -d.s * 1.9 * open);
      const off = eio(clamp((t - W_('L6', 'well', -.15)) / .7)) * (1 - eio(clamp((t - W_('L8', null, -.05)) / .2)));
      O.lid.position.set(X.cabin + .95 * off, .02 * off, .35 * off); O.lid.rotation.z = -.12 * off; O.hand.visible = t > W_('L7', 'long', -.35) && t < W_('L7b', null, -.1); O.hand.position.y = -.01 + Math.sin(Math.floor(t * 8) / 8 * 3) * .004; }
    O.ring.material.uniforms.tint.value.setScalar(.85 + .15 * Math.sin(t * 6));
    O.lantern.rotation.z = Math.sin(t * 1.7) * .08; },
});
