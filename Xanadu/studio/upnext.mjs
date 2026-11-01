// The upload folders: ~/Desktop/Videos/<channel>/ (Guess The Horror, Strange History, Tech), flat, one copy of the video to post
// for every episode in posting order, each with its cover and post kit, plus an UPLOAD LIST.html per channel.
//   node studio/upnext.mjs [--open]
// For each episode (every channel, Studio Tests excluded, the T7 mirror included for episodes no longer on the Mac):
//   the FINAL if there is one, else the latest take that passed QC. A takes/QC.txt ("Take 07 PASS" lines) lists the
//   passing takes; an episode without one counts its latest take. Anything that isn't a picked FINAL says "(not picked)".
// Copies only (APFS clones, so no extra disk): originals in ~/Desktop/Studio/Episode Files are never moved, renamed or deleted.
// <channel>/posted.txt: one episode name per line, for the ones already up. Run again any time; the producer and
// render.mjs (--pick, --post, --final) refresh it. The list of files it put there is studio/.upnext.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

import { UPLOADS, SERIES as WHERE, macDir, t7Dir } from './lib/paths.mjs';

const MANIFEST = path.join(path.dirname(fileURLToPath(import.meta.url)), '.upnext.json');
// posting order: series in this order, numbered on through each channel (Strange History: Conspiracy Theories, then Sketchy History);
// inside a series by episode number, except FIRST
const SERIES = ['Guess The Horror', 'Conspiracy Theories', 'Sketchy History', 'Tech'];
const CHANNELS = [...new Set(SERIES.map(s => WHERE[s].channel))];
const FIRST = { 'Guess The Horror': ['The Hitchhiker'] };   // the old Ready to Post README: the Hitchhiker goes up first

const mp4s = d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.mp4') && !f.startsWith('.')) : [];
const takeNo = f => +(/ - Take (\d+)\.mp4$/.exec(f)?.[1] || 0);
const durOf = f => { const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(spawnSync(ffmpegPath, ['-i', f], { encoding: 'utf8' }).stderr); return d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0; };
const clock = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function pickFor(series, ep) {
  const mac = path.join(macDir(series), ep), t7 = path.join(t7Dir(series), ep), home = fs.existsSync(mac) ? mac : t7;
  const final = mp4s(home).find(f => f.endsWith(' - FINAL.mp4'));
  if (final) return { file: path.join(home, final), what: 'FINAL', picked: true, home, coverCut: final.replace(/ - FINAL\.mp4$/, '') };
  // takes on the Mac, then any older ones only on the T7; versions such as "Take Me Back" are their own entries
  const takes = [...new Set([...mp4s(path.join(mac, 'takes')), ...mp4s(path.join(t7, 'takes'))])].filter(takeNo);
  const qcFile = [path.join(mac, 'takes', 'QC.txt'), path.join(t7, 'takes', 'QC.txt')].find(f => fs.existsSync(f));
  const passed = qcFile ? new Set([...fs.readFileSync(qcFile, 'utf8').matchAll(/Take (\d+)\s+PASS/gi)].map(m => +m[1])) : null;
  const byCut = {};
  for (const f of takes) { if (passed && !passed.has(takeNo(f))) continue; const cut = f.replace(/ - Take \d+\.mp4$/, ''); if (!byCut[cut] || takeNo(f) > takeNo(byCut[cut])) byCut[cut] = f; }
  return Object.entries(byCut).map(([cut, f]) => ({ cut, file: [path.join(mac, 'takes', f), path.join(t7, 'takes', f)].find(p => fs.existsSync(p)), what: `latest take (Take ${String(takeNo(f)).padStart(2, '0')})`, picked: false, home }));
}

