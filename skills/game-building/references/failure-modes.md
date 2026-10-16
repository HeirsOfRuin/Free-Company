# Failure modes: the full catalogue

Every entry here shipped, or nearly shipped, in one of the eight builds. Each has
the evidence, a detector (the cheapest thing that finds it), and the fix that
worked. IDs are stable so commits and docs can cite them ("F12").

Game key: **SR** Silk Road · **CR** Cradle · **TL** Touchline (Football) ·
**CF** Centennial Farm (Farmyard-) · **CO** The Company (Free-Company) ·
**KA** Knight of Adalia · **LI** The Lists · **VK** Vikingr.

---

## A. Truth: the game says one thing and does another

### F1. Two derivations of one number
Display and resolution computed separately, then drift.
- CR: threat display read 2.36x while the wall broke at full strength. CF: the
  planning screen's acreage and the engine's disagreed by 7%. TL: a stored player
  value shown in lists vs a live value the market used; the wage room on the
  transfers screen vs the money actually leaving. CF: road and program costs shown
  uninflated while the engine charged inflated prices.
- **Detector:** for each number on screen, find its function. Two functions = bug.
  Test: the preview equals the resolver (LI checks odds by summation AND by
  running the resolver 40,000 times).
- **Fix:** one function, called by engine, UI, and bot (`derive.js`). Caching is
  fine; a second derivation is not.

### F2. Declared, offered or shown, and never read (decoration)
The most repeated defect across all eight games.
- CF: 21 of 26 tech effects read by nothing; 35 dead effects in all; a war's
  `labourShortage` aggregated yearly and used nowhere. TL: three tactics in the UI
  never read; `autoPickOnMatchday` written at creation, read in zero places;
  `promisedRole` worth 33 points at signing and thrown away by the contract; loan
  fields modelled with no code path creating one; `manager.youthDev` set in five
  places, read in none. KA: hollow choices; 120 flags set and never read. CO:
  "refuse" order had no terrain multiplier (NaN — looked like a perfect stalemate).
