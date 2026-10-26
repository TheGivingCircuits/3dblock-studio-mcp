// PS1 prop viewer: prop-viewer.html?mod=<file in engine/ps1-props, no .js>&fn=<PS1.props builder>&opts=<json>
// Builds the prop at the origin next to a 1.75 m reference person and a 1 m checker floor, in a neutral studio light.
// src/prop-view.mjs drives it: window.viewAt([camera xyz], [look xyz], fov) re-aims the camera and renders one frame.
(function () {
  const q = new URLSearchParams(location.search), mod = q.get('mod'), fn = q.get('fn'), opts = JSON.parse(q.get('opts') || '{}');
  const VIEW = { pos: [3, 2, 4], look: [0, .8, 0], fov: 45 }, TL = { lines: { L1: { start: .2, dur: .5, words: [{ w: 'view', s: 0, e: .4 }] } }, end: 3 };
  const s = document.createElement('script'); s.src = `/engine/ps1-props/${mod}.js`; s.onerror = () => { window.PROPERR = 'could not load module ' + mod; window.ready = true; }; s.onload = start; document.head.appendChild(s);
  function start() {
    PS1.episode({ open: ['L1', null, 0], capY: -100,
      build(S) { const checker = PS1.tex(16, 16, (g) => { for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { g.fillStyle = (x + y) / 8 % 2 ? '#5a5e66' : '#6e727a'; g.fillRect(x, y, 8, 8); } });
        PS1.add(PS1.plane(40, 40, 20, 20, 2), PS1.mat(PS1.mip(checker)), 0, -.01, 0).rotation.x = -Math.PI / 2;
        const ref = PS1.person({ skin: PS1.color('#d6a084'), top: PS1.color('#7a8a9a'), legs: PS1.color('#3a4a6a'), hair: PS1.color('#3a2a1e'), face: PS1.color('#d6a084') }); ref.G.position.set(opts.refX ?? -1.6, 0, 0);
        try { const b = PS1.props[fn]; if (!b) throw new Error(`PS1.props.${fn} is not defined by ${mod}.js`); const g = b(opts); if (!(g && g.isObject3D)) throw new Error(`PS1.props.${fn} must return a THREE.Object3D`); if (!g.parent) S.scene.add(g); S.prop = g; window.PROP = g; }
        catch (e) { window.PROPERR = String(e && e.stack || e); } },
      shots: () => [[0, .01, PS1.V(...VIEW.pos), PS1.V(...VIEW.look), VIEW.fov]],
      update(t, S) { PS1.light(1, [4, 7, 6], [1.25, 1.2, 1.1], 40); PS1.light(2, [-6, 3, -4], [.45, .5, .65], 40); PS1.light(3, [0, 2.5, 0], [.2, .2, .2], 8);
        S.U.amb.value.setRGB(.34, .34, .38); S.U.fogColor.value.set('#2e323a'); S.U.fogNear.value = 40; S.U.fogFar.value = 90; if (S.prop && S.prop.userData.update) S.prop.userData.update(t, S); } });
    window.setTL(TL);
  }
  window.viewAt = (pos, look, fov = 45) => { VIEW.pos = pos; VIEW.look = look; VIEW.fov = fov; window.setTL(TL); return window.seek(1.5); };
})();
