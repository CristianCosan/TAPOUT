import { useSyncExternalStore } from 'react';
import { onSpeaking, speaking } from '../audio/thoughts.ts';
import { useSettings } from '../settings.ts';

let last: ReturnType<typeof speaking> = null;
function snapshot() {
  const now = speaking();
  if (now?.id !== last?.id) last = now;
  return last;
}

/** The words of Dan's thought while he speaks, if subtitles are on (D-067). */
export function ThoughtSubtitle() {
  const s = useSettings();
  const now = useSyncExternalStore(onSpeaking, snapshot, snapshot);
  if (!s.thoughtSubtitles || !now) return null;
  return <div className="thought-sub" key={now.id}>{now.text}</div>;
}
