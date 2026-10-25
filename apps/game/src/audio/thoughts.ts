// Plays Dan's recorded thoughts (D-067). They are files, not engine sounds, so they play through
// a plain audio element (which also works from the packaged app's local files); the rest of the
// sound dips under them. One thought at a time.

import { THOUGHT_TIMING } from '@tapout/content';
import { audio } from './engine.ts';

export interface Speaking {
  id: string;
  /** The words without the recording marks, for subtitles. */
  text: string;
}

let current: (Speaking & { el: HTMLAudioElement }) | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const f of listeners) f();
}

function volume(): number {
  return Math.min(1, audio.level('master') * audio.level('voice'));
}

audio.onVolume(() => {
  if (current) current.el.volume = volume();
});

export function plainWords(say: string): string {
  return say.replace(/~\s*/g, '').replace(/\s\/\/?\s/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Starts a thought; false if one is already playing or the voice is turned off. */
export function speak(id: string, say: string): boolean {
  return play([id], plainWords(say), 0, id);
}

/** Says the pieces one after another (a confessional to the camera), cutting off any thought. */
export function speakPieces(ids: readonly string[], text: string, gap: number): boolean {
  stopThought();
  return ids.length > 0 && play(ids, text, gap, ids.join('+'));
}

function play(ids: readonly string[], text: string, gap: number, key: string): boolean {
  if (current || audio.volume('voice') === 0) return false;
  const queue = [...ids];
  const el = new Audio();
  el.volume = volume();
  const me = { id: key, text, el };
  current = me;
  const end = () => {
    if (current !== me) return;
    current = null;
    audio.setSpeech(0);
    emit();
  };
  const next = () => {
    if (current !== me) return;
    const id = queue.shift();
    if (!id) return end();
    el.src = `${import.meta.env.BASE_URL}voice/${id}.ogg`;
    el.play().then(
      () => audio.setSpeech(THOUGHT_TIMING.duck),
      // Sound not allowed yet ends it; a missing piece is skipped by the error event below.
      (e: unknown) => (e as { name?: string })?.name === 'NotAllowedError' && end(),
    );
  };
  el.addEventListener('ended', () => (queue.length ? window.setTimeout(next, gap * 1000) : end()));
  el.addEventListener('error', () => next());
  next();
  emit();
  return true;
}

export function stopThought(): void {
  if (!current) return;
  current.el.pause();
  current = null;
  audio.setSpeech(0);
  emit();
}

export function speaking(): Speaking | null {
  return current ? { id: current.id, text: current.text } : null;
}

export function onSpeaking(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

// What you are looking at, from the 3D world, for the "looking at something" thoughts.
let lookingAt: string | null = null;
const lookListeners = new Set<(id: string | null) => void>();

export function noticeLook(id: string | null): void {
  if (id === lookingAt) return;
  lookingAt = id;
  for (const f of lookListeners) f(id);
}

export function onLook(f: (id: string | null) => void): () => void {
  lookListeners.add(f);
  return () => lookListeners.delete(f);
}
