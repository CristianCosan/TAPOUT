import { describe, expect, it } from 'vitest';
import { WORLD } from './world.ts';

// Point and click (D-113): with no walking, every station must be in front of some shot.
describe('fixed shots', () => {
  for (const area of Object.values(WORLD)) {
    it(`${area.id}: every station is in view from at least one shot`, () => {
      const unseen = Object.entries(area.stations)
        .filter(([, st]) =>
          !area.shots.some((s) => {
            const lx = s.at.x - s.eye.x;
            const lz = s.at.z - s.eye.z;
            const tx = st.x - s.eye.x;
            const tz = st.z - s.eye.z;
            const cos = (lx * tx + lz * tz) / (Math.hypot(lx, lz) * Math.hypot(tx, tz));
            return cos > Math.cos(((s.fov ?? 60) * (16 / 9) * Math.PI) / 360);
          }),
        )
        .map(([id]) => id);
      expect(unseen).toEqual([]);
    });
  }
});
