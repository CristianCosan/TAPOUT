// The game is authored for one virtual 1920x1080 stage. Any window size shows
// the whole stage, uniformly scaled and centred, with black bars on the
// leftover axis. Nothing in the UI reflows.

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export interface StageFit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function fitStage(viewportWidth: number, viewportHeight: number): StageFit {
  const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
  return {
    scale,
    offsetX: (viewportWidth - STAGE_WIDTH * scale) / 2,
    offsetY: (viewportHeight - STAGE_HEIGHT * scale) / 2,
  };
}
