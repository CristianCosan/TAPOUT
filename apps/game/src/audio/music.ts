// Music, made in code (Sir's call, 2026-10-08): a quiet ambient bed that follows the weather
// (warm and open when calm, low and uneasy in a storm, glassy in winter), with long silences
// between phrases; a low drone only while your resolve is cracking; and short stings for big
// moments, fear and danger. Silence stays the default between phrases.

import { audio } from './engine.ts';
import { burst, rnd, strip, tone } from './voice.ts';

export interface Mood {
  storm: boolean;
  night: boolean;
  winter: boolean;
  /** Resolve is Cracking or Breaking. */
  cracking: boolean;
  /** A run is on screen (no bed on the title or in the intro). */
  playing: boolean;
}

export type Sting = 'firstNight' | 'frost' | 'snow' | 'storm' | 'kill' | 'awe' | 'finalTwo' | 'fear' | 'danger' | 'win' | 'lose';

const N = (semis: number) => 146.83 * Math.pow(2, semis / 12); // from D3

const CALM = [
  [0, 7, 14, 16],
  [-3, 4, 9, 14],
  [-7, 0, 7, 11],
  [-5, 2, 9, 12],
];
const NIGHT = [
  [0, 7, 15, 19],
  [-4, 3, 10, 15],
  [-7, 0, 8, 15],
  [-2, 5, 10, 14],
];

function pad(out: AudioNode, semis: number[], at: number, len: number, peak: number, type: OscillatorType = 'triangle'): void {
  for (const s of semis) {
    const f = N(s);
    for (const detune of [-0.003, 0.003]) {
      tone(out, { type, at, len, freqs: [[0, f * (1 + detune)], [len, f * (1 + detune)]], peak: peak / semis.length, attack: Math.min(2.5, len / 3) });
    }
  }
}

function bell(out: AudioNode, f: number, at: number, peak: number, len = 2.5): void {
  tone(out, { at, len, freqs: [[0, f], [len, f]], peak, attack: 0.005 });
  tone(out, { at, len: len * 0.6, freqs: [[0, f * 2.76], [len, f * 2.76]], peak: peak * 0.25, attack: 0.005 });
}

function heartbeat(out: AudioNode, at: number, beats: number, gap = 0.85): void {
  for (let i = 0; i < beats; i++) {
    const t = at + i * gap;
    tone(out, { at: t, len: 0.16, freqs: [[0, 62], [0.16, 42]], peak: 0.4 });
    tone(out, { at: t + 0.22, len: 0.14, freqs: [[0, 56], [0.14, 40]], peak: 0.35 });
  }
}

class Music {
  private mood: Mood = { storm: false, night: false, winter: false, cracking: false, playing: false };
  private timer: number | null = null;
  private drone: { out: GainNode; oscs: OscillatorNode[] } | null = null;
  private filter: BiquadFilterNode | null = null;
  private bus: GainNode | null = null;

