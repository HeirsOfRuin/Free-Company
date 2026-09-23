# The Company — one-page spec

A free company of mercenaries in Italy, 1360s. You are the captain. Every
season: find work, hold your men together, decide what your name is worth.

## Setting

Central and northern Italy, ~1360–1375. City-states at permanent low-grade
war with each other — Florence, Milan, the Papal States, Pisa, Padua — none
strong enough to field a standing army, all of them hiring. Between
contracts, a free company doesn't disband. It rides to the nearest
undefended town and asks for money not to burn it (*composizione* — a real
practice; the Great Companies extorted whole regions this way in exactly
this period). Real captains — Hawkwood chief among them — spent entire
careers rotating between employer, employer's enemy, and no one at all.

## Core loop (one season = one turn; four seasons = one year)

1. **See your offers.** 0–2 condotta contracts from whichever factions are at
   war and can afford you, priced off your reputation and your strength.
2. **Decide:**
   - **Accept a contract** — steady pay, a real fight, reputation moves with
     both the employer and whoever you fight.
   - **Ride for composizione** — no contract needed, fast cash from a weak
     target, reputation moves against you broadly.
   - **Winter in place** — low income, men heal, loyalty recovers. Mandatory
     most winters; skippable if you can afford the wear.
   - **Renegotiate or split off strength** — situational, available when the
     numbers justify it.
3. **Resolve.** Wages come due whether you worked or not. Casualties,
   plunder, and reputation move on what happened, not on what you intended.
4. **Check the two failure states and the one win state.**

## The scarce resource

Not money, and not morale alone — those are Silk Road's and Touchline's
resources respectively. Here it's **the gap between what your name is worth
to people who might hire you and what it's worth to people who might band
together against you.** Every profitable raid buys the first and spends the
second. A company that never raids is a company no one fears and everyone
underpays. A company that only raids is a company every faction eventually
agrees to jointly destroy — Companies of the era were routinely put down by
short-lived leagues of exactly the cities they'd been extorting. Reputation
is not a single gate to clear (Silk Road) or a single dial to keep high
(Touchline) — it's two axes in tension, and the second one has a cliff
built into it.

Secondary and real: **the men aren't yours.** Free companies ran on shared
plunder and elected corporals, not a wage contract you can unilaterally
cut. Loyalty that hits zero doesn't shrink the company — it splits it, and
the men and the money leave together.

## Per-turn decision

Given this season's offers, your treasury, your strength, your loyalty, and
your standing with each faction: contract, raid, or rest — and if you
contract, whether to hold it to term or break it when a better offer or a
worse fight appears.

## The two ways to lose

- **Mutiny.** Loyalty hits zero, or you can't pay wages two seasons running
  while loyalty is already low. The company splits under you. Run over.
- **The coalition.** Your name gets feared enough (dread high, trust low)
  that factions who'd otherwise be at war with each other league against
  you instead. If your strength can't survive what they send, you're hunted
  down. Run over.

## The one way to win

Bank enough (treasury threshold) *and* be trusted enough by at least one
faction (reputation threshold with them specifically) to be offered
something no free company actually keeps forever — a permanent commission,
citizenship, land, a title. Hawkwood died a Florentine citizen with an
estate, not a captain still riding circuit. That's the win: get taken off
the road.

## What generalizes from Silk Road / carries over unchanged

Single HTML file, offline-first, localStorage saves, seasonal turn
structure, a difficulty axis, three manual save slots. None of that is
being re-litigated.

## What does not carry over

Trade goods, markets, routes — none of it applies. The nearest sibling
mechanically is Touchline (roster, morale, contracts, results), which is
exactly why the kill-gate prototype had to prove this isn't just Touchline
with pikes before a single line of UI got written. It did.

---

# Built — Stage 1

The spec above is the original design. This section records what the built
game actually does, where it diverges, and what is measured rather than
asserted.

## The headline finding changed, and improved

The kill-gate simulation found that committing to one employer beat
chasing the best rate (14.6% win vs 10.4%). The built game adds faction
personality — each city has its own pay bias and its own memory for
loyalty — and that sharpened the finding into something better. Measured
in the shipped code, 400 runs each on Captain difficulty:

| Strategy | Win | Mutiny |
|---|---|---|
| Best rate, no loyalty | 9.3% | 10.3% |
| **Loyal to Florence** | **11.5%** | 17.5% |
| Loyal to Padua | 9.8% | 34.0% |
| Loyal to Milan | 5.0% | 16.5% |
| Loyal to Pisa | 3.0% | 34.5% |

It is no longer "commit to someone and win more often." It is "commit to
the *right* someone." Florence pays slightly under the market and
remembers everything, which makes it the loyalty play. Milan pays best and
forgets fastest, which makes it the rate-chaser's city and a trap for
anyone trying to build standing. Pisa cannot afford you, and committing to
it is ruinous. The faction notes in the game say all of this in prose; the
numbers agree with the prose.

