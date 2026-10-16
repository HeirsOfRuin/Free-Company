# The eight builds: what each is, and what to copy from it

All repos are under `HeirsOfRuin/`. Copy proven code before writing new code; most
infrastructure problems in a new game have already been solved in one of these.

| Game | Repo | Shape | Genre / loop | Status (Oct 2026) |
|---|---|---|---|---|
| Silk Road | `SilkRoad` | A: one HTML file | Merchant caravans, 1247, three starts | Shipped to itch; post-mortem `docs/building-games.md` |
| Cradle | `Civ-City` | A | Single-city civ builder | Code is on branch `claude/game-development-wmhsp6` (open PR #1); `main` holds only a README |
| Touchline | `Football` | B: ES modules, no build | Football manager, five-tier pyramid | 1,606 assertions; PWA |
| Centennial Farm | `Farmyard-` | B + bundler | Manitoba farm 1875-2000, generational | Pages PWA; most rigorous balance tooling |
| The Company | `Free-Company` | A | Free company, Italy 1361-75 | Shipped to itch; home of `docs/game-backlog.md` and this skill |
| Knight of Adalia | `Knight-of-Adalia-` | C: Vite/Preact/TS/YAML | Narrative RPG, five chapters, a knight's life | itch (free), Android APK, demo build |
| The Lists | `The-Lists` | B + bundler | Tourney knight career, fictional kingdom | itch; CI tests; richest smoke test |
| Vikingr | `Vikingr` | C | Viking life RPG, sea map, three combat layers | In development (Roadmap 2) |

## Copy map: "I need X" → take it from

| Need | Best source | Notes |
|---|---|---|
| Seeded RNG with named streams | `Farmyard-/src/engine/rng.js` (also `scripts/rng.js`) | LI reuses it unchanged |
| Single-derivation module | `Farmyard-/src/engine/derive.js`, `The-Lists/src/engine/derive.js` | Every shown number from here |
| Turn pipeline with one record out | `Farmyard-/src/engine/turn.js` | Five ordered phases |
| Batch runner with progress refusal | `Farmyard-/sim/run.js` | `--trace=2 --seed=3` for one run year by year |
| Claimed-differences verifier | `Farmyard-/sim/verify-tiers.js` | Noise floor printed; `--ablate` |
| Composition / valuation | `Farmyard-/sim/composition.js`, `valuation.js` | Shares of gross; survivors only |
| Dead-effects guard | `Farmyard-/test/effects.test.js` | Pair with `scripts/inert-check.js` |
| Background/creation balance | `The-Lists/sim/verify-backgrounds.js` | Same seeds per answer, report > 2 SE |
| Decision-value curves | `The-Lists/sim/joust-curve.js` | Policy x skill gap, SE stated |
| Match-engine calibration vs reality | `Football/tools/calibrate.js`, `docs/MATCH_ENGINE.md` | Steppable engine for live view |
| Settings ablation (exact) | `Football/tools/ablate.js`, `train-ablate.js` | Byte-identical = inert; small vs ignored distinguished |
| Soak for rare crashes | `Football/tools/soak.js` | Every tier, many seeds |
| Exploit attempt | `Football/tools/negotiate.js` | Tries to grind the model |
| Packed large saves + IndexedDB | `Football/src/state/codec.js`, `store.js` | 3.6 MB world |
| Service worker + update notice | `Football/sw.js` (also `scripts/sw.js`) | Perf-API precache, cache:'reload' |
| PWA verification in a browser | `Football/tools/pwa-check.js` | Offline play, update offered |
| Phone smoke test | `The-Lists/tools/smoke.mjs`, `Farmyard-/tools/smoke.mjs` (also `scripts/smoke.mjs`) | |
| Single-file bundler + check | `Farmyard-/tools/bundle.js`, `check-bundle.mjs`; `The-Lists/tools/check-bundle.mjs` | Three builds: file, embed, Pages |
| itch packaging + store art | `The-Lists/tools/itch.mjs`, `Free-Company/tools/make-itch-zip.sh`, `make-press.js`, `SilkRoad/tools/itch.js`, `store.js` | |
| itch page copy and settings | `Free-Company/docs/itch-release.md`, `Knight-of-Adalia-/docs/itch/` | Measured embed size |
| Guarded storage | `The-Lists/src/ui/prefs.js`, `Free-Company/index.html` `lsGet`/`STORAGE_OK` (also `scripts/storage.js`) | |
| Save codes (compressed text) | `Vikingr/src/engine/savecode.ts`, `Knight-of-Adalia-/src/engine/savecode.ts` | |
| YAML content + Zod schema + compiler | `Knight-of-Adalia-/src/content/schema.ts`, `tools/content-loader.ts`, `docs/CONTENT.md` | VK copies it |
| Validator | `Knight-of-Adalia-/tools/validate-lib.ts` | 457 lines; dead ends, lethal rules, reachability |
| Style lint driven by the style guide | `Knight-of-Adalia-/tools/lint-style.ts` + `content/style-guide.md` | Lists live in the guide |
| Continuity checker | `Knight-of-Adalia-/tools/continuity.ts` | Phrase rules + dead names |
| Choice audit | `Knight-of-Adalia-/tools/audit-choices.ts` | now/later/flavour/none |
| "At stake" line from real effects | `Knight-of-Adalia-/src/engine/stakes.ts` | |
| Chapter cards, turning points, dynasty export | `Knight-of-Adalia-/src/engine/cards.ts`, `turning.ts`, `dynasty.ts` | |
| Scripted plans → transcripts | `Knight-of-Adalia-/tools/make-plan.ts`, `transcript.ts` | |
| Demo build from a content subset | `Knight-of-Adalia-/tools/demo-bundle.ts` | |
| Android APK workflow | `Knight-of-Adalia-/.github/workflows/android.yml`, `docs/ANDROID.md` | |
| World map generated in code | `Knight-of-Adalia-/src/engine/worldgen.ts`, `src/ui/worldart.ts` | Borders grown by tile cost |
| Real-geography map from Natural Earth | `Vikingr/tools/build-map.ts` | Grid committed with generator |
| Photo/AI source → pixel scene | `Vikingr/tools/art.ts`, `docs/ART.md`; `SilkRoad/tools/scenes.js --pixel` | Master palette, no dither |
| Animated scene renderer | `Vikingr/src/ui/scene/render.ts` | Palette cycling, particles |
| Pixel sprite sheet tool | `SilkRoad/tools/icons.js` | Validator refuses malformed grids |
| Procedural heraldry / crests | `Free-Company/index.html` `drawBanner`, `Football/src/gen/identity.js`, `The-Lists/src/engine/heraldry.js` | Tincture rule; hue spread |
| Web Audio sound, no files | `The-Lists/src/ui/sound.js`, `tools/sound-preview.mjs` | |
| Phased combat (shield-wall, duel) | `Vikingr/src/engine/wall.ts`, `bout.ts`, `docs/FRAME-COMBAT-2.md` | Revision 2 is the current answer |
| Counter-triangle battles + sieges | `Free-Company/index.html` `resolveRound`, `tools/measure-battles.js` | |
| Negotiation with memory | `Football/src/engine/negotiation.js` | |
| Tutorial as predicates | `Farmyard-/src/ui/tutorial.js`, `The-Lists/src/ui/hints.js` | |
| Economy reference doc | `Knight-of-Adalia-/docs/ECONOMY.md`, `Vikingr/docs/ECONOMY.md` | |
| Frame docs (feature proposals) | `Vikingr/docs/FRAME-*.md`, `Knight-of-Adalia-/docs/FRAME-CH4-CH5.md` | |
| Kill-gate prototype | `Free-Company/prototypes/the_company_sim.py`, `docs/the-company-spec.md` | |
| Backlog and candidate scoring | `Free-Company/docs/game-backlog.md` | |
| Retrospectives | `SilkRoad/docs/building-games.md`; this skill's `references/retrospectives/` | |

## One-line lessons per game

- **Silk Road:** scope widening (one city → three) is where silent bugs breed; look
  at the screen before believing reasoning; storage keys are contracts.
- **Cradle:** a green harness can be testing nothing; show and resolve from one
  function; ablations need sample size and a second axis.
- **Touchline:** settings the engine never reads; rare branches need soak volume;
  the average is the wrong statistic; deterministic checksums prove refactors neutral.
- **Centennial Farm:** dead effects at scale (35); compounding without owners; the
  instrument can be the problem (machinery inversion); disclose balance impact
  instead of tuning it away; teach by doing.
- **The Company:** the kill gate catches broken loops before code; one resolver for
  every fight; release on itch needs storage guards and a measured embed.
- **Knight of Adalia:** frame → calibrate → build → playtest; continuity is a tool,
  not a read-through; choices need visible stakes; money needs sinks.
- **The Lists:** the joust (the spine) built and measured first; information must
  change decisions; the AI field must obey the player's rules; a lighter first hour.
- **Vikingr:** combat legibility took three tries; slow the rise; brakes plus a
  floor; death spirals; dead men stay dead engine-side.