  setMood(m: Mood): void {
    const was = this.mood;
    this.mood = m;
    if (m.playing && !was.playing) this.schedule(rnd(25, 45));
    if (!m.playing && this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateDrone();
  }

  /** A gentle low-pass on the whole music bus so the bed sits behind the world. */
  private out(loud: number): GainNode | null {
    const ctx = audio.ctx;
    if (!ctx) return null;
    if (!this.bus) {
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 2400;
      this.filter.connect(audio.bus('music')!);
      this.bus = ctx.createGain();
      this.bus.connect(this.filter);
    }
    const g = ctx.createGain();
    g.gain.value = loud;
    g.connect(this.bus);
    return g;
  }

  private schedule(seconds: number): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      if (!this.mood.playing) return;
      const len = this.phrase();
      this.schedule(len + rnd(35, 80));
    }, seconds * 1000);
  }

  /** One phrase of the bed; returns how long it lasts. */
  private phrase(): number {
    const out = this.out(1);
    if (!out) return 0;
    const { storm, night, winter } = this.mood;
    if (storm) {
      // A low drone that leans on a half step, the filter breathing.
      const len = 22;
      tone(out, { type: 'sawtooth', len, freqs: [[0, N(-24)], [len, N(-24)]], peak: 0.05, band: 180, q: 1, attack: 5 });
      tone(out, { type: 'sawtooth', len, freqs: [[0, N(-17)], [len, N(-17)]], peak: 0.03, band: 260, q: 1, attack: 6 });
      tone(out, { at: 8, len: 12, freqs: [[0, N(1)], [12, N(0)]], peak: 0.02, attack: 4 });
      for (let i = 0; i < 3; i++) burst(out, { at: 3 + i * 6, len: 4, peak: 0.04, freq: 120, to: 400, type: 'lowpass', brown: true, attack: 2 });
      return len;
    }
    const chords = night ? NIGHT : CALM;
    const each = night ? 11 : 9;
    const peak = night ? 0.05 : 0.06;
    chords.forEach((c, i) => pad(out, c, i * each, each + 3, peak));
    // A few high notes over the top, sparse; in winter they ring like glass.
    const top = night ? [14, 15, 19, 22] : [14, 16, 19, 21, 23];
    for (let i = 0; i < (winter ? 7 : 4); i++) {
      const s = top[Math.floor(Math.random() * top.length)]! + (winter ? 12 : 0);
      const at = rnd(2, chords.length * each - 2);
      if (winter) bell(out, N(s), at, 0.025, 4);
      else tone(out, { at, len: 2.4, freqs: [[0, N(s)], [2.4, N(s)]], peak: 0.018, attack: 0.6 });
    }
    return chords.length * each + 3;
  }

  private updateDrone(): void {
    const ctx = audio.ctx;
    const want = this.mood.playing && this.mood.cracking;
    if (want && !this.drone && ctx) {
      const out = this.out(0);
      if (!out) return;
      const oscs = [55, 56.3, 82.4].map((f, i) => {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = i === 2 ? 0.25 : 0.5;
        o.connect(g).connect(out);
        o.start();
        return o;
      });
      out.gain.setTargetAtTime(0.09, ctx.currentTime, 4);
      this.drone = { out, oscs };
    } else if (!want && this.drone && ctx) {
      const d = this.drone;
      this.drone = null;
      d.out.gain.setTargetAtTime(0, ctx.currentTime, 3);
      window.setTimeout(() => {
        d.oscs.forEach((o) => o.stop());
        d.out.disconnect();
      }, 12000);
    }
  }

  sting(kind: Sting): void {
    const out = strip('music', 1);
    if (!out) return;
    audio.setDuck(0.6);
    window.setTimeout(() => audio.setDuck(0), 5000);
    switch (kind) {
      case 'firstNight':
        pad(out, [-12, -5, 2, 7], 0, 9, 0.12);
        bell(out, N(19), 2.5, 0.05, 5);
        break;
      case 'frost':
        [31, 26, 22, 19].forEach((s, i) => bell(out, N(s), i * 0.5, 0.06, 4));
        pad(out, [0, 7, 14], 0.5, 7, 0.06, 'sine');
        break;
      case 'snow':
        [19, 22, 26, 31, 34].forEach((s, i) => bell(out, N(s), i * 0.7, 0.05, 5));
        pad(out, [-12, 2, 7, 14], 0, 10, 0.08, 'sine');
        break;
      case 'storm':
        tone(out, { len: 2.5, freqs: [[0, 55], [2.5, 38]], peak: 0.4, attack: 0.02 });
        burst(out, { len: 3, peak: 0.3, freq: 150, to: 60, type: 'lowpass', brown: true, attack: 0.05 });
        pad(out, [-12, -11, -5, 1], 1, 7, 0.1, 'sawtooth');
        break;
      case 'kill':
        [0, 0.5, 1.4].forEach((t) => tone(out, { at: t, len: 0.5, freqs: [[0, 80], [0.5, 50]], peak: 0.4 }));
        pad(out, [-12, -9, -5, 3], 1.4, 7, 0.1);
        break;
      case 'awe':
        pad(out, [-12, 4, 7, 11, 14], 0, 11, 0.12, 'sine');
        [14, 19, 23, 26, 31].forEach((s, i) => bell(out, N(s), 1 + i * 0.45, 0.035, 4));
        break;
      case 'finalTwo':
        pad(out, [-12, -5, 2, 9], 0, 6, 0.1);
        pad(out, [-10, -3, 4, 11], 5, 8, 0.11);
        break;
      case 'fear':
        pad(out, [-24, -23, -18, -13], 0, 6, 0.16, 'sawtooth');
        heartbeat(out, 0.6, 5, 0.7);
        break;
      case 'danger':
        heartbeat(out, 0, 3, 0.9);
        tone(out, { at: 0.3, len: 3, freqs: [[0, N(-12)], [3, N(-12)]], peak: 0.04, attack: 1 });
        tone(out, { at: 0.3, len: 3, freqs: [[0, N(-11)], [3, N(-11)]], peak: 0.03, attack: 1 });
        break;
      case 'win':
        [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(out, N(s), i * 0.25, 0.06, 4));
        pad(out, [-12, 0, 4, 7, 11], 1.5, 12, 0.12);
        break;
      case 'lose':
        [12, 10, 7, 3, 0].forEach((s, i) => tone(out, { at: i * 0.6, len: 1.6, freqs: [[0, N(s)], [1.6, N(s)]], peak: 0.06, attack: 0.1 }));
        pad(out, [-12, -9, -5, 0], 2.5, 10, 0.1);
        break;
    }
  }
}

export const music = new Music();
