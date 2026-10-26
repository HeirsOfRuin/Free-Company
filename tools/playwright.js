/* One way for every tool here to get a browser. Each tool used to name a fixed
   Playwright install and a fixed Chromium build (chromium-1194), and the measure
   tools also loaded the game from /home/user/New/index.html, a folder from the
   session that wrote them. Now: PLAYWRIGHT_PATH, a local install, the global one,
   or npm root -g; Playwright finds its own browser unless CHROME_PATH is set. */
const path = require('path');

function chromium() {
  const { execSync } = require('child_process');
  const tries = [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node22/lib/node_modules/playwright'];
  try { tries.push(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch { /* no npm */ }
  for (const t of tries.filter(Boolean)) {
    try { return require(t).chromium; } catch { /* try the next */ }
  }
  throw new Error('Playwright not found: npm i -D playwright, or set PLAYWRIGHT_PATH');
}

/** Launch options: CHROME_PATH if set, else Playwright's own browser. */
const launchOptions = (extra = {}) => ({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), ...extra });

/** The game itself, wherever this repo is checked out. */
const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');

module.exports = { chromium: chromium(), launchOptions, GAME };
