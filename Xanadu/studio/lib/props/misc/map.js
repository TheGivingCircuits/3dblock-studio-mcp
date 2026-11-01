// Road map
PROPS.def({ id: 'map', name: 'Road map', room: 'misc', era: ["any"], tags: ["paper","clue"], foley: 'paper',
  mass: 0.2, shape: { type: 'box', size: [.5, .01, .35] }, center: [0, 0.005, 0], grip: [0.2, 0.005, 0],
  build(g, P, o) {
    P.box(g, .5, .006, .35, P.tex('map', 12, 8, q => { q.fillStyle = '#e8e0c4'; q.fillRect(0, 0, 12, 8); q.fillStyle = '#7aa86a'; q.fillRect(0, 0, 4, 3); q.fillRect(8, 5, 4, 3); q.fillStyle = '#c42a1a'; for (let x = 0; x < 12; x++) q.fillRect(x, 4 + Math.round(Math.sin(x * .8)), 1, 1); q.fillStyle = '#4a7ab0'; q.fillRect(6, 0, 1, 8); }), 0, .003, 0);
  } });
