// Kitchen chair
PROPS.def({ id: 'chair', name: 'Kitchen chair', room: 'kitchen', era: ["any"], tags: ["furniture","seat","tips"], foley: 'wood',
  mass: 5, shape: { type: 'box', size: [.46, .9, .46] }, center: [0, 0.45, 0], grip: [0, 0.88, -0.2],
  seat: .45, seatAt: [0, .475, .02],
  build(g, P, o) {
    const m = P.col(o.color || '#6a4228'), d = P.col('#4a2a18'); P.box(g, .46, .05, .44, m, 0, .45, 0); P.box(g, .44, .4, .04, m, 0, .7, -.2); for (const [x, z] of [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]]) P.box(g, .04, .45, .04, d, x, .225, z);
    for (const y of [.62, .82]) P.box(g, .44, .04, .04, d, 0, y, -.2);
  } });
