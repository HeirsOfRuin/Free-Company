---
name: game-building
description: Build process, proven architecture defaults, failure-mode catalogue, measurement kit and release checklist for browser/phone games in code (turn-based sims, management games, narrative RPGs, prototypes). Distilled from eight real builds (Silk Road, Cradle, Touchline, Centennial Farm, The Company, Knight of Adalia, The Lists, Vikingr), with tested drop-in scripts: seeded RNG, batch runner, ablation, inert-setting detector, phone smoke test, contact sheet, service worker, guarded storage, itch packager. Use whenever the user is starting, designing, building, debugging, balancing, playtesting or shipping a game, even a quick prototype, and especially for: a new game idea or spec, a new system, playtest feedback ("this does nothing", "I lost every fight"), tests passing while players hit bugs, difficulty or economy tuning, branching narrative and continuity, art pipelines, saves, PWA install or itch.io release. Read it before writing game logic.
---

# Game Building

Eight games, one team, one set of constraints (phone-first, turn-based, no
backend, no API key, one author directing one agent). The same mistakes recurred
across genres, and the same fixes kept working. This skill is the process, the
defaults, the checklists and the tools that came out of that.

**What is new since the two-build version:** a staged workflow, architecture
defaults you no longer need to re-decide, a 38-entry failure catalogue with
detectors, a tested script kit, a release checklist, design lessons about what
made the games better to play, and a copy map of which repo already solved what.

---

## Route by situation

| You are… | Read first | Then |
|---|---|---|
| Starting a new game | "Workflow" and "Day one" below | `references/workflow.md`, `references/architecture.md` |
| Adding a system or feature | "Feature loop" and checklists below | `references/design-lessons.md` |
| Handling playtest feedback | "Playtest protocol" below | `references/failure-modes.md` (symptom table below) |
| Tuning balance or difficulty | "Measurement rules" below | `references/instruments.md`, `scripts/harness.js` |
| Writing branching narrative | Design lessons §6 | KA tools listed in `references/game-index.md` |
| Shipping to Pages / itch / Android | `references/release.md` | `scripts/make-itch-zip.sh`, `scripts/sw.js` |
| Needing a tool that probably exists | `references/game-index.md` copy map | — |

---

## The ten rules

Each one cost at least two of the eight builds a round trip. F-numbers point into
`references/failure-modes.md`.

1. **One derivation per number.** What the player sees and what the engine
   resolves come from the same function. Caches are fine; second formulas are not. (F1)
2. **Nothing declared is decoration.** Every effect, setting, option and flag must
   change the game, or be deleted. Test behaviour, not text: a deterministic engine
   gives a byte-identical end state for an ignored knob (`scripts/inert-check.js`). (F2-F4)
3. **Every harness proves progress.** A bot or batch that does not assert the
   clock advanced can be measuring nothing while green (`scripts/harness.js`). (F11)
4. **Every number carries its noise floor and a second axis.** ~200 runs to see a
   6-point gap at 10%; distributions not means; never tune one scalar blind. (F14-F16)
5. **Look at it, at real size, on a phone.** Contact sheets for repeated visuals;
   390x844 smoke every build. Several "settled" decisions were reversed by looking. (F36, F37)
6. **Correct but silent is broken.** Every empty, locked or limiting state names
   the reason and the lever that changes it. Every chart has a key. (F35)
7. **The world plays by the player's rules.** Rivals earn, buy, age and improve
   through the same functions. Otherwise the player outgrows the world or the
   world erodes. (F26)
8. **Words derive from state.** Tutorial numbers from CONFIG, prices from costs,
   names and ranks and ages from tokens, dead people stay dead. Check it with a tool,
   not a read-through. (F6-F9)
9. **Saves are contracts.** Versioned key and payload, migration chain, fixtures from
   every old version, text export. Never rename a storage key. (Architecture inv. 8)
10. **Write it down.** Spec, frame per feature, decisions log with the author's words
    and the measured numbers, backlog for every idea. Chat does not survive the
    session; the repo does. (F38)

---

## Workflow

| Stage | Output | Gate |
|---|---|---|
| 0 Backlog | Two lines in `docs/game-backlog.md` | Author picks it |
| 1 Spec | One page: loop, scarce resource, per-turn decision, ways to lose, one way to win | Author approves |
| 2 Kill gate | Numbers-only sim: fixed policies x seeds, no UI | Strategies differ; win reachable, not trivial; nothing dominant |
| 3 Phase 0 proposal | `docs/DESIGN.md`: stack, architecture, schema, scope pushback | Author approves |
| 4 Engine + instruments | Pure engine, bot, invariants, validator, smoke, PWA | Bot plays full runs; installs on a phone |
| 5 Calibration | 2-3 pieces at full polish | Author verdict on voice, look, option count |
| 6 Vertical slice | One complete year/chapter/season | Author wants to play the next one |
| 7 Feature loop | Frame → approve → build → measure → playtest → revise | Claims measured, decision logged |
| 8 Release | Zip, store art, copy, Pages link | Played from the uploaded zip |

