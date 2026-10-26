// Smoke test: start the server over stdio, list tools, create an episode, render a draft contact sheet, wait for it.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const home = fs.mkdtempSync(path.join(os.tmpdir(), '3dblock-'));
const c = new Client({ name: 'smoke', version: '1' }); await c.connect(new StdioClientTransport({ command: process.execPath, args: ['bin/3dblock-studio-mcp.mjs'], env: { ...process.env, BLOCK_STUDIO_HOME: home } }));
const call = async (name, args = {}) => { const r = await c.callTool({ name, arguments: args }); if (r.isError) throw new Error(`${name}: ${r.content[0].text}`); return r; };
const tools = (await c.listTools()).tools; console.log(`${tools.length} tools:`, tools.map(t => t.name).join(', '));
console.log(`${(await c.listPrompts()).prompts.length} prompts, ${(await c.listResources()).resources.length} resources`);
console.log(JSON.parse((await call('studio_info')).content[0].text).chrome);
await call('new_episode', { slug: 'smoke-test', title: 'The Static', series: 'Guess The Horror' });
const which = process.argv[2] || 'smoke-test', kind = process.argv[3] || 'stills';
const job = JSON.parse((await call(kind === 'take' ? 'render_take' : 'render_stills', { slug: which, draft: true })).content[0].text);
for (;;) { await new Promise(r => setTimeout(r, 3000)); const r = await call('job_status', { job_id: job.job_id }), t = r.content.find(x => x.type === 'text').text;
  if (r.content.some(x => x.type === 'image')) { const img = r.content.find(x => x.type === 'image'); fs.writeFileSync(path.join(home, 'result.jpg'), Buffer.from(img.data, 'base64')); console.log('DONE', t.slice(0, 1500), '\nimage →', path.join(home, 'result.jpg')); break; }
  const j = JSON.parse(t); if (j.state !== 'running') { console.log('JOB', j.state, j.error || '', j.last_lines); break; } process.stdout.write(`${j.progress || '.'} `); }
await c.close();
