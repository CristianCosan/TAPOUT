import { useState } from 'react';
import { SOUND_SETTINGS } from '@tapout/content';
import { audio, type Channel } from '../audio/engine.ts';

/** Four volume sliders; changes apply at once and are remembered on this computer. */
export function SoundPanel({ onClose }: { onClose: () => void }) {
  const [, redraw] = useState(0);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sound-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{SOUND_SETTINGS.title}</h3>
        {SOUND_SETTINGS.channels.map((c) => {
          const ch = c.id as Channel;
          const v = Math.round(audio.volume(ch) * 100);
          return (
            <label key={c.id} className="sound-row">
              <span className="sound-name">
                <b>{c.label}</b>
                <em>{c.hint}</em>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={v}
                onChange={(e) => {
                  audio.setVolume(ch, Number(e.target.value) / 100);
                  redraw((n) => n + 1);
                }}
              />
              <span className="sound-val">{v}</span>
            </label>
          );
        })}
        <button className="big-btn primary" onClick={onClose}>
          {SOUND_SETTINGS.close}
        </button>
      </div>
    </div>
  );
}
