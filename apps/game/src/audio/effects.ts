// Action sounds (plan §7.4), made in code: what you hear when you do something. Each v12 handler
// maps to a short recipe of knocks, rustles, splashes and tones on the Effects bus. Purely
// presentation: nothing here reads or changes the run.

import { burst, rnd, strip, tone } from './voice.ts';

type Recipe = (out: AudioNode) => void;

const chop: Recipe = (out) => {
  for (let i = 0; i < 4; i++) {
    const at = i * 0.48 + rnd(0, 0.05);
    tone(out, { at, len: 0.12, freqs: [[0, 150], [0.1, 70]], peak: 0.5 });
    burst(out, { at, len: 0.07, peak: 0.35, freq: 1300 + rnd(0, 500), q: 1.5 });
  }
  burst(out, { at: 2.0, len: 0.35, peak: 0.25, freq: 300, type: 'lowpass', brown: true });
};

const gather: Recipe = (out) => {
  for (let i = 0; i < 6; i++) burst(out, { at: i * 0.22 + rnd(0, 0.08), len: 0.14, peak: 0.12, freq: 2800 + rnd(0, 1500), q: 0.7, attack: 0.02 });
};

const snaps: Recipe = (out) => {
  gather(out);
  for (let i = 0; i < 3; i++) burst(out, { at: 0.3 + i * 0.45, len: 0.04, peak: 0.4, freq: 2400, type: 'highpass' });
};

const fire: Recipe = (out) => {
  for (let i = 0; i < 3; i++) burst(out, { at: i * 0.3, len: 0.05, peak: 0.35, freq: 5500, type: 'highpass' });
  burst(out, { at: 0.95, len: 1.1, peak: 0.3, freq: 200, to: 1400, type: 'lowpass', brown: true, attack: 0.25 });
};

const friction: Recipe = (out) => {
  for (let i = 0; i < 10; i++) burst(out, { at: i * 0.16, len: 0.14, peak: 0.12, freq: 900 + (i % 2) * 250, q: 2 });
  burst(out, { at: 1.8, len: 1.0, peak: 0.25, freq: 200, to: 1200, type: 'lowpass', brown: true, attack: 0.3 });
};

const pour: Recipe = (out) => {
  burst(out, { len: 0.9, peak: 0.5, freq: 700, to: 1500, q: 2, attack: 0.08 });
  for (let i = 0; i < 6; i++) tone(out, { at: 0.1 + i * 0.12, len: 0.06, freqs: [[0, rnd(500, 900)], [0.06, rnd(900, 1300)]], peak: 0.04 });
};

const boil: Recipe = (out) => {
  pour(out);
  for (let i = 0; i < 14; i++) tone(out, { at: 1 + i * rnd(0.07, 0.14), len: 0.05, freqs: [[0, rnd(250, 500)], [0.05, rnd(500, 800)]], peak: 0.05 });
};

const splash: Recipe = (out) => {
  tone(out, { len: 0.14, freqs: [[0, 700], [0.14, 220]], peak: 0.18 });
  burst(out, { len: 0.5, peak: 0.25, freq: 1200, to: 500, q: 0.8 });
};

const fishing: Recipe = (out) => {
  // A reel ticking out, then the plop.
  for (let i = 0; i < 8; i++) burst(out, { at: i * 0.05, len: 0.02, peak: 0.12, freq: 4200, q: 4 });
  setTimeout(() => splash(out), 550);
};

const knock = (out: AudioNode, at: number, f = 230) => {
  tone(out, { at, len: 0.1, freqs: [[0, f], [0.1, f * 0.5]], peak: 0.35 });
  burst(out, { at, len: 0.05, peak: 0.2, freq: 2200, q: 1.5 });
};

const build: Recipe = (out) => {
  for (let i = 0; i < 5; i++) knock(out, i * 0.36 + rnd(0, 0.05), 200 + rnd(0, 60));
  burst(out, { at: 2.0, len: 0.6, peak: 0.12, freq: 420, to: 260, q: 6 });
  gather(out);
};

