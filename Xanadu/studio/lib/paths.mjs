// Where videos live (Desktop reorganized 2026-10-27, user requested):
//   uploads  ~/Desktop/Videos/<channel>/                     only what gets posted, flat: "NN - Title.mp4", "- cover.png", "- post kit.md", UPLOAD LIST.html
//   library  ~/Desktop/Studio/Episode Files/<series dir>/NN - Title/   originals: takes/, previews/, FINAL, thumbnail, post kits
//   T7       /Volumes/T7 footage/Desktop Videos/<t7 dir>/NN - Title/   the mirror still uses the old channel names
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Everything lives on the T7 under one root ("Shorts Studio"): Engine/ (this code), Support/, Episodes/, Uploads/, Assets/, Temp/.
// ROOT is found from this file's location (Engine/studio/lib), so the folder works from any drive. Override with STUDIO_ROOT.
export const ROOT = process.env.STUDIO_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const ENGINE = path.join(ROOT, 'Engine');
export const SUPPORT = path.join(ROOT, 'Support');
export const ASSETS = path.join(ROOT, 'Assets');
export const TEMP = path.join(ROOT, 'Temp');   // renders, stills and previews: disposable, swept by tools/sweep-temp.mjs
export const UPLOADS = path.join(ROOT, 'Uploads');
export const EPISODES = path.join(ROOT, 'Episodes');
export const T7 = path.join(path.dirname(ROOT), 'Desktop Videos');   // legacy mirror (old takes), read-only history

// series → where its episodes live on the Mac, on the T7, and which upload channel folder it posts to (null: never posted)
export const SERIES = {
  'Guess The Horror': { mac: '02 - Episode Library/Channel 2 - Guess The Horror/Guess The Horror', t7: 'Channel 1 - Midnight/Guess The Horror', channel: 'Guess The Horror' },
  'Conspiracy Theories': { mac: '02 - Episode Library/Channel 1 - Countdown to Strange/Conspiracy Theories', t7: 'Channel 1 - Midnight/Conspiracy Theories', channel: 'Strange History' },
  'Sketchy History': { mac: '02 - Episode Library/Channel 1 - Countdown to Strange/Sketchy History', t7: 'Channel 1 - Midnight/Sketchy History', channel: 'Strange History' },
  'Tech': { mac: '02 - Episode Library/Channel 3 - Tech/Tech', t7: 'Channel 2 - Tech/Tech', channel: 'Tech' },
  'Studio Tests': { mac: '03 - Tests/Studio tests', t7: 'Studio Tests', channel: null },
};

export const macDir = series => path.join(EPISODES, (SERIES[series] || { mac: series }).mac);
export const t7Dir = series => path.join(T7, (SERIES[series] || { t7: series }).t7);
// the T7 copy of any path inside a series' Mac folder
export const t7Of = (series, macPath) => path.join(t7Dir(series), path.relative(macDir(series), macPath));
