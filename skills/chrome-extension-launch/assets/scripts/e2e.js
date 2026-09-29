// SKILL NOTE: Distract's end-to-end test. Keep the structure (load unpacked extension in a throwaway profile, drive popup via ?tab=<id>, assert on the live page) and rewrite the assertions.
// End-to-end check of the packaged extension in a throwaway Chromium profile (logged-out YouTube).
// Usage: node tools/e2e.js  (needs playwright-core; CHROME env var = Chromium binary)
const path = require('path'), os = require('os'), fs = require('fs'), crypto = require('crypto');
const { chromium } = require(process.env.PW || 'playwright-core');
const EXT = path.resolve(__dirname, '..');
const id = [...crypto.createHash('sha256').update(EXT).digest('hex').slice(0, 32)].map((c) => 'abcdefghijklmnop'[parseInt(c, 16)]).join('');
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dx-'));
  const ctx = await chromium.launchPersistentContext(dir, {
    executablePath: process.env.CHROME, headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--window-size=1400,900'],
    viewport: { width: 1400, height: 860 },
  });
  const yt = await ctx.newPage();
  await yt.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
  await yt.waitForTimeout(3000);
  ok('content script injected at document_start', await yt.evaluate(() => !!document.getElementById('distract-style')));
  ok('route attribute set', (await yt.evaluate(() => document.documentElement.dataset.dxView)) === 'home');

  // Extension page: storage + messaging live in the extension origin.
  const ext = await ctx.newPage();
  await ext.goto(`chrome-extension://${id}/src/popup.html`);
  const ytTab = await ext.evaluate(async () => (await chrome.tabs.query({ url: '*://*.youtube.com/*' }))[0].id);
  const probe = await ext.evaluate((t) => new Promise((r) => chrome.tabs.sendMessage(t, { type: 'probe' }, r)), ytTab);
  ok('probe answers', probe && probe.platform === 'youtube' && probe.view === 'home', JSON.stringify(probe && probe.present));
  ok('probe sees the masthead bell / guide', probe.present['yt-guide'] === true);

  // Popup bound to the YouTube tab: click the Sidebar block.
  await ext.goto(`chrome-extension://${id}/src/popup.html?tab=${ytTab}`);
  await ext.waitForSelector('.z[data-zone="yt-guide"]');
  ok('popup shows YouTube home', (await ext.textContent('#site')) === 'YouTube' && (await ext.getAttribute('.tab[aria-selected="true"]', 'data-view')) === 'home');
  await ext.hover('.z[data-zone="yt-guide"]');
  await yt.waitForTimeout(300);
  ok('hover draws the on-page highlight', await yt.evaluate(() => !!document.querySelector('[data-distract-overlay]')));
  await ext.click('.z[data-zone="yt-guide"]');
  await yt.waitForTimeout(500);
  const guide = await yt.evaluate(() => { const g = document.querySelector('tp-yt-app-drawer#guide'); return g && getComputedStyle(g).display; });
  ok('click hides the sidebar on the page', guide === 'none', 'guide display=' + guide);
  ok('stored', JSON.stringify(await ext.evaluate(() => new Promise((r) => chrome.storage.sync.get('hidden', r)))).includes('yt-guide'));
  ok('block shows hidden state', (await ext.getAttribute('.z[data-zone="yt-guide"]', 'aria-pressed')) === 'true');

  // Peek: hovering a hidden block shows it briefly.
  await ext.mouse.move(5, 5);
  await ext.hover('.z[data-zone="yt-guide"]');
  await yt.waitForTimeout(300);
  const peek = await yt.evaluate(() => [document.documentElement.dataset.dxPeek, getComputedStyle(document.querySelector('tp-yt-app-drawer#guide')).display]);
  ok('hovering a hidden block peeks it', peek[0] === 'yt-guide' && peek[1] !== 'none', peek.join(','));
  await ext.mouse.move(5, 5);
  await yt.waitForTimeout(300);
  ok('leaving re-hides it', await yt.evaluate(() => getComputedStyle(document.querySelector('tp-yt-app-drawer#guide')).display === 'none'));

  // Pause switch shows everything; switching back re-hides.
  await ext.click('#power');
  await yt.waitForTimeout(300);
  ok('pause shows everything', await yt.evaluate(() => getComputedStyle(document.querySelector('tp-yt-app-drawer#guide')).display !== 'none'));
  await ext.click('#power');
  await yt.waitForTimeout(300);
  ok('resume hides again', await yt.evaluate(() => getComputedStyle(document.querySelector('tp-yt-app-drawer#guide')).display === 'none'));

  // Shorts: hiding them turns /shorts/ links into the normal player.
  await ext.evaluate(() => new Promise((r) => chrome.storage.sync.get('hidden', (s) => chrome.storage.sync.set({ hidden: { ...s.hidden, 'yt-shorts': true } }, r))));
  await yt.goto('https://www.youtube.com/shorts/aqz-KE-bpKQ', { waitUntil: 'domcontentloaded' });
  await yt.waitForTimeout(2500);
  ok('shorts redirect to the normal player', yt.url().includes('/watch?v=aqz-KE-bpKQ'), yt.url());
  ok('watch route set', (await yt.evaluate(() => document.documentElement.dataset.dxView)) === 'watch');

  // Show all
  await ext.goto(`chrome-extension://${id}/src/popup.html?tab=${ytTab}`);
  await ext.waitForSelector('#reset');
  await ext.click('#reset');
  ok('show all clears storage', JSON.stringify(await ext.evaluate(() => new Promise((r) => chrome.storage.sync.get('hidden', r)))) === '{"hidden":{}}');
  await ext.screenshot({ path: path.join(process.env.OUT || dir, 'popup-e2e.png') });
  await ctx.close();
})().catch((e) => { console.error(e); process.exit(1); });
