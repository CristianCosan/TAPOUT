import { useEffect, useState, type ReactNode } from 'react';
import { fitStage, STAGE_HEIGHT, STAGE_WIDTH } from './stage-math.ts';

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function Stage({ children }: { children: ReactNode }) {
  const { w, h } = useViewport();
  const fit = fitStage(w, h);
  return (
    <div className="letterbox">
      <div
        className="stage"
        data-testid="stage"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
