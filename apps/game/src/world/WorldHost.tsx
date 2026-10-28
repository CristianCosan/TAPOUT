import { useEffect, useRef, useState } from 'react';
import { SLOW_TEXT } from '@tapout/content';
import { playUi } from '../audio/effects.ts';
import { noticeLook } from '../audio/thoughts.ts';
import { setSetting } from '../settings.ts';
import { session } from '../session.ts';
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
        perform: (fn: string) => void;
        screenOf: (id: string) => { x: number; y: number } | null;
        turn: (step: number) => void;
      }
    | undefined;
}

/**
 * Mounts one 3D world for the life of the game screen and feeds it the current input. The name
 * of what you point at, the arrows that change the shot and the hint are plain HTML over it.
 */
export function WorldHost({ input, events }: { input: WorldInput; events: Pick<WorldEvents, 'select' | 'clear'> }) {
  const parent = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [shot, setShot] = useState<{ index: number; count: number; label: string } | null>(null);
  const [slow, setSlow] = useState(false);
  const latest = useRef({ input, events });
  latest.current = { input, events };

  const fullEvents = useRef<WorldEvents>({
    select: (id) => latest.current.events.select(id),
    clear: () => latest.current.events.clear(),
    hover: (h) => {
      noticeLook(h?.near ? h.id : null);
      setHover((prev) => {
        if (h && h.near && (prev?.id !== h.id || !prev.near)) playUi('hover');
        return h;
      });
    },
    shot: (index, count, label) => setShot({ index, count, label }),
    slow: () => setSlow(true),
  });

  useEffect(() => {
    if (!parent.current) return;
    const w = new World(parent.current);
    w.configure(latest.current.input, fullEvents.current);
    world.current = w;
    globalThis.__tapoutWorld = { lookAt: (id) => w.lookAt(id), preview: (p) => (w.preview = p), birds: () => w.birds(), stand: (x, z, at) => w.stand(x, z, at), where: () => w.where(), perform: (fn) => w.perform(fn), screenOf: (id) => w.screenOf(id), turn: (step) => w.turn(step) };
    // Every action you take shows its motion: the axe swinging, hands reaching for stones.
    const off = session.onCall((fn) => w.perform(fn));
    return () => {
      off();
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
      {hover && !input.frozen && hover.id !== input.selected && (
        <div className="look-label" style={{ left: hover.x, top: hover.y + 34 }}>
          <b>{hover.label}</b>
          <span>Click to use</span>
        </div>
      )}
      {shot && shot.count > 1 && !input.frozen && (
        <>
          <button className="shot-arrow left" onClick={() => world.current?.turn(-1)} title="Look the other way (A or Left arrow)">
            ‹
          </button>
          <button className="shot-arrow right" onClick={() => world.current?.turn(1)} title="Look the other way (D or Right arrow)">
            ›
          </button>
          <div className="shot-name">
            <b>{shot.label}</b>
            <span className="shot-dots">
              {Array.from({ length: shot.count }, (_, i) => (
                <i key={i} className={i === shot.index ? 'on' : ''} />
              ))}
            </span>
          </div>
        </>
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
      {!hover && !input.frozen && !input.selected && (
        <div className="move-hint">Click what you see to use it · ‹ › or A D to look around · M for the map · R to rest · Tab for yourself</div>
      )}
    </div>
  );
}
