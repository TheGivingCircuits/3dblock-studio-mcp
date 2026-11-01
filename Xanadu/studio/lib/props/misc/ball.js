// Rubber ball
PROPS.def({ id: 'ball', name: 'Rubber ball', room: 'misc', era: ["any"], tags: ["toy","rolls","small"], foley: 'bounce',
  mass: 0.3, shape: { type: 'sphere', r: .1 }, center: [0, 0.1, 0], grip: [0, 0.1, 0],
  bounce: .7,
  build(g, P, o) {
    PS1.add(new THREE.IcosahedronGeometry(.1, 0), P.col(o.color || '#c83a2a'), 0, .1, 0, g);
  } });
