# Instruments: the kit, what each answers, and where to copy it from

Two families, kept separate because they answer different questions:
**Is it true?** (invariants, validators, continuity, smoke) and **Is it balanced?**
(bot, batch runner, ablation, composition, curves). The gap between when each
arrives is where untested systems hide.

`scripts/` in this skill holds tested, game-agnostic versions of the core tools.
The table lists the project-specific originals for anything more specialised.

---

## The kit

| Instrument | Question | Must assert / print | Copy from |
|---|---|---|---|
| Invariant tests | What can never be true? (negative land, NaN, purse ≠ ledger, two winners) | Impossibility, not magnitude (magnitude asserts get deleted on rebalance) | CF `test/invariants.test.js`, LI `test/*.test.js` |
| Reference bot | Can the game be played start to end with a fixed written policy? | Progress: the clock advanced, events happened | CF `sim/bot.js`, KA `tools/bot-lib.ts` (policies: random, martial, cunning…) |
| Batch runner | What do N games look like? | Refuses stalled runs; prints rates with SE and distributions | `scripts/harness.js`; CF `sim/run.js` (`--trace --seed`) |
| Claim verifier | Does every difference the copy claims exist? | Each claimed gap vs noise floor; withdraw what cannot be measured | CF `sim/verify-tiers.js`, LI `sim/verify-backgrounds.js` |
| Ablation | What does each subsystem contribute? | Several axes per variant (rate, wealth, peak) | `scripts/harness.js ablate()`; CF `verify-tiers.js --ablate` |
| Inert check | Does this knob/effect/option do anything? | Byte-identical end state = inert | `scripts/inert-check.js`; TL `tools/ablate.js`, `train-ablate.js` |
| Dead-effect guard | Is every declared effect read? | Backlog list that may only shrink, allowed-inert with reasons | CF `test/effects.test.js` (crude text scan; pair with inert check) |
| Composition | Who owns the total? | Shares of gross by source within bands | CF `sim/composition.js` (found seed costing more than the grain was worth) |
| Curves | Does choosing well matter, and is knowing worth paying for? | Win rate by policy x skill gap, with SE | LI `sim/joust-curve.js`, `foot-curve.js`, `melee-curve.js`; CO `measure-orders.js` |
| Power curve | Snowball or trap? | Top tenth vs median by year, with brakes on/off | VK `measure:power` (`--off`) |
| Calibration | Is the sim realistic? | Rates vs real-world targets table | TL `tools/calibrate.js` (goals, shots, cards vs real top flight) |
| World drift | Does the world erode or inflate over seasons? | Strength/money by tier over N seasons, bounded in a test | TL `tools/pyramid.js` |
| Soak | Do rare branches crash? | Throws and impossible states across many careers and tiers | TL `tools/soak.js` |
| Cheat attempt | Can the model be ground or exploited? | Exploit strategies fail | TL `tools/negotiate.js` |
| Distribution probe | What is the player actually seeing at the tail? | Worst-case and share-below-threshold, not means | TL `tools/fatigue.js`; CF `sim/valuation.js` |
| Validator | Is the content well formed? | Broken links, undeclared refs, unreachable scenes, lethal without warning, every ending reachable per background | KA `tools/validate-lib.ts` |
| Style lint | Does the prose follow the house rules? | Banned words, narrator tics (warnings), leaked notes, fixed ages | KA/VK `tools/lint-style.ts` + `content/style-guide.md` |
| Continuity | Does text contradict the run's state? | Phrase rules + dead-name rule over hundreds of runs | KA `tools/continuity.ts` + `content/continuity.yaml` |
| Choice audit | Do choices matter? | now / later / flavour / none per choice; hollow list | KA `tools/audit-choices.ts` |
| Transcripts | What does a route read like? | Scripted plans rendered as Markdown | KA `tools/transcript.ts`, `make-plan.ts` |
| Smoke | Does the real page work at phone width? | Clock advances through the UI, every tab renders, no overflow, no raw tokens, no console errors, save survives reload | `scripts/smoke.mjs`; LI `tools/smoke.mjs` (471 lines, plays the lists) |
| Bundle check | Does the single file work from disk, and the Pages build install and run offline? | Opens from file://, plays N turns; manifest, worker, offline | CF/LI `tools/check-bundle.mjs` |
| PWA check | Is it installable and does an update reach a returning player? | Manifest parses, icons resolve, worker active, offline play, edit a cached file → update offered | TL `tools/pwa-check.js` |
| Contact sheet | Do repeated visuals work together at true size? | (look at it) | `scripts/contact-sheet.mjs`; TL `tools/contact-sheet.js`; LI `tools/tilt-sheet.mjs` (every animation frozen at its moments) |
| Store art | Real screenshots from the shipped functions | (look at it at listing size) | CO `tools/make-press.js`, SR `tools/store.js`, LI `tools/itch.mjs --art` |

## Wiring them up

- One `npm run check` (or `node --test && node sim/run.js --runs=100 && …`) that a
  commit must pass. KA: `typecheck && test && validate && lint:style && continuity
  --strict && bot --runs 200`.
- CI for the cheap half (LI `.github/workflows/test.yml`); the Pages workflow runs
  tests and refuses to upload a build missing its manifest, worker or icons (CF).
- Batch numbers go in the README and decisions log with their run counts, so the
  next session can compare.

## Rules for writing a new instrument

1. It must be able to fail. Run it once against a deliberately broken build (a
   stalled turn, an inert knob) and watch it fail before trusting a pass.
2. Print the quantity behind the verdict, and the noise floor.
3. A test that fails everywhere is usually looking in the wrong place (CO's token
   scan read `innerHTML` and hit its own `<script>`).
4. Write down what it cannot see. The smoke test cannot judge animation (LI checks
   that by eye on a contact sheet); no harness sees fun, pacing, or real light on a
   real phone.
5. Drive the shipped functions, not a reimplementation (CO moved measurement into
   the browser for exactly this reason).
6. For in-browser measurement, install the driver in the page once and call it in
   chunks from Node with progress output (CO `measure-economy.js`).
