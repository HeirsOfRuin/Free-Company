// Drive the real page at phone size: node tools/smoke.mjs [dir]   (default: {{SMOKE_DIR}})
//
// What it catches that no engine test can: a page that does not parse (two
// unescaped apostrophes blanked The Company), a button that does nothing, a
// modal eating every click, a screen that renders empty, buttons 650px tall,
// a layout that breaks at 390px (Touchline was never looked at on a phone),
// raw {tokens} on screen, console errors, a save that does not survive reload.
// It also proves PROGRESS through the UI: the clock must move on every turn.
//
// ---- ADAPT THESE to the game's screens (the rest is generic) ---------------
export const START = ['[data-act="new"]'];           // clicks that begin a game
export const CLOCK = '.hud .turn';                    // element whose text is the game clock
export const TABS = {{SMOKE_TABS}};
export const TURNS = Number(process.env.TURNS || 10);

/** Take one turn the way a player would; return true if the clock moved. */
export async function advanceOnce(page) {
  const before = (await page.locator(CLOCK).textContent())?.trim();
  const btn = page.locator('[data-action]:not([disabled])').first();
  if (!(await btn.count())) return false;
  await btn.click();
  for (let g = 0; g < 4 && (await page.locator('.scrim [data-act="close"]').count()); g++) {
    await page.locator('.scrim [data-act="close"]').first().click();
  }
  if (await page.locator('[data-act="new"]').count()) return true; // the game ended: also progress
  return (await page.locator(CLOCK).textContent())?.trim() !== before;
}
// -----------------------------------------------------------------------------

import { launch, serve, checker, overflow } from './browser.mjs';
import { mkdir } from 'node:fs/promises';

if (import.meta.url === `file://${process.argv[1]}`) {
  const SHOTS = process.env.SHOTS || 'out/shots';
  await mkdir(SHOTS, { recursive: true });
  const ck = checker();
  const { check } = ck;
  const { url, close } = await serve(process.argv[2] || '{{SMOKE_DIR}}');
  const { browser, page, errors } = await launch({ phone: true });
  const flush = (step) => { const e = [...new Set(errors.splice(0))]; check(`no errors: ${step}`, !e.length, e.slice(0, 4).join(' | ')); };

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SHOTS}/0-title.png` });
  flush('load');
  check('title: no horizontal scroll', (await overflow(page)) <= 1);
  const tallest = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('button')].map((b) => b.getBoundingClientRect().height)));
  check('title: buttons are button-sized', tallest < 160, `${Math.round(tallest)}px tallest`);

  for (const sel of START) await page.click(sel, { timeout: 5000 });
  flush('start');
  let turns = 0;
  for (let i = 0; i < TURNS; i++) {
    if (!(await advanceOnce(page))) { check(`clock advanced on turn ${i + 1}`, false); break; }
    turns++;
    if (await page.locator('[data-act="new"]').count()) break;
  }
  check(`played ${turns} turns through the UI`, turns > 0);
  await page.screenshot({ path: `${SHOTS}/1-played.png` });
  flush('turns');

  for (const t of TABS) {
    if (!(await page.locator(t).count())) { check(`tab ${t} exists`, false); continue; }
    await page.click(t);
    const text = (await page.locator('#app').innerText()).trim();
    check(`tab ${t} renders`, text.length > 40, `${text.length} chars`);
    check(`tab ${t}: no horizontal scroll`, (await overflow(page)) <= 1);
    const raw = text.match(/\{[a-z_.]+\}|\bundefined\b|\bNaN\b|\[object Object\]/g);
    check(`tab ${t}: no raw tokens`, !raw, raw ? raw.slice(0, 3).join(' ') : '');
    await page.screenshot({ path: `${SHOTS}/tab-${t.replace(/\W+/g, '')}.png` });
  }
  flush('tabs');

  if (TABS[0]) await page.click(TABS[0]);
  const clock = (await page.locator(CLOCK).textContent().catch(() => ''))?.trim();
  await page.reload({ waitUntil: 'networkidle' });
  if (await page.locator('[data-act="continue"]').count()) await page.click('[data-act="continue"]');
  check('save survives a reload', (await page.locator(CLOCK).textContent().catch(() => ''))?.trim() === clock, clock);
  flush('reload');

  await browser.close();
  await close();
  console.log(`\n${ck.failures ? `${ck.failures} FAILURE(S)` : 'smoke clean'}. Screenshots in ${SHOTS}: look at them.`);
  process.exit(ck.failures ? 1 : 0);
}