const dig: Recipe = (out) => {
  for (let i = 0; i < 3; i++) burst(out, { at: i * 0.55, len: 0.3, peak: 0.3, freq: 500, q: 0.9, attack: 0.03 });
};

const rocks: Recipe = (out) => {
  for (let i = 0; i < 4; i++) {
    const at = i * 0.4 + rnd(0, 0.1);
    tone(out, { at, len: 0.06, freqs: [[0, 1900 + rnd(0, 600)], [0.06, 1500]], peak: 0.12 });
    burst(out, { at, len: 0.06, peak: 0.25, freq: 2600, q: 2 });
  }
};

const snare: Recipe = (out) => {
  gather(out);
  for (let i = 0; i < 3; i++) burst(out, { at: 0.4 + i * 0.3, len: 0.18, peak: 0.1, freq: 3600, to: 2000, q: 3 });
};

const bow: Recipe = (out) => {
  burst(out, { len: 0.5, peak: 0.08, freq: 1600, to: 2400, q: 6, attack: 0.4 });
  tone(out, { at: 0.55, type: 'triangle', len: 0.35, freqs: [[0, 190], [0.35, 140]], peak: 0.35 });
  burst(out, { at: 0.56, len: 0.35, peak: 0.18, freq: 2000, to: 600, q: 1 });
};

const moose: Recipe = (out) => {
  tone(out, { type: 'sawtooth', len: 1.4, freqs: [[0, 210], [0.4, 240], [1.4, 150]], peak: 0.3, band: 600, attack: 0.15, vibrato: [7, 6] });
};

const knife: Recipe = (out) => {
  for (let i = 0; i < 5; i++) burst(out, { at: i * 0.32, len: 0.22, peak: 0.14, freq: 3500, to: 5200, q: 3, attack: 0.04 });
};

const sizzle: Recipe = (out) => {
  burst(out, { len: 2.2, peak: 0.12, freq: 5000, type: 'highpass', attack: 0.2 });
  for (let i = 0; i < 8; i++) burst(out, { at: i * 0.25, len: 0.03, peak: 0.2, freq: 3000 });
};

const whetstone: Recipe = (out) => {
  for (let i = 0; i < 4; i++) burst(out, { at: i * 0.42, len: 0.32, peak: 0.16, freq: 4800, to: 3600, q: 5, attack: 0.08 });
};

const eat: Recipe = (out) => {
  for (let i = 0; i < 5; i++) burst(out, { at: i * 0.28 + rnd(0, 0.06), len: 0.1, peak: 0.6, freq: 450, type: 'lowpass' });
};

const flute: Recipe = (out) => {
  // A few notes on a five-note scale, breathy.
  const scale = [587, 659, 784, 880, 988, 1175];
  let at = 0;
  for (let i = 0; i < 6; i++) {
    const f = scale[Math.floor(Math.random() * scale.length)]!;
    const len = rnd(0.35, 0.7);
    tone(out, { at, len, freqs: [[0, f], [len, f]], peak: 0.12, attack: 0.08, vibrato: [5, 4] });
    burst(out, { at, len, peak: 0.02, freq: f * 2, q: 8, attack: 0.08 });
    at += len + 0.05;
  }
};

const camera: Recipe = (out) => {
  tone(out, { len: 0.08, freqs: [[0, 1320], [0.08, 1320]], peak: 0.08 });
  burst(out, { at: 0.12, len: 0.05, peak: 0.1, freq: 3000 });
};

const drop: Recipe = (out) => {
  for (let i = 0; i < 4; i++) tone(out, { at: i * 0.18, len: 0.16, freqs: [[0, 120 + rnd(0, 40)], [0.16, 60]], peak: 0.45 });
};

const steps: Recipe = (out) => {
  for (let i = 0; i < 6; i++) burst(out, { at: i * 0.32, len: 0.12, peak: 0.14, freq: 300, type: 'lowpass' });
};

