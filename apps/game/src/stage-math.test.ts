import { describe, expect, it } from 'vitest';
import { fitStage } from './stage-math.ts';

describe('fitStage', () => {
  it('fills a 16:9 window exactly', () => {
    expect(fitStage(1280, 720)).toEqual({ scale: 2 / 3, offsetX: 0, offsetY: 0 });
  });

  it('letterboxes a 16:10 window top and bottom', () => {
    const fit = fitStage(1920, 1200);
    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe(60);
  });

  it('pillarboxes an ultrawide window left and right', () => {
    const fit = fitStage(3440, 1440);
    expect(fit.scale).toBeCloseTo(4 / 3);
    expect(fit.offsetY).toBe(0);
    expect(fit.offsetX).toBeCloseTo(440);
  });
});
