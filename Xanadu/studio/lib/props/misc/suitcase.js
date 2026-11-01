// Suitcase
PROPS.def({ id: 'suitcase', name: 'Suitcase', room: 'misc', era: ["any"], tags: ["luggage","heavy"], foley: 'thud',
  mass: 7, shape: { type: 'box', size: [.65, .45, .18] }, center: [0, 0.225, 0], grip: [0, 0.48, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#6a4a30'); P.box(g, .65, .42, .18, m, 0, .21, 0); P.box(g, .66, .03, .185, P.col('#3a2a1a'), 0, .21, 0); P.box(g, .14, .025, .03, P.col('#2a1a10'), 0, .44, 0); for (const s of [-1, 1]) P.box(g, .04, .03, .19, P.col('#c8b06a'), s * .2, .3, 0);
  } });
