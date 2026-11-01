// Kitchen knife
PROPS.def({ id: 'knife', name: 'Kitchen knife', room: 'kitchen', era: ["any"], tags: ["blade","weapon","small"], foley: 'metal',
  mass: 0.15, shape: { type: 'box', size: [.03, .02, .3] }, center: [0, 0.01, 0.02], grip: [0, 0.012, -0.08],
  build(g, P, o) {
    P.box(g, .022, .02, .11, P.col('#2a1a10'), 0, .01, -.08); P.box(g, .03, .02, .01, P.col('#a8acb0'), 0, .01, -.02); P.box(g, .028, .006, .18, P.col('#c8ccd0'), 0, .008, .07);
    P.box(g, .012, .006, .04, P.col('#c8ccd0'), -.008, .008, .17);
  } });
