# Game backlog

State of the game projects, and a filtered list of candidates for the next build.

---

## 1. What exists

| Project | Repo | Status |
|---|---|---|
| **Silk Road** — turn-based merchant game, Samarkand/Trebizond/Tabriz, 1247 | `HeirsOfRuin/SilkRoad` | Built, playable, PWA-installable. Post-mortem written (`docs/building-games.md`). |
| **Cradle** — city/civ builder | `HeirsOfRuin/Civ-City` | Built, in review. Last note: trade mechanic flagged as a balance trap. |
| **Touchline** — football manager sim | `HeirsOfRuin/Football` | Built, 1,589 tests passing. |
| **Age of Chivalry** — TTRPG, AI GM roadmap, canon audit vs. draft9 | none in this workspace | Design/canon work, ran on the local bridge environment. No game app repo here. |

Three built games, all the same shape: single HTML file, no build step, no server,
no API key, turn-based, historically grounded, phone-installable.

## 2. Ideas discussed but never started

Not recoverable from here. Conversation transcripts from prior sessions are not
readable by a new session — only session titles, repos and committed files carry
across. Anything raised in chat and not scaffolded into a repo left no trace.

**Fix going forward:** an idea that isn't written into this file didn't happen.
Append a two-line entry when one comes up — name, core loop. That is the whole
process.

## 3. The design filter

Anything on the candidate list has to clear the constraints the three existing
builds actually ran under:

- One HTML file, openable from disk, playable offline on a phone.
- Turn-based. No real-time input, no multiplayer, no server, no API key.
- Content one person can author — art and text are the real budget, not code.
- A loop that generates stories, not just numbers.
- A win condition that generalises across starts.

That rules out, up front: anything needing a backend or live LLM calls, anything
real-time or multiplayer, anything with a procedural 3D or large-asset pipeline.

## 4. Candidates

Scored 1–5. **Distance** = mechanical distance from the three built games (higher
is better — a fourth trade game teaches nothing). **Fit** = fit to the single-file
constraint. **Content** = authoring load (higher is cheaper). **Leverage** = does
it feed work, consulting or the TTRPG. **Fun risk** = risk of being boring
(higher is safer).

| # | Candidate | Distance | Fit | Content | Leverage | Fun risk | Total |
|---|---|---|---|---|---|---|---|
| 1 | The Workshop | 5 | 5 | 4 | 5 | 4 | **23** |
| 2 | Shift | 5 | 5 | 5 | 5 | 2 | **22** |
| 3 | The Manor Year | 4 | 5 | 4 | 3 | 4 | **20** |
| 4 | Homestead | 4 | 5 | 4 | 2 | 4 | **19** |
| 5 | The Assize | 5 | 5 | 2 | 3 | 3 | **18** |
| 6 | GM Table | 5 | 3 | 3 | 5 | n/a | **16** |
| 7 | The Siege | 3 | 4 | 3 | 3 | 3 | **16** |
| 8 | The Company | 2 | 5 | 3 | 2 | 4 | **16** |

### 1. The Workshop
An armourer's shop, Nuremberg or Milan, 1470s. You take commissions, assign
benches, and live with what you promised.

- **Core loop:** quote a job → schedule people and stock against it → work turns
  through → deliver, rework, or eat the loss.
- **The scarce resource is capacity and skill, not money.** Every existing build
  makes money the constraint. This one makes throughput the constraint, which is
  a genuinely different game.
- **The real decision is which job to refuse.** A guild inspection, a war
  contract that eats the shop for a season, an apprentice who is faster than he
  is good.
- **Why you:** it is production scheduling in armour. You will catch when the
  sim is wrong in a way a normal designer cannot.
- **Risk:** the fun lives in the tension between quoted and actual. If
  estimation is too easy the game is a spreadsheet. Bad news has to arrive
  mid-job, not at quote time.

