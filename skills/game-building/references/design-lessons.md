# Design lessons: what made the games better to play

Part of the old skill's honest gap was "nothing measures fun". Fun still needs a
human, but the eight builds produced recurring design findings that hold up across
genres. Each is a pattern to apply, with where it came from.

---

## 1. Decisions must be real

**Every option must be best somewhere.** CO measured its counter triangle: hold
takes 100% against a levy and 34% against militia; volley 87% against militia and
2% against a levy; no order wins everywhere; the adaptive policy beats every fixed
one. If one option dominates, the others are decoration (F2).

**Information is only worth something if it can change your choice.** LI's first
joust tuning made scouting worthless: aiming low was near-best against everyone,
so knowing the opponent could not change the answer. The payoff matrix was rebuilt
so the opponent's seat decides your aim and his aim decides your seat. Measure the
value of information: policy with the read vs without.

**No free middle option.** TL's job interview: every answer moves something real
(budget x0.70 to x1.35 against a harder remit or more patience). A safe answer
that costs nothing makes the question a formality.

**Specialisation sharpens strengths, never erases weaknesses.** CO's first
doctrine took "hold" from 27% to 84% against the one enemy it should struggle
with. Doctrine is cut to a third of its strength whenever its order is being
countered, and it never touches the enemy's numbers (asserted byte-identical).

**Choices must say what is at stake, computed from what they do.** KA's author
said some choices "did not feel as if they made a difference". The fix was an
"At stake" line under every choice, derived from the choice's real effects across
all outcomes (`src/engine/stakes.ts`), including "Remembered later" only when a
later condition actually reads the flag. Battles the player fights must have their
outcome driven by the player's performance, even when history fixes the war.

**Repeated actions lose value; good faith is rewarded.** TL negotiations: a
reserve price drawn once and stored (so it cannot be probed by clicking again),
a repeat or lowball hardens the position, a near miss softens it. LI courtship:
a courtesy repeated is worth less. Without memory, the honest strategy is to
nudge a number until it passes.

**Make a cheat attempt part of the test suite.** TL `tools/negotiate.js` tries to
grind the model rather than asserting it ran; it found that re-submitting an
identical offer could win.

## 2. Combat: legible without being solved

VK went through three versions, each with a clear author verdict:
1. Hidden rolls and a counter table learned by losing: "It doesn't feel like
   there is any real strategy or tactics, just guessing and getting lucky."
2. Every order showed its projected outcome: "It reveals too much. It just becomes
   choosing the one with the best numbers."
3. Buttons say what an order **does and costs**, not what it **will** do; the
   enemy's next move is read against its guile (sure / likely / one of two); an
   old hand gives advice for the first six fights; resolve and leaders differ by
   enemy type; fights capped at 7 rounds.

The rules that came out of it:
- Chance moves numbers (~±15%); it never decides what beats what.
- State carries between rounds (breath, spent spears, ground) so holding something
  back is a decision.
- The enemy adapts to repetition (push every round and he locks shields and feigns).
- Auto-resolve ("let the men handle it") is the **same resolver** under a policy,
  not a second code path (CO rule). If auto beats hand play, hand play needs a
  reason (VK Phase 1: auto-picker beat a careful player).
- Fewer, sharper options: VK's duel went from five moves to three after the
  calibration playtest. Each beats one and loses to one.
- Only the big fights open the tactical layer (CO: four or five per run); the rest
  resolve and file a report built from the battle's own log.

## 3. Pacing and power curves

**The rise must be slow enough to mean something.** VK's author: "I have trouble
enjoying a game where it is my first year raiding, and I become a near legend and
a rich shipmaster before I am 17." Every beginning now spends two summers at
another man's oar. LI's careers reached the top of the Roll too fast until the
field improved and fame saturated. Measure the arc: rank by year, wealth by year,
turns per year, and set a target before tuning.

