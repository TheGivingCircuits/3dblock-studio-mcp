// Flashlight
PROPS.def({ id: 'flashlight', name: 'Flashlight', room: 'garage', era: ["any"], tags: ["light","tool","small"], foley: 'metal',
  mass: 0.45, shape: { type: 'box', size: [.07, .06, .26] }, center: [0, .03, .02], grip: [0, 0, -0.05],
  light: { fixture: 'flashlight', at: [0, .028, .13], aim: [0, 0, 1] },
  build(g, P, o) {
    const a = new THREE.Group(); g.add(a); a.rotation.x = Math.PI / 2; a.position.y = .028; const m = P.col(o.color || '#2a2a2c');
    P.cyl(a, .022, .022, .18, 8, m, 0, -.03, 0); P.cyl(a, .036, .024, .06, 8, m, 0, .09, 0); P.cyl(a, .03, .03, .004, 8, P.col('#fff4c8', { unlit: true }), 0, .121, 0); P.box(a, .01, .03, .012, P.col('#c42a1a'), .022, -.01, 0);
  } });