## Investments are the progression arc

Ablation in the simulation (investments on vs off, all six strategies):
win rate ~10% with them, ~1% without. They are not decoration, and they
have not eaten the economy — contract pay remains 73–75% of all florins
earned, composizione 0–3%. They cost short-term safety, because buying
eats the wage buffer, which is the intended tension.

## Measured differences

Nothing below is claimed without a number behind it.

- **Difficulty:** Condottiere 24.3% win / 2.7% mutiny · Captain 11.3% /
  10.7% · Adventurer 4.0% / 27.0%.
- **Starting builds:** balanced 10.3% win / 10.0% mutiny · heavy 8.0% /
  10.6% · free riders 10.9% / 6.6%.

## The captain, and the banner

Attributes, arms and finery are deliberately light — they nudge the
numbers and carry the narration. Every modifier from investments,
attributes, equipment and difficulty is derived in one function (`mods()`),
and the figures shown on the Captain screen are that same function's
output, not a parallel estimate.

The warbanner is a seeded procedural heraldry generator: the preset
gallery is curated seeds and the randomiser is a reroll over the same
function, so only a short seed string is persisted and the generator is
the only asset. Pure identity, no mechanical weight.

A contact sheet of 60+ banners was rendered and looked at before the
generator was accepted, which cost four charges their place: a lion that
read as a shrub, an eagle that read as a scribble, a sword that read as
three vertical bars, and a key that read as a lollipop. It also caught a
swallowtail that cut a wedge looking like image corruption, and charges
that vanished into divided fields. None of those were visible in the code.

---

# Built — Stage 2: the war layer

## Composition replaced the scalar

`S.lances` is gone. The company is men-at-arms (upkeep 8.0), mounted archers
(5.0) and brigands (2.6); `strength()` is the one derived total and only
`applyLosses`/`addRecruits` write to the counts. The default 60/70/70 comes
to 1,012 upkeep against the old scalar's 1,000, so the swap did not move the
ledger on its own. Saves migrate by splitting the old scalar into the
starting build's ratio.

## The counterplay triangle, measured

Volley beats hold, charge beats volley, hold beats charge — braced men stop
horses, which was the White Company's actual trick. Terrain rotates it.
Measured over 400 battles per cell at even numbers, win %:

| | vs condottiere | vs militia | vs levy | hills | defile |
|---|---|---|---|---|---|
| hold | **74** | 34 | **100** | **91** | **78** |
| volley | 25 | **87** | 2 | **92** | 11 |
| charge | 65 | 2 | 37 | 7 | **77** |
| refuse | 0 win, but 79–84% of the company kept |
| **auto** | 75 | **95** | 100 | 91 | 77 |

Every enemy has a right answer, every terrain moves it, and the adaptive
policy beats all four fixed ones. `refuse` never wins and is not meant to:
it converts a rout into an orderly defeat with the company intact.

Enemy behaviour is what makes this readable. A condottiere counters what you
did last round. A militia holds. A feudal levy charges into a defile because
a feudal levy would.

## Battles are rare and can be waved through

Only campaign battles, siege relief and the coalition open the tactical
layer — roughly four to five a run. Every battle carries "let them handle
it", which is **not a second code path**: it runs the same `resolveRound()`
under a counter-picking policy. A battle fought by hand, a battle waved
through, and a battle run ten thousand times by a measurement harness are
the same code.

## Contracts and campaigns sit side by side

Short garrison work (one season) alongside campaigns (2–4 seasons, staged
march → battle → siege). Campaigns pay the going rate with no premium — the
upside is plunder and standing, the cost is being committed while a better
offer arrives. Breaking one costs about 35 reputation and 10 honor.

## The battle diagram

Both banners facing, unit strips whose length tracks surviving counts, a
morale bar per side, terrain tinted behind. The strips are drawn from
`b.us.units` and `b.them.units` — the same objects `resolveRound` mutates —
so what thins on screen is what decides the fight. No display copy exists.

## Balance after Stage 2

The band Stage 1 established, re-measured through the shipped code over 250
full 40-season runs per policy:

| Policy | Win | Mutiny | Stage 1 target |
|---|---|---|---|
| Mixed, best rate | 9.6% | 2.0% | 9–11% win |
| Loyal to Florence | 14.8% | 5.6% | above mixed |
| Loyal to Pisa | 7.2% | 12.4% | below mixed |
| Mixed, no investments | 1.2% | 0% | ~1% |
| Short contracts only | 6.4% | 23.6% | — |

Win rates and the investment ablation (8x) hold. The faction ordering holds.
**One honest divergence: mutiny for unrestricted play is 2% where Stage 1
had ~10%**, because a signed campaign is reliable multi-season income and
takes the cash-flow risk out of a run that always has work available.
Restricting yourself — short contracts only, or one employer — puts it back
(12–24%). That is a real consequence of adding campaigns rather than a
tuning miss, and it is recorded here rather than papered over.