**Progressive brakes plus a floor.** VK hardship: upkeep scales with size, envy
rises with outshining the district, disasters, the coast learns to defend itself,
the body ages, fame fades with retelling — and a floor (men sign on for a promise;
the jarl mans a ruined man's benches). LI: renown fades a tenth each winter plus a
quarter of everything over 100, the same rule for every knight, shown on screen.

**Money needs somewhere to go.** KA: a playtester finished with £118 unspent, then
late lives reached the last shop with £400-700 and could spend £485. Eight shops,
then larger late purchases (a company, a college, a dowry), and the ending names
what the money bought. Measure median coin at the end; if it piles up, add sinks
that matter.

**The first hour is its own design problem.** LI phase 9b: quick start, creation
numbers folded behind a link, tabs that open as needed and are marked new, a local
joust guaranteed within three days of home in the first month (before, one career
in six had nothing to do). CF: the first screen was thirteen "new this year" cards
because in 1875 everything is new; it became three real decisions.

**Quiet turns should be one click.** CF: the crop plan carries forward and the
year's breaking is pre-filled; the years that matter stop and ask. VK: at most one
sea event per voyage leg so crossings keep moving.

**Long careers inflate win rates by themselves.** CO: extending from 10 to 15
years lifted the win rate from 13% to 50% before any threshold changed. Re-measure
every gate when you change the length.

## 4. The world must be alive and fair

- Rivals have careers: LI's 48 knights ride every tourney whether you are there or
  not, age, retire and are replaced. TL's AI clubs identify weaknesses and act
  (~700 transfers a season). SR's rival caravans flood the markets you sell into.
- Rivals obey the player's rules (F26). If the player can buy better horses, so can
  they; if the player earns from the mêlée, so do they.
- History moves without the player (VK pillar 7; KA's wars happen whether or not
  the player is at the decisive moment; big ransoms often go to others).
- Places remember: VK standing per port, spread by distance and by the Church; LI
  rivals with grudges ride at you harder.

## 5. Teaching the player

- **Tutorials teach by doing.** CF: a step that can be completed by an action is
  completed by that action. Steps are predicates, not a script, so doing things out
  of order cannot strand anyone (CO). Action steps retire after N turns so one
  skipped step cannot block the rest (CF). Progress lives in the save, so a resumed
  game does not re-explain basics, and a new game on the same device teaches again.
- **One dismissible hint per screen**, with a way to bring them back (SR, LI).
- **Name the binding constraint and the next lever** (F35). CF's "Limited by" line
  went through three versions before it named which of hands or horsepower was
  binding and which purchase would actually help.
- **Show the counters that matter** (KA `counter_labels`: the battle, the siege,
  court favour). A threshold the player cannot see is a wall they walk into.

## 6. Narrative games (KA, VK)

- **Process:** frame (one doc per chapter or feature, for approval) → calibration
  (two or three scenes at full polish to settle voice and length) → build →
  scripted-plan transcripts for reading → playtest → revise.
- **Tight prose, Continue pages.** KA's first scenes were "too long-winded"; scenes
  now break into beats with `[break]`, and words saved go into branching. Never pad
  to a word count.
- **Branching over length; every chapter has more scenes than the last, not more
  scenes seen.** Choices early open and close paths later (KA: 402 flags, 187 that
  change later mechanics).
- **Continuity is engine work** (F8): tokens for rank, age, the heir, the jarl of
  the day; dead people stay dead; children are their age.
- **Style lint**: banned modern words, banned narrator tics ("It is not X. It is
  Y."), banned leaked authoring notes ("if you are Hugh Fletcher's son"), banned
  clock time in a pre-clock world. Lists live in `content/style-guide.md`; the lint
  reads them.
- **Validator rules that protect the player:** every scene has an unconditional
  choice (no dead ends); death only from a choice marked lethal with a warning in
  the text first; every ending reachable from every background.
- **The ending names the player's own turning points** (KA: ~230 forks tied to
  flags; each chapter's heaviest few shown, with the road not taken).
- **Sequel contract:** KA exports the dynasty as a versioned code; add fields
  freely, rename only with a version bump and a reader for the old version.

## 7. Historically grounded, not historically flavoured

The author's games are set in real or carefully modelled periods (Silk Road 1247,
Italy 1361, Manitoba 1875-2000, 9th-century North Sea, a 15th-century-modelled
tourney circuit, an original kingdom with real economics).
- Put real numbers in data tables with sources in the README (CF: the wheat price
  series, the Crow rate, credit institutions by year; LI: Tiptoft's ordinances).
- Make prose prices and engine incomes agree with one reference (`docs/ECONOMY.md`
  in KA and VK). KA's incomes were a tenth of history while prose prices were
  historical; nothing made sense together until both followed one table.
- History's mechanics are the best game mechanics: CF's survey checkerboard,
  summerfallow vs herbicide, debt-service ruin; CO's composizione; VK's fame by
  telling. Model the thing that actually decided outcomes.
- Accuracy in art prompts too (VK `docs/ART.md`: no horned helmets, round shields,
  timber not stone at Bangor in 830).
- Mark uncertain history as "traditional" or rumour.

## 8. What the author has consistently asked for

Recorded from decision logs and playtest notes, so a new build starts aligned:
- Phone first, installable, works offline. Turn-based. No accounts, no ads.
- Grounded realism and period texture; consequences that are rarely clean.
- A slow, earned rise; failure states that are real but survivable.
- Choices that visibly matter, and screens that explain themselves.
- Tactics that reward thought, not guessing and not arithmetic.
- Tight prose with dialogue, humour and physicality (KA house voice).
- Distinct visual identity per game (VK Runestone vs KA warm manuscript).
- Pixel art: fine scenes from supplied sources, converted to a master palette,
  animated in code.
- Design decisions recorded with measured numbers, in plain language.
