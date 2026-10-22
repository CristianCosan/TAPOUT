import { useEffect, useState } from 'react';
import { CREDITS_TEXT, SETTINGS_TEXT, SOUND_SETTINGS, TIPS_TEXT } from '@tapout/content';
import { audio, type Channel } from '../audio/engine.ts';
import { setSetting, useSettings } from '../settings.ts';

type Desktop = { fullscreen?: (on?: boolean) => boolean };
const desktop = () => (window as { tapoutDesktop?: Desktop }).tapoutDesktop;

function isFullscreen(): boolean {
  const d = desktop();
  if (d?.fullscreen) return d.fullscreen(undefined);
  return !!document.fullscreenElement;
}

function setFullscreen(on: boolean): void {
  const d = desktop();
  if (d?.fullscreen) {
    d.fullscreen(on);
    return;
  }
  if (on) void document.documentElement.requestFullscreen?.().catch(() => undefined);
  else if (document.fullscreenElement) void document.exitFullscreen();
}

function Toggle({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (on: boolean) => void }) {
  return (
    <label className="sound-row toggle-row">
      <span className="sound-name">
        <b>{label}</b>
        <em>{hint}</em>
      </span>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
    </label>
  );
}

/** Sound, mouse, movement, the radio and the window. Changes apply at once and are remembered. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const [, redraw] = useState(0);
  const [full, setFull] = useState(isFullscreen);
  useEffect(() => {
    const f = () => setFull(isFullscreen());
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  const T = SETTINGS_TEXT;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sound-panel settings-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{T.title}</h3>
        <h4>{T.sound}</h4>
        {SOUND_SETTINGS.channels.map((c) => {
          const ch = c.id as Channel;
          const v = Math.round(audio.volume(ch) * 100);
          return (
            <label key={c.id} className="sound-row">
              <span className="sound-name">
                <b>{c.label}</b>
                <em>{c.hint}</em>
              </span>
              <input type="range" min={0} max={100} value={v} onChange={(e) => {
                audio.setVolume(ch, Number(e.target.value) / 100);
                redraw((n) => n + 1);
              }} />
              <span className="sound-val">{v}</span>
            </label>
          );
        })}
        <h4>{T.controls}</h4>
        <label className="sound-row">
          <span className="sound-name">
            <b>{T.sensitivity.label}</b>
            <em>{T.sensitivity.hint}</em>
          </span>
          <input type="range" min={30} max={200} value={Math.round(s.mouseSpeed * 100)} onChange={(e) => setSetting('mouseSpeed', Number(e.target.value) / 100)} />
          <span className="sound-val">{Math.round(s.mouseSpeed * 100)}</span>
        </label>
        <Toggle {...T.invertY} on={s.invertY} set={(on) => setSetting('invertY', on)} />
        <Toggle {...T.headBob} on={s.headBob} set={(on) => setSetting('headBob', on)} />
        <h4>{T.game}</h4>
        <Toggle {...T.rivalNews} on={s.rivalNews} set={(on) => setSetting('rivalNews', on)} />
        <Toggle {...TIPS_TEXT.setting} on={s.tips} set={(on) => setSetting('tips', on)} />
        <h4>{T.display}</h4>
        <Toggle {...T.fullscreen} on={full} set={(on) => {
          setFullscreen(on);
          window.setTimeout(() => setFull(isFullscreen()), 300);
        }} />
        <h4>{T.keys}</h4>
        <div className="key-list">
          {T.keyList.map(([k, what]) => (
            <div key={k} className="key-row">
              <kbd>{k}</kbd>
              <span>{what}</span>
            </div>
          ))}
        </div>
        <button className="big-btn primary" onClick={onClose}>
          {T.close}
        </button>
      </div>
    </div>
  );
}

export function CreditsPanel({ onClose }: { onClose: () => void }) {
  const C = CREDITS_TEXT;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sound-panel settings-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{C.title}</h3>
        {C.lines.map((l) => (
          <p key={l} className="credits-line">{l}</p>
        ))}
        <div className="key-list">
          {C.libraries.map(([name, what, licence]) => (
            <div key={name} className="key-row">
              <kbd>{name}</kbd>
              <span>
                {what} · {licence}
              </span>
            </div>
          ))}
        </div>
        <p className="credits-line">{C.people}</p>
        <button className="big-btn primary" onClick={onClose}>
          {C.close}
        </button>
      </div>
    </div>
  );
}
