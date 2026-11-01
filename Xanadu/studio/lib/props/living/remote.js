// TV remote
PROPS.def({ id: 'remote', name: 'TV remote', room: 'living', era: ["80s","90s","00s"], tags: ["small"], foley: 'plastic',
  mass: 0.15, shape: { type: 'box', size: [.05, .025, .18] }, center: [0, 0.012, 0], grip: [0, 0.012, 0],
  build(g, P, o) {
    P.box(g, .05, .025, .18, P.col('#1e1e20'), 0, .012, 0); P.box(g, .036, .002, .12, P.tex('remote', 4, 10, q => { q.fillStyle = '#2a2a2c'; q.fillRect(0, 0, 4, 10); q.fillStyle = '#9a9a96'; for (let y = 3; y < 10; y += 2) for (let x = 0; x < 4; x += 2) q.fillRect(x, y, 1, 1); q.fillStyle = '#c42a1a'; q.fillRect(1, 0, 2, 1); }), 0, .026, .01);
  } });
