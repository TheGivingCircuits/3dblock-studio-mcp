// Meat cleaver
PROPS.def({ id: 'cleaver', name: 'Meat cleaver', room: 'horror', era: ["any"], tags: ["horror","blade","weapon"], foley: 'metal',
  mass: 0.8, shape: { type: 'box', size: [.1, .02, .3] }, center: [0, 0.01, 0], grip: [0, 0.012, -0.08],
  build(g, P, o) {
    P.box(g, .026, .024, .12, P.col('#2a1a10'), 0, .012, -.09); P.box(g, .1, .01, .17, P.col('#a8acb0'), .03, .008, .06);
  } });
