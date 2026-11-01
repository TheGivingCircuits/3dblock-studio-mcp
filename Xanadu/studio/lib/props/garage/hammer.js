// Claw hammer
PROPS.def({ id: 'hammer', name: 'Claw hammer', room: 'garage', era: ["any"], tags: ["tool","weapon"], foley: 'metal',
  mass: 0.7, shape: { type: 'box', size: [.12, .03, .33] }, center: [0, 0.015, 0], grip: [0, 0.015, -0.1],
  build(g, P, o) {
    P.box(g, .03, .028, .3, P.col('#8a6a3a'), 0, .014, -.02); P.box(g, .12, .028, .03, P.col('#4a4c50'), 0, .014, .14); P.box(g, .04, .02, .03, P.col('#4a4c50'), -.07, .02, .14);
  } });
