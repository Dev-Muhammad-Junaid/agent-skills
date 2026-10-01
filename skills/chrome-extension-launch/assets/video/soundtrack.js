// SKILL NOTE: synthesised pad + pulse + SFX. promo.html publishes its beats as window.CUES and render-video.js passes
// them in, so the audio follows the timeline without a second copy of the numbers. Every cue list is optional:
//   clicks [s] (clickTone 'down' = hide blip, 'up' = switch/show), pause, enter, keys, types, pops, ticks, access, whooshes.
// A small synthesiser for the promo soundtrack: a warm pad, a soft pulse, and sound effects on the exact beats.
const fs = require("fs");
const RATE = 44100;

function writeSoundtrack(file, duration, cues) {
  const n = Math.ceil(duration * RATE);
  const L = new Float32Array(n), R = new Float32Array(n);
  const add = (i, l, r = l) => { if (i >= 0 && i < n) { L[i] += l; R[i] += r; } };

  // Pad: four chords, two slightly detuned voices each, slow swell. Cooler voicing than Distract's (A minor → F → C → G).
  const chords = [[220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23], [196.0, 261.63, 329.63, 392.0], [196.0, 246.94, 293.66, 392.0]];
  const bar = 4;
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const ci = Math.floor(t / bar) % chords.length;
    const within = (t % bar) / bar;
    const env = Math.min(1, within * 3) * (within > 0.85 ? (1 - within) / 0.15 * 0.6 + 0.4 : 1);
    let s = 0;
    for (const f of chords[ci]) s += Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.004 * t) * 0.7;
    lp += 0.06 * (s - lp); lp2 += 0.06 * (lp - lp2);
    const fade = Math.min(1, t / 2) * Math.min(1, (duration - t) / 2.5);
    const v = lp2 * 0.026 * env * fade;
    add(i, v * (1 + 0.15 * Math.sin(t * 0.7)), v * (1 - 0.15 * Math.sin(t * 0.7)));
  }

  // Soft pulse at 120 bpm through the middle scenes, with an offbeat shaker.
  for (let beat = 3.1; beat < 26.0; beat += 0.5) {
    const s0 = Math.floor(beat * RATE);
    for (let k = 0; k < RATE * 0.22; k++) {
      const t = k / RATE;
      const f = 50 + 70 * Math.exp(-t * 30);
      add(s0 + k, Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 16) * 0.2);
    }
    const h0 = Math.floor((beat + 0.25) * RATE);
    let prev = 0;
    for (let k = 0; k < RATE * 0.05; k++) {
      const w = Math.random() * 2 - 1, hp = w - prev; prev = w;
      add(h0 + k, hp * Math.exp(-(k / RATE) * 90) * 0.025, hp * Math.exp(-(k / RATE) * 90) * 0.03);
    }
  }

  // A sine blip gliding from one note to another (rising = switch / show).
  const blip = (at, from, to, gain = 0.22, len = 0.16) => {
    const s0 = Math.floor(at * RATE);
    let ph = 0;
    for (let k = 0; k < RATE * len; k++) {
      const t = k / RATE;
      const f = from * Math.pow(to / from, Math.min(1, t / 0.09));
      ph += 2 * Math.PI * f / RATE;
      add(s0 + k, Math.sin(ph) * Math.min(1, t / 0.012) * Math.exp(-t * 22) * gain);
    }
  };
  // A key: a short, bright filtered click.
  const key = (at, gain = 0.12) => {
    const s0 = Math.floor(at * RATE);
    let a = 0, prev = 0;
    for (let k = 0; k < RATE * 0.03; k++) {
      const w = Math.random() * 2 - 1;
      a += 0.5 * (w - a);
      const hp = a - prev; prev = a;
      add(s0 + k, hp * Math.exp(-(k / RATE) * 160) * gain);
    }
    blip(at, 1800, 1500, gain * 0.25, 0.04);
  };

  const C = { clicks: [], keys: [], types: [], pops: [], ticks: [], access: [], whooshes: [], ...cues };
  C.clicks.forEach((at) => (C.clickTone === 'down' ? blip(at, 740, 460) : blip(at, 520, 820)));
  if (C.pause != null) blip(C.pause, 520, 330, 0.2);
  if (C.enter != null) { blip(C.enter, 520, 880, 0.24); key(C.enter - 0.02, 0.5); }
  C.keys.forEach((at) => key(at, 0.5));
  C.types.forEach((at) => key(at, 0.35));
  C.pops.forEach((at) => blip(at, 520, 820, 0.18));
  C.ticks.forEach((at, i) => blip(at, 900 + i * 60, 1100 + i * 60, 0.06));
  C.access.forEach((at, i) => blip(at, 1300 + i * 40, 1400 + i * 40, 0.045, 0.08));

  // Whoosh: filtered noise swelling and sweeping, panned left to right.
  C.whooshes.forEach((at) => {
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

  // Normalise to about -2 dBFS (AAC overshoots a little) and write 16-bit stereo WAV.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak ? 0.79 / peak : 1;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

module.exports = { writeSoundtrack };
