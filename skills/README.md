# Skills

`game-building/` is the team's game-development skill: the process, defaults,
failure catalogue, measurement kit and release checklist distilled from all eight
HeirsOfRuin game builds. `game-building.skill` is the same folder zipped for upload.

## Install or update

- **claude.ai (org skill):** Settings → Capabilities → Skills → upload
  `game-building.skill` to replace the existing `game-building` skill.
- **One repository only:** copy `game-building/` to `.claude/skills/game-building/`
  in that repo.

## Rebuild the zip after editing

```
cd skills && rm -f game-building.skill && zip -qr game-building.skill game-building
```

## Keeping it current

When a build teaches something new, add it where it belongs: a failure mode to
`references/failure-modes.md` (next F-number, with evidence, detector and fix), a
design finding to `references/design-lessons.md`, a reusable tool to the copy map in
`references/game-index.md`. Promote it to the ten rules in `SKILL.md` only when it
has cost at least two builds.
