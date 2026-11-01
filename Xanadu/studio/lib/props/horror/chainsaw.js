// Chainsaw
PROPS.def({ id: 'chainsaw', name: 'Chainsaw', room: 'horror', era: ["any"], tags: ["horror","weapon","tool","heavy"], foley: 'chainsaw',
  mass: 6, shape: { type: 'box', size: [.16, .26, .9] }, center: [0, 0.13, 0.25], grip: [0, 0.24, -0.05],
  sound: 'chainsaw idle and rev',
  build(g, P, o) {
    P.box(g, .14, .2, .32, P.col(o.color || '#c8501e'), 0, .1, 0); P.box(g, .15, .06, .2, P.col('#1a1a1a'), 0, .0, 0); P.box(g, .03, .1, .03, P.col('#1a1a1a'), 0, .24, .06); P.box(g, .03, .03, .2, P.col('#1a1a1a'), 0, .29, .06);
    g.userData.bar = P.box(g, .02, .07, .62, P.col('#a8acb0'), 0, .07, .47); P.box(g, .022, .012, .62, P.col('#3a3a3a'), 0, .105, .47);
  } });
