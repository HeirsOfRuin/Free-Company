---
name: game-scaffold
description: One-command day-one repo for a browser/phone game, or bringing an existing game repo up to standard. Lays one of three proven shapes (B ES modules bundled to one file, C Vite+Preact+TypeScript+YAML, A one HTML file) with a working placeholder game, seeded RNG, save contract with fixtures, guarded storage, a build-id service worker, maskable icons, a Pages workflow that deploys from the default branch, the measurement kit, a phone smoke test and npm run check, all passing on the first run. Use when starting a new game repo; when a game lacks a manifest id, maskable icon, service worker, Pages deploy, npm run check or smoke test; when players do not get updates; when asked to make a game installable or to set up Pages; or when files from an older kit need upgrading. Triggers on new game, scaffold, set up the repo, make it installable, phone build, PWA, Pages deploy, home screen, maskable, stale build, npm run check. Part of the game-building family; read game-building first in a new session.
---

# Game scaffold

Every game used to hand-build the same scaffold (manifest, icons, worker,
`.nojekyll`, workflow, package scripts), usually over three or four "make it
install" commits, and several shipped with a gap. `scripts/init.mjs` lays it in
one command, and its `npm run check` passes before the first commit.

Hub rules this skill enforces: **9** saves are contracts · **5** look at it on a
phone · **10** write it down (the docs templates).

## New game

```
node <skill>/scripts/init.mjs --shape=B --name="The Workshop" --dir=../The-Workshop \
  --repo=The-Workshop --owner=HeirsOfRuin --colour="#8a5a2b" --bg="#16130f" \
  --description="An armourer's shop, Nuremberg 1470s." [--icon=art/icon.svg] [--save-prefix=WKSP]
cd ../The-Workshop && npm run check      # shape C: npm install first
git init && git add -A && git commit -m "Scaffold The Workshop"
```

| Shape | Pick it when | `npm run check` runs |
|---|---|---|
| **B** ES modules, no build step, bundled to one file | a simulation game (most games) | invariants, save contract, 50-game bot batch, bundle, file:// and installed-site checks, phone smoke |
| **C** Vite + Preact + TS + YAML + Zod | a narrative game (scenes, prose); then load `game-narrative` | content compile, typecheck, build + stamp, tests, 200-story bot, site check, smoke |
| **A** one `index.html` | small and needed today | site build + stamp, site check, smoke |

What you get (shape B): a placeholder game that is a real game (24 turns,
three actions, a ledger, a win and a loss) so every instrument has something to
prove; `docs/SPEC.md`, `DESIGN.md`, `FRAME-template.md`,
`FRAME-PLAYTEST-template.md`; `sim/` with the game-measure kit and an adapter;
`test/` with invariants, the save contract and a v1 fixture; `tools/` with
bundle, check-bundle, smoke, make-icons, stamp, browser. Replace the placeholder
from `src/data/` and `src/engine/turn.js` outward; keep the facade
(`newGame`, `advance`, `view`) and the conventions the tools rely on
(`[data-act]`, `[data-action]`, `[data-tab]`, `.hud .turn`), or adapt the
header of `tools/smoke.mjs`.

## Existing game

```
node <skill>/scripts/init.mjs --fill --upgrade --dir=../Imperator-of-Rome --repo=Imperator-of-Rome
```
Adds only missing infrastructure (never the placeholder game, never overwrites),
upgrades files that are recognisably copies of an older kit, and audits:
manifest `id` and maskable icon (fixed), hand-named service-worker caches,
Google Fonts, `check` without smoke or a build check, `.gitignore` scratch
patterns (fixed), missing save fixtures. Read its "to look at" list, act on it,
`npm run check`, review `git diff`, commit. Proven on Imperator: it filled
exactly the gaps the review listed and the game's own tests and smoke passed.

## The decisions it encodes

- **Service worker:** cache named by the build id, written by the build over
  `__BUILD_ID__`; registered as `sw.js?build=<id>` with `updateViaCache:'none'`;
  navigations network-first with a 3.5s timeout, everything else cache-first
  within the build's cache; the page reports what it loaded so offline works
  without a precache list; a new worker reloads silently on a fresh launch and
  OFFERS the reload once the player has touched anything. Not registered in a
  frame (itch) or from `file://`.
- **Pages:** one workflow; tests, build, completeness check (manifest, worker,
  icons, no unstamped placeholder); deploys only from the default branch, read
  at run time. Turns Pages on by itself on a repo that never had it.
- **Icons:** one committed SVG; 180, 192, 512 and a maskable 512 rendered from
  it at 80% on the theme colour.
- **Saves:** versioned key that never changes, `v` in the payload, a migration
  chain, a fixture per shipped version that must load and play on, text export.
- **Storage:** the lookup itself is guarded; the title screen says when nothing
  will be kept.
- **Errors:** `busy` released in `finally`; any throw shows a screen with the
  save code instead of a dead button.

Details: `references/placement.md` (which file goes where in each shape, and
the rules), `references/architecture.md` (choosing a shape, the eleven engine
invariants, content and art pipelines, performance notes).

## After scaffolding

1. Fill `docs/SPEC.md`; run the kill gate (`game-building` workflow, stage 2).
2. Replace the placeholder; keep `npm run check` green at every commit.
3. Balance questions → `game-measure`. Scenes and prose → `game-narrative`.
   Shipping → `game-release`.
4. Pages: if the repository ever deployed from a branch, switch Settings →
   Pages → Source to "GitHub Actions" once.
