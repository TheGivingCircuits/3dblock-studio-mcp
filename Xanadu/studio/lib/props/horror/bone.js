// Long bone
PROPS.def({ id: 'bone', name: 'Long bone', room: 'horror', era: ["any"], tags: ["horror","bone","small","rolls"], foley: 'bone',
  mass: 0.3, shape: { type: 'box', size: [.05, .04, .36] }, center: [0, 0.02, 0], grip: [0, 0.02, 0],
  build(g, P, o) {
    const m = P.col('#e2dccb'); P.box(g, .025, .025, .3, m, 0, .02, 0); for (const z of [-.16, .16]) for (const s of [-1, 1]) P.box(g, .03, .035, .04, m, s * .015, .02, z);
  } });
