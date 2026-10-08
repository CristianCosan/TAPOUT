import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { STAGE } from '@tapout/content';
import { LocationScene, type SceneEvents, type SceneInput } from './LocationScene.ts';

/**
 * Mounts one Phaser game for the life of the game screen and feeds it the current scene input.
 * The stage is already scaled by CSS; Phaser renders at the fixed 1920x1080 and is told to
 * re-measure when the window changes so pointer coordinates stay right.
 */
export function TableauHost({ input, events }: { input: SceneInput; events: SceneEvents }) {
  const parent = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const latest = useRef({ input, events });
  latest.current = { input, events };

  useEffect(() => {
    if (!parent.current) return;
    const scene = new LocationScene();
    const instance = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parent.current,
      width: STAGE.width,
      height: STAGE.height,
      backgroundColor: '#14161a',
      banner: false,
      scale: { mode: Phaser.Scale.NONE },
      scene,
    });
    instance.events.once(Phaser.Core.Events.READY, () => scene.configure(latest.current.input, latest.current.events));
    game.current = instance;
    const onResize = () => instance.scale.refresh();
    window.addEventListener('resize', onResize);
    const settle = window.setTimeout(onResize, 50);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', onResize);
      instance.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = game.current?.scene.getScene('location') as LocationScene | undefined;
    scene?.configure(input, events);
  }, [input, events]);

  return <div className="tableau" ref={parent} />;
}
