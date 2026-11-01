// Key ring
PROPS.def({ id: 'keys', name: 'Key ring', room: 'misc', era: ["any"], tags: ["small","clue"], foley: 'metal',
  mass: 0.08, shape: { type: 'box', size: [.07, .01, .07] }, center: [0, 0.005, 0], grip: [0, 0.005, 0],
  build(g, P, o) {
    const m = P.col('#c8b06a'); const r = PS1.add(new THREE.TorusGeometry(.018, .003, 3, 8), P.col('#a8acb0'), 0, .004, 0, g); r.rotation.x = Math.PI / 2; for (const a of [.3, 1.4, 2.2]) { const k = P.box(g, .012, .004, .05, m, Math.cos(a) * .035, .004, Math.sin(a) * .035); k.rotation.y = -a + Math.PI / 2; }
  } });
