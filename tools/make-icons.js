/* Generates the PWA icons in icons/ from the game's own heraldry code.
   The generator is committed, not just its output: once the working
   directory is cleared, a base64 blob can only be replaced wholesale,
   never edited.

   Run:  node tools/make-icons.js
   Needs Playwright available; see docs for the path used in CI sandboxes.
*/
const path = require("path");
const fs = require("fs");

const CHROME = process.env.CHROME_PATH
  || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PW = process.env.PLAYWRIGHT_PATH
  || "/opt/node22/lib/node_modules/playwright";
const { chromium } = require(PW);

const SEED = "hawkwood";   // the company's own arms, used as the app mark

(async () => {
  const out = path.resolve(__dirname, "..", "icons");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.route("**/*", r => r.request().url().startsWith("file://") ? r.continue() : r.abort());
  await page.goto("file://" + path.resolve(__dirname, "..", "index.html"),
    { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);

  // any: banner on the app's ground colour, small margin
  // maskable: same mark inside the 80% safe zone, full-bleed ground
  const jobs = [
    { file: "icon-192.png", size: 192, inset: 0.14 },
    { file: "icon-512.png", size: 512, inset: 0.14 },
    { file: "maskable-512.png", size: 512, inset: 0.26 }
  ];

  for (const j of jobs) {
    await page.setViewportSize({ width: j.size, height: j.size });
    await page.evaluate(({ size, inset, seed }) => {
      document.body.style.cssText = "margin:0;background:#14120F";
      document.body.innerHTML = `<div id="ic" style="width:${size}px;height:${size}px;background:#14120F;display:flex;align-items:center;justify-content:center"></div>`;
      const host = document.getElementById("ic");
      const c = document.createElement("canvas");
      const h = Math.round(size * (1 - inset * 2));
      const w = Math.round(h * (22 / 28));
      c.style.width = w + "px";
      c.style.height = h + "px";
      c.style.imageRendering = "pixelated";
      host.appendChild(c);
      drawBanner(c, seed, 8);
    }, { size: j.size, inset: j.inset, seed: SEED });
    await page.waitForTimeout(80);
    await page.locator("#ic").screenshot({ path: path.join(out, j.file) });
    console.log("wrote icons/" + j.file);
  }
  await browser.close();
})();
