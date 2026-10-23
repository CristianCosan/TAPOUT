// Ambient sound made in code (D-030): wind, rain, the fire's crackle, the lake and your steps,
// all shaped noise, and bird and night calls from plain tones. No sound files. It plays on the
// shared engine's Ambience bus, which starts on the first click or key.

import { audio } from '../audio/engine.ts';
import { burst, rnd, tone } from '../audio/voice.ts';
import type { CallKind } from './life.ts';

export interface SoundState {
  weather: string;
  /** Metres to a burning fire; Infinity when none burns here. */
  fireDistance: number;
  /** Metres to open water; Infinity when there is none. */
  waterDistance: number;
  /** Metres to lake ice; Infinity when the lake here is open or there is none. */
  iceDistance: number;
  frozen: boolean;
  winter: boolean;
}

const WIND: Record<string, number> = { clear: 0.05, cold: 0.1, overcast: 0.09, rain: 0.12, snow: 0.11, storm: 0.32 };
const RAIN: Record<string, number> = { rain: 0.16, storm: 0.3 };

export class Ambience {
  private out: GainNode | null = null;
  private wind!: GainNode;
  private windFilter!: BiquadFilterNode;
  private rain!: GainNode;
  private lake!: GainNode;
  private fire!: GainNode;
  /** A long, soft echo off the far shore, for calls over the water. */
  private echo!: GainNode;
  private sources: AudioBufferSourceNode[] = [];
  private t = 0;
  private lastStep = 0;
  private nextIce = 8;

