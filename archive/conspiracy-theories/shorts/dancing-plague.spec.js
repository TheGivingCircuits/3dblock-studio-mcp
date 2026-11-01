// SKETCHY HISTORY #1 — The Dancing Plague of 1518 (vertical short). Ends on "Only when." which loops into "In July of 1518".
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  size: [1080, 1920],
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.1 },   // "Diego": deep, calm, quietly unsettling
  lines: [
    { id: 'L1', at: .35, text: 'In July of 1518, a woman named Frau Troffea stepped into the street... and started to dance.' },
    { id: 'L2', gap: .3, text: "No music. No smile. She just... couldn't stop." },
    { id: 'L3', gap: .3, text: 'She danced for days. Legend says her feet bled through her shoes.' },
    { id: 'L4', gap: .3, text: 'Within a week, thirty people had joined her. Within a month... hundreds.' },
    { id: 'L5', gap: .35, text: 'So the city came up with a cure.' },
    { id: 'L6', gap: .55, text: 'More music.' },
    { id: 'L7', gap: .3, text: 'They built a stage. Hired musicians. Paid men to keep them dancing.' },
    { id: 'L8', gap: .35, text: 'It only made it worse.' },
    { id: 'L9', gap: .35, text: 'Some say fifteen people a day danced until they dropped.' },
    { id: 'L10', gap: .45, text: 'And to this day, no one knows why it started.' },
    { id: 'L11', gap: .7, text: 'Only when.' },
  ],
  tail: .55,
  music: { prompt: 'Dark eerie ambient drone for a creepy history story: low cello drone, distant wind, faint music-box notes, slow heartbeat pulse, unsettling and quiet, instrumental', gain: .42, duck: .16 },
  beds: [{ prompt: 'Medieval village dance played by an out-of-tune fiddle and hurdy-gurdy with a frame drum, a repetitive frantic jig that sounds slightly wrong and unsettling, 132 BPM, instrumental', seconds: 22, at: ['L6', null, -.1], until: ['L9', '$end', .2], gain: .38, duck: .2, fadeIn: .15, fadeOut: 1.4 }],
  sfx: {
    scribble: ['white crayon scribbling quickly on black paper', 1.2], fold: ['pop-up book paper folding up, crisp paper snap', .6],
    stomp: ['bare feet stamping and shuffling on cobblestones in a dance rhythm', 3], murmur: ['uneasy crowd murmuring in an old town street', 4],
    drum: ['single deep medieval frame drum hit', .8], thud: ['soft thud of someone collapsing onto a wooden floor', .6],
    wind: ['cold eerie wind gust through an empty street', 2.5], whisper: ['faint ghostly whisper breath', 1.2], scratch: ['short tape stop slowing down to silence', .8],
  },
  cues: [
    ['scribble', [null, .05], .45], ['fold', ['L1', 'stepped'], .55], ['fold', ['L1', 'dance', -.05], .6], ['stomp', ['L2', 'stop', .1], .35],
    ['stomp', ['L3', 'days'], .3], ['fold', ['L4', 'thirty'], .4], ['murmur', ['L4', 'thirty'], .35], ['fold', ['L4', 'hundreds'], .45],
    ['drum', ['L6', 'more', -.05], .7], ['fold', ['L7', 'stage'], .5], ['drum', ['L7', 'musicians'], .45],
    ['thud', ['L9', 'fifteen'], .5], ['thud', ['L9', 'day'], .45], ['thud', ['L9', 'dropped'], .55],
    ['wind', ['L10', null, -.2], .45], ['scratch', ['L9', '$end', .05], .35], ['whisper', ['L11', null, -.15], .4],
  ],
};
