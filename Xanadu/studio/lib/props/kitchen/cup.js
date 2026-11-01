// Coffee cup
PROPS.def({ id: 'cup', name: 'Coffee cup', room: 'kitchen', era: ["any"], tags: ["drink","small"], foley: 'ceramic',
  mass: 0.25, shape: { type: 'cylinder', r: .042, h: .1 }, center: [0, 0.05, 0], grip: [0, 0.05, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#e8e4dc'); P.cyl(g, .045, .036, .1, 8, m, 0, .05, 0); P.cyl(g, .038, .038, .004, 8, P.col('#4a2a18'), 0, .096, 0);
    P.box(g, .012, .05, .03, m, .05, .055, 0);
  } });