  start(): void {
    audio.unlock();
    const ctx = audio.ctx;
    const bus = audio.bus('ambience');
    if (this.out || !ctx || !bus) return;
    const out = ctx.createGain();
    out.connect(bus);
    this.out = out;

    const loop = (buffer: AudioBuffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.start(0, Math.random() * 2);
      this.sources.push(src);
      return src;
    };
    const layer = (buffer: AudioBuffer, type: BiquadFilterType, freq: number) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0;
      loop(buffer).connect(f).connect(g).connect(out);
      return { f, g };
    };
    const wind = layer(audio.brown, 'lowpass', 500);
    this.wind = wind.g;
    this.windFilter = wind.f;
    this.rain = layer(audio.noise, 'highpass', 1400).g;
    this.lake = layer(audio.brown, 'lowpass', 320).g;
    this.fire = layer(audio.brown, 'lowpass', 900).g;

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
    dull.connect(out);
  }

  stop(): void {
    for (const s of this.sources) s.stop();
    this.sources = [];
    this.out?.disconnect();
    this.out = null;
  }

  /**
   * A call from the world: kind, loudness 0..1 (already faded with distance) and where it is,
   * -1 left to 1 right. Each is a few tones with pitch and volume shaped over time.
   */
  call(kind: CallKind, loud: number, pan: number): void {
    const ctx = audio.ctx;
    if (!ctx || !this.out || loud < 0.01) return;
    const out = ctx.createGain();
    out.gain.value = loud;
    let tail: AudioNode = out;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(p);
      tail = p;
    }
    tail.connect(this.out);
    if (kind === 'loon' || kind === 'goose' || kind === 'wolf' || kind === 'owl' || kind === 'beaver') tail.connect(this.echo);

    const r = Math.random;
    switch (kind) {
      case 'chickadee': {
        // "Fee-bee": a clear high note, then a lower one.
        const hi = 3900 + r() * 300;
        tone(out, { len: 0.32, freqs: [[0, hi], [0.3, hi * 0.98]], peak: 0.09 });
        tone(out, { at: 0.38, len: 0.36, freqs: [[0, hi * 0.82], [0.34, hi * 0.8]], peak: 0.08 });
        break;
      }
      case 'jay': {
        // A soft, rising-then-falling whistle.
        tone(out, { len: 0.45, freqs: [[0, 1700], [0.15, 2300], [0.45, 1600]], peak: 0.07 });
        if (r() < 0.5) tone(out, { at: 0.6, len: 0.35, freqs: [[0, 1900], [0.35, 1500]], peak: 0.05 });
        break;
      }
      case 'raven': {
        // Two or three hollow croaks.
        const n = 2 + Math.floor(r() * 2);
        for (let i = 0; i < n; i++) tone(out, { type: 'sawtooth', at: i * 0.38, len: 0.2, freqs: [[0, 340], [0.2, 250]], peak: 0.16, band: 820 });
        break;
      }
      case 'goose': {
        tone(out, { type: 'sawtooth', len: 0.16, freqs: [[0, 390 + r() * 40], [0.16, 340]], peak: 0.12, band: 900 });
        if (r() < 0.6) tone(out, { type: 'sawtooth', at: 0.22, len: 0.14, freqs: [[0, 420], [0.14, 360]], peak: 0.1, band: 900 });
        break;
      }
      case 'loon': {
        // The long wail: slide up, hold with a tremble, slide down.
        const base = 560 + r() * 60;
        const path = (k: number): Array<[number, number]> => [[0, base * k], [0.6, base * 1.5 * k], [1.9, base * 1.48 * k], [2.6, base * 1.25 * k]];
        tone(out, { len: 2.6, freqs: path(1), peak: 0.13, attack: 0.3, vibrato: [5.5, 9] });
        tone(out, { len: 2.6, freqs: path(2), peak: 0.025, attack: 0.3 });
        break;
      }
      case 'owl': {
        // A great horned owl: hoo, h-hoo, hoo, hoo.
        const f = 300 + r() * 30;
        [0, 0.55, 0.75, 1.3, 1.85].forEach((t, i) => tone(out, { at: t, len: i === 1 ? 0.14 : 0.32, freqs: [[0, f * 1.05], [0.3, f]], peak: 0.1, attack: 0.06 }));
        break;
      }
      case 'beaver': {
        // The tail slap: a flat crack off the water, then the splash settling.
        burst(out, { len: 0.12, peak: 0.6, freq: 900, to: 400, q: 0.6, attack: 0.002 });
        burst(out, { at: 0.04, len: 0.9, peak: 0.22, freq: 2400, to: 700, q: 0.5, attack: 0.02 });
        break;
      }
      case 'deer': {
        // The alarm snort: one or two sharp blows through the nose.
        burst(out, { len: 0.22, peak: 0.35, freq: 700, to: 380, q: 0.9, attack: 0.01 });
        if (r() < 0.6) burst(out, { at: 0.45, len: 0.18, peak: 0.25, freq: 650, to: 360, q: 0.9, attack: 0.01 });
        break;
      }
      case 'wolf': {
        // Two or three voices howling far off, a little apart.
        const voices = 2 + Math.floor(r() * 2);
        for (let i = 0; i < voices; i++) {
          const f = 380 + r() * 120;
          const at = i * rnd(0.6, 1.6);
          tone(out, { at, len: 3.2, freqs: [[0, f], [0.5, f * 1.6], [2.4, f * 1.5], [3.2, f * 1.1]], peak: 0.06, attack: 0.5, vibrato: [4.5, 6] });
        }
        break;
      }
    }
  }

  /** Thunder after lightning: a crack when close, then a long low roll. `far` is 0 (overhead) to 1. */
  thunder(far: number): void {
    if (!this.out) return;
    const loud = 0.9 - far * 0.5;
    if (far < 0.4) burst(this.out, { len: 0.35, peak: loud * 0.6, freq: 1400, to: 300, type: 'lowpass', attack: 0.005 });
    burst(this.out, { at: 0.05, len: 4 + far * 3, peak: loud * 0.9, freq: 260, to: 50, type: 'lowpass', brown: true, attack: 0.15 + far * 0.4 });
    burst(this.out, { at: 0.8 + far, len: 3, peak: loud * 0.5, freq: 160, to: 40, type: 'lowpass', brown: true, attack: 0.6 });
  }

  /** A fish rising: a small wet plop off the water. */
  plop(loud: number): void {
    if (!this.out) return;
    burst(this.out, { len: 0.09, peak: loud * 0.18, freq: 700 + Math.random() * 300, to: 250, type: 'lowpass', attack: 0.004 });
    burst(this.out, { at: 0.03, len: 0.25, peak: loud * 0.06, freq: 2200, q: 1.2 });
  }

  step(running: boolean, winter: boolean): void {
    if (!this.out || this.t - this.lastStep < 0.2) return;
    this.lastStep = this.t;
    if (winter) burst(this.out, { len: 0.16, peak: running ? 0.2 : 0.14, freq: 1600 + Math.random() * 600, q: 0.8 });
    else burst(this.out, { len: 0.12, peak: running ? 0.22 : 0.15, freq: 260 + Math.random() * 120, type: 'lowpass' });
  }

  update(dt: number, s: SoundState): void {
    const ctx = audio.ctx;
    if (!ctx || !this.out) return;
    this.t += dt;
    const ease = (p: AudioParam, target: number) => p.setTargetAtTime(target, ctx.currentTime, 0.5);
    const gust = 0.75 + Math.sin(this.t * 0.31) * 0.15 + Math.sin(this.t * 0.83) * 0.1;
    ease(this.wind.gain, (WIND[s.weather] ?? 0.06) * gust * (s.frozen ? 0.6 : 1));
    ease(this.windFilter.frequency, 380 + gust * 420 + (s.weather === 'storm' ? 500 : 0));
    ease(this.rain.gain, RAIN[s.weather] ?? 0);
    const lake = Number.isFinite(s.waterDistance) ? Math.max(0, 1 - s.waterDistance / 25) * (0.1 + Math.sin(this.t * 0.9) * 0.04) : 0;
    ease(this.lake.gain, lake);
    const near = Number.isFinite(s.fireDistance) ? Math.max(0, 1 - s.fireDistance / 16) : 0;
    ease(this.fire.gain, near * 0.18);
    // Crackles and pops, more of them close up.
    if (near > 0 && Math.random() < dt * (3 + near * 9)) burst(this.out, { len: 0.03 + Math.random() * 0.05, peak: near * (0.12 + Math.random() * 0.25), freq: 1800 + Math.random() * 2600 });
    // The ice sings: now and then a crack runs across the lake and comes back as a falling "pew".
    if (Number.isFinite(s.iceDistance)) {
      this.nextIce -= dt;
      if (this.nextIce <= 0) {
        this.nextIce = 12 + Math.random() * 35;
        this.ice(Math.max(0.25, 1 - s.iceDistance / 80));
      }
    }
  }

  private ice(loud: number): void {
    const out = this.out!;
    const hi = 2600 + Math.random() * 1400;
    burst(out, { len: 0.06, peak: loud * 0.25, freq: 3200, q: 0.7, attack: 0.002 });
    tone(out, { at: 0.02, len: 0.7, freqs: [[0, hi], [0.15, hi * 0.35], [0.7, 180]], peak: loud * 0.07, attack: 0.01 });
    tone(out, { at: 0.12, len: 0.9, freqs: [[0, hi * 0.8], [0.25, hi * 0.25], [0.9, 140]], peak: loud * 0.04, attack: 0.02 });
    burst(out, { at: 0.05, len: 1.4, peak: loud * 0.18, freq: 140, to: 50, type: 'lowpass', brown: true, attack: 0.08 });
    burst(out, { at: 0.6, len: 1.8, peak: loud * 0.08, freq: 110, to: 45, type: 'lowpass', brown: true, attack: 0.3 });
  }
}
