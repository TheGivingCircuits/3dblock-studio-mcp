// Flip phone
PROPS.def({ id: 'cell-phone', name: 'Flip phone', room: 'living', era: ["00s"], tags: ["phone","small"], foley: 'plastic',
  mass: 0.1, shape: { type: 'box', size: [.05, .02, .1] }, center: [0, 0.01, 0], grip: [0, 0.01, 0],
  build(g, P, o) {
    P.box(g, .05, .02, .1, P.col(o.color || '#8a8c90'), 0, .01, 0); P.box(g, .036, .002, .04, P.col('#7aa8c8', { unlit: true }), 0, .021, -.02);
  } });
