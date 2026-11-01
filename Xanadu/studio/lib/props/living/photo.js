// Framed photo
PROPS.def({ id: 'photo', name: 'Framed photo', room: 'living', era: ["any"], tags: ["clue","small"], foley: 'thud',
  mass: 0.3, shape: { type: 'box', size: [.13, .17, .03] }, center: [0, 0.085, 0], grip: [0, 0.16, 0],
  build(g, P, o) {
    P.box(g, .13, .17, .015, P.col('#5a3a24'), 0, .085, 0); P.box(g, .1, .14, .002, P.tex('photo:' + (o.seed || 0), 6, 8, q => { q.fillStyle = '#d8c8a0'; q.fillRect(0, 0, 6, 8); q.fillStyle = '#8a6a4a'; q.fillRect(2, 2, 2, 2); q.fillRect(1, 4, 4, 4); }), 0, .085, .009);
    const s = P.box(g, .04, .12, .01, P.col('#5a3a24'), 0, .06, -.04); s.rotation.x = .35;
  } });
