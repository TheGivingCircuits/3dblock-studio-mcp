// Toolbox
PROPS.def({ id: 'toolbox', name: 'Toolbox', room: 'garage', era: ["any"], tags: ["tool","heavy"], foley: 'metal',
  mass: 6, shape: { type: 'box', size: [.45, .2, .2] }, center: [0, 0.1, 0], grip: [0, 0.24, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#b82a22'); P.box(g, .45, .18, .2, m, 0, .09, 0); P.box(g, .45, .02, .2, P.col('#8a1e18'), 0, .19, 0); P.box(g, .2, .02, .02, P.col('#2a2a2a'), 0, .23, 0); for (const s of [-1, 1]) P.box(g, .02, .04, .02, P.col('#2a2a2a'), s * .09, .21, 0);
  } });
