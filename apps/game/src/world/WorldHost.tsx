import { useEffect, useRef, useState } from 'react';
import { World, type Hover, type WorldEvents, type WorldInput } from './World.ts';

declare global {
  // Lets the robot player and tests aim at a station without a mouse.
  var __tapoutWorld: { lookAt: (id: string) => boolean; preview: (p: { hour?: number; weather?: string }) => void } | undefined;
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
  const latest = useRef({ input, events });
  latest.current = { input, events };

  const fullEvents = useRef<WorldEvents>({
    select: (id) => latest.current.events.select(id),
    clear: () => latest.current.events.clear(),
    hover: setHover,
    looking: setLooking,
  });

  useEffect(() => {
    if (!parent.current) return;
    const w = new World(parent.current);
    w.configure(latest.current.input, fullEvents.current);
    world.current = w;
    globalThis.__tapoutWorld = { lookAt: (id) => w.lookAt(id), preview: (p) => (w.preview = p) };
    return () => {
      globalThis.__tapoutWorld = undefined;
      w.dispose();
      world.current = null;
    };
  }, []);

  useEffect(() => {
    world.current?.configure(input, fullEvents.current);
  }, [input]);

  return (
    <div className="world" ref={parent}>
      {looking && !input.frozen && <div className={`crosshair${hover?.near ? ' on' : ''}`} />}
      {hover && !input.frozen && hover.id !== input.selected && (
        <div className={`look-label${hover.near ? '' : ' far'}`} style={{ left: hover.x, top: hover.y + 34 }}>
          <b>{hover.label}</b>
          <span>{hover.near ? 'Click to use' : 'Walk closer'}</span>
        </div>
      )}
      {!looking && !input.frozen && !input.selected && (
        <div className="move-hint">Click anywhere to look around · W A S D to walk · Shift to run · Esc frees the mouse · Tab for yourself</div>
      )}
    </div>
  );
}
