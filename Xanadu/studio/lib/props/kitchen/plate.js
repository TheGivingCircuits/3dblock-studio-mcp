// Dinner plate
PROPS.def({ id: 'plate', name: 'Dinner plate', room: 'kitchen', era: ["any"], tags: ["dish","flat"], foley: 'ceramic',
  mass: 0.4, shape: { type: 'cylinder', r: .12, h: .02 }, center: [0, 0.01, 0], grip: [0.11, 0.01, 0],
  build(g, P, o) {
    P.cyl(g, .125, .09, .02, 10, P.col(o.color || '#ece8de'), 0, .01, 0); P.cyl(g, .085, .085, .004, 10, P.col('#d8d2c4'), 0, .021, 0);
  } });
