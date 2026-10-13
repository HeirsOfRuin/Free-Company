/* Cover image and store screenshots, generated from the real game.

   Nothing here is mocked up: the screenshots are the shipped index.html
   driven through its own functions, and the cover's device comes out of the
   same drawBanner() the game uses, so the art on the store page cannot drift
   from the art in the game.

   Run: node tools/make-press.js
   With a local font cache (offline, or behind a proxy that blocks Google):
        FONT_CACHE=/path/with/gf.css+f/*.woff2 node tools/make-press.js

   Writes press/cover.png (630x500, itch's size) and press/shot-*.png
   (480x820 at 2x, the dimensions of the itch embed).
*/
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'press');
const FONT_CACHE = process.env.FONT_CACHE || '';

const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.webmanifest':'application/manifest+json', '.woff2':'font/woff2' };

function serve(port){
  return new Promise(res => {
    const srv = http.createServer((req, rq) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      const base = p.startsWith('/__fonts/') ? FONT_CACHE : ROOT;
      if(p.startsWith('/__fonts/')) p = p.slice('/__fonts'.length);
      const file = path.join(base, p === '/' ? '/index.html' : p);
      fs.readFile(file, (e, buf) => {
        if(e){ rq.writeHead(404); return rq.end('no'); }
        rq.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
        rq.end(buf);
      });
    }).listen(port, '127.0.0.1', () => res(srv));
  });
}

/* Use the downloaded faces when a cache is given, so a machine that cannot
   reach Google still renders in Cinzel rather than falling back to Georgia
   and shipping a screenshot of the wrong typography. */
