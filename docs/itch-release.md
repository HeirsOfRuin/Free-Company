# The Company — itch.io release

Everything needed to put the game on itch.io, and the things that are a
decision rather than a task.

---

## 1. What to upload

`dist/the-company-itch.zip` — six files, 161 KB, `index.html` at the zip root
(itch will not run a zip with the game inside a folder).

```
index.html
manifest.webmanifest
sw.js
icons/icon-192.png
icons/icon-512.png
icons/maskable-512.png
```

Rebuild it after any change to the game:

```
sh tools/make-itch-zip.sh
```

Nothing is minified or rewritten — the file uploaded is the file in the repo.

**Verified** (headless Chromium, 390×844, served from the unpacked zip): title
screen renders, a company can be created, a season resolves, the service worker
registers and takes control, and the only request that leaves the package is
the Google Fonts stylesheet.

## 2. itch project settings

| Field | Value |
|---|---|
| Kind of project | **HTML** |
| Upload | `the-company-itch.zip`, tick **This file will be played in the browser** |
| Embed | Embed in page, **480 × 820** |
| Mobile friendly | **On**, orientation **portrait** |
| Fullscreen button | **On** |
| Automatically start on page load | On |
| Classification | Game |
| Genre | Simulation (secondary: Strategy) |
| Pricing | No payments, or donations |
| Visibility | Draft until you have played the uploaded build, then Public |

Tags: `medieval`, `historical`, `mercenary`, `management`, `turn-based`,
`singleplayer`, `text-based`, `singleplayer`, `pwa`.

Cover image is 630×500 and is required for the game to appear in browse
listings. The banner generator can produce one — a company device on the
dark ground, title set in Cinzel.

## 3. Page copy

**Title:** The Company

**Tagline:** A free company of mercenaries in Italy, 1360s. Fifteen years to
make your name worth something.

**Description:**

> You are a captain of a free company in Italy in the 1360s — one of the
> mercenary bands that sold war to whoever was paying. You have men, a
> banner, and no land.
>
> Fifteen years. Sixty seasons. Each one you take work, ride for your own
> account, or rest the company. Garrison contracts are safe and pay badly.
> Campaigns pay well and put you on a field, where you choose ground and
> orders and live with the result. Towns pay to be left alone, and your name
> remembers it.
>
> The men are the game. They have to be paid every season, whether or not
> anyone hired you. Pay late and loyalty falls; let it fall far enough and a
> lieutenant takes a third of the company and leaves. Your lieutenants are
> named men who die and are replaced from the ranks.
>
> Your employers remember. Florence forgets nothing; Milan breaks faith
> first. Taking a contract against a former employer costs you with them for
> the rest of the run. Grow dangerous enough and the cities form a league
> against you.
>
> **The run ends four ways:** a commission for life, the company mutinies,
> a coalition runs you down, or you retire on what you have. Winning is
> rare — it asks for both money and a reputation, and most careers end
> short of one of them.
>
> No installation, no account, no server. It runs in the browser and saves
> to your device, and it will install to a phone home screen and run with
> the network off.

**What's in it:**

- 60 seasons, 15 years, one career
- Field battles with terrain, orders and a counter triangle — not a dice roll
- Eight company doctrines, two picks, three tiers each
- A captain you build: attributes, arms, wardrobe, permanent investments
- Procedurally generated heraldry — pick a device or roll your own
- Named lieutenants, rival captains, employers with memories
- A report for every fight, including the ones you did not command
- Saves in-browser, plus copy-out/paste-in for moving a company between devices

## 3b. The same build is also the web app

One build, two shelves. `make-itch-zip.sh` packages exactly the files GitHub
Pages serves, so there is no separate web-app build to maintain.

- **https://heirsofruin.github.io/Free-Company/** — top-level page. Installs to
  a phone home screen, runs offline, keeps saves.
- **itch.io** — the same files in a frame on itch's domain. Playable, and the
  service worker still registers and takes control there (measured), so it
  caches for offline. But it is **not installable**: a browser only offers
  "Add to Home Screen" for a top-level page, and an embedded game is not one.

So itch is for being found, and the Pages copy is for being kept. Put the link
on the itch page — itch has a Links field on the edit screen:

> **Install it to your phone:** https://heirsofruin.github.io/Free-Company/ —
> same game, opens full screen, works with the network off.

## 4. Known constraints, and what the page should say

**Saves live in browser storage.** On itch the game runs in a frame on a
different domain, so a browser set to block all cookies and site data refuses
storage to it. The game now detects this, says so on the title screen, and
stays playable — but nothing is kept. Opening it fullscreen or in its own tab
fixes it. Worth one line on the page:

> Saves to your own browser. If your browser blocks site data in embedded
> frames, open the game fullscreen — or use Export from the menu to copy a
> company out as text.

**Fonts come from Google Fonts.** Everything else is self-contained. With the
network down (or the fonts blocked) the game falls back to Georgia and the
system UI face — readable, but not its own typography. Self-hosting the three
OFL faces would fix it; it is polish, not a blocker.

**The win rate is low by design.** About 9% on the default road over 250
measured careers. New players should be pointed at **Condottiere** difficulty,
which pays better and is kinder on the field.

## 5. Before going public

- [x] Title screen buttons no longer stretch to fill the screen
- [x] Blocked storage no longer blanks the page
- [x] A blank captain name no longer reads "Captain The Captain"
- [x] Opening lieutenants no longer share a trait or a surname
- [x] Service worker registration no longer throws in a sandboxed frame
- [x] Zip verified by running the game out of it
- [ ] **Play the uploaded build yourself, start to finish of at least a few
      seasons.** Stage 4 has never been played by a person.
- [ ] Cover image (630×500) and two or three screenshots
- [ ] Decide: self-host the fonts, or accept the fallback
- [ ] Decide: keep the title "The Company", or distinguish it
