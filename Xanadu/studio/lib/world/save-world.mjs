// Saves a biome as a fixed world: node studio/lib/world/save-world.mjs <biome> --seed=N --name=<name> [--opts='{"lots":6}']
// Writes lib/world/worlds/<name>.json and rebuilds all.js. From then on a scene loads it with WORLD.load('<name>'): the same world every time.
// Edit the JSON to change a world (move a house, repaint it, delete a tree); never regenerate a saved world over itself.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url'; import { execFileSync } from 'node:child_process';
const dir = path.dirname(fileURLToPath(import.meta.url)), [biome, ...rest] = process.argv.slice(2), arg = k => (rest.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(dir, 'layouts.js'), 'utf8'), ctx); const L = ctx.WORLD_LAYOUTS;
if (!biome || !L.BIOMES.includes(biome)) { console.log(`usage: node save-world.mjs <${L.BIOMES.join(' | ')}> --seed=N --name=<name> [--opts='{...}']`); process.exit(1); }
const seed = +(arg('seed') || 1), name = arg('name') || `${biome}-${seed}`, opts = arg('opts') ? JSON.parse(arg('opts')) : {}, out = path.join(dir, 'worlds', name + '.json');
if (fs.existsSync(out) && !rest.includes('--force')) { console.log(`${out} exists (it may have hand edits). Pick another name, or add --force to replace it.`); process.exit(1); }
const layout = L[biome](seed, { ...opts, name }); fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ ...layout, saved: new Date().toISOString().slice(0, 10), opts }, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v, 1));
console.log(`saved ${name}: ${layout.pieces.length} pieces (${[...new Set(layout.pieces.map(p => p.type))].join(', ')}) → ${out}`);
execFileSync(process.execPath, [path.join(dir, 'build.mjs')], { stdio: 'inherit' });
