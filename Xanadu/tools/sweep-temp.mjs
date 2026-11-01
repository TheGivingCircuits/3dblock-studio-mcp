// Empties <root>/Temp of anything older than N hours (default 3). Run by hand or from a schedule: node tools/sweep-temp.mjs [hours]
import fs from 'node:fs'; import path from 'node:path';
import { TEMP } from '../studio/lib/paths.mjs';
const hours = +process.argv[2] || 3, cutoff = Date.now() - hours * 3600e3; let n = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name);
  if (e.isDirectory()) { walk(f); if (!fs.readdirSync(f).length) fs.rmdirSync(f); } else if (fs.statSync(f).mtimeMs < cutoff) { fs.rmSync(f); n++; } } };
if (fs.existsSync(TEMP)) walk(TEMP); console.log(`swept ${n} files older than ${hours} h from ${TEMP}`);
