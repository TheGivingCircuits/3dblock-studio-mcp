// Glass bottle
PROPS.def({ id: 'bottle', name: 'Glass bottle', room: 'kitchen', era: ["any"], tags: ["drink","glass","rolls"], foley: 'glass',
  mass: 0.45, shape: { type: 'cylinder', r: .035, h: .26 }, center: [0, 0.13, 0], grip: [0, 0.12, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#3a5a2a'); P.cyl(g, .035, .035, .17, 8, m, 0, .085, 0); P.cyl(g, .014, .033, .05, 8, m, 0, .195, 0); P.cyl(g, .013, .013, .04, 6, m, 0, .24, 0);
    P.cyl(g, .036, .036, .06, 8, P.label('bottle', 8, 4, '#e8dcb8', '#8a2a1a', '·', 4), 0, .09, 0);
  } });
