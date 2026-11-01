// STUDIO TEST 1: the lens test (Phase 2 of the production suite). No narration; ambience and a slate blip on each lens, all from the cache.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Studio Tests', n: 1, title: 'Lens Test', year: null },
  size: [1080, 1920], crf: 18,
  lines: [], tail: 60,   // no narration: the test runs 60 s
  sfx: { birds: ['daytime forest ambience, birdsong and wind in tall trees', 4], blip: ['short glitchy video tape distortion blip', .5] },
  cues: [...Array.from({ length: 15 }, (_, i) => ['birds', [null, i * 4], .3]), ...Array.from({ length: 38 }, (_, i) => ['blip', [null, 1.5 + i * 1.5 - .05], .1])],
};
