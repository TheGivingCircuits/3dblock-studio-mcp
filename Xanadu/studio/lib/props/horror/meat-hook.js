// Meat hook
PROPS.def({ id: 'meat-hook', name: 'Meat hook', room: 'horror', era: ["any"], tags: ["horror","metal"], foley: 'metal',
  mass: 0.5, shape: { type: 'box', size: [.04, .25, .1] }, center: [0, 0.12, 0], grip: [0, 0.24, 0],
  build(g, P, o) {
    const m = P.col('#7a6a5a'); P.box(g, .015, .12, .015, m, 0, .18, 0); const h = PS1.add(new THREE.TorusGeometry(.04, .008, 3, 8, Math.PI * 1.3), m, 0, .08, 0, g); h.rotation.z = Math.PI * .85;
  } });