Skipping a stage is allowed; skipping it silently is not. A one-evening prototype
needs 1, 2 and 4. Details and templates: `references/workflow.md`.

**Feature loop, short form.** Write `docs/FRAME-<feature>.md` (the author's request
quoted, the problem, the design rule, options with a recommendation, a worked
example, what will be measured). Get approval for anything that changes feel or
scope. Build the measurement with the feature. Log the numbers.

---

## Day one: the scaffold

Pick the shape (`references/architecture.md`):
- **Mostly authored text** → Vite + Preact + TS strict + YAML content + Zod (KA, VK).
- **Mostly simulation** → vanilla ES modules, no build step, bundler to one file (CF, LI, TL).
- **Small and needed today** → one `index.html` (SR, CO); plan the move past ~2,500 lines.

Then, before any content:
- [ ] `src/engine/` pure: `(state, input) -> state`; no DOM, `Math.random`, `Date.now`.
- [ ] `rng.js` with named streams, state in the save (copy `scripts/rng.js`).
- [ ] `derive.js`: the only place shown numbers are computed.
- [ ] One money chokepoint writing the ledger; a test that purse == ledger.
- [ ] Versioned save key + `migrate()` + text export (`scripts/storage.js`).
- [ ] Reference bot with a written policy that answers every decision explicitly.
- [ ] Batch runner with progress refusal (`scripts/harness.js`).
- [ ] Invariant tests (impossibility, not magnitude).
- [ ] Phone smoke test (`scripts/smoke.mjs`), run at 390x844.
- [ ] Manifest, icons from a committed generator, `sw.js` + `sw-register.js`.
- [ ] Pages deploy from the default branch; `.nojekyll`.
- [ ] `npm run check` (or equivalent) running all of the above.
- [ ] `DESIGN.md` with a decisions log; backlog entry updated with the repo and branch.

Copy before writing: `references/game-index.md` maps every need to the repo that
already solved it.

---

## Checklists

**Before every commit**
- [ ] `check` passes; numbers in the commit message carry run counts.
- [ ] Every scripted edit asserted its match count (`scripts/replace_once.py`). (F32)
- [ ] No scratch files staged.

**After adding or changing a system**
- [ ] Every new knob/effect moves the end state (inert check); every new option is
      best somewhere (curve or ablation).
- [ ] The bot can use it, and the player has a control for it. (F3, F13)
- [ ] Shown value and resolved value share one function. (F1)
- [ ] Empty and locked states explain themselves. (F35)
- [ ] Multiplicative interactions asserted as shares, not magnitudes. (F20)
- [ ] Turn phase order still correct (F22); no new feedback trap with no exit (F24).
- [ ] A/B on the same seeds; balance impact disclosed in the commit.
- [ ] Neutral refactors proven neutral by a seeded checksum. (F27)

**After widening scope** (second start, mode, city, level, era)
- [ ] Grep the original id/name; audit every hit before writing anything else. (F10)
- [ ] Re-measure every gate and threshold; a longer career inflates win rates. 

**Before handing a build to the author**
- [ ] Smoke at 390px clean; screenshots looked at.
- [ ] Every screen rendered across a full bot run with no raw tokens. (F7)
- [ ] Continuity check for narrative games. (F8)
- [ ] Service worker cache bumped, so the tester actually gets the new build. (F30)
- [ ] A chapter jump or sandbox start to reach the new content fast.

---

## Playtest protocol

1. Get the save; reproduce on it.
2. Trace before theorising. Classify: **bug** / **missing control** / **missing
   explanation** / **design disagreement**. Only the first is an engine change.
3. Fix the class: sweep for siblings (one continuity report → 47 more found).
4. A/B the balance impact on the same seeds. Disclose it; do not quietly tune it
   back ("the old number was propped up by animals a shortfall claimed to sell").
5. Add the regression test for the reported path.
6. Say plainly what you could not reproduce, and what would help.
7. Log the author's words and the verdict in the decisions log.

## Measurement rules

