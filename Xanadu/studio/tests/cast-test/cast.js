// CAST TEST (Phase 3 proof): the Hitchhiker cast rebuilt from the cast library. The scene's hand-built people (person(top, legs, hair, face))
// become library characters chosen by their face key, with matching bodies, hair and wardrobe for August 1973. Everything else in the scene
// (sets, blocking, camera, light) is the pipeline test's, so a side-by-side take shows only the cast changing.
window.HHCAST = {
  // each recipe wears the hand-built original's own colours (the scene's T textures), with the library's garment detail on top
  sally: { body: 'woman', hair: 'long', hairLength: .45, hairColor: 'brown', outfit: { top: 'tee', bottom: 'jeans', shoes: 'sneakers' }, colors: { top: '#e6c8c8', bottom: '#4a5a86' }, era: '70s', faces: { sally: 'neutral', sallyS: 'scared' } },
  jerry: { body: 'man', hair: 'short', hairColor: 'darkBrown', outfit: { top: 'shirt', bottom: 'jeans', shoes: 'boots' }, colors: { top: '#5a6e94', bottom: '#4a5a86' }, era: '70s', faces: { jerry: 'neutral' } },
  kirk: { body: 'man', hair: 'feathered', hairColor: 'sandy', outfit: { top: 'tank', bottom: 'jeans', shoes: 'sneakers' }, colors: { top: '#c8a050', bottom: '#4a5a86' }, era: '70s', faces: { kirk: 'neutral' } },
  pam: { body: 'woman', hair: 'long', hairLength: .45, hairColor: 'blonde', outfit: { top: 'halter', bottom: 'shorts', shoes: 'sneakers' }, colors: { top: '#b84a3a', bottom: '#d6a084' }, era: '70s', faces: { pam: 'neutral' } },
  fran: { body: 'man', build: 1.15, hair: 'short', hairColor: 'black', extras: ['glasses'], sleeves: 'long', outfit: { top: 'tee', bottom: 'jeans', shoes: 'sneakers' }, colors: { top: '#a83a2a', bottom: '#4a5a86' }, era: '70s', faces: { fran: 'neutral' } },
  hitch: { body: 'man', build: .85, hair: 'long', hairLength: .3, hairColor: 'black', skin: 'tan', outfit: { top: 'shirt', jacket: 'leatherJacket', bottom: 'slacks', shoes: 'boots' }, colors: { jacket: '#7a4a2e', bottom: '#4a4a52' }, era: '70s', faces: { hitch: 'smiling' } },
  drv: { body: 'man', hair: 'short', hairColor: 'brown', headwear: 'trucker', outfit: { top: 'shirt', bottom: 'jeans', shoes: 'boots' }, colors: { top: '#8a8a6a', bottom: '#4a5a86' }, era: '70s', faces: { drv: 'neutral' } },
  // the attendant: the old man's own white shirt and tie and dark slacks (as hand-built), plus the cap and a name patch
  old: { body: 'man', height: 1.72, hair: 'short', hairColor: 'grey', moustache: 'grey', age: .8, headwear: 'cap', outfit: { top: 'dressShirt', bottom: 'slacks', shoes: 'boots' }, colors: { top: '#e4ded0', bottom: '#3a3430' }, era: '70s', faces: { old: 'neutral', oldG: 'smiling' } },
  mask: { body: 'man', build: 1.12, hair: 'shag', hairColor: 'darkBrown', mask: 'skin', outfit: { top: 'workShirt', bottom: 'slacks', shoes: 'boots' }, colors: { top: '#8ea4b8', bottom: '#3a3430' }, era: '70s', faces: { mask: 'neutral' } },
  grand: { body: 'elderly', build: .8, hair: 'short', hairColor: 'white', skin: 'grey', age: 1, outfit: { top: 'shirt', jacket: 'suitJacket', bottom: 'slacks', shoes: 'shoes' }, colors: { top: '#2e2a28', jacket: '#2e2a28', bottom: '#2e2a28' }, era: '70s', faces: { grand: 'dead' }, expression: 'dead' },
};
// face key → recipe (variant keys share a character)
window.HHCAST.sallyS = window.HHCAST.sally; window.HHCAST.oldG = window.HHCAST.old;
