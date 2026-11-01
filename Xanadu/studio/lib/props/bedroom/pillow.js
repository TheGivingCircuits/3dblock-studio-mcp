// Pillow
PROPS.def({ id: 'pillow', name: 'Pillow', room: 'bedroom', era: ["any"], tags: ["soft"], foley: 'soft',
  mass: 0.6, shape: { type: 'box', size: [.5, .12, .32] }, center: [0, 0.06, 0], grip: [0.2, 0.06, 0],
  build(g, P, o) {
    P.box(g, .5, .1, .32, P.col(o.color || '#e8e4da'), 0, .05, 0); P.box(g, .44, .03, .26, P.col(o.color || '#e8e4da'), 0, .1, 0);
  } });
