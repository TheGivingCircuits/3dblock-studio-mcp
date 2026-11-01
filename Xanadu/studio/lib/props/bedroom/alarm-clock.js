// Alarm clock
PROPS.def({ id: 'alarm-clock', name: 'Alarm clock', room: 'bedroom', era: ["60s","70s","80s"], tags: ["small","appliance"], foley: 'metal',
  mass: 0.4, shape: { type: 'box', size: [.12, .14, .06] }, center: [0, 0.07, 0], grip: [0, 0.14, 0],
  build(g, P, o) {
    const m = P.col(o.color || '#b8bcc0'); P.cyl(g, .06, .06, .05, 10, m, 0, .07, 0).rotation.x = Math.PI / 2; P.cyl(g, .05, .05, .002, 10, P.tex('clock', 8, 8, q => { q.fillStyle = '#f0ece0'; q.fillRect(0, 0, 8, 8); q.fillStyle = '#1a1a1a'; q.fillRect(4, 1, 1, 4); q.fillRect(4, 4, 2, 1); }), 0, .07, .026).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) { P.cyl(g, .022, .022, .012, 8, m, s * .035, .135, 0).rotation.z = s * .5; P.box(g, .01, .02, .01, P.col('#2a2a2a'), s * .04, .01, 0); }
  } });
