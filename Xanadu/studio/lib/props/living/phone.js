// Phone handset
PROPS.def({ id: 'phone', name: 'Phone handset', room: 'living', era: ["80s","90s","00s"], tags: ["phone","small"], foley: 'plastic',
  mass: 0.2, shape: { type: 'box', size: [.05, .03, .17] }, center: [0, 0.015, 0], grip: [0, 0.015, -0.02],
  build(g, P, o) {
    const m = P.col(o.color || '#2a2a2c'); P.box(g, .05, .028, .17, m, 0, .014, 0); P.box(g, .036, .002, .07, P.tex('keys', 4, 6, q => { q.fillStyle = '#5a5a5e'; q.fillRect(0, 0, 4, 6); q.fillStyle = '#c8c8c0'; for (let y = 0; y < 6; y += 2) for (let x = 0; x < 4; x += 2) q.fillRect(x, y, 1, 1); }), 0, .029, .015);
    P.box(g, .03, .002, .025, P.col('#6a8a6a', { unlit: true }), 0, .029, -.05); P.box(g, .008, .05, .008, m, .016, .05, .08);
  } });