### 2. Shift
Same engine, modern skin: a shift supervisor on a fabrication floor. Line
capacity, absenteeism, a difficult employee, a rush order, a near-miss.

- **The mechanic that matters is delayed consequence.** Skip a coaching
  conversation in week 2, get a quit in week 9. Most serious games score the
  decision at the moment it's made, which is why they feel like a quiz.
- **Leverage:** this is a consulting asset — a workshop tool and a portfolio
  piece, not a hobby build.
- **Risk:** highest of the list. Serious games go preachy and dull fast. It only
  works if the "right" answer is genuinely costly and sometimes wrong.
- **Sequencing:** build The Workshop first. Shift is the same core loop —
  queue, capacity, quality, people, lag — with the setting swapped. Proving the
  loop is fun in armour is cheaper than proving it in PowerPoint.

### 3. The Manor Year
An English manor, 1340s. Demesne, labour dues, the court roll, the weather, and
eventually the plague.

- **The resource is time and people, and the clock does not stop.** Generational:
  you inherit, you hand on.
- Different from Cradle — you are not growing a settlement, you are holding one
  together against decay and obligation.
- **Risk:** passivity. Needs enough live decisions per year not to feel like
  watching a harvest.

### 4. Homestead
Red River / southwestern Manitoba, 1878–1912. Debt, weather, the rail line
arriving or not, the store's ledger, isolation.

- Local, well documented, and nobody has made it well.
- Sharper than The Manor Year on one axis: the ledger. You can lose the farm to
  compound interest while every crop succeeds.
- **Risk:** grim without relief. Needs a run that can end well.

### 5. The Assize
A travelling justice on circuit. Cases, testimony, a local magnate leaning on
the verdict, an assize you cannot finish before the season closes.

- Nearly no art budget; almost all text.
- Most distinct thing on the list — the resource is credibility.
- **Risk:** writing load. Cases must be generated, not hand-written, or it runs
  dry in twenty minutes. That generator is the whole project.

### 6. GM Table
Not a game. Offline tooling for Age of Chivalry: holdings, NPCs, retinues,
prices, travel times, and a session log, generated from your existing canon.

- Highest leverage on work you have already done. Lowest novelty.
- **Caveat:** "no API key, offline" means tables and generators, not an AI GM.
  The AI GM roadmap is a separate project with different constraints.

### 7. The Siege
Operational logistics of a siege, either side. Supply, sappers, disease, morale,
time. Constraint satisfaction, not tactics.

- Bounded scope, natural ending, clean failure states.
- **Risk:** overlaps Silk Road's risk-table shape more than it looks like it
  does. And it ends — low replay unless the generator is strong.

### 8. The Company
A free company in Italy, 1360s. Contracts, pay, loyalty, plunder against
reputation.

- **Listed to be ruled out.** It is Touchline with violence: roster, morale,
  contracts, results. Least learned per hour of the list.

## 5. Recommendation

**Build The Workshop. Plan Shift as the re-skin.**

Reasoning: it is the only candidate that is mechanically new, cheap in content,
inside the proven architecture, and sitting directly on top of domain knowledge
you already have. And it de-risks the commercially valuable build by proving the
loop somewhere the stakes are zero.

Do not build The Company. Do not build a fourth trade game.

## 6. Next actions

1. **Confirm the pick** — Workshop, or one of the others.
2. **Write the one-page spec before any code.** Core loop, the scarce resource,
   what the player decides each turn, the three ways to lose, the one way to win.
3. **Prototype the loop as numbers only** — no UI, no art. Twenty turns in a
   script. If the decisions aren't interesting as a table of numbers, no amount
   of pixel art fixes it. This is the kill gate.
4. **Only then** carry over the Silk Road scaffolding: single file, save slots,
   manifest, service worker, test harness.
5. **Re-read `SilkRoad/docs/building-games.md` at the first scope expansion,**
   not at the start. Its top failure mode — assumptions outliving the scope that
   justified them — hits the moment a second shop, second city or second mode
   appears.
