// Compile content/scenes/*.yaml into src/content/bundle.json, validating as it
// goes. The browser never parses YAML; the validator, the bot and the tests all
// read the same bundle. Fails the build on: a schema error, a duplicate id, a
// choice leading to a scene that does not exist, a scene nothing reaches, or a
// game with no reachable ending. (Knight of Adalia's rules, in miniature.)
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { Scene, type ContentBundle } from '../src/content/schema';

const DIR = 'content/scenes';
const errors: string[] = [];
const scenes: ContentBundle['scenes'] = {};
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.yaml')).sort()) {
  const raw = YAML.parse(readFileSync(join(DIR, file), 'utf8'));
  for (const [i, s] of (Array.isArray(raw) ? raw : [raw]).entries()) {
    const r = Scene.safeParse(s);
    if (!r.success) { errors.push(`${file}[${i}]: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`); continue; }
    if (scenes[r.data.id]) errors.push(`${file}: duplicate scene id ${r.data.id}`);
    scenes[r.data.id] = r.data;
  }
}
const start = 'start';
if (!scenes[start]) errors.push(`no scene with id "${start}"`);
for (const s of Object.values(scenes)) for (const c of s.choices) if (c.next && !scenes[c.next]) errors.push(`${s.id}/${c.id}: next "${c.next}" does not exist`);
const seen = new Set<string>(); const queue = [start]; let endings = 0;
while (queue.length) {
  const id = queue.pop()!; if (seen.has(id) || !scenes[id]) continue; seen.add(id);
  for (const c of scenes[id]!.choices) { if (c.ending) endings++; if (c.next) queue.push(c.next); }
}
for (const id of Object.keys(scenes)) if (!seen.has(id)) errors.push(`scene ${id} is unreachable from ${start}`);
if (!endings) errors.push('no ending is reachable');
if (errors.length) { console.error(errors.map((e) => `!! ${e}`).join('\n')); process.exit(1); }
mkdirSync('src/content', { recursive: true });
writeFileSync('src/content/bundle.json', JSON.stringify({ start, scenes } satisfies ContentBundle, null, 1));
console.log(`content: ${Object.keys(scenes).length} scenes, ${endings} ending choices reachable`);
