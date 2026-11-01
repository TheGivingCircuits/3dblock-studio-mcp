// Table lamp
PROPS.def({ id: 'lamp', name: 'Table lamp', room: 'living', era: ["any"], tags: ["light","furniture"], foley: 'thud',
  mass: 1.6, shape: { type: 'cylinder', r: .14, h: .5 }, center: [0, 0.25, 0], grip: [0, 0.25, 0],
  light: { fixture: 'table-lamp', at: [0, .4, 0] },
  build(g, P, o) {
    P.cyl(g, .08, .1, .04, 8, P.col('#6a4a2a'), 0, .02, 0); P.cyl(g, .015, .015, .3, 6, P.col('#a88a4a'), 0, .19, 0); P.cyl(g, .09, .15, .18, 8, P.col(o.color || '#e8d8b0', { unlit: !!o.on, side: THREE.DoubleSide }), 0, .41, 0);
  } });