Battle outcomes are scaled so the adaptive policy wins about 60% of fields,
the rate the old `0.4 + 0.4*quality` formula gave at default quality and the
rate the whole economy was calibrated against.

## What measurement caught that reading the code did not

- **`refuse` appeared to be a perfect stalemate button** across thousands of
  measured battles — 0 wins, 0 losses, 100% of the company kept. It was
  `NaN`: `TERRAIN` had no `refuse` multiplier, so every value in that branch
  was arithmetic failure wearing the costume of a clean balance result.
  There is now a guard that refuses to fail silently.
- **Campaign acceptance lived in the click handler**, so every non-UI path —
  the measurement harness, auto-play — silently treated a campaign as a
  one-season contract. Battles never happened and nobody noticed until the
  harness reported `battles: 0`. The decision moved into the engine.
- **Siege seasons paid nothing** while wages ran in full, making any long
  siege a guaranteed bankruptcy; it read as "campaigns cause mutiny".
- **`runSeason` returned early without rendering** when a battle opened, so
  the battle screen never appeared. Invisible to headless simulation, which
  drives state directly; caught in one click-through.
- **A phone screenshot** showed a volley described as "fair ground" on
  terrain that penalises it, and an enemy morale bar sharing the archers'
  gold so it read as a fourth unit block.

---

# Built — Stage 3: doctrine and a tutorial

## Two doctrines out of eight, three steps each

Investments are facilities you buy. **Doctrine is what the company trains
at**, and it is permanent: two picks out of eight, each advancing in three
steps that cost florins *and* proof you actually fight that way. A locked
step states the requirement and your progress against it — "Needs 6 fields
won having loosed a volley — you have 4."

Three war doctrines strengthen one order of the counterplay triangle each
(The Volley, The Braced Line, The Charge). Five company doctrines do not
touch battle at all and duplicate no investment: Guastatori (engineering),
Corridori (scouting, which reveals the coming ground and then the coming
enemy), The Articles (discipline and a floor under loyalty), The Chancery
(terms, and a cheaper exit from a contract), Ransom and Booty (plunder).

## The design rule that kept the triangle alive

A doctrine must make you better at what you are good at, **not erase your
bad matchup**. The first cut did exactly that: hold doctrine took hold from
27% to 84% against militia, the one opponent it is supposed to struggle
with. Doctrine is now reduced to a third of its strength whenever the order
is being countered — drilled archers shoot better, but a charge reaching
them is still a charge reaching them.

Measured with each war doctrine at its third step, the triangle holds: volley
doctrine leaves volley at 53% in a defile where it has no room, charge
doctrine leaves charge situational, and each still has an opponent it loses
to.

## Win condition rebalanced — a Stage 2 regression caught here

Doctrine ablation surfaced something that had nothing to do with doctrine:
**the money half of the win condition had stopped being a gate.** Campaigns
and sieges grew the economy enough that the 11,000 florin threshold was met
in 89–99% of runs, average ending treasury ~21,500. The game had quietly
become a pure reputation race.

Threshold raised to 18,000. Both halves bind again, and the effect of an
economic doctrine is now legible in exactly the right place: The Chancery
lifts the money gate from 68% to 95% of runs but does not move the
reputation gate, so it buys you the florins and not the trust.

## The tutorial

A four-page intro at first run, a guidance strip on the real view that names
the next thing to do, and one dismissible hint the first time each screen is
opened. Skippable at any point and replayable from the menu; a migrated save
is never shown it.

The steps are **predicates, not a script** — the current step is simply the
first one the player has not satisfied, so doing things out of order, or
ahead of being told, can never strand anyone mid-sequence.

## Balance after Stage 3

| Policy | Win | Mutiny |
|---|---|---|
| Mixed, best rate | 8–11% | 1–2% |
| Loyal to Florence | 18.4% | 3.6% |
| Loyal to Pisa | 6.8% | 8.0% |
| No doctrine | 6.4% | 1.2% |
| Two doctrines maxed | 11.6% | 0.4% |

Doctrine is worth roughly a doubling of win rate at full investment, which
puts it alongside the investment track rather than above it.

Enemy scale was re-tuned because the auto-battle policy got materially
better: it now predicts the enemy's actual reply (a condottiere counters the
order you gave *last* round, which is knowable) rather than assuming they
play their preference. Its order mix is hold 35% / volley 46% / charge 8% /
refuse 11% — varied rather than one-note.

## What measurement caught this stage

- **The order-dominance harness was lying.** When a policy was unavailable
  it silently fell back to `avail[0]` and reported the result under the
  original label — so every "charge" cell on terrain where charge is gated
  out was actually measuring *hold*. This also corrects Stage 2's claim that
  hold and charge were "tied" in broken ground: they were the same order.
