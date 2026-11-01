// Crowbar
PROPS.def({ id: 'crowbar', name: 'Crowbar', room: 'garage', era: ["any"], tags: ["tool","weapon"], foley: 'metal',
  mass: 1.6, shape: { type: 'box', size: [.05, .03, .6] }, center: [0, 0.015, 0], grip: [0, 0.015, -0.15],
  build(g, P, o) {
    const m = P.col('#2a2a2c'); P.box(g, .025, .025, .55, m, 0, .013, 0); const h = P.box(g, .025, .025, .08, m, 0, .03, .29); h.rotation.x = -.8;
  } });
