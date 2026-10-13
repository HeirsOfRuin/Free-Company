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
| Embed | Embed in page, **480 × 820** (measured, see below) |
| Mobile friendly | **On**, orientation **portrait** |
| Fullscreen button | **On** |
| Automatically start on page load | On |
| Classification | Game |
| Genre | Simulation (secondary: Strategy) |
| Pricing | No payments, or donations |
| Visibility | Draft until you have played the uploaded build, then Public |

**Why 480 × 820.** `.frame` is capped at `max-width:600px`, so a wider embed
only adds grey margins — the game never uses them. The sticky chrome (HUD,
stat chips, tab row) measures 237px at 390px wide and 214px at 480px and
above, because the chips and tabs stop wrapping. So 480 buys 23px of content
height over a phone-width embed and wastes nothing. Measured at five sizes,
no horizontal scroll at any of them.

| Embed size | Frame width | Fixed chrome | Content visible |
|---|---|---|---|
| 360 × 640 | 360px | 237px | 403px |
| 390 × 844 | 390px | 237px | 607px |
| **480 × 820** | **480px** | **214px** | **606px** |
| 600 × 800 | 600px | 214px | 586px |
| 800 × 820 | 600px | 214px | 606px — 200px of it wasted margin |

Below about 700px of embed height the game still works but scrolls for every
read. The fullscreen button covers anyone who wants more, and on mobile itch
sizes to the device once **Mobile friendly** is ticked.

Tags: `medieval`, `historical`, `mercenary`, `management`, `turn-based`,
`singleplayer`, `text-based`, `singleplayer`, `pwa`.

Cover image is 630×500 and is required for the game to appear in browse
listings. The banner generator can produce one — a company device on the
dark ground, title set in Cinzel.

## 3. Page copy

Everything below is checked against the shipped build: 5 employers, 8
doctrines, 6 investments, 4 orders, 5 terrains, 10 incidents, 60 seasons from
1361 to 1375, 4 endings, 3 difficulties. No claim here is aspirational.

### Title

The Company

### Short description / tagline

itch shows this under the title, in search results and when the page is
shared. Keep it under about 120 characters.

> Italy, 1361. You have men, a banner and no land. Fifteen years to make your
> name worth something.

Alternates:

- A mercenary company in Italy, 1361. The men must be paid every season,
  whether or not anyone hired you. *(103)*
- Command a free company in 1360s Italy. Contracts, plunder, loyalty, and one
  name you cannot buy back. *(101)*

### Full description

**Italy, 1361. You have men, a banner and no land.**

The cities of Italy were rich enough to buy war and unwilling to fight it
themselves. You are a captain of one of the free companies they bought it
from — Florence this season, Milan the next, whoever is paying.

Fifteen years. Sixty seasons. One name.

**The season.** Take work, ride for your own account, or rest the company.
Garrison and escort contracts are safe and pay badly. Campaigns pay well, run
two to four seasons, and put you on a field. Towns will pay you to be
somewhere else, and the country remembers that you asked.

**The men.** They are paid every season, whether or not anyone hired you. Pay
late and loyalty falls; let it fall far enough and a lieutenant takes a third
of the company and goes. Your lieutenants are named men — they die, and the
ranks hand you replacements you did not choose. You set the shape of the
company, and recruiting fills toward it.

**The field.** Choose your ground, then your orders: hold, loose, charge, or
refuse the flank. Each beats one and loses to another, and the ground changes
what each is worth — a charge that wins in the open dies in a defile. What you
may order depends on who you recruited, because a company with no archers
cannot loose a volley. Specialise in two doctrines out of eight, three steps
deep, and it begins to fight like your company rather than anyone's.

**Your name.** Five employers, each with a memory. Florence forgets nothing.
Milan breaks faith first. Sign against a former employer and pay for it with
them for the rest of the run. Being feared pays — frightened towns offer
better terms — but a captain who is both feared and without honour is a
problem the cities can solve together, and a league formed against you does
not negotiate.

**Your captain.** Four attributes, armour, a horse, a blade, and what you wear
when you are being looked at. Six permanent investments — a surgeon, a
paymaster, a herald — each worth more than another fifty men. And a coat of
arms, chosen from the gallery or rolled from a generator that will not hand
you anything a herald would refuse.

**How it ends.** Four ways: a commission for life, your own men, a coalition,
or the road home with whatever you have. Winning asks for money and a
reputation at the same time, which is why most careers end short of one of
them. If that reads as unforgiving, begin on Condottiere.

---

**Free.** No account, no ads, no analytics. It runs in your browser and saves
to your own device; the only thing it fetches from the internet is its fonts.

**It installs.** https://heirsofruin.github.io/Free-Company/ is the same game
as a web app — add it to a phone home screen and it plays with the network
off. Saves there and saves here are separate; Export in the menu copies a
company out as text if you want to move one.

### Images

`press/` holds the cover and six screenshots, all generated from the shipped
build by `node tools/make-press.js` — the screenshots are the real game driven
through its own functions, and the cover's device comes out of the same
`drawBanner()` the game uses, so the store art cannot drift from the game.

- `cover.png` — 630×500, itch's size. Check it at 315×250 before using it;
  that is how it appears in browse listings.
- `shot-1-the-season.png` — the season digest, a campaign commitment, and the
  cost of breaking a contract. **The strongest single image.**
- `shot-2-the-field.png` — a battle in a defile: ground, the enemy, the round,
  and orders annotated good or bad for that ground.
- `shot-3-the-men.png` — named lieutenants and the shape of the company.
- `shot-4-a-siege.png` — five ways to take a town, with prices.
- `shot-5-the-captain.png` — attributes, kit, investments, arms.
- `shot-6-an-incident.png` — a choice with named men and no good answer.

**Pick three:** 1, 2 and 4. The season, the field, and the siege — loop,
tactics, and consequence, without two screens that look alike. Use 3 and 6 as
the fourth and fifth if you want them.

### Optional "what's in it" block

- 60 seasons, 1361 to 1375 — one career, four ways to end it
- Field battles with ground, orders and a counter triangle, not a dice roll
- Eight company doctrines, two picks, three steps each
- A captain you build: attributes, arms, wardrobe, six permanent investments
- Procedural heraldry that obeys the rule of tincture — pick one or roll it
- Named lieutenants, rival captains, and five employers with memories
- Ten incidents that arrive when you have earned them
- A report for every fight, including the ones you did not command
- Plays in portrait on a phone, installs to a home screen, runs offline

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
- [x] Cover image (630×500) and screenshots — `press/`, built by
      `node tools/make-press.js`
- [x] Tutorial and help sheet corrected: they taught a ten-year career and an
      11,000 florin win condition, both wrong since Stage 4
- [x] Incident choice labels substitute their tokens, and the feud rewards the
      lieutenant it names (it backed the wrong man 297 times in 400)
- [ ] Decide: self-host the fonts, or accept the fallback
- [ ] Decide: keep the title "The Company", or distinguish it
