// Style tests: the same ~12 s of The Cursed Tape (L3, L3b, L4 — cached narration) drawn in different art styles.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Guess The Horror', n: 0, title: 'Style Test', year: null },
  size: [1080, 1920],
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.06 },
  lines: [
    { id: 'L3', at: .4, text: 'The moment it ends... the phone rings.' },
    { id: 'L3b', gap: .3, voice: 'hpp4J3VqNfWAUOO0d1Us', settings: { speed: .85, stability: .3 }, fx: 'asetrate=44100*1.12,aresample=44100,atempo=0.86,highpass=f=260,aecho=0.8:0.85:70:0.35', text: 'Seven days.' },
    { id: 'L4', gap: .4, text: 'Everyone who watched it... was gone exactly one week later.' },
  ],
  tail: 1.5,
};
