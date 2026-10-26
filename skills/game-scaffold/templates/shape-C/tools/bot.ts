// The reference player: plays N stories with seeded random choices and fails
// if any does not reach an ending within MAX steps, or a choice the view
// offered is refused. npx tsx tools/bot.ts [--runs 200]
import bundle from '../src/content/bundle.json';
import type { ContentBundle } from '../src/content/schema';
import { newGame, choose, view } from '../src/engine/story';
import { streamFor } from '../src/engine/rng.js';

const content = bundle as unknown as ContentBundle;
const runs = Number(process.argv[process.argv.indexOf('--runs') + 1]) || 200;
const MAX = 500;
const endings: Record<string, number> = {};
let fails = 0, steps = 0;
for (let i = 0; i < runs; i++) {
  let s = newGame(content, 1 + i * 7919);
  for (let n = 0; !s.over; n++) {
    if (n >= MAX) { fails++; console.log(`!! seed ${s.seed}: no ending after ${MAX} choices (at ${s.scene})`); break; }
    const v = view(content, s);
    const pick = streamFor(s.seed, s.turn, 'bot').pick(v.choices);
    if (!pick) { fails++; console.log(`!! seed ${s.seed}: no choice offered at ${s.scene}`); break; }
    s = choose(content, s, pick.id); steps++;
  }
  if (s.over) endings[s.ending!] = (endings[s.ending!] || 0) + 1;
}
console.log(`${runs} stories, ${(steps / runs).toFixed(1)} choices each; endings ${JSON.stringify(endings)}`);
if (fails) { console.log(`!! ${fails} stories did not finish`); process.exit(1); }
