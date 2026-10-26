---
name: game-measure
description: Balance and measurement kit for turn-based browser/phone games - one adapter file per game, then a batch runner, ablation, inert-setting detector, curves, claim verifier and a report writer that turns results into DESIGN.md tables with standard errors. Use when tuning balance, difficulty or economy; when a playtester says a setting, option, upgrade or system does nothing or matters too much; when checking whether a choice or a subsystem matters; when a bot or batch run looks wrong; when writing measured numbers into DESIGN, a FRAME or a decisions log; or when asked how many runs are enough. Triggers on measure, ablate, ablation, win rate, noise floor, standard error, inert, decoration, curve, A/B on the same seeds, how many runs, tier difference, verify claims. Part of the game-building family; read game-building first in a new session.
---

# Game measure

One kit for every balance question: write `sim/adapter.js` once, then each
question is a small config file, not a new script. Proven on Imperator, where it
reproduced four hand-written measurement tools number for number (see
`references/instruments.md`).

Hub rules this skill enforces (from `game-building`): **3** every harness proves
progress · **4** every number carries its noise floor and a second axis ·
**2** nothing declared is decoration.

## Install (once per game)

Copy into the game's `sim/` (a new repo from `game-scaffold` already has the first four):

| File | From | Purpose |
|---|---|---|
| `sim/stats.js` | `scripts/stats.js` | SE, noise floor, runs needed, summaries, paired, shares |
| `sim/measure-lib.js` | `scripts/measure-lib.js` | cells, seeds, batches, aggregation, JSON |
| `sim/run.js` | `scripts/run.js` | batch runner |
| `sim/adapter.js` | `templates/adapter.js` | **the only game-specific file** |
| `sim/ablate.js`, `sim/curve.js`, `sim/verify-claims.js`, `sim/report.mjs` | `scripts/` | as needed |

Rules: the kit files are not edited per game (fix them here and re-copy). A
kill-gate prototype lives in `prototypes/`, not `sim/`. Results go to `out/`
(gitignored); numbers go into docs through `report.mjs`.

## The adapter

```js
export const axes = { difficulty: [...], road: [...], start: [...] };   // what --by / --pool range over
export const defaults = { difficulty: 'normal' };
export function play(seed, opts) { ... return finalState; }           // deterministic
export function progress(s) { return s.turn < 5 ? ['only reached turn ' + s.turn] : []; }
export function metrics(s) { return { win: s.won, turns: s.turn, gold: s.gold }; }  // bool -> rate, number -> distribution
export function digest(s) { return JSON.stringify([s.outcome, s.turn, s.gold]); }   // for --inert
export function seedFor(i, opts, seed0) { ... }                       // optional: match an older tool's seeds
export function trace(s) { ... }                                      // optional: --trace --seed=N
```
Alternatively export `newGame / step / done / clock` instead of `play`: the
runner then fails any step that does not advance the clock (softlock detection).

## Questions → commands

| Question | Command |
|---|---|
| Win rate by difficulty and road, every start pooled | `node sim/run.js --runs=25 --by=difficulty,road --pool=start` |
| One game, turn by turn | `node sim/run.js --trace --seed=17 --road=wealth` |
| Does each subsystem matter? | `node sim/ablate.js sim/ablations/depth.js` |
| Does this switch do anything at all? | `node sim/ablate.js sim/ablations/buildings.js --inert` |
| Does choosing well matter / is a read worth paying for? | `node sim/curve.js sim/curves/joust.js` |
| Are the copy's claims true? | `node sim/verify-claims.js sim/claims.js` |
| Put it in DESIGN.md | add `--json=out/x.json`, then `node sim/report.mjs out/x.json --title="..."` |
| How many runs do I need? | `node -e "import('./sim/stats.js').then(m=>console.log(m.runsFor(3, 0.15)))"` |

Config shapes are documented at the top of each script. `variants` can be a
function of the data (one variant per building); `cases: [{seed, opts}]`
replaces the matrix for a hand-picked set of games.

## Reading the output

- `12.5% ±6.8` is a rate with 1 SE. A gap marked `~` is inside the 2-SE floor: not a result.
- Read every cell, then the pooled row. Effects that cancel in the pool are real.
- `INERT` under `--inert` means byte-identical end states on every case: the
  engine never reads that switch, or the bot never reaches it. Find which.
- Stalled or crashed runs are listed and excluded, and the tool exits 1. Fix them first.

## Workflow

1. Write the question as a FRAME's "What will be measured" row before building.
2. `runsFor()` to size it. Run in the background if it takes minutes.
3. A/B on the same seeds for every balance-moving change; floor in the commit.
4. `report.mjs` into DESIGN's "as built" section and the decisions log.
5. Surprise → `--trace` a seed, check the bot, then the design.

Details: `references/measurement-rules.md` (twelve rules and the failures behind
them), `references/instruments.md` (the kit, the per-game instruments, and how to
write a new one).
