import { useEffect, useState } from 'react';
import { CREDITS_TEXT, PLAYTEST_TEXT, SETTINGS_TEXT, SOUND_SETTINGS, TEST_TEXT, THOUGHT_TEXT, TIPS_TEXT } from '@tapout/content';
import { audio, type Channel } from '../audio/engine.ts';
import { setSetting, useSettings } from '../settings.ts';
import { notesText } from '../notes.ts';
import { session } from '../session.ts';

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
        <h4>{T.game}</h4>
        <Toggle {...TIPS_TEXT.setting} on={s.tips} set={(on) => setSetting('tips', on)} />
        <Toggle {...THOUGHT_TEXT.subtitles} on={s.thoughtSubtitles} set={(on) => setSetting('thoughtSubtitles', on)} />
        <h4>{T.display}</h4>
        <Toggle {...T.fullscreen} on={full} set={(on) => {
          setFullscreen(on);
          window.setTimeout(() => setFull(isFullscreen()), 300);
        }} />
        <Toggle {...T.reduceFlashing} on={s.reduceFlashing} set={(on) => setSetting('reduceFlashing', on)} />
        <Toggle {...T.lowGraphics} on={s.lowGraphics} set={(on) => setSetting('lowGraphics', on)} />
        <PlaytestNotes />
        <TestMode />
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

/** Shortcuts for testing a run (rc.3). Each is a core function; the panel only presses it. */
function TestMode() {
  const X = TEST_TEXT;
  const [said, setSaid] = useState<string | null>(null);
  const [, redraw] = useState(0);
  const view = session.getView();
  if (!view) {
    return (
      <>
        <h4>{X.section}</h4>
        <div className="sound-row notes-row"><span className="sound-name"><em>{X.outside}</em></span></div>
      </>
    );
  }
  const press = (handler: string, after?: string) => {
    session.click(handler);
    setSaid(after ?? null);
    redraw((n) => n + 1);
  };
  return (
    <>
      <h4>{X.section}</h4>
      <div className="sound-row notes-row"><span className="sound-name"><em>{said ?? X.hint}</em></span></div>
      <Toggle {...X.infinite} on={!!view.state.testInfinite} set={(on) => press(`testSetInfinite(${on})`)} />
      <div className="test-btns">
        <button className="hud-btn" onClick={() => press('testMaterials()')}>{X.materials}</button>
        <button className="hud-btn" onClick={() => press('testRestore()')}>{X.restore}</button>
        <button className="hud-btn" onClick={() => press('testTrapsReady()')}>{X.traps}</button>
        <button className="hud-btn" onClick={() => press('testWinNext()', X.winDone)}>{X.win}</button>
      </div>
    </>
  );
}

/** The F8 notes: copy them all for a chat, or clear them. */
function PlaytestNotes() {
  const P = PLAYTEST_TEXT;
  const [count, setCount] = useState(() => session.notes().length);
  const [said, setSaid] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const copy = () => {
    const text = notesText(session.notes());
    navigator.clipboard.writeText(text).then(
      () => setSaid(P.copied),
      () => {
        setSaid(P.copyFailed);
        setShown(text);
      },
    );
  };
  const clear = () => {
    if (!confirm) return setConfirm(true);
    session.clearNotes();
    setCount(0);
    setConfirm(false);
    setShown(null);
    setSaid(null);
  };
  return (
    <>
      <h4>{P.section}</h4>
      <div className="sound-row notes-row">
        <span className="sound-name">
          <em>{said ?? P.sectionHint(count)}</em>
        </span>
        <button className="hud-btn" disabled={count === 0} onClick={copy}>
          {P.copy}
        </button>
        <button className="hud-btn" disabled={count === 0} onClick={clear}>
          {confirm ? P.clearConfirm : P.clear}
        </button>
      </div>
      {shown && <textarea className="notes-text" readOnly value={shown} onFocus={(e) => e.currentTarget.select()} />}
    </>
  );
}

export function CreditsPanel({ onClose }: { onClose: () => void }) {
  const C = CREDITS_TEXT;
  const [licences, setLicences] = useState<string | null>(null);
  const showLicences = () => {
    // Bundled, not fetched: the desktop build cannot fetch its own files.
    import('../legal/licences.txt?raw').then(
      (m: { default: string }) => setLicences(m.default),
      () => setLicences(C.licencesMissing),
    );
  };
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
        {licences === null ? (
          <button className="hud-btn" onClick={showLicences}>
            {C.licences}
          </button>
        ) : (
          <textarea className="notes-text licences-text" readOnly value={licences} />
        )}
        <button className="big-btn primary" onClick={onClose}>
          {C.close}
        </button>
      </div>
    </div>
  );
}
