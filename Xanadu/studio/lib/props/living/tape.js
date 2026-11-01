// VHS tape
PROPS.def({ id: 'tape', name: 'VHS tape', room: 'living', era: ["80s","90s"], tags: ["tape","small","clue"], foley: 'plastic',
  mass: 0.25, shape: { type: 'box', size: [.1, .025, .19] }, center: [0, 0.0125, 0], grip: [0, 0.0125, 0],
  build(g, P, o) {
    P.box(g, .1, .025, .19, P.col('#141416'), 0, .0125, 0); P.box(g, .07, .002, .1, P.tex('vhs', 8, 10, q => { q.fillStyle = '#e8e2d2'; q.fillRect(0, 0, 8, 10); q.fillStyle = '#3a3a3a'; for (let y = 2; y < 9; y += 2) q.fillRect(1, y, 5 + (y % 4 ? 1 : 0), 1); }), 0, .026, .02);
    for (const s of [-1, 1]) P.cyl(g, .02, .02, .003, 8, P.col('#3a3a3c'), s * .025, .026, -.05);
  } });
