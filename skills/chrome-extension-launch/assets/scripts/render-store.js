// SKILL NOTE: renders every template in light + dark at 2x, downscales with sips to exact store sizes (no alpha), writes the padded 128px store icon.
// Renders the Chrome Web Store artwork into store/assets/.
// Usage: PW=<path to playwright-core> CHROME=<Chromium binary> node store/render.js
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');
const { chromium } = require(process.env.PW || 'playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'assets');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

const ART = [
  ...[1, 2, 3, 4, 5].map((n) => ({ file: `screenshot-${n}.png`, url: `store/templates/screenshot.html?n=${n}`, w: 1280, h: 800 })),
  { file: 'promo-small-440x280.png', url: 'store/templates/promo-small.html', w: 440, h: 280 },
  { file: 'marquee-1400x560.png', url: 'store/templates/marquee.html', w: 1400, h: 560 },
];
// Every piece in both themes: store/assets/light/… and store/assets/dark/…
const JOBS = ['light', 'dark'].flatMap((theme) => ART.map((a) => ({ ...a, theme, file: `${theme}/${a.file}` })));
// YouTube thumbnail for the promo video (light only).
JOBS.push({ file: 'youtube-thumbnail-1280x720.png', url: 'store/templates/thumbnail.html', w: 1280, h: 720, theme: 'light' });

const SCALE = 2;

// Downscale the 2x capture to the exact store size with macOS's high-quality resampler (keeps it opaque).
function downscale(bigFile, outFile, w, h) {
  execFileSync('sips', ['-z', String(h), String(w), bigFile, '--out', outFile], { stdio: 'ignore' });
}

(async () => {
  // Serve the repo so the templates can load the real popup in an iframe.
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
  const base = `http://localhost:${server.address().port}/`;
  for (const t of ['light', 'dark']) fs.mkdirSync(path.join(OUT, t), { recursive: true });

  const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
  for (const j of JOBS) {
    // Supersample: render at 2x, then downscale with high-quality smoothing to the exact store size.
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: SCALE, colorScheme: j.theme });
    await page.goto(base + j.url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.waitForTimeout(250);
    // The 2x master is only a stepping stone; it lives outside the repo so it can't be uploaded by mistake.
    const big = path.join(os.tmpdir(), 'distract-' + j.file.replace('/', '-').replace('.png', '@2x.png'));
    await page.screenshot({ path: big });
    downscale(big, path.join(OUT, j.file), j.w, j.h);
    console.log('wrote', j.file);
    await page.close();
  }
  // Store icon: 96px artwork centred in 128px with transparent padding.
  const icon = await browser.newPage({ viewport: { width: 128, height: 128 } });
  await icon.setContent(`<body style="margin:0;background:transparent"><img src="${base}icons/128.png" style="display:block;width:96px;height:96px;margin:16px"></body>`);
  await icon.waitForFunction(() => document.images[0].complete);
  await icon.screenshot({ path: path.join(OUT, 'store-icon-128.png'), omitBackground: true });
  console.log('wrote store-icon-128.png');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
