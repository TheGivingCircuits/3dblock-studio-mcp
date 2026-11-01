// Diary
PROPS.def({ id: 'diary', name: 'Diary', room: 'bedroom', era: ["any"], tags: ["paper","clue","small"], foley: 'paper',
  mass: 0.3, shape: { type: 'box', size: [.13, .03, .18] }, center: [0, 0.015, 0], grip: [0.05, 0.015, 0],
  build(g, P, o) {
    P.box(g, .13, .03, .18, P.col(o.color || '#7a3a5a'), 0, .015, 0); P.box(g, .12, .024, .172, P.col('#ece4cc'), .005, .015, 0); P.box(g, .02, .032, .02, P.col('#c8a84a'), .066, .016, 0);
  } });
