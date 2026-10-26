// Render the app icons from one SVG: node tools/make-icons.mjs [icon.svg] [out-dir]
//
// The SVG is the source and is committed; the PNGs are output (eight repos
// rewrote this tool, and one committed PNGs with no source at all). Produces
// the sizes a phone install needs, including a MASKABLE icon: Android crops
// maskable icons to a circle or squircle, so the art is shrunk into the
// central safe zone (80%) on the background colour. Without a maskable icon
// Android shows the icon small on a white plate.

import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { launch } from './browser.mjs';

const SRC = process.argv[2] || '{{ICON_SRC}}';
const OUT = process.argv[3] || '{{ICON_OUT}}';
const BG = '{{BG_ICON}}';
const svg = await readFile(SRC, 'utf8');
await mkdir(OUT, { recursive: true });

const { browser, page } = await launch({ phone: false });
async function render(size, file, { maskable = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const inner = maskable ? Math.round(size * 0.8) : size;
  const pad = (size - inner) / 2;
  await page.setContent(`<html><body style="margin:0;background:${BG}">
    <div style="position:absolute;left:${pad}px;top:${pad}px;width:${inner}px;height:${inner}px">
      ${svg.replace('<svg', `<svg width="${inner}" height="${inner}" style="display:block"`)}
    </div></body></html>`);
  await page.screenshot({ path: join(OUT, file), omitBackground: false });
  console.log(`${join(OUT, file)}  ${size}px${maskable ? ' maskable' : ''}`);
}
await render(180, 'icon-180.png');
await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'maskable-512.png', { maskable: true });
await browser.close();
console.log(`Look at ${join(OUT, 'maskable-512.png')} cropped to a circle before shipping.`);
