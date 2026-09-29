// SKILL NOTE: frame-by-frame capture into ffmpeg. SOCIAL=1 renders vertical 1080×1920 + landscape at 2x. Point it at your promo.html path.
// Renders store/video/promo.html to MP4: every frame is posed with seek(t) and piped into ffmpeg.
//
// Usage: PW=<playwright-core> CHROME=<Chromium binary> node store/video/render.js
//   default      → out/distract-promo.mp4 (+ -silent), 1920×1080 at 1x (the YouTube / store cut)
//   SOCIAL=1     → out/social/distract-reels-1080x1920.mp4 and out/social/distract-landscape-1920x1080.mp4
//                  captured at 2x and downscaled (lanczos), BT.709, x264 tuned for graphics
//   FORMAT=vertical|landscape SCALE=1|2 NAME=file.mp4 → one custom render
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require(process.env.PW || 'playwright-core');
const { writeSoundtrack } = require('./soundtrack');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'out');
const FPS = 30;
const SIZES = { landscape: [1920, 1080], vertical: [1080, 1920] };
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

function serve() {
  return http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
}

async function render(browser, port, { format, scale, out, silentOut }) {
  const [w, h] = SIZES[format];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale, colorScheme: 'light' });
  await page.goto(`http://localhost:${port}/store/video/promo.html?render=1&format=${format}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 60000 });
  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.round(duration * FPS);

  // 1x keeps the original encode; 2x is downscaled with lanczos and tagged BT.709 so colours hold on every platform.
  const video = silentOut || out.replace(/\.mp4$/, '-silent.mp4');
  const enc = scale === 1
    ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high']
    : ['-vf', `scale=${w}:${h}:flags=lanczos:out_color_matrix=bt709:out_range=tv`,
       '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    ...enc, '-movflags', '+faststart', video], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) process.stdout.write(`${format}@${scale}x frame ${i}/${frames}\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();

  const wav = path.join(OUT, 'soundtrack.wav');
  writeSoundtrack(wav, duration);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', scale === 1 ? '192k' : '320k',
    '-shortest', '-movflags', '+faststart', out]);
  if (!silentOut) fs.rmSync(video);
  console.log('wrote', path.relative(ROOT, out));
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'social'), { recursive: true });
  const server = serve();
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });

  const jobs = process.env.SOCIAL
    ? [
      { format: 'vertical', scale: 2, out: path.join(OUT, 'social', 'distract-reels-1080x1920.mp4') },
      { format: 'landscape', scale: 2, out: path.join(OUT, 'social', 'distract-landscape-1920x1080.mp4') },
    ]
    : process.env.FORMAT
      ? [{ format: process.env.FORMAT, scale: +(process.env.SCALE || 1), out: path.join(OUT, process.env.NAME || `distract-${process.env.FORMAT}.mp4`) }]
      : [{ format: 'landscape', scale: 1, out: path.join(OUT, 'distract-promo.mp4'), silentOut: path.join(OUT, 'distract-promo-silent.mp4') }];

  for (const job of jobs) await render(browser, port, job);
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
