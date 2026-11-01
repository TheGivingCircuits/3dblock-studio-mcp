// Cereal box
PROPS.def({ id: 'cereal-box', name: 'Cereal box', room: 'kitchen', era: ["any"], tags: ["food","light"], foley: 'cardboard',
  mass: 0.4, shape: { type: 'box', size: [.2, .3, .07] }, center: [0, 0.15, 0], grip: [0, 0.15, 0],
  build(g, P, o) {
    P.box(g, .2, .3, .07, P.tex('cereal', 8, 12, q => { q.fillStyle = '#e8b830'; q.fillRect(0, 0, 8, 12); q.fillStyle = '#c42a1a'; q.fillRect(0, 0, 8, 3); q.fillStyle = '#f4f0e0'; q.fillRect(2, 5, 4, 4); q.fillStyle = '#8a5a2a'; q.fillRect(3, 6, 2, 2); }), 0, .15, 0);
  } });
