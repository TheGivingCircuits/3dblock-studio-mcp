// Wooden crate
PROPS.def({ id: 'crate', name: 'Wooden crate', room: 'garage', era: ["any"], tags: ["container","furniture"], foley: 'wood',
  mass: 8, shape: { type: 'box', size: [.5, .45, .5] }, center: [0, 0.225, 0], grip: [0, 0.45, 0],
  build(g, P, o) {
    P.box(g, .5, .45, .5, P.tex('crate', 8, 8, q => { q.fillStyle = '#8a6a40'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#5a4026'; q.fillRect(0, 0, 8, 1); q.fillRect(0, 7, 8, 1); q.fillRect(0, 0, 1, 8); q.fillRect(7, 0, 1, 8); for (let i = 1; i < 7; i++) q.fillRect(i, i, 1, 1); }), 0, .225, 0);
  } });
