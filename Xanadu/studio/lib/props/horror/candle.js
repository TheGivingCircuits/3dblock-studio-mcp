// Pillar candle
PROPS.def({ id: 'candle', name: 'Pillar candle', room: 'horror', era: ["any"], tags: ["light","horror","small"], foley: 'thud',
  mass: 0.3, shape: { type: 'cylinder', r: .03, h: .14 }, center: [0, 0.07, 0], grip: [0, 0.07, 0],
  light: { fixture: 'candle', at: [0, .15, 0] },
  build(g, P, o) {
    P.cyl(g, .03, .03, .12 * (o.height || 1), 8, P.col(o.color || '#ece4c8'), 0, .06 * (o.height || 1), 0); P.box(g, .004, .016, .004, P.col('#1a1a1a'), 0, .125 * (o.height || 1), 0);
    if (o.lit !== false) { const f = PS1.add(new THREE.ConeGeometry(.01, .03, 5), P.col('#ffb040', { unlit: true }), 0, .145 * (o.height || 1), 0, g); f.userData.fx = 'glow'; g.userData.flame = f; }
  } });
