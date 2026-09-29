// SKILL NOTE: synthesised pad + pulse + SFX. Update the cue arrays (clicks, whooshes, pops) to match your timeline.
// A small synthesiser for the promo soundtrack: a warm pad, a soft pulse, and sound effects placed
// on the exact moments of promo.html's timeline (clicks use the extension's own hide blip).
const fs = require('fs');
const RATE = 44100;

// Beats that match promo.html
const HIDE_CLICKS = [7.9, 9.2, 10.4, 14.6, 16.05, 17.5, 18.95];
const PAUSE_CLICK = 22.5;
const WHOOSHES = [5.5, 13.1, 19.35, 23.3, 26.05];
const POPS = [1.2, 2.45, 26.3];
const CHIP_TICKS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => 3.55 + i * 0.12);

function writeSoundtrack(file, duration) {
  const n = Math.ceil(duration * RATE);
  const L = new Float32Array(n), R = new Float32Array(n);
  const add = (i, l, r = l) => { if (i >= 0 && i < n) { L[i] += l; R[i] += r; } };

  // Pad: four chords, two slightly detuned voices each, slow swell.
  const chords = [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]];
  const bar = 4;
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const ci = Math.floor(t / bar) % chords.length;
    const within = (t % bar) / bar;
    const env = Math.min(1, within * 3) * (within > 0.85 ? (1 - within) / 0.15 * 0.6 + 0.4 : 1);
    let s = 0;
    for (const f of chords[ci]) s += Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.004 * t) * 0.7;
    // gentle lowpass for warmth
    lp += 0.06 * (s - lp); lp2 += 0.06 * (lp - lp2);
    const fade = Math.min(1, t / 2) * Math.min(1, (duration - t) / 2.5);
    const v = lp2 * 0.018 * env * fade;
    add(i, v * (1 + 0.15 * Math.sin(t * 0.7)), v * (1 - 0.15 * Math.sin(t * 0.7)));
  }

  // Soft pulse at 120 bpm through the middle scenes, with an offbeat shaker.
  for (let beat = 3.1; beat < 26.0; beat += 0.5) {
    const s0 = Math.floor(beat * RATE);
    for (let k = 0; k < RATE * 0.22; k++) {
      const t = k / RATE;
      const f = 50 + 70 * Math.exp(-t * 30);
      add(s0 + k, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 16) * 0.16);
    }
    const h0 = Math.floor((beat + 0.25) * RATE);
    let prev = 0;
    for (let k = 0; k < RATE * 0.05; k++) {
      const w = Math.random() * 2 - 1, hp = w - prev; prev = w;
      add(h0 + k, hp * Math.exp(-(k / RATE) * 90) * 0.025, hp * Math.exp(-(k / RATE) * 90) * 0.03);
    }
  }

  // The extension's blip: falling note for hide, rising for show.
  const blip = (at, from, to, gain = 0.22) => {
    const s0 = Math.floor(at * RATE);
    let ph = 0;
    for (let k = 0; k < RATE * 0.16; k++) {
      const t = k / RATE;
      const f = from * Math.pow(to / from, Math.min(1, t / 0.09));
      ph += 2 * Math.PI * f / RATE;
      const e = Math.min(1, t / 0.012) * Math.exp(-t * 22);
      add(s0 + k, Math.sin(ph) * e * gain);
    }
  };
  HIDE_CLICKS.forEach((at) => blip(at, 740, 460));
  blip(PAUSE_CLICK, 520, 330, 0.2);
  POPS.forEach((at) => blip(at, 520, 820, 0.18));
  CHIP_TICKS.forEach((at, i) => blip(at, 900 + i * 60, 1100 + i * 60, 0.06));

  // Whoosh: filtered noise swelling and sweeping, panned left to right.
  WHOOSHES.forEach((at) => {
    const s0 = Math.floor((at - 0.15) * RATE), len = RATE * 0.75;
    let a = 0, b = 0;
    for (let k = 0; k < len; k++) {
      const p = k / len;
      const cut = 0.02 + 0.25 * Math.sin(Math.PI * p);
      a += cut * ((Math.random() * 2 - 1) - a); b += cut * (a - b);
      const e = Math.sin(Math.PI * p) ** 2 * 0.35;
      add(s0 + k, b * e * (1 - p), b * e * p);
    }
  });

  // Normalise to -1 dBFS and write 16-bit stereo WAV.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak ? 0.89 / peak : 1;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

module.exports = { writeSoundtrack };
