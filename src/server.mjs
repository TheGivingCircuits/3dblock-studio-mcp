// 3dBlock Studio MCP server: tools, crew prompts and example resources over stdio.
import fs from 'node:fs';
import path from 'node:path';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as St from './studio.mjs';
import { PKG } from './config.mjs';

const VERSION = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;
const server = new McpServer({ name: '3dblock-studio', version: VERSION }, {
  instructions: `3dBlock Studio makes PS1-style low-poly 3D short videos (1080x1920, 30 fps, seamless loop) from a script and a three.js scene.
Workflow: studio_info (check Chrome, ffmpeg, ElevenLabs key) -> get_house_rules -> new_episode -> write spec.js (the script + sound) -> voice_lines -> read an example (read_episode the-cursed-tape-ps1) and get_engine_guide -> write scene.js -> render_stills and look at the contact sheet -> fix -> render_take -> job_status until done -> qc -> the user picks a take (pick_take) -> post_kit.
Act as the crew: get_crew_brief gives each role's job (director, writer, cinematographer, gaffer, colorist...). The user approves the script, the cast and the final take.
Renders run on this machine and take minutes: start them, then poll job_status. Without an ElevenLabs key, pass draft: true for silent previews.`,
});

const text = (o) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] });
const image = (file, caption) => ({ content: [{ type: 'image', data: fs.readFileSync(file).toString('base64'), mimeType: 'image/jpeg' }, { type: 'text', text: `${caption}\n${file}` }] });
const safe = fn => async (args) => { try { return await fn(args); } catch (e) { return { isError: true, content: [{ type: 'text', text: String(e && e.message || e) }] }; } };
const tool = (name, description, schema, fn, annotations = {}) => server.registerTool(name, { description, inputSchema: schema, annotations }, safe(fn));
const slug = z.string().describe('episode slug, e.g. the-cursed-tape (or an example slug for read-only tools)');
const RO = { readOnlyHint: true };

// ---------- plan ----------
tool('studio_info', 'Check the setup: studio folder, Chrome, ffmpeg, whether an ElevenLabs key is configured, engines and series formats.', {}, () => text(St.info()), RO);
tool('list_formats', 'The series formats this studio makes (engine, target length, rules).', {}, () => text(St.info().series), RO);
tool('get_house_rules', 'The house rules every crew role follows: the look, copyright, format, working rules. Read before writing anything.', {}, () => text(St.houseRules()), RO);
tool('get_crew_brief', `Get one film-crew role's brief so you can act as that role. Roles: ${St.crewRoles().join(', ')}.`, { role: z.enum(St.crewRoles()) }, ({ role }) => text(St.crewBrief(role)), RO);
tool('get_engine_guide', 'How an engine works and its API: ps1 (low-poly 3D), woodcut (living broadsheet), timeline (shared helpers: at/st/en word timing, easing).', { engine: z.enum(['ps1', 'woodcut', 'timeline']) }, ({ engine }) => text(St.engineGuide(engine)), RO);

// ---------- episodes ----------
tool('new_episode', 'Create an episode folder from a series template (a working placeholder scene that renders as-is).', {
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/), title: z.string().min(1), series: z.string().default('Guess The Horror').describe('Guess The Horror, Strange History, Custom, or your own name'),
  year: z.number().int().optional(), engine: z.enum(['ps1', 'woodcut']).optional().describe('default comes from the series'),
}, (a) => text(St.newEpisode(a)));
tool('list_episodes', 'Your episodes, plus the built-in examples you can read.', {}, () => text({ episodes: St.listEpisodes(), examples: St.listExamples() }), RO);
tool('read_episode', 'Read every file of an episode or example (spec.js, scene.js, notes). Use the examples as reference builds.', { slug }, ({ slug }) => text(St.readEpisode(slug)), RO);
tool('read_file', 'Read one file of an episode.', { slug, file: z.string() }, ({ slug, file }) => text(St.readFile(slug, file)), RO);
tool('write_file', 'Write spec.js (script, voice, music, sound cues), scene.js (the three.js scene) or a crew note (.md/.json). JS is syntax-checked and the spec validated before saving; the old version is kept in .history.', {
  slug, file: z.string().describe('spec.js, scene.js, or e.g. treatment.md, cast.json, shots.json, grade.json'), content: z.string(),
}, ({ slug, file, content }) => text(St.writeFile(slug, file, content)));

// ---------- library ----------
tool('list_props', 'Browse the low-poly prop library (people, furniture, places, vehicles). Without module: the modules and their builders. With module: its full usage guide.', { module: z.string().optional() }, ({ module }) => text(St.listProps(module)), RO);
tool('preview_prop', 'Render one prop builder from 4 angles next to a 1.75 m reference person, and return the image.', {
  module: z.string(), builder: z.string(), options: z.record(z.any()).default({}), distance: z.number().optional(), height: z.number().optional(), look: z.number().optional(),
}, async ({ module, builder, options, distance, height, look }) => { const view = {}; if (distance) view.dist = distance; if (height) view.height = height; if (look) view.look = look; return image(await St.previewProp(module, builder, options, view), `${module}.${builder}`); }, RO);

