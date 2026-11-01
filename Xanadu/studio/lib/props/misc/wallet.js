// Wallet
PROPS.def({ id: 'wallet', name: 'Wallet', room: 'misc', era: ["any"], tags: ["small","clue"], foley: 'soft',
  mass: 0.12, shape: { type: 'box', size: [.1, .02, .08] }, center: [0, 0.01, 0], grip: [0, 0.01, 0],
  build(g, P, o) {
    P.box(g, .1, .02, .08, P.col(o.color || '#4a2a18'), 0, .01, 0); P.box(g, .002, .021, .08, P.col('#2a1a10'), 0, .01, 0);
  } });
