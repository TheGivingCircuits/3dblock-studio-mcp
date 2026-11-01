// Old tyre
PROPS.def({ id: 'tire', name: 'Old tyre', room: 'garage', era: ["any"], tags: ["junk","rolls"], foley: 'rubber',
  mass: 9, shape: { type: 'cylinder', r: .33, h: .2 }, center: [0, 0.1, 0], grip: [0.3, 0.15, 0],
  build(g, P, o) {
    const t = PS1.add(new THREE.TorusGeometry(.26, .08, 5, 10), P.col('#151515'), 0, .1, 0, g); t.rotation.x = Math.PI / 2; t.scale.z = 1.25;
  } });
