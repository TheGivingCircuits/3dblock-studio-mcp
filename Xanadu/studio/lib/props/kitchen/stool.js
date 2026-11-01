// Bar stool
PROPS.def({ id: 'stool', name: 'Bar stool', room: 'kitchen', era: ["any"], tags: ["furniture","seat","tips"], foley: 'metal',
  mass: 3.5, shape: { type: 'cylinder', r: .18, h: .7 }, center: [0, 0.35, 0], grip: [0, 0.68, 0],
  seat: .72, seatAt: [0, .72, 0],
  build(g, P, o) {
    P.cyl(g, .18, .18, .06, 8, P.col(o.color || '#a82a22'), 0, .69, 0); P.cyl(g, .03, .03, .64, 6, P.col('#a8acb0'), 0, .33, 0); P.cyl(g, .2, .22, .03, 8, P.col('#7a7e82'), 0, .015, 0);
  } });
