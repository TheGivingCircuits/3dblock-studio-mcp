// The post stage (Phase 2 of the production suite): raw plates in, a graded 1080x1920 frame out. Runs on the GPU in the browser
// (lib/post/post.html, driven by lib/post-run.mjs). Per frame it reads three 16-bit PNG plates (linear colour, depth, motion) and the
// 8-bit overlay plate (captions, title card), then: motion blur from the motion plate (if chosen), lens distortion, depth of field from
// the depth plate with the shot's real lens and stop (bokeh by lens: round, oval for anamorphic, cat-eye at the edges), colour fringe,
// halation, bloom and flares; then the film layer and the grade (roll-off, lift / gamma / gain, contrast, a print curve, saturation,
// temperature, a vibrancy ceiling, vignette, grain by stock, weave, flicker, dust and scratches, light leaks, the Super 8 gate,
// letterbox) and the PS1 output stage (15-bit colour with ordered dither). The plate grid stays chunky: everything samples plate pixels.
(function () {
const POST = window.POST = {};
const W = 1080, H = 1920;
const R = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H); (document.body || document.documentElement).appendChild(R.domElement);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), VSQ = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const pass = (fs, u) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VSQ, fragmentShader: fs, depthTest: false, depthWrite: false }), sc = new THREE.Scene(); sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m)); return { m, sc, run(rt) { R.setRenderTarget(rt || null); R.render(sc, ortho); } }; };
const frt = (w, h, lin) => new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, minFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, magFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, depthBuffer: false });
const dtex = (w, h) => { const t = new THREE.DataTexture(new Float32Array(w * h * 4), w, h, THREE.RGBAFormat, THREE.FloatType); t.minFilter = t.magFilter = THREE.NearestFilter; t.flipY = false; t.needsUpdate = true; return t; };

// ---------- a small PNG reader (8/16-bit, grey / RGB / RGBA) built on the browser's own inflate ----------
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
POST.png = async url => { const res = await fetch(url); if (!res.ok) throw new Error('missing plate ' + url); const b = new Uint8Array(await res.arrayBuffer()), dv = new DataView(b.buffer); let p = 8, w, h, depth, ctype; const idat = [];
  while (p < b.length) { const len = dv.getUint32(p), type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]); if (type === 'IHDR') { w = dv.getUint32(p + 8); h = dv.getUint32(p + 12); depth = b[p + 16]; ctype = b[p + 17]; } else if (type === 'IDAT') idat.push(b.subarray(p + 8, p + 8 + len)); else if (type === 'IEND') break; p += 12 + len; }
  const raw = new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ctype], bpp = ch * depth / 8, stride = w * bpp, out = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], si = y * (stride + 1) + 1, di = y * stride, pi = di - stride;
    for (let x = 0; x < stride; x++) { const v = raw[si + x], a = x >= bpp ? out[di + x - bpp] : 0, up = y ? out[pi + x] : 0, c = x >= bpp && y ? out[pi + x - bpp] : 0;
      out[di + x] = f === 0 ? v : f === 1 ? v + a : f === 2 ? v + up : f === 3 ? v + ((a + up) >> 1) : v + paeth(a, up, c); } }
  return { w, h, ch, depth, data: out }; };
// fill a float RGBA texture from a decoded plate: scale maps the stored value to plate units, off subtracts an offset (motion)
const fill = (tex, img, scale, off = 0) => { const d = tex.image.data, s = img.data, n = img.w * img.h, ch = img.ch;
  if (img.depth === 16) for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const c = k < ch ? k : ch === 1 && k < 3 ? 0 : -1; d[i * 4 + k] = c < 0 ? 1 : (((s[(i * ch + c) * 2] << 8) | s[(i * ch + c) * 2 + 1]) - off) * scale; }
  else for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) d[i * 4 + k] = (k < ch ? s[i * ch + k] : 255) / 255;
  tex.needsUpdate = true; };

