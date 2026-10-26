// Where things live, and how to find Chrome, ffmpeg and the ElevenLabs key on this machine.
// Override anything with environment variables in your MCP client config.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(PKG, 'engine');
export const CREW = path.join(PKG, 'crew');
export const TEMPLATES = path.join(PKG, 'templates');
export const EXAMPLES = path.join(PKG, 'examples');
export const THREE_BUILD = path.dirname(require.resolve('three'));   // three's main entry lives in build/, next to three.min.js

// the studio folder: episodes, takes and the audio cache. Default ~/3dBlockStudio
export const HOME = path.resolve(process.env.BLOCK_STUDIO_HOME || path.join(os.homedir(), '3dBlockStudio'));
export const EPISODES = path.join(HOME, 'episodes');
export const OUTPUT = path.join(HOME, 'output');
export const CACHE = process.env.ELEVEN_CACHE || path.join(HOME, 'cache', 'eleven');
export const JOBS = path.join(HOME, 'jobs');

export function chromePath() {
  const env = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env) return env;
  const local = process.env.LOCALAPPDATA || '', pf = process.env.PROGRAMFILES || 'C:\\Program Files', pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
  const candidates = {
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
    win32: [path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'), path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'), path.join(local, 'Google\\Chrome\\Application\\chrome.exe'), path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'), path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe')],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/opt/pw-browsers/chromium'],
  }[process.platform] || [];
  for (const c of candidates) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  // Playwright's bundled browsers, if present
  for (const base of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(os.homedir(), '.cache', 'ms-playwright')].filter(Boolean)) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter(d => d.startsWith('chromium')).sort().reverse()) for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) { const p = path.join(base, d, sub); if (fs.existsSync(p)) return p; }
  }
  return null;
}

export function ffmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try { const p = require('ffmpeg-static'); if (p && fs.existsSync(p)) return p; } catch { }
  return 'ffmpeg';
}

// ElevenLabs: ELEVENLABS_API_KEY, or a key file (default ~/.config/elevenlabs.key). The key is never logged or returned by a tool.
export const KEY_FILE = process.env.ELEVEN_KEY_FILE || path.join(os.homedir(), '.config', 'elevenlabs.key');
export function elevenKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  if (fs.existsSync(KEY_FILE)) return fs.readFileSync(KEY_FILE, 'utf8').trim();
  return null;
}

export const SERIES = {
  'Guess The Horror': { engine: 'ps1', length: [61, 75], note: 'Retell a horror movie in PS1 low-poly; never name it. Clue ladder, hidden clue, loop.' },
  'Strange History': { engine: 'woodcut', length: [61, 75], note: 'A strange true event as a living woodcut broadsheet. Era-true clothes and print.' },
  'Custom': { engine: 'ps1', length: [30, 90], note: 'Any story in the PS1 engine.' },
};
