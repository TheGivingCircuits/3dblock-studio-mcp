// Oil drum
PROPS.def({ id: 'barrel', name: 'Oil drum', room: 'garage', era: ["any"], tags: ["container","heavy","rolls"], foley: 'metal',
  mass: 18, shape: { type: 'cylinder', r: .29, h: .88 }, center: [0, 0.44, 0], grip: [0, 0.88, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#3a5a7a'); P.cyl(g, .29, .29, .88, 10, m, 0, .44, 0); for (const y of [.3, .6]) P.cyl(g, .3, .3, .03, 10, P.col('#2a3a4a'), 0, y, 0); P.cyl(g, .27, .27, .004, 10, P.col('#4a4a48'), 0, .882, 0);
  } });
