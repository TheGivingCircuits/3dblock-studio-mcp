// __SERIES__ #__N__ — "__TITLE__". Script + sound for the PS1 engine. Replace the placeholder lines with the real script
// (11–14 lines, 61–75 s spoken). Every line needs a visible beat in scene.js. Lines are spoken by ElevenLabs and cached by hash.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: '__SERIES__', n: __N__, title: '__TITLE__', year: __YEAR__ },
  size: [1080, 1920], crf: 21,
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v3', settings: { speed: 1.06 },   // any ElevenLabs voice id (list_voices)
  lines: [
    { id: 'L1', at: .35, text: 'Can you guess this horror movie...?' },
    { id: 'L2', gap: .35, text: 'A quiet house. A television that will not turn off.' },
    { id: 'L3', gap: .4, text: 'And every night, at midnight... the static gets a little louder.' },
    { id: 'L4', gap: .45, text: 'Do you know what movie this is...?' },
  ],
  tail: 2.2,
  loop: { fold: 2.6 },   // the audio tail crossfades onto the start, so the loop is seamless
  music: { prompt: 'Unsettling horror score: low droning cello, a detuned music box, sparse cold piano, slow creeping tension, instrumental', gain: .44, duck: .22 },
  beds: [],
  sfx: {
    static: ['old CRT television static hiss', 2], caseopen: ['a plastic DVD keep case being opened, crisp click of the hinge', .8],
    caseshut: ['a plastic DVD keep case snapping shut, one crisp firm click', .7], heart: ['two slow deep heartbeats', 1.6], clock: ['old clock striking midnight, two deep bongs', 2.2],
  },
  cues: [   // [sfx, [line, word, offset], gain]
    ['caseopen', ['L1', null, -.25], .7], ['static', ['L2', 'television', -.1], .35], ['clock', ['L3', 'midnight', -.1], .45],
    ['heart', ['L3', 'louder', .1], .5], ['caseshut', ['L4', '$end', 1.66], .75],
  ],
};
