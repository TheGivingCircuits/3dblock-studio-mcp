// CRT television
PROPS.def({ id: 'tv', name: 'CRT television', room: 'living', era: ["70s","80s","90s"], tags: ["appliance","heavy"], foley: 'heavy',
  mass: 22, shape: { type: 'box', size: [.62, .5, .5] }, center: [0, 0.25, 0], grip: [0, 0.5, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#4a3424'); P.box(g, .62, .5, .5, m, 0, .25, 0); P.box(g, .46, .34, .02, P.col('#1a2226', { unlit: !!o.on }), -.05, .27, .251); P.box(g, .08, .34, .02, P.col('#2a2a2a'), .25, .27, .251);
    for (const y of [.36, .3]) P.cyl(g, .018, .018, .02, 6, P.col('#c8c0a8'), .25, y, .26).rotation.x = Math.PI / 2; for (const s of [-1, 1]) { const a = P.box(g, .006, .4, .006, P.col('#a8acb0'), s * .1, .65, -.1); a.rotation.z = s * -.5; }
  } });