let PW, PH, tC, tD, tM, tO, rtMB, rtL, rtH1, rtH2, rtQ1, rtQ2, rtS, P = {};
POST.init = (info) => { PW = info.w; PH = info.h; tC = dtex(PW, PH); tD = dtex(PW, PH); tM = dtex(PW, PH); tO = dtex(info.hud[0], info.hud[1]); POST.head = info.head;
  rtMB = frt(PW, PH); rtL = frt(PW, PH); rtH1 = frt(PW / 2, PH / 2, true); rtH2 = frt(PW / 2, PH / 2, true); rtQ1 = frt(PW / 4, PH / 4, true); rtQ2 = frt(PW / 4, PH / 4, true); rtS = frt(PW / 4, PH / 4, true);
  const res = new THREE.Vector2(PW, PH);
  // 1. motion blur along the motion plate's velocity (shutter angle / 360 of a frame interval)
  P.mb = pass(`uniform sampler2D col, mot; uniform vec2 res; uniform float shutter, on; varying vec2 vUv; void main(){ vec2 uv = vec2(vUv.x, 1.0 - vUv.y); vec3 c = texture2D(col, uv).rgb;
    if (on > 0.5) { vec2 v = texture2D(mot, uv).xy / 256.0 * shutter; float l = length(v); if (l > 0.6) { vec3 a = vec3(0.0); for (int i = 0; i < 9; i++) a += texture2D(col, uv + v * (float(i) / 8.0 - 0.5) / res).rgb; c = a / 9.0; } }
    gl_FragColor = vec4(c, 1.0); }`, { col: { value: tC }, mot: { value: tM }, res: { value: res }, shutter: { value: .5 }, on: { value: 0 } });
  // 2. the lens: distortion, depth of field (coc from the depth plate), cat-eye / oval bokeh, colour fringe
  P.lens = pass(`uniform sampler2D col, dep; uniform vec2 res; uniform float focus, focal, N, sensor, cocAcc, dist, cat, squeeze, fringe, maxR, on; varying vec2 vUv;
    float D(vec2 uv) { return max(texture2D(dep, vec2(uv.x, 1.0 - uv.y)).r, 0.01); }
    float cocPx(float d) { float Dm = d * 1000.0, S = focus * 1000.0, c = abs(Dm - S) / Dm * focal * focal / (N * max(S - focal, 1.0)); return clamp((c - cocAcc) / sensor * res.y * 0.5, 0.0, maxR); }
    vec3 C(vec2 uv) { return texture2D(col, uv).rgb; }
    void main(){ vec2 q = vUv - 0.5, qa = q * vec2(res.x / res.y, 1.0); float r2 = dot(qa, qa) * 4.0; vec2 uv = 0.5 + q * (1.0 + dist * r2) / (1.0 + dist * 0.6);
      vec2 px = (floor(uv * res) + 0.5) / res; float cc = on > 0.5 ? cocPx(D(px)) : 0.0, dc = D(px); vec3 c = C(px);
      if (cc >= 0.6) { vec3 a = c; float wt = 1.0; for (int i = 0; i < 72; i++) { float fi = float(i), rr = sqrt((fi + 0.5) / 72.0) * cc, an = fi * 2.39996; vec2 o = vec2(cos(an), sin(an) * squeeze) * rr;
          if (length(o / max(cc, 0.001) + q * 2.0 * cat) > 1.15) continue; vec2 s = px + o / res; float ds = D(s), sc = cocPx(ds); float w = ds < dc ? clamp(sc - rr + 1.0, 0.0, 1.0) : 1.0; vec3 v = C(s); w *= 1.0 + 0.6 * dot(v, vec3(0.3, 0.59, 0.11)); a += v * w; wt += w; } c = a / wt; }
      vec2 fo = q * r2 * fringe * 2.2 / res; c.r = mix(c.r, C(px + fo).r, min(1.0, fringe)); c.b = mix(c.b, C(px - fo).b, min(1.0, fringe));
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) c = vec3(0.0); gl_FragColor = vec4(c, 1.0); }`,
    { col: { value: rtMB.texture }, dep: { value: tD }, res: { value: res }, focus: { value: 2 }, focal: { value: 35 }, N: { value: 4 }, sensor: { value: 24.9 }, cocAcc: { value: .019 }, dist: { value: 0 }, cat: { value: .3 }, squeeze: { value: 1 }, fringe: { value: .3 }, maxR: { value: 18 }, on: { value: 1 } });
  // 3. highlights: threshold → halation (tight) and bloom (wide), plus an anamorphic streak
  P.bright = pass(`uniform sampler2D src; uniform float thr; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; gl_FragColor = vec4(max(c - thr, 0.0), 1.0); }`, { src: { value: rtL.texture }, thr: { value: .9 } });
  P.blur = pass(`uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 a = vec3(0.0); float w = 0.0; for (int i = -6; i <= 6; i++) { float k = exp(-float(i * i) / 18.0); a += texture2D(src, vUv + dir * float(i)).rgb * k; w += k; } gl_FragColor = vec4(a / w, 1.0); }`, { src: { value: null }, dir: { value: new THREE.Vector2() } });
  P.streak = pass(`uniform sampler2D src; varying vec2 vUv; void main(){ vec3 a = vec3(0.0); for (int i = -24; i <= 24; i++) { float k = exp(-abs(float(i)) / 9.0); a += texture2D(src, vUv + vec2(float(i) * 0.012, 0.0)).rgb * k; } gl_FragColor = vec4(a * 0.12, 1.0); }`, { src: { value: rtQ1.texture } });
  // 4. the film layer and the grade, drawn into the 1080x1920 frame on the plate grid, then the overlay plate
  P.fin = pass(`uniform sampler2D lens, hal, blm, stk, ovl; uniform vec2 res, ores; uniform float time, frame, exposure, rolloff, gammaO, sat, contrast, temp, printC, vib, halA, blmA, flare, streak, vig, grain, gsize, weave, flick, dust, leaks, bars, s8, dither, scan, ghostA;
    uniform vec3 lift, gain, gam; uniform float grid, dlev; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } float h1(float x) { return fract(sin(x * 91.7) * 43758.5453); }
    void main(){ vec2 wv = vec2(h1(frame) - 0.5, h1(frame + 7.0) - 0.5) * weave * 2.0 / res; vec2 uv = vUv + wv;
      // the Super 8 frame-line bleed: the top sliver shows the bottom of the frame, below a black line
      float fl = 0.03 * s8; vec2 suv = uv; float bleed = 0.0; if (s8 > 0.5 && uv.y > 1.0 - fl) { suv.y = uv.y - (1.0 - fl) + 0.0; bleed = 1.0; }
      vec2 px = floor(suv * res), pu = (px + 0.5) / res; vec3 c = texture2D(lens, pu).rgb * exp2(exposure) * (1.0 + flick * (h1(frame * 1.7) - 0.5) * 0.25);
      c += texture2D(hal, pu).rgb * halA * vec3(1.0, 0.38, 0.14) + texture2D(blm, pu).rgb * blmA;
      vec2 g = 1.0 - pu; c += (texture2D(blm, 0.5 + (g - 0.5) * 0.55).rgb * vec3(0.5, 0.7, 1.0) + texture2D(blm, 0.5 + (g - 0.5) * 1.6).rgb * vec3(1.0, 0.6, 0.3) * 0.6) * flare * ghostA;
      c += texture2D(stk, pu).rgb * streak * vec3(0.35, 0.55, 1.4);
      // highlight roll-off (a soft shoulder), the house gamma, then the grade
      c = max(c, 0.0); c = mix(c, 1.0 - exp(-c * 1.15), rolloff * smoothstep(0.55, 1.4, c)); c = pow(c, vec3(0.72 / gammaO) / gam);
      c = clamp(c, 0.0, 1.0); c = c * gain + lift * (1.0 - c); c = clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0); vec3 s = c * c * (3.0 - 2.0 * c); c = mix(c, s, printC);
      float l = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(vec3(l), c, sat); c.r += temp * 0.07; c.b -= temp * 0.07;
      vec3 dch = c - l; float chroma = length(dch); if (chroma > vib) c = l + dch * vib / chroma;
      // light leaks, vignette, grain (stronger in the shadows), dust and scratches, the Super 8 rounded gate, bars
      c += leaks * vec3(1.0, 0.42, 0.12) * smoothstep(0.55, 0.0, length(vUv - vec2(0.05 + 0.1 * sin(time * 0.31), 0.85 + 0.1 * sin(time * 0.23)))) * (0.6 + 0.4 * sin(time * 1.3));
      vec2 q = (vUv - 0.5) * vec2(ores.x / ores.y, 1.0); c *= 1.0 - vig * dot(q, q) * 1.6;
      vec2 pg = floor(px / grid); vec2 gp = floor(pg / gsize); float gr = h(gp + frame * 1.31) - 0.5; l = clamp(dot(c, vec3(0.3, 0.59, 0.11)), 0.0, 1.0); c += gr * grain * (0.35 + 1.4 * (1.0 - l) * (1.0 - l));
      if (dust > 0.0) { vec2 cell = floor(pg / vec2(6.0, 6.0)); if (h(cell + floor(frame) * 3.7) > 1.0 - dust * 0.004) c *= 0.15; float sx = h1(floor(frame) * 0.37); if (h1(floor(frame) * 1.9) < dust * 0.25 && abs(px.x - floor(sx * res.x + sin(vUv.y * 9.0) * 2.0)) < 0.6) c += 0.35; }
      if (s8 > 0.5) { vec2 b = abs(vUv - 0.5) - vec2(0.47, 0.475) + 0.06; float d = length(max(b, 0.0)) - 0.06; c *= smoothstep(0.012, -0.004, d); if (bleed > 0.5) c *= 0.55; if (abs(vUv.y - (1.0 - fl)) < 0.004 && s8 > 0.5) c *= 0.0; }
      if (scan > 0.0 && mod(pg.y, 2.0) >= 1.0) c *= 1.0 - scan;
      if (dither > 0.5) { vec2 bp = mod(pg, 4.0); int bi = int(bp.x) + int(bp.y) * 4; float bm[16]; bm[0]=0.;bm[1]=8.;bm[2]=2.;bm[3]=10.;bm[4]=12.;bm[5]=4.;bm[6]=14.;bm[7]=6.;bm[8]=3.;bm[9]=11.;bm[10]=1.;bm[11]=9.;bm[12]=15.;bm[13]=7.;bm[14]=13.;bm[15]=5.;
        float bb = 0.0; for (int k = 0; k < 16; k++) if (k == bi) bb = bm[k]; c = floor(c * dlev + bb / 16.0) / dlev; }
      if (vUv.y < bars || vUv.y > 1.0 - bars) c = vec3(0.0);
      vec4 o = texture2D(ovl, vec2(vUv.x, 1.0 - vUv.y)); gl_FragColor = vec4(mix(clamp(c, 0.0, 1.0), o.rgb, o.a), 1.0); }`,
    { lens: { value: rtL.texture }, hal: { value: rtH2.texture }, blm: { value: rtQ2.texture }, stk: { value: rtS.texture }, ovl: { value: tO }, res: { value: res }, ores: { value: new THREE.Vector2(W, H) },
      ...Object.fromEntries(['time', 'frame', 'exposure', 'rolloff', 'gammaO', 'sat', 'contrast', 'temp', 'printC', 'vib', 'halA', 'blmA', 'flare', 'streak', 'vig', 'grain', 'gsize', 'weave', 'flick', 'dust', 'leaks', 'bars', 's8', 'dither', 'scan', 'ghostA'].map(k => [k, { value: 0 }])),
      lift: { value: new THREE.Vector3() }, gain: { value: new THREE.Vector3(1, 1, 1) }, gam: { value: new THREE.Vector3(1, 1, 1) }, grid: { value: PW / 540 }, dlev: { value: 63 } });
  P.lens.m.uniforms.maxR.value = 18 * PW / 540;   // blur radius scales with the plate; grain and dither stay on the 540x960 grid (the PS1 texture of the frame)
  return true; };

