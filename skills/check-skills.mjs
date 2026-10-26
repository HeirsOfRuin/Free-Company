// Keep the five game skills from drifting apart. node skills/check-skills.mjs
//
// Some files live in two skills on purpose (a skill must work when installed
// alone): the measurement kit that game-scaffold lays into every new repo, and
// the build-id stamper shared by game-scaffold and game-release. Each pair must
// be byte-identical; the canonical copy is listed first. Also checks every
// skill has SKILL.md with a name and a description under 1,024 characters, and
// that no template variable or scratch file was left in a skill.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SHARED = [
  ['game-measure/scripts/stats.js', 'game-scaffold/templates/kit/sim/stats.js'],
  ['game-measure/scripts/measure-lib.js', 'game-scaffold/templates/kit/sim/measure-lib.js'],
  ['game-measure/scripts/run.js', 'game-scaffold/templates/kit/sim/run.js'],
  ['game-scaffold/templates/common/tools/stamp.mjs', 'game-release/scripts/stamp.mjs'],
  ['game-scaffold/templates/common/tools/browser.mjs', 'game-release/scripts/browser.mjs'],
  ['game-scaffold/templates/shape-B/src/engine/rng.js', 'game-scaffold/templates/shape-C/src/engine/rng.js'],
  ['game-scaffold/templates/shape-B/src/ui/styles.css', 'game-scaffold/templates/shape-C/src/ui/styles.css'],
];
const exists = async (p) => !!(await stat(p).catch(() => null));
let bad = 0;
const fail = (m) => { bad++; console.log(`!! ${m}`); };

for (const [a, b] of SHARED) {
  const pa = join(ROOT, a), pb = join(ROOT, b);
  if (!(await exists(pa)) || !(await exists(pb))) { if (await exists(pa) !== await exists(pb)) fail(`${a} / ${b}: one is missing`); continue; }
  if ((await readFile(pa, 'utf8')) !== (await readFile(pb, 'utf8'))) fail(`${b} differs from ${a} (copy ${a} over it)`);
  else console.log(`ok  ${b} == ${a}`);
}

for (const skill of (await readdir(ROOT)).filter((d) => d.startsWith('game-') && !d.endsWith('.skill'))) {
  const p = join(ROOT, skill, 'SKILL.md');
  if (!(await exists(p))) { fail(`${skill}: no SKILL.md`); continue; }
  const text = await readFile(p, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] || '';
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const desc = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim() || '';
  if (name !== skill) fail(`${skill}/SKILL.md: name is "${name}"`);
  if (!desc) fail(`${skill}/SKILL.md: no description`);
  else if (desc.length > 1024) fail(`${skill}/SKILL.md: description is ${desc.length} characters (limit 1024)`);
  const lines = text.split('\n').length;
  console.log(`ok  ${skill}: SKILL.md ${lines} lines, description ${desc.length} chars`);
  if (lines > 500) fail(`${skill}/SKILL.md is ${lines} lines; move detail into references/`);
}

async function walk(d) {
  const out = [];
  for (const n of await readdir(d)) {
    const p = join(d, n);
    if ((await stat(p)).isDirectory()) { if (n !== 'node_modules') out.push(...await walk(p)); } else out.push(p);
  }
  return out;
}
for (const f of await walk(ROOT)) {
  const rel = f.slice(ROOT.length + 1);
  if (/(^|\/)(_[^/]*|[^/]*\.tmp\.[^/]*)$/.test(rel)) fail(`scratch file in a skill: ${rel}`);
  // SKILL.md and references are read by the agent as written: no placeholders there
  if (!/(SKILL\.md|\/references\/.*\.md)$/.test(rel)) continue;
  if (/\{\{[A-Z_]+\}\}/.test(await readFile(f, 'utf8'))) fail(`template variable in agent-facing text: ${rel}`);
}

console.log(bad ? `\n${bad} problem(s)` : '\nskills consistent');
process.exit(bad ? 1 : 0);
