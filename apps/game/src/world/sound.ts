// Ambient sound made in code (D-030): wind, rain, the fire's crackle, the lake and your steps,
// all shaped noise, and bird calls from plain tones. No sound files. The browser only allows sound after a click or a key, so
// it starts on the first one.

import type { CallKind } from './life.ts';

export interface SoundState {
  weather: string;
  /** Metres to a burning fire; Infinity when none burns here. */
  fireDistance: number;
  /** Metres to open water; Infinity when there is none. */
  waterDistance: number;
  frozen: boolean;
}

const WIND: Record<string, number> = { clear: 0.05, cold: 0.1, overcast: 0.09, rain: 0.12, snow: 0.11, storm: 0.32 };
const RAIN: Record<string, number> = { rain: 0.16, storm: 0.3 };

export class Ambience {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private wind!: GainNode;
  private windFilter!: BiquadFilterNode;
  private rain!: GainNode;
  private lake!: GainNode;
  private fire!: GainNode;
  /** A long, soft echo off the far shore, for calls over the water. */
  private echo!: GainNode;
  private noise!: AudioBuffer;
  private t = 0;
  private lastStep = 0;

  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ctx.destination);

    // Two seconds of noise, reused by every voice.
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Brown noise for wind: integrate the white noise.
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * data[i]!) / 1.02;
      b[i] = last * 3.5;
    }

    const loop = (buffer: AudioBuffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.start(0, Math.random() * 2);
      return src;
    };

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 500;
    this.wind = ctx.createGain();
    this.wind.gain.value = 0;
    loop(brown).connect(this.windFilter).connect(this.wind).connect(this.master);

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1400;
    this.rain = ctx.createGain();
    this.rain.gain.value = 0;
    loop(this.noise).connect(rainFilter).connect(this.rain).connect(this.master);

    const lakeFilter = ctx.createBiquadFilter();
    lakeFilter.type = 'lowpass';
    lakeFilter.frequency.value = 320;
    this.lake = ctx.createGain();
    this.lake.gain.value = 0;
    loop(brown).connect(lakeFilter).connect(this.lake).connect(this.master);

    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 900;
    this.fire = ctx.createGain();
    this.fire.gain.value = 0;
    loop(brown).connect(fireFilter).connect(this.fire).connect(this.master);

    this.echo = ctx.createGain();
    this.echo.gain.value = 0.5;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.42;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const dull = ctx.createBiquadFilter();
    dull.type = 'lowpass';
    dull.frequency.value = 1800;
    this.echo.connect(delay).connect(dull).connect(feedback).connect(delay);
    dull.connect(this.master);
  }

  /**
   * A bird call: kind, loudness 0..1 (already faded with distance) and where it is, -1 left to 1
   * right. Each is a few tones with pitch and volume shaped over time.
   */
  call(kind: CallKind, loud: number, pan: number): void {
    const ctx = this.ctx;
    if (!ctx || loud < 0.01) return;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = loud;
    let tail: AudioNode = out;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(p);
      tail = p;
    }
    tail.connect(this.master);
    if (kind === 'loon' || kind === 'goose') tail.connect(this.echo);

    const note = (type: OscillatorType, start: number, len: number, freqs: [number, number][], peak: number, filter?: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      const g = ctx.createGain();
      const at = now + start;
      o.frequency.setValueAtTime(freqs[0]![1], at);
      for (const [t, f] of freqs.slice(1)) o.frequency.linearRampToValueAtTime(f, at + t);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.04, len / 4));
      g.gain.setValueAtTime(peak, at + len * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      let head: AudioNode = g;
      if (filter) {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = filter;
        f.Q.value = 2.5;
        g.connect(f);
        head = f;
      }
      o.connect(g);
      head.connect(out);
      o.start(at);
      o.stop(at + len + 0.05);
      return o;
    };

    const r = Math.random;
    switch (kind) {
      case 'chickadee': {
        // "Fee-bee": a clear high note, then a lower one.
        const hi = 3900 + r() * 300;
        note('sine', 0, 0.32, [[0, hi], [0.3, hi * 0.98]], 0.09);
        note('sine', 0.38, 0.36, [[0, hi * 0.82], [0.34, hi * 0.8]], 0.08);
        break;
      }
      case 'jay': {
        // A soft, rising-then-falling whistle.
        note('sine', 0, 0.45, [[0, 1700], [0.15, 2300], [0.45, 1600]], 0.07);
        if (r() < 0.5) note('sine', 0.6, 0.35, [[0, 1900], [0.35, 1500]], 0.05);
        break;
      }
      case 'raven': {
        // Two or three hollow croaks.
        const n = 2 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) note('sawtooth', i * 0.38, 0.2, [[0, 340], [0.2, 250]], 0.16, 820);
        break;
      }
      case 'goose': {
        note('sawtooth', 0, 0.16, [[0, 390 + r() * 40], [0.16, 340]], 0.12, 900);
        if (r() < 0.6) note('sawtooth', 0.22, 0.14, [[0, 420], [0.14, 360]], 0.1, 900);
        break;
      }
      case 'loon': {
        // The long wail: slide up, hold with a tremble, slide down.
        const base = 560 + r() * 60;
        const o = note('sine', 0, 2.6, [[0, base], [0.6, base * 1.5], [1.9, base * 1.48], [2.6, base * 1.25]], 0.13);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.5;
        const depth = ctx.createGain();
        depth.gain.value = 9;
        lfo.connect(depth).connect(o.frequency);
        lfo.start(now + 0.7);
        lfo.stop(now + 2.7);
        note('sine', 0, 2.6, [[0, base * 2], [0.6, base * 3], [1.9, base * 2.96], [2.6, base * 2.5]], 0.025);
        break;
      }
    }
  }

  stop(): void {
    void this.ctx?.close();
    this.ctx = null;
  }

  /** One short burst of shaped noise: a crackle, a step. */
  private burst(gain: number, freq: number, length: number, type: BiquadFilterType = 'bandpass'): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + length);
    src.connect(f).connect(g).connect(this.master);
    src.start(now, Math.random() * 1.5, length + 0.05);
  }

  step(running: boolean): void {
    if (!this.ctx || this.t - this.lastStep < 0.2) return;
    this.lastStep = this.t;
    this.burst(running ? 0.22 : 0.15, 260 + Math.random() * 120, 0.12, 'lowpass');
  }

  update(dt: number, s: SoundState): void {
    if (!this.ctx) return;
    this.t += dt;
    const ease = (p: AudioParam, target: number) => p.setTargetAtTime(target, this.ctx!.currentTime, 0.5);
    const gust = 0.75 + Math.sin(this.t * 0.31) * 0.15 + Math.sin(this.t * 0.83) * 0.1;
    ease(this.wind.gain, (WIND[s.weather] ?? 0.06) * gust * (s.frozen ? 0.6 : 1));
    ease(this.windFilter.frequency, 380 + gust * 420 + (s.weather === 'storm' ? 500 : 0));
    ease(this.rain.gain, RAIN[s.weather] ?? 0);
    const lake = Number.isFinite(s.waterDistance) ? Math.max(0, 1 - s.waterDistance / 25) * (0.1 + Math.sin(this.t * 0.9) * 0.04) : 0;
    ease(this.lake.gain, lake);
    const near = Number.isFinite(s.fireDistance) ? Math.max(0, 1 - s.fireDistance / 16) : 0;
    ease(this.fire.gain, near * 0.18);
    // Crackles and pops, more of them close up.
    if (near > 0 && Math.random() < dt * (3 + near * 9)) this.burst(near * (0.12 + Math.random() * 0.25), 1800 + Math.random() * 2600, 0.03 + Math.random() * 0.05);
  }
}