// grain by stock: amount and grain size in plate pixels
const STOCK = { 'large-format': [.022, 1], super35: [.034, 1], '16mm': [.06, 1], super8: [.1, 2], video: [.028, 1] };
let SHOT = null, GR = null;
// per shot: the lens and body from shot.json, the merged grade (power grade → episode grade → this shot's block)
POST.setShot = (shot, grade) => { SHOT = shot; GR = grade; const f = grade.film || {}, pr = shot.profile, L = P.lens.m.uniforms, F = P.fin.m.uniforms;
  L.N.value = shot.stop; L.sensor.value = shot.sensor[0]; L.cocAcc.value = shot.coc; L.dist.value = pr.dist * (f.distortion ?? 1); L.cat.value = pr.cat; L.squeeze.value = pr.bokeh === 'oval' ? (pr.squeeze || 1.6) : 1; L.fringe.value = pr.fringe * (f.fringe ?? 1); L.on.value = f.dof === false ? 0 : 1;
  P.mb.m.uniforms.on.value = grade.motionBlur === 'post' || shot.motionBlur === 'post' ? 1 : 0; P.mb.m.uniforms.shutter.value = shot.shutter / 360;
  const st = STOCK[f.stock || shot.stock] || STOCK.super35; const set = (k, v) => F[k].value = v;
  set('exposure', grade.exposure ?? 0); set('rolloff', f.rolloff ?? .8); set('gammaO', typeof grade.gamma === 'number' ? grade.gamma : 1); F.gam.value.set(...(Array.isArray(grade.gamma) ? grade.gamma : [1, 1, 1]));
  F.lift.value.set(...(grade.lift || [0, 0, 0])); F.gain.value.set(...(grade.gain || [1, 1, 1])); set('sat', grade.sat ?? 1); set('contrast', grade.contrast ?? 1); set('temp', grade.temp ?? 0); set('printC', grade.print ?? 0); set('vib', grade.vibrancy ?? .6);
  set('halA', f.halation ?? (shot.stock === 'video' ? 0 : .25)); set('blmA', f.bloom ?? .3); set('flare', f.flares ?? .6); set('streak', pr.flare === 'streak' ? (f.streak ?? 1) : 0); set('ghostA', pr.flare === 'warm' ? 1.4 : 1);
  set('vig', pr.vig * (f.vignette ?? 1)); set('grain', st[0] * (f.grain ?? 1)); set('gsize', st[1]); set('weave', f.weave ?? (shot.stock === 'super8' ? 1.2 : 0)); set('flick', f.flicker ?? (shot.stock === 'super8' ? .5 : 0));
  set('dust', f.dust ?? (shot.stock === 'super8' ? 1 : 0)); set('leaks', f.leaks ?? 0); set('bars', grade.letterbox || 0); set('s8', shot.gate === 'round' ? 1 : 0); set('dither', f.dither === false ? 0 : 1); set('dlev', f.ditherLevels ?? 63); set('scan', f.scanlines ?? 0);
  P.bright.m.uniforms.thr.value = f.threshold ?? .9; return true; };
