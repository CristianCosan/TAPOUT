import { useEffect, useRef, useState } from 'react';
import { SLOW_TEXT } from '@tapout/content';
import { playUi } from '../audio/effects.ts';
import { setSetting } from '../settings.ts';
import { World, type Hover, type WorldEvents, type WorldInput } from './World.ts';

declare global {
  // Lets the robot player and tests aim at a station without a mouse.
  var __tapoutWorld:
    | {
        lookAt: (id: string) => boolean;
        preview: (p: { hour?: number; weather?: string; tempC?: number; aurora?: boolean; day?: number }) => void;
        birds: () => { kind: string; at: { x: number; y: number; z: number }; visible: boolean }[];
        stand: (x: number, z: number, at: { x: number; y: number; z: number }) => void;
        where: () => { x: number; z: number; prints: number; calls: number; triangles: number; rings: number; shoreZ?: number };
      }
    | undefined;
}

/**
 * Mounts one 3D world for the life of the game screen and feeds it the current input. The
 * crosshair, the name of what you look at and the how-to-move hint are plain HTML over it.
 */
export function WorldHost({ input, events }: { input: WorldInput; events: Pick<WorldEvents, 'select' | 'clear'> }) {
  const parent = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [looking, setLooking] = useState(false);
  const [slow, setSlow] = useState(false);
  const latest = useRef({ input, events });
  latest.current = { input, events };

  const fullEvents = useRef<WorldEvents>({
    select: (id) => latest.current.events.select(id),
    clear: () => latest.current.events.clear(),
    hover: (h) => {
      setHover((prev) => {
        if (h && h.near && (prev?.id !== h.id || !prev.near)) playUi('hover');
        return h;
      });
    },
    looking: setLooking,
    slow: () => setSlow(true),
  });

  useEffect(() => {
    if (!parent.current) return;
    const w = new World(parent.current);
    w.configure(latest.current.input, fullEvents.current);
    world.current = w;
    globalThis.__tapoutWorld = { lookAt: (id) => w.lookAt(id), preview: (p) => (w.preview = p), birds: () => w.birds(), stand: (x, z, at) => w.stand(x, z, at), where: () => w.where() };
    return () => {
      globalThis.__tapoutWorld = undefined;
      w.dispose();
      world.current = null;
    };
  }, []);

  useEffect(() => {
    world.current?.configure(input, fullEvents.current);
  }, [input]);

  const answerSlow = (lighter: boolean) => {
    setSetting('slowAsked', true);
    if (lighter) setSetting('lowGraphics', true);
    setSlow(false);
  };

  return (
    <div className="world" ref={parent}>
      {looking && !input.frozen && <div className={`crosshair${hover?.near ? ' on' : ''}`} />}
      {hover && !input.frozen && hover.id !== input.selected && (
        <div className={`look-label${hover.near ? '' : ' far'}`} style={{ left: hover.x, top: hover.y + 34 }}>
          <b>{hover.label}</b>
          <span>{hover.near ? 'Click to use' : 'Walk closer'}</span>
        </div>
      )}
      {slow && (
        <div className="tip-card slow-card">
          <b>{SLOW_TEXT.title}</b>
          <p>{SLOW_TEXT.text}</p>
          <div className="slow-btns">
            <button className="hud-btn" onClick={() => answerSlow(true)}>{SLOW_TEXT.yes}</button>
            <button className="hud-btn" onClick={() => answerSlow(false)}>{SLOW_TEXT.no}</button>
          </div>
        </div>
      )}
      {!looking && !input.frozen && !input.selected && (
        <div className="move-hint">Click anywhere to look around · W A S D to walk · Shift to run · Esc frees the mouse · Tab for yourself</div>
      )}
    </div>
  );
}
