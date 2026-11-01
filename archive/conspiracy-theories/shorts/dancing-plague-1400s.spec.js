// SKETCHY HISTORY #1 — The Dancing Plague of 1518, illuminated-manuscript edition. First frame == last frame, and the audio tail folds onto the start: a perfect loop.
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
  tail: 1.15,
  loop: { fold: 2.6 },
  music: { prompt: 'Medieval 15th-century monastery at night: low male voices humming a Gregorian chant drone, soft organ-like drone, distant church bell, candlelit and eerie, slow and steady, no modern instruments', gain: .5, duck: .2 },
  beds: [{ prompt: 'Frantic 15th-century medieval dance tune, a saltarello played on shawm, bagpipe drone, tabor drum and hurdy-gurdy, slightly out of tune and relentless, unsettling, 138 BPM, instrumental', seconds: 22, at: ['L6', null, -.1], until: ['L9', '$end', .2], gain: .4, duck: .2, fadeIn: .15, fadeOut: 1.4 }],
  sfx: {
    quill: ['quill pen scratching quickly on old parchment', 1.4], bell: ['single distant medieval church bell toll with long ringing decay', 4], fold: ['pop-up book paper folding up, crisp paper snap', .6],
    stomp: ['leather shoes stamping and shuffling on cobblestones in a dance rhythm', 3], murmur: ['uneasy crowd murmuring in an old town street', 4],
    drum: ['single deep medieval frame drum hit', .8], thud: ['soft thud of someone collapsing onto a wooden floor', .6],
    wind: ['cold eerie wind gust through an empty street', 2.5], whisper: ['faint ghostly whisper breath', 1.2], scratch: ['short tape stop slowing down to silence', .8],
    slam: ['heavy wooden stage platform slamming up into place, deep wooden thump with a creak', 1.2], coins: ['handful of gold coins jingling and clinking as they fall into hands', 1.6],
    scroll: ['old parchment scroll unrolling quickly', .8], crows: ['two crows cawing in the distance, eerie', 2.5], wings: ['a few crows flapping their wings and flying away', 2],
  },
  cues: [
    ['fold', ['L1', 'stepped'], .55], ['fold', ['L1', 'dance', -.05], .6], ['stomp', ['L2', 'stop', .1], .35],
    ['stomp', ['L3', 'days'], .3], ['quill', ['L3', 'bled', -.2], .5], ['fold', ['L4', 'thirty'], .4], ['murmur', ['L4', 'thirty'], .35], ['fold', ['L4', 'hundreds'], .45],
    ['drum', ['L6', 'more', -.05], .7], ['slam', ['L7', 'built', .06], .55], ['slam', ['L7', 'stage', .04], .65], ['fold', ['L7', 'hired', -.15], .45],
    ['fold', ['L7', 'paid', -.05], .35], ['coins', ['L7', 'paid', .05], .5], ['fold', ['L5', 'city', -.25], .4], ['scroll', ['L5', 'city', -.1], .45],
    ['crows', ['L3', 'legend', -.2], .28], ['wings', ['L10', null, .1], .3],
    ['thud', ['L9', 'fifteen'], .5], ['thud', ['L9', 'day'], .45], ['thud', ['L9', 'dropped'], .55],
    ['wind', ['L10', null, -.2], .45], ['scratch', ['L9', '$end', .05], .35], ['whisper', ['L11', null, -.15], .35], ['bell', ['L11', 'when', .05], .55],
  ],
};
