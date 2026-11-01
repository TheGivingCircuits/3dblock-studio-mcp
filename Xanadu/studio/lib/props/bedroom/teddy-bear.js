// Teddy bear
PROPS.def({ id: 'teddy-bear', name: 'Teddy bear', room: 'bedroom', era: ["any"], tags: ["toy","soft","creepy"], foley: 'soft',
  mass: 0.4, shape: { type: 'box', size: [.2, .28, .16] }, center: [0, 0.14, 0], grip: [0, 0.24, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#8a5a32'); P.box(g, .16, .14, .12, m, 0, .08, 0); P.box(g, .12, .11, .1, m, 0, .2, 0); for (const s of [-1, 1]) { P.box(g, .04, .04, .02, m, s * .05, .27, 0); P.box(g, .05, .1, .05, m, s * .1, .1, .02); P.box(g, .05, .05, .09, m, s * .05, .03, .06); P.box(g, .015, .015, .005, P.col('#1a1a1a'), s * .025, .215, .051); }
    P.box(g, .04, .03, .02, P.col('#c8a880'), 0, .19, .055);
  } });
