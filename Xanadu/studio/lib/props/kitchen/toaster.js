// Chrome toaster
PROPS.def({ id: 'toaster', name: 'Chrome toaster', room: 'kitchen', era: ["50s","60s","70s","80s"], tags: ["appliance"], foley: 'metal',
  mass: 1.8, shape: { type: 'box', size: [.28, .2, .16] }, center: [0, 0.1, 0], grip: [0, 0.2, 0],
  build(g, P, o) {
    const m = P.col('#b8bcc0'); P.box(g, .28, .18, .16, m, 0, .1, 0); for (const z of [-.035, .035]) P.box(g, .2, .005, .025, P.col('#1a1a1a'), 0, .192, z); P.box(g, .02, .03, .02, P.col('#1a1a1a'), .15, .14, 0);
  } });
