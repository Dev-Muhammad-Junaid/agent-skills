// SKILL NOTE: Switchit's soundtrack (plucked arpeggio, toggle, scanner tick + chimes). A second palette example next to soundtrack.js; give each extension its own.
// Switchit's promo soundtrack, synthesised. Its own palette (Distract used a pad, a 120 bpm pulse and falling blips):
// - bed: a plucked arpeggio at 112 bpm over a soft sub bass, airy hats once the demo starts
// - switch: a two-tone toggle, low → high, with a key click (every account switch)
// - checking: a soft scanner tick while access probes run, resolving into a chime (Access) or a muted knock (No access)
// - discovery: bubble plucks rising a pentatonic step per account found
// Every beat comes from promo.html's window.CUES (render.js passes it in), so audio can't drift from the picture.
const fs = require("fs");
const RATE = 44100;
const BPM = 112, BEAT = 60 / BPM;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function writeSoundtrack(file, duration, cues) {
  const n = Math.ceil(duration * RATE);
  const L = new Float32Array(n), R = new Float32Array(n);
  const add = (i, l, r = l) => { if (i >= 0 && i < n) { L[i] += l; R[i] += r; } };
  const fadeAll = (t) => Math.min(1, t / 0.8) * Math.min(1, (duration - t) / 2.2);

  // A plucked tone: sine + soft second harmonic, fast attack, exponential decay. pan -1..1
  const pluck = (at, f, gain, decay = 7, pan = 0, len = 0.6) => {
    const s0 = Math.floor(at * RATE);
    for (let k = 0; k < RATE * len; k++) {
      const t = k / RATE, e = Math.min(1, t / 0.004) * Math.exp(-t * decay);
      const v = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 18)) * e * gain * fadeAll(at + t);
      add(s0 + k, v * Math.min(1, 1 - pan), v * Math.min(1, 1 + pan));
    }
  };

  // Bed: Cmaj7 → Am9 → Fmaj7 → G6, one chord per bar of 4 beats, arpeggiated in 8ths.
  const CHORDS = [[60, 64, 67, 71, 74], [57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [55, 59, 62, 64, 67]];
  const PATTERN = [0, 2, 4, 3, 1, 3, 2, 4];
  const bar = BEAT * 4;
  for (let b = 0; b * bar < duration; b++) {
    const chord = CHORDS[b % CHORDS.length], t0 = b * bar;
    // sub bass: the root, held through the bar
    const root = hz(chord[0] - 24), s0 = Math.floor(t0 * RATE);
    for (let k = 0; k < RATE * bar && s0 + k < n; k++) {
      const t = k / RATE, e = Math.min(1, t / 0.04) * Math.exp(-t * 0.9);
      const v = Math.sin(2 * Math.PI * root * t) * e * 0.16 * fadeAll(t0 + t);
      add(s0 + k, v);
    }
    PATTERN.forEach((p, i) => {
      const at = t0 + i * BEAT / 2;
      if (at < duration - 0.5) pluck(at, hz(chord[p] + 12), i % 2 ? 0.05 : 0.07, 6, i % 2 ? 0.35 : -0.35, 0.7);
    });
  }
  // airy hats on the off-8ths once the demo starts, until the outro
  for (let at = 7.25 + BEAT / 2; at < 44; at += BEAT) {
    const s0 = Math.floor(at * RATE);
    let prev = 0;
    for (let k = 0; k < RATE * 0.04; k++) {
      const w = Math.random() * 2 - 1, hp = w - prev; prev = w;
      add(s0 + k, hp * Math.exp(-(k / RATE) * 120) * 0.02, hp * Math.exp(-(k / RATE) * 120) * 0.026);
    }
  }

  // key: a short click with a little body
  const key = (at, gain = 0.4) => {
    const s0 = Math.floor(at * RATE);
    let a = 0, prev = 0;
    for (let k = 0; k < RATE * 0.035; k++) {
      const t = k / RATE, w = Math.random() * 2 - 1;
      a += 0.45 * (w - a);
      const hp = a - prev; prev = a;
      add(s0 + k, (hp * Math.exp(-t * 150) + Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 60) * 0.5) * gain * 0.35);
    }
  };
  // switch: two-tone toggle, low → high
  const toggle = (at, gain = 0.2) => {
    key(at - 0.01, 0.5);
    pluck(at, hz(79), gain, 18, -0.2, 0.25);
    pluck(at + 0.055, hz(86), gain * 0.9, 14, 0.2, 0.35);
  };
  // intro: the reel ticking past rows, slowing to a stop, then the land
  for (let x = 0, at = cues.reel[0]; at < cues.reel[1]; x++) {
    pluck(at, hz(91), 0.03, 40, x % 2 ? 0.3 : -0.3, 0.06);
    at += 0.025 + 0.11 * Math.pow((at - cues.reel[0]) / (cues.reel[1] - cues.reel[0]), 2);
  }
  toggle(cues.land, 0.16);
  [72, 76, 79].forEach((m, i) => pluck(cues.icon + i * 0.06, hz(m + 12), 0.1, 6, 0, 0.8));

  cues.keys.forEach((at) => key(at));
  cues.opens.forEach((at) => { pluck(at, hz(74), 0.08, 10, 0, 0.4); pluck(at + 0.04, hz(81), 0.06, 10, 0, 0.4); });
  cues.pops.forEach((at, i) => pluck(at, hz([79, 81, 84, 86, 88][i % 5]), 0.12, 12, (i - 2) * 0.2, 0.3));
  cues.switches.forEach((at) => toggle(at));
  cues.reloads.forEach((at) => pluck(at, hz(67), 0.05, 9, 0, 0.3));
  cues.clicks.forEach((at) => key(at, 0.55));

  // checking: a soft scanner tick, 8 per second
  cues.checking.forEach(([a, b]) => {
    for (let at = a, i = 0; at < b; at += 0.125, i++) pluck(at, hz(i % 2 ? 93 : 96), 0.025, 50, i % 2 ? 0.25 : -0.25, 0.05);
  });
  cues.no.forEach((at) => { const s0 = Math.floor(at * RATE); for (let k = 0; k < RATE * 0.12; k++) { const t = k / RATE; add(s0 + k, Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 35) * 0.12); } });
  cues.yes.forEach((at) => { [84, 88, 91].forEach((m, i) => pluck(at + i * 0.07, hz(m), 0.12, 5, (i - 1) * 0.3, 0.9)); });

  // theme: a low, soft "lights down" glide
  {
    const s0 = Math.floor(cues.theme * RATE);
    let ph = 0;
    for (let k = 0; k < RATE * 0.7; k++) {
      const t = k / RATE, f = 520 * Math.pow(0.5, t / 0.7);
      ph += 2 * Math.PI * f / RATE;
      add(s0 + k, Math.sin(ph) * Math.sin(Math.PI * t / 0.7) * 0.09);
    }
  }
  cues.privacy.forEach((at, i) => pluck(at, hz([76, 79, 83, 88][i]), 0.1, 7, 0, 0.6));
  [60, 67, 72, 76, 79].forEach((m, i) => pluck(cues.outro + i * 0.09, hz(m + 12), 0.09, 3.5, (i - 2) * 0.15, 1.6));

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
