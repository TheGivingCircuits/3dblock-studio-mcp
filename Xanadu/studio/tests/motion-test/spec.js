// STUDIO TEST 4b: the motion test (Phase 3). Every motion in lib/cast/motion.js on one character, labelled; ambience from the cache only.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Studio Tests', n: 4, title: 'Motion Test', cut: null, year: null }, size: [1080, 1920], crf: 18, lines: [], tail: 60,
  sfx: { heat: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4], blip: ['short glitchy video tape distortion blip', .5] },
  cues: [...Array.from({ length: 15 }, (_, i) => ['heat', [null, i * 4], .25]), ...Array.from({ length: 20 }, (_, i) => ['blip', [null, i * 3 - .05], .08]).slice(1)],
};
