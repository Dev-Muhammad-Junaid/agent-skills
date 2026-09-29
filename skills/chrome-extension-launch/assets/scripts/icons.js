// SKILL NOTE: dependency-free PNG writer. Replace draw() with the new extension's icon geometry.
// Draws the Distract icon (blue tile, three pills, the middle one removed) as PNGs. No deps.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const BLUE = [36, 89, 232], LEDGE = [18, 58, 177], CREAM = [255, 253, 249];
function rrect(px, py, x, y, w, h, r) { // signed-ish coverage test for rounded rect
  const cx = Math.max(x + r, Math.min(px, x + w - r)), cy = Math.max(y + r, Math.min(py, y + h - r));
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r && px >= x && px <= x + w && py >= y && py <= y + h;
}
function draw(S) {
  const SS = 4, N = S * SS, px = new Float32Array(S * S * 4);
  const u = N / 128; // design on a 128 grid
  const shapes = (x, y) => {
    let c = null, a = 0;
    if (rrect(x, y, 4 * u, 8 * u, 120 * u, 116 * u, 28 * u)) { c = LEDGE; a = 1; }           // ledge
    if (rrect(x, y, 4 * u, 4 * u, 120 * u, 112 * u, 28 * u)) { c = BLUE; a = 1; }            // tile
    const pill = (py, w) => rrect(x, y, 26 * u, py * u, w * u, 16 * u, 8 * u);
    if (pill(26, 76)) { c = CREAM; a = 1; }
    if (pill(78, 58)) { c = CREAM; a = 1; }
    // removed middle pill: an outline only
    if (pill(52, 68) && !rrect(x, y, 30 * u, 56 * u, 60 * u, 8 * u, 4 * u)) { c = CREAM; a = 0.55; }
    return [c, a];
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let r = 0, g = 0, b = 0, al = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const [c, a0] = shapes(x * SS + sx + 0.5, y * SS + sy + 0.5);
      if (!c) continue;
      // composite cream-with-alpha over blue
      const base = a0 < 1 ? BLUE : c, a = 1;
      const col = a0 < 1 ? base.map((v, i) => v * (1 - a0) + c[i] * a0) : c;
      r += col[0]; g += col[1]; b += col[2]; al += a;
    }
    const k = (y * S + x) * 4, n = SS * SS;
    if (al) { px[k] = r / al; px[k + 1] = g / al; px[k + 2] = b / al; }
    px[k + 3] = (al / n) * 255;
  }
  return png(S, px);
}
function png(S, px) {
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) { raw[y * (S * 4 + 1)] = 0; for (let i = 0; i < S * 4; i++) raw[y * (S * 4 + 1) + 1 + i] = Math.round(px[y * S * 4 + i]); }
  const crc = (buf) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xffffffff; for (const b of buf) x = t[(x ^ b) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(S, 0); ih.writeUInt32BE(S, 4); ih[8] = 8; ih[9] = 6; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [16, 32, 48, 128]) fs.writeFileSync(path.join(__dirname, '..', 'icons', s + '.png'), draw(s));
console.log('ok');
