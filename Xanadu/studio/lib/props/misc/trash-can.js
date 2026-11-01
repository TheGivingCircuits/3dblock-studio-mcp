// Metal trash can
PROPS.def({ id: 'trash-can', name: 'Metal trash can', room: 'misc', era: ["any"], tags: ["container","outdoor"], foley: 'metal',
  mass: 6, shape: { type: 'cylinder', r: .26, h: .75 }, center: [0, 0.375, 0], grip: [0, 0.8, 0],
  build(g, P, o) {
    const m = P.col('#8a8e90'); P.cyl(g, .26, .24, .72, 10, m, 0, .36, 0); P.cyl(g, .28, .28, .05, 10, m, 0, .75, 0); P.box(g, .1, .03, .03, P.col('#4a4c50'), 0, .79, 0);
  } });
