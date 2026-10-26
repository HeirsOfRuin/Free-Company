# Placement: which file goes where, in each shape

One table so nothing is copied twice into different folders (Imperator had two
copies each of `rng.js` and `stats.js`, because the first kit never said where
they went). `init.mjs` follows this table; follow it by hand too.

| File | Shape B (modules) | Shape C (Vite/TS) | Shape A (one file) | Owner |
|---|---|---|---|---|
| Manifest | `assets/manifest.webmanifest` (icon paths relative to it) | `public/manifest.webmanifest` | `manifest.webmanifest` | scaffold |
| Icon source (SVG, committed) | `assets/icon.svg` | `public/icons/icon.svg` | `icons/icon.svg` | scaffold |
| Rendered icons (180, 192, 512, maskable 512) | `assets/` | `public/icons/` | `icons/` | `tools/make-icons.mjs` |
| Service worker | `sw.js` (bundler stamps it) | `public/sw.js` (stamped in `dist/`) | `sw.js` (stamped in `dist/site/`) | scaffold |
| Worker registration | `src/ui/sw-register.js` | `src/ui/sw-register.js` (allowJs) | inline in `index.html` | scaffold |
| Guarded storage | `src/ui/storage.js` | `src/ui/storage.js` | inline in `index.html` | scaffold |
| Seeded RNG | `src/engine/rng.js` | `src/engine/rng.js` | inline | scaffold |
| Save contract | `src/engine/state.js` + `test/save-contract.test.js` + `test/fixtures/v<N>-save.json` | `src/engine/story.ts` (or the narrative core's `save.ts`) + `tests/save-contract.test.ts` + `tests/fixtures/` | inline | scaffold |
| Shown numbers | `src/engine/derive.js` | `src/engine/*` | inline | — |
| Money | `src/engine/ledger.js` (`coin()`) | the engine's effect applier | inline | — |
| Content | `src/data/*.data.js` (logic-free) | `content/**/*.yaml` → `src/content/bundle.json` | inline | narrative core for C |
| Reference bot | `sim/bot.js` | `tools/bot.ts` (narrative: `tools/bot-lib.ts`) | — (measure in the browser) | per game |
| Measurement kit | `sim/stats.js`, `measure-lib.js`, `run.js`, `adapter.js`; `ablate.js` etc. as needed | `sim/` (same files; adapter imports the TS engine via tsx) | — | game-measure |
| Kill-gate prototype | `prototypes/killgate/` | `prototypes/` | `prototypes/` | — |
| Browser helper | `tools/browser.mjs` | `tools/browser.mjs` | `tools/browser.mjs` | scaffold |
| Phone smoke | `tools/smoke.mjs` (adapter at the top) | `tools/smoke.mjs dist` | `tools/smoke.mjs` | scaffold |
| Build check | `tools/check-bundle.mjs` (file + site) | `tools/check-bundle.mjs` (site = `dist`) | `tools/check-bundle.mjs` (site) | scaffold |
| Build | `tools/bundle.js` → `dist/<slug>.html`, `dist/<slug>.embed.html`, `dist/site/` | `vite build && node tools/stamp.mjs dist` | `tools/build-site.mjs` → `dist/site/` | scaffold |
| Build id stamp | inside `tools/bundle.js` | `tools/stamp.mjs` | `tools/stamp.mjs` (via build-site) | scaffold / release |
| Release kit (itch zip, press, pre-public) | `tools/` | `tools/` | `tools/` | game-release |
| Narrative tools (validate, lint, continuity, audit, transcript) | — | `tools/` | — | game-narrative |
| Pages workflow | `.github/workflows/pages.yml` (one workflow only) | same | same | scaffold |
| Design docs | `docs/` (SPEC, DESIGN, FRAME-*, ECONOMY, …) | same | same | — |
| Build output | `dist/` (gitignored) | `dist/` | `dist/` | — |
| Measurement output | `out/` (gitignored); numbers reach docs via `report.mjs` | same | same | — |
| Scratch scripts | `tools/_*.mjs` or `*.tmp.*` (gitignored) | same | same | — |

## Rules

- **`docs/` is for documents.** Build output goes to `dist/`. Two older games
  (Civ-City, Centennial Farm) deploy from `docs/`; move them to `dist/site/` and
  the workflow when they next ship.
- **One copy of every kit file.** Kit files (`stats.js`, `measure-lib.js`,
  `run.js`, `browser.mjs`, `stamp.mjs`, `sw.js`, `sw-register.js`, `storage.js`)
  are not edited per game. Fix them in the skill and re-run
  `init.mjs --fill --upgrade` (or re-copy).
- **One Pages workflow.** Two that both deploy (branch source plus Actions)
  fail on every push.
- **Generators are committed with their output** (icons, maps, sprite sheets,
  scene art).
