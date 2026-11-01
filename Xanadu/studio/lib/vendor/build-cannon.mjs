// Wraps node_modules/cannon-es (an ES module) as a classic script that sets window.CANNON, so scene pages can load it with a plain <script> tag
// before lib/physics.js. Re-run after upgrading cannon-es: node studio/lib/vendor/build-cannon.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const src = fs.readFileSync(path.join(root, 'node_modules/cannon-es/dist/cannon-es.js'), 'utf8'), ver = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/cannon-es/package.json'), 'utf8')).version;
const m = src.match(/\nexport \{([^}]*)\};?\s*$/); if (!m) throw new Error('cannon-es: export list not found');
const body = src.slice(0, m.index), names = m[1].split(',').map(s => s.trim()).filter(Boolean);
const out = `// cannon-es ${ver} (MIT, https://github.com/pmndrs/cannon-es), wrapped by build-cannon.mjs as window.CANNON. Do not edit.\n(function () {\n${body}\nwindow.CANNON = { ${names.join(', ')}, version: '${ver}' };\n})();\n`;
fs.writeFileSync(path.join(root, 'studio/lib/vendor/cannon.js'), out); console.log(`cannon.js ← cannon-es ${ver}, ${names.length} exports, ${(out.length / 1024).toFixed(0)} KB`);
