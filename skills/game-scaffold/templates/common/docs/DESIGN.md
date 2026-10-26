# {{NAME}} — Phase 0 design proposal

Stage 3 of the workflow: stack, architecture, screens, look and build plan, for
the author's approval before game code. Inputs: `SPEC.md`, `KILLGATE.md`.

Where a later "as built" section differs from the plan above it, the later
section wins.

---

## 1. Decisions already made
| Decision | Source |
|---|---|
| Phone first, installable, offline, no accounts, turn-based | All previous builds |
| Shape {{SHAPE}}: {{SHAPE_NAME}} | game-scaffold, {{DATE}} |

## 2. Stack
| Choice | Decision | Why |
|---|---|---|
| Shape | {{SHAPE_NAME}} | |
| Saves | Guarded localStorage, versioned key `{{SLUG}}.save.v1`, migrations, text export `{{SAVE_PREFIX}}1.` | Every past build's contract |
| Tests | `npm run check`: invariants, save contract, bot batch, bundle, phone smoke | |
| Deploy | GitHub Pages from the default branch by Actions, build id stamped; itch.io zip | game-release |
| Dependencies | None at runtime | |

## 3. Architecture
```
src/data/     logic-free tables
src/engine/   pure: (state, input) -> state. No DOM, no Date, no Math.random
  rng.js        named streams, state in the save
  state.js      newGame, save contract, migrations
  turn.js       the turn pipeline, written order, one record out
  derive.js     every number the UI shows
  ledger.js     the only place money moves; purse == ledger
src/ui/       reads the engine, computes nothing
sim/          reference bot, batch runner (game-measure)
test/         invariants, save contract
tools/        bundle, checks, smoke, icons, stamp
```
Import direction: `ui → engine → data`.

## 4. Screens
| Screen | What it does |
|---|---|

## 5. Visual identity
<!-- Palette as tokens (must look nothing like the last game), type, art
     approach, and a style tile (docs/style-tile.html) for approval. -->

## 6. Instruments
| Tool | Question it answers | Must assert |
|---|---|---|
| `test/invariants.test.js` | What can never be true? | Impossibility, not magnitude |
| `test/save-contract.test.js` | Does every old save load and play on? | One fixture per save version |
| `sim/run.js` | What do N games look like? | Progress: refuses runs that did not advance |
| `tools/smoke.mjs` | Does the real page work at 390px? | Clock advances through the UI |

## 7. Build plan
| Phase | Delivers | Exit criteria |
|---|---|---|
| 1 | Engine + instruments + placeholder UI | Bot plays full runs; installs on a phone |
| 2 | Calibration round | Author's verdict on look, voice, option count |
| 3 | Vertical slice | Author wants to play on |

## 8. Risks
1.

## 9. Questions for the author (with the default if unanswered)
| # | Question | Default |
|---|---|---|

---

## 10. Phase 1, as built ({{DATE}})
<!-- What exists (with counts), measurements (tables with run counts and SE —
     game-measure's report.mjs writes them), what the instruments found and
     fixed, known gaps carried forward. -->
