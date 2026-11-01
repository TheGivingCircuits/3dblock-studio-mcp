// THE PROPS LIBRARY (Phase 4). One file per prop under lib/props/<room>/<id>.js, each a PROPS.def({...}) with its build, mass (kg), collision
// shape (box / sphere / cylinder, see lib/physics.js), grip point (where a hand holds it, in the prop's own frame), room and era tags.
// Pages load lib/props/all.js (this file plus every prop, bundled by build.mjs). Conventions: a prop's origin is the bottom centre of how it
// rests, +y up, long things lie along z. Hand-built PS1 look: boxes and cylinders, flat colours or 8-16 px textures, nothing smooth.
// Preview sheets: docs/props/<id>.png (sheet.mjs). Master copy on the Mac, mirrored to the T7 (/Volumes/T7 footage/Studio Library/props).
(function () {
const PR = window.PROPS = { defs: {}, list: [] }, MC = {}, TC = {};
// materials and textures are built lazily (after the scene's LIGHTS.use()) and shared per page
PR.col = (c, o) => { const k = c + JSON.stringify(o || {}); return MC[k] || (MC[k] = PS1.mat(PS1.color(c), o)); };
PR.tex = (key, w, h, draw, o) => { const k = key + JSON.stringify(o || {}); return MC[k] || (MC[k] = PS1.mat(TC[key] || (TC[key] = PS1.tex(w, h, draw)), o)); };
PR.label = (key, w, h, bg, fg, text, size = 6) => PR.tex('label:' + key, w, h, q => { q.fillStyle = bg; q.fillRect(0, 0, w, h); q.fillStyle = fg; q.font = `bold ${size}px Arial`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, w / 2, h / 2 + .5); });
PR.box = (g, w, h, d, m, x = 0, y = 0, z = 0) => PS1.add(PS1.box(w, h, d), m, x, y, z, g);
PR.cyl = (g, r1, r2, h, n, m, x = 0, y = 0, z = 0) => PS1.add(PS1.cyl(r1, r2, h, n), m, x, y, z, g);
PR.def = d => { if (!PR.defs[d.id]) PR.list.push(d); PR.defs[d.id] = { era: ['any'], tags: [], ...d }; return d; };
// PROPS.make(id, { at, ry, parent, color, ... }): a built prop (a Group, userData.prop = its definition, ready for PHYS world.add(g, g.userData.prop))
PR.make = (id, o = {}) => { const d = PR.defs[id]; if (!d) throw new Error(`PROPS: no prop "${id}"`); const g = new THREE.Group(); g.name = id; d.build(g, PR, o); g.userData.prop = d;
  if (o.at) g.position.set(...o.at); if (o.ry) g.rotation.y = o.ry; if (o.scale) g.scale.setScalar(o.scale); (o.parent || PS1.scene).add(g); return g; };
// PROPS.find({ room, era, tag }): definitions matching (era 'any' always matches)
PR.find = (f = {}) => PR.list.filter(d => (!f.room || d.room === f.room || (d.rooms || []).includes(f.room)) && (!f.era || d.era.includes('any') || d.era.includes(f.era)) && (!f.tag || d.tags.includes(f.tag)));
// a prop's collision shape centred on its own bounds when the definition gives none
PR.shape = d => d.shape;
})();
