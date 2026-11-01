// Coil of rope
PROPS.def({ id: 'rope', name: 'Coil of rope', room: 'garage', era: ["any"], tags: ["horror","tool"], foley: 'soft',
  mass: 1.5, shape: { type: 'cylinder', r: .17, h: .08 }, center: [0, 0.04, 0], grip: [0.15, 0.06, 0],
  build(g, P, o) {
    const m = P.col('#b89a5a'); for (let i = 0; i < 4; i++) { const t = PS1.add(new THREE.TorusGeometry(.13 - i * .012, .018, 4, 10), m, 0, .02 + i * .016, 0, g); t.rotation.x = Math.PI / 2; }
    P.box(g, .03, .03, .2, m, .14, .02, .1).rotation.y = .4;
  } });
