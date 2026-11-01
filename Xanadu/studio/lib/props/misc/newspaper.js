// Folded newspaper
PROPS.def({ id: 'newspaper', name: 'Folded newspaper', room: 'misc', era: ["any"], tags: ["paper","clue"], foley: 'paper',
  mass: 0.3, shape: { type: 'box', size: [.3, .02, .4] }, center: [0, 0.01, 0], grip: [0.12, 0.01, 0],
  build(g, P, o) {
    P.box(g, .3, .018, .4, P.tex('news', 8, 10, q => { q.fillStyle = '#e4dcc8'; q.fillRect(0, 0, 8, 10); q.fillStyle = '#2a2a2a'; q.fillRect(0, 1, 8, 1); for (let y = 3; y < 10; y++) { q.fillRect(0, y, 3, 1); q.fillRect(4, y, 4, 1); y++; } q.fillStyle = '#8a8a86'; q.fillRect(4, 3, 3, 3); }), 0, .009, 0);
  } });
