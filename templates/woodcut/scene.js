// CONSPIRACY #__N__ — __TITLE__ (__YEAR__), on the woodcut engine (/conspiracy/lib/woodcut.js — API in the /conspiracy skill's references/engine.md).
// This template renders as-is (a town, a crowd, one light in the sky) so the pipeline can be smoke-tested; replace it beat by beat.
// Reference episodes: episodes/phoenix-lights-1997/scene.js (modern, night) and ../sky-battle-1561.html (pre-engine, dawn).
const { P, lerp, eo, eio, back, clamp, rng, at, st, en, C } = WC;
const { INK, RED, BLUE, GREEN } = C;
const W = WC.W, H = WC.H;

// ---------- episode drawings (canvas 2D, woodcut style: wash colour first, ink outline on top) ----------
function townArt() {   // the skyline card: 1536x537 canvas = 7.44 x 2.6 world units; ground line near y 470; keep key buildings in x 330–1200 (on screen)
  const CW = 1536, CH = 537, c = WC.cnv(CW, CH), g = c.getContext('2d'), r = rng(500);
  let x = 6; while (x < CW - 40) { const w = 58 + r() * 46; WC.house(g, x, w, 60 + r() * 80, 450, (x | 0) + 7); x += w + 2; }
  WC.church(g, 720, 70, 180, 450, 140, 540, '#d9b98e', C.ROOF);
  const bank = [[0, CH], [0, 448], [700, 456], [CW, 446], [CW, CH]]; WC.wash(g, bank, GREEN, 610, .95, 3); WC.inkLine(g, bank.slice(1, -1), 4, INK, 612);
  return WC.cutout(c, 7);
}
const FOLK = [[250, 1520, false], [372, 1600, false], [470, 1500, false], [600, 1590, true], [700, 1505, true], [826, 1600, true], [935, 1520, true], [520, 1690, false]];
const DYES = ['#9c3a2a', '#3d5a7a', '#c9a640', '#4f7a5a', '#7a5236', '#6e2f45', '#7b7466', '#8a5a2b'];

WC.episode({
  page: { title: '__TITLE__', subtitle: 'Placeholder · MDCCCXC', colophon: '§ Printed for the curious.', initial: 'O' },
  open: ['L1', 'quiet', 0],            // the camera tilts down into the diorama on this word
  assets: {},                          // e.g. { photo: 'prints/real-photo.jpg' } → S.img.photo (only files the user approved)
  sky: { stops: [[0, '#8fa4c4'], [.5, '#b8c4d6'], [.8, '#e8c9a8'], [1, '#f0d79a']], print(g, w, h) { g.save(); g.translate(640, 380); WC.drawGlow(g, 90, C.OCHRE, 1); g.restore(); } },
  words: { light: ['A Light', 150, RED] },
  night: (t, S) => 1 - P(t, at('L1', 'dawn') - .2, 3),   // 1 = night, 0 = full daylight colours

  build(S) {
    const O = S.O = {};
    O.town = S.card(townArt(), 1300, 2.6, { flat: true });
    O.light = S.sprite(WC.spriteTex(280, 280, g => WC.drawGlow(g, 120, '#ffd98a', 9), 0), 1.0, { tint: false, depthWrite: false, alphaTest: .02 });
    O.crowd = FOLK.map(([px, py, flip], i) => S.doll({ px, py, flip, h: 2.15 + (i % 3) * .1, male: i % 2 === 0, dress: DYES[i], hat: i % 2 ? null : 'cap', hatCol: DYES[(i + 3) % 8], seed: 20 + i, nf: 3, pose: WC.poses('stand', 'point', 'handsUp') }));
  },
  prepare(S) { S.hits = [at('L2', 'rose')]; },
  shots: S => [   // [start, duration, camera position, look-at, roll] — each eases from the previous one
    [0, 1, [0, -15.6, 3.0], [0, -1.6, 3.0], 0],
    [at('L2', 'light') - .3, 1.4, [0, -14.6, 1.8], [0, -1.6, 5.4], 0],
  ],
  update(t, S) {
    const O = S.O;
    S.raise(O.town, S.open - .05, S.closeUp + .25);
    const k = back(P(t, at('L2', 'rose') - .1, .6)) * (1 - P(t, S.closeUp - .3, .5));
    S.bill(O.light, Math.sin(t * .7) * .3, -1.4, lerp(1.2, 5.2, eo(P(t, at('L2', 'rose'), 1.6))), 0, k * (.9 + .1 * Math.sin(t * 4)));
    O.crowd.forEach((d, i) => { S.hinge(d, at('L2', 'light') - .2 + i * .06); S.setTex(d, t > at('L2', 'rose') ? 1 + (i % 2) : 0); d.m.rotation.z = Math.sin(t * 1.2 + i) * .025; });
  },
  hud(t, S) { S.show('light', at('L2', 'light') - .05, en('L2') + .3, 420); },
});
