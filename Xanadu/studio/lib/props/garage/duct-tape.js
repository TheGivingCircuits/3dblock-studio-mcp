// Roll of duct tape
PROPS.def({ id: 'duct-tape', name: 'Roll of duct tape', room: 'garage', era: ["any"], tags: ["tool","small","rolls"], foley: 'soft',
  mass: 0.3, shape: { type: 'cylinder', r: .06, h: .05 }, center: [0, 0.025, 0], grip: [0, 0.025, 0],
  build(g, P, o) {
    const t = PS1.add(new THREE.TorusGeometry(.048, .016, 4, 10), P.col('#9a9c9e'), 0, .025, 0, g); t.rotation.x = Math.PI / 2; t.scale.z = 1.6;
  } });
