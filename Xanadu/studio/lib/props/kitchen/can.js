// Soda can
PROPS.def({ id: 'can', name: 'Soda can', room: 'kitchen', era: ["any"], tags: ["drink","small","rolls"], foley: 'metal',
  mass: 0.37, shape: { type: 'cylinder', r: .033, h: .12 }, center: [0, 0.06, 0], grip: [0, 0.06, 0],
  build(g, P, o) {
    P.cyl(g, .033, .033, .12, 8, P.label('can', 8, 8, o.color || '#b02a22', '#f0e8e0', '~', 6), 0, .06, 0); P.cyl(g, .028, .028, .004, 8, P.col('#a8acb0'), 0, .121, 0);
  } });
