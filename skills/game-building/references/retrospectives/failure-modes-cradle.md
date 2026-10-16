# Building games: what the Cradle build actually taught

A record of how one game build went wrong, written so a later session can avoid the same
failures **without inheriting the same architecture**.

Read Part 1 straight through — those are failure modes, and they do not care what you are
building. Read Part 2 as a list of questions to answer for *your* game, not as answers.
Every entry there states what made Cradle's choice correct *for Cradle*; if that condition
doesn't hold for you, the opposite choice is the right one.

The worst outcome from this document is a build that adopts Cradle's shape because Cradle
is what it read about. Cradle was a turn-based single-city simulation, roughly 7,700 lines
of vanilla JS, one player, no real-time rendering, no assets, no network. That is a narrow
shape. Most of what follows survives the change of shape; the parts that don't are marked.

---

# Part 1 — Failure modes

These are not style preferences. Each one shipped, ran green or unnoticed, and cost a
round trip.

## 1.1 A test harness can run green against nothing

**What happened.** The correctness suite drove a reference campaign through `play()`.
`play()` called the turn resolver, which *silently refuses to advance* while the game is
waiting on a player choice. The harness never made that choice. Every campaign in the
suite had been sitting on turn 1 from the commit that introduced that choice onward, and
it stayed green through two further rounds of development.

Seventeen checks reported PASS. The ones that mattered most — deterministic save
round-trip, legacy save migration, "no attacker can exceed the stated threat" — were
comparing two games that had never been played. After the fix, the same checks reported
wholly different numbers: threat at migration 23 → 303, worst committed attacking force
0.44× → 0.78× of stated threat.

**Why it survived.** A test that can only say PASS cannot tell you it is testing nothing.

**The fix, in one line.** Any harness that simulates progress must assert that progress
happened. A single check that the reference run reached its expected depth — turn count,
level, wave, score, whatever your game's clock is — catches this class entirely.

**The general practice.** Make assertions emit a quantity, not a verdict.

```
PASS  no attacker exceeds stated threat   worst = 0.44x stated threat (16 samples)
PASS  no attacker exceeds stated threat
```

The first is auditable by eye. The second is a promise. The Cradle bug surfaced the moment
an assertion printed `resumed to turn 1` — a number that looked wrong.

**Applies to:** everything. There is no game where this doesn't hold.

## 1.2 Your validation method decides which bugs are allowed to exist

**What happened.** Three defects were found by the human, on the target device, in under a
minute each, after the balance harness had played well over a hundred complete campaigns
without noticing any of them:

- Sliders that would not drag. The render loop rebuilt the DOM on `input`, destroying the
  element the finger was holding. Worked perfectly with a mouse, where a click sets the
  value in a single event.
- "Add to Home screen" producing a bookmark, not an installed app — a claim that had been
  made without being checkable from the build environment at all.
- Art that was legible at authoring size and invisible at display size.

**Why it survived.** Nothing in the harness could perform a touch drag, trigger an install
prompt, or look at a pixel. Defects cluster precisely in what your instrument cannot see.

**The general practice.** Before you trust a validation method, write down what it is blind
to, and say so out loud rather than letting green checks imply coverage. Cradle's harness
was blind to touch input, install semantics, real display scale, and whether the game was
any good.

**Do not** generalize this to "get it on a phone early." That was Cradle's specific gap.
The rule is: *name the distance between your instrument and the actual play experience,
then close it deliberately.* A screenshot suite is blind to timing and audio. A unit-test
suite is blind to feel. A playtest is blind to rare state combinations. Each needs a
different second instrument.

**Applies to:** everything, but what is blind differs per project. Re-derive it; don't
import Cradle's list.

## 1.3 One quantity, two definitions

**What happened.** Twice, in different systems:

- The threat number shown to the player and the strength used to resolve a battle were
  computed from different inputs. A neighbour displayed at 2.36× breached the walls at
  full strength.
- Threat was *stored* in state and read a turn stale. During a siege with 1,183 attackers
  at the walls, the panel read *threat 50, defence 44.69×*.

**The fix.** One function — `CR.committedStrength(n)` — called by the threat display, the
war resolver, the hazard system and the verifier. And the aggregate recomputed on read
rather than stored.

**The general rule, stated carefully.** It is *not* "never cache a derived value" — a
real-time game cannot recompute pathfinding every frame, and caching is correct there. The
rule is narrower and absolute:

> The number you **show** and the number you **act on** must come from the same code.

A cache is fine. Two independent derivations are not, and a stored aggregate that some
code paths refresh and others don't is the same bug wearing a hat.

**Applies to:** any game that displays a quantity it also uses. Caching discipline scales
with how real-time you are; the shared-definition requirement does not relax.