// one frame: load the plates, run the passes, draw. fm = the frame's metadata from shot.json (focus, focal length)
POST.frame = async (base, n, fm, globalFrame) => { const t0 = performance.now(), id = String(n).padStart(5, '0');
  const [c, d, m, o] = await Promise.all([POST.png(`${base}/color/${id}.png`), POST.png(`${base}/depth/${id}.png`), POST.png(`${base}/motion/${id}.png`), POST.png(`${base}/overlay/${id}.png`)]); const t1 = performance.now();
  fill(tC, c, POST.head / 65535); fill(tD, d, 1 / 1000); fill(tM, m, 1, 32768); fill(tO, o, 1); const t2 = performance.now();
  const L = P.lens.m.uniforms; L.focus.value = fm.focus; L.focal.value = fm.f; const F = P.fin.m.uniforms; F.time.value = fm.t; F.frame.value = globalFrame;
  P.mb.run(rtMB); P.lens.run(rtL); P.bright.m.uniforms.src.value = rtL.texture; P.bright.run(rtH1);
  const bl = (src, dst, dx, dy) => { P.blur.m.uniforms.src.value = src.texture; P.blur.m.uniforms.dir.value.set(dx, dy); P.blur.run(dst); };
  bl(rtH1, rtH2, 1 / (PW / 2), 0); bl(rtH2, rtH1, 0, 1 / (PH / 2)); P.blur.m.uniforms.src.value = rtH1.texture; P.blur.m.uniforms.dir.value.set(0, 0); P.blur.run(rtH2);   // halation: one tight blur at half res
  P.blur.m.uniforms.src.value = rtH2.texture; P.blur.m.uniforms.dir.value.set(0, 0); P.blur.run(rtQ1); bl(rtQ1, rtQ2, 2 / (PW / 4), 0); bl(rtQ2, rtQ1, 0, 2 / (PH / 4)); bl(rtQ1, rtQ2, 4 / (PW / 4), 0); bl(rtQ2, rtQ1, 0, 4 / (PH / 4));
  P.blur.m.uniforms.src.value = rtQ1.texture; P.blur.m.uniforms.dir.value.set(0, 0); P.blur.run(rtQ2);   // bloom: wide, at quarter res
  P.streak.run(rtS); P.fin.run(null); R.getContext().finish(); return { load: +(t1 - t0).toFixed(1), upload: +(t2 - t1).toFixed(1), gpu: +(performance.now() - t2).toFixed(1) }; };
window.ready = true;
})();