const coverIn = (home, cut) => { const jpgs = fs.existsSync(home) ? fs.readdirSync(home).filter(f => f.endsWith('Thumbnail.jpg')) : []; return jpgs.find(f => f === `${cut} - Thumbnail.jpg`) || jpgs.find(f => !f.includes(' - PS1 ')) || jpgs[0]; };
const kitIn = (home, cut, slugKit) => { const kits = fs.existsSync(home) ? fs.readdirSync(home).filter(f => f.startsWith('Post kit')) : [];
  const own = cut && kits.find(f => f.toLowerCase().includes(cut.split(' - ').at(-1).toLowerCase()));
  return own || kits.find(f => f.includes('playbook')) || kits[0] || slugKit; };
// a crew-made episode keeps its post kit beside its spec until the producer copies it out
const studioKits = () => { const eps = path.join(path.dirname(fileURLToPath(import.meta.url)), 'episodes'), out = {};
  for (const s of fs.readdirSync(eps)) { const k = path.join(eps, s, 'Post kit (playbook).md'), spec = path.join(eps, s, 'spec.js'); if (!fs.existsSync(k) || !fs.existsSync(spec)) continue;
    const t = /title:\s*'([^']+)'/.exec(fs.readFileSync(spec, 'utf8'))?.[1]; if (t) out[t] = k; } return out; };

