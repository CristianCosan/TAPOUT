// The first-person world (D-030): where every station stands in its 3D area, in metres.
// x runs east, z runs south (towards you at the start), so the lake lies at negative z.
// The 2D layouts still say what each station offers; these numbers only place it in space.

import type { LocationId } from './layout.ts';

export interface WorldStation {
  /** Ground position, metres. */
  x: number;
  z: number;
  /** Facing, in degrees: 0 faces south (towards the start), 90 faces east. */
  face?: number;
  /** How close you can walk to its centre. */
  radius: number;
  /** Something you use from afar (birds out on the water): how far away it still answers a click. */
  reach?: number;
}

export interface WorldArea {
  id: LocationId;
  /** Where you stand on arrival, and the direction you look (degrees, 0 = north/lake). */
  spawn: { x: number; z: number; look: number };
  /** You can walk anywhere inside this circle. */
  walkRadius: number;
  /** The lake's near edge (z), if the lake is in view; open water beyond it. */
  shoreZ?: number;
  /**
   * A place that sits up above the water (rc.2, camp): the ground falls `drop` metres from
   * `fromZ` down to the shore, and the trees thin out in a window towards the lake.
   */
  perch?: { drop: number; fromZ: number; window: number; keep: number };
  /** Trees scattered around, outside the clearing. */
  trees: { count: number; clearing: number; outer: number; seed: number; birchShare: number };
  rocks: { count: number; seed: number };
  stations: Readonly<Record<string, WorldStation>>;
}

export const WORLD: Readonly<Record<LocationId, WorldArea>> = {
  camp: {
    id: 'camp',
    spawn: { x: 0, z: 5.5, look: 0 },
    walkRadius: 13,
    // Camp sits a little uphill in the timber, out of the wind and above any high water, with
    // the shore in sight below (Sir, rc.2).
    shoreZ: -34,
    perch: { drop: 10, fromZ: -12, window: 0.6, keep: 0.15 },
    trees: { count: 230, clearing: 14, outer: 55, seed: 11, birchShare: 0.15 },
    rocks: { count: 14, seed: 4 },
    stations: {
      fire: { x: 0, z: 0, radius: 1.1 },
      water: { x: -1.6, z: 1.3, radius: 0.4 },
      shelter: { x: -6.5, z: -3, face: 60, radius: 2.0 },
      pack: { x: -4.2, z: -0.6, face: 30, radius: 0.5 },
      rack: { x: 4, z: -2.5, face: -20, radius: 1.0 },
      cache: { x: 7.5, z: -5.5, face: -40, radius: 1.0 },
      post: { x: -3.8, z: 3.8, radius: 0.3 },
      camera: { x: -8.5, z: 5, face: 120, radius: 0.6 },
      comforts: { x: 3.4, z: 2.4, face: -60, radius: 1.0 },
      stump: { x: -2.4, z: 3.0, radius: 0.5 },
      woodpile: { x: 7.2, z: 1.2, face: -90, radius: 1.3 },
      fallen: { x: -10.6, z: 0.8, face: 80, radius: 1.6 },
      stones: { x: 10.6, z: -1.6, face: -80, radius: 1.0 },
      food: { x: 5.4, z: 4.6, face: -45, radius: 0.5 },
      stock: { x: 8.3, z: 4.6, face: -70, radius: 0.9 },
      killsite: { x: 1.5, z: 7.5, radius: 0.9 },
      raven: { x: 9, z: -8.5, radius: 0.5, reach: 10 },
      jay: { x: 5.5, z: -9, radius: 0.5 },
      toShore: { x: -9.5, z: -8.5, face: 45, radius: 0.3 },
      toWoods: { x: 11.5, z: 6, face: -90, radius: 0.3 },
    },
  },
  shore: {
    id: 'shore',
    spawn: { x: 0, z: 7, look: 0 },
    walkRadius: 14,
    shoreZ: -2,
    trees: { count: 110, clearing: 17, outer: 55, seed: 23, birchShare: 0.25 },
    rocks: { count: 26, seed: 9 },
    stations: {
      point: { x: -10, z: -2.5, radius: 0.6 },
      inlet: { x: -3.5, z: -2.5, radius: 0.6 },
      bar: { x: 3.5, z: -2.5, radius: 0.6 },
      channel: { x: 10, z: -2.5, radius: 0.6 },
      duck: { x: 0, z: -22, radius: 0, reach: 40 },
      icecache: { x: -6.5, z: -4.5, radius: 0.6 },
      net: { x: -8, z: 4, face: 60, radius: 1.0 },
      edge: { x: 0, z: -1.2, radius: 0.4 },
      rocks: { x: 7.5, z: 2.5, radius: 1.0 },
      clay: { x: -4.5, z: 3.5, radius: 0.9 },
      killsite: { x: 3, z: 8, radius: 0.9 },
      toCamp: { x: -10, z: 9, face: 135, radius: 0.3 },
      toWoods: { x: 11, z: 7.5, face: -120, radius: 0.3 },
    },
  },
  woods: {
    id: 'woods',
    spawn: { x: 0, z: 7, look: 0 },
    walkRadius: 13,
    trees: { count: 260, clearing: 12, outer: 50, seed: 37, birchShare: 0.12 },
    rocks: { count: 18, seed: 13 },
    stations: {
      ridge: { x: 7.5, z: -9, radius: 2.2 },
      timber: { x: -4, z: -6, radius: 1.2 },
      birch: { x: 1.5, z: -6.5, radius: 0.5 },
      animal: { x: 6, z: -4, face: 30, radius: 0.8 },
      trailhead: { x: 9.5, z: 3, face: -90, radius: 0.3 },
      deadfall: { x: -7, z: 1, face: 20, radius: 1.5 },
      moss: { x: 2.5, z: 1.5, radius: 1.0 },
      berries: { x: 6.5, z: 6, radius: 1.2 },
      tracks: { x: -2, z: 4, radius: 0 },
      killsite: { x: 2, z: 8.5, radius: 0.9 },
      toCamp: { x: -9, z: 8.5, face: 120, radius: 0.3 },
      toShore: { x: -10, z: -6, face: 60, radius: 0.3 },
    },
  },
};

/** Walking, looking and reach: feel, not rules. Walking inside an area costs no game time. */
export const FIRST_PERSON = {
  eyeHeight: 1.68,
  walkSpeed: 3.2,
  runSpeed: 5.6,
  /** How far away you can use a station you are looking at, metres. */
  reach: 4.2,
  lookSensitivity: 0.0022,
  fov: 70,
} as const;
