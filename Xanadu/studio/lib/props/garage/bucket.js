// Metal bucket
PROPS.def({ id: 'bucket', name: 'Metal bucket', room: 'garage', era: ["any"], tags: ["container"], foley: 'metal',
  mass: 1.2, shape: { type: 'cylinder', r: .15, h: .3 }, center: [0, 0.15, 0], grip: [0, 0.36, 0],
  build(g, P, o) {
    P.cyl(g, .15, .12, .3, 10, P.col('#8a8e90', { side: THREE.DoubleSide }), 0, .15, 0); const h = PS1.add(new THREE.TorusGeometry(.15, .006, 3, 10, Math.PI), P.col('#4a4c50'), 0, .3, 0, g);
  } });
