/* Battle outcome distribution at a range of enemy scales.
   The economy was validated against a 60% battle win rate (the old scalar
   formula gave exactly that at default quality), so this is what keeps the
   enemy scaled to hold that number.
   Run: node tools/measure-battles.js
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
    newGame('C', BUILDS[0], Object.fromEntries(ATTRS.map(a=>[a.id,2])), 'x','captain');
    function trial(ratio){
      const out={won:0,draw:0,lost:0}; let kept=0;
      const N=3000;
      for(let i=0;i<N;i++){
        newGame('C', BUILDS[0], Object.fromEntries(ATTRS.map(a=>[a.id,2])), 'x','captain');
        const b=newBattle({ratio});
        const before=strength(b.us.units);
        autoResolve(b);
        out[b.over]++; kept += strength(b.us.units)/before;
      }
      return {won:+(100*out.won/N).toFixed(1), draw:+(100*out.draw/N).toFixed(1),
              lost:+(100*out.lost/N).toFixed(1), kept:+(100*kept/N).toFixed(1)};
    }
    const out={};
    [0.9,1.0,1.1,1.2,1.3,1.45].forEach(r => out['enemy x'+r] = trial(r));
    return out;
  });
  console.log('auto policy, random terrain + profile, 3000 battles per row');
  console.log('  (old scalar formula gave win 60% at default quality)\n');
  console.log('  enemy scale'.padEnd(16)+'won%'.padStart(7)+'draw%'.padStart(7)+'lost%'.padStart(7)+'kept%'.padStart(8));
  for(const [k,v] of Object.entries(res))
    console.log('  '+k.padEnd(14)+String(v.won).padStart(7)+String(v.draw).padStart(7)+String(v.lost).padStart(7)+String(v.kept).padStart(8));
  console.log('\nerrors:', errs.length?errs:'none');
  await br.close();
})();
