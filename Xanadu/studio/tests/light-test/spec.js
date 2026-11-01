// STUDIO TEST 2: the light test (Phase 2 of the production suite). No narration; ambience that follows the clock, all from the cache.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Studio Tests', n: 2, title: 'Light Test', year: null },
  size: [1080, 1920], crf: 18,
  lines: [], tail: 60,
  sfx: { birds: ['early morning birds chirping softly after rain', 3], heat: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4],
    wind: ['cold wind gusting through bare trees at night', 3], crickets: ['desert crickets chirping at night, calm', 5], creak: ['old rope and wood creaking as something hangs and twists in the wind', 2.4],
    tvon: ['old CRT television turning on by itself with a thump, high-pitched whine and static', 1.6], static: ['old CRT television static hiss', 2], car: ['a car driving slowly on a gravel forest road, tyres on loose stones, engine hum', 4],
    thunder: ['a sudden close crack of thunder, then a deep rumble', 2.5] },
  cues: [['birds', [null, .2], .4], ['birds', [null, 3], .4], ['birds', [null, 6], .35], ...[11, 15, 19, 23].map(t => ['heat', [null, t], .3]), ['wind', [null, 28], .3], ['wind', [null, 31], .3],
    ['crickets', [null, 33], .35], ['crickets', [null, 37], .35], ['crickets', [null, 40], .3], ['creak', [null, 40.3], .5], ['creak', [null, 42.4], .45],
    ['tvon', [null, 45.05], .5], ['static', [null, 46.4], .3], ['static', [null, 48.2], .3], ['car', [null, 50.1], .55], ['crickets', [null, 51], .2],
    ['thunder', [null, 55.62], .7], ['thunder', [null, 57.22], .6], ['thunder', [null, 58.92], .7]],
};
