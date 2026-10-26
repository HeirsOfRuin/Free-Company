# Instruments: what each answers, and where it comes from

Two families, kept separate because they answer different questions: **Is it
true?** (invariants, save contract, validators, continuity, smoke) and **Is it
balanced?** (bot, batch runner, ablation, curves, claims). The gap between when
each arrives is where untested systems hide.

This skill ships the balance half as one kit. The "true" half lives with the
skill that owns it: invariants, save contract and smoke in `game-scaffold`;
validator, lint, continuity and choice audit in `game-narrative`; PWA and
pre-public checks in `game-release`.

---

## In this kit (`scripts/`, copied to `sim/`)

| Instrument | Question | Script | Proven on |
|---|---|---|---|
| Batch runner | What do N games look like, cell by cell? | `run.js` | Imperator `measure-campaign.js`, identical cells |
| Ablation | What does each subsystem contribute? | `ablate.js` + `sim/ablations/<q>.js` | Imperator depth, diplomacy, options: identical gaps |
| Inert check | Does this switch change anything at all? | `ablate.js --inert` | Imperator buildings: identical changed counts |
| Curve | Does choosing well matter; is knowing worth paying for? | `curve.js` + `sim/curves/<q>.js` | generalised from The Lists' joust curve |
| Claims | Does every difference the copy claims exist? | `verify-claims.js` + `sim/claims.js` | generalised from Centennial Farm's verify-tiers |
| Report | Numbers into DESIGN.md without retyping | `report.mjs` | Imperator DESIGN §16 as tables with SE |
| Statistics | SE, floor, runs needed, distributions, paired, shares | `stats.js` | the one module; five variants retired |

## Per game, from the originals (no generic version: they are the game)

| Instrument | Question | Must assert / print | Original |
|---|---|---|---|
| Reference bot | Can a game be played start to end by a fixed, written policy? | Answers every decision explicitly; progress | CF `sim/bot.js`, Imperator `tools/bot.js` (through the player interface: `act()` + `view()`), KA `tools/bot-lib.ts` |
| Composition | Who owns the total? | Shares of income by source within bands (`shares()`) | CF `sim/composition.js` |
| Power curve | Snowball or trap? | Top tenth vs median by year, brakes on and off | VK `measure:power` |
| Calibration | Is the sim realistic? | Rates against real-world targets | TL `tools/calibrate.js` |
| World drift | Does the world erode or inflate over seasons? | Strength and money by tier, bounded in a test | TL `tools/pyramid.js` |
| Soak | Do rare branches crash? | Throws and impossible states across every start and tier | TL `tools/soak.js` |
| Cheat attempt | Can the model be ground or exploited? | Exploit strategies fail | TL `tools/negotiate.js` |
| Distribution probe | What does the player see at the tail? | Worst case and share below a threshold | TL `tools/fatigue.js`, CF `sim/valuation.js` |
| In-browser measure | Single-file games with no Node engine | Driver installed once, called in chunks with progress | CO `tools/measure-economy.js` |

Most of these can still use the kit: a soak is `run.js --runs=500 --by=start,difficulty`
(crashes are listed and the run exits 1); a power curve is an adapter metric per
year; composition is `shares()` inside `metrics()`.

## Rules for writing a new instrument

1. It must be able to fail. Run it once against a deliberately broken build (a
   stalled turn, an inert switch) and watch it fail before trusting a pass.
2. Print the quantity behind the verdict, and the noise floor.
3. A test that fails everywhere is usually looking in the wrong place (The
   Company's token scan read `innerHTML` and hit its own `<script>`).
4. Write down what it cannot see. No harness sees fun, pacing, or real light on
   a real phone; the bot cannot use what it was never taught (Imperator's bot
   never outlaws, incites or demands provinces, so those levers are unmeasured).
5. Drive the shipped functions, not a reimplementation. A kill-gate model
   retires when the engine exists (it moves to `prototypes/`); two models drift.
