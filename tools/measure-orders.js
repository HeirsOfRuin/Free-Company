/* Order-dominance matrix: win/draw/loss and strength kept, for every fixed
   order policy across every terrain and enemy profile.
   This is the gate that decides whether the tactical design works — if one
   order wins everywhere, the counterplay triangle has failed.
   Run: node tools/measure-orders.js
*/
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.route('**/*', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  const errs=[]; page.on('pageerror', e=>errs.push(e.message));
  await page.goto('file://'+path.resolve('/home/user/New/index.html'), {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(200);

  const res = await page.evaluate(() => {
    newGame('M', BUILDS[0], Object.fromEntries(ATTRS.map(a=>[a.id,2])), 'x', 'captain');
    const N = 400;
    function fight(policy, terrain, profile){
      const b = newBattle({ terrain, profile, ratio:1.0, maxRounds:4 });
      const before = strength(b.us.units);
      let g=0;
      while(!b.over && g<12){ g++;
        const avail = availableOrders(b.us.units, b.terrain, b);
        const o = policy==='auto' ? autoOrder(b) : (avail.includes(policy)?policy:(avail[0]||'refuse'));
        resolveRound(b, o);
      }
      return { r:b.over, kept: strength(b.us.units)/before };
    }
    function cell(policy, terrain, profile){
      let w=0,d=0,l=0,kept=0;
      for(let i=0;i<N;i++){ const f=fight(policy,terrain,profile);
        if(f.r==='won')w++; else if(f.r==='draw')d++; else l++; kept+=f.kept; }
      return `${(100*w/N).toFixed(0)}/${(100*d/N).toFixed(0)}/${(100*l/N).toFixed(0)} ${(100*kept/N).toFixed(0)}%`;
    }
    const pol=['hold','volley','charge','refuse','auto'];
    const out={terrain:{},profile:{}};
    TERRAIN_IDS.forEach(t=>{ out.terrain[t]={}; pol.forEach(p=>out.terrain[t][p]=cell(p,t,'condottiere')); });
    Object.keys(PROFILES).forEach(pr=>{ out.profile[pr]={}; pol.forEach(p=>out.profile[pr][p]=cell(p,'open',pr)); });
    return out;
  });
  const pol=['hold','volley','charge','refuse','auto'];
  console.log('win/draw/loss % and strength kept — vs condottiere, even numbers\n');
  console.log('  terrain'.padEnd(15)+pol.map(p=>p.padStart(15)).join(''));
  for(const [t,row] of Object.entries(res.terrain))
    console.log('  '+t.padEnd(13)+pol.map(p=>String(row[p]).padStart(15)).join(''));
  console.log('\nby enemy profile (open field)\n');
  console.log('  profile'.padEnd(15)+pol.map(p=>p.padStart(15)).join(''));
  for(const [t,row] of Object.entries(res.profile))
    console.log('  '+t.padEnd(13)+pol.map(p=>String(row[p]).padStart(15)).join(''));
  console.log('\nerrors:', errs.length?errs:'none');
  await browser.close();
})();
