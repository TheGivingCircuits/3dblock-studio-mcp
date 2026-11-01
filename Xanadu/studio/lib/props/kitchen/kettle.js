// Stovetop kettle
PROPS.def({ id: 'kettle', name: 'Stovetop kettle', room: 'kitchen', era: ["any"], tags: ["cookware"], foley: 'metal',
  mass: 1.0, shape: { type: 'cylinder', r: .1, h: .2 }, center: [0, 0.1, 0], grip: [0, 0.24, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#c83a2a'); P.cyl(g, .07, .1, .14, 8, m, 0, .07, 0); P.cyl(g, .03, .07, .04, 8, m, 0, .16, 0); P.box(g, .15, .015, .015, P.col('#1a1a1a'), 0, .23, 0);
    for (const s of [-1, 1]) P.box(g, .015, .06, .015, P.col('#1a1a1a'), s * .07, .2, 0); const sp = P.cyl(g, .012, .02, .1, 6, m, .11, .11, 0); sp.rotation.z = -.9;
  } });
