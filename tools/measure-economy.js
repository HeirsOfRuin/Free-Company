/* Full 40-season runs through the shipped game functions, by policy.
   Guards the balance band Stage 1 established: mixed best-rate ~9-11% win,
   loyal-to-Florence above it, loyal-to-Pisa below it, and a large gap
   between investing and not.
   Run: node tools/measure-economy.js
*/
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await br.newPage();
  await page.route('**/*', r => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  const errs=[]; page.on('pageerror', e=>errs.push(e.message));
  await page.goto('file://'+path.resolve('/home/user/New/index.html'), {waitUntil:'domcontentloaded'});
  await page.waitForTimeout(200);

  const res = await page.evaluate(() => {
    // Drive a whole run headlessly through the real shipped functions.
    function run(policy, preferred, invest){
      newGame('T', BUILDS[0], Object.fromEntries(ATTRS.map(a=>[a.id,2])), 'x', 'captain');
      let g = 0, battles = 0;
      while(!S.over && g < 320){
        g++;
        if(pendingIncident){ const c = pendingIncident.choices.find(c=>!c.cost||S.treasury>=c.cost);
          if(c) c.fx(S); pendingIncident=null; continue; }
        if(S.battle){ battles++; autoResolve(S.battle); endBattle(); continue; }
        if(S.siege){
          const opts = Object.keys(SIEGE_OPTS).filter(id => siegeAvailable(id, S.siege) && id!=='abandon');
          siegeAction(opts.includes('assault') ? 'assault' : (opts.includes('starve') ? 'starve' : opts[0]));
          continue;
        }
        if(invest){
          const o = INVESTMENTS.filter(i=>!has(i.id) && S.treasury-2500>=i.cost).sort((a,b)=>a.cost-b.cost);
          if(o.length){ coin(-o[0].cost,o[0].name); S.investments.push(o[0].id); }
        }
        if(S.campaign){ runSeason('campaign'); continue; }
        if((S.turn % CONFIG.seasonsPerYear) === WINTER_IDX){ runSeason('rest'); continue; }
        if(!S.offers.length){ runSeason('rest'); continue; }
        let pool = S.offers.map((o,i)=>({o,i}));
        if(policy === 'shortOnly') pool = pool.filter(x=>x.o.kind==='short');
        if(policy === 'campaignOnly') pool = pool.filter(x=>x.o.kind==='campaign');
        if(preferred){ const pf = pool.filter(x=>x.o.faction===preferred); if(pf.length) pool = pf; }
        if(!pool.length){ runSeason('rest'); continue; }
        let best = pool[0];
        pool.forEach(x=>{ if(x.o.payPerLance > best.o.payPerLance) best = x; });
        runSeason('contract', best.i);
      }
      return { r: S.over ? S.over.result : 'timeout', battles, seasons: S.stat.seasons };
    }
    function tally(policy, preferred, invest, n){
      const c={}; let bat=0, sea=0;
      for(let i=0;i<n;i++){ const f=run(policy,preferred,invest); c[f.r]=(c[f.r]||0)+1; bat+=f.battles; sea+=f.seasons; }
      const pc=k=>+(100*(c[k]||0)/n).toFixed(1);
      return { win:pc('won'), mutiny:pc('mutiny'), coalition:pc('coalition'),
               retired:pc('retired'), battles:+(bat/n).toFixed(1), seasons:+(sea/n).toFixed(0) };
    }
    return {
      'mixed (best rate)':  tally('any', null, true, 250),
      'short only':         tally('shortOnly', null, true, 250),
      'campaign only':      tally('campaignOnly', null, true, 250),
      'loyal Florence':     tally('any', 'florence', true, 250),
      'loyal Pisa':         tally('any', 'pisa', true, 250),
      'mixed, no invest':   tally('any', null, false, 250)
    };
  });
  console.log('FULL-CAREER RUNS through the shipped code, 250 each\n');
  console.log('  policy'.padEnd(22)+'win%'.padStart(6)+'mutiny%'.padStart(9)+'coal%'.padStart(7)+'retire%'.padStart(9)+'battles'.padStart(9));
  for(const [k,v] of Object.entries(res))
    console.log('  '+k.padEnd(20)+String(v.win).padStart(6)+String(v.mutiny).padStart(9)+String(v.coalition).padStart(7)+String(v.retired).padStart(9)+String(v.battles).padStart(9));
  console.log('\nStage 1 band to preserve: best-rate 9-11% win / ~10% mutiny; Florence ~11.5%; Pisa ~3%; no-invest ~1%');
  console.log('errors:', errs.length?errs:'none');
  await br.close();
})();
