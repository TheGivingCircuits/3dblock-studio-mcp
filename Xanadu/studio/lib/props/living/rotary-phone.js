// Rotary desk phone
PROPS.def({ id: 'rotary-phone', name: 'Rotary desk phone', room: 'living', era: ["60s","70s","80s"], tags: ["phone"], foley: 'plastic',
  mass: 1.6, shape: { type: 'box', size: [.2, .12, .22] }, center: [0, 0.06, 0], grip: [0, 0.13, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#1a1a1c'); P.box(g, .2, .08, .22, m, 0, .04, 0); P.box(g, .16, .04, .16, m, 0, .09, -.01); const d = P.cyl(g, .055, .055, .01, 10, P.col('#d8d4cc'), 0, .1, .07); d.rotation.x = -.35;
    P.box(g, .05, .035, .22, m, 0, .125, -.02); for (const z of [-.1, .07]) P.box(g, .055, .045, .04, m, 0, .135, z);
  } });
