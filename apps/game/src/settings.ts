// The player's settings that are not sound volumes (those live in audio/engine.ts): mouse,
// movement feel, the radio, the window. Remembered on this computer; a missing or broken
// store just means the defaults.

import { useSyncExternalStore } from 'react';

export interface Settings {
  /** Multiplies the mouse look speed, 0.3 to 2. */
  mouseSpeed: number;
  invertY: boolean;
  headBob: boolean;
  rivalNews: boolean;
  tips: boolean;
  /** Lighter graphics for slower computers: lower resolution, smaller shadows, no fire shadows. */
  lowGraphics: boolean;
  /** Storm lightning flashes softly instead of lighting up the whole sky. */
  reduceFlashing: boolean;
  /** The running-slowly offer has been shown once. */
  slowAsked: boolean;
  /** Tips already shown. */
  tipsSeen: string[];
}

const KEY = 'tapout.settings';
const DEFAULTS: Settings = { mouseSpeed: 1, invertY: false, headBob: true, rivalNews: true, tips: true, lowGraphics: false, reduceFlashing: false, slowAsked: false, tipsSeen: [] };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    // Defaults.
  }
  return { ...DEFAULTS };
}

let current = load();
const listeners = new Set<() => void>();

export function settings(): Settings {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  current = { ...current, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Applies for this session only.
  }
  for (const f of listeners) f();
}

export function onSettings(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export function useSettings(): Settings {
  return useSyncExternalStore(onSettings, settings, settings);
}
