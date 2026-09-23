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
      const b = newBattle({ terrain, profile, ratio:1.0, maxRounds:6 });
      const before = strength(b.us.units);
      let g=0;
      while(!b.over && g<12){ g++;
        const avail = availableOrders(b.us.units, b.terrain, b, battleDoctrine());
        if(policy !== 'auto' && !avail.includes(policy)){
          if(b.log.length === 0) return { r:'n/a', kept:1 };
          resolveRound(b, 'refuse'); continue;
        }
        const o = policy==='auto' ? autoOrder(b) : policy;
        resolveRound(b, o);
      }
      return { r:b.over, kept: strength(b.us.units)/before };
    }
    function cell(policy, terrain, profile){
      let w=0,d=0,l=0,kept=0,na=0;
      for(let i=0;i<N;i++){ const f=fight(policy,terrain,profile);
        if(f.r==='n/a'){ na++; continue; }
        if(f.r==='won')w++; else if(f.r==='draw')d++; else l++; kept+=f.kept; }
      if(na > N*0.5) return 'n/a';
      const n = N - na;
      return `${(100*w/n).toFixed(0)}/${(100*d/n).toFixed(0)}/${(100*l/n).toFixed(0)} ${(100*kept/n).toFixed(0)}%`;
    }
    const pol=['hold','volley','charge','refuse','auto'];
    const out={terrain:{},profile:{},doctrine:{}};
    TERRAIN_IDS.forEach(t=>{ out.terrain[t]={}; pol.forEach(p=>out.terrain[t][p]=cell(p,t,'condottiere')); });
    Object.keys(PROFILES).forEach(pr=>{ out.profile[pr]={}; pol.forEach(p=>out.profile[pr][p]=cell(p,'open',pr)); });

    /* THE GATE for doctrine: a maxed war doctrine must make you better at
       ITS order, not better at everything. If a company with The Volley at
       three wins everywhere with everything, the counterplay triangle is
       dead and the multipliers come down. */
    ['none','volley','hold','charge'].forEach(doc=>{
      out.doctrine[doc]={};
      TERRAIN_IDS.forEach(t=>{
        const row={};
        pol.forEach(p=>{
          const saved = JSON.stringify(S.doctrine);
          S.doctrine = doc==='none' ? {picked:[],tier:{}} : {picked:[doc],tier:{[doc]:3}};
          row[p]=cell(p,t,'condottiere');
          S.doctrine = JSON.parse(saved);
        });
        out.doctrine[doc][t]=row;
      });
      // and against each enemy profile on open ground, since a doctrine that
      // looks dominant against one opponent may be useless against another
      out.doctrine[doc].__profiles = {};
      Object.keys(PROFILES).forEach(pr=>{
        const row={};
        pol.forEach(p=>{
          const saved = JSON.stringify(S.doctrine);
          S.doctrine = doc==='none' ? {picked:[],tier:{}} : {picked:[doc],tier:{[doc]:3}};
          row[p]=cell(p,'open',pr);
          S.doctrine = JSON.parse(saved);
        });
        out.doctrine[doc].__profiles[pr]=row;
      });
    });
    return out;
  });
  const pol=['hold','volley','charge','refuse','auto'];
  console.log('\nDOCTRINE GATE — win% only, vs condottiere. A maxed doctrine must lift');
  console.log('its OWN order, not all of them.\n');
  for(const [doc,rows] of Object.entries(res.doctrine)){
    console.log('  doctrine: '+doc);
    console.log('    terrain'.padEnd(16)+pol.map(p=>p.padStart(9)).join(''));
    for(const [t,row] of Object.entries(rows)){
      if(t === '__profiles') continue;
      console.log('    '+t.padEnd(14)+pol.map(p=>{
        const v=String(row[p]); return v==='n/a' ? 'n/a' : v.split(' ')[0].split('/')[0]+'%';
      }).map(x=>x.padStart(9)).join(''));
    }
    if(rows.__profiles) for(const [pr,row] of Object.entries(rows.__profiles))
      console.log('    vs '+pr.padEnd(11)+pol.map(p=>{
        const v=String(row[p]); return v==='n/a' ? 'n/a' : v.split(' ')[0].split('/')[0]+'%';
      }).map(x=>x.padStart(9)).join(''));
  }
  console.log('\nwin/draw/loss % and strength kept — vs condottiere, even numbers\n');
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