// ---------- sound ----------
tool('list_voices', 'The ElevenLabs voices on your account (needs a key).', {}, async () => { const { voices } = await import('./eleven.mjs'); return text(await voices()); }, RO);
tool('voice_lines', "Voice every line of an episode's script with ElevenLabs (cached by hash: unchanged lines cost nothing) and generate its sound effects. Returns each line's length and the episode's approximate length.", { slug }, async ({ slug }) => text(await St.voiceLines(slug)));

// ---------- shoot + post ----------
tool('render_stills', 'Start a contact-sheet render (30 evenly spaced frames, or chosen times) for a quick look before a full take. Poll job_status; the finished job returns the image.', {
  slug, times: z.string().optional().describe('"auto" or comma-separated seconds, e.g. "0.5,3,7.2"'), draft: z.boolean().default(false).describe('estimate timings, no ElevenLabs'),
}, ({ slug, times, draft }) => text(St.startJob('stills', slug, { times, draft })));
tool('render_take', 'Start a full render of the next numbered take: frames, voice, sound effects, music, loudness-normalized mix, thumbnail, contact sheet and QC. Takes minutes; poll job_status.', {
  slug, draft: z.boolean().default(false).describe('silent preview with estimated timings, no ElevenLabs'),
}, ({ slug, draft }) => text(St.startJob('take', slug, { draft })));
tool('job_status', 'Progress of a render job. A finished stills job returns its contact sheet; a finished take returns its file, thumbnail and QC.', { job_id: z.string() }, ({ job_id }) => {
  const j = St.jobStatus(job_id); if (j.state === 'done' && j.result && j.result.image) return image(j.result.image, 'stills contact sheet');
  if (j.state === 'done' && j.result && j.result.contact_sheet && fs.existsSync(j.result.contact_sheet)) { const r = image(j.result.contact_sheet, 'take contact sheet (one frame every 3 s)'); r.content.unshift({ type: 'text', text: JSON.stringify(j, null, 2) }); return r; }
  return text(j); }, RO);
tool('list_jobs', 'All render jobs since the server started.', {}, () => text(St.listJobs()), RO);
tool('list_takes', 'The numbered takes of an episode.', { slug }, ({ slug }) => text(St.listTakes(slug)), RO);
tool('qc_take', 'Check a take: length against the series target, loudness (-14 LUFS), the loop seam (first vs last frame), and the copyright checklist.', { slug, take: z.number().int() }, ({ slug, take }) => {
  const t = St.listTakes(slug).find(x => x.take === take); if (!t) throw new Error(`No take ${take}`); return text(St.qc(t.file, St.specOf(slug))); }, RO);
tool('pick_take', 'Mark a take as the FINAL (only when the user chooses it). Copies it to "<Title> - FINAL.mp4" and refreshes the thumbnail.', { slug, take: z.number().int() }, ({ slug, take }) => text(St.pickTake(slug, take)));
tool('open_take', "Open a take in the computer's video player so the user can watch it.", { slug, take: z.number().int() }, ({ slug, take }) => { const t = St.listTakes(slug).find(x => x.take === take); if (!t) throw new Error(`No take ${take}`); return text(St.openFile(t.file)); });
tool('post_kit', 'Write the post kit next to the takes: caption, up to 5 hashtags, song note, posting time. The answer of a guessing format is kept out of the caption.', {
  slug, caption: z.string().optional(), hashtags: z.array(z.string()).max(5).optional(), song: z.string().optional(),
}, ({ slug, ...o }) => text(St.postKit(slug, o)));

// ---------- prompts: one per crew role, plus the whole-episode workflow ----------
for (const role of St.crewRoles()) server.registerPrompt(role, { description: St.crewDescription(role), argsSchema: { slug: z.string().optional() } },
  ({ slug }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `${St.crewBrief(role)}\n\n---\nHouse rules:\n${St.houseRules()}\n\n${slug ? `Work on episode "${slug}" (read_episode first).` : 'Ask which episode to work on.'}` } }] }));
server.registerPrompt('make_episode', { description: 'Make a whole short with the crew, from idea to finished take.', argsSchema: { idea: z.string(), series: z.string().optional() } },
  ({ idea, series }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Make a ${series || 'Guess The Horror'} short about: ${idea}\n\nFollow the 3dBlock Studio workflow. Read get_house_rules and the writer, director and cinematographer briefs. Study read_episode the-cursed-tape-ps1 and get_engine_guide ps1 before writing scene.js. Show me the script for approval before building the scene, review render_stills yourself before every take, and stop after the first take for my notes.` } }] }));

// ---------- resources: house rules + example episodes ----------
server.registerResource('house-rules', 'studio://house-rules', { title: 'House rules', mimeType: 'text/markdown' }, async (uri) => ({ contents: [{ uri: uri.href, text: St.houseRules() }] }));
server.registerResource('example', new ResourceTemplate('studio://examples/{slug}/{file}', { list: async () => ({ resources: St.listExamples().flatMap(s => ['spec.js', 'scene.js'].map(f => ({ uri: `studio://examples/${s}/${f}`, name: `${s}/${f}`, mimeType: 'text/javascript' }))) }) }),
  { title: 'Example episodes', mimeType: 'text/javascript' }, async (uri, { slug, file }) => ({ contents: [{ uri: uri.href, text: St.readFile(slug, file) }] }));

export async function main() { await server.connect(new StdioServerTransport()); }