## 1.4 Tuning to a target metric can destroy what the metric was proxying

**What happened.** The brief was Standard ≈90% win rate, Harsh ≈70%, at competent play.
The first attempt raised the *irreducible threat floor*. It hit both targets exactly — and
collapsed the worth of the entire diplomacy system from about 10 points of win rate to 1
(93% vs 92% with diplomacy disabled), because no amount of goodwill moves a floor.

The number was correct and the game was worse. Scaling the neighbours themselves instead
hit the same targets with diplomacy back to being worth about 10 points.

**The technique that caught it — and this is the most transferable thing in this
document.** Run the reference player with one subsystem disabled and diff the outcome. The
delta is what that subsystem is worth. Real figures from this repo, 150 campaigns each:

```
sim 150 280 --diff=standard              89%
sim 150 280 --diff=standard --nodiplo    79%     diplomacy is worth 10 points
sim 150 280 --diff=standard --notrade    88%     trade is worth about nothing
```

A subsystem whose removal changes nothing is decoration. A subsystem whose removal changes
everything is a mandatory tax disguised as a choice. Both are balance bugs, and neither is
visible in the headline number.

**Two traps in the technique itself, both hit while producing that table.**

*Sample size.* At 60 campaigns the same trade comparison read 90% vs 92% — trade appeared
to be actively harmful. At 60 runs a single campaign is 1.7 points, so anything under about
±3 points is noise. Size the sample so the delta you care about clears it, or you will tune
against randomness.

*Attribution.* The win rate said trade was worth nothing. The secondary statistics said
something sharper: cities that traded peaked at 98.1k people, cities that could not peaked
at **115.6k**. Opening routes made the city smaller. That is not decoration, it is a trap.

But the measurement does not say *whose* fault it is. The reference player picks its export
by "whatever we have most spare of," and raw food production is numerically the largest
flow in the game — so it exports food on nearly every route, forever, starving its own
growth for coin. That could be a bad heuristic in the bot, or a system that punishes the
most intuitive thing a human would do. **An ablation locates a problem; it does not
attribute one.** Design the follow-up measurement before concluding.

**The general practice.** When tuning against a scalar objective, always measure at least
one thing the objective isn't — preferably each subsystem's contribution to it, plus a
second axis the objective ignores. Win rate said "trade is fine." Peak population said
"trade is a trap." The metric moving is not evidence the system improved.

**Applies to:** any game with a measurable outcome and a player you can hold constant.
Does **not** apply to narrative games, sandboxes without fail states, or anything where
"outcome" isn't a number. Don't force it.

## 1.5 Compounding factors defined in separate places have no owner

**What happened.** Trade income reached 99% of the city's total by the fifth era. Route
volume scaled with city size (defined in the trade module). Route value scaled with the
era's price index (defined in the era module). Each was defensible in isolation. Nobody
wrote their product, and their product was ruinous.

**What was actually done, and what should have been.** The two multipliers were decoupled
in code and the result confirmed by measurement — routes rising from 0% to about a third of
income and never dominant. That measurement was never turned into a standing assertion, so
nothing guards it today, and 1.4 above shows the trade economy drifting again unnoticed.

The durable fix is to assert *composition*, not magnitude: a subsystem's share of the total
stays inside a band across the whole campaign. Magnitude assertions break every time you
rebalance and get deleted; share assertions survive rebalancing and catch exactly this
class. Write the assertion at the moment you finish the measurement, or you are relying on
remembering.

**Applies to:** any game with stacking multiplicative modifiers, which is most of them.
Less relevant where effects are additive or discrete.

## 1.6 A scripted edit that matches nothing reports success

**What happened.** A find-and-replace that was supposed to wire up a per-era choice matched
zero occurrences, because earlier edits had drifted the target text. It reported success.
The feature silently did not exist for a full cycle. Separately, a generated build threw at
startup because a constant was declared below the line consuming it.

**The fix.** Assert the match count on every scripted edit:

```python
assert s.count(old) == 1, "expected 1 occurrence, found %d" % s.count(old)
```

That single line is the difference between *I changed it* and *I believe I changed it*.

**Applies to:** agent-driven development specifically. This is a lesson about how code gets
edited, not about games — but it cost as much as any of the others.

---

# Part 2 — Decisions, and what should decide them

Cradle made these choices. They were right **for Cradle**. Each entry names the condition
that made it right, so you can check whether it holds for you. Where the condition is
narrow, it says so.

## 2.1 Is the simulation deterministic?

**The question.** Can identical inputs reproduce an identical run?

**Cradle: yes** — a seeded generator whose state lives in the save file.

**What it bought.** Save/load correctness became testable as an equality check. Balance
runs became reproducible, which is what made the 90%/73% figures comparisons rather than
anecdotes. A reported bug replays exactly.