- Size the sample first: `runsFor(gap, rate)` in `scripts/stats.js`.
- Print the noise floor beside every comparison; a gap under it is not a result.
- Report several axes per variant (rate, wealth, peak, time to outcome).
- Tails and distributions for anything a player feels; survivors separately.
- When a result surprises, check the bot before the design. (F13)
- An ablation locates; it does not attribute. Design the follow-up.
- Withdraw a claim you cannot measure cleanly rather than tune toward it. (F17)
- Rare branches need soak volume across every start and tier. (F18)
- Chunk long runs with progress output; check the machine before the code. (F19)

---

## Symptom → first suspects

| Symptom | Suspect |
|---|---|
| "This setting/choice/upgrade does nothing" | F2 decoration, F3 hidden control, F5 silent queue |
| Number on screen differs from what happened | F1 two derivations, F21 units/double count |
| "It's broken" but the code is right | F35 silent state; F6 copy drifted |
| Wrong name in a label, effect hits someone else | F7 tokens resolved twice |
| Text mentions a dead man, a wrong title, a wrong year | F8, F9 |
| Bug appears only for the second start/mode | F10 narrow-case assumption |
| Tests green, players hit bugs | F11 harness not progressing, F18 rare branch, F37 never looked at on a phone |
| Balance numbers jump between runs | F14 sample size, F27 determinism leak |
| "Never doing X" looks optimal | F16 one-axis read, F13 bot misuses X |
| One income source eats everything | F20 compounding with no owner |
| "I haven't won since" / spiral | F24 feedback trap |
| Top players run away, median starves | F25 snowball + trap; F26 AI not on the same rules |
| Player rises too fast / everyone gets the title | F25 pacing, F28 trait inflation |
| Blank page on itch or in a frame | F29 storage throws, SW getter throws |
| Fix pushed, tester still sees the bug | F30 stale service worker |
| Identical instant failures on deploy | F33 platform rules |
| Button greyed out forever after an error | F34 no `finally` |

---

## Design principles (detail in `references/design-lessons.md`)

- Every option is best somewhere; information only has value if it can change the choice.
- Choices show what is at stake, computed from their real effects.
- Combat: say what an order does and costs, not what it will do; chance moves
  numbers, never decides what beats what; auto-resolve uses the same resolver.
- Slow, earned rise; progressive brakes plus a floor; money needs late sinks.
- The first hour is its own design: quick start, folded detail, a guaranteed early event.
- Tutorials teach by doing, as predicates, progress saved with the game.
- Historically grounded: real numbers in data tables, one economy reference for
  prose and engine, sources in the README.

## What this still does not tell you

- **Whether it is fun.** Every time that question was answered, a human played it.
  Book the author's playtest at the calibration and slice gates, not at the end.
- **Projects outside the shape.** Real-time, multiplayer, 3D, large teams or a
  backend will fail in ways not listed here; the rules (1-6, 10) still transfer,
  the stack advice does not.
- **The author's numbers as theory.** Win-rate targets (5-7% crowned, ~9% default,
  25% centennial) are one person's preferences per game; ask for them, do not
  assume them.

---

## Files

| Path | What |
|---|---|
| `references/workflow.md` | Stages, gates, playtest handling, session efficiency, doc templates, commit style |
| `references/failure-modes.md` | F1-F38 with evidence, detector and fix |
| `references/design-lessons.md` | Decisions, combat, pacing, world, teaching, narrative, history, author's preferences |
| `references/architecture.md` | Three proven shapes, ten invariants, content pipeline, art pipeline, performance |
| `references/instruments.md` | Every instrument: question, assertion, where to copy it |
| `references/release.md` | Pages, PWA, itch.io, hosts that wrap HTML, Android |
| `references/game-index.md` | The eight games, a copy map by need, one-line lessons each |
| `references/retrospectives/` | The original Silk Road and Cradle write-ups (source material) |
| `scripts/rng.js` | Seeded RNG with named streams |
| `scripts/stats.js` | SE, noise floor, runs needed, summaries, multi-axis compare, shares |
| `scripts/harness.js` | Batch runner that refuses stalled runs; ablation |
| `scripts/inert-check.js` | Finds knobs the engine ignores (byte-identical test) |
| `scripts/storage.js` | Storage that cannot crash the page; save-versioning notes |
| `scripts/sw.js`, `scripts/sw-register.js` | Service worker with update notice; page side, install prompt |
| `scripts/smoke.mjs` | Playwright phone smoke: progress, tabs, overflow, raw tokens, reload |
| `scripts/contact-sheet.mjs` | Repeated visuals side by side at true sizes |
| `scripts/replace_once.py` | Scripted edits that fail on zero or extra matches |
| `scripts/make-itch-zip.sh` | itch zip with index.html at root, verified |
