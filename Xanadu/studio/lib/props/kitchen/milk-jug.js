// Milk jug
PROPS.def({ id: 'milk-jug', name: 'Milk jug', room: 'kitchen', era: ["any"], tags: ["food","drink"], foley: 'plastic',
  mass: 2.0, shape: { type: 'box', size: [.14, .26, .14] }, center: [0, 0.13, 0], grip: [0, 0.24, 0],
  build(g, P, o) {
    const m = P.col('#f0eee6'); P.box(g, .14, .2, .14, m, 0, .1, 0); P.box(g, .1, .05, .1, m, 0, .225, 0); P.cyl(g, .018, .018, .03, 6, P.col('#2a6ac8'), 0, .265, 0); P.box(g, .02, .1, .04, m, .08, .16, 0);
  } });
