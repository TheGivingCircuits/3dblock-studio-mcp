// Transistor radio
PROPS.def({ id: 'radio', name: 'Transistor radio', room: 'living', era: ["60s","70s"], tags: ["appliance","small"], foley: 'plastic',
  mass: 0.9, shape: { type: 'box', size: [.22, .13, .07] }, center: [0, 0.065, 0], grip: [0, 0.14, 0],
  build(g, P, o) {
    P.box(g, .22, .13, .07, P.col(o.color || '#2a6a5a'), 0, .065, 0); P.box(g, .1, .08, .002, P.tex('grille', 8, 6, q => { q.fillStyle = '#c8c0a8'; q.fillRect(0, 0, 8, 6); q.fillStyle = '#6a6458'; for (let y = 0; y < 6; y += 2) q.fillRect(0, y, 8, 1); }), -.04, .065, .036);
    P.cyl(g, .02, .02, .01, 8, P.col('#d8d0b8'), .06, .065, .036).rotation.x = Math.PI / 2; P.box(g, .18, .01, .01, P.col('#a8acb0'), 0, .15, 0);
  } });
