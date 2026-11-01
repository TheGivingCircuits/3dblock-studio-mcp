// COUNTDOWN TO STRANGE — #__NUMERAL__ __TITLE__ (__YEAR__), on the 16:9 woodcut engine (../../lib/woodcut-wide.js).
// See episodes/countdown-test-nuremberg/scene.js for a full worked segment (sky objects, battle, falls, smoke, crowd, held print).
const { P, lerp, eo, eio, back, clamp, rng, at, st, en, C } = WC;
const { INK, RED } = C;
const W = WC.W, H = WC.H;

function townArt() {   // the skyline card: 3840 x 537, ground line near y 420-475; keep landmarks in x 1300-2800
  const CW = 3840, CH = 537, c = WC.cnv(CW, CH), g = c.getContext('2d'), r = rng(500);
  let x = 6; while (x < CW - 40) { const w = 58 + r() * 46; WC.house(g, x, w, 60 + r() * 80, 450, (x | 0) + 7); x += w + 2; }
  WC.church(g, 1880, 60, 200, 450, 140, 540, C.STONE, C.ROOF);
  return WC.cutout(c, 7);
}

WC.episode({
  page: { title: '__TITLE__', subtitle: '__PLACE__ · MDCCC', colophon: '§ Countdown to Strange', initial: 'A' },
  countdown: { numeral: '__NUMERAL__', place: '__PLACE__', date: '__YEAR__', up: ['L1', 'number', -.25], down: ['L3', 'just', -.3], placeAt: ['L2', null, -.1] },
  open: ['L1', 'number', -.35], flapAt: ['L1', null, .6],
  sky: { stops: [[0, '#7f95b8'], [.45, '#b9c2d4'], [.72, '#e9c6a0'], [1, '#f2d07e']] },
  words: { what: ['What Was It?', 130, RED] },
  night: (t, S) => .85 * (1 - P(t, at('L3', 'just') - .3, 5)),
  build(S) {
    const O = S.O = {};
    O.town = S.card(townArt(), Math.round(WC.PH / 2 + 2.16 / WC.U), 2.6, { flat: true });
    O.light = S.sprite(WC.spriteTex(280, 280, g => WC.drawGlow(g, 120, '#ffd98a', 60), 0), 1, { tint: false, depthWrite: false, alphaTest: .02 });
  },
  shots: S => [
    [0, 1, [0, -18.3, 1.5], [0, -6.3, 1.4], 0],                         // the countdown card
    [st('L2') - .3, 2.6, [0, -19.6, 5.4], [0, -4.6, 1.5], 0],           // crane up: the town rises behind it
    [at('L3', 'just') - .3, 2.2, [0, -16.6, 2.5], [0, -1.6, 3.4], 0],   // the card folds away
    [at('L4', 'appeared') - .3, 1.4, [0, -15.6, 1.8], [0, -1.6, 5.0], 0],
  ],
  update(t, S) {
    const O = S.O;
    S.raise(O.town, st('L2') - .3, S.closeUp + .25);
    S.bill(O.light, 0, -1.5, 5, 0, back(P(t, at('L4', 'appeared') - .1, .4)) * (1 - P(t, S.closeUp - .2, .5)));
  },
  hud(t, S) { S.punch('what', at('L4', 'appeared'), en('L4') + .8, 190); },
});
