# Measurement rules, and the failures behind them

The F-numbers are the hub's failure catalogue (`game-building/references/failure-modes.md`).

## The rules

1. **Size the sample first.** `runsFor(gap, rate)`: ~200 runs per arm see a
   6-point gap at 10%; ~1,800 see 2 points; ~75 see 10. Decide what gap matters
   before launching.
2. **Every number carries its floor.** The kit prints ±1 SE on every rate and
   marks gaps inside 2 SE of the difference with `~`. A `~` is not a result. (F14)
3. **Read the cells, not only the pool.** An effect that cancels across roads or
   starts is still an effect. Imperator's Senate moved the pooled win rate 1.4
   points and the wealth road's 15.7.
4. **Several axes per variant.** Win rate alone said "never buy machinery" was
   right in Centennial Farm; wealth and crop said it was a risk-for-reward trade.
   Put the second axis in `metrics()`. (F16)
5. **Distributions, not means, for anything a player feels.** Numbers print as
   median [p10–p90]; add a worst-case metric when the complaint is about the
   worst case (Touchline's one exhausted starter). Condition on survival
   separately (Centennial Farm's valuation of farms still farming). (F15)
6. **Progress or it did not happen.** `progress()` names what a real game must
   contain; the kit excludes and lists any run that fails it, and exits 1. (F11)
7. **When a result surprises, check the bot before the design.** The Lists'
   backgrounds instrument was measuring the bot's mistakes; Vikingr's brakes were
   tuned against a bot stuck at broken morale. Bots answer every decision
   explicitly, never through an engine default. (F13)
8. **An ablation locates; it does not attribute.** "No change" can mean
   decoration or a bot that never uses the thing. Design the follow-up. (F2, F13)
9. **Withdraw a claim you cannot measure cleanly** rather than tune toward it
   (Centennial Farm withdrew two confounded tier claims). (F17)
10. **Disclose balance impact; do not tune it away silently.** Every change that
    moves a number gets an A/B on the same seeds in the commit body, with the
    floor. "The old number was propped up by animals a shortfall claimed to
    sell but didn't."
11. **Numbers go into the docs by `report.mjs`,** with the command that made them,
    so the next session can re-run them and the SE is never dropped.
12. **Long runs:** run in the background, check progress, and check the machine
    (`uptime`, `ps`) before suspecting the code: The Company's "hang" was its own
    orphaned processes at load 27. (F19)

## Seeds

- Same seeds across arms (the kit does this): the comparison is then between
  the same games, not different luck.
- Named RNG streams (`game-scaffold`'s `rng.js`) so switching a system off does
  not shift every other system's draws. Without them an ablation measures the
  re-roll, not the system. (F27)
- `seedFor()` in the adapter reproduces an older tool's seeds exactly, so
  numbers from before and after a migration compare one for one.

## What goes in the commit message

```
Balance impact, measured (<n> runs per cell, same seeds, git stash A/B):
<metric> <before> -> <after> (<gap>, floor <f>). <Why this is expected or not>.
```
