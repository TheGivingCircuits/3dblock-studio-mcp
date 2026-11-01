// Audio cassette
PROPS.def({ id: 'cassette', name: 'Audio cassette', room: 'living', era: ["70s","80s","90s"], tags: ["tape","small"], foley: 'plastic',
  mass: 0.05, shape: { type: 'box', size: [.1, .012, .064] }, center: [0, 0.006, 0], grip: [0, 0.006, 0],
  build(g, P, o) {
    P.box(g, .1, .012, .064, P.col('#2a2a2c'), 0, .006, 0); P.box(g, .08, .002, .04, P.tex('cass', 8, 4, q => { q.fillStyle = '#e8d8b0'; q.fillRect(0, 0, 8, 4); q.fillStyle = '#c84a2a'; q.fillRect(0, 0, 8, 1); q.fillStyle = '#1a1a1a'; q.fillRect(2, 2, 1, 1); q.fillRect(5, 2, 1, 1); }), 0, .013, 0);
  } });