- **Detector:** behavioural, not textual. With a deterministic engine a knob the
  engine ignores gives a byte-identical end state (`scripts/inert-check.js`). For
  content: a choice audit classing every choice now / later / flavour / none
  (KA `tools/audit-choices.ts`). A crude "key name appears in engine" test gives
  false passes (CF's guard passed `labourShortage` because the collector named it).
- **Fix:** wire it, or delete the claim. CF deleted `isolation` rather than leave a
  promised mechanic as decoration. Keep a backlog list that may only shrink.

### F3. Engine supports it, the UI never exposes it (or hides it)
- CF: hiring hands existed in the engine and the bot used it every year — the
  player had no control. Grain bins were correct data entries, but the market
  panel's category filter excluded them, so on-farm storage was unreachable in
  play. Equipment you already owned was hidden from the buy list, so "buy a second
  team" (the actual lever) was impossible.
- **Detector:** list every action the bot can take; confirm each has a control.
  List every data category; confirm each appears in some screen.
- **Fix:** expose the control next to the problem it solves.

### F4. The UI offers what the engine will refuse
- TL: retraining list offered to make a 29-year-old winger a goalkeeper; mentor
  list paired two 29-year-olds when the engine requires a four-year gap (a scarce
  slot silently wasted).
- **Fix:** filter lists with the engine's own eligibility function; show the
  reason beside a disabled option instead of a silent grey row.

### F5. Silent intent queues
Buttons queue an intent; the engine later decides; nothing reports the outcome.
- CF: every purchase could fail on cash an earlier order spent, and the
  confirmation message existed in the engine but was never displayed. Clicking a
  road button twice billed twice.
- **Fix:** every queued action returns `{text, ok}` and is listed in the turn
  report. Running "ordered so far" total priced with the engine's own functions.
  Toggles, not stacking clicks; engine-side dedupe as a backstop.

### F6. Copy that drifted from the numbers
- CO: tutorial taught "ten years, bank 11,000 florins" when the build was fifteen
  years and 52,000 — a new player would think the game broken. SR: tutorial written
  before half the systems existed; win screen named the wrong home city. KA: seven
  price labels showed pre-repricing sums; crossbows labelled £10 against a £50
  check. CF: difficulty blurbs vs measured rates.
- **Detector:** before any release, read every word a player sees against the
  build. A test that every shown price equals the cost the choice charges (KA).
- **Fix:** derive numbers in prose from CONFIG; generate price labels from the
  requirement; the validator rejects a written label whose price disagrees.

### F7. Template tokens and the wrong person
- CO: button read "Back {lt}" — body text went through `fill()`, choice labels
  never did. Worse, `someLt()` picked afresh per call, so 297 of 400 feud choices
  named one lieutenant and changed another's loyalty. VK: choice labels did not
  render tokens.
- **Detector:** render every screen across a full bot career and scan for
  `{token}`, `undefined`, `NaN`, `[object Object]` (scan text, not innerHTML —
  CO's first scan flagged its own `<script>`). `scripts/smoke.mjs` does this.
- **Fix:** resolve tokens once per event from one context; effects act on the
  named object, not a re-pick.

### F8. Prose that assumes a state the player is not in
- KA: 47 lines assumed choices not made; "two kings" after one was beheaded; a
  two-year-old heir talking like an adult; "squire" before he was one; a dead
  wife's letter. VK: 176 unguarded mentions of sworn men who could be dead; the
  game spoke as if the player commanded while he rowed for another man.
- **Detector:** a continuity checker (KA `tools/continuity.ts`): play hundreds of
  seeded runs, render every view, fail on (a) a phrase from `continuity.yaml`
  shown when its condition does not hold, (b) a dead NPC named outside a
  sentence about death or memory.
- **Fix:** engine-side, not hand guards: role tokens (`{rank_word}`), heirs that
  inherit a dead man's bench and lines, age bands, conditions in prose.

### F9. Calendar and dates drift from the prose
- KA: header said "year 4 of King Edwin" over prose about his second year; a
  resumed save replayed scenes years late; the King's Christmas fell in summer.
- **Fix:** prose reads year/age from the calendar (`{age_words}`, `{regnal_year}`);
  dated scenes catch the calendar up; lint bans fixed ages; the bot asserts every
  run reaches each landmark in the same year.

### F10. Assumptions outliving the scope that justified them
- SR: three times, code written for one start city ran unchanged after there were
  three (a hardcoded `hormuz` id hid the sea fleet; the Indian Ocean monsoon
  applied to the Black Sea; Samarkand place names in universal events). CO
  grepped for Silk Road's leftover names before calling its port done.
- **Detector:** after any widening (second start, mode, city, level), grep for the
  original id/name and audit every hit before writing anything else.

## B. Measurement: instruments that lie

### F11. A harness that measures nothing stays green
- CR: every campaign sat on turn 1 (blocked on an unanswered choice) for three
  rounds. CF: first batch broke 160 acres and took zero harvests. CF: two crisis
  tests measured a farm already foreclosed, and a farm that no shock could touch.
- **Fix:** every harness asserts progress (turns reached, events seen) and refuses
  to report otherwise (`scripts/harness.js`). Print quantities, not verdicts.

### F12. The harness mislabels what it ran
- CO: an unavailable policy silently fell back to `avail[0]` and was reported
  under its own label, so every "charge" cell on terrain that bans charging was
  measuring HOLD. The first fix over-corrected and discarded most battles.
- **Fix:** policies fail loudly or report n/a; fallbacks are labelled.

### F13. The bot's mistakes measured as the design
- LI: the backgrounds instrument was measuring the bot riding great tourneys too
  early. CF: the bot never repeat-bought or bought a bin, so two engine bugs and a
  whole marketing system were never exercised. VK: 64% of bot fights were fought
  at crippled morale — the hardship brakes had been tuned against that trap. KA:
  bots do not plan, so endings undercount a deliberate player.
- **Fix:** when a result surprises, check the bot before the design. Bots answer
  every decision explicitly (CF: relying on an engine default means a future
  default change silently retunes the reference player). Write down what the bot
  cannot do (UI-only features are invisible to balance numbers).

### F14. Sample too small, gap read as result
- CO: 70 runs read 21.4% then 11.4% on the same build; two ordering conclusions
  were wrong. CF: a 60-run ablation read a helpful subsystem as harmful.
- **Fix:** print the noise floor beside every comparison (`scripts/stats.js`).
  ~200 runs for a 10% rate to resolve ~6 points; ~1,800 to resolve 2.

### F15. The wrong statistic
- TL: season-mean fitness 96.4 "refuted" a fatigue complaint; the worst starter at
  kick-off showed the real cost. CF: mean net worth averaged foreclosed farms
  with surviving ones; `valuation.js` reports survivors' balance sheets only.
- **Fix:** distributions and tails for anything a player feels; condition on
  survival separately; never a single mean.

### F16. One axis misread as the verdict
- CF: "never buy machinery" survived 6 points more often — and grew a quarter of
  the crop and a quarter of the wealth. Reading three axes showed a risk/reward
  trade, not a bug. CR: hitting a target win rate by raising a threat floor
  collapsed diplomacy's value.
- **Fix:** every ablation reports several axes (outcome rate, wealth, peak, time);
  tune against a scalar only with a second axis watching what it proxies.

### F17. Confounded claims
- CF withdrew two tier claims rather than tune them: foreclosure rate (an easier
  tier guarantees an heir, so its farms live long enough to be foreclosed) and
  median acres in 2000 (measures only survivors).
- **Fix:** if a metric cannot isolate the claim, remove the claim from the copy.

### F18. Rare branches need volume, not more unit tests
- TL: a crash only when the USER's club won a promotion play-off; 1,597 assertions
  never took that branch; a playtester lost a career. A soak of 24 seeds found it
  in 2.
- **Fix:** a soak tool that plays many careers across every start/tier and reports
  throws and impossible states (season with no fixtures). Force rare paths in
  tests (TL force-tested relegate-and-dissolve because no seed produced it).

### F19. Long measurements that stall silently
- CO: 1,500 careers in one `page.evaluate()` ran five minutes then sat 25 minutes
  at load 0.00 with no output. CO: a "hang" was orphaned measurement processes at
  load 27.
- **Fix:** chunk (25 runs per call) with progress lines; check `uptime`/`ps`
  before debugging code.

## C. Simulation and balance bugs

### F20. Compounding with no owner
- CR: two multipliers in two modules made one subsystem 99% of late income. CF:
  hogs multiplied fourfold yearly ($8.6M farm by 1929); horses ate half the crop;
  three "oxen x1" rows ate three lots of feed.
- **Fix:** assert composition (share bands), not magnitude (`stats.js shares()`);
  carrying capacities; merge duplicate entries.

### F21. Double counting and unit errors
- CF: seed held back AND charged in cash (cost more than the grain); period
  dollars inflated as if 1875 dollars (the Crow buyout paid $213/acre not $35);
  negative deltas merged through a multiplier path; effects missing `permanent`;
  `x = x || 0` recorded nothing; `workableAcres(q) || X` fell back only at exactly 0.
- **Fix:** units in names (`pence`, `nominal1875`); one ledger chokepoint every
  cent passes through (`coin()` in SR/CO; LI asserts purse == ledger, and caught
  card money bypassing it).

### F22. Ordering inside a turn
- CF: breeding ran after the feed check, so a cull was regrown before anyone saw
  it; the market reserved feed against the pre-breeding herd. TL: competitions
  settled before the user's own match, so a final the user won awarded nothing. CO:
  casualties posted before the narration that explained them (twice).
- **Fix:** write the turn's phase order down; one ordered pipeline producing one
  record (CF `turn.js`); test the user-played path, not just the AI path.

### F23. Deadlocks between two limits
- CF: upgrades valued against broken acres, breaking limited by machine capacity
  — each capped the other; farms sat on 960 acres with 150 broken for decades.
- **Detector:** a capacity metric that never grows over a long run.

### F24. Death spirals and feedback traps
- VK: a crew at morale 0 counted as broken before a blow; each loss cost more
  morale ("I haven't won one since"). The first fix (floor at 3) still lost.
  CF: estate notes at 4x income killed half of all runs 1900-1929.
- **Fix:** loss must not feed loss without an exit; floors plus a way to recover
  (rest, ale, guest-right in port); size debts to what the asset can carry.

### F25. Snowball and poverty trap in the same game
- VK `measure:power`: top tenth at 118 men and fame 650 while the median was
  already in a poverty trap; fame never faded. LI: training so fast every career
  topped the Roll by year six; renown 199 vs the field's 120.
- **Fix:** progressive brakes (upkeep, envy, decay above a threshold) and a floor;
  measure the top tenth and the median separately.

### F26. The AI world does not play by the player's rules
- LI: the field's horses never improved and it earned only from jousts while the
  player earned everywhere; the Swan vote credited only the player with honour.
  TL: AI replacements generated below the quality curve eroded every division;
  free agents (ability drawn independent of age) were better than whole squads.
  KA: purchases that cost nothing with an empty purse.
- **Fix:** rivals earn, spend, age and improve through the same functions as the
  player; check league/field strength drift over many seasons (TL bounds it in a test).

### F27. Determinism leaks
- CF: module-level id counters gave one seed different ids in a batch. TL: adding
  a call that consumed randomness in worldgen silently re-rolled the world.
- **Fix:** named streams (`scripts/rng.js`); counters in state; derived (not
  rolled) AI decisions consume no randomness; prove a refactor neutral by
  checksumming a seeded world before and after (TL did this repeatedly).

### F28. Inflation of bounded traits
- LI: honour median 43 made every rank meaningless; 9 of 10 knights were "the
  Valiant" by their first winter because a dozen bold answers each nudged valour.
- **Fix:** bounded scales (0-20), resistance near extremes, thresholds measured
  from the distribution.

## D. Platform, build and release

### F29. Storage throws, page dies
- CO: one unguarded `getItem` = black screen in itch's frame. LI: storage evaluated
  as a default parameter threw before any try. SR: Safari refuses localStorage on
  `file://`.
- **Fix:** `scripts/storage.js`; title screen says when nothing will be kept.

### F30. Stale builds on returning players
- TL: background refresh passed the page's request (304, `res.ok` false) and never
  updated. SR/CO: forgot to bump the cache name.
- **Fix:** `scripts/sw.js` (cache:'reload', byte compare, offer reload); bump the
  cache name every release or stamp it with the build hash.

### F31. "Installable" that is not
- CF: home-screen meta tags on a `file://` build — a browser only installs a page
  it loaded itself over https with a manifest and worker at the same origin. An
  itch embed never qualifies. A 404 manifest makes the browser decline silently.
  SR: manifest `id` outside scope.
- **Fix:** Pages build for install; itch for discovery; link one from the other.
  Verify with a browser (TL `pwa-check.js`: manifest parses, icons resolve,
  worker activates, plays with network off).

### F32. Bundler and scripted-edit traps
- CF: `String.replace` with a string replacement ate the file at `$'`; `import
  {a as b}` emitted as invalid destructuring; a bundle that "built" did not parse.
  CR: a scripted edit matched nothing and reported success.
- **Fix:** replacement functions; assert match counts (`scripts/replace_once.py`);
  open the built artifact in a browser (CF `check-bundle.mjs`) every build.

### F33. Host and CI configuration, not code
- SR: eight deploys failed identically in two seconds — Pages only deploys from
  the default branch. CO: `.nojekyll` is load-bearing on branch deploys; a
  workflow expecting the Actions source failed every push.
- **Rule:** identical, instant failures = configuration. Read the platform rules first.

### F34. Unhandled throw freezes the UI
- TL: `busy` flag set before season-end work with no `finally`; one throw greyed
  Continue forever with no message.
- **Fix:** `finally` on every busy flag; a top-level handler that says what broke,
  offers the save for export and points at the autosave.

## E. Looking and feeling (visible only by looking)

### F35. Correct but silent reads as broken
- SR: an empty marriage tab with two shut gates and no explanation. CF: zero acres
  broken for twelve years because the ox died, and nothing said why; plows that
  added nothing with no explanation. CO: three coloured strips on the battle screen
  nobody had labelled "because the person who drew it knew".
- **Fix:** every empty or limiting state names the reason and the lever ("Limited
  by: hands, not plows. Hiring another hand adds a crew; another plow adds
  nothing"). Every chart has a key.

### F36. Repeated visuals and true-size problems
- SR icons; CO banners; TL crests at 18px; CF crop colours within 15 degrees of
  hue; roads drawn in browns that vanished; SR caption burying a bridge at 390px.
- **Fix:** contact sheet at real sizes (`scripts/contact-sheet.mjs`); hues spread
  per group, not drawn independently; view at 390px.

### F37. Layout at phone width
- CO: title buttons 650px tall (flex:1 in a column). TL: layout broke completely at
  390px, never looked at. CF: map stacked above tabs = hundreds of scroll-backs;
  two sticky bars at top:0 overlapped. VK: scrolled text showed through the top bar.
- **Fix:** smoke at 390x844 every build; one column; sticky action button; 44px
  touch targets; tokens for safe-area insets.

### F38. Agent-process failures
- Ideas discussed in chat and never written into a repo are gone next session
  (game-backlog.md). KA committed two scratch scripts by mistake. Cradle's build
  lives on an unmerged branch; the default branch of Civ-City is a one-line README.
- **Fix:** write ideas to `docs/game-backlog.md` immediately; `.gitignore` scratch
  patterns (`*.tmp.ts`); record in the backlog which branch holds a build.
