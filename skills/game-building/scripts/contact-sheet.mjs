// Render many generated visuals side by side at the sizes the game really uses,
// screenshot the sheet, and LOOK at it. Run: node contact-sheet.mjs items.json out.png
//
// items.json: [{ "label": "Florence", "svg": "<svg ...>" } | { "label": "...", "src": "path/or/data-uri" }]
// Produce it from your generator in a few lines (call the same function the game
// calls: the cover's device in The Company comes out of the game's drawBanner()).
//
// Why: repeated visuals only show their problems side by side.
//  - Silk Road: 7 of 26 icons unusable, each fine on its own.
//  - The Company: of 60+ banners, a lion read as a shrub, a key as a lollipop, and
//    charges vanished into divided fields.
//  - Touchline: 5x5 charges were three screen pixels at the 18px a league table
//    draws; a shirt number vanished on a matching kit.
//  - Free Company's heraldry sat 1.4 cells left of the visible centre: correctly
//    centred on the grid, which was the wrong thing to centre on. No assertion
//    would catch it. Looking did.
// Sizes default to one large and the smallest size the UI draws. Set SIZES=56,18.

const PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright/index.js';
const pw = await import(PW);
const chromium = pw.chromium || pw.default?.chromium;
import { readFile, writeFile } from 'node:fs/promises';

const [itemsPath, out = '/tmp/contact-sheet.png'] = process.argv.slice(2);
if (!itemsPath) { console.error('usage: node contact-sheet.mjs items.json [out.png]'); process.exit(2); }
const items = JSON.parse(await readFile(itemsPath, 'utf8'));
const sizes = (process.env.SIZES || '64,18').split(',').map(Number);
const bg = process.env.BG || '#15171a';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const cell = (it) => sizes.map((px) => it.svg
  ? `<span style="width:${px}px;height:${px}px;display:inline-block">${it.svg.replace('<svg', `<svg width="${px}" height="${px}"`)}</span>`
  : `<img src="${it.src}" style="height:${px}px;image-rendering:pixelated">`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{background:${bg};color:#ddd;font:11px system-ui;margin:16px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(${Math.max(...sizes) * 1.6 + 30}px,1fr));gap:12px}
.c{text-align:center}.a{display:flex;gap:6px;justify-content:center;align-items:flex-end}
svg,img{image-rendering:pixelated}.l{margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style><div class="g">${items.map((it) => `<div class="c"><div class="a">${cell(it)}</div><div class="l">${esc(it.label ?? '')}</div></div>`).join('')}</div>`;

const htmlOut = out.replace(/\.png$/, '.html');
await writeFile(htmlOut, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`${items.length} items -> ${out} (and ${htmlOut}). Now open it and look.`);
