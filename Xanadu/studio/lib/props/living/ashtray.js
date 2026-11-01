// Glass ashtray
PROPS.def({ id: 'ashtray', name: 'Glass ashtray', room: 'living', era: ["60s","70s","80s"], tags: ["glass","small"], foley: 'glass',
  mass: 0.5, shape: { type: 'cylinder', r: .07, h: .03 }, center: [0, 0.015, 0], grip: [0.06, 0.015, 0],
  build(g, P, o) {
    P.cyl(g, .07, .065, .03, 8, P.col('#7a8a8a'), 0, .015, 0); P.cyl(g, .05, .05, .004, 8, P.col('#4a4a48'), 0, .031, 0); const c = P.box(g, .008, .008, .05, P.col('#e8e0d0'), .02, .036, 0); c.rotation.y = .6;
  } });
