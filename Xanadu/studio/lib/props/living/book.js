// Hardback book
PROPS.def({ id: 'book', name: 'Hardback book', room: 'living', era: ["any"], tags: ["paper","small"], foley: 'paper',
  mass: 0.6, shape: { type: 'box', size: [.16, .04, .23] }, center: [0, 0.02, 0], grip: [0.06, 0.02, 0],
  build(g, P, o) {
    P.box(g, .16, .04, .23, P.col(o.color || '#6a2a22'), 0, .02, 0); P.box(g, .15, .032, .222, P.col('#e8e0c8'), .006, .02, 0);
  } });
