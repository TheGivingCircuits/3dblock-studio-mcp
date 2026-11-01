// Cold open of Ep 1 (notebook edition): narration lines, gaps, music and sound cues.
// Cue times reference Leo's words: ['L1', 'frozen'] = the moment he says "frozen"; ['L1'] = line start; ['L1', '$end'] = line end.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  voice: 'z5CqQQP5BEAJODKuNgsn', model: 'eleven_v4',
  lines: [
    { id: 'L1', at: 1.7, text: 'Six fifty-eight a.m. Shop number three. The register is frozen, and the line is out the door.' },
    { id: 'L2', gap: .55, text: "I'm a barista. But I'm also the guy who knows the trick. Unplug the router. Count to ten. Plug it back in." },
    { id: 'L3', gap: .35, text: "Seven... eight... and we're back." },
    { id: 'L4', gap: .8, text: "Then Maya, our head of IT, holds up a sticky note. It's from Kevin. Our only IT guy." },
    { id: 'L5', gap: .4, text: 'Kevin quit. This morning. With a sticky note.' },
    { id: 'L6', gap: .6, text: 'And she wants me. Ninety days to prove it. And I have to pass the AZ-104.' },
    { id: 'L7', gap: 1.7, text: "For me, nothing's impossible. I say that a lot. This is the first time I'm scared someone's going to make me prove it." },
  ],
  tail: 5.2, // seconds after the last line (title card + theme sting)
  music: { prompt: 'Gentle playful lo-fi bed for a hand-drawn notebook story: soft felt piano, brushed drums, warm upright bass, light vinyl crackle, 86 BPM, morning coffee-shop mood, curious and warm, instrumental', gain: .3, duck: .17 },
  sting: { prompt: 'Upbeat 10-second sitcom theme sting: funky slap bass, hand claps, bright Rhodes piano, cheerful lo-fi coffee shop vibe, ends on a big button hit', seconds: 10, at: ['L7', '$end', .55], gain: .62 },
  sfx: {
    scribble: ['crayon scribbling quickly on paper, waxy scratching strokes', 1.6], beep: ['two low error beeps from a frozen cash register', .9],
    pop: ['cartoon balloon inflating fast then a soft rubbery pop', 1], unplug: ['plug pulled out of a power strip, plastic click', .5], plugin: ['plug pushed into a power strip, firm click', .5],
    tick: ['single soft clock tick', .5], chime: ['cheerful cash register ready chime', 1], confetti: ['small party popper burst with paper confetti', 1],
    slide: ['paper sliding across a desk', .7], flutter: ['paper sticky note fluttering in the air', 1], buzz: ['phone vibrating twice on a desk', 1],
    stamp: ['rubber stamp thump on paper', .6], flip: ['notebook page turning, crisp paper flip', .9], deflate: ['soft cartoon deflate whoosh', .7],
  },
  cues: [
    ['scribble', [null, .15], .45], ['beep', ['L1', 'frozen'], .5], ['pop', ['L1', 'frozen', -.05], .55], ['scribble', ['L1', 'line', -.1], .35],
    ['pop', ['L2', 'router', -.05], .5], ['unplug', ['L2', 'unplug'], .7], ['scribble', ['L2', 'count'], .3], ['plugin', ['L2', 'plug', 0, 1], .7],
    ['tick', ['L3', 'seven'], .6], ['tick', ['L3', 'eight'], .6], ['chime', ['L3', 'back'], .55], ['confetti', ['L3', 'back', .05], .5],
    ['deflate', ['L4', null, -.1], .4], ['slide', ['L4', 'holds'], .55], ['pop', ['L4', 'sticky'], .5], ['flutter', ['L5', 'kevin'], .45],
    ['buzz', ['L6', 'she'], .5], ['pop', ['L6', 'she', .1], .45], ['stamp', ['L6', 'ninety'], .7], ['stamp', ['L6', 'az'], .7],
    ['flip', ['L6', '$end', .25], .6], ['scribble', ['L7', 'for', -.1], .35], ['scribble', ['L7', 'nothing', -.05], .35],
  ],
};