export function refresh({ open = false, quiet = false } = {}) {
  const kits = studioKits(), posted = new Set(CHANNELS.flatMap(c => { const f = path.join(UPLOADS, c, 'posted.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean) : []; }));
  const rows = [], order = {};
  for (const series of SERIES) {
    const channel = WHERE[series].channel, eps = new Set([macDir(series), t7Dir(series)].flatMap(d => fs.existsSync(d) ? fs.readdirSync(d) : []).filter(e => /^\d+ - /.test(e)));
    const list = [];
    for (const ep of eps) for (const p of [pickFor(series, ep)].flat()) {
      if (!p?.file) continue;
      const title = ep.replace(/^\d+ - /, '').replace(/ \(\d{4}\)$/, '').replace(/ \([^)]*\)$/, ''), cut = p.cut || title;
      list.push({ series, channel, n: +ep.split(' - ')[0], ep: cut === title || !p.cut ? title : cut.replace(/^.* - /, `${title} - `), ...p, cover: coverIn(p.home, p.coverCut || cut), kit: kitIn(p.home, p.cut !== title && p.cut, kits[title]) });
    }
    const first = FIRST[series] || [];
    list.sort((a, b) => ((first.indexOf(a.ep) + 1 || 99) - (first.indexOf(b.ep) + 1 || 99)) || a.n - b.n || a.ep.localeCompare(b.ep));
    for (const r of list) rows.push({ ...r, order: order[channel] = (order[channel] || 0) + 1 });
  }
  // copy flat into ~/Desktop/Videos/<channel>/, replacing only this script's own earlier copies
  const was = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : [], now = [];
  const put = (src, dst) => { if (!src || !fs.existsSync(src)) return null; now.push(dst); const s = fs.statSync(src), d = fs.existsSync(dst) && fs.statSync(dst);
    if (!d || d.size !== s.size || d.mtimeMs < s.mtimeMs) { fs.rmSync(dst, { force: true }); fs.copyFileSync(src, dst, fs.constants.COPYFILE_FICLONE); } return dst; };
  for (const r of rows) {
    const sub = path.join(UPLOADS, r.channel); fs.mkdirSync(sub, { recursive: true });
    const stem = `${String(r.order).padStart(2, '0')} - ${r.ep}`;
    r.video = put(r.file, path.join(sub, `${stem}${r.picked ? '' : ' (not picked)'}.mp4`));
    r.coverOut = null; if (r.cover) { const dst = path.join(sub, `${stem} - cover.png`), src = path.join(r.home, r.cover); now.push(dst);
      if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) spawnSync('sips', ['-s', 'format', 'png', src, '--out', dst], { stdio: 'ignore' }); r.coverOut = dst; }
    r.kitOut = r.kit ? put(path.isAbsolute(r.kit) ? r.kit : path.join(r.home, r.kit), path.join(sub, `${stem} - post kit.md`)) : null;
    r.len = clock(durOf(r.video)); r.posted = posted.has(r.ep.toLowerCase());
  }
  for (const f of was) if (!now.includes(f) && f.startsWith(UPLOADS + path.sep)) fs.rmSync(f, { force: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(now, null, 1));

  const stamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const md = [];
  for (const channel of CHANNELS) {
    const hub = path.join(UPLOADS, channel), mine = rows.filter(r => r.channel === channel), next = mine.find(r => !r.posted);
    const relTo = f => f ? path.relative(hub, f) : '', href = f => encodeURI(relTo(f)).replace(/#/g, '%23');
    md.push(`## ${channel}`, next ? `Next up: ${String(next.order).padStart(2, '0')} - ${next.ep} (${next.picked ? 'FINAL' : next.what + ', not picked yet'})` : 'Everything is posted.',
      ...mine.map(r => `  ${String(r.order).padStart(2, '0')}  ${r.ep.padEnd(36)} ${(r.picked ? 'FINAL' : r.what).padEnd(26)} ${r.len.padStart(5)}  ${r.posted ? 'posted' : ''}`), '');
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(channel)} uploads</title><style>
:root{--bg:#fff;--fg:#1a1a1a;--mute:#666;--line:#ddd;--hi:#fff4c2}@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--mute:#999;--line:#333;--hi:#3a3216}}
body{background:var(--bg);color:var(--fg);font:15px/1.45 -apple-system,system-ui,sans-serif;margin:24px auto;max-width:1100px;padding:0 16px}a{color:inherit}
table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}th{color:var(--mute);font-weight:600}
tr.next{background:var(--hi);font-weight:600}.mute{color:var(--mute)}img{height:72px;border-radius:3px}.wrap{overflow-x:auto}</style>
<h1>${esc(channel)}: what to upload</h1><p class="mute">Updated ${esc(stamp)}. Copies only: the originals stay in ~/Desktop/Studio/Episode Files.</p>
<p>${next ? `<b>Next up: <a href="${href(next.video)}">${String(next.order).padStart(2, '0')} - ${esc(next.ep)}</a></b> (${next.picked ? 'FINAL' : esc(next.what) + ', not picked yet'})` : 'Everything is posted.'}</p>
<div class="wrap"><table><tr><th>#</th><th>Cover</th><th>Episode</th><th>Series</th><th>Files</th><th>FINAL or latest take</th><th>Length</th><th>Posted</th></tr>
${mine.map(r => `<tr${r === next ? ' class="next"' : ''}><td>${String(r.order).padStart(2, '0')}</td><td>${r.coverOut ? `<img src="${href(r.coverOut)}" alt="">` : ''}</td><td>${esc(r.ep)}</td><td>${esc(r.series)}</td><td><a href="${href(r.video)}">video</a>${r.coverOut ? ` · <a href="${href(r.coverOut)}">cover</a>` : ''}${r.kitOut ? ` · <a href="${href(r.kitOut)}">post kit</a>` : ''}</td><td>${r.picked ? 'FINAL' : esc(r.what)}</td><td>${r.len}</td><td>${r.posted ? 'yes' : 'no'}</td></tr>`).join('\n')}</table></div>
<p class="mute">"(not picked)" means no FINAL has been chosen yet; pick one with <code>node studio/render.mjs &lt;slug&gt; --pick=N</code>. Add an episode's name on its own line to posted.txt in this folder once it's up.</p>`;
    fs.mkdirSync(hub, { recursive: true }); fs.writeFileSync(path.join(hub, 'UPLOAD LIST.html'), html);
  }
  if (!quiet) { console.log(md.join('\n')); console.log('UPLOADS →', UPLOADS); }
  if (open) spawnSync('open', [UPLOADS]);
  return rows;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) refresh({ open: process.argv.includes('--open') });
