import { useEffect, useRef, useState } from 'react';
import { PLAYTEST_TEXT as T } from '@tapout/content';
import { session } from '../session.ts';

/** F8: a one-line playtest note, saved with where the run is. */
export function NoteBox() {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key !== 'F8') return;
      e.preventDefault();
      if (document.pointerLockElement) document.exitPointerLock();
      setOpen((o) => !o);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 2500);
    return () => window.clearTimeout(t);
  }, [flash]);

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') {
      const text = e.currentTarget.value;
      if (!text.trim()) return setOpen(false);
      setFlash(session.addNote(text) ? T.saved : T.failed);
      setOpen(false);
    }
  };

  if (!open) return flash ? <div className="note-flash">{flash}</div> : null;
  return (
    <div className="note-box" onClick={(e) => e.stopPropagation()}>
      <b>{T.boxTitle}</b>
      <input ref={input} type="text" maxLength={500} placeholder={T.placeholder} onKeyDown={keyDown} />
      <em>{T.hint}</em>
    </div>
  );
}