- A first fix over-corrected, discarding any battle where the policy became
  unavailable *mid*-fight — which is most charge battles, since charging
  burns men-at-arms. Now unavailable-at-the-outset is `n/a`, and running out
  mid-battle falls back to a clearly-labelled `refuse`.
- **The harness was not passing doctrine into `availableOrders`**, so it
  could not see charge III widening the ground charging is legal on.
- The auto-policy assumed the enemy played its *preference*, which
  recommended charging into ground where the counter was waiting — invisible
  until doctrine opened that option up.
- A phone screenshot caught a toast rendering `&mdash;` literally (toasts are
  escaped, so entities do not work there) and the rival-undercut warning
  repeated on every single offer instead of stated once.

---

# Built — Stage 4: what playing it actually showed

Josh played a full career and came back with four things. All four were real.

## The career is fifteen years

`totalSeasons` 40 → 60, eligibility from season 30. Extending a career
inflates the win rate on its own — treasury accumulates roughly linearly
while reputation decays 2% a season — and it did: **49.6% at 15 years against
13.2% at 10**, measured before any threshold moved. Gates re-measured rather
than carried over: treasury 18,000 → **52,000**, reputation 60 → **76**.

## One resolver for all fighting

"A report for every fight" could not be faked for contract seasons, because
contract fighting was never a battle — it was a single dice roll
(`0.4 + 0.4 × quality`) with flavour text. There was no detail to surface,
only detail to invent.

So contract seasons now run a real battle through the same `resolveRound()`
as everything else, auto-resolved in four rounds. **The dual combat path is
gone.** Every fight — hand-fought, waved through, or resolved out of sight —
files a report built from the battle's own log, so a report cannot disagree
with what happened. Verified: reports exist for both `condotta` and
`campaign` kinds, and no fight completes without one.

The tactical screen still opens only for campaign battles, siege relief and
the coalition. The point was a report to read, not sixty battles to fight.

## You choose the shape of the company

Recruiting fills toward a target you set — three steppers and a spending
policy — instead of a hard-coded 30/35/35 mix nobody chose. It is set once,
not decided every season, and it matters: composition decides which orders
are open to you, since a company with no archers cannot loose a volley
however well drilled.

Measured over full careers: an archer-heavy target lands at 70% archers, a
lance-heavy one at 73% men-at-arms, a cheap-mass one at 70% brigands.

## A season is legible now

A digest card after each season: money in and out, strength, loyalty,
standing, and the narrative beneath it. **Its figures are asserted to equal
the real state change** — the card diffs two snapshots rather than estimating.
The account below is grouped by season with headers instead of one
undifferentiated stream, and field reports are tappable from it.

## Balance after Stage 4

Measured over 200 full 15-year careers per policy:

| Policy | Win | Money gate | Reputation gate |
|---|---|---|---|
| Mixed, best rate | 9.0% | 33% | 15% |
| Loyal to Florence | 8.5% | 18% | 23% |
| Loyal to Pisa | 1.0% | 2% | 13% |
| No investments | 0.0% | 3% | 0% |

**The headline relationship changed, and this is an honest correction.**
Loyalty no longer beats rate-chasing — they **tie**. Florence clears the
reputation gate far more often (23% vs 15%) and the money gate far less (18%
vs 33%), because it pays under the market. Two routes to the same place
rather than one best one. Which employer you commit to still decides
everything: Pisa is 1%.

A separate finding: **strict loyalty is suicide.** A policy that refuses all
other work when its employer is not hiring mutinies **77%** of the time —
roughly 40% of seasons with no income bankrupts the company. The viable loyal
play is preference with fallback, not purity.

## What measurement caught, and one thing it didn't

- **A drawn field was reputation-neutral**, which quietly removed most of the
  downward pressure on reputation: the old contract roll penalised standing on
  every loss (40% of seasons), while draws absorbed ~30% of outcomes and cost
  nothing. Average peak reputation had jumped from ~28 to ~43 before this was
  found.
- **Sample size nearly fooled me.** At 70 runs the same configuration read
  21.4% and then 11.4% win. Anything below ~200 runs at this career length is
  noise, and two of the ordering conclusions drawn at 70 were wrong.
- **A phone screenshot** caught the dead being named before the narration that
  explains them — the same backwards-ordering bug fixed in Stage 1,
  reintroduced because casualties committed before the outcome posted.
- **Not a code bug at all:** a long "hang" that looked like an infinite loop
  was orphaned measurement processes of my own, at load average 27. Check the
  machine before the code.

## Still not built

No naval or river actions, no multi-company alliances, and the captain does
not age. Creature charges (lion, eagle) remain cut from the heraldry
generator until they get a grid large enough to read on.
