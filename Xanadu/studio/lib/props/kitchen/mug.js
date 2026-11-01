// Diner mug
PROPS.def({ id: 'mug', name: 'Diner mug', room: 'kitchen', era: ["any"], tags: ["drink","small"], foley: 'ceramic',
  mass: 0.35, shape: { type: 'cylinder', r: .045, h: .1 }, center: [0, 0.05, 0], grip: [0, 0.05, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#c8b48a'); P.cyl(g, .045, .045, .1, 8, m, 0, .05, 0); P.cyl(g, .039, .039, .004, 8, P.col('#2a1a10'), 0, .097, 0);
    P.box(g, .014, .06, .012, m, .055, .05, 0); P.box(g, .02, .012, .012, m, .048, .076, 0); P.box(g, .02, .012, .012, m, .048, .024, 0);
  } });
