// The one sound engine (plan §7.2): a single AudioContext with Master, Ambience, Effects and
// Music buses, each with its own volume. Everything is made in code (D-031): shaped noise and
// plain tones, no sound files. Browsers allow sound only after a click or a key, so the engine
// unlocks on the first one.

export type Bus = 'ambience' | 'effects' | 'music';
export type Channel = 'master' | Bus;

const VOLUME_KEY = 'tapout.volume';
const DEFAULT_VOLUME: Record<Channel, number> = { master: 0.8, ambience: 1, effects: 0.9, music: 0.7 };

function loadVolumes(): Record<Channel, number> {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw) return { ...DEFAULT_VOLUME, ...(JSON.parse(raw) as Partial<Record<Channel, number>>) };
  } catch {
    // No storage here: the defaults will do.
  }
  return { ...DEFAULT_VOLUME };
}

class Engine {
  ctx: AudioContext | null = null;
  private gains = new Map<Channel, GainNode>();
  /** Ducks the ambience under cards and music; 1 is no duck. */
  private duck!: GainNode;
  /** The "inside" filter: sleeping and the night muffle everything outdoors. */
  private muffle!: BiquadFilterNode;
  /** Two seconds of white noise and of brown noise, shared by every voice. */
  noise!: AudioBuffer;
  brown!: AudioBuffer;
  private volumes = loadVolumes();
  private listeners = new Set<() => void>();

  /** Starts the engine if the browser lets it. Safe to call often. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    this.gains.set('master', master);
    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = 'lowpass';
    this.muffle.frequency.value = 20000;
    this.duck = ctx.createGain();
    this.muffle.connect(this.duck).connect(master);
    for (const bus of ['ambience', 'effects', 'music'] as const) {
      const g = ctx.createGain();
      g.connect(bus === 'ambience' ? this.muffle : master);
      this.gains.set(bus, g);
    }
    this.applyVolumes();

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = this.brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * data[i]!) / 1.02;
      b[i] = last * 3.5;
    }
    for (const f of this.listeners) f();
  }

  /** Runs once the engine is up (now, if it already is). */
  ready(f: () => void): () => void {
    if (this.ctx) f();
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  bus(name: Bus): GainNode | null {
    return this.gains.get(name) ?? null;
  }

  volume(ch: Channel): number {
    return this.volumes[ch];
  }

  setVolume(ch: Channel, v: number): void {
    this.volumes[ch] = Math.max(0, Math.min(1, v));
    this.applyVolumes();
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify(this.volumes));
    } catch {
      // Not saved; it still applies for this session.
    }
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    for (const [ch, g] of this.gains) {
      // A gentle curve, so the low half of a slider is still usable.
      const v = this.volumes[ch];
      g.gain.setTargetAtTime(v * v, this.ctx.currentTime, 0.05);
    }
  }

  /** Ambience under a card or a music cue: 0 is none, 1 is about −6 dB. */
  setDuck(amount: number): void {
    if (!this.ctx) return;
    this.duck.gain.setTargetAtTime(1 - amount * 0.5, this.ctx.currentTime, 0.4);
  }

  /** Muffles the outdoors while you sleep. */
  setInside(on: boolean): void {
    if (!this.ctx) return;
    this.muffle.frequency.setTargetAtTime(on ? 700 : 20000, this.ctx.currentTime, 0.6);
  }
}

export const audio = new Engine();

if (typeof window !== 'undefined') {
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}
