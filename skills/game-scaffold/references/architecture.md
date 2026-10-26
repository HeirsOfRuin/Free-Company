# Architecture: proven defaults and when to deviate

Nine builds under the same constraints (phone-first, turn-based, no backend, no
API key, one author, one agent) proved three shapes. Pick by the table, then
`node scripts/init.mjs --shape=<A|B|C>` lays the shape with every invariant
below already in place. Where files go: `placement.md`.

---

## Choosing a stack

| Shape | Used by | Pick it when | Ceiling seen |
|---|---|---|---|
| **A. One `index.html`, inline JS, no modules** | Silk Road, The Company | Small systems game, ≤ ~3,000 lines, must open from disk, very fast to start | CO reached 2,979 lines and was getting hard to test; SR ~1 MB with inlined art |
| **B. Vanilla ES modules, no build step, + a bundler script to one file** | Centennial Farm, The Lists, Touchline | Simulation-heavy game; engine must run headless in Node for bots and tests; want zero dependencies | TL: ~6,000 players, 216 clubs, 1,600 assertions; fine |
| **C. Vite + Preact + TypeScript strict + YAML content + Zod + Vitest** | Knight of Adalia, Vikingr | Content-heavy (scenes, prose, many authored events); need a schema, a validator, a style lint; tens of thousands of words | KA ~400k-word target, 663+ choices; fine |

Rules of thumb:
- If the game is mostly **authored text**, choose C. YAML handles multi-line prose;
  compiling to one JSON bundle means the validator, bot and tests use the same
  data; Zod gives types and runtime validation from one source; unknown condition
  paths fail the build instead of silently evaluating false.
- If the game is mostly **simulation**, choose B. Pure modules run in Node for
  batch runs with no build; `tools/bundle.js` makes the single file.
- Choose A only for a small game you need today, and plan the move to B when it
  passes ~2,500 lines.
