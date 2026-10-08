// The map overlay (plan §4.5): the lake, the three places you work, the four fishing spots and
// the five trapline spots. Coordinates are in a 1200x760 map panel; the map itself is drawn in
// code (D-015), so these numbers are the whole of its art direction.

import type { LocationId, Point } from './layout.ts';

export const MAP_SIZE = { width: 1200, height: 760 } as const;

/** The lake's outline, a rough polygon along the top and left of the map. */
export const MAP_LAKE: readonly Point[] = [
  { x: 0, y: 0 }, { x: 1200, y: 0 }, { x: 1200, y: 150 }, { x: 980, y: 190 }, { x: 760, y: 170 },
  { x: 560, y: 230 }, { x: 420, y: 330 }, { x: 300, y: 420 }, { x: 160, y: 470 }, { x: 0, y: 500 },
];

export const MAP_PLACES: Readonly<Record<LocationId, Point>> = {
  camp: { x: 360, y: 470 },
  shore: { x: 640, y: 330 },
  woods: { x: 700, y: 520 },
};

/** v12's four fishing spots, along the shore. Ids match its `SHORE_SPOTS`. */
export const MAP_SHORE_SPOTS: Readonly<Record<string, Point>> = {
  point: { x: 330, y: 380 },
  inlet: { x: 470, y: 250 },
  bar: { x: 720, y: 200 },
  channel: { x: 940, y: 210 },
};

/** v12's five trapline spots, out through the timber. Ids match its `WOODS_SPOTS`. */
export const MAP_WOODS_SPOTS: Readonly<Record<string, Point>> = {
  ridge: { x: 1010, y: 360 },
  creek: { x: 860, y: 450 },
  burn: { x: 1060, y: 560 },
  meadow: { x: 880, y: 650 },
  draw: { x: 640, y: 680 },
};

/** What the game trail station is called while you work a hunt, by v12's hunt state. */
export const HUNT_TRAIL_LABELS: Readonly<Record<string, string>> = {
  tracks: 'Fresh tracks',
  trailing: 'Following the trail',
  trailingWounded: 'Blood trail',
  hot: 'Fresh sign, close',
  spotted: 'Game trail',
};