**What it cost.** Every random draw in every system must go through the seeded generator
forever. One stray `Math.random()` silently voids the property, and nothing tells you.

**When it is near-mandatory:** any game you intend to balance by simulation. The ablation
technique in 1.4 is worthless without it.

**When it is not worth it:** real-time games where floating-point drift makes cross-machine
determinism a lie anyway; prototypes; games where no one will ever replay a run.

## 2.2 Where does the model/view boundary sit?

**Cradle:** one pure function returned the entire turn picture as read-only data. The
interface rendered it; the turn resolver applied it. Interface and logic could not disagree
about what was happening, because there was exactly one calculation.

**The condition that made it right:** small state, discrete turns, ~150 turns a campaign.
Recomputing everything on every render cost nothing.

**When it's wrong:** real-time simulation, large worlds, or anything rendering per frame.
Full recomputation is not available to you, so you will hold incremental state — and the
divergence risk from 1.3 comes back. Manage it with the shared-definition rule instead of
by copying this structure.

## 2.3 Are the numbers separate from the behaviour?

**Cradle:** all tunable constants in data files carrying no logic. Rebalancing was editing
numbers and re-running the harness, which is why retuning difficulty took an afternoon.

This one is cheap and generalizes further than most. Note its limit: it does **not** prevent
1.5, because compounding across two data files is still unowned.

## 2.4 Is there a build step?

**Cradle: no.** Classic script tags, no modules, no bundler for development, runs from a
double-clicked file.

**Read the condition carefully before copying this.** It fit because the game was a
single-page turn-based simulation with no assets beyond inline vector art, no engine, no
network, and a user who wanted both to double-click a file and to install it on a phone.
Under those constraints it was strictly better: nothing ever broke because of tooling.

**It is the most seductive-looking and least transferable choice in this document.** If
your game needs real-time rendering, physics, 3D, an asset pipeline, audio, or more than
one developer, the absence of a build step is a liability, not a virtue. Do not carry it
forward as a default.

## 2.5 Is there a reference player, and when do you build it?

**Cradle:** a scripted competent player that plays identically every run. It is not a
*good* player. It is a *consistent instrument* — that is the entire point, and it is what
makes two win-rate numbers comparable.

**What it enables:** difficulty measurement, the ablation testing in 1.4, and regression
detection when a new system quietly wrecks the economy.

**What it costs:** a second implementation of "how to play," which rots as systems are
added. Cradle's rotted — and that rot *was* failure 1.1. The instrument needs its own check
that it is still instrumenting.

**When to build it:** Cradle got this one right — the reference player shipped in the first
commit, alongside the game. Every balance claim made afterwards was possible because of
that. The thing that arrived late was the *invariant* suite, three commits in, so the
earliest systems were tuned but never checked for correctness. They are different tools and
they answer different questions: the bot says *is this balanced*, the invariants say *is
this true*. Build both, and note that the bot is itself a piece of software that rots —
failure 1.1 was the reference player silently ceasing to play.

**When not to:** games without a measurable outcome. Don't manufacture one to justify a bot.

---

# Part 3 — Sequencing

Three orderings that would have saved the most time, in priority order:

1. **Put the real thing on the real target device before building the second system.**
   Three of four defects the human reported were device-class problems present from the
   first commit and invisible to every automated check.
2. **Build the balance instrument and the correctness instrument as two separate things.**
   Cradle shipped the reference player in commit 1 and the invariant suite in commit 3, and
   the two-commit gap is exactly where the untested systems are. One answers *is this
   balanced*, the other *is this true*; neither substitutes for the other.
3. **Add the "did progress actually happen" assertion the moment a harness exists.** It is
   one line and it is the difference between a safety net and a decoration.

---

# Part 4 — What this document does not know

Stated plainly, because a confident retrospective from a single project is how bad defaults
get established.

- **n = 1.** One game, one genre, one player, one platform. Part 1 is generalizable because
  those are epistemic failures rather than technical ones. Part 2 is one data point.
- **Never exercised here:** multiplayer, networking, real-time loops, physics, asset
  pipelines, audio, localisation, accessibility beyond basic contrast, save compatibility
  across many shipped versions, or anything at team scale. This document has nothing
  useful to say about any of them, and should not be read as though it does.
- **The difficulty targets came from the person who wanted the game**, not from theory.
  90% and 70% are not general truths about game design. Don't import the numbers.
- **Fun was never measured.** Every instrument built here tests correctness and balance.
  The one time the *experience* was wrong — every campaign opening at the same founding
  site, which made playthroughs feel narrow — no automated check noticed, because no
  automated check could. That gap was closed by a person playing the game and saying so,
  and nothing in this document replaces that.
