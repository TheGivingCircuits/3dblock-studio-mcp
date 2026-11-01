// Skull
PROPS.def({ id: 'skull', name: 'Skull', room: 'horror', era: ["any"], tags: ["horror","bone","rolls"], foley: 'bone',
  mass: 0.6, shape: { type: 'sphere', r: .09 }, center: [0, 0.09, 0], grip: [0, 0.16, 0],
  build(g, P, o) {
    const m = P.col('#e2dccb'); P.box(g, .14, .13, .16, m, 0, .1, 0); P.box(g, .1, .05, .06, m, 0, .03, .06); for (const s of [-1, 1]) P.box(g, .04, .035, .01, P.col('#1a1410'), s * .032, .1, .081); P.box(g, .02, .03, .01, P.col('#1a1410'), 0, .065, .081);
    for (let i = -2; i <= 2; i++) P.box(g, .012, .015, .005, P.col('#f4efe2'), i * .016, .035, .091);
  } });