/** v12 handler name → what it sounds like. Anything not listed is silent. */
const RECIPES: Record<string, Recipe> = {
  actWood: chop, actWoodCamp: chop, actHaftAxe: knife, actFirewood: snaps, actTinder: gather, actMoss: gather, actForage: gather, actBerryPicker: build,
  actFire: fire, actFireNoFerro: friction, actFrictionFire: friction,
  actBoil: boil, actFetchWater: pour, actStream: pour, actDrink: pour, actJug: dig, actWash: pour,
  placeLineAt: fishing, checkOneLine: splash, moveLine: fishing, iceFishAt: fishing, actIceFish: rocks, actCheckShore: splash, placeNetAt: fishing, checkNet: splash,
  actShelter: build, actDugout: dig, actInsulate: gather, actFirepit: rocks, actRack: build, actHugeRack: build, actCache: build, actIceCache: rocks,
  actChair: build, actTable: build, actBed: gather, actPatchRoof: build, actRepairBoots: knife,
  actClay: dig, actRocks: rocks,
  actCampSnares: snare, placeSnareAt: snare, moveSnare: snare, actCheckTraps: snare, checkOneSnare: snare,
  actShot: bow, actCall: moose, actCarve: knife, actHaul: drop, actFollow: steps, actTrail: steps, actScout: steps, actInvestigate: steps, exploreNewGrounds: steps,
  actCookMeal: sizzle, actSmoke: sizzle, actSmokeHuge: sizzle,
  actSharpenAxe: whetstone, actMaintainFerro: whetstone, actTreeMark: knife, actPoultice: knife,
  eatCooked: eat, eatSmoked: eat, eatBerries: eat, eatRation: eat, eatSpoiledAnyway: eat, actFeedJay: gather,
  actFlute: flute, actMusic: flute, actConfess: camera, actDropOff: drop,
};

/** Plays the sound for one v12 call, if it has one. */
export function playAction(fn: string): void {
  const recipe = RECIPES[fn];
  if (!recipe) return;
  const out = strip('effects', 0.8);
  if (out) recipe(out);
}

export const ACTION_SOUNDS: ReadonlySet<string> = new Set(Object.keys(RECIPES));

export type UiSound = 'hover' | 'open' | 'close' | 'card' | 'page';

/** Very quiet interface sounds (plan §7.4 UI): a tick when something lights, a soft open and close. */
export function playUi(kind: UiSound): void {
  const out = strip('effects', 0.35);
  if (!out) return;
  switch (kind) {
    case 'hover': tone(out, { len: 0.04, freqs: [[0, 1800], [0.04, 1700]], peak: 0.05 }); break;
    case 'open': burst(out, { len: 0.12, peak: 0.12, freq: 1800, to: 3200, q: 2, attack: 0.02 }); break;
    case 'close': burst(out, { len: 0.1, peak: 0.1, freq: 2800, to: 1500, q: 2, attack: 0.02 }); break;
    case 'card': tone(out, { len: 0.5, freqs: [[0, 440], [0.5, 440]], peak: 0.06, attack: 0.05 }); tone(out, { at: 0.08, len: 0.5, freqs: [[0, 660], [0.5, 660]], peak: 0.04, attack: 0.05 }); break;
    case 'page': burst(out, { len: 0.18, peak: 0.12, freq: 3500, to: 2000, q: 0.8, attack: 0.03 }); break;
  }
}

/** rc.6: going through the ice (a crack like a shot, then the plunge) or off a wet rock (a scrape, then the plunge). */
export function playFall(kind: 'ice' | 'rocks'): void {
  const out = strip('effects', 0.9);
  if (!out) return;
  if (kind === 'ice') {
    burst(out, { len: 0.08, peak: 0.6, freq: 3200, to: 900, q: 1.2 });
    tone(out, { at: 0.02, len: 0.5, freqs: [[0, 180], [0.5, 60]], peak: 0.25 });
  } else {
    burst(out, { len: 0.25, peak: 0.3, freq: 2200, to: 800, q: 2, attack: 0.02 });
  }
  burst(out, { at: 0.35, len: 1.4, peak: 0.55, freq: 900, to: 300, q: 0.7, attack: 0.04 });
  tone(out, { at: 0.35, len: 0.3, freqs: [[0, 500], [0.3, 140]], peak: 0.2 });
}
