// TECH #1 — The PS3: Sony's $599 gamble (vertical short). Real launch-era photos (Wikimedia Commons, credited on each print).
// Ends on "All because of one promise." which loops into "In 2005, Sony promised the world..."; the first and last frames are the same hero shot.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  size: [1080, 1920],
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.1 },   // Diego, same narrator as Sketchy History
  lines: [
    { id: 'L1', at: .3, text: 'In 2005, Sony promised the world a console from the future.' },
    { id: 'L2', gap: .3, text: 'A controller shaped like a boomerang.' },
    { id: 'L3', gap: .3, text: 'And a chip called Cell, built like a supercomputer.' },
    { id: 'L4', gap: .4, text: 'Then, at E3 2006, Sony revealed the price.' },
    { id: 'L5', gap: .45, text: 'Five hundred... ninety-nine... U.S. dollars.' },
    { id: 'L6', gap: .4, text: 'People were stunned. And then... they lined up anyway.' },
    { id: 'L7', gap: .3, text: 'They camped outside stores for days.' },
    { id: 'L8', gap: .3, text: 'Launch consoles were resold online for thousands.' },
    { id: 'L9', gap: .4, text: "But here's the crazy part. Sony lost money on every single one." },
    { id: 'L10', gap: .3, text: 'Hundreds of dollars. Per console.' },
    { id: 'L11', gap: .4, text: 'And in 2010, the U.S. Air Force wired seventeen hundred and sixty PS3s together... into a supercomputer.' },
    { id: 'L12', gap: .5, text: 'All because of one promise.' },
  ],
  tail: 1.1,
  loop: { fold: 2.4 },
  music: { prompt: 'Mysterious mid-2000s electronic ambient for a tech documentary: glossy synth pads, soft pulsing sub bass, subtle glitchy percussion, sleek and futuristic, steady, instrumental, 100 BPM', gain: .42, duck: .18 },
  beds: [
    { prompt: 'Energetic mid-2000s electronic breakbeat, punchy drums, bright synth stabs and driving bass, hype and urgent, instrumental, 140 BPM', seconds: 13, at: ['L6', 'then', -.2], until: ['L8', '$end', .3], gain: .34, duck: .2, fadeIn: .3, fadeOut: 1.2 },
    { prompt: 'Rising epic cinematic electronic swell, deep drums and a fast synth arpeggio building up to one huge final hit, futuristic, instrumental', seconds: 9, at: ['L11', null, -.1], until: ['L11', '$end', 1.2], gain: .36, duck: .2, fadeIn: .5, fadeOut: .8 },
  ],
  sfx: {
    whoosh: ['fast smooth cinematic whoosh', .8], pop: ['glossy photo print snapping up quickly, crisp card flick', .5], gasp: ['large crowd gasping in shock inside a convention hall', 2],
    slot: ['mechanical counter digits rolling fast then stopping with a clunk', 1.2], boom: ['deep cinematic bass hit boom', 1.5], crowd: ['excited crowd chatter outside a store at night', 3],
    register: ['cash register ka-ching', 1], stamp: ['heavy rubber stamp slamming onto paper', .6], printer: ['thermal receipt printer printing quickly', 2.5],
    servers: ['server room with many cooling fans spinning up and humming', 3], rewind: ['tape rewinding very fast with a whoosh', 1.6], chime: ['soft futuristic electronic chime, glassy and bright', 1.5],
  },
  cues: [
    ['whoosh', ['L1', '2005', -.2], .45], ['pop', ['L1', 'promised', -.3], .5],
    ['pop', ['L2', 'controller', -.3], .45], ['pop', ['L2', 'boomerang', -.15], .5],
    ['whoosh', ['L3', 'chip', -.45], .35], ['pop', ['L3', 'chip', -.25], .45],
    ['whoosh', ['L4', 'then', -.1], .45], ['pop', ['L4', 'e3', -.3], .45],
    ['slot', ['L5', 'five', -.1], .5], ['slot', ['L5', 'ninety', -.05], .55], ['boom', ['L5', 'dollars'], .7],
    ['gasp', ['L6', 'stunned', -.2], .6], ['whoosh', ['L6', 'and', -.1], .45], ['pop', ['L6', 'lined', -.25], .45], ['crowd', ['L7', 'camped', -.3], .4],
    ['pop', ['L8', 'launch', -.2], .4], ['pop', ['L8', 'resold', -.2], .4], ['register', ['L8', 'thousands'], .5],
    ['whoosh', ['L9', 'but', -.1], .4], ['pop', ['L9', 'sony', -.2], .45], ['stamp', ['L9', 'one', -.02], .65],
    ['printer', ['L10', 'hundreds', -.3], .45], ['stamp', ['L10', 'per'], .5],
    ['whoosh', ['L11', 'and', -.1], .4], ['pop', ['L11', 'air', -.25], .4], ['servers', ['L11', 'seventeen', -.2], .4], ['boom', ['L11', 'supercomputer'], .55],
    ['rewind', ['L12', 'all', -.2], .5], ['chime', ['L12', 'promise', .25], .5],
  ],
};
