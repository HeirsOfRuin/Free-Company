# The Company

A free company of mercenaries in Italy, 1360s. You are the captain. Every season: find work,
hold your men together, and decide what your name is worth. Contract, raid or rest, and live
with the consequences.

One HTML file, no build step, no dependencies at runtime. Plays in the browser on a phone or
a computer, installs as an app, and plays offline.

## Play

- **Install it:** https://heirsofruin.github.io/Free-Company/ (Share > Add to Home Screen on
  iPhone; the install prompt or menu > Install app on Android and desktop Chrome or Edge).
  It updates itself the next time it opens with a connection.
- **On itch.io:** the same game in the browser (`docs/itch-release.md` has the page and settings).
- **From a checkout:** open `index.html`, or serve the folder (`python3 -m http.server`).

Saves live in the browser. "Copy company as text" and "Paste a company in" move a game between devices.

## Layout

| Path | What |
|---|---|
| `index.html` | The whole game |
| `sw.js`, `manifest.webmanifest`, `icons/` | The installable app |
| `docs/the-company-spec.md` | The one-page spec the game was built from |
| `docs/itch-release.md` | The itch.io page, settings, copy and the before-public checklist |
| `prototypes/the_company_sim.py` | The kill-gate simulation that tested the loop before any game code |
| `press/` | Store cover and screenshots, made from the real game |
| `tools/` | Measurement, store art, icons and the itch zip (below) |

## Tools

Each drives the shipped `index.html` in a headless browser through its own functions.
They need Playwright (`npm i -D playwright`, or the global install cloud sessions have;
`PLAYWRIGHT_PATH` and `CHROME_PATH` override).

```
node tools/measure-economy.js   # full careers by policy: the win-rate band the economy is tuned to
node tools/measure-battles.js   # battle outcomes across enemy scales
node tools/measure-orders.js    # the order triangle by troop type
node tools/make-press.js        # cover and store screenshots into press/
node tools/make-icons.js        # app icons from the company's own arms
sh tools/make-itch-zip.sh       # dist/the-company-itch.zip, index.html at the zip root
```

The game-building skills and the backlog of games that used to live here are in
`HeirsOfRuin/Game-Workshop`.
