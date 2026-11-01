// COUNTDOWN TO STRANGE — #__NUMERAL__ __TITLE__ (__YEAR__). 16:9 long-form woodcut pop-up, narrated by "Graves". Not looped.
// Line 1 is the countdown number ("Number __NUMERAL__."), then the place, the date, the time of day. Every line needs a visible beat.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { n: '__NUMERAL__', title: '__TITLE__', year: __YEAR__ },
  size: [1920, 1080],
  voice: 'gAJKvlfm1lh6EiFbMzuL', model: 'eleven_v4', settings: { speed: .95, stability: .5, similarity_boost: .75, style: .15 },   // "Graves": hushed, slow — keep it
  lines: [
    { id: 'L1', at: 1.4, text: 'Number one.' },
    { id: 'L2', gap: .7, text: '__PLACE__.' },
    { id: 'L3', gap: .6, text: 'Just after dawn.' },
    { id: 'L4', gap: 1.0, text: 'And then something appeared in the sky.' },
  ],
  tail: 5.2,   // hold, fold back down to the paper, fade out
  music: { prompt: 'Eerie mysterious documentary score: slow minor-key melody over a low unsettling synth drone, faint distant choir, soft ticking tension, instrumental', gain: .42, duck: .22 },
  beds: [],
  sfx: {
    fold: ['pop-up book paper folding up, crisp paper snap', .6], whoosh: ['fast smooth cinematic whoosh', .8], bloop: ['soft deep magical pop as a glowing orb appears', .5],
    boom: ['distant deep boom like thunder', 2], wind: ['cold eerie wind gust through an empty street', 2.5], bell: ['single distant church bell toll with long ringing decay', 4],
  },
  cues: [
    ['wind', ['L1', null, -1.2], .3], ['fold', ['L1', 'number', -.3], .55], ['fold', ['L1', 'number', .05], .45], ['boom', ['L1', 'one', .05], .35],
    ['fold', ['L2', null, -.2], .45], ['bell', ['L2', null, .1], .4], ['fold', ['L3', 'just', -.3], .4], ['bloop', ['L4', 'appeared', -.1], .45],
    ['fold', ['L4', '$end', 1.4], .4], ['fold', ['L4', '$end', 2.5], .35],
  ],
};
