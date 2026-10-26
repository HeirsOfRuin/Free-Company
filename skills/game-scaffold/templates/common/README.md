# {{NAME}}

{{DESCRIPTION}}

Status: scaffolded {{DATE}} (game-scaffold, shape {{SHAPE}}). Placeholder game
in place; next: `docs/SPEC.md`.

## Play as an app

Once the Pages workflow has run on the default branch: open
https://{{OWNER_LOWER}}.github.io/{{REPO}}/ on a phone and choose Install (Chrome)
or Share → Add to Home Screen (Safari). It plays with the network off. Saves
live in that browser; Menu → Copy a save code moves a game anywhere.

## Run

```
{{RUN_CMD}}
```

## Check

```
npm run check     # {{CHECK_DESC}}
```

Must pass before every commit.

## Instruments

| Command | Question |
|---|---|
| `npm test` | Is it true? Invariants and the save contract |
| `npm run sim -- --runs=200 --by=difficulty` | Is it balanced? Batch runs by cell, ±1 SE (game-measure) |
| `npm run sim -- --trace --seed=3` | One game, turn by turn |
| `npm run smoke` | Does the real page work at 390px? |

## Layout

{{LAYOUT}}

## Sources
<!-- Real figures and their sources; "rounded for a game, do not cite". -->