- No ESLint/Prettier needed; `tsc --strict` (C) or the test suite (B) is the
  static check. Playwright is preinstalled in cloud sessions; do not add it as a
  dependency (TL's pwa-check explains itself and exits cleanly if absent).

## Invariants (all shapes)

1. **Pure, deterministic engine.** `(state, input, content) -> newState`. No DOM,
   no `Date.now()`, no `Math.random()`. The bot, the tests and save reproducibility
   all depend on it. Facade: `newGame()`, `view(state)` (everything the UI shows,
   including lock reasons and odds), `choose(state, input)`.
2. **Named RNG streams, state in the save** (`src/engine/rng.js`). A forced debug
   outcome still consumes the draw so later rolls do not shift (KA).
3. **One derivation per number** (`derive.js` / `paths.ts`): engine, UI and bot ask
   the same function. The UI computes nothing (CF, LI: "reads the engine, computes
   nothing").
4. **Data separate from logic.** `src/data/*.data.js` logic-free tables, or YAML
   content + registry. Cheap rebalancing; but compounding across two tables is
   still unowned (F20), so test shares.
5. **One ledger chokepoint.** Money changes only through one function that writes
   the ledger row in the same call (SR `coin()`); a test asserts purse == ledger
   (LI). Turn digests are read off the ledger, so they cannot disagree with it.
6. **One resolver per kind of fight or check.** Hand play, auto-resolve and the
   measurement harness all call it (CO `resolveRound()`, VK). Reports are built from
   the resolver's own log, never re-narrated.
7. **Turn pipeline in written order**, producing one record (CF `turn.js`: five
   ordered phases, one record out; the year-end report is a by-product).
8. **Versioned saves with migrations and fixtures.** Key is a contract; payload has
   `v`; a migration chain; a fixture saved by every previous version, loaded and
   played on in tests (LI v1-v6). Old saves are healed once on load, guarded by a
   flag, with a journal line saying what changed (SR). Content changes: if a saved
   scene id no longer exists, fall back to the chapter checkpoint and say so (KA).
9. **Save export as text.** A compressed, versioned code (`KOAD1.` + base64url of
   deflated JSON in KA `savecode.ts`; VK `VIKR1.`) moves a game between devices,
   between itch and Pages, and survives cleared storage. A file download too, with
   a host fallback when an embedded page cannot start downloads (CF).
10. **Guarded storage** (`src/ui/storage.js`) and an error boundary that offers
    the save for export (F34).
11. **The build id names the cache.** The service worker's cache is
    `<slug>-<build id>`, written by the build over `__BUILD_ID__` (the bundler,
    or `tools/stamp.mjs`), and the page registers `sw.js?build=<id>`. No hand
    bumps: they were forgotten 13 times across four repos, and Centennial Farm
    shipped an escaped placeholder for a month. The build fails if the id did
    not land.

## Content pipeline (shape C)

From KA `docs/CONTENT.md`, reused by VK:
- `content/` YAML: `config.yaml`, `registry/` (flags with descriptions and `later:`
  markers, NPCs, traits, items, factions, endings), `scenes/<chapter>/`,
  `events/<chapter>/` (pool and queued).
- Scene kinds: spine (authored backbone), pool (interludes, weighted, cooldowns),
  queued (delayed consequences, `queue: { event, delay, earliest_chapter }`), ending.
- Condition grammar as short strings (`skill.diplomacy >= 4`, `npc.aldric.alive`),
  parsed at compile time; `all/any/not` blocks.
- Effect ops: `set`, `clear`, `add`, `trait`, `injury`, `queue`, `advance`, `journal`,
  conditional `if/then/else`.
- Checks: score = attribute + skill + mods − difficulty; chance = clamp(50% + 10% ×
  score, 5%, 95%) with a 15-point partial band; shown as bands (Risky / Even /
  Favorable), raw numbers only in debug. Partial = mixed win, never a failure.
- Text: `{tokens}`, `[if cond]...[else]...[/if]`, `[break]` Continue pages, NPC
  aliases (`@master`) that follow whoever fills a slot.
- Tools: `build-content`, `validate` (links, refs, unreachable scenes, lethal
  rules, every ending reachable), `lint:style`, `bot`, `continuity`, `audit`,
  `transcript`, `smoke`, `check`.

## Art pipeline

- **Generated in code, committed generator** (F-rule: commit the generator, not
  just the output): SR `tools/icons.js` (16x16 sprite grids → one sheet,
  background-position, 13 KB for 26 icons, shown at exact 2x); TL
  `src/gen/identity.js` (crests as SVG on a 16x16 grid, runs collapsed to one path
  per colour: 6.6 KB → 1.0 KB); CO heraldry generator that also makes the PWA icons;
  KA world map generated in code (`worldgen.ts`, realm borders grown by cost
  per tile); VK map from Natural Earth (`tools/build-map.ts`, grid committed).
- **Scenes from supplied sources** (VK `tools/art.ts`): source image → crop to the
  band ratio → downscale (400x160) → quantise to a fixed master palette (52
  colours, OKLab nearest) so every scene shares one palette → **no dithering**
  (ordered dither on a photograph is checkerboard noise; SR) → animate in code
  (palette cycling for fire and water, sprite loops, particles, ~12 fps, stop off
  screen, still frame for reduced motion). Keep sources in `art/src/`. Every key
  has a code-drawn fallback so missing art never blocks.
- **Pick the grid by looking at a ladder at true size**: SR rendered conversions at
  several sizes at real banner width; 432x216 was indistinguishable from the
  photo, 288x144 on 32 colours was the finest that still read as pixel art.
- **Check whether a "pixel art" source has a real grid** before downscaling (SR:
  measure block deviation for k=2..n; no cliff = no grid = plain downscale is safe).
- **Write an art brief** with a shot list, composition, light, what animates, and
  historical accuracy notes (VK `docs/ART.md`).
- **SVG over canvas** for generated icons: the generator stays a pure function tests
  can read back, and one string serves every size (TL).
- Sound from Web Audio with no files (LI), with a switch that is remembered and a
  tool that renders every sound to one WAV to listen to.

## Performance notes (TL, the largest world)

- Index before you scan: AI transfer attempts allocated every player in the world
  per attempt; banding players by ability once a day took a season from 20.6s to
  13.2s.
- Record ids at draw time instead of scanning all fixtures daily.
- Pack large saves: 48 attributes as fixed-length strings, IndexedDB for the world
  (3.6 MB), localStorage only for small things.
- Measure season time interleaved, same machine, several runs; numbers from a
  lighter-loaded run are not comparable.
