// Butcher knife
PROPS.def({ id: 'butcher-knife', name: 'Butcher knife', room: 'horror', era: ["any"], tags: ["horror","blade","weapon"], foley: 'metal',
  mass: 0.35, shape: { type: 'box', size: [.06, .02, .36] }, center: [0, 0.01, 0], grip: [0, 0.012, -0.1],
  build(g, P, o) {
    P.box(g, .026, .022, .12, P.col('#3a2418'), 0, .011, -.11); P.box(g, .06, .008, .22, P.col('#c8ccd0'), .012, .008, .06);
  } });
