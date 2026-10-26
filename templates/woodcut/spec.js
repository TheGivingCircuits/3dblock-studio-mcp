// CONSPIRACY #__N__ — __TITLE__ (__YEAR__). Living woodcut broadsheet; the last line ("...look up.") loops back into the first.
// Replace the placeholder lines with the real script (11–13 lines, 60–75 s). Every line needs a visible beat in scene.js.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { n: __N__, title: '__TITLE__', year: __YEAR__ },
  size: [1080, 1920],
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.08 },   // "Diego" — the series voice; keep it
  lines: [
    { id: 'L1', at: .35, text: 'October first, eighteen ninety. A quiet town... just before dawn.' },
    { id: 'L2', gap: .3, text: 'Then a light rose over the rooftops... and nobody could explain it.' },
    { id: 'L3', gap: .6, text: 'So tomorrow, just before dawn... look up.' },
  ],
  tail: 1.2,
  loop: { fold: 2.6 },   // the audio tail crossfades onto the start, so the loop is seamless
  music: { prompt: 'Eerie mysterious documentary score: slow minor-key melody over a low unsettling synth drone, faint distant choir, soft ticking tension, conspiracy mystery mood, instrumental', gain: .46, duck: .2 },
  beds: [],   // e.g. { prompt, seconds, at: ['L6','word',-.15], until: ['L8','$end',.3], gain: .4, duck: .2, fadeIn: .1, fadeOut: 1.2 } for the climax
  sfx: {
    fold: ['pop-up book paper folding up, crisp paper snap', .6], whoosh: ['fast smooth cinematic whoosh', .8], bloop: ['soft deep magical pop as a glowing orb appears', .5],
    gasp: ['crowd of people gasping in shock together', 1.6], murmur: ['frightened crowd murmuring outside', 3], hum: ['deep eerie otherworldly humming drone, slowly pulsing, low frequency', 5],
    boom: ['distant deep boom like thunder', 2], wind: ['cold eerie wind gust through an empty street', 2.5], whisper: ['faint ghostly whisper breath', 1.2], heart: ['two slow deep heartbeats', 1.6],
    bell: ['single distant church bell toll with long ringing decay', 4],
  },
  cues: [
    ['bell', ['L1', null, -.3], .35], ['fold', ['L1', 'quiet', -.3], .55], ['fold', ['L1', 'quiet', .05], .45],
    ['murmur', ['L2', 'light', -.2], .3], ['bloop', ['L2', 'rose', -.1], .45], ['hum', ['L2', 'rose', -.2], .4], ['gasp', ['L2', 'nobody', -.1], .4],
    ['wind', ['L3', null, -.1], .35], ['fold', ['L3', 'look', -.6], .4], ['bell', ['L3', 'look', .05], .45],
  ],
};
