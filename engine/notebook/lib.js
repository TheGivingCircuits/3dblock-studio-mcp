// Notebook engine: crayon drawing on a paper page + Three.js props that inflate out of it.
// Everything is a pure function of time t, so frames render deterministically (window.seek(t)).
(function () {
  const NB = window.NB = {};
  const W = NB.W = 1920, H = NB.H = 1080, PW = NB.PW = 2048, PH = NB.PH = 1152;
  NB.HAND = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
  NB.COL = { ink: '#2a2440', blue: '#2b4c7e', red: '#d4402f', green: '#2f9a5b', brown: '#4a2e1c', card: '#c99358', yellow: '#ffe066', teal: '#2f8f8a', coral: '#e8735a', gray: '#8d99a6', paper: '#faf5e8' };

  // ---------- math ----------
  const rng = NB.rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const clamp = NB.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  NB.P = (t, a, d) => clamp((t - a) / d);
  NB.lerp = (a, b, u) => a + (b - a) * u;
  NB.eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  NB.eo = x => 1 - Math.pow(1 - x, 3);
  NB.ei = x => x * x * x;
  NB.back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  NB.elastic = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 9 - .75) * (2 * Math.PI) / 3) + 1;
  NB.bounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
  const { P, lerp, eo } = NB;

  // ---------- crayon ----------
  function wobble(pts, amp, seed) {
    const r = rng(seed), out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(d / 22));
      const nx = -(y1 - y0) / d, ny = (x1 - x0) / d, ph = r() * 6.28, fq = .6 + r() * 1.4;
      for (let k = 0; k < n; k++) { const u = k / n, o = Math.sin(u * Math.PI * fq + ph) * amp + (r() - .5) * amp * .5; out.push([x0 + (x1 - x0) * u + nx * o, y0 + (y1 - y0) * u + ny * o]); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  NB.stroke = (pts, color, w, seed, o = {}) => {
    const r = rng(seed * 7 + 3), path = o.raw ? pts : wobble(pts, o.amp ?? w * .3, seed), dots = []; let L = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 1.3));
      for (let k = 0; k < n; k++) { const u = k / n; L += d / n; const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; for (let j = 0; j < 4; j++) { if (r() < .2) continue; const a = r() * 6.283, rad = Math.sqrt(r()) * w * .5; dots.push(x + Math.cos(a) * rad, y + Math.sin(a) * rad, L, 1.1 + r() * 2); } }
    }
    return { dots, L, color };
  };
  NB.draw = (ctx, s, p = 1, alpha = .82) => { if (p <= 0) return; const lim = s.L * p, d = s.dots; ctx.fillStyle = s.color; ctx.globalAlpha = alpha; for (let i = 0; i < d.length; i += 4) { if (d[i + 2] > lim) break; const z = d[i + 3]; ctx.fillRect(d[i] - z / 2, d[i + 1] - z / 2, z, z); } ctx.globalAlpha = 1; };
  NB.drawAll = (ctx, list, p = 1, alpha) => { if (p <= 0) return; const tot = list.reduce((a, s) => a + s.L, 0); let acc = 0; for (const s of list) { const lp = clamp((p * tot - acc) / s.L); if (lp > 0) NB.draw(ctx, s, lp, alpha); acc += s.L; } };
  NB.hatch = (x, y, w, h, color, gap, ang, lw, seed) => {
    const out = [], r = rng(seed), diag = Math.hypot(w, h), cx = x + w / 2, cy = y + h / 2, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let o = -diag / 2; o < diag / 2; o += gap * (.8 + r() * .4)) { const ox = cx - sa * o, oy = cy + ca * o; out.push(NB.stroke([[ox - ca * diag / 2, oy - sa * diag / 2], [ox + ca * diag / 2, oy + sa * diag / 2]], color, lw, (r() * 1e6) | 0, { amp: lw * .4 })); }
    return out;
  };
  NB.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 2]];
  NB.circlePts = (cx, cy, r, n = 28, ry = r) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(i / n * 6.283) * r, cy + Math.sin(i / n * 6.283) * ry]);
  // filled + hatched + outlined shape helper: returns { fill:[strokes], line:stroke } clipped to a rect when drawn
  NB.shape = (x, y, w, h, fill, line, seed, lw = 10) => ({ x, y, w, h, hatch: NB.hatch(x, y, w, h, fill, 20, -.9, 6, seed), line: NB.stroke(NB.rect(x, y, w, h), line, lw, seed + 1) });
  NB.drawShape = (ctx, s, p = 1, alpha = 1) => { ctx.globalAlpha = alpha; NB.draw(ctx, s.line, clamp(p * 2), .85 * alpha); ctx.save(); ctx.beginPath(); ctx.rect(s.x + 6, s.y + 6, s.w - 12, s.h - 12); ctx.clip(); NB.drawAll(ctx, s.hatch, clamp(p * 2 - 1), .65 * alpha); ctx.restore(); ctx.globalAlpha = 1; };
  // handwriting with waxy grain; pre-rendered once
  NB.hand = (s, size, color, seed, maxW) => {
    const m = document.createElement('canvas').getContext('2d'); m.font = `${size}px ${NB.HAND}`; const tw = m.measureText(s).width, sc = maxW && tw > maxW ? maxW / tw : 1;
    const c = document.createElement('canvas'); c.width = Math.ceil(tw * sc + size); c.height = Math.ceil(size * 1.5); const g = c.getContext('2d');
    g.font = `${size}px ${NB.HAND}`; g.fillStyle = color; g.save(); g.translate(size / 2, size * 1.12); g.scale(sc, 1); g.fillText(s, 0, 0); g.restore();
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data, r = rng(seed); for (let i = 3; i < d.length; i += 4) if (d[i] && r() < .3) d[i] *= .22; g.putImageData(img, 0, 0);
    return c;
  };
  NB.put = (ctx, c, x, y, p = 1, align = 'left', alpha = 1) => { if (p <= 0) return; const ax = align === 'center' ? x - c.width / 2 : align === 'right' ? x - c.width : x; ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.rect(ax, y - c.height, c.width * p, c.height * 1.3); ctx.clip(); ctx.drawImage(c, ax, y - c.height * .78); ctx.restore(); };
  NB.canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.userData = { canvas: c }; return t; };
  NB.crayonFill = (base, hatchCol, seed, extra) => (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); NB.hatch(0, 0, w, h, hatchCol, 18, -.8, 5, seed).forEach(s => NB.draw(g, s, 1, .55)); extra && extra(g, w, h); NB.draw(g, NB.stroke(NB.rect(8, 8, w - 16, h - 16), '#2a1c15', 11, seed + 9), 1, .85); };

  // ---------- paper ----------
  NB.paper = (seed = 42, o = {}) => {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = NB.COL.paper; g.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 26000; i++) { g.fillStyle = r() < .5 ? 'rgba(120,100,70,0.05)' : 'rgba(255,255,255,0.35)'; const z = 1 + r() * 2.5; g.fillRect(r() * PW, r() * PH, z, z); }
    g.strokeStyle = 'rgba(110,160,210,0.36)'; g.lineWidth = 2.2; for (let y = 170; y < PH; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(PW, y); g.stroke(); }
    g.strokeStyle = 'rgba(220,90,90,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(250, 0); g.lineTo(250, PH); g.stroke();
    for (const y of [230, 576, 922]) { g.fillStyle = '#e9e1cf'; g.beginPath(); g.arc(110, y, 26, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; g.stroke(); }
    if (o.stain !== false) { g.strokeStyle = 'rgba(140,90,40,0.13)'; g.lineWidth = 14; g.beginPath(); g.arc(1830, 1010, 96, .3, 5.9); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(1830, 1010, 84, 0, 6.283); g.stroke(); }
    return c;
  };

  // ---------- three.js stage ----------
  NB.stage = () => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputEncoding = THREE.sRGBEncoding; (document.body || document.documentElement).appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#1a1714');
    const camera = new THREE.PerspectiveCamera(30, W / H, .1, 100);
    const page = document.createElement('canvas'); page.width = PW; page.height = PH;
    const pageTex = new THREE.CanvasTexture(page); pageTex.encoding = THREE.sRGBEncoding; pageTex.anisotropy = 8;
    const pageMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: pageTex })); scene.add(pageMesh);
    // page turn: a second sheet hinged on the left edge that curls over
    const flip = document.createElement('canvas'); flip.width = PW; flip.height = PH;
    const flipTex = new THREE.CanvasTexture(flip); flipTex.encoding = THREE.sRGBEncoding;
    const flipGeo = new THREE.PlaneGeometry(16, 9, 40, 1), flipBase = flipGeo.attributes.position.array.slice();
    const flipMesh = new THREE.Mesh(flipGeo, new THREE.MeshBasicMaterial({ map: flipTex, side: THREE.DoubleSide })); flipMesh.visible = false; scene.add(flipMesh);
    const backMat = new THREE.MeshBasicMaterial({ color: '#efe7d6', side: THREE.BackSide }); const flipBack = new THREE.Mesh(flipGeo, backMat); flipMesh.add(flipBack);
    const setFlip = (a) => { // a: 0 = flat, 1 = turned over to the left
      const pos = flipGeo.attributes.position, ang = a * Math.PI, curl = Math.sin(a * Math.PI) * .9;
      for (let i = 0; i < pos.count; i++) {
        const x0 = flipBase[i * 3] + 8, y0 = flipBase[i * 3 + 1], u = x0 / 16, th = ang * (1 - curl * (1 - u) * .5) ;
        const r = x0; pos.setXYZ(i, -8 + r * Math.cos(th * (0.6 + .4 * u)), y0, .02 + r * Math.sin(th * (0.6 + .4 * u)) * .55);
      }
      pos.needsUpdate = true; flipGeo.computeBoundingSphere();
    };
    return { renderer, scene, camera, page, pg: page.getContext('2d'), pageTex, flip, fg: flip.getContext('2d'), flipTex, flipMesh, setFlip };
  };
  NB.U = 16 / PW;
  NB.toW = (px, py) => [(px - PW / 2) * NB.U, (PH / 2 - py) * NB.U];   // page px -> world units

  // ---------- 3D props ----------
  NB.mat = (tex, shade = 1, o = {}) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(shade, shade, shade), side: o.side || THREE.FrontSide, transparent: !!o.transparent });
  // a box from 6 textured faces; textures: {front, back, left, right, top, bottom} as texture fns (g,w,h) or a single fn
  NB.boxProp = (w, h, d, faces, o = {}) => {
    const grp = new THREE.Group(), body = new THREE.Group(); grp.add(body);
    const T = k => { const f = faces[k] || faces.side || faces.front; const px = 150; const dims = { front: [w, h], back: [w, h], left: [d, h], right: [d, h], top: [w, d], bottom: [w, d] }[k]; return NB.canvasTex(Math.max(32, Math.round(dims[0] * px)), Math.max(32, Math.round(dims[1] * px)), f); };
    const add = (k, gw, gh, pos, rot, shade) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), NB.mat(T(k), shade)); m.position.set(...pos); m.rotation.set(...rot); body.add(m); grp.userData[k] = m; return m; };
    add('front', w, h, [0, 0, d / 2], [0, 0, 0], 1); add('back', w, h, [0, 0, -d / 2], [0, Math.PI, 0], .75);
    add('right', d, h, [w / 2, 0, 0], [0, Math.PI / 2, 0], .8); add('left', d, h, [-w / 2, 0, 0], [0, -Math.PI / 2, 0], .8);
    add('top', w, d, [0, h / 2, 0], [-Math.PI / 2, 0, 0], 1.08); add('bottom', w, d, [0, -h / 2, 0], [Math.PI / 2, 0, 0], .6);
    grp.userData.d = d; grp.visible = false; return grp;
  };
  // inflate from a flat drawing (u: 0 flat -> 1 full), centred on the page drawing at (px,py)
  NB.inflate = (grp, u, px, py, o = {}) => {
    const [x, y] = NB.toW(px, py), d = grp.userData.d || 1, depth = lerp(.02, 1, NB.elastic(u)), puff = 1 + (o.puff ?? .1) * Math.sin(Math.PI * clamp(u * 1.4));
    grp.position.set(x, y, d * depth / 2); grp.scale.set(puff, puff, depth * puff); return depth;
  };
  // sticky note: a slightly curled sheet
  NB.sticky3D = (w, h, texFn, seed = 1) => {
    const geo = new THREE.PlaneGeometry(w, h, 12, 12), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), x = pos.getX(i), u = (h / 2 - y) / h; pos.setZ(i, Math.pow(u, 2.2) * .35 + Math.sin(x * 1.3) * .03); }
    geo.computeVertexNormals();
    const tex = NB.canvasTex(512, Math.round(512 * h / w), texFn), m = new THREE.Mesh(geo, NB.mat(tex, 1, { side: THREE.DoubleSide }));
    const grp = new THREE.Group(); grp.add(m); grp.visible = false; return grp;
  };
  // flying paper bits (confetti or scraps)
  NB.burst = (scene, n, seed, colors) => Array.from({ length: n }, (_, i) => {
    const r = rng(seed + i), s = .12 + r() * .22, col = colors[i % colors.length];
    const tex = NB.canvasTex(64, 64, g => { g.fillStyle = col; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, rr = 18 + r() * 12; g.lineTo(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); } g.closePath(); g.fill(); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.visible = false; scene.add(m);
    return { m, v: [(r() - .5) * 6, 2 + r() * 4, 1 + r() * 4], spin: [(r() - .5) * 14, (r() - .5) * 14, (r() - .5) * 10] };
  });
  NB.runBurst = (bits, t, t0, origin, life = 1.8) => bits.forEach(b => { const k = t - t0; b.m.visible = k > 0 && k < life; if (!b.m.visible) return; b.m.position.set(origin[0] + b.v[0] * k, origin[1] + b.v[1] * k - 3.4 * k * k, origin[2] + b.v[2] * k); b.m.rotation.set(b.spin[0] * k, b.spin[1] * k, b.spin[2] * k); b.m.material.opacity = 1 - NB.P(k, life * .6, life * .4); });
  NB.outlined = (geo, tex, shade = 1) => { const g = new THREE.Group(); g.add(new THREE.Mesh(geo, NB.mat(tex, shade))); const o = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#2a1c15', side: THREE.BackSide })); o.scale.setScalar(1.07); g.add(o); g.visible = false; return g; };

  // ---------- timeline (filled by make.mjs) ----------
  NB.TL = { lines: {}, end: 10 };
  NB.st = id => (NB.TL.lines[id] || { start: 0 }).start;
  NB.en = id => { const l = NB.TL.lines[id]; return l ? l.start + l.dur : 0; };
  NB.at = (id, word, nth = 0) => { const l = NB.TL.lines[id]; if (!l) return 0; const hits = l.words.filter(w => w.w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(word.toLowerCase())); return l.start + (hits[nth] || hits[0] || { s: 0 }).s; };
})();
