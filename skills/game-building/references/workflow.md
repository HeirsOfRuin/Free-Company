# Workflow: the build process that worked, with templates

This is the process the later builds converged on (Knight of Adalia, Vikingr, The
Lists, Centennial Farm, The Company). The early builds (Silk Road, Cradle,
Touchline) went straight to code and paid for it in retrofits.

---

## The stages

| Stage | Output | Gate to pass before the next |
|---|---|---|
| 0. Backlog | Two-line entry in `docs/game-backlog.md` | Author picks it |
| 1. Spec | One page (template below) | Author approves |
| 2. Kill gate | Numbers-only prototype, fixed policies x seeds | Decisions differ measurably; win reachable but not trivial; no strategy trivially dominant |
| 3. Phase 0 proposal | `docs/DESIGN.md`: stack, architecture, schema, scope pushback | Author approves |
| 4. Phase 1: engine + instruments | Pure engine, bot with progress assertion, invariant tests, validator, smoke test, placeholder UI, PWA, Pages | Bot plays N full runs with no stalls; harness matrices vary sensibly; installs on a phone |
| 5. Calibration round | 2-3 representative scenes/systems at full polish | Author verdict on voice, look, UI density, option count |
| 6. Vertical slice | One complete stretch (a year, a chapter, a season) | A human plays it and wants the next one |
| 7. Breadth loop | Frame → approve → build → measure → playtest → revise, per feature | Each feature's claims measured; decisions logged |
| 8. Release pass | itch zip, store art, page copy, Pages link | Played from the uploaded zip; copy checked against the build |

Skip stages honestly, not silently. A one-evening prototype needs stages 1, 2 and 4
at most; say which you are skipping and why.

### Stage 2: the kill gate (do not skip for a systems game)
CO wrote `prototypes/the_company_sim.py`: five naive fixed strategies x 500 seeds x
40 seasons, no UI, no art. First run found: no recruitment (strength only fell),
raiding 100% fatal and priced below upkeep, 0% wins for every strategy, and two
strategies executing identical logic. All fixed before a line of game code. The
Workshop recommendation in the backlog says the same: "If the decisions aren't
interesting as a table of numbers, no amount of pixel art fixes it."

Once the real game exists, **retire the prototype**. CO marked the Python sim as
the Stage 1 record and moved measurement into the shipped functions ("the harness
cannot drift from the game because it is the game"). Two models drift.

### Stage 4: instruments ship with the engine
VK DESIGN §18: "Built alongside the engine from the first commit, not later."
Each harness gets its progress assertion the day it exists (F11). The cheapest
point to build the bot is before there is content that depends on its numbers.

### Stage 5: calibration saves rewrites
- VK: three calibration scenes settled the Runestone look, animation and voice, and
  cut the duel from five moves to three — before 30 scenes were written around it.
- KA: the depth calibration found the prose "too long-winded", which redirected all
  later writing (Continue pages, branching over length).

### Stage 7: the breadth loop, per feature
1. **Frame** (`docs/FRAME-<feature>.md`): the author's request quoted, the problem
   with the current system, the design rule, the options with a recommendation,
   worked example, what will be measured. Keep it to a page or two.
2. **Approve.** Wait for the author on anything that changes feel or scope.
3. **Build**, including the tests and the measurement for the claims.
4. **Measure** and write the numbers into the frame and the decisions log.
5. **Playtest** (the author). Fixes go in a "Playtest N" commit.
6. **Revise** and log the verdict.

## Handling a playtest report

The pattern from CF, TL and VK playtest fixes:
1. **Get the save** if there is one; reproduce on it. TL: "if you still see it
   after this, the save is worth more than more simulation."
2. **Trace, don't guess.** CF traced "two dozen plows and tillage still the
   bottleneck" to crews capped by hands — not a bug in the arithmetic, a mechanic
   with no explanation and a lever with no control.
3. **Classify:** real bug / missing control / missing explanation / design
   disagreement. The fix differs for each (only the first is an engine change).
4. **Fix the class, not the instance** (sweep for siblings: KA's continuity sweep
   found 47 more after one report).
5. **Measure the balance impact by A/B** on the same seeds (`git stash`, run, pop,
   run). Disclose it; do not quietly tune it away. CF: "the old number was propped
   up by animals a shortfall claimed to sell but didn't."
6. **Regression test** for the reported case (TL puts the user's club in a play-off
   and ends the season).
7. **Say what you could not reproduce.** TL's fatigue commit says plainly the 40-60
   band was not reproduced at tier 1 and where it was closest.

## Session efficiency

- **Run long measurements in the background** and keep working; print progress per
  chunk (F19).
- **Size samples to the question** with `runsFor()` before launching: a 2-point gap
  at 10% needs ~1,800 runs; a 10-point gap needs ~75.
- **Spot-check by seed:** `--trace --seed=3` (CF) prints one run year by year.
  Reading one bad run beats reading a batch average.
- **Chapter jumps / sandbox starts** for playtesting late content without playing
  the early game (VK title-screen chapter jumps, never saved; KA debug drawer with
  Rewind, stripped from release builds by `VITE_RELEASE=1`).
- **Scripted plans → Markdown transcripts** (KA `docs/playthroughs/`) let the author
  and you read a whole route without clicking.
- **One `npm run check`** that runs typecheck, tests, validate, lint, continuity
  and a short bot batch. KA and VK both have it; run it before every commit.
- **Commit at each green step** with the measured numbers in the message.

## Documents and their templates

### docs/game-backlog.md entry
```
### <Name>
<Setting, period>. Core loop: <verb> → <verb> → <verb>. Scarce resource: <x>.
Risk: <the thing that would make it boring>.
```
Score candidates on Distance (from built games), Fit, Content load, Leverage, Fun
risk. An idea not written here did not happen; chat does not survive sessions.

### One-page spec (CO `docs/the-company-spec.md` is the model)
```
# <Title> — one-page spec
## Setting            (period, place, why it is a game)
## Core loop          (one turn, numbered)
## The scarce resource (and why it differs from the last games' resources)
## Per-turn decision  (what the player weighs, in one paragraph)
## The ways to lose   (two or three)
## The one way to win (and how it generalises across starts)
## What carries over / what does not
```

### Phase 0 proposal (KA, VK)
Stack decision table (choice, decision, why); architecture diagram with import
direction; module table with the phase each lands in; content schema with a worked
example; save format; check/odds math; instruments table (tool, question it
answers, what it must assert); UI screens; visual identity; scope and risks;
build plan with exit criteria per phase; "Decisions already made" table.

### DESIGN.md "as built" sections
After each phase: what exists (with counts), measurements (tables with run
counts), what the instruments found and fixed, known gaps carried forward. "Where
the build differs from the plan above, this section wins."

### Decisions log (top of the log = newest)
```
| 2026-10-15 | **<Feature or fix>** (`docs/FRAME-X.md`). The author: "<verbatim quote>".
<What changed, with numbers>. Measured (<n> runs): <before → after>. <Side effects disclosed>. |
```

### Commit messages
The house style (all eight repos): a title saying what the player gets or what was
wrong, in plain words ("Hay needs no plow, and most personal traits were pure
decoration"); a body with the cause, how it was found (by playing, by an
instrument, by looking), the fix, the measured balance impact with run counts and
noise floor, what was deliberately not done, and the verification (tests count,
browser check at 390px).

### README sections worth having
What it is trying to be; playing it; the instruments ("Is it true?" vs "Is it
balanced?" with the commands); measured results tables; layout of the source;
the rules the codebase is organised around; sources for historical figures.
