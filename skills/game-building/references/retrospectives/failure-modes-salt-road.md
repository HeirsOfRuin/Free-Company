# Notes from building a game, for building a different one

These are failure modes observed while building one turn-based browser game with
one person over a long session. They are prompts for attention, not a checklist
to satisfy, and not a description of how the next game should be built.

Read the last section first if you are short of time. It says which parts of
this project to ignore, which is more useful than most of what precedes it.

---

## The failure modes

### 1. Assumptions outlive the scope that justified them

Nearly every real bug in this build had the same shape: code written when the
game was narrower kept running unchanged after the scope widened, and was
silently wrong. Nothing threw. Tests stayed green.

The game began with one starting city and later had three. What broke:

- A UI element was hidden behind a check for one specific route id that only
  existed in the original city's world. On the new starts, the thing you needed
  to buy was never listed for sale.
- Every start was dealt the same opening equipment, chosen before starts
  existed, so one start's only available road was unusable.
- A seasonal table written for one ocean was applied to a different sea with the
  opposite calendar, closing a start's only road for its first four turns.
- Dozens of lines of "universal" flavour text named places that only existed on
  the original map.

**The cheap detection:** after widening any scope, grep for the names of the old
narrow case — the original city, the original mode, the original customer — and
audit every hit. Most will be legitimate. The ones that aren't are invisible any
other way.

**The expensive mistake we actually made:** treating each of these as an
incident. They surfaced in three separate rounds and were fixed three separate
times. A scope expansion does not produce *a* bug, it produces a *class* of bug.
Sweep for the class the first time you see a member of it.

**Skip this if** your project never generalised. A thing built for one case, that
stays one case, does not have this problem.

---

### 2. Automated tests and human play find different bugs, and neither substitutes

Every user-reported bug in this build passed the full automated suite. Every
automated finding was something no player would have reported.

What the suite caught, that a human would not have:
- A risk-mitigation bug where bonuses stacked to a floor, producing 174
  consecutive journeys with zero disasters. A player would have felt the game
  was easy and not known why.
- Two difficulty settings that were nominally different and played almost
  identically.

What the human caught, that the suite could not have:
- A screen that rendered blank because two conditions were unmet.
- An item that could not be bought because the shop for it was hidden.
- Prices that were internally consistent but made no economic sense.

**The pattern:** automated tests verify invariants you thought of. They cannot
check reachability, plausibility, or comprehension. If your suite is green and
a player reports a bug, the suite is testing the wrong layer, not failing.

---

### 3. "It renders" is not "it is any good"

Three times, looking at real output at real size reversed a decision that
reasoning had already settled.

- 26 icons all passed their checks — each resolved to a distinct sprite. Seven
  were unusable. One read as a birthday cake, another as a boxing glove. Only a
  contact sheet showed it.
- Ordered dithering is textbook-correct for producing a banded retro sky. On a
  photographic source it produced checkerboard noise and was unusable. Theory
  said yes; one look said no.
- A caption was burying the artwork it sat on. Visible only at true phone width,
  not at desktop width.

**The cheap detection:** render repeated visual elements as one contact sheet and
look once. View single screens at the device size and in the context they will
actually appear.

**The underused half:** looking is also how you *stop* work. Rendering a quality
ladder at true display size proved that any setting beyond a certain point was
invisible on the target device, which ended an open-ended "make it better" thread
with evidence instead of argument. Use it to bound effort, not only to find
faults.

---

### 4. Correct-but-silent reads as broken

One screen had two unmet preconditions and so rendered nothing at all. It was
working exactly as designed. It was reported as a bug, entirely reasonably,
because nothing on screen said why it was empty or what would change that.

**The rule:** any conditional UI that can render empty should state why it is
empty and what would fill it. An absent thing and a broken thing look identical.

This generalises past games. A form field that vanishes, a menu item that
disappears, a report section that renders nothing — each teaches the user that
the software is unreliable, even when it is right.

---

### 5. Anything persisted is a contract, not a label

