// Frying pan
PROPS.def({ id: 'pan', name: 'Frying pan', room: 'kitchen', era: ["any"], tags: ["cookware","weapon"], foley: 'metal',
  mass: 1.4, shape: { type: 'box', size: [.26, .05, .5] }, center: [0, 0.025, 0.1], grip: [0, 0.03, -0.1],
  build(g, P, o) {
    const m = P.col('#2a2a2c'); P.cyl(g, .13, .11, .045, 10, m, 0, .022, .1); P.cyl(g, .11, .11, .004, 10, P.col('#3a3a3e'), 0, .044, .1); P.box(g, .03, .025, .24, P.col('#1a1410'), 0, .035, -.13);
  } });
