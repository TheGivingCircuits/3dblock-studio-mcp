// GUESS THE HORROR #1, PS1 CUT v2 — "The Cursed Tape" (answer: The Ring, 2002), redone to the TikTok playbook (2026-10-24): 61–75s, no
// camcorder, the case opens at once under a burned-in title card, a clue ladder (obscure → obvious, "Seven days." last), one hidden clue.
// Format: "Can you guess this horror movie...?" → the gist → "Seven days." → "Do you know what movie this is...?" → loops to the opening.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Guess The Horror', n: 1, title: 'The Cursed Tape', cut: 'PS1', year: null, answer: 'The Ring (2002)' },
  size: [1080, 1920], crf: 21,   // chunky pixels + grain: CRF 16 makes a ~270 MB file for no visible gain
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.06 },   // "Diego" — the house narrator
  lines: [
    { id: 'L1', at: .35, text: 'Can you guess this horror movie...?' },   // playbook: the search phrase is spoken (TikTok transcribes narration)
    // the ring of light is no longer named: it flashes on the screen after the tree, unnarrated (the hidden clue the caption points to)
    { id: 'L2', gap: .35, text: 'A videotape. No label. Just strange, broken pictures... a ladder, a fly, a burning tree.' },
    { id: 'L3', gap: .35, text: 'The moment it ends... the phone rings. Someone on the line whispers just two words.' },   // the two words are held back for the end
    { id: 'L4', gap: .4, text: 'Everyone who watched it... was gone exactly one week later.' },
    { id: 'L5', gap: .3, text: 'A reporter watches it to find out why, and so does her ex-husband. Now both their clocks are ticking.' },
    { id: 'L5b', gap: .35, text: 'Then their little boy finds the copy... and watches it too.' },   // research: Aidan watches the copy she made for Noah
    { id: 'L6', gap: .4, text: 'The clues lead her to a lonely cabin in the woods... and under the floor, an old well.' },
    { id: 'L7', gap: .3, text: 'Something has been down there for a very, very long time.' },
    { id: 'L7b', gap: .3, text: 'Years ago, a little girl was thrown down there... by her own mother.' },   // research: Anna dumps Samara into the well
    { id: 'L8', gap: .4, text: 'She thinks she broke the curse.' },
    { id: 'L9', gap: .45, text: 'Then, on his seventh night... the TV turns on by itself.' },   // research: it's her ex-husband's TV, on HIS seventh day
    // clue ladder: the most famous clue comes last, right before the loop. Same voice, settings and filter as the old L3b, so it's cached
    { id: 'L9b', gap: 2.3, voice: 'hpp4J3VqNfWAUOO0d1Us', settings: { speed: .85, stability: .3 }, fx: 'asetrate=44100*1.12,aresample=44100,atempo=0.86,highpass=f=260,aecho=0.8:0.85:70:0.35', text: 'Seven days.' },   // the gap is the climax: she crawls out
    { id: 'L10', gap: .45, text: 'Do you know what movie this is...?' },
  ],
  tail: 2.2,   // playbook: a short end. Dip to black, the case snapping shut, the title card fading back in, a brief hold (the loop seam)
  loop: { fold: 2.6 },
  music: { prompt: 'Unsettling psychological horror score: low droning cello, a distant detuned music box, sparse cold piano notes, rain ambience, slow creeping tension, instrumental', gain: .44, duck: .22 },
  beds: [{ prompt: 'Terrifying horror crescendo: screeching dissonant strings, deep booms, a rising wall of tension that cuts out suddenly, instrumental', seconds: 11, at: ['L9', 'tv', -.5], until: ['L10', '$end', -.1], gain: .44, duck: .12, fadeIn: .2, fadeOut: .35 }],
  sfx: {
    rain: ['steady rain on a window at night, calm', 5], static: ['old CRT television static hiss', 2], vcr: ['VHS tape pushed into a VCR, mechanical clunk and whir', 1.4],
    blip: ['short glitchy video tape distortion blip', .5], ring: ['old 1990s cordless phone ringing twice, loud in a quiet room', 2.4], whisper: ['faint ghostly whisper breath', 1.2],
    tick: ['loud clock ticking quickly', 2], flip: ['calendar pages flipping quickly', 1], fold: ['pop-up book paper folding up, crisp paper snap', .6], whoosh: ['fast smooth cinematic whoosh', .8],
    wind: ['cold wind through a pine forest at night', 3], creak: ['old wooden floorboards creaking and a trapdoor opening', 1.6], stone: ['heavy stone lid scraping and sliding off a well', 1.8],
    drip: ['water dripping deep inside a stone well, echoing', 2.5], hum: ['deep eerie otherworldly humming drone, slowly pulsing, low frequency', 4], heart: ['two slow deep heartbeats', 1.6],
    tvon: ['old CRT television turning on by itself with a thump, high-pitched whine and static', 1.6], thunder: ['a sudden close crack of thunder, then a deep rumble', 2.5], lid: ['heavy stone lid slamming shut on a well, deep thud', 1],
    birds: ['early morning birds chirping softly after rain', 3], crawl: ['wet hair dragging and fingernails scraping slowly across a wooden floor, creepy', 2.2], glitch: ['harsh digital video glitch burst', .6], midnight: ['old clock striking midnight, two deep bongs', 2.2], sting: ['sudden horror jump scare sting, a loud dissonant hit', 1.2], caseopen: ['a plastic DVD keep case being opened, the crisp click of the hinge snapping open', .8], caseshut: ['a plastic DVD keep case snapping shut, one crisp firm click', .7],
    rec: ['an old camcorder starting to record: a soft electronic beep and the whir of the tape mechanism', 1], steps: ['slow careful footsteps on wet leaves and twigs in a forest at night', 2.5], tvglitch: ['analog video signal dropping out: a burst of static and a low electronic squeal', 1.2], off: ['old television switching off with a click and a fading whine', 1],
  },
  cues: [
    ['rain', ['L1', null, -.3], .35], ['static', ['L1', 'guess', -.2], .3], ['caseopen', ['L1', null, -.25], .7],
    ['vcr', ['L2', 'videotape', -.2], .55], ['blip', ['L2', 'ladder', -.05], .35], ['blip', ['L2', 'fly', -.05], .35], ['blip', ['L2', 'burning', -.05], .35], ['hum', ['L2', '$end', -.2], .4],
    ['static', ['L3', 'ends', -.1], .35], ['ring', ['L3', 'phone', -.1], .6], ['whisper', ['L3', 'whispers', -.1], .3],
    ['heart', ['L4', 'gone', -.2], .5], ['flip', ['L4', 'week', -.2], .4],
    ['tick', ['L5', 'clocks', -.3], .55],
    ['vcr', ['L5b', 'copy', -.2], .45], ['static', ['L5b', 'watches', -.1], .3],
    ['wind', ['L6', 'clues', -.2], .4], ['steps', ['L6', 'lead', -.2], .45], ['creak', ['L6', 'floor', -.3], .55], ['stone', ['L6', 'well', -.1], .5],
    ['drip', ['L7', null], .45], ['hum', ['L7', 'long', -.4], .45], ['whisper', ['L7b', 'girl', -.2], .3], ['drip', ['L7b', 'mother', -.2], .35],
    ['lid', ['L8', null, -.25], .55], ['birds', ['L8', 'thinks'], .3],
    ['thunder', ['L9', 'then', -.1], .6], ['midnight', ['L9', 'seventh', -.1], .4], ['tvon', ['L9', 'tv', -.15], .6], ['static', ['L9', 'itself', -.1], .45],
    ['heart', ['L9', '$end', .25], .55], ['crawl', ['L9', '$end', .7], .6], ['sting', ['L9', '$end', 1.05], .6], ['glitch', ['L9', '$end', 1.05], .4], ['whisper', ['L9b', null, -.3], .35],
    ['glitch', ['L10', 'movie', -.05], .45], ['tvglitch', ['L10', '$end', .05], .5], ['rain', ['L10', '$end', .3], .35], ['caseshut', ['L10', '$end', 1.66], .75],
  ],
};