async function useLocalFonts(page, port){
  if(!FONT_CACHE) return;
  const css = fs.readFileSync(path.join(FONT_CACHE, 'gf.css'), 'utf8')
    .replace(/url\(f\//g, `url(http://127.0.0.1:${port}/__fonts/f/`);
  await page.route('https://fonts.googleapis.com/**', r =>
    r.fulfill({ status:200, contentType:'text/css', body: css }));
}

async function newPage(br, port, w, h, dsf){
  const ctx = await br.newContext({ viewport:{width:w, height:h}, deviceScaleFactor: dsf || 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  ! pageerror:', e.message.split('\n')[0]));
  await useLocalFonts(page, port);
  return page;
}

/* One company, one seed, one banner across every image. */
const SEED = 'montone', NAME = 'Guido da Carrara';

async function start(page, port){
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil:'load' });
  await page.waitForTimeout(500);
  await page.evaluate(([seed, name]) => {
    newGame(name, BUILDS[0], Object.fromEntries(ATTRS.map(a=>[a.id,2])), seed, 'captain');
    /* Press shots want the game, not the teaching. tutorial.done kills the
       guidance band; the one-off hints are keyed off S.seen, which is a
       separate store, so a shot of the battle screen otherwise spends its
       top third explaining the counter triangle. */
    S.tutorial.done = true;
    S.seen = new Proxy({}, { get: () => true, set: () => true });
    render();
  }, [SEED, NAME]);
  await page.waitForTimeout(250);
}

(async () => {
  fs.mkdirSync(OUT, { recursive:true });
  const port = 8231;
  const srv = await serve(port);
  const br = await chromium.launch({ args:['--no-sandbox'] });
  const shot = async (page, name) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, name) });
    console.log('  wrote', name);
  };

  /* 1. The field — offers, a rival undercutting you, the account beneath. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => {
      /* Three seasons in, so the account below the offers has something in it.
         Season one leaves the bottom third of the screen empty. */
      for(let i = 0; i < 3 && !S.over && !S.battle && !S.siege && !S.campaign; i++){
        if(pendingIncident){ const c = pendingIncident.choices[0]; if(c) c.fx(S); pendingIncident = null; continue; }
        if(S.offers.length) runSeason('contract', 0); else runSeason('rest');
      }
      if(pendingIncident){ const c = pendingIncident.choices[0]; if(c) c.fx(S); pendingIncident = null; }
      closeSheet();
      S.tab = 'field'; render();
    });
    await shot(page, 'shot-1-the-season.png');
    await page.close();
  }

  /* 2. A field battle, one round in, so the log shows a decision and its cost. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => {
      S.battle = newBattle({ terrain:'defile', profile:'militia', ratio:1.15, maxRounds:6 });
      resolveRound(S.battle, 'hold');
      render();
    });
    await shot(page, 'shot-2-the-field.png');
    await page.close();
  }

  /* 3. The company — named lieutenants, and the shape you recruit toward. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => { S.tab = 'company'; S.seen.tab_company = true; render(); });
    await shot(page, 'shot-3-the-men.png');
    await page.close();
  }

  /* 4. Several seasons in. Where the run lands is wherever the company got to;
           in practice that is usually a siege, which is its own decision screen. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => {
      for(let i=0; i<6 && !S.over; i++){
        if(pendingIncident){ const c = pendingIncident.choices[0]; if(c) c.fx(S); pendingIncident = null; continue; }
        if(S.battle){ autoResolve(S.battle); endBattle(); continue; }
        if(S.campaign){ runSeason('campaign'); continue; }
        if(S.offers.length) runSeason('contract', 0); else runSeason('rest');
      }
      /* Land on a clean season boundary: an unanswered incident would cover
         the digest with its own sheet, which is a different screenshot. */
      if(pendingIncident){ const c = pendingIncident.choices[0]; if(c) c.fx(S); pendingIncident = null; }
      closeSheet();
      S.tab = 'field'; render();
    });
    await shot(page, 'shot-4-a-siege.png');
    await page.close();
  }

  /* 5. The captain: what you wear, what you bought, and your arms. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => {
      S.kit = { armour:'plate', horse:'destrier', blade:'gilt', wardrobe:'livery' };
      S.investments = ['surgeon','paymaster','herald'];
      S.tab = 'captain'; S.seen.tab_captain = true; render();
    });
    await shot(page, 'shot-5-the-captain.png');
    await page.close();
  }

  /* 6. An incident: a choice with a cost, posed in the company's own words. */
  {
    const page = await newPage(br, port, 480, 820);
    await start(page, port);
    await page.evaluate(() => {
      const def = INCIDENTS.find(i => i.id === 'feud');
      const realWhen = def.when; def.when = () => true;
      let inc = null;
      for(let i = 0; i < 400 && !inc; i++){ const c = maybeIncident(); if(c && c.id === 'feud') inc = c; }
      def.when = realWhen;
      pendingIncident = inc;
      render(); openSheet(sheetIncident);
    });
    await shot(page, 'shot-6-an-incident.png');
    await page.close();
  }

  /* The cover. The device is drawn by the game's own generator and lifted
     off the canvas, so it is the same heraldry the player sees in the HUD. */
  {
    const page = await newPage(br, port, 480, 820, 1);
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil:'load' });
    await page.waitForTimeout(400);
    const device = await page.evaluate(seed => {
      const cv = document.createElement('canvas');
      drawBanner(cv, seed, 20);
      return cv.toDataURL('image/png');
    }, SEED);
    await page.close();

    const cover = await newPage(br, port, 630, 500, 2);
    await useLocalFonts(cover, port);
    await cover.setContent(coverHTML(device), { waitUntil:'load' });
    await cover.waitForTimeout(900);
    await cover.screenshot({ path: path.join(OUT, 'cover.png') });
    console.log('  wrote cover.png');
    await cover.close();
  }

  await br.close();
  srv.close();
  console.log('\npress/ written. Cover is 630x500 at 2x; itch shows it as small as 315x250, so check it at half size before using it.');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });

function coverHTML(device){
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
  html,body{margin:0;padding:0;width:630px;height:500px;overflow:hidden}
  body{background:#14120F;color:#E8DFC9;font-family:"Inter",system-ui,sans-serif;
    display:flex;align-items:center;gap:38px;padding:0 48px;box-sizing:border-box;
    background-image:radial-gradient(120% 90% at 20% 0%,#241F19 0%,#14120F 62%)}
  .arms{flex:none;width:200px;height:254px;image-rendering:pixelated;
    border:1px solid #3A332B;box-shadow:0 14px 40px rgba(0,0,0,.6)}
  .txt{min-width:0}
  .over{font-size:13px;letter-spacing:.30em;text-transform:uppercase;color:#A99C86;
    font-weight:600;margin-bottom:14px}
  h1{font-family:"Cinzel",Georgia,serif;font-weight:700;font-size:68px;line-height:.95;
    margin:0;color:#E8DFC9;letter-spacing:.01em}
  .rule{width:92px;height:2px;background:#C9A227;margin:22px 0 18px}
  .sub{font-size:17px;line-height:1.42;color:#C6B99F;font-weight:500;margin:0}
  .sub b{color:#E8DFC9;font-weight:700}
</style></head><body>
  <img class="arms" src="${device}">
  <div class="txt">
    <div class="over">Italy &middot; 1361</div>
    <h1>The<br>Company</h1>
    <div class="rule"></div>
    <p class="sub">You have men, a banner<br>and <b>no land</b>.</p>
  </div>
</body></html>`;
}
