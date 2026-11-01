// The cached sound library: every sound effect prompt any spec has ever asked for, checked against the ElevenLabs cache on disk, written to
// studio/lib/sfx-index.json as [{ key, prompt, duration, file, from: [specs] }]. The mixer (Phase 5) only uses sounds listed here as cached,
// so nothing is generated (or paid for) at mix time.   node studio/lib/sfx-index.mjs
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { CACHE } from '../../eleven.mjs';
const studio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), hash = (...p) => crypto.createHash('sha1').update(p.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('|')).digest('hex');
const specs = []; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name === 'spec.js') specs.push(f); } };
walk(path.join(studio, 'conspiracy')); walk(path.join(studio, 'shorts')); const out = new Map();
for (const f of specs) { let S; try { globalThis.window = globalThis; delete globalThis.SPEC; (0, eval)(fs.readFileSync(f, 'utf8')); S = globalThis.SPEC; } catch { continue; } if (!S || !S.sfx) continue;
  for (const [key, v] of Object.entries(S.sfx)) { const [prompt, duration = null, influence = .5] = Array.isArray(v) ? v : [v]; const file = path.join(CACHE, 'sfx-' + hash('sfx', prompt, duration, influence) + '.wav');
    const id = prompt + '|' + duration; if (!out.has(id)) out.set(id, { key, prompt, duration, cached: fs.existsSync(file), file: path.basename(file), from: [] }); out.get(id).from.push(path.relative(studio, f)); } }
const list = [...out.values()].sort((a, b) => a.prompt.localeCompare(b.prompt)); fs.writeFileSync(path.join(studio, 'studio/lib/sfx-index.json'), JSON.stringify(list, null, 1));
console.log(`${list.length} sound prompts, ${list.filter(x => x.cached).length} cached, from ${specs.length} specs`);
