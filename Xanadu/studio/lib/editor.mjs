// THE EDITOR (Phase 5): writes edit.json, the cut the post stage plays, from the shot plates (take.json), the narration timeline and the
// sound scan's actions. Rules (docs/crew and .claude/agents/editor.md):
//   - angles: where shots overlap (coverage, `cover: true`), pick per beat: the speaker's or subject's angle, a different size from the last
//     cut, the closer angle for a clue, no angle held past 4 s when another tells the beat
//   - cuts land on action (a foot plant, an impact, a door within a quarter second) or, failing that, in the gap between two words
//   - the first 2 s are the hook: picture moving from frame 1 with the title card on it (spec.cover / the HUD), no dead air
//   - the clue ladder (spec.clues [{ at, dur, what }]): every clue fully on one shot, in order, the giveaway held longest and last
//   - length 61 to 75 s for an episode (studio tests are exempt and say so)
//   - J and L cuts at every change of space (the mixer leads the next room's sound .45 s early and lets the last one ring .3 s)
//   - the loop: last frame back to frame 1's set, light and camera; both ends key frames at the same encoding (post-run.mjs), checked raw and
//     grain-blind by render.mjs
// edit.json: { from, cut: [{ shot, in, out, at, why }], cuts: [{ t, on }], cover, clues, jl, length, checks: [...] }
const FPS = 30, near = (xs, t, w) => xs.filter(x => Math.abs(x - t) <= w).sort((a, b) => Math.abs(a - t) - Math.abs(b - t))[0];
export function cut({ take, timeline, SPEC, scan, episode = true }) {
  const shots = take.shots.map(s => ({ ...s, a: s.f0 / FPS, b: s.f1 / FPS })), END = take.frames / FPS, checks = [], whoAt = t => { for (const l of SPEC.lines || []) { const L = timeline.lines[l.id]; if (L && t >= L.start && t < L.start + L.dur) return l.who || null; } return null; };
  const clues = (SPEC.clues || []).map(c => ({ ...c, at: typeof c.at === 'number' ? c.at : (timeline.lines[c.at[0]] ? timeline.lines[c.at[0]].start + (c.at[1] || 0) : 0) }));
  // 1. the beats: every shot boundary splits the timeline; each piece gets one angle
  const B = [...new Set([0, END, ...shots.flatMap(s => [s.a, s.b]), ...clues.flatMap(c => [c.at, c.at + c.dur])].map(x => +Math.max(0, Math.min(END, x)).toFixed(3)))].sort((a, b) => a - b), pieces = [];
  let prev = null, held = 0;
  for (let i = 0; i + 1 < B.length; i++) { const a = B[i], b = B[i + 1]; if (b - a < 1e-3) continue; const mid = (a + b) / 2, cands = shots.filter(s => s.a <= a + 1e-3 && s.b >= b - 1e-3); if (!cands.length) { checks.push(`no shot covers ${a.toFixed(2)}-${b.toFixed(2)} s`); continue; }
    const who = whoAt(mid), clue = clues.find(c => mid >= c.at && mid < c.at + c.dur);
    const score = s => (s.id === (prev && prev.id) ? (held > 4 ? -1 : 1.5) : 0) + (who && s.subject.startsWith(who) ? 2 : 0) + (prev && s.size !== prev.size ? .6 : 0) + (clue && (/CU|ECU|INSERT/.test(s.size) || /clue/i.test(s.note)) ? 2.5 : 0) - (s.cover ? .1 : 0);
    const pick = cands.sort((x, y) => score(y) - score(x) || x.a - y.a)[0], why = cands.length > 1 ? `${pick.id} over ${cands.filter(c => c !== pick).map(c => c.id).join(', ')}${clue ? ` (clue: ${clue.what})` : who ? ` (${who} speaking)` : ''}` : 'the only angle';
    if (pieces.length && pieces.at(-1).shot === pick.id) { pieces.at(-1).b = b; } else pieces.push({ shot: pick.id, a, b, why }); held = prev && prev.id === pick.id ? held + (b - a) : b - a; prev = pick; }
  // 2. cut points: onto an action or a word gap when both angles cover the moment
  const actions = (scan ? scan.events : []).filter(e => ['step', 'impact', 'door', 'carDoor', 'hit'].includes(e.kind) && e.seen).map(e => e.t), gaps = [];
  for (const L of Object.values(timeline.lines)) { const w = L.words || []; for (let i = 0; i + 1 < w.length; i++) if (w[i + 1].s - w[i].e > .06) gaps.push(L.start + (w[i].e + w[i + 1].s) / 2); gaps.push(L.start + L.dur + .1); }
  const cuts = [];
  for (let i = 1; i < pieces.length; i++) { const A = pieces[i - 1], Bp = pieces[i], sa = shots.find(s => s.id === A.shot), sb = shots.find(s => s.id === Bp.shot), t = A.b, lo = Math.max(sb.a, A.a + .4), hi = Math.min(sa.b, Bp.b - .4);
    const act = near(actions.filter(x => x >= lo && x <= hi), t, .25), gap = act == null ? near(gaps.filter(x => x >= lo && x <= hi), t, .25) : null, nt = act ?? gap ?? t; A.b = Bp.a = nt; cuts.push({ t: +nt.toFixed(3), on: act != null ? 'action' : gap != null ? 'word gap' : 'as shot' }); }
  // 3. frames: each piece in its shot's own frame numbers
  const cutList = pieces.map(p => { const s = shots.find(x => x.id === p.shot), i0 = Math.round(p.a * FPS) - s.f0, i1 = Math.round(p.b * FPS) - s.f0; return { shot: p.shot, in: Math.max(0, i0), out: Math.min(s.f1 - s.f0, i1), at: +p.a.toFixed(3), why: p.why }; }).filter(c => c.out > c.in);
  // 4. the checks
  const len = cutList.reduce((a, c) => a + c.out - c.in, 0) / FPS; if (Math.abs(len - END) > .05) checks.push(`cut length ${len.toFixed(2)} s differs from the take's ${END.toFixed(2)} s`);
  if (episode && (len < 61 || len > 75)) checks.push(`length ${len.toFixed(1)} s is outside 61-75 s`); const first = cutList[0];
  const cover = { until: 2.0, card: SPEC.cover || (SPEC.meta && `${SPEC.meta.series} #${SPEC.meta.n}`) || null, firstShot: first && first.shot, note: 'motion from frame 1 under the title card; no dead air before the first picture' };
  if (first && (first.out - first.in) / FPS > 4 && episode) checks.push(`the hook holds one shot for ${((first.out - first.in) / FPS).toFixed(1)} s: cut inside the first 2-3 s`);
  let lastClue = -1; const clueOut = clues.map((c, k) => { const piece = cutList.find(p => p.at <= c.at + 1e-3 && p.at + (p.out - p.in) / FPS >= c.at + c.dur - 1e-3); if (!piece) checks.push(`clue "${c.what}" is split across a cut`); if (c.at < lastClue) checks.push(`clue "${c.what}" is out of order`); lastClue = c.at; return { what: c.what, at: c.at, dur: c.dur, shot: piece && piece.shot, giveaway: k === clues.length - 1 }; });
  if (clueOut.length > 1 && clueOut.at(-1).dur < Math.max(...clueOut.slice(0, -1).map(c => c.dur))) checks.push('the giveaway is not the longest-held clue');
  const jl = []; if (scan) { for (let i = 1; i < scan.shots.length; i++) if (scan.shots[i].space !== scan.shots[i - 1].space) jl.push({ t: scan.shots[i].t, from: scan.shots[i - 1].space, to: scan.shots[i].space, J: .45, L: .3 }); }
  if (!episode) checks.push('studio test: the 61-75 s length rule does not apply');
  return { from: 'lib/editor.mjs', cut: cutList, cuts, cover, clues: clueOut, jl, length: +len.toFixed(2), loop: { seam: 'first and last frame compared raw and grain-blind by render.mjs (≥ 0.95); both ends are key frames at the same encoding' }, checks }; }