When the game was renamed, the page title, the manifest and the README were
labels — free to change. The storage keys were contracts with data already
sitting on players' devices. Renaming those would have silently orphaned every
existing save.

**The check:** before renaming anything, ask whether any data that already exists
elsewhere refers to it by that name. If so it is an identifier, and changing it
needs a migration or a deliberate decision not to.

---

### 6. Balance and pacing need simulation, not reasoning

Several economy bugs were invisible by inspection and obvious after one
full-length automated playthrough that counted outcomes: journeys taken,
disasters suffered, dispatches blocked, turn at which the game was won.

Reasoning about a system with compounding multipliers does not work. Running it
a few hundred turns and counting does.

**Skip this if** your game has no accumulating state. A puzzle game with
independent levels has nothing to simulate.

---

### 7. Verify the thing you claim differentiates

Three difficulty settings were described as meaningfully different. Measurement
showed two of them played almost identically, because a data table was missing
flags that the descriptions implied.

If you assert a difference — between modes, tiers, classes, paths — measure it
with a number. A difference that exists only in the copy is not a difference.

---

### 8. Commit the generator, not just the generated thing

Sprites and scene art ended up embedded in the shipped file as base64 — which
meant that once the working directory was cleared, they could never be edited
again, only replaced wholesale.

The tools that produce them were committed for that reason. A generated asset
without its generator is a permanent black box.

**Applies to more than art:** generated data tables, tuned constants derived from
a sweep, anything whose value came out of a process rather than a decision.

---

### 9. Check the platform's rules before auditing your own code

Eight consecutive deploys failed in two seconds each. The code was fine. The
hosting environment only accepted deploys from the default branch. Time went
into reading build output that never contained the answer.

**The check:** when something fails identically and instantly every time, suspect
configuration and permissions before logic.

---

## The cheapest habits, ranked by what they actually caught here

1. **Grep the old specific name after generalising.** Would have caught three
   separate rounds of bugs in one pass.
2. **Contact-sheet repeated visual elements and look once.** Caught 7 of 26
   unusable icons that every automated check had passed.
3. **Run one full-length simulation and count outcomes.** Caught the stacking
   bug and the fake difficulty difference.
4. **Check every conditional that can render empty.** Caught nothing, because
   nobody checked — it was reported by the player instead.

---

## What not to carry over from this project

This is the important part. The following were consequences of one project's
constraints. Adopting them because they appear here would be cargo-culting.

**Do not assume the shape.** This game was one self-contained HTML file, no build
step, no server, no dependencies, with art inlined as base64 and saves in
localStorage. Every one of those was forced by a specific constraint: no API
access, mobile browser target, must be openable from a file. If your game has a
backend, a build pipeline, or an asset server, none of it applies. The single
file created real costs — a 1MB page, art that could only be edited through a
committed script, no code splitting — that were worth paying only because of
those constraints.

**Do not assume the architecture.** One global mutable state object with a single
chokepoint for currency changes worked at this size and would be a liability at
several times it. It was a reasonable call for a few thousand lines. It is not a
pattern to reach for by default.

**Do not assume the genre or the mechanics.** Turn structure, seasonal risk
tables, market saturation, reputation gates, a difficulty axis built on seasonal
severity — these solved this game's problems. A different game has different
problems and most of these would be noise in it.

**Do not assume the art pipeline.** Pixel art, quantized palettes, 2:1 banner
scenes, sprite sheets addressed by background-position. All downstream of an
aesthetic choice and a file-size constraint.

**Do not assume the same failure modes will dominate.** These emerged from a
long, incremental, single-session build of a browser game with one stakeholder.
A project with several contributors, or a longer calendar, or a compiled
language, will fail in its own ways. The failure modes above are worth *checking
for*; they are not a prediction.

**Do not preserve a decision because it is written down here.** Several choices
in this project were revisited and reversed — the caption content, the image
conversion settings, the risk model — because looking at the result contradicted
the reasoning that produced it. That is the method worth copying. The
conclusions are not.
