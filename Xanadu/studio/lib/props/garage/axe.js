// Woodsman axe
PROPS.def({ id: 'axe', name: 'Woodsman axe', room: 'garage', era: ["any"], tags: ["tool","weapon","horror"], foley: 'metal',
  mass: 2.2, shape: { type: 'box', size: [.2, .04, .8] }, center: [0, 0.02, 0], grip: [0, 0.02, -0.28],
  build(g, P, o) {
    P.box(g, .04, .035, .8, P.col('#9a7a4a'), 0, .018, 0); P.box(g, .18, .025, .1, P.col('#6a6c70'), .06, .018, .35); P.box(g, .02, .026, .14, P.col('#c8ccd0'), .15, .018, .35);
  } });
