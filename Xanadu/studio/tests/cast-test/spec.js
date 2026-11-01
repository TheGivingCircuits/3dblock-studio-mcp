// PIPELINE TEST COPY of studio/episodes/the-hitchhiker/spec.js: same lines, voice and effects (all cached), only meta changed.
// GUESS THE HORROR #1 — "The Hitchhiker" (answer: The Texas Chain Saw Massacre, 1974), PS1 cut, built to the TikTok playbook (2026-10-24).
// The narration never says a title word (no "Texas", "chain", "saw", "massacre"). Clue ladder: the van, the hitchhiker and the empty pumps
// first (obscure), the steel door and the hammer in the middle, the dinner and the grandpa late, and the giveaway last and unnarrated: the
// masked man spinning his roaring chainsaw in the road at sunrise, in the 2.3 s of silence before the question. Hidden clue (first 10 s):
// a dead armadillo on the road as the van passes, the film's first image.
// Format: "Can you guess this horror movie...?" → the gist → the dance → "Do you know what movie this is...?" → loops to the opening.
(typeof window !== 'undefined' ? window : globalThis).SPEC = {
  meta: { series: 'Studio Tests', n: 4, title: 'Cast Test', year: null, answer: 'The Texas Chain Saw Massacre (1974)' },   // PIPELINE TEST: never the real episode's folder
  size: [1080, 1920], crf: 21,
  voxGain: 1.12, sfxDuck: .5,
  voice: 'dJEJK85lIc4heqoIhReh', model: 'eleven_v4', settings: { speed: 1.06 },   // "Diego"; same settings as #1 v2, so L1 and L12 come from the cache
  lines: [
    { id: 'L1', at: .35, text: 'Can you guess this horror movie...?' },
    { id: 'L2', gap: .35, text: 'Summer, nineteen seventy-three. Five friends drive an old van down a hot country road.' },
    { id: 'L3', gap: .35, text: 'They pick up a strange hitchhiker. He snaps a photo, burns it... and slashes one of them with a razor.' },   // research: a Polaroid of Franklin; the razor cuts Franklin's arm
    { id: 'L4', gap: .35, text: 'They throw him out. At the gas station, the old man says the pumps are empty.' },
    { id: 'L5', gap: .35, text: 'So two of them walk to a farmhouse nearby, hoping to borrow some gas.' },   // research: Kirk and Pam, looking for the swimming hole, go in to barter for gas
    { id: 'L6', gap: .35, text: 'Inside, a steel door slides open... and a huge man in a mask swings a hammer.' },
    { id: 'L7', gap: .4, text: 'One by one, the others go looking for them... and never come back.' },   // research: Pam, then Jerry at sunset, then Franklin at night
    { id: 'L8', gap: .35, text: 'The last girl runs to the gas station for help. But the old man is one of them.' },
    { id: 'L9', gap: .35, text: 'She wakes up tied to a chair at their dinner table... next to a grandpa who barely moves.' },
    { id: 'L10', gap: .35, text: 'At sunrise, she crashes through a window and runs for the road.' },
    { id: 'L11', gap: .3, text: 'She escapes in the back of a passing pickup... while he spins in the road behind her.' },
    { id: 'L12', gap: 2.3, text: 'Do you know what movie this is...?' },   // the gap is the giveaway: the chainsaw dance at sunrise, roaring
  ],
  tail: 2.2,
  loop: { fold: 2.6 },
  music: { prompt: 'Raw 1970s rural horror soundscape: scraping metal, low rumbling drones, distant clanging, dry wind, insect buzz, sparse unsettling percussion, instrumental, no melody', gain: .4, duck: .22 },
  beds: [{ prompt: 'Frantic horror crescendo: pounding metallic clangs, screeching dissonant strings and a rising roar that cuts out suddenly, instrumental', seconds: 11, at: ['L10', 'crashes', -.4], until: ['L12', '$end', -.1], gain: .36, duck: .18, fadeIn: .3, fadeOut: .35 }],
  sfx: {
    heat: ['hot summer afternoon in the country, cicadas buzzing loudly, dry wind over empty fields', 4], van: ['an old 1970s van driving on a country road, steady engine rumble, rattling panels, wind', 4],
    camera: ['an old instant camera: a flash pop and the whirr of the photo sliding out', 1.4], lighter: ['a lighter flicking on and a small photo catching fire, crackling', 1.6],
    slash: ['a quick sharp swish of a blade and a startled shout', 1], slide: ['a van sliding door slammed shut hard, then tires on gravel', 1.6],
    pumps: ['an old gas station: a dry pump nozzle clicking empty and a squeaky screen door', 1.8], gen: ['an old electric generator chugging outside a farmhouse, flies buzzing, crickets', 3.5],
    steel: ['a heavy steel sliding door rolling fast on a rusty track and banging open', 1.4], thud: ['one heavy dull thud, low and muffled', .8], squeal: ['a strange high pig-like squeal from inside an old house', 1.4],
    dusk: ['crickets and a warm evening wind over a dry farm at dusk', 3.5], night: ['crickets and wind on a dark farm at night, a distant dog barking', 3.5], run: ['a woman running through dry brush at night, panicked breathing', 2.2],
    screen: ['a wooden screen door banging shut', .8], grab: ['a sudden scuffle and a sack being pulled over someone, muffled struggle', 1.4], truck: ['an old pickup truck door slamming and the engine starting, driving off on gravel', 3],
    dinner: ['a creepy old house at night: an old clock ticking, cutlery clinking on plates, an old man chuckling softly', 3.5], tap: ['a hammer tapping weakly on a wooden table, three slow taps', 1.6],
    glass: ['a window shattering as someone crashes through it, glass falling', 1.2], dawn: ['early morning birds on an empty country road at dawn, light wind', 3.5], pickup: ['an old pickup truck racing past and speeding away on a country road', 3],
    chainsaw: ['a chainsaw roaring and revving wildly up and down, close, in an open field', 4], sting: ['sudden horror jump scare sting, a loud dissonant metallic hit', 1.2],
    caseopen: ['a plastic DVD keep case being opened, the crisp click of the hinge snapping open', .8], caseshut: ['a plastic DVD keep case snapping shut, one crisp firm click', .7],
  },
  cues: [
    ['caseopen', ['L1', null, -.25], .7], ['heat', ['L1', 'guess', -.2], .38],
    ['van', ['L2', 'friends', -.4], .42],
    ['camera', ['L3', 'snaps', -.05], .5], ['lighter', ['L3', 'burns', -.1], .45], ['slash', ['L3', 'slashes', .05], .45],
    ['slide', ['L4', 'throw', -.1], .45], ['pumps', ['L4', 'pumps', -.4], .45],
    ['gen', ['L5', 'farmhouse', -.4], .42],
    ['steel', ['L6', 'slides', -.1], .55], ['sting', ['L6', 'mask', -.05], .4], ['thud', ['L6', 'hammer', .15], .5], ['squeal', ['L6', 'hammer', .5], .35],
    ['dusk', ['L7', null, -.2], .38], ['night', ['L7', 'never', -.3], .38],
    ['run', ['L8', null, -.2], .42], ['screen', ['L8', 'station', .1], .4], ['grab', ['L8', 'one', -.1], .45], ['sting', ['L8', 'one', .12], .5], ['truck', ['L8', '$end', .1], .35],
    ['dinner', ['L9', 'wakes', -.3], .4], ['tap', ['L9', 'grandpa', .1], .4],
    ['glass', ['L10', 'crashes', -.05], .55], ['dawn', ['L10', 'runs', -.2], .38],
    ['pickup', ['L11', 'pickup', -.5], .45], ['chainsaw', ['L11', '$end', .2], .55], ['sting', ['L11', '$end', .3], .4],
    ['caseshut', ['L12', '$end', 1.66], .75],
  ],
};
