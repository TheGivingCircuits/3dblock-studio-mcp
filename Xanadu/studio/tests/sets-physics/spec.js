// STUDIO TEST 5: sets and physics (Phase 4 proof). A dressed 70s kitchen with the five-prop hand test and the physics beats, then a dressed
// country road with traffic. Every sound is already in the ElevenLabs cache (lib/sfx-index.json): nothing new is generated.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Studio Tests', n: 5, title: 'Sets and Physics Test', cut: null, year: null }, size: [1080, 1920], crf: 18, lines: [], tail: 60,
  sfx: { heat: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4], pickup: ['an old pickup truck racing past and speeding away on a country road', 3],
    van: ['an old 1970s van driving on a country road, steady engine rumble, rattling panels, wind', 4], road: ['a car driving on an empty country highway, steady engine hum, road noise and wind', 4],
    thud: ['one heavy dull thud, low and muffled', .8], door: ['an old wooden door creaking open in a derelict house', 2], ring: ['old 1990s cordless phone ringing twice, loud in a quiet room', 2.4],
    drop: ['a video camera dropping and clattering onto a hard floor, then static', 1.6], horn: ['a deep loud old truck horn blasting twice', 1.6], blip: ['short glitchy video tape distortion blip', .5] },
  cues: [...Array.from({ length: 10 }, (_, i) => ['heat', [null, i * 4], .08]), ...Array.from({ length: 6 }, (_, i) => ['heat', [null, 38 + i * 4], .3]),
    ['ring', [null, 9.2], .35], ['drop', [null, 14.05], .3], ['thud', [null, 26.4], .4], ['thud', [null, 33.4], .35], ['door', [null, 34.4], .5], ['thud', [null, 35.9], .6], ['thud', [null, 37.0], .25],
    ['pickup', [null, 39.3], .7], ['road', [null, 43.4], .5], ['van', [null, 48.2], .55], ['horn', [null, 49.6], .45], ['road', [null, 53.2], .45],
    ...[4, 34, 38].map(t => ['blip', [null, t - .05], .08])],
};
