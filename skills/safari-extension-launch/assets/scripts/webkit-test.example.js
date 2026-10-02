// Example from Distract: the extension in Safari's engine (WebKit). The real zones.js + content.js run on
// live YouTube through a small chrome.* shim, and the popup renders in every state, light and dark.
// Covers TEST-PLAN.md layer A. Adapt: SHIM (the APIs your content script uses), youtube() (pages,
// zones and special behaviours of your extension), popup() (your states and interactions).
// Needs: npx playwright-core install webkit (one-time).
// Usage: PW=<playwright-core> node tools/webkit-test.js   (needs `playwright-core install webkit`)
// Screenshots go to $OUT (default: a temp folder).
const path = require('path'), fs = require('fs'), os = require('os');
const { webkit } = require(process.env.PW || 'playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'dx-webkit-'));
const DX = (() => { const ctx = { self: {} }; require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'src/zones.js'), 'utf8'), ctx); return ctx.self.DX; })();
let pass = 0, fail = 0;
const ok = (id, name, cond, extra = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${id.padEnd(8)} ${name}${extra ? '  — ' + extra : ''}`);
};

// A stand-in for the extension APIs the content script uses. State lives in localStorage so it
// survives reloads, like chrome.storage does.
const SHIM = `(() => {
  const KEY = '__dxStore';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const changed = [], messages = [], connects = [];
  window.__dx = { changed, messages, connects, requests: [] };
  window.chrome = {
    runtime: { lastError: null, onMessage: { addListener: (f) => messages.push(f) }, onConnect: { addListener: (f) => connects.push(f) } },
    storage: {
      sync: {
        get: (keys, cb) => setTimeout(() => cb(read()), 0),
        set: (obj, cb) => {
          const before = read(), after = Object.assign({}, before, obj);
          localStorage.setItem(KEY, JSON.stringify(after));
          const ch = {}; for (const k in obj) ch[k] = { oldValue: before[k], newValue: obj[k] };
          changed.forEach((f) => f(ch, 'sync')); cb && cb();
        },
      },
      onChanged: { addListener: (f) => changed.push(f) },
    },
  };
  window.__dx.set = (obj) => new Promise((r) => chrome.storage.sync.set(obj, r));
  window.__dx.probe = () => new Promise((r) => messages[0]({ type: 'probe' }, {}, r));
  window.__dx.send = (msg) => messages[0](msg, {}, () => {});
  window.__dx.port = () => {
    const ls = [], ds = [];
    const port = { name: 'distract-popup', onMessage: { addListener: (f) => ls.push(f) }, onDisconnect: { addListener: (f) => ds.push(f) } };
    connects.forEach((f) => f(port));
    return { send: (m) => ls.forEach((f) => f(m)), close: () => ds.forEach((f) => f()) };
  };
})();`;

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Is every element of a zone gone (display:none on it or an ancestor)?
const zoneState = (zone) => {
  const sels = window.__zones[zone];
  const els = sels.flatMap((s) => { try { return [...document.querySelectorAll(s)]; } catch (e) { return []; } });
  const shown = els.filter((e) => e.checkVisibility ? e.checkVisibility() : e.getClientRects().length > 0);
  return { count: els.length, shown: shown.length };
};

async function youtube(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'en-US' });
  await ctx.addInitScript(SHIM);
  await ctx.addInitScript(src('src/zones.js'));
  await ctx.addInitScript(`window.__zones = ${JSON.stringify(Object.fromEntries(Object.entries(DX.platforms.youtube.zones).map(([id, z]) => [id, [...(z.css || []), `[data-dx~="${id}"]`]])))};`);
  await ctx.addInitScript(src('src/content.js'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => { if (/distract|DX\b|__dx/i.test(e.stack || e.message)) errors.push(e.message); });
  page.on('request', (r) => { /* the extension itself never fetches; page requests are YouTube's own */ });

  // Consent wall (EU) can block the page; YouTube shows it on consent.youtube.com.
  await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
  ok('PER-01', 'stylesheet injected before the page renders', await page.evaluate(() => !!document.getElementById('distract-style')));
  await page.waitForTimeout(4000);
  ok('PER-05', 'route attribute on home', (await page.evaluate(() => document.documentElement.dataset.dxView)) === 'home');

  const probe = await page.evaluate(() => window.__dx.probe());
  ok('POP-01', 'probe answers with platform and view', probe && probe.platform === 'youtube' && probe.view === 'home', JSON.stringify(probe && probe.present));

  // Each zone that exists on the page: hide it alone → gone, landmarks stay; show it → back.
  async function sweep(viewName) {
    const { present, view } = await page.evaluate(() => window.__dx.probe());
    for (const [zone, z] of Object.entries(DX.platforms.youtube.zones)) {
      if (!present[zone]) continue;
      if (z.views && !z.views.includes(view)) continue; // this section is only hidden on some pages by design
      const before = await page.evaluate(zoneState, zone);
      if (!before.shown) continue; // in the DOM but not on screen (e.g. end cards before the video ends)
      await page.evaluate((zn) => window.__dx.set({ hidden: { [zn]: true } }), zone);
      await page.waitForTimeout(150);
      const after = await page.evaluate(zoneState, zone);
      const masthead = await page.evaluate(() => { const m = document.querySelector('ytd-masthead'); return !!m && m.checkVisibility(); });
      await page.evaluate(() => window.__dx.set({ hidden: {} }));
      await page.waitForTimeout(150);
      const back = await page.evaluate(zoneState, zone);
      const id = 'YT-' + String(Object.keys(DX.platforms.youtube.zones).indexOf(zone) + 1).padStart(2, '0');
      ok(id, `${viewName}: ${z.label} hides and comes back`, after.shown === 0 && masthead && back.shown >= before.shown,
        `shown ${before.shown} → ${after.shown} → ${back.shown}${masthead ? '' : ', masthead hidden!'}`);
    }
  }
  await sweep('home');

  // Peek and highlight through the popup port.
  await page.evaluate(() => window.__dx.set({ hidden: { 'yt-guide': true } }));
  await page.waitForTimeout(150);
  await page.evaluate(() => { window.__p = window.__dx.port(); window.__p.send({ type: 'hover', zone: 'yt-guide' }); });
  await page.waitForTimeout(250);
  const peek = await page.evaluate(() => [document.documentElement.dataset.dxPeek, document.querySelector('tp-yt-app-drawer#guide').checkVisibility(), !!document.querySelector('[data-distract-overlay]')]);
  ok('POP-05', 'hovering a hidden block peeks it with an outline', peek[0] === 'yt-guide' && peek[1] && peek[2], peek.join(','));
  await page.evaluate(() => window.__p.send({ type: 'leave' }));
  await page.waitForTimeout(200);
  ok('POP-05', 'leaving hides it again and removes the outline', await page.evaluate(() => !document.querySelector('tp-yt-app-drawer#guide').checkVisibility() && !document.querySelector('[data-distract-overlay]')));
  await page.evaluate(() => window.__p.send({ type: 'hover', zone: 'yt-feed' }));
  await page.waitForTimeout(250);
  ok('POP-04', 'hovering a shown block outlines it without peeking', await page.evaluate(() => !document.documentElement.dataset.dxPeek && !!document.querySelector('[data-distract-overlay]')));
  await page.evaluate(() => window.__p.close());
  await page.waitForTimeout(150);
  ok('POP-04', 'closing the popup clears the outline', await page.evaluate(() => !document.querySelector('[data-distract-overlay]')));
  // Hover over one-off messages (what the popup sends), and the outline clears itself when beats stop.
  await page.evaluate(() => window.__dx.send({ type: 'hover', zone: 'yt-feed' }));
  await page.waitForTimeout(300);
  ok('POP-04', 'hover by message draws the outline', await page.evaluate(() => !!document.querySelector('[data-distract-overlay]')));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__dx.send({ type: 'hover', zone: 'yt-feed' }));
  await page.waitForTimeout(1500);
  ok('POP-04', 'a heartbeat keeps it (3 s with beats)', await page.evaluate(() => !!document.querySelector('[data-distract-overlay]')));
  await page.waitForTimeout(2000);
  ok('POP-04', 'no beats for 2.5 s: outline clears itself', await page.evaluate(() => !document.querySelector('[data-distract-overlay]')));

  // Pause / resume.
  await page.evaluate(() => window.__dx.set({ paused: { youtube: true } }));
  await page.waitForTimeout(150);
  ok('POP-11', 'pause shows hidden sections', await page.evaluate(() => document.querySelector('tp-yt-app-drawer#guide').checkVisibility()));
  await page.evaluate(() => window.__dx.set({ paused: {} }));
  await page.waitForTimeout(150);
  ok('POP-11', 'resume hides them again', await page.evaluate(() => !document.querySelector('tp-yt-app-drawer#guide').checkVisibility()));

  // Reload keeps the choice, with no frame where the sidebar shows.
  await page.reload({ waitUntil: 'commit' });
  const early = await page.waitForFunction(() => {
    const g = document.querySelector('tp-yt-app-drawer#guide');
    return g ? { visible: g.checkVisibility() } : false;
  }, null, { polling: 'raf', timeout: 15000 }).then((h) => h.jsonValue()).catch(() => null);
  ok('PER-01', 'after reload the sidebar never paints', early && early.visible === false, JSON.stringify(early));

  // Watch page: Up next, comments, centring.
  await page.evaluate(() => window.__dx.set({ hidden: {} }));
  await page.goto('https://www.youtube.com/watch?v=aqz-KE-bpKQ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  ok('PER-05', 'route attribute on watch', (await page.evaluate(() => document.documentElement.dataset.dxView)) === 'watch');
  await sweep('watch');
  await page.evaluate(() => window.__dx.set({ hidden: { 'yt-related': true } }));
  await page.waitForTimeout(300);
  const centre = await page.evaluate(() => {
    const p = document.querySelector('#primary').getBoundingClientRect();
    return Math.abs((p.left + p.right) / 2 - innerWidth / 2);
  });
  ok('YT-08', 'hiding Up next centres the player', centre < 40, `off-centre by ${Math.round(centre)}px`);
  await page.screenshot({ path: path.join(OUT, 'yt-watch-upnext-hidden.png') });

  // Shorts redirect.
  await page.evaluate(() => window.__dx.set({ hidden: { 'yt-shorts': true } }));
  await page.goto('https://www.youtube.com/shorts/aqz-KE-bpKQ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  ok('YT-04', '/shorts/ID opens in the normal player', page.url().includes('/watch?v=aqz-KE-bpKQ'), page.url());

  // Home feed message.
  await page.evaluate(() => window.__dx.set({ hidden: { 'yt-feed': true } }));
  await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, 'yt-home-feed-hidden.png') });

  // Search results page (the "other pages" view): Shorts in results.
  await page.evaluate(() => window.__dx.set({ hidden: {} }));
  await page.goto('https://www.youtube.com/results?search_query=big+buck+bunny', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await sweep('search');

  ok('SAFE-02', 'no Distract errors on YouTube', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

async function unsupported(browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(SHIM);
  await ctx.addInitScript(src('src/zones.js'));
  await ctx.addInitScript(src('src/content.js'));
  const page = await ctx.newPage();
  await page.goto('https://example.com/', { waitUntil: 'load' });
  ok('SAFE-01', 'unsupported site untouched', await page.evaluate(() => !document.getElementById('distract-style') && !document.querySelector('[data-dx]') && !document.documentElement.dataset.dxView));
  await ctx.close();
}

async function popup(browser) {
  const states = [
    ...Object.values(DX.platforms).flatMap((p) => p.views.map((v) => ({ q: `p=${p.id}&v=${v.id}`, name: `${p.id}/${v.id}` }))),
    { q: 'p=youtube&v=home&hide=yt-shorts,yt-feed&absent=yt-chat', name: 'youtube/home hidden+absent' },
    { q: 'p=none', name: 'off-site' },
    { q: 'p=reload', name: 'reload' },
    { q: 'p=access', name: 'access' },
  ];
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 520, height: 700 }, colorScheme: scheme, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const s of states) {
      await page.goto('file://' + path.join(ROOT, `tools/popup-test.html?${s.q}`));
      await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
      const m = await page.evaluate(() => {
        const b = document.body;
        const overflowX = [...document.querySelectorAll('#app *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0 && !e.closest('.frame')).length;
        const clippedLabels = [...document.querySelectorAll('.z .lbl, .z span')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim()).slice(0, 5);
        return { w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), overflowX, clippedLabels, bg: getComputedStyle(b).backgroundColor };
      });
      ok('POP-14', `${scheme} ${s.name}: fits (${m.w}×${m.h})`, m.w <= 460 && m.h <= 600 && m.overflowX === 0, m.clippedLabels.length ? 'tight labels: ' + m.clippedLabels.join(', ') : '');
      await page.screenshot({ path: path.join(OUT, `popup-${scheme}-${s.name.replace(/[\/ +]/g, '_')}.png`), fullPage: true });
    }
    // Interactions on YouTube home.
    await page.goto('file://' + path.join(ROOT, 'tools/popup-test.html?p=youtube&v=home'));
    await page.waitForSelector('.z[data-zone="yt-shorts"]');
    await page.click('.z[data-zone="yt-shorts"]');
    ok('POP-06', `${scheme}: click hides (pressed + saved)`, (await page.getAttribute('.z[data-zone="yt-shorts"]', 'aria-pressed')) === 'true'
      && (await page.evaluate(() => __log.some((l) => l[0] === 'set' && l[1].includes('yt-shorts')))));
    await page.click('.z[data-zone="yt-shorts"]');
    ok('POP-07', `${scheme}: click again shows`, (await page.getAttribute('.z[data-zone="yt-shorts"]', 'aria-pressed')) !== 'true');
    await page.focus('.z[data-zone="yt-feed"]');
    await page.keyboard.press('Enter');
    ok('POP-12', `${scheme}: Enter on a focused block toggles it`, (await page.getAttribute('.z[data-zone="yt-feed"]', 'aria-pressed')) === 'true');
    ok('POP-10', `${scheme}: footer counts it`, /1 hidden on YouTube/.test(await page.textContent('#app')));
    await page.click('#reset');
    ok('POP-10', `${scheme}: show all clears`, (await page.getAttribute('.z[data-zone="yt-feed"]', 'aria-pressed')) !== 'true');
    const watchTab = await page.$('.tab[data-view="watch"]');
    await watchTab.click();
    ok('POP-03', `${scheme}: switching to the watch tab draws its layout`, !!(await page.$('.z[data-zone="yt-related"]')));
    await page.click('#power');
    ok('POP-11', `${scheme}: power switch pauses`, await page.evaluate(() => __log.some((l) => l[0] === 'set' && l[1].includes('"paused":{"youtube":true}'))));
    // Access screen → grant.
    await page.goto('file://' + path.join(ROOT, 'tools/popup-test.html?p=access'));
    await page.waitForSelector('#grant');
    await page.click('#grant');
    await page.waitForTimeout(200);
    ok('ACC-02', `${scheme}: Allow requests every site and moves on`, await page.evaluate(() => __log.some((l) => l[0] === 'request')) && !(await page.$('#grant')));
    ok('SAFE-02', `${scheme}: no popup errors`, errors.length === 0, errors.join(' | '));
    await page.close();
  }
}

(async () => {
  const browser = await webkit.launch({ headless: true });
  await unsupported(browser);
  await popup(browser);
  await youtube(browser).catch((e) => ok('YT', 'YouTube run finished', false, e.message));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed · screenshots: ${OUT}`);
  if (fail) process.exitCode = 1;
})();
