// The two building blocks every sound here is made of: a tone whose pitch moves along a path,
// and a burst of filtered noise. Both start at a time offset and clean up after themselves.

import { audio } from './engine.ts';

export interface ToneSpec {
  type?: OscillatorType;
  /** Seconds from now. */
  at?: number;
  len: number;
  /** [seconds into the note, frequency] points; the first is where it starts. */
  freqs: Array<[number, number]>;
  peak: number;
  /** A band-pass centre, for reedy or hollow tones. */
  band?: number;
  q?: number;
  /** Seconds to reach the peak. */
  attack?: number;
  /** Pitch tremble: [rate Hz, depth Hz]. */
  vibrato?: [number, number];
}

export function tone(out: AudioNode, s: ToneSpec): OscillatorNode | null {
  const ctx = audio.ctx;
  if (!ctx) return null;
  const at = ctx.currentTime + (s.at ?? 0);
  const o = ctx.createOscillator();
  o.type = s.type ?? 'sine';
  o.frequency.setValueAtTime(s.freqs[0]![1], at);
  for (const [t, f] of s.freqs.slice(1)) o.frequency.linearRampToValueAtTime(f, at + t);
  const g = ctx.createGain();
  const attack = s.attack ?? Math.min(0.04, s.len / 4);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(s.peak, at + attack);
  g.gain.setValueAtTime(s.peak, at + Math.max(attack, s.len * 0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, at + s.len);
  o.connect(g);
  let head: AudioNode = g;
  if (s.band) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = s.band;
    f.Q.value = s.q ?? 2.5;
    g.connect(f);
    head = f;
  }
  head.connect(out);
  if (s.vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = s.vibrato[0];
    const depth = ctx.createGain();
    depth.gain.value = s.vibrato[1];
    lfo.connect(depth).connect(o.frequency);
    lfo.start(at);
    lfo.stop(at + s.len + 0.05);
  }
  o.start(at);
  o.stop(at + s.len + 0.05);
  return o;
}

export interface BurstSpec {
  at?: number;
  len: number;
  peak: number;
  freq: number;
  /** Where the filter ends up by the end of the burst, for sweeps. */
  to?: number;
  type?: BiquadFilterType;
  q?: number;
  brown?: boolean;
  attack?: number;
}

export function burst(out: AudioNode, s: BurstSpec): void {
  const ctx = audio.ctx;
  if (!ctx) return;
  const at = ctx.currentTime + (s.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = s.brown ? audio.brown : audio.noise;
  const f = ctx.createBiquadFilter();
  f.type = s.type ?? 'bandpass';
  f.frequency.setValueAtTime(s.freq, at);
  if (s.to) f.frequency.exponentialRampToValueAtTime(s.to, at + s.len);
  f.Q.value = s.q ?? 1.2;
  const g = ctx.createGain();
  if (s.attack) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(s.peak, at + s.attack);
  } else g.gain.setValueAtTime(s.peak, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + s.len);
  src.connect(f).connect(g).connect(out);
  src.start(at, Math.random() * 1.5, s.len + 0.05);
}

/** A gain node on a bus, optionally panned, that the voices of one sound share. */
export function strip(bus: 'ambience' | 'effects' | 'music', loud = 1, pan = 0): GainNode | null {
  const ctx = audio.ctx;
  const target = audio.bus(bus);
  if (!ctx || !target) return null;
  const g = ctx.createGain();
  g.gain.value = loud;
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p).connect(target);
  } else g.connect(target);
  return g;
}

export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
