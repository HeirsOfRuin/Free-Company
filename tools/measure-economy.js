/* Full-career runs through the shipped game functions, by policy.
   Guards the balance band Stage 1 established: mixed best-rate ~9-11% win,
   loyal-to-Florence above it, loyal-to-Pisa below it, and a large gap
   between investing and not.
   Run: node tools/measure-economy.js

   Runs in CHUNKS. A single page.evaluate() holding every career stalled at
   ~1,500 runs with a live renderer and zero CPU — thirty minutes, no output,
   nothing to recover, because the whole measurement was one call. Chunking
   gives progress you can watch, partial results if it dies, and a stall you
   can locate.
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

  // Install the driver in the page once; call it a chunk at a time from here.
  await page.evaluate(() => {
    window.__run = function(policy, preferred, invest){
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
        if(policy === 'campaignOnly'){ const c = pool.filter(x=>x.o.kind==='campaign'); if(c.length) pool = c; }
        if(preferred){ const p = pool.filter(x=>x.o.faction===preferred); if(p.length) pool = p; }
        if(!pool.length){ runSeason('rest'); continue; }
        let best = pool[0];
        pool.forEach(x=>{ if(x.o.payPerLance > best.o.payPerLance) best = x; });
        runSeason('contract', best.i);
      }
      return { r: S.over ? S.over.result : 'timeout', battles, seasons: S.stat.seasons };
    };
    window.__chunk = function(policy, preferred, invest, n){
      const c = {}; let bat = 0, sea = 0;
      for(let i=0;i<n;i++){ const f = window.__run(policy,preferred,invest);
        c[f.r]=(c[f.r]||0)+1; bat+=f.battles; sea+=f.seasons; }
      return { c, bat, sea };
    };
  });

  const POLICIES = [
    ['mixed (best rate)', 'any', null, true],
    ['short only',        'shortOnly', null, true],
    ['campaign only',     'campaignOnly', null, true],
    ['loyal Florence',    'any', 'florence', true],
    ['loyal Pisa',        'any', 'pisa', true],
    ['mixed, no invest',  'any', null, false]
  ];
  const N = Number(process.env.RUNS || 250), CHUNK = 25;

  const res = {};
  for(const [label, policy, preferred, invest] of POLICIES){
    const acc = {}; let bat = 0, sea = 0, done = 0;
    while(done < N){
      const take = Math.min(CHUNK, N - done);
      const r = await page.evaluate(
        ([p, pr, inv, n]) => window.__chunk(p, pr, inv, n),
        [policy, preferred, invest, take]);
      for(const k in r.c) acc[k] = (acc[k]||0) + r.c[k];
      bat += r.bat; sea += r.sea; done += take;
      process.stdout.write(`\r  ${label.padEnd(20)} ${done}/${N}   `);
    }
    const pc = k => +(100*(acc[k]||0)/N).toFixed(1);
    res[label] = { win:pc('won'), mutiny:pc('mutiny'), coalition:pc('coalition'),
                   retired:pc('retired'), battles:+(bat/N).toFixed(1), seasons:+(sea/N).toFixed(0) };
    process.stdout.write(`\r  ${label.padEnd(20)} ${N}/${N}  win ${res[label].win}%\n`);
  }

  console.log(`\nFULL-CAREER RUNS through the shipped code, ${N} each\n`);
  console.log('  policy'.padEnd(22)+'win%'.padStart(6)+'mutiny%'.padStart(9)+'coal%'.padStart(7)+'retire%'.padStart(9)+'battles'.padStart(9));
  for(const [k,v] of Object.entries(res))
    console.log('  '+k.padEnd(20)+String(v.win).padStart(6)+String(v.mutiny).padStart(9)+String(v.coalition).padStart(7)+String(v.retired).padStart(9)+String(v.battles).padStart(9));
  console.log('\nStage 4 band to preserve: best-rate 9-11% win; Florence near it; Pisa ~1%; no-invest ~0%');
  console.log('errors:', errs.length?errs:'none');
  await br.close();
})();
