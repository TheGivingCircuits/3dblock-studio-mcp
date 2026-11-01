// Jerry can
PROPS.def({ id: 'gas-can', name: 'Jerry can', room: 'garage', era: ["any"], tags: ["fuel","heavy"], foley: 'metal',
  mass: 8, shape: { type: 'box', size: [.17, .34, .26] }, center: [0, 0.17, 0], grip: [0, 0.36, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#a82a1e'); P.box(g, .17, .32, .26, m, 0, .16, 0); for (const z of [-.07, 0, .07]) P.box(g, .12, .03, .025, m, 0, .345, z - .02); P.cyl(g, .02, .02, .05, 6, P.col('#3a3a3a'), 0, .35, .1);
  } });
