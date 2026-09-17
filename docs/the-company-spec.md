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
exactly why the kill-gate prototype has to prove this isn't just Touchline
with pikes before a single line of UI gets written.
