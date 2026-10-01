// SKILL NOTE: copy to store/serve.js. Same-origin server: /store/* and /public/* from disk, everything else (incl. the HMR WebSocket) proxied to next dev. Also exports chromePath().
// One origin for store art and the video: static repo files under /store/ and /public/,
// everything else proxied to `next dev` (the real overlay at /store-shots/frame).
// Same origin matters: templates reach into the overlay iframe to pose, zoom and measure it.
const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const NEXT_PORT = +(process.env.NEXT_PORT || 3310);
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nextUp() {
  try {
    const res = await fetch(`http://127.0.0.1:${NEXT_PORT}/store-shots/frame`);
    return res.ok;
  } catch {
    return false;
  }
}

async function startNext() {
  if (await nextUp()) return null;
  const child = spawn("npx", ["next", "dev", "-p", String(NEXT_PORT)], { cwd: ROOT, stdio: "ignore", detached: true });
  for (let i = 0; i < 120 && !(await nextUp()); i++) await sleep(500);
  if (!(await nextUp())) throw new Error(`next dev did not start on :${NEXT_PORT}`);
  return child;
}

function staticFile(urlPath) {
  if (!urlPath.startsWith("/store/") && !urlPath.startsWith("/public/")) return null;
  const file = path.join(ROOT, decodeURIComponent(urlPath));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return null;
  return file;
}

async function start() {
  const child = await startNext();
  const server = http.createServer((req, res) => {
    const urlPath = new URL(req.url, "http://x").pathname;
    const file = staticFile(urlPath);
    if (file) {
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      return fs.createReadStream(file).pipe(res);
    }
    const upstream = http.request(
      { host: "127.0.0.1", port: NEXT_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${NEXT_PORT}` } },
      (up) => {
        res.writeHead(up.statusCode || 502, up.headers);
        up.pipe(res);
      }
    );
    upstream.on("error", () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  });
  // Pass the dev server's HMR socket through too; without it the Next client may reload the page mid-render.
  server.on("upgrade", (req, socket, head) => {
    const up = net.connect(NEXT_PORT, "127.0.0.1", () => {
      const lines = Object.entries(req.headers).map(([k, v]) => `${k}: ${k === "host" ? `127.0.0.1:${NEXT_PORT}` : v}`);
      up.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`);
      up.write(head);
      socket.pipe(up).pipe(socket);
    });
    up.on("error", () => socket.destroy());
    socket.on("error", () => up.destroy());
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  // Warm the route so the first capture doesn't wait on a compile.
  await fetch(`${base}/store-shots/frame`).catch(() => {});
  return {
    base,
    close() {
      server.close();
      if (child) {
        try {
          process.kill(-child.pid);
        } catch {
          /* already gone */
        }
      }
    },
  };
}

// Chromium for rendering: $CHROME, else the newest cached "Chrome for Testing" from Playwright.
function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = path.join(require("os").homedir(), "Library/Caches/ms-playwright");
  const dirs = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split("-")[1] - +a.split("-")[1]) : [];
  for (const d of dirs) {
    for (const arch of ["chrome-mac-arm64", "chrome-mac", "chrome-mac-x64"]) {
      const bin = path.join(cache, d, arch, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (fs.existsSync(bin)) return bin;
    }
  }
  return undefined; // let Playwright find its own
}

module.exports = { start, chromePath };

// `node store/serve.js` keeps it running for previews: open <base>/store/video/promo.html
if (require.main === module) {
  start().then(({ base }) => console.log(`serving ${base}/store/templates/screenshot.html?n=1 and ${base}/store/video/promo.html`));
}
