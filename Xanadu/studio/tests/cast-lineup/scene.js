// a lineup of library characters on a grey floor, to look at bodies, faces, hair and wardrobe, plus one character cycling motions
const { V } = PS1; LIGHTS.use(); const M = LIGHTS.mat;
const PEOPLE = [
  { name: 'man', body: 'man', hair: 'short', hairColor: 'brown', outfit: { top: 'plaidShirt', bottom: 'jeans', shoes: 'boots' } },
  { name: 'woman', body: 'woman', hair: 'long', hairColor: 'blonde', outfit: { top: 'blouse', bottom: 'skirt', shoes: 'shoes' } },
  { name: 'teen', body: 'teen', hair: 'feathered', hairColor: 'sandy', outfit: { top: 'stripedTee', bottom: 'shorts', shoes: 'sneakers' } },
  { name: 'child', body: 'child', hair: 'ponytail', hairColor: 'auburn', freckles: true, outfit: { top: 'tee', bottom: 'jeans' }, colors: { top: '#e0b02a' } },
  { name: 'big', body: 'big', hair: 'shag', hairColor: 'darkBrown', mask: 'skin', outfit: { top: 'shirt', bottom: 'slacks', apron: 'butcherApron', shoes: 'boots' } },
  { name: 'elderly', body: 'elderly', hair: 'short', hairColor: 'grey', moustache: 'grey', outfit: { full: 'attendant', shoes: 'boots' } },
  { name: 'frail', body: 'frail', hair: 'veil', hairColor: 'black', skin: 'grey', outfit: { full: 'nightgown', shoes: 'bare' } },
  { name: 'cop', body: 'man', hair: 'buzz', hairColor: 'black', skin: 'brown', moustache: 'black', outfit: { full: 'police', shoes: 'shoes' }, extras: ['glasses'] },
];
CAM.episode({
  build(S) { const O = S.O; PS1.add(PS1.plane(14, 10, 4, 4, .5), M(PS1.color('#6a6a66')), 0, 0, 0).rotation.x = -Math.PI / 2; PS1.add(PS1.plane(14, 6, 4, 2, .5), M(PS1.color('#4a4c56')), 0, 3, -3);
    O.cast = PEOPLE.map((r, i) => { const P = CAST.make(r); P.G.position.set(-3.15 + i * .9, 0, 0); CAM.mark(r.name, P); return P; });
    O.mover = CAST.make({ name: 'mover', body: 'woman', hair: 'ponytail', hairColor: 'red', outfit: { top: 'hoodie', bottom: 'jeans' } }); O.mover.G.position.set(0, 0, 2.2); CAM.mark('mover', O.mover);
    LIGHTS.sky({ time: '12:00', sun: { azimuth: 160, elevation: 50, kelvin: 5600 }, skylight: -1.5, ground: '#6a6a66', shadowSize: 6 }); LIGHTS.setup('three-point', { subject: 'man', stops: 0 }); },
  shots: S => [{ id: 'WIDE', at: 0, dur: 4, lens: '35mm', stop: 'f/5.6', pos: [0, 1.3, 7], look: [0, .95, 0], subject: [0, 1, 0] },
    { id: 'MOVE', at: 4, dur: 8, lens: '28mm', stop: 'f/4', pos: [2.4, 1.3, 5.6], look: [0, .9, 2.2], subject: 'mover' }],
  update(t, S) { S.O.cast.forEach((P, i) => CAST.act(P, t, [{ at: 0, motion: 'idle', p: { seed: i } }]));
    const ms = ['idle', 'walk', 'run', 'sneak', 'sit', 'wave', 'talk', 'point', 'phone', 'lookAround', 'struggle', 'swing', 'crawl', 'climb', 'fall', 'ragdoll'];
    CAST.act(S.O.mover, t, ms.map((m, i) => ({ at: 4 + i * .5, motion: m, blend: .2 }))); },
});
