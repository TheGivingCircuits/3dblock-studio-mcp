// Free an SSD copy of raw plates once the T7 holds a verified copy:   node studio/free-plates.mjs <slug> <take number>
// Goes through lib/shoot.mjs freeSSDCopy, the one guarded delete: the T7 mounted and readable, the copy matching file for file, or nothing is deleted.
import path from 'node:path';
import { freeSSDCopy, PLATE_ROOT } from './lib/shoot.mjs';
const [slug, take] = process.argv.slice(2);
if (!slug || !take) { console.log('usage: node studio/free-plates.mjs <slug> <take number>'); process.exit(1); }
const r = freeSSDCopy(slug, path.join(PLATE_ROOT, slug, `take-${String(take).padStart(2, '0')}`)); process.exit(r.freed ? 0 : 2);
