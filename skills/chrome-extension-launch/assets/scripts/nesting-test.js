// SKILL NOTE: checks every nested clickable block stays reachable while its parent is hovered. Reuse for any wireframe/overlay UI. BROWSER=webkit runs it in Safari's engine.
// Every zone block in every view must stay clickable, even while the mouse sits on a bigger block around it.
const path = require('path');
const pw = require(process.env.PW || 'playwright-core');
// BROWSER=webkit runs it in Safari's engine; the default is Chromium (CHROME = binary).
const DX = (() => { const ctx = { self: {} }; require('vm').runInNewContext(require('fs').readFileSync(path.join(__dirname, '../src/zones.js'), 'utf8'), ctx); return ctx.self.DX; })();
(async () => {
  const b = process.env.BROWSER === 'webkit'
    ? await pw.webkit.launch({ headless: true })
    : await pw.chromium.launch({ executablePath: process.env.CHROME, headless: true });
  const page = await b.newPage({ viewport: { width: 520, height: 520 } });
  let fails = 0, checks = 0;
  for (const p of Object.values(DX.platforms)) for (const v of p.views) {
    await page.goto('file://' + path.join(__dirname, `popup-test.html?p=${p.id}&v=${v.id}`));
    await page.waitForSelector('.frame');
    const blocks = await page.$$eval('.z', (els) => els.map((e) => ({ i: e.dataset.i, z: e.dataset.zone, r: e.getBoundingClientRect().toJSON() })));
    for (const outer of blocks) {
      // Hover the outer block near its top-left corner, then try to reach every block inside it.
      await page.mouse.move(outer.r.left + 3, outer.r.top + 3);
      for (const inner of blocks) {
        if (inner === outer) continue;
        const c = { x: inner.r.left + inner.r.width / 2, y: inner.r.top + inner.r.height / 2 };
        const inside = c.x > outer.r.left && c.x < outer.r.right && c.y > outer.r.top && c.y < outer.r.bottom;
        if (!inside || inner.r.width * inner.r.height >= outer.r.width * outer.r.height) continue;
        checks++;
        const hit = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); const z = e && e.closest('.z'); return z && z.dataset.i; }, c);
        if (hit !== inner.i) { fails++; console.log(`FAIL ${p.id}/${v.id}: hovering ${outer.z} hides ${inner.z}`); }
      }
    }
  }
  console.log(`${checks} nested checks, ${fails} failures`);
  await b.close();
  process.exitCode = fails ? 1 : 0;
})();
